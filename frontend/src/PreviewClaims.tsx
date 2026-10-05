import { useState } from 'react'
import type { Status } from './types'
import { Button, Empty, Icon, PageTitle, StatusPill } from './ui'
import { ClaimFilters, filterByTermDate, initialDateFilters } from './ClaimFilters'

export type SampleClaim = { number: string; termDate: string; status: Status; creditReference?: string }
export type OpenPreviewClaim = { number: string; termDate: string; status: Status; positionCount: number }
export const sampleClaims: SampleClaim[] = [
  { number: 'LV-DEMO-2026-014', termDate: '2026-08-15', status: 'COMPLETED', creditReference: 'GS-DEMO-2026-014' },
  { number: 'LV-DEMO-2026-011', termDate: '2026-09-01', status: 'MANUAL_REVIEW' },
  { number: 'LV-DEMO-2026-009', termDate: '2026-08-01', status: 'COMPLETED', creditReference: 'GS-DEMO-2026-009' }
]

type Row = SampleClaim & { current?: boolean; positionCount?: number }
const label = (iso: string) => new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`))

export function PreviewClaims({ currentClaims, navigate }: { currentClaims: OpenPreviewClaim[]; navigate: (page: string) => void }) {
  const [tab, setTab] = useState<'open' | 'draft' | 'submitted' | 'done'>('open')
  const [filters, setFilters] = useState(initialDateFilters)
  const records: Row[] = [...currentClaims.map(claim => ({ ...claim, current: true, creditReference: claim.status === 'COMPLETED' ? `BEISPIEL-GS-${claim.number.slice(-2)}` : undefined })), ...sampleClaims]
  const matching = tab === 'open' ? records.filter(row => row.current && row.status === 'DRAFT') : tab === 'draft' ? records.filter(row => row.status === 'DRAFT') : tab === 'submitted' ? records.filter(row => ['MANUAL_REVIEW', 'REJECTED', 'APPROVED'].includes(row.status)) : records.filter(row => row.status === 'COMPLETED')
  const shown = filterByTermDate(matching, row => row.termDate, filters)
  const detail = (row: Row) => navigate(row.current ? `claim:${row.termDate}` : `sample:${row.number}`)
  return <>
    <PageTitle title="Meldungen" subtitle="Termine finden, Meldungen verfolgen und Gutschriften direkt öffnen."/>
    <div className="tabs" role="tablist" aria-label="Meldungen filtern">{([['open', 'Jetzt einreichen'], ['draft', 'Entwürfe'], ['submitted', 'Eingereicht'], ['done', 'Abgeschlossen']] as const).map(([key, title]) => <button key={key} role="tab" aria-selected={tab === key} className={tab === key ? 'selected' : ''} onClick={() => setTab(key)}>{title}</button>)}</div>
    <ClaimFilters value={filters} onChange={setFilters} count={shown.length}/>
    {tab === 'open' ? shown.length ? <div className="preview-open-term-list">{shown.map(row => <section className="preview-term-row" key={row.number}><span className="preview-term-icon"><Icon name="calendar"/></span><div><h2>{label(row.termDate)}</h2><p>Glenmark · {row.number} · {row.positionCount ? `${row.positionCount} ${row.positionCount === 1 ? 'Position' : 'Positionen'} im Entwurf` : 'Noch keine Position erfasst'}</p></div><Button variant="secondary" onClick={() => detail(row)}>{row.positionCount ? 'Entwurf fortsetzen' : 'Meldung erfassen'}</Button></section>)}</div> : <Empty title="Kein offener Termin in diesem Zeitraum" description="Passen Sie das Start- oder Enddatum an."/> : shown.length ? <section className="data-section"><div className="table-wrap"><table className="preview-claim-table"><thead><tr><th>Vorgang</th><th>Senkungstermin</th><th>Status</th><th>Weiter</th></tr></thead><tbody>{shown.map(row => <tr key={row.number}><td><button className="table-link" onClick={() => detail(row)}>{row.number}</button></td><td>{label(row.termDate)}</td><td><StatusPill status={row.status}/></td><td><div className="claim-row-actions"><button className="text-button" onClick={() => detail(row)}>Meldung ansehen</button>{row.creditReference ? <button className="text-button" onClick={() => navigate(`credits:${row.number}`)}>Gutschrift →</button> : null}</div></td></tr>)}</tbody></table></div></section> : <Empty title="Keine Meldungen im gewählten Zeitraum" description="Passen Sie die Datumsgrenzen an oder setzen Sie die Filter zurück."/>}
  </>
}

export function PreviewSampleClaimDetail({ claim, navigate }: { claim: SampleClaim; navigate: (page: string) => void }) {
  return <>
    <button className="back-link" onClick={() => navigate('claims')}>← Zurück zu Meldungen</button>
    <PageTitle title="Meldung im Überblick" subtitle={`${claim.number} · Senkungstermin ${label(claim.termDate)}`}/>
    <div className="term-summary"><div><span>Stichtag</span><strong>{label(claim.termDate)}</strong></div><div><span>Hersteller</span><strong>Glenmark</strong></div><div><span>Status</span><strong><StatusPill status={claim.status}/></strong></div></div>
    <section className="data-section claim-overview"><div className="section-header"><h2>Bearbeitungsstand</h2><StatusPill status={claim.status}/></div><p>Fiktiver Beispielvorgang für die Navigation im Kundengespräch.</p>{claim.creditReference ? <div className="claim-credit-link"><div><strong>Zugeordnete Gutschrift</strong><span>{claim.creditReference} · zu {claim.number}</span></div><Button variant="secondary" icon="arrow" onClick={() => navigate(`credits:${claim.number}`)}>Gutschrift ansehen</Button></div> : <p className="muted">Eine Gutschrift ist noch nicht verfügbar.</p>}</section>
  </>
}
