package unit

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
	units := rg.Group("/units")
	{
		units.GET("", h.GetAll)
		units.GET("/:id", h.GetByID)
	}
}

func (h *Handler) RegisterAdminRoutes(rg *gin.RouterGroup) {
	units := rg.Group("/units")
	{
		units.POST("", h.Create)
		units.PUT("/:id", h.Update)
		units.DELETE("/:id", h.Delete)
	}
}

func (h *Handler) GetAll(c *gin.Context) {
	units, err := h.service.GetAll()
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "units retrieved successfully", units)
}

func (h *Handler) GetByID(c *gin.Context) {
	id, ok := httputil.ParseID(c, "unit")
	if !ok {
		return
	}

	unit, err := h.service.GetByID(id)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "unit retrieved successfully", unit)
}

func (h *Handler) Create(c *gin.Context) {
	var req CreateUnitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	unit, err := h.service.Create(req)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusCreated, "unit created successfully", unit)
}

func (h *Handler) Update(c *gin.Context) {
	id, ok := httputil.ParseID(c, "unit")
	if !ok {
		return
	}

	var req UpdateUnitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	unit, err := h.service.Update(id, req)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "unit updated successfully", unit)
}

func (h *Handler) Delete(c *gin.Context) {
	id, ok := httputil.ParseID(c, "unit")
	if !ok {
		return
	}

	if err := h.service.Delete(id); err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "unit deleted successfully", nil)
}

func handleError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, ErrUnitNotFound):
		response.Error(c, http.StatusNotFound, err.Error())
	case errors.Is(err, ErrUnitExists):
		response.Error(c, http.StatusConflict, err.Error())
	case errors.Is(err, ErrUnitInUse):
		response.Error(c, http.StatusConflict, err.Error())
	default:
		log.Printf("unit handler error: %v", err)
		response.Error(c, http.StatusInternalServerError, "internal server error")
	}
}
