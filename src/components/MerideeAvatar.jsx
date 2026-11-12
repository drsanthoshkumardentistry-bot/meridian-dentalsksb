import { cx } from './ui.jsx'

/** Meridee's avatar: a tooth-shaped spark in the brand gradient. */
export default function MerideeAvatar({ size = 'md', className }) {
  const box = size === 'lg' ? 'h-12 w-12 rounded-2xl' : size === 'sm' ? 'h-8 w-8 rounded-full' : 'h-10 w-10 rounded-xl'
  const icon = size === 'lg' ? 26 : size === 'sm' ? 16 : 20
  return (
    <span className={cx('grid shrink-0 place-items-center bg-gradient-to-br from-clinic-600 to-sky-500 text-white shadow-sm', box, className)} aria-label="Meridee" role="img">
      <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M7.5 4.5c-2.2 0-3.5 1.8-3.5 4.3 0 3.3 1.7 5 2.5 8.4.4 1.7 2.1 1.7 2.5 0l.8-3.6c.4-1.4 1.8-1.4 2.2 0l.8 3.6c.4 1.7 2.1 1.7 2.5 0 .8-3.4 2.5-5.1 2.5-8.4 0-2.5-1.3-4.3-3.5-4.3-1.7 0-2.6.9-3.9.9s-2.2-.9-3.9-.9z" fill="currentColor" opacity=".95" />
        <path d="M18.5 2.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z" fill="currentColor" />
      </svg>
    </span>
  )
}
