package service

import (
	"ticket-validation/internal/metrics"
	"ticket-validation/internal/store"
)

type ValidationService struct {
	store *store.TicketStore
}

func NewValidationService(store *store.TicketStore) *ValidationService {
	return &ValidationService{store: store}
}

func (v *ValidationService) Validate(ticketID, gateOrigin string) (string, string) {
	err := v.store.Validate(ticketID, gateOrigin)
	if err == nil {
		return "VALID", "OK"
	}

	metrics.TicketValidationDeniedTotal.Inc()

	switch err {
	case store.ErrNotFound:
		return "DENIED", "NOT_FOUND"
	case store.ErrUsed:
		return "DENIED", "ALREADY_USED"
	case store.ErrExpired:
		return "DENIED", "EXPIRED"
	default:
		return "DENIED", err.Error()
	}
}
