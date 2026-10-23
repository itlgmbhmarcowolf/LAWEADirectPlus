import { useId, useState } from 'react'
import { Icon } from './ui'
import { PdfPreview } from './PdfPreviewLoader'
import './claim-credit-entry.css'

export function ClaimCreditEntry({ reference, provided, download, downloadError = false }: { reference: string; provided?: string; download?: { url: string; filename: string; mime?: string }; downloadError?: boolean }) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const previewId = useId()
  return <div className="claim-credit-surface"><div className="claim-credit-entry">
    <span className="claim-credit-entry-icon" aria-hidden="true"><Icon name="file" size={22}/><small>{download?.mime?.startsWith('image/') ? 'BILD' : 'PDF'}</small></span>
    <span className="claim-credit-entry-copy"><strong>Gutschrift bereitgestellt</strong><span>{reference}{provided ? ` · ${provided}` : ''}</span></span>
    <span className="claim-credit-entry-actions">
      <button className="claim-credit-entry-action" type="button" onClick={() => setPreviewOpen(open => !open)} aria-controls={previewId} aria-expanded={previewOpen} aria-label={previewOpen ? `Vorschau der Gutschrift ${reference} schließen` : `Vorschau der Gutschrift ${reference} öffnen`} title={previewOpen ? 'Vorschau schließen' : 'PDF-Vorschau öffnen'}><Icon name={previewOpen ? 'eyeOff' : 'eye'} size={19}/></button>
      {download ? <a className="claim-credit-entry-action" href={download.url} download={download.filename} aria-label={`Gutschrift ${reference} herunterladen`} title="Gutschrift herunterladen"><Icon name="download" size={18}/></a> : <span className="claim-credit-entry-action claim-credit-entry-pending" aria-label={downloadError ? 'Gutschrift konnte nicht geladen werden' : 'Gutschrift wird geladen'} title={downloadError ? 'Download derzeit nicht verfügbar' : 'Gutschrift wird geladen'}><Icon name="download" size={18}/></span>}
    </span>
  </div><div id={previewId} className="claim-credit-inline-preview" hidden={!previewOpen}>
    {previewOpen ? download ? download.mime?.startsWith('image/') ? <img src={download.url} alt={`Gutschrift ${reference}`}/> : <PdfPreview url={download.url} title={`PDF-Vorschau der Gutschrift ${reference}`}/> : <p role="status">{downloadError ? 'Die Gutschrift konnte nicht geladen werden.' : 'Gutschrift wird geladen …'}</p> : null}
  </div></div>
}
