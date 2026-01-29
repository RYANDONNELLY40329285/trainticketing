package main

import (
	"log"
	"net/http"

	"ticket-validation/internal/handler"
	"ticket-validation/internal/service"
	"ticket-validation/internal/store"
)

func main() {
	store := store.NewTicketStore()
	store.Seed()

	svc := service.NewValidationService(store)

	http.HandleFunc("/tickets", handler.CreateTicketHandler(store))
	http.HandleFunc("/validate", handler.ValidateHandler(svc))

	log.Println("Ticket validation service running on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))

}
