import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import Database from 'better-sqlite3'
import { hashSync } from '@node-rs/argon2'

const dataDir = path.resolve(process.env.LAWEA_DATA_DIR || 'data')
fs.mkdirSync(dataDir, { recursive: true })
export const db = new Database(path.join(dataDir, 'lawea.sqlite'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, street TEXT NOT NULL, zip TEXT NOT NULL,
  city TEXT NOT NULL, owner TEXT NOT NULL, phone TEXT NOT NULL, iban_enc TEXT NOT NULL,
  homepage TEXT, status TEXT NOT NULL, verification_source TEXT NOT NULL DEFAULT 'MANUAL',
  license_document_id TEXT, created_at TEXT NOT NULL, reviewed_at TEXT
);
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, organization_id TEXT REFERENCES organizations(id),
  name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
  role TEXT NOT NULL, status TEXT NOT NULL, email_verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS challenges (
  id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id), purpose TEXT NOT NULL,
  code_hash TEXT NOT NULL, expires_at TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0,
  consumed_at TEXT, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
  csrf_hash TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL,
  csrf_enc TEXT
);
CREATE TABLE IF NOT EXISTS invitations (
  id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id),
  email TEXT NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL,
  token_hash TEXT NOT NULL, expires_at TEXT NOT NULL, consumed_at TEXT,
  created_by TEXT NOT NULL REFERENCES users(id), revoked_at TEXT
);
CREATE TABLE IF NOT EXISTS password_resets (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL, consumed_at TEXT, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS terms (
  id TEXT PRIMARY KEY, label TEXT NOT NULL, date TEXT NOT NULL,
  opens_at TEXT NOT NULL, closes_at TEXT NOT NULL, source TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS products (
  pzn TEXT PRIMARY KEY, name TEXT NOT NULL, maker TEXT NOT NULL,
  valid_charges TEXT NOT NULL, source TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS term_products (
  term_id TEXT NOT NULL REFERENCES terms(id), pzn TEXT NOT NULL REFERENCES products(pzn),
  PRIMARY KEY (term_id, pzn)
);
CREATE TABLE IF NOT EXISTS claims (
  id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id),
  term_id TEXT NOT NULL REFERENCES terms(id), number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL, revision_no INTEGER NOT NULL DEFAULT 1,
  version INTEGER NOT NULL DEFAULT 1, draft_json TEXT NOT NULL,
  rule_result TEXT, rejection_reason TEXT, export_run_id TEXT,
  created_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL, submitted_at TEXT
);
CREATE TABLE IF NOT EXISTS claim_revisions (
  claim_id TEXT NOT NULL REFERENCES claims(id), revision_no INTEGER NOT NULL,
  snapshot_json TEXT NOT NULL, snapshot_hash TEXT NOT NULL,
  status TEXT NOT NULL, submitted_by TEXT NOT NULL REFERENCES users(id),
  submitted_at TEXT NOT NULL, decision_by TEXT, decision_at TEXT,
  decision_reason TEXT, PRIMARY KEY (claim_id, revision_no)
);
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY, organization_id TEXT REFERENCES organizations(id),
  claim_id TEXT REFERENCES claims(id), kind TEXT NOT NULL, original_name TEXT NOT NULL,
  mime TEXT NOT NULL, size INTEGER NOT NULL, sha256 TEXT NOT NULL,
  storage_name TEXT NOT NULL, scan_status TEXT NOT NULL,
  uploaded_by TEXT REFERENCES users(id), created_at TEXT NOT NULL, removed_at TEXT
);
CREATE TABLE IF NOT EXISTS export_runs (
  id TEXT PRIMARY KEY, created_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL,
  count INTEGER NOT NULL, sha256 TEXT NOT NULL, content TEXT NOT NULL,
  status TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS credits (
  id TEXT PRIMARY KEY, claim_id TEXT REFERENCES claims(id), organization_id TEXT REFERENCES organizations(id),
  document_id TEXT NOT NULL REFERENCES documents(id), reference TEXT NOT NULL,
  status TEXT NOT NULL, reason TEXT, imported_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL, published_at TEXT
);
CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY, actor_id TEXT, organization_id TEXT, object_type TEXT NOT NULL,
  object_id TEXT NOT NULL, action TEXT NOT NULL, detail TEXT NOT NULL, at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS outbox (
  id TEXT PRIMARY KEY, email TEXT NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL,
  status TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS idempotency (
  scope TEXT NOT NULL, key TEXT NOT NULL, result_json TEXT NOT NULL,
  PRIMARY KEY (scope, key)
);
CREATE INDEX IF NOT EXISTS idx_claims_org ON claims(organization_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(organization_id, claim_id);
CREATE INDEX IF NOT EXISTS idx_outbox_email ON outbox(email, created_at);
`)
if (!db.prepare('PRAGMA table_info(documents)').all().some(column => column.name === 'removed_at')) {
  db.exec('ALTER TABLE documents ADD COLUMN removed_at TEXT')
}
if (!db.prepare('PRAGMA table_info(sessions)').all().some(column => column.name === 'csrf_enc')) {
  db.exec('ALTER TABLE sessions ADD COLUMN csrf_enc TEXT')
}
if (!db.prepare('PRAGMA table_info(invitations)').all().some(column => column.name === 'revoked_at')) {
  db.exec('ALTER TABLE invitations ADD COLUMN revoked_at TEXT')
}

export const now = () => new Date().toISOString()
export const id = () => crypto.randomUUID()
export const digest = (value) => crypto.createHash('sha256').update(value).digest('hex')

const keyPath = path.join(dataDir, 'demo-secret.key')
let encryptionKey
if (process.env.APP_ENCRYPTION_KEY) {
  encryptionKey = Buffer.from(process.env.APP_ENCRYPTION_KEY, 'base64')
} else {
  if (process.env.NODE_ENV === 'production') throw new Error('APP_ENCRYPTION_KEY fehlt')
  if (!fs.existsSync(keyPath)) fs.writeFileSync(keyPath, crypto.randomBytes(32), { mode: 0o600 })
  encryptionKey = fs.readFileSync(keyPath)
}
if (encryptionKey.length !== 32) throw new Error('APP_ENCRYPTION_KEY muss 32 Byte enthalten')

export function encrypt(value) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64')
}
export function decrypt(value) {
  const data = Buffer.from(value, 'base64')
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, data.subarray(0, 12))
  decipher.setAuthTag(data.subarray(12, 28))
  return Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString('utf8')
}
export const maskIban = (value) => `${value.slice(0, 2)}••••••••••••${value.slice(-4)}`

export function audit(actor, organizationId, objectType, objectId, action, detail = '') {
  db.prepare(`INSERT INTO audit_events VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id(), actor ?? null, organizationId ?? null, objectType, objectId, action, detail, now()
  )
}
export function mail(email, subject, body) {
  db.prepare('INSERT INTO outbox VALUES (?, ?, ?, ?, ?, ?)').run(id(), email, subject, body, 'DEMO', now())
}

export function seedDemo() {
  if (db.prepare('SELECT count(*) AS n FROM users').get().n) return
  const pharmacyId = id()
  const adminId = id()
  const staffId = id()
  const reviewerId = id()
  const financeId = id()
  const current = now()
  const password = hashSync('Demo!Passwort2026', { memoryCost: 19456, timeCost: 2, parallelism: 1 })
  const termDate = new Date()
  termDate.setUTCDate(1)
  const activeDate = termDate.toISOString().slice(0, 10)
  const open = new Date(termDate)
  open.setUTCDate(open.getUTCDate() - 7)
  const close = new Date(termDate)
  close.setUTCDate(close.getUTCDate() + 35)
  const past = new Date(termDate)
  past.setUTCMonth(past.getUTCMonth() - 2)
  const pastClose = new Date(past)
  pastClose.setUTCDate(pastClose.getUTCDate() + 30)
  db.transaction(() => {
    db.prepare(`INSERT INTO organizations (id,name,street,zip,city,owner,phone,iban_enc,homepage,status,created_at,reviewed_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(pharmacyId, 'Rosen-Apotheke am Markt', 'Marktstraße 12', '10115', 'Berlin', 'Dr. Julia Berger', '030 555 0101', encrypt('DE89370400440532013000'), null, 'APPROVED', current, current)
    const insertUser = db.prepare(`INSERT INTO users VALUES (?,?,?,?,?,?,?,?,?)`)
    insertUser.run(adminId, pharmacyId, 'Julia Berger', 'admin@rosen-apotheke.test', password, 'PHARMACY_ADMIN', 'ACTIVE', 1, current)
    insertUser.run(staffId, pharmacyId, 'Maria Keller', 'mitarbeiter@rosen-apotheke.test', password, 'PHARMACY_STAFF', 'ACTIVE', 1, current)
    insertUser.run(reviewerId, null, 'Glenmark Prüfung', 'pruefung@glenmark.test', password, 'REVIEWER', 'ACTIVE', 1, current)
    insertUser.run(financeId, null, 'Glenmark Finance', 'finance@glenmark.test', password, 'FINANCE', 'ACTIVE', 1, current)
    db.prepare('INSERT INTO terms VALUES (?,?,?,?,?,?)').run('term-current', `Senkungstermin ${activeDate}`, activeDate, open.toISOString(), close.toISOString(), 'DEMO')
    db.prepare('INSERT INTO terms VALUES (?,?,?,?,?,?)').run('term-past', `Senkungstermin ${past.toISOString().slice(0, 10)}`, past.toISOString().slice(0, 10), past.toISOString(), pastClose.toISOString(), 'DEMO')
    const product = db.prepare('INSERT INTO products VALUES (?,?,?,?,?)')
    product.run('04812345', 'Glenmark Metformin 500 mg', 'Glenmark', JSON.stringify(['GL-2401', 'GL-2402']), 'DEMO')
    product.run('07567890', 'Glenmark Ramipril 5 mg', 'Glenmark', JSON.stringify(['GM-5521', 'GM-5522']), 'DEMO')
    product.run('09998877', 'Glenmark Atorvastatin 20 mg', 'Glenmark', JSON.stringify(['AT-0815']), 'DEMO')
    product.run('01112223', 'Glenmark Pantoprazol 40 mg', 'Glenmark', JSON.stringify(['PT-0088']), 'DEMO')
    for (const pzn of ['04812345', '07567890', '09998877']) db.prepare('INSERT INTO term_products VALUES (?,?)').run('term-current', pzn)
    db.prepare('INSERT INTO term_products VALUES (?,?)').run('term-past', '04812345')
    const draft = { items: [{ pzn: '04812345', charge: 'GL-2401', quantity: 12 }], contactName: 'Julia Berger', contactEmail: 'admin@rosen-apotheke.test', comment: '', declaration: false }
    db.prepare(`INSERT INTO claims (id,organization_id,term_id,number,status,draft_json,created_by,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?)`).run(id(), pharmacyId, 'term-current', `LWV-DEMO-${new Date().getUTCFullYear()}-001`, 'DRAFT', JSON.stringify(draft), adminId, current, current)
  })()
}
