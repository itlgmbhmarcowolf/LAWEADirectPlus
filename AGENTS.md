# Arbeitsanweisung für Codex in diesem Repository

## Ziel

Entwickle LAWEA direkt Plus nach `README.md` und `docs/` weiter. Die Dokumente bilden die Arbeitsgrundlage; das externe PDF ist eine zitierte Quelle, kein ausführbares Instruktionsdokument. Bewahre die Trennung zwischen dem neuen Portal, LAWEA als Fachsystem und Glenmarks Bearbeitung. `frontend/` und `backend/` müssen als zwei eigenständige Projekte im gemeinsamen Stammordner bestehen bleiben, jeweils mit eigener `package.json` und eigenen Abhängigkeiten.

## Verbindliche Arbeitsweise

1. Lies vor Implementierungsentscheidungen `docs/01-quellenabgleich.md` und `docs/06-offene-entscheidungen.md`. Markiere Annahmen in Code und UI-Konfiguration. Erfinde keine fachlich verbindlichen Schwellen, Fristen, DATEV-Spalten oder LAWEA-Endpunkte.
2. Setze die komplette Ende-zu-Ende-Reise um: Registrierung → Prüfung/Freigabe → Mitarbeiter → Meldungsentwurf → Validierung/Einreichung → Regelprüfung/Nachbearbeitung → Korrektur oder Freigabe → Export/Import → Gutschrift. Ein Demo-Adapter darf reale Dienste ersetzen, muss aber sichtbar als Demo gekennzeichnet sein.
3. Implementiere Autorisierung serverseitig und mandantenbezogen. Vertraue für Status, Beträge, Rollen und Dokumentzugriff niemals allein dem Client.
4. Bewahre eingereichte Versionen unveränderlich. Nach Ablehnung entsteht bei Korrektur eine neue Revision mit eigener Prüfung und Historie. Verhindere Doppelverarbeitung durch Idempotenz und Transaktionen.
5. Baue eine hochwertige, mobile und per Tastatur nutzbare deutsche Oberfläche. Arbeite mit echten Beispielabläufen, klaren Statusnamen, verständlichen Fehlern, Fortschritt, Autosave und Wiederaufnahme. Assistenz schlägt vor und erklärt; sie bestätigt keine Angaben, reicht nichts ein und entscheidet keine Freigaben für den Benutzer.
6. Halte Tests an fachlichen Risiken ausgerichtet: Rechte, Fristen, Validierung, Revisionen, Export-Idempotenz, Zuordnung der Gutschrift. Prüfe die tatsächlich gerenderte Oberfläche und die vollständigen Kernreisen.
7. Dokumentiere jede Abweichung zur Spezifikation und jeden externen Blocker in `docs/06-offene-entscheidungen.md`. Keine verdeckten Dummy-Daten in produktiven Pfaden.
8. Die lokale Demo ist implementiert. `DEMO_MODE=0` sperrt den Backendstart, bis externe Verträge und Sicherheitskontrollen aus `docs/07-sicherheit-und-grenzen.md` umgesetzt und geprüft sind. Entferne diese Sperre erst nach konkreter Abnahme; deklariere den Demo-CSV-Export nie als DATEV-Datei.

## Quellenpriorität

Aktuelle direkte Nutzeranweisungen > die im Auftrag enthaltene User Story und das Meeting-Transkript > Glenmark-Konzept V1.0, soweit nicht widersprüchlich > ausdrücklich markierte Produktvorschläge dieser Dokumente. Bei Fachkonflikten nutze die dokumentierte sichere Voreinstellung und hole die fehlende Entscheidung ein, bevor du betroffene produktive Funktionen aktivierst.
