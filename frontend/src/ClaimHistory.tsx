import type { ClaimDetail, Credit, ExportRun } from './types'
import { dateTime } from './types'
import './sample-claim-detail.css'

type Event = { timestamp: string; title: string; description: string; revision?: string; tone: 'done' | 'current' | 'issue' }

export function ClaimHistory({ detail, credit, exportRun }: { detail: ClaimDetail; credit?: Credit; exportRun?: ExportRun }) {
  const events: Event[] = detail.revisions.flatMap(revision => {
    const result: Event[] = [{ timestamp: revision.submitted_at, title: `Revision ${revision.revision_no} eingereicht`, description: `${revision.snapshot.items.length} Positionen und ${revision.snapshot.documentIds.length} Nachweise eingereicht. Die Fassung bleibt unverändert.`, revision: `Revision ${revision.revision_no}`, tone: 'done' }]
    if (revision.decision_at) result.push({ timestamp: revision.decision_at, title: revision.status === 'REJECTED' ? 'Korrektur angefordert' : 'Fachlich freigegeben', description: revision.decision_reason || (revision.status === 'REJECTED' ? 'Ein Korrekturgrund wurde hinterlegt.' : 'Die Revision wurde nach Prüfung freigegeben.'), revision: `Revision ${revision.revision_no}`, tone: revision.status === 'REJECTED' ? 'issue' : 'done' })
    return result
  })
  if (exportRun) events.push({ timestamp: exportRun.created_at, title: 'Demo-Export erstellt', description: 'Die freigegebene Meldung wurde in einem Demo-CSV-Export berücksichtigt.', tone: 'done' })
  if (credit) events.push({ timestamp: credit.published_at, title: 'Gutschrift bereitgestellt', description: `Referenz ${credit.reference} wurde dieser Meldung zugeordnet.`, tone: 'current' })
  events.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  return <section className="data-section sample-timeline-panel"><div className="sample-timeline-heading"><div><h2>Verlauf</h2><p>Einreichungen und Entscheidungen zu dieser Meldung</p></div><span>{events.length} {events.length === 1 ? 'Schritt' : 'Schritte'}</span></div><ol className="sample-timeline">{events.map((event, index) => <li key={`${event.timestamp}-${event.title}`} className={`sample-timeline-event ${event.tone}`}><span className="sample-timeline-marker" aria-hidden="true">{event.tone === 'issue' ? '×' : event.tone === 'current' ? '✓' : ''}</span><div className="sample-timeline-content"><div className="sample-timeline-meta"><time dateTime={event.timestamp}>{dateTime(event.timestamp)}</time>{event.revision ? <span>{event.revision}</span> : null}</div><h3>{event.title}</h3><p>{event.description}</p></div>{index === 0 ? <span className="sample-timeline-latest">Aktuell</span> : null}</li>)}</ol></section>
}
