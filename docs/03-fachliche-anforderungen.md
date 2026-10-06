# Fachliche Anforderungen und Akzeptanzkriterien

**Geltung:** Glenmark-LWV für Apotheken. GH ist als möglicher späterer Organisationstyp vorgemerkt, ohne aktivierten Fachprozess. „Muss“ aus P S. 9 FR-01–16 ist berücksichtigt, mit der dokumentierten Abweichung zu FR-06: keine Chargenvalidierung; FR-03 (Mehrbenutzerfähigkeit) wird durch U verbindlich. Fachlich offene Varianten stehen in `06-offene-entscheidungen.md`.

## Rollen und Rechte

| Rolle | Rechte |
| --- | --- |
| Interessent | Öffentliche Seiten, Registrierung, Verifizierung des eigenen E-Mail-Kontos. |
| Apothekenadministrator | Alle eigenen Meldungen, Belege und Gutschriften; Mitarbeiter einladen/sperren, Adminrecht übertragen, nichtkritisches Profil pflegen. |
| Apothekenmitarbeiter | Eigene Apotheke: Meldungen erfassen, Entwürfe bearbeiten, einreichen, Korrekturen nach Ablehnung durchführen, Status/Belege/Gutschriften sehen; Mitarbeiterliste nur lesend und ohne sensible Sicherheitsdaten. |
| Registrierungsprüfer | Betriebserlaubnis und Stammdaten prüfen, Nachforderung, Freigabe/Ablehnung mit Grund; kein automatisches Recht zur Meldungsentscheidung. |
| Glenmark-Sachbearbeiter | Mandantenbezogenen Arbeitsvorrat, Meldungen, Belege und Historie prüfen; je nach Rolle freigeben/ablehnen. |
| Glenmark-Finance | Freigegebene Vorgänge exportieren, Exportläufe prüfen, Gutschriften importieren und zuordnen. |
| Systemadministrator | Technische Konfiguration, Support und Audit nach gesonderter Rechtevergabe; Supportzugriffe zeitlich begrenzt und protokolliert. |

Eine Person kann mehrere Rollen haben, aber jede Aktion prüft ihre konkrete Berechtigung. Alle Apothekenzugriffe sind durch die serverseitig bestimmte `pharmacy_id` begrenzt. Es darf niemals der letzte **aktive** Unternehmensadministrator oder letzte aktive Mitarbeiter einer Apotheke gelöscht/gesperrt werden. Für die Erstanlage gilt der erste bestätigte Benutzer als Administrator, jedoch erst nach Apothekenfreigabe mit Fachzugriff.

## Registrierung und Identität

**REG-01:** Öffentliche Startseite bietet Login und Kontoerstellung. Name der Apotheke, Straße, PLZ, Ort, Inhaber, Telefon, IBAN, optional Homepage, Name der anlegenden Person, E-Mail und zweimal Passwort werden erfasst. Vor dem Senden zeigt das System eine Zusammenfassung und prüft Pflichtfelder, Passwortgleichheit, gültiges IBAN-Format und Dublettenhinweise. IBAN nur, wenn für spätere Abwicklung erforderlich; Darstellung danach maskiert.

**REG-02:** Manuelle Verifizierung verlangt Betriebserlaubnis als PDF/JPEG/PNG, maximal 5 MB. Es werden MIME-Typ und Inhalt geprüft, nicht nur die Dateiendung. Unlesbarer/ungültiger Nachweis kann mit dokumentiertem Grund zurückgewiesen und erneut hochgeladen werden. Keine Freigabe ohne positiven Nachweis.

**REG-03:** Nach der Registrierung wird ein befristeter E-Mail-Einmalcode versendet. Korrekte Eingabe bestätigt den E-Mail-Besitz; die Apotheke bleibt `Freigabe ausstehend`. Codeversuche und Neusendungen sind begrenzt, Codes werden nicht im Klartext gespeichert. Ablauf und Fehler erlauben eine neue Codeanforderung ohne Verlust des Antrags.

**REG-04:** Berechtigter Prüfer sieht einen Arbeitsvorrat, Daten und Betriebserlaubnis, kann freigeben, Nachweis nachfordern oder Antrag mit dokumentiertem Grund ablehnen. Freigabe/Nachforderung/Ablehnung werden auditiert und per neutraler E-Mail kommuniziert. Nur freigegebene Apotheken können LWV-Meldungen bearbeiten.

