import { lazy, Suspense } from 'react'

const PdfCanvasPreview = lazy(() => import('./PdfCanvasPreview').then(module => ({ default: module.PdfCanvasPreview })))

export function PdfPreview({ url, title }: { url: string; title: string }) {
  return <Suspense fallback={<p role="status">PDF-Vorschau wird geladen …</p>}><PdfCanvasPreview url={url} title={title}/></Suspense>
}
