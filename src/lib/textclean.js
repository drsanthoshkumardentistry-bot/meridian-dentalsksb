// JS port of tools/extractor/merident_extract/pdftext.py + chunker.py
// (same rules, so browser uploads and Python bulk imports give the same chunks).

const BULLETS = /^[\s]*[•●▪■◦○\-–—*➢➤►✓✔]+\s*/
const PAGE_NO = /^\s*(page\s*)?\d{1,4}(\s*(\/|of)\s*\d{1,4})?\s*$/i

const normLine = (l) => l.replace(/ /g, ' ').replace(/ﬁ/g, 'fi').replace(/ﬂ/g, 'fl').replace(/[ \t]+/g, ' ').trim()

/** pages: [{ number, text }] → cleaned pages (running headers/footers, page numbers, bullets removed). */
export function cleanPages(pages, repeatRatio = 0.5) {
  const lines = pages.map((p) => p.text.split(/\r?\n/).map(normLine).filter(Boolean))
  const edge = new Map()
  for (const ls of lines) {
    for (const l of new Set([...ls.slice(0, 2), ...ls.slice(-2)])) edge.set(l.toLowerCase(), (edge.get(l.toLowerCase()) || 0) + 1)
  }
  const n = Math.max(1, pages.length)
  const running = new Set([...edge].filter(([, c]) => c >= 2 && c / n > repeatRatio).map(([l]) => l))
  return pages.map((p, i) => {
    const kept = []
    for (let l of lines[i]) {
      if (running.has(l.toLowerCase()) || PAGE_NO.test(l)) continue
      l = l.replace(BULLETS, '')
      if (!l) continue
      const prev = kept.at(-1)
      if (prev && prev.endsWith('-') && /^[a-z]/.test(l)) kept[kept.length - 1] = prev.slice(0, -1) + l
      else kept.push(l)
    }
    return { ...p, text: kept.join('\n') }
  })
}

const approxTokens = (t) => Math.max(1, Math.round(t.split(/\s+/).filter(Boolean).length * 1.33))
const words = (s) => s.split(/\s+/).filter(Boolean).length

/** Greedy sentence packing into overlapping, page-cited chunks. */
export function chunkPages(pages, maxWords = 350, overlapWords = 40) {
  const units = []
  for (const p of pages) for (const s of p.text.split(/(?<=[.!?;:])\s+|\n+/)) if (s.trim()) units.push([p.number, s.trim()])
  const chunks = []
  let buf = [], count = 0
  const emit = (b) => {
    const content = b.map((u) => u[1]).join(' ')
    chunks.push({ ordinal: chunks.length, page_from: b[0][0], page_to: b.at(-1)[0], content, token_count: approxTokens(content) })
  }
  for (const u of units) {
    const w = words(u[1])
    if (count + w > maxWords && count > overlapWords) {
      emit(buf)
      const tail = []
      let t = 0
      for (let k = buf.length - 1; k >= 0 && t < overlapWords; k--) { tail.unshift(buf[k]); t += words(buf[k][1]) }
      buf = overlapWords ? tail : []
      count = buf.reduce((s, x) => s + words(x[1]), 0)
    }
    buf.push(u); count += w
  }
  if (buf.length) {
    const content = buf.map((u) => u[1]).join(' ')
    if (!chunks.length || !chunks.at(-1).content.includes(content)) emit(buf)
  }
  return chunks
}
