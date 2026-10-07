import { useEffect, useRef, useState } from 'react'

type PageHistory = { laweaPage?: string; laweaSession?: string; laweaScrollY?: number }

// Browser-Verlauf für die Seiten innerhalb der Demo; Anmeldung und Daten bleiben im jeweiligen App-Zustand.
export function useBrowserPage(initialPage = 'dashboard') {
  const [page, setPage] = useState(initialPage)
  const pageRef = useRef(initialPage)
  const sessionRef = useRef(crypto.randomUUID())

  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    window.history.replaceState({ ...window.history.state, laweaPage: initialPage, laweaSession: sessionRef.current, laweaScrollY: window.scrollY }, '')
    const onPopState = (event: PopStateEvent) => {
      const state = (event.state || {}) as PageHistory
      const nextPage = state.laweaSession === sessionRef.current && typeof state.laweaPage === 'string' ? state.laweaPage : initialPage
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
    window.history.pushState({ ...window.history.state, laweaPage: nextPage, laweaSession: sessionRef.current, laweaScrollY: 0 }, '')
    pageRef.current = nextPage
    setPage(nextPage)
    window.scrollTo(0, 0)
  }

  const resetPage = (nextPage = initialPage) => {
    sessionRef.current = crypto.randomUUID()
    window.history.replaceState({ ...window.history.state, laweaPage: nextPage, laweaSession: sessionRef.current, laweaScrollY: 0 }, '')
    pageRef.current = nextPage
    setPage(nextPage)
    window.scrollTo(0, 0)
  }

  return { page, navigate, resetPage }
}
