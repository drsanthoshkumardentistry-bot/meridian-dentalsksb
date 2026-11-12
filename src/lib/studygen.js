// Offline study-asset generator for StudySync (no AI key needed).
// Input: cleaned pages [{ number, text }]. Every output item carries the page it came from.
// Meridee AI can later replace these with model-written summaries; the shapes stay the same.

const STOP = new Set(('a an the of and or in on at to for from by with is are was were be been being as that this these those it its into than then their there which who what when where how why not no yes very more most less also other such can may might will would should could has have had do does did each all any some only both between within without about over under per via eg ie e.g i.e etc').split(' '))

export const SECTION_RULES = [
  ['definition', 'Definition', /^(definition|definitions|introduction|what is\b|overview)/i],
  ['classification', 'Classification / types', /^(classification|classifications|types|varieties|forms)\b/i],
  ['etiology', 'Aetiology & pathogenesis', /^(a?etiology|aetio-?pathogenesis|etio-?pathogenesis|causes|pathogenesis|risk factors|predisposing factors)/i],
  ['clinical_features', 'Clinical features', /^(clinical (features|presentation|findings|picture)|signs and symptoms|signs & symptoms|symptoms|features)\b/i],
  ['investigations', 'Investigations & diagnosis', /^(investigations?|diagnosis|diagnostic|radiographic (features|findings|appearance)|radiology|imaging|lab(oratory)? (tests|findings))/i],
  ['histopathology', 'Histopathology', /^(histopathology|histopathological features|histology|microscopic features|microscopy)/i],
  ['differential', 'Differential diagnosis', /^(differential diagnosis|differentials|d\/d|ddx)\b/i],
  ['management', 'Management', /^(management|treatment|therapy|treatment plan|surgical management|medical management)/i],
  ['complications', 'Complications & prognosis', /^(complications|prognosis|sequelae|recurrence)/i],
  ['summary', 'Key points', /^(summary|key points|conclusion|take home|viva points|important points)/i],
]

const NUMBERING = /^(\(?[0-9ivxIVX]{1,4}[.)]|[A-Z][.)])\s+/

function headingOf(line) {
  const endsColon = /[:\-–]\s*$/.test(line)
  const bare = line.replace(NUMBERING, '').replace(/[:\-–]\s*$/, '').trim()
  const wordsN = bare.split(/\s+/).length
  const maxWords = endsColon ? 7 : 5
  for (const [key, label, re] of SECTION_RULES) {
    if (!re.test(bare)) continue
    // "Definition: text…" → heading with inline content
    const m = bare.match(/^([^:]{2,60}):\s*(.+)$/)
    if (m) return { key, label, inline: m[2].trim() }
    if (wordsN <= maxWords && bare.length <= 60 && !/[.!?]$/.test(bare)) return { key, label, inline: null }
  }
  return null
}

const clip = (s, n = 260) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s)

/** Sectioned, page-cited summary. */
export function buildSummary(pages, fallbackTitle = 'Lecture') {
  const first = (pages[0]?.text || '').split('\n').find((l) => l.trim().length > 3) || ''
  const title = first && first.length <= 80 && !headingOf(first) ? first.replace(/[:\-–]\s*$/, '') : fallbackTitle
  const sections = new Map()
  let cur = null
  for (const p of pages) {
    for (const line of p.text.split('\n')) {
      const l = line.trim()
      if (!l || l === title) continue
      const h = headingOf(l)
      if (h) {
        cur = sections.get(h.key) || { key: h.key, label: h.label, items: [] }
        sections.set(h.key, cur)
        if (h.inline) cur.items.push({ text: clip(h.inline), page: p.number })
        continue
      }
      if (!cur) continue
      const last = cur.items.at(-1)
      // continuation: previous item doesn't end a sentence and this line starts lowercase
      if (last && last.page === p.number && !/[.:;!?)]$/.test(last.text) && /^[a-z(]/.test(l)) last.text = clip(`${last.text} ${l}`)
      else if (cur.items.length < 14) cur.items.push({ text: clip(l), page: p.number })
    }
  }
  const order = SECTION_RULES.map(([k]) => k)
  const out = [...sections.values()].filter((s) => s.items.length).sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key))
  return { title, sections: out, keyPoints: keyPoints(pages, 8), generatedBy: 'meridee-offline', pageCount: pages.length }
}

const tokenize = (s) => (s.toLowerCase().match(/[a-z][a-z0-9-]+/g) || []).filter((w) => w.length > 2 && !STOP.has(w)).map(stem)
function stem(w) { return w.length > 4 && w.endsWith('es') ? w.slice(0, -2) : w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w }

function sentences(pages) {
  const out = []
  for (const p of pages) {
    for (const s of p.text.replace(/\n(?=[a-z])/g, ' ').split(/(?<=[.!?])\s+|\n+/)) {
      const t = s.trim()
      if (t.split(/\s+/).length >= 5 && t.length <= 400) out.push({ text: t, page: p.number })
    }
  }
  return out
}

