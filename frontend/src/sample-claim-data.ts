import type { Status } from './types'

export type SampleClaim = { number: string; termDate: string; status: Status; creditReference?: string }
export type SamplePosition = { pzn: string; article: string; charge: string; quantity: number }
export type SampleEvent = { at: string; title: string; description: string; tone: 'done' | 'current' | 'issue'; revision?: string }

// Ausschließlich fiktive, zusammenhängende Beispiele für die öffentliche Konzeptvorschau.
export const sampleClaims: SampleClaim[] = [
  ...['2026-01-01', '2026-01-15', '2026-02-01', '2026-02-15', '2026-03-01', '2026-03-15', '2026-04-01', '2026-04-15'].map((termDate, index) => ({ number: `LV-DEMO-2026-ALT-${String(index + 1).padStart(2, '0')}`, termDate, status: 'COMPLETED' as Status, creditReference: `GS-DEMO-2026-ALT-${String(index + 1).padStart(2, '0')}` })),
  { number: 'LV-DEMO-2026-001', termDate: '2026-05-01', status: 'COMPLETED', creditReference: 'GS-DEMO-2026-001' },
  { number: 'LV-DEMO-2026-002', termDate: '2026-05-15', status: 'COMPLETED', creditReference: 'GS-DEMO-2026-002' },
  { number: 'LV-DEMO-2026-003', termDate: '2026-06-01', status: 'COMPLETED', creditReference: 'GS-DEMO-2026-003' },
  { number: 'LV-DEMO-2026-004', termDate: '2026-06-15', status: 'REJECTED' },
  { number: 'LV-DEMO-2026-014', termDate: '2026-08-15', status: 'COMPLETED', creditReference: 'GS-DEMO-2026-014' },
  { number: 'LV-DEMO-2026-011', termDate: '2026-09-01', status: 'MANUAL_REVIEW' },
  { number: 'LV-DEMO-2026-009', termDate: '2026-08-01', status: 'COMPLETED', creditReference: 'GS-DEMO-2026-009' }
]

export const sampleDate = (iso: string) => new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`))
const after = (iso: string, days: number) => {
  const date = new Date(`${iso}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}
const at = (iso: string, days: number, time: string) => `${sampleDate(after(iso, days))} · ${time} Uhr`

export function sampleClaimDetail(claim: SampleClaim) {
  const index = sampleClaims.findIndex(item => item.number === claim.number)
  const number = Math.max(0, index)
  const positions: SamplePosition[] = [
    { pzn: '01234567', article: 'Beispielpräparat A', charge: `DEMO-A-${String(number + 1).padStart(2, '0')}`, quantity: 8 + number % 7 },
    { pzn: number % 2 ? '04812345' : '07654321', article: number % 2 ? 'Beispielpräparat C' : 'Beispielpräparat B', charge: `DEMO-B-${String(number + 1).padStart(2, '0')}`, quantity: 3 + number % 5 }
  ]
  const revised = claim.number === 'LV-DEMO-2026-003'
  const rejected = claim.status === 'REJECTED'
  const submitted = after(claim.termDate, 1)
  const provided = sampleDate(after(claim.termDate, revised ? 6 : 4))
  const evidenceBase = `Bestandsnachweis-${claim.termDate}-${claim.number.slice(-3)}`
  const evidenceNameRev1 = `${evidenceBase}${revised ? '-R1' : ''}.pdf`
  const evidenceName = `${evidenceBase}${revised ? '-R2' : ''}.pdf`
  const previousPositions = revised ? positions.map((position, positionIndex) => positionIndex === 1 ? { ...position, charge: `UNGEKLART-${String(number + 1).padStart(2, '0')}` } : position) : undefined
  const events: SampleEvent[] = [
    { at: at(claim.termDate, 0, '17:20'), title: 'Entwurf gespeichert', description: 'Maria Keller hat die Bestände zum Stichtag erfasst.', tone: 'done' },
    { at: at(claim.termDate, 1, '09:15'), title: 'Revision 1 eingereicht', description: `${evidenceNameRev1} hochgeladen; Richtigkeit der Angaben bestätigt.`, tone: 'done', revision: 'Revision 1' },
    { at: at(claim.termDate, 1, '09:17'), title: 'Regelprüfung abgeschlossen', description: 'Die Beispielpositionen wurden zur manuellen Prüfung weitergeleitet.', tone: 'done', revision: 'Revision 1' }
  ]
  if (revised || rejected) {
    events.push({ at: at(claim.termDate, 2, '11:40'), title: 'Revision 1 abgelehnt', description: 'Demo-Prüfung: Die Charge der zweiten Position war zu erläutern.', tone: 'issue', revision: 'Revision 1' })
  }
  if (revised) {
    events.push(
      { at: at(claim.termDate, 3, '08:35'), title: 'Revision 2 eingereicht', description: 'Maria Keller hat die Chargenangabe erläutert und einen neuen Nachweis eingereicht. Revision 1 bleibt unverändert.', tone: 'done', revision: 'Revision 2' },
      { at: at(claim.termDate, 4, '14:10'), title: 'Fachlich freigegeben', description: 'Glenmark Demo-Prüfung hat Revision 2 freigegeben.', tone: 'done', revision: 'Revision 2' },
      { at: at(claim.termDate, 5, '10:05'), title: 'Für ITL bereitgestellt', description: 'Die freigegebene Demo-Meldung wurde dem simulierten Abwicklungsprozess zugeordnet.', tone: 'done', revision: 'Revision 2' }
    )
  } else if (claim.status === 'COMPLETED') {
    events.push(
      { at: at(claim.termDate, 2, '14:10'), title: 'Fachlich freigegeben', description: 'Glenmark Demo-Prüfung hat Revision 1 freigegeben.', tone: 'done', revision: 'Revision 1' },
      { at: at(claim.termDate, 3, '10:05'), title: 'Für ITL bereitgestellt', description: 'Die freigegebene Demo-Meldung wurde dem simulierten Abwicklungsprozess zugeordnet.', tone: 'done', revision: 'Revision 1' }
    )
  }
  if (claim.status === 'COMPLETED') events.push({ at: at(claim.termDate, revised ? 6 : 4, '09:30'), title: 'Gutschrift bereitgestellt', description: `${claim.creditReference} ist dieser Meldung zugeordnet. Keine Auszahlung erfolgt.`, tone: 'current', revision: revised ? 'Revision 2' : 'Revision 1' })
  if (claim.status === 'MANUAL_REVIEW') events.push({ at: at(claim.termDate, 2, '10:30'), title: 'In fachlicher Prüfung', description: 'Für diesen fiktiven Vorgang liegt noch keine Freigabe vor.', tone: 'current', revision: 'Revision 1' })
  return { positions, previousPositions, events, submitted: sampleDate(after(claim.termDate, revised ? 3 : 1)), previousSubmitted: revised ? sampleDate(submitted) : undefined, provided, evidenceName, evidenceNameRev1, revision: revised ? 2 : 1 }
}
