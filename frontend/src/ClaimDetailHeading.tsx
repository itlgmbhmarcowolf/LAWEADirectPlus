import type { Status } from './types'
import { StatusPill } from './ui'
import './claim-detail-heading.css'

export function ClaimDetailHeading({ title, reference, status, statusLabel }: { title: string; reference: string; status: Status; statusLabel?: string }) {
  return <header className="claim-detail-heading">
    <div className="claim-detail-heading-line"><h1>{title}</h1><StatusPill status={status} label={statusLabel}/></div>
    <p>{reference}</p>
  </header>
}
