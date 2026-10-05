import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { post } from './api'
import type { Bootstrap, Invitation, Member } from './types'
import { dateTime } from './types'
import { Button, Icon, Notice } from './ui'
import './members.css'

type Filter = 'all' | 'active' | 'disabled' | 'invites'
type MemberAction = 'role' | 'reset' | 'disable' | 'enable'
type ConfirmAction = { kind: MemberAction; member: Member } | { kind: 'revoke'; invitation: Invitation }

const roleName = (role: Member['role']) => role === 'PHARMACY_ADMIN' ? 'Unternehmensadministrator' : 'Mitarbeiter'
const initials = (name: string) => name.split(/\s+/).filter(Boolean).map(part => part[0]).slice(0, 2).join('').toUpperCase()
const searchable = (value: string) => value.toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g, '')

function MemberMenu({ member, currentUserId, adminCount, onAction }: {
  member: Member
  currentUserId: string
  adminCount: number
  onAction: (kind: MemberAction, member: Member) => void
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const outside = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false) }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', escape) }
  }, [open])
  const own = member.id === currentUserId
  const lastAdmin = member.role === 'PHARMACY_ADMIN' && adminCount <= 1
  const choose = (kind: MemberAction) => { setOpen(false); onAction(kind, member) }
  return <div className="team-menu" ref={root}>
    <button type="button" className="team-more" aria-label={`Aktionen für ${member.name}`} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(value => !value)}><Icon name="more" size={19}/></button>
    {open ? <div className="team-menu-list" role="menu">
      {member.status === 'ACTIVE' ? <>
        {!own ? <button role="menuitem" disabled={lastAdmin} title={lastAdmin ? 'Mindestens ein Administrator muss aktiv bleiben.' : undefined} onClick={() => choose('role')}>{member.role === 'PHARMACY_ADMIN' ? 'Adminrecht entfernen' : 'Zum Administrator machen'}</button> : null}
        <button role="menuitem" onClick={() => choose('reset')}>Passwort-Reset senden</button>
        <div className="team-menu-separator"/>
        <button role="menuitem" className="team-menu-danger" disabled={own || lastAdmin} title={lastAdmin ? 'Mindestens ein Administrator muss aktiv bleiben.' : own ? 'Eigenen Zugang hier nicht sperren.' : undefined} onClick={() => choose('disable')}>Zugang sperren</button>
      </> : <button role="menuitem" onClick={() => choose('enable')}>Zugang reaktivieren</button>}
    </div> : null}
  </div>
}

