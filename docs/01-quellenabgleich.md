# Quellenabgleich: User Story, Meeting und Glenmark-Konzept

**Referenzen:** U = Nutzerauftrag inklusive Meeting-Transkript 00:03–03:50 und eingefügter User Story; P = Glenmark-Konzept V1.0 vom 23.09.2026, Seiten 1–14; M = Marcos vom Nutzer am 05.10.2026 weitergeleitete Antwort zur Bekanntgabe neuer Senkungstermine. Die PDF ist als „BUSINESS USE ONLY“ markiert. Diese Datei fasst Anforderungen zusammen und übernimmt keine vertraulichen Stammdaten aus Briefkopf oder Grafiken.

## Bereits in der User Story enthalten

| Thema | U | P | Ergebnis |
| --- | --- | --- | --- |
| Separates Portal statt E-Mail-geführter Erfassung | Meeting 00:35–01:29 | S. 3–5 | Grundarchitektur: neue Oberfläche, Anbindung an LAWEA. |
| Registrierung und Grunddaten | Meeting 02:10–03:29; User Story | S. 3, 8–9 | Apotheke, Anschrift, Inhaber, Telefon, IBAN, optional Homepage, Ansprechpartner und Passwort erfassen. |
| Betriebserlaubnis und manuelle Freigabe | Meeting 03:29–03:50; User Story | S. 3, 8, 14 | Konto nach E-Mail-Prüfung nur „wartet auf Freigabe“; Nachweis prüfen und Ergebnis mitteilen. |
| E-Mail-OTP bei Kontoerstellung | User Story | S. 3/8 nennt OTP für Login | Registrierungsprüfung und Login-MFA sind zwei getrennte Vorgänge. |
| Mitarbeiter je Apotheke | User Story | S. 9 FR-03 noch offen | Nutzerwunsch macht Mehrbenutzerfähigkeit für dieses Projekt verbindlich. |
| Meldungen nach Senkungstermin, Nachweis, Kommentar und Einreichen | User Story | S. 4, 8–9 | Oberfläche an Stichtagen orientieren; Meldungen strukturiert erfassen. |

## Im PDF gefordert, in der User Story fehlend oder zu ungenau

| Priorität | Ergänzung für die Spezifikation | PDF-Beleg |
| --- | --- | --- |
| Muss | Alternative Apothekenverifizierung über NGDA/N-Connect samt Stammdatenübernahme; manuelle Betriebserlaubnis bleibt Fallback. | S. 3, 8–9 FR-01/02 |
| Muss | Login mit E-Mail, Passwort **und** Einmalcode; möglicher föderierter N-Connect-Login erst nach Architekturentscheidung. | S. 3, 8, 13 |
| Muss | Offene und historische Senkungstermine getrennt; historische Termine nur bei tatsächlicher Teilnahme anzeigen. | S. 8–9 FR-04 |
| Muss | Meldung pro Stichtag mit Positionen: Glenmark-PZN per Autocomplete, Charge, Bestand in Packungen zum Stichtag, Ansprechpartner, Richtigkeitsbestätigung. | S. 3, 8–9 FR-05–09 |
| Muss | Alle Glenmark-PZN auswählbar; beim Einreichen prüfen, ob PZN zum Stichtag tatsächlich betroffen ist. | S. 9 FR-05, S. 11 |
| Muss | Entwurf speichern/fortsetzen/verwerfen; `Erfasst`, `In Bearbeitung`, `Storniert`. | S. 4, 8–10 FR-10 |
| Muss | Chargenprüfung über LAWEA; formale, Frist-, PZN-, Bestands- und Duplikatprüfung. | S. 8–9 FR-06, S. 11 |
| Muss | Konfigurierbare Betrags- und Mengengrenzen, protokolliertes Regelresultat, Ausnahme-Arbeitsvorrat. | S. 3, 8–9 FR-11/12 |
| Muss | Glenmark-Ansicht für Daten, Belege und bisherige Meldungen; Entscheidung mit dokumentierter Freigabe oder Ablehnung samt Pflichtgrund. | S. 8–10 FR-12/13 |
| Muss | Abgelehnte Meldung durch Apotheke korrigieren und erneut einreichen. | S. 3, 8, 10, 14 |
| Muss | DATEV-Datei für freigegebene Vorgänge; Gutschriftenimport, eindeutige Zuordnung und eigener Portalbereich. | S. 3–5, 8–9 FR-14/15, S. 12–14 |
| Muss | Neutrale Status-E-Mails, Eingangsbestätigung und Gutschrifthinweis ohne sensible Meldungsdetails. | S. 9 FR-16, S. 12–13 |
| Muss | Mandantentrennung, Rollenrechte, Audit-Trail, MFA, sicherer Dokumentzugriff, Monitoring und Fehlerarbeitsvorräte. | S. 10, 12–14 |
| Muss | Sonderfälle: externe Dienste nicht erreichbar, Fristablauf beim Absenden, doppeltes Absenden, doppelter Export, unzuordenbare Gutschrift, Mitarbeiter-Austritt. | S. 14 |

