import { useState, type FormEvent } from 'react'
import type { Role } from './types'
import { Button, Icon, Notice } from './ui'
import { PasswordChecklist, passwordValid } from './PasswordChecklist'

type Mode = 'login' | 'login-otp' | 'register' | 'register-otp' | 'pending' | 'reset-request' | 'reset-complete' | 'invite' | 'invite-otp'
type Registration = { pharmacyName: string; street: string; zip: string; city: string; owner: string; phone: string; iban: string; homepage: string; name: string }
type Registered = { email: string; password: string; name: string; pharmacyName: string; approved: boolean }
type Profile = { name: string; email: string; organizationName: string }

const previewPassword = 'Vorschau!2026'
const previewCode = '123456'
type Scenario = 'empty' | 'few' | 'many'
const accounts: { role: Role; label: string; email: string; scenario: Scenario }[] = [
  { role: 'PHARMACY_ADMIN', label: 'Viele Daten', email: 'apotheke@beispiel.test', scenario: 'many' },
  { role: 'PHARMACY_ADMIN', label: 'Wenige Daten', email: 'wenige@beispiel.test', scenario: 'few' },
  { role: 'PHARMACY_ADMIN', label: 'Neues leeres Konto', email: 'neu@beispiel.test', scenario: 'empty' },
  { role: 'PHARMACY_STAFF', label: 'Mitarbeiterin', email: 'mitarbeiterin@beispiel.test', scenario: 'many' }
]
const emptyRegistration = (): Registration => ({ pharmacyName: '', street: '', zip: '', city: '', owner: '', phone: '', iban: '', homepage: '', name: '' })

