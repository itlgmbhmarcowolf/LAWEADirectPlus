// Fiktives PDF nur fuer die statische Konzeptvorschau; kein Abrechnungsbeleg.
type DemoCreditFields = { claimNumber: string; reference: string; provided: string }

const pdfText = (value: string) => value.replace(/[^\x20-\x7e]/g, '?').replace(/[\\()]/g, '\\$&')

export function createDemoCreditPdf({ claimNumber, reference, provided }: DemoCreditFields): Blob {
  const line = (font: 'F1' | 'F2', size: number, x: number, y: number, value: string, color = '0.08 0.21 0.32') =>
    `${color} rg BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${pdfText(value)}) Tj ET`
  const content = [
    '0.05 0.27 0.39 rg 0 724 595 118 re f',
    line('F2', 17, 48, 785, 'LAWEA direkt Plus', '1 1 1'),
    line('F1', 9, 48, 761, 'FIKTIVES DOKUMENTMUSTER', '0.68 0.91 0.94'),
    '0.89 0.96 0.97 rg 0 687 595 37 re f',
    line('F2', 10, 48, 701, 'DEMO - KEINE ECHTE GUTSCHRIFT', '0.04 0.42 0.5'),
    line('F2', 29, 48, 633, 'GUTSCHRIFT'),
    line('F1', 12, 48, 608, 'Musteransicht zu einer ausgezahlten Beispielmeldung.'),
    '0.83 0.89 0.91 RG 48 572 m 547 572 l S',
    line('F1', 10, 48, 542, 'VORGANG', '0.38 0.49 0.56'),
    line('F2', 14, 48, 520, claimNumber),
    line('F1', 10, 48, 478, 'GUTSCHRIFT-REFERENZ', '0.38 0.49 0.56'),
    line('F2', 14, 48, 456, reference),
    line('F1', 10, 48, 414, 'BEREITGESTELLT', '0.38 0.49 0.56'),
    line('F2', 14, 48, 392, provided),
    '0.91 0.96 0.94 rg 48 265 499 86 re f',
    line('F2', 13, 67, 318, 'Nur zur Ansicht im Demo-Portal', '0.09 0.37 0.3'),
    line('F1', 10, 67, 296, 'Es wurde keine Zahlung ausgefuehrt und kein Betrag berechnet.', '0.09 0.37 0.3'),
    '0.83 0.89 0.91 RG 48 88 m 547 88 l S',
    line('F1', 9, 48, 67, 'LAWEA direkt Plus  |  Fiktive Daten  |  Seite 1 von 1', '0.38 0.49 0.56')
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
