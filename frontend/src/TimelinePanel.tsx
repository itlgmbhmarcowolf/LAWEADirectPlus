export type TimelineEvent = {
  key: string
  timeLabel: string
  dateTime?: string
  title: string
  description: string
  revision?: string
  tone: 'done' | 'current' | 'issue'
}

export function TimelinePanel({ events, subtitle }: { events: TimelineEvent[]; subtitle: string }) {
  return <section className="data-section sample-timeline-panel">
    <div className="sample-timeline-heading"><div><h2>Verlauf</h2><p>{subtitle}</p></div><span>{events.length} {events.length === 1 ? 'Schritt' : 'Schritte'}</span></div>
    <ol className="sample-timeline">{events.map((event, index) => <li key={event.key} className={`sample-timeline-event ${event.tone}`}><span className="sample-timeline-marker" aria-hidden="true">{event.tone === 'issue' ? '×' : event.tone === 'current' ? '✓' : ''}</span><div className="sample-timeline-content"><div className="sample-timeline-meta"><time dateTime={event.dateTime}>{event.timeLabel}</time>{event.revision ? <span>{event.revision}</span> : null}</div><h3>{event.title}</h3><p>{event.description}</p></div>{index === 0 ? <span className="sample-timeline-latest">Aktuell</span> : null}</li>)}</ol>
  </section>
}
