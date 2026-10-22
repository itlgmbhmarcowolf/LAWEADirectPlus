import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from './ui'
import './list-appearance.css'

export type ListAppearance = { rowHeight: number; fontSize: number }

export function useListAppearance(storageKey: string, defaults: ListAppearance) {
  const [settings, setSettings] = useState<ListAppearance>(() => {
    if (typeof window === 'undefined') return defaults
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) || 'null') as Partial<ListAppearance> | null
      return {
        rowHeight: typeof saved?.rowHeight === 'number' && saved.rowHeight >= 48 && saved.rowHeight <= 88 ? saved.rowHeight : defaults.rowHeight,
        fontSize: typeof saved?.fontSize === 'number' && saved.fontSize >= 14 && saved.fontSize <= 20 ? saved.fontSize : defaults.fontSize,
      }
    } catch {
      return defaults
    }
  })
  useEffect(() => {
    try { window.localStorage.setItem(storageKey, JSON.stringify(settings)) } catch { /* Local preferences may be unavailable. */ }
  }, [storageKey, settings])
  return [settings, setSettings] as const
}

export function ListAppearanceSettings({ label, settings, defaults, onChange, open, onOpenChange }: {
  label: string
  settings: ListAppearance
  defaults: ListAppearance
  onChange: (settings: ListAppearance) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const panelId = useId()
  const rowHeightId = useId()
  const fontSizeId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) onOpenChange(false) }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { onOpenChange(false); triggerRef.current?.focus() } }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [open, onOpenChange])
  return <div className="list-appearance" ref={rootRef}>
    <button ref={triggerRef} className="list-appearance-trigger" type="button" aria-label={label} title={label} aria-expanded={open} aria-controls={panelId} onClick={() => onOpenChange(!open)}><Icon name="gear" size={20}/></button>
    {open ? <div className="list-appearance-panel" id={panelId} role="dialog" aria-label={label}>
      <div className="list-appearance-title"><h3>Listenansicht</h3><button type="button" aria-label="Einstellungen schließen" onClick={() => { onOpenChange(false); triggerRef.current?.focus() }}><Icon name="close" size={17}/></button></div>
      <label htmlFor={rowHeightId}>Zeilenhöhe <output htmlFor={rowHeightId}>{settings.rowHeight} px</output></label>
      <input id={rowHeightId} type="range" min="48" max="88" step="4" value={settings.rowHeight} onChange={event => onChange({ ...settings, rowHeight: Number(event.target.value) })}/>
      <div className="list-appearance-scale"><span>Kompakt</span><span>Großzügig</span></div>
      <label htmlFor={fontSizeId}>Schriftgröße <output htmlFor={fontSizeId}>{settings.fontSize} px</output></label>
      <input id={fontSizeId} type="range" min="14" max="20" step="1" value={settings.fontSize} onChange={event => onChange({ ...settings, fontSize: Number(event.target.value) })}/>
      <div className="list-appearance-scale"><span>Kleiner</span><span>Größer</span></div>
      <div className="list-appearance-footer"><button type="button" onClick={() => onChange(defaults)}>Zurücksetzen</button></div>
    </div> : null}
  </div>
}
