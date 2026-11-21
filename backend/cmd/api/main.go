package main

import (
	"log"

	"POSBrew/internal/config"
	"POSBrew/internal/database"
	"POSBrew/internal/router"
)

func main() {
	// Load application configuration
	cfg := config.Load()

	// Connect to database
	db := database.Connect(cfg)

	// Initialize router
	r := router.SetupRouter(db, cfg)

	// Start HTTP server
	log.Printf("%s is running on port %s", cfg.AppName, cfg.AppPort)

	err := r.Run(":" + cfg.AppPort)
	if err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
