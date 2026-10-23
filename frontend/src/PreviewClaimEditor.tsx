import { useEffect, useId, useRef, useState } from 'react'
import type { PreviewClaim, PreviewItem, PreviewMember } from './PreviewApp'
import { Button, Icon, PageTitle, StatusPill } from './ui'
import { ClaimCreditEntry } from './ClaimCreditEntry'
import { DiscardDraftDialog } from './DiscardDraftDialog'
import { DeclarationRequiredDialog } from './DeclarationRequiredDialog'
import { EvidenceFiles, useEvidenceUrls } from './EvidenceFiles'
import { TimelinePanel } from './TimelinePanel'
import './preview-claim-editor.css'
import './claim-review.css'
import './sample-claim-detail.css'
import './claim-detail-surface.css'
import './draft-detail-grid.css'

type Props = {
  claim: PreviewClaim
  term: string
  claimNumber: string
  navigate: (page: string) => void
  updateClaim: (change: Partial<PreviewClaim>) => void
  saveDraft: () => void
  addItem: () => void
  updateItem: (id: number, change: Partial<PreviewItem>) => void
  removeItem: (id: number) => void
  submit: () => void
  members: PreviewMember[]
  currentEmail: string
  discard: () => void
  setMessage: (message: string) => void
}

export const previewProductNames: Record<string, string> = {
  '01234567': 'Beispielpräparat A',
  '07654321': 'Beispielpräparat B',
  '04812345': 'Beispielpräparat C'
}
const emptyPreviewItem: PreviewItem = { id: 0, pzn: '', charge: '', quantity: '' }

