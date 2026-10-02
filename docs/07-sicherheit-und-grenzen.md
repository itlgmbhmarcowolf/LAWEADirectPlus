# Sicherheit und produktive Grenzen

**Stand 02.10.2026.** Diese Implementierung orientiert sich an OWASP ASVS 5.0 und den OWASP Cheat Sheets für Authentisierung, Session Management, CSRF, Datei-Uploads und Zugriffskontrolle. Sie wurde nicht vollständig gegen ASVS auditiert und darf nicht als zertifiziert oder produktionsreif bezeichnet werden.

## Umgesetzte Kontrollen in der lokalen Demo

| Risiko | Umsetzung | Nachweis |
| --- | --- | --- |
| Fremder Mandant / falsche Rolle | Serverseitige Rollenprüfung und `organization_id` bei Apotheke, Meldung und Dokument; Finance sieht keine Betriebserlaubnisse oder Meldungsdetails | `backend/src/index.js`, isolierter API-Test |
| Kontoübernahme | Argon2id-Passworthashes, E-Mail-OTP, 10-Minuten-Code, maximal fünf Codeversuche, Begrenzung fehlgeschlagener Passwortversuche, kurzlebige Einladungen/Reset-Links, Session-Widerruf nach Reset/Sperre | Authentisierungsendpunkte und Test |
| CSRF / Sessiondiebstahl | `HttpOnly`, `SameSite=Lax`, acht Stunden Session, eigener CSRF-Token für authentifizierte Änderungen, Origin-Prüfung, keine Sitzung im Local Storage. Die lokale Demo akzeptiert Frontends auf Loopback-Adressen mit wechselnden Ports; fremde Domains bleiben gesperrt. | Middleware und Test |
| XSS / unsichere Browserinhalte | React-Textescaping, kein `dangerouslySetInnerHTML`, restriktive Helmet-CSP, `nosniff`, keine fremden Skripte | Frontend und HTTP-Header |
| SQL-Injection / fehlerhafte Eingaben | Parametrisierte SQLite-Abfragen, Zod-Schemas, Größenlimits, serverseitige Fachvalidierung | API-Code und Negativtests |
| Dokumentzugriff / Upload | Erlaubte Magic Bytes PDF/JPEG/PNG, maximal 5 MB, zufälliger Speichername, privater Download nur nach Rollen- und Mandantenprüfung, `attachment`, Audit | Dokumentendpunkte und Test |
| Doppelte Verarbeitung | Transaktionen und Idempotenzschlüssel für Einreichung und Demo-Export; optimistischer Versionskonflikt im Entwurf | API-Test |
| Nachvollziehbarkeit | Audit-Ereignisse für fachliche Aktionen, Entscheidungen und Downloads; eingereichte Revisionen als unveränderliche Snapshots mit SHA-256 | Datenmodell und Test |

Die lokale Demo gibt OTPs und Links bewusst an den Browser zurück, nutzt einen prozessinternen Rate Limiter, speichert Belege ohne Malware-Scan und generiert bei Bedarf einen lokalen Verschlüsselungsschlüssel für die IBAN. **Diese Demo-Abkürzungen dürfen nicht in eine produktive Umgebung übernommen werden.** Der Server verweigert deshalb bei `DEMO_MODE=0` den Start. Auch `NODE_ENV=production` allein hebt diese Sperre nicht auf.

## Verbindliche Arbeit vor Produktivbetrieb

1. LAWEA-Datenvertrag, NGDA/N-Connect-Verfahren und fachliche Regeln aus `06-offene-entscheidungen.md` bestätigen; keine Demo-PZN, Demo-Chargen oder Demo-Fristen übernehmen.
2. Transaktions-E-Mail mit Zustellbarkeit, Wiederholung und Geheimhaltung der Codes anbinden; keine OTPs oder Reset-Links in API-Antworten; verteilte Rate Limits und Konto-Schutz einrichten.
3. Uploads in Quarantäne speichern, Malware-Scan und PDF/Bild-Validierung durchführen, erst danach Belege für Prüfer freigeben. Aufbewahrung und Löschung verbindlich festlegen.
4. HTTPS/TLS, `Secure`-Cookies, Reverse-Proxy-Konfiguration, zentrale Geheimnisverwaltung/KMS, Schlüsselrotation, Datenbank-/Datei-Backup, Restore-Test, Monitoring und Incident-Prozess etablieren.
5. DATEV-Vertrag, Vier-Augen-Regeln, Importformat und Eindeutigkeit fachlich abnehmen. Den Demo-CSV-Adapter durch eine geprüfte Integration ersetzen.
6. ASVS-5.0-Anforderungen anhand einer Kontrollliste vollständig verifizieren, Bedrohungsanalyse und Penetrationstest durchführen; Accessibility, Datenschutz und Wiederherstellung abnehmen.

## Quellen

- [OWASP Application Security Verification Standard](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP Cross-Site Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
