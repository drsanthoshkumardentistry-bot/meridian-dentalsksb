import { BookOpenCheck, ClipboardList, Layers3, LayoutDashboard, LogIn, Mic, Moon, ScanEye, Sun, UserRound } from 'lucide-react'
import { useApp } from '../state/AppContext.jsx'
import { cloudEnabled } from '../lib/supabase.js'
import { cx } from './ui.jsx'

const NAV = [
  { to: 'home', label: 'Dashboard', short: 'Home', icon: LayoutDashboard },
  { to: 'topics', label: 'Topic Hub', short: 'Topics', icon: BookOpenCheck },
  { to: 'viva', label: 'Viva Simulator', short: 'Viva', icon: Mic },
  { to: 'spotters', label: 'Spotter Bank', short: 'Spotters', icon: ScanEye },
  { to: 'flashcards', label: 'Flashcards', short: 'Cards', icon: Layers3 },
  { to: 'mcq', label: 'NEET MDS MCQs', short: 'MCQs', icon: ClipboardList },
]
const ACTIVE = { topic: 'topics', 'viva-session': 'viva' }

export default function Layout({ route, children }) {
  const { theme, setTheme, user, profile, notice: toast } = useApp()
  const active = ACTIVE[route.path] || route.path
  const ThemeIcon = theme === 'dark' ? Sun : Moon

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white px-4 py-5 dark:border-slate-800 dark:bg-slate-900 lg:flex">
        <Brand />
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map(({ to, label, icon: I }) => (
            <a key={to} href={`#/${to}`} className={cx('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
              active === to ? 'bg-clinic-50 text-clinic-700 dark:bg-clinic-950 dark:text-clinic-300' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800')}>
              <I className="h-[18px] w-[18px]" />{label}
            </a>
          ))}
        </nav>
        <div className="space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
            <ThemeIcon className="h-[18px] w-[18px]" />{theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <AccountLink user={user} profile={profile} />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 lg:hidden">
        <Brand compact />
        <div className="flex items-center gap-1">
          <button aria-label="Toggle theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="grid h-9 w-9 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"><ThemeIcon className="h-5 w-5" /></button>
          <a aria-label="Account" href={user || !cloudEnabled ? '#/profile' : '#/auth'} className="grid h-9 w-9 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">{user ? <UserRound className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}</a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-5 sm:px-6 lg:pb-10 lg:pt-8">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 lg:hidden">
        {NAV.map(({ to, short, icon: I }) => (
          <a key={to} href={`#/${to}`} className={cx('flex flex-col items-center gap-0.5 py-2 text-[10.5px] font-semibold', active === to ? 'text-clinic-600 dark:text-clinic-400' : 'text-slate-500')}>
            <I className="h-5 w-5" />{short}
          </a>
        ))}
      </nav>

      {toast && (
        <div role="status" className={cx('fixed bottom-20 left-1/2 z-50 -translate-x-1/2 animate-fade-in rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg lg:bottom-6',
          toast.kind === 'error' ? 'bg-rose-600' : toast.kind === 'success' ? 'bg-emerald-600' : 'bg-slate-800')}>{toast.msg}</div>
      )}
    </div>
  )
}

function Brand({ compact }) {
  return (
    <a href="#/home" className="flex items-center gap-2.5">
      <img src="favicon.svg" alt="" className={compact ? 'h-8 w-8' : 'h-9 w-9'} />
      <div className="leading-tight">
        <div className="font-extrabold tracking-tight">MeriDent <span className="text-clinic-600 dark:text-clinic-400">Academy</span></div>
        {!compact && <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">BDS · Viva · NEET MDS</div>}
      </div>
    </a>
  )
}

function AccountLink({ user, profile }) {
  if (!user && cloudEnabled) return <a href="#/auth" className="flex items-center gap-3 rounded-xl bg-clinic-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-clinic-700"><LogIn className="h-[18px] w-[18px]" />Sign in to sync</a>
  return (
    <a href="#/profile" className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-clinic-100 text-sm font-bold text-clinic-700 dark:bg-clinic-900 dark:text-clinic-200">{(profile?.full_name || user?.email || 'G')[0].toUpperCase()}</span>
      <span className="min-w-0 text-sm"><span className="block truncate font-semibold">{profile?.full_name || (user ? user.email : 'Guest')}</span><span className="block truncate text-xs text-slate-500">{profile?.bds_year ? (profile.bds_year === 5 ? 'Intern' : `BDS Year ${profile.bds_year}`) : 'Set up profile'}</span></span>
    </a>
  )
}
