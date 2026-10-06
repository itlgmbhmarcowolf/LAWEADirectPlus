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

const previewStatus = (status: Status | null) => {
  if (status === 'DRAFT') return 'Entwurf'
  if (status === 'MANUAL_REVIEW') return 'Eingereicht'
  if (status === 'COMPLETED') return 'Ausgezahlt'
  if (status === 'REJECTED') return 'Bitte korrigieren'
  if (status === 'APPROVED') return 'Freigegeben'
  if (status === 'CANCELLED') return 'Abgebrochen'
  return ''
}

export function PreviewDashboard({ terms, navigate, mode = 'dashboard', preview = true }: { terms: DashboardTerm[]; navigate: (page: string) => void; mode?: 'dashboard' | 'claims'; preview?: boolean }) {
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [pageSize, setPageSize] = useState<10 | 15>(15)
  const [page, setPage] = useState(1)
  const listRef = useRef<HTMLElement>(null)
  const effectiveSort = mode === 'claims' ? 'newest' : sortOrder
  const sortedTerms = [...terms].sort((a, b) => effectiveSort === 'newest' ? b.iso.localeCompare(a.iso) : a.iso.localeCompare(b.iso))
  const effectivePageSize = mode === 'claims' ? 15 : pageSize
  const pageCount = Math.max(1, Math.ceil(sortedTerms.length / effectivePageSize))
  const currentPage = Math.min(page, pageCount)
  const visibleTerms = sortedTerms.slice((currentPage - 1) * effectivePageSize, currentPage * effectivePageSize)
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
      <div><h1>{mode === 'claims' ? 'Meldungen' : 'Stichtage'}</h1><p>{mode === 'claims' ? 'Alle Stichtage und Meldungen im Überblick.' : 'Wählen Sie einen Stichtag, um die Meldung zu öffnen.'}</p></div>
      {mode === 'dashboard' ? <div className="overview-controls">
        <label className="overview-sort"><span>Nach Datum sortieren</span><select value={sortOrder} onChange={event => { setSortOrder(event.target.value as 'newest' | 'oldest'); changePage(1) }}><option value="newest">Neueste zuerst</option><option value="oldest">Älteste zuerst</option></select></label>
        <label className="overview-page-size"><span>Stichtage pro Seite</span><select value={pageSize} onChange={event => { setPageSize(event.target.value === '10' ? 10 : 15); changePage(1) }}><option value={15}>15 Stichtage</option><option value={10}>10 Stichtage</option></select></label>
      </div> : null}
    </header>
    <section className="overview-simple-list" ref={listRef} aria-label="Stichtage und Meldungsstand">
      <div className="overview-simple-columns" aria-hidden="true"><span>Zeitraum</span><span>Stichtag</span><span>Stand</span></div>
      {months.map(month => <div className="overview-month" key={month.key}>
        <div className="overview-month-label"><h2>{month.label}</h2><span>{month.year}</span></div>
        <div className="overview-month-rows">{month.terms.map(term => <button className="overview-simple-row" key={term.iso} disabled={term.disabled} onClick={() => navigate(term.target)} aria-label={`${term.date}, ${previewStatus(term.status) || (term.disabled ? 'nicht mehr offen' : 'noch keine Meldung')}${term.disabled ? '' : ', öffnen'}`}>
          <span className="overview-simple-date"><strong>{term.date.slice(0, 2)}</strong><span>{term.date.slice(3)}</span></span>
          <span className={`overview-simple-status ${term.status ? `overview-simple-status-${term.status.toLowerCase()}` : ''}`}>{previewStatus(term.status)}</span>
          <span className="overview-row-arrow"><Icon name="arrow" size={18}/></span>
        </button>)}</div>
      </div>)}
    </section>
    <div className="overview-pagination"><span aria-live="polite">{pageCount > 1 ? `${visibleTerms.length} von ${terms.length} Stichtagen` : `${terms.length} Stichtage`}</span><nav aria-label="Seiten der Stichtagsliste"><button type="button" onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1}>Zurück</button><span className="overview-page-current" aria-current="page">{currentPage} / {pageCount}</span><button type="button" onClick={() => changePage(currentPage + 1)} disabled={currentPage === pageCount}>Weiter <Icon name="arrow" size={15}/></button></nav></div>
    {preview ? <p className="overview-simple-note">Fiktive Beispiele · „Ausgezahlt“ ist hier nur ein simulierter Stand.</p> : null}
  </div>
}
