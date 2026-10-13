import { useEffect, useState } from 'react'
import type { PreviewCredit } from './PreviewApp'
import { Button, Empty, Icon, PageTitle } from './ui'
import { createDemoCreditPdf } from './demo-credit-pdf'
import { CreditDetailLayout } from './CreditDetailLayout'
import { PdfPreview } from './PdfPreviewLoader'

export function PreviewCredits({ credits, selectedClaimNumber, currentClaims, navigate }: { credits: PreviewCredit[]; selectedClaimNumber?: string; currentClaims: { number: string; termDate: string }[]; navigate: (page: string) => void }) {
  const selected = credits.find(credit => credit.claimNumber === selectedClaimNumber)
  const [pdfUrl, setPdfUrl] = useState('')
  useEffect(() => {
    if (!selected) return
    setPdfUrl('')
    const url = URL.createObjectURL(createDemoCreditPdf(selected))
    setPdfUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [selected?.claimNumber, selected?.reference, selected?.provided])
  const claimTarget = (number: string) => { const current = currentClaims.find(claim => claim.number === number); return current ? `claim:${current.termDate}` : `sample:${number}` }

  if (selected) {
    const termDate = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${selected.termDate}T12:00:00Z`))
    return <CreditDetailLayout reference={selected.reference} claimNumber={selected.claimNumber} termDate={termDate} provided={selected.provided} fileType="Fiktives PDF · 1 Seite" demo onClaim={() => navigate(claimTarget(selected.claimNumber))} download={pdfUrl ? { url: pdfUrl, filename: `Muster-Gutschrift-${selected.claimNumber}.pdf`, label: 'Muster-PDF herunterladen' } : undefined}>
      {pdfUrl ? <PdfPreview url={pdfUrl} title={`PDF-Vorschau der Beispielgutschrift ${selected.reference}`}/> : <p role="status">PDF-Vorschau wird geladen …</p>}
    </CreditDetailLayout>
  }

  return <>
    <PageTitle title="Gutschriften" subtitle="Alle fiktiven Gutschriften Ihrer Apotheke."/>
    {credits.length ? <section className="data-section"><div className="table-wrap"><table><thead><tr><th>Meldung</th><th>Referenz</th><th>Bereitgestellt</th><th>Aktionen</th></tr></thead><tbody>{credits.map(credit => <tr key={credit.reference}><td>{credit.claimNumber}</td><td>{credit.reference}</td><td>{credit.provided}</td><td><div className="claim-row-actions"><Button variant="secondary" onClick={() => navigate(claimTarget(credit.claimNumber))}>Meldung ansehen</Button><button className="text-button" onClick={() => navigate(`credits:${credit.claimNumber}`)}>Gutschrift <Icon name="arrow" size={15}/></button></div></td></tr>)}</tbody></table></div></section> : <Empty title="Noch keine Gutschriften" description="Sobald eine Gutschrift verfügbar ist, erscheint sie hier."/>}
  </>
}
