package store

import (
	"errors"
	"sync"
	"ticket-validation/internal/model"
	"time"
)

var ErrNotFound = errors.New("ticket not found")
var ErrUsed = errors.New("ticket already used")
var ErrExpired = errors.New("ticket expired")

type TicketStore struct {
	mu      sync.Mutex
	tickets map[string]*model.Ticket
}

func NewTicketStore() *TicketStore {
	return &TicketStore{
		tickets: make(map[string]*model.Ticket),
	}
}

func (s *TicketStore) Seed() {
	s.tickets["TK0001"] = &model.Ticket{
		TicketID:    "TK0001",
		Origin:      "BEL",
		Destination: "DUB",
		ValidDate:   time.Now().AddDate(0, 0, 1),
		Used:        false,
	}
}

func (s *TicketStore) Validate(ticketID, gateOrigin string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	ticket, ok := s.tickets[ticketID]
	if !ok {
		return ErrNotFound
	}

	if ticket.Used {
		return ErrUsed
	}

	if ticket.ValidDate.Before(time.Now()) {
		return ErrExpired
	}

	if ticket.Origin != gateOrigin {
		return errors.New("route mismatch")
	}

	ticket.Used = true
	return nil
}
