package router

import (
	"net/http"
	"time"

	"POSBrew/internal/auth"
	"POSBrew/internal/config"
	"POSBrew/internal/middleware"
	authmodule "POSBrew/internal/modules/auth"
	"POSBrew/internal/modules/category"
	"POSBrew/internal/modules/ingredient"
	"POSBrew/internal/modules/product"
	"POSBrew/internal/modules/recipe"
	"POSBrew/internal/modules/report"
	"POSBrew/internal/modules/stock"
	"POSBrew/internal/modules/transaction"
	"POSBrew/internal/modules/unit"
	"POSBrew/internal/modules/user"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupRouter(db *gorm.DB, cfg *config.Config) *gin.Engine {
	r := gin.Default()

	api := r.Group("/api/v1")
	{
		api.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"message": "POSBrew API is running",
			})
		})
	}

	tokens := auth.NewTokenService(
		cfg.JWTSecret,
		time.Duration(cfg.JWTExpireHours)*time.Hour,
	)

	// Repositories
	userRepo := user.NewRepository(db)
	categoryRepo := category.NewRepository(db)
	productRepo := product.NewRepository(db)
	unitRepo := unit.NewRepository(db)
	ingredientRepo := ingredient.NewRepository(db)
	recipeRepo := recipe.NewRepository(db)
	transactionRepo := transaction.NewRepository(db)
	reportRepo := report.NewRepository(db)

	// Services
	authService := authmodule.NewService(userRepo, tokens)
	userService := user.NewService(userRepo)
	categoryService := category.NewService(categoryRepo)
	productService := product.NewService(productRepo, categoryRepo)
	unitService := unit.NewService(unitRepo)
	ingredientService := ingredient.NewService(ingredientRepo, unitRepo)
	stockService := stock.NewService(db)
	recipeService := recipe.NewService(recipeRepo, productRepo, ingredientRepo)
	transactionService := transaction.NewService(db, transactionRepo, productRepo, recipeRepo)
	reportService := report.NewService(reportRepo)

	// Handlers
	authHandler := authmodule.NewHandler(authService)
	userHandler := user.NewHandler(userService)
	categoryHandler := category.NewHandler(categoryService)
	productHandler := product.NewHandler(productService)
	unitHandler := unit.NewHandler(unitService)
	ingredientHandler := ingredient.NewHandler(ingredientService)
	stockHandler := stock.NewHandler(stockService)
	recipeHandler := recipe.NewHandler(recipeService)
	transactionHandler := transaction.NewHandler(transactionService)
	reportHandler := report.NewHandler(reportService)

	// Public routes
	authHandler.RegisterPublicRoutes(api)

	// Authenticated routes
	protected := api.Group("")
	protected.Use(middleware.Authenticate(tokens))
	{
		authHandler.RegisterProtectedRoutes(protected)

		categoryHandler.RegisterReadRoutes(protected)
		productHandler.RegisterReadRoutes(protected)
		unitHandler.RegisterReadRoutes(protected)
		ingredientHandler.RegisterReadRoutes(protected)
		recipeHandler.RegisterReadRoutes(protected)
		stockHandler.RegisterReadRoutes(protected)

		transactionHandler.RegisterReadRoutes(protected)
		transactionHandler.RegisterProtectedRoutes(protected)
	}

	// Admin only routes
	admin := protected.Group("")
	admin.Use(middleware.RequireRole("admin"))
	{
		userHandler.RegisterAdminRoutes(admin)

		categoryHandler.RegisterAdminRoutes(admin)
		productHandler.RegisterAdminRoutes(admin)
		unitHandler.RegisterAdminRoutes(admin)
		ingredientHandler.RegisterAdminRoutes(admin)
		recipeHandler.RegisterAdminRoutes(admin)
		stockHandler.RegisterAdminRoutes(admin)

		transactionHandler.RegisterAdminRoutes(admin)
		reportHandler.RegisterAdminRoutes(admin)
	}

	return r
}
