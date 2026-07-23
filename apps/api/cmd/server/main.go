package main

import (
	"database/sql"
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
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	sqlDB, err := sql.Open("pgx", cfg.DB.DSN())
	if err != nil {
		log.Fatal("failed to open database: ", err)
	}

	if err := goose.Up(sqlDB, "migrations"); err != nil {
		log.Fatal("failed to run migrations: ", err)
	}

	db, err := database.Connect(&cfg.DB)
	if err != nil {
		log.Fatal("failed to connect to database: ", err)
	}

	// Optional automatic seed sync on boot. Off by default; enable per environment
	// with SEED_ON_START=true (e.g. in App Runner) so deploys keep course content in
	// sync. The seed is idempotent and only writes rows whose content changed.
	if os.Getenv("SEED_ON_START") == "true" {
		if err := seed.Run(db); err != nil {
			log.Fatal("failed to run seed on start: ", err)
		}
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
