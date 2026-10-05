import type { PreviewClaim } from './PreviewApp'
import { previewProductNames } from './PreviewClaimEditor'
import { statusLabel } from './types'
import { Icon, StatusPill } from './ui'
import './preview-dashboard.css'

export type DashboardTerm = { iso: string; date: string; number: string; claim: PreviewClaim }

type Step = { label: string; done: boolean }
type Review = { steps: Step[]; complete: number; next: string }

function reviewClaim(claim: PreviewClaim): Review {
  const positions = claim.items.length > 0 && claim.items.every(item => Boolean(previewProductNames[item.pzn]) && Boolean(item.charge.trim()) && Number.isInteger(Number(item.quantity)) && Number(item.quantity) > 0)
  const steps = [
    { label: 'Positionen', done: positions },
    { label: 'Nachweis', done: claim.evidence },
    { label: 'Kontakt', done: Boolean(claim.contact.trim()) },
    { label: 'Bestätigung', done: claim.declaration }
  ]
  const complete = steps.filter(step => step.done).length
  const next = !claim.items.length ? 'Erste Position erfassen' : !positions ? 'PZN, Charge und Packungszahl ergänzen' : !claim.evidence ? 'Beispielnachweis ergänzen' : !claim.contact.trim() ? 'Ansprechpartner angeben' : !claim.declaration ? 'Angaben prüfen und bestätigen' : 'Angaben zur Prüfung öffnen'
  return { steps, complete, next }
}

export function PreviewDashboard({ name, organizationName, terms, navigate }: { name: string; organizationName: string; terms: DashboardTerm[]; navigate: (page: string) => void }) {
  const drafts = terms.filter(term => term.claim.status === 'DRAFT')
  const rejected = terms.filter(term => term.claim.status === 'REJECTED')
  const attention = [...rejected, ...drafts]
  const focus = rejected[0] || [...drafts].sort((a, b) => reviewClaim(b.claim).complete - reviewClaim(a.claim).complete)[0]
  const focusReview = focus ? reviewClaim(focus.claim) : null
  return <div className="overview-pro">
    <header className="overview-heading"><div><span className="overview-eyebrow">Ihre Übersicht · {organizationName}</span><h1>Guten Tag, {name}</h1><p>Sehen Sie auf einen Blick, wo Ihre Meldungen stehen und was noch fehlt.</p></div><button className="overview-heading-link" onClick={() => navigate('claims')}>Alle Meldungen <Icon name="arrow" size={17}/></button></header>

    <div className="overview-lead-grid"><section className="overview-focus" aria-labelledby="overview-focus-title"><div className="overview-focus-decoration" aria-hidden="true"><span>01</span><span>15</span></div><span className="overview-focus-kicker"><Icon name="shield" size={17}/> Ihr nächster Schritt <small>Vorschlag</small></span><h2 id="overview-focus-title">{focus ? focus.claim.status === 'REJECTED' ? `Rückmeldung zum ${focus.date} ansehen` : `Meldung vom ${focus.date} ${focus.claim.items.length ? 'fortsetzen' : 'beginnen'}` : 'Alle offenen Schritte bearbeitet'}</h2><p>{focus ? focus.claim.status === 'REJECTED' ? 'Glenmark hat einen Grund hinterlegt. Lesen Sie ihn im Vorgang und entscheiden Sie selbst über eine neue Revision.' : `${focusReview?.next}. Die Prüfung und Einreichung bestätigen Sie selbst.` : 'Verfolgen Sie den weiteren Bearbeitungsstand in Ihren Meldungen.'}</p><button className="overview-focus-action" onClick={() => navigate(focus ? `claim:${focus.iso}` : 'claims')}>{focus ? focus.claim.status === 'REJECTED' ? 'Rückmeldung öffnen' : 'Zum Entwurf' : 'Status ansehen'} <Icon name="arrow" size={18}/></button></section>
      <section className="overview-attention" aria-labelledby="overview-attention-title"><div className="overview-attention-head"><span className="overview-attention-icon"><Icon name="alert" size={19}/></span><div><span className="overview-eyebrow">Handlungsbedarf</span><h2 id="overview-attention-title">Braucht Ihre Aufmerksamkeit</h2></div><strong>{attention.length}</strong></div>{attention.length ? <div className="overview-attention-list">{attention.map(term => <button key={term.iso} onClick={() => navigate(`claim:${term.iso}`)}><span className={term.claim.status === 'REJECTED' ? 'overview-attention-dot urgent' : 'overview-attention-dot'}/><span><strong>{term.date}</strong><small>{term.claim.status === 'REJECTED' ? 'Rückmeldung prüfen' : reviewClaim(term.claim).next}</small></span><Icon name="arrow" size={16}/></button>)}</div> : <p className="overview-attention-empty"><Icon name="check" size={18}/> Zurzeit ist keine Eingabe oder Korrektur offen.</p>}<p className="overview-attention-note">Diese Hinweise entstehen aus den sichtbaren Beispielangaben. Es gibt keine automatische Einreichung.</p></section></div>

    <section className="overview-terms" aria-labelledby="overview-terms-title"><div className="overview-section-head"><div><span className="overview-eyebrow">Senkungstermine</span><h2 id="overview-terms-title">Ihre Meldungen nach Termin</h2><p>Jeder Senkungstermin hat einen eigenen Entwurf und Verlauf.</p></div><button onClick={() => navigate('claims')}>Terminliste öffnen <Icon name="arrow" size={16}/></button></div><div className="overview-term-grid">{terms.map(term => {
      const review = reviewClaim(term.claim)
      const draft = term.claim.status === 'DRAFT'
      const [day, month, year] = term.date.split('.')
      return <article className="overview-term-card" key={term.iso}><div className="overview-term-top"><div className="overview-term-date"><strong>{day}</strong><span>{month}.{year}</span></div><StatusPill status={term.claim.status}/></div><span className="overview-term-reference">GLENMARK · {term.number}</span><h3>Preissenkung am {term.date}</h3><p>{draft ? review.next : term.claim.status === 'REJECTED' ? term.claim.reason || 'Rückmeldung liegt vor' : `Status: ${statusLabel[term.claim.status]}`}</p>{draft ? <><div className="overview-progress-label"><span>Vollständigkeit des Entwurfs</span><strong>{review.complete} / 4</strong></div><div className="overview-progress-track" role="progressbar" aria-label={`Vollständigkeit der Meldung vom ${term.date}`} aria-valuemin={0} aria-valuemax={4} aria-valuenow={review.complete}><span style={{ width: `${review.complete / 4 * 100}%` }}/></div><div className="overview-steps">{review.steps.map(step => <span className={step.done ? 'done' : ''} key={step.label}><Icon name={step.done ? 'check' : 'clock'} size={13}/>{step.label}</span>)}</div></> : <div className="overview-term-state"><Icon name="file" size={18}/> {term.claim.status === 'REJECTED' ? 'Korrektur ist als neue Revision möglich.' : 'Die eingereichte Version bleibt unverändert.'}</div>}<button className="overview-term-action" onClick={() => navigate(`claim:${term.iso}`)}>{draft ? term.claim.items.length ? 'Entwurf fortsetzen' : 'Meldung erfassen' : 'Vorgang ansehen'} <Icon name="arrow" size={17}/></button></article>
    })}</div></section>
  </div>
}
