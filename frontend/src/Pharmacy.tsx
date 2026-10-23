import { useEffect, useRef, useState } from 'react'
import { api, download, fetchDocument, post, put, upload } from './api'
import type { Bootstrap, ClaimDetail, Credit, Draft, Item, Term } from './types'
import { dateLabel, dateTime, shortDate } from './types'
import { Button, Empty, Icon, Notice, PageTitle, StatusPill } from './ui'
import { PreviewDashboard } from './PreviewDashboard'
import type { DashboardView } from './PreviewDashboard'
import { PdfPreview } from './PdfPreviewLoader'
import { CreditDetailLayout } from './CreditDetailLayout'
import { ClaimCreditEntry } from './ClaimCreditEntry'
import { HelpContent } from './HelpContent'
import { ClaimHistory } from './ClaimHistory'
import { TimelinePanel } from './TimelinePanel'
import { ClaimDetailHeading } from './ClaimDetailHeading'
import { DiscardDraftDialog } from './DiscardDraftDialog'
import { DeclarationRequiredDialog } from './DeclarationRequiredDialog'
import { CorrectionFeedback } from './CorrectionFeedback'
import { fileSizeLabel } from './EvidenceFiles'
import './claim-editor.css'
import './claim-review.css'
import './sample-claim-detail.css'
import './claim-detail-surface.css'
import './draft-detail-grid.css'
import './credit-preview.css'

const termOpen = (term: Term) => new Date(term.opens_at).getTime() <= Date.now() && new Date(term.closes_at).getTime() >= Date.now()
const emptyItem = (): Item => ({ pzn: '', charge: '', quantity: 0 })
const claimForTerm = (data: Bootstrap, term: Term) => data.claims.find(claim => claim.term_id === term.id && claim.status !== 'CANCELLED')

async function startClaim(termId: string, navigate: (page: string) => void, refresh: () => Promise<Bootstrap>) {
  const result = await post<{ id: string }>('/claims', { termId })
  await refresh()
  navigate(`claim:${result.id}`)
}

function PharmacyTermList({ data, navigate, view, onViewChange }: { data: Bootstrap; navigate: (page: string) => void; view: DashboardView; onViewChange: (view: DashboardView) => void }) {
  // Nur offene Termine und Termine mit einem eigenen Vorgang kommen aus /bootstrap.
  const terms = data.terms.map(term => {
    const existing = claimForTerm(data, term)
    return {
      iso: term.date,
      date: shortDate(term.date),
      status: existing?.status || null,
      target: `term:${term.date}`,
      disabled: !existing && !termOpen(term)
    }
  })
  return <PreviewDashboard terms={terms} navigate={navigate} view={view} onViewChange={onViewChange}/>
}

export function PharmacyDashboard({ data, navigate, view, onViewChange }: { data: Bootstrap; navigate: (page: string) => void; view: DashboardView; onViewChange: (view: DashboardView) => void }) {
  return <PharmacyTermList data={data} navigate={navigate} view={view} onViewChange={onViewChange}/>
}

