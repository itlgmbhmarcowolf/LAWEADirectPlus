import { useEffect, useState } from 'react'
import { api, post, setCsrf } from './api'
import type { Bootstrap, User } from './types'
import { Auth } from './Auth'
import { Shell, Icon } from './ui'
import { PharmacyDashboard, ClaimsPage, ClaimEditor, CreditsPage, HelpPage, Assistant } from './Pharmacy'
import { MembersPage } from './Members'
import { ReviewPage, RegistrationsPage, FinancePage, AuditPage } from './Staff'

export function App() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<Bootstrap | null>(null)
  const [page, setPage] = useState('dashboard')
  const [error, setError] = useState('')
  const refresh = async () => { const fresh = await api<Bootstrap>('/bootstrap'); setData(fresh); return fresh }
  useEffect(() => { api<{ user: User | null; csrf?: string }>('/session').then(async s => {
    if (s.user && s.csrf) { setCsrf(s.csrf); const fresh = await refresh(); setPage(fresh.user.role.startsWith('PHARMACY') ? 'dashboard' : fresh.user.role === 'REVIEWER' ? 'review' : 'finance') }
  }).catch(e => setError(e instanceof Error ? e.message : 'Verbindung fehlgeschlagen.')).finally(() => setLoading(false)) }, [])
  const authenticated = async (user: User, token: string) => { setCsrf(token); const fresh = await refresh(); setPage(user.role.startsWith('PHARMACY') ? 'dashboard' : user.role === 'REVIEWER' ? 'review' : 'finance'); setData(fresh) }
  const logout = async () => { try { await post('/auth/logout', {}) } finally { setCsrf(null); setData(null); setPage('dashboard') } }
  if (loading) return <div className="app-loading"><div className="loading-logo">LAWEA direkt Plus</div><p>Portal wird geladen …</p></div>
  if (!data) return <>{error ? <div className="connection-error">{error}</div> : null}<Auth onAuthenticated={authenticated}/></>

  const pharmacy = data.user.role.startsWith('PHARMACY')
  let content
  if (pharmacy) {
    if (page === 'dashboard') content = <PharmacyDashboard data={data} navigate={setPage} refresh={refresh}/>
    else if (page === 'claims') content = <ClaimsPage data={data} navigate={setPage} refresh={refresh}/>
    else if (page.startsWith('claim:')) content = <ClaimEditor key={page} id={page.slice(6)} data={data} navigate={setPage} refresh={refresh}/>
    else if (page === 'members') content = <MembersPage data={data} refresh={refresh}/>
    else if (page === 'credits') content = <CreditsPage data={data}/>
    else content = <HelpPage />
  } else if (data.user.role === 'REVIEWER') {
    if (page === 'registrations') content = <RegistrationsPage data={data} refresh={refresh}/>
    else if (page === 'audit') content = <AuditPage />
    else content = <ReviewPage data={data} refresh={refresh}/>
  } else {
    content = page === 'audit' ? <AuditPage/> : <FinancePage data={data} refresh={refresh}/>
  }
  const aside = pharmacy && (page === 'dashboard' || page.startsWith('claim:')) ? <Assistant page={page} data={data}/> : undefined
  return <Shell user={data.user} page={page} onNavigate={setPage} onLogout={logout} aside={aside}>{content}<footer className="content-footer"><Icon name="shield" size={15}/> Ihre Daten sind nur für berechtigte Benutzer sichtbar. <span>LAWEA direkt Plus · Demo</span></footer></Shell>
}
