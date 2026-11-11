import { useMemo, useState } from 'react'
import { Check, PartyPopper, RotateCcw, X } from 'lucide-react'
import { useApp } from '../state/AppContext.jsx'
import { boxCounts, dueCards, BOX_DAYS } from '../lib/leitner.js'
import { Button, Card, PageHeader, Segmented, cx } from '../components/ui.jsx'

export default function Flashcards() {
  const { content, progress, reviewCard } = useApp()
  const [subject, setSubject] = useState('all')
  const topicSubject = Object.fromEntries(content.topics.map((t) => [t.id, t.subject_id]))
  const deck = content.flashcards.filter((c) => subject === 'all' || topicSubject[c.topic_id] === Number(subject))
  const counts = boxCounts(deck, progress.cards)
  // Freeze the queue when a session starts so cards don't jump while reviewing.
  const [session, setSession] = useState(null)
  const queue = useMemo(() => session?.ids.map((id) => content.flashcards.find((c) => c.id === id)) ?? [], [session, content.flashcards])
  const due = dueCards(deck, progress.cards)
  const topicTitle = Object.fromEntries(content.topics.map((t) => [t.id, t.title]))

  if (session) {
    const card = queue[session.i]
    if (!card) {
      return (
        <div className="animate-fade-in">
          <Card className="grid place-items-center px-6 py-14 text-center">
            <PartyPopper className="h-12 w-12 text-clinic-500" />
            <h2 className="mt-3 text-xl font-bold">Session complete</h2>
            <p className="mt-1 text-slate-500">{session.right} remembered · {session.wrong} sent back to Box 1</p>
            <Button className="mt-5" onClick={() => setSession(null)}>Back to deck</Button>
          </Card>
        </div>
      )
    }
    const answer = (ok) => { reviewCard(card.id, ok); setSession((s) => ({ ...s, i: s.i + 1, flipped: false, right: s.right + (ok ? 1 : 0), wrong: s.wrong + (ok ? 0 : 1) })) }
    const box = progress.cards[card.id]?.box
    return (
      <div className="mx-auto max-w-xl animate-fade-in">
        <div className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-500">
          <button onClick={() => setSession(null)} className="hover:text-clinic-600">‹ End session</button>
          <span>{session.i + 1} / {queue.length}</span>
        </div>
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full bg-clinic-500 transition-all" style={{ width: `${(session.i / queue.length) * 100}%` }} /></div>
        <button onClick={() => setSession((s) => ({ ...s, flipped: !s.flipped }))} className="block w-full text-left">
          <Card className={cx('flex min-h-[260px] flex-col p-6 transition', session.flipped && 'border-clinic-300 dark:border-clinic-700')}>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400"><span>{topicTitle[card.topic_id] || 'Personal card'}</span><span>{box ? `Box ${box}` : 'New'}</span></div>
            <div className="flex flex-1 items-center justify-center py-6 text-center text-xl font-semibold leading-snug">{session.flipped ? card.back : card.front}</div>
            {!session.flipped && <div className="text-center text-sm text-slate-400">Tap to reveal the answer</div>}
          </Card>
        </button>
        {session.flipped && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button size="lg" variant="danger" onClick={() => answer(false)}><X className="h-5 w-5" />Didn't know</Button>
            <Button size="lg" variant="success" onClick={() => answer(true)}><Check className="h-5 w-5" />Knew it</Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Flashcards" subtitle="Leitner spaced repetition – cards you know come back less often" />
      <Card className="mb-4 p-4">
        <select value={subject} onChange={(e) => setSubject(e.target.value)} className="mb-4 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium dark:border-slate-700 dark:bg-slate-900 sm:w-auto">
          <option value="all">All subjects</option>
          {content.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div className="grid grid-cols-6 gap-2 text-center">
          {['New', 'Box 1', 'Box 2', 'Box 3', 'Box 4', 'Box 5'].map((l, i) => (
            <div key={l} className={cx('rounded-xl p-2', i === 5 ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-slate-50 dark:bg-slate-800/60')}>
              <div className="text-lg font-extrabold tabular-nums">{counts[i]}</div>
              <div className="text-[10.5px] font-semibold text-slate-500">{l}</div>
              {i > 0 && <div className="text-[10px] text-slate-400">{BOX_DAYS[i - 1] === 0 ? 'daily' : `${BOX_DAYS[i - 1]}d`}</div>}
            </div>
          ))}
        </div>
      </Card>
      <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div><div className="text-3xl font-extrabold">{due.length}</div><div className="text-sm text-slate-500">cards due now</div></div>
        <div className="flex gap-2">
          <Button variant="secondary" icon="Shuffle" disabled={!deck.length} onClick={() => setSession({ ids: [...deck].sort(() => Math.random() - 0.5).map((c) => c.id), i: 0, flipped: false, right: 0, wrong: 0 })}>Cram all</Button>
          <Button icon="Play" disabled={!due.length} onClick={() => setSession({ ids: due.map((c) => c.id), i: 0, flipped: false, right: 0, wrong: 0 })}>Review due</Button>
        </div>
      </Card>
      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400"><RotateCcw className="h-3.5 w-3.5" />Correct → next box. Wrong → back to Box 1.</p>
    </div>
  )
}