export function PharmacyTermPage({ iso, data, navigate, refresh, onSubmitted }: { iso: string; data: Bootstrap; navigate: (page: string) => void; refresh: () => Promise<Bootstrap>; onSubmitted: (claimNumber: string) => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const startedRef = useRef(false)
  const term = data.terms.find(item => item.date === iso)
  const existing = term ? claimForTerm(data, term) : undefined
  useEffect(() => {
    if (!term || existing || !termOpen(term) || startedRef.current) return
    startedRef.current = true
    setBusy(true)
    startClaim(term.id, navigate, refresh).catch(e => setError(e instanceof Error ? e.message : 'Meldung konnte nicht geöffnet werden.')).finally(() => setBusy(false))
  }, [term?.id, existing?.id])
  if (!term) return <Notice tone="warning">Dieser Stichtag ist nicht verfügbar.</Notice>
  if (existing) return <ClaimEditor key={existing.id} id={existing.id} data={data} navigate={navigate} refresh={refresh} onSubmitted={onSubmitted}/>
  if (termOpen(term) && !error) return <div className="loading-region" role="status">Meldung wird geöffnet …</div>
  return <>
    <button className="back-link" onClick={() => navigate('dashboard')}>← Zurück zur Übersicht</button>
    <PageTitle title={`Stichtag ${shortDate(term.date)}`} subtitle="Für diesen Stichtag liegt noch keine Meldung vor."/>
    {error ? <Notice tone="error">{error}</Notice> : null}
    <section className="data-section"><h2>Meldung erfassen</h2><p>Beginnen Sie eine Meldung für diesen Stichtag. Sie können den Entwurf speichern und später über das Datum wieder öffnen.</p><Button disabled={busy || !termOpen(term)} onClick={() => { setBusy(true); setError(''); startClaim(term.id, navigate, refresh).catch(e => setError(e instanceof Error ? e.message : 'Meldung konnte nicht begonnen werden.')).finally(() => setBusy(false)) }}>Meldung erfassen</Button></section>
  </>
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
  const [discardOpen, setDiscardOpen] = useState(false)
  const [declarationDialogOpen, setDeclarationDialogOpen] = useState(false)
  const [showValidation, setShowValidation] = useState(false)
  const [serverIssue, setServerIssue] = useState('')
  const validationRef = useRef<HTMLDivElement>(null)
  const firstPznRef = useRef<HTMLInputElement>(null)
  const declarationRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const versionRef = useRef(1)
  const latestRef = useRef<Draft | null>(null)
  const savedRef = useRef('')
  const savePromiseRef = useRef<Promise<void> | null>(null)
  const load = async () => { const result = await api<ClaimDetail>(`/claims/${id}`); setDetail(result); setDraft(result.claim.draft); latestRef.current = result.claim.draft; savedRef.current = JSON.stringify(result.claim.draft); versionRef.current = result.claim.version; setSaveState('Gespeichert') }
  useEffect(() => { load().catch(e => setError(e.message)) }, [id])
  useEffect(() => { if (detail?.claim.id === id && detail.claim.status === 'DRAFT' && draft && !draft.items.length) firstPznRef.current?.focus({ preventScroll: true }) }, [id, detail?.claim.id, detail?.claim.status])
  const change = (next: Draft) => { setDraft(next); setServerIssue(''); latestRef.current = next; setDirtyKey(v => v + 1); setSaveState('Ungespeicherte Änderungen') }
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
  useEffect(() => { if (!detail || detail.claim.status !== 'DRAFT' || !dirtyKey || discardOpen) return; const timer = setTimeout(() => { save().catch(() => {}) }, 1300); return () => clearTimeout(timer) }, [dirtyKey, detail?.claim.status, discardOpen])
  const setItem = (index: number, key: keyof Item, value: string | number) => {
    if (!draft) return
    const items = (draft.items.length ? draft.items : [emptyItem()]).map((item, i) => i === index ? { ...item, [key]: value, ...(key === 'pzn' ? { charge: '' } : {}) } : item)
    change({ ...draft, items })
  }
  const uploadFiles = async (files: File[]) => {
    if (!files.length) return
    setBusy(true); setError(''); setNotice('')
    let uploaded = 0
    const failures: string[] = []
    try {
      await save()
      for (const file of files) {
        try {
          const form = new FormData()
          form.set('file', file)
          await upload(`/claims/${id}/documents`, form)
          uploaded += 1
        } catch (reason) { failures.push(`${file.name}: ${reason instanceof Error ? reason.message : 'Upload fehlgeschlagen.'}`) }
      }
      await load()
      if (uploaded) setNotice(`${uploaded} ${uploaded === 1 ? 'Nachweis' : 'Nachweise'} hochgeladen.`)
      if (failures.length) setError(failures.join(' '))
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Upload fehlgeschlagen.') }
    finally { setBusy(false) }
  }
  const removeDocument = async (docId: string) => { setBusy(true); setError(''); try { await save(); await post(`/claims/${id}/documents/${docId}/remove`, {}); await load() } catch (e) { setError(e instanceof Error ? e.message : 'Entfernen fehlgeschlagen.') } finally { setBusy(false) } }
  const submit = async () => { if (!detail) return; setBusy(true); setError(''); try { await save(); await post(`/claims/${id}/submit`, { key: crypto.randomUUID() }); await refresh(); setConfirm(false); onSubmitted(detail.claim.number) } catch (e) { setServerIssue(e instanceof Error ? e.message : 'Einreichen fehlgeschlagen.'); setShowValidation(true); setConfirm(false); requestAnimationFrame(() => validationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })) } finally { setBusy(false) } }
  const revise = async () => { setBusy(true); setError(''); try { await post(`/claims/${id}/revise`, {}); await load(); await refresh(); setNotice('Neue Revision angelegt. Bitte prüfen Sie alle Angaben erneut.') } catch (e) { setError(e instanceof Error ? e.message : 'Korrektur nicht möglich.') } finally { setBusy(false) } }
  const cancel = async () => { setBusy(true); setError(''); try { await savePromiseRef.current?.catch(() => {}); await post(`/claims/${id}/cancel`, {}); await refresh(); navigate('dashboard') } catch (e) { setError(e instanceof Error ? e.message : 'Verwerfen fehlgeschlagen.'); setDiscardOpen(false) } finally { setBusy(false) } }
  if (!detail || !draft) return <div className="loading-region">{error ? <Notice tone="error">{error}</Notice> : 'Meldung wird geladen …'}</div>
  const claim = detail.claim, editable = claim.status === 'DRAFT'
  const visibleItems = draft.items.length ? draft.items : [emptyItem()]
  const credit = data.credits?.find(item => item.claim_id === claim.id)
  const documents = detail.documents.filter(d => !d.removed_at && d.kind === 'EVIDENCE')
  const submittedEvidence = new Set(detail.revisions.flatMap(revision => revision.snapshot.documentIds || []))
  const removableDocuments = documents.filter(doc => !submittedEvidence.has(doc.id))
  const removeAllDocuments = async () => {
    setBusy(true); setError(''); setNotice('')
    try {
      await save()
      const result = await post<{ removed: number }>(`/claims/${id}/documents/remove-all`, {})
      await load()
      setNotice(`${result.removed} ${result.removed === 1 ? 'Nachweis' : 'Nachweise'} entfernt.`)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Nachweise konnten nicht entfernt werden.'); await load().catch(() => {}) }
    finally { setBusy(false) }
  }
  const activeMembers = (data.members || []).filter(member => member.status === 'ACTIVE')
  const positionErrors = visibleItems.map(item => ({
    pzn: !item.pzn ? 'PZN eintragen.' : !data.products.some(product => product.pzn === item.pzn) ? 'PZN ist nicht im Sortiment vorhanden.' : '',
    charge: !item.charge.trim() ? 'Charge eintragen.' : '',
    quantity: !Number.isInteger(item.quantity) || item.quantity < 1 ? 'Bestand als ganze Packungszahl größer null eintragen.' : ''
  }))
  const evidenceError = documents.length ? '' : 'Bestandsnachweis hochladen.'
  const contactError = activeMembers.some(member => member.email === (draft.contactEmail || data.user.email)) ? '' : 'Aktiven Ansprechpartner auswählen.'
  const declarationError = draft.declaration ? '' : 'Richtigkeit der Angaben bestätigen.'
  const issues = [
    ...(!draft.items.length ? ['Mindestens eine Position hinzufügen.'] : []),
    ...draft.items.flatMap((item, index) => [
      ...(!item.pzn ? [`Position ${index + 1}: PZN eintragen.`] : !data.products.some(product => product.pzn === item.pzn) ? [`Position ${index + 1}: PZN ist nicht im Sortiment vorhanden.`] : []),
      ...(!item.charge.trim() ? [`Position ${index + 1}: Charge eintragen.`] : []),
      ...(!Number.isInteger(item.quantity) || item.quantity < 1 ? [`Position ${index + 1}: Bestand als ganze Packungszahl größer null eintragen.`] : [])
    ]),
    ...(!documents.length ? ['Bestandsnachweis hochladen.'] : []),
    ...(!activeMembers.some(member => member.email === (draft.contactEmail || data.user.email)) ? ['Aktiven Ansprechpartner auswählen.'] : []),
    ...(!draft.declaration ? ['Richtigkeit der Angaben bestätigen.'] : [])
  ]
  return <><button className="back-link" onClick={() => navigate('dashboard')}>← Zurück zur Übersicht</button>
    {editable ? <header className="claim-editor-heading"><h1>Meldung für den {shortDate(detail.term.date)} erfassen</h1><span>{claim.revision_no > 1 ? 'Korrektur erneut einreichen bis' : 'Einreichbar bis'} {dateTime(detail.term.closes_at)} Uhr</span></header> : <ClaimDetailHeading title={`Meldung für den ${shortDate(detail.term.date)}`} reference={claim.number} status={claim.status}/>}
    {error ? <Notice tone="error">{error}</Notice> : null}{notice ? <Notice tone="success">{notice}</Notice> : null}
    {editable ? <>
      <div className="draft-detail-grid"><div className="draft-detail-main">
      <section className="editor-section claim-editor-section" aria-labelledby="claim-positions-title">
        <h2 id="claim-positions-title">Positionen</h2>
        <div className="position-grid position-header"><span>PZN</span><span>Artikelbezeichnung</span><span>Charge</span><span>Bestand in Packungen zum {shortDate(detail.term.date)}</span><span></span></div>
        {visibleItems.map((item, index) => <div className="position-grid position-row" key={index}>
          <label><span className="mobile-label">PZN</span><input ref={index === 0 ? firstPznRef : undefined} list="pzn-options" inputMode="numeric" maxLength={8} value={item.pzn} onChange={e => setItem(index, 'pzn', e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="PZN suchen" aria-label={`PZN Position ${index + 1}`} aria-invalid={showValidation && !!positionErrors[index]?.pzn}/>{showValidation && positionErrors[index]?.pzn ? <span className="claim-field-error" data-validation-error role="alert">{positionErrors[index].pzn}</span> : null}</label>
          <div className="product-name">{data.products.find(p => p.pzn === item.pzn)?.name || 'Artikel erscheint nach PZN-Eingabe'}</div>
          <label><span className="mobile-label">Charge</span><input value={item.charge} onChange={e => setItem(index, 'charge', e.target.value)} placeholder="Chargennummer" aria-label={`Charge Position ${index + 1}`} aria-invalid={showValidation && !!positionErrors[index]?.charge}/>{showValidation && positionErrors[index]?.charge ? <span className="claim-field-error" data-validation-error role="alert">{positionErrors[index].charge}</span> : null}</label>
          <label><span className="mobile-label">Bestand in Packungen zum {shortDate(detail.term.date)}</span><input type="number" min="1" step="1" value={item.quantity || ''} onChange={e => setItem(index, 'quantity', Number(e.target.value))} placeholder="0" aria-label={`Bestand in Packungen zum ${shortDate(detail.term.date)}, Position ${index + 1}`} aria-invalid={showValidation && !!positionErrors[index]?.quantity}/>{showValidation && positionErrors[index]?.quantity ? <span className="claim-field-error" data-validation-error role="alert">{positionErrors[index].quantity}</span> : null}</label>
          {draft.items.length ? <button className="icon-button remove-item" aria-label={`Position ${index + 1} entfernen`} onClick={() => change({ ...draft, items: draft.items.filter((_, i) => i !== index) })}><Icon name="trash" size={18}/></button> : <span aria-hidden="true"/>}
        </div>)}
        <datalist id="pzn-options">{data.products.map(p => <option key={p.pzn} value={p.pzn} label={p.name}/>)}</datalist>
        <button className="add-row" onClick={() => change({ ...draft, items: [...draft.items, emptyItem()] })}><Icon name="plus" size={18}/> Position hinzufügen</button>
        {showValidation && !draft.items.length ? <span className="claim-field-error" data-validation-error role="alert">Mindestens eine Position hinzufügen.</span> : null}
      </section>
      <div className="claim-editor-details">
        <section className="editor-section claim-editor-section" aria-labelledby="claim-evidence-title">
          <h2 id="claim-evidence-title">Nachweise</h2>
          {claim.revision_no > 1 ? <p className="field-hint">Für diese Korrektur können Sie neue Nachweise hochladen.</p> : null}
          <label className="upload-zone evidence-server-zone" aria-invalid={showValidation && !!evidenceError}><span className="evidence-dropzone-icon"><Icon name="upload" size={22}/></span><span className="evidence-dropzone-copy"><strong>{busy ? 'Nachweise werden hochgeladen …' : claim.revision_no > 1 ? 'Nachweise zur Korrektur hinzufügen' : 'Nachweise hinzufügen'}</strong><small>Mehrere Dateien auswählen · PDF, JPG, PNG, XLS, XLSX, CSV · je höchstens 5 MB (Demo)</small></span><span className="evidence-dropzone-plus" aria-hidden="true"><Icon name="plus" size={19}/></span><input type="file" accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx,.csv" multiple aria-label="Mehrere Nachweise auswählen" disabled={busy} onChange={e => { uploadFiles(Array.from(e.target.files || [])); e.target.value = '' }}/></label>
          {showValidation && evidenceError ? <span className="claim-field-error" data-validation-error role="alert">{evidenceError}</span> : null}
          {documents.length ? <div className="evidence-selected"><div className="evidence-selected-heading"><strong>Hochgeladene Nachweise</strong><span>{documents.length}</span>{removableDocuments.length ? <button type="button" className="evidence-remove-all" disabled={busy} onClick={removeAllDocuments}><Icon name="trash" size={14}/> {submittedEvidence.size ? 'Neue entfernen' : 'Alle entfernen'}</button> : null}</div><ul>{documents.map(doc => <li key={doc.id}><span className="evidence-file-icon"><Icon name="file" size={19}/></span><span className="evidence-file-info"><strong title={doc.original_name}>{doc.original_name}</strong><small>{fileSizeLabel(doc.size)}{submittedEvidence.has(doc.id) ? ' · bereits eingereicht' : ''}</small></span>{!submittedEvidence.has(doc.id) ? <button type="button" className="evidence-file-remove" disabled={busy} onClick={() => removeDocument(doc.id)} aria-label={`${doc.original_name} entfernen`}><Icon name="trash" size={17}/></button> : null}</li>)}</ul></div> : null}
        </section>
        <section className="editor-section claim-editor-section">
          <label className="field claim-contact-field"><span>Ansprechpartner der Apotheke</span><select value={draft.contactEmail || data.user.email} aria-invalid={showValidation && !!contactError} onChange={e => { const member = activeMembers.find(item => item.email === e.target.value); if (member) change({ ...draft, contactName: member.name, contactEmail: member.email }) }}>{activeMembers.map(member => <option key={member.id} value={member.email}>{member.name}</option>)}</select>{showValidation && contactError ? <span className="claim-field-error" data-validation-error role="alert">{contactError}</span> : null}</label>
          <label className="field"><span>Kommentar (optional)</span><textarea rows={3} value={draft.comment} onChange={e => change({ ...draft, comment: e.target.value })} placeholder="Falls Sie etwas ergänzen möchten"/></label>
          <div className="claim-declaration"><label className="check-field"><input ref={declarationRef} type="checkbox" checked={draft.declaration} aria-invalid={showValidation && !!declarationError} onChange={e => change({ ...draft, declaration: e.target.checked })}/><span>Ich bestätige die Richtigkeit der Angaben zum Bestand am Stichtag.</span></label>{showValidation && declarationError ? <span className="claim-field-error" data-validation-error role="alert">{declarationError}</span> : null}</div>
        </section>
      </div>
      </div><TimelinePanel subtitle="Chronologie dieses Vorgangs" events={[{ key: `term-${detail.term.id}`, timeLabel: shortDate(detail.term.date), title: claim.revision_no > 1 ? 'Korrektur in Bearbeitung' : 'In Erfassung durch die Apotheke', description: claim.revision_no > 1 ? 'Für diese Meldung wird eine neue Revision vorbereitet.' : 'Für diesen Stichtag ist noch keine Meldung eingereicht.', revision: claim.revision_no > 1 ? `Revision ${claim.revision_no}` : undefined, tone: 'current' }]}/></div>
      {serverIssue ? <div className="claim-validation" ref={validationRef} role="alert">{serverIssue}</div> : null}
      <div className="editor-actions"><span><Icon name="clock" size={16}/> {saveState}</span><Button variant="quiet" disabled={busy} onClick={() => save().catch(() => {})}>Entwurf speichern</Button><Button disabled={busy} icon="arrow" onClick={async () => { setShowValidation(true); if (!draft.declaration) { setDeclarationDialogOpen(true); return } if (issues.length) { requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-validation-error]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })); return } try { await save(); setConfirm(true) } catch { /* Fehlermeldung wird angezeigt */ } }}>Angaben prüfen</Button><Button variant="secondary" className="discard-draft-trigger" disabled={busy} onClick={() => setDiscardOpen(true)}>Entwurf verwerfen</Button></div>
      {declarationDialogOpen ? <DeclarationRequiredDialog onClose={() => { setDeclarationDialogOpen(false); requestAnimationFrame(() => { declarationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); declarationRef.current?.focus({ preventScroll: true }) }) }}/>: null}
      {discardOpen ? <DiscardDraftDialog term={dateLabel(detail.term.date)} busy={busy} onCancel={() => setDiscardOpen(false)} onConfirm={cancel}/> : null}
    </> : <>
      {claim.status === 'REJECTED' ? <CorrectionFeedback reason={claim.rejection_reason} deadline={`${dateTime(detail.term.closes_at)} Uhr`} expired={!termOpen(detail.term)} action={<Button onClick={revise} disabled={busy || !termOpen(detail.term)} icon="arrow">Neue Revision erstellen</Button>}/> : null}
      {credit ? <ClaimCreditEntry reference={credit.reference} provided={dateTime(credit.published_at)} onOpen={() => navigate('credits:' + claim.id)}/> : null}
      <section className="data-section submitted-claim-section"><h2>Eingereichte Positionen</h2><div className="table-wrap"><table><thead><tr><th>PZN</th><th>Artikel</th><th>Charge</th><th>Bestand</th></tr></thead><tbody>{draft.items.map((item, index) => <tr key={index}><td>{item.pzn}</td><td>{data.products.find(p => p.pzn === item.pzn)?.name || '–'}</td><td>{item.charge}</td><td>{item.quantity} Packungen</td></tr>)}</tbody></table></div></section>
      <div className="submitted-info-grid">
        <section className="data-section submitted-claim-section"><h2>Nachweise</h2>{documents.length ? <div className="document-list">{documents.map(doc => <div key={doc.id}><Icon name="file" size={18}/><span>{doc.original_name}</span><button className="text-button" onClick={() => download(`/documents/${doc.id}`, doc.original_name).catch(e => setError(e.message))}>Herunterladen</button></div>)}</div> : <p className="muted">Keine Nachweise vorhanden.</p>}</section>
        <section className="data-section submitted-claim-section"><h2>Einreichung</h2><dl className="submitted-facts"><div><dt>Ansprechpartner der Apotheke</dt><dd>{draft.contactName || '–'}</dd></div><div><dt>Eingereicht am</dt><dd>{dateTime(claim.submitted_at)}</dd></div><div><dt>Revision</dt><dd>{claim.revision_no}</dd></div></dl><p className="submitted-confirmation"><Icon name="check" size={17}/> Richtigkeit der Angaben bestätigt</p>{draft.comment.trim() ? <p className="submitted-comment">{draft.comment}</p> : null}</section>
      </div>
      <ClaimHistory detail={detail} credit={credit} exportRun={data.exports?.find(run => run.id === claim.export_run_id)}/>
    </>}
    {confirm ? <div className="modal-backdrop" role="presentation"><div className="modal submission-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><h2 id="confirm-title">Haben Sie die Angaben überprüft?</h2><p>Wenn Sie die Meldung einreichen, können Sie die Angaben danach nicht mehr verändern.</p><div className="modal-actions"><Button variant="secondary" onClick={() => setConfirm(false)}>Zurück</Button><Button disabled={busy || !draft.declaration} onClick={submit}>Jetzt einreichen</Button></div></div></div> : null}
  </>
}

