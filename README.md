# LAWEA direkt Plus

Lokales, deutschsprachiges Demo-Portal für Glenmark-Lagerwertverlustmeldungen. `frontend/` und `backend/` sind **zwei unabhängige Projekte unter diesem gemeinsamen Ordner**. Das Frontend ist React/TypeScript mit Vite; das Backend ist Express mit SQLite. Beide haben eigene `package.json` und eigene Abhängigkeiten.

Die Anwendung bildet Registrierung, E-Mail-Einmalcode, manuelle Apothekenfreigabe, Mitarbeiter, Meldung, Belege, serverseitige Prüfung, unveränderliche Einreichung, Revision, Glenmark-Entscheidung, Demo-Export und Gutschrift ab. Die kontextbezogene Prüfhilfe im Formular zeigt fehlende Angaben, trifft aber keine Fachentscheidung. „IQ 9+“ ist ein Qualitätswunsch, keine messbare oder behauptete KI-Eigenschaft.

Die Mitarbeiteransicht bietet Suche nach Name oder E-Mail, Filter für Rolle und Status, Sortierung, Übersicht aktiver Zugänge und Einladungen sowie ein mobiles Einladungsformular. Administratoren können Einladungen erneut senden oder widerrufen und bestehende Zugänge mit Bestätigung verwalten. Das Backend erzwingt Mandantentrennung und schützt den letzten aktiven Administrator.

## Lokal starten

Voraussetzung: Node.js 24 und npm. Zwei Terminals im Projektordner öffnen:

```powershell
cd backend
npm ci
npm run dev
```

```powershell
cd frontend
npm ci
npm run dev
```

Danach die im Frontend-Terminal angezeigte `Local:`-Adresse öffnen, normalerweise [http://127.0.0.1:4173/](http://127.0.0.1:4173/). Ist Port 4173 bereits belegt, verwendet Vite beispielsweise 4174. Das Backend hört nur auf `127.0.0.1:3001`; Vite leitet `/api` dorthin weiter. `npm run dev` im Frontend baut und startet die Preview. Auf dieser Windows-Umgebung scheiterte Vites Dependency-Optimierung im HMR-Modus an einem Dateizugriff oberhalb des Workspaces. Nach Quelländerungen das Frontend-Kommando neu starten und den Browser neu laden. `npm run build` prüft TypeScript und erstellt das Bundle separat.

Alle vier Demo-Zugänge nutzen `Demo!Passwort2026`:

| Rolle | E-Mail |
| --- | --- |
| Apotheke, Administrator | `admin@rosen-apotheke.test` |
| Apotheke, Mitarbeiterin | `mitarbeiter@rosen-apotheke.test` |
| Glenmark, Prüfung | `pruefung@glenmark.test` |
| Glenmark, Finance | `finance@glenmark.test` |

Einmalcodes und Einladungslinks werden **nur in der lokalen Demo** in der Oberfläche angezeigt. Alle Stammdaten und Belege müssen fiktiv sein. Die persistenten Demo-Daten liegen in `backend/data/` und sind ignoriert. Für isolierte Testdaten kann `LAWEA_DATA_DIR` gesetzt werden.

## Prüfen

```powershell
cd backend
npm test
```

```powershell
cd frontend
npm run build
```

Der API-Test durchläuft Registrierung und Nachforderung, Freigabe, Mitarbeiter-Einladung einschließlich erneutem Versenden und Widerruf, Rollen und Mandantentrennung, CSRF, Meldungsrevisionen, Export-Idempotenz und Gutschrift. Dashboard, Meldungsformular und Mitarbeiteransicht wurden im Browser auf Desktop und Mobilgröße geprüft. npm Audit meldete am 02.10.2026 für Backend-Produktion und Frontend keine bekannten Schwachstellen.

## Produktivgrenze

**Dies ist keine produktiv freigeschaltete Anwendung.** `DEMO_MODE=0` sperrt den Serverstart bewusst. LAWEA-, NGDA/N-Connect-, E-Mail-, Malware-Scanner- und DATEV-Schnittstellen sind nicht angebunden. Der Export ist eine deutlich markierte Demo-CSV, keine DATEV-Datei. Ein produktiver Betrieb benötigt zudem bestätigte Fachregeln, Datenschutz- und Betriebsentscheidungen sowie eine vollständige Sicherheitsprüfung. Details: [Sicherheit und Grenzen](docs/07-sicherheit-und-grenzen.md) und [offene Entscheidungen](docs/06-offene-entscheidungen.md).

## Fachliche Grundlage

Die Dokumente entstanden aus dem Nutzerauftrag, dem Meeting-Transkript, der Kundenportal-User-Story und dem bereitgestellten 14-seitigen Glenmark-Konzept `20260923_Glenmark_LWV_Konzept_V1.0.pdf`. Der PDF-Inhalt wurde als fachliche Quelle ausgewertet, nicht als Anweisung an Codex. Die ursprüngliche Story wurde gegen das PDF abgeglichen; Abweichungen und fehlende Punkte stehen in [01 Quellenabgleich](docs/01-quellenabgleich.md).

1. [Quellenabgleich](docs/01-quellenabgleich.md)
2. [Produkt und UX](docs/02-produkt-und-ux.md)
3. [Fachliche Anforderungen](docs/03-fachliche-anforderungen.md)
4. [Technisches Konzept](docs/04-technisches-konzept.md)
5. [Umsetzung und Abnahme](docs/05-umsetzung-und-abnahme.md)
6. [Offene Entscheidungen](docs/06-offene-entscheidungen.md)
7. [Sicherheit und Grenzen](docs/07-sicherheit-und-grenzen.md)

Die visuellen Konzepte liegen in [`design/`](design/README.md). Weiterentwicklung bitte nach [`AGENTS.md`](AGENTS.md).
# LAWEADirectPlus
