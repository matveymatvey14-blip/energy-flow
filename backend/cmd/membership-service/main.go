package main

import (
	"context"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	_ "github.com/matve/energy-flow/backend/docs/membership"
	membershiphttp "github.com/matve/energy-flow/backend/internal/membership/delivery/http"
	membershippostgres "github.com/matve/energy-flow/backend/internal/membership/repository/postgres"
	membershipusecase "github.com/matve/energy-flow/backend/internal/membership/usecase"
	"github.com/matve/energy-flow/backend/internal/platform/config"
	"github.com/matve/energy-flow/backend/internal/platform/logger"
	"github.com/matve/energy-flow/backend/internal/platform/postgres"
	httpSwagger "github.com/swaggo/http-swagger"
	"go.uber.org/zap"
)

// @title Membership Service API
// @version 1.0
// @description Membership service for gym frontend
// @BasePath /
func main() {
	cfg := config.Load()
	log, err := logger.New()
	if err != nil {
		panic(err)
	}
	defer log.Sync()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	db, err := postgres.New(ctx, cfg.DSN())
	if err != nil {
		log.Fatal("database connection failed", zap.Error(err))
	}
	defer db.Close()

	repo := membershippostgres.New(db)
	uc := membershipusecase.New(repo)
	handler := membershiphttp.New(uc)

	router := mux.NewRouter()
	router.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})
	handler.Register(router)
	router.PathPrefix("/swagger/").Handler(httpSwagger.WrapHandler)

	addr := ":" + cfg.MembershipServicePort
	log.Info("membership-service started", zap.String("addr", addr))
	if err := http.ListenAndServe(addr, router); err != nil {
		log.Fatal("membership-service stopped", zap.Error(err))
	}
}
