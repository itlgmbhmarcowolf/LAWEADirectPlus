import { useEffect, useState } from 'react'
import type { Status } from './types'
import { Button, Empty, Icon, Notice, PageTitle, StatusPill } from './ui'
import { createDemoEvidencePdf } from './demo-evidence-pdf'
import { ClaimCreditEntry } from './ClaimCreditEntry'
import { SampleCorrectionFlow, type SampleCorrection } from './SampleCorrectionFlow'
import { sampleClaimDetail, sampleClaims, sampleDate } from './sample-claim-data'
import type { SampleClaim, SampleEvent } from './sample-claim-data'
import './sample-claim-detail.css'

export { sampleClaims }
export type OpenPreviewClaim = { number: string; termDate: string; status: Status; hasData: boolean }
const label = sampleDate

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

export function PreviewSampleClaimDetail({ claim, navigate, contacts, correction, onStartCorrection, onChangeCorrection, onSubmitCorrection }: {
  claim: SampleClaim
  navigate: (page: string) => void
  contacts: { name: string; email: string }[]
  correction?: SampleCorrection
  onStartCorrection: () => void
  onChangeCorrection: (next: SampleCorrection) => void
  onSubmitCorrection: () => void
}) {
  const detail = sampleClaimDetail(claim)
  const rejectionReason = detail.events.find(event => event.title === 'Revision 1 abgelehnt')?.description
  const correctionOpen = Boolean(claim.correctionDeadline && Date.now() <= Date.parse(claim.correctionDeadline))
  const correctionDeadline = claim.correctionDeadline ? `${new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Berlin' }).format(new Date(claim.correctionDeadline))} Uhr` : ''
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [previousEvidenceUrl, setPreviousEvidenceUrl] = useState('')
  const [correctionEvidenceUrl, setCorrectionEvidenceUrl] = useState('')
  useEffect(() => {
    const url = URL.createObjectURL(createDemoEvidencePdf(claim, detail))
    setEvidenceUrl(url)
    const previousUrl = detail.previousPositions ? URL.createObjectURL(createDemoEvidencePdf(claim, { positions: detail.previousPositions, submitted: detail.previousSubmitted!, revision: 1 })) : ''
    setPreviousEvidenceUrl(previousUrl)
    return () => { URL.revokeObjectURL(url); if (previousUrl) URL.revokeObjectURL(previousUrl) }
  }, [claim.number])
  useEffect(() => {
    if (correction?.phase !== 'submitted' || !correction.evidenceFile) { setCorrectionEvidenceUrl(''); return }
    const url = URL.createObjectURL(correction.evidenceFile)
    setCorrectionEvidenceUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [correction?.phase, correction?.evidenceFile])
  const displayStatus = correction?.phase === 'draft' ? 'DRAFT' : correction?.phase === 'submitted' ? 'MANUAL_REVIEW' : claim.status
  const statusText = correction?.phase === 'draft' ? 'Korrektur in Bearbeitung · Demo' : correction?.phase === 'submitted' ? 'Erneut eingereicht · Demo' : claim.status === 'COMPLETED' ? 'Gutschrift bereitgestellt · Demo' : claim.status === 'MANUAL_REVIEW' ? 'In Prüfung' : 'Korrektur erforderlich'
  const timelineEvents: SampleEvent[] = correction?.phase === 'submitted'
    ? [...detail.events, { at: correction.submittedAt || 'In dieser Sitzung', title: 'Revision 2 erneut eingereicht', description: `Die korrigierten Angaben und der erneut hochgeladene Nachweis „${correction.evidenceFile?.name || 'Nachweis'}“ wurden eingereicht. Revision 1 bleibt unverändert.`, tone: 'current', revision: 'Revision 2' }]
    : detail.events
  return <>
    <button className="back-link" onClick={() => navigate('dashboard')}>← Zurück zur Übersicht</button>
    <PageTitle title={`Meldung für den ${label(claim.termDate)}`} subtitle={claim.number}/>
    <div className="term-summary"><div><span>Stichtag</span><strong>{label(claim.termDate)}</strong></div><div><span>Vorgang</span><strong>{claim.number}</strong></div><div><span>Status</span><strong><StatusPill status={displayStatus} label={statusText}/></strong></div></div>
    <section className="data-section claim-overview"><div className="section-header"><h2>Bearbeitungsstand</h2><StatusPill status={displayStatus} label={statusText}/></div><p>{correction?.phase === 'submitted' ? 'Revision 2 wurde erneut eingereicht und liegt zur Prüfung vor. Revision 1 bleibt unverändert.' : correction?.phase === 'draft' ? 'Die Angaben für Revision 2 können jetzt korrigiert und erneut eingereicht werden.' : claim.status === 'COMPLETED' ? `Revision ${detail.revision} ist freigegeben. Die fiktive Gutschrift wurde am ${detail.provided} bereitgestellt; es erfolgte keine Auszahlung.` : claim.status === 'REJECTED' ? 'Revision 1 wurde abgelehnt. Die eingereichte Fassung bleibt im Verlauf erhalten.' : 'Revision 1 liegt zur fachlichen Prüfung vor. Eine Gutschrift ist noch nicht verfügbar.'}</p>{claim.status === 'REJECTED' && rejectionReason ? <Notice tone="warning"><strong>Grund der Ablehnung:</strong> {rejectionReason}</Notice> : null}{claim.status === 'REJECTED' && correction?.phase !== 'submitted' ? <p className="sample-correction-deadline">{correctionOpen ? 'Korrektur erneut einreichen bis' : 'Korrekturfrist abgelaufen am'} <strong>{correctionDeadline || 'Kein Datum hinterlegt'}</strong></p> : null}{claim.status === 'REJECTED' && !correction ? <Button onClick={onStartCorrection} disabled={!correctionOpen}>Korrektur starten</Button> : null}{claim.creditReference ? <ClaimCreditEntry reference={claim.creditReference} provided={detail.provided} onOpen={() => navigate(`credits:${claim.number}`)}/> : null}</section>
    {correction?.phase === 'draft' ? <SampleCorrectionFlow value={correction} contacts={contacts} deadlineOpen={correctionOpen} onChange={onChangeCorrection} onSubmit={onSubmitCorrection}/> : null}
    {correction?.phase === 'submitted' ? <section className="data-section sample-correction-submitted"><h2>Erneut eingereichte Angaben · Revision 2</h2><div className="table-wrap"><table><thead><tr><th>PZN</th><th>Artikel</th><th>Charge</th><th>Bestand</th></tr></thead><tbody>{correction.positions.map((position, index) => <tr key={`${position.pzn}-${index}`}><td>{position.pzn}</td><td>{position.article}</td><td>{position.charge}</td><td>{position.quantity} Packungen</td></tr>)}</tbody></table></div><p><strong>Ansprechpartner:</strong> {contacts.find(contact => contact.email === correction.contactEmail)?.name || correction.contactEmail}</p><p><strong>Erläuterung:</strong> {correction.comment || 'Angaben korrigiert'}</p>{correctionEvidenceUrl && correction.evidenceFile ? <a className="sample-correction-pdf" href={correctionEvidenceUrl} download={correction.evidenceFile.name}><Icon name="download" size={17}/> {correction.evidenceFile.name} herunterladen</a> : null}</section> : null}
    <div className="sample-detail-grid"><div className="sample-detail-main">
      <section className="data-section"><h2>Gemeldete Positionen · Revision {detail.revision}</h2><div className="table-wrap"><table><thead><tr><th>PZN</th><th>Artikel</th><th>Charge</th><th>Bestand zum {label(claim.termDate)}</th></tr></thead><tbody>{detail.positions.map(position => <tr key={position.pzn}><td>{position.pzn}</td><td>{position.article}</td><td>{position.charge}</td><td>{position.quantity} Packungen</td></tr>)}</tbody></table></div></section>
      <section className="data-section"><h2>Einreichung</h2><div className="sample-submission-facts"><div><span>Eingereicht von</span><strong>Maria Keller · Beispielapotheke</strong></div><div><span>Eingereicht am</span><strong>{detail.submitted}</strong></div><div><span>Revision</span><strong>{detail.revision} von {correction?.phase === 'submitted' ? 2 : detail.revision}</strong></div></div><p>Richtigkeit der Angaben bestätigt. Kommentar: Bestand zum {label(claim.termDate)} gemäß beigefügtem fiktivem Bestandsnachweis.</p></section>
      <section className="data-section"><h2>Bestandsnachweis</h2><div className="sample-evidence"><span className="sample-evidence-icon"><Icon name="file" size={22}/></span><div><strong>{detail.evidenceName}</strong><span>Revision {detail.revision} · fiktive Positionen und Stichtagsbestand</span></div>{evidenceUrl ? <a className="sample-evidence-download" href={evidenceUrl} download={detail.evidenceName} aria-label={`${detail.evidenceName} herunterladen`}><Icon name="download" size={18}/></a> : null}</div>{detail.previousPositions ? <div className="sample-evidence previous"><span className="sample-evidence-icon"><Icon name="file" size={22}/></span><div><strong>{detail.evidenceNameRev1}</strong><span>Revision 1 · unverändert archiviert</span></div>{previousEvidenceUrl ? <a className="sample-evidence-download" href={previousEvidenceUrl} download={detail.evidenceNameRev1} aria-label={`${detail.evidenceNameRev1} herunterladen`}><Icon name="download" size={18}/></a> : null}</div> : null}</section>
    </div><section className="data-section sample-timeline-panel"><div className="sample-timeline-heading"><div><h2>Verlauf</h2><p>Chronologie dieses fiktiven Vorgangs</p></div><span>{timelineEvents.length} Schritte</span></div><ol className="sample-timeline">{[...timelineEvents].reverse().map((event, index) => <li key={`${event.at}-${event.title}`} className={`sample-timeline-event ${event.tone}`}><span className="sample-timeline-marker" aria-hidden="true">{event.tone === 'issue' ? '×' : event.tone === 'current' ? '✓' : ''}</span><div className="sample-timeline-content"><div className="sample-timeline-meta"><time>{event.at}</time>{event.revision ? <span>{event.revision}</span> : null}</div><h3>{event.title}</h3><p>{event.description}</p></div>{index === 0 ? <span className="sample-timeline-latest">Aktuell</span> : null}</li>)}</ol></section></div>
  </>
}
