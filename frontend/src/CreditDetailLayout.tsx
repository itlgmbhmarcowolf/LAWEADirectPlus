import { useId, useState, type ReactNode } from 'react'
import { Icon, StatusPill } from './ui'
import './credit-preview.css'

type Download = { url: string; filename: string; label: string }

export function CreditDetailLayout({ reference, claimNumber, termDate, provided, download, downloadError, demo, fileType, onClaim, children }: {
  reference: string
  claimNumber: string
  termDate?: string
  provided: string
  download?: Download
  downloadError?: boolean
  demo?: boolean
  fileType: string
  onClaim: () => void
  children: ReactNode
}) {
  const [previewOpen, setPreviewOpen] = useState(true)
  const previewId = useId()
  return <article className="credit-page">
    <button className="credit-back" type="button" onClick={onClaim}><Icon name="arrow" size={16}/> Zur Meldung</button>
    <header className="credit-page-header">
      <div className="credit-page-identity"><h1>Gutschrift</h1><StatusPill status="COMPLETED" label="Bereitgestellt"/><span className="credit-reference">{reference}</span></div>
      {download ? <a className="credit-download" href={download.url} download={download.filename}><Icon name="download" size={17}/>{download.label}</a> : downloadError ? null : <span className="credit-download-pending" role="status">Dokument wird geladen …</span>}
    </header>
    <div className="credit-page-grid">
      <aside className="credit-information" aria-label="Gutschriftinformationen">
        <h2>Informationen</h2>
        <dl>
          {termDate ? <div><dt>Stichtag</dt><dd>{termDate}</dd></div> : null}
          <div><dt>Meldung</dt><dd>{claimNumber}</dd></div>
          <div><dt>Bereitgestellt</dt><dd>{provided}</dd></div>
        </dl>
        <button className="credit-claim-link" type="button" onClick={onClaim}>Meldung ansehen <Icon name="arrow" size={16}/></button>
        {demo ? <p className="credit-demo-note"><Icon name="shield" size={18}/><span><strong>Fiktive Demo · Keine Zahlung</strong><small>Dieses Dokument dient ausschließlich zu Demonstrationszwecken.</small></span></p> : null}
      </aside>
      <section className="credit-document-panel" aria-label={`Dokumentvorschau (${fileType})`}>
        <button className="credit-preview-toggle" type="button" aria-controls={previewId} aria-expanded={previewOpen} aria-label={previewOpen ? 'Dokumentvorschau einklappen' : 'Dokumentvorschau ausklappen'} onClick={() => setPreviewOpen(open => !open)}>
          <span>Vorschau</span><span className="credit-preview-toggle-meta">{fileType}</span><Icon name="chevron" size={18}/>
        </button>
        <div id={previewId} hidden={!previewOpen}>{children}</div>
      </section>
    </div>
  </article>
}
