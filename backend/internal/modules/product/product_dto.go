package product

import (
	"time"

	"POSBrew/internal/common/pagination"
)

type CreateProductRequest struct {
	CategoryID  *uint   `json:"category_id"`
	Name        string  `json:"name" binding:"required,max=150"`
	Description *string `json:"description" binding:"omitempty,max=2000"`
	Price       int64   `json:"price" binding:"gte=0"`
	ImageURL    *string `json:"image_url" binding:"omitempty,max=500"`
	IsAvailable *bool   `json:"is_available"`
}

type UpdateProductRequest struct {
	CategoryID  *uint   `json:"category_id"`
	Name        string  `json:"name" binding:"required,max=150"`
	Description *string `json:"description" binding:"omitempty,max=2000"`
	Price       int64   `json:"price" binding:"gte=0"`
	ImageURL    *string `json:"image_url" binding:"omitempty,max=500"`
	IsAvailable *bool   `json:"is_available"`
}

type ListProductsQuery struct {
	Page        int    `form:"page"`
	Limit       int    `form:"limit"`
	Search      string `form:"search"`
	CategoryID  *uint  `form:"category_id"`
	IsAvailable *bool  `form:"is_available"`
}

type CategorySummary struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}

type ProductResponse struct {
	ID          uint             `json:"id"`
	CategoryID  *uint            `json:"category_id"`
	Category    *CategorySummary `json:"category,omitempty"`
	Name        string           `json:"name"`
	Description *string          `json:"description"`
	Price       int64            `json:"price"`
	ImageURL    *string          `json:"image_url"`
	IsAvailable bool             `json:"is_available"`
	CreatedAt   time.Time        `json:"created_at"`
	UpdatedAt   time.Time        `json:"updated_at"`
}

type ProductListResponse struct {
	Items      []ProductResponse `json:"items"`
	Pagination pagination.Meta   `json:"pagination"`
}

func toResponse(product *Product) ProductResponse {
	res := ProductResponse{
		ID:          product.ID,
		CategoryID:  product.CategoryID,
		Name:        product.Name,
		Description: product.Description,
		Price:       product.Price,
		ImageURL:    product.ImageURL,
		IsAvailable: product.IsAvailable,
		CreatedAt:   product.CreatedAt,
		UpdatedAt:   product.UpdatedAt,
	}

	if product.Category != nil {
		res.Category = &CategorySummary{
			ID:   product.Category.ID,
			Name: product.Category.Name,
		}
	}

	return res
}
