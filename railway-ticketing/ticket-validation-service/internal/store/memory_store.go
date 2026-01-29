package store

import (
	"errors"
	"sync"
	"ticket-validation/internal/model"
	"time"

	"github.com/google/uuid"
)

var ErrNotFound = errors.New("ticket not found")
var ErrUsed = errors.New("ticket already used")
var ErrExpired = errors.New("ticket expired")

type TicketStore struct {
	mu              sync.Mutex
	tickets         map[string]*model.Ticket
	idempotencyKeys map[string]string
}

func NewTicketStore() *TicketStore {
	return &TicketStore{
		tickets:         make(map[string]*model.Ticket),
		idempotencyKeys: make(map[string]string),
	}
}

func (s *TicketStore) CreateTicket(origin, destination string, validUntil time.Time) *model.Ticket {
	s.mu.Lock()
	defer s.mu.Unlock()

	id := uuid.NewString()

	ticket := &model.Ticket{
		TicketID:    id,
		Origin:      origin,
		Destination: destination,
		ValidDate:   validUntil,
		Used:        false,
	}

	s.tickets[id] = ticket
	return ticket
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

func (s *TicketStore) CreateTicketIdempotent(
	idempotencyKey string,
	origin string,
	destination string,
	validUntil time.Time,
) *model.Ticket {

	s.mu.Lock()
	defer s.mu.Unlock()

	if ticketID, exists := s.idempotencyKeys[idempotencyKey]; exists {
		return s.tickets[ticketID]
	}

	id := uuid.NewString()

	ticket := &model.Ticket{
		TicketID:    id,
		Origin:      origin,
		Destination: destination,
		ValidDate:   validUntil,
		Used:        false,
	}

	s.tickets[id] = ticket
	s.idempotencyKeys[idempotencyKey] = id

	return ticket
}
