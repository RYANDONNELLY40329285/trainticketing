package handler

import (
	"net/http"
	"os"
)

func RequireInternalToken(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		expected := os.Getenv("INTERNAL_SERVICE_TOKEN")
		token := r.Header.Get("X-Internal-Token")

		if expected == "" || token != expected {
			http.Error(w, "forbidden", http.StatusForbidden)
			return
		}

		next(w, r)
	}
}