**REG-05:** N-Connect/NGDA ist eine zweite Verifizierungsroute: bestätigte Identität und Stammdaten werden anhand eines vertraglich definierten Adapters übernommen und mit Quellen-/Zeitstempel gespeichert. Ein Ausfall führt zum manuellen Weg oder `vorläufig`; niemals zur stillen Freigabe. Föderierter Login bleibt separat zu entscheiden.

**AUTH-01:** Normales Login erfordert E-Mail, Passwort und OTP als zweiten Faktor. Passwortreset nutzt einen befristeten Einmal-Link und invalidiert alte Sitzungen gemäß Sicherheitskonzept. Zugang ist gesperrt, solange Konto/Apotheke nicht freigegeben oder Benutzer deaktiviert ist. Rate-Limits und generische Fehltexte verhindern Kontoauskundschaftung.

## Mitarbeiterverwaltung

**USR-01:** Tabelle enthält Name, E-Mail, „Ist Unternehmensadministrator“, Status, sowie für Administratoren Aktionen „Passwort zurücksetzen“, „Rolle ändern“ und „Zugang sperren/löschen“. „Löschen“ in der UI bedeutet Zugang deaktivieren; Audit und fachliche Historie bleiben erhalten. Nichtadministratoren sehen Name, E-Mail, Admin-Kennzeichnung und Status ohne Aktionen.

**USR-02:** Nur ein aktiver Unternehmensadministrator kann einladen. Einladung ist auf die Apotheke und eine E-Mail gebunden, einmalig und befristet. Eingeladene Person erhält einen Link, definiert ihr Passwort und bestätigt ihren E-Mail-Besitz per OTP; danach wird der Zugang aktiv. Neue E-Mails werden nicht allein durch Eingabe einem Konto hinzugefügt. Doppeladressen und abgelaufene Links haben verständliche Fehlerwege.

**USR-03:** Rollenänderung, Deaktivierung und Passwortreset werden auditiert. Die Regel „mindestens ein aktiver Administrator und mindestens ein aktiver Mitarbeiter“ gilt transaktional, auch bei gleichzeitig ausgeführten Aktionen. Ein ausgeschiedener Benutzer sieht keine Daten mehr; offene Entwürfe gehören der Apotheke und bleiben einem aktiven Benutzer zugänglich.

## Senkungstermine und Meldungen

**TRM-01:** Das Portal zeigt angemeldeten Apotheken alle aktuell einreichbaren Glenmark-Stichtage. Historische Stichtage erscheinen einer Apotheke nur, wenn sie daran teilgenommen hat; Entwürfe nach Fristende bleiben lesbar. Die Zahl angezeigter Monate ist konfigurierbar und von den Einreichungsfenstern getrennt. Es gibt keine Kampagnen und keine aktive Benachrichtigung zu neu verfügbaren Senkungsterminen: Apotheken sehen diese ausschließlich nach dem Login. Auch noch nicht registrierte Apotheken werden nicht über neue Termine informiert (Marco, Rückmeldung vom 05.10.2026).

**TRM-02:** Preissenkungsstichtage fallen nach direkter Nutzerangabe ausschließlich auf den 1. oder 15. eines Monats. Der bisherige fiktive Vorschautermin 30.09.2026 wird als 01.10.2026 dargestellt. Für produktiv eingehende Termindaten bleibt die fachliche Quellvalidierung Teil des noch fehlenden LAWEA-Vertrags; das Portal darf einen abweichenden externen Termin nicht stillschweigend verschieben.

**CLM-01:** Ein Stichtag kann eine Meldung mit mehreren Positionen besitzen. Pro Position: PZN, Charge, Bestand zum Stichtag als nichtnegative ganze Anzahl Packungen; null ist fachlich zu prüfen (Voreinstellung: keine Einreichung mit 0). Es gibt kein zusätzliches Ansprechpartner-Feld: Name und E-Mail der einreichenden Person werden serverseitig aus der authentifizierten Sitzung für die Revision übernommen. Kommentar ist optional. Mindestens ein Nachweis pro Meldung ist erforderlich, sofern die Fachregel keine engere Zuordnung pro Position verlangt. Mehrere Dateien sind möglich; erlaubte Typen mindestens PDF/JPEG/PNG. Jede Datei gehört sichtbar zur Meldung oder Position.

