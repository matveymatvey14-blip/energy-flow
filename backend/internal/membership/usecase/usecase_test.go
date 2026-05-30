package usecase

import (
	"context"
	"testing"
	"time"

	"github.com/matve/energy-flow/backend/internal/membership/domain"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

type repoMock struct {
	mock.Mock
}

func (m *repoMock) Create(ctx context.Context, membership domain.Membership) (domain.Membership, error) {
	args := m.Called(ctx, membership)
	return args.Get(0).(domain.Membership), args.Error(1)
}

func (m *repoMock) ListByUserID(ctx context.Context, userID int64) ([]domain.Membership, error) {
	args := m.Called(ctx, userID)
	return args.Get(0).([]domain.Membership), args.Error(1)
}

func TestPurchase_Validation(t *testing.T) {
	uc := New(&repoMock{})
	_, err := uc.Purchase(context.Background(), domain.Membership{UserID: 0, PlanName: "Month", Price: 1, ValidUntil: time.Now().Add(24 * time.Hour)})
	require.Error(t, err)
}

func TestPurchase_Success(t *testing.T) {
	repo := &repoMock{}
	uc := New(repo)
	input := domain.Membership{
		UserID:     1,
		PlanName:   "Month",
		Price:      2500,
		ValidUntil: time.Now().Add(30 * 24 * time.Hour),
	}
	expected := input
	expected.ID = 1

	repo.On("Create", mock.Anything, input).Return(expected, nil).Once()

	created, err := uc.Purchase(context.Background(), input)
	require.NoError(t, err)
	require.Equal(t, int64(1), created.ID)
	repo.AssertExpectations(t)
}
