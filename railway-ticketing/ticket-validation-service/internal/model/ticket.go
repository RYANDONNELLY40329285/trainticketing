package model

import "time"

type Ticket struct {
	TicketID    string
	Origin      string
	Destination string
	ValidDate   time.Time
	Used        bool
}
