package main

import (
	"flag"
	"log"

	"level-up-backend/internal/config"
	"level-up-backend/internal/infrastructure/database"
	"level-up-backend/internal/seed"
)

// Usage: go run ./cmd/seed [--force] [course-slug ...]
// With no slugs, considers every course; with slugs (e.g. "backend"), only those.
// Unchanged courses are skipped via the content-hash gate — pass --force to
// re-seed regardless (e.g. after the DB was partially wiped).
func main() {
	force := flag.Bool("force", false, "re-seed even when a course's content is unchanged")
	flag.Parse()

	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	db, err := database.Connect(&cfg.DB)
	if err != nil {
		log.Fatal("failed to connect to database: ", err)
	}

	if err := seed.Run(db, seed.Options{Slugs: flag.Args(), Force: *force}); err != nil {
		log.Fatal("seed failed: ", err)
	}

	log.Println("seed completed")
}
