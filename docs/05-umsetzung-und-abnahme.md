# Umsetzungsplan und Abnahme

## Lieferstrategie

Jedes Paket endet mit einer vorführbaren Nutzerreise, Backend-Regeln, passenden Tests, dokumentierten Entscheidungen und einer Prüfung der gerenderten Oberfläche. Die Reihenfolge reduziert Risiko an den Systemgrenzen. Eine lokale Demo kann vor den externen Integrationen vollständig durchgespielt werden; produktive Freigabe hängt an echten Verträgen und Tests.

| Paket | Lieferinhalt | Vorführbare Abnahme |
| --- | --- | --- |
| 0. Grundlage | Projektgerüst, Designsystem, Datenbank, private Dokumentablage, Rollenmodell, Demo-Daten/Adapter, CI und lokaler Start | Startseite und getrennte Apotheken-/Glenmark-Ansicht starten lokal; Demo klar markiert. |
| 1. Identität und Freigabe | Registrierung, 5-MB-Betriebserlaubnis, E-Mail-OTP, Prüfer-Queue, Nachforderung/Freigabe, Login-MFA, Reset | Ungeprüftes Konto bleibt gesperrt; freigegebenes Konto kommt nach MFA ins eigene Dashboard. |
| 2. Mitarbeiter und Termine | Einladen, Passwort/OTP, Adminschutz, Stichtagsübersicht und Historie | Zwei Mitarbeiter derselben Apotheke arbeiten; fremde Apotheke ist unsichtbar; letzter Admin kann nicht entfernt werden. |
| 3. Meldung | PZN-Autocomplete, Positionen, Charge/Bestand, Belege, Ansprechpartner, Kommentar, Erklärung, Entwurf/Autosave/Verwerfen, Einreichen | Ein gültiger mehrteiliger Vorgang wird einmal eingereicht; Fehler und Timeout erhalten die Eingaben. |
| 4. Prüfung | LAWEA-Adapter, Regelversionen, Arbeitsvorrat, Freigabe, Ablehnung mit Grund, neue Revision | Regelabweichung wird geprüft; Apotheke korrigiert abgelehnte Meldung nachvollziehbar. |
| 5. Abwicklung | DATEV-Exportlauf, Gutschriftenimport/-zuordnung, Gutschriftenliste und Abruf aus der zugehörigen Meldung, E-Mails und Fehlerqueue | Wiederholter Export dupliziert nichts; zugeordnete Gutschrift erscheint nur beim richtigen Mandanten und ist gegenseitig mit der Meldung verlinkt. |
| 6. Produktqualität | Zugänglichkeit, mobile Optimierung, Nutzertests, Audit, Monitoring, Datenschutz-/Sicherheitsprüfung, Betriebshandbuch | Vollständige Reise mit echten Testintegrationen, Freigaben und dokumentierten Restpunkten. |

## Nachweis pro fachlicher PDF-Anforderung

| PDF-ID | Implementierungsnachweis | Abnahmetest |
| --- | --- | --- |
| FR-01/02 | Registrierung, Nachweisprüfung, N-Connect-Adapter und Stammdatenquelle | Manuelle Freigabe klappt; externe Bestätigung im Testsystem übernimmt Daten; Ausfall schaltet niemanden frei. |
| FR-03 + U | Mitarbeiterverwaltung mit Unternehmensadministrator | Einladung/OTP, Listenrechte und letzter-Admin-Schutz. |
| FR-04 + M | Offene/historische Stichtage ohne Kampagnenversand | Angemeldete Apotheke sieht neue offene Termine; unbeteiligte Vergangenheit ist verborgen und eigene Teilnahme sichtbar. Das Erscheinen eines Termins erzeugt keine E-Mail oder andere aktive Ankündigung. |
| FR-05 | Glenmark-PZN-Autocomplete | Alle Katalog-PZN auswählbar; irrelevante PZN beim Einreichen abgelehnt. |
| FR-06/07 | Freies Chargenpflichtfeld und Bestandsfeld; dokumentierte Abweichung zu FR-06 | Leere oder nur aus Leerzeichen bestehende Charge und ungültige Packungszahl verhindern Einreichen. Eine beliebige nichtleere Charge wird nicht gegen eine Liste validiert. |
| FR-08/09 | Mehrfach-Upload und Erklärung | Kein Absenden ohne erforderliche Nachweise/Bestätigung. |
| FR-10 | Entwurf und Verwerfen | Entwurf wird fortgesetzt, Storno ist historisch sichtbar. |
| FR-11 | Versioniertes Regelwerk | Schwellenregel ist konfigurierbar und Entscheidung erklärbar/auditiert. |
| FR-12/13 | Glenmark-Queue, Ablehnung und Revision | Historie/Belege sichtbar; Ablehnung ohne Grund unmöglich; Korrektur erneut prüfbar. |
| FR-14/15 | Exportlauf, Gutschriftenliste und Zugriff aus der Meldung | Idempotenter Export; eindeutige Zuordnung; Fehlerqueue bei unklarem Import. |
| FR-16 | Neutrale E-Mail-Ereignisse | Inhalt ohne sensible Daten; Retry und Versandstatus nachvollziehbar. |

