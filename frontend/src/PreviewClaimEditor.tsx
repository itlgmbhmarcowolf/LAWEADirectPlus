import { useEffect, useRef, useState } from 'react'
import type { PreviewClaim, PreviewItem } from './PreviewApp'
import { Button, Icon, PageTitle, StatusPill } from './ui'
import './preview-claim-editor.css'

type Props = {
  claim: PreviewClaim
  term: string
  claimNumber: string
  navigate: (page: string) => void
  updateClaim: (change: Partial<PreviewClaim>) => void
  addItem: () => void
  updateItem: (id: number, change: Partial<PreviewItem>) => void
  removeItem: (id: number) => void
  submit: () => void
  discard: () => void
  setMessage: (message: string) => void
}

export const previewProductNames: Record<string, string> = {
  '01234567': 'Beispielpräparat A',
  '07654321': 'Beispielpräparat B',
  '04812345': 'Beispielpräparat C'
}

export function PreviewClaimEditor({ claim, term, claimNumber, navigate, updateClaim, addItem, updateItem, removeItem, submit, discard, setMessage }: Props) {
  const editable = claim.status === 'DRAFT'
  const showPositionHelp = claim.items.some(item => !item.pzn || !item.charge.trim() || !item.quantity)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [evidenceUrl, setEvidenceUrl] = useState('')
  useEffect(() => {
    if (!claim.evidenceFile) { setEvidenceUrl(''); return }
    const url = URL.createObjectURL(claim.evidenceFile)
    setEvidenceUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [claim.evidenceFile])
  const chooseEvidence = (file?: File) => {
    if (!file) return
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024) { setMessage('Bitte wählen Sie eine PDF-, JPG- oder PNG-Datei mit höchstens 5 MB.'); return }
    updateClaim({ evidence: true, evidenceFile: file })
    setMessage('Nachweis nur für diese Browsersitzung übernommen.')
  }

  return <div className="preview-claim-editor">
    <button className="back-link" onClick={() => navigate('claims')}>← Zurück zu Meldungen</button>
    {editable ? <>
      <header className="preview-claim-heading"><h1>Meldung erfassen</h1><span>Stichtag {term} · Glenmark</span></header>

      <section className="editor-section preview-claim-section" aria-labelledby="preview-positions-title">
        <h2 id="preview-positions-title">Positionen</h2>
        {claim.items.length ? <div className="position-grid position-header"><span>PZN</span><span>Artikelbezeichnung</span><span>Charge</span><span>Bestand in Packungen</span><span></span></div> : null}
        {claim.items.map((item, index) => <div className="position-grid position-row" key={item.id}>
          <label><span className="mobile-label">PZN</span><input inputMode="numeric" maxLength={8} value={item.pzn} onChange={event => updateItem(item.id, { pzn: event.target.value.replace(/\D/g, '').slice(0, 8) })} placeholder="z. B. 01234567" aria-label={`PZN Position ${index + 1}`} aria-invalid={item.pzn.length === 8 && !previewProductNames[item.pzn]}/></label>
          <div className={`product-name ${item.pzn.length === 8 && !previewProductNames[item.pzn] ? 'preview-product-unknown' : ''}`}>{previewProductNames[item.pzn] || (item.pzn.length === 8 ? 'Kein Beispielartikel gefunden' : 'Artikel erscheint nach PZN-Eingabe')}</div>
          <label><span className="mobile-label">Charge</span><input value={item.charge} onChange={event => updateItem(item.id, { charge: event.target.value })} placeholder="Chargennummer" aria-label={`Charge Position ${index + 1}`}/></label>
          <label><span className="mobile-label">Bestand in Packungen</span><input type="number" min="1" step="1" value={item.quantity} onChange={event => updateItem(item.id, { quantity: event.target.value })} placeholder="0" aria-label={`Bestand Position ${index + 1}`}/></label>
          <button className="icon-button remove-item" aria-label={`Position ${index + 1} entfernen`} onClick={() => removeItem(item.id)}><Icon name="trash" size={18}/></button>
        </div>)}
        {showPositionHelp ? <p className="preview-position-help">PZN: 8 Ziffern (z. B. 01234567 oder 07654321) · Charge: Nummer von der Packung · Bestand: Packungen am Stichtag</p> : null}
        <button className="add-row" onClick={addItem}><Icon name="plus" size={18}/> Position hinzufügen</button>
      </section>

      <div className="preview-claim-details"><section className="editor-section preview-claim-section" aria-labelledby="preview-evidence-title">
        <h2 id="preview-evidence-title">Nachweis</h2>
        <input ref={fileInputRef} className="preview-hidden-file" type="file" accept=".pdf,.jpg,.jpeg,.png" tabIndex={-1} aria-label="Nachweisdatei auswählen" onChange={event => { chooseEvidence(event.target.files?.[0]); event.target.value = '' }}/>
        <button className="preview-evidence-zone" onClick={() => fileInputRef.current?.click()}><Icon name={claim.evidenceFile ? 'check' : 'upload'} size={25}/><strong>{claim.evidenceFile ? claim.evidenceFile.name : 'Nachweis auswählen'}</strong><small>PDF, JPG, PNG · bis 5 MB · nur im Browser</small></button>
        {claim.evidenceFile ? <button className="text-button" onClick={() => updateClaim({ evidence: false, evidenceFile: null })}>Nachweis entfernen</button> : null}
      </section>

      <section className="editor-section preview-claim-section" aria-labelledby="preview-comment-title">
        <label className="field"><span id="preview-comment-title">Kommentar (optional)</span><textarea rows={3} value={claim.comment} onChange={event => updateClaim({ comment: event.target.value })} placeholder="Falls Sie etwas ergänzen möchten"/></label>
        <label className="check-field"><input type="checkbox" checked={claim.declaration} onChange={event => updateClaim({ declaration: event.target.checked })}/><span>Ich bestätige die Richtigkeit der Angaben zum Bestand am Stichtag.</span></label>
      </section></div>

      <div className="editor-actions"><span><Icon name="clock" size={16}/> Nur im Browser · keine Speicherung</span><Button variant="quiet" onClick={() => setMessage('Dieser Entwurf bleibt nur bis zum Neuladen im Browser erhalten.')}>Entwurf speichern</Button><Button icon="arrow" onClick={submit}>Angaben prüfen</Button><button className="text-button danger-text" onClick={discard}>Entwurf verwerfen</button></div>
    </> : <>
      <PageTitle title="Meldung im Überblick" subtitle={`${claimNumber} · Senkungstermin ${term}`}/>
      <div className="term-summary"><div><span>Stichtag</span><strong>{term}</strong></div><div><span>Hersteller</span><strong>Glenmark</strong></div><div><span>Status</span><strong><StatusPill status={claim.status} label={claim.status === 'COMPLETED' ? 'Ausgezahlt · Demo' : claim.status === 'MANUAL_REVIEW' ? 'Eingereicht' : undefined}/></strong></div></div>
      <section className="data-section claim-overview"><div className="section-header"><h2>Aktueller Status</h2><StatusPill status={claim.status} label={claim.status === 'COMPLETED' ? 'Ausgezahlt · Demo' : claim.status === 'MANUAL_REVIEW' ? 'Eingereicht' : undefined}/></div><p>{claim.status === 'REJECTED' ? `Rückmeldung: ${claim.reason}` : claim.status === 'MANUAL_REVIEW' ? 'Die eingereichte Beispielversion ist gesperrt und liegt in der Glenmark-Prüfung.' : claim.status === 'APPROVED' ? 'Freigegeben. Als nächstes folgt die Abwicklung.' : 'Auszahlung nur als fiktiver Beispielstand dargestellt. Es wurde keine Zahlung ausgeführt.'}</p>{claim.status === 'REJECTED' ? <Button onClick={() => { updateClaim({ status: 'DRAFT', declaration: false }); setMessage('Neue Beispielrevision begonnen. Die vorherige Einreichung bleibt im echten Prozess erhalten.') }}>Neue Revision erstellen</Button> : null}{claim.status === 'COMPLETED' ? <div className="claim-credit-link"><div><strong>Gutschrift verfügbar</strong><span>BEISPIEL-GS-{claimNumber.slice(-2)} · direkt dieser Meldung zugeordnet</span></div><Button variant="secondary" icon="arrow" onClick={() => navigate(`credits:${claimNumber}`)}>Gutschrift ansehen</Button></div> : null}</section>
      <section className="data-section"><h2>Eingereichte Positionen</h2><div className="table-wrap"><table><thead><tr><th>PZN</th><th>Artikel</th><th>Charge</th><th>Bestand</th></tr></thead><tbody>{claim.items.map(item => <tr key={item.id}><td>{item.pzn}</td><td>{previewProductNames[item.pzn]}</td><td>{item.charge}</td><td>{item.quantity} Packungen</td></tr>)}</tbody></table></div></section>
      {claim.comment.trim() ? <section className="data-section"><h2>Kommentar</h2><p>{claim.comment}</p></section> : null}
      <section className="data-section"><h2>Nachweis</h2>{claim.evidenceFile ? <div className="document-list"><div><Icon name="file" size={18}/><span>{claim.evidenceFile.name}</span>{evidenceUrl ? <a className="text-button" href={evidenceUrl} download={claim.evidenceFile.name}>Herunterladen</a> : null}</div></div> : <p className="muted">Für diesen Beispielvorgang liegt keine echte Datei vor.</p>}</section>
    </>}
  </div>
}