function CreditDocumentPreview({ credit, termDate, products, onClaim }: { credit: Credit; termDate?: string; products: Bootstrap['products']; onClaim: () => void }) {
  const [document, setDocument] = useState<{ url: string; mime: string } | null>(null)
  const [claimDetail, setClaimDetail] = useState<ClaimDetail | null>(null)
  const [claimError, setClaimError] = useState('')
  const [error, setError] = useState('')
  useEffect(() => { let active = true; setClaimDetail(null); setClaimError(''); api<ClaimDetail>(`/claims/${credit.claim_id}`).then(result => { if (active) setClaimDetail(result) }).catch(reason => { if (active) setClaimError(reason instanceof Error ? reason.message : 'Meldung konnte nicht geladen werden.') }); return () => { active = false } }, [credit.claim_id])
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
  const evidence = claimDetail?.documents.filter(item => item.kind === 'EVIDENCE' && !item.removed_at) || []
  return <CreditDetailLayout key={credit.id} reference={credit.reference} claimNumber={credit.claim_number} termDate={termDate} provided={dateTime(credit.published_at)} fileType={document?.mime === 'application/pdf' ? 'PDF' : document ? 'Bilddatei' : 'Dokument'} onClaim={onClaim} downloadError={Boolean(error)} download={document ? { url: document.url, filename: `Gutschrift-${credit.claim_number}.${extension}`, label: 'Gutschrift herunterladen' } : undefined} submission={claimDetail ? <><h2>Gemeldete Positionen · Revision {claimDetail.claim.revision_no}</h2><div className="table-wrap credit-positions"><table><thead><tr><th scope="col">PZN</th><th scope="col">Artikel</th><th scope="col">Charge</th><th scope="col">Bestand zum {termDate}</th></tr></thead><tbody>{claimDetail.claim.draft.items.map((item, index) => <tr key={`${item.pzn}-${index}`}><td data-label="PZN">{item.pzn}</td><td data-label="Artikel">{products.find(product => product.pzn === item.pzn)?.name || '–'}</td><td data-label="Charge">{item.charge}</td><td data-label={`Bestand zum ${termDate}`}>{item.quantity} Packungen</td></tr>)}</tbody></table></div>{evidence.map(item => <div className="credit-evidence-row" key={item.id}><Icon name="file" size={18}/><span>{item.original_name}</span><button type="button" className="text-button" onClick={() => download(`/documents/${item.id}`, item.original_name).catch(reason => setClaimError(reason instanceof Error ? reason.message : 'Nachweis konnte nicht geladen werden.'))}><Icon name="download" size={17}/> Nachweis</button></div>)}{claimError ? <Notice tone="error">{claimError}</Notice> : null}</> : <p role="status">{claimError || 'Meldungsdaten werden geladen …'}</p>}>
    {error ? <Notice tone="error">{error}</Notice> : document ? document.mime === 'application/pdf' ? <PdfPreview url={document.url} title={`PDF-Vorschau der Gutschrift ${credit.reference}`}/> : <img className="credit-image-preview" src={document.url} alt={`Gutschrift ${credit.reference}`}/> : <p className="credit-pdf-loading" role="status">Dokument wird geladen …</p>}
  </CreditDetailLayout>
}

