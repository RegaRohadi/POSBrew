package unit

import "time"

type CreateUnitRequest struct {
	Name         string `json:"name" binding:"required,max=50"`
	Abbreviation string `json:"abbreviation" binding:"required,max=20"`
}

type UpdateUnitRequest struct {
	Name         string `json:"name" binding:"required,max=50"`
	Abbreviation string `json:"abbreviation" binding:"required,max=20"`
}

type UnitResponse struct {
	ID           uint      `json:"id"`
	Name         string    `json:"name"`
	Abbreviation string    `json:"abbreviation"`
	CreatedAt    time.Time `json:"created_at"`
}

func toResponse(unit *Unit) UnitResponse {
	return UnitResponse{
		ID:           unit.ID,
		Name:         unit.Name,
		Abbreviation: unit.Abbreviation,
		CreatedAt:    unit.CreatedAt,
	}
}
