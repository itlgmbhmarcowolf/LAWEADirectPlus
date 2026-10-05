import { useState, type FormEvent } from 'react'
import type { Role } from './types'
import { Button, Icon, Notice } from './ui'

type Mode = 'login' | 'login-otp' | 'register' | 'register-otp' | 'pending' | 'reset-request' | 'reset-complete' | 'invite' | 'invite-otp' | 'resubmit'
type Registration = { pharmacyName: string; street: string; zip: string; city: string; owner: string; phone: string; iban: string; homepage: string; name: string }
type Registered = { email: string; password: string; name: string; pharmacyName: string; approved: boolean }
type Profile = { name: string; email: string; organizationName: string }

const previewPassword = 'Vorschau!2026'
const previewCode = '123456'
const accounts: { role: Role; label: string; email: string }[] = [
  { role: 'PHARMACY_ADMIN', label: 'Apotheke', email: 'apotheke@beispiel.test' },
  { role: 'PHARMACY_STAFF', label: 'Mitarbeiterin', email: 'mitarbeiterin@beispiel.test' },
  { role: 'REVIEWER', label: 'Glenmark Prüfung', email: 'pruefung@beispiel.test' },
  { role: 'FINANCE', label: 'Glenmark Finance', email: 'finance@beispiel.test' }
]
const emptyRegistration = (): Registration => ({ pharmacyName: '', street: '', zip: '', city: '', owner: '', phone: '', iban: '', homepage: '', name: '' })

