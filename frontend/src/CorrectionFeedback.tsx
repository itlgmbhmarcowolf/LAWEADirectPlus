import type { ReactNode } from 'react'
import { Icon } from './ui'
import './correction-feedback.css'

type Props = {
  reason: string | null | undefined
  deadline?: string
  expired?: boolean
  action?: ReactNode
}

export function CorrectionFeedback({ reason, deadline, expired = false, action }: Props) {
  return <div className={`correction-feedback${expired ? ' correction-feedback-expired' : ''}`} role="group" aria-label={deadline ? 'Rückmeldung und Korrekturfrist' : 'Rückmeldung zur früheren Ablehnung'}>
    <div className="correction-feedback-reason">
      <div className="correction-feedback-heading"><span className="correction-feedback-icon"><Icon name="alert" size={20}/></span><span>Rückmeldung zur Meldung</span></div>
      <span className="correction-feedback-label">Grund der Ablehnung</span>
      <p>{reason || 'Es wurde kein Korrekturhinweis hinterlegt.'}</p>
    </div>
    {deadline || action ? <div className="correction-feedback-next">
      {deadline ? <div className="correction-feedback-deadline"><span><Icon name="calendar" size={17}/>{expired ? 'Korrekturfrist abgelaufen am' : 'Erneut einreichen bis'}</span><strong>{deadline}</strong></div> : null}
      {action ? <div className="correction-feedback-action">{action}</div> : null}
    </div> : null}
  </div>
}
