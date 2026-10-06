import { useState, type FormEvent } from 'react'
import type { User } from './types'
import { Button, Icon, Notice, PageTitle } from './ui'

type Props = {
  user: User
  onSave: (name: string, email: string) => Promise<void> | void
  onChangePassword?: (currentPassword: string, newPassword: string, newPasswordAgain: string) => Promise<void> | void
  emailEditable: boolean
  preview: boolean
  viewingAs?: string
  onReturn?: () => void
}

export function AccountSettings({ user, onSave, onChangePassword, emailEditable, preview, viewingAs, onReturn }: Props) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordAgain, setNewPasswordAgain] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const submitProfile = async (event: FormEvent) => {
    event.preventDefault()
    setError(''); setNotice('')
    if (!name.trim()) { setError('Bitte geben Sie Ihren Namen ein.'); return }
    if (emailEditable && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Bitte geben Sie eine gültige E-Mail-Adresse ein.'); return }
    setBusy(true)
    try { await onSave(name.trim(), email.trim().toLowerCase()); setNotice(preview ? 'Ihre Beispielangaben wurden für diese Browsersitzung übernommen.' : 'Ihr Anzeigename wurde gespeichert.') }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Speichern fehlgeschlagen.') }
    finally { setBusy(false) }
  }

  const submitPassword = async (event: FormEvent) => {
    event.preventDefault()
    setError(''); setNotice('')
    if (newPassword.length < 12) { setError('Das neue Kennwort muss mindestens 12 Zeichen lang sein.'); return }
    if (newPassword !== newPasswordAgain) { setError('Neue Kennwörter stimmen nicht überein.'); return }
    if (currentPassword === newPassword) { setError('Bitte ein neues Kennwort wählen.'); return }
    if (!onChangePassword) return
    setBusy(true)
    try {
      await onChangePassword(currentPassword, newPassword, newPasswordAgain)
      setCurrentPassword(''); setNewPassword(''); setNewPasswordAgain('')
      setNotice(preview ? 'Kennwortänderung nur simuliert. Ihre Demo-Anmeldung bleibt unverändert.' : 'Kennwort geändert. Andere Sitzungen wurden beendet.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Kennwortänderung fehlgeschlagen.') }
    finally { setBusy(false) }
  }

  const initials = user.name.split(/\s+/).filter(Boolean).map(part => part[0]).slice(0, 2).join('').toUpperCase()
  return <div className="account-settings"><PageTitle title="Profil & Konto" subtitle="Ihre Angaben und Ihr Zugang."/>
    {error ? <Notice tone="error">{error}</Notice> : null}{notice ? <Notice tone="success">{notice}</Notice> : null}
    {viewingAs ? <Notice tone="warning">Sie betrachten gerade die Mitarbeiteransicht von {viewingAs}. Wechseln Sie zur Adminansicht zurück, um Ihre eigenen Angaben zu ändern. {onReturn ? <button className="text-button" onClick={onReturn}>Zur Adminansicht →</button> : null}</Notice> : null}
    <div className="account-settings-hero"><span className="avatar">{initials}</span><div><h2>{user.name}</h2><p>{user.email} · {user.role === 'PHARMACY_ADMIN' ? 'Unternehmensadministrator' : user.role === 'PHARMACY_STAFF' ? 'Mitarbeiter' : 'Interner Zugang'}</p></div></div>
    <div className="account-settings-grid">
      <section className="account-settings-card"><h2>Persönliche Angaben</h2><p>Diese Angaben erscheinen in Ihrem Profil.</p><form onSubmit={submitProfile}><label className="field"><span>Name</span><input autoComplete="name" required maxLength={160} value={name} disabled={Boolean(viewingAs) || busy} onChange={event => setName(event.target.value)}/></label><label className="field"><span>E-Mail-Adresse</span><input type="email" autoComplete="email" required value={email} disabled={Boolean(viewingAs) || !emailEditable || busy} onChange={event => setEmail(event.target.value)}/></label>{!emailEditable ? <small>Eine Änderung der Anmeldeadresse erfordert eine gesonderte Verifizierung.</small> : null}<Button type="submit" disabled={Boolean(viewingAs) || busy}>{busy ? 'Speichert …' : 'Änderungen speichern'}</Button></form></section>
      <section className="account-settings-card" id="account-password"><h2>Kennwort ändern</h2><p>{preview ? 'Diese Änderung wird in der Konzeptvorschau nur simuliert.' : 'Geben Sie Ihr aktuelles und ein neues Kennwort ein.'}</p><form onSubmit={submitPassword}><label className="field"><span>Aktuelles Kennwort</span><input type="password" autoComplete="current-password" required value={currentPassword} disabled={Boolean(viewingAs) || busy} onChange={event => setCurrentPassword(event.target.value)}/></label><label className="field"><span>Neues Kennwort</span><input type="password" autoComplete="new-password" required minLength={12} value={newPassword} disabled={Boolean(viewingAs) || busy} onChange={event => setNewPassword(event.target.value)}/></label><label className="field"><span>Neues Kennwort wiederholen</span><input type="password" autoComplete="new-password" required minLength={12} value={newPasswordAgain} disabled={Boolean(viewingAs) || busy} onChange={event => setNewPasswordAgain(event.target.value)}/></label><Button type="submit" disabled={Boolean(viewingAs) || busy}>{busy ? 'Speichert …' : 'Kennwort ändern'}</Button></form><div className="account-settings-note"><Icon name="shield" size={19}/><span>{preview ? 'Es wird kein Kennwort gespeichert oder an einen Server gesendet.' : 'Die Anmeldung verwendet zusätzlich einen Einmalcode. Nach der Änderung werden andere Sitzungen beendet.'}</span></div></section>
    </div>
  </div>
}
