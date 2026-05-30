package postgres

import (
	"context"
	"regexp"
	"testing"
	"time"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/matve/energy-flow/backend/internal/membership/domain"
	"github.com/stretchr/testify/require"
)

func TestCreate(t *testing.T) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	repo := New(db)
	now := time.Now()
	validUntil := now.Add(30 * 24 * time.Hour)

	mock.ExpectQuery(regexp.QuoteMeta(`
		INSERT INTO memberships(user_id, plan_name, price, valid_until)
		VALUES ($1, $2, $3, $4)
		RETURNING id, user_id, plan_name, price, valid_until, purchased_at
	`)).
		WithArgs(int64(1), "Month", 2500, validUntil).
		WillReturnRows(sqlmock.NewRows([]string{"id", "user_id", "plan_name", "price", "valid_until", "purchased_at"}).AddRow(1, 1, "Month", 2500, validUntil, now))

	got, err := repo.Create(context.Background(), domain.Membership{
		UserID:     1,
		PlanName:   "Month",
		Price:      2500,
		ValidUntil: validUntil,
	})
	require.NoError(t, err)
	require.Equal(t, int64(1), got.ID)
	require.NoError(t, mock.ExpectationsWereMet())
}
