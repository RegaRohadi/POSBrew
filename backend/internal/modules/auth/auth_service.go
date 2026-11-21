package auth

import (
	"errors"
	"strings"

	authpkg "POSBrew/internal/auth"
	"POSBrew/internal/modules/user"

	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	users  user.Repository
	tokens *authpkg.TokenService
}

func NewService(users user.Repository, tokens *authpkg.TokenService) *Service {
	return &Service{
		users:  users,
		tokens: tokens,
	}
}

func (s *Service) Register(req RegisterRequest) (*AuthResponse, error) {
	email := normalizeEmail(req.Email)

	exists, err := s.users.ExistsByEmail(email, 0)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, user.ErrEmailExists
	}

	count, err := s.users.Count()
	if err != nil {
		return nil, err
	}

	roleName := "cashier"
	if count == 0 {
		roleName = "admin"
	}

	role, err := s.users.FindRoleByName(roleName)
	if err != nil {
		return nil, err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	newUser := &user.User{
		RoleID:   role.ID,
		Name:     strings.TrimSpace(req.Name),
		Email:    email,
		Password: string(hash),
		IsActive: true,
		Role:     role,
	}

	if err := s.users.Create(newUser); err != nil {
		return nil, err
	}

	token, err := s.tokens.Generate(newUser.ID, role.Name)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		Token: token,
		User:  user.ToUserResponse(newUser),
	}, nil
}

func (s *Service) Login(req LoginRequest) (*AuthResponse, error) {
	email := normalizeEmail(req.Email)

	found, err := s.users.FindByEmail(email)
	if errors.Is(err, user.ErrUserNotFound) {
		return nil, user.ErrInvalidCredentials
	}
	if err != nil {
		return nil, err
	}

	if !found.IsActive {
		return nil, user.ErrUserInactive
	}

	if err := bcrypt.CompareHashAndPassword([]byte(found.Password), []byte(req.Password)); err != nil {
		return nil, user.ErrInvalidCredentials
	}

	roleName := ""
	if found.Role != nil {
		roleName = found.Role.Name
	}

	token, err := s.tokens.Generate(found.ID, roleName)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		Token: token,
		User:  user.ToUserResponse(found),
	}, nil
}

func (s *Service) Me(userID uint) (*user.UserResponse, error) {
	found, err := s.users.FindByID(userID)
	if err != nil {
		return nil, err
	}

	res := user.ToUserResponse(found)
	return &res, nil
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}
