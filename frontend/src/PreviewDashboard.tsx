import { useEffect, useLayoutEffect, useRef } from 'react'
import type { Status } from './types'
import './preview-dashboard.css'

export type DashboardTerm = {
  iso: string
  date: string
  status: Status | null
  target: string
  disabled?: boolean
}

type StatusFilter = 'all' | 'new' | 'draft' | 'submitted' | 'completed'

export type DashboardView = { sortOrder: 'newest' | 'oldest'; filter: StatusFilter; monthLimit: 3 | 6; monthStart: number }
export const initialDashboardView = (_preview: boolean): DashboardView => ({ sortOrder: 'newest', filter: 'all', monthLimit: 6, monthStart: 0 })

const matchesFilter = (term: DashboardTerm, filter: StatusFilter) => {
  if (filter === 'new') return !term.status && !term.disabled
  if (filter === 'draft') return term.status === 'DRAFT'
  if (filter === 'submitted') return Boolean(term.status && !['DRAFT', 'CANCELLED'].includes(term.status))
  if (filter === 'completed') return term.status === 'COMPLETED'
  return true
}

const filters: { key: StatusFilter; label: string; empty: string }[] = [
  { key: 'all', label: 'Alle', empty: 'Keine Stichtage vorhanden' },
  { key: 'new', label: 'Neu', empty: 'Keine neuen Stichtage' },
  { key: 'draft', label: 'Entwürfe', empty: 'Keine Entwürfe' },
  { key: 'submitted', label: 'Eingereicht', empty: 'Keine eingereichten Meldungen' },
  { key: 'completed', label: 'Abgeschlossen', empty: 'Keine abgeschlossenen Meldungen' }
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

export function PreviewDashboard({ terms, navigate, preview = true, view, onViewChange }: { terms: DashboardTerm[]; navigate: (page: string) => void; preview?: boolean; view: DashboardView; onViewChange: (view: DashboardView) => void }) {
  const { sortOrder, filter, monthLimit, monthStart } = view
  const updateView = (change: Partial<DashboardView>) => onViewChange({ ...view, ...change })
  const listRef = useRef<HTMLElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastScrollYRef = useRef(0)
  const shiftingRef = useRef(false)
  const anchorRef = useRef<{ key: string; top: number } | null>(null)
  const restartView = (change: Partial<DashboardView>) => {
    anchorRef.current = null
    shiftingRef.current = false
    window.scrollTo({ top: 0 })
    lastScrollYRef.current = 0
    updateView({ ...change, monthStart: 0 })
  }
  const filteredTerms = terms.filter(term => matchesFilter(term, filter))
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
  const maxStart = Math.max(0, groupedMonths.length - monthLimit)
  const start = Math.min(monthStart, maxStart)
  const months = groupedMonths.slice(start, start + monthLimit)
  const shownTerms = months.flatMap(month => month.terms)
  const hasOlder = start < maxStart
  const hasNewer = start > 0
  const monthRange = months.length ? `${start + 1}–${start + months.length}` : '0'
  const shiftWindow = (direction: -1 | 1) => {
    const nextStart = Math.max(0, Math.min(start + direction, maxStart))
    if (nextStart === start || shiftingRef.current) return
    const anchorMonth = months[direction === 1 ? 1 : 0]
    if (!anchorMonth) return
    const anchorNode = listRef.current?.querySelector<HTMLElement>(`[data-month-key="${anchorMonth.key}"]`)
    if (anchorNode) anchorRef.current = { key: anchorMonth.key, top: anchorNode.getBoundingClientRect().top }
    shiftingRef.current = true
    updateView({ monthStart: nextStart })
  }
  useLayoutEffect(() => {
    const anchor = anchorRef.current
    if (anchor) {
      const node = listRef.current?.querySelector<HTMLElement>(`[data-month-key="${anchor.key}"]`)
      if (node) window.scrollBy(0, node.getBoundingClientRect().top - anchor.top)
    }
    anchorRef.current = null
    lastScrollYRef.current = window.scrollY
    shiftingRef.current = false
  }, [start, monthLimit, filter, sortOrder])
  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY
      const direction = scrollY - lastScrollYRef.current
      lastScrollYRef.current = scrollY
      if (shiftingRef.current || Math.abs(direction) < 1) return
      const bottomTop = bottomRef.current?.getBoundingClientRect().top
      const topTop = topRef.current?.getBoundingClientRect().top
      if (direction > 0 && hasOlder && bottomTop !== undefined && bottomTop <= window.innerHeight) shiftWindow(1)
      if (direction < 0 && hasNewer && topTop !== undefined && topTop >= 0) shiftWindow(-1)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [start, maxStart, hasOlder, hasNewer, monthLimit, filter, sortOrder, onViewChange])

  return <div className="overview-simple">
    <header className="overview-simple-heading">
      <div><h1>Stichtage</h1>{groupedMonths.length > monthLimit ? <p role="status" aria-live="polite">Monate {monthRange} von {groupedMonths.length} · {hasOlder ? 'Ältere Monate erscheinen beim Scrollen.' : 'Ältester Monat erreicht.'}</p> : null}</div>
      <div className="overview-controls">
        <label className="overview-sort"><span>Nach Datum sortieren</span><select value={sortOrder} onChange={event => restartView({ sortOrder: event.target.value as 'newest' | 'oldest' })}><option value="newest">Neueste zuerst</option><option value="oldest">Älteste zuerst</option></select></label>
      </div>
    </header>
    <div ref={topRef} className="overview-window-top">{hasNewer ? <button type="button" onClick={() => shiftWindow(-1)}>Neueren Monat anzeigen</button> : null}</div>
    <section ref={listRef} className="overview-simple-list" aria-label="Stichtage und Meldungsstand">
      <div className="overview-simple-columns"><span>Zeitraum</span><span>Stichtag</span><label className="overview-status-filter"><span>Stand</span><select aria-label="Meldungsstand filtern" value={filter} onChange={event => restartView({ filter: event.target.value as StatusFilter })}>{filters.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label></div>
      {shownTerms.length ? months.map(month => <div className="overview-month" data-month-key={month.key} key={month.key}>
        <div className="overview-month-label"><h2>{month.label}</h2><span>{month.year}</span></div>
        <div className="overview-month-rows">{month.terms.map(term => <button className="overview-simple-row" key={term.iso} disabled={term.disabled} onClick={() => navigate(term.target)} aria-label={`${term.date}, ${previewStatus(term.status) || (term.disabled ? 'nicht mehr offen' : 'noch keine Meldung')}${term.disabled ? '' : ', öffnen'}`}>
          <span className="overview-simple-date"><strong>{term.date.slice(0, 2)}</strong><span>{term.date.slice(3)}</span></span>
          <span className={`overview-simple-status ${term.status ? `overview-simple-status-${term.status.toLowerCase()}` : ''}`}>{previewStatus(term.status)}</span>
        </button>)}</div>
      </div>) : <div className="overview-empty" role="status"><strong>{filters.find(item => item.key === filter)?.empty}</strong><span>Wählen Sie einen anderen Filter, um weitere Stichtage zu sehen.</span></div>}
    </section>
    <div className="overview-load-more" ref={bottomRef}><label className="overview-page-size"><span>Gleichzeitig sichtbare Monate</span><select value={monthLimit} onChange={event => restartView({ monthLimit: Number(event.target.value) as 3 | 6 })}><option value={3}>3 Monate</option><option value={6}>6 Monate</option></select></label><span role="status" aria-live="polite">Monate {monthRange} von {groupedMonths.length} · {shownTerms.length} Stichtage sichtbar</span>{hasOlder ? <button type="button" onClick={() => shiftWindow(1)}>Älteren Monat anzeigen</button> : null}</div>
    {preview ? <p className="overview-simple-note">Fiktive Beispiele · „Ausgezahlt“ ist hier nur ein simulierter Stand.</p> : null}
  </div>
}
