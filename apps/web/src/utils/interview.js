// Score band -> color. Mirrors the design source (ivSC in Level Up.dc.html)
// and the backend verdict() bands (level-up-backend/internal/modules/interview/report.go).
export function scoreColor(n) {
  if (n >= 80) return '#4ade80'
  if (n >= 65) return '#fbbf24'
  return '#fb7185'
}
