package health_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"level-up-backend/internal/modules/health"

	"github.com/gin-gonic/gin"
)

func TestPingReturnsPong(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	// /ping is dependency-free, so a nil DB is fine for this test.
	health.NewHandler(nil).RegisterRoutes(r)

	req := httptest.NewRequestWithContext(t.Context(), http.MethodGet, "/ping", http.NoBody)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}

	var body struct {
		Data string `json:"data"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to decode body: %v", err)
	}

	if body.Data != "pong" {
		t.Fatalf("expected data %q, got %q", "pong", body.Data)
	}
}
