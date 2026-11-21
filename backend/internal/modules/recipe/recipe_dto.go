package recipe

import (
	"time"

	"POSBrew/internal/modules/ingredient"

	"github.com/shopspring/decimal"
)

type CreateRecipeRequest struct {
	ProductID    uint            `json:"product_id" binding:"required"`
	IngredientID uint            `json:"ingredient_id" binding:"required"`
	Quantity     decimal.Decimal `json:"quantity"`
}

type UpdateRecipeRequest struct {
	Quantity decimal.Decimal `json:"quantity"`
}

type ListRecipesQuery struct {
	ProductID uint `form:"product_id"`
}

type ProductSummary struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}

type IngredientSummary struct {
	ID   uint                    `json:"id"`
	Name string                  `json:"name"`
	Unit *ingredient.UnitSummary `json:"unit,omitempty"`
}

type RecipeResponse struct {
	ID           uint               `json:"id"`
	ProductID    uint               `json:"product_id"`
	Product      *ProductSummary    `json:"product,omitempty"`
	IngredientID uint               `json:"ingredient_id"`
	Ingredient   *IngredientSummary `json:"ingredient,omitempty"`
	Quantity     decimal.Decimal    `json:"quantity"`
	CreatedAt    time.Time          `json:"created_at"`
	UpdatedAt    time.Time          `json:"updated_at"`
}

func toResponse(recipe *Recipe) RecipeResponse {
	res := RecipeResponse{
		ID:           recipe.ID,
		ProductID:    recipe.ProductID,
		IngredientID: recipe.IngredientID,
		Quantity:     recipe.Quantity,
		CreatedAt:    recipe.CreatedAt,
		UpdatedAt:    recipe.UpdatedAt,
	}

	if recipe.Product != nil {
		res.Product = &ProductSummary{
			ID:   recipe.Product.ID,
			Name: recipe.Product.Name,
		}
	}

	if recipe.Ingredient != nil {
		res.Ingredient = &IngredientSummary{
			ID:   recipe.Ingredient.ID,
			Name: recipe.Ingredient.Name,
		}

		if recipe.Ingredient.Unit != nil {
			res.Ingredient.Unit = &ingredient.UnitSummary{
				ID:           recipe.Ingredient.Unit.ID,
				Name:         recipe.Ingredient.Unit.Name,
				Abbreviation: recipe.Ingredient.Unit.Abbreviation,
			}
		}
	}

	return res
}
