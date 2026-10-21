import { useCallback, useEffect, useRef, useState } from 'react'
import type { Status } from './types'
import { Icon } from './ui'
import './preview-dashboard.css'

export type DashboardTerm = {
  iso: string
  date: string
  status: Status | null
  target: string
  disabled?: boolean
}

type StatusFilter = 'new' | 'draft' | 'submitted' | 'correction' | 'completed'

export type DashboardView = { sortOrder: 'newest' | 'oldest'; selectedStatuses: StatusFilter[]; visibleMonths: number }
export const initialDashboardView = (_preview: boolean): DashboardView => ({ sortOrder: 'newest', selectedStatuses: [], visibleMonths: 6 })

const matchesSingleFilter = (term: DashboardTerm, filter: StatusFilter) => {
  if (filter === 'new') return !term.status && !term.disabled
  if (filter === 'draft') return term.status === 'DRAFT'
  if (filter === 'submitted') return term.status === 'MANUAL_REVIEW' || term.status === 'APPROVED'
  if (filter === 'correction') return term.status === 'REJECTED'
  if (filter === 'completed') return term.status === 'COMPLETED'
  return false
}

const filters: { key: StatusFilter; label: string }[] = [
  { key: 'new', label: 'Neu' },
  { key: 'draft', label: 'Entwurf' },
  { key: 'submitted', label: 'Eingereicht' },
  { key: 'correction', label: 'Bitte korrigieren' },
  { key: 'completed', label: 'Ausgezahlt' }
]

const previewStatus = (status: Status | null) => {
  if (status === 'DRAFT') return 'Entwurf'
  if (status === 'MANUAL_REVIEW') return 'Eingereicht'
  if (status === 'COMPLETED') return 'Ausgezahlt'
  if (status === 'REJECTED') return 'Bitte korrigieren'
  if (status === 'APPROVED') return 'Freigegeben'
  if (status === 'CANCELLED') return 'Abgebrochen'
  return ''
}

const MONTHS_PER_LOAD = 12

