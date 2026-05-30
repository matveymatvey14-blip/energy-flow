.PHONY: run-user run-membership migrate test swagger-user swagger-membership

run-user:
	go run ./cmd/user-service

run-membership:
	go run ./cmd/membership-service

migrate:
	go run ./cmd/migrator

test:
	go test ./...

swagger-user:
	swag init -g cmd/user-service/main.go -o docs/user

swagger-membership:
	swag init -g cmd/membership-service/main.go -o docs/membership
