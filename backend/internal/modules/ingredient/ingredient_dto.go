package ingredient

import (
	"time"

	"POSBrew/internal/common/pagination"

	"github.com/shopspring/decimal"
)

type CreateIngredientRequest struct {
	UnitID       uint            `json:"unit_id" binding:"required"`
	Name         string          `json:"name" binding:"required,max=150"`
	MinimumStock decimal.Decimal `json:"minimum_stock"`
}

type UpdateIngredientRequest struct {
	UnitID       uint            `json:"unit_id" binding:"required"`
	Name         string          `json:"name" binding:"required,max=150"`
	MinimumStock decimal.Decimal `json:"minimum_stock"`
	IsActive     *bool           `json:"is_active"`
}

type ListIngredientsQuery struct {
	Page     int    `form:"page"`
	Limit    int    `form:"limit"`
	Search   string `form:"search"`
	IsActive *bool  `form:"is_active"`
	LowStock bool   `form:"low_stock"`
}

type UnitSummary struct {
	ID           uint   `json:"id"`
	Name         string `json:"name"`
	Abbreviation string `json:"abbreviation"`
}

type IngredientResponse struct {
	ID           uint            `json:"id"`
	UnitID       uint            `json:"unit_id"`
	Unit         *UnitSummary    `json:"unit,omitempty"`
	Name         string          `json:"name"`
	Stock        decimal.Decimal `json:"stock"`
	MinimumStock decimal.Decimal `json:"minimum_stock"`
	IsActive     bool            `json:"is_active"`
	CreatedAt    time.Time       `json:"created_at"`
	UpdatedAt    time.Time       `json:"updated_at"`
}

type IngredientListResponse struct {
	Items      []IngredientResponse `json:"items"`
	Pagination pagination.Meta      `json:"pagination"`
}

func toResponse(ingredient *Ingredient) IngredientResponse {
	res := IngredientResponse{
		ID:           ingredient.ID,
		UnitID:       ingredient.UnitID,
		Name:         ingredient.Name,
		Stock:        ingredient.Stock,
		MinimumStock: ingredient.MinimumStock,
		IsActive:     ingredient.IsActive,
		CreatedAt:    ingredient.CreatedAt,
		UpdatedAt:    ingredient.UpdatedAt,
	}

	if ingredient.Unit != nil {
		res.Unit = &UnitSummary{
			ID:           ingredient.Unit.ID,
			Name:         ingredient.Unit.Name,
			Abbreviation: ingredient.Unit.Abbreviation,
		}
	}

	return res
}
