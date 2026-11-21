package report

import (
	"errors"
	"time"
)

var ErrInvalidDateRange = errors.New("invalid date range, use YYYY-MM-DD and make sure from is before to")

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Summary() (*SummaryResponse, error) {
	return s.repo.Summary()
}

func (s *Service) DailySales(from, to string) (*SalesResponse, error) {
	start, end, err := resolveDateRange(from, to)
	if err != nil {
		return nil, err
	}

	items, err := s.repo.DailySales(start, end)
	if err != nil {
		return nil, err
	}
	if items == nil {
		items = []DailySalesItem{}
	}

	return &SalesResponse{
		From:  start.Format("2006-01-02"),
		To:    end.AddDate(0, 0, -1).Format("2006-01-02"),
		Items: items,
	}, nil
}

func (s *Service) TopProducts(from, to string, limit int) (*TopProductsResponse, error) {
	start, end, err := resolveDateRange(from, to)
	if err != nil {
		return nil, err
	}

	if limit < 1 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}

	items, err := s.repo.TopProducts(start, end, limit)
	if err != nil {
		return nil, err
	}
	if items == nil {
		items = []TopProductItem{}
	}

	return &TopProductsResponse{
		From:  start.Format("2006-01-02"),
		To:    end.AddDate(0, 0, -1).Format("2006-01-02"),
		Items: items,
	}, nil
}

func (s *Service) LowStock() (*LowStockResponse, error) {
	items, err := s.repo.LowStock()
	if err != nil {
		return nil, err
	}
	if items == nil {
		items = []LowStockItem{}
	}

	return &LowStockResponse{Items: items}, nil
}

func resolveDateRange(from, to string) (time.Time, time.Time, error) {
	now := time.Now()
	end := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location()).AddDate(0, 0, 1)
	start := end.AddDate(0, 0, -7)

	if from != "" {
		parsed, err := time.ParseInLocation("2006-01-02", from, time.Local)
		if err != nil {
			return time.Time{}, time.Time{}, ErrInvalidDateRange
		}
		start = parsed
	}

	if to != "" {
		parsed, err := time.ParseInLocation("2006-01-02", to, time.Local)
		if err != nil {
			return time.Time{}, time.Time{}, ErrInvalidDateRange
		}
		end = parsed.AddDate(0, 0, 1)
	}

	if !start.Before(end) {
		return time.Time{}, time.Time{}, ErrInvalidDateRange
	}

	return start, end, nil
}
