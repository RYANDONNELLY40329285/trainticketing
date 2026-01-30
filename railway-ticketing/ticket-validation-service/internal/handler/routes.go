package handler

import (
	"encoding/json"
	"net/http"
)

type Route struct {
	Origin      string `json:"origin"`
	Destination string `json:"destination"`
}

func RoutesHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		routes := map[string][]string{
			"Edinburgh":  {"Glasgow"},
			"Belfast":    {"Dublin"},
			"Manchester": {"Liverpool"},
		}

		var result []map[string]any
		for origin, destinations := range routes {
			result = append(result, map[string]any{
				"origin":       origin,
				"destinations": destinations,
			})
		}

		json.NewEncoder(w).Encode(result)
	}
}
