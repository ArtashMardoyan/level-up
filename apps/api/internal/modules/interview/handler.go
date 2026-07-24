package interview

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"level-up-backend/internal/modules/user"
	"level-up-backend/internal/shared"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(r *gin.Engine, auth gin.HandlerFunc) {
	interviews := r.Group("/interviews", auth)
	interviews.POST("", h.Create)
	interviews.GET("", h.List)
	interviews.POST("/transcribe", h.Transcribe)
	interviews.GET("/summary", h.Summary)
	interviews.GET("/insights", h.Insights)
	interviews.GET("/:id", h.Get)
	interviews.POST("/:id/answers/:questionId", h.SubmitAnswer)
	interviews.POST("/:id/answers/:questionId/stream", h.SubmitAnswerStream)
	interviews.POST("/:id/complete", h.Complete)
	interviews.GET("/:id/report", h.Report)
}

func (h *Handler) Create(c *gin.Context) {
	caller, ok := contextUser(c)
	if !ok {
		shared.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req CreateInterviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		shared.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	view, err := h.service.Start(c.Request.Context(), caller.ID, caller.Name, &req)
	if err != nil {
		writeError(c, err)
		return
	}

	shared.Created(c, view)
}

func (h *Handler) Get(c *gin.Context) {
	caller, ok := contextUser(c)
	if !ok {
		shared.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	view, err := h.service.Get(c.Request.Context(), caller.ID, c.Param("id"))
	if err != nil {
		writeError(c, err)
		return
	}

	shared.OK(c, view)
}

func (h *Handler) SubmitAnswer(c *gin.Context) {
	caller, ok := contextUser(c)
	if !ok {
		shared.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req SubmitAnswerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		shared.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	resp, err := h.service.SubmitAnswer(c.Request.Context(), caller.ID, c.Param("id"), c.Param("questionId"), req)
	if err != nil {
		writeError(c, err)
		return
	}

	shared.OK(c, resp)
}

// SubmitAnswerStream is the SSE variant of SubmitAnswer (docs/product/ai-chat/006). The
// service returns a non-nil error only for pre-stream failures (checks + the
// synchronous answer/index writes), where the sink is still untouched and a normal
// JSON error is valid; once streaming has begun it emits an SSE error frame and
// returns nil.
func (h *Handler) SubmitAnswerStream(c *gin.Context) {
	caller, ok := contextUser(c)
	if !ok {
		shared.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req SubmitAnswerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		shared.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	sink := newSSESink(c)
	if err := h.service.SubmitAnswerStream(c.Request.Context(), caller.ID, c.Param("id"), c.Param("questionId"), req, sink); err != nil {
		writeError(c, err)
	}
}

func (h *Handler) Complete(c *gin.Context) {
	caller, ok := contextUser(c)
	if !ok {
		shared.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	view, err := h.service.Complete(c.Request.Context(), caller.ID, c.Param("id"))
	if err != nil {
		writeError(c, err)
		return
	}

	shared.OK(c, view)
}

func (h *Handler) Report(c *gin.Context) {
	caller, ok := contextUser(c)
	if !ok {
		shared.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	view, err := h.service.Report(c.Request.Context(), caller.ID, c.Param("id"))
	if err != nil {
		writeError(c, err)
		return
	}

	shared.OK(c, view)
}

func (h *Handler) Transcribe(c *gin.Context) {
	if _, ok := contextUser(c); !ok {
		shared.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	fileHeader, err := c.FormFile("audio")
	if err != nil {
		shared.Error(c, http.StatusBadRequest, "audio file is required")
		return
	}

	file, err := fileHeader.Open()
	if err != nil {
		shared.Error(c, http.StatusBadRequest, "could not read audio file")
		return
	}
	defer func() { _ = file.Close() }()

	// The interview language (en/ru/hy) pins Whisper to the spoken language;
	// anything else is ignored so Whisper falls back to auto-detect.
	language := c.PostForm("language")
	if language != LangEN && language != LangRU && language != LangHY {
		language = ""
	}

	transcript, err := h.service.Transcribe(c.Request.Context(), file, fileHeader.Filename, language)
	if err != nil {
		writeError(c, err)
		return
	}

	shared.OK(c, TranscribeResponse{Transcript: transcript})
}

func (h *Handler) Summary(c *gin.Context) {
	caller, ok := contextUser(c)
	if !ok {
		shared.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	summary, err := h.service.Summary(c.Request.Context(), caller.ID)
	if err != nil {
		shared.Error(c, http.StatusInternalServerError, "failed to load interview summary")
		return
	}

	shared.OK(c, summary)
}

func (h *Handler) Insights(c *gin.Context) {
	caller, ok := contextUser(c)
	if !ok {
		shared.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	insights, err := h.service.Insights(c.Request.Context(), caller.ID)
	if err != nil {
		shared.Error(c, http.StatusInternalServerError, "failed to load insights")
		return
	}

	shared.OK(c, insights)
}

func (h *Handler) List(c *gin.Context) {
	caller, ok := contextUser(c)
	if !ok {
		shared.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	var q shared.PaginationQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		shared.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	result, err := h.service.List(c.Request.Context(), caller.ID, q)
	if err != nil {
		shared.Error(c, http.StatusInternalServerError, "failed to fetch interviews")
		return
	}

	shared.OK(c, result)
}

// writeError maps service sentinel errors to HTTP status codes.
func writeError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, ErrNotFound):
		shared.Error(c, http.StatusNotFound, "interview not found")
	case errors.Is(err, ErrCourseNotFound):
		shared.Error(c, http.StatusNotFound, "course not found")
	case errors.Is(err, ErrActiveSession):
		shared.Error(c, http.StatusConflict, "you already have an interview in progress")
	case errors.Is(err, ErrNotEditable):
		shared.Error(c, http.StatusConflict, "this interview is not in progress")
	case errors.Is(err, ErrQuestionNotIn):
		shared.Error(c, http.StatusBadRequest, "question is not part of this interview")
	case errors.Is(err, ErrNoQuestions):
		shared.Error(c, http.StatusUnprocessableEntity, "no questions available for this course")
	case errors.Is(err, ErrNoResults):
		shared.Error(c, http.StatusUnprocessableEntity, "answer at least one question first")
	case errors.Is(err, ErrVoiceUnavailable):
		shared.Error(c, http.StatusServiceUnavailable, "voice transcription is unavailable right now")
	default:
		shared.Error(c, http.StatusInternalServerError, "something went wrong")
	}
}

func contextUser(c *gin.Context) (user.User, bool) {
	val, exists := c.Get(shared.ContextUserKey)
	if !exists {
		return user.User{}, false
	}

	u, ok := val.(user.User)

	return u, ok
}