**CLM-02:** PZN-Autocomplete durchsucht das gesamte Glenmark-Sortiment. Eine PZN ohne relevante Senkung darf angezeigt, aber für diesen Stichtag nicht eingereicht werden. Die Apotheke gibt die Chargennummer selbst ein; sie muss beim Absenden nicht leer sein. Es gibt keine Chargenliste, automatische Chargenvorbelegung oder fachliche Chargenvalidierung. Formale Fehler verhindern das Absenden und zeigen betroffene Felder. Konfigurierbare Duplikatregel prüft dieselbe Apotheke + PZN + Charge + Stichtag auch über bestehende Meldungen hinweg. Diese direkte Nutzerentscheidung weicht von P FR-06 ab; siehe `01-quellenabgleich.md`.

**CLM-03:** Benutzer können Entwürfe speichern, fortsetzen und verwerfen. Autosave ist zusätzlich eine UX-Funktion, kein Ersatz für serverseitige Persistenz. Verwerfen setzt `Storniert` und behält den Audit-Nachweis. Beim Absenden werden Frist, PZN, Charge, Pflichteingaben, Nachweise und Richtigkeitsbestätigung **serverseitig erneut** geprüft. Das Absenden besitzt einen Idempotenzschlüssel. Danach entsteht eine unveränderliche Revision mit Zeitstempel, Einreichendem und Vorgangsnummer.

**CLM-04:** Einreichungsbestätigung zeigt Vorgangsnummer und Stichtag; eine neutrale E-Mail wird versendet. Während `In Bearbeitung`, `Nachbearbeitung` und `Freigegeben zur Auszahlung` kann die Apotheke die eingereichte Revision nur lesen. Die Sicherheitsrückfrage aus U nennt explizit: „Sind alle PZN und Positionen für diesen Senkungstermin vollständig? Nach Einreichung können Sie diese Version nicht mehr bearbeiten.“

**CLM-05:** Bei Ablehnung wird ein Pflichtgrund im Portal sichtbar. Ein berechtigter Apothekenbenutzer startet daraus eine neue, bearbeitbare Revision; alte Inhalte werden als Ausgangspunkt kopiert, frühere Belege unveränderlich referenziert oder versioniert. Nach erneutem Absenden laufen alle Prüfungen erneut. Keine Korrektur nach Fristablauf ohne explizite fachliche Ausnahme; die konkrete Ausnahmefrist ist offen.

## Prüfung, Entscheidung und Abwicklung

**REV-01:** Validierung und Regelwerk protokollieren Eingaben, Regelversion, Ergebnis und Zeitpunkt. Betragsschwellen, Mengenschwellen und vorhandene kundenbezogene Betragslogik sind konfigurierbar. Regelverletzungen gelangen mit begründeter Priorität in Glenmarks Nachbearbeitung. Technische Fehler sind von fachlich ungültigen Daten zu unterscheiden.

**REV-02:** Glenmark sieht Meldungspositionen, Nachweise, Prüfergebnisse und frühere Meldungen derselben Apotheke. Freigabe oder Ablehnung erfordert passende Rolle; Ablehnung erfordert Freitextgrund. Entscheidung, handelnder Benutzer und Zeitstempel werden auditiert. Automatische Freigabe bleibt bis zur Genehmigung der Regel-/Berechtigungspolitik deaktiviert.

**FIN-01:** Nur freigegebene, noch nicht in einem abgeschlossenen Exportlauf enthaltene Vorgänge sind DATEV-exportfähig. Finance startet einen Exportlauf, sieht Anzahl und Kontrollsummen und lädt die Datei herunter. Wiederholung desselben Laufs erzeugt dieselbe fachliche Auswahl bzw. verhindert Dubletten. Format und Sammellogik sind Integrationsvertrag, nicht zu erfinden.

**FIN-02:** Gutschriftenimport verarbeitet Dokument und eindeutigen Zuordnungsschlüssel. Erst bei eindeutiger Zuordnung und Freigabe erscheint die Gutschrift in der zugehörigen Meldung und in der Gutschriftenliste der Apotheke. Beide Ansichten verlinken aufeinander. Nicht zuordenbare oder doppelte Dokumente bleiben im Fehlerarbeitsvorrat und werden nicht veröffentlicht. Gutschriftbereitstellung setzt den Vorgang auf `Abgeschlossen`; neutraler E-Mail-Hinweis mit Portal-Link.