/** Top sentences by content-word frequency, kept in document order. */
export function keyPoints(pages, k = 8) {
  const sents = sentences(pages)
  const tf = new Map()
  for (const s of sents) for (const w of new Set(tokenize(s.text))) tf.set(w, (tf.get(w) || 0) + 1)
  const scored = sents.map((s, i) => {
    const toks = tokenize(s.text)
    const score = toks.reduce((a, w) => a + Math.log(1 + (tf.get(w) || 0)), 0) / Math.sqrt(toks.length + 1)
    return { ...s, i, score }
  })
  const seen = new Set()
  return scored.sort((a, b) => b.score - a.score)
    .filter((s) => { const key = tokenize(s.text).slice(0, 6).join(' '); if (seen.has(key)) return false; seen.add(key); return true })
    .slice(0, k).sort((a, b) => a.i - b.i).map(({ text, page }) => ({ text: clip(text), page }))
}

// Real definitions only: "X is a/an/the …", "X refers to …", "X is defined as …" (not "X is reported in …").
const DEF = /^([A-Z][A-Za-z0-9'’()/\- ]{2,60}?)\s+(is (?:an?|the)|refers to|is defined as|may be defined as|can be defined as)\s+(.{12,})$/
const PRONOUN = /^(it|this|these|they|there|that|he|she|we|you|i|which|those|here|such)\b/i
const NUMERIC = /\b\d+(?:\.\d+)?(?:\s?[-–]\s?\d+(?:\.\d+)?)?\s?(?:%|mm|cm|mg|g\/dl|mcg|µg|ml|years?|yrs|weeks?|days?|hours?|min(?:utes)?|ppm|°c)(?![a-z])/i

/** Flashcards from definitions, sections and numeric facts. */
export function buildFlashcards(pages, summary = buildSummary(pages), limit = 24) {
  const cards = []
  const seen = new Set()
  const add = (front, back, page, kind) => {
    const k = front.toLowerCase().replace(/\W+/g, ' ').trim()
    if (!front || !back || seen.has(k) || back.length < 3) return
    seen.add(k); cards.push({ front, back: clip(back, 420), page, kind })
  }
  const def = summary.sections.find((s) => s.key === 'definition')
  if (def?.items.length) add(`Define ${summary.title}.`, def.items[0].text, def.items[0].page, 'definition')
  for (const s of sentences(pages)) {
    const m = s.text.match(DEF)
    if (!m || PRONOUN.test(m[1]) || m[1].split(/\s+/).length > 6) continue
    if (m[1].trim().toLowerCase() === summary.title.toLowerCase() && def?.items.length) continue // already a "Define …" card
    add(`What is ${m[1].trim()}?`, s.text, s.page, 'definition')
  }
  for (const sec of summary.sections) {
    if (sec.key === 'definition' || sec.key === 'summary' || sec.items.length < 2) continue
    const items = sec.items.slice(0, 8)
    add(`${sec.label} of ${summary.title}?`, items.map((i) => `• ${i.text}`).join('\n'), items[0].page, 'list')
  }
  let cloze = 0
  for (const s of sentences(pages)) {
    if (cloze >= 6) break
    const m = s.text.match(NUMERIC)
    if (!m) continue
    add(`Fill in the blank: ${s.text.replace(m[0], '_____')}`, `${m[0]} — ${s.text}`, s.page, 'cloze')
    cloze++
  }
  return cards.slice(0, limit)
}

/** BM25 search over chunks → [{ chunk, score, snippet }] with page citations. */
export function searchChunks(chunks, query, k = 5) {
  const q = [...new Set(tokenize(query))]
  if (!q.length || !chunks.length) return []
  const docs = chunks.map((c) => tokenize(c.content))
  const avg = docs.reduce((a, d) => a + d.length, 0) / docs.length
  const df = new Map(q.map((t) => [t, docs.filter((d) => d.includes(t)).length]))
  const N = docs.length, k1 = 1.4, b = 0.75
  const scored = chunks.map((c, i) => {
    const d = docs[i]
    let score = 0
    for (const t of q) {
      const f = d.filter((w) => w === t).length
      if (!f) continue
      const idf = Math.log(1 + (N - df.get(t) + 0.5) / (df.get(t) + 0.5))
      score += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * d.length / avg))
    }
    return { chunk: c, score }
  }).filter((r) => r.score > 0).sort((a, b) => b.score - a.score).slice(0, k)
  return scored.map((r) => ({ ...r, snippet: bestSnippet(r.chunk.content, q) }))
}

function bestSnippet(text, qTokens) {
  const sents = text.split(/(?<=[.!?;])\s+/)
  let best = sents[0] || text, bestScore = -1
  for (const s of sents) {
    const t = tokenize(s)
    const sc = qTokens.filter((q) => t.includes(q)).length
    if (sc > bestScore) { best = s; bestScore = sc }
  }
  return clip(best, 280)
}