export function PreviewLogin({ onAuthenticated }: { onAuthenticated: (role: Role, profile?: Profile, scenario?: Scenario, email?: string) => void }) {
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
  const [authFailures, setAuthFailures] = useState<Record<string, number>>({})
  const [lockedUntil, setLockedUntil] = useState<Record<string, number>>({})

  // Nur Browser-Simulation; die lokale Demo erzwingt dieselbe Regel serverseitig.
  const lockMessage = (until: number) => `Demo-Anmeldung gesperrt. Erneut möglich ab ${new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Berlin' }).format(until)} Uhr.`
  const isLocked = (address: string) => {
    const until = lockedUntil[address]
    if (until && until > Date.now()) { setError(lockMessage(until)); return true }
    if (until) { setLockedUntil(current => { const next = { ...current }; delete next[address]; return next }); setAuthFailures(current => ({ ...current, [address]: 0 })) }
    return false
  }
  const failedAuth = (address: string) => {
    const count = lockedUntil[address] && lockedUntil[address] <= Date.now() ? 1 : (authFailures[address] || 0) + 1
    setAuthFailures(current => ({ ...current, [address]: count }))
    if (count >= 3) { const until = Date.now() + 4 * 3600000; setLockedUntil(current => ({ ...current, [address]: until })); setError(lockMessage(until)); return }
    setError(`Demo-Anmeldung fehlgeschlagen. Noch ${3 - count} ${count === 2 ? 'Versuch' : 'Versuche'} bis zur vierstündigen Sperre.`)
  }

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
    if (isLocked(normalized)) return
    if (registered?.email === normalized) {
      if (!registered.approved) { setError('Das Beispielkonto wartet noch auf Freigabe.'); return }
      if (password !== registered.password) { failedAuth(normalized); return }
      setSelected({ role: 'PHARMACY_ADMIN', label: 'Neue Apotheke', email: normalized, scenario: 'empty' })
    } else {
      const account = accounts.find(item => item.email === normalized)
      if (!account) { setError('Bitte einen der eingeblendeten fiktiven Demo-Zugänge verwenden.'); return }
      if (password !== (passwordOverrides[account.email] || previewPassword)) {
        failedAuth(normalized)
        return
      }
      setSelected(account)
    }
    open('login-otp')
  }
  const submitCode = (event: FormEvent) => {
    event.preventDefault()
    if (mode === 'login-otp' && isLocked(selected.email)) return
    if (code !== previewCode) { if (mode === 'login-otp') failedAuth(selected.email); else setError('Der Beispielcode lautet 123456.'); return }
    if (mode === 'register-otp') {
      open('pending')
      return
    }
    if (mode === 'invite-otp') {
      onAuthenticated('PHARMACY_STAFF', undefined, 'many', accounts[3].email)
      return
    }
    const profile = registered && selected.email === registered.email
      ? { name: registered.name, email: registered.email, organizationName: registered.pharmacyName }
      : undefined
    setAuthFailures(current => ({ ...current, [selected.email]: 0 }))
    onAuthenticated(selected.role, profile, selected.scenario, selected.email)
  }
  const submitRegistration = (event: FormEvent) => {
    event.preventDefault()
    if (!passwordValid(password)) { setError('Bitte erfüllen Sie alle Passwortanforderungen.'); return }
    if (!licenseSelected) { setError('Bitte die fiktive Betriebserlaubnis auswählen · Demo.'); return }
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
    if (!passwordValid(password)) { setError('Bitte erfüllen Sie alle Passwortanforderungen.'); return }
    if (password !== passwordAgain) { setError('Die Passwörter stimmen nicht überein.'); return }
    const normalized = email.trim().toLowerCase()
    if (registered?.email === normalized) setRegistered({ ...registered, password })
    else setPasswordOverrides(current => ({ ...current, [normalized]: password }))
    open('login')
    setNotice('Beispielpasswort geändert. Diese Änderung gilt nur bis zum Neuladen.')
  }
  const submitInvite = (event: FormEvent) => {
    event.preventDefault()
    if (!passwordValid(password)) { setError('Bitte erfüllen Sie alle Passwortanforderungen.'); return }
    if (password !== passwordAgain) { setError('Die Passwörter stimmen nicht überein.'); return }
    setSelected(accounts[3])
    open('invite-otp')
  }

  return <div className={`auth-layout preview-login-layout ${mode === 'register' ? 'auth-registration' : ''}`}>
    <section className="auth-intro"><div className="auth-brand"><span>LAWEA</span> direkt<em>+</em></div><div className="auth-intro-copy"><h1>Lagerwertverluste. Klar geregelt.</h1><p>Ein Ort für Senkungstermine, Meldungen, Prüfung und Gutschriften.</p><div className="auth-steps"><span><Icon name="shield"/> Apotheke verifizieren</span><span><Icon name="file"/> Meldung erfassen</span><span><Icon name="check"/> Bearbeitung verfolgen</span></div></div><div className="auth-footer">LAWEA direkt+</div></section>
    <section className="auth-panel"><div className="auth-card">
      {error ? <Notice tone="warning">{error}</Notice> : null}
      {notice ? <Notice tone="info">{notice}</Notice> : null}

      {mode === 'login' ? <>
        <h2>Willkommen zurück</h2><p className="auth-lead">Melden Sie sich an, um die Beispielvorgänge anzusehen.</p><p className="auth-lock-hint"><Icon name="shield" size={16}/><span>Nach drei falschen Passwort- oder Anmeldecodeeingaben wird der Zugang für vier Stunden gesperrt.</span></p>
        <form className="form-stack" onSubmit={submitLogin} autoComplete="off"><label className="field"><span>E-Mail-Adresse</span><input name="preview-email" type="email" required value={email} onChange={event => setEmail(event.target.value)} autoComplete="off"/></label><label className="field"><span>Passwort</span><input name="preview-password" type="password" required value={password} onChange={event => setPassword(event.target.value)} autoComplete="off"/></label><Button type="submit" icon="arrow">Demo-Anmeldung starten</Button></form>
        <button className="text-button" onClick={() => open('reset-request')}>Passwort vergessen?</button>
        <div className="auth-divider">Noch kein Konto?</div>
        <Button variant="secondary" onClick={() => { setEmail(''); setPassword(''); setPasswordAgain(''); setRegistration(emptyRegistration()); setLicenseSelected(false); open('register') }}>Konto erstellen</Button>
        <div className="demo-users preview-login-accounts"><strong>Fiktive Testszenarien</strong><p>Beispielpasswort: <code>{previewPassword}</code></p><div>{accounts.map(account => <button key={account.email} type="button" className={selected.email === account.email ? 'selected' : ''} onClick={() => choose(account)} aria-pressed={selected.email === account.email}>{account.label}</button>)}</div></div>
        <button className="text-button preview-secondary-link" onClick={() => { setEmail(accounts[3].email); setPassword(''); setPasswordAgain(''); open('invite') }}>Mitarbeiter-Einladung ansehen</button>
      </> : null}

      {mode === 'register' ? <>
        <button className="back-link" onClick={() => { choose(accounts[0]); open('login') }}>← Zur Anmeldung</button>
        <h2>Apothekenkonto erstellen</h2><p className="auth-lead">Nach der E-Mail-Bestätigung wird die Apotheke geprüft. Diese Vorschau verwendet nur Beispieldaten.</p>
        <form className="form-stack" onSubmit={submitRegistration} autoComplete="off">
          <h3>1. Apotheke</h3><div className="form-grid">{registrationField('pharmacyName', 'Name der Apotheke')}{registrationField('owner', 'Inhaber')}{registrationField('street', 'Straße')}{registrationField('zip', 'Postleitzahl')}{registrationField('city', 'Ort')}{registrationField('phone', 'Telefon', 'tel')}{registrationField('iban', 'IBAN')}{registrationField('homepage', 'Homepage', 'url', false)}</div>
          <h3>2. Betriebserlaubnis *</h3><div className="preview-document"><div><Icon name="file"/><span>{licenseSelected ? 'Beispiel-Betriebserlaubnis.pdf' : 'PDF, JPG oder PNG · max. 5 MB'}</span></div><Button type="button" variant="secondary" onClick={() => setLicenseSelected(current => !current)}>{licenseSelected ? 'Betriebserlaubnis entfernen' : 'Betriebserlaubnis hochladen · Demo'}</Button></div><p className="preview-document-hint">Es öffnet sich kein Dateidialog; echte Dokumente werden hier nicht angenommen.</p>
          <h3>3. Zugang</h3><div className="form-grid">{registrationField('name', 'Ihr Name')}<label className="field"><span>E-Mail-Adresse *</span><input type="email" required value={email} onChange={event => setEmail(event.target.value)} autoComplete="off"/></label><div className="password-field"><label className="field"><span>Passwort · mindestens 12 Zeichen *</span><input type="password" minLength={12} required value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password"/></label><PasswordChecklist value={password}/></div><label className="field"><span>Passwort wiederholen *</span><input type="password" minLength={12} required value={passwordAgain} onChange={event => setPasswordAgain(event.target.value)} autoComplete="new-password"/></label></div>
          <Button type="submit" icon="arrow">Konto erstellen · Demo</Button>
        </form>
      </> : null}

      {['login-otp','register-otp','invite-otp'].includes(mode) ? <>
        <button className="back-link" onClick={() => open(mode === 'register-otp' ? 'register' : mode === 'invite-otp' ? 'invite' : 'login')}>← Zurück</button>
        <h2>E-Mail-Adresse bestätigen</h2><p className="auth-lead">Für diese Vorschau wird kein Code versendet. Nutzen Sie den eingeblendeten Beispielcode.</p>{mode === 'login-otp' ? <p className="auth-lock-hint"><Icon name="shield" size={16}/><span>Passwort- und Anmeldecodefehler zählen gemeinsam: Nach drei Fehlversuchen wird der Zugang für vier Stunden gesperrt.</span></p> : null}<Notice><strong>Beispielcode:</strong> {previewCode}</Notice>
        <form className="form-stack" onSubmit={submitCode}><label className="field"><span>Einmalcode</span><input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={event => setCode(event.target.value)} autoComplete="off"/></label><Button type="submit" icon="arrow">Bestätigen</Button></form>
      </> : null}

      {mode === 'pending' ? <>
        <div className="success-icon"><Icon name="check" size={30}/></div><h2>{registered?.approved ? 'Beispielkonto freigegeben' : 'Konto wartet auf Freigabe'}</h2><p className="auth-lead">{registered?.approved ? 'Die Freigabe wurde nur in diesem Browser simuliert. Im echten Ablauf erfolgt anschließend die Benachrichtigung.' : 'Die E-Mail-Adresse wurde in der Vorschau bestätigt. Als nächstes würde die Betriebserlaubnis manuell geprüft.'}</p>
        {registered?.approved ? <Button onClick={() => { setEmail(registered.email); setPassword(registered.password); open('login') }}>Mit Beispielkonto anmelden</Button> : <Button onClick={() => setRegistered(current => current ? { ...current, approved: true } : current)}>Freigabe simulieren</Button>}
      </> : null}

      {mode === 'reset-request' ? <>
        <button className="back-link" onClick={() => open('login')}>← Zur Anmeldung</button><h2>Passwort vergessen?</h2><p className="auth-lead">Im echten Portal erhalten Sie einen einmaligen Link per E-Mail. Hier wird der Schritt ohne Versand simuliert.</p>
        <form className="form-stack" onSubmit={submitResetRequest}><label className="field"><span>E-Mail-Adresse</span><input type="email" required value={email} onChange={event => setEmail(event.target.value)}/></label><Button type="submit">Beispiel-Link öffnen</Button></form>
      </> : null}
      {mode === 'reset-complete' ? <>
        <h2>Neues Passwort festlegen</h2><form className="form-stack" onSubmit={submitResetComplete}><div className="password-field"><label className="field"><span>Neues Beispielpasswort</span><input type="password" minLength={12} required value={password} onChange={event => setPassword(event.target.value)}/></label><PasswordChecklist value={password}/></div><label className="field"><span>Passwort wiederholen</span><input type="password" minLength={12} required value={passwordAgain} onChange={event => setPasswordAgain(event.target.value)}/></label><Button type="submit">Beispielpasswort speichern</Button></form>
      </> : null}
      {mode === 'invite' ? <>
        <button className="back-link" onClick={() => open('login')}>← Zur Anmeldung</button><h2>Einladung annehmen</h2><p className="auth-lead">Beispieleinladung für {accounts[3].email}. Legen Sie ein Passwort fest und bestätigen Sie den angezeigten Code.</p>
        <form className="form-stack" onSubmit={submitInvite}><div className="password-field"><label className="field"><span>Passwort</span><input type="password" minLength={12} required value={password} onChange={event => setPassword(event.target.value)}/></label><PasswordChecklist value={password}/></div><label className="field"><span>Passwort wiederholen</span><input type="password" minLength={12} required value={passwordAgain} onChange={event => setPasswordAgain(event.target.value)}/></label><Button type="submit">Einladung annehmen · Demo</Button></form>
      </> : null}

    </div></section>
  </div>
}
