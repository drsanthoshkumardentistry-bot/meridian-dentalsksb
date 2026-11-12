// Built-in "strict external examiner" engine.
// Works offline with no API key. Each viva step has keyword concepts
// ("a|b" = synonyms). Answers are scored for content accuracy, clinical
// terminology and confidence, and weak answers get one probing follow-up.

const STOP = new Set('the a an of and or with in on at to for from by is are was be as that this these those its it into than then their there which who whom what when where how why not no yes very more most less least also other such using used use per via about over under between within without both each all any some only'.split(' '))

const HEDGES = ['i think', 'i guess', 'maybe', 'not sure', 'probably', 'perhaps', 'i dont know', 'i do not know', 'might be', 'possibly', 'kind of', 'sort of', 'i forgot', 'no idea', 'i am not sure', 'im not sure', 'um', 'uh', 'hmm', 'i believe']

// Rough clinical-vocabulary detector (suffixes + common roots).
const TERM_RE = /\b\w*(osis|itis|oma|omas|ectomy|otomy|ostomy|plasia|plasty|pathy|algia|aemia|emia|genic|cyte|cytic|blast|clast|keratin\w*|lucen\w*|opaque|opacity|lingual|buccal|palatal|mesial|distal|apical|periapical|alveolar|mandib\w*|maxill\w*|odont\w*|gingiv\w*|periodont\w*|pulp\w*|dentin\w*|enamel|cementum|epitheli\w*|mucos\w*|submucos\w*|fibros\w*|dysplas\w*|neoplas\w*|benign|malignan\w*|metasta\w*|resorption|ankylos\w*|parasthesia|paraesthesia|paresthesia|trismus|ecchymos\w*|haemorrhag\w*|hemorrhag\w*|infiltrat\w*|lymphocyt\w*|palisad\w*|corticat\w*|multilocular|unilocular|biopsy|resection|enucleation|marsupiali\w*|curettage|corticosteroid\w*|intralesional|anaesthe\w*|anesthe\w*|vasoconstrict\w*|aetiolog\w*|etiolog\w*|patholog\w*|histopatholog\w*|anaphyla\w*|angioedema|urticaria|hypotens\w*|hypertens\w*|tachycard\w*|wheez\w*|bronchospasm|stridor|adrenaline|epinephrine|intramuscular|glyceryl|trinitrate|hypoglyc\w*|syncope|anticoagula\w*|antibiotic\w*|amoxicillin|prophyla\w*|consent|capacity|ahpra|notification|negligence|avuls\w*|replant\w*|splint\w*|tetanus|revasculari\w*|ankylos\w*|steriliz\w*|sterilis\w*|asepsis|aseptic)\b/g

export function normalize(s = '') {
  return ` ${String(s).toLowerCase().replace(/[’']/g, '').replace(/[-–—_/]/g, ' ').replace(/[^\p{L}\p{N}+.:γηµ ]/gu, ' ').replace(/\s+/g, ' ').trim()} `
}

const conceptLabel = (concept) => concept.split('|')[0]

export function matchConcept(text, concept) {
  const t = normalize(text)
  return concept.split('|').some((alt) => {
    const a = normalize(alt).trim()
    if (!a) return false
    if (a.length <= 3) return new RegExp(`(^|\\s)${a.replace(/[.+]/g, '\\$&')}(\\s|$)`).test(t)
    return t.includes(a)
  })
}

export function findHedges(text) {
  const t = normalize(text)
  return HEDGES.filter((h) => t.includes(` ${h} `))
}

export function countTerms(text) {
  return (normalize(text).match(TERM_RE) || []).length
}

const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n))
const round1 = (n) => Math.round(n * 10) / 10

/** Evaluate one answer against a step. `prevHits` lets a follow-up answer add to earlier credit. */
export function evaluateAnswer(answer, step, prevHits = []) {
  const keywords = step.keywords || []
  const hits = keywords.filter((k) => prevHits.includes(k) || matchConcept(answer, k))
  const missed = keywords.filter((k) => !hits.includes(k))
  const coverage = keywords.length ? hits.length / keywords.length : 0
  const words = normalize(answer).trim().split(' ').filter(Boolean)
  const hedges = findHedges(answer)
  const terms = countTerms(answer)

  const accuracy = Math.round(coverage * 100)
  const terminology = Math.round(clamp(45 * coverage + 55 * Math.min(1, terms / Math.max(2, keywords.length - 1))))
  let confidence = 78 - hedges.length * 16
  if (words.length < 5) confidence -= 25
  else if (words.length >= 18 && hedges.length === 0) confidence += 14
  if (/\?\s*$/.test(answer.trim())) confidence -= 12
  confidence = Math.round(clamp(confidence, 5, 100))

  const score = round1(coverage * 7 + (terminology / 100) * 1.5 + (confidence / 100) * 1.5)
  return {
    score, accuracy, terminology, confidence,
    hits, missed, hedges,
    hitLabels: hits.map(conceptLabel),
    missedLabels: missed.map(conceptLabel),
    coverage,
  }
}

const pick = (arr, seed) => arr[Math.abs(seed) % arr.length]

const REMARKS = {
  excellent: ['Correct. That is the standard I expect.', 'Good. Precise and complete.', 'Satisfactory. Moving on.'],
  partial: ['That is incomplete.', 'Partly correct, but not enough for a university viva.', 'You are on the right track, but you have left out important points.'],
  poor: ['That is not satisfactory.', 'No. Think again before you answer.', 'That answer would not pass.'],
  hedge: ['Do not say "I think" in a viva — commit to your answer.', 'Speak with conviction. Hesitation costs marks.'],
  empty: ['You have not answered the question.'],
}

