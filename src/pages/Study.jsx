import { useEffect, useRef, useState } from 'react'
import { Check, Copy, ExternalLink, FileText, FileUp, Layers3, Loader2, Plus, Search, Trash2, Users } from 'lucide-react'
import { useApp } from '../state/AppContext.jsx'
import * as study from '../lib/studyApi.js'
import { buildFlashcards, buildSummary, searchChunks } from '../lib/studygen.js'
import { Badge, Button, Card, Empty, Modal, PageHeader, Segmented, cx } from '../components/ui.jsx'
import MerideeAvatar from '../components/MerideeAvatar.jsx'
import { navigate } from '../state/router.js'
import { cloudEnabled } from '../lib/supabase.js'

const MAX_MB = 50
const input = 'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[15px] outline-none focus:border-clinic-400 dark:border-slate-700 dark:bg-slate-900'

/* ---------------- Courses ---------------- */
export function StudyHome() {
  const { user, toast } = useApp()
  const [courses, setCourses] = useState(null)
  const [modal, setModal] = useState(null) // 'create' | 'join'
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => study.listCourses(user).then(setCourses).catch((e) => { toast(e.message, 'error'); setCourses([]) })
  useEffect(() => { load() }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  async function create(e) {
    e.preventDefault(); setBusy(true)
    try { const c = await study.createCourse(user, name.trim()); setModal(null); setName(''); navigate(`course/${c.id}`) }
    catch (err) { toast(err.message, 'error') } finally { setBusy(false) }
  }
  async function join(e) {
    e.preventDefault(); setBusy(true)
    try { const id = await study.joinCourse(user, code); setModal(null); setCode(''); toast('Joined the course', 'success'); navigate(`course/${id}`) }
    catch (err) { toast(err.message, 'error') } finally { setBusy(false) }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <MerideeAvatar size="lg" />
          <div><h1 className="text-2xl font-bold tracking-tight">StudySync</h1><p className="text-sm text-slate-500">Upload your lecture PDFs – Meridee turns them into cited summaries, flashcards and searchable notes.</p></div>
        </div>
        <div className="flex gap-2">
          {user && <Button variant="secondary" icon="Users" onClick={() => setModal('join')}>Join with code</Button>}
          <Button onClick={() => setModal('create')}><Plus className="h-4 w-4" />New course</Button>
        </div>
      </div>

      {!user && cloudEnabled && (
        <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 border-sky-200 bg-sky-50/60 p-4 dark:border-sky-900 dark:bg-sky-950/30">
          <p className="text-sm"><b>Guest mode:</b> courses and notes stay on this device. Sign in to share a course with batchmates using a join code.</p>
          <a href="#/auth" className="rounded-xl bg-clinic-600 px-4 py-2 text-sm font-bold text-white">Sign in</a>
        </Card>
      )}

      {courses === null ? <Loading /> : !courses.length ? (
        <Empty icon="BookOpen" title="No courses yet">Create one, e.g. “Oral Pathology – 3rd BDS”, then upload your first lecture PDF.</Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {courses.map((c) => (
            <a key={c.id} href={`#/course/${c.id}`}><Card className="h-full p-4 transition hover:border-clinic-300 dark:hover:border-clinic-700">
              <div className="flex items-start justify-between gap-2"><p className="font-bold">{c.name}</p>{c.local ? <Badge>On this device</Badge> : <Badge tone="blue"><Users className="h-3 w-3" />{c.members ?? 1}</Badge>}</div>
              <p className="mt-2 text-sm text-slate-500">{c.documents} document{c.documents === 1 ? '' : 's'}</p>
            </Card></a>
          ))}
        </div>
      )}

      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="New course">
        <form onSubmit={create} className="space-y-3">
          <input className={input} autoFocus placeholder="e.g. Oral Pathology – 3rd BDS" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={120} required />
          <div className="flex gap-2"><Button type="button" variant="secondary" className="flex-1" onClick={() => setModal(null)}>Cancel</Button><Button type="submit" className="flex-1" disabled={busy}>Create</Button></div>
        </form>
      </Modal>
      <Modal open={modal === 'join'} onClose={() => setModal(null)} title="Join a course">
        <form onSubmit={join} className="space-y-3">
          <input className={cx(input, 'uppercase tracking-widest')} autoFocus placeholder="Join code, e.g. 7F3A91C2" value={code} onChange={(e) => setCode(e.target.value)} required />
          <div className="flex gap-2"><Button type="button" variant="secondary" className="flex-1" onClick={() => setModal(null)}>Cancel</Button><Button type="submit" className="flex-1" disabled={busy}>Join</Button></div>
        </form>
      </Modal>
    </div>
  )
}

/* ---------------- One course: documents + upload ---------------- */
export function CourseView({ id }) {
  const { user, toast } = useApp()
  const [course, setCourse] = useState(undefined)
  const [docs, setDocs] = useState(null)
  const [job, setJob] = useState(null) // { name, stage, done, total }
  const fileRef = useRef(null)

  const load = () => Promise.all([study.getCourse(user, id), study.listDocuments(user, id)])
    .then(([c, d]) => { setCourse(c); setDocs(d) }).catch((e) => { toast(e.message, 'error'); setCourse(null) })
  useEffect(() => { load() }, [id, user]) // eslint-disable-line react-hooks/exhaustive-deps

  async function upload(file) {
    if (!file) return
    if (file.type && file.type !== 'application/pdf') return toast('Please choose a PDF file', 'error')
    if (file.size > MAX_MB * 1024 * 1024) return toast(`PDF is larger than ${MAX_MB} MB`, 'error')
    setJob({ name: file.name, stage: 'reading', done: 0, total: 1 })
    try {
      const { readPdf } = await import('../lib/pdfread.js')
      const result = await readPdf(file, (stage, done, total) => setJob((j) => ({ ...j, stage, done, total })))
      if (!result.chunks.length) throw new Error('No text found in this PDF – it may be scanned images. Scanned PDFs need OCR (coming with Meridee AI).')
      setJob((j) => ({ ...j, stage: 'generating' }))
      const summary = buildSummary(result.pages, file.name.replace(/\.pdf$/i, ''))
      summary.emptyPages = result.emptyPages
      summary.cards = buildFlashcards(result.pages, summary)   // draft cards from the real page structure
      setJob((j) => ({ ...j, stage: 'saving' }))
      const doc = await study.saveDocument(user, id, file, result, summary)
      toast(`${doc.title}: ${result.pageCount} pages processed`, 'success')
      navigate(`doc/${doc.id}`)
    } catch (e) {
      toast(e.message || 'Could not read this PDF', 'error')
    } finally {
      setJob(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (course === undefined) return <Loading />
  if (!course) return <Empty icon="FileQuestion" title="Course not found"><a className="text-clinic-600" href="#/study">Back to StudySync</a></Empty>

  return (
    <div className="animate-fade-in">
      <PageHeader back="#/study" title={course.name}
        subtitle={course.local ? 'Saved on this device' : `${course.members ?? 1} member${course.members === 1 ? '' : 's'}`}
        actions={<Button onClick={() => fileRef.current?.click()} disabled={!!job}><FileUp className="h-4 w-4" />Upload lecture PDF</Button>} />
      <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />

      {course.join_code && (
        <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="text-sm"><p className="font-bold">Invite batchmates</p><p className="text-slate-500">Share this join code – they enter it under StudySync → Join with code.</p></div>
          <button onClick={() => navigator.clipboard?.writeText(course.join_code).then(() => toast('Code copied', 'success'), () => {})}
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-clinic-300 bg-clinic-50 px-4 py-2 font-mono text-lg font-bold tracking-widest text-clinic-700 dark:border-clinic-700 dark:bg-clinic-950 dark:text-clinic-300">
            {course.join_code}<Copy className="h-4 w-4" />
          </button>
        </Card>
      )}

      {job && (
        <Card className="mb-4 p-4" role="status">
          <div className="flex items-center gap-3"><Loader2 className="h-5 w-5 animate-spin text-clinic-600" /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{job.name}</p>
            <p className="text-sm text-slate-500">{job.stage === 'reading' ? `Reading page ${job.done} of ${job.total}…` : job.stage === 'cleaning' ? 'Cleaning slides and splitting into chunks…' : job.stage === 'generating' ? 'Meridee is building your summary…' : 'Saving…'}</p></div></div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full bg-sky-500 transition-all" style={{ width: `${job.stage === 'reading' ? Math.round((job.done / Math.max(1, job.total)) * 80) : job.stage === 'saving' ? 95 : 88}%` }} /></div>
        </Card>
      )}

      {docs === null ? <Loading /> : !docs.length ? (
        <button onClick={() => fileRef.current?.click()} className="block w-full text-left" disabled={!!job}>
          <Card className="grid place-items-center border-2 border-dashed px-6 py-12 text-center transition hover:border-clinic-300">
            <FileUp className="mb-3 h-10 w-10 text-clinic-500" />
            <p className="font-semibold">Upload your first lecture PDF</p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">Typed slide decks work best (up to {MAX_MB} MB). Your PDF is read on your device; nothing is sent to an AI service.</p>
          </Card>
        </button>
      ) : (
        <div className="space-y-2">
          {docs.map((d) => (
            <a key={d.id} href={`#/doc/${d.id}`}><Card className="flex items-center gap-3 p-3.5 transition hover:border-clinic-300 dark:hover:border-clinic-700">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-clinic-50 text-clinic-600 dark:bg-clinic-950"><FileText className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1"><p className="truncate font-semibold">{d.title}</p><p className="text-xs text-slate-500">{d.page_count} pages · {new Date(d.created_at).toLocaleDateString()}</p></div>
              {d.status !== 'ready' && <Badge tone={d.status === 'failed' ? 'red' : 'amber'}>{d.status}</Badge>}
            </Card></a>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------------- One document: summary, flashcards, search ---------------- */
export function DocView({ id }) {
  const { user, toast, addFlashcards, content } = useApp()
  const [doc, setDoc] = useState(undefined)
  const [tab, setTab] = useState('summary')
  const [confirmDel, setConfirmDel] = useState(false)
  useEffect(() => { study.getDocument(user, id).then(setDoc).catch((e) => { toast(e.message, 'error'); setDoc(null) }) }, [id, user]) // eslint-disable-line react-hooks/exhaustive-deps

  if (doc === undefined) return <Loading />
  if (!doc) return <Empty icon="FileQuestion" title="Document not found"><a className="text-clinic-600" href="#/study">Back to StudySync</a></Empty>
  const savedCount = content.flashcards.filter((c) => c.document_id === doc.id).length

  async function openPdf() {
    const url = await study.pdfUrl(user, doc)
    if (url) window.open(url, '_blank', 'noopener'); else toast('The original PDF is only stored for signed-in courses')
  }
  async function remove() {
    try { await study.deleteDocument(user, doc.id); toast('Document deleted'); navigate(`course/${doc.course_id}`) } catch (e) { toast(e.message, 'error') }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader back={`#/course/${doc.course_id}`} title={doc.title}
        subtitle={<span className="flex flex-wrap items-center gap-2">{doc.page_count} pages<Badge tone="blue">Meridee (offline)</Badge>{savedCount > 0 && <Badge tone="green">{savedCount} cards in your deck</Badge>}</span>}
        actions={<>
          {doc.storage_path && <Button variant="secondary" size="sm" onClick={openPdf}><ExternalLink className="h-4 w-4" />Open PDF</Button>}
          <Button variant="ghost" size="sm" onClick={() => setConfirmDel(true)} aria-label="Delete document"><Trash2 className="h-4 w-4" /></Button>
        </>} />
      <Segmented className="mb-4" value={tab} onChange={setTab} options={[['summary', 'Summary'], ['cards', 'Flashcards'], ['ask', 'Ask your slides']]} />
      {tab === 'summary' && <SummaryTab doc={doc} />}
      {tab === 'cards' && <CardsTab doc={doc} onSave={addFlashcards} savedCount={savedCount} />}
      {tab === 'ask' && <AskTab doc={doc} />}
      <Modal open={confirmDel} onClose={() => setConfirmDel(false)} title="Delete this document?">
        <p className="mb-4 text-sm text-slate-500">Its summary, chunks and the flashcards made from it will be removed for everyone in the course.</p>
        <div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={() => setConfirmDel(false)}>Cancel</Button><Button variant="danger" className="flex-1" onClick={remove}>Delete</Button></div>
      </Modal>
    </div>
  )
}

const PageChip = ({ page }) => <span className="ml-1.5 inline-flex shrink-0 items-center rounded-md bg-sky-50 px-1.5 py-0.5 align-middle text-[11px] font-bold text-sky-700 ring-1 ring-inset ring-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:ring-sky-900">p.{page}</span>

function SummaryTab({ doc }) {
  const s = doc.summary || { sections: [], keyPoints: [] }
  return (
    <div className="space-y-3">
      {!s.sections.length && <Card className="p-4 text-sm text-slate-500">No standard headings (Definition, Clinical features, Management…) were found in these slides, so Meridee picked the key points instead.</Card>}
      {s.sections.map((sec) => (
        <Card key={sec.key} className="p-4">
          <h3 className="mb-2 font-bold">{sec.label}</h3>
          <ul className="space-y-1.5 text-[15px] leading-relaxed">{sec.items.map((it, i) => <li key={i} className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" /><span>{it.text}<PageChip page={it.page} /></span></li>)}</ul>
        </Card>
      ))}
      {s.keyPoints?.length > 0 && (
        <Card className="p-4">
          <h3 className="mb-2 flex items-center gap-2 font-bold"><MerideeAvatar size="sm" />Key points Meridee picked</h3>
          <ul className="space-y-1.5 text-[15px] leading-relaxed">{s.keyPoints.map((it, i) => <li key={i} className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-clinic-500" /><span>{it.text}<PageChip page={it.page} /></span></li>)}</ul>
        </Card>
      )}
      {s.emptyPages?.length > 0 && <p className="text-xs text-slate-400">Pages with no readable text (probably images): {s.emptyPages.join(', ')}.</p>}
      <p className="text-center text-xs text-slate-400">Extracted from your slides without AI – always check against the lecture and your textbook.</p>
    </div>
  )
}

function CardsTab({ doc, onSave, savedCount }) {
  const { toast } = useApp()
  const generated = doc.summary?.cards || []
  const alreadySaved = savedCount > 0
  const [drafts, setDrafts] = useState(() => (alreadySaved ? [] : generated.map((c, i) => ({ ...c, key: i, keep: true }))))
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const kept = drafts.filter((d) => d.keep)

  async function save() {
    setSaving(true)
    try {
      await onSave(kept.map(({ front, back, page }) => ({ front, back, page, course_id: doc.course_id, document_id: doc.id })))
      toast(`${kept.length} cards added to your Leitner deck`, 'success')
      setDrafts([])
    } catch (e) { toast(e.message, 'error') } finally { setSaving(false) }
  }

  if (!drafts.length) {
    return (
      <Empty icon="Layers" title={savedCount ? `${savedCount} cards from this document are in your deck` : 'No flashcards could be made from these slides'}>
        {savedCount ? <a href="#/flashcards" className="font-semibold text-clinic-600">Review them now →</a> : 'Try slides with headings like Definition, Classification, Management.'}
      </Empty>
    )
  }
  return (
    <div>
      <Card className="mb-3 flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm"><b>{kept.length}</b> of {drafts.length} draft cards selected. Untick or edit anything wrong before adding.</p>
        <Button onClick={save} disabled={!kept.length || saving}><Layers3 className="h-4 w-4" />Add {kept.length} to my deck</Button>
      </Card>
      <div className="space-y-2">
        {drafts.map((d) => (
          <Card key={d.key} className={cx('p-3.5 transition', !d.keep && 'opacity-50')}>
            <div className="flex items-start gap-3">
              <button aria-label={d.keep ? 'Exclude card' : 'Include card'} onClick={() => setDrafts((all) => all.map((x) => (x.key === d.key ? { ...x, keep: !x.keep } : x)))}
                className={cx('mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border-2', d.keep ? 'border-clinic-600 bg-clinic-600 text-white' : 'border-slate-300 dark:border-slate-600')}>{d.keep && <Check className="h-4 w-4" />}</button>
              <div className="min-w-0 flex-1">
                {editing === d.key ? (
                  <div className="space-y-2">
                    <textarea className={cx(input, 'h-auto py-2')} rows={2} value={d.front} onChange={(e) => setDrafts((all) => all.map((x) => (x.key === d.key ? { ...x, front: e.target.value } : x)))} />
                    <textarea className={cx(input, 'h-auto py-2')} rows={4} value={d.back} onChange={(e) => setDrafts((all) => all.map((x) => (x.key === d.key ? { ...x, back: e.target.value } : x)))} />
                    <Button size="sm" onClick={() => setEditing(null)}>Done</Button>
                  </div>
                ) : (
                  <button className="block w-full text-left" onClick={() => setEditing(d.key)}>
                    <p className="font-semibold">{d.front}<PageChip page={d.page} /></p>
                    <p className="mt-1 whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">{d.back}</p>
                  </button>
                )}
              </div>
              <Badge>{d.kind}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function AskTab({ doc }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState(null)
  const run = (e) => { e.preventDefault(); setResults(searchChunks(doc.chunks || [], q, 5)) }
  return (
    <div>
      <form onSubmit={run} className="mb-3 flex gap-2">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className={cx(input, 'pl-9')} value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. treatment of keratocyst, recurrence rate…" />
        </label>
        <Button type="submit" disabled={!q.trim()}>Search</Button>
      </form>
      {results === null ? <p className="text-sm text-slate-500">Meridee searches only your uploaded slides and shows where each answer came from.</p>
        : !results.length ? <Empty icon="SearchX" title="Nothing in these slides matches">Try different words – e.g. a drug, a sign or a classification name.</Empty>
        : (
          <div className="space-y-2">
            {results.map((r, i) => (
              <Card key={i} className="p-4">
                <p className="text-[15px] leading-relaxed"><Highlight text={r.snippet} q={q} /></p>
                <p className="mt-2 text-xs font-semibold text-sky-700 dark:text-sky-300">Slides p.{r.chunk.page_from}{r.chunk.page_to !== r.chunk.page_from ? `–${r.chunk.page_to}` : ''}</p>
              </Card>
            ))}
          </div>
        )}
    </div>
  )
}

function Highlight({ text, q }) {
  const terms = (q.toLowerCase().match(/[a-z][a-z0-9-]{2,}/g) || []).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  if (!terms.length) return text
  const parts = text.split(new RegExp(`(${terms.join('|')})`, 'ig'))
  return parts.map((p, i) => (i % 2 ? <mark key={i} className="rounded bg-sky-100 px-0.5 text-inherit dark:bg-sky-900/60">{p}</mark> : p))
}

const Loading = () => <div className="grid place-items-center py-16 text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>

