import { useRef, useState } from 'react'
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

export function PreviewDashboard({ terms, navigate, preview = true }: { terms: DashboardTerm[]; navigate: (page: string) => void; preview?: boolean }) {
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [pageSize, setPageSize] = useState<10 | 15>(15)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  const listRef = useRef<HTMLElement>(null)
  const filteredTerms = terms.filter(term => matchesFilter(term, filter))
  const sortedTerms = [...filteredTerms].sort((a, b) => sortOrder === 'newest' ? b.iso.localeCompare(a.iso) : a.iso.localeCompare(b.iso))
  const pageCount = Math.max(1, Math.ceil(sortedTerms.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const visibleTerms = sortedTerms.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const months = visibleTerms.reduce<{ key: string; label: string; year: string; terms: DashboardTerm[] }[]>((groups, term) => {
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
  const changePage = (nextPage: number) => {
    setPage(nextPage)
    listRef.current?.scrollIntoView({ block: 'start' })
  }

  return <div className="overview-simple">
    <header className="overview-simple-heading">
      <div><h1>Stichtage</h1><p>Wählen Sie einen Stichtag, um die Meldung zu öffnen.</p></div>
      <div className="overview-controls">
        <label className="overview-sort"><span>Nach Datum sortieren</span><select value={sortOrder} onChange={event => { setSortOrder(event.target.value as 'newest' | 'oldest'); setPage(1) }}><option value="newest">Neueste zuerst</option><option value="oldest">Älteste zuerst</option></select></label>
      </div>
    </header>
    <section className="overview-simple-list" ref={listRef} aria-label="Stichtage und Meldungsstand">
      <div className="overview-simple-columns"><span>Zeitraum</span><span>Stichtag</span><label className="overview-status-filter"><span>Stand</span><select aria-label="Meldungsstand filtern" value={filter} onChange={event => { setFilter(event.target.value as StatusFilter); setPage(1) }}>{filters.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label></div>
      {visibleTerms.length ? months.map(month => <div className="overview-month" key={month.key}>
        <div className="overview-month-label"><h2>{month.label}</h2><span>{month.year}</span></div>
        <div className="overview-month-rows">{month.terms.map(term => <button className="overview-simple-row" key={term.iso} disabled={term.disabled} onClick={() => navigate(term.target)} aria-label={`${term.date}, ${previewStatus(term.status) || (term.disabled ? 'nicht mehr offen' : 'noch keine Meldung')}${term.disabled ? '' : ', öffnen'}`}>
          <span className="overview-simple-date"><strong>{term.date.slice(0, 2)}</strong><span>{term.date.slice(3)}</span></span>
          <span className={`overview-simple-status ${term.status ? `overview-simple-status-${term.status.toLowerCase()}` : ''}`}>{previewStatus(term.status)}</span>
          <span className="overview-row-arrow"><Icon name="arrow" size={18}/></span>
        </button>)}</div>
      </div>) : <div className="overview-empty" role="status"><strong>{filters.find(item => item.key === filter)?.empty}</strong><span>Wählen Sie einen anderen Filter, um weitere Stichtage zu sehen.</span></div>}
    </section>
    <div className="overview-pagination"><span aria-live="polite">{pageCount > 1 ? `${visibleTerms.length} von ${filteredTerms.length} Stichtagen` : `${filteredTerms.length} ${filteredTerms.length === 1 ? 'Stichtag' : 'Stichtage'}`}</span><div className="overview-pagination-actions"><label className="overview-page-size"><span>Stichtage pro Seite</span><select value={pageSize} onChange={event => { setPageSize(event.target.value === '10' ? 10 : 15); setPage(1) }}><option value={15}>15 Stichtage</option><option value={10}>10 Stichtage</option></select></label><nav aria-label="Seiten der Stichtagsliste"><button type="button" onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1}>Zurück</button><span className="overview-page-current" aria-current="page">{currentPage} / {pageCount}</span><button type="button" onClick={() => changePage(currentPage + 1)} disabled={currentPage === pageCount}>Weiter <Icon name="arrow" size={15}/></button></nav></div></div>
    {preview ? <p className="overview-simple-note">Fiktive Beispiele · „Ausgezahlt“ ist hier nur ein simulierter Stand.</p> : null}
  </div>
}