export function PreviewClaimEditor({ claim, term, claimNumber, navigate, updateClaim, saveDraft, addItem, updateItem, removeItem, submit, members, currentEmail, discard, setMessage }: Props) {
  const editable = claim.status === 'DRAFT'
  const [showValidation, setShowValidation] = useState(false)
  const [fileError, setFileError] = useState('')
  const [discardOpen, setDiscardOpen] = useState(false)
  const [declarationDialogOpen, setDeclarationDialogOpen] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const firstPznRef = useRef<HTMLInputElement>(null)
  const declarationRef = useRef<HTMLInputElement>(null)
  const errorId = useId()
  const visibleItems = claim.items.length ? claim.items : [emptyPreviewItem]
  const positionErrors = visibleItems.map(item => ({
    pzn: !item.pzn ? 'PZN eintragen.' : !previewProductNames[item.pzn] ? 'PZN ist im Beispielsortiment nicht vorhanden.' : '',
    charge: !item.charge.trim() ? 'Charge eintragen.' : '',
    quantity: !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1 ? 'Bestand als ganze Packungszahl größer null eintragen.' : ''
  }))
  const contactError = members.some(member => member.email === (claim.contactEmail || currentEmail)) ? '' : 'Aktiven Ansprechpartner auswählen.'
  const evidenceError = fileError || (!claim.evidenceFiles.length ? 'Bestandsnachweis hochladen.' : '')
  const declarationError = claim.declaration ? '' : 'Richtigkeit der Angaben bestätigen.'
  const hasErrors = !claim.items.length || positionErrors.some(errors => Object.values(errors).some(Boolean)) || !!contactError || !!evidenceError || !!declarationError
  const changeItem = (item: PreviewItem, change: Partial<PreviewItem>) => {
    if (claim.items.length) updateItem(item.id, change)
    else updateClaim({ items: [{ ...item, ...change }] })
  }
  const checkAndSubmit = () => {
    setShowValidation(true)
    if (!claim.declaration) { setDeclarationDialogOpen(true); return }
    if (hasErrors) {
      requestAnimationFrame(() => editorRef.current?.querySelector<HTMLElement>('.preview-field-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
      return
    }
    submit()
  }
  const evidenceUrls = useEvidenceUrls(claim.evidenceFiles)
  useEffect(() => {
    if (claim.status === 'DRAFT' && !claim.items.length) firstPznRef.current?.focus({ preventScroll: true })
  }, [term])

  return <div ref={editorRef} className="preview-claim-editor">
    <button className="back-link" onClick={() => navigate('dashboard')}>← Zurück zur Übersicht</button>
    {editable ? <>
      <header className="preview-claim-heading"><h1>Meldung für den {term} erfassen</h1></header>
      <div className="draft-detail-grid"><div className="draft-detail-main">

      <section className="editor-section preview-claim-section" aria-labelledby="preview-positions-title">
        <h2 id="preview-positions-title">Positionen</h2>
        <div className="position-grid position-header"><span>PZN</span><span>Artikelbezeichnung</span><span>Charge</span><span>Bestand in Packungen zum {term}</span><span></span></div>
        {visibleItems.map((item, index) => <div className="position-grid position-row" key={item.id}>
          <label><span className="mobile-label">PZN</span><input ref={index === 0 ? firstPznRef : undefined} inputMode="numeric" maxLength={8} value={item.pzn} onChange={event => changeItem(item, { pzn: event.target.value.replace(/\D/g, '').slice(0, 8) })} placeholder="PZN" aria-label={`PZN Position ${index + 1}`} aria-invalid={showValidation && !!positionErrors[index].pzn} aria-describedby={showValidation && positionErrors[index].pzn ? `${errorId}-pzn-${item.id}` : undefined}/>{showValidation && positionErrors[index].pzn ? <span className="preview-field-error" id={`${errorId}-pzn-${item.id}`} role="alert">{positionErrors[index].pzn}</span> : null}</label>
          <div className={`product-name ${item.pzn.length === 8 && !previewProductNames[item.pzn] ? 'preview-product-unknown' : ''}`}>{previewProductNames[item.pzn] || (item.pzn.length === 8 ? 'Kein Beispielartikel gefunden' : 'Artikel erscheint nach PZN-Eingabe')}</div>
          <label><span className="mobile-label">Charge</span><input value={item.charge} onChange={event => changeItem(item, { charge: event.target.value })} placeholder="Chargennummer" aria-label={`Charge Position ${index + 1}`} aria-invalid={showValidation && !!positionErrors[index].charge} aria-describedby={showValidation && positionErrors[index].charge ? `${errorId}-charge-${item.id}` : undefined}/>{showValidation && positionErrors[index].charge ? <span className="preview-field-error" id={`${errorId}-charge-${item.id}`} role="alert">{positionErrors[index].charge}</span> : null}</label>
          <label><span className="mobile-label">Bestand in Packungen zum {term}</span><input type="number" min="1" step="1" value={item.quantity} onChange={event => changeItem(item, { quantity: event.target.value })} placeholder="0" aria-label={`Bestand in Packungen zum ${term}, Position ${index + 1}`} aria-invalid={showValidation && !!positionErrors[index].quantity} aria-describedby={showValidation && positionErrors[index].quantity ? `${errorId}-quantity-${item.id}` : undefined}/>{showValidation && positionErrors[index].quantity ? <span className="preview-field-error" id={`${errorId}-quantity-${item.id}`} role="alert">{positionErrors[index].quantity}</span> : null}</label>
          {claim.items.length ? <button className="icon-button remove-item" aria-label={`Position ${index + 1} entfernen`} onClick={() => removeItem(item.id)}><Icon name="trash" size={18}/></button> : <span aria-hidden="true"/>}
        </div>)}
        <button className="add-row" onClick={addItem}><Icon name="plus" size={18}/> Position hinzufügen</button>
        {showValidation && !claim.items.length ? <span className="preview-field-error" role="alert">Mindestens eine Position hinzufügen.</span> : null}
      </section>

      <div className="preview-claim-details"><section className="editor-section preview-claim-section" aria-labelledby="preview-evidence-title">
        <h2 id="preview-evidence-title">Nachweise</h2>
        <EvidenceFiles files={claim.evidenceFiles} onChange={files => { updateClaim({ evidenceFiles: files }); setMessage('') }} onError={error => { setFileError(error); if (error) setShowValidation(true) }} error={evidenceError} errorId={`${errorId}-evidence`} showError={showValidation}/>
      </section>

      <section className="editor-section preview-claim-section" aria-labelledby="preview-comment-title">
        <label className="field claim-contact-field"><span>Ansprechpartner der Apotheke</span><select value={claim.contactEmail || currentEmail} aria-invalid={showValidation && !!contactError} aria-describedby={showValidation && contactError ? `${errorId}-contact` : undefined} onChange={event => updateClaim({ contactEmail: event.target.value })}>{members.map(member => <option key={member.email} value={member.email}>{member.name}</option>)}</select>{showValidation && contactError ? <span className="preview-field-error" id={`${errorId}-contact`} role="alert">{contactError}</span> : null}</label>
        <label className="field"><span id="preview-comment-title">Kommentar (optional)</span><textarea rows={3} value={claim.comment} onChange={event => updateClaim({ comment: event.target.value })} placeholder="Falls Sie etwas ergänzen möchten"/></label>
        <div className="preview-claim-declaration"><label className="check-field"><input ref={declarationRef} type="checkbox" checked={claim.declaration} aria-invalid={showValidation && !!declarationError} aria-describedby={showValidation && declarationError ? `${errorId}-declaration` : undefined} onChange={event => updateClaim({ declaration: event.target.checked })}/><span>Ich bestätige die Richtigkeit der Angaben zum Bestand am Stichtag.</span></label>{showValidation && declarationError ? <span className="preview-field-error" id={`${errorId}-declaration`} role="alert">{declarationError}</span> : null}</div>
      </section></div>
      </div><TimelinePanel subtitle="Chronologie dieses fiktiven Vorgangs" events={[{ key: `term-${term}`, timeLabel: term, title: 'Stichtag verfügbar', description: 'Für diesen Stichtag ist noch keine Meldung eingereicht.', tone: 'current' }]}/></div>

      <div className="editor-actions"><Button variant="quiet" onClick={saveDraft}>Entwurf speichern</Button><Button icon="arrow" onClick={checkAndSubmit}>Angaben prüfen</Button><Button variant="secondary" className="discard-draft-trigger" onClick={() => setDiscardOpen(true)}>Entwurf verwerfen</Button></div>
      {declarationDialogOpen ? <DeclarationRequiredDialog onClose={() => { setDeclarationDialogOpen(false); requestAnimationFrame(() => { declarationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); declarationRef.current?.focus({ preventScroll: true }) }) }}/>: null}
      {discardOpen ? <DiscardDraftDialog term={term} demo onCancel={() => setDiscardOpen(false)} onConfirm={discard}/> : null}
    </> : <>
      <PageTitle title="Meldung im Überblick" subtitle={`${claimNumber} · Senkungstermin ${term}`}/>
      <div className="term-summary"><div><span>Stichtag</span><strong>{term}</strong></div><div><span>Vorgang</span><strong>{claimNumber}</strong></div><div><span>Status</span><strong><StatusPill status={claim.status} label={claim.status === 'COMPLETED' ? 'Ausgezahlt · Demo' : claim.status === 'MANUAL_REVIEW' ? 'Eingereicht' : undefined}/></strong></div></div>
      <section className="data-section claim-overview submitted-claim-section"><div className="section-header"><h2>Aktueller Status</h2><StatusPill status={claim.status} label={claim.status === 'COMPLETED' ? 'Ausgezahlt · Demo' : claim.status === 'MANUAL_REVIEW' ? 'Eingereicht' : undefined}/></div><p>{claim.status === 'REJECTED' ? `Rückmeldung: ${claim.reason}` : claim.status === 'MANUAL_REVIEW' ? 'Die eingereichte Beispielversion ist gesperrt und liegt in der fachlichen Prüfung.' : claim.status === 'APPROVED' ? 'Freigegeben. Als nächstes folgt die Abwicklung.' : 'Auszahlung nur als fiktiver Beispielstand dargestellt. Es wurde keine Zahlung ausgeführt.'}</p>{claim.status === 'REJECTED' ? <Button onClick={() => { updateClaim({ status: 'DRAFT', declaration: false }); setMessage('Neue Beispielrevision begonnen. Die vorherige Einreichung bleibt im echten Prozess erhalten.') }}>Neue Revision erstellen</Button> : null}{claim.status === 'COMPLETED' ? <ClaimCreditEntry reference={`BEISPIEL-GS-${claimNumber.slice(-2)}`} onOpen={() => navigate(`credits:${claimNumber}`)}/> : null}</section>
      <section className="data-section submitted-claim-section"><h2>Eingereichte Positionen</h2><div className="table-wrap"><table><thead><tr><th>PZN</th><th>Artikel</th><th>Charge</th><th>Bestand</th></tr></thead><tbody>{claim.items.map(item => <tr key={item.id}><td>{item.pzn}</td><td>{previewProductNames[item.pzn]}</td><td>{item.charge}</td><td>{item.quantity} Packungen</td></tr>)}</tbody></table></div></section>
      {claim.comment.trim() ? <section className="data-section submitted-claim-section"><h2>Kommentar</h2><p>{claim.comment}</p></section> : null}
      <section className="data-section submitted-claim-section"><h2>Nachweise</h2>{claim.evidenceFiles.length ? <div className="document-list">{claim.evidenceFiles.map((file, index) => <div key={`${file.name}-${index}`}><Icon name="file" size={18}/><span>{file.name}</span>{evidenceUrls[index] ? <a className="text-button" href={evidenceUrls[index]} download={file.name}>Herunterladen</a> : null}</div>)}</div> : <p className="muted">Für diesen Beispielvorgang liegt keine echte Datei vor.</p>}</section>
    </>}
  </div>
}
