package handler

import (
	"encoding/json"
	"net/http"
	"os"

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

		token := r.Header.Get("X-Internal-Token")
		if token != os.Getenv("INTERNAL_SERVICE_TOKEN") {
			http.Error(w, "forbidden", http.StatusForbidden)
			return
		}

		var req ValidationRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request", http.StatusBadRequest)
			return
		}

		status, reason := svc.Validate(req.TicketID, req.GateOrigin)
		json.NewEncoder(w).Encode(ValidationResponse{status, reason})
	}
}