/** Build viva steps for a spotter (radiograph / slide / instrument / specimen). */
export function spotterSteps(spotter) {
  const sig = (phrase) => {
    const words = normalize(phrase).trim().split(' ').filter((w) => w.length >= 5 && !STOP.has(w))
    return [...new Set(words.sort((a, b) => b.length - a.length).slice(0, 2))].join('|')
  }
  const idWords = sig(spotter.title.replace(/\(.*?\)/g, ''))
  const steps = [
    { q: spotter.category === 'instrument' ? 'Identify this instrument.' : spotter.category === 'histology' ? 'Identify this slide.' : spotter.category === 'specimen' ? 'Identify this specimen.' : 'Identify this radiograph.', keywords: [idWords || normalize(spotter.title).trim()], probe: 'Look again at the key features. What is your diagnosis?' },
    { q: 'Which features helped you identify it?', keywords: spotter.key_findings.map(sig).filter(Boolean), probe: 'Describe what you actually see — be systematic.' },
  ]
  if (spotter.uses?.length) steps.push({ q: 'What is it used for?', keywords: spotter.uses.map(sig).filter(Boolean), probe: 'Give me the clinical use.' })
  if (spotter.differentials?.length) steps.push({ q: 'Give me your differential diagnoses.', keywords: spotter.differentials.map(sig).filter(Boolean), probe: 'Name at least two conditions that can look similar.' })
  return steps.filter((s) => s.keywords.length)
}

/** Create a new session. */
const PERSONA = { University: 'your external examiner today', 'NEET MDS': 'your MDS mentor', ADC: 'your ADC examiner' }

export function createSession({ topic, spotter, track }) {
  const steps = spotter ? spotterSteps(spotter) : (topic?.viva || [])
  const me = `I'm Meridee, ${PERSONA[track] || PERSONA.University}.`
  const opening = spotter
    ? `${me} Look at this ${spotter.category === 'histology' ? 'slide' : spotter.category}. ${steps[0]?.q}`
    : `${me} Read the case above carefully. ${steps[0]?.q}`
  return {
    steps, idx: 0, probing: false, stepHits: [], results: [],
    messages: [{ role: 'examiner', content: opening }],
    done: steps.length === 0,
  }
}

/** Process a student answer → new state + examiner reply + evaluation. */
export function respond(state, answer) {
  if (state.done) return { state, reply: null, evaluation: null }
  const step = state.steps[state.idx]
  const evaluation = evaluateAnswer(answer, step, state.stepHits)
  // An answer rescued only after a probing follow-up loses 1.5 marks.
  if (state.probing) { evaluation.score = round1(Math.max(0, evaluation.score - 1.5)); evaluation.probed = true }
  const seed = state.idx * 7 + answer.length
  const messages = [...state.messages, { role: 'student', content: answer, evaluation }]
  const parts = []

  if (!normalize(answer).trim()) parts.push(pick(REMARKS.empty, seed))
  else if (evaluation.coverage >= 0.75) parts.push(pick(REMARKS.excellent, seed))
  else if (evaluation.coverage >= 0.4) parts.push(pick(REMARKS.partial, seed))
  else parts.push(pick(REMARKS.poor, seed))
  if (evaluation.hedges.length) parts.push(pick(REMARKS.hedge, seed))

  // One probing follow-up when the answer is weak.
  if (evaluation.coverage < 0.6 && !state.probing && step.probe) {
    parts.push(step.probe)
    const reply = parts.join(' ')
    return {
      state: { ...state, probing: true, stepHits: evaluation.hits, messages: [...messages, { role: 'examiner', content: reply }] },
      reply, evaluation,
    }
  }

  if (evaluation.missed.length && evaluation.coverage < 1) {
    parts.push(`You should also have mentioned: ${evaluation.missedLabels.join(', ')}.`)
  }
  const results = [...state.results, { q: step.q, ...evaluation }]
  const idx = state.idx + 1
  const done = idx >= state.steps.length
  parts.push(done ? 'That will be all. Wait outside for your result.' : `Next question. ${state.steps[idx].q}`)
  const reply = parts.join(' ')
  return {
    state: { ...state, idx, probing: false, stepHits: [], results, done, messages: [...messages, { role: 'examiner', content: reply }] },
    reply, evaluation,
  }
}

/** Overall session summary. */
export function summarize(state) {
  const r = state.results
  if (!r.length) return { overall: 0, terminology: 0, accuracy: 0, confidence: 0, gaps: [], strengths: [], verdict: 'Not attempted' }
  const avg = (k) => r.reduce((s, x) => s + x[k], 0) / r.length
  const overall = round1(avg('score'))
  const gaps = [...new Set(r.flatMap((x) => x.missedLabels))]
  const strengths = r.filter((x) => x.coverage >= 0.75).map((x) => x.q)
  const verdict = overall >= 7.5 ? 'Distinction-level performance' : overall >= 5 ? 'Pass – but tighten your answers' : 'Below pass standard – revise this topic'
  return {
    overall,
    terminology: Math.round(avg('terminology')),
    accuracy: Math.round(avg('accuracy')),
    confidence: Math.round(avg('confidence')),
    gaps, strengths, verdict,
  }
}

/** Live running averages over student turns (for the evaluation panel). */
export function liveMetrics(messages) {
  const evals = messages.filter((m) => m.role === 'student' && m.evaluation).map((m) => m.evaluation)
  if (!evals.length) return null
  const avg = (k) => Math.round(evals.reduce((s, e) => s + e[k], 0) / evals.length)
  return {
    terminology: avg('terminology'), accuracy: avg('accuracy'), confidence: avg('confidence'),
    terms: [...new Set(evals.flatMap((e) => e.hitLabels))],
    hedges: [...new Set(evals.flatMap((e) => e.hedges))],
  }
}
