import { useEffect, useRef, useState } from 'react'
import { api, download, fetchDocument, post, put, upload } from './api'
import type { Bootstrap, ClaimDetail, Credit, Draft, Item, Term } from './types'
import { dateLabel, dateTime, shortDate, statusLabel } from './types'
import { Button, Empty, Icon, Notice, PageTitle, StatusPill } from './ui'
import { PreviewDashboard } from './PreviewDashboard'
import type { DashboardView } from './PreviewDashboard'
import { PdfPreview } from './PdfPreviewLoader'
import './claim-editor.css'
import './credit-preview.css'

const termOpen = (term: Term) => new Date(term.opens_at).getTime() <= Date.now() && new Date(term.closes_at).getTime() >= Date.now()
const emptyItem = (): Item => ({ pzn: '', charge: '', quantity: 0 })
const claimForTerm = (data: Bootstrap, term: Term) => data.claims.find(claim => claim.term_id === term.id && claim.status !== 'CANCELLED')

async function startClaim(termId: string, navigate: (page: string) => void, refresh: () => Promise<Bootstrap>) {
  const result = await post<{ id: string }>('/claims', { termId })
  await refresh()
  navigate(`claim:${result.id}`)
}

function PharmacyTermList({ data, navigate, refresh, view, onViewChange }: { data: Bootstrap; navigate: (page: string) => void; refresh: () => Promise<Bootstrap>; view: DashboardView; onViewChange: (view: DashboardView) => void }) {
  const [error, setError] = useState('')
  // Nur offene Termine und Termine mit einem eigenen Vorgang kommen aus /bootstrap.
  const terms = data.terms.map(term => {
    const existing = claimForTerm(data, term)
    return {
      iso: term.date,
      date: shortDate(term.date),
      status: existing?.status || null,
      target: existing?.status === 'COMPLETED' && data.credits?.some(credit => credit.claim_id === existing.id)
        ? `credits:${existing.id}`
        : existing ? `claim:${existing.id}` : `term:${term.id}`,
      disabled: !existing && !termOpen(term)
    }
  })
  const open = (target: string) => {
    if (target.startsWith('term:')) startClaim(target.slice(5), navigate, refresh).catch(e => setError(e instanceof Error ? e.message : 'Meldung konnte nicht geöffnet werden.'))
    else navigate(target)
  }
  return <>{error ? <Notice tone="error">{error}</Notice> : null}<PreviewDashboard terms={terms} navigate={open} preview={false} view={view} onViewChange={onViewChange}/></>
}

export function PharmacyDashboard({ data, navigate, refresh, view, onViewChange }: { data: Bootstrap; navigate: (page: string) => void; refresh: () => Promise<Bootstrap>; view: DashboardView; onViewChange: (view: DashboardView) => void }) {
  return <PharmacyTermList data={data} navigate={navigate} refresh={refresh} view={view} onViewChange={onViewChange}/>
}

