import { useRef, useState } from 'react'
import { Button, Icon } from './ui'
import './help-content.css'

type TopicId = 'stichtage' | 'artikel' | 'einreichen' | 'korrektur' | 'mitarbeiter' | 'gutschrift'
type Topic = { id: TopicId; title: string; summary: string; keywords: string; intro: string; steps: { title: string; text: string }[]; note?: string }

const topics: Topic[] = [
  { id: 'stichtage', title: 'Stichtage und Entwürfe', summary: 'Termin öffnen, Bestand erfassen und später fortsetzen', keywords: 'datum speichern meldung bestand', intro: 'Jedes Datum in der Übersicht führt zu seinem Stichtag. Dort sehen Sie den Stand der zugehörigen Meldung und können einen Entwurf fortsetzen.', steps: [
    { title: 'Datum auswählen', text: 'Öffnen Sie den 1. oder 15. eines Monats in der Stichtagsliste. Ältere Monate laden beim Scrollen nach.' },
    { title: 'Bestand erfassen', text: 'Tragen Sie für jede Position die Packungen ein, die am ausgewählten Stichtag tatsächlich vorhanden waren.' },
    { title: 'Entwurf speichern', text: 'Wählen Sie „Entwurf speichern“. In der Liste erscheint „Entwurf“. Über dasselbe Datum kehren Sie zu Ihren Angaben zurück.' }
  ], note: 'Stichtag und Einreichungsfrist sind unterschiedlich. Ob eine Einreichung noch möglich ist, richtet sich nach dem hinterlegten Einreichungsfenster.' },
  { id: 'artikel', title: 'PZN und Charge', summary: 'Artikel und Packungen richtig eintragen', keywords: 'position chargennummer', intro: 'Eine Meldung kann mehrere Positionen enthalten. Jede Position beschreibt einen Artikel, seine Charge und den Bestand zum Stichtag.', steps: [
    { title: 'Position hinzufügen', text: 'Wählen Sie für jeden Artikel „Position hinzufügen“ und tragen Sie seine PZN ein. Der angezeigte Artikelname hilft bei der Zuordnung.' },
    { title: 'Charge ablesen', text: 'Lesen Sie die Chargennummer von der Packung ab und geben Sie sie frei ein. Eine fachliche Chargenprüfung findet nicht statt.' },
    { title: 'Packungen zählen', text: 'Geben Sie den Bestand als ganze Packungszahl größer null an. Vor dem Einreichen prüft das Portal, ob die PZN vom Stichtag betroffen ist.' }
  ] },
  { id: 'einreichen', title: 'Nachweis und Einreichung', summary: 'Beleg hochladen, Angaben prüfen, verbindlich senden', keywords: 'datei bestätigung absenden', intro: 'Ein Entwurf ist noch keine Einreichung. Erst nach der Prüfung und Ihrer ausdrücklichen Bestätigung wird die Meldung gesendet.', steps: [
    { title: 'Nachweis hinzufügen', text: 'Wählen Sie im Bereich „Nachweis“ eine Datei aus. Das Formular zeigt die unterstützten Dateitypen und die zulässige Größe.' },
    { title: 'Angaben prüfen', text: 'Kontrollieren Sie PZN, Charge, Packungszahl und Stichtag. Wählen Sie einen Ansprechpartner Ihrer Apotheke und bestätigen Sie die Richtigkeit.' },
    { title: 'Einreichen', text: '„Angaben prüfen“ zeigt fehlende Felder. Erst „Jetzt einreichen“ sendet die Meldung verbindlich. Die eingereichte Revision bleibt unveränderlich.' }
  ] },
  { id: 'korrektur', title: 'Korrektur nach Ablehnung', summary: 'Rückmeldung lesen und eine neue Revision einreichen', keywords: 'fehler ablehnung erneut', intro: 'Kommt eine Meldung zur Korrektur zurück, sehen Sie den Grund direkt in der Meldung. Die bereits eingereichte Fassung bleibt im Verlauf erhalten.', steps: [
    { title: 'Grund und Frist lesen', text: 'Öffnen Sie den Stichtag mit dem Stand „Bitte korrigieren“. Dort sehen Sie den Ablehnungsgrund und bis wann die Korrektur erneut eingereicht werden kann.' },
    { title: 'Neue Revision erstellen', text: 'Wählen Sie „Neue Revision erstellen“. Korrigieren Sie die Angaben. Sie können den Nachweis erneut hochladen und einen Kommentar ergänzen.' },
    { title: 'Erneut einreichen', text: 'Bestätigen Sie die Richtigkeit erneut und reichen Sie die neue Revision bewusst ein. Die frühere Fassung bleibt sichtbar.' }
  ], note: 'Eine Korrektur ist nur innerhalb des geltenden Einreichungsfensters möglich.' },
  { id: 'mitarbeiter', title: 'Mitarbeiterverwaltung', summary: 'Einladen, Rollen ändern und Zugänge verwalten', keywords: 'team administrator einladung sperren passwort', intro: 'Jede Person nutzt einen eigenen Zugang zur Apotheke. Unternehmensadministratoren verwalten Einladungen, Rollen und Zugänge. Mitarbeitende können die Liste nur ansehen.', steps: [
    { title: 'Verwaltung öffnen', text: 'Öffnen Sie oben rechts das Profilmenü und wählen Sie „Mitarbeiter verwalten“. Dieser Menüpunkt erscheint nur für Unternehmensadministratoren.' },
    { title: 'Person einladen', text: 'Wählen Sie „Mitarbeiter einladen“ und geben Sie Namen, E-Mail-Adresse und Rolle ein. „Mitarbeiter“ bearbeitet Meldungen; „Unternehmensadministrator“ darf zusätzlich Zugänge verwalten.' },
    { title: 'Zugang aktivieren', text: 'Die eingeladene Person legt ein eigenes Passwort fest und bestätigt ihre E-Mail mit einem Einmalcode. Erst danach wird der Zugang aktiv.' },
    { title: 'Zugänge pflegen', text: 'Nutzen Sie Suche und Reiter für aktive, gesperrte und eingeladene Personen. Im Aktionsmenü können Administratoren Rollen ändern, einen Passwort-Reset auslösen oder einen Zugang sperren und reaktivieren.' }
  ] },
  { id: 'gutschrift', title: 'Gutschrift finden', summary: 'Dokument zu einer Meldung ansehen und herunterladen', keywords: 'pdf vorschau auszahlung', intro: 'Eine Gutschrift gehört zu einer bestimmten Meldung und ist dort mit einer eigenen Referenz verknüpft.', steps: [
    { title: 'Stichtag öffnen', text: 'Wählen Sie einen abgeschlossenen Stichtag. In der Meldung finden Sie die zugeordnete Gutschrift.' },
    { title: 'Dokument öffnen', text: 'Die Detailseite zeigt gemeldete Positionen und Nachweise. Die Dokumentsektion heißt „Gutschrift“.' },
    { title: 'Ansehen oder herunterladen', text: 'Mit dem Augensymbol öffnen Sie die Vorschau. Über das Downloadsymbol laden Sie das Dokument gesondert herunter.' }
  ] }
]

