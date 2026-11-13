import { useEffect, useState } from 'react'
import { LifeBuoy, LogOut, Mail } from 'lucide-react'
import { SUPPORT_EMAIL, supportMailto } from '../lib/config.js'
import { useApp } from '../state/AppContext.jsx'
import { supabase, cloudEnabled } from '../lib/supabase.js'
import { Button, Card, Modal, PageHeader, Segmented } from '../components/ui.jsx'
import { navigate } from '../state/router.js'

const input = 'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[15px] outline-none focus:border-clinic-400 dark:border-slate-700 dark:bg-slate-900'

export function Auth() {
  const { user, toast } = useApp()
  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({ email: '', password: '', name: '' })
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  useEffect(() => { if (user) navigate('home') }, [user])
  if (!cloudEnabled) return <Card className="p-6 text-center">Cloud sync isn't configured for this build – you're in offline mode.</Card>

  async function submit(e) {
    e.preventDefault(); setBusy(true)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
        if (error) throw error
        toast('Signed in', 'success')
      } else {
        const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password, options: { data: { full_name: form.name }, emailRedirectTo: window.location.origin } })
        if (error) throw error
        if (!data.session) setSent(true); else toast('Account created', 'success')
      }
    } catch (err) {
      toast(err.message || 'Something went wrong', 'error')
    } finally { setBusy(false) }
  }

  return (
    <div className="mx-auto max-w-md animate-fade-in">
      <PageHeader title={mode === 'signin' ? 'Welcome back' : 'Create your account'} subtitle="Sync flashcards, viva scores and tests across your devices." />
      <Card className="p-5">
        <Segmented className="mb-4" value={mode} onChange={setMode} options={[['signin', 'Sign in'], ['signup', 'Sign up']]} />
        {sent ? (
          <div className="py-6 text-center"><Mail className="mx-auto mb-2 h-8 w-8 text-clinic-600" /><p className="font-bold">Check your inbox</p><p className="text-sm text-slate-500">We sent a confirmation link to {form.email}. Open it, then sign in.</p></div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            {mode === 'signup' && <input className={input} placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />}
            <input className={input} type="email" autoComplete="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <input className={input} type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} placeholder="Password (min 6 characters)" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}</Button>
          </form>
        )}
      </Card>
      <a href="#/home" className="mt-4 block text-center text-sm font-semibold text-slate-500">Continue as guest</a>
    </div>
  )
}

const UNIVERSITIES = ['The Tamil Nadu Dr. M.G.R. Medical University', 'Rajiv Gandhi University of Health Sciences', 'Maharashtra University of Health Sciences', 'Kerala University of Health Sciences', 'Dr. NTR University of Health Sciences', 'Other']

export function Profile() {
  const { profile, user, updateProfile, signOut, toast, resetProgress } = useApp()
  const [f, setF] = useState({ full_name: '', bds_year: 1, university: '', college: '', target_exam: 'University' })
  const [confirm, setConfirm] = useState(false)
  useEffect(() => { if (profile) setF((x) => ({ ...x, ...Object.fromEntries(Object.entries(profile).filter(([, v]) => v != null)) })) }, [profile])
  async function save(e) {
    e.preventDefault()
    try { await updateProfile({ full_name: f.full_name, bds_year: Number(f.bds_year), university: f.university, college: f.college, target_exam: f.target_exam }); toast('Profile saved', 'success') }
    catch (err) { toast(err.message, 'error') }
  }
  return (
    <div className="mx-auto max-w-lg animate-fade-in">
      <PageHeader title="Your profile" subtitle={user ? user.email : 'Guest – saved on this device'} />
      <Card className="p-5">
        <form onSubmit={save} className="space-y-4">
          <label className="block"><span className="mb-1 block text-sm font-bold">Name</span><input className={input} value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></label>
          <div><span className="mb-1 block text-sm font-bold">BDS year</span><Segmented value={Number(f.bds_year)} onChange={(v) => setF({ ...f, bds_year: v })} options={[[1, '1st'], [2, '2nd'], [3, '3rd'], [4, 'Final'], [5, 'Intern']]} /></div>
          <label className="block"><span className="mb-1 block text-sm font-bold">University</span>
            <input className={input} list="unis" value={f.university} onChange={(e) => setF({ ...f, university: e.target.value })} placeholder="Start typing…" />
            <datalist id="unis">{UNIVERSITIES.map((u) => <option key={u} value={u} />)}</datalist></label>
          <label className="block"><span className="mb-1 block text-sm font-bold">College</span><input className={input} value={f.college} onChange={(e) => setF({ ...f, college: e.target.value })} /></label>
          <div><span className="mb-1 block text-sm font-bold">Preparing for</span><Segmented value={f.target_exam} onChange={(v) => setF({ ...f, target_exam: v })} options={[['University', 'University'], ['NEET MDS', 'MDS (NEET)'], ['ADC', 'ADC (Australia)']]} /></div>
          <Button type="submit" className="w-full">Save profile</Button>
        </form>
      </Card>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {user && <Button variant="secondary" onClick={signOut}><LogOut className="h-4 w-4" />Sign out</Button>}
        {!user && cloudEnabled && <Button variant="secondary" onClick={() => navigate('auth')}>Sign in to sync</Button>}
        {!user && <Button variant="ghost" onClick={() => setConfirm(true)}>Reset local progress</Button>}
      </div>
      <Card className="mt-4 flex items-start gap-3 p-4">
        <LifeBuoy className="mt-0.5 h-5 w-5 shrink-0 text-clinic-600" />
        <div className="min-w-0 text-sm">
          <p className="font-bold">Contact & feedback</p>
          <p className="text-slate-500">Found a wrong answer, a bug, or want a topic added? Write to us.</p>
          <a href={supportMailto('MeriDent Prep feedback')} className="mt-1 inline-block break-all font-semibold text-clinic-600 hover:underline">{SUPPORT_EMAIL}</a>
        </div>
      </Card>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Reset progress on this device?">
        <p className="mb-4 text-sm text-slate-500">Clears flashcard boxes, spotter attempts, viva history and MCQ answers stored on this device.</p>
        <div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={() => setConfirm(false)}>Cancel</Button><Button variant="danger" className="flex-1" onClick={() => { resetProgress(); try { localStorage.removeItem('ma-progress-v1') } catch { /* ignore */ } setConfirm(false); toast('Progress reset') }}>Reset</Button></div>
      </Modal>
    </div>
  )
}