export function ClaimsPage({ data, navigate, refresh }: { data: Bootstrap; navigate: (page: string) => void; refresh: () => Promise<Bootstrap> }) {
  const [tab, setTab] = useState<'new' | 'draft' | 'submitted' | 'paid'>('new')
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')
  const records = data.terms.map(term => ({ term, claim: claimForTerm(data, term) })).sort((a, b) => b.term.date.localeCompare(a.term.date))
  const tabs = [
    { key: 'new', label: 'Neu', rows: records.filter(row => termOpen(row.term) && !row.claim) },
    { key: 'draft', label: 'Entwürfe', rows: records.filter(row => row.claim?.status === 'DRAFT') },
    { key: 'submitted', label: 'Eingereicht', rows: records.filter(row => row.claim && !['DRAFT', 'CANCELLED'].includes(row.claim.status)) },
    { key: 'paid', label: 'Ausgezahlt', rows: records.filter(row => row.claim?.status === 'COMPLETED') }
  ] as const
  const active = tabs.find(item => item.key === tab) || tabs[0]
  const pageCount = Math.max(1, Math.ceil(active.rows.length / 15))
  const currentPage = Math.min(page, pageCount)
  const shown = active.rows.slice((currentPage - 1) * 15, currentPage * 15)
  const open = (term: Term, claim: typeof records[number]['claim']) => {
    if (claim) navigate(`claim:${claim.id}`)
    else startClaim(term.id, navigate, refresh).catch(e => setError(e instanceof Error ? e.message : 'Meldung konnte nicht geöffnet werden.'))
  }
  return <>
    <PageTitle title="Meldungen" subtitle="Neue Termine, Entwürfe und alle eingereichten Meldungen."/>
    {error ? <Notice tone="error">{error}</Notice> : null}
    <div className="tabs" role="tablist" aria-label="Meldungsbereiche">{tabs.map(item => <button key={item.key} role="tab" aria-selected={tab === item.key} className={tab === item.key ? 'selected' : ''} onClick={() => { setTab(item.key); setPage(1) }}>{item.label} <span className="claim-tab-count">{item.rows.length}</span></button>)}</div>
    {shown.length ? <section className="data-section"><div className="table-wrap"><table className="preview-claim-table"><thead><tr><th>Stichtag</th><th>Vorgang</th><th>Status</th><th>Aktion</th></tr></thead><tbody>{shown.map(({ term, claim }) => { const credit = claim ? data.credits?.find(item => item.claim_id === claim.id) : undefined; return <tr key={term.id}><td>{dateLabel(term.date)}</td><td>{claim?.number || 'Neue Meldung'}</td><td>{claim ? <StatusPill status={claim.status} label={claim.status === 'COMPLETED' ? 'Ausgezahlt' : undefined}/> : 'Noch offen'}</td><td><div className="claim-row-actions"><Button variant="secondary" onClick={() => open(term, claim)}>{claim ? claim.status === 'DRAFT' ? 'Entwurf fortsetzen' : 'Meldung ansehen' : 'Meldung erfassen'}</Button>{credit ? <button className="text-button" onClick={() => navigate(`credits:${claim!.id}`)}>Gutschrift <Icon name="arrow" size={15}/></button> : null}</div></td></tr> })}</tbody></table></div></section> : <Empty title={tab === 'new' ? 'Keine neuen Termine' : tab === 'draft' ? 'Keine Entwürfe' : tab === 'paid' ? 'Noch keine Auszahlungen' : 'Noch keine eingereichten Meldungen'} description="Sobald ein Vorgang vorhanden ist, erscheint er hier."/>}
    <div className="overview-pagination"><span>{active.rows.length} {active.rows.length === 1 ? 'Vorgang' : 'Vorgänge'}</span><nav aria-label="Seiten der Meldungsliste"><button onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1}>Zurück</button><span className="overview-page-current" aria-current="page">{currentPage} / {pageCount}</span><button onClick={() => setPage(currentPage + 1)} disabled={currentPage === pageCount}>Weiter <Icon name="arrow" size={15}/></button></nav></div>
  </>
}
export function ClaimEditor({ id, data, navigate, refresh, onSubmitted }: { id: string; data: Bootstrap; navigate: (page: string) => void; refresh: () => Promise<Bootstrap>; onSubmitted: (claimNumber: string) => void }) {
  const [detail, setDetail] = useState<ClaimDetail | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saveState, setSaveState] = useState('Gespeichert')
  const [dirtyKey, setDirtyKey] = useState(0)
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const versionRef = useRef(1)
  const latestRef = useRef<Draft | null>(null)
  const savedRef = useRef('')
  const savePromiseRef = useRef<Promise<void> | null>(null)
  const load = async () => { const result = await api<ClaimDetail>(`/claims/${id}`); setDetail(result); setDraft(result.claim.draft); latestRef.current = result.claim.draft; savedRef.current = JSON.stringify(result.claim.draft); versionRef.current = result.claim.version; setSaveState('Gespeichert') }
  useEffect(() => { load().catch(e => setError(e.message)) }, [id])
  const change = (next: Draft) => { setDraft(next); latestRef.current = next; setDirtyKey(v => v + 1); setSaveState('Ungespeicherte Änderungen') }
  const save = async () => {
    if (savePromiseRef.current) return savePromiseRef.current
    const task = (async () => {
      while (latestRef.current && savedRef.current !== JSON.stringify(latestRef.current)) {
        const snapshot = latestRef.current
        setSaveState('Speichert …')
        const result = await put<{ version: number }>(`/claims/${id}/draft`, { version: versionRef.current, ...snapshot })
        versionRef.current = result.version
        savedRef.current = JSON.stringify(snapshot)
      }
      setSaveState('Gespeichert')
    })()
    savePromiseRef.current = task
    try { await task } catch (e) { setSaveState('Speichern fehlgeschlagen'); setError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen.'); throw e } finally { savePromiseRef.current = null }
  }
  useEffect(() => { if (!detail || detail.claim.status !== 'DRAFT' || !dirtyKey) return; const timer = setTimeout(() => { save().catch(() => {}) }, 1300); return () => clearTimeout(timer) }, [dirtyKey, detail?.claim.status])
  const setItem = (index: number, key: keyof Item, value: string | number) => {
    if (!draft) return
    const items = draft.items.map((item, i) => i === index ? { ...item, [key]: value, ...(key === 'pzn' ? { charge: '' } : {}) } : item)
    change({ ...draft, items })
  }
  const uploadFile = async (file: File | null) => { if (!file) return; setBusy(true); setError(''); try { await save(); const form = new FormData(); form.set('file', file); await upload(`/claims/${id}/documents`, form); await load(); setNotice('Nachweis hochgeladen.') } catch (e) { setError(e instanceof Error ? e.message : 'Upload fehlgeschlagen.') } finally { setBusy(false) } }
  const removeDocument = async (docId: string) => { setBusy(true); setError(''); try { await save(); await post(`/claims/${id}/documents/${docId}/remove`, {}); await load() } catch (e) { setError(e instanceof Error ? e.message : 'Entfernen fehlgeschlagen.') } finally { setBusy(false) } }
  const submit = async () => { if (!detail) return; setBusy(true); setError(''); try { await save(); await post(`/claims/${id}/submit`, { key: crypto.randomUUID() }); await refresh(); setConfirm(false); onSubmitted(detail.claim.number) } catch (e) { setError(e instanceof Error ? e.message : 'Einreichen fehlgeschlagen.'); setConfirm(false) } finally { setBusy(false) } }
  const revise = async () => { setBusy(true); setError(''); try { await post(`/claims/${id}/revise`, {}); await load(); await refresh(); setNotice('Neue Revision angelegt. Bitte prüfen Sie alle Angaben erneut.') } catch (e) { setError(e instanceof Error ? e.message : 'Korrektur nicht möglich.') } finally { setBusy(false) } }
  const cancel = async () => { if (!window.confirm('Möchten Sie diesen Entwurf wirklich verwerfen?')) return; setBusy(true); try { await post(`/claims/${id}/cancel`, {}); await refresh(); navigate('dashboard') } catch (e) { setError(e instanceof Error ? e.message : 'Verwerfen fehlgeschlagen.') } finally { setBusy(false) } }
  if (!detail || !draft) return <div className="loading-region">{error ? <Notice tone="error">{error}</Notice> : 'Meldung wird geladen …'}</div>
  const claim = detail.claim, editable = claim.status === 'DRAFT'
  const credit = data.credits?.find(item => item.claim_id === claim.id)
  const documents = detail.documents.filter(d => !d.removed_at && d.kind === 'EVIDENCE')
  return <><button className="back-link" onClick={() => navigate('dashboard')}>← Zurück zur Übersicht</button>
    {editable ? <header className="claim-editor-heading"><h1>Meldung erfassen</h1><span>Stichtag {shortDate(detail.term.date)} · Glenmark · Einreichbar bis {shortDate(detail.term.closes_at)}</span></header> : <><PageTitle title="Meldung im Überblick" subtitle={claim.number}/><div className="term-summary"><div><span>Stichtag</span><strong>{shortDate(detail.term.date)}</strong></div><div><span>Meldezeitraum</span><strong>bis {shortDate(detail.term.closes_at)}</strong></div><div><span>Hersteller</span><strong>Glenmark</strong></div></div></>}
    {error ? <Notice tone="error">{error}</Notice> : null}{notice ? <Notice tone="success">{notice}</Notice> : null}
    {editable ? <>
      <section className="editor-section claim-editor-section" aria-labelledby="claim-positions-title">
        <h2 id="claim-positions-title">Positionen</h2>
        {draft.items.length ? <div className="position-grid position-header"><span>PZN</span><span>Artikelbezeichnung</span><span>Charge</span><span>Bestand in Packungen</span><span></span></div> : null}
        {draft.items.map((item, index) => <div className="position-grid position-row" key={index}><label><span className="mobile-label">PZN</span><input list="pzn-options" inputMode="numeric" maxLength={8} value={item.pzn} onChange={e => setItem(index, 'pzn', e.target.value)} placeholder="PZN suchen" aria-label={`PZN Position ${index + 1}`}/></label><div className="product-name">{data.products.find(p => p.pzn === item.pzn)?.name || 'Artikel erscheint nach PZN-Eingabe'}</div><label><span className="mobile-label">Charge</span><input value={item.charge} onChange={e => setItem(index, 'charge', e.target.value)} placeholder="Chargennummer" aria-label={`Charge Position ${index + 1}`}/></label><label><span className="mobile-label">Bestand in Packungen</span><input type="number" min="1" step="1" value={item.quantity || ''} onChange={e => setItem(index, 'quantity', Number(e.target.value))} placeholder="0" aria-label={`Bestand Position ${index + 1}`}/></label><button className="icon-button remove-item" aria-label={`Position ${index + 1} entfernen`} onClick={() => change({ ...draft, items: draft.items.filter((_, i) => i !== index) })}><Icon name="trash" size={18}/></button></div>)}
        {draft.items.some(item => !item.pzn || !item.charge.trim() || !item.quantity) ? <p className="claim-position-help">PZN: Artikelnummer · Charge: Nummer von der Packung · Bestand: Packungen am Stichtag</p> : null}
        <datalist id="pzn-options">{data.products.map(p => <option key={p.pzn} value={p.pzn} label={p.name}/>)}</datalist>
        <button className="add-row" onClick={() => change({ ...draft, items: [...draft.items, emptyItem()] })}><Icon name="plus" size={18}/> Position hinzufügen</button>
      </section>
      <div className="claim-editor-details"><section className="editor-section claim-editor-section" aria-labelledby="claim-evidence-title"><h2 id="claim-evidence-title">Nachweis</h2><label className="upload-zone"><Icon name="upload" size={27}/><span>Datei auswählen</span><small>PDF, JPG, PNG · maximal 5 MB</small><input type="file" accept=".pdf,.jpg,.jpeg,.png" disabled={busy} onChange={e => { uploadFile(e.target.files?.[0] || null); e.target.value = '' }}/></label>{documents.length ? <div className="document-list">{documents.map(doc => <div key={doc.id}><Icon name="file" size={18}/><span>{doc.original_name}</span><small>{Math.ceil(doc.size / 1024)} KB</small><button className="icon-button" onClick={() => removeDocument(doc.id)} aria-label={`${doc.original_name} entfernen`}><Icon name="trash" size={16}/></button></div>)}</div> : null}</section>
      <section className="editor-section claim-editor-section"><label className="field"><span>Kommentar (optional)</span><textarea rows={3} value={draft.comment} onChange={e => change({ ...draft, comment: e.target.value })} placeholder="Falls Sie etwas ergänzen möchten"/></label><label className="check-field"><input type="checkbox" checked={draft.declaration} onChange={e => change({ ...draft, declaration: e.target.checked })}/><span>Ich bestätige die Richtigkeit der Angaben zum Bestand am Stichtag.</span></label></section></div>
      <div className="editor-actions"><span><Icon name="clock" size={16}/> {saveState}</span><Button variant="quiet" disabled={busy} onClick={() => save().catch(() => {})}>Entwurf speichern</Button><Button disabled={busy || !draft.items.length} icon="arrow" onClick={async () => { try { await save(); setConfirm(true) } catch { /* Fehlermeldung wird angezeigt */ } }}>Angaben prüfen</Button><button className="text-button danger-text" onClick={cancel}>Entwurf verwerfen</button></div>
    </> : <><section className="data-section claim-overview"><div className="section-header"><h2>Aktueller Status</h2><StatusPill status={claim.status}/></div><p className="muted">Die eingereichte Version ist schreibgeschützt.</p>{claim.status === 'REJECTED' ? <Notice tone="warning"><strong>Bitte korrigieren:</strong> {claim.rejection_reason}</Notice> : <p>{claim.status === 'MANUAL_REVIEW' ? 'Glenmark prüft Ihre Meldung. Die eingereichte Version kann nicht verändert werden.' : claim.status === 'APPROVED' ? 'Die Meldung wurde freigegeben. Eine Gutschrift wird nach der Abwicklung bereitgestellt.' : statusLabel[claim.status]}</p>}{claim.status === 'REJECTED' ? <Button onClick={revise} disabled={busy} icon="arrow">Neue Revision erstellen</Button> : null}{credit ? <div className="claim-credit-link"><div><strong>Gutschrift verfügbar</strong><span>Referenz {credit.reference} · direkt diesem Vorgang zugeordnet</span></div><Button variant="secondary" icon="arrow" onClick={() => navigate('credits:' + claim.id)}>Gutschrift ansehen</Button></div> : null}</section><section className="data-section"><h2>Eingereichte Positionen</h2><div className="table-wrap"><table><thead><tr><th>PZN</th><th>Artikel</th><th>Charge</th><th>Bestand</th></tr></thead><tbody>{draft.items.map((item, index) => <tr key={index}><td>{item.pzn}</td><td>{data.products.find(p => p.pzn === item.pzn)?.name || '–'}</td><td>{item.charge}</td><td>{item.quantity} Packungen</td></tr>)}</tbody></table></div></section><section className="data-section"><h2>Einreichung</h2><p>{draft.contactName || '–'} · {dateTime(claim.submitted_at)}</p></section>{draft.comment.trim() ? <section className="data-section"><h2>Kommentar</h2><p>{draft.comment}</p></section> : null}<section className="data-section"><h2>Nachweise</h2>{documents.length ? <div className="document-list">{documents.map(doc => <div key={doc.id}><Icon name="file" size={18}/><span>{doc.original_name}</span><button className="text-button" onClick={() => download(`/documents/${doc.id}`, doc.original_name).catch(e => setError(e.message))}>Herunterladen</button></div>)}</div> : <p className="muted">Keine Nachweise vorhanden.</p>}</section><section className="data-section"><h2>Verlauf</h2><div className="timeline">{detail.revisions.map(rev => <div key={rev.revision_no}><span className="timeline-dot"/><div><strong>Revision {rev.revision_no} · {statusLabel[rev.status]}</strong><p>Eingereicht am {dateTime(rev.submitted_at)}{rev.decision_at ? ` · Entscheidung am ${dateTime(rev.decision_at)}` : ''}</p>{rev.decision_reason ? <p>Grund: {rev.decision_reason}</p> : null}</div></div>)}</div></section></>}
    {confirm ? <div className="modal-backdrop" role="presentation"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><h2 id="confirm-title">Meldung verbindlich einreichen?</h2><p>Bitte prüfen Sie alle Positionen. Diese Revision kann nach dem Einreichen nicht mehr bearbeitet werden.</p><div className="confirm-summary"><div><span>Senkungstermin</span><strong>{dateLabel(detail.term.date)}</strong></div><div><span>Positionen</span><strong>{draft.items.length}</strong></div><div><span>Nachweise</span><strong>{documents.length}</strong></div><div><span>Einreichende Person</span><strong>{data.user.name}</strong></div></div><ul>{draft.items.map((item, i) => <li key={i}>{item.pzn} · {item.charge || 'Charge fehlt'} · {item.quantity} Packungen</li>)}</ul><div className="modal-actions"><Button variant="secondary" onClick={() => setConfirm(false)}>Zurück</Button><Button disabled={busy || !draft.declaration} onClick={submit}>Jetzt einreichen</Button></div>{!draft.declaration ? <p className="field-hint">Bitte bestätigen Sie zuerst die Richtigkeit der Angaben.</p> : null}</div></div> : null}
  </>
}