export function HelpContent({ initialTopic = 'stichtage', onNavigate }: { initialTopic?: TopicId; onNavigate?: (page: string) => void }) {
  const [selected, setSelected] = useState<TopicId>(initialTopic)
  const [query, setQuery] = useState('')
  const articleRef = useRef<HTMLElement>(null)
  const filtered = topics.filter(topic => `${topic.title} ${topic.summary} ${topic.keywords}`.toLocaleLowerCase('de-DE').includes(query.trim().toLocaleLowerCase('de-DE')))
  const active = filtered.find(topic => topic.id === selected) || filtered[0]
  const openTopic = (id: TopicId) => {
    setSelected(id)
    if (window.matchMedia('(max-width: 840px)').matches) requestAnimationFrame(() => articleRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }))
  }

  return <div className="help-page">
    <header className="help-heading"><h1>Hilfe</h1><p>Schritt für Schritt durch Stichtage, Meldungen und Mitarbeiterverwaltung.</p></header>
    <label className="help-search"><Icon name="search" size={20}/><span className="sr-only">Hilfethemen durchsuchen</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Wobei können wir helfen?" aria-label="Hilfethemen durchsuchen"/>{query ? <button type="button" aria-label="Suche löschen" onClick={() => setQuery('')}><Icon name="close" size={17}/></button> : null}</label>
    <div className="help-layout">
      <nav className="help-topics" aria-label="Hilfethemen"><span className="help-topics-label">Themen</span>{filtered.length ? filtered.map(topic => <button key={topic.id} type="button" className={active?.id === topic.id ? 'active' : ''} aria-current={active?.id === topic.id ? 'page' : undefined} onClick={() => openTopic(topic.id)}><strong>{topic.title}</strong><small>{topic.summary}</small></button>) : <p className="help-no-results">Keine passenden Themen. Versuchen Sie einen anderen Suchbegriff.</p>}</nav>
      {active ? <article ref={articleRef} className="help-article" key={active.id} aria-labelledby="help-article-title">
        <header><span>Hilfeartikel</span><h2 id="help-article-title">{active.title}</h2><p>{active.summary}</p></header>
        <div className="help-article-body">
          <p className="help-lead">{active.intro}</p>
          <h3>So funktioniert es</h3>
          <ol className="help-steps">{active.steps.map(step => <li key={step.title}><strong>{step.title}</strong><span>{step.text}</span></li>)}</ol>
          {active.id === 'mitarbeiter' ? <><h3>Weitere Fragen</h3><div className="help-faq">
            <details><summary>Was passiert, wenn eine Person die Apotheke verlässt?</summary><p>Sperren Sie den Zugang im Aktionsmenü. Die Person kann sich nicht mehr anmelden; Meldungen und Verlauf bleiben erhalten.</p></details>
            <details><summary>Was tun mit einer abgelaufenen Einladung?</summary><p>Öffnen Sie den Reiter „Einladungen“ und wählen Sie „Erneut senden“. Der bisherige Link wird ungültig; die eingeladene Person erhält einen neuen Einladungslink.</p></details>
          </div></> : null}
          {active.note ? <div className="help-note"><Icon name="help" size={20}/><p>{active.note}</p></div> : null}
          {onNavigate && active.id === 'stichtage' ? <Button variant="secondary" onClick={() => onNavigate('dashboard')}>Stichtage öffnen</Button> : null}
        </div>
      </article> : null}
    </div>
  </div>
}
