import { useState } from 'react'
import type { Role, Status, User } from './types'
import { statusLabel } from './types'
import { Button, Icon, Notice, PageTitle, Shell, StatusPill } from './ui'
import { PreviewLogin } from './PreviewLogin'
import { PreviewClaimEditor, previewProductNames } from './PreviewClaimEditor'
import { PreviewMembers } from './PreviewMembers'
import { PreviewSampleClaimDetail, sampleClaims } from './PreviewClaims'
import { PreviewCredits } from './PreviewCredits'
import { AccountSettings } from './AccountSettings'
import { PreviewDashboard } from './PreviewDashboard'
import './preview-terms.css'

// Ausschließlich fiktive, flüchtige Konzeptdaten. Dieser Einstiegspunkt importiert keine API.
export type PreviewMember = { name: string; email: string; admin: boolean; status: string }
export type PreviewItem = { id: number; pzn: string; charge: string; quantity: string }
export type PreviewClaim = { status: Status; items: PreviewItem[]; comment: string; evidence: boolean; evidenceFile: File | null; declaration: boolean; reason: string }
const initialClaim = (): PreviewClaim => ({ status: 'DRAFT', items: [], comment: '', evidence: false, evidenceFile: null, declaration: false, reason: '' })
const initialMembers = (): PreviewMember[] => [
  { name: 'Julia Berger', email: 'apotheke@beispiel.test', admin: true, status: 'Aktiv' },
  { name: 'Maria Keller', email: 'mitarbeiterin@beispiel.test', admin: false, status: 'Aktiv' },
  { name: 'Tim Neumann', email: 'tim@beispiel-apotheke.test', admin: false, status: 'Einladung offen' }
]
const openTerms = [
  { iso: '2026-10-01', date: '01.10.2026', number: 'LV-2026-BEISPIEL-01' },
  { iso: '2026-09-15', date: '15.09.2026', number: 'LV-2026-BEISPIEL-02' },
  { iso: '2026-07-15', date: '15.07.2026', number: 'LV-2026-BEISPIEL-03' },
  { iso: '2026-07-01', date: '01.07.2026', number: 'LV-2026-BEISPIEL-04' }
] as const
const initialClaims = (): Record<string, PreviewClaim> => ({
  ...Object.fromEntries(openTerms.map(term => [term.iso, initialClaim()])),
  // Fiktiver, nur im Browser vorhandener Entwurf für die Statusliste.
  '2026-07-15': { ...initialClaim(), items: [{ id: 1, pzn: '01234567', charge: 'BEISPIEL-CHARGE', quantity: '12' }] }
})
export type PreviewCredit = { claimNumber: string; reference: string; provided: string; description: string }
// Frei erfundene Datensätze für die öffentliche, statische Konzeptvorschau.
const sampleCredits: PreviewCredit[] = [...sampleClaims].filter(claim => claim.creditReference).sort((a, b) => b.termDate.localeCompare(a.termDate)).map(claim => ({ claimNumber: claim.number, reference: claim.creditReference!, provided: 'Demo', description: 'Fiktive Gutschrift zu einem älteren Beispielvorgang.' }))
const hasDraftData = (claim: PreviewClaim) => Boolean(claim.items.length || claim.comment.trim() || claim.evidence || claim.declaration)

