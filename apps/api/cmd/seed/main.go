package main

import (
	"log"

	"level-up-backend/internal/config"
	"level-up-backend/internal/infrastructure/database"
	"level-up-backend/internal/seed"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	db, err := database.Connect(&cfg.DB)
	if err != nil {
		log.Fatal("failed to connect to database: ", err)
	}

	if err := seed.Run(db); err != nil {
		log.Fatal("seed failed: ", err)
	}

	log.Println("seed completed")
}
