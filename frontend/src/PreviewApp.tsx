import { useState } from 'react'
import type { Role, Status, User } from './types'
import { statusLabel } from './types'
import { Button, Icon, Notice, PageTitle, Shell, StatusPill } from './ui'
import { PreviewLogin } from './PreviewLogin'
import { PreviewClaimAside, PreviewClaimEditor, previewProductNames } from './PreviewClaimEditor'
import { PreviewMembers } from './PreviewMembers'

// Ausschließlich fiktive, flüchtige Konzeptdaten. Dieser Einstiegspunkt importiert keine API.
export type PreviewMember = { name: string; email: string; admin: boolean; status: string }
export type PreviewItem = { id: number; pzn: string; charge: string; quantity: string }
export type PreviewClaim = { status: Status; items: PreviewItem[]; comment: string; contact: string; evidence: boolean; declaration: boolean; reason: string }
const initialClaim = (): PreviewClaim => ({ status: 'DRAFT', items: [], comment: '', contact: 'Julia Berger', evidence: false, declaration: false, reason: '' })
const initialMembers = (): PreviewMember[] => [
  { name: 'Julia Berger', email: 'apotheke@beispiel.test', admin: true, status: 'Aktiv' },
  { name: 'Maria Keller', email: 'mitarbeiterin@beispiel.test', admin: false, status: 'Aktiv' },
  { name: 'Tim Neumann', email: 'tim@beispiel-apotheke.test', admin: false, status: 'Einladung offen' }
]
const term = '30.09.2026'
type PreviewCredit = { claimNumber: string; reference: string; provided: string; description: string }
// Frei erfundene Datensätze für die öffentliche, statische Konzeptvorschau.
const sampleCredits: PreviewCredit[] = [
  { claimNumber: 'LV-DEMO-2026-014', reference: 'GS-DEMO-2026-014', provided: '18.09.2026', description: 'Muster-Gutschrift für eine abgeschlossene Lagerwertverlustmeldung.' },
  { claimNumber: 'LV-DEMO-2026-009', reference: 'GS-DEMO-2026-009', provided: '04.08.2026', description: 'Weiteres Muster für die Darstellung mehrerer Gutschriften.' }
]

