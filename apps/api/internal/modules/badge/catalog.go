package badge

// Category groups badges for display and, more importantly, selects which
// measured value awards them (a streak-day count, a reviewed-question count, an
// interview score, or a completed-interview count).
type Category string

const (
	CategoryInterview Category = "interview" // completed-interview count
	CategoryScore     Category = "score"     // a single interview's overall score
	CategoryStreak    Category = "streak"    // consecutive-day activity streak
	CategoryReview    Category = "review"    // reviewed-question count (all courses)
)

// Tier is a purely visual weight (bronze/silver/gold) the client maps to an accent.
type Tier string

const (
	TierBronze Tier = "bronze"
	TierSilver Tier = "silver"
	TierGold   Tier = "gold"
)

// Definition is one catalog entry. The catalog is code-defined (not stored):
// only the fact that a user earned a badge, and when, lives in the DB. The
// client owns the localized name/description/icon, keyed by ID — the same
// convention as notifications (wording never lives on the server).
type Definition struct {
	ID        string
	Category  Category
	Threshold int
	Tier      Tier
}

// Catalog is the ordered badge set. Order is the display order in the profile
// trophy case. Thresholds are inclusive minimums for the category's value.
var Catalog = []Definition{
	{ID: "interview_first", Category: CategoryInterview, Threshold: 1, Tier: TierBronze},
	{ID: "interview_5", Category: CategoryInterview, Threshold: 5, Tier: TierBronze},
	{ID: "interview_10", Category: CategoryInterview, Threshold: 10, Tier: TierSilver},
	{ID: "interview_25", Category: CategoryInterview, Threshold: 25, Tier: TierGold},

	{ID: "score_90", Category: CategoryScore, Threshold: 90, Tier: TierSilver},
	{ID: "score_100", Category: CategoryScore, Threshold: 100, Tier: TierGold},

	{ID: "streak_3", Category: CategoryStreak, Threshold: 3, Tier: TierBronze},
	{ID: "streak_7", Category: CategoryStreak, Threshold: 7, Tier: TierBronze},
	{ID: "streak_14", Category: CategoryStreak, Threshold: 14, Tier: TierSilver},
	{ID: "streak_30", Category: CategoryStreak, Threshold: 30, Tier: TierSilver},
	{ID: "streak_100", Category: CategoryStreak, Threshold: 100, Tier: TierGold},

	{ID: "review_10", Category: CategoryReview, Threshold: 10, Tier: TierBronze},
	{ID: "review_25", Category: CategoryReview, Threshold: 25, Tier: TierSilver},
	{ID: "review_50", Category: CategoryReview, Threshold: 50, Tier: TierSilver},
	{ID: "review_100", Category: CategoryReview, Threshold: 100, Tier: TierGold},
}

// reached returns the IDs of every badge in a category whose threshold the given
// value meets or exceeds. Using >= (not ==) makes awarding idempotent and robust:
// a value that jumps past a threshold still earns the ones below it, and the
// service's dedup skips any already held.
func reached(cat Category, value int) []string {
	var ids []string
	for _, d := range Catalog {
		if d.Category == cat && value >= d.Threshold {
			ids = append(ids, d.ID)
		}
	}

	return ids
}
