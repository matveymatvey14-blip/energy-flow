package usecase

import (
	"context"
	"errors"
	"strings"

	"github.com/matve/energy-flow/backend/internal/user/domain"
)

type Repository interface {
	Create(ctx context.Context, user domain.User) (domain.User, error)
	List(ctx context.Context) ([]domain.User, error)
}

type UseCase struct {
	repo Repository
}

func New(repo Repository) *UseCase {
	return &UseCase{repo: repo}
}

func (u *UseCase) Create(ctx context.Context, user domain.User) (domain.User, error) {
	if strings.TrimSpace(user.FullName) == "" {
		return domain.User{}, errors.New("full_name is required")
	}
	if strings.TrimSpace(user.Email) == "" {
		return domain.User{}, errors.New("email is required")
	}
	return u.repo.Create(ctx, user)
}

func (u *UseCase) List(ctx context.Context) ([]domain.User, error) {
	return u.repo.List(ctx)
}
