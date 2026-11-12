import { Check } from 'lucide-react'
import { TRACKS, TRACK_KEYS } from '../lib/tracks.js'
import { cx } from './ui.jsx'

/** Three big cards: University / NEET MDS / ADC preparation. */
export default function TrackPicker({ value, onPick }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {TRACK_KEYS.map((k) => {
        const t = TRACKS[k], on = value === k
        return (
          <button key={k} onClick={() => onPick(k)} aria-pressed={on}
            className={cx('relative rounded-2xl border-2 bg-white p-4 text-left transition hover:border-clinic-400 dark:bg-slate-900',
              on ? 'border-clinic-600 ring-4 ring-clinic-100 dark:ring-clinic-950' : 'border-slate-200 dark:border-slate-700')}>
            {on && <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-clinic-600 text-white"><Check className="h-4 w-4" /></span>}
            <span className="text-3xl" aria-hidden>{t.emoji}</span>
            <span className="mt-2 block text-base font-bold">{t.label}</span>
            <span className="mt-1 block text-sm text-slate-500">{t.blurb}</span>
          </button>
        )
      })}
    </div>
  )
}
