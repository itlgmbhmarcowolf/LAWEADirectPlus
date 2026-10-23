import { useEffect, useId, useRef } from 'react'
import { Button, Icon } from './ui'
import './declaration-required-dialog.css'

export function DeclarationRequiredDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    return () => { if (dialog.open) dialog.close() }
  }, [])

  return <dialog ref={dialogRef} className="declaration-required-dialog" aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={event => { event.preventDefault(); onClose() }}>
    <div className="declaration-required-icon"><Icon name="alert" size={25}/></div>
    <h2 id={titleId}>Bitte Richtigkeit bestätigen</h2>
    <p id={descriptionId}>Bevor Sie die Meldung einreichen, bestätigen Sie bitte die Richtigkeit Ihrer Angaben zum Bestand am Stichtag.</p>
    <div className="declaration-required-actions"><Button autoFocus onClick={onClose}>Zur Bestätigung</Button></div>
  </dialog>
}
