package http

import (
	"encoding/json"
	"errors"
	nethttp "net/http"

	"github.com/gorilla/mux"
	commonhttp "github.com/matve/energy-flow/backend/internal/common/http"
	"github.com/matve/energy-flow/backend/internal/user/domain"
	"github.com/matve/energy-flow/backend/internal/user/usecase"
)

type Handler struct {
	uc *usecase.UseCase
}

func New(uc *usecase.UseCase) *Handler {
	return &Handler{uc: uc}
}

func (h *Handler) Register(router *mux.Router) {
	router.HandleFunc("/users", h.createUser).Methods(nethttp.MethodPost)
	router.HandleFunc("/users", h.listUsers).Methods(nethttp.MethodGet)
}

type createUserRequest struct {
	FullName string `json:"full_name"`
	Email    string `json:"email"`
}

// createUser godoc
// @Summary Create user
// @Tags users
// @Accept json
// @Produce json
// @Param payload body createUserRequest true "payload"
// @Success 201 {object} domain.User
// @Failure 400 {object} commonhttp.ErrorResponse
// @Failure 500 {object} commonhttp.ErrorResponse
// @Router /users [post]
func (h *Handler) createUser(w nethttp.ResponseWriter, r *nethttp.Request) {
	var req createUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		commonhttp.WriteError(w, nethttp.StatusBadRequest, errors.New("invalid json"))
		return
	}

	created, err := h.uc.Create(r.Context(), domain.User{
		FullName: req.FullName,
		Email:    req.Email,
	})
	if err != nil {
		commonhttp.WriteError(w, nethttp.StatusBadRequest, err)
		return
	}

	commonhttp.WriteJSON(w, nethttp.StatusCreated, created)
}

// listUsers godoc
// @Summary List users
// @Tags users
// @Produce json
// @Success 200 {array} domain.User
// @Failure 500 {object} commonhttp.ErrorResponse
// @Router /users [get]
func (h *Handler) listUsers(w nethttp.ResponseWriter, r *nethttp.Request) {
	users, err := h.uc.List(r.Context())
	if err != nil {
		commonhttp.WriteError(w, nethttp.StatusInternalServerError, err)
		return
	}
	commonhttp.WriteJSON(w, nethttp.StatusOK, users)
}
