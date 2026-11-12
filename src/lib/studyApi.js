// StudySync data layer: guests keep courses/documents on this device; signed-in users use Supabase
// (courses are shared with members via a join code, protected by RLS).
import { supabase } from './supabase.js'

const KEY = 'ma-study-v1'
const empty = () => ({ courses: [], documents: [], cards: [] })
const read = () => { try { return { ...empty(), ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { return empty() } }
const write = (s) => {
  try { localStorage.setItem(KEY, JSON.stringify(s)) } catch (e) { throw new Error('This device is out of storage for offline notes. Sign in to save to the cloud.') }
}
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`)
const cloud = (user) => Boolean(user && supabase)

export async function listCourses(user) {
  if (!cloud(user)) return read().courses.map((c) => ({ ...c, documents: read().documents.filter((d) => d.course_id === c.id).length }))
  const { data, error } = await supabase.from('courses').select('id,name,join_code,created_by,created_at,documents(count),course_members(count)').order('created_at', { ascending: false })
  if (error) throw error
  return data.map((c) => ({ ...c, documents: c.documents?.[0]?.count ?? 0, members: c.course_members?.[0]?.count ?? 1 }))
}

export async function createCourse(user, name) {
  if (!cloud(user)) {
    const s = read()
    const c = { id: uid(), name, join_code: null, created_at: new Date().toISOString(), local: true }
    s.courses.unshift(c); write(s); return c
  }
  const { data, error } = await supabase.from('courses').insert({ name }).select().single()
  if (error) throw error
  return data
}

export async function joinCourse(user, code) {
  if (!cloud(user)) throw new Error('Sign in to join a shared course')
  const { data, error } = await supabase.rpc('join_course', { p_code: code })
  if (error) throw new Error(/invalid join code/.test(error.message) ? 'No course found with that code' : error.message)
  return data
}

export async function getCourse(user, id) {
  if (!cloud(user)) return read().courses.find((c) => c.id === id) || null
  const { data, error } = await supabase.from('courses').select('id,name,join_code,created_by,created_at,course_members(count)').eq('id', id).maybeSingle()
  if (error) throw error
  return data && { ...data, members: data.course_members?.[0]?.count ?? 1 }
}

export async function listDocuments(user, courseId) {
  if (!cloud(user)) return read().documents.filter((d) => d.course_id === courseId).map(({ chunks, ...d }) => d)
  const { data, error } = await supabase.from('documents').select('id,course_id,title,page_count,status,created_at,uploaded_by').eq('course_id', courseId).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getDocument(user, id) {
  if (!cloud(user)) return read().documents.find((d) => d.id === id) || null
  const [{ data: doc, error: e1 }, { data: chunks, error: e2 }] = await Promise.all([
    supabase.from('documents').select('*').eq('id', id).maybeSingle(),
    supabase.from('document_chunks').select('ordinal,page_from,page_to,content,token_count').eq('document_id', id).order('ordinal'),
  ])
  if (e1 || e2) throw e1 || e2
  return doc && { ...doc, chunks }
}

/** Save an extracted document (+ chunks, + the PDF itself for signed-in users). */
export async function saveDocument(user, courseId, file, { chunks, pageCount }, summary) {
  const title = summary.title || file.name.replace(/\.pdf$/i, '')
  if (!cloud(user)) {
    const s = read()
    const d = { id: uid(), course_id: courseId, title, page_count: pageCount, status: 'ready', summary, chunks, created_at: new Date().toISOString(), file_name: file.name }
    s.documents.unshift(d); write(s); return d
  }
  const { data: doc, error } = await supabase.from('documents')
    .insert({ course_id: courseId, title, page_count: pageCount, status: 'extracting', summary, kind: 'pdf' }).select().single()
  if (error) throw error
  for (let i = 0; i < chunks.length; i += 100) {
    const { error: ce } = await supabase.from('document_chunks').insert(chunks.slice(i, i + 100).map((c) => ({ ...c, document_id: doc.id, course_id: courseId })))
    if (ce) { await supabase.from('documents').update({ status: 'failed', error: ce.message }).eq('id', doc.id); throw ce }
  }
  // Keep the original PDF so course-mates can open it (best effort – the study assets don't depend on it).
  const path = `${courseId}/${doc.id}.pdf`
  const up = await supabase.storage.from('course-files').upload(path, file, { contentType: 'application/pdf', upsert: false })
  await supabase.from('documents').update({ status: 'ready', storage_path: up.error ? null : path }).eq('id', doc.id)
  return { ...doc, status: 'ready', storage_path: up.error ? null : path }
}

export async function deleteDocument(user, id) {
  if (!cloud(user)) {
    const s = read()
    s.documents = s.documents.filter((d) => d.id !== id)
    s.cards = s.cards.filter((c) => c.document_id !== id)
    write(s); return
  }
  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) throw error
}

export async function pdfUrl(user, doc) {
  if (!cloud(user) || !doc.storage_path) return null
  const { data } = await supabase.storage.from('course-files').createSignedUrl(doc.storage_path, 3600)
  return data?.signedUrl || null
}

/** Approved cards → the user's Leitner deck. Returns the saved cards (with ids). */
export async function addCards(user, cards) {
  if (!cloud(user)) {
    const s = read()
    let next = Math.max(900000, ...s.cards.map((c) => c.id)) + 1
    const saved = cards.map((c) => ({ id: next++, topic_id: null, created_by: 'local', origin: 'auto', ...c }))
    s.cards.push(...saved); write(s); return saved
  }
  const { data, error } = await supabase.from('flashcards')
    .insert(cards.map((c) => ({ front: c.front, back: c.back, course_id: c.course_id, document_id: c.document_id, page: c.page, origin: 'auto', created_by: user.id })))
    .select()
  if (error) throw error
  return data
}

/** Guest-mode cards saved on this device (cloud cards arrive with the normal flashcard load). */
export function localCards() { return read().cards }
