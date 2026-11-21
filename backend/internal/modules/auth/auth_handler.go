package auth

import (
	"errors"
	"log"
	"net/http"

	"POSBrew/internal/common/response"
	"POSBrew/internal/middleware"
	"POSBrew/internal/modules/user"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterPublicRoutes(rg *gin.RouterGroup) {
	rg.POST("/auth/register", h.Register)
	rg.POST("/auth/login", h.Login)
}

func (h *Handler) RegisterProtectedRoutes(rg *gin.RouterGroup) {
	rg.GET("/auth/me", h.Me)
}

func (h *Handler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	result, err := h.service.Register(req)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusCreated, "user registered successfully", result)
}

func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	result, err := h.service.Login(req)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "login successful", result)
}

func (h *Handler) Me(c *gin.Context) {
	result, err := h.service.Me(middleware.UserID(c))
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "profile retrieved successfully", result)
}

func handleError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, user.ErrInvalidCredentials):
		response.Error(c, http.StatusUnauthorized, err.Error())
	case errors.Is(err, user.ErrUserInactive):
		response.Error(c, http.StatusForbidden, err.Error())
	case errors.Is(err, user.ErrEmailExists):
		response.Error(c, http.StatusConflict, err.Error())
	case errors.Is(err, user.ErrUserNotFound):
		response.Error(c, http.StatusNotFound, err.Error())
	case errors.Is(err, user.ErrRoleNotFound):
		log.Printf("auth role configuration error: %v", err)
		response.Error(c, http.StatusInternalServerError, "role configuration is missing")
	default:
		log.Printf("auth handler error: %v", err)
		response.Error(c, http.StatusInternalServerError, "internal server error")
	}
}
