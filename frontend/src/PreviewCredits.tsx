import { useEffect, useState } from 'react'
import type { PreviewClaim, PreviewCredit } from './PreviewApp'
import { Button, Empty, Icon, PageTitle } from './ui'
import { createDemoCreditPdf } from './demo-credit-pdf'
import { createDemoEvidencePdf } from './demo-evidence-pdf'
import { CreditDetailLayout } from './CreditDetailLayout'
import { PdfPreview } from './PdfPreviewLoader'
import { sampleClaimDetail, sampleClaims } from './sample-claim-data'
import { previewProductNames } from './PreviewClaimEditor'

export function PreviewCredits({ credits, selectedClaimNumber, currentClaims, navigate }: { credits: PreviewCredit[]; selectedClaimNumber?: string; currentClaims: { number: string; termDate: string; claim: PreviewClaim }[]; navigate: (page: string) => void }) {
  const selected = credits.find(credit => credit.claimNumber === selectedClaimNumber)
  const currentEvidenceFile = currentClaims.find(claim => claim.number === selectedClaimNumber)?.claim.evidenceFile
  const [pdfUrl, setPdfUrl] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  useEffect(() => {
    if (!selected) return
    setPdfUrl('')
    const sample = sampleClaims.find(claim => claim.number === selected.claimNumber)
    const detail = sample ? sampleClaimDetail(sample) : undefined
    const url = URL.createObjectURL(createDemoCreditPdf({ ...selected, positions: detail?.positions }))
    setPdfUrl(url)
    const proof = sample && detail ? URL.createObjectURL(createDemoEvidencePdf(sample, detail)) : currentEvidenceFile ? URL.createObjectURL(currentEvidenceFile) : ''
    setEvidenceUrl(proof)
    return () => { URL.revokeObjectURL(url); if (proof) URL.revokeObjectURL(proof) }
  }, [selected?.claimNumber, selected?.reference, selected?.provided, selected?.termDate, currentEvidenceFile])
  const claimTarget = (number: string) => { const current = currentClaims.find(claim => claim.number === number); return current ? `claim:${current.termDate}` : `sample:${number}` }

  if (selected) {
    const termDate = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${selected.termDate}T12:00:00Z`))
    const sample = sampleClaims.find(claim => claim.number === selected.claimNumber)
    const detail = sample ? sampleClaimDetail(sample) : undefined
    const current = currentClaims.find(claim => claim.number === selected.claimNumber)
    const positions = detail?.positions || current?.claim.items.map(item => ({ pzn: item.pzn, article: previewProductNames[item.pzn] || '–', charge: item.charge, quantity: Number(item.quantity) })) || []
    const proofName = detail?.evidenceName || current?.claim.evidenceFile?.name
    const proofUrl = evidenceUrl
    return <CreditDetailLayout key={selected.reference} reference={selected.reference} claimNumber={selected.claimNumber} termDate={termDate} provided={selected.provided} fileType="Fiktives PDF · 1 Seite" onClaim={() => navigate(claimTarget(selected.claimNumber))} download={pdfUrl ? { url: pdfUrl, filename: `Muster-Gutschrift-${selected.claimNumber}.pdf`, label: 'Muster-PDF herunterladen' } : undefined} submission={<><h2>Gemeldete Positionen{detail ? ` · Revision ${detail.revision}` : ''}</h2><div className="table-wrap"><table><thead><tr><th>PZN</th><th>Artikel</th><th>Charge</th><th>Bestand zum {termDate}</th></tr></thead><tbody>{positions.map((position, index) => <tr key={`${position.pzn}-${index}`}><td>{position.pzn}</td><td>{position.article}</td><td>{position.charge}</td><td>{position.quantity} Packungen</td></tr>)}</tbody></table></div><div className="credit-evidence-row"><Icon name="file" size={18}/><span>{proofName || 'Kein Nachweis vorhanden'}</span>{proofUrl && proofName ? <a href={proofUrl} download={proofName} aria-label={`${proofName} herunterladen`}><Icon name="download" size={17}/> Nachweis</a> : null}</div></>}>
      {pdfUrl ? <PdfPreview url={pdfUrl} title={`PDF-Vorschau der Beispielgutschrift ${selected.reference}`}/> : <p role="status">PDF-Vorschau wird geladen …</p>}
    </CreditDetailLayout>
  }

  return <>
    <PageTitle title="Gutschriften" subtitle="Alle fiktiven Gutschriften Ihrer Apotheke."/>
    {credits.length ? <section className="data-section"><div className="table-wrap"><table><thead><tr><th>Meldung</th><th>Referenz</th><th>Bereitgestellt</th><th>Aktionen</th></tr></thead><tbody>{credits.map(credit => <tr key={credit.reference}><td>{credit.claimNumber}</td><td>{credit.reference}</td><td>{credit.provided}</td><td><div className="claim-row-actions"><Button variant="secondary" onClick={() => navigate(claimTarget(credit.claimNumber))}>Meldung ansehen</Button><button className="text-button" onClick={() => navigate(`credits:${credit.claimNumber}`)}>Gutschrift <Icon name="arrow" size={15}/></button></div></td></tr>)}</tbody></table></div></section> : <Empty title="Noch keine Gutschriften" description="Sobald eine Gutschrift verfügbar ist, erscheint sie hier."/>}
  </>
}
