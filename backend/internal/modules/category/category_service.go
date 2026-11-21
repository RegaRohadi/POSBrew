package category

type Service interface {
	Create(req CreateCategoryRequest) (*CategoryResponse, error)
	GetAll() ([]CategoryResponse, error)
	GetByID(id uint) (*CategoryResponse, error)
	Update(id uint, req UpdateCategoryRequest) (*CategoryResponse, error)
	Delete(id uint) error
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) Create(req CreateCategoryRequest) (*CategoryResponse, error) {
	exists, err := s.repo.ExistsByName(req.Name, 0)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrCategoryNameExists
	}

	category := &Category{
		Name:        req.Name,
		Description: req.Description,
	}

	if err := s.repo.Create(category); err != nil {
		return nil, err
	}

	res := toResponse(category)
	return &res, nil
}

func (s *service) GetAll() ([]CategoryResponse, error) {
	categories, err := s.repo.FindAll()
	if err != nil {
		return nil, err
	}

	result := make([]CategoryResponse, 0, len(categories))
	for i := range categories {
		result = append(result, toResponse(&categories[i]))
	}

	return result, nil
}

func (s *service) GetByID(id uint) (*CategoryResponse, error) {
	category, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	res := toResponse(category)
	return &res, nil
}

func (s *service) Update(id uint, req UpdateCategoryRequest) (*CategoryResponse, error) {
	category, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	exists, err := s.repo.ExistsByName(req.Name, id)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrCategoryNameExists
	}

	category.Name = req.Name
	category.Description = req.Description

	if err := s.repo.Update(category); err != nil {
		return nil, err
	}

	res := toResponse(category)
	return &res, nil
}

func (s *service) Delete(id uint) error {
	return s.repo.Delete(id)
}