export function CreditsPage({ data, navigate, selectedClaimId }: { data: Bootstrap; navigate: (page: string) => void; selectedClaimId?: string }) {
  const selected = data.credits?.find(credit => credit.claim_id === selectedClaimId)
  return <>
    {selected ? <CreditDocumentPreview credit={selected} termDate={data.claims.find(claim => claim.id === selected.claim_id)?.term_date ? shortDate(data.claims.find(claim => claim.id === selected.claim_id)!.term_date) : undefined} products={data.products} onClaim={() => navigate(`claim:${selected.claim_id}`)}/> : <><PageTitle title="Gutschriften" subtitle="Ihre bereitgestellten Gutschriften und zugehörigen Meldungen."/>{data.credits?.length ? <section className="data-section"><div className="table-wrap"><table><thead><tr><th>Meldung</th><th>Referenz</th><th>Bereitgestellt</th><th>Aktionen</th></tr></thead><tbody>{data.credits.map(credit => <tr key={credit.id}><td>{credit.claim_number}</td><td>{credit.reference}</td><td>{dateTime(credit.published_at)}</td><td><div className="claim-row-actions"><Button variant="secondary" onClick={() => navigate(`claim:${credit.claim_id}`)}>Meldung ansehen</Button><button className="text-button" onClick={() => navigate(`credits:${credit.claim_id}`)}>Gutschrift <Icon name="arrow" size={15}/></button></div></td></tr>)}</tbody></table></div></section> : <Empty title="Noch keine Gutschriften" description="Sobald eine Gutschrift bereitsteht, erscheint sie hier und in der zugehörigen Meldung."/>}</>}
  </>
}
export function HelpPage({ initialTopic = 'stichtage', navigate }: { initialTopic?: 'stichtage' | 'mitarbeiter'; navigate: (page: string) => void }) { return <HelpContent key={initialTopic} initialTopic={initialTopic} onNavigate={navigate}/> }
