package interview

import (
	"context"
	"testing"

	"level-up-backend/internal/modules/course"
)

func TestModuleWeight(t *testing.T) {
	avg := map[string]float64{"weak": 20, "strong": 95}

	// Unseen module → neutral (mid-scale), so it stays discoverable.
	if w := moduleWeight("unseen", avg); w != pickWeightNeutral {
		t.Fatalf("unseen weight = %v, want %v", w, pickWeightNeutral)
	}

	// A weak module outweighs a strong one; a mastered module keeps the floor.
	weak, strong := moduleWeight("weak", avg), moduleWeight("strong", avg)
	if !(weak > strong) {
		t.Fatalf("weak (%v) should outweigh strong (%v)", weak, strong)
	}
	if strong < pickWeightFloor {
		t.Fatalf("strong weight %v dropped below floor %v", strong, pickWeightFloor)
	}
}

func TestEmaLevel(t *testing.T) {
	// alpha 0.4: 0.4*90 + 0.6*40 = 36 + 24 = 60.
	if got := emaLevel(40, 90); got != 60 {
		t.Fatalf("emaLevel(40, 90) = %d, want 60", got)
	}
	// Equal prev and score is a fixed point.
	if got := emaLevel(70, 70); got != 70 {
		t.Fatalf("emaLevel(70, 70) = %d, want 70", got)
	}
}

func TestConfidenceFor(t *testing.T) {
	cases := map[int]string{1: ConfidenceLow, 2: ConfidenceMedium, 3: ConfidenceMedium, 4: ConfidenceHigh, 9: ConfidenceHigh}
	for samples, want := range cases {
		if got := confidenceFor(samples); got != want {
			t.Fatalf("confidenceFor(%d) = %q, want %q", samples, got, want)
		}
	}
}

// buildPool makes n questions per module, ids prefixed by module for readability.
func buildPool(perModule int, modules ...string) []course.Question {
	pool := make([]course.Question, 0, perModule*len(modules))
	for _, m := range modules {
		for i := range perModule {
			pool = append(pool, course.Question{Module: m})
			pool[len(pool)-1].ID = m + "-" + string(rune('a'+i))
		}
	}

	return pool
}

func TestPickQuestionsDistinctAndBounded(t *testing.T) {
	pool := buildPool(4, "a", "b") // 8 questions

	got := pickQuestions(pool, 5, nil) // nil map → uniform
	if len(got) != 5 {
		t.Fatalf("picked %d, want 5", len(got))
	}

	seen := map[string]bool{}
	for _, q := range got {
		if seen[q.ID] {
			t.Fatalf("duplicate question %q in pick", q.ID)
		}
		seen[q.ID] = true
	}

	// Asking for more than the pool holds is clamped to the pool size.
	if all := pickQuestions(pool, 99, nil); len(all) != len(pool) {
		t.Fatalf("clamp: picked %d, want %d", len(all), len(pool))
	}
}

func TestPickQuestionsBiasesWeakModule(t *testing.T) {
	pool := buildPool(5, "weak", "strong")
	avg := map[string]float64{"weak": 20, "strong": 95}

	const trials = 2000
	var weak int
	for range trials {
		for _, q := range pickQuestions(pool, 1, avg) {
			if q.Module == "weak" {
				weak++
			}
		}
	}

	// Weights: weak 110, strong 35 per question → P(weak) ≈ 0.76. Assert a clear
	// majority (loose bound tolerates RNG variance).
	if weak < trials*6/10 {
		t.Fatalf("weak module picked %d/%d — expected a clear majority", weak, trials)
	}
}

func TestResolveKind(t *testing.T) {
	// A placement is server-fixed: short, non-adaptive, regardless of the request's
	// questionCount/adaptive.
	if k, n, a := resolveKind(&CreateInterviewRequest{Kind: "placement", QuestionCount: 20, Adaptive: true}); k != KindPlacement || n != PlacementQuestionCount || a {
		t.Fatalf("placement resolve = %v/%d/%v, want %v/%d/false", k, n, a, KindPlacement, PlacementQuestionCount)
	}

	// A regular interview (empty kind) honors the request.
	if k, n, a := resolveKind(&CreateInterviewRequest{QuestionCount: 8, Adaptive: true}); k != KindInterview || n != 8 || !a {
		t.Fatalf("interview resolve = %v/%d/%v, want %v/8/true", k, n, a, KindInterview)
	}
}

func TestUpdateTopicProgressSeedsThenBlends(t *testing.T) {
	repo := &stubRepo{}
	svc := &Service{repo: repo}
	session := &Session{UserID: "u1", CourseID: "c1"}
	ctx := context.Background()

	// First completion seeds the level directly.
	svc.updateTopicProgress(ctx, session, 40)
	tp, found, _ := repo.FindTopicProgress(ctx, "u1", "c1")
	if !found || tp.Level != 40 || tp.Samples != 1 || tp.Confidence != ConfidenceLow {
		t.Fatalf("after seed: %+v (found=%v)", tp, found)
	}
	if tp.LastPracticedAt == nil || tp.LastImprovedAt == nil {
		t.Fatalf("seed should stamp practiced/improved: %+v", tp)
	}

	// Second, higher-scoring completion blends via EMA and bumps confidence.
	svc.updateTopicProgress(ctx, session, 90)
	tp, _, _ = repo.FindTopicProgress(ctx, "u1", "c1")
	if tp.Level != 60 { // 0.4*90 + 0.6*40, rounded
		t.Fatalf("after blend: level = %d, want 60", tp.Level)
	}
	if tp.Samples != 2 || tp.Confidence != ConfidenceMedium {
		t.Fatalf("after blend: samples/confidence wrong: %+v", tp)
	}
}

func TestUpdateTopicProgressKeepsImprovedAtWhenNotImproved(t *testing.T) {
	repo := &stubRepo{}
	svc := &Service{repo: repo}
	session := &Session{UserID: "u1", CourseID: "c1"}
	ctx := context.Background()

	svc.updateTopicProgress(ctx, session, 80)
	first, _, _ := repo.FindTopicProgress(ctx, "u1", "c1")
	improvedAt := first.LastImprovedAt

	// A worse result lowers the level; lastImprovedAt must not move forward.
	svc.updateTopicProgress(ctx, session, 20)
	tp, _, _ := repo.FindTopicProgress(ctx, "u1", "c1")
	if tp.Level >= first.Level {
		t.Fatalf("level should drop: %d -> %d", first.Level, tp.Level)
	}
	if tp.LastImprovedAt != improvedAt {
		t.Fatalf("lastImprovedAt moved on a non-improvement")
	}
}
