import { Icon } from './ui'
import './claim-filters.css'

export type DateFilters = { from: string; to: string; order: 'desc' | 'asc' }
export const initialDateFilters = (): DateFilters => ({ from: '', to: '', order: 'desc' })

export function filterByTermDate<T>(items: T[], dateOf: (item: T) => string, filters: DateFilters): T[] {
  if (filters.from && filters.to && filters.from > filters.to) return []
  return items.filter(item => {
    const date = dateOf(item).slice(0, 10)
    return (!filters.from || date >= filters.from) && (!filters.to || date <= filters.to)
  }).sort((a, b) => dateOf(a).localeCompare(dateOf(b)) * (filters.order === 'asc' ? 1 : -1))
}

export function ClaimFilters({ value, onChange, count }: { value: DateFilters; onChange: (next: DateFilters) => void; count: number }) {
  const invalid = Boolean(value.from && value.to && value.from > value.to)
  const active = Boolean(value.from || value.to || value.order !== 'desc')
  return <div className="claim-filter-wrap">
    <div className="claim-filter-bar" aria-label="Senkungstermine filtern und sortieren">
      <div className="claim-filter-title"><span className="claim-filter-icon"><Icon name="calendar" size={19}/></span><div><strong>Zeitraum & Reihenfolge</strong><span>{count} {count === 1 ? 'Eintrag' : 'Einträge'} sichtbar</span></div></div>
      <label>Von<input type="date" lang="de-DE" aria-label="Senkungstermin von" value={value.from} onChange={event => onChange({ ...value, from: event.target.value })}/></label>
      <label>Bis<input type="date" lang="de-DE" aria-label="Senkungstermin bis" value={value.to} onChange={event => onChange({ ...value, to: event.target.value })}/></label>
      <label>Sortieren<select aria-label="Nach Senkungstermin sortieren" value={value.order} onChange={event => onChange({ ...value, order: event.target.value as DateFilters['order'] })}><option value="desc">Neueste zuerst</option><option value="asc">Älteste zuerst</option></select></label>
      {active ? <button type="button" className="claim-filter-reset" onClick={() => onChange(initialDateFilters())}>Zurücksetzen</button> : null}
    </div>
    {invalid ? <p className="claim-filter-error" role="alert">Das Startdatum muss vor dem Enddatum liegen.</p> : null}
  </div>
}
