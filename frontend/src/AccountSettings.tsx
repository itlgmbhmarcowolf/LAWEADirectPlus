import { useState, type FormEvent } from 'react'
import type { User } from './types'
import { Button, Icon, Notice, PageTitle } from './ui'

export function AccountSettings({ user, onSave, emailEditable, preview, viewingAs, onReturn }: { user: User; onSave: (name: string, email: string) => Promise<void> | void; emailEditable: boolean; preview: boolean; viewingAs?: string; onReturn?: () => void }) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(''); setNotice('')
    if (!name.trim()) { setError('Bitte geben Sie Ihren Namen ein.'); return }
    if (emailEditable && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Bitte geben Sie eine gültige E-Mail-Adresse ein.'); return }
    setBusy(true)
    try { await onSave(name.trim(), email.trim().toLowerCase()); setNotice(preview ? 'Ihre Beispielangaben wurden für diese Browsersitzung übernommen.' : 'Ihr Anzeigename wurde gespeichert.') }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Speichern fehlgeschlagen.') }
    finally { setBusy(false) }
  }
  const initials = user.name.split(/\s+/).filter(Boolean).map(part => part[0]).slice(0, 2).join('').toUpperCase()
  return <div className="account-settings"><PageTitle title="Kontoeinstellungen" subtitle="Ihre Angaben und Ihr Zugang auf einen Blick."/>
    {error ? <Notice tone="error">{error}</Notice> : null}{notice ? <Notice tone="success">{notice}</Notice> : null}
    {viewingAs ? <Notice tone="warning">Sie betrachten gerade die Mitarbeiteransicht von {viewingAs}. Wechseln Sie zur Adminansicht zurück, um Ihre eigenen Angaben zu ändern. {onReturn ? <button className="text-button" onClick={onReturn}>Zur Adminansicht →</button> : null}</Notice> : null}
    <div className="account-settings-hero"><span className="avatar">{initials}</span><div><h2>{user.name}</h2><p>{user.email} · {user.role === 'PHARMACY_ADMIN' ? 'Unternehmensadministrator' : user.role === 'PHARMACY_STAFF' ? 'Mitarbeiter' : 'Interner Zugang'}</p></div></div>
    <div className="account-settings-grid"><section className="account-settings-card"><h2>Persönliche Angaben</h2><p>Diese Angaben erscheinen im Portal bei Ihrem Profil.</p><form onSubmit={submit}><label className="field"><span>Name</span><input autoComplete="name" required maxLength={160} value={name} disabled={Boolean(viewingAs) || busy} onChange={event => setName(event.target.value)}/></label><label className="field"><span>E-Mail-Adresse</span><input type="email" autoComplete="email" required value={email} disabled={Boolean(viewingAs) || !emailEditable || busy} onChange={event => setEmail(event.target.value)}/></label>{!emailEditable ? <small>Die E-Mail-Adresse ist Ihr Anmeldename. Eine Änderung erfordert eine gesonderte Verifizierung.</small> : null}<Button type="submit" disabled={Boolean(viewingAs) || busy}>{busy ? 'Speichert …' : 'Änderungen speichern'}</Button></form></section><section className="account-settings-card"><h2>Zugang & Sicherheit</h2><p>Ihr Konto gehört zur Apotheke und verwendet einen Einmalcode bei der Anmeldung.</p><div className="account-settings-note"><Icon name="shield" size={21}/><span>{preview ? 'In dieser öffentlichen Konzeptvorschau sind Anmeldung, Einstellungen und Kontowechsel nur simuliert. Es wird nichts an einen Server gesendet.' : 'Rollen und Zugänge werden vom Unternehmensadministrator verwaltet. Ihr eigenes Adminrecht können Sie hier nicht ändern.'}</span></div></section></div>
  </div>
}
