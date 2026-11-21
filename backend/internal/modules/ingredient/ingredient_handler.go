package ingredient

import (
	"errors"
	"log"
	"net/http"

	"POSBrew/internal/common/httputil"
	"POSBrew/internal/common/response"
	"POSBrew/internal/modules/unit"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterReadRoutes(rg *gin.RouterGroup) {
	ingredients := rg.Group("/ingredients")
	{
		ingredients.GET("", h.GetAll)
		ingredients.GET("/:id", h.GetByID)
	}
}

func (h *Handler) RegisterAdminRoutes(rg *gin.RouterGroup) {
	ingredients := rg.Group("/ingredients")
	{
		ingredients.POST("", h.Create)
		ingredients.PUT("/:id", h.Update)
		ingredients.DELETE("/:id", h.Delete)
	}
}

func (h *Handler) GetAll(c *gin.Context) {
	var query ListIngredientsQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	ingredients, err := h.service.GetAll(query)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "ingredients retrieved successfully", ingredients)
}

func (h *Handler) GetByID(c *gin.Context) {
	id, ok := httputil.ParseID(c, "ingredient")
	if !ok {
		return
	}

	ingredient, err := h.service.GetByID(id)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "ingredient retrieved successfully", ingredient)
}

func (h *Handler) Create(c *gin.Context) {
	var req CreateIngredientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	ingredient, err := h.service.Create(req)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusCreated, "ingredient created successfully", ingredient)
}

func (h *Handler) Update(c *gin.Context) {
	id, ok := httputil.ParseID(c, "ingredient")
	if !ok {
		return
	}

	var req UpdateIngredientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	ingredient, err := h.service.Update(id, req)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "ingredient updated successfully", ingredient)
}

func (h *Handler) Delete(c *gin.Context) {
	id, ok := httputil.ParseID(c, "ingredient")
	if !ok {
		return
	}

	if err := h.service.Delete(id); err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "ingredient deleted successfully", nil)
}

func handleError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, ErrIngredientNotFound):
		response.Error(c, http.StatusNotFound, err.Error())
	case errors.Is(err, ErrIngredientNameExists):
		response.Error(c, http.StatusConflict, err.Error())
	case errors.Is(err, ErrIngredientInUse):
		response.Error(c, http.StatusConflict, err.Error())
	case errors.Is(err, ErrInvalidMinimumStock):
		response.Error(c, http.StatusBadRequest, err.Error())
	case errors.Is(err, unit.ErrUnitNotFound):
		response.Error(c, http.StatusBadRequest, "unit not found")
	default:
		log.Printf("ingredient handler error: %v", err)
		response.Error(c, http.StatusInternalServerError, "internal server error")
	}
}
