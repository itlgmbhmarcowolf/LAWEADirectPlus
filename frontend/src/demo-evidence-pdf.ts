import type { SampleClaim } from './sample-claim-data'
import { sampleDate, type SamplePosition } from './sample-claim-data'

type EvidenceDetail = { positions: SamplePosition[]; submitted: string; revision: number }
const escapePdf = (value: string) => value.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/Ä/g, 'Ae').replace(/Ö/g, 'Oe').replace(/Ü/g, 'Ue').replace(/ß/g, 'ss').replace(/[^\x20-\x7e]/g, '?').replace(/[\\()]/g, '\\$&')

// Eine echte, lokal erzeugte PDF-Datei mit ausdrücklich fiktiven Bestandsdaten.
export function createDemoEvidencePdf(claim: SampleClaim, detail: EvidenceDetail): Blob {
  const line = (value: string, x: number, y: number, size = 11, bold = false, color = '0.08 0.21 0.32') =>
    `${color} rg BT /${bold ? 'F2' : 'F1'} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${escapePdf(value)}) Tj ET`
  const content = [
    '0.92 0.97 0.98 rg 0 716 595 126 re f',
    line('LAWEA direkt Plus', 48, 788, 17, true, '0.04 0.37 0.49'),
    line('FIKTIVES MUSTERDOKUMENT', 48, 761, 9, true, '0.05 0.48 0.57'),
    line('Bestandsnachweis', 48, 677, 24, true),
    line(`Meldung ${claim.number}`, 48, 649, 11),
    '0.79 0.85 0.89 RG 48 628 m 547 628 l S',
    line('APOTHEKE', 48, 596, 8, true, '0.37 0.46 0.54'),
    line('STICHTAG', 268, 596, 8, true, '0.37 0.46 0.54'),
    line('EINGEREICHT', 407, 596, 8, true, '0.37 0.46 0.54'),
    line('Beispielapotheke', 48, 577, 11, true),
    line(sampleDate(claim.termDate), 268, 577, 11, true),
    line(detail.submitted, 407, 577, 11, true),
    line(`Erfasster Bestand zum ${sampleDate(claim.termDate)}`, 48, 519, 13, true),
    '0.88 0.93 0.95 rg 48 474 499 28 re f',
    line('PZN', 58, 484, 9, true), line('Artikel', 145, 484, 9, true), line('Charge', 310, 484, 9, true), line('Packungen', 459, 484, 9, true),
    ...detail.positions.flatMap((position, index) => {
      const y = 452 - index * 35
      return [line(position.pzn, 58, y, 10), line(position.article, 145, y, 10), line(position.charge, 310, y, 10), line(String(position.quantity), 478, y, 10, true), `0.89 0.92 0.94 RG 48 ${y - 12} m 547 ${y - 12} l S`]
    }),
    line(`Revision ${detail.revision}  |  Erfasst von Maria Keller`, 48, 325, 10),
    line('Die Angaben wurden fuer die Konzeptvorschau frei erfunden.', 48, 301, 10),
    '0.91 0.96 0.97 rg 48 166 499 84 re f',
    line('DEMO - KEIN ORIGINALNACHWEIS', 64, 219, 12, true, '0.04 0.40 0.49'),
    line('Dieses PDF belegt keinen realen Apothekenbestand.', 64, 194, 10),
    line('Es wurde ausschliesslich fuer die Kundenvorfuehrung erzeugt.', 64, 178, 10),
    line(`LAWEA direkt Plus  |  ${claim.number}  |  Seite 1 von 1`, 48, 56, 8, false, '0.39 0.49 0.56')
  ].join('\n') + '\n'
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    `<< /Length ${content.length} >>\nstream\n${content}endstream`
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  for (const [index, object] of objects.entries()) { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n` }
  const xref = pdf.length
  pdf += `xref\n0 ${offsets.length}\n0000000000 65535 f \n`
  pdf += offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')
  pdf += `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return new Blob([pdf], { type: 'application/pdf' })
}
