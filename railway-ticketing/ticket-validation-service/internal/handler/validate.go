package handler

import (
	"encoding/json"
	"net/http"

	"ticket-validation/internal/service"
)

type ValidationRequest struct {
	TicketID   string `json:"ticketId"`
	GateOrigin string `json:"gateOrigin"`
}

type ValidationResponse struct {
	Status string `json:"status"`
	Reason string `json:"reason"`
}

func ValidateHandler(svc *service.ValidationService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req ValidationRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request", http.StatusBadRequest)
			return
		}

		status, reason := svc.Validate(req.TicketID, req.GateOrigin)

		resp := ValidationResponse{Status: status, Reason: reason}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}
}
