import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'

export type TimelineEvent = {
  key: string
  timeLabel: string
  dateTime?: string
  title: string
  description: string
  revision?: string
  tone: 'done' | 'current' | 'issue'
}

const BATCH_SIZE = 4

export function TimelinePanel({ events, subtitle, height }: { events: TimelineEvent[]; subtitle: string; height?: number }) {
  const [visibleCount, setVisibleCount] = useState(Math.min(BATCH_SIZE, events.length))
  const scrollRef = useRef<HTMLDivElement>(null)
  const eventKey = `${events.length}:${events[0]?.key || ''}`
  useEffect(() => { setVisibleCount(Math.min(BATCH_SIZE, events.length)); if (scrollRef.current) scrollRef.current.scrollTop = 0 }, [eventKey, events.length])
  const loadMore = useCallback(() => setVisibleCount(count => Math.min(count + BATCH_SIZE, events.length)), [events.length])
  const onScroll = (node: HTMLDivElement) => {
    if (node.scrollTop + node.clientHeight >= node.scrollHeight - 80) loadMore()
  }
  const style = height ? { '--timeline-height': `${height}px` } as CSSProperties : undefined
  return <section className={`data-section sample-timeline-panel${height ? ' sample-timeline-panel-fixed' : ''}`} style={style}>
    <div className="sample-timeline-heading"><div><h2>Verlauf</h2><p>{subtitle}</p></div><span>{events.length} {events.length === 1 ? 'Schritt' : 'Schritte'}</span></div>
    <div className="sample-timeline-scroll" ref={scrollRef} role="region" aria-label="Verlaufsschritte" tabIndex={0} onScroll={event => onScroll(event.currentTarget)}>
      <ol className="sample-timeline">{events.slice(0, visibleCount).map((event, index) => <li key={event.key} className={`sample-timeline-event ${event.tone}`}><span className="sample-timeline-marker" aria-hidden="true">{event.tone === 'issue' ? '×' : event.tone === 'current' ? '✓' : ''}</span><div className="sample-timeline-content"><div className="sample-timeline-meta"><time dateTime={event.dateTime}>{event.timeLabel}</time>{event.revision ? <span>{event.revision}</span> : null}</div><h3>{event.title}</h3><p>{event.description}</p></div>{index === 0 ? <span className="sample-timeline-latest">Aktuell</span> : null}</li>)}</ol>
      {visibleCount < events.length ? <button className="sample-timeline-more" type="button" onClick={loadMore}>Weitere Schritte laden</button> : null}
    </div>
  </section>
}
