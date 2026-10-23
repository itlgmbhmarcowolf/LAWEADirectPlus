import { useEffect, useRef, useState } from 'react'
import { Icon } from './ui'
import './evidence-files.css'

const acceptedEvidenceExtensions = /\.(pdf|jpe?g|png|xlsx?|csv)$/i
const maxDemoFileSize = 5 * 1024 * 1024 // Demo-Grenze; produktive Grenze ist noch offen.

export function fileSizeLabel(size: number) {
  return size < 1024 * 1024 ? `${Math.max(1, Math.ceil(size / 1024))} KB` : `${(size / 1024 / 1024).toLocaleString('de-DE', { maximumFractionDigits: 1 })} MB`
}

export function EvidenceFiles({ files, onChange, onError, error, errorId, showError, label = 'Nachweise hinzufügen' }: {
  files: File[]
  onChange: (files: File[]) => void
  onError: (error: string) => void
  error?: string
  errorId?: string
  showError?: boolean
  label?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const addFiles = (selection: FileList | File[]) => {
    const incoming = Array.from(selection)
    // In der statischen Vorschau kann nur die Endung geprüft werden; die lokale API prüft zusätzlich den Dateiinhalt.
    const valid = incoming.filter(file => acceptedEvidenceExtensions.test(file.name) && file.size <= maxDemoFileSize)
    const rejected = incoming.length - valid.length
    if (valid.length) onChange([...files, ...valid])
    onError(rejected ? `${rejected} ${rejected === 1 ? 'Datei wurde' : 'Dateien wurden'} nicht übernommen. Erlaubt sind PDF, JPG, PNG, XLS, XLSX und CSV mit je höchstens 5 MB.` : '')
  }
  return <div className="evidence-files">
    <input ref={inputRef} className="evidence-files-input" type="file" accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx,.csv" multiple aria-label="Mehrere Nachweise auswählen" onChange={event => { if (event.target.files) addFiles(event.target.files); event.target.value = '' }}/>
    <button type="button" className={`evidence-dropzone${dragging ? ' is-dragging' : ''}`} aria-invalid={showError && !!error} aria-describedby={showError && error ? errorId : undefined} onClick={() => inputRef.current?.click()} onDragEnter={event => { event.preventDefault(); setDragging(true) }} onDragOver={event => event.preventDefault()} onDragLeave={event => { event.preventDefault(); setDragging(false) }} onDrop={event => { event.preventDefault(); setDragging(false); if (event.dataTransfer.files.length) addFiles(event.dataTransfer.files) }}>
      <span className="evidence-dropzone-icon"><Icon name="upload" size={22}/></span>
      <span className="evidence-dropzone-copy"><strong>{label}</strong><small>Mehrere Dateien wählen oder hier ablegen</small></span>
      <span className="evidence-dropzone-plus" aria-hidden="true"><Icon name="plus" size={19}/></span>
    </button>
    <p className="evidence-format-note">PDF, JPG, PNG, XLS, XLSX, CSV · je höchstens 5 MB</p>
    {showError && error ? <span className="evidence-files-error" id={errorId} role="alert">{error}</span> : null}
    {files.length ? <div className="evidence-selected" aria-live="polite"><div className="evidence-selected-heading"><strong>Ausgewählte Nachweise</strong><span>{files.length}</span></div><ul>{files.map((file, index) => <li key={`${file.name}-${file.size}-${file.lastModified}-${index}`}><span className="evidence-file-icon"><Icon name="file" size={19}/></span><span className="evidence-file-info"><strong title={file.name}>{file.name}</strong><small>{fileSizeLabel(file.size)}</small></span><button type="button" className="evidence-file-remove" aria-label={`${file.name} entfernen`} onClick={() => { onChange(files.filter((_, current) => current !== index)); onError('') }}><Icon name="trash" size={17}/></button></li>)}</ul></div> : null}
  </div>
}

export function useEvidenceUrls(files: File[]) {
  const [urls, setUrls] = useState<string[]>([])
  useEffect(() => {
    const next = files.map(file => URL.createObjectURL(file))
    setUrls(next)
    return () => next.forEach(url => URL.revokeObjectURL(url))
  }, [files])
  return urls
}
