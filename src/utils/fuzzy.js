// Lightweight fzf-style fuzzy matching for client-side search. Case-insensitive
// subsequence match with a score that favors contiguous runs and word starts,
// plus the matched character index ranges (for highlighting). No dependencies.

export function fuzzyMatch(query, text) {
  if (!query) return { ranges: [], score: 0 }
  if (!text) return null

  const q = query.toLowerCase()
  const t = text.toLowerCase()

  // Greedy left-to-right subsequence: every query char must appear, in order.
  const indices = []
  let ti = 0
  for (let qi = 0; qi < q.length; qi++) {
    const ch = q[qi]
    let found = -1
    while (ti < t.length) {
      if (t[ti] === ch) {
        found = ti
        ti++
        break
      }
      ti++
    }
    if (found === -1) return null
    indices.push(found)
  }

  // Score: reward adjacent matches and matches at a word boundary; penalize gaps
  // and a late first match.
  let score = 0
  for (let i = 0; i < indices.length; i++) {
    const idx = indices[i]
    if (i > 0 && idx === indices[i - 1] + 1) score += 8
    else if (i > 0) score -= Math.min(idx - indices[i - 1] - 1, 6)
    const prev = idx > 0 ? t[idx - 1] : ' '
    if (/[\s\-_/.,:]/.test(prev)) score += 6
  }
  score -= indices[0] * 0.2

  return { ranges: toRanges(indices), score }
}

// Collapse sorted indices into [start, end) ranges for highlighting.
function toRanges(indices) {
  const ranges = []
  for (const idx of indices) {
    const last = ranges[ranges.length - 1]
    if (last && idx === last[1]) last[1] = idx + 1
    else ranges.push([idx, idx + 1])
  }
  return ranges
}

// Rank a result by its highlightable title first, falling back to a plain
// substring test over secondary body text (not highlighted). Title matches
// always outrank body-only matches. Returns { score, ranges } or null.
export function scoreMatch(query, title, body) {
  const match = fuzzyMatch(query, title)
  if (match) return { score: match.score + 1000, ranges: match.ranges }
  if (body && body.toLowerCase().includes(query.toLowerCase())) return { ranges: [], score: 0 }
  return null
}
