import { describe, it, expect } from 'vitest'
import { matchConcept, evaluateAnswer, createSession, respond, summarize, spotterSteps } from '../src/lib/examiner.js'
import { TOPICS, SPOTTERS } from '../src/data/academy.js'
import { nextState, dueCards, BOX_DAYS } from '../src/lib/leitner.js'

const amelo = TOPICS.find((t) => t.slug === 'ameloblastoma')

describe('matchConcept', () => {
  it('matches synonyms, hyphens and case', () => {
    expect(matchConcept('Shows a SOAP-BUBBLE pattern', 'soap bubble|honeycomb')).toBe(true)
    expect(matchConcept('honeycomb', 'soap bubble|honeycomb')).toBe(true)
    expect(matchConcept('nothing here', 'soap bubble|honeycomb')).toBe(false)
  })
  it('requires whole words for short tokens', () => {
    expect(matchConcept('order a CT scan', 'ct|computed tomography')).toBe(true)
    expect(matchConcept('a strict exam', 'ct')).toBe(false)
  })
})

describe('evaluateAnswer', () => {
  const step = amelo.viva[0]
  it('rewards a complete, confident answer', () => {
    const e = evaluateAnswer('Ameloblastoma is a benign but locally aggressive epithelial odontogenic tumour arising from remnants of the dental lamina and enamel organ.', step)
    expect(e.coverage).toBe(1)
    expect(e.score).toBeGreaterThanOrEqual(8)
    expect(e.hedges).toEqual([])
  })
  it('penalises hedging and missing concepts', () => {
    const e = evaluateAnswer('I think maybe it is a tumour?', step)
    expect(e.coverage).toBeLessThan(0.5)
    expect(e.hedges.length).toBeGreaterThan(0)
    expect(e.confidence).toBeLessThan(50)
  })
})

describe('session flow', () => {
  it('probes once on a weak answer, then moves on', () => {
    let s = createSession({ topic: amelo })
    let r = respond(s, 'a tumour')
    expect(r.state.probing).toBe(true)
    expect(r.state.idx).toBe(0)
    r = respond(r.state, 'it is benign and locally aggressive, from odontogenic epithelium')
    expect(r.state.idx).toBe(1)
    expect(r.state.results[0].coverage).toBe(1) // hits carried over from first attempt
  })
  it('finishes and summarises', () => {
    let s = createSession({ topic: amelo })
    const good = [
      'Benign, locally aggressive epithelial odontogenic tumour.',
      'Multilocular soap bubble radiolucency with knife edge root resorption and cortical expansion.',
      'Follicles with tall columnar cells, reverse polarity, palisading and central stellate reticulum.',
      'Segmental resection with 1.5 cm margin and fibula reconstruction, long-term follow up for recurrence.',
    ]
    for (const a of good) s = respond(s, a).state
    expect(s.done).toBe(true)
    const sum = summarize(s)
    expect(sum.overall).toBeGreaterThan(7)
    expect(sum.gaps).toEqual([])
  })
})

describe('content integrity', () => {
  it('every topic has a viva script with keywords and a vignette', () => {
    for (const t of TOPICS) {
      expect(t.viva.length, t.slug).toBeGreaterThanOrEqual(3)
      expect(t.vignette, t.slug).toBeTruthy()
      for (const st of t.viva) expect(st.keywords.length, t.slug + st.q).toBeGreaterThan(0)
    }
  })
  it('every spotter yields viva steps and has 3 distractors', () => {
    for (const s of SPOTTERS) {
      expect(spotterSteps(s).length, s.key).toBeGreaterThanOrEqual(2)
      expect(s.distractors.length, s.key).toBe(3)
      expect(s.distractors, s.key).not.toContain(s.title)
    }
  })
})

describe('leitner', () => {
  it('promotes on correct and resets on wrong', () => {
    const now = Date.parse('2026-01-01T00:00:00Z')
    let p = nextState(undefined, true, now)
    expect(p.box).toBe(2)
    expect(Date.parse(p.due_at) - now).toBe(BOX_DAYS[1] * 86400000)
    p = nextState({ ...p, box: 5 }, true, now)
    expect(p.box).toBe(5)
    p = nextState(p, false, now)
    expect(p.box).toBe(1)
    expect(p.lapse_count).toBe(1)
  })
  it('new cards are due', () => {
    expect(dueCards([{ id: 1 }, { id: 2 }], { 2: { box: 3, due_at: '2999-01-01' } })).toEqual([{ id: 1 }])
  })
})

describe('every viva step is answerable', () => {
  it('an answer using each concept\'s first wording scores full coverage', () => {
    for (const t of TOPICS) {
      for (const st of t.viva) {
        const answer = st.keywords.map((k) => k.split('|')[0]).join(', ')
        const e = evaluateAnswer(answer, st)
        expect(e.coverage, `${t.slug}: ${st.q} -> missed ${e.missedLabels}`).toBe(1)
      }
    }
  })
})
