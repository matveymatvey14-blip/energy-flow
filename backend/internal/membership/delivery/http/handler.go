package http

import (
	"encoding/json"
	"errors"
	nethttp "net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	commonhttp "github.com/matve/energy-flow/backend/internal/common/http"
	"github.com/matve/energy-flow/backend/internal/membership/domain"
	"github.com/matve/energy-flow/backend/internal/membership/usecase"
)

type Handler struct {
	uc *usecase.UseCase
}

func New(uc *usecase.UseCase) *Handler {
	return &Handler{uc: uc}
}

func (h *Handler) Register(router *mux.Router) {
	router.HandleFunc("/memberships", h.purchase).Methods(nethttp.MethodPost)
	router.HandleFunc("/memberships", h.listByUserID).Methods(nethttp.MethodGet)
}

type purchaseRequest struct {
	UserID     int64  `json:"user_id"`
	PlanName   string `json:"plan_name"`
	Price      int    `json:"price"`
	ValidUntil string `json:"valid_until"`
}

// purchaseMembership godoc
// @Summary Purchase membership
// @Tags memberships
// @Accept json
// @Produce json
// @Param payload body purchaseRequest true "payload"
// @Success 201 {object} domain.Membership
// @Failure 400 {object} commonhttp.ErrorResponse
// @Failure 500 {object} commonhttp.ErrorResponse
// @Router /memberships [post]
func (h *Handler) purchase(w nethttp.ResponseWriter, r *nethttp.Request) {
	var req purchaseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		commonhttp.WriteError(w, nethttp.StatusBadRequest, errors.New("invalid json"))
		return
	}

	validUntil, err := time.Parse(time.RFC3339, req.ValidUntil)
	if err != nil {
		commonhttp.WriteError(w, nethttp.StatusBadRequest, errors.New("invalid valid_until"))
		return
	}

	created, err := h.uc.Purchase(r.Context(), domain.Membership{
		UserID:     req.UserID,
		PlanName:   req.PlanName,
		Price:      req.Price,
		ValidUntil: validUntil,
	})
	if err != nil {
		commonhttp.WriteError(w, nethttp.StatusBadRequest, err)
		return
	}

	commonhttp.WriteJSON(w, nethttp.StatusCreated, created)
}

// listMemberships godoc
// @Summary List memberships by user_id
// @Tags memberships
// @Produce json
// @Param user_id query int true "User ID"
// @Success 200 {array} domain.Membership
// @Failure 400 {object} commonhttp.ErrorResponse
// @Failure 500 {object} commonhttp.ErrorResponse
// @Router /memberships [get]
func (h *Handler) listByUserID(w nethttp.ResponseWriter, r *nethttp.Request) {
	userIDRaw := r.URL.Query().Get("user_id")
	userID, err := strconv.ParseInt(userIDRaw, 10, 64)
	if err != nil {
		commonhttp.WriteError(w, nethttp.StatusBadRequest, errors.New("invalid user_id"))
		return
	}

	items, err := h.uc.ListByUserID(r.Context(), userID)
	if err != nil {
		commonhttp.WriteError(w, nethttp.StatusBadRequest, err)
		return
	}
	commonhttp.WriteJSON(w, nethttp.StatusOK, items)
}
