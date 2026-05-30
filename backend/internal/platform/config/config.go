package config

import (
	"fmt"
	"os"
)

type Config struct {
	DBHost                string
	DBPort                string
	DBUser                string
	DBPassword            string
	DBName                string
	UserServicePort       string
	MembershipServicePort string
}

func Load() Config {
	return Config{
		DBHost:                envOrDefault("POSTGRES_HOST", "localhost"),
		DBPort:                envOrDefault("POSTGRES_PORT", "5432"),
		DBUser:                envOrDefault("POSTGRES_USER", "postgres"),
		DBPassword:            envOrDefault("POSTGRES_PASSWORD", "postgres"),
		DBName:                envOrDefault("POSTGRES_DB", "gym"),
		UserServicePort:       envOrDefault("USER_SERVICE_PORT", "8081"),
		MembershipServicePort: envOrDefault("MEMBERSHIP_SERVICE_PORT", "8082"),
	}
}

func (c Config) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		c.DBHost,
		c.DBPort,
		c.DBUser,
		c.DBPassword,
		c.DBName,
	)
}

func envOrDefault(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
