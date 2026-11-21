package stock

import (
	"time"

	"POSBrew/internal/common/pagination"

	"github.com/shopspring/decimal"
)

type CreateMovementRequest struct {
	IngredientID uint              `json:"ingredient_id" binding:"required"`
	Type         StockMovementType `json:"type" binding:"required,oneof=purchase waste adjustment"`
	Quantity     decimal.Decimal   `json:"quantity"`
	TargetStock  *decimal.Decimal  `json:"target_stock"`
	Notes        *string           `json:"notes" binding:"omitempty,max=500"`
}

type ListMovementsQuery struct {
	Page         int                `form:"page"`
	Limit        int                `form:"limit"`
	IngredientID *uint              `form:"ingredient_id"`
	Type         *StockMovementType `form:"type"`
}

type IngredientSummary struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}

type MovementResponse struct {
	ID            uint               `json:"id"`
	IngredientID  uint               `json:"ingredient_id"`
	Ingredient    *IngredientSummary `json:"ingredient,omitempty"`
	Type          StockMovementType  `json:"type"`
	Quantity      decimal.Decimal    `json:"quantity"`
	Notes         *string            `json:"notes"`
	ReferenceType *string            `json:"reference_type"`
	ReferenceID   *uint              `json:"reference_id"`
	CreatedAt     time.Time          `json:"created_at"`
}

type MovementListResponse struct {
	Items      []MovementResponse `json:"items"`
	Pagination pagination.Meta    `json:"pagination"`
}

type StockUpdateResponse struct {
	IngredientID uint              `json:"ingredient_id"`
	Stock        decimal.Decimal   `json:"stock"`
	Movement     *MovementResponse `json:"movement,omitempty"`
}

func toMovementResponse(movement *StockMovement) MovementResponse {
	res := MovementResponse{
		ID:            movement.ID,
		IngredientID:  movement.IngredientID,
		Type:          movement.Type,
		Quantity:      movement.Quantity,
		Notes:         movement.Notes,
		ReferenceType: movement.ReferenceType,
		ReferenceID:   movement.ReferenceID,
		CreatedAt:     movement.CreatedAt,
	}

	if movement.Ingredient != nil {
		res.Ingredient = &IngredientSummary{
			ID:   movement.Ingredient.ID,
			Name: movement.Ingredient.Name,
		}
	}

	return res
}
