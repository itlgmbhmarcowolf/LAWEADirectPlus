import { useId, useState, type CSSProperties, type ReactNode } from 'react'
import { Icon, StatusPill } from './ui'
import { ListAppearanceSettings, useListAppearance, type ListAppearance } from './ListAppearanceSettings'
import './credit-preview.css'

type Download = { url: string; filename: string; label: string }
const listSettingsKey = 'lawea-credit-list-settings-v1'
const defaultListSettings: ListAppearance = { rowHeight: 60, fontSize: 16 }

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
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [listSettings, setListSettings] = useListAppearance(listSettingsKey, defaultListSettings)
  const previewId = useId()
  const listStyle = { '--credit-row-height': `${listSettings.rowHeight}px`, '--credit-font-size': `${listSettings.fontSize}px`, '--credit-card-padding': `${16 + Math.round((listSettings.rowHeight - 48) / 4)}px` } as CSSProperties
  return <article className="credit-page">
    <button className="credit-back" type="button" onClick={onClaim}>Zur Meldung</button>
    <header className="credit-page-header">
      <div className="credit-page-identity"><h1>Gutschrift</h1><StatusPill status="COMPLETED" label="Bereitgestellt"/><span className="credit-reference">{reference}</span></div>
      {download ? <a className="credit-download" href={download.url} download={download.filename}><Icon name="download" size={17}/>{download.label}</a> : downloadError ? null : <span className="credit-download-pending" role="status">Dokument wird geladen …</span>}
    </header>
    <div className={`credit-content-frame${settingsOpen ? ' credit-settings-open' : ''}`}>
      {submission ? <section className="credit-submission" aria-label="Angaben der Meldung" style={listStyle}>
        <div className="credit-list-settings"><ListAppearanceSettings label="Gutschriftliste einstellen" settings={listSettings} defaults={defaultListSettings} onChange={setListSettings} open={settingsOpen} onOpenChange={setSettingsOpen}/></div>
        {submission}
      </section> : null}
      <section className="credit-document-panel" aria-label={`Dokumentvorschau (${fileType})`}>
        <div className="credit-preview-heading">
          <h2>Gutschrift</h2>
          <span className="credit-preview-toggle-meta">{fileType}</span>
          <button className="credit-preview-toggle" type="button" aria-controls={previewId} aria-expanded={previewOpen} aria-label={previewOpen ? 'Gutschrift einklappen' : 'Gutschrift ausklappen'} onClick={() => { if (!previewOpen) setPreviewMounted(true); setPreviewOpen(open => !open) }}>
            <Icon name={previewOpen ? 'eyeOff' : 'eye'} size={19}/>
          </button>
        </div>
        <div id={previewId} hidden={!previewOpen}>{previewMounted ? children : null}</div>
      </section>
    </div>
  </article>
}
