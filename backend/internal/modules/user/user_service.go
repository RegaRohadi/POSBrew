package user

import (
	"strings"

	"golang.org/x/crypto/bcrypt"
)

type Service interface {
	List() ([]UserResponse, error)
	GetByID(id uint) (*UserResponse, error)
	Create(req CreateUserRequest) (*UserResponse, error)
	Update(id uint, req UpdateUserRequest) (*UserResponse, error)
	Deactivate(id uint) error
	Roles() ([]RoleResponse, error)
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) List() ([]UserResponse, error) {
	users, err := s.repo.FindAll()
	if err != nil {
		return nil, err
	}

	result := make([]UserResponse, 0, len(users))
	for i := range users {
		result = append(result, ToUserResponse(&users[i]))
	}

	return result, nil
}

func (s *service) GetByID(id uint) (*UserResponse, error) {
	user, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	res := ToUserResponse(user)
	return &res, nil
}

func (s *service) Create(req CreateUserRequest) (*UserResponse, error) {
	email := normalizeEmail(req.Email)

	exists, err := s.repo.ExistsByEmail(email, 0)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrEmailExists
	}

	role, err := s.repo.FindRoleByID(req.RoleID)
	if err != nil {
		return nil, err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &User{
		RoleID:   role.ID,
		Name:     strings.TrimSpace(req.Name),
		Email:    email,
		Password: string(hash),
		IsActive: true,
		Role:     role,
	}

	if err := s.repo.Create(user); err != nil {
		return nil, err
	}

	res := ToUserResponse(user)
	return &res, nil
}

func (s *service) Update(id uint, req UpdateUserRequest) (*UserResponse, error) {
	user, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	email := normalizeEmail(req.Email)
	exists, err := s.repo.ExistsByEmail(email, id)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrEmailExists
	}

	role, err := s.repo.FindRoleByID(req.RoleID)
	if err != nil {
		return nil, err
	}

	user.RoleID = role.ID
	user.Name = strings.TrimSpace(req.Name)
	user.Email = email
	user.Role = role

	if req.Password != nil && *req.Password != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(*req.Password), bcrypt.DefaultCost)
		if err != nil {
			return nil, err
		}
		user.Password = string(hash)
	}

	if req.IsActive != nil {
		user.IsActive = *req.IsActive
	}

	if err := s.repo.Update(user); err != nil {
		return nil, err
	}

	res := ToUserResponse(user)
	return &res, nil
}

func (s *service) Deactivate(id uint) error {
	return s.repo.Deactivate(id)
}

func (s *service) Roles() ([]RoleResponse, error) {
	roles, err := s.repo.FindAllRoles()
	if err != nil {
		return nil, err
	}

	result := make([]RoleResponse, 0, len(roles))
	for i := range roles {
		result = append(result, *toRoleResponse(&roles[i]))
	}

	return result, nil
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}
