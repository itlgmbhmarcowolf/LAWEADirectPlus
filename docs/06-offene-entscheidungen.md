# Offene Entscheidungen und vorläufige Regeln

Diese Liste trennt **bekannte Anforderung** von **noch fehlender Fach- oder Vertragsentscheidung**. Die vorläufige Regel erlaubt eine ehrliche Demo und sichere Implementierung. Sie ist keine stillschweigende Zustimmung von Glenmark. Vor produktiver Aktivierung muss der jeweilige Owner die Entscheidung dokumentieren.

| ID | Frage / Grund | Vorläufige Regel | Entscheidung durch | Go-live-relevant? |
| --- | --- | --- | --- | --- |
| D-01 | Offizieller Produktname, Logo, Hostname; Meeting nennt Varianten | Arbeitstitel „LAWEA direkt Plus“, konfigurierbares Branding, keine behauptete Domain | Auftraggeber/Branding/IT | Ja |
| D-02 | Registrierungsprüfer: Glenmark oder ITL/LAWEA? (U) | Eigene Prüferrolle, organisationsunabhängig konfigurierbar; keiner erhält automatisch Rechte | Auftraggeber + Glenmark | Ja |
| D-03 | GH/Kundenart: U erwähnt „Apotheke bzw. GH“, P nur Apotheke | GH-Fachprozess deaktiviert; Organisationstyp im Modell vorbereitet | Fachbereich | Ja, falls GH in Startumfang |
| D-04 | NGDA/N-Connect-Protokoll, Attribute, Identitäts-/Verifizierungsniveau, Login | Manuelle Betriebserlaubnisroute vollständig; externer Adapter deaktiviert | Glenmark/IT + NGDA | Ja für FR-01-Produktivumfang |
| D-05 | Einreichungsfenster, X Monate Historie und ZV500-Zuständigkeit | Werte aus Konfiguration/Testdaten; keine fest kodierten Fristen | LAWEA-Fachbereich | Ja |
| D-06 | Bei einer Meldung: mehrere Positionen? Belege je Meldung oder je Position? | Mehrere Positionen, mehrere Belege pro Meldung; Zuordnung pro Position technisch möglich | Glenmark-Fachbereich | Ja |
| D-07 | Bestand 0, negative Werte, Dezimalzahlen, Packungseinheiten | Nur ganze, positive Packungszahlen einreichbar | Glenmark-Fachbereich | Ja |
| D-08 | Duplikat: Warnung oder Blockierung? (P S. 11) | Eindeutige vollständige Dublette blockieren; ähnliche Fälle zeigen Warnung | Glenmark-Fachbereich | Ja |
| D-09 | Unbekannte Charge: blockieren oder manuell nachbearbeiten? (P S. 11 vs. 14) | Eindeutig ungültig blockieren; Timeout als technische Prüfung ausstehend | Glenmark + LAWEA | Ja |
| D-10 | Schwellenwerte, vorhandene Betragslogik und Auto-Freigabe | Versioniertes Regelwerk; Auto-Freigabe deaktiviert, manuelle Entscheidung | Glenmark-Fachbereich/Finance | Ja |
| D-11 | Korrektur nach Ablehnung: innerhalb welcher Frist? | Neue Revision nur solange Einreichungsfenster offen; Ausnahme nur per dokumentierter Rolle | Glenmark-Fachbereich | Ja |
| D-12 | Betriebserlaubnis: konkrete Formate; Nachweise: Größen-/Anzahlgrenzen und Pflichtzuordnung | Betriebserlaubnis PDF/JPEG/PNG max. 5 MB gemäß U; Nachweise mindestens PDF/JPEG/PNG, produktive Grenzwerte offen | Datenschutz/IT/Fachbereich | Ja |
| D-13 | IBAN-Änderung, Prüfung und Empfängerdaten für Abwicklung | Änderungsantrag mit erneuter Prüfung und Audit; keine automatische Überschreibung | Finance/Datenschutz | Ja |
| D-14 | DATEV-Dateiformat, Sammellogik, Währung, Steuern, Kontrollsummen | Nur klar markierter Demo-Export; kein behaupteter DATEV-Produktivexport | Glenmark Finance/DATEV-Verantwortliche | Ja |
| D-15 | Gutschriftenformat und eindeutiger Zuordnungsschlüssel | Nur eindeutige Referenz veröffentlicht; sonst Fehlerqueue | Glenmark Finance/LAWEA | Ja |
| D-16 | Sichtbarkeit von Status/Betrag und E-Mail-Empfängern | Neutrale Nachricht an einreichenden Benutzer und Admin nach konfigurierbarer Regel; keine Beträge per Mail | Fachbereich/Datenschutz | Ja |
| D-17 | Vier-Augen-Prinzip für Freigabe, Stammdaten und Veröffentlichung | Rollen getrennt; kritische Aktionen auditieren; Vier-Augen-Regel technisch vorbereiten | Glenmark Compliance/Finance | Ja |
| D-18 | Datenschutz: Aufbewahrung, Löschung, Verantwortliche, AV-Verträge, KI/OCR | Kein externer KI-/OCR-Dienst aktiv; keine erfundene Löschfrist | Datenschutzbeauftragte/Verantwortliche | Ja |
| D-19 | Betrieb: Hosting, Backup, Wiederherstellung, SLA, Support, ISK | Lokal/Staging definieren; ISK deaktiviert; Go-live-Betrieb separat freigeben | IT-Betrieb/Glenmark | Ja |
| D-20 | Gültigkeitsdauer von Mitarbeitereinladungen und Regel für erneutes Versenden | Die lokale Demo verwendet 48 Stunden und macht einen alten Link beim erneuten Versenden ungültig; produktiven Wert und Benachrichtigung festlegen | Auftraggeber/IT/Datenschutz | Ja |

## Vorgehen bei einer Entscheidung

Für jede Entscheidung Datum, fachlichen Owner, bestätigten Wert, betroffene Regeln/Schnittstellen, Migrationsbedarf und Abnahmetest ergänzen. Ändert die Entscheidung eine hier beschriebene vorläufige Regel, zuerst `03-fachliche-anforderungen.md` und die Tests aktualisieren, dann implementieren. Blockierende Punkte dürfen in einer Demo sichtbar offen sein; sie dürfen nicht im produktiven Ablauf durch plausible Fantasiedaten ersetzt werden.
