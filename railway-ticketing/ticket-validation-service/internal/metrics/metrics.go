package metrics

import "github.com/prometheus/client_golang/prometheus"

var (
	TicketsCreatedTotal = prometheus.NewCounter(
		prometheus.CounterOpts{
			Name: "tickets_created_total",
			Help: "Total number of tickets created",
		},
	)

	TicketsCreatedIdempotentReuseTotal = prometheus.NewCounter(
		prometheus.CounterOpts{
			Name: "tickets_created_idempotent_reuse_total",
			Help: "Number of ticket creations reused due to idempotency",
		},
	)

	TicketValidationRequestsTotal = prometheus.NewCounter(
		prometheus.CounterOpts{
			Name: "ticket_validation_requests_total",
			Help: "Total number of ticket validation requests",
		},
	)

	TicketValidationDeniedTotal = prometheus.NewCounter(
		prometheus.CounterOpts{
			Name: "ticket_validation_denied_total",
			Help: "Total number of denied ticket validations",
		},
	)
)

func Register() {
	prometheus.MustRegister(
		TicketsCreatedTotal,
		TicketsCreatedIdempotentReuseTotal,
		TicketValidationRequestsTotal,
		TicketValidationDeniedTotal,
	)
}
