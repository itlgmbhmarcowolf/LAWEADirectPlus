# Umsetzungsreferenz für die Oberfläche

Die generierten Konzepte [`dashboard-concept.png`](dashboard-concept.png) und [`claim-form-concept.png`](claim-form-concept.png) dienen als visuelle Referenz. Quelltexte und Eingabedaten in den Bildern sind Beispiele, keine Fach- oder Stammdatenquelle. Insbesondere die generierten Stichtage aus 2024/2025 und Dateiformate werden nicht übernommen; die Anwendung zeigt konfigurierbare Testdaten gemäß `docs/`.

## Designsystem

- **Grundfläche:** kühles Weiß `#ffffff`; sekundäre Fläche `#f6f9fb`.
- **Text:** Mitternachtsblau `#10234a`, sekundär `#536680`.
- **Akzent:** Petrol `#08738a`, Hover `#075b70`, heller Fokus/Fläche `#e8f6f9`.
- **Semantik:** Erfolg `#087a61`, Warnung `#a66112`, Fehler `#b42333`; Status stets zusätzlich textlich.
- **Linien:** `#d8e3ec`; wenig Schatten, 1px Trennung, 8–12px Radien.
- **Typografie:** System-/Inter-ähnliche Sans Serif, Headlines kräftig, Lesetext 15–16px, Tabellen und Navigation mindestens 14px.
- **Raster:** 240px linke Navigation, flexibler Hauptbereich, 300px Assistenzleiste; unter 1100px wandert Assistenz unter Hauptinhalt, unter 760px wird Navigation zum Menü.
- **Komponenten:** Topbar, Sidebar, Seitenkopf, Aktionsband, Termin-Highlight, Datenzeilen/Tabelle, Statuslabel, Formularfeld, Positionszeile, Uploadzone, Assistenzkasten, Dialog, Toast.
- **Bewegung:** kurze Zustandswechsel und Fokusübergänge; `prefers-reduced-motion` respektieren.

Die Produkttexte werden an `docs/02-produkt-und-ux.md` ausgerichtet. Keine Marketing-Kicker oder unbelegten Kennzahlen im Dashboard. Alle Eingaben und Buttons bleiben code-native und per Tastatur nutzbar.

## Mitarbeiterbereich V2

[`members-concept.png`](members-concept.png) ist die Desktop-Referenz, [`members-mobile-concept.png`](members-mobile-concept.png) die mobile Fortsetzung. Die Bildtexte sind Gestaltungsvorlage; fachlich gelten Backend und `docs/`.

- **Fokus:** Teamliste und Suche links; Einladungsformular rechts auf Desktop, mobil auf Anforderung.
- **Elemente:** drei echte Zählwerte, Suche, Status-Tabs, Rollenfilter, sortierbare Liste, Avatar/Name/E-Mail, dezentes Aktionsmenü, Einladungsstatus und Sicherheitshinweis.
- **Form:** weißer Hintergrund, navyfarbene Typografie, Petrol `#08738a`, blasse Aqua-Flächen, feine `#d8e3ec`-Linien, 6–8px Radius und sparsame Schatten. Keine zusätzlichen dekorativen Kacheln.
- **Typografie:** Seitenüberschrift 30–36px/750, Abschnitt 19–22px/700, Tabellenkopf 12–13px/650, Zeile 14px, Hilfetext 13px.
- **Responsive:** unter 980px Formular unter der Liste bzw. per Einladen-Schaltfläche; unter 680px Mitarbeiter als zugängliche Karten, Filter horizontal scrollbar, Kennzahlen kompakt nebeneinander.
- **Interaktion:** Such- und Filterzustand kombiniert, sortierte Ergebnisse, Aktionen mit Bestätigungsdialog für Rollen- und Statuswechsel; nur Administratoren dürfen ändern.
