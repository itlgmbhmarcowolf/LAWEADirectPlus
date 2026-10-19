import { useId, useState, type ReactNode } from 'react'
import { Icon, StatusPill } from './ui'
import './credit-preview.css'

type Download = { url: string; filename: string; label: string }

export function CreditDetailLayout({ reference, download, downloadError, fileType, onClaim, submission, children }: {
  reference: string
  claimNumber: string
  termDate?: string
  provided: string
  download?: Download
  downloadError?: boolean
  fileType: string
  onClaim: () => void
  submission?: ReactNode
  children: ReactNode
}) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewMounted, setPreviewMounted] = useState(false)
  const previewId = useId()
  return <article className="credit-page">
    <button className="credit-back" type="button" onClick={onClaim}>Zur Meldung</button>
    <header className="credit-page-header">
      <div className="credit-page-identity"><h1>Gutschrift</h1><StatusPill status="COMPLETED" label="Bereitgestellt"/><span className="credit-reference">{reference}</span></div>
      {download ? <a className="credit-download" href={download.url} download={download.filename}><Icon name="download" size={17}/>{download.label}</a> : downloadError ? null : <span className="credit-download-pending" role="status">Dokument wird geladen …</span>}
    </header>
    <div className="credit-content-frame">
      {submission ? <section className="credit-submission" aria-label="Angaben der Meldung">{submission}</section> : null}
      <section className="credit-document-panel" aria-label={`Dokumentvorschau (${fileType})`}>
        <div className="credit-preview-heading">
          <h2>Gutschrift</h2>
          <span className="credit-preview-toggle-meta">{fileType}</span>
          <button className="credit-preview-toggle" type="button" aria-controls={previewId} aria-expanded={previewOpen} aria-label={previewOpen ? 'Gutschrift einklappen' : 'Gutschrift ausklappen'} onClick={() => { if (!previewOpen) setPreviewMounted(true); setPreviewOpen(open => !open) }}>
            <Icon name={previewOpen ? 'eyeOff' : 'eye'} size={19}/>
            <span>{previewOpen ? 'Einklappen' : 'Ausklappen'}</span>
          </button>
        </div>
        <div id={previewId} hidden={!previewOpen}>{previewMounted ? children : null}</div>
      </section>
    </div>
  </article>
}
