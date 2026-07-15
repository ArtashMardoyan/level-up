package config

import (
	"errors"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DB     DBConfig
	JWT    JWTConfig
	Server ServerConfig
}

type DBConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	SSLMode  string
}

func (c *DBConfig) DSN() string {
	return fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=%s",
		c.User, c.Password, c.Host, c.Port, c.Name, c.SSLMode,
	)
}

type JWTConfig struct {
	Secret string
}

type ServerConfig struct {
	Addr string
}

func Load() (Config, error) {
	if err := godotenv.Load(); err != nil {
		log.Println("no .env file, reading from environment")
	}

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return Config{}, errors.New("JWT_SECRET is not set")
	}

	sslMode := os.Getenv("DB_SSLMODE")
	if sslMode == "" {
		sslMode = "disable"
	}

	return Config{
		DB: DBConfig{
			Host:     os.Getenv("DB_HOST"),
			Port:     os.Getenv("DB_PORT"),
			User:     os.Getenv("DB_USER"),
			Password: os.Getenv("DB_PASSWORD"),
			Name:     os.Getenv("DB_NAME"),
			SSLMode:  sslMode,
		},
		JWT:    JWTConfig{Secret: secret},
		Server: ServerConfig{Addr: ":3000"},
	}, nil
}
