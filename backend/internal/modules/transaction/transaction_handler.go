package transaction

import (
	"errors"
	"log"
	"net/http"

	"POSBrew/internal/common/httputil"
	"POSBrew/internal/common/response"
	"POSBrew/internal/middleware"
	"POSBrew/internal/modules/ingredient"
	"POSBrew/internal/modules/product"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterReadRoutes(rg *gin.RouterGroup) {
	transactions := rg.Group("/transactions")
	{
		transactions.GET("", h.GetAll)
		transactions.GET("/:id", h.GetByID)
	}
}

func (h *Handler) RegisterProtectedRoutes(rg *gin.RouterGroup) {
	rg.POST("/transactions", h.Create)
}

func (h *Handler) RegisterAdminRoutes(rg *gin.RouterGroup) {
	rg.DELETE("/transactions/:id", h.Cancel)
}

func (h *Handler) GetAll(c *gin.Context) {
	var query ListTransactionsQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	transactions, err := h.service.GetAll(query)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "transactions retrieved successfully", transactions)
}

func (h *Handler) GetByID(c *gin.Context) {
	id, ok := httputil.ParseID(c, "transaction")
	if !ok {
		return
	}

	transaction, err := h.service.GetByID(id)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "transaction retrieved successfully", transaction)
}

func (h *Handler) Create(c *gin.Context) {
	var req CreateTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	transaction, err := h.service.Create(req, middleware.UserID(c))
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusCreated, "transaction created successfully", transaction)
}

func (h *Handler) Cancel(c *gin.Context) {
	id, ok := httputil.ParseID(c, "transaction")
	if !ok {
		return
	}

	transaction, err := h.service.Cancel(id)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "transaction cancelled successfully", transaction)
}

func handleError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, ErrTransactionNotFound):
		response.Error(c, http.StatusNotFound, err.Error())
	case errors.Is(err, ErrTransactionAlreadyCancelled):
		response.Error(c, http.StatusConflict, err.Error())
	case errors.Is(err, ErrEmptyItems),
		errors.Is(err, ErrInvalidQuantity),
		errors.Is(err, ErrInvalidDiscount),
		errors.Is(err, ErrInvalidStatus),
		errors.Is(err, ErrInvalidDate):
		response.Error(c, http.StatusBadRequest, err.Error())
	case errors.Is(err, ErrInsufficientPayment),
		errors.Is(err, ErrInsufficientStock),
		errors.Is(err, ErrProductUnavailable):
		response.Error(c, http.StatusUnprocessableEntity, err.Error())
	case errors.Is(err, product.ErrProductNotFound):
		response.Error(c, http.StatusBadRequest, "product not found")
	case errors.Is(err, ingredient.ErrIngredientNotFound):
		response.Error(c, http.StatusUnprocessableEntity, "ingredient in recipe not found")
	default:
		log.Printf("transaction handler error: %v", err)
		response.Error(c, http.StatusInternalServerError, "internal server error")
	}
}
