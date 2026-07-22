package health

import (
	"net/http"

	"level-up-backend/internal/shared"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Handler struct {
	db *gorm.DB
}

func NewHandler(db *gorm.DB) *Handler {
	return &Handler{db: db}
}

func (h *Handler) RegisterRoutes(r *gin.Engine) {
	r.GET("/ping", h.Ping)
	r.GET("/ready", h.Ready)
}

// Ping is a dependency-free liveness probe — point App Runner's health check here.
func (*Handler) Ping(c *gin.Context) {
	shared.OK(c, "pong")
}

// Ready is a readiness probe: it verifies the database is reachable and returns
// 503 when it is not, so a load balancer can drain the instance.
func (h *Handler) Ready(c *gin.Context) {
	sqlDB, err := h.db.DB()
	if err == nil {
		err = sqlDB.PingContext(c.Request.Context())
	}

	if err != nil {
		shared.Error(c, http.StatusServiceUnavailable, "database unavailable")
		return
	}

	shared.OK(c, "ready")
}
