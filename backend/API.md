# API

## User service

`POST /users`

```json
{
  "full_name": "Ivan Ivanov",
  "email": "ivan@gym.com"
}
```

`GET /users`

## Membership service

`POST /memberships`

```json
{
  "user_id": 1,
  "plan_name": "Month",
  "price": 2500,
  "valid_until": "2026-12-01T10:00:00Z"
}
```

`GET /memberships?user_id=1`
