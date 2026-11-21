package user

import "time"

type CreateUserRequest struct {
	RoleID   uint   `json:"role_id" binding:"required"`
	Name     string `json:"name" binding:"required,max=100"`
	Email    string `json:"email" binding:"required,email,max=150"`
	Password string `json:"password" binding:"required,min=6,max=72"`
}

type UpdateUserRequest struct {
	RoleID   uint    `json:"role_id" binding:"required"`
	Name     string  `json:"name" binding:"required,max=100"`
	Email    string  `json:"email" binding:"required,email,max=150"`
	Password *string `json:"password" binding:"omitempty,min=6,max=72"`
	IsActive *bool   `json:"is_active"`
}

type UserResponse struct {
	ID        uint          `json:"id"`
	RoleID    uint          `json:"role_id"`
	Role      *RoleResponse `json:"role,omitempty"`
	Name      string        `json:"name"`
	Email     string        `json:"email"`
	IsActive  bool          `json:"is_active"`
	CreatedAt time.Time     `json:"created_at"`
	UpdatedAt time.Time     `json:"updated_at"`
}

type RoleResponse struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}

func ToUserResponse(u *User) UserResponse {
	res := UserResponse{
		ID:        u.ID,
		RoleID:    u.RoleID,
		Name:      u.Name,
		Email:     u.Email,
		IsActive:  u.IsActive,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}

	if u.Role != nil {
		res.Role = toRoleResponse(u.Role)
	}

	return res
}

func toRoleResponse(role *Role) *RoleResponse {
	return &RoleResponse{
		ID:   role.ID,
		Name: role.Name,
	}
}
