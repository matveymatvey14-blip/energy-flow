package postgres

import (
	"context"
	"database/sql"

	"github.com/matve/energy-flow/backend/internal/membership/domain"
)

type Repository struct {
	db *sql.DB
}

func New(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Create(ctx context.Context, membership domain.Membership) (domain.Membership, error) {
	const query = `
		INSERT INTO memberships(user_id, plan_name, price, valid_until)
		VALUES ($1, $2, $3, $4)
		RETURNING id, user_id, plan_name, price, valid_until, purchased_at
	`
	var created domain.Membership
	err := r.db.QueryRowContext(
		ctx,
		query,
		membership.UserID,
		membership.PlanName,
		membership.Price,
		membership.ValidUntil,
	).Scan(
		&created.ID,
		&created.UserID,
		&created.PlanName,
		&created.Price,
		&created.ValidUntil,
		&created.PurchasedAt,
	)
	return created, err
}

func (r *Repository) ListByUserID(ctx context.Context, userID int64) ([]domain.Membership, error) {
	const query = `
		SELECT id, user_id, plan_name, price, valid_until, purchased_at
		FROM memberships
		WHERE user_id = $1
		ORDER BY id DESC
	`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]domain.Membership, 0)
	for rows.Next() {
		var m domain.Membership
		if err := rows.Scan(
			&m.ID,
			&m.UserID,
			&m.PlanName,
			&m.Price,
			&m.ValidUntil,
			&m.PurchasedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, m)
	}
	return items, rows.Err()
}
