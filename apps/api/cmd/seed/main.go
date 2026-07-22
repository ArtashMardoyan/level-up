package main

import (
	"log"
	"os"

	"level-up-backend/internal/config"
	"level-up-backend/internal/infrastructure/database"
	"level-up-backend/internal/seed"
)

// Usage: go run ./cmd/seed [course-slug ...]
// With no args, seeds every course. With slugs (e.g. "backend"), seeds only
// those — much faster than a full reseed when only one course's content or
// audio keys changed.
func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	db, err := database.Connect(&cfg.DB)
	if err != nil {
		log.Fatal("failed to connect to database: ", err)
	}

	if err := seed.Run(db, os.Args[1:]...); err != nil {
		log.Fatal("seed failed: ", err)
	}

	log.Println("seed completed")
}
