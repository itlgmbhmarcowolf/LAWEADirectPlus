import { useState } from 'react'
import type { Status } from './types'
import { Button, Empty, Icon, PageTitle, StatusPill } from './ui'

export type SampleClaim = { number: string; termDate: string; status: Status; creditReference?: string }
export type OpenPreviewClaim = { number: string; termDate: string; status: Status; hasData: boolean }
export const sampleClaims: SampleClaim[] = [
  // Fiktive abgeschlossene Vorgänge zeigen die paginierte Historie der Konzeptvorschau.
  ...['2026-01-01', '2026-01-15', '2026-02-01', '2026-02-15', '2026-03-01', '2026-03-15', '2026-04-01', '2026-04-15'].map((termDate, index) => ({ number: `LV-DEMO-2026-ALT-${String(index + 1).padStart(2, '0')}`, termDate, status: 'COMPLETED' as Status, creditReference: `GS-DEMO-2026-ALT-${String(index + 1).padStart(2, '0')}` })),
  { number: 'LV-DEMO-2026-001', termDate: '2026-05-01', status: 'COMPLETED', creditReference: 'GS-DEMO-2026-001' },
  { number: 'LV-DEMO-2026-002', termDate: '2026-05-15', status: 'COMPLETED', creditReference: 'GS-DEMO-2026-002' },
  { number: 'LV-DEMO-2026-003', termDate: '2026-06-01', status: 'COMPLETED', creditReference: 'GS-DEMO-2026-003' },
  { number: 'LV-DEMO-2026-004', termDate: '2026-06-15', status: 'MANUAL_REVIEW' },
  { number: 'LV-DEMO-2026-014', termDate: '2026-08-15', status: 'COMPLETED', creditReference: 'GS-DEMO-2026-014' },
  { number: 'LV-DEMO-2026-011', termDate: '2026-09-01', status: 'MANUAL_REVIEW' },
  { number: 'LV-DEMO-2026-009', termDate: '2026-08-01', status: 'COMPLETED', creditReference: 'GS-DEMO-2026-009' }
]

