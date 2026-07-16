package course

import (
	"context"
	"errors"
	"time"

	"gorm.io/gorm"
)

const defaultLang = "en"

var (
	ErrCourseNotFound   = errors.New("course not found")
	ErrQuestionNotFound = errors.New("question not found")
)

type Service struct {
	courses  CourseRepository
	progress ProgressRepository
}

func NewService(courses CourseRepository, progress ProgressRepository) *Service {
	return &Service{courses: courses, progress: progress}
}

func (s *Service) ListCourses(ctx context.Context) ([]CourseListItemDTO, error) {
	courses, err := s.courses.FindAllCourses(ctx)
	if err != nil {
		return nil, err
	}

	counts, err := s.courses.CountQuestionsByCourse(ctx)
	if err != nil {
		return nil, err
	}

	items := make([]CourseListItemDTO, 0, len(courses))
	for i := range courses {
		c := &courses[i]
		items = append(items, CourseListItemDTO{
			ID:            c.ID,
			Slug:          c.Slug,
			Title:         c.Title,
			Subtitle:      c.Subtitle,
			Emoji:         c.Emoji,
			Accent:        c.Accent,
			QuestionCount: counts[c.ID],
		})
	}

	return items, nil
}

func (s *Service) ListCoursesFull(ctx context.Context, lang string) ([]CourseDetailDTO, error) {
	courses, err := s.courses.FindAllCourses(ctx)
	if err != nil {
		return nil, err
	}

	out := make([]CourseDetailDTO, 0, len(courses))
	for i := range courses {
		questions, err := s.courses.FindQuestionsByCourse(ctx, courses[i].ID)
		if err != nil {
			return nil, err
		}

		out = append(out, toCourseDetail(&courses[i], questions, lang))
	}

	return out, nil
}

func (s *Service) GetCourse(ctx context.Context, slug, lang string) (CourseDetailDTO, error) {
	c, err := s.courses.FindCourseBySlug(ctx, slug)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return CourseDetailDTO{}, ErrCourseNotFound
	}
	if err != nil {
		return CourseDetailDTO{}, err
	}

	questions, err := s.courses.FindQuestionsByCourse(ctx, c.ID)
	if err != nil {
		return CourseDetailDTO{}, err
	}

	return toCourseDetail(&c, questions, lang), nil
}

func (s *Service) CourseProgress(ctx context.Context, userID, slug string) (ProgressResponseDTO, error) {
	c, err := s.courses.FindCourseBySlug(ctx, slug)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ProgressResponseDTO{}, ErrCourseNotFound
	}
	if err != nil {
		return ProgressResponseDTO{}, err
	}

	rows, err := s.progress.FindByUserAndCourse(ctx, userID, c.ID)
	if err != nil {
		return ProgressResponseDTO{}, err
	}

	return toProgressResponse(rows), nil
}

func toCourseDetail(c *Course, questions []Question, lang string) CourseDetailDTO {
	dtos := make([]QuestionDTO, 0, len(questions))
	for i := range questions {
		dtos = append(dtos, localizeQuestion(&questions[i], lang))
	}

	return CourseDetailDTO{
		ID:        c.ID,
		Slug:      c.Slug,
		Title:     c.Title,
		Subtitle:  c.Subtitle,
		Emoji:     c.Emoji,
		Accent:    c.Accent,
		Questions: dtos,
	}
}

func (s *Service) UpsertProgress(ctx context.Context, userID, questionID string, dto UpsertProgressDTO) (ProgressStateDTO, error) {
	if _, err := s.courses.FindQuestionByID(ctx, questionID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ProgressStateDTO{}, ErrQuestionNotFound
		}

		return ProgressStateDTO{}, err
	}

	p, err := s.progress.FindOne(ctx, userID, questionID)
	isNew := errors.Is(err, gorm.ErrRecordNotFound)
	if err != nil && !isNew {
		return ProgressStateDTO{}, err
	}

	if isNew {
		p = UserQuestionProgress{UserID: userID, QuestionID: questionID}
	}

	if dto.Reviewed != nil {
		p.Reviewed = *dto.Reviewed
		if p.Reviewed && p.ReviewedAt == nil {
			now := time.Now()
			p.ReviewedAt = &now
		}
	}

	if dto.Favorite != nil {
		p.Favorite = *dto.Favorite
	}

	if isNew {
		err = s.progress.Create(ctx, &p)
	} else {
		err = s.progress.Save(ctx, &p)
	}
	if err != nil {
		return ProgressStateDTO{}, err
	}

	return ProgressStateDTO{QuestionID: questionID, Reviewed: p.Reviewed, Favorite: p.Favorite}, nil
}