## Statusmodell

| Interner Status | Auslöser | Für Apotheke | Nächste erlaubte Aktion |
| --- | --- | --- | --- |
| `DRAFT` / Erfasst | Speichern | Entwurf | Bearbeiten, einreichen, verwerfen |
| `SUBMITTED` / In Bearbeitung | Einreichen | Eingereicht | Systemprüfung |
| `CHECK_PENDING` | LAWEA-Timeout o. Ä. | Prüfung läuft | Technische Wiederholung, keine Doppelmeldung |
| `MANUAL_REVIEW` / Nachbearbeitung | Regelabweichung | Wir prüfen | Glenmark entscheidet |
| `REJECTED` / Abgelehnt | Ablehnung mit Grund | Bitte korrigieren | Neue Revision erstellen und, wenn zulässig, einreichen |
| `APPROVED` / Freigegeben zur Auszahlung | positive Entscheidung | Freigegeben | Finance exportiert / Gutschriftimport |
| `CANCELLED` / Storniert | Entwurf verwerfen | Verworfen | Nur Historie |
| `COMPLETED` / Abgeschlossen | Gutschrift zugeordnet und veröffentlicht | Gutschrift verfügbar | Dokument ansehen/downloaden |

Jeder Übergang wird im Backend geprüft. `SUBMITTED` kann nach technischer Prüfung zu `MANUAL_REVIEW`, `REJECTED` oder bei ausdrücklich aktivierter Auto-Freigabe zu `APPROVED` wechseln. Eine manuelle positive Entscheidung aus `MANUAL_REVIEW` führt zu `APPROVED`. Der Status einer alten Revision bleibt unverändert, wenn eine neue Revision entsteht.

## Benachrichtigungen

Registrierung/E-Mail-Code, Freigabe oder Nachforderung, Einladung, Meldung eingereicht, Glenmark-Aufgabe, Ablehnung, optional Freigabe und Gutschrift verfügbar. Für das Erscheinen eines neuen Senkungstermins wird **keine** E-Mail oder andere aktive Ankündigung erzeugt. E-Mails zu den genannten transaktionalen Ereignissen enthalten höchstens Vorgangsnummer, Stichtag und einen sicheren Portal-Link, keine PZN, Charge, Beträge, IBAN oder Ablehnungsdetails. Zustellversuche und Versandstatus werden protokolliert; ein Mailfehler rollt die fachliche Aktion nicht zurück, sondern erzeugt einen wiederholbaren Versandauftrag.

## Fachliche Akzeptanzszenarien

1. Eine ungeprüfte Apotheke kann trotz bestätigter E-Mail keine Meldung anlegen; nach dokumentierter Freigabe und MFA kann sie nur eigene Daten sehen.
2. Der erste Administrator lädt einen Mitarbeiter ein; dieser setzt Passwort, bestätigt OTP und kann eine Meldung anlegen. Der letzte Admin kann weder deaktiviert noch herabgestuft werden.
3. Eine Meldung mit mehreren gültigen Positionen und Belegen wird als Entwurf gespeichert, wieder geöffnet und genau einmal eingereicht. Danach bleibt diese Revision unveränderlich.
4. Unpassende PZN, leere Charge, fehlende Erklärung, fehlender Beleg und abgelaufene Frist erzeugen jeweils konkrete, feldnahe Fehler und keine Einreichung. Ein vom Client gesendeter fremder Ansprechpartner darf die authentifizierte Identität nicht überschreiben.
5. LAWEA-Timeout erhält Daten und erlaubt sichere Wiederholung; doppelter Klick erzeugt keine zweite Meldung.
6. Regelabweichung führt nachweisbar in den Glenmark-Arbeitsvorrat. Ablehnung ohne Grund ist unmöglich. Nach Ablehnung kann eine neue Revision erneut geprüft werden.
7. Freigegebene Vorgänge erscheinen genau einmal im DATEV-Export. Unzuordenbare Gutschriften bleiben privat im Fehlerarbeitsvorrat. Zugeordnete Gutschriften sieht nur die richtige Apotheke.
8. Statuswechsel, Dokumentversionen, Entscheidungen, Exporte und sensible Supportzugriffe sind im Audit-Trail nachvollziehbar.
