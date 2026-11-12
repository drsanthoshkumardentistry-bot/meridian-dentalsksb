import { describe, it, expect } from 'vitest'
import { PORTIONS, completion } from '../src/data/portions.js'
import { buildLocalContent } from '../src/lib/content.js'

const content = buildLocalContent()
const topicSlugs = new Set(content.topics.map((t) => t.slug))

describe('portions', () => {
  it('BDS covers all four years and every DCI subject', () => {
    const uni = PORTIONS.University
    expect(new Set(uni.map((s) => s.year))).toEqual(new Set([1, 2, 3, 4]))
    expect(uni.length).toBe(18)
    expect(uni.flatMap((s) => s.chapters).length).toBeGreaterThan(250)
  })
  it('chapter ids are unique per track and links point at real content', () => {
    for (const [track, subjects] of Object.entries(PORTIONS)) {
      const ids = subjects.flatMap((s) => s.chapters.map((c) => c.id))
      expect(new Set(ids).size, track).toBe(ids.length)
      const bank = new Set(content.mcqs.filter((q) => q.exam === (track === 'ADC' ? 'ADC' : 'NEET MDS')).map((q) => q.subject))
      for (const c of subjects.flatMap((s) => s.chapters)) {
        if (c.topic) expect(topicSlugs.has(c.topic), `${track} ${c.id} → ${c.topic}`).toBe(true)
        if (c.mcq) expect(bank.has(c.mcq), `${track} ${c.id} → ${c.mcq}`).toBe(true)
      }
    }
  })
  it('NEET MDS shares chapter ids with University so progress carries over', () => {
    const uni = new Set(PORTIONS.University.flatMap((s) => s.chapters.map((c) => c.id)))
    expect(PORTIONS['NEET MDS'].flatMap((s) => s.chapters).every((c) => uni.has(c.id))).toBe(true)
  })
  it('computes completion', () => {
    const ch = [{ id: 'a' }, { id: 'b' }]
    expect(completion(ch, {})).toBe(0)
    expect(completion(ch, { a: 3, b: 3 })).toBe(100)
    expect(completion(ch, { a: 3 })).toBe(50)
  })
})
