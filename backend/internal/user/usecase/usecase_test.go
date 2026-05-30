package usecase

import (
	"context"
	"testing"
	"time"

	"github.com/matve/energy-flow/backend/internal/user/domain"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

type repoMock struct {
	mock.Mock
}

func (m *repoMock) Create(ctx context.Context, user domain.User) (domain.User, error) {
	args := m.Called(ctx, user)
	return args.Get(0).(domain.User), args.Error(1)
}

func (m *repoMock) List(ctx context.Context) ([]domain.User, error) {
	args := m.Called(ctx)
	return args.Get(0).([]domain.User), args.Error(1)
}

func TestCreate_Validation(t *testing.T) {
	uc := New(&repoMock{})
	_, err := uc.Create(context.Background(), domain.User{FullName: "", Email: "a@b.com"})
	require.Error(t, err)
}

func TestCreate_Success(t *testing.T) {
	repo := &repoMock{}
	uc := New(repo)
	input := domain.User{FullName: "Ivan Ivanov", Email: "ivan@gym.com"}
	expected := domain.User{ID: 1, FullName: input.FullName, Email: input.Email, CreatedAt: time.Now()}

	repo.On("Create", mock.Anything, input).Return(expected, nil).Once()

	created, err := uc.Create(context.Background(), input)
	require.NoError(t, err)
	require.Equal(t, expected.ID, created.ID)
	repo.AssertExpectations(t)
}