export function PreviewDashboard({ terms, navigate, view, onViewChange, demoLoadDelayMs = 600 }: { terms: DashboardTerm[]; navigate: (page: string) => void; view: DashboardView; onViewChange: (view: DashboardView) => void; demoLoadDelayMs?: number }) {
  const { sortOrder, selectedStatuses, visibleMonths } = view
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasScrollIntent, setHasScrollIntent] = useState(false)
  const loadingRef = useRef(false)
  const updateView = (change: Partial<DashboardView>) => {
    if (change.sortOrder !== undefined || change.selectedStatuses !== undefined) {
      loadingRef.current = false
      setLoadingMore(false)
      setHasScrollIntent(false)
    }
    onViewChange({ ...view, ...change })
  }
  const sentinelRef = useRef<HTMLDivElement>(null)
  const filteredTerms = terms.filter(term => selectedStatuses.length === 0 || selectedStatuses.some(status => matchesSingleFilter(term, status)))
  const sortedTerms = [...filteredTerms].sort((a, b) => sortOrder === 'newest' ? b.iso.localeCompare(a.iso) : a.iso.localeCompare(b.iso))
  const groupedMonths = sortedTerms.reduce<{ key: string; label: string; year: string; terms: DashboardTerm[] }[]>((groups, term) => {
    const key = term.iso.slice(0, 7)
    const last = groups[groups.length - 1]
    if (last?.key === key) last.terms.push(term)
    else groups.push({
      key,
      label: new Intl.DateTimeFormat('de-DE', { month: 'long', timeZone: 'UTC' }).format(new Date(`${key}-01T12:00:00Z`)),
      year: key.slice(0, 4),
      terms: [term]
    })
    return groups
  }, [])
  const months = groupedMonths.slice(0, visibleMonths)
  const shownTerms = months.flatMap(month => month.terms)
  const hasMore = visibleMonths < groupedMonths.length
  const placeholderMonths = Math.min(MONTHS_PER_LOAD, groupedMonths.length - visibleMonths)
  const loadMore = useCallback(() => {
    if (!hasMore || loadingRef.current) return
    loadingRef.current = true
    setLoadingMore(true)
  }, [hasMore])
  const finishLoading = useCallback(() => {
    if (!loadingRef.current) return
    loadingRef.current = false
    setLoadingMore(false)
    onViewChange({ ...view, visibleMonths: Math.min(view.visibleMonths + MONTHS_PER_LOAD, groupedMonths.length) })
  }, [view, groupedMonths.length, onViewChange])
  useEffect(() => {
    if (!loadingMore) return
    const finishBeforeEdge = () => {
      const remaining = document.documentElement.scrollHeight - window.scrollY - window.innerHeight
      if (remaining < window.innerHeight * 1.25) finishLoading()
    }
    const timer = window.setTimeout(finishLoading, demoLoadDelayMs)
    window.addEventListener('scroll', finishBeforeEdge, { passive: true })
    window.addEventListener('resize', finishBeforeEdge)
    finishBeforeEdge()
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('scroll', finishBeforeEdge)
      window.removeEventListener('resize', finishBeforeEdge)
    }
  }, [loadingMore, demoLoadDelayMs, finishLoading])
  useEffect(() => {
    const markScrollIntent = () => setHasScrollIntent(true)
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (['ArrowDown', 'PageDown', 'End', ' '].includes(event.key)) markScrollIntent()
    }
    window.addEventListener('wheel', markScrollIntent, { passive: true })
    window.addEventListener('touchmove', markScrollIntent, { passive: true })
    window.addEventListener('scroll', markScrollIntent, { passive: true })
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('wheel', markScrollIntent)
      window.removeEventListener('touchmove', markScrollIntent)
      window.removeEventListener('scroll', markScrollIntent)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])
  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasMore || loadingMore || !hasScrollIntent) return
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) loadMore()
    }, { rootMargin: '0px 0px 120% 0px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, hasScrollIntent, visibleMonths, loadMore])

  return <div className="overview-simple">
    <header className="overview-simple-heading">
      <div><h1>Stichtage</h1></div>
    </header>
    {terms.length > 0 ? <div className="overview-toolbar">
      <div className="overview-status-tabs" role="group" aria-label="Meldungsstand filtern">
        <button type="button" className="overview-status-tab overview-status-tab-all" aria-pressed={selectedStatuses.length === 0} onClick={() => updateView({ selectedStatuses: [], visibleMonths: 6 })}>Alle</button>
        {filters.map(item => <button key={item.key} type="button" className={`overview-status-tab overview-status-tab-${item.key}`} aria-pressed={selectedStatuses.length === 1 && selectedStatuses[0] === item.key} onClick={() => updateView({ selectedStatuses: [item.key], visibleMonths: 6 })}>{item.label}</button>)}
      </div>
      <div className="overview-sort-switch" role="group" aria-label="Nach Datum sortieren">
        {(['newest', 'oldest'] as const).map(order => <button key={order} type="button" aria-pressed={sortOrder === order} onClick={() => updateView({ sortOrder: order, visibleMonths: 6 })}>{order === 'newest' ? 'Neueste zuerst' : 'Älteste zuerst'}</button>)}
      </div>
    </div> : null}
    <section className="overview-simple-list" aria-label="Stichtage und Meldungsstand">
      <div className="overview-simple-columns"><span>Zeitraum</span><span>Stichtag</span><span>Stand</span></div>
      {shownTerms.length ? months.map(month => <div className="overview-month" key={month.key}>
        <div className="overview-month-label"><h2>{month.label}</h2><span>{month.year}</span></div>
        <div className="overview-month-rows">{month.terms.map(term => <button className={`overview-simple-row${term.status ? ` overview-simple-row-${term.status.toLowerCase()}` : ''}`} key={term.iso} disabled={term.disabled} onClick={() => navigate(term.target)} aria-label={`${term.date}, ${previewStatus(term.status) || (term.disabled ? 'nicht mehr offen' : 'Neu')}${term.disabled ? '' : ', öffnen'}`}>
          <span className="overview-simple-date"><strong>{term.date.slice(0, 2)}</strong><span>{term.date.slice(3)}</span></span>
          <span className="overview-row-state"><span className={`overview-simple-status ${term.status ? `overview-simple-status-${term.status.toLowerCase()}` : ''}`}>{term.disabled && !term.status ? 'Nicht mehr offen' : previewStatus(term.status) || 'Neu'}</span></span>
        </button>)}</div>
      </div>) : terms.length === 0 ? <div className="overview-empty overview-empty-first" role="status"><div className="overview-empty-icon"><Icon name="file" size={30}/></div><strong>Noch keine Meldungen</strong><p>Sobald ein Stichtag für Ihre Apotheke verfügbar ist, erscheint er hier.</p></div> : <div className="overview-empty" role="status"><strong>Keine Stichtage für diese Auswahl</strong><span>Wählen Sie einen anderen Status, um weitere Stichtage zu sehen.</span></div>}
      {hasMore ? <div className="overview-load-trigger" ref={sentinelRef} aria-hidden="true"/> : null}
      {loadingMore ? <div className="overview-feed-loading" role="status" aria-live="polite">
        <div className="overview-feed-loading-label"><span className="overview-loading-spinner" aria-hidden="true"/>Ältere Stichtage werden geladen …</div>
        <div aria-hidden="true">{Array.from({ length: placeholderMonths }, (_, index) => <div className="overview-month overview-month-placeholder" key={index}>
          <div className="overview-month-label"><span className="overview-skeleton overview-skeleton-month"/><span className="overview-skeleton overview-skeleton-year"/></div>
          <div className="overview-month-rows">{[0, 1].map(row => <div className="overview-simple-row" key={row}><span className="overview-skeleton overview-skeleton-date"/><span className="overview-skeleton overview-skeleton-status"/></div>)}</div>
        </div>)}</div>
      </div> : null}
    </section>
  </div>
}
