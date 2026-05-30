package postgres

import (
	"context"
	"regexp"
	"testing"
	"time"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/matve/energy-flow/backend/internal/user/domain"
	"github.com/stretchr/testify/require"
)

func TestCreate(t *testing.T) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	repo := New(db)
	now := time.Now()

	mock.ExpectQuery(regexp.QuoteMeta(`
		INSERT INTO users(full_name, email)
		VALUES ($1, $2)
		RETURNING id, full_name, email, created_at
	`)).
		WithArgs("Ivan Ivanov", "ivan@gym.com").
		WillReturnRows(sqlmock.NewRows([]string{"id", "full_name", "email", "created_at"}).AddRow(1, "Ivan Ivanov", "ivan@gym.com", now))

	got, err := repo.Create(context.Background(), domain.User{FullName: "Ivan Ivanov", Email: "ivan@gym.com"})
	require.NoError(t, err)
	require.Equal(t, int64(1), got.ID)
	require.NoError(t, mock.ExpectationsWereMet())
}
