package stock

import (
	"errors"
	"log"
	"net/http"

	"POSBrew/internal/common/response"
	"POSBrew/internal/modules/ingredient"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterReadRoutes(rg *gin.RouterGroup) {
	rg.GET("/stock-movements", h.GetAll)
}

func (h *Handler) RegisterAdminRoutes(rg *gin.RouterGroup) {
	rg.POST("/stock-movements", h.Create)
}

func (h *Handler) GetAll(c *gin.Context) {
	var query ListMovementsQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	movements, err := h.service.GetAll(query)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "stock movements retrieved successfully", movements)
}

func (h *Handler) Create(c *gin.Context) {
	var req CreateMovementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	result, err := h.service.Create(req)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusCreated, "stock movement created successfully", result)
}

func handleError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, ErrInvalidMovementType),
		errors.Is(err, ErrInvalidQuantity),
		errors.Is(err, ErrInvalidTargetStock):
		response.Error(c, http.StatusBadRequest, err.Error())
	case errors.Is(err, ErrInsufficientStock):
		response.Error(c, http.StatusUnprocessableEntity, err.Error())
	case errors.Is(err, ingredient.ErrIngredientNotFound):
		response.Error(c, http.StatusBadRequest, "ingredient not found")
	default:
		log.Printf("stock handler error: %v", err)
		response.Error(c, http.StatusInternalServerError, "internal server error")
	}
}
