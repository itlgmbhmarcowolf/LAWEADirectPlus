import { useEffect, useId, useRef } from 'react'
import { Button, Icon } from './ui'
import './discard-draft-dialog.css'

type Props = {
  term: string
  demo?: boolean
  busy?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function DiscardDraftDialog({ term, demo = false, busy = false, onCancel, onConfirm }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    return () => { if (dialog.open) dialog.close() }
  }, [])

  return <dialog ref={dialogRef} className="discard-draft-dialog" aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={event => { event.preventDefault(); if (!busy) onCancel() }}>
    <div className="discard-draft-icon"><Icon name="trash" size={24}/></div>
    <h2 id={titleId}>Entwurf verwerfen?</h2>
    <p id={descriptionId}>Der Entwurf zum Stichtag <strong>{term}</strong> wird entfernt. Diese Aktion kann nicht rückgängig gemacht werden.{demo ? ' In dieser Vorschau betrifft das nur Ihre Browsersitzung.' : ''}</p>
    <div className="discard-draft-actions">
      <Button variant="secondary" autoFocus disabled={busy} onClick={onCancel}>Abbrechen</Button>
      <Button variant="danger" disabled={busy} onClick={onConfirm}>{busy ? 'Wird verworfen …' : 'Entwurf verwerfen'}</Button>
    </div>
  </dialog>
}