export function PreviewApp() {
  const [signedIn, setSignedIn] = useState(false)
  const [profile, setProfile] = useState<{ name: string; email: string; organizationName: string } | null>(null)
  const [role, setRole] = useState<Role>('PHARMACY_ADMIN')
  const [signedInEmail, setSignedInEmail] = useState('apotheke@beispiel.test')
  const [viewAsEmail, setViewAsEmail] = useState<string | null>(null)
  const [page, setPage] = useState('dashboard')
  const [claims, setClaims] = useState<Record<string, PreviewClaim>>(initialClaims)
  const [activeTermIso, setActiveTermIso] = useState<string>(openTerms[0].iso)
  const [members, setMembers] = useState<PreviewMember[]>(initialMembers)
  const [message, setMessage] = useState('')
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const [exportedTerms, setExportedTerms] = useState<string[]>([])
  const [registrationApproved, setRegistrationApproved] = useState(false)
  const [nextItemId, setNextItemId] = useState(2)
  const [selectedCredit, setSelectedCredit] = useState<PreviewCredit | null>(null)
  const activeTerm = openTerms.find(term => term.iso === activeTermIso) || openTerms[0]
  const claim = claims[activeTerm.iso]
  const term = activeTerm.date
  const claimNumber = activeTerm.number
  const exported = exportedTerms.includes(activeTerm.iso)
  const effectiveRole: Role = viewAsEmail ? 'PHARMACY_STAFF' : role
  const pharmacy = effectiveRole.startsWith('PHARMACY')
  const signedInMember = members.find(member => member.email === signedInEmail)
  const viewedMember = viewAsEmail ? members.find(member => member.email === viewAsEmail) : undefined
  const identity = pharmacy ? viewedMember || signedInMember : undefined
  const user: User = { id: identity?.email || 'preview', name: identity?.name || (role === 'REVIEWER' ? 'Glenmark Prüfung' : 'Glenmark Finance'), email: identity?.email || 'vorschau@beispiel.test', role: effectiveRole, organizationId: pharmacy ? 'preview-pharmacy' : null, organizationName: pharmacy ? profile?.organizationName || 'Rosen-Apotheke am Markt' : null }
  const ownUser: User = { ...user, id: signedInEmail, name: signedInMember?.name || user.name, email: signedInEmail, role }
  const navigate = (target: string) => { const termIso = target.startsWith('claim:') ? target.slice(6) : ''; if (openTerms.some(term => term.iso === termIso)) setActiveTermIso(termIso); setPage(target); setMessage(''); setConfirmSubmit(false) }
  const switchRole = (next: Role) => { setViewAsEmail(null); setRole(next); navigate(next.startsWith('PHARMACY') ? 'dashboard' : next === 'REVIEWER' ? 'review' : 'finance') }
  const reset = () => { setClaims(initialClaims()); setActiveTermIso(openTerms[0].iso); setNextItemId(2); setMembers(initialMembers()); setProfile(null); setSignedInEmail('apotheke@beispiel.test'); setExportedTerms([]); setRegistrationApproved(false); setSelectedCredit(null); switchRole('PHARMACY_ADMIN'); setSignedIn(false); setMessage('') }
  const switchToMember = (email: string) => { if (role !== 'PHARMACY_ADMIN' || !members.some(member => member.email === email && !member.admin && member.status === 'Aktiv')) return; setViewAsEmail(email); navigate('dashboard') }
  const returnToAdmin = () => { setViewAsEmail(null); navigate('dashboard') }
  const saveOwnSettings = (name: string, email: string) => {
    if (viewAsEmail) throw new Error('Bitte zuerst zur Adminansicht zurückkehren.')
    if (members.some(member => member.email.toLowerCase() === email && member.email !== signedInEmail)) throw new Error('Diese E-Mail-Adresse gehört bereits zu einem Beispielzugang.')
    setMembers(current => current.map(member => member.email === signedInEmail ? { ...member, name, email } : member))
    setSignedInEmail(email)
    if (profile) setProfile({ ...profile, name, email })
  }
  const updateClaim = (change: Partial<PreviewClaim>) => setClaims(current => ({ ...current, [activeTerm.iso]: { ...current[activeTerm.iso], ...change } }))
  const addItem = () => { setClaims(current => ({ ...current, [activeTerm.iso]: { ...current[activeTerm.iso], items: [...current[activeTerm.iso].items, { id: nextItemId, pzn: '', charge: '', quantity: '' }] } })); setNextItemId(current => current + 1) }
  const updateItem = (id: number, change: Partial<PreviewItem>) => setClaims(current => ({ ...current, [activeTerm.iso]: { ...current[activeTerm.iso], items: current[activeTerm.iso].items.map(item => item.id === id ? { ...item, ...change } : item) } }))
  const removeItem = (id: number) => setClaims(current => ({ ...current, [activeTerm.iso]: { ...current[activeTerm.iso], items: current[activeTerm.iso].items.filter(item => item.id !== id) } }))
  const submit = () => {
    if (!claim.items.length || claim.items.some(item => !previewProductNames[item.pzn] || !item.charge.trim() || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1) || !claim.evidence || !claim.declaration) {
      setMessage('Bitte ergänzen Sie PZN, Charge, Packungszahl und Beispielbeleg und bestätigen Sie Ihre Angaben.')
      return
    }
    setConfirmSubmit(true)
  }
  const credits = [...openTerms.filter(term => claims[term.iso].status === 'COMPLETED').map(term => ({ claimNumber: term.number, reference: `BEISPIEL-GS-${term.number.slice(-2)}`, provided: 'In dieser Sitzung', description: 'Aus dem simulierten Prüf- und Finance-Ablauf erzeugte Beispielgutschrift.' })), ...sampleCredits]
  const dashboardTerms = [
    ...openTerms.map(term => ({ iso: term.iso, date: term.date, status: claims[term.iso].status === 'DRAFT' && !hasDraftData(claims[term.iso]) ? null : claims[term.iso].status, target: `claim:${term.iso}` })),
    ...sampleClaims.map(item => ({ iso: item.termDate, date: new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${item.termDate}T12:00:00Z`)), status: item.status, target: `sample:${item.number}` }))
  ]
  if (!signedIn) return <PreviewLogin onAuthenticated={(nextRole, newProfile) => { setProfile(newProfile || null); setMembers(newProfile ? [{ name: newProfile.name, email: newProfile.email, admin: true, status: 'Aktiv' }] : initialMembers()); setSignedInEmail(newProfile?.email || (nextRole === 'PHARMACY_STAFF' ? 'mitarbeiterin@beispiel.test' : 'apotheke@beispiel.test')); switchRole(nextRole); setSignedIn(true) }}/>

  let content: React.ReactNode
  if (page === 'account') content = <AccountSettings key={ownUser.email} user={ownUser} onSave={saveOwnSettings} onChangePassword={() => {}} emailEditable preview viewingAs={viewedMember?.name} onReturn={returnToAdmin}/>
  else if (pharmacy && (page === 'dashboard' || page === 'claims')) content = <PreviewDashboard terms={dashboardTerms} navigate={navigate}/>
  else if (pharmacy && page.startsWith('claim:')) content = <PreviewClaimEditor claim={claim} term={term} claimNumber={claimNumber} navigate={navigate} updateClaim={updateClaim} addItem={addItem} updateItem={updateItem} removeItem={removeItem} submit={submit} discard={() => { updateClaim(initialClaim()); navigate('dashboard'); setMessage('Beispielentwurf verworfen.') }} setMessage={setMessage}/>
  else if (pharmacy && page.startsWith('sample:')) { const sample = sampleClaims.find(item => item.number === page.slice(7)); content = sample ? <PreviewSampleClaimDetail claim={sample} navigate={navigate}/> : <Notice tone="warning">Beispielmeldung nicht gefunden.</Notice> }
  else if (pharmacy && page === 'members') content = <PreviewMembers members={members} setMembers={setMembers} currentEmail={user.email} canManage={effectiveRole === 'PHARMACY_ADMIN'} setMessage={setMessage}/>
  else if (pharmacy && (page === 'credits' || page.startsWith('credits:'))) content = <PreviewCredits credits={credits} selectedClaimNumber={page.startsWith('credits:') ? page.slice(8) : undefined} currentClaims={openTerms.map(term => ({ number: term.number, termDate: term.iso }))} navigate={navigate} onShowDocument={setSelectedCredit}/>
  else if (pharmacy) content = <><PageTitle title="Hilfe" subtitle="Die wichtigsten Fragen zur Meldung."/><div className="preview-grid"><section className="data-section"><h2>Welche Charge?</h2><p>Die Nummer wird frei von der Packung eingetragen. Sie muss vorhanden sein; es gibt keine Chargenvalidierung.</p></section><section className="data-section"><h2>Wann sehe ich Termine?</h2><p>Neue Senkungstermine werden nach dem Login im Portal angezeigt. Es gibt keine Terminankündigung per E-Mail.</p></section><section className="data-section"><h2>Kann ich korrigieren?</h2><p>Eine eingereichte Revision ist unveränderlich. Nach Ablehnung kann eine neue Revision angelegt werden, sofern die Frist offen ist.</p></section></div></>
  else if (role === 'REVIEWER' && page === 'review') content = <><PageTitle title="Arbeitsvorrat" subtitle="Beispielmeldungen zur fachlichen Prüfung."/><section className="data-section"><div className="section-header"><h2>{claimNumber}</h2><StatusPill status={claim.status}/></div><div className="preview-summary"><div><span>Apotheke</span><strong>Rosen-Apotheke am Markt</strong></div><div><span>Stichtag</span><strong>{term}</strong></div><div><span>Positionen</span><strong>{claim.status === 'DRAFT' ? 'Noch nicht eingereicht' : claim.items.length}</strong></div></div>{claim.status === 'MANUAL_REVIEW' ? <><p>{claim.items.length} Positionen · Die Charge wird fachlich nicht validiert.</p><div className="preview-actions"><Button variant="secondary" onClick={() => { updateClaim({ status: 'REJECTED', reason: 'Bitte den Bestandsnachweis erläutern (Beispielgrund).' }); setMessage('Ablehnung simuliert. Die Apotheke kann eine neue Revision erstellen.') }}>Mit Beispielgrund ablehnen</Button><Button onClick={() => { updateClaim({ status: 'APPROVED' }); setMessage('Freigabe simuliert. Finance kann nun den weiteren Ablauf ansehen.') }}>Freigabe simulieren</Button></div></> : <p className="muted">{claim.status === 'DRAFT' ? 'Die Beispielmeldung wurde noch nicht eingereicht.' : 'Für diese Beispielmeldung ist derzeit keine Prüfung offen.'}</p>}</section></>
  else if (role === 'REVIEWER' && page === 'registrations') content = <><PageTitle title="Registrierungen" subtitle="Betriebserlaubnis und Angaben vor Freigabe prüfen."/><section className="data-section"><div className="section-header"><h2>Stadt-Apotheke Nord (Beispiel)</h2><span className="preview-badge">{registrationApproved ? 'Freigegeben' : 'Wartet auf Prüfung'}</span></div><p>Ort: Beispielstadt · Antragsteller: Max Beispiel · Betriebserlaubnis: fiktives Beispieldokument</p>{!registrationApproved ? <Button onClick={() => { setRegistrationApproved(true); setMessage('Registrierung nur in der Vorschau freigegeben. Keine E-Mail versendet.') }}>Freigabe simulieren</Button> : null}</section></>
  else if (page === 'audit') content = <><PageTitle title="Audit" subtitle="Nachvollziehbarkeit von Entscheidungen und Revisionen."/><section className="data-section"><div className="preview-timeline"><div><strong>Registrierung</strong><p>{registrationApproved ? 'Beispielkonto freigegeben' : 'Beispielkonto wartet auf Prüfung'}</p></div><div><strong>Meldung</strong><p>{statusLabel[claim.status]} · {claimNumber}</p></div><div><strong>Export</strong><p>{exported ? 'Demo-CSV simuliert' : 'Noch kein Export simuliert'}</p></div></div></section></>
  else content = <><PageTitle title="Abwicklung" subtitle="Freigegebene Beispielmeldungen und Gutschriften."/><section className="data-section"><div className="section-header"><h2>{claimNumber}</h2><StatusPill status={claim.status}/></div><p>Die echte DATEV-Spezifikation und externe Gutschrift-Schnittstelle sind noch offen. Diese Ansicht zeigt nur den geplanten Ablauf.</p><div className="preview-actions"><Button variant="secondary" disabled={claim.status !== 'APPROVED' || exported} onClick={() => { setExportedTerms(current => [...current, activeTerm.iso]); setMessage('Demo-CSV-Export simuliert. Keine DATEV-Datei erzeugt.') }}>Demo-CSV-Export simulieren</Button><Button disabled={claim.status !== 'APPROVED' || !exported} onClick={() => { updateClaim({ status: 'COMPLETED' }); setMessage('Beispielgutschrift zugeordnet. Kein Dokument importiert.') }}>Gutschrift simulieren</Button></div></section></>

  return <Shell user={user} page={page} demo onNavigate={navigate} onLogout={reset} account={{ onSettings: () => navigate('account'), onMembers: pharmacy && role === 'PHARMACY_ADMIN' ? () => navigate('members') : undefined, switchable: role === 'PHARMACY_ADMIN' && !viewAsEmail ? members.filter(member => !member.admin && member.status === 'Aktiv').map(member => ({ id: member.email, name: member.name, email: member.email })) : [], onSwitch: switchToMember, viewingAs: viewedMember?.name, onReturn: returnToAdmin }}>
    {message ? <Notice tone={message.startsWith('Bitte') || message.startsWith('Mindestens') || message.startsWith('Diese Adresse') ? 'warning' : 'info'}>{message}</Notice> : null}
    {content}
    <footer className="content-footer"><Icon name="shield" size={15}/> Öffentliche Konzeptvorschau mit fiktiven Daten.</footer>
    {selectedCredit ? <div className="modal-backdrop" role="presentation" onClick={() => setSelectedCredit(null)}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="preview-credit-title" onClick={event => event.stopPropagation()}><span className="small-overline">Fiktives Dokumentmuster</span><h2 id="preview-credit-title">Beispielgutschrift</h2><p>{selectedCredit.description}</p><div className="confirm-summary"><div><span>Vorgang</span><strong>{selectedCredit.claimNumber}</strong></div><div><span>Referenz</span><strong>{selectedCredit.reference}</strong></div><div><span>Bereitgestellt</span><strong>{selectedCredit.provided}</strong></div></div><p className="muted">Dies ist nur eine Vorschau. Ein PDF oder eine echte Gutschrift wird nicht bereitgestellt.</p><div className="modal-actions"><Button onClick={() => setSelectedCredit(null)}>Schließen</Button></div></div></div> : null}
    {confirmSubmit ? <div className="modal-backdrop"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="preview-confirm-title"><h2 id="preview-confirm-title">Beispielmeldung einreichen?</h2><p>In dieser Vorschau ändert sich nur der sichtbare Status im Browser. Eine echte Meldung wird nicht gespeichert oder versendet.</p><div className="confirm-summary"><div><span>Termin</span><strong>{term}</strong></div><div><span>Positionen</span><strong>{claim.items.length}</strong></div><div><span>Nachweis</span><strong>{claim.evidence ? 'Beispielbeleg' : 'Fehlt'}</strong></div></div><div className="modal-actions"><Button variant="secondary" onClick={() => setConfirmSubmit(false)}>Zurück</Button><Button onClick={() => { updateClaim({ status: 'MANUAL_REVIEW' }); navigate('dashboard'); setMessage('Beispielmeldung eingereicht. Sie sehen den Status jetzt in der Übersicht.'); requestAnimationFrame(() => window.scrollTo(0, 0)) }}>Einreichung simulieren</Button></div></div></div> : null}
  </Shell>
}
