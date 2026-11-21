package stock

import (
	"time"

	"POSBrew/internal/modules/ingredient"

	"github.com/shopspring/decimal"
)

type StockMovementType string

const (
	StockMovementTypePurchase   StockMovementType = "purchase"
	StockMovementTypeSale       StockMovementType = "sale"
	StockMovementTypeAdjustment StockMovementType = "adjustment"
	StockMovementTypeWaste      StockMovementType = "waste"
	StockMovementTypeReversal   StockMovementType = "reversal"
)

type StockMovement struct {
	ID            uint                   `gorm:"primaryKey" json:"id"`
	IngredientID  uint                   `gorm:"not null;index" json:"ingredient_id"`
	Ingredient    *ingredient.Ingredient `gorm:"foreignKey:IngredientID" json:"ingredient,omitempty"`
	Type          StockMovementType      `gorm:"type:varchar(20);not null" json:"type"`
	Quantity      decimal.Decimal        `gorm:"type:numeric(14,3);not null" json:"quantity"`
	Notes         *string                `gorm:"type:text" json:"notes"`
	ReferenceType *string                `gorm:"type:varchar(30)" json:"reference_type"`
	ReferenceID   *uint                  `json:"reference_id"`
	CreatedAt     time.Time              `gorm:"autoCreateTime;index" json:"created_at"`
}

func (StockMovement) TableName() string {
	return "stock_movements"
}