## Kritische automatisierte Tests

1. **Mandantentrennung:** jeder Lese-/Schreib-/Downloadpfad mit zwei Apotheken, einschließlich erratener IDs und indirekter Dokumentreferenzen.
2. **Rollen:** Mitarbeiter gegen Admin-Aktion; Prüfer gegen Finance-Aktion; parallele Deaktivierung des letzten Admins.
3. **Statusmaschine:** unerlaubte Übergänge, Fristablauf während Erfassung, Korrektur nur aus Ablehnung, Unveränderlichkeit eingereichter Revisionen.
4. **Einreichung:** PZN/Stichtag, Charge, Bestand, Beleg, Erklärung, Ansprechpartner, Duplikat und doppelter Submit.
5. **Externe Fehler:** LAWEA-/N-Connect-Timeout, fehlgeschlagener Mailversand, Virenscanfehler und wiederholte Jobs ohne Datenverlust oder positive Scheinentscheidung.
6. **Abwicklung:** gleichzeitige Exportstarts, Wiederholung, Kontrollsummen, doppelter oder nicht zuordenbarer Gutschriftenimport.
7. **Audit:** Entscheidung, Dokumentersatz, Rollenwechsel und Export besitzen Actor, Zeit und Resultat; keine Klartext-Geheimnisse.

## Manuelle Produktabnahme

- Apothekeninhaber, Apothekenmitarbeiter, Glenmark-Sachbearbeitung und Finance testen ihre jeweilige Kernreise mit realistischen **synthetischen** Szenarien.
- Mobile, Desktop, Tastatur und Screenreader werden an Registrierung, Meldung und Gutschrift geprüft. Ziel ist [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/), nicht nur ein automatischer Scannerwert.
- UX-Test beobachtet, ob Benutzer ohne Anleitung Stichtag, nächsten Schritt, endgültige Einreichung, Ablehnungsgrund und Gutschrift finden; gefundene Hürden werden vor Go-live behoben.
- Fachverantwortliche zeichnen Schwellen, Fristen, Duplikatregel, Auto-Freigabe, Korrekturfenster, DATEV-Format und Gutschriftzuordnung ab.
- Technische Abnahme prüft Backups/Wiederherstellung, Monitoring, Geheimnisverwaltung, Datenschutzkonzept, sicheren Dateiupload und dokumentierte Betriebswege.

## Definition of Done für produktive Einführung

Alle Muss-Reisen und FR-01–16 sind implementiert oder mit explizit genehmigter Abweichung dokumentiert; kritische Tests sind grün; externe Testintegrationen wurden Ende zu Ende geprüft; Rollen- und Mandantenprüfungen sowie Audit funktionieren; die Nutzung ist für Apotheken verständlich; die offenen produktionskritischen Punkte aus `06-offene-entscheidungen.md` sind geschlossen. Ein rein lokaler Demo-Modus ist ein Entwicklungsmeilenstein, keine produktive Abnahme.

## Konkreter Startauftrag für Codex

1. Erfasse den tatsächlichen Repository- und Infrastrukturzustand. Falls kein Code vorhanden ist, scaffold ein wartbares Webprojekt samt lokaler Datenbank, Migrationen und Demo-Adaptern.
2. Lege Fachmodule und Statusmaschine nach `03-fachliche-anforderungen.md` an. Implementiere zuerst Registrierung, Rollen und Mandantentrennung, dann die komplette Meldungsreise.
3. Baue die Portaloberflächen nach `02-produkt-und-ux.md` mit einem konsistenten Designsystem und prüfe sie im Browser an Desktop- und Smartphone-Größe.
4. Ergänze externe Adapter anhand bestätigter Verträge. Bis dahin verwende explizit gekennzeichnete Demo-Implementierungen und dokumentiere fehlende Verträge.
5. Führe die kritischen Tests und Produktabnahme durch. Berichte offen, welche Teile produktiv verbunden und welche nur demohaft sind.
