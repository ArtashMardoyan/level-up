package interview

import (
	"context"
	"testing"
)

// TestInsightsRollup checks the read-side aggregation: topics pass through
// weakest-first, the overall rubric is answer-count-weighted, and the weakest
// axis is identified.
func TestInsightsRollup(t *testing.T) {
	repo := &stubRepo{insights: []TopicInsight{
		// weakest topic first (as the repo orders it)
		{
			CourseSlug: "go", CourseTitle: "Go", Accent: "#22d3ee", AvgScore: 40, Answered: 3,
			Correctness: 45, Depth: 30, Communication: 60, Structure: 50,
		},
		{
			CourseSlug: "backend", CourseTitle: "Backend", Accent: "#fbbf24", AvgScore: 80, Answered: 1,
			Correctness: 85, Depth: 90, Communication: 70, Structure: 75,
		},
	}}
	svc := &Service{repo: repo}

	view, err := svc.Insights(context.Background(), "u1")
	if err != nil {
		t.Fatalf("Insights: %v", err)
	}

	if view.TotalAnswered != 4 {
		t.Fatalf("totalAnswered = %d, want 4", view.TotalAnswered)
	}
	if len(view.Topics) != 2 || view.Topics[0].CourseSlug != "go" {
		t.Fatalf("topics not weakest-first: %+v", view.Topics)
	}
	if view.Topics[0].AvgScore != 40 || view.Topics[1].AvgScore != 80 {
		t.Fatalf("topic avg scores wrong: %+v", view.Topics)
	}

	// Depth weighted mean = (30*3 + 90*1) / 4 = 45; it's the lowest axis.
	if view.Rubric.Depth != 45 {
		t.Fatalf("weighted depth = %d, want 45", view.Rubric.Depth)
	}
	if view.Rubric.Weakest != "depth" {
		t.Fatalf("weakest = %q, want depth", view.Rubric.Weakest)
	}
}

// TestInsightsEmpty checks a user with no evaluated answers gets a safe zero view.
func TestInsightsEmpty(t *testing.T) {
	svc := &Service{repo: &stubRepo{}}

	view, err := svc.Insights(context.Background(), "u1")
	if err != nil {
		t.Fatalf("Insights: %v", err)
	}

	if view.TotalAnswered != 0 || len(view.Topics) != 0 || view.Rubric.Weakest != "" {
		t.Fatalf("expected empty view, got %+v", view)
	}
}
