import { useState, type FormEvent } from 'react'
import type { Role } from './types'
import { Button, Icon, Notice } from './ui'

const previewPassword = 'Vorschau!2026'
const previewCode = '123456'
const accounts: { role: Role; label: string; email: string }[] = [
  { role: 'PHARMACY_ADMIN', label: 'Apotheke', email: 'apotheke@beispiel.test' },
  { role: 'PHARMACY_STAFF', label: 'Mitarbeiterin', email: 'mitarbeiterin@beispiel.test' },
  { role: 'REVIEWER', label: 'Glenmark Prüfung', email: 'pruefung@beispiel.test' },
  { role: 'FINANCE', label: 'Glenmark Finance', email: 'finance@beispiel.test' }
]

export function PreviewLogin({ onAuthenticated }: { onAuthenticated: (role: Role) => void }) {
  const [selected, setSelected] = useState(accounts[0])
  const [email, setEmail] = useState(accounts[0].email)
  const [password, setPassword] = useState(previewPassword)
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'login' | 'otp'>('login')
  const [error, setError] = useState('')

  const choose = (account: typeof accounts[number]) => {
    setSelected(account)
    setEmail(account.email)
    setPassword(previewPassword)
    setError('')
  }
  const submitLogin = (event: FormEvent) => {
    event.preventDefault()
    const account = accounts.find(item => item.email === email.trim().toLowerCase())
    if (!account || password !== previewPassword) {
      setError('Bitte verwenden Sie einen der eingeblendeten fiktiven Demo-Zugänge.')
      return
    }
    setSelected(account)
    setCode('')
    setError('')
    setStep('otp')
  }
  const submitCode = (event: FormEvent) => {
    event.preventDefault()
    if (code !== previewCode) {
      setError('Der Beispielcode lautet 123456.')
      return
    }
    onAuthenticated(selected.role)
  }

  return <div className="auth-layout preview-login-layout">
    <section className="auth-intro"><div className="auth-brand"><span>LAWEA</span> direkt <em>Plus</em></div><div className="auth-intro-copy"><span className="preview-login-eyebrow">Konzeptvorschau · Glenmark</span><h1>Lagerwertverluste. Klar geregelt.</h1><p>Ein Ort für Senkungstermine, Meldungen, Prüfung und Gutschriften.</p><div className="auth-steps"><span><Icon name="shield"/> Apotheke verifizieren</span><span><Icon name="file"/> Meldung erfassen</span><span><Icon name="check"/> Bearbeitung verfolgen</span></div></div><div className="auth-footer">LAWEA direkt Plus · Öffentliche Demo mit fiktiven Daten</div></section>
    <section className="auth-panel"><div className="auth-card">
      <div className="demo-note"><strong>Konzeptvorschau</strong><span>Keine echte Anmeldung. Bitte keine persönlichen Zugangsdaten eingeben.</span></div>
      {error ? <Notice tone="warning">{error}</Notice> : null}
      {step === 'login' ? <><h2>Willkommen zurück</h2><p className="auth-lead">Wählen Sie eine Perspektive und öffnen Sie den Beispielablauf.</p><form className="form-stack" onSubmit={submitLogin} autoComplete="off"><label className="field"><span>E-Mail-Adresse</span><input name="preview-email" type="email" required value={email} onChange={event => setEmail(event.target.value)} autoComplete="off"/></label><label className="field"><span>Passwort</span><input name="preview-password" type="password" required value={password} onChange={event => setPassword(event.target.value)} autoComplete="off"/></label><Button type="submit" icon="arrow">Demo-Anmeldung starten</Button></form><div className="demo-users preview-login-accounts"><strong>Fiktive Demo-Zugänge</strong><p>Beispielpasswort: <code>{previewPassword}</code></p><div>{accounts.map(account => <button key={account.role} type="button" className={selected.role === account.role ? 'selected' : ''} onClick={() => choose(account)} aria-pressed={selected.role === account.role}>{account.label}</button>)}</div></div></> : <><button className="back-link" onClick={() => { setStep('login'); setError('') }}>← Zurück zur Anmeldung</button><h2>E-Mail-Adresse bestätigen</h2><p className="auth-lead">Für diese Vorschau wird kein Code versendet. Nutzen Sie den eingeblendeten Beispielcode.</p><Notice><strong>Beispielcode:</strong> {previewCode}</Notice><form className="form-stack" onSubmit={submitCode}><label className="field"><span>Einmalcode</span><input name="preview-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={event => setCode(event.target.value)} autoComplete="off"/></label><Button type="submit" icon="arrow">Vorschau öffnen</Button></form></>}
      <p className="preview-login-footnote">Alle Eingaben bleiben nur in diesem Browserfenster. Es werden keine Daten übertragen oder gespeichert.</p>
    </div></section>
  </div>
}
