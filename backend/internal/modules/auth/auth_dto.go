package auth

import "POSBrew/internal/modules/user"

type RegisterRequest struct {
	Name     string `json:"name" binding:"required,max=100"`
	Email    string `json:"email" binding:"required,email,max=150"`
	Password string `json:"password" binding:"required,min=6,max=72"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email,max=150"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	Token string            `json:"token"`
	User  user.UserResponse `json:"user"`
}
