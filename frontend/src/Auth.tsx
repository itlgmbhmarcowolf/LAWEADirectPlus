import { useState, type FormEvent } from 'react'
import { api, post, upload } from './api'
import type { User } from './types'
import { Button, Icon, Notice } from './ui'

type Mode = 'login' | 'login-otp' | 'register' | 'register-otp' | 'pending' | 'invite' | 'invite-otp' | 'reset-request' | 'reset-complete' | 'resubmit'
const demoUsers = [
  ['Apotheke', 'admin@rosen-apotheke.test'],
  ['Mitarbeiterin', 'mitarbeiter@rosen-apotheke.test'],
  ['Glenmark Prüfung', 'pruefung@glenmark.test'],
  ['Glenmark Finance', 'finance@glenmark.test']
]
export function Auth({ onAuthenticated }: { onAuthenticated: (user: User, csrf: string) => void }) {
  const path = window.location.pathname
  const token = new URLSearchParams(window.location.search).get('token') || ''
  const [mode, setMode] = useState<Mode>(path === '/invite' ? 'invite' : path === '/reset' ? 'reset-complete' : 'login')
  const [email, setEmail] = useState('admin@rosen-apotheke.test')
  const [password, setPassword] = useState('Demo!Passwort2026')
  const [passwordAgain, setPasswordAgain] = useState('')
  const [code, setCode] = useState('')
  const [challengeId, setChallengeId] = useState('')
  const [demoCode, setDemoCode] = useState('')
  const [demoLink, setDemoLink] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [license, setLicense] = useState<File | null>(null)
  const [registration, setRegistration] = useState({ pharmacyName: '', street: '', zip: '', city: '', owner: '', phone: '', iban: '', homepage: '', name: '' })
  const action = async (fn: () => Promise<void>) => { setBusy(true); setError(''); try { await fn() } catch (e) { setError(e instanceof Error ? e.message : 'Ein Fehler ist aufgetreten.') } finally { setBusy(false) } }
  const open = (next: Mode) => { setMode(next); setError(''); window.history.replaceState({}, '', '/') }
  const regField = (key: keyof typeof registration, label: string, type = 'text', required = true) => <label className="field" key={key}><span>{label}{required ? ' *' : ''}</span><input type={type} required={required} value={registration[key]} onChange={e => setRegistration(v => ({ ...v, [key]: e.target.value }))}/></label>

  const submitLogin = (e: FormEvent) => { e.preventDefault(); action(async () => {
    const result = await post<{ challengeId: string; demoCode?: string }>('/auth/login', { email, password })
    setChallengeId(result.challengeId); setDemoCode(result.demoCode || ''); setCode(''); setMode('login-otp')
  }) }
  const submitOtp = (e: FormEvent) => { e.preventDefault(); action(async () => {
    const endpoint = mode === 'login-otp' ? '/auth/verify' : mode === 'invite-otp' ? '/members/verify' : '/register/verify'
    const result = await post<{ user?: User; csrf?: string }>(endpoint, { challengeId, code })
    if (mode === 'login-otp' && result.user && result.csrf) onAuthenticated(result.user, result.csrf)
    else setMode(mode === 'register-otp' ? 'pending' : 'login')
  }) }
  const submitRegistration = (e: FormEvent) => { e.preventDefault(); action(async () => {
    if (!license) throw new Error('Bitte eine Betriebserlaubnis auswählen.')
    if (password !== passwordAgain) throw new Error('Passwörter stimmen nicht überein.')
    const form = new FormData()
    for (const [key, value] of Object.entries(registration)) form.set(key, value)
    form.set('email', email); form.set('password', password); form.set('passwordAgain', passwordAgain); form.set('license', license)
    const result = await upload<{ challengeId: string; demoCode?: string }>('/register', form)
    setChallengeId(result.challengeId); setDemoCode(result.demoCode || ''); setCode(''); setMode('register-otp')
  }) }
  const submitInvite = (e: FormEvent) => { e.preventDefault(); action(async () => {
    const result = await post<{ challengeId: string; demoCode?: string }>('/members/accept', { token, password, passwordAgain })
    setChallengeId(result.challengeId); setDemoCode(result.demoCode || ''); setMode('invite-otp')
  }) }
  const submitResetRequest = (e: FormEvent) => { e.preventDefault(); action(async () => {
    const result = await post<{ demoLink?: string }>('/auth/reset/request', { email })
    setDemoLink(result.demoLink || ''); setMode('pending')
  }) }
  const submitReset = (e: FormEvent) => { e.preventDefault(); action(async () => {
    await post('/auth/reset/complete', { token, password, passwordAgain }); open('login')
  }) }
  const submitEvidence = (e: FormEvent) => { e.preventDefault(); action(async () => {
    if (!license) throw new Error('Bitte einen Nachweis auswählen.')
    const form = new FormData(); form.set('email', email); form.set('password', password); form.set('license', license)
    await api('/register/resubmit-evidence', { method: 'POST', body: form }); setMode('pending')
  }) }

  return <div className="auth-layout"><section className="auth-intro"><div className="auth-brand"><span>LAWEA</span> direkt <em>Plus</em></div><div className="auth-intro-copy"><h1>Lagerwertverluste. Klar geregelt.</h1><p>Erfassen Sie Ihre Meldungen sicher, verfolgen Sie jeden Schritt und finden Sie Ihre Gutschriften an einem Ort.</p><div className="auth-steps"><span><Icon name="shield"/> Apotheke verifizieren</span><span><Icon name="file"/> Meldung erfassen</span><span><Icon name="check"/> Bearbeitung verfolgen</span></div></div><div className="auth-footer">LAWEA direkt Plus · Glenmark Demo</div></section>
    <section className="auth-panel"><div className="auth-card">
      <div className="demo-note"><strong>Lokale Demo</strong><span>Nur fiktive Daten. E-Mail-Codes werden hier angezeigt.</span></div>
      {error ? <Notice tone="error">{error}</Notice> : null}
      {mode === 'login' ? <><h2>Willkommen zurück</h2><p className="auth-lead">Melden Sie sich an, um Ihre Vorgänge weiterzubearbeiten.</p><form onSubmit={submitLogin} className="form-stack"><label className="field"><span>E-Mail-Adresse</span><input type="email" required value={email} onChange={e => setEmail(e.target.value)}/></label><label className="field"><span>Passwort</span><input type="password" required value={password} onChange={e => setPassword(e.target.value)}/></label><Button type="submit" disabled={busy} icon="arrow">{busy ? 'Einen Moment …' : 'Anmelden'}</Button></form><button className="text-button" onClick={() => open('reset-request')}>Passwort vergessen?</button><div className="auth-divider">Noch kein Konto?</div><Button variant="secondary" onClick={() => { setPassword(''); open('register') }}>Konto erstellen</Button><div className="demo-users"><strong>Demo-Zugänge</strong><p>Alle nutzen das Passwort <code>Demo!Passwort2026</code>.</p><div>{demoUsers.map(([label, address]) => <button key={address} onClick={() => { setEmail(address); setPassword('Demo!Passwort2026') }}>{label}</button>)}</div></div></> : null}
      {['login-otp', 'register-otp', 'invite-otp'].includes(mode) ? <><h2>E-Mail-Adresse bestätigen</h2><p className="auth-lead">Geben Sie den sechsstelligen Einmalcode ein.</p>{demoCode ? <Notice><strong>Demo-Code:</strong> {demoCode}</Notice> : null}<form onSubmit={submitOtp} className="form-stack"><label className="field"><span>Einmalcode</span><input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoFocus required value={code} onChange={e => setCode(e.target.value)}/></label><Button type="submit" disabled={busy} icon="arrow">Bestätigen</Button></form></> : null}
      {mode === 'register' ? <><h2>Apothekenkonto erstellen</h2><p className="auth-lead">Nach der E-Mail-Bestätigung prüfen wir Ihre Betriebserlaubnis.</p><form onSubmit={submitRegistration} className="form-stack"><h3>1. Apotheke</h3><div className="form-grid">{regField('pharmacyName', 'Name der Apotheke')}{regField('owner', 'Inhaber')}{regField('street', 'Straße')}{regField('zip', 'Postleitzahl')}{regField('city', 'Ort')}{regField('phone', 'Telefon', 'tel')}{regField('iban', 'IBAN')}{regField('homepage', 'Homepage', 'url', false)}</div><h3>2. Nachweis</h3><label className="field"><span>Betriebserlaubnis · PDF, JPG oder PNG · max. 5 MB *</span><input type="file" accept=".pdf,.jpg,.jpeg,.png" required onChange={e => setLicense(e.target.files?.[0] || null)}/></label><h3>3. Zugang</h3><div className="form-grid">{regField('name', 'Ihr Name')}<label className="field"><span>E-Mail-Adresse *</span><input type="email" required value={email} onChange={e => setEmail(e.target.value)}/></label><label className="field"><span>Passwort · mindestens 12 Zeichen *</span><input type="password" minLength={12} required value={password} onChange={e => setPassword(e.target.value)}/></label><label className="field"><span>Passwort wiederholen *</span><input type="password" minLength={12} required value={passwordAgain} onChange={e => setPasswordAgain(e.target.value)}/></label></div><Button type="submit" disabled={busy} icon="arrow">Konto erstellen</Button></form><button className="text-button" onClick={() => open('login')}>Zur Anmeldung</button></> : null}
      {mode === 'pending' ? <><div className="success-icon"><Icon name="check" size={30}/></div><h2>Der nächste Schritt ist vorbereitet</h2><p className="auth-lead">Ihr Konto wartet nach der E-Mail-Bestätigung auf Freigabe, oder die angeforderte Nachricht ist unterwegs.</p>{demoLink ? <Notice>Demo-Link: <a href={demoLink}>{demoLink}</a></Notice> : null}<Button variant="secondary" onClick={() => open('login')}>Zur Anmeldung</Button><button className="text-button" onClick={() => open('resubmit')}>Nachweis erneut hochladen</button></> : null}
      {mode === 'invite' ? <><h2>Einladung annehmen</h2><p className="auth-lead">Legen Sie Ihr Passwort fest und bestätigen Sie Ihre E-Mail-Adresse.</p><form onSubmit={submitInvite} className="form-stack"><label className="field"><span>Passwort</span><input type="password" minLength={12} required value={password} onChange={e => setPassword(e.target.value)}/></label><label className="field"><span>Passwort wiederholen</span><input type="password" minLength={12} required value={passwordAgain} onChange={e => setPasswordAgain(e.target.value)}/></label><Button type="submit" disabled={busy}>Zugang aktivieren</Button></form></> : null}
      {mode === 'reset-request' ? <><h2>Passwort zurücksetzen</h2><p className="auth-lead">Wir senden Ihnen einen einmaligen Link.</p><form onSubmit={submitResetRequest} className="form-stack"><label className="field"><span>E-Mail-Adresse</span><input type="email" required value={email} onChange={e => setEmail(e.target.value)}/></label><Button type="submit" disabled={busy}>Link anfordern</Button></form><button className="text-button" onClick={() => open('login')}>Zur Anmeldung</button></> : null}
      {mode === 'reset-complete' ? <><h2>Neues Passwort festlegen</h2><form onSubmit={submitReset} className="form-stack"><label className="field"><span>Neues Passwort</span><input type="password" minLength={12} required value={password} onChange={e => setPassword(e.target.value)}/></label><label className="field"><span>Passwort wiederholen</span><input type="password" minLength={12} required value={passwordAgain} onChange={e => setPasswordAgain(e.target.value)}/></label><Button type="submit" disabled={busy}>Passwort speichern</Button></form></> : null}
      {mode === 'resubmit' ? <><h2>Nachweis nachreichen</h2><p className="auth-lead">Wenn Ihr Nachweis abgelehnt wurde, laden Sie hier eine neue Betriebserlaubnis hoch.</p><form onSubmit={submitEvidence} className="form-stack"><label className="field"><span>E-Mail-Adresse</span><input type="email" required value={email} onChange={e => setEmail(e.target.value)}/></label><label className="field"><span>Passwort</span><input type="password" required value={password} onChange={e => setPassword(e.target.value)}/></label><label className="field"><span>Neue Betriebserlaubnis</span><input type="file" accept=".pdf,.jpg,.jpeg,.png" required onChange={e => setLicense(e.target.files?.[0] || null)}/></label><Button type="submit" disabled={busy}>Nachweis einreichen</Button></form></> : null}
    </div></section></div>
}