export function PreviewLogin({ onAuthenticated }: { onAuthenticated: (role: Role, profile?: Profile) => void }) {
  const [mode, setMode] = useState<Mode>('login')
  const [selected, setSelected] = useState(accounts[0])
  const [email, setEmail] = useState(accounts[0].email)
  const [password, setPassword] = useState(previewPassword)
  const [passwordAgain, setPasswordAgain] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [registration, setRegistration] = useState<Registration>(emptyRegistration)
  const [licenseSelected, setLicenseSelected] = useState(false)
  const [registered, setRegistered] = useState<Registered | null>(null)
  const [passwordOverrides, setPasswordOverrides] = useState<Record<string, string>>({})

  const open = (next: Mode) => { setMode(next); setError(''); setNotice(''); setCode('') }
  const choose = (account: typeof accounts[number]) => {
    setSelected(account)
    setEmail(account.email)
    setPassword(passwordOverrides[account.email] || previewPassword)
    setError('')
  }
  const registrationField = (key: keyof Registration, label: string, type = 'text', required = true) =>
    <label className="field" key={key}><span>{label}{required ? ' *' : ''}</span><input type={type} required={required} value={registration[key]} onChange={event => setRegistration(current => ({ ...current, [key]: event.target.value }))} autoComplete="off"/></label>

  const submitLogin = (event: FormEvent) => {
    event.preventDefault()
    const normalized = email.trim().toLowerCase()
    if (registered?.email === normalized) {
      if (!registered.approved) { setError('Das Beispielkonto wartet noch auf Freigabe.'); return }
      if (password !== registered.password) { setError('Bitte das Passwort des Beispielkontos verwenden.'); return }
      setSelected({ role: 'PHARMACY_ADMIN', label: 'Neue Apotheke', email: normalized })
    } else {
      const account = accounts.find(item => item.email === normalized)
      if (!account || password !== (passwordOverrides[account.email] || previewPassword)) {
        setError('Bitte einen der eingeblendeten fiktiven Demo-Zugänge verwenden.')
        return
      }
      setSelected(account)
    }
    open('login-otp')
  }
  const submitCode = (event: FormEvent) => {
    event.preventDefault()
    if (code !== previewCode) { setError('Der Beispielcode lautet 123456.'); return }
    if (mode === 'register-otp') {
      open('pending')
      return
    }
    if (mode === 'invite-otp') {
      onAuthenticated('PHARMACY_STAFF')
      return
    }
    const profile = registered && selected.email === registered.email
      ? { name: registered.name, email: registered.email, organizationName: registered.pharmacyName }
      : undefined
    onAuthenticated(selected.role, profile)
  }
  const submitRegistration = (event: FormEvent) => {
    event.preventDefault()
    if (!licenseSelected) { setError('Bitte den fiktiven Beispielnachweis hinzufügen.'); return }
    if (password !== passwordAgain) { setError('Die Passwörter stimmen nicht überein.'); return }
    setRegistered({ email: email.trim().toLowerCase(), password, name: registration.name.trim(), pharmacyName: registration.pharmacyName.trim(), approved: false })
    open('register-otp')
  }
  const submitResetRequest = (event: FormEvent) => {
    event.preventDefault()
    open('reset-complete')
    setNotice('Beispiel-Link geöffnet. Es wurde keine E-Mail versendet.')
    setPassword('')
    setPasswordAgain('')
  }
  const submitResetComplete = (event: FormEvent) => {
    event.preventDefault()
    if (password !== passwordAgain) { setError('Die Passwörter stimmen nicht überein.'); return }
    const normalized = email.trim().toLowerCase()
    if (registered?.email === normalized) setRegistered({ ...registered, password })
    else setPasswordOverrides(current => ({ ...current, [normalized]: password }))
    open('login')
    setNotice('Beispielpasswort geändert. Diese Änderung gilt nur bis zum Neuladen.')
  }
  const submitInvite = (event: FormEvent) => {
    event.preventDefault()
    if (password !== passwordAgain) { setError('Die Passwörter stimmen nicht überein.'); return }
    setSelected(accounts[1])
    open('invite-otp')
  }
  const submitResubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!licenseSelected) { setError('Bitte den fiktiven Beispielnachweis hinzufügen.'); return }
    open('pending')
    setNotice('Beispielnachweis zur erneuten Prüfung markiert. Es wurde keine Datei übertragen.')
  }

  return <div className="auth-layout preview-login-layout">
    <section className="auth-intro"><div className="auth-brand"><span>LAWEA</span> direkt <em>Plus</em></div><div className="auth-intro-copy"><span className="preview-login-eyebrow">Konzeptvorschau · Glenmark</span><h1>Lagerwertverluste. Klar geregelt.</h1><p>Ein Ort für Senkungstermine, Meldungen, Prüfung und Gutschriften.</p><div className="auth-steps"><span><Icon name="shield"/> Apotheke verifizieren</span><span><Icon name="file"/> Meldung erfassen</span><span><Icon name="check"/> Bearbeitung verfolgen</span></div></div><div className="auth-footer">LAWEA direkt Plus · Öffentliche Demo mit fiktiven Daten</div></section>
    <section className="auth-panel"><div className="auth-card">
      {error ? <Notice tone="warning">{error}</Notice> : null}
      {notice ? <Notice tone="info">{notice}</Notice> : null}

      {mode === 'login' ? <>
        <h2>Willkommen zurück</h2><p className="auth-lead">Melden Sie sich an, um die Beispielvorgänge anzusehen.</p>
        <form className="form-stack" onSubmit={submitLogin} autoComplete="off"><label className="field"><span>E-Mail-Adresse</span><input name="preview-email" type="email" required value={email} onChange={event => setEmail(event.target.value)} autoComplete="off"/></label><label className="field"><span>Passwort</span><input name="preview-password" type="password" required value={password} onChange={event => setPassword(event.target.value)} autoComplete="off"/></label><Button type="submit" icon="arrow">Demo-Anmeldung starten</Button></form>
        <button className="text-button" onClick={() => open('reset-request')}>Passwort vergessen?</button>
        <div className="auth-divider">Noch kein Konto?</div>
        <Button variant="secondary" onClick={() => { setEmail(''); setPassword(''); setPasswordAgain(''); setRegistration(emptyRegistration()); setLicenseSelected(false); open('register') }}>Konto erstellen</Button>
        <div className="demo-users preview-login-accounts"><strong>Fiktive Demo-Zugänge</strong><p>Beispielpasswort: <code>{previewPassword}</code></p><div>{accounts.map(account => <button key={account.role} type="button" className={selected.role === account.role ? 'selected' : ''} onClick={() => choose(account)} aria-pressed={selected.role === account.role}>{account.label}</button>)}</div></div>
        <button className="text-button preview-secondary-link" onClick={() => { setEmail(accounts[1].email); setPassword(''); setPasswordAgain(''); open('invite') }}>Mitarbeiter-Einladung ansehen</button>
      </> : null}

      {mode === 'register' ? <>
        <button className="back-link" onClick={() => { choose(accounts[0]); open('login') }}>← Zur Anmeldung</button>
        <h2>Apothekenkonto erstellen</h2><p className="auth-lead">Nach der E-Mail-Bestätigung wird die Apotheke geprüft. Diese Vorschau verwendet nur Beispieldaten.</p>
        <form className="form-stack" onSubmit={submitRegistration} autoComplete="off">
          <h3>1. Apotheke</h3><div className="form-grid">{registrationField('pharmacyName', 'Name der Apotheke')}{registrationField('owner', 'Inhaber')}{registrationField('street', 'Straße')}{registrationField('zip', 'Postleitzahl')}{registrationField('city', 'Ort')}{registrationField('phone', 'Telefon', 'tel')}{registrationField('iban', 'IBAN')}{registrationField('homepage', 'Homepage', 'url', false)}</div>
          <h3>2. Nachweis</h3><div className="preview-document"><div><Icon name="file"/><span>{licenseSelected ? 'Beispiel-Betriebserlaubnis.pdf' : 'Betriebserlaubnis · PDF, JPG oder PNG · max. 5 MB *'}</span></div><Button type="button" variant="secondary" onClick={() => setLicenseSelected(current => !current)}>{licenseSelected ? 'Beispiel entfernen' : 'Beispielnachweis hinzufügen'}</Button></div><p className="preview-document-hint">Es öffnet sich kein Dateidialog; echte Dokumente werden hier nicht angenommen.</p>
          <h3>3. Zugang</h3><div className="form-grid">{registrationField('name', 'Ihr Name')}<label className="field"><span>E-Mail-Adresse *</span><input type="email" required value={email} onChange={event => setEmail(event.target.value)} autoComplete="off"/></label><label className="field"><span>Passwort · mindestens 12 Zeichen *</span><input type="password" minLength={12} required value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password"/></label><label className="field"><span>Passwort wiederholen *</span><input type="password" minLength={12} required value={passwordAgain} onChange={event => setPasswordAgain(event.target.value)} autoComplete="new-password"/></label></div>
          <Button type="submit" icon="arrow">Konto erstellen · Demo</Button>
        </form>
      </> : null}

      {['login-otp','register-otp','invite-otp'].includes(mode) ? <>
        <button className="back-link" onClick={() => open(mode === 'register-otp' ? 'register' : mode === 'invite-otp' ? 'invite' : 'login')}>← Zurück</button>
        <h2>E-Mail-Adresse bestätigen</h2><p className="auth-lead">Für diese Vorschau wird kein Code versendet. Nutzen Sie den eingeblendeten Beispielcode.</p><Notice><strong>Beispielcode:</strong> {previewCode}</Notice>
        <form className="form-stack" onSubmit={submitCode}><label className="field"><span>Einmalcode</span><input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={event => setCode(event.target.value)} autoComplete="off"/></label><Button type="submit" icon="arrow">Bestätigen</Button></form>
      </> : null}

      {mode === 'pending' ? <>
        <div className="success-icon"><Icon name="check" size={30}/></div><h2>{registered?.approved ? 'Beispielkonto freigegeben' : 'Konto wartet auf Freigabe'}</h2><p className="auth-lead">{registered?.approved ? 'Die Freigabe wurde nur in diesem Browser simuliert. Im echten Ablauf erfolgt anschließend die Benachrichtigung.' : 'Die E-Mail-Adresse wurde in der Vorschau bestätigt. Als nächstes würde die Betriebserlaubnis manuell geprüft.'}</p>
        {registered?.approved ? <Button onClick={() => { setEmail(registered.email); setPassword(registered.password); open('login') }}>Mit Beispielkonto anmelden</Button> : <Button onClick={() => setRegistered(current => current ? { ...current, approved: true } : current)}>Freigabe simulieren</Button>}
        <button className="text-button" onClick={() => { setLicenseSelected(false); open('resubmit') }}>Nachweis nachreichen</button>
      </> : null}

      {mode === 'reset-request' ? <>
        <button className="back-link" onClick={() => open('login')}>← Zur Anmeldung</button><h2>Passwort vergessen?</h2><p className="auth-lead">Im echten Portal erhalten Sie einen einmaligen Link per E-Mail. Hier wird der Schritt ohne Versand simuliert.</p>
        <form className="form-stack" onSubmit={submitResetRequest}><label className="field"><span>E-Mail-Adresse</span><input type="email" required value={email} onChange={event => setEmail(event.target.value)}/></label><Button type="submit">Beispiel-Link öffnen</Button></form>
      </> : null}
      {mode === 'reset-complete' ? <>
        <h2>Neues Passwort festlegen</h2><form className="form-stack" onSubmit={submitResetComplete}><label className="field"><span>Neues Beispielpasswort</span><input type="password" minLength={12} required value={password} onChange={event => setPassword(event.target.value)}/></label><label className="field"><span>Passwort wiederholen</span><input type="password" minLength={12} required value={passwordAgain} onChange={event => setPasswordAgain(event.target.value)}/></label><Button type="submit">Beispielpasswort speichern</Button></form>
      </> : null}
      {mode === 'invite' ? <>
        <button className="back-link" onClick={() => open('login')}>← Zur Anmeldung</button><h2>Einladung annehmen</h2><p className="auth-lead">Beispieleinladung für {accounts[1].email}. Legen Sie ein Passwort fest und bestätigen Sie den angezeigten Code.</p>
        <form className="form-stack" onSubmit={submitInvite}><label className="field"><span>Passwort</span><input type="password" minLength={12} required value={password} onChange={event => setPassword(event.target.value)}/></label><label className="field"><span>Passwort wiederholen</span><input type="password" minLength={12} required value={passwordAgain} onChange={event => setPasswordAgain(event.target.value)}/></label><Button type="submit">Einladung annehmen · Demo</Button></form>
      </> : null}
      {mode === 'resubmit' ? <>
        <button className="back-link" onClick={() => open('pending')}>← Zum Kontostatus</button><h2>Nachweis nachreichen</h2><p className="auth-lead">Falls ein Nachweis abgelehnt wurde, kann die Apotheke einen neuen einreichen. Hier wird nur ein Beispieldokument angezeigt.</p>
        <form className="form-stack" onSubmit={submitResubmit}><div className="preview-document"><div><Icon name="file"/><span>{licenseSelected ? 'Neuer-Beispielnachweis.pdf' : 'Noch kein Beispielnachweis gewählt'}</span></div><Button type="button" variant="secondary" onClick={() => setLicenseSelected(true)}>Beispielnachweis wählen</Button></div><Button type="submit">Nachreichen simulieren</Button></form>
      </> : null}

      <p className="preview-login-footnote">Alle Eingaben bleiben nur in diesem Browserfenster. E-Mails, echte Dateien und Bankdaten werden nicht übertragen.</p>
    </div></section>
  </div>
}
