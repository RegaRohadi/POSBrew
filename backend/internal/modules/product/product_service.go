package product

import (
	"POSBrew/internal/common/pagination"
	"POSBrew/internal/modules/category"
)

type Service interface {
	Create(req CreateProductRequest) (*ProductResponse, error)
	GetAll(query ListProductsQuery) (*ProductListResponse, error)
	GetByID(id uint) (*ProductResponse, error)
	Update(id uint, req UpdateProductRequest) (*ProductResponse, error)
	Delete(id uint) error
}

type service struct {
	repo       Repository
	categories category.Repository
}

func NewService(repo Repository, categories category.Repository) Service {
	return &service{
		repo:       repo,
		categories: categories,
	}
}

func (s *service) Create(req CreateProductRequest) (*ProductResponse, error) {
	var cat *category.Category

	if req.CategoryID != nil {
		found, err := s.categories.FindByID(*req.CategoryID)
		if err != nil {
			return nil, err
		}
		cat = found
	}

	isAvailable := true
	if req.IsAvailable != nil {
		isAvailable = *req.IsAvailable
	}

	product := &Product{
		CategoryID:  req.CategoryID,
		Category:    cat,
		Name:        req.Name,
		Description: req.Description,
		Price:       req.Price,
		ImageURL:    req.ImageURL,
		IsAvailable: isAvailable,
	}

	if err := s.repo.Create(product); err != nil {
		return nil, err
	}

	res := toResponse(product)
	return &res, nil
}

func (s *service) GetAll(query ListProductsQuery) (*ProductListResponse, error) {
	page, limit := pagination.Normalize(query.Page, query.Limit)

	filter := Filter{
		Search:      query.Search,
		CategoryID:  query.CategoryID,
		IsAvailable: query.IsAvailable,
	}

	products, total, err := s.repo.FindAll(filter, pagination.Offset(page, limit), limit)
	if err != nil {
		return nil, err
	}

	items := make([]ProductResponse, 0, len(products))
	for i := range products {
		items = append(items, toResponse(&products[i]))
	}

	return &ProductListResponse{
		Items:      items,
		Pagination: pagination.NewMeta(total, page, limit),
	}, nil
}

func (s *service) GetByID(id uint) (*ProductResponse, error) {
	product, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	res := toResponse(product)
	return &res, nil
}

func (s *service) Update(id uint, req UpdateProductRequest) (*ProductResponse, error) {
	product, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	var cat *category.Category

	if req.CategoryID != nil {
		found, err := s.categories.FindByID(*req.CategoryID)
		if err != nil {
			return nil, err
		}
		cat = found
	}

	product.CategoryID = req.CategoryID
	product.Category = cat
	product.Name = req.Name
	product.Description = req.Description
	product.Price = req.Price
	product.ImageURL = req.ImageURL

	if req.IsAvailable != nil {
		product.IsAvailable = *req.IsAvailable
	}

	if err := s.repo.Update(product); err != nil {
		return nil, err
	}

	res := toResponse(product)
	return &res, nil
}

func (s *service) Delete(id uint) error {
	return s.repo.Delete(id)
}
