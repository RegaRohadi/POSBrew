package recipe

import (
	"errors"
	"log"
	"net/http"

	"POSBrew/internal/common/httputil"
	"POSBrew/internal/common/response"
	"POSBrew/internal/modules/ingredient"
	"POSBrew/internal/modules/product"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterReadRoutes(rg *gin.RouterGroup) {
	recipes := rg.Group("/recipes")
	{
		recipes.GET("", h.GetByProductID)
		recipes.GET("/:id", h.GetByID)
	}
}

func (h *Handler) RegisterAdminRoutes(rg *gin.RouterGroup) {
	recipes := rg.Group("/recipes")
	{
		recipes.POST("", h.Create)
		recipes.PUT("/:id", h.Update)
		recipes.DELETE("/:id", h.Delete)
	}
}

func (h *Handler) GetByProductID(c *gin.Context) {
	var query ListRecipesQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	if query.ProductID == 0 {
		response.Error(c, http.StatusBadRequest, ErrProductIDRequired.Error())
		return
	}

	recipes, err := h.service.GetByProductID(query.ProductID)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "recipes retrieved successfully", recipes)
}

func (h *Handler) GetByID(c *gin.Context) {
	id, ok := httputil.ParseID(c, "recipe")
	if !ok {
		return
	}

	recipe, err := h.service.GetByID(id)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "recipe retrieved successfully", recipe)
}

func (h *Handler) Create(c *gin.Context) {
	var req CreateRecipeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	recipe, err := h.service.Create(req)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusCreated, "recipe created successfully", recipe)
}

func (h *Handler) Update(c *gin.Context) {
	id, ok := httputil.ParseID(c, "recipe")
	if !ok {
		return
	}

	var req UpdateRecipeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	recipe, err := h.service.Update(id, req)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "recipe updated successfully", recipe)
}

func (h *Handler) Delete(c *gin.Context) {
	id, ok := httputil.ParseID(c, "recipe")
	if !ok {
		return
	}

	if err := h.service.Delete(id); err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "recipe deleted successfully", nil)
}

func handleError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, ErrRecipeNotFound):
		response.Error(c, http.StatusNotFound, err.Error())
	case errors.Is(err, ErrRecipeExists):
		response.Error(c, http.StatusConflict, err.Error())
	case errors.Is(err, ErrInvalidQuantity):
		response.Error(c, http.StatusBadRequest, err.Error())
	case errors.Is(err, ErrProductIDRequired):
		response.Error(c, http.StatusBadRequest, err.Error())
	case errors.Is(err, product.ErrProductNotFound):
		response.Error(c, http.StatusBadRequest, "product not found")
	case errors.Is(err, ingredient.ErrIngredientNotFound):
		response.Error(c, http.StatusBadRequest, "ingredient not found")
	default:
		log.Printf("recipe handler error: %v", err)
		response.Error(c, http.StatusInternalServerError, "internal server error")
	}
}
