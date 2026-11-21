package category

import "time"

type CreateCategoryRequest struct {
	Name        string  `json:"name" binding:"required,max=100"`
	Description *string `json:"description" binding:"omitempty,max=1000"`
}

type UpdateCategoryRequest struct {
	Name        string  `json:"name" binding:"required,max=100"`
	Description *string `json:"description" binding:"omitempty,max=1000"`
}

type CategoryResponse struct {
	ID          uint      `json:"id"`
	Name        string    `json:"name"`
	Description *string   `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func toResponse(category *Category) CategoryResponse {
	return CategoryResponse{
		ID:          category.ID,
		Name:        category.Name,
		Description: category.Description,
		CreatedAt:   category.CreatedAt,
		UpdatedAt:   category.UpdatedAt,
	}
}