function CreditDocumentPreview({ credit }: { credit: Credit }) {
  const [document, setDocument] = useState<{ url: string; mime: string } | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    let objectUrl = ''
    setDocument(null)
    setError('')
    fetchDocument(`/documents/${credit.document_id}`).then(blob => {
      if (!active) return
      if (!['application/pdf', 'image/jpeg', 'image/png'].includes(blob.type)) throw new Error('Für dieses Dateiformat ist keine Vorschau verfügbar.')
      objectUrl = URL.createObjectURL(blob)
      setDocument({ url: objectUrl, mime: blob.type })
    }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Dokument konnte nicht geladen werden.') })
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [credit.document_id])
  const extension = document?.mime === 'image/jpeg' ? 'jpg' : document?.mime === 'image/png' ? 'png' : 'pdf'
  return <>
    <div className="credit-pdf-heading"><h3>Dokumentvorschau</h3><span>{document?.mime === 'application/pdf' ? 'PDF' : document ? 'Bilddatei' : 'Gutschrift'}</span></div>
    {error ? <Notice tone="error">{error}</Notice> : document ? <>{document.mime === 'application/pdf' ? <PdfPreview url={document.url} title={`PDF-Vorschau der Gutschrift ${credit.reference}`}/> : <img className="credit-image-preview" src={document.url} alt={`Gutschrift ${credit.reference}`}/>}<div className="claim-row-actions"><a className="button button-primary" href={document.url} download={`Gutschrift-${credit.claim_number}.${extension}`}>Gutschrift herunterladen <Icon name="download" size={18}/></a></div></> : <p role="status">Dokumentvorschau wird geladen …</p>}
  </>
}

