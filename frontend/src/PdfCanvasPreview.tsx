import { useEffect, useRef, useState } from 'react'
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist'
import './credit-preview.css'

GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

export function PdfCanvasPreview({ url, title }: { url: string; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [width, setWidth] = useState(0)
  const [error, setError] = useState('')
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver(() => setWidth(element.clientWidth))
    observer.observe(element)
    setWidth(element.clientWidth)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!url) return
    let active = true
    const task = getDocument({ url })
    setError('')
    setPdf(null)
    setRendered(false)
    setPageNumber(1)
    task.promise.then(document => { if (active) setPdf(document) })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'PDF konnte nicht geladen werden.') })
    return () => { active = false; task.destroy() }
  }, [url])

  useEffect(() => {
    if (!pdf || !width || !canvasRef.current) return
    let active = true
    let renderTask: ReturnType<Awaited<ReturnType<PDFDocumentProxy['getPage']>>['render']> | null = null
    setRendered(false)
    pdf.getPage(pageNumber).then(page => {
      if (!active || !canvasRef.current) return
      const base = page.getViewport({ scale: 1 })
      const viewport = page.getViewport({ scale: Math.min(width / base.width, 2) })
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      const canvas = canvasRef.current
      canvas.width = Math.floor(viewport.width * ratio)
      canvas.height = Math.floor(viewport.height * ratio)
      canvas.style.width = `${viewport.width}px`
      canvas.style.height = `${viewport.height}px`
      renderTask = page.render({ canvas, viewport, transform: [ratio, 0, 0, ratio, 0, 0] })
      renderTask.promise.then(() => { if (active) setRendered(true) })
        .catch(reason => { if (active && reason?.name !== 'RenderingCancelledException') setError('PDF-Seite konnte nicht angezeigt werden.') })
    }).catch(() => { if (active) setError('PDF-Seite konnte nicht geladen werden.') })
    return () => { active = false; renderTask?.cancel() }
  }, [pdf, pageNumber, width])

  return <div className="credit-canvas-viewer">
    {pdf && pdf.numPages > 1 ? <div className="credit-pdf-pages"><button type="button" disabled={pageNumber === 1} onClick={() => setPageNumber(pageNumber - 1)}>Vorherige Seite</button><span>Seite {pageNumber} von {pdf.numPages}</span><button type="button" disabled={pageNumber === pdf.numPages} onClick={() => setPageNumber(pageNumber + 1)}>Nächste Seite</button></div> : null}
    <div className="credit-pdf-surface" ref={containerRef}>{error ? <p className="credit-pdf-error" role="alert">{error}</p> : <>{!rendered ? <p className="credit-pdf-loading" role="status">PDF-Vorschau wird geladen …</p> : null}<canvas ref={canvasRef} role="img" aria-label={title} hidden={!rendered}/></>}</div>
  </div>
}