export function MembersPage({ data, refresh }: { data: Bootstrap; refresh: () => Promise<Bootstrap> }) {
  const admin = data.user.role === 'PHARMACY_ADMIN'
  const members = data.members || []
  const invitations = admin ? data.invitations || [] : []
  const active = members.filter(member => member.status === 'ACTIVE').length
  const admins = members.filter(member => member.status === 'ACTIVE' && member.role === 'PHARMACY_ADMIN').length
  const disabled = members.filter(member => member.status === 'DISABLED').length
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [sort, setSort] = useState('name-asc')
  const [inviteOpen, setInviteOpen] = useState(() => typeof window !== 'undefined' && !window.matchMedia('(max-width: 900px)').matches)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'PHARMACY_ADMIN' | 'PHARMACY_STAFF'>('PHARMACY_STAFF')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [demoLink, setDemoLink] = useState('')
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const invitePanelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!inviteOpen || !window.matchMedia('(max-width: 900px)').matches) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setInviteOpen(false)
      if (event.key !== 'Tab') return
      const controls = invitePanelRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled])')
      if (!controls?.length) return
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', keydown)
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', keydown) }
  }, [inviteOpen])

  const matches = (person: { name: string; email: string; role: string }) => {
    const needle = searchable(query.trim())
    return (!needle || searchable(`${person.name} ${person.email}`).includes(needle)) && (roleFilter === 'all' || person.role === roleFilter)
  }
  const visibleMembers = useMemo(() => members.filter(member => filter === 'all' || (filter === 'active' && member.status === 'ACTIVE') || (filter === 'disabled' && member.status === 'DISABLED')).filter(matches).sort((a, b) => {
    const by = sort === 'email' ? 'email' : 'name'
    const order = a[by].localeCompare(b[by], 'de-DE')
    return sort === 'name-desc' ? -order : order
  }), [members, filter, query, roleFilter, sort])
  const visibleInvitations = invitations.filter(matches).sort((a, b) => a.name.localeCompare(b.name, 'de-DE'))
  const openInvite = () => { setInviteOpen(true); requestAnimationFrame(() => nameRef.current?.focus()) }
  const clearFeedback = () => { setError(''); setNotice(''); setDemoLink('') }

  const invite = async (event: FormEvent) => {
    event.preventDefault(); clearFeedback(); setBusy(true)
    try {
      const result = await post<{ demoLink?: string }>('/members/invite', { name: name.trim(), email: email.trim(), role })
      setNotice(`${name.trim()} wurde eingeladen. Die Person bestätigt den Zugang mit einem Einmalcode.`)
      setDemoLink(result.demoLink || '')
      setName(''); setEmail(''); setRole('PHARMACY_STAFF'); setInviteOpen(false); setFilter('invites')
      await refresh()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Einladung fehlgeschlagen.') }
    finally { setBusy(false) }
  }
  const runMemberAction = async (kind: MemberAction, member: Member) => {
    clearFeedback(); setBusy(true)
    try {
      const result = kind === 'role'
        ? await post<{ demoLink?: string }>(`/members/${member.id}/role`, { role: member.role === 'PHARMACY_ADMIN' ? 'PHARMACY_STAFF' : 'PHARMACY_ADMIN' })
        : await post<{ demoLink?: string }>(`/members/${member.id}/${kind}`, {})
      setDemoLink(result.demoLink || '')
      setNotice(kind === 'role' ? `Rolle von ${member.name} geändert.` : kind === 'reset' ? `Reset-Link für ${member.name} erstellt.` : kind === 'disable' ? `${member.name} wurde gesperrt.` : `${member.name} kann sich wieder anmelden.`)
      await refresh()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Aktion fehlgeschlagen.') }
    finally { setBusy(false); setConfirm(null) }
  }
  const runInvitationAction = async (kind: 'resend' | 'revoke', invitation: Invitation) => {
    clearFeedback(); setBusy(true)
    try {
      const result = await post<{ demoLink?: string }>(`/members/invitations/${invitation.id}/${kind}`, {})
      setDemoLink(result.demoLink || '')
      setNotice(kind === 'resend' ? `Einladung an ${invitation.email} erneut erstellt. Der alte Link ist ungültig.` : `Einladung an ${invitation.email} widerrufen.`)
      await refresh()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Aktion fehlgeschlagen.') }
    finally { setBusy(false); setConfirm(null) }
  }
  const confirmAction = () => {
    if (!confirm) return
    if (confirm.kind === 'revoke') runInvitationAction('revoke', confirm.invitation)
    else runMemberAction(confirm.kind, confirm.member)
  }
  const confirmTitle = confirm?.kind === 'role' ? 'Rolle wirklich ändern?' : confirm?.kind === 'reset' ? 'Passwort-Reset senden?' : confirm?.kind === 'disable' ? 'Zugang sperren?' : confirm?.kind === 'enable' ? 'Zugang reaktivieren?' : 'Einladung widerrufen?'
  const confirmDescription = confirm?.kind === 'role' ? 'Die bisherigen Sitzungen dieser Person werden beendet. Neue Berechtigungen gelten ab der nächsten Anmeldung.' : confirm?.kind === 'reset' ? `Für ${confirm.member.name} wird ein neuer Passwort-Link erstellt und per E-Mail verschickt.` : confirm?.kind === 'disable' ? 'Diese Person wird sofort abgemeldet und kann sich bis zur Reaktivierung nicht anmelden.' : confirm?.kind === 'enable' ? 'Die Person kann sich anschließend mit ihrem bestehenden Passwort wieder anmelden.' : 'Der Einladungslink wird sofort ungültig.'

  return <div className="team-page">
    <header className="team-heading"><div><h1>Mitarbeiter</h1><p>Verwalten Sie die Zugänge Ihrer Apotheke.</p></div>{admin ? <Button icon="userPlus" onClick={openInvite}>Mitarbeiter einladen</Button> : null}</header>
    {error ? <Notice tone="error">{error}</Notice> : null}
    {notice ? <Notice tone="success">{notice}</Notice> : null}
    {demoLink ? <div className="team-demo-link" role="status"><div><strong>Demo-Link für den Zugang</strong><p>Öffnen Sie den Link in einem privaten Browserfenster für die betreffende Person.</p><code>{demoLink}</code></div><button type="button" onClick={() => navigator.clipboard.writeText(`${window.location.origin}${demoLink}`).then(() => setNotice('Demo-Link kopiert.')).catch(() => setError('Link konnte nicht kopiert werden.'))}>Link kopieren</button></div> : null}

    <section className="team-summary" aria-label="Teamübersicht">
      <div><span className="team-summary-icon"><Icon name="users" size={22}/></span><strong>{active}</strong><span>aktive Zugänge</span></div>
      <div><span className="team-summary-icon"><Icon name="shield" size={22}/></span><strong>{admins}</strong><span>{admins === 1 ? 'Administrator' : 'Administratoren'}</span></div>
      <div><span className="team-summary-icon"><Icon name="mail" size={22}/></span><strong>{invitations.length}</strong><span>{invitations.length === 1 ? 'offene Einladung' : 'offene Einladungen'}</span></div>
    </section>

    <div className={`team-layout ${inviteOpen && admin ? 'team-layout-with-invite' : ''}`}>
      <div className="team-main">
        <section className="team-directory" aria-label="Mitarbeiter suchen und verwalten">
          <div className="team-toolbar"><label className="team-search"><Icon name="search" size={20}/><input type="search" aria-label="Mitarbeiter suchen" placeholder="Name oder E-Mail suchen" value={query} onChange={event => setQuery(event.target.value)}/></label><label className="team-role-select"><span className="sr-only">Rolle filtern</span><select value={roleFilter} onChange={event => setRoleFilter(event.target.value)}><option value="all">Alle Rollen</option><option value="PHARMACY_ADMIN">Administratoren</option><option value="PHARMACY_STAFF">Mitarbeiter</option></select></label></div>
          <div className="team-tabs" role="tablist" aria-label="Zugänge filtern">{([
            ['all', 'Alle', members.length], ['active', 'Aktiv', active], ['disabled', 'Gesperrt', disabled], ['invites', 'Einladungen', invitations.length]
          ] as const).filter(([key]) => admin || key !== 'invites').map(([key, label, count]) => <button key={key} type="button" role="tab" aria-selected={filter === key} className={filter === key ? 'selected' : ''} onClick={() => setFilter(key)}>{label} <span>({count})</span></button>)}</div>

          {filter === 'invites' ? <div className="team-invite-results"><div className="team-list-heading"><h2>Offene Einladungen</h2><span>{visibleInvitations.length} von {invitations.length}</span></div>{visibleInvitations.length ? visibleInvitations.map(invitation => <div className="team-invite-row" key={invitation.id}><span className="team-person-avatar"><Icon name="mail" size={20}/></span><div className="team-person-info"><strong>{invitation.name}</strong><span>{invitation.email}</span><small>{roleName(invitation.role)} · gültig bis {dateTime(invitation.expires_at)}</small></div><div className="team-invite-actions"><button disabled={busy} onClick={() => runInvitationAction('resend', invitation)}>Erneut senden</button><button disabled={busy} className="team-danger-link" onClick={() => setConfirm({ kind: 'revoke', invitation })}>Widerrufen</button></div></div>) : <div className="team-empty"><span className="team-empty-icon"><Icon name={query ? 'search' : 'mail'} size={24}/></span><h3>{query ? 'Keine passenden Einladungen' : 'Zurzeit keine offenen Einladungen'}</h3><p>{query ? 'Versuchen Sie einen anderen Namen oder eine andere E-Mail-Adresse.' : 'Neue Einladungen erscheinen hier bis zur Annahme oder zum Ablauf.'}</p>{query ? <button onClick={() => setQuery('')}>Suche zurücksetzen</button> : admin ? <button onClick={openInvite}>Person einladen</button> : null}</div>}</div> : <>
            <div className="team-list-header"><span>Name</span><span>E-Mail</span><span>Rolle</span><span>Status</span><span className="sr-only">Aktionen</span></div>
            <div className="team-list">{visibleMembers.length ? visibleMembers.map(member => <div className="team-member-row" key={member.id}><div className="team-person"><span className="team-person-avatar">{initials(member.name)}</span><div className="team-person-info"><strong>{member.name}{member.id === data.user.id ? <small className="team-self">Sie</small> : null}</strong><span className="team-mobile-email">{member.email}</span><small className="team-mobile-role">{roleName(member.role)}</small></div></div><span className="team-desktop-email">{member.email}</span><span className="team-desktop-role">{roleName(member.role)}</span><span className={`team-status ${member.status === 'ACTIVE' ? 'active' : 'disabled'}`}><span/>{member.status === 'ACTIVE' ? 'Aktiv' : 'Gesperrt'}</span>{admin ? <MemberMenu member={member} currentUserId={data.user.id} adminCount={admins} onAction={(kind, selected) => setConfirm({ kind, member: selected })}/> : <span/>}</div>) : <div className="team-empty"><span className="team-empty-icon"><Icon name="search" size={24}/></span><h3>Keine passenden Mitarbeiter</h3><p>Prüfen Sie Suchbegriff, Rolle oder Status.</p><button onClick={() => { setQuery(''); setRoleFilter('all'); setFilter('all') }}>Filter zurücksetzen</button></div>}</div>
            <div className="team-list-footer"><span>{visibleMembers.length} von {members.length} Mitarbeitern</span><label>Sortierung: <select aria-label="Mitarbeiter sortieren" value={sort} onChange={event => setSort(event.target.value)}><option value="name-asc">Name (A–Z)</option><option value="name-desc">Name (Z–A)</option><option value="email">E-Mail (A–Z)</option></select></label></div>
          </>}
          <div className="team-guidance"><span><Icon name="shield" size={21}/></span><div><strong>Zugänge im Blick</strong><p>{admins === 1 ? 'Mindestens ein aktiver Administrator muss erhalten bleiben.' : `${admins} aktive Administratoren können Zugänge Ihrer Apotheke verwalten.`}</p></div></div>
          {admin && filter !== 'invites' ? <div className="team-pending"><div className="team-list-heading"><h2>Offene Einladungen ({invitations.length})</h2>{invitations.length ? <button onClick={() => setFilter('invites')}>Alle anzeigen <Icon name="arrow" size={15}/></button> : null}</div>{invitations.length ? invitations.slice(0, 2).map(invitation => <div className="team-pending-line" key={invitation.id}><Icon name="mail" size={17}/><div><strong>{invitation.name}</strong><span>{invitation.email}</span></div><small>bis {dateTime(invitation.expires_at)}</small></div>) : <div className="team-pending-empty"><span className="team-summary-icon"><Icon name="mail" size={21}/></span><strong>Zurzeit keine offenen Einladungen.</strong><p>Neue Einladungen erscheinen hier, bis sie angenommen werden.</p></div>}</div> : null}
        </section>
      </div>

      {admin && inviteOpen ? <><div className="team-invite-backdrop" onClick={() => setInviteOpen(false)} aria-hidden="true"/><aside ref={invitePanelRef} className="team-invite-panel" role={window.matchMedia('(max-width: 900px)').matches ? 'dialog' : 'complementary'} aria-modal={window.matchMedia('(max-width: 900px)').matches ? 'true' : undefined} aria-label="Mitarbeiter einladen"><div className="team-invite-panel-header"><h2>Mitarbeiter einladen</h2><button type="button" aria-label="Einladungsformular schließen" onClick={() => setInviteOpen(false)}><Icon name="close" size={19}/></button></div><p>Die eingeladene Person legt ein eigenes Passwort fest und bestätigt ihre E-Mail mit einem Einmalcode.</p><form onSubmit={invite}><label className="field"><span>Name</span><input ref={nameRef} required autoComplete="name" value={name} onChange={event => setName(event.target.value)} placeholder="Vor- und Nachname"/></label><label className="field"><span>E-Mail-Adresse</span><input type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="name@beispiel.de"/></label><label className="field"><span>Rolle</span><select value={role} onChange={event => setRole(event.target.value as typeof role)}><option value="PHARMACY_STAFF">Mitarbeiter</option><option value="PHARMACY_ADMIN">Unternehmensadministrator</option></select></label><Button type="submit" disabled={busy} icon="arrow">{busy ? 'Wird erstellt …' : 'Einladung senden'}</Button></form><div className="team-invite-explain"><Icon name="mail" size={20}/><div><strong>So funktioniert es</strong><p>Der Link gilt in dieser Demo 48 Stunden. Nach Passwort und Einmalcode wird der Zugang aktiv.</p></div></div></aside></> : null}
    </div>

    {confirm ? <div className="modal-backdrop" role="presentation"><div className="modal team-confirm" role="dialog" aria-modal="true" aria-labelledby="team-confirm-title"><h2 id="team-confirm-title">{confirmTitle}</h2><p>{confirmDescription}</p><div className="modal-actions"><Button variant="secondary" disabled={busy} onClick={() => setConfirm(null)}>Abbrechen</Button><Button variant={confirm.kind === 'disable' || confirm.kind === 'revoke' ? 'danger' : 'primary'} disabled={busy} onClick={confirmAction}>{busy ? 'Einen Moment …' : 'Bestätigen'}</Button></div></div></div> : null}
  </div>
}
