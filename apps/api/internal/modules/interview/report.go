package interview

import (
	"sort"
	"time"
)

// aggregate rolls per-answer results into a FinalReport (docs/interview/004/009).
// No AI. Scores average over the session's question count (unanswered → 0).
func aggregate(session *Session, results []QuestionResult) FinalReport {
	var sumScore, sumCorrect, sumDepth, sumComm, sumStruct int
	for i := range results {
		sumScore += results[i].Score
		sumCorrect += results[i].Correctness
		sumDepth += results[i].Depth
		sumComm += results[i].Communication
		sumStruct += results[i].Structure
	}

	n := session.QuestionCount
	if n < 1 {
		n = len(results)
	}
	if n < 1 {
		n = 1
	}

	overall := sumScore / n

	report := FinalReport{
		InterviewID:     session.ID,
		OverallScore:    overall,
		Verdict:         verdict(overall, session.Language),
		Correctness:     sumCorrect / n,
		Depth:           sumDepth / n,
		Communication:   sumComm / n,
		Structure:       sumStruct / n,
		Strengths:       rollUpStrengths(results),
		Weaknesses:      rollUpWeaknesses(results),
		Recommendations: recommendations(session, results),
		GeneratedAt:     time.Now(),
	}

	return report
}

// verdict bands (0–100). Thresholds and colors mirror the design source (ivSC /
// ivVerdict in Level Up.dc.html) — the FE scoreColor helper (src/utils/interview.js)
// uses the same 80/65 bands.
func verdict(score int, lang string) string {
	switch {
	case score >= 80:
		return verdictText(lang, "strong")
	case score >= 65:
		return verdictText(lang, "solid")
	default:
		return verdictText(lang, "needsWork")
	}
}

func verdictText(lang, kind string) string {
	en := map[string]string{
		"strong":    "Strong performance",
		"solid":     "Solid, with gaps",
		"needsWork": "Needs practice",
	}
	ru := map[string]string{
		"strong":    "Отличный результат",
		"solid":     "Хорошо, но есть пробелы",
		"needsWork": "Нужно больше практики",
	}
	if lang == LangRU {
		return ru[kind]
	}

	return en[kind]
}

// rollUpStrengths / rollUpWeaknesses collect the highest- and lowest-scoring
// answers' bullets, de-duplicated, capped to keep the report readable.
func rollUpStrengths(results []QuestionResult) StringList {
	sorted := sortedByScore(results, true)

	return collectBullets(sorted, func(r *QuestionResult) []string { return r.Strengths }, 5)
}

func rollUpWeaknesses(results []QuestionResult) StringList {
	sorted := sortedByScore(results, false)

	return collectBullets(sorted, func(r *QuestionResult) []string { return r.Weaknesses }, 5)
}

func sortedByScore(results []QuestionResult, desc bool) []QuestionResult {
	out := make([]QuestionResult, len(results))
	copy(out, results)
	sort.SliceStable(out, func(i, j int) bool {
		if desc {
			return out[i].Score > out[j].Score
		}

		return out[i].Score < out[j].Score
	})

	return out
}

func collectBullets(results []QuestionResult, pick func(*QuestionResult) []string, limit int) StringList {
	seen := make(map[string]bool)
	out := StringList{}
	for i := range results {
		for _, b := range pick(&results[i]) {
			if b == "" || seen[b] {
				continue
			}
			seen[b] = true
			out = append(out, b)
			if len(out) >= limit {
				return out
			}
		}
	}

	return out
}

// recommendations produces the ranked "next steps" strings (docs/interview/009,
// MVP: derived text, no separate table). Weakest area first.
func recommendations(session *Session, results []QuestionResult) StringList {
	weakest := sortedByScore(results, false)
	recs := StringList{}

	if len(weakest) > 0 && weakest[0].Score < 70 {
		recs = append(recs, recText(session.Language, "study"))
	}
	recs = append(recs, recText(session.Language, "interview"), recText(session.Language, "structure"))

	return recs
}

func recText(lang, kind string) string {
	en := map[string]string{
		"study":     "Revisit the topics from the questions you scored lowest on.",
		"interview": "Try another interview on this course to reinforce what you practiced.",
		"structure": "Work on structuring answers: lead with the key point, then add detail.",
	}
	ru := map[string]string{
		"study":     "Повторите темы вопросов, где у вас самый низкий балл.",
		"interview": "Пройдите ещё одно интервью по этому курсу, чтобы закрепить материал.",
		"structure": "Поработайте над структурой ответа: сначала главное, потом детали.",
	}
	if lang == LangRU {
		return ru[kind]
	}

	return en[kind]
}

// degraded marks a result as a failed evaluation that still lets the chat
// continue (docs/interview/006).
func degraded(base *QuestionResult, lang string) QuestionResult {
	base.EvalStatus = EvalFailed
	base.Feedback = failedFeedback(lang)

	return *base
}

func failedFeedback(lang string) string {
	if lang == LangRU {
		return "Не удалось оценить этот ответ — он всё равно засчитан, попробуйте следующий вопрос."
	}

	return "Couldn't evaluate this answer — it still counts, try the next one."
}

func skippedFeedback(lang string) string {
	if lang == LangRU {
		return "Вопрос пропущен."
	}

	return "Question skipped."
}

// skippedReaction is the deterministic chat transition after a skipped answer —
// used instead of the AI's own reaction, which isn't reliable about honoring a
// skip (docs/interview/004).
func skippedReaction(lang string) string {
	if lang == LangRU {
		return "Хорошо, пропустим этот. Дальше:"
	}

	return "No worries, let's move on."
}