const label = (iso: string) => new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`))

type ClaimTab = 'new' | 'draft' | 'submitted' | 'paid'
type Row = { number: string; termDate: string; status: Status; target: string; hasData?: boolean; creditReference?: string }

export function PreviewClaims({ currentClaims, navigate }: { currentClaims: OpenPreviewClaim[]; navigate: (page: string) => void }) {
  const [tab, setTab] = useState<ClaimTab>('new')
  const [page, setPage] = useState(1)
  const records: Row[] = [
    ...currentClaims.map(claim => ({ ...claim, target: `claim:${claim.termDate}`, creditReference: claim.status === 'COMPLETED' ? `BEISPIEL-GS-${claim.number.slice(-2)}` : undefined })),
    ...sampleClaims.map(claim => ({ ...claim, target: `sample:${claim.number}` }))
  ].sort((a, b) => b.termDate.localeCompare(a.termDate))
  const tabs: { key: ClaimTab; label: string; rows: Row[] }[] = [
    { key: 'new', label: 'Neu', rows: records.filter(row => row.status === 'DRAFT' && !row.hasData) },
    { key: 'draft', label: 'Entwürfe', rows: records.filter(row => row.status === 'DRAFT' && row.hasData) },
    { key: 'submitted', label: 'Eingereicht', rows: records.filter(row => !['DRAFT', 'CANCELLED'].includes(row.status)) },
    { key: 'paid', label: 'Ausgezahlt', rows: records.filter(row => row.status === 'COMPLETED') }
  ]
  const active = tabs.find(item => item.key === tab) || tabs[0]
  const pageCount = Math.max(1, Math.ceil(active.rows.length / 15))
  const currentPage = Math.min(page, pageCount)
  const shown = active.rows.slice((currentPage - 1) * 15, currentPage * 15)
  const chooseTab = (next: ClaimTab) => { setTab(next); setPage(1) }
  return <>
    <PageTitle title="Meldungen" subtitle="Neue Termine, Entwürfe und alle eingereichten Meldungen."/>
    <div className="tabs" role="tablist" aria-label="Meldungsbereiche">{tabs.map(item => <button key={item.key} role="tab" aria-selected={tab === item.key} className={tab === item.key ? 'selected' : ''} onClick={() => chooseTab(item.key)}>{item.label} <span className="claim-tab-count">{item.rows.length}</span></button>)}</div>
    {shown.length ? <section className="data-section"><div className="table-wrap"><table className="preview-claim-table"><thead><tr><th>Stichtag</th><th>Vorgang</th><th>Status</th><th>Aktion</th></tr></thead><tbody>{shown.map(row => <tr key={row.number}><td>{label(row.termDate)}</td><td><button className="table-link" onClick={() => navigate(row.target)}>{row.number}</button></td><td>{tab === 'new' ? 'Noch offen' : <StatusPill status={row.status} label={row.status === 'COMPLETED' ? 'Ausgezahlt · Demo' : row.status === 'MANUAL_REVIEW' ? 'Eingereicht' : undefined}/>}</td><td><div className="claim-row-actions"><Button variant="secondary" onClick={() => navigate(row.target)}>{row.status === 'DRAFT' ? row.hasData ? 'Entwurf fortsetzen' : 'Meldung erfassen' : 'Meldung ansehen'}</Button>{row.creditReference ? <button className="text-button" onClick={() => navigate(`credits:${row.number}`)}>Gutschrift <Icon name="arrow" size={15}/></button> : null}</div></td></tr>)}</tbody></table></div></section> : <Empty title={tab === 'new' ? 'Keine neuen Termine' : tab === 'draft' ? 'Keine Entwürfe' : tab === 'paid' ? 'Noch keine Auszahlungen' : 'Noch keine eingereichten Meldungen'} description="Sobald ein Vorgang vorhanden ist, erscheint er hier."/>}
    <div className="overview-pagination"><span>{active.rows.length} {active.rows.length === 1 ? 'Vorgang' : 'Vorgänge'}</span><nav aria-label="Seiten der Meldungsliste"><button onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1}>Zurück</button><span className="overview-page-current" aria-current="page">{currentPage} / {pageCount}</span><button onClick={() => setPage(currentPage + 1)} disabled={currentPage === pageCount}>Weiter <Icon name="arrow" size={15}/></button></nav></div>
  </>
}

export function PreviewSampleClaimDetail({ claim, navigate }: { claim: SampleClaim; navigate: (page: string) => void }) {
  return <>
    <button className="back-link" onClick={() => navigate('claims')}>← Zurück zu Meldungen</button>
    <PageTitle title="Meldung im Überblick" subtitle={`${claim.number} · Senkungstermin ${label(claim.termDate)}`}/>
    <div className="term-summary"><div><span>Stichtag</span><strong>{label(claim.termDate)}</strong></div><div><span>Hersteller</span><strong>Glenmark</strong></div><div><span>Status</span><strong><StatusPill status={claim.status} label={claim.status === 'COMPLETED' ? 'Ausgezahlt · Demo' : claim.status === 'MANUAL_REVIEW' ? 'Eingereicht' : undefined}/></strong></div></div>
    <section className="data-section claim-overview"><div className="section-header"><h2>Bearbeitungsstand</h2><StatusPill status={claim.status} label={claim.status === 'COMPLETED' ? 'Ausgezahlt · Demo' : claim.status === 'MANUAL_REVIEW' ? 'Eingereicht' : undefined}/></div><p>{claim.status === 'COMPLETED' ? 'Auszahlung nur als fiktiver Beispielstand dargestellt. Es wurde keine Zahlung ausgeführt.' : 'Fiktiver Beispielvorgang für die Navigation im Kundengespräch.'}</p>{claim.creditReference ? <div className="claim-credit-link"><div><strong>Zugeordnete Gutschrift</strong><span>{claim.creditReference} · zu {claim.number}</span></div><Button variant="secondary" icon="arrow" onClick={() => navigate(`credits:${claim.number}`)}>Gutschrift ansehen</Button></div> : <p className="muted">Eine Gutschrift ist noch nicht verfügbar.</p>}</section>
  </>
}
