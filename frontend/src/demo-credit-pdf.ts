// Fiktives PDF nur fuer die statische Konzeptvorschau; kein Abrechnungsbeleg.
type DemoCreditFields = { claimNumber: string; reference: string; provided: string; termDate?: string }

const pdfText = (value: string) => value.replace(/[^\x20-\x7e]/g, '?').replace(/[\\()]/g, '\\$&')

export function createDemoCreditPdf({ claimNumber, reference, provided, termDate }: DemoCreditFields): Blob {
  const line = (font: 'F1' | 'F2', size: number, x: number, y: number, value: string, color = '0.08 0.21 0.32') =>
    `${color} rg BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${pdfText(value)}) Tj ET`
  const date = termDate ? new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${termDate}T12:00:00Z`)) : 'Demo'
  const content = [
    line('F2', 25, 48, 775, 'LAWEA', '0.05 0.27 0.39'),
    line('F1', 16, 48, 753, 'direkt Plus', '0.15 0.61 0.74'),
    line('F1', 9, 397, 778, 'Stark fuer Apotheken.', '0.29 0.42 0.51'),
    line('F1', 9, 397, 765, 'Heute. Morgen. Gemeinsam.', '0.29 0.42 0.51'),
    line('F2', 25, 48, 684, 'Gutschrift'),
    line('F1', 8, 48, 644, 'REFERENZ', '0.39 0.49 0.57'),
    line('F1', 8, 180, 644, 'MELDUNG', '0.39 0.49 0.57'),
    line('F1', 8, 351, 644, 'STICHTAG', '0.39 0.49 0.57'),
    line('F1', 8, 462, 644, 'BEREITGESTELLT', '0.39 0.49 0.57'),
    line('F2', 9, 48, 627, reference),
    line('F2', 9, 180, 627, claimNumber),
    line('F2', 9, 351, 627, date),
    line('F2', 9, 462, 627, provided),
    '0.70 0.77 0.81 RG 48 609 m 547 609 l S',
    line('F1', 11, 48, 570, 'Sehr geehrte Damen und Herren,'),
    line('F1', 10, 48, 544, 'diese Ansicht zeigt ein fiktives Dokumentmuster zu Ihrer Meldung.'),
    line('F1', 10, 48, 528, 'Es wurde keine Zahlung ausgefuehrt und kein Betrag berechnet.'),
    '0.90 0.93 0.95 rg 48 457 499 28 re f',
    line('F2', 8, 58, 467, 'MUSTERPOSITIONEN OHNE ECHTDATEN', '0.27 0.37 0.45'),
    ...[435, 407, 379, 351].flatMap((y, index) => [
      `0.88 0.90 0.92 rg 58 ${y} 16 9 re f 88 ${y} ${120 + index * 13} 9 re f 359 ${y} 42 9 re f 446 ${y} 35 9 re f`,
      `0.88 0.91 0.93 RG 48 ${y - 10} m 547 ${y - 10} l S`
    ]),
    '0.90 0.96 0.97 rg 48 192 499 70 re f',
    line('F2', 12, 65, 232, 'Fiktive Demo - keine Zahlung', '0.06 0.36 0.44'),
    line('F1', 9, 65, 212, 'Dieses Dokument dient ausschliesslich zu Demonstrationszwecken.', '0.20 0.43 0.49'),
    '0.72 0.86 0.90 rg 440 0 m 595 0 l 595 156 l h f',
    '0.84 0.94 0.96 rg 510 0 m 595 0 l 595 85 l h f',
    line('F1', 9, 48, 64, 'LAWEA direkt Plus  |  Fiktive Daten  |  Seite 1 von 1', '0.38 0.49 0.56')
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
  for (const [index, object] of objects.entries()) {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  }
  const xref = pdf.length
  pdf += `xref\n0 ${offsets.length}\n0000000000 65535 f \n`
  pdf += offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')
  pdf += `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return new Blob([pdf], { type: 'application/pdf' })
}
