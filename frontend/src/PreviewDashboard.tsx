import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
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

type StatusFilter = 'all' | 'new' | 'draft' | 'submitted' | 'completed'

export type DashboardView = { sortOrder: 'newest' | 'oldest'; filter: StatusFilter; visibleMonths: number }
export const initialDashboardView = (_preview: boolean): DashboardView => ({ sortOrder: 'newest', filter: 'all', visibleMonths: 6 })

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

export function PreviewDashboard({ terms, navigate, view, onViewChange }: { terms: DashboardTerm[]; navigate: (page: string) => void; view: DashboardView; onViewChange: (view: DashboardView) => void }) {
  const { sortOrder, filter, visibleMonths } = view
  const updateView = (change: Partial<DashboardView>) => onViewChange({ ...view, ...change })
  const sentinelRef = useRef<HTMLDivElement>(null)
  const statusFilterRef = useRef<HTMLDivElement>(null)
  const statusTriggerRef = useRef<HTMLButtonElement>(null)
  const statusMenuRef = useRef<HTMLDivElement>(null)
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const selectedFilter = filters.find(item => item.key === filter) || filters[0]
  const selectFilter = (next: StatusFilter) => {
    updateView({ filter: next, visibleMonths: 6 })
    setStatusMenuOpen(false)
    statusTriggerRef.current?.focus()
  }
  const onStatusMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const options = Array.from(statusMenuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') || [])
    const current = options.indexOf(document.activeElement as HTMLButtonElement)
    if (event.key === 'Escape') {
      event.preventDefault()
      setStatusMenuOpen(false)
      statusTriggerRef.current?.focus()
    } else if (event.key === 'Tab') {
      setStatusMenuOpen(false)
    } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault()
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length
      options[next]?.focus()
    }
  }
  useEffect(() => {
    if (!statusMenuOpen) return
    statusMenuRef.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus()
    const closeOutside = (event: PointerEvent) => {
      if (!statusFilterRef.current?.contains(event.target as Node)) setStatusMenuOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [statusMenuOpen])
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
  const months = groupedMonths.slice(0, visibleMonths)
  const shownTerms = months.flatMap(month => month.terms)
  const hasMore = visibleMonths < groupedMonths.length
  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasMore || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) {
        observer.disconnect()
        onViewChange({ ...view, visibleMonths: Math.min(view.visibleMonths + 2, groupedMonths.length) })
      }
    }, { rootMargin: '0px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, visibleMonths, groupedMonths.length, view.filter, view.sortOrder, onViewChange])

  return <div className="overview-simple">
    <header className="overview-simple-heading">
      <div><h1>Stichtage</h1>{groupedMonths.length > 6 ? <p role="status" aria-live="polite">{months.length} von {groupedMonths.length} Monaten sichtbar · {hasMore ? 'Ältere Monate erscheinen beim Scrollen.' : 'Alle älteren Monate geladen.'}</p> : null}</div>
      <div className="overview-controls">
        <label className="overview-sort"><span>Nach Datum sortieren</span><select value={sortOrder} onChange={event => updateView({ sortOrder: event.target.value as 'newest' | 'oldest', visibleMonths: 6 })}><option value="newest">Neueste zuerst</option><option value="oldest">Älteste zuerst</option></select></label>
      </div>
    </header>
    <section className="overview-simple-list" aria-label="Stichtage und Meldungsstand">
      <div className="overview-simple-columns"><span>Zeitraum</span><span>Stichtag</span><div className="overview-status-filter" ref={statusFilterRef}><span id="overview-status-label">Stand</span><button ref={statusTriggerRef} type="button" className="overview-status-trigger" aria-labelledby="overview-status-label overview-status-value" aria-haspopup="menu" aria-expanded={statusMenuOpen} onClick={() => setStatusMenuOpen(open => !open)} onKeyDown={event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setStatusMenuOpen(true) } }}><span id="overview-status-value">{selectedFilter.label}</span><Icon name="chevron" size={16}/></button>{statusMenuOpen ? <div ref={statusMenuRef} className="overview-status-menu" role="menu" aria-label="Meldungsstand filtern" onKeyDown={onStatusMenuKeyDown}>{filters.map(item => <button key={item.key} type="button" role="menuitemradio" aria-checked={filter === item.key} onClick={() => selectFilter(item.key)}><span>{item.label}</span>{filter === item.key ? <Icon name="check" size={16}/> : null}</button>)}</div> : null}</div></div>
      {shownTerms.length ? months.map(month => <div className="overview-month" key={month.key}>
        <div className="overview-month-label"><h2>{month.label}</h2><span>{month.year}</span></div>
        <div className="overview-month-rows">{month.terms.map(term => <button className="overview-simple-row" key={term.iso} disabled={term.disabled} onClick={() => navigate(term.target)} aria-label={`${term.date}, ${previewStatus(term.status) || (term.disabled ? 'nicht mehr offen' : 'noch keine Meldung')}${term.disabled ? '' : ', öffnen'}`}>
          <span className="overview-simple-date"><strong>{term.date.slice(0, 2)}</strong><span>{term.date.slice(3)}</span></span>
          <span className={`overview-simple-status ${term.status ? `overview-simple-status-${term.status.toLowerCase()}` : ''}`}>{previewStatus(term.status)}</span>
        </button>)}</div>
      </div>) : <div className="overview-empty" role="status"><strong>{filters.find(item => item.key === filter)?.empty}</strong><span>Wählen Sie einen anderen Filter, um weitere Stichtage zu sehen.</span></div>}
    </section>
    <div className="overview-load-more" ref={sentinelRef} aria-live="polite"><span>{months.length} von {groupedMonths.length} Monaten · {shownTerms.length} von {filteredTerms.length} Stichtagen</span>{hasMore ? <button type="button" onClick={() => updateView({ visibleMonths: Math.min(visibleMonths + 2, groupedMonths.length) })}>Ältere Monate laden</button> : null}</div>
  </div>
}
