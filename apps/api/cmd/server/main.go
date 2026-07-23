package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
	_ "time/tzdata" // embed the tz database so time.LoadLocation works in the container

	"level-up-backend/internal/config"
	"level-up-backend/internal/infrastructure/database"
	"level-up-backend/internal/infrastructure/middleware"
	"level-up-backend/internal/modules/auth"
	"level-up-backend/internal/modules/badge"
	"level-up-backend/internal/modules/course"
	"level-up-backend/internal/modules/health"
	"level-up-backend/internal/modules/interview"
	"level-up-backend/internal/modules/notification"
	"level-up-backend/internal/modules/user"
	"level-up-backend/internal/seed"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
	"gorm.io/gorm"
)

// migrationLockKey is an arbitrary, fixed 64-bit key shared by every instance so
// they contend on the same Postgres advisory lock for migrations.
const migrationLockKey int64 = 4927210398765

// withMigrationLock runs fn while holding a Postgres session-level advisory lock,
// so at most one process migrates at a time. The lock lives on its own connection
// and is released when fn returns or the session ends (e.g. the process crashes),
// so a dead instance can never wedge migrations.
func withMigrationLock(db *sql.DB, fn func() error) error {
	ctx := context.Background()

	conn, err := db.Conn(ctx)
	if err != nil {
		return fmt.Errorf("open lock connection: %w", err)
	}
	defer func() { _ = conn.Close() }()

	if _, err := conn.ExecContext(ctx, "SELECT pg_advisory_lock($1)", migrationLockKey); err != nil {
		return fmt.Errorf("acquire advisory lock: %w", err)
	}
	defer func() {
		_, _ = conn.ExecContext(ctx, "SELECT pg_advisory_unlock($1)", migrationLockKey)
	}()

	return fn()
}

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	sqlDB, err := sql.Open("pgx", cfg.DB.DSN())
	if err != nil {
		log.Fatal("failed to open database: ", err)
	}

	// Serialize migrations across instances. When App Runner starts several
	// instances of a new revision at once, each runs this on boot; a Postgres
	// session-level advisory lock ensures only one migrates at a time while the
	// others block, then find nothing pending and continue. Fully backward
	// compatible — no schema or migration-file changes.
	if err := withMigrationLock(sqlDB, func() error {
		return goose.Up(sqlDB, "migrations")
	}); err != nil {
		log.Fatal("failed to run migrations: ", err)
	}

	db, err := database.Connect(&cfg.DB)
	if err != nil {
		log.Fatal("failed to connect to database: ", err)
	}

	// Optional automatic seed sync on boot. Off by default; enable per environment
	// with SEED_ON_START=true (e.g. in App Runner) so deploys keep course content in
	// sync. The seed is idempotent and hash-gated: unchanged courses are skipped with
	// no writes, so a no-change deploy does almost no work.
	//
	// Defined failure behavior: after a few retries (to ride out transient DB blips) a
	// seed error is fatal. Content sync is part of the deploy, so if it truly fails the
	// instance exits, its health check never passes, and App Runner keeps the previous
	// healthy version rather than shipping a half-synced deploy.
	if os.Getenv("SEED_ON_START") == "true" {
		if err := seedWithRetry(db, 3); err != nil {
			log.Fatal("seed on start failed (deploy aborted, previous version kept): ", err)
		}

		log.Println("seed on start: completed")
	}

	userRepo := user.NewRepository(db)
	revokedRepo := auth.NewRevokedTokenRepository(db)
	courseRepo := course.NewCourseRepository(db)
	progressRepo := course.NewProgressRepository(db)
	notificationRepo := notification.NewRepository(db)
	interviewRepo := interview.NewRepository(db)
	badgeRepo := badge.NewRepository(db)

	notificationService := notification.NewService(notificationRepo)
	badgeService := badge.NewService(badgeRepo, notificationService)
	userService := user.NewService(userRepo, notificationService, badgeService)
	interviewAI := interview.NewAI(cfg.OpenAI.APIKey, cfg.OpenAI.Model, cfg.OpenAI.Timeout)
	interviewService := interview.NewService(interviewRepo, courseRepo, interviewAI, badgeService)

	userHandler := user.NewHandler(userService)
	authHandler := auth.NewHandler(auth.NewService(userRepo, revokedRepo, cfg.JWT.Secret))
	healthHandler := health.NewHandler(db)
	courseHandler := course.NewHandler(course.NewService(courseRepo, progressRepo, badgeService, userService))
	notificationHandler := notification.NewHandler(notificationService)
	interviewHandler := interview.NewHandler(interviewService)
	badgeHandler := badge.NewHandler(badgeService)

	jwtMiddleware := middleware.JWT(userRepo, revokedRepo, cfg.JWT.Secret)

	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.CORS.Origins,
		AllowMethods:     []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		AllowWildcard:    true, // lets patterns like https://*.vercel.app match preview deploys
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))
	r.Use(func(c *gin.Context) {
		// 1 MB is plenty for JSON APIs, but voice-answer audio uploads need much
		// more — cap those at Whisper's own 25 MB file limit instead.
		limit := int64(1 << 20)
		if c.Request.URL.Path == "/interviews/transcribe" {
			limit = 25 << 20
		}
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, limit)
		c.Next()
	})

	healthHandler.RegisterRoutes(r)
	authHandler.RegisterRoutes(r, jwtMiddleware)
	userHandler.RegisterRoutes(r, jwtMiddleware)
	courseHandler.RegisterRoutes(r, jwtMiddleware)
	notificationHandler.RegisterRoutes(r, jwtMiddleware)
	interviewHandler.RegisterRoutes(r, jwtMiddleware)
	badgeHandler.RegisterRoutes(r, jwtMiddleware)

	log.Fatal(r.Run(cfg.Server.Addr))
}

// seedWithRetry runs the boot-time seed, retrying a few times with a short backoff
// so a transient DB hiccup doesn't fail an otherwise-fine deploy. It returns the
// last error only after every attempt is exhausted.
func seedWithRetry(db *gorm.DB, attempts int) error {
	var err error

	for attempt := 1; attempt <= attempts; attempt++ {
		if err = seed.Run(db, seed.Options{}); err == nil {
			return nil
		}

		if attempt < attempts {
			log.Printf("seed on start: attempt %d/%d failed, retrying: %v", attempt, attempts, err)
			time.Sleep(time.Duration(attempt) * 2 * time.Second)
		}
	}

	return err
}
