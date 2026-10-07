# Produkt und Nutzererlebnis

## Produktversprechen

Eine Apotheke erledigt eine LWV-Meldung geführt, fehlerarm und nachvollziehbar: Sie versteht sofort, **welcher Stichtag offen ist**, **welche Angaben fehlen**, **was nach dem Absenden passiert** und **wo die Gutschrift liegt**. Glenmark sieht einen priorisierten Arbeitsvorrat mit Gründen statt einer E-Mail-Sammlung. Das Produkt soll außergewöhnlich hilfreich sein; „bestes System“ wird durch überprüfbare Nutzbarkeit, fachliche Richtigkeit und Verlässlichkeit verfolgt, nicht durch eine unbelegte Marktbehauptung.

## Gestaltungsprinzipien

1. **Stichtage zuerst:** Die Apothekenübersicht zeigt eine einfache Liste aus Stichtag und Meldungsstand. Ein Klick öffnet den zugehörigen Vorgang; weitere Hinweise stehen erst dort.
2. **Erst erklären, dann fordern:** Fachbegriffe wie PZN, Charge, Senkungstermin und Bestand zum Stichtag werden direkt am Feld kurz erklärt.
3. **Fortschritt sichern:** Entwürfe automatisch und explizit speichern; Zeitpunkt der letzten Speicherung sichtbar; bei Verbindungsfehlern Eingaben lokal vor Verlust schützen und erneuten Versuch anbieten.
4. **Fehler früh und präzise:** Eingabeformat und Pflichtfelder direkt prüfen; fachliche PZN-/Stichtagsprüfung vor finaler Bestätigung anzeigen; Fehlermeldungen nennen Feld, Ursache und Handlung. Für Chargen genügt eine nichtleere Eingabe.
5. **Verbindliche Aktionen bewusst:** Vor Einreichung eine lesbare Zusammenfassung aller Positionen, Belege und Erklärungen; der Benutzer bestätigt bewusst. Nach Einreichung wird die Revision gesperrt.
6. **Status in Alltagssprache:** Benutzer sehen „Entwurf“, „Eingereicht“, „Wir prüfen“, „Bitte korrigieren“, „Freigegeben“, „Gutschrift verfügbar“. Interne Statuscodes bleiben im System.
7. **Transparente Verantwortung:** Zeige wer als Nächstes handelt und ob die Apotheke etwas tun muss. Keine Zahlungszusage vor tatsächlicher fachlicher Entscheidung.
8. **Barrierefrei und responsiv:** Ziel WCAG 2.2 AA, Tastaturbedienung, sichtbarer Fokus, sinnvolle Beschriftungen, Kontrast, Screenreader-Statusmeldungen, keine alleinige Farbcodierung; Orientierung an der [W3C-Spezifikation](https://www.w3.org/TR/WCAG22/).

## Informationsarchitektur

### Öffentlicher Bereich

| Seite | Zweck | Zentrale Elemente |
| --- | --- | --- |
| Start | Ziel und Ablauf erklären | „Anmelden“, „Konto erstellen“, Voraussetzungen, Hilfe, Kontakt, Datenschutz/Impressum. |
| Konto erstellen | Apotheke und Erstadministrator registrieren | Klare Schritte „Apotheke“, „Nachweis“, „Zugang“, „Prüfen“; Feldhilfen; Speicher- und Uploadstatus. |
| E-Mail bestätigen | Registrierung abschließen | OTP-Eingabe, begrenzte Neusendung, verständliche Ablaufhinweise. |
| Freigabe ausstehend | Erwartung steuern | Bearbeitungsstand, fehlender Nachweis, sichere Möglichkeit zur Nachreichung, Supportweg. |
| Login/MFA | Zugang | E-Mail/Passwort, zweiter Faktor, Passwort vergessen, Fehler ohne Benutzeraufzählung. |

### Apothekenbereich

| Seite | Zweck | Zentrale Elemente |
| --- | --- | --- |
| Übersicht | Stichtag und Stand sofort erkennen | Schlichte anklickbare Liste der sichtbaren Stichtage. Im Kopf der Spalte „Stand“ filtert ein kompaktes Auswahlfeld nach „Alle“, „Neu“, „Entwürfe“, „Eingereicht“ und „Abgeschlossen“; auf schmalen Bildschirmen bleibt es über der Liste sichtbar. „Eingereicht“ enthält alle eigenen Einreichungen einschließlich später abgeschlossener Vorgänge; „Abgeschlossen“ zeigt nur ausgezahlte Vorgänge. Ein ausgezahlter Stichtag mit zugeordneter Gutschrift öffnet direkt deren Detailseite. Neueste zuerst und 15 pro Seite; alternativ 10 pro Seite und Blättern. Die Browserseite scrollt normal. Offene Termine und ältere Termine mit eigener Meldung bleiben sichtbar; historische Termine ohne Teilnahme werden nicht gezeigt. Die Konzeptvorschau ergänzt ausdrücklich fiktive ältere Vorgänge, damit das Blättern erlebbar ist. Der produktive Rückblick und die Fristen bleiben fachlich zu klären. Es gibt keinen separaten Meldungen- oder Gutschriftenpunkt in der Seitennavigation. |
| Meldung erstellen/bearbeiten | Positionen erfassen | Kompakter Stichtag im Kopf, dann direkt Positionen. Kurze Feldhilfe erscheint erst nach „Position hinzufügen“; danach Nachweis und optionaler Kommentar. Kein separates Ansprechpartner-Feld: Die einreichende Person steht über die Anmeldung fest. Richtigkeitsbestätigung, Zwischenspeichern und bewusste Prüfung vor Einreichung bleiben erhalten. |
| Meldungsdetail | Verlauf verstehen | Eingereichte Positionen und Kommentar schreibgeschützt ansehen, eigene Nachweise erneut herunterladen, Revisionen und Prüfungen nachvollziehen, Begründung bei Ablehnung und Gutschrift-Link öffnen. |
| Profilmenü | Eigenen Zugang und Mitarbeiter verwalten | Oben rechts führt „Profil bearbeiten“ zu persönlichen Angaben und zur Kennwortänderung auf einer Seite; Unternehmensadministratoren öffnen dort auch die Mitarbeiterverwaltung. Kein eigener Mitarbeiterpunkt in der Seitennavigation. |
| Apothekenprofil | Stammdaten prüfen | Adresse, Ansprechpartner, IBAN maskiert, Nachweisstatus; Änderungen mit erneuter Prüfung bei kritischen Stammdaten. |
| Gutschrift | Dokument ansehen und abrufen | Eigene Detailseite über den ausgezahlten Stichtag und die abgeschlossene Meldung, mit Rückweg zur Meldung, geschützter Vorschau und Download. Die öffentliche Konzeptvorschau zeigt nur ein klar als fiktiv markiertes PDF-Muster. |
| Hilfe | Selbsthilfe | Kontextspezifische Erläuterungen, kurze FAQ, Supportkontakt und Fehlermeldungs-Referenz. |

### Glenmark-/Prüfbereich

Registrierungsprüfung, Nachbearbeitungs-Queue, Vorgangsdetail mit Belegen/Prüfhistorie, Freigabe/Ablehnung mit Begründung, Exportläufe, Import-Fehlerarbeitsvorrat, Audit-Ansicht und regelbezogene Administration. Funktionen und Daten sind rollenabhängig sichtbar; die Oberfläche ist nicht über einen „geheimen“ URL-Pfad geschützt, sondern serverseitig autorisiert.

## Assistenzkonzept – kreativ, aber fachlich kontrolliert

Die Assistenz ist ein **Copilot für das Ausfüllen und Verstehen**. Sie soll proaktiv auf mögliche Lücken hinweisen, ohne Daten zu erfinden oder Schritte zu übernehmen.

| Moment | Hilfreiche Unterstützung | Grenze |
| --- | --- | --- |
| Registrierung | Dokument-Check, Erklärung der Betriebserlaubnis, Fortschritt, verständliche Feldbeispiele | Keine automatische Apotheker-Verifizierung ohne zugelassene Quelle oder Prüfung. |
| PZN-Suche | Synonyme/Produktname/PZN, sichtbare Auswahl und Kennzeichnung der Stichtagsrelevanz | Keine stille PZN-Ersetzung. |
| Erfassung | Hinweis auf fehlende Charge, ungewöhnliche Packungszahl, doppelverdächtige Position, beschädigte Datei | Keine Mengen oder Chargen aus unsicherer Quelle als Tatsache einsetzen. |
| Belege | Optionales Auslesen als **Vorschlag** mit Quelle und Konfidenzhinweis; Nutzer bestätigt jede Übernahme | Kein automatisches Einreichen aus Dokumenten. Sensible Inhalte nur in freigegebener Verarbeitung. |
| Vor Einreichen | Kompakte Prüfzusammenfassung, offene Fehler und Konsequenz der Sperre | Richtigkeitsbestätigung bleibt persönliche Handlung des Nutzers. |
| Nach Einreichen | Zeitleiste und nächste Aktion in Klartext; bei Ablehnung Grund und konkrete Korrekturschritte | Kein Überschreiben der alten Revision. |
| Glenmark-Prüfung | Erklärbare Regelhinweise und Hervorhebung relevanter Historie | Entscheidung und Begründung nur durch berechtigte Rolle, sofern Auto-Freigabe nicht ausdrücklich freigegeben. |

**Implementierungsstufen:** V1 nutzt deterministische, testbare Hilfen und kontextuelle Texte. Optionale generative Assistenz oder OCR wird erst nach Datenschutz-, Datenqualitäts-, Kosten- und Freigabeentscheidung aktiviert. Kein offener Chat als Ersatz für strukturierte Pflichtfelder. Ausgabe der Assistenz ist nie alleiniger Beleg für eine fachliche Entscheidung.

## Beispiel für die Kernreise

1. Administrator legt Konto an, verifiziert E-Mail und sieht „Prüfung ausstehend“.
2. Prüfer gibt Apotheke frei; Administrator meldet sich mit MFA an.
3. Übersicht zeigt „Senkungstermin 01.10.2026 – noch 3 Tage einreichbar“ **nur, wenn das tatsächlich konfigurierte Fenster dies ergibt**.
4. Mitarbeiter fügt Positionen hinzu. Das System prüft die PZN zum Stichtag und zeigt bei einer leeren Chargennummer einen konkreten Fehler. Es behauptet keine fachliche Chargenprüfung. Der Entwurf bleibt erhalten.
5. Vor Einreichen zeigt die Zusammenfassung alle Positionen und Belege. Nach Bestätigung wird die Revision unveränderlich; Empfangsnummer erscheint sofort und per neutraler E-Mail.
6. Eine Regelabweichung bringt den Vorgang in Glenmarks Queue. Bei Ablehnung sieht die Apotheke den Grund im Portal, erstellt eine neue Revision und reicht erneut ein.
7. Nach Freigabe und zugeordneter Gutschrift erscheint das Dokument direkt in der abgeschlossenen Meldung mit Benachrichtigung.

## Messbare UX-Ziele für die Abnahme

- Ein Erstnutzer findet im moderierten Test ohne Anleitung den nächsten offenen Stichtag, speichert einen Entwurf und reicht eine gültige Meldung ein.
- Die Testperson erkennt vor dem finalen Klick, dass die eingereichte Revision gesperrt ist und eine Korrektur erst nach Ablehnung möglich wird.
- Jede Fehlermeldung ermöglicht eine Handlung; keine Eingaben verschwinden bei fachlichem Validierungsfehler oder technischem Timeout.
- Die wichtigsten Reisen sind bei Desktop- und schmaler Smartphone-Breite ohne horizontales Scrollen der gesamten Seite möglich.
- Tastatur- und Screenreader-Test decken Registrierung, OTP, PZN-Suche, Upload, Positionsliste, Bestätigung und Korrektur ab.
- Analytics messen Abbruchpunkte, Zeit bis zur ersten erfolgreichen Meldung, Validierungsfehler, Wiederaufnahme von Entwürfen und Supportfälle. Keine PZN-/Chargen-/IBAN-Werte in Telemetrie.
