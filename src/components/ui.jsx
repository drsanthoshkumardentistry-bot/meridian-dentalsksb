import { Activity, Baby, BookMarked, BookOpen, ChevronLeft, ClipboardList, FileQuestion, Flame, FlaskConical, Gauge, GitBranch, HeartPulse, ImageOff, Inbox, Layers, ListTree, MessageSquareWarning, Mic, Microscope, Pill, Play, ScanLine, Scissors, SearchX, Shield, Shuffle, Sparkles, Stethoscope, Timer } from 'lucide-react'

// Explicit map keeps the bundle small; unknown names (e.g. from the DB) fall back to BookOpen.
const Icons = { Activity, Baby, BookMarked, BookOpen, ChevronLeft, ClipboardList, FileQuestion, Flame, FlaskConical, Gauge, GitBranch, HeartPulse, ImageOff, Inbox, Layers, ListTree, MessageSquareWarning, Mic, Microscope, Pill, Play, ScanLine, Scissors, SearchX, Shield, Shuffle, Sparkles, Stethoscope, Timer }

export const cx = (...c) => c.filter(Boolean).join(' ')

export function Icon({ name, ...props }) {
  const C = Icons[name] || Icons.BookOpen
  return <C {...props} />
}

export function Card({ className, children, ...rest }) {
  return <div className={cx('rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900', className)} {...rest}>{children}</div>
}

const BTN = {
  primary: 'bg-clinic-600 text-white hover:bg-clinic-700 active:bg-clinic-800 disabled:bg-slate-300 dark:disabled:bg-slate-700',
  secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
  ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
}
export function Button({ variant = 'primary', size = 'md', className, icon, children, ...rest }) {
  const sz = size === 'sm' ? 'h-9 px-3 text-sm gap-1.5' : size === 'lg' ? 'h-12 px-5 text-base gap-2' : 'h-10 px-4 text-sm gap-2'
  return (
    <button className={cx('inline-flex items-center justify-center rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-60', sz, BTN[variant], className)} {...rest}>
      {icon && <Icon name={icon} className="h-4 w-4 shrink-0" />}{children}
    </button>
  )
}

const BADGE = {
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  blue: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:ring-sky-900',
  red: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  violet: 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
}
export function Badge({ tone = 'slate', className, children }) {
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', BADGE[tone], className)}>{children}</span>
}

export const PriorityBadge = ({ priority }) => priority === 'must_know'
  ? <Badge tone="red"><Icons.Flame className="h-3 w-3" />Must-Know</Badge>
  : <Badge tone="slate">Desirable</Badge>

export function PageHeader({ title, subtitle, back, actions }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {back && <a href={back} className="mb-1 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-clinic-600"><Icons.ChevronLeft className="h-4 w-4" />Back</a>}
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Meter({ label, value, tone = 'blue', hint }) {
  const color = value >= 75 ? 'bg-emerald-500' : value >= 50 ? (tone === 'blue' ? 'bg-sky-500' : 'bg-amber-500') : 'bg-rose-500'
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs font-semibold"><span className="text-slate-600 dark:text-slate-300">{label}</span><span className="tabular-nums">{value ?? '–'}{value != null && '%'}</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className={cx('h-full rounded-full transition-all duration-500', color)} style={{ width: `${value ?? 0}%` }} /></div>
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </div>
  )
}

export function Ring({ value, max = 100, size = 120, label, sub }) {
  const r = (size - 14) / 2, C = 2 * Math.PI * r, pct = Math.max(0, Math.min(1, value / max))
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="12" className="stroke-slate-100 dark:stroke-slate-800" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="12" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} className="stroke-sky-500 transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center"><div><div className="text-2xl font-extrabold tabular-nums">{label}</div>{sub && <div className="text-xs text-slate-500">{sub}</div>}</div></div>
    </div>
  )
}

export function Segmented({ options, value, onChange, className }) {
  return (
    <div className={cx('flex flex-wrap gap-1.5', className)}>
      {options.map((o) => {
        const [v, l] = Array.isArray(o) ? o : [o, o]
        return (
          <button key={v} onClick={() => onChange(v)} className={cx('rounded-lg border px-3 py-1.5 text-sm font-semibold transition',
            value === v ? 'border-clinic-500 bg-clinic-50 text-clinic-700 dark:border-clinic-400 dark:bg-clinic-950 dark:text-clinic-300' : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800')}>{l}</button>
        )
      })}
    </div>
  )
}

export function Empty({ icon = 'Inbox', title, children }) {
  return (
    <Card className="grid place-items-center px-6 py-12 text-center">
      <Icon name={icon} className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-1 text-sm text-slate-500">{children}</div>}
    </Card>
  )
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/50 p-3 sm:place-items-center" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <Card className="w-full max-w-md animate-fade-in p-5">
        {title && <h3 className="mb-2 text-lg font-bold">{title}</h3>}
        {children}
      </Card>
    </div>
  )
}

export const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`
export const shuffle = (a) => { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[x[i], x[j]] = [x[j], x[i]] } return x }
