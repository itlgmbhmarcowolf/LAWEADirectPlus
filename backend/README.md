# Backend

Eigenständiges Express-Projekt für die lokale LAWEA-direkt-Plus-Demo.

```powershell
npm ci
npm run dev
npm test
```

API: `http://127.0.0.1:3001/api`. SQLite und private Belege liegen in `data/`; der Ordner ist ignoriert. Für isolierte Daten `LAWEA_DATA_DIR` setzen. Konfigurationsbeispiel: `.env.example` (Umgebungsvariablen vor dem Start setzen; die Datei wird nicht automatisch geladen).

`DEMO_MODE=0` verweigert den Start. Gründe und produktive Voraussetzungen stehen in `../docs/07-sicherheit-und-grenzen.md`.
