import type { PreviewCredit } from './PreviewApp'
import { Button, Empty, Icon, PageTitle } from './ui'

export function PreviewCredits({ credits, selectedClaimNumber, currentClaims, navigate, onShowDocument }: { credits: PreviewCredit[]; selectedClaimNumber?: string; currentClaims: { number: string; termDate: string }[]; navigate: (page: string) => void; onShowDocument: (credit: PreviewCredit) => void }) {
  const selected = credits.find(credit => credit.claimNumber === selectedClaimNumber)
  const claimTarget = (number: string) => { const current = currentClaims.find(claim => claim.number === number); return current ? `claim:${current.termDate}` : `sample:${number}` }
  return <>
    <PageTitle title="Gutschriften" subtitle="Jede Gutschrift führt direkt zur zugehörigen Meldung."/>
    {selected ? <div className="credit-context"><Icon name="check" size={20}/><div><strong>Gutschrift zu {selected.claimNumber}</strong><span>Referenz {selected.reference} · in dieser Vorschau fiktiv</span></div><button className="text-button" onClick={() => navigate(claimTarget(selected.claimNumber))}>Zur Meldung →</button></div> : null}
    {credits.length ? <section className="data-section"><div className="section-header"><div><h2>Beispielgutschriften</h2><p>Nur fiktive Belege für das Kundengespräch.</p></div><span className="preview-count">{credits.length} Beispiele</span></div><div className="table-wrap"><table><thead><tr><th>Vorgang</th><th>Gutschrift-Referenz</th><th>Bereitgestellt</th><th>Aktionen</th></tr></thead><tbody>{credits.map(credit => <tr key={credit.reference} className={credit.claimNumber === selectedClaimNumber ? 'credit-selected-row' : ''}><td><button className="table-link" onClick={() => navigate(claimTarget(credit.claimNumber))}>{credit.claimNumber}</button></td><td>{credit.reference}</td><td>{credit.provided}</td><td><div className="claim-row-actions"><button className="text-button" onClick={() => navigate(claimTarget(credit.claimNumber))}>Meldung ansehen</button><Button variant="secondary" onClick={() => onShowDocument(credit)}>Muster ansehen</Button></div></td></tr>)}</tbody></table></div></section> : <Empty title="Noch keine Gutschrift" description="Nach Bearbeitung einer Beispielmeldung erscheint die zugeordnete Gutschrift hier."/>}
  </>
}
