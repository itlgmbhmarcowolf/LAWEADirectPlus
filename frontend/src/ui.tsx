import { useEffect, useRef, useState, type ReactNode, type ButtonHTMLAttributes } from 'react'
import type { Status, User } from './types'
import { statusLabel } from './types'
import './account.css'

type IconName = 'home' | 'file' | 'users' | 'credit' | 'help' | 'shield' | 'logout' | 'arrow' | 'chevron' | 'calendar' | 'check' | 'alert' | 'plus' | 'upload' | 'trash' | 'search' | 'menu' | 'clock' | 'download' | 'settings' | 'mail' | 'more' | 'close' | 'userPlus' | 'refresh' | 'unlock'
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const }
  const path: Record<IconName, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-8h6v8"/></>,
    file: <><path d="M6 3h8l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M14 3v5h5M8 12h8M8 16h8"/></>,
    users: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v1"/></>,
    credit: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/></>,
    help: <><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .7-1.5 1.1-1.5 2.5M12 17h.01"/></>,
    shield: <><path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5z"/><path d="m8.5 12 2.5 2.5 4.5-5"/></>,
    logout: <><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5M14 7l5 5-5 5M8 12h11"/></>,
    arrow: <><path d="M4 12h16m-6-6 6 6-6 6"/></>,
    chevron: <path d="m6 9 6 6 6-6"/>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></>,
    check: <><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></>,
    alert: <><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 17h.01"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    upload: <><path d="M12 16V3m-5 5 5-5 5 5M4 16v4h16v-4"/></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"/></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M4 12h2m12 0h2M12 4v2m0 12v2M6.3 6.3l1.4 1.4m8.6 8.6 1.4 1.4m0-11.4-1.4 1.4M7.7 16.3l-1.4 1.4"/></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></>,
    more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    close: <path d="M5 5 19 19M19 5 5 19"/>,
    userPlus: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M19 8v8M15 12h8"/></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6.5 9A7 7 0 0 1 19 8l1 4M4 12l1 4a7 7 0 0 0 12.5-1"/></>,
    unlock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M9 10V7a4 4 0 0 1 7-2.6"/></>
  }
  return <svg {...common}>{path[name]}</svg>
}

