package category

import (
	"errors"
	"log"
	"net/http"

	"POSBrew/internal/common/httputil"
	"POSBrew/internal/common/response"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterReadRoutes(rg *gin.RouterGroup) {
	categories := rg.Group("/categories")
	{
		categories.GET("", h.GetAll)
		categories.GET("/:id", h.GetByID)
	}
}

func (h *Handler) RegisterAdminRoutes(rg *gin.RouterGroup) {
	categories := rg.Group("/categories")
	{
		categories.POST("", h.Create)
		categories.PUT("/:id", h.Update)
		categories.DELETE("/:id", h.Delete)
	}
}

func (h *Handler) GetAll(c *gin.Context) {
	categories, err := h.service.GetAll()
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "categories retrieved successfully", categories)
}

func (h *Handler) GetByID(c *gin.Context) {
	id, ok := httputil.ParseID(c, "category")
	if !ok {
		return
	}

	category, err := h.service.GetByID(id)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "category retrieved successfully", category)
}

func (h *Handler) Create(c *gin.Context) {
	var req CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	category, err := h.service.Create(req)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusCreated, "category created successfully", category)
}

func (h *Handler) Update(c *gin.Context) {
	id, ok := httputil.ParseID(c, "category")
	if !ok {
		return
	}

	var req UpdateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	category, err := h.service.Update(id, req)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "category updated successfully", category)
}

func (h *Handler) Delete(c *gin.Context) {
	id, ok := httputil.ParseID(c, "category")
	if !ok {
		return
	}

	if err := h.service.Delete(id); err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "category deleted successfully", nil)
}

func handleError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, ErrCategoryNotFound):
		response.Error(c, http.StatusNotFound, err.Error())
	case errors.Is(err, ErrCategoryNameExists):
		response.Error(c, http.StatusConflict, err.Error())
	case errors.Is(err, ErrCategoryInUse):
		response.Error(c, http.StatusConflict, err.Error())
	default:
		log.Printf("category handler error: %v", err)
		response.Error(c, http.StatusInternalServerError, "internal server error")
	}
}
