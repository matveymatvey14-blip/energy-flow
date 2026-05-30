package usecase

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/matve/energy-flow/backend/internal/membership/domain"
)

type Repository interface {
	Create(ctx context.Context, membership domain.Membership) (domain.Membership, error)
	ListByUserID(ctx context.Context, userID int64) ([]domain.Membership, error)
}

type UseCase struct {
	repo Repository
}

func New(repo Repository) *UseCase {
	return &UseCase{repo: repo}
}

func (u *UseCase) Purchase(ctx context.Context, membership domain.Membership) (domain.Membership, error) {
	if membership.UserID <= 0 {
		return domain.Membership{}, errors.New("user_id must be positive")
	}
	if strings.TrimSpace(membership.PlanName) == "" {
		return domain.Membership{}, errors.New("plan_name is required")
	}
	if membership.Price <= 0 {
		return domain.Membership{}, errors.New("price must be positive")
	}
	if membership.ValidUntil.Before(time.Now()) {
		return domain.Membership{}, errors.New("valid_until must be in the future")
	}
	return u.repo.Create(ctx, membership)
}

func (u *UseCase) ListByUserID(ctx context.Context, userID int64) ([]domain.Membership, error) {
	if userID <= 0 {
		return nil, errors.New("user_id must be positive")
	}
	return u.repo.ListByUserID(ctx, userID)
}
