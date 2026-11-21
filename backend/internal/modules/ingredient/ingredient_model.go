package ingredient

import (
	"time"

	"POSBrew/internal/modules/unit"

	"github.com/shopspring/decimal"
)

type Ingredient struct {
	ID           uint            `gorm:"primaryKey" json:"id"`
	UnitID       uint            `gorm:"not null;index" json:"unit_id"`
	Unit         *unit.Unit      `gorm:"foreignKey:UnitID" json:"unit,omitempty"`
	Name         string          `gorm:"type:varchar(150);not null;uniqueIndex" json:"name"`
	Stock        decimal.Decimal `gorm:"type:numeric(14,3);not null;default:0" json:"stock"`
	MinimumStock decimal.Decimal `gorm:"type:numeric(14,3);not null;default:0" json:"minimum_stock"`
	IsActive     bool            `gorm:"not null;default:true" json:"is_active"`
	CreatedAt    time.Time       `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time       `gorm:"autoUpdateTime" json:"updated_at"`
}

func (Ingredient) TableName() string {
	return "ingredients"
}
