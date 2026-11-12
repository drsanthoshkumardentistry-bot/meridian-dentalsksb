// Preparation tracks. Stored in profiles.target_exam ('University' | 'NEET MDS' | 'ADC').
export const TRACKS = {
  University: {
    key: 'University', short: 'University', label: 'University preparation', emoji: '🎓',
    blurb: 'BDS theory, viva voce and spotters for your university exams.',
    hero: 'Walk into your viva ready for the toughest external examiner.',
    mcqExam: 'NEET MDS', mcqLabel: 'MCQ practice', mcqShort: 'MCQs', negativeMarking: true,
    modules: ['pyq', 'topics', 'viva', 'study', 'spotters', 'flashcards', 'mcq'],
    meridee: 'a strict university external examiner',
  },
  'NEET MDS': {
    key: 'NEET MDS', short: 'NEET MDS', label: 'MDS preparation', emoji: '🏆',
    blurb: 'NEET MDS PYQs, high-yield MCQs and timed mock tests (+4 / −1).',
    hero: 'Every PYQ, every high-yield fact, one rank at a time.',
    mcqExam: 'NEET MDS', mcqLabel: 'NEET MDS MCQs', mcqShort: 'NEET MCQs', negativeMarking: true,
    modules: ['mcq', 'flashcards', 'study', 'topics', 'pyq', 'viva', 'spotters'],
    meridee: 'a rapid-fire NEET MDS mentor who drills high-yield facts',
  },
  ADC: {
    key: 'ADC', short: 'ADC', label: 'ADC preparation', emoji: '🇦🇺',
    blurb: 'Scenario-based MCQs and clinical cases in the Australian practice context.',
    hero: 'Think like an Australian dentist: safe, ethical, evidence-based.',
    mcqExam: 'ADC', mcqLabel: 'ADC written practice', mcqShort: 'ADC MCQs', negativeMarking: false,
    modules: ['mcq', 'viva', 'topics', 'study', 'flashcards', 'spotters'],
    meridee: 'an Australian Dental Council examiner assessing clinical reasoning, patient safety, consent and Australian guidelines',
  },
}
export const TRACK_KEYS = Object.keys(TRACKS)
export const trackOf = (profile) => TRACKS[profile?.target_exam] || null
