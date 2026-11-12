// Pure helpers for the University PYQ bank. Question shape (from src/data/pyq/*.json):
//   { id, t: text, k: ['10m'|'5m'|'2m'], m: [marks], a: [[session, kind, marks]], c: sessions asked }
// Progress lives in progress.pyq: { [questionId]: flags } with DONE/SAVED bits,
// and { ['m:<subject>:<n>']: chosen option } for MCQs.

export const DONE = 1
export const SAVED = 2
export const KINDS = { '10m': '10 marks', '5m': '5 marks', '2m': '2 marks' }

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export const sessionKey = (s) => { const [m, y] = s.split(' '); return Number(y) * 100 + MONTHS.indexOf(m) }
export const shortSession = (s) => { const [m, y] = s.split(' '); return `${m.slice(0, 3)} ${y.slice(2)}` }
export const latestKey = (q) => Math.max(...q.a.map((a) => sessionKey(a[0])))
export const sessionsOf = (qs) => [...new Set(qs.flatMap((q) => q.a.map((a) => a[0])))].sort((a, b) => sessionKey(b) - sessionKey(a))

/** Repeat-based importance: 4+ sessions very important, 3 important, 2 repeated. */
export function importance(count) {
  if (count >= 4) return { label: 'Very important', tone: 'red' }
  if (count === 3) return { label: 'Important', tone: 'amber' }
  if (count === 2) return { label: 'Repeated', tone: 'blue' }
  return null
}

export const hasFlag = (pyq, id, flag) => ((pyq?.[id] || 0) & flag) === flag
export const withFlag = (current, flag) => (current || 0) ^ flag

/** Questions for a tab: 'imp' | '10m' | '5m' | '2m' | 'saved', filtered by text and sorted. */
export function filterPyq(qs, { tab, query = '', sort = 'freq', pyq = {} }) {
  let l = qs
  if (tab === 'imp') l = l.filter((q) => q.c >= 2)
  else if (tab === 'saved') l = l.filter((q) => hasFlag(pyq, q.id, SAVED))
  else if (KINDS[tab]) l = l.filter((q) => q.k.includes(tab))
  const s = query.trim().toLowerCase()
  if (s) l = l.filter((q) => q.t.toLowerCase().includes(s))
  const byFreq = (a, b) => b.c - a.c || latestKey(b) - latestKey(a)
  const byRecent = (a, b) => latestKey(b) - latestKey(a) || b.c - a.c
  return [...l].sort(sort === 'recent' ? byRecent : byFreq)
}

/** Questions from one exam session, grouped as the paper was set. */
export function paperOf(qs, session) {
  return ['10m', '5m', '2m'].map((kind) => {
    const items = qs.filter((q) => q.a.some((a) => a[0] === session && a[1] === kind))
    const marks = items.length ? items[0].a.find((a) => a[0] === session && a[1] === kind)[2] : null
    return { kind, marks, items }
  }).filter((s) => s.items.length)
}

export const mcqId = (subject, n) => `m:${subject}:${n}`
