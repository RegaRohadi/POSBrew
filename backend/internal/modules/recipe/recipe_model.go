package recipe

import (
	"time"

	"POSBrew/internal/modules/ingredient"
	"POSBrew/internal/modules/product"

	"github.com/shopspring/decimal"
)

type Recipe struct {
	ID           uint                   `gorm:"primaryKey" json:"id"`
	ProductID    uint                   `gorm:"not null;uniqueIndex:idx_recipes_product_ingredient" json:"product_id"`
	Product      *product.Product       `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	IngredientID uint                   `gorm:"not null;index;uniqueIndex:idx_recipes_product_ingredient" json:"ingredient_id"`
	Ingredient   *ingredient.Ingredient `gorm:"foreignKey:IngredientID" json:"ingredient,omitempty"`
	Quantity     decimal.Decimal        `gorm:"type:numeric(14,3);not null" json:"quantity"`
	CreatedAt    time.Time              `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time              `gorm:"autoUpdateTime" json:"updated_at"`
}

func (Recipe) TableName() string {
	return "recipes"
}
