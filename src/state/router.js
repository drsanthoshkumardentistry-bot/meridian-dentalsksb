import { useEffect, useState } from 'react'

// Tiny hash router: #/topic/ameloblastoma → { path: 'topic', parts: ['topic','ameloblastoma'] }
function parse() {
  const raw = (window.location.hash || '#/').replace(/^#\/?/, '')
  const [pathPart, query = ''] = raw.split('?')
  const parts = pathPart.split('/').filter(Boolean).map(decodeURIComponent)
  return { path: parts[0] || 'home', parts, query: new URLSearchParams(query) }
}

export function useRoute() {
  const [route, setRoute] = useState(parse)
  useEffect(() => {
    const on = () => { setRoute(parse()); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}

export const navigate = (to) => { window.location.hash = to.startsWith('#') ? to : `#/${to.replace(/^\//, '')}` }
