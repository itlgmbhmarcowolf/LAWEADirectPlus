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

Die Demo legt zusätzlich einen als Übung gekennzeichneten offenen Senkungstermin vom Vormonat an. So lässt sich eine neue Meldung erfassen, auch wenn der Beispielvorgang des aktuellen Termins bereits eingereicht wurde. Pro Apotheke und Senkungstermin bleibt weiterhin höchstens ein aktiver Vorgang zulässig; eine eingereichte Revision ist gesperrt.

## Öffentliche Konzeptvorschau

Für Kundengespräche kann ausschließlich das statische Frontend-Mockup gebaut und als **Vercel Preview** geteilt werden:

```powershell
cd frontend
npm ci
npm run build:public-preview
```

Der zu veröffentlichende Ordner ist `frontend/dist/`. Dieser Build verwendet `preview.html` und `src/PreviewApp.tsx` als eigenen Einstiegspunkt. Die Anmeldung mit fiktiven Demo-Zugängen und angezeigtem Einmalcode, die Rollen, Mitarbeitersuche und die Reise von der Meldung bis zur Gutschrift sind rein lokale Simulationen im Browser. Alle Personen, E-Mail-Adressen, Termine, PZN und Vorgangsnummern sind fiktive Beispiele. Es gibt keine API-Anfragen, echte Registrierung oder Authentifizierung, E-Mails, serverseitige Dateiübertragung, dauerhafte Speicherung oder DATEV-Datei. Ein für eine Beispielmeldung gewählter Nachweis bleibt nur in der aktuellen Browsersitzung und kann nach der simulierten Einreichung lokal erneut heruntergeladen werden. Die Vorschau ist ausdrücklich nicht für echte Angaben geeignet. Das lokale Frontend und Backend bleiben eigenständige Projekte; der normale Build mit `npm run build` erzeugt weiterhin die Backend-gebundene Demo. Vor jedem neuen Preview-Deploy `npm run build:public-preview` erneut ausführen, weil beide Builds denselben ignorierten `dist/`-Ordner verwenden.

Die Startseite der Konzeptvorschau zeigt eine bewusst einfache Liste fiktiver Stichtage vom 01.05. bis 01.10.2026 mit Beispielständen. „Ausgezahlt“ ist dort nur simuliert; daraus folgt keine echte Zahlung oder produktive Einreichungsfrist.

Bei einem Vercel-Git-Import `frontend` als **Root Directory** wählen. `frontend/vercel.json` legt den Vorschau-Build und `dist` als Ausgabe fest. Für einen einmaligen Ordner-Upload auf Vercel Drop nur den fertigen Ordner `frontend/dist/` auswählen; nicht den Projektstamm und nicht das Backend hochladen. Vercel Drop veröffentlicht direkt in eine Produktions-URL. Dieser Weg ist deshalb nur für die ausdrücklich fiktive Konzeptvorschau geeignet.

Die Apotheke trägt die Chargennummer selbst ein. Sie muss ausgefüllt sein; eine Prüfung gegen eine vorgegebene Chargenliste findet nicht statt. Die PZN muss weiterhin zum Senkungstermin passen.

**Demo erneut durchspielen:** Beim Abmelden eines Apothekenbenutzers werden die Meldungen seiner Apotheke aus den aktiven Demo-Ansichten genommen. Nach der nächsten Anmeldung kann dieselbe Apotheke für einen offenen Senkungstermin eine neue Meldung anlegen und erneut einreichen. Die alten Einreichungen, Belege und Revisionen bleiben intern unverändert als Demo-Historie erhalten; andere Apotheken und Konten werden nicht zurückgesetzt. Glenmark-Prüfung und Finance setzen beim eigenen Abmelden keine Apothekenmeldungen zurück. Diese Funktion existiert nur im lokalen Demo-Modus.

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
