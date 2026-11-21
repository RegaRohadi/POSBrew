package unit

import "strings"

type Service interface {
	Create(req CreateUnitRequest) (*UnitResponse, error)
	GetAll() ([]UnitResponse, error)
	GetByID(id uint) (*UnitResponse, error)
	Update(id uint, req UpdateUnitRequest) (*UnitResponse, error)
	Delete(id uint) error
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) Create(req CreateUnitRequest) (*UnitResponse, error) {
	name := strings.TrimSpace(req.Name)
	abbreviation := strings.TrimSpace(req.Abbreviation)

	if err := s.ensureUnique(name, abbreviation, 0); err != nil {
		return nil, err
	}

	unit := &Unit{
		Name:         name,
		Abbreviation: abbreviation,
	}

	if err := s.repo.Create(unit); err != nil {
		return nil, err
	}

	res := toResponse(unit)
	return &res, nil
}

func (s *service) GetAll() ([]UnitResponse, error) {
	units, err := s.repo.FindAll()
	if err != nil {
		return nil, err
	}

	result := make([]UnitResponse, 0, len(units))
	for i := range units {
		result = append(result, toResponse(&units[i]))
	}

	return result, nil
}

func (s *service) GetByID(id uint) (*UnitResponse, error) {
	unit, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	res := toResponse(unit)
	return &res, nil
}

func (s *service) Update(id uint, req UpdateUnitRequest) (*UnitResponse, error) {
	unit, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	name := strings.TrimSpace(req.Name)
	abbreviation := strings.TrimSpace(req.Abbreviation)

	if err := s.ensureUnique(name, abbreviation, id); err != nil {
		return nil, err
	}

	unit.Name = name
	unit.Abbreviation = abbreviation

	if err := s.repo.Update(unit); err != nil {
		return nil, err
	}

	res := toResponse(unit)
	return &res, nil
}

func (s *service) Delete(id uint) error {
	return s.repo.Delete(id)
}

func (s *service) ensureUnique(name, abbreviation string, excludeID uint) error {
	nameExists, err := s.repo.ExistsByName(name, excludeID)
	if err != nil {
		return err
	}
	if nameExists {
		return ErrUnitExists
	}

	abbreviationExists, err := s.repo.ExistsByAbbreviation(abbreviation, excludeID)
	if err != nil {
		return err
	}
	if abbreviationExists {
		return ErrUnitExists
	}

	return nil
}
