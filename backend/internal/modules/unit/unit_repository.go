package unit

import (
	"errors"

	"POSBrew/internal/database"

	"gorm.io/gorm"
)

var (
	ErrUnitNotFound = errors.New("unit not found")
	ErrUnitExists   = errors.New("unit name or abbreviation already exists")
	ErrUnitInUse    = errors.New("unit is used by ingredients")
)

type Repository interface {
	Create(unit *Unit) error
	Update(unit *Unit) error
	FindAll() ([]Unit, error)
	FindByID(id uint) (*Unit, error)
	Delete(id uint) error
	ExistsByName(name string, excludeID uint) (bool, error)
	ExistsByAbbreviation(abbreviation string, excludeID uint) (bool, error)
}

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) Create(unit *Unit) error {
	if err := r.db.Create(unit).Error; err != nil {
		return database.TranslatePGError(err, ErrUnitExists, nil)
	}

	return nil
}

func (r *repository) Update(unit *Unit) error {
	if err := r.db.Save(unit).Error; err != nil {
		return database.TranslatePGError(err, ErrUnitExists, nil)
	}

	return nil
}

func (r *repository) FindAll() ([]Unit, error) {
	var units []Unit

	err := r.db.Order("name ASC").Find(&units).Error
	return units, err
}

func (r *repository) FindByID(id uint) (*Unit, error) {
	var unit Unit

	err := r.db.First(&unit, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrUnitNotFound
	}
	if err != nil {
		return nil, err
	}

	return &unit, nil
}

func (r *repository) Delete(id uint) error {
	result := r.db.Delete(&Unit{}, id)
	if result.Error != nil {
		return database.TranslatePGError(result.Error, nil, ErrUnitInUse)
	}
	if result.RowsAffected == 0 {
		return ErrUnitNotFound
	}

	return nil
}

func (r *repository) ExistsByName(name string, excludeID uint) (bool, error) {
	var count int64

	query := r.db.Model(&Unit{}).Where("LOWER(name) = LOWER(?)", name)
	if excludeID > 0 {
		query = query.Where("id <> ?", excludeID)
	}

	if err := query.Count(&count).Error; err != nil {
		return false, err
	}

	return count > 0, nil
}

func (r *repository) ExistsByAbbreviation(abbreviation string, excludeID uint) (bool, error) {
	var count int64

	query := r.db.Model(&Unit{}).Where("LOWER(abbreviation) = LOWER(?)", abbreviation)
	if excludeID > 0 {
		query = query.Where("id <> ?", excludeID)
	}

	if err := query.Count(&count).Error; err != nil {
		return false, err
	}

	return count > 0, nil
}