export function CreditsPage({ data, navigate, selectedClaimId }: { data: Bootstrap; navigate: (page: string) => void; selectedClaimId?: string }) {
  const selected = data.credits?.find(credit => credit.claim_id === selectedClaimId)
  return <>
    {selected ? <button className="back-link" onClick={() => navigate(`claim:${selected.claim_id}`)}>← Zurück zur Meldung</button> : null}
    <PageTitle title={selected ? 'Gutschrift' : 'Gutschriften'} subtitle={selected ? `Zur Meldung ${selected.claim_number}` : 'Ihre bereitgestellten Gutschriften und zugehörigen Meldungen.'}/>
    {selected ? <section className="data-section credit-detail"><div className="section-header"><h2>Ihre Gutschrift</h2><StatusPill status="COMPLETED" label="Bereitgestellt"/></div><div className="term-summary"><div><span>Vorgang</span><strong>{selected.claim_number}</strong></div><div><span>Referenz</span><strong>{selected.reference}</strong></div><div><span>Bereitgestellt</span><strong>{dateTime(selected.published_at)}</strong></div></div><button className="text-button" onClick={() => navigate(`claim:${selected.claim_id}`)}>Meldung öffnen <Icon name="arrow" size={15}/></button><CreditDocumentPreview credit={selected}/></section> : data.credits?.length ? <section className="data-section"><div className="table-wrap"><table><thead><tr><th>Meldung</th><th>Referenz</th><th>Bereitgestellt</th><th>Aktionen</th></tr></thead><tbody>{data.credits.map(credit => <tr key={credit.id}><td>{credit.claim_number}</td><td>{credit.reference}</td><td>{dateTime(credit.published_at)}</td><td><div className="claim-row-actions"><Button variant="secondary" onClick={() => navigate(`claim:${credit.claim_id}`)}>Meldung ansehen</Button><button className="text-button" onClick={() => navigate(`credits:${credit.claim_id}`)}>Gutschrift <Icon name="arrow" size={15}/></button></div></td></tr>)}</tbody></table></div></section> : <Empty title="Noch keine Gutschriften" description="Sobald eine Gutschrift bereitsteht, erscheint sie hier und in der zugehörigen Meldung."/>}
  </>
}
export function HelpPage() { return <><PageTitle title="Hilfe" subtitle="Kurze Antworten zu Ihrer Lagerwertverlustmeldung."/><div className="help-grid"><section><h2>Was ist eine PZN?</h2><p>Die Pharmazentralnummer kennzeichnet einen Artikel. Wählen Sie eine Glenmark-PZN aus der Suche. Die Einreichung prüft, ob sie zum gewählten Stichtag betroffen ist.</p></section><section><h2>Welche Charge trage ich ein?</h2><p>Tragen Sie die Chargennummer von der Packung ein. Das Feld muss ausgefüllt sein; eine fachliche Chargenprüfung findet nicht statt.</p></section><section><h2>Kann ich später korrigieren?</h2><p>Entwürfe können Sie jederzeit innerhalb der Frist bearbeiten. Eine eingereichte Revision bleibt unverändert. Nach einer Ablehnung können Sie eine neue Revision anlegen, sofern die Frist noch offen ist.</p></section><section><h2>Wo finde ich meine Gutschrift?</h2><p>Öffnen Sie einen ausgezahlten Stichtag in der Übersicht. Die zugeordnete Gutschrift zeigt das Dokument als Vorschau und bietet den Download an. Die Zahlungsabwicklung selbst erfolgt außerhalb dieses Portals.</p></section></div></> }
