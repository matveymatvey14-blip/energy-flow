package postgres

import (
	"context"
	"database/sql"

	"github.com/matve/energy-flow/backend/internal/user/domain"
)

type Repository struct {
	db *sql.DB
}

func New(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Create(ctx context.Context, user domain.User) (domain.User, error) {
	const query = `
		INSERT INTO users(full_name, email)
		VALUES ($1, $2)
		RETURNING id, full_name, email, created_at
	`
	var created domain.User
	err := r.db.QueryRowContext(ctx, query, user.FullName, user.Email).Scan(
		&created.ID,
		&created.FullName,
		&created.Email,
		&created.CreatedAt,
	)
	return created, err
}

func (r *Repository) List(ctx context.Context) ([]domain.User, error) {
	const query = `
		SELECT id, full_name, email, created_at
		FROM users
		ORDER BY id DESC
	`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := make([]domain.User, 0)
	for rows.Next() {
		var u domain.User
		if err := rows.Scan(&u.ID, &u.FullName, &u.Email, &u.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}

	return users, rows.Err()
}
