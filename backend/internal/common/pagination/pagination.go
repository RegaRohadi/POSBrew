package pagination

const (
	DefaultPage  = 1
	DefaultLimit = 10
	MaxLimit     = 100
)

type Meta struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"total_pages"`
}

func Normalize(page, limit int) (int, int) {
	if page < 1 {
		page = DefaultPage
	}
	if limit < 1 {
		limit = DefaultLimit
	}
	if limit > MaxLimit {
		limit = MaxLimit
	}

	return page, limit
}

func Offset(page, limit int) int {
	return (page - 1) * limit
}

func NewMeta(total int64, page, limit int) Meta {
	totalPages := 0
	if limit > 0 {
		totalPages = int((total + int64(limit) - 1) / int64(limit))
	}

	return Meta{
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
	}
}
