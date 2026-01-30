package main

import (
	"log"
	"net/http"

	"ticket-validation/internal/handler"
	"ticket-validation/internal/metrics"
	"ticket-validation/internal/service"
	"ticket-validation/internal/store"

	"github.com/joho/godotenv"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {

	err := godotenv.Load()

	if err != nil {
		log.Println(" No .env file found, relying on environment variables")
	}

	store := store.NewTicketStore()

	svc := service.NewValidationService(store)
	metrics.Register()

	http.HandleFunc("/tickets", handler.CreateTicketHandler(store))

	http.HandleFunc(
		"/validate",
		handler.RequireInternalToken(
			handler.ValidateHandler(svc),
		),
	)

	http.Handle("/metrics", promhttp.Handler())

	http.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	log.Println("Ticket validation service running on :8080")
	log.Fatal(http.ListenAndServe("0.0.0.0:8080", nil))

}
