package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"ticket-validation/internal/store"
)

type CreateTicketRequest struct {
	Origin      string `json:"origin"`
	Destination string `json:"destination"`
	ValidDays   int    `json:"validDays"`
}

type CreateTicketResponse struct {
	TicketID string `json:"ticketId"`
}

func CreateTicketHandler(store *store.TicketStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		idempotencyKey := r.Header.Get("Idempotency-Key")
		if idempotencyKey == "" {
			http.Error(w, "missing Idempotency-Key header", http.StatusBadRequest)
			return
		}

		var req CreateTicketRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request", http.StatusBadRequest)
			return
		}

		if req.Origin == "" || req.Destination == "" || req.ValidDays <= 0 {
			http.Error(w, "invalid ticket data", http.StatusBadRequest)
			return
		}

		ticket := store.CreateTicketIdempotent(
			idempotencyKey,
			req.Origin,
			req.Destination,
			time.Now().AddDate(0, 0, req.ValidDays),
		)

		resp := CreateTicketResponse{TicketID: ticket.TicketID}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}
}
