import { describe, it, expect } from 'vitest'
import { cleanPages, chunkPages } from '../src/lib/textclean.js'
import { buildSummary, buildFlashcards, searchChunks } from '../src/lib/studygen.js'

const H = 'Dept. of Oral Pathology – SRDCH'
const raw = [
  { number: 1, text: `${H}\nOdontogenic Keratocyst\nDefinition\nOdontogenic keratocyst is a developmental odontogenic cyst arising from remnants of the dental lamina.\n1` },
  { number: 2, text: `${H}\nClinical Features\n• Common in the 2nd to 4th decade\n• Mandible (about 70%), posterior body and ramus\n• Grows antero-posteriorly with mini-\nmal expansion\n2` },
  { number: 3, text: `${H}\nHistopathology:\n• Corrugated parakeratin surface\n• Palisaded basal cells (tombstone)\n• Uniform lining 6-8 cell layers thick\n3` },
  { number: 4, text: `${H}\nManagement\n• Enucleation with Carnoy's solution\n• Marsupialisation for large lesions\n• Recurrence rate is 25-60% after enucleation alone.\nGorlin syndrome is a syndrome with multiple keratocysts and basal cell carcinomas.\n4` },
]

describe('textclean', () => {
  const pages = cleanPages(raw)
  it('removes running headers, page numbers and bullets; fixes hyphenation', () => {
    expect(pages.every((p) => !p.text.includes(H))).toBe(true)
    expect(pages.every((p) => !/^\d+$/m.test(p.text))).toBe(true)
    expect(pages[1].text).toContain('minimal expansion')
    expect(pages[2].text.startsWith('Histopathology:')).toBe(true)
    expect(pages[2].text).not.toMatch(/•/)
  })
  it('chunks carry page ranges', () => {
    const chunks = chunkPages(pages, 30, 5)
    expect(chunks.length).toBeGreaterThan(1)
    expect(chunks[0].page_from).toBe(1)
    expect(chunks.at(-1).page_to).toBe(4)
  })
})

describe('studygen', () => {
  const pages = cleanPages(raw)
  const summary = buildSummary(pages, 'fallback')
  it('builds a sectioned summary with page citations', () => {
    expect(summary.title).toBe('Odontogenic Keratocyst')
    expect(summary.sections.map((s) => s.key)).toEqual(['definition', 'clinical_features', 'histopathology', 'management'])
    const hist = summary.sections.find((s) => s.key === 'histopathology')
    expect(hist.items[0]).toEqual({ text: 'Corrugated parakeratin surface', page: 3 })
    expect(summary.keyPoints.length).toBeGreaterThan(0)
  })
  it('generates definition, list and cloze flashcards', () => {
    const cards = buildFlashcards(pages, summary)
    const fronts = cards.map((c) => c.front)
    expect(fronts).toContain('Define Odontogenic Keratocyst.')
    expect(fronts).toContain('What is Gorlin syndrome?')
    expect(fronts).toContain('Management of Odontogenic Keratocyst?')
    expect(cards.some((c) => c.kind === 'cloze' && c.back.startsWith('25-60%') === false)).toBe(true)
    expect(cards.every((c) => Number.isInteger(c.page))).toBe(true)
    expect(new Set(fronts).size).toBe(fronts.length)
  })
  it('searches slides with BM25 and returns cited snippets', () => {
    const chunks = chunkPages(pages, 30, 5)
    const res = searchChunks(chunks, 'how is it treated? enucleation carnoy')
    expect(res[0].chunk.page_to).toBe(4)
    expect(res[0].snippet.toLowerCase()).toContain('carnoy')
    expect(searchChunks(chunks, 'zzz unrelated')).toEqual([])
  })
})
