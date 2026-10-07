import { useEffect, useState } from 'react'
import type { PreviewCredit } from './PreviewApp'
import { Button, Empty, Icon, PageTitle } from './ui'
import { createDemoCreditPdf } from './demo-credit-pdf'
import { PdfPreview } from './PdfPreviewLoader'
import './credit-preview.css'

export function PreviewCredits({ credits, selectedClaimNumber, currentClaims, navigate }: { credits: PreviewCredit[]; selectedClaimNumber?: string; currentClaims: { number: string; termDate: string }[]; navigate: (page: string) => void }) {
  const selected = credits.find(credit => credit.claimNumber === selectedClaimNumber)
  const [pdfUrl, setPdfUrl] = useState('')
  useEffect(() => {
    if (!selected) return
    const url = URL.createObjectURL(createDemoCreditPdf(selected))
    setPdfUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [selected?.claimNumber, selected?.reference, selected?.provided])
  const claimTarget = (number: string) => { const current = currentClaims.find(claim => claim.number === number); return current ? `claim:${current.termDate}` : `sample:${number}` }
  return <>
    {selected ? <button className="back-link" onClick={() => navigate(claimTarget(selected.claimNumber))}>← Zurück zur Meldung</button> : null}
    <PageTitle title={selected ? 'Gutschrift' : 'Gutschriften'} subtitle={selected ? `Zur Meldung ${selected.claimNumber}` : 'Alle fiktiven Gutschriften Ihrer Apotheke.'}/>
    {selected ? <section className="data-section credit-detail"><div className="section-header"><h2>Beispielgutschrift</h2><span className="preview-count">Nur Demo</span></div><div className="term-summary"><div><span>Referenz</span><strong>{selected.reference}</strong></div><div><span>Bereitgestellt</span><strong>{selected.provided}</strong></div></div><p>Fiktives PDF-Muster für das Kundengespräch. Es wurde keine Zahlung ausgeführt.</p><div className="claim-row-actions">{pdfUrl ? <a className="button button-primary" href={pdfUrl} download={`Muster-Gutschrift-${selected.claimNumber}.pdf`}>Muster-PDF herunterladen <Icon name="download" size={18}/></a> : null}<button className="text-button" onClick={() => navigate(claimTarget(selected.claimNumber))}>Meldung öffnen <Icon name="arrow" size={15}/></button></div><div className="credit-pdf-heading"><h3>PDF-Vorschau</h3><span>Fiktives Dokument · 1 Seite</span></div>{pdfUrl ? <PdfPreview url={pdfUrl} title={`PDF-Vorschau der Beispielgutschrift ${selected.reference}`}/> : <p role="status">PDF-Vorschau wird geladen …</p>}</section> : credits.length ? <section className="data-section"><div className="table-wrap"><table><thead><tr><th>Meldung</th><th>Referenz</th><th>Bereitgestellt</th><th>Aktionen</th></tr></thead><tbody>{credits.map(credit => <tr key={credit.reference}><td>{credit.claimNumber}</td><td>{credit.reference}</td><td>{credit.provided}</td><td><div className="claim-row-actions"><Button variant="secondary" onClick={() => navigate(claimTarget(credit.claimNumber))}>Meldung ansehen</Button><button className="text-button" onClick={() => navigate(`credits:${credit.claimNumber}`)}>Gutschrift <Icon name="arrow" size={15}/></button></div></td></tr>)}</tbody></table></div></section> : <Empty title="Noch keine Gutschriften" description="Sobald eine Gutschrift verfügbar ist, erscheint sie hier."/>}
  </>
}
