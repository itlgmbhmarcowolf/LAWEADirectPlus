import { useRef, useState } from 'react'
import type { SamplePosition } from './sample-claim-data'
import { previewProductNames } from './PreviewClaimEditor'
import { Button, Icon } from './ui'
import './sample-correction-flow.css'

export type SampleCorrection = {
  phase: 'draft' | 'submitted'
  positions: SamplePosition[]
  comment: string
  contactEmail: string
  declaration: boolean
  evidenceFile: File | null
  submittedAt?: string
}

export function SampleCorrectionFlow({
  value, contacts, deadline, deadlineOpen, onChange, onSubmit
}: {
  value: SampleCorrection
  contacts: { name: string; email: string }[]
  deadline: string
  deadlineOpen: boolean
  onChange: (next: SampleCorrection) => void
  onSubmit: () => void
}) {
  const [reviewing, setReviewing] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const change = (next: SampleCorrection) => { onChange(next); setReviewing(false); setErrors([]) }
  const changePosition = (index: number, update: Partial<SamplePosition>) => {
    change({ ...value, positions: value.positions.map((position, current) => current === index ? { ...position, ...update } : position) })
  }
  const review = () => {
    const missing: string[] = []
    if (!deadlineOpen) missing.push('Die Korrekturfrist ist abgelaufen. Diese Revision kann nicht mehr eingereicht werden.')
    value.positions.forEach((position, index) => {
      const prefix = `Position ${index + 1}`
      if (!position.pzn) missing.push(`${prefix}: PZN eintragen.`)
      else if (!previewProductNames[position.pzn]) missing.push(`${prefix}: gültige PZN auswählen.`)
      if (!position.charge.trim()) missing.push(`${prefix}: Charge eintragen.`)
      if (!Number.isInteger(position.quantity) || position.quantity < 1) missing.push(`${prefix}: Bestand als ganze Packungszahl größer null eintragen.`)
    })
    if (!contacts.some(contact => contact.email === value.contactEmail)) missing.push('Aktiven Ansprechpartner der Apotheke auswählen.')
    if (!value.evidenceFile) missing.push('Nachweis für Revision 2 hochladen.')
    if (!value.declaration) missing.push('Richtigkeit der korrigierten Angaben bestätigen.')
    setErrors(missing)
    if (missing.length) return
    setReviewing(true)
  }

  return <section className="data-section sample-correction" aria-labelledby="sample-correction-title">
    <div className="section-header"><div><h2 id="sample-correction-title">Revision 2 korrigieren</h2><p>Die eingereichte Revision 1 bleibt unverändert im Verlauf.</p></div></div>
    <p className="sample-correction-deadline">{deadlineOpen ? 'Korrektur erneut einreichen bis' : 'Korrekturfrist abgelaufen am'} <strong>{deadline}</strong></p>
    <div className="sample-correction-fields">
      {value.positions.map((position, index) => <div className="sample-correction-position" key={index}>
        <strong>Position {index + 1}</strong>
        <label>PZN<input inputMode="numeric" maxLength={8} value={position.pzn} onChange={event => { const pzn = event.target.value.replace(/\D/g, '').slice(0, 8); changePosition(index, { pzn, article: previewProductNames[pzn] || '' }) }}/></label>
        <span className="sample-correction-article">{previewProductNames[position.pzn] || 'Beispielartikel auswählen'}</span>
        <label>Charge<input value={position.charge} onChange={event => changePosition(index, { charge: event.target.value })}/></label>
        <label>Bestand in Packungen<input type="number" min="1" step="1" value={position.quantity || ''} onChange={event => changePosition(index, { quantity: Number(event.target.value) })}/></label>
      </div>)}
      <label className="sample-correction-comment">Erläuterung zur Korrektur<textarea rows={3} value={value.comment} onChange={event => change({ ...value, comment: event.target.value })} placeholder="Was haben Sie korrigiert?"/></label>
      <label className="sample-correction-contact">Ansprechpartner der Apotheke
        <select value={value.contactEmail} onChange={event => change({ ...value, contactEmail: event.target.value })}>
          <option value="">Bitte auswählen</option>
          {contacts.map(contact => <option key={contact.email} value={contact.email}>{contact.name}</option>)}
        </select>
      </label>
      <div className="sample-correction-upload">
        <strong>Nachweis für Revision 2</strong>
        <input ref={fileInputRef} className="preview-hidden-file" type="file" accept=".pdf,.jpg,.jpeg,.png" tabIndex={-1} aria-label="Nachweis für Revision 2 auswählen" onChange={event => {
          const file = event.target.files?.[0]
          if (!file) return
          if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024) {
            setErrors(['Nachweis: PDF-, JPG- oder PNG-Datei mit höchstens 5 MB auswählen.'])
            event.target.value = ''
            return
          }
          change({ ...value, evidenceFile: file })
          event.target.value = ''
        }}/>
        <button type="button" className="preview-evidence-zone" onClick={() => fileInputRef.current?.click()}><Icon name={value.evidenceFile ? 'check' : 'upload'} size={25}/><strong>{value.evidenceFile ? value.evidenceFile.name : 'Nachweis hochladen'}</strong><small>PDF, JPG, PNG · maximal 5 MB</small></button>
        {value.evidenceFile ? <button type="button" className="text-button sample-correction-remove-file" onClick={() => change({ ...value, evidenceFile: null })}>Nachweis entfernen</button> : null}
      </div>
      <label className="check-field"><input type="checkbox" checked={value.declaration} onChange={event => change({ ...value, declaration: event.target.checked })}/><span>Ich bestätige die Richtigkeit der korrigierten Angaben.</span></label>
    </div>
    {errors.length ? <div className="sample-correction-issues" role="alert"><strong>Bitte vor dem Einreichen ergänzen:</strong><ul>{errors.map(issue => <li key={issue}>{issue}</li>)}</ul></div> : null}
    {reviewing ? <div className="sample-correction-review" role="status"><strong>Korrektur bereit zur Einreichung</strong><p>{value.positions.length} Positionen · Ansprechpartner: {contacts.find(contact => contact.email === value.contactEmail)?.name} · Erläuterung: {value.comment.trim() || 'Angaben korrigiert'} · Nachweis: {value.evidenceFile?.name}</p><div className="sample-correction-actions"><Button variant="secondary" onClick={() => setReviewing(false)}>Weiter bearbeiten</Button><Button disabled={!deadlineOpen} onClick={onSubmit}>Revision 2 erneut einreichen</Button></div></div> : <div className="sample-correction-actions"><Button onClick={review}>Angaben prüfen</Button></div>}
  </section>
}