export function PreviewApp() {
  const [signedIn, setSignedIn] = useState(false)
  const [profile, setProfile] = useState<{ name: string; email: string; organizationName: string } | null>(null)
  const [role, setRole] = useState<Role>('PHARMACY_ADMIN')
  const [page, setPage] = useState('dashboard')
  const [claim, setClaim] = useState<PreviewClaim>(initialClaim)
  const [members, setMembers] = useState<PreviewMember[]>(initialMembers)
  const [message, setMessage] = useState('')
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const [exported, setExported] = useState(false)
  const [registrationApproved, setRegistrationApproved] = useState(false)
  const [claimTab, setClaimTab] = useState('open')
  const [nextItemId, setNextItemId] = useState(1)
  const [selectedCredit, setSelectedCredit] = useState<PreviewCredit | null>(null)
  const pharmacy = role.startsWith('PHARMACY')
  const user: User = { id: 'preview', name: pharmacy && profile ? profile.name : role === 'PHARMACY_ADMIN' ? 'Julia Berger' : role === 'PHARMACY_STAFF' ? 'Maria Keller' : role === 'REVIEWER' ? 'Glenmark Prüfung' : 'Glenmark Finance', email: pharmacy && profile ? profile.email : role === 'PHARMACY_ADMIN' ? 'apotheke@beispiel.test' : role === 'PHARMACY_STAFF' ? 'mitarbeiterin@beispiel.test' : 'vorschau@beispiel.test', role, organizationId: pharmacy ? 'preview-pharmacy' : null, organizationName: pharmacy ? profile?.organizationName || 'Rosen-Apotheke am Markt' : null }
  const navigate = (target: string) => { setPage(target); setMessage(''); setConfirmSubmit(false) }
  const switchRole = (next: Role) => { setRole(next); navigate(next.startsWith('PHARMACY') ? 'dashboard' : next === 'REVIEWER' ? 'review' : 'finance') }
  const reset = () => { setClaim(initialClaim()); setNextItemId(1); setMembers(initialMembers()); setProfile(null); setExported(false); setRegistrationApproved(false); setSelectedCredit(null); switchRole('PHARMACY_ADMIN'); setSignedIn(false); setMessage('') }
  const updateClaim = (change: Partial<PreviewClaim>) => setClaim(current => ({ ...current, ...change }))
  const addItem = () => { setClaim(current => ({ ...current, items: [...current.items, { id: nextItemId, pzn: '', charge: '', quantity: '' }] })); setNextItemId(current => current + 1) }
  const updateItem = (id: number, change: Partial<PreviewItem>) => setClaim(current => ({ ...current, items: current.items.map(item => item.id === id ? { ...item, ...change } : item) }))
  const removeItem = (id: number) => setClaim(current => ({ ...current, items: current.items.filter(item => item.id !== id) }))
  const submit = () => {
    if (!claim.items.length || claim.items.some(item => !previewProductNames[item.pzn] || !item.charge.trim() || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1) || !claim.evidence || !claim.contact.trim() || !claim.declaration) {
      setMessage('Bitte geben Sie eine gültige Beispiel-PZN sowie Charge, Packungszahl, Beispielbeleg, Kontakt und Bestätigung an.')
      return
    }
    setConfirmSubmit(true)
  }
  const claimNumber = 'LV-2026-BEISPIEL-01'
  const credits = claim.status === 'COMPLETED' ? [{ claimNumber, reference: 'BEISPIEL-GS-01', provided: 'In dieser Sitzung', description: 'Aus dem simulierten Prüf- und Finance-Ablauf erzeugte Beispielgutschrift.' }, ...sampleCredits] : sampleCredits
  const checks = [
    { label: 'Positionen', done: claim.items.length > 0 && claim.items.every(item => previewProductNames[item.pzn] && item.charge.trim() && Number.isInteger(Number(item.quantity)) && Number(item.quantity) > 0) },
    { label: 'Nachweis', done: claim.evidence },
    { label: 'Kontakt', done: Boolean(claim.contact.trim()) },
    { label: 'Bestätigung', done: claim.declaration }
  ]
  const completedChecks = checks.filter(check => check.done).length
  const nextHint = !claim.items.length ? 'Fügen Sie die erste betroffene Position hinzu.' : !checks[0].done ? 'PZN, Charge und positive Packungszahl je Position ergänzen.' : !claim.evidence ? 'Jetzt einen Beispielnachweis ergänzen.' : !claim.declaration ? 'Angaben vor dem Einreichen prüfen.' : 'Bereit für Ihre Prüfung.'

  if (!signedIn) return <PreviewLogin onAuthenticated={(nextRole, newProfile) => { setProfile(newProfile || null); setMembers(newProfile ? [{ name: newProfile.name, email: newProfile.email, admin: true, status: 'Aktiv' }] : initialMembers()); switchRole(nextRole); setSignedIn(true) }}/>

  let content: React.ReactNode
  if (pharmacy && page === 'dashboard') content = <>
    <PageTitle title={'Guten Tag, ' + user.name} subtitle="Ihr Überblick über Senkungstermine und Meldungen." action={<Button icon="arrow" onClick={() => navigate('claims')}>Meldungen ansehen</Button>}/>
    <div className="preview-hero"><div className="preview-hero-icon"><Icon name="calendar" size={34}/></div><div><span className="small-overline">Offener Beispieltermin</span><h2>Preissenkung am {term}</h2><p>Erfassen Sie betroffene Packungen und reichen Sie die Meldung nach eigener Prüfung ein.</p></div><Button onClick={() => navigate('claim:preview')} icon="arrow">{claim.status === 'DRAFT' ? 'Meldung erfassen' : 'Vorgang ansehen'}</Button></div>
    <div className="preview-grid"><section className="preview-stat"><span>Aktueller Vorgang</span><strong><StatusPill status={claim.status}/></strong><small>{claimNumber}</small></section><section className="preview-stat"><span>Nächster Schritt</span><strong>{claim.status === 'DRAFT' ? 'Angaben vervollständigen' : claim.status === 'REJECTED' ? 'Neue Revision prüfen' : claim.status === 'MANUAL_REVIEW' ? 'Glenmark prüft' : claim.status === 'APPROVED' ? 'Abwicklung' : 'Gutschrift ansehen'}</strong><small>Der Assistent erklärt die nötigen Angaben.</small></section><section className="preview-stat"><span>Team</span><strong>{members.length} Personen</strong><small><button className="text-button" onClick={() => navigate('members')}>Zugänge verwalten →</button></small></section></div>
    <section className="data-section"><div className="section-header"><h2>So läuft die Meldung ab</h2></div><div className="preview-journey"><span>1 · Erfassen</span><span>2 · Prüfen</span><span>3 · Einreichen</span><span>4 · Glenmark Entscheidung</span><span>5 · Gutschrift</span></div></section>
  </>
  else if (pharmacy && page === 'claims') content = <>
    <PageTitle title="Meldungen" subtitle="Erfassen, verfolgen und bei Bedarf korrigieren Sie Ihre Vorgänge."/>
    <div className="tabs" role="tablist" aria-label="Meldungen filtern">{[['open','Jetzt einreichen'],['draft','Entwürfe'],['submitted','Eingereicht'],['done','Abgeschlossen']].map(([key,label]) => <button key={key} role="tab" aria-selected={claimTab === key} className={claimTab === key ? 'selected' : ''} onClick={() => setClaimTab(key)}>{label}</button>)}</div>
    {claimTab === 'open' ? <section className="preview-term-row"><span className="preview-term-icon"><Icon name="calendar"/></span><div><h2>{term}</h2><p>Glenmark · Beispieltermin für diese Konzeptvorschau</p></div><Button variant="secondary" onClick={() => navigate('claim:preview')}>{claim.status === 'DRAFT' ? 'Meldung erfassen' : 'Vorgang ansehen'}</Button></section> : (claimTab === 'draft' && claim.status === 'DRAFT') || (claimTab === 'submitted' && ['MANUAL_REVIEW','REJECTED','APPROVED'].includes(claim.status)) || (claimTab === 'done' && claim.status === 'COMPLETED') ? <section className="data-section"><div className="table-wrap"><table><thead><tr><th>Vorgang</th><th>Senkungstermin</th><th>Status</th><th>Aktion</th></tr></thead><tbody><tr><td>{claimNumber}</td><td>{term}</td><td><StatusPill status={claim.status}/></td><td><button className="text-button" onClick={() => navigate('claim:preview')}>Ansehen →</button></td></tr></tbody></table></div></section> : <section className="data-section preview-empty">Keine Beispielmeldung in dieser Ansicht.</section>}
  </>
  else if (pharmacy && page.startsWith('claim:')) content = <PreviewClaimEditor claim={claim} term={term} claimNumber={claimNumber} checks={checks} completedChecks={completedChecks} nextHint={nextHint} navigate={navigate} updateClaim={updateClaim} addItem={addItem} updateItem={updateItem} removeItem={removeItem} submit={submit} discard={() => { updateClaim(initialClaim()); navigate('claims'); setMessage('Beispielentwurf verworfen.') }} setMessage={setMessage}/>
  else if (pharmacy && page === 'members') content = <PreviewMembers members={members} setMembers={setMembers} currentEmail={user.email} canManage={role === 'PHARMACY_ADMIN'} setMessage={setMessage}/>
  else if (pharmacy && page === 'credits') content = <><PageTitle title="Gutschriften" subtitle="Bereitgestellte Dokumente an einem Ort."/><section className="data-section"><div className="section-header"><div><h2>Beispielgutschriften</h2><p>Frei erfundene Vorgänge für das Kundengespräch. Keine echten Dokumente oder Auszahlungen.</p></div><span className="preview-count">{credits.length} Beispiele</span></div><div className="table-wrap"><table><thead><tr><th>Vorgang</th><th>Gutschrift-Referenz</th><th>Bereitgestellt</th><th>Dokument</th></tr></thead><tbody>{credits.map(credit => <tr key={credit.reference}><td><strong>{credit.claimNumber}</strong></td><td>{credit.reference}</td><td>{credit.provided}</td><td><button className="text-button" onClick={() => setSelectedCredit(credit)}>Muster ansehen →</button></td></tr>)}</tbody></table></div></section></>
  else if (pharmacy) content = <><PageTitle title="Hilfe" subtitle="Die wichtigsten Fragen zur Meldung."/><div className="preview-grid"><section className="data-section"><h2>Welche Charge?</h2><p>Die Nummer wird frei von der Packung eingetragen. Sie muss vorhanden sein; es gibt keine Chargenvalidierung.</p></section><section className="data-section"><h2>Wann sehe ich Termine?</h2><p>Neue Senkungstermine werden nach dem Login im Portal angezeigt. Es gibt keine Terminankündigung per E-Mail.</p></section><section className="data-section"><h2>Kann ich korrigieren?</h2><p>Eine eingereichte Revision ist unveränderlich. Nach Ablehnung kann eine neue Revision angelegt werden, sofern die Frist offen ist.</p></section></div></>
  else if (role === 'REVIEWER' && page === 'review') content = <><PageTitle title="Arbeitsvorrat" subtitle="Beispielmeldungen zur fachlichen Prüfung."/><section className="data-section"><div className="section-header"><h2>{claimNumber}</h2><StatusPill status={claim.status}/></div><div className="preview-summary"><div><span>Apotheke</span><strong>Rosen-Apotheke am Markt</strong></div><div><span>Stichtag</span><strong>{term}</strong></div><div><span>Positionen</span><strong>{claim.status === 'DRAFT' ? 'Noch nicht eingereicht' : claim.items.length}</strong></div></div>{claim.status === 'MANUAL_REVIEW' ? <><p>{claim.items.length} Positionen · Die Charge wird fachlich nicht validiert.</p><div className="preview-actions"><Button variant="secondary" onClick={() => { updateClaim({ status: 'REJECTED', reason: 'Bitte den Bestandsnachweis erläutern (Beispielgrund).' }); setMessage('Ablehnung simuliert. Die Apotheke kann eine neue Revision erstellen.') }}>Mit Beispielgrund ablehnen</Button><Button onClick={() => { updateClaim({ status: 'APPROVED' }); setMessage('Freigabe simuliert. Finance kann nun den weiteren Ablauf ansehen.') }}>Freigabe simulieren</Button></div></> : <p className="muted">{claim.status === 'DRAFT' ? 'Die Beispielmeldung wurde noch nicht eingereicht.' : 'Für diese Beispielmeldung ist derzeit keine Prüfung offen.'}</p>}</section></>
  else if (role === 'REVIEWER' && page === 'registrations') content = <><PageTitle title="Registrierungen" subtitle="Betriebserlaubnis und Angaben vor Freigabe prüfen."/><section className="data-section"><div className="section-header"><h2>Stadt-Apotheke Nord (Beispiel)</h2><span className="preview-badge">{registrationApproved ? 'Freigegeben' : 'Wartet auf Prüfung'}</span></div><p>Ort: Beispielstadt · Antragsteller: Max Beispiel · Betriebserlaubnis: fiktives Beispieldokument</p>{!registrationApproved ? <Button onClick={() => { setRegistrationApproved(true); setMessage('Registrierung nur in der Vorschau freigegeben. Keine E-Mail versendet.') }}>Freigabe simulieren</Button> : null}</section></>
  else if (page === 'audit') content = <><PageTitle title="Audit" subtitle="Nachvollziehbarkeit von Entscheidungen und Revisionen."/><section className="data-section"><div className="preview-timeline"><div><strong>Registrierung</strong><p>{registrationApproved ? 'Beispielkonto freigegeben' : 'Beispielkonto wartet auf Prüfung'}</p></div><div><strong>Meldung</strong><p>{statusLabel[claim.status]} · {claimNumber}</p></div><div><strong>Export</strong><p>{exported ? 'Demo-CSV simuliert' : 'Noch kein Export simuliert'}</p></div></div></section></>
  else content = <><PageTitle title="Abwicklung" subtitle="Freigegebene Beispielmeldungen und Gutschriften."/><section className="data-section"><div className="section-header"><h2>{claimNumber}</h2><StatusPill status={claim.status}/></div><p>Die echte DATEV-Spezifikation und externe Gutschrift-Schnittstelle sind noch offen. Diese Ansicht zeigt nur den geplanten Ablauf.</p><div className="preview-actions"><Button variant="secondary" disabled={claim.status !== 'APPROVED' || exported} onClick={() => { setExported(true); setMessage('Demo-CSV-Export simuliert. Keine DATEV-Datei erzeugt.') }}>Demo-CSV-Export simulieren</Button><Button disabled={claim.status !== 'APPROVED' || !exported} onClick={() => { updateClaim({ status: 'COMPLETED' }); setMessage('Beispielgutschrift zugeordnet. Kein Dokument importiert.') }}>Gutschrift simulieren</Button></div></section></>

  return <Shell user={user} page={page} demo onNavigate={navigate} onLogout={reset} aside={pharmacy && page.startsWith('claim:') ? <PreviewClaimAside/> : undefined}>
    {message ? <Notice tone={message.startsWith('Bitte') || message.startsWith('Mindestens') || message.startsWith('Diese Adresse') ? 'warning' : 'info'}>{message}</Notice> : null}
    {content}
    <footer className="content-footer"><Icon name="shield" size={15}/> Öffentliche Konzeptvorschau mit fiktiven Daten.</footer>
    {selectedCredit ? <div className="modal-backdrop" role="presentation" onClick={() => setSelectedCredit(null)}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="preview-credit-title" onClick={event => event.stopPropagation()}><span className="small-overline">Fiktives Dokumentmuster</span><h2 id="preview-credit-title">Beispielgutschrift</h2><p>{selectedCredit.description}</p><div className="confirm-summary"><div><span>Vorgang</span><strong>{selectedCredit.claimNumber}</strong></div><div><span>Referenz</span><strong>{selectedCredit.reference}</strong></div><div><span>Bereitgestellt</span><strong>{selectedCredit.provided}</strong></div></div><p className="muted">Dies ist nur eine Vorschau. Ein PDF oder eine echte Gutschrift wird nicht bereitgestellt.</p><div className="modal-actions"><Button onClick={() => setSelectedCredit(null)}>Schließen</Button></div></div></div> : null}
    {confirmSubmit ? <div className="modal-backdrop"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="preview-confirm-title"><h2 id="preview-confirm-title">Beispielmeldung einreichen?</h2><p>In dieser Vorschau ändert sich nur der sichtbare Status im Browser. Eine echte Meldung wird nicht gespeichert oder versendet.</p><div className="confirm-summary"><div><span>Termin</span><strong>{term}</strong></div><div><span>Positionen</span><strong>{claim.items.length}</strong></div><div><span>Nachweis</span><strong>{claim.evidence ? 'Beispielbeleg' : 'Fehlt'}</strong></div></div><div className="modal-actions"><Button variant="secondary" onClick={() => setConfirmSubmit(false)}>Zurück</Button><Button onClick={() => { updateClaim({ status: 'MANUAL_REVIEW' }); setConfirmSubmit(false); setMessage('Beispielmeldung eingereicht. Wechseln Sie zur Glenmark-Prüfung, um den Ablauf fortzusetzen.') }}>Einreichung simulieren</Button></div></div></div> : null}
  </Shell>
}
