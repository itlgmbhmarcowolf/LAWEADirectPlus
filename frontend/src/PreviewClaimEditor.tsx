import type { PreviewClaim, PreviewItem } from './PreviewApp'
import { Button, Icon, PageTitle, StatusPill } from './ui'

type Check = { label: string; done: boolean }
type Props = {
  claim: PreviewClaim
  term: string
  claimNumber: string
  checks: Check[]
  completedChecks: number
  nextHint: string
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
  '07654321': 'Beispielpräparat B'
}

export function PreviewClaimAside() {
  return <div className="assistant-stack">
    <div className="assistant-heading"><Icon name="help"/><h2>Ihr Assistent</h2></div>
    <section className="assist-card"><h3>Schritt für Schritt</h3><p>Erfassen Sie alle betroffenen PZN mit Charge und Bestand in Packungen. Ergänzen Sie mindestens einen Beispielnachweis und prüfen Sie Ihre Angaben.</p></section>
    <section className="assist-card"><h3>Was noch wichtig ist</h3><ul className="assist-list"><li><Icon name="check" size={16}/> PZN und Charge prüfen</li><li><Icon name="upload" size={16}/> Beispielnachweis ergänzen</li><li><Icon name="users" size={16}/> Ansprechpartner angeben</li></ul></section>
    <section className="assist-card"><h3>Nach dem Einreichen</h3><p>Die eingereichte Beispielversion wird gesperrt. Glenmark prüft die Meldung. Bei einer Ablehnung können Sie eine neue Revision ausprobieren.</p></section>
  </div>
}

