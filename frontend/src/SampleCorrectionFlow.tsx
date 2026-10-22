import { useId, useRef, useState } from 'react'
import type { SamplePosition } from './sample-claim-data'
import { previewProductNames } from './PreviewClaimEditor'
import { Button } from './ui'
import { EvidenceFiles } from './EvidenceFiles'
import './sample-correction-flow.css'

export type SampleCorrection = {
  phase: 'draft' | 'submitted'
  positions: SamplePosition[]
  comment: string
  contactEmail: string
  declaration: boolean
  evidenceFiles: File[]
  submittedAt?: string
}

export function SampleCorrectionFlow({
  value, contacts, deadlineOpen, onChange, onSubmit
}: {
  value: SampleCorrection
  contacts: { name: string; email: string }[]
  deadlineOpen: boolean
  onChange: (next: SampleCorrection) => void
  onSubmit: () => void
}) {
  const [reviewing, setReviewing] = useState(false)
  const [reviewAttempted, setReviewAttempted] = useState(false)
  const [fileError, setFileError] = useState('')
  const sectionRef = useRef<HTMLElement>(null)
  const errorId = useId()
  const change = (next: SampleCorrection) => { onChange(next); setReviewing(false) }
  const changePosition = (index: number, update: Partial<SamplePosition>) => {
    change({ ...value, positions: value.positions.map((position, current) => current === index ? { ...position, ...update } : position) })
  }
  const positionErrors = value.positions.map(position => ({
    pzn: !position.pzn ? 'PZN eintragen.' : !previewProductNames[position.pzn] ? 'Gültige PZN auswählen.' : '',
    charge: !position.charge.trim() ? 'Charge eintragen.' : '',
    quantity: !Number.isInteger(position.quantity) || position.quantity < 1 ? 'Bestand als ganze Packungszahl größer null eintragen.' : ''
  }))
  const contactError = contacts.some(contact => contact.email === value.contactEmail) ? '' : 'Aktiven Ansprechpartner der Apotheke auswählen.'
  const evidenceError = fileError || (!value.evidenceFiles.length ? 'Nachweis für Revision 2 hochladen.' : '')
  const declarationError = value.declaration ? '' : 'Richtigkeit der korrigierten Angaben bestätigen.'
  const review = () => {
    setReviewAttempted(true)
    if (!deadlineOpen || positionErrors.some(errors => Object.values(errors).some(Boolean)) || contactError || evidenceError || declarationError) {
      requestAnimationFrame(() => sectionRef.current?.querySelector<HTMLElement>('.sample-correction-field-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
      return
    }
    setReviewing(true)
  }

  return <section ref={sectionRef} className="data-section sample-correction" aria-labelledby="sample-correction-title">
    <div className="section-header"><div><h2 id="sample-correction-title">Revision 2 korrigieren</h2><p>Die eingereichte Revision 1 bleibt unverändert im Verlauf.</p></div></div>
    <div className="sample-correction-fields">
      {value.positions.map((position, index) => <div className="sample-correction-position" key={index}>
        <strong>Position {index + 1}</strong>
        <label>PZN<input inputMode="numeric" maxLength={8} value={position.pzn} aria-invalid={reviewAttempted && !!positionErrors[index].pzn} aria-describedby={reviewAttempted && positionErrors[index].pzn ? `${errorId}-pzn-${index}` : undefined} onChange={event => { const pzn = event.target.value.replace(/\D/g, '').slice(0, 8); changePosition(index, { pzn, article: previewProductNames[pzn] || '' }) }}/>{reviewAttempted && positionErrors[index].pzn ? <span className="sample-correction-field-error" id={`${errorId}-pzn-${index}`} role="alert">{positionErrors[index].pzn}</span> : null}</label>
        <span className="sample-correction-article">{previewProductNames[position.pzn] || 'Beispielartikel auswählen'}</span>
        <label>Charge<input value={position.charge} aria-invalid={reviewAttempted && !!positionErrors[index].charge} aria-describedby={reviewAttempted && positionErrors[index].charge ? `${errorId}-charge-${index}` : undefined} onChange={event => changePosition(index, { charge: event.target.value })}/>{reviewAttempted && positionErrors[index].charge ? <span className="sample-correction-field-error" id={`${errorId}-charge-${index}`} role="alert">{positionErrors[index].charge}</span> : null}</label>
        <label>Bestand in Packungen<input type="number" min="1" step="1" value={position.quantity || ''} aria-invalid={reviewAttempted && !!positionErrors[index].quantity} aria-describedby={reviewAttempted && positionErrors[index].quantity ? `${errorId}-quantity-${index}` : undefined} onChange={event => changePosition(index, { quantity: Number(event.target.value) })}/>{reviewAttempted && positionErrors[index].quantity ? <span className="sample-correction-field-error" id={`${errorId}-quantity-${index}`} role="alert">{positionErrors[index].quantity}</span> : null}</label>
      </div>)}
      <label className="sample-correction-comment">Erläuterung zur Korrektur<textarea rows={3} value={value.comment} onChange={event => change({ ...value, comment: event.target.value })} placeholder="Was haben Sie korrigiert?"/></label>
      <label className="sample-correction-contact">Ansprechpartner der Apotheke
        <select value={value.contactEmail} aria-invalid={reviewAttempted && !!contactError} aria-describedby={reviewAttempted && contactError ? `${errorId}-contact` : undefined} onChange={event => change({ ...value, contactEmail: event.target.value })}>
          <option value="">Bitte auswählen</option>
          {contacts.map(contact => <option key={contact.email} value={contact.email}>{contact.name}</option>)}
        </select>
        {reviewAttempted && contactError ? <span className="sample-correction-field-error" id={`${errorId}-contact`} role="alert">{contactError}</span> : null}
      </label>
      <div className="sample-correction-upload">
        <strong>Nachweis für Revision 2</strong>
        <EvidenceFiles files={value.evidenceFiles} onChange={files => change({ ...value, evidenceFiles: files })} onError={error => { setFileError(error); if (error) setReviewAttempted(true) }} error={evidenceError} errorId={`${errorId}-evidence`} showError={reviewAttempted} label="Nachweise zur Korrektur hinzufügen" browserOnly/>
      </div>
      <div className="sample-correction-declaration"><label className="check-field"><input type="checkbox" checked={value.declaration} aria-invalid={reviewAttempted && !!declarationError} aria-describedby={reviewAttempted && declarationError ? `${errorId}-declaration` : undefined} onChange={event => change({ ...value, declaration: event.target.checked })}/><span>Ich bestätige die Richtigkeit der korrigierten Angaben.</span></label>{reviewAttempted && declarationError ? <span className="sample-correction-field-error" id={`${errorId}-declaration`} role="alert">{declarationError}</span> : null}</div>
    </div>
    {reviewAttempted && !deadlineOpen ? <p className="sample-correction-field-error sample-correction-expired" role="alert">Die Korrekturfrist ist abgelaufen. Diese Revision kann nicht mehr eingereicht werden.</p> : null}
    {reviewing ? <div className="sample-correction-review" role="status"><strong>Korrektur bereit zur Einreichung</strong><p>{value.positions.length} Positionen · Ansprechpartner: {contacts.find(contact => contact.email === value.contactEmail)?.name} · Erläuterung: {value.comment.trim() || 'Angaben korrigiert'} · {value.evidenceFiles.length} Nachweise</p><div className="sample-correction-actions"><Button variant="secondary" onClick={() => setReviewing(false)}>Weiter bearbeiten</Button><Button disabled={!deadlineOpen} onClick={onSubmit}>Revision 2 erneut einreichen</Button></div></div> : <div className="sample-correction-actions"><Button onClick={review}>Angaben prüfen</Button></div>}
  </section>
}
