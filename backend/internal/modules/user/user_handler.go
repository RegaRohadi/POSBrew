package user

import (
	"errors"
	"log"
	"net/http"

	"POSBrew/internal/common/httputil"
	"POSBrew/internal/common/response"
	"POSBrew/internal/middleware"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterAdminRoutes(rg *gin.RouterGroup) {
	users := rg.Group("/users")
	{
		users.GET("", h.List)
		users.GET("/:id", h.GetByID)
		users.POST("", h.Create)
		users.PUT("/:id", h.Update)
		users.DELETE("/:id", h.Deactivate)
	}

	rg.GET("/roles", h.Roles)
}

func (h *Handler) List(c *gin.Context) {
	users, err := h.service.List()
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "users retrieved successfully", users)
}

func (h *Handler) GetByID(c *gin.Context) {
	id, ok := httputil.ParseID(c, "user")
	if !ok {
		return
	}

	user, err := h.service.GetByID(id)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "user retrieved successfully", user)
}

func (h *Handler) Create(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	user, err := h.service.Create(req)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusCreated, "user created successfully", user)
}

func (h *Handler) Update(c *gin.Context) {
	id, ok := httputil.ParseID(c, "user")
	if !ok {
		return
	}

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	user, err := h.service.Update(id, req)
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "user updated successfully", user)
}

func (h *Handler) Deactivate(c *gin.Context) {
	id, ok := httputil.ParseID(c, "user")
	if !ok {
		return
	}

	if id == middleware.UserID(c) {
		response.Error(c, http.StatusBadRequest, "cannot deactivate your own account")
		return
	}

	if err := h.service.Deactivate(id); err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "user deactivated successfully", nil)
}

func (h *Handler) Roles(c *gin.Context) {
	roles, err := h.service.Roles()
	if err != nil {
		handleError(c, err)
		return
	}

	response.Success(c, http.StatusOK, "roles retrieved successfully", roles)
}

func handleError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, ErrUserNotFound):
		response.Error(c, http.StatusNotFound, err.Error())
	case errors.Is(err, ErrEmailExists):
		response.Error(c, http.StatusConflict, err.Error())
	case errors.Is(err, ErrRoleNotFound):
		response.Error(c, http.StatusBadRequest, err.Error())
	default:
		log.Printf("user handler error: %v", err)
		response.Error(c, http.StatusInternalServerError, "internal server error")
	}
}
