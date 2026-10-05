import { useState, type Dispatch, type FormEvent, type SetStateAction } from 'react'
import type { PreviewMember } from './PreviewApp'
import { Button, Icon } from './ui'
import './members.css'

type Props = {
  members: PreviewMember[]
  setMembers: Dispatch<SetStateAction<PreviewMember[]>>
  currentEmail: string
  canManage: boolean
  setMessage: (message: string) => void
}
type Filter = 'all' | 'active' | 'invited' | 'disabled'

const initials = (name: string) => name.split(/\s+/).filter(Boolean).map(part => part[0]).slice(0, 2).join('').toUpperCase()
const normalized = (value: string) => value.trim().toLocaleLowerCase('de-DE')

export function PreviewMembers({ members, setMembers, currentEmail, canManage, setMessage }: Props) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [sort, setSort] = useState('name')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<'PHARMACY_ADMIN' | 'PHARMACY_STAFF'>('PHARMACY_STAFF')
  const active = members.filter(member => member.status === 'Aktiv').length
  const admins = members.filter(member => member.status === 'Aktiv' && member.admin).length
  const invited = members.filter(member => member.status === 'Einladung offen').length
  const disabled = members.filter(member => member.status === 'Gesperrt').length
  const shown = members.filter(member => {
    const matchesQuery = normalized(`${member.name} ${member.email}`).includes(normalized(query))
    const matchesRole = roleFilter === 'all' || (roleFilter === 'admin' ? member.admin : !member.admin)
    const matchesStatus = filter === 'all' || (filter === 'active' && member.status === 'Aktiv') || (filter === 'invited' && member.status === 'Einladung offen') || (filter === 'disabled' && member.status === 'Gesperrt')
    return matchesQuery && matchesRole && matchesStatus
  }).sort((a, b) => sort === 'email' ? a.email.localeCompare(b.email, 'de-DE') : a.name.localeCompare(b.name, 'de-DE') * (sort === 'name-desc' ? -1 : 1))
  const isSelf = (member: PreviewMember) => normalized(member.email) === normalized(currentEmail)
  const changeRole = (member: PreviewMember) => {
    setOpenMenu(null)
    if (!canManage || isSelf(member) || member.status !== 'Aktiv') return
    if (member.admin && admins <= 1) { setMessage('Mindestens ein aktiver Unternehmensadministrator muss erhalten bleiben.'); return }
    setMembers(current => current.map(item => item.email === member.email ? { ...item, admin: !item.admin } : item))
    setMessage(`Die Rolle von ${member.name} wurde nur in dieser Vorschau geändert.`)
  }
  const changeStatus = (member: PreviewMember) => {
    setOpenMenu(null)
    if (!canManage || isSelf(member) || member.status === 'Einladung offen') return
    if (member.status === 'Aktiv' && (active <= 1 || (member.admin && admins <= 1))) { setMessage('Mindestens ein aktiver Mitarbeiter und Administrator muss erhalten bleiben.'); return }
    const next = member.status === 'Aktiv' ? 'Gesperrt' : 'Aktiv'
    setMembers(current => current.map(item => item.email === member.email ? { ...item, status: next } : item))
    setMessage(`${member.name}: Zugang in der Vorschau ${next === 'Aktiv' ? 'reaktiviert' : 'gesperrt'}.`)
  }
  const invite = (event: FormEvent) => {
    event.preventDefault()
    if (!canManage) return
    const email = normalized(newEmail)
    if (!newName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setMessage('Bitte geben Sie einen Namen und eine gültige E-Mail-Adresse ein.'); return }
    if (members.some(member => normalized(member.email) === email)) { setMessage('Diese Adresse ist bereits in der Beispiel-Liste.'); return }
    setMembers(current => [...current, { name: newName.trim(), email, admin: newRole === 'PHARMACY_ADMIN', status: 'Einladung offen' }])
    setNewName(''); setNewEmail(''); setNewRole('PHARMACY_STAFF'); setInviteOpen(false)
    setMessage('Beispieleinladung erstellt. Es wurde keine E-Mail versendet.')
  }

  return <div className="team-page">
    <header className="team-heading"><div><h1>Mitarbeiter</h1><p>Verwalten Sie die Zugänge Ihrer Apotheke.</p></div>{canManage ? <Button icon="userPlus" onClick={() => setInviteOpen(value => !value)}>Mitarbeiter einladen</Button> : null}</header>
    <section className="team-summary" aria-label="Teamübersicht"><div><span className="team-summary-icon"><Icon name="users" size={22}/></span><strong>{active}</strong><span>aktive Zugänge</span></div><div><span className="team-summary-icon"><Icon name="shield" size={22}/></span><strong>{admins}</strong><span>{admins === 1 ? 'Administrator' : 'Administratoren'}</span></div><div><span className="team-summary-icon"><Icon name="mail" size={22}/></span><strong>{invited}</strong><span>{invited === 1 ? 'offene Einladung' : 'offene Einladungen'}</span></div></section>
    <div className={`team-layout ${inviteOpen ? 'team-layout-with-invite' : ''}`}><div className="team-main"><section className="team-directory" aria-label="Mitarbeiter suchen und verwalten">
      <div className="team-toolbar"><label className="team-search"><Icon name="search" size={20}/><input type="search" aria-label="Mitarbeiter suchen" placeholder="Name oder E-Mail suchen" value={query} onChange={event => setQuery(event.target.value)}/></label><label className="team-role-select"><span className="sr-only">Rolle filtern</span><select value={roleFilter} onChange={event => setRoleFilter(event.target.value)}><option value="all">Alle Rollen</option><option value="admin">Administratoren</option><option value="staff">Mitarbeiter</option></select></label></div>
      <div className="team-tabs" role="tablist" aria-label="Zugänge filtern">{([['all', 'Alle', members.length], ['active', 'Aktiv', active], ['invited', 'Einladungen', invited], ['disabled', 'Gesperrt', disabled]] as const).map(([key, label, count]) => <button key={key} role="tab" aria-selected={filter === key} className={filter === key ? 'selected' : ''} onClick={() => setFilter(key)}>{label} <span>({count})</span></button>)}</div>
      <div className="team-list-header"><span>Name</span><span>E-Mail</span><span>Rolle</span><span>Status</span><span className="sr-only">Aktionen</span></div>
      <div className="team-list">{shown.length ? shown.map(member => <div className="team-member-row" key={member.email}><div className="team-person"><span className="team-person-avatar">{initials(member.name)}</span><div className="team-person-info"><strong>{member.name}{isSelf(member) ? <small className="team-self">Sie</small> : null}</strong><span className="team-mobile-email">{member.email}</span><small className="team-mobile-role">{member.admin ? 'Unternehmensadministrator' : 'Mitarbeiter'}</small></div></div><span className="team-desktop-email" title={member.email}>{member.email}</span><span className="team-desktop-role">{member.admin ? 'Unternehmensadministrator' : 'Mitarbeiter'}</span><span className={`team-status ${member.status === 'Aktiv' ? 'active' : 'disabled'}`}><span/>{member.status}</span>{canManage && !isSelf(member) && member.status !== 'Einladung offen' ? <div className="team-menu"><button type="button" className="team-more" aria-label={`Aktionen für ${member.name}`} aria-expanded={openMenu === member.email} onClick={() => setOpenMenu(current => current === member.email ? null : member.email)}><Icon name="more" size={19}/></button>{openMenu === member.email ? <div className="team-menu-list">{member.status === 'Aktiv' ? <><button onClick={() => changeRole(member)}>{member.admin ? 'Adminrecht entfernen' : 'Zum Administrator machen'}</button><button onClick={() => { setOpenMenu(null); setMessage(`Passwort-Reset für ${member.name} nur simuliert. Keine E-Mail versendet.`) }}>Passwort zurücksetzen</button></> : null}{member.status !== 'Einladung offen' ? <button className={member.status === 'Aktiv' ? 'team-menu-danger' : ''} onClick={() => changeStatus(member)}>{member.status === 'Aktiv' ? 'Zugang sperren' : 'Zugang reaktivieren'}</button> : null}</div> : null}</div> : <span className="preview-team-no-action"/>}</div>) : <div className="team-empty"><span className="team-empty-icon"><Icon name="search" size={24}/></span><h3>Keine passenden Mitarbeiter</h3><p>Prüfen Sie Suchbegriff, Rolle oder Status.</p><button onClick={() => { setQuery(''); setRoleFilter('all'); setFilter('all') }}>Filter zurücksetzen</button></div>}</div>
      <div className="team-list-footer"><span>{shown.length} von {members.length} Personen</span><label>Sortierung: <select aria-label="Mitarbeiter sortieren" value={sort} onChange={event => setSort(event.target.value)}><option value="name">Name (A–Z)</option><option value="name-desc">Name (Z–A)</option><option value="email">E-Mail (A–Z)</option></select></label></div>
      <div className="team-guidance"><span><Icon name="shield" size={21}/></span><div><strong>Rollen sicher verwalten</strong><p>Die angemeldete Person kann ihre eigenen Rechte hier nicht ändern. Mindestens ein aktiver Administrator bleibt erhalten.</p></div></div>
    </section></div>
    {canManage && inviteOpen ? <><div className="team-invite-backdrop" onClick={() => setInviteOpen(false)} aria-hidden="true"/><aside className="team-invite-panel" aria-label="Mitarbeiter einladen"><div className="team-invite-panel-header"><h2>Mitarbeiter einladen</h2><button type="button" aria-label="Einladungsformular schließen" onClick={() => setInviteOpen(false)}><Icon name="close" size={19}/></button></div><p>Die Person legt später ein eigenes Passwort fest und bestätigt ihre Adresse mit einem Einmalcode. Hier wird keine E-Mail versendet.</p><form onSubmit={invite}><label className="field"><span>Name</span><input required value={newName} onChange={event => setNewName(event.target.value)} placeholder="Vor- und Nachname"/></label><label className="field"><span>E-Mail-Adresse</span><input type="email" required value={newEmail} onChange={event => setNewEmail(event.target.value)} placeholder="name@beispiel.test"/></label><label className="field"><span>Rolle</span><select value={newRole} onChange={event => setNewRole(event.target.value as typeof newRole)}><option value="PHARMACY_STAFF">Mitarbeiter</option><option value="PHARMACY_ADMIN">Unternehmensadministrator</option></select></label><Button type="submit" icon="arrow">Einladung simulieren</Button></form></aside></> : null}
    </div>
  </div>
}
