import { useId, useState, type ReactNode } from 'react'
import { Icon, StatusPill } from './ui'
import './credit-preview.css'

type Download = { url: string; filename: string; label: string }

export function CreditDetailLayout({ reference, claimNumber, termDate, provided, download, downloadError, fileType, onClaim, submission, children }: {
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
  const [previewOpen, setPreviewOpen] = useState(true)
  const previewId = useId()
  return <article className="credit-page">
    <button className="credit-back" type="button" onClick={onClaim}>Zur Meldung</button>
    <header className="credit-page-header">
      <div className="credit-page-identity"><h1>Gutschrift</h1><StatusPill status="COMPLETED" label="Bereitgestellt"/><span className="credit-reference">{reference}</span></div>
      {download ? <a className="credit-download" href={download.url} download={download.filename}><Icon name="download" size={17}/>{download.label}</a> : downloadError ? null : <span className="credit-download-pending" role="status">Dokument wird geladen …</span>}
    </header>
    <div className="credit-page-grid">
      <aside className="credit-information" aria-label="Gutschriftinformationen">
        <h2>Informationen</h2>
        <dl>
          {termDate ? <div><dt>Stichtag</dt><dd>{termDate}</dd></div> : null}
          <div><dt>Meldung</dt><dd><button className="credit-claim-reference" type="button" onClick={onClaim} aria-label={`Meldung ${claimNumber} ansehen`}>{claimNumber}</button></dd></div>
          <div><dt>Bereitgestellt</dt><dd>{provided}</dd></div>
        </dl>
      </aside>
      {submission ? <section className="credit-submission" aria-label="Angaben der Meldung">{submission}</section> : null}
    </div>
    <section className="credit-document-panel" aria-label={`Dokumentvorschau (${fileType})`}>
        <button className="credit-preview-toggle" type="button" aria-controls={previewId} aria-expanded={previewOpen} aria-label={previewOpen ? 'Dokumentvorschau einklappen' : 'Dokumentvorschau ausklappen'} onClick={() => setPreviewOpen(open => !open)}>
          <span>Vorschau</span><span className="credit-preview-toggle-meta">{fileType}</span><Icon name="chevron" size={18}/>
        </button>
        <div id={previewId} hidden={!previewOpen}>{children}</div>
      </section>
  </article>
}
