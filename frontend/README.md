# Frontend

Eigenständiges React-/TypeScript-Projekt für LAWEA direkt Plus.

```powershell
npm ci
npm run dev
```

Die Anwendung läuft normalerweise unter `http://127.0.0.1:4173/`; wenn dieser Port belegt ist, zeigt Vite eine andere `Local:`-Adresse an, etwa Port 4174. Öffne genau diese Adresse. `/api` wird an das getrennte Backend auf Port 3001 weitergeleitet. `npm run build` prüft TypeScript und baut das Bundle. Auf dieser Windows-Umgebung nutzt `npm run dev` Build plus Preview ohne HMR; nach Codeänderungen neu starten und den Browser neu laden.

Die lokale Oberfläche zeigt fiktive Demo-Zugänge und OTPs. Produktive Anbindungen sind bewusst deaktiviert; siehe `../README.md` und `../docs/07-sicherheit-und-grenzen.md`.
