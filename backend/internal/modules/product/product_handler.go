package product

import (
	"errors"
	"log"
	"net/http"

	"POSBrew/internal/common/httputil"
	"POSBrew/internal/common/response"
	"POSBrew/internal/modules/category"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterReadRoutes(rg *gin.RouterGroup) {
	products := rg.Group("/products")
	{
		products.GET("", h.GetAll)
		products.GET("/:id", h.GetByID)
	}
}

func (h *Handler) RegisterAdminRoutes(rg *gin.RouterGroup) {
	products := rg.Group("/products")
	{
		products.POST("", h.Create)
		products.PUT("/:id", h.Update)
		products.DELETE("/:id", h.Delete)
	}
}

func (h *Handler) GetAll(c *gin.Context) {
	var query ListProductsQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	products, err := h.service.GetAll(query)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "products retrieved successfully", products)
}

func (h *Handler) GetByID(c *gin.Context) {
	id, ok := httputil.ParseID(c, "product")
	if !ok {
		return
	}

	product, err := h.service.GetByID(id)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "product retrieved successfully", product)
}

func (h *Handler) Create(c *gin.Context) {
	var req CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	product, err := h.service.Create(req)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusCreated, "product created successfully", product)
}

func (h *Handler) Update(c *gin.Context) {
	id, ok := httputil.ParseID(c, "product")
	if !ok {
		return
	}

	var req UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	product, err := h.service.Update(id, req)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "product updated successfully", product)
}

func (h *Handler) Delete(c *gin.Context) {
	id, ok := httputil.ParseID(c, "product")
	if !ok {
		return
	}

	if err := h.service.Delete(id); err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "product deleted successfully", nil)
}

func handleError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, ErrProductNotFound):
		response.Error(c, http.StatusNotFound, err.Error())
	case errors.Is(err, ErrProductInUse):
		response.Error(c, http.StatusConflict, err.Error())
	case errors.Is(err, category.ErrCategoryNotFound):
		response.Error(c, http.StatusBadRequest, "category not found")
	default:
		log.Printf("product handler error: %v", err)
		response.Error(c, http.StatusInternalServerError, "internal server error")
	}
}