## Unterschiede und fachliche Auflösung

| Konflikt | Beobachtung | Arbeitsregel für die Umsetzung |
| --- | --- | --- |
| „Nachträgliche Bearbeitung nicht möglich“ vs. PDF-Korrektur nach Ablehnung | U sperrt nach Bestätigung; P erlaubt Korrektur nach Ablehnung (S. 8, 10, 14). | Eingereichte **Revision** ist unveränderlich. Solange in Bearbeitung keine Bearbeitung durch Apotheke. Erst nach Ablehnung kann eine neue Revision aus den bisherigen Daten erstellt und erneut eingereicht werden. Sichtbare Historie bleibt erhalten. |
| Registrierung OTP vs. Login OTP | U nennt OTP nach „Konto erstellen“, P zusätzlich bei jedem Login (S. 3, 8). | Zwei getrennte Prüfungen: E-Mail-Besitz bei Registrierung; MFA beim Login. Nur validierte und freigegebene Konten erhalten Portalzugriff. |
| Nur Betriebserlaubnis vs. N-Connect-Alternative | U zeigt manuellen Weg, P verlangt auch NGDA/N-Connect (S. 9 FR-01). | Manueller Weg vollständig spezifizieren und umsetzen; N-Connect-Adapter und Zielreise vorsehen. Produktive N-Connect-Aktivierung hängt am noch fehlenden Vertrag und Anbieterzugang. |
| Mehrbenutzerfähigkeit | U fordert Mitarbeiterverwaltung; P markiert FR-03 als Entscheidung (S. 9). | Für LAWEA direkt Plus ist sie **Muss**. Unternehmensadministrator verwaltet Benutzer; mindestens ein aktiver Administrator und ein aktiver Benutzer. |
| „Apotheke bzw. GH“ | U erwähnt GH, erklärt aber nur Apotheke; P beschreibt ausschließlich Apotheken (S. 3–14). | Datenmodell kann Organisationstyp tragen. GH-Onboarding und GH-Fachregeln bleiben gesperrt, bis deren Berechtigung, Nachweise und Auszahlung geklärt sind. |
| X Monate / ZV500 | U verweist auf Konfiguration, P beschreibt Einreichungsfenster und Historie (S. 8, 12). | Sichtbarer Rückblick ist konfigurierbar. Offene Termine hängen am fachlichen Einreichungsfenster; abgelaufene Teilnahme bleibt lesbar. Exakter Konfigurationsort ist offen. |
| Chargenprüfung | P S. 8–9 FR-06 und S. 11 sehen einen Abgleich der Charge mit LAWEA vor; P S. 14 enthält dazu eine Sonderfallvariante. | Die direkte Nutzerentscheidung vom 05.10.2026 ersetzt diese Vorgabe für LAWEA direkt Plus: Apotheke trägt die Chargennummer frei ein; beim Absenden wird nur geprüft, ob nach Entfernen von Leerzeichen ein Wert vorhanden ist. Keine Chargenliste, automatische Vorbelegung oder LAWEA-Chargenvalidierung. PZN und Senkungstermin bleiben fachlich zu prüfen. |
| Automatische Freigabe | P S. 3/7–8 lässt unauffällige Vorgänge automatisch zur Auszahlung zu, nennt auch Glenmark-Freigabe. | Regelentscheidung separat protokollieren. Ob Auto-Freigabe produktiv aktiviert wird, ist Freigabepolitik; initial manuelle Glenmark-Freigabe, bis Schwellen und Verantwortlichkeit bestätigt sind. |
| PDF vs. Dateiformate und Größe | U setzt 5 MB für Betriebserlaubnis; P S. 13 lässt Grenzwerte offen und nennt mindestens PDF/Bild. | Betriebserlaubnis: maximal 5 MB, PDF/JPEG/PNG; sichere Inhaltsprüfung. Nachweise/Gutschriften brauchen eine eigene festzulegende Grenze. |
| Markenname und Domain | U/Meeting wechseln zwischen Lavea/Lavera/LAWEA und nennen beispielhafte Domains. | Arbeitstitel `LAWEA direkt Plus`; sichtbare Schreibweise, Glenmark-Branding und Hostname vor Produktivstart bestätigen. Keine Domain als bereits vergeben behandeln. |
| Information über neue Senkungstermine | U sagt nur, dass Kunden über das Einrichten des Portals informiert werden; P fordert die Anzeige offener Termine (S. 8–9), aber keine Ankündigung neuer Termine. | M klärt: Es gibt keine Kampagnen. Apotheken sehen neue Senkungstermine ausschließlich nach dem Login im Portal. Weder registrierte noch unregistrierte Apotheken erhalten dafür eine E-Mail oder eine andere aktive Ankündigung. Die Aussage zu E-Mails wird hier auf Terminankündigungen bezogen; transaktionale E-Mails für Registrierung, Mitarbeiter und Vorgangsstatus aus U/P bleiben bestehen. |
| Ansprechpartner in der Meldung | P FR-09 nennt einen Ansprechpartner; Marco hält ein zusätzliches Eingabefeld im Meldungsformular für überflüssig, weil die einreichende Person angemeldet ist (vom Nutzer übermitteltes Feedback vom 06.10.2026, 03:05). | Kein separates Ansprechpartner-Feld in der Meldung. Das Backend übernimmt Name und E-Mail aus der authentifizierten Sitzung in die eingereichte Revision. Kontaktdaten der Apotheke bleiben Teil der Registrierung und des Profils. |
| Separater Gutschriftenbereich und Mitarbeiter in der Seitennavigation | P FR-15 fordert einen eigenen Portalbereich für Gutschriften. Marcos vom Nutzer übermitteltes Feedback vom 06.10.2026, 04:31–05:02 und 06:19, verlangt einen einfacheren Zugang über die abgeschlossene Meldung und Mitarbeiter im oberen Profilmenü. | Die jüngste direkte Nutzeranweisung E-16 entfernt Gutschriften aus der Seitennavigation. Der eigene Gutschrift-Detailbereich bleibt erhalten und wird direkt über einen ausgezahlten Stichtag oder die Meldung geöffnet. Mitarbeiterverwaltung, Profileinstellungen und Kennwortänderung liegen oben rechts. Dokumente und Mandantenrechte bleiben erhalten. |
| Getrennte Meldungsfilter und sechs Monatsgruppen pro Seite | Frühere Vorschauentscheidung E-09 stellte die Monatswahl bereit; Marcos Feedback vom 06.10.2026, 03:52–04:19 und 05:26–06:19, fordert eine einfache chronologische Gesamtliste und Blättern nach ungefähr 15 Stichtagen. | Die jüngste direkte Nutzerkorrektur E-19 stellt in der statischen Konzeptvorschau die sechs Monatsgruppen Mai bis Oktober 2026 auf Seite 1 wieder her, optional drei Monate. Die lokale Backend-Demo zeigt weiter 15 Stichtage pro Seite als Startwert, optional 10. Für Meldungen gilt E-12: Bereiche Neu, Entwürfe, Eingereicht, Ausgezahlt ohne Datumsfilter. |
| Direkte Korrektur zu Gutschriften und Meldungsbereichen | Der Nutzer stellte nach E-11 klar, dass der Gutschriftenpunkt in der Seitennavigation erhalten bleiben und die Bereiche Neu, Entwürfe, Eingereicht und Ausgezahlt wieder sichtbar sein sollen. Nur der Datumsfilter soll entfallen. | E-12 hat Vorrang vor Marcos früherem Vorschlag und E-11: Gutschriftenliste und Meldungen sind gegenseitig verlinkt; eingereichte Meldungen bleiben schreibgeschützt mit Nachweisdownload. Die einfache Stichtagsübersicht und Mitarbeiter im Profilmenü bleiben bestehen. |
| Meldungsfilter in der Übersicht | Die direkte Nutzeranweisung vom 07.10.2026 verlegt die Statusfilter auf die Stichtagsübersicht und entfernt „Meldungen“ aus der Seitennavigation. | E-14 ersetzt nur die Platzierung aus E-12: Die Übersicht filtert nach Neu, Entwürfen, Eingereicht und Abgeschlossen. „Eingereicht“ enthält weiterhin alle eigenen Einreichungen einschließlich später abgeschlossener Vorgänge. E-16 entfernt zusätzlich den Gutschriftenpunkt aus der Seitennavigation; Vorgänge und Nachweise bleiben erreichbar. |

## Vom PDF ausdrücklich nicht umfasst

Zahlungsausführung, Buchung in DATEV, fachliche Pflege von Produkt-/Preis-/Senkungstermindaten, Migration historischer Vorgänge, Entwicklung externer NGDA-/DATEV-/ISK-Dienste sowie vollständige Betriebs-, Backup- und SLA-Spezifikation sind laut P S. 5 nicht Teil dieses Fachkonzepts. Unser technisches Dokument benennt dafür notwendige Integrationsverträge und Betriebskriterien; es behauptet nicht, diese externen Leistungen seien bereits geliefert.
