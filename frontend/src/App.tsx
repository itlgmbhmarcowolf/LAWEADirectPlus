import { useEffect, useState } from 'react'
import { api, post, setCsrf } from './api'
import type { Bootstrap, User } from './types'
import { Auth } from './Auth'
import { Shell, Icon, Notice } from './ui'
import { PharmacyDashboard, ClaimEditor, CreditsPage, HelpPage } from './Pharmacy'
import { MembersPage } from './Members'
import { ReviewPage, RegistrationsPage, FinancePage, AuditPage } from './Staff'
import { AccountSettings } from './AccountSettings'
import { initialDashboardView } from './PreviewDashboard'
import { useBrowserPage } from './useBrowserPage'

export function App() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<Bootstrap | null>(null)
  const { page, navigate, resetPage } = useBrowserPage()
  const [dashboardView, setDashboardView] = useState(() => initialDashboardView(false))
  const [error, setError] = useState('')
  const [submittedNotice, setSubmittedNotice] = useState('')
  useEffect(() => { if (page !== 'dashboard') setSubmittedNotice('') }, [page])
  const refresh = async () => { const fresh = await api<Bootstrap>('/bootstrap'); setData(fresh); return fresh }
  useEffect(() => { api<{ user: User | null; csrf?: string }>('/session').then(async s => {
    if (s.user && s.csrf) { setCsrf(s.csrf); const fresh = await refresh(); resetPage(fresh.user.role.startsWith('PHARMACY') ? 'dashboard' : fresh.user.role === 'REVIEWER' ? 'review' : 'finance') }
  }).catch(e => setError(e instanceof Error ? e.message : 'Verbindung fehlgeschlagen.')).finally(() => setLoading(false)) }, [])
  const authenticated = async (user: User, token: string) => { setCsrf(token); const fresh = await refresh(); resetPage(user.role.startsWith('PHARMACY') ? 'dashboard' : user.role === 'REVIEWER' ? 'review' : 'finance'); setData(fresh) }
  const logout = async () => {
    try {
      await post('/auth/logout', {})
      setCsrf(null); setData(null); resetPage(); setDashboardView(initialDashboardView(false)); setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Abmelden fehlgeschlagen. Bitte erneut versuchen.')
    }
  }
  if (loading) return <div className="app-loading"><div className="loading-logo">LAWEA direkt Plus</div><p>Portal wird geladen …</p></div>
  if (!data) return <>{error ? <div className="connection-error">{error}</div> : null}<Auth onAuthenticated={authenticated}/></>

  const pharmacy = data.user.role.startsWith('PHARMACY')
  let content
  if (page === 'account') content = <AccountSettings user={data.user} onSave={async name => { await post('/account/name', { name }); await refresh() }} onChangePassword={async (currentPassword, newPassword, newPasswordAgain) => { await post('/account/password', { currentPassword, newPassword, newPasswordAgain }) }} emailEditable={false} preview={false}/>
  else if (pharmacy) {
    if (page === 'dashboard' || page === 'claims') content = <>{submittedNotice ? <Notice tone="success">{submittedNotice}</Notice> : null}<PharmacyDashboard data={data} navigate={navigate} refresh={refresh} view={dashboardView} onViewChange={setDashboardView}/></>
    else if (page.startsWith('claim:')) content = <ClaimEditor key={page} id={page.slice(6)} data={data} navigate={navigate} refresh={refresh} onSubmitted={number => { setSubmittedNotice(`Meldung ${number} wurde eingereicht. Sie sehen den Status in der Übersicht.`); navigate('dashboard') }}/>
    else if (page === 'members') content = <MembersPage data={data} refresh={refresh}/>
    else if (page === 'credits' || page.startsWith('credits:')) content = <CreditsPage data={data} navigate={navigate} selectedClaimId={page.startsWith('credits:') ? page.slice(8) : undefined}/>
    else content = <HelpPage />
  } else if (data.user.role === 'REVIEWER') {
    if (page === 'registrations') content = <RegistrationsPage data={data} refresh={refresh}/>
    else if (page === 'audit') content = <AuditPage />
    else content = <ReviewPage data={data} refresh={refresh}/>
  } else {
    content = page === 'audit' ? <AuditPage/> : <FinancePage data={data} refresh={refresh}/>
  }
  return <Shell user={data.user} page={page} demo={data.demo} onNavigate={navigate} onLogout={logout} account={{ onSettings: () => navigate('account'), onMembers: data.user.role === 'PHARMACY_ADMIN' ? () => navigate('members') : undefined }}>{error ? <div className="connection-error" role="alert">{error}</div> : null}{content}<footer className="content-footer"><Icon name="shield" size={15}/> Ihre Daten sind nur für berechtigte Benutzer sichtbar. <span>LAWEA direkt Plus · Demo</span></footer></Shell>
}
