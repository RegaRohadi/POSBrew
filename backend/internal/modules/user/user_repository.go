package user

import (
	"errors"

	"POSBrew/internal/database"

	"gorm.io/gorm"
)

var (
	ErrUserNotFound       = errors.New("user not found")
	ErrEmailExists        = errors.New("email already exists")
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrUserInactive       = errors.New("user account is inactive")
	ErrRoleNotFound       = errors.New("role not found")
)

type Repository interface {
	Create(user *User) error
	Update(user *User) error
	FindAll() ([]User, error)
	FindByID(id uint) (*User, error)
	FindByEmail(email string) (*User, error)
	ExistsByEmail(email string, excludeID uint) (bool, error)
	Count() (int64, error)
	FindRoleByID(id uint) (*Role, error)
	FindRoleByName(name string) (*Role, error)
	FindAllRoles() ([]Role, error)
	Deactivate(id uint) error
}

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) Create(user *User) error {
	if err := r.db.Omit("Role").Create(user).Error; err != nil {
		return database.TranslatePGError(err, ErrEmailExists, ErrRoleNotFound)
	}

	return nil
}

func (r *repository) Update(user *User) error {
	if err := r.db.Omit("Role").Save(user).Error; err != nil {
		return database.TranslatePGError(err, ErrEmailExists, ErrRoleNotFound)
	}

	return nil
}

func (r *repository) FindAll() ([]User, error) {
	var users []User

	err := r.db.Preload("Role").Order("name ASC").Find(&users).Error
	return users, err
}

func (r *repository) FindByID(id uint) (*User, error) {
	var user User

	err := r.db.Preload("Role").First(&user, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *repository) FindByEmail(email string) (*User, error) {
	var user User

	err := r.db.Preload("Role").Where("LOWER(email) = LOWER(?)", email).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *repository) ExistsByEmail(email string, excludeID uint) (bool, error) {
	var count int64

	query := r.db.Model(&User{}).Where("LOWER(email) = LOWER(?)", email)
	if excludeID > 0 {
		query = query.Where("id <> ?", excludeID)
	}

	if err := query.Count(&count).Error; err != nil {
		return false, err
	}

	return count > 0, nil
}

func (r *repository) Count() (int64, error) {
	var count int64
	err := r.db.Model(&User{}).Count(&count).Error
	return count, err
}

func (r *repository) FindRoleByID(id uint) (*Role, error) {
	var role Role

	err := r.db.First(&role, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrRoleNotFound
	}
	if err != nil {
		return nil, err
	}

	return &role, nil
}

func (r *repository) FindRoleByName(name string) (*Role, error) {
	var role Role

	err := r.db.Where("name = ?", name).First(&role).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrRoleNotFound
	}
	if err != nil {
		return nil, err
	}

	return &role, nil
}

func (r *repository) FindAllRoles() ([]Role, error) {
	var roles []Role

	err := r.db.Order("id ASC").Find(&roles).Error
	return roles, err
}

func (r *repository) Deactivate(id uint) error {
	result := r.db.Model(&User{}).Where("id = ?", id).Update("is_active", false)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrUserNotFound
	}

	return nil
}
