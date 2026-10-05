# Frontend

Eigenständiges React-/TypeScript-Projekt für LAWEA direkt Plus.

```powershell
npm ci
npm run dev
```

Die Anwendung läuft normalerweise unter `http://127.0.0.1:4173/`; wenn dieser Port belegt ist, zeigt Vite eine andere `Local:`-Adresse an, etwa Port 4174. Öffne genau diese Adresse. `/api` wird an das getrennte Backend auf Port 3001 weitergeleitet. `npm run build` prüft TypeScript und baut das Bundle. Auf dieser Windows-Umgebung nutzt `npm run dev` Build plus Preview ohne HMR; nach Codeänderungen neu starten und den Browser neu laden.

Die lokale Oberfläche zeigt fiktive Demo-Zugänge und OTPs. Produktive Anbindungen sind bewusst deaktiviert; siehe `../README.md` und `../docs/07-sicherheit-und-grenzen.md`.

## Konzeptvorschau für Vercel

`npm run build:public-preview` erzeugt in `dist/` einen eigenständigen statischen Mockup-Build. Dieser nutzt `PreviewApp.tsx`, fiktive Daten und nur flüchtige Browser-Simulationen. Weder API noch Backend, E-Mail-Versand, Dateiupload oder DATEV-Export sind enthalten. Keine echten Kundendaten eingeben.

- **Vercel Drop:** Den Ordner `frontend/dist/` hochladen. Dieser Vorgang veröffentlicht direkt auf einer öffentlichen Produktions-URL; er ist nur für das ausdrücklich fiktive Mockup geeignet.
- **Vercel Git-Import:** Im gemeinsamen Repository `frontend` als Root Directory setzen. `vercel.json` führt den Vorschau-Build aus und veröffentlicht `dist/`. Die neuen Dateien müssen zuvor auf GitHub gepusht sein.
- **Lokale Fach-Demo:** `npm run build` und `npm run dev` verwenden weiter das getrennte Backend auf Port 3001.
