import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { PYQ_MCQS } from '../src/data/pyqMcqs.js'
import { DONE, SAVED, filterPyq, hasFlag, importance, mcqId, paperOf, sessionKey, sessionsOf, withFlag } from '../src/lib/pyq.js'
import { progressReducer } from '../src/state/AppContext.jsx'
import { emptyProgress, splitPortionRows } from '../src/lib/api.js'

const dir = new URL('../src/data/pyq/', import.meta.url)
const stats = JSON.parse(readFileSync(new URL('index.json', dir)))
const bank = Object.fromEntries(readdirSync(dir).filter((f) => f !== 'index.json').map((f) => [f.replace('.json', ''), JSON.parse(readFileSync(new URL(f, dir)))]))

describe('PYQ data', () => {
  it('has 1st and 2nd year subjects with questions and stats', () => {
    expect(Object.keys(bank).sort()).toEqual(['anatomy', 'biochemistry', 'dental-anatomy', 'dental-materials', 'microbiology', 'pathology', 'pharmacology', 'physiology'])
    for (const [s, qs] of Object.entries(bank)) {
      expect(qs.length, s).toBeGreaterThan(150)
      expect(stats[s].questions, s).toBe(qs.length)
    }
  })
  it('every question is well formed with a unique, stable id', () => {
    const ids = new Set()
    for (const [s, qs] of Object.entries(bank)) for (const q of qs) {
      expect(q.id).toMatch(new RegExp(`^${s}-[0-9a-f]{8}$`))
      expect(ids.has(q.id)).toBe(false); ids.add(q.id)
      expect(q.t.length).toBeGreaterThan(2)
      expect(q.k.every((k) => ['10m', '5m', '2m'].includes(k))).toBe(true)
      expect(q.a.length).toBeGreaterThan(0)
      expect(q.c).toBe(new Set(q.a.map((a) => a[0])).size)
      for (const [sess] of q.a) expect(sessionKey(sess)).toBeGreaterThan(200900)
      expect(`pyq:${q.id}`.length).toBeLessThanOrEqual(120)
    }
  })
  it('MCQs are valid', () => {
    for (const [s, list] of Object.entries(PYQ_MCQS)) {
      expect(bank[s], s).toBeTruthy()
      for (const m of list) { expect(m.o).toHaveLength(4); expect(m.a).toBeGreaterThanOrEqual(0); expect(m.a).toBeLessThan(4); expect(m.e).toBeTruthy() }
    }
  })
})

describe('PYQ helpers', () => {
  const qs = bank.anatomy
  it('important = asked in 2+ sessions, most asked first', () => {
    const l = filterPyq(qs, { tab: 'imp' })
    expect(l.every((q) => q.c >= 2)).toBe(true)
    expect(l[0].c).toBe(Math.max(...qs.map((q) => q.c)))
    expect(importance(5).label).toBe('Very important'); expect(importance(1)).toBe(null)
  })
  it('filters by marks, search and saved', () => {
    expect(filterPyq(qs, { tab: '10m' }).every((q) => q.k.includes('10m'))).toBe(true)
    expect(filterPyq(qs, { tab: '5m', query: 'facial' }).every((q) => /facial/i.test(q.t))).toBe(true)
    const id = qs[3].id
    expect(filterPyq(qs, { tab: 'saved', pyq: { [id]: SAVED } }).map((q) => q.id)).toEqual([id])
  })
  it('rebuilds a paper from one session', () => {
    const s = sessionsOf(qs)[0]
    const p = paperOf(qs, s)
    expect(p.length).toBeGreaterThan(0)
    expect(p.reduce((n, x) => n + x.items.length, 0)).toBeGreaterThanOrEqual(10)
  })
  it('flags toggle independently', () => {
    let f = withFlag(0, DONE); f = withFlag(f, SAVED)
    expect(hasFlag({ x: f }, 'x', DONE) && hasFlag({ x: f }, 'x', SAVED)).toBe(true)
    expect(withFlag(withFlag(f, DONE), SAVED)).toBe(0)
  })
})

describe('PYQ progress', () => {
  it('reducer sets and clears entries', () => {
    let p = progressReducer(emptyProgress(), { type: 'pyq', ids: { 'anatomy-1': DONE, [mcqId('anatomy', 0)]: 2 } })
    expect(p.pyq).toEqual({ 'anatomy-1': DONE, 'm:anatomy:0': 2 })
    p = progressReducer(p, { type: 'pyq', ids: { 'anatomy-1': null } })
    expect(p.pyq).toEqual({ 'm:anatomy:0': 2 })
  })
  it('cloud rows split between portions and PYQs', () => {
    expect(splitPortionRows([{ chapter_id: 'ana-1', status: 3 }, { chapter_id: 'pyq:anatomy-ab12cd34', status: 1 }]))
      .toEqual({ portions: { 'ana-1': 3 }, pyq: { 'anatomy-ab12cd34': 1 } })
  })
})
