package domain

import "time"

type Membership struct {
	ID           int64     `json:"id"`
	UserID       int64     `json:"user_id"`
	PlanName     string    `json:"plan_name"`
	Price        int       `json:"price"`
	ValidUntil   time.Time `json:"valid_until"`
	PurchasedAt  time.Time `json:"purchased_at"`
}
