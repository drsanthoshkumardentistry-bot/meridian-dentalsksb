// Leitner spaced-repetition (5 boxes). Mirrors public.review_flashcard() in SQL.
export const BOX_DAYS = [0, 1, 3, 7, 14] // box 1..5
const DAY = 86_400_000

export function nextState(prev, correct, now = Date.now()) {
  const box = correct ? Math.min((prev?.box ?? 1) + 1, 5) : 1
  return {
    box,
    due_at: new Date(now + BOX_DAYS[box - 1] * DAY).toISOString(),
    last_reviewed_at: new Date(now).toISOString(),
    review_count: (prev?.review_count ?? 0) + 1,
    lapse_count: (prev?.lapse_count ?? 0) + (correct ? 0 : 1),
  }
}

// New cards (no progress row) are always due.
export function isDue(progress, now = Date.now()) {
  return !progress || new Date(progress.due_at).getTime() <= now
}

export function dueCards(cards, progressMap, now = Date.now()) {
  return cards
    .filter((c) => isDue(progressMap[c.id], now))
    .sort((a, b) => (progressMap[a.id]?.box ?? 0) - (progressMap[b.id]?.box ?? 0))
}

export function boxCounts(cards, progressMap) {
  const counts = [0, 0, 0, 0, 0, 0] // index 0 = new
  for (const c of cards) counts[progressMap[c.id]?.box ?? 0]++
  return counts
}
