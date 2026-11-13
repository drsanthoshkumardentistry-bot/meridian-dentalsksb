// App-wide settings.
export const SUPPORT_EMAIL = 'santhoshkumar@meridiandentalos.com'

/** mailto: link with a prefilled subject (and optional body). */
export const supportMailto = (subject, body = '') =>
  `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ''}`
