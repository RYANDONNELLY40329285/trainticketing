package store

import (
	"errors"
	"sync"
	"ticket-validation/internal/metrics"
	"ticket-validation/internal/model"
	"time"

	"github.com/google/uuid"
)

var ErrNotFound = errors.New("ticket not found")
var ErrUsed = errors.New("ticket already used")
var ErrExpired = errors.New("ticket expired")

type idempotencyEntry struct {
	ticketID  string
	expiresAt time.Time
}

type TicketStore struct {
	mu              sync.Mutex
	tickets         map[string]*model.Ticket
	idempotencyKeys map[string]idempotencyEntry
}

func NewTicketStore() *TicketStore {
	return &TicketStore{
		tickets:         make(map[string]*model.Ticket),
		idempotencyKeys: make(map[string]idempotencyEntry),
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

	if ticket.Destination != gateOrigin {
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

	now := time.Now()
	ttl := 10 * time.Minute

	if entry, exists := s.idempotencyKeys[idempotencyKey]; exists {
		if entry.expiresAt.After(now) {
			metrics.TicketsCreatedIdempotentReuseTotal.Inc()
			return s.tickets[entry.ticketID]
		}

		delete(s.idempotencyKeys, idempotencyKey)
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
	s.idempotencyKeys[idempotencyKey] = idempotencyEntry{
		ticketID:  id,
		expiresAt: now.Add(ttl),
	}

	return ticket
}