export function PreviewClaimEditor({ claim, term, claimNumber, checks, completedChecks, nextHint, navigate, updateClaim, addItem, updateItem, removeItem, submit, discard, setMessage }: Props) {
  const editable = claim.status === 'DRAFT'
  return <>
    <button className="back-link" onClick={() => navigate('claims')}>← Zurück zu Meldungen</button>
    <PageTitle title={editable ? 'Meldung erfassen' : 'Meldung im Überblick'} subtitle={editable ? 'Erfassen Sie die betroffenen Artikel und reichen Sie die Meldung anschließend ein.' : `${claimNumber} · Senkungstermin ${term}`}/>
    <div className="term-summary"><div><span>Stichtag</span><strong>{term}</strong></div><div><span>Meldezeitraum</span><strong>Beispieltermin</strong></div><div><span>Hersteller</span><strong>Glenmark</strong></div></div>
    {editable ? <>
      <div className="steps" aria-label="Schritte zur Meldung"><span className="current"><b>1</b>Positionen</span><span><b>2</b>Nachweise</span><span><b>3</b>Prüfen</span><span><b>4</b>Einreichen</span></div>
      <section className="live-assistant" aria-label="Prüfassistent"><div className="live-assistant-top"><div><span className="small-overline">Ihr Prüfassistent</span><h2>{nextHint}</h2><p>Die Hinweise passen sich Ihren Angaben an. Die Charge wird nicht fachlich validiert.</p></div><strong>{completedChecks} / {checks.length}</strong></div><div className="live-progress" role="progressbar" aria-label="Vollständigkeit der Meldung" aria-valuemin={0} aria-valuemax={checks.length} aria-valuenow={completedChecks}><span style={{ width: `${completedChecks / checks.length * 100}%` }}/></div><div className="live-checks" aria-live="polite">{checks.map(check => <span key={check.label} className={check.done ? 'done' : ''}><Icon name={check.done ? 'check' : 'clock'} size={15}/>{check.label}</span>)}</div></section>
      <section className="editor-section"><div className="section-header"><div><h2>Positionen</h2><p>Geben Sie die PZN selbst ein. Für diese fiktive Vorschau können Sie 01234567 oder 07654321 ausprobieren. Die Chargennummer wird frei eingetragen.</p></div></div><div className="position-grid position-header"><span>PZN</span><span>Artikelbezeichnung</span><span>Charge</span><span>Bestand in Packungen</span><span></span></div>
        {claim.items.map((item, index) => <div className="position-grid position-row" key={item.id}><label><span className="mobile-label">PZN</span><input inputMode="numeric" maxLength={8} value={item.pzn} onChange={event => updateItem(item.id, { pzn: event.target.value.replace(/\D/g, '').slice(0, 8) })} placeholder="8-stellige PZN eingeben" aria-label={`PZN Position ${index + 1}`} aria-invalid={item.pzn.length === 8 && !previewProductNames[item.pzn]}/></label><div className={`product-name ${item.pzn.length === 8 && !previewProductNames[item.pzn] ? 'preview-product-unknown' : ''}`}>{previewProductNames[item.pzn] || (item.pzn.length === 8 ? 'Kein Beispielartikel gefunden' : 'Artikel erscheint nach PZN-Eingabe')}</div><label><span className="mobile-label">Charge</span><input value={item.charge} onChange={event => updateItem(item.id, { charge: event.target.value })} placeholder="Chargennummer eingeben" aria-label={`Charge Position ${index + 1}`}/></label><label><span className="mobile-label">Bestand in Packungen</span><input type="number" min="1" step="1" value={item.quantity} onChange={event => updateItem(item.id, { quantity: event.target.value })} placeholder="0" aria-label={`Bestand Position ${index + 1}`}/></label><button className="icon-button remove-item" aria-label={`Position ${index + 1} entfernen`} onClick={() => removeItem(item.id)}><Icon name="trash" size={18}/></button></div>)}
        <button className="add-row" onClick={addItem}><Icon name="plus" size={18}/> Position hinzufügen</button>
      </section>
      <section className="editor-section"><h2>Nachweise</h2><p>In der öffentlichen Vorschau kann ein fiktiver Beleg ergänzt werden. Es wird keine Datei übertragen.</p><button className="preview-evidence-zone" onClick={() => updateClaim({ evidence: !claim.evidence })}><Icon name={claim.evidence ? 'check' : 'upload'} size={25}/><strong>{claim.evidence ? 'Beispielbeleg hinzugefügt' : 'Beispielbeleg hinzufügen'}</strong><small>{claim.evidence ? 'Erneut klicken, um ihn zu entfernen' : 'Kein Dateiupload in dieser Vorschau'}</small></button></section>
      <section className="editor-section"><div className="form-grid"><label className="field"><span>Ansprechpartner *</span><input value={claim.contact} onChange={event => updateClaim({ contact: event.target.value })}/></label><label className="field"><span>Kommentar (optional)</span><textarea rows={2} value={claim.comment} onChange={event => updateClaim({ comment: event.target.value })} placeholder="Besondere Hinweise zur Beispielmeldung"/></label></div><label className="check-field"><input type="checkbox" checked={claim.declaration} onChange={event => updateClaim({ declaration: event.target.checked })}/><span>Ich bestätige, dass die Beispielangaben zum Bestand am Stichtag richtig und vollständig sind.</span></label></section>
      <div className="editor-actions"><span><Icon name="clock" size={16}/> Nur im Browser · keine Speicherung</span><Button variant="quiet" onClick={() => setMessage('Dieser Entwurf bleibt nur bis zum Neuladen im Browser erhalten.')}>Entwurf speichern</Button><Button icon="arrow" onClick={submit}>Angaben prüfen</Button><button className="text-button danger-text" onClick={discard}>Entwurf verwerfen</button></div>
    </> : <>
      <section className="data-section claim-overview"><div className="section-header"><h2>Aktueller Status</h2><StatusPill status={claim.status}/></div><p>{claim.status === 'REJECTED' ? `Rückmeldung: ${claim.reason}` : claim.status === 'MANUAL_REVIEW' ? 'Die eingereichte Beispielversion ist gesperrt und liegt in der Glenmark-Prüfung.' : claim.status === 'APPROVED' ? 'Freigegeben. Als nächstes folgt die Abwicklung.' : 'Eine Beispielgutschrift ist verfügbar.'}</p>{claim.status === 'REJECTED' ? <Button onClick={() => { updateClaim({ status: 'DRAFT', declaration: false }); setMessage('Neue Beispielrevision begonnen. Die vorherige Einreichung bleibt im echten Prozess erhalten.') }}>Neue Revision erstellen</Button> : null}{claim.status === 'COMPLETED' ? <div className="claim-credit-link"><div><strong>Gutschrift verfügbar</strong><span>BEISPIEL-GS-01 · direkt dieser Meldung zugeordnet</span></div><Button variant="secondary" icon="arrow" onClick={() => navigate(`credits:${claimNumber}`)}>Gutschrift ansehen</Button></div> : null}</section>
      <section className="data-section"><h2>Eingereichte Positionen</h2><div className="table-wrap"><table><thead><tr><th>PZN</th><th>Artikel</th><th>Charge</th><th>Bestand</th><th>Nachweis</th></tr></thead><tbody>{claim.items.map(item => <tr key={item.id}><td>{item.pzn}</td><td>{previewProductNames[item.pzn]}</td><td>{item.charge}</td><td>{item.quantity} Packungen</td><td>{claim.evidence ? 'Beispielbeleg' : '–'}</td></tr>)}</tbody></table></div></section>
    </>}
  </>
}