export function Button({ children, variant = 'primary', icon, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'quiet' | 'danger'; icon?: IconName }) {
  return <button {...props} className={`button button-${variant} ${props.className || ''}`.trim()}>{children}{icon ? <Icon name={icon} size={18}/> : null}</button>
}
export function StatusPill({ status, label }: { status: Status; label?: string }) { return <span className={`status status-${status.toLowerCase()}`}><span className="status-dot"/>{label || statusLabel[status]}</span> }
export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'success' | 'error' | 'warning' }) { return <div className={`notice notice-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{children}</div> }
export function Empty({ title, description, action }: { title: string; description: string; action?: ReactNode }) { return <div className="empty"><div className="empty-icon"><Icon name="file" size={27}/></div><h3>{title}</h3><p>{description}</p>{action}</div> }
export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) { return <header className="page-title"><div><h1>{title}</h1>{subtitle ? <p>{subtitle}</p> : null}</div>{action}</header> }

type AccountControls = { onSettings: () => void; onMembers?: () => void; switchable?: { id: string; name: string; email: string }[]; onSwitch?: (id: string) => void; viewingAs?: string; onReturn?: () => void }

export function Shell({ user, page, demo = false, onNavigate, onLogout, children, aside, account }: { user: User; page: string; demo?: boolean; onNavigate: (page: string) => void; onLogout: () => void; children: ReactNode; aside?: ReactNode; account?: AccountControls }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!accountOpen) return
    const outside = (event: PointerEvent) => { if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false) }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setAccountOpen(false) }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [accountOpen])
  const pharmacy = user.role.startsWith('PHARMACY')
  const links: { key: string; label: string; icon: IconName }[] = pharmacy ? [
    { key: 'dashboard', label: 'Übersicht', icon: 'home' },
    { key: 'claims', label: 'Meldungen', icon: 'file' },
    { key: 'credits', label: 'Gutschriften', icon: 'credit' },
    { key: 'help', label: 'Hilfe', icon: 'help' }
  ] : user.role === 'REVIEWER' ? [
    { key: 'review', label: 'Arbeitsvorrat', icon: 'file' },
    { key: 'registrations', label: 'Registrierungen', icon: 'users' },
    { key: 'audit', label: 'Audit', icon: 'shield' }
  ] : [
    { key: 'finance', label: 'Abwicklung', icon: 'credit' },
    { key: 'audit', label: 'Audit', icon: 'shield' }
  ]
  const navigate = (key: string) => { onNavigate(key); setMobileOpen(false); setAccountOpen(false) }
  const initials = user.name.split(/\s+/).filter(Boolean).map(part => part[0]).slice(0, 2).join('').toUpperCase()
  return <div className="app-shell">
    <div className="demo-bar"><strong>Demo-Modus</strong><span>Fiktive Daten · Externe Schnittstellen sind nicht verbunden</span></div>
    <header className="topbar"><button className="mobile-menu icon-button" onClick={() => setMobileOpen(v => !v)} aria-label="Menü öffnen"><Icon name="menu"/></button><div className="brand"><span>LAWEA</span> direkt <em>Plus</em></div><div className="brand-tagline">Lagerwertverluste einfach melden.</div><div className="topbar-spacer"/><div className="topbar-organization">{user.organizationName || 'Glenmark Bearbeitung'}</div><div className="topbar-account" ref={accountRef}><button type="button" className="topbar-account-trigger" aria-label={`Profilmenü für ${user.name} öffnen`} aria-haspopup="menu" aria-expanded={accountOpen} onClick={() => setAccountOpen(value => !value)}><span className="avatar">{initials}</span><span className="topbar-account-name">{user.name}</span><Icon name="chevron" size={16}/></button>{accountOpen ? <div className="account-menu" role="menu" aria-label="Profil und Konto"><div className="account-menu-identity"><span className="avatar">{initials}</span><div><strong>{user.name}</strong><span>{user.email}</span><small>{account?.viewingAs ? 'Mitarbeiteransicht · Demo' : user.role === 'PHARMACY_ADMIN' ? 'Unternehmensadministrator' : user.role === 'PHARMACY_STAFF' ? 'Mitarbeiter' : user.role === 'REVIEWER' ? 'Prüfung' : 'Finance'}</small></div></div>{account ? <div className="account-menu-actions"><button role="menuitem" onClick={() => { setAccountOpen(false); account.onSettings() }}><Icon name="settings" size={18}/> Profil bearbeiten <Icon name="arrow" size={16}/></button>{account.onMembers && user.role === 'PHARMACY_ADMIN' && !account.viewingAs ? <button role="menuitem" onClick={() => { setAccountOpen(false); account.onMembers?.() }}><Icon name="users" size={18}/> Mitarbeiter verwalten <Icon name="arrow" size={16}/></button> : null}{account.viewingAs && account.onReturn ? <button role="menuitem" onClick={() => { setAccountOpen(false); account.onReturn?.() }}><Icon name="shield" size={18}/> Zur Adminansicht zurück</button> : null}</div> : null}{account?.switchable?.length && account.onSwitch && !account.viewingAs ? <div className="account-switch-list"><span>Ansicht als Mitarbeiter testen</span>{account.switchable.map(member => <button role="menuitem" key={member.id} onClick={() => { setAccountOpen(false); account.onSwitch?.(member.id) }}><span className="account-mini-avatar">{member.name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()}</span><span><strong>{member.name}</strong><small>{member.email}</small></span><Icon name="arrow" size={15}/></button>)}</div> : null}<div className="account-menu-bottom"><button role="menuitem" onClick={() => { setAccountOpen(false); onLogout() }}><Icon name="logout" size={18}/> Abmelden</button></div></div> : null}</div></header>
    {account?.viewingAs && account.onReturn ? <div className="account-view-banner" role="status"><Icon name="users" size={18}/><span>Sie sehen die Vorschau als <strong>{account.viewingAs}</strong>. Sie bleiben als Administrator angemeldet.</span><button onClick={account.onReturn}>Zur Adminansicht</button></div> : null}
    <div className="shell-body"><nav className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`} aria-label="Hauptnavigation"><div className="nav-links">{links.map(link => <button key={link.key} className={`nav-link ${page === link.key || (page.startsWith('credits:') && link.key === 'credits') || ((page.startsWith('claim:') || page.startsWith('sample:')) && link.key === 'claims') ? 'active' : ''}`} onClick={() => navigate(link.key)}><Icon name={link.icon}/><span>{link.label}</span></button>)}</div><div className="nav-bottom"><button className="nav-link" onClick={onLogout}><Icon name="logout"/><span>{demo && pharmacy ? 'Abmelden · Demo zurücksetzen' : 'Abmelden'}</span></button></div></nav><main className={`main-content ${aside ? 'has-aside' : ''}`}><div className="content-inner">{children}</div></main>{aside ? <aside className="assistant-rail">{aside}</aside> : null}</div>
  </div>
}
