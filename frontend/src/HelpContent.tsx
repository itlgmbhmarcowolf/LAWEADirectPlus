import { PageTitle } from './ui'

export function HelpContent({ preview = false }: { preview?: boolean }) {
  return <><PageTitle title="Hilfe zur Meldung" subtitle="Antworten zu Erfassung, Korrektur und Bearbeitung."/>
    {preview ? <p className="muted">Konzeptvorschau mit fiktiven Daten. Die beschriebenen Abläufe zeigen den geplanten Portalprozess.</p> : null}
    <div className="help-grid">
      <section><h2>Stichtag und Bestand</h2><p>Erfassen Sie den Packungsbestand, der am ausgewählten Senkungstermin tatsächlich vorhanden war. Der Stichtag steht im Titel der Meldung und über den Positionen.</p></section>
      <section><h2>PZN und Charge</h2><p>Suchen Sie den Artikel über seine achtstellige PZN. Die Charge lesen Sie von der Packung ab und geben sie frei ein. Vor der Einreichung prüft das Portal, ob die PZN zum Stichtag betroffen ist. Eine fachliche Chargenprüfung findet nicht statt.</p></section>
      <section><h2>Nachweis und Einreichung</h2><p>Fügen Sie den Bestandsnachweis hinzu und prüfen Sie alle Positionen. Erst Ihre Richtigkeitsbestätigung und der Klick auf „Jetzt einreichen“ reichen die Meldung ein. Die Assistenz trifft diese Entscheidung nicht für Sie.</p></section>
      <section><h2>Korrektur nach Ablehnung</h2><p>Eine eingereichte Revision bleibt unverändert. Nach einer Ablehnung können Sie innerhalb des offenen Einreichungsfensters eine neue Revision mit korrigierten Angaben anlegen. Die ältere Einreichung bleibt im Verlauf sichtbar.</p></section>
      <section><h2>Mitarbeiterverwaltung</h2><p>Administratoren finden die Mitarbeiterverwaltung oben rechts im Profilmenü. Dort lassen sich Einladungen verwalten und Zugänge deaktivieren. Mitarbeitende sehen nur die Funktionen ihrer Rolle und ihrer Apotheke.</p></section>
      <section><h2>Gutschrift finden</h2><p>Öffnen Sie einen ausgezahlten Stichtag. Die Gutschrift ist der zugehörigen Meldung zugeordnet. Die Vorschau erscheint direkt; das Dokument können Sie getrennt herunterladen.</p></section>
    </div>
  </>
}
