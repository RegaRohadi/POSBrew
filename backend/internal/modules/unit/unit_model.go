package unit

import "time"

type Unit struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Name         string    `gorm:"type:varchar(50);not null;uniqueIndex" json:"name"`
	Abbreviation string    `gorm:"type:varchar(20);not null;uniqueIndex" json:"abbreviation"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"created_at"`
}

func (Unit) TableName() string {
	return "units"
}