func (s *Service) BulkUpsert(ctx context.Context, userID string, dto BulkProgressDTO) error {
	existing, err := s.progress.FindByUser(ctx, userID)
	if err != nil {
		return err
	}

	byQuestion := make(map[string]*UserQuestionProgress, len(existing))
	for i := range existing {
		byQuestion[existing[i].QuestionID] = &existing[i]
	}

	touched := make(map[string]*UserQuestionProgress)
	get := func(questionID string) *UserQuestionProgress {
		if p, ok := touched[questionID]; ok {
			return p
		}
		if p, ok := byQuestion[questionID]; ok {
			touched[questionID] = p
			return p
		}
		p := &UserQuestionProgress{UserID: userID, QuestionID: questionID}
		touched[questionID] = p
		return p
	}

	now := time.Now()
	for _, id := range dto.ReviewedIDs {
		p := get(id)
		if !p.Reviewed {
			p.Reviewed = true
			p.ReviewedAt = &now
		}
	}

	for _, id := range dto.FavoriteIDs {
		get(id).Favorite = true
	}

	for _, p := range touched {
		var persistErr error
		if p.ID == "" {
			persistErr = s.progress.Create(ctx, p)
		} else {
			persistErr = s.progress.Save(ctx, p)
		}
		if persistErr != nil {
			return persistErr
		}
	}

	return nil
}

func (s *Service) Summary(ctx context.Context, userID string) (ProgressSummaryDTO, error) {
	stats, err := s.progress.SummaryByUser(ctx, userID)
	if err != nil {
		return ProgressSummaryDTO{}, err
	}

	summary := ProgressSummaryDTO{ByCourse: make(map[string]CourseProgressCountDTO, len(stats))}
	for _, stat := range stats {
		summary.TotalReviewed += stat.Reviewed
		summary.TotalFavorites += stat.Favorites
		summary.ByCourse[stat.CourseID] = CourseProgressCountDTO{
			Reviewed:  stat.Reviewed,
			Favorites: stat.Favorites,
		}
	}

	return summary, nil
}

func toProgressResponse(rows []UserQuestionProgress) ProgressResponseDTO {
	resp := ProgressResponseDTO{ReviewedIDs: []string{}, FavoriteIDs: []string{}}
	for _, row := range rows {
		if row.Reviewed {
			resp.ReviewedIDs = append(resp.ReviewedIDs, row.QuestionID)
		}
		if row.Favorite {
			resp.FavoriteIDs = append(resp.FavoriteIDs, row.QuestionID)
		}
	}

	return resp
}

// localizeQuestion builds the outward question shape: it starts from the English
// text and overlays the requested language's non-empty fields, mirroring the
// frontend merge (audio is per-language and never inherited from English).
func localizeQuestion(q *Question, lang string) QuestionDTO {
	en := translationByLang(q.Translations, defaultLang)

	dto := QuestionDTO{ID: q.ID, Ref: q.Ref, Module: q.Module}
	if en != nil {
		dto.Question = en.Question
		dto.Answer = en.Answer
		dto.Bonus = en.Bonus
		dto.Audio = en.Audio
	}

	if lang != defaultLang {
		if loc := translationByLang(q.Translations, lang); loc != nil {
			if loc.Question != "" {
				dto.Question = loc.Question
			}
			if loc.Answer != "" {
				dto.Answer = loc.Answer
			}
			if loc.Bonus != "" {
				dto.Bonus = loc.Bonus
			}

			dto.Audio = loc.Audio
		}
	}

	return dto
}

func translationByLang(translations []QuestionTranslation, lang string) *QuestionTranslation {
	for i := range translations {
		if translations[i].Lang == lang {
			return &translations[i]
		}
	}

	return nil
}
