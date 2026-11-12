import { describe, it, expect } from 'vitest'
import { buildLocalContent } from '../src/lib/content.js'
import { TRACKS, trackOf } from '../src/lib/tracks.js'
import { trackSubjects } from '../src/pages/TopicHub.jsx'
import { createSession } from '../src/lib/examiner.js'

const content = buildLocalContent()

describe('question banks', () => {
  it('ADC and NEET MDS banks are separate, valid and have unique ids', () => {
    const adc = content.mcqs.filter((q) => q.exam === 'ADC')
    const neet = content.mcqs.filter((q) => q.exam === 'NEET MDS')
    expect(adc.length).toBeGreaterThanOrEqual(20)
    expect(neet.filter((q) => q.id < 5001).length).toBe(70)
    expect(new Set(content.mcqs.map((q) => q.id)).size).toBe(content.mcqs.length)
    for (const q of content.mcqs) {
      expect(q.options.length, q.id).toBe(4)
      expect(q.answer, q.id).toBeGreaterThanOrEqual(0)
      expect(q.answer, q.id).toBeLessThan(4)
      expect(q.explanation, q.id).toBeTruthy()
    }
  })
})

describe('tracks', () => {
  it('maps profiles to tracks', () => {
    expect(trackOf({ target_exam: 'ADC' })).toBe(TRACKS.ADC)
    expect(trackOf({ target_exam: 'NEET MDS' }).mcqExam).toBe('NEET MDS')
    expect(trackOf(null)).toBeNull()
  })
  it('ADC track lists ADC subjects first; other tracks hide them', () => {
    expect(trackSubjects(content.subjects, TRACKS.ADC)[0].track).toBe('adc')
    expect(trackSubjects(content.subjects, TRACKS.University).some((s) => s.track === 'adc')).toBe(false)
  })
  it('Meridee introduces herself per track', () => {
    const t = content.topics.find((x) => x.slug === 'adc-anaphylaxis')
    expect(createSession({ topic: t, track: 'ADC' }).messages[0].content).toMatch(/^I'm Meridee, your ADC examiner/)
    expect(createSession({ topic: t }).messages[0].content).toMatch(/^I'm Meridee, your external examiner/)
  })
})
