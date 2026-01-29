package store

import (
	"sync"
	"testing"
	"time"
)

func TestIdempotentCreate_IsConcurrencySafe(t *testing.T) {
	store := NewTicketStore()

	const goroutines = 50
	const key = "same-key"

	var wg sync.WaitGroup
	results := make(chan string, goroutines)

	for i := 0; i < goroutines; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			ticket := store.CreateTicketIdempotent(
				key,
				"BEL",
				"DUB",
				time.Now().AddDate(0, 0, 1),
			)
			results <- ticket.TicketID
		}()
	}

	wg.Wait()
	close(results)

	var first string
	for id := range results {
		if first == "" {
			first = id
		} else if id != first {
			t.Fatalf("expected same ticket ID, got %s and %s", first, id)
		}
	}
}
