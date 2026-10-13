import type { ReactNode } from 'react'
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
  return <article className="credit-page">
    <button className="credit-back" type="button" onClick={onClaim}><Icon name="arrow" size={16}/> Zur Meldung</button>
    <header className="credit-page-header">
      <div className="credit-page-identity"><h1>Gutschrift</h1><StatusPill status="COMPLETED" label="Bereitgestellt"/><span className="credit-reference">{reference}</span></div>
      {download ? <a className="credit-download" href={download.url} download={download.filename}><Icon name="download" size={17}/>{download.label}</a> : downloadError ? null : <span className="credit-download-pending" role="status">Dokument wird geladen …</span>}
    </header>
    <div className="credit-page-grid">
      <section className="credit-document-panel" aria-label="Dokumentvorschau">
        <div className="credit-document-label"><h2>Dokumentvorschau</h2><span>{fileType}</span></div>
        {children}
      </section>
      <aside className="credit-information" aria-label="Gutschriftinformationen">
        <h2>Informationen</h2>
        <dl>
          {termDate ? <div><dt>Stichtag</dt><dd>{termDate}</dd></div> : null}
          <div><dt>Meldung</dt><dd>{claimNumber}</dd></div>
          <div><dt>Bereitgestellt</dt><dd>{provided}</dd></div>
        </dl>
        <button className="credit-claim-link" type="button" onClick={onClaim}>Meldung ansehen <Icon name="arrow" size={16}/></button>
        {demo ? <p className="credit-demo-note"><Icon name="shield" size={17}/><span>Fiktive Demo · Keine Zahlung</span></p> : null}
      </aside>
    </div>
  </article>
}
