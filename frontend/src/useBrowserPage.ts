import { useEffect, useRef, useState } from 'react'

type PageHistory = { laweaPage?: string; laweaSession?: string; laweaScrollY?: number }

const routeNames: Record<string, string> = { dashboard: 'stichtage', account: 'profil', members: 'mitarbeiter', help: 'hilfe', review: 'pruefung', registrations: 'registrierungen', finance: 'abwicklung', audit: 'audit', credits: 'gutschriften', claims: 'stichtage' }
const fromNames: Record<string, string> = { ...Object.fromEntries(Object.entries(routeNames).map(([key, value]) => [value, key])), stichtage: 'dashboard' }
export function routeFor(page: string) {
  const [kind, id] = page.split(':')
  if (kind === 'help' && id === 'members') return '#/hilfe/mitarbeiter'
  if (kind === 'term' && id) return `#/stichtag/${encodeURIComponent(id)}`
  if (kind === 'claim' && id) return `#/meldung/${encodeURIComponent(id)}`
  if (kind === 'sample' && id) return `#/beispielmeldung/${encodeURIComponent(id)}`
  if (kind === 'credits' && id) return `#/gutschrift/${encodeURIComponent(id)}`
  return `#/${routeNames[page] || 'stichtage'}`
}
export function pageFromRoute() {
  const segments = window.location.hash.replace(/^#\/?/, '').split('/')
  let id = ''
  try { id = segments[1] ? decodeURIComponent(segments[1]) : '' } catch { return 'dashboard' }
  if (segments[0] === 'hilfe' && id === 'mitarbeiter') return 'help:members'
  if (segments[0] === 'stichtag' && id) return `term:${id}`
  if (segments[0] === 'meldung' && id) return `claim:${id}`
  if (segments[0] === 'beispielmeldung' && id) return `sample:${id}`
  if (segments[0] === 'gutschrift' && id) return `credits:${id}`
  return fromNames[segments[0]] || 'dashboard'
}

// Browser-Verlauf für die Seiten innerhalb der Demo; Anmeldung und Daten bleiben im jeweiligen App-Zustand.
export function useBrowserPage(initialPage = 'dashboard') {
  const [page, setPage] = useState(() => pageFromRoute())
  const pageRef = useRef(page)
  const sessionRef = useRef(crypto.randomUUID())

  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    window.history.replaceState({ ...window.history.state, laweaPage: pageRef.current, laweaSession: sessionRef.current, laweaScrollY: window.scrollY }, '', routeFor(pageRef.current))
    const onPopState = (event: PopStateEvent) => {
      const state = (event.state || {}) as PageHistory
      const nextPage = state.laweaSession === sessionRef.current && typeof state.laweaPage === 'string' ? state.laweaPage : pageFromRoute()
      pageRef.current = nextPage
      setPage(nextPage)
      requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, state.laweaSession === sessionRef.current ? state.laweaScrollY || 0 : 0)))
    }
    window.addEventListener('popstate', onPopState)
    return () => {
      window.removeEventListener('popstate', onPopState)
      window.history.scrollRestoration = previousRestoration
    }
  }, [initialPage])

  const navigate = (nextPage: string) => {
    if (nextPage === pageRef.current) {
      window.scrollTo(0, 0)
      return
    }
    window.history.replaceState({ ...window.history.state, laweaPage: pageRef.current, laweaSession: sessionRef.current, laweaScrollY: window.scrollY }, '')
    window.history.pushState({ ...window.history.state, laweaPage: nextPage, laweaSession: sessionRef.current, laweaScrollY: 0 }, '', routeFor(nextPage))
    pageRef.current = nextPage
    setPage(nextPage)
    window.scrollTo(0, 0)
  }

  const resetPage = (nextPage = initialPage) => {
    sessionRef.current = crypto.randomUUID()
    window.history.replaceState({ ...window.history.state, laweaPage: nextPage, laweaSession: sessionRef.current, laweaScrollY: 0 }, '', routeFor(nextPage))
    pageRef.current = nextPage
    setPage(nextPage)
    window.scrollTo(0, 0)
  }

  return { page, navigate, resetPage }
}
