package config

import (
	"errors"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	DB     DBConfig
	JWT    JWTConfig
	CORS   CORSConfig
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

type CORSConfig struct {
	Origins []string
}

type ServerConfig struct {
	Addr string
}

// defaultCORSOrigins are the frontends allowed to call the API when CORS_ORIGINS
// is not set: local Vite dev/preview and the GitHub Pages deployment.
var defaultCORSOrigins = []string{
	"http://localhost:5173",
	"http://localhost:4173",
	"https://artashmardoyan.github.io",
}

func corsOrigins() []string {
	raw := os.Getenv("CORS_ORIGINS")
	if raw == "" {
		return defaultCORSOrigins
	}

	var origins []string
	for _, o := range strings.Split(raw, ",") {
		if trimmed := strings.TrimSpace(o); trimmed != "" {
			origins = append(origins, trimmed)
		}
	}

	return origins
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

	addr := os.Getenv("SERVER_ADDR")
	if addr == "" {
		addr = ":3000"
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
		CORS:   CORSConfig{Origins: corsOrigins()},
		Server: ServerConfig{Addr: addr},
	}, nil
}
