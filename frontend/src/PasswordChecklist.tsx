export const passwordChecks = (value: string) => [
  { label: 'Mindestens 12 Zeichen', valid: value.length >= 12 },
  { label: 'Großbuchstabe', valid: /[A-Z]/.test(value) },
  { label: 'Kleinbuchstabe', valid: /[a-z]/.test(value) },
  { label: 'Ziffer', valid: /[0-9]/.test(value) },
  { label: 'Sonderzeichen', valid: /[\p{P}\p{S}]/u.test(value) }
]

export const passwordValid = (value: string) => passwordChecks(value).every(check => check.valid)

export function PasswordChecklist({ value }: { value: string }) {
  if (!value) return null
  return <ul className="password-checklist" aria-label="Passwortanforderungen" aria-live="polite">{passwordChecks(value).map(check =>
    <li key={check.label} className={check.valid ? 'fulfilled' : 'unfulfilled'} aria-label={`${check.label}: ${check.valid ? 'erfüllt' : 'nicht erfüllt'}`}><span className="password-check-icon" aria-hidden="true">{check.valid ? '✓' : '×'}</span>{check.label}</li>
  )}</ul>
}
