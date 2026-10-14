import { useState } from 'react'
import type { SamplePosition } from './sample-claim-data'
import { previewProductNames } from './PreviewClaimEditor'
import { Button, Notice } from './ui'
import './sample-correction-flow.css'

export type SampleCorrection = {
  phase: 'draft' | 'submitted'
  positions: SamplePosition[]
  comment: string
  declaration: boolean
  submittedAt?: string
}

export function SampleCorrectionFlow({
  original, value, onChange, onSubmit
}: {
  original: SamplePosition[]
  value: SampleCorrection
  onChange: (next: SampleCorrection) => void
  onSubmit: () => void
}) {
  const [reviewing, setReviewing] = useState(false)
  const [error, setError] = useState('')
  const change = (next: SampleCorrection) => { onChange(next); setReviewing(false); setError('') }
  const changePosition = (index: number, update: Partial<SamplePosition>) => {
    change({ ...value, positions: value.positions.map((position, current) => current === index ? { ...position, ...update } : position) })
  }
  const review = () => {
    if (value.positions.some(position => !previewProductNames[position.pzn] || !position.charge.trim() || !Number.isInteger(position.quantity) || position.quantity < 1)) {
      setError('Bitte prüfen Sie PZN, Charge und eine positive ganze Packungszahl für jede Position.')
      return
    }
    const changed = value.positions.some((position, index) => position.pzn !== original[index]?.pzn || position.charge !== original[index]?.charge || position.quantity !== original[index]?.quantity)
    if (!changed && !value.comment.trim()) {
      setError('Bitte korrigieren Sie eine Angabe oder erläutern Sie den Ablehnungsgrund.')
      return
    }
    if (!value.declaration) {
      setError('Bitte bestätigen Sie die Richtigkeit der korrigierten Angaben.')
      return
    }
    setError('')
    setReviewing(true)
  }

  return <section className="data-section sample-correction" aria-labelledby="sample-correction-title">
    <div className="section-header"><div><h2 id="sample-correction-title">Revision 2 korrigieren</h2><p>Die eingereichte Revision 1 bleibt unverändert im Verlauf.</p></div><span className="sample-correction-draft">Entwurf · Demo</span></div>
    <div className="sample-correction-fields">
      {value.positions.map((position, index) => <div className="sample-correction-position" key={index}>
        <strong>Position {index + 1}</strong>
        <label>PZN<input inputMode="numeric" maxLength={8} value={position.pzn} onChange={event => { const pzn = event.target.value.replace(/\D/g, '').slice(0, 8); changePosition(index, { pzn, article: previewProductNames[pzn] || '' }) }}/></label>
        <span className="sample-correction-article">{previewProductNames[position.pzn] || 'Beispielartikel auswählen'}</span>
        <label>Charge<input value={position.charge} onChange={event => changePosition(index, { charge: event.target.value })}/></label>
        <label>Bestand in Packungen<input type="number" min="1" step="1" value={position.quantity || ''} onChange={event => changePosition(index, { quantity: Number(event.target.value) })}/></label>
      </div>)}
      <label className="sample-correction-comment">Erläuterung zur Korrektur<textarea rows={3} value={value.comment} onChange={event => change({ ...value, comment: event.target.value })} placeholder="Was haben Sie korrigiert?"/></label>
      <p className="sample-correction-evidence">Aus den korrigierten Angaben wird für diese Vorschau ein neuer fiktiver PDF-Nachweis für Revision 2 erzeugt.</p>
      <label className="check-field"><input type="checkbox" checked={value.declaration} onChange={event => change({ ...value, declaration: event.target.checked })}/><span>Ich bestätige die Richtigkeit der korrigierten Angaben.</span></label>
    </div>
    {error ? <Notice tone="warning">{error}</Notice> : null}
    {reviewing ? <div className="sample-correction-review" role="status"><strong>Korrektur bereit zur Einreichung</strong><p>{value.positions.length} Positionen · Erläuterung: {value.comment.trim() || 'Angaben korrigiert'} · neuer fiktiver PDF-Nachweis</p><div className="sample-correction-actions"><Button variant="secondary" onClick={() => setReviewing(false)}>Weiter bearbeiten</Button><Button onClick={onSubmit}>Revision 2 erneut einreichen</Button></div></div> : <div className="sample-correction-actions"><Button onClick={review}>Angaben prüfen</Button></div>}
  </section>
}
