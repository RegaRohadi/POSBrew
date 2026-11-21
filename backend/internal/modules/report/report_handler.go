package report

import (
	"errors"
	"log"
	"net/http"

	"POSBrew/internal/common/response"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterAdminRoutes(rg *gin.RouterGroup) {
	reports := rg.Group("/reports")
	{
		reports.GET("/summary", h.Summary)
		reports.GET("/sales", h.DailySales)
		reports.GET("/top-products", h.TopProducts)
		reports.GET("/low-stock", h.LowStock)
	}
}

func (h *Handler) Summary(c *gin.Context) {
	result, err := h.service.Summary()
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "summary retrieved successfully", result)
}

func (h *Handler) DailySales(c *gin.Context) {
	var query DateRangeQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	result, err := h.service.DailySales(query.From, query.To)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "sales report retrieved successfully", result)
}

func (h *Handler) TopProducts(c *gin.Context) {
	var query TopProductsQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	result, err := h.service.TopProducts(query.From, query.To, query.Limit)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "top products retrieved successfully", result)
}

func (h *Handler) LowStock(c *gin.Context) {
	result, err := h.service.LowStock()
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "low stock ingredients retrieved successfully", result)
}

func handleError(c *gin.Context, err error) {
	if errors.Is(err, ErrInvalidDateRange) {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	log.Printf("report handler error: %v", err)
	response.Error(c, http.StatusInternalServerError, "internal server error")
}
