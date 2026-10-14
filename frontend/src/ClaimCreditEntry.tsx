import { Icon } from './ui'
import './claim-credit-entry.css'

export function ClaimCreditEntry({ reference, provided, onOpen }: { reference: string; provided?: string; onOpen: () => void }) {
  return <button className="claim-credit-entry" type="button" onClick={onOpen} aria-label={`Gutschrift ${reference} ansehen`}>
    <span className="claim-credit-entry-icon"><Icon name="credit" size={19}/></span>
    <span className="claim-credit-entry-copy"><strong>Gutschrift bereitgestellt</strong><span>{reference}{provided ? ` · ${provided}` : ''}</span></span>
    <span className="claim-credit-entry-action">Ansehen</span>
  </button>
}
