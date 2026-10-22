import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import type { Status } from './types'
import { Icon } from './ui'
import { ListAppearanceSettings, useListAppearance, type ListAppearance } from './ListAppearanceSettings'
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
const defaultTermAppearance: ListAppearance = { rowHeight: 64, fontSize: 16 }
const monthFormatter = new Intl.DateTimeFormat('de-DE', { month: 'long', timeZone: 'UTC' })

// UI-Annahme: Die Suche prüft nur angezeigte Stichtagsdaten, auch vor dem Nachladen älterer Monate.
const matchesDateSearch = (term: DashboardTerm, query: string) => {
  const [year, month, day] = term.iso.split('-')
  const monthName = monthFormatter.format(new Date(`${year}-${month}-01T12:00:00Z`))
  const searchable = [term.date, term.iso, `${Number(day)}.${Number(month)}.${year}`, `${day}/${month}/${year}`, `${Number(month)}/${year}`, `${Number(month)}.${year}`, monthName, `${monthName} ${year}`]
    .join(' ').toLocaleLowerCase('de-DE')
  return query.toLocaleLowerCase('de-DE').split(/\s+/).every(part => searchable.includes(part))
}

export function PreviewDashboard({ terms, navigate, view, onViewChange, demoLoadDelayMs = 600 }: { terms: DashboardTerm[]; navigate: (page: string) => void; view: DashboardView; onViewChange: (view: DashboardView) => void; demoLoadDelayMs?: number }) {
  const { sortOrder, selectedStatuses, visibleMonths } = view
  const [appearance, setAppearance] = useListAppearance('lawea-term-list-settings-v1', defaultTermAppearance)
  const [appearanceOpen, setAppearanceOpen] = useState(false)
  const [dateQuery, setDateQuery] = useState('')
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasScrollIntent, setHasScrollIntent] = useState(false)
  const loadingRef = useRef(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const clearSearch = () => { setDateQuery(''); searchInputRef.current?.focus() }
  const updateView = (change: Partial<DashboardView>) => {
    if (change.sortOrder !== undefined || change.selectedStatuses !== undefined) {
      loadingRef.current = false
      setLoadingMore(false)
      setHasScrollIntent(false)
    }
    onViewChange({ ...view, ...change })
  }
  const sentinelRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLElement>(null)
  const statusFilterRef = useRef<HTMLDivElement>(null)
  const statusTriggerRef = useRef<HTMLButtonElement>(null)
  const firstStatusRef = useRef<HTMLButtonElement>(null)
  const [statusFilterOpen, setStatusFilterOpen] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const toggleStatus = (status: StatusFilter) => updateView({
    selectedStatuses: selectedStatuses.includes(status)
      ? selectedStatuses.filter(selected => selected !== status)
      : [...selectedStatuses, status],
    visibleMonths: 6
  })
  useEffect(() => {
    if (!statusFilterOpen) return
    firstStatusRef.current?.focus()
    const closeOutside = (event: PointerEvent) => {
      if (!statusFilterRef.current?.contains(event.target as Node)) setStatusFilterOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [statusFilterOpen])
  const searchQuery = dateQuery.trim()
  const filteredTerms = terms.filter(term =>
    (selectedStatuses.length === 0 || selectedStatuses.some(status => matchesSingleFilter(term, status)))
    && (!searchQuery || matchesDateSearch(term, searchQuery))
  )
  const sortedTerms = [...filteredTerms].sort((a, b) => sortOrder === 'newest' ? b.iso.localeCompare(a.iso) : a.iso.localeCompare(b.iso))
  const groupedMonths = sortedTerms.reduce<{ key: string; label: string; year: string; terms: DashboardTerm[] }[]>((groups, term) => {
    const key = term.iso.slice(0, 7)
    const last = groups[groups.length - 1]
    if (last?.key === key) last.terms.push(term)
    else groups.push({
      key,
      label: monthFormatter.format(new Date(`${key}-01T12:00:00Z`)),
      year: key.slice(0, 4),
      terms: [term]
    })
    return groups
  }, [])
  const months = searchQuery ? groupedMonths : groupedMonths.slice(0, visibleMonths)
  const shownTerms = months.flatMap(month => month.terms)
  const hasMore = !searchQuery && visibleMonths < groupedMonths.length
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
  useEffect(() => {
    const updateBackToTop = () => {
      const bounds = listRef.current?.getBoundingClientRect()
      setShowBackToTop(Boolean(bounds && bounds.top < -Math.max(320, window.innerHeight * .65) && bounds.bottom > 80))
    }
    window.addEventListener('scroll', updateBackToTop, { passive: true })
    window.addEventListener('resize', updateBackToTop)
    updateBackToTop()
    return () => {
      window.removeEventListener('scroll', updateBackToTop)
      window.removeEventListener('resize', updateBackToTop)
    }
  }, [visibleMonths, selectedStatuses, terms.length, loadingMore, dateQuery])
  const scrollToListStart = () => {
    const list = listRef.current
    if (!list) return
    list.focus({ preventScroll: true })
    list.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
  }

  const listStyle = { '--overview-row-height': `${appearance.rowHeight}px`, '--overview-font-size': `${appearance.fontSize}px` } as CSSProperties
  return <div className={`overview-simple${shownTerms.length ? ' overview-simple-with-rows' : ''}`} style={listStyle}>
    <header className="overview-simple-heading">
      <div><h1>Stichtage</h1></div>
    </header>
    <section ref={listRef} className="overview-simple-list" aria-label="Stichtage und Meldungsstand" tabIndex={-1}>
      {terms.length > 0 ? <div className="overview-list-tools">
        <label className="overview-search-label" htmlFor="overview-date-search">Stichtag suchen</label>
        <div className="overview-search-field"><span className="overview-search-icon"><Icon name="search" size={17}/></span><input ref={searchInputRef} id="overview-date-search" type="search" value={dateQuery} onChange={event => { loadingRef.current = false; setLoadingMore(false); setDateQuery(event.target.value) }} onKeyDown={event => { if (event.key === 'Escape') clearSearch() }} placeholder="Datum, Monat oder Jahr" autoComplete="off"/>{dateQuery ? <button type="button" aria-label="Suche löschen" onClick={clearSearch}><Icon name="close" size={17}/></button> : null}</div>
        {searchQuery ? <span className="overview-search-count" role="status">{filteredTerms.length} Treffer</span> : null}
        <ListAppearanceSettings label="Stichtagsliste einstellen" settings={appearance} defaults={defaultTermAppearance} onChange={setAppearance} open={appearanceOpen} onOpenChange={setAppearanceOpen}/>
      </div> : null}
      <div className="overview-simple-columns">
        <div className="overview-period-heading">
          <span>Zeitraum</span>
          {terms.length > 0 ? <div className="overview-sort-icons" role="group" aria-label="Stichtage nach Datum sortieren">
            <button type="button" aria-label="Aufsteigend sortieren, älteste zuerst" aria-pressed={sortOrder === 'oldest'} onClick={() => updateView({ sortOrder: 'oldest', visibleMonths: 6 })}>
              <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 16V4m-4 4 4-4 4 4"/></svg>
            </button>
            <button type="button" aria-label="Absteigend sortieren, neueste zuerst" aria-pressed={sortOrder === 'newest'} onClick={() => updateView({ sortOrder: 'newest', visibleMonths: 6 })}>
              <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 4v12m-4-4 4 4 4-4"/></svg>
            </button>
          </div> : null}
        </div>
        <span>Stichtag</span>
        <div className="overview-status-heading" ref={statusFilterRef} onKeyDown={event => {
          if (event.key === 'Escape' && statusFilterOpen) {
            event.preventDefault()
            setStatusFilterOpen(false)
            statusTriggerRef.current?.focus()
          }
        }} onBlur={event => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setStatusFilterOpen(false)
        }}>
          <span>Stand</span>
          {terms.length > 0 ? <button ref={statusTriggerRef} type="button" className="overview-filter-trigger" aria-label={selectedStatuses.length ? `Stand filtern, ${selectedStatuses.length} ausgewählt` : 'Stand filtern, alle anzeigen'} aria-expanded={statusFilterOpen} aria-controls="overview-status-panel" onClick={() => setStatusFilterOpen(open => !open)}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 6h16l-6.5 7.2v4.8l-3 1.7v-6.5L4 6Z"/></svg>
            {selectedStatuses.length ? <span className="overview-filter-count" aria-hidden="true">{selectedStatuses.length}</span> : null}
          </button> : null}
          {statusFilterOpen ? <div id="overview-status-panel" className="overview-status-panel" role="group" aria-label="Meldungsstand auswählen">
            <div className="overview-status-panel-top"><strong>Meldungsstand</strong><button type="button" disabled={selectedStatuses.length === 0} onClick={() => updateView({ selectedStatuses: [], visibleMonths: 6 })}>Alle anzeigen</button></div>
            <div className="overview-status-options">{filters.map((item, index) => <button ref={index === 0 ? firstStatusRef : undefined} className={`overview-status-option overview-status-option-${item.key}`} type="button" key={item.key} aria-pressed={selectedStatuses.includes(item.key)} onClick={() => toggleStatus(item.key)}>
              <span className={`overview-status-dot overview-status-dot-${item.key}`} aria-hidden="true"/>
              <span>{item.label}</span>
              <span className="overview-status-choice" aria-hidden="true"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m3.5 8 3 3 6-6"/></svg></span>
            </button>)}</div>
          </div> : null}
        </div>
      </div>
      {shownTerms.length ? months.map(month => <div className="overview-month" key={month.key}>
        <div className="overview-month-label"><h2>{month.label}</h2><span>{month.year}</span></div>
        <div className="overview-month-rows">{month.terms.map(term => <button className={`overview-simple-row${term.status ? ` overview-simple-row-${term.status.toLowerCase()}` : ''}`} key={term.iso} disabled={term.disabled} onClick={() => navigate(term.target)} aria-label={`${term.date}, ${previewStatus(term.status) || (term.disabled ? 'nicht mehr offen' : 'Neu')}${term.disabled ? '' : ', öffnen'}`}>
          <span className="overview-simple-date"><strong>{term.date.slice(0, 2)}</strong><span>{term.date.slice(3)}</span></span>
          <span className="overview-row-state"><span className={`overview-simple-status ${term.status ? `overview-simple-status-${term.status.toLowerCase()}` : term.disabled ? '' : 'overview-simple-status-new'}`}>{term.disabled && !term.status ? 'Nicht mehr offen' : previewStatus(term.status) || 'Neu'}</span></span>
        </button>)}</div>
      </div>) : terms.length === 0 ? <div className="overview-empty overview-empty-first" role="status"><div className="overview-empty-icon"><Icon name="file" size={30}/></div><strong>Noch keine Meldungen</strong><p>Sobald ein Stichtag für Ihre Apotheke verfügbar ist, erscheint er hier.</p></div> : <div className="overview-empty" role="status"><strong>{searchQuery ? 'Keine Stichtage gefunden' : 'Keine Stichtage für diese Auswahl'}</strong><span>{searchQuery ? 'Versuchen Sie ein anderes Datum, einen Monat oder ein Jahr.' : 'Wählen Sie einen anderen Status, um weitere Stichtage zu sehen.'}</span>{searchQuery ? <button className="overview-clear-search" type="button" onClick={clearSearch}>Suche löschen</button> : null}</div>}
      {hasMore ? <div className="overview-load-trigger" ref={sentinelRef} aria-hidden="true"/> : null}
      {loadingMore ? <div className="overview-feed-loading" role="status" aria-live="polite">
        <div className="overview-feed-loading-label"><span className="overview-loading-spinner" aria-hidden="true"/>Ältere Stichtage werden geladen …</div>
        <div aria-hidden="true">{Array.from({ length: placeholderMonths }, (_, index) => <div className="overview-month overview-month-placeholder" key={index}>
          <div className="overview-month-label"><span className="overview-skeleton overview-skeleton-month"/><span className="overview-skeleton overview-skeleton-year"/></div>
          <div className="overview-month-rows">{[0, 1].map(row => <div className="overview-simple-row" key={row}><span className="overview-skeleton overview-skeleton-date"/><span className="overview-skeleton overview-skeleton-status"/></div>)}</div>
        </div>)}</div>
      </div> : null}
    </section>
    {showBackToTop && shownTerms.length > 0 ? <button type="button" className="overview-back-to-top" aria-label="Zum Anfang der Stichtagsliste" title="Zum Anfang der Stichtagsliste" onClick={scrollToListStart}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6"/></svg>
    </button> : null}
  </div>
}
