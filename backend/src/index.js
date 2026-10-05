import express from 'express'
import helmet from 'helmet'
import multer from 'multer'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { hash, verify } from '@node-rs/argon2'
import { z } from 'zod'
import { db, id, now, digest, encrypt, decrypt, maskIban, audit, mail, seedDemo } from './db.js'

const DEMO = process.env.DEMO_MODE === '1' || (process.env.NODE_ENV !== 'production' && process.env.DEMO_MODE !== '0')
if (!DEMO) throw new Error('Produktiver Betrieb ist gesperrt: LAWEA-, E-Mail-, Scanner- und DATEV-Verträge fehlen.')
seedDemo()
const app = express()
const port = Number(process.env.PORT || 3001)
const origin = process.env.APP_ORIGIN || 'http://127.0.0.1:4173'
const allowedOrigins = new Set([origin])
function allowedOrigin(value) {
  if (allowedOrigins.has(value)) return true
  if (!DEMO) return false
  try {
    const parsed = new URL(value)
    return parsed.origin === value && parsed.protocol === 'http:' &&
      ['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname) && Boolean(parsed.port)
  } catch { return false }
}
const host = '127.0.0.1'
const fileDir = path.resolve(process.env.LAWEA_DATA_DIR || 'data', 'files')
fs.mkdirSync(fileDir, { recursive: true })
app.disable('x-powered-by')
app.set('trust proxy', false)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'], connectSrc: ["'self'"],
      objectSrc: ["'none'"], frameAncestors: ["'none'"], baseUri: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}))
app.use(express.json({ limit: '128kb' }))
app.use((req, _res, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers.origin && !allowedOrigin(req.headers.origin)) {
    return next(problem(403, 'Anfrage von fremder Herkunft abgelehnt.'))
  }
  next()
})

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } })
const email = z.email().max(254).transform(v => v.trim().toLowerCase())
const required = (max = 160) => z.string().trim().min(1).max(max)
const password = z.string().min(12).max(128)
function validGermanIban(value) {
  if (!/^DE\d{20}$/.test(value)) return false
  const rearranged = value.slice(4) + '1314' + value.slice(2, 4)
  let remainder = 0
  for (const digit of rearranged) remainder = (remainder * 10 + Number(digit)) % 97
  return remainder === 1
}
const registration = z.object({
  pharmacyName: required(), street: required(), zip: z.string().regex(/^\d{5}$/),
  city: required(), owner: required(), phone: required(40),
  iban: z.string().trim().transform(v => v.replace(/\s/g, '').toUpperCase()).pipe(z.string().refine(validGermanIban, 'Ungültige deutsche IBAN.')),
  homepage: z.union([z.url().max(300), z.literal('')]).optional(),
  name: required(), email, password, passwordAgain: password
}).strict()
const draftSchema = z.object({
  version: z.number().int().positive(),
  items: z.array(z.object({ pzn: z.string().regex(/^\d{8}$/), charge: z.string().trim().max(80), quantity: z.number().int().min(0).max(1000000) }).strict()).max(100),
  contactName: z.string().trim().max(160),
  contactEmail: z.union([email, z.literal('')]),
  comment: z.string().max(2000),
  declaration: z.boolean()
}).strict()
const invitationSchema = z.object({ name: required(), email, role: z.enum(['PHARMACY_ADMIN', 'PHARMACY_STAFF']) }).strict()
const challengeSchema = z.object({ challengeId: z.uuid(), code: z.string().regex(/^\d{6}$/) }).strict()
const loginSchema = z.object({ email, password: z.string().min(1).max(128) }).strict()
const actionKey = z.string().uuid()
const rate = new Map()
function limited(key, max = 8, windowMs = 15 * 60 * 1000) {
  const current = Date.now()
  const item = rate.get(key)
  if (!item || item.until < current) { rate.set(key, { count: 1, until: current + windowMs }); return }
  item.count++
  if (item.count > max) throw problem(429, 'Zu viele Versuche. Bitte später erneut versuchen.')
}
function problem(status, message, code = 'ERROR') {
  const e = new Error(message); e.status = status; e.code = code; return e
}
function parse(schema, input) {
  const result = schema.safeParse(input)
  if (!result.success) throw problem(400, result.error.issues.map(x => `${x.path.join('.')}: ${x.message}`).join('; '), 'VALIDATION')
  return result.data
}
function asyncRoute(fn) { return (req, res, next) => Promise.resolve(fn(req, res)).catch(next) }
const cookie = req => Object.fromEntries((req.headers.cookie || '').split(';').map(x => x.trim().split('=').slice(0, 2)).filter(x => x.length === 2))
function session(req) {
  const raw = cookie(req).lawea_session
  if (!raw || !/^[a-f0-9]{64}$/.test(raw)) return null
  const row = db.prepare(`SELECT s.*, u.id AS uid, u.name, u.email, u.role, u.status AS user_status,
    u.organization_id, u.email_verified, o.status AS org_status, o.name AS org_name
    FROM sessions s JOIN users u ON u.id=s.user_id
    LEFT JOIN organizations o ON o.id=u.organization_id WHERE s.token_hash=? AND s.expires_at>?`).get(digest(raw), now())
  if (!row || row.user_status !== 'ACTIVE' || !row.email_verified || (row.organization_id && row.org_status !== 'APPROVED')) return null
  return row
}
function requireUser(req, _res, next) {
  req.session = session(req)
  if (!req.session) return next(problem(401, 'Bitte erneut anmelden.', 'UNAUTHENTICATED'))
  next()
}
function requireRole(...roles) {
  return (req, _res, next) => roles.includes(req.session.role) ? next() : next(problem(403, 'Keine Berechtigung.', 'FORBIDDEN'))
}
function requireCsrf(req, _res, next) {
  const token = req.headers['x-csrf-token']
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return next(problem(403, 'Sicherheitsprüfung fehlgeschlagen.', 'CSRF'))
  const a = Buffer.from(digest(token), 'hex'), b = Buffer.from(req.session.csrf_hash, 'hex')
  if (!crypto.timingSafeEqual(a, b)) return next(problem(403, 'Sicherheitsprüfung fehlgeschlagen.', 'CSRF'))
  next()
}
function challenge(userId, purpose) {
  const challengeId = id()
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0')
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString()
  db.prepare('INSERT INTO challenges (id,user_id,purpose,code_hash,expires_at,created_at) VALUES (?,?,?,?,?,?)')
    .run(challengeId, userId, purpose, digest(`${challengeId}:${code}`), expires, now())
  return { challengeId, demoCode: DEMO ? code : undefined }
}
function consumeChallenge(input, purpose) {
  const { challengeId, code } = parse(challengeSchema, input)
  const row = db.prepare('SELECT * FROM challenges WHERE id=? AND purpose=?').get(challengeId, purpose)
  if (!row || row.consumed_at || row.expires_at < now() || row.attempts >= 5) throw problem(400, 'Code ungültig oder abgelaufen.', 'INVALID_CODE')
  db.prepare('UPDATE challenges SET attempts=attempts+1 WHERE id=?').run(challengeId)
  const a = Buffer.from(digest(`${challengeId}:${code}`), 'hex'), b = Buffer.from(row.code_hash, 'hex')
  if (!crypto.timingSafeEqual(a, b)) throw problem(400, 'Code ungültig oder abgelaufen.', 'INVALID_CODE')
  db.prepare('UPDATE challenges SET consumed_at=? WHERE id=?').run(now(), challengeId)
  return row.user_id
}
function createSession(res, userId) {
  const token = crypto.randomBytes(32).toString('hex')
  const csrf = crypto.randomBytes(32).toString('hex')
  db.prepare('INSERT INTO sessions (token_hash,user_id,csrf_hash,expires_at,created_at,csrf_enc) VALUES (?,?,?,?,?,?)')
    .run(digest(token), userId, digest(csrf), new Date(Date.now() + 8 * 3600000).toISOString(), now(), encrypt(csrf))
  res.cookie('lawea_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 8 * 3600000 })
  return csrf
}
function userPayload(s) { return { id: s.uid, name: s.name, email: s.email, role: s.role, organizationId: s.organization_id, organizationName: s.org_name } }
function pharmacyClaim(req, claimId, editable = false) {
  if (!z.uuid().safeParse(claimId).success) throw problem(404, 'Meldung nicht gefunden.')
  const claim = db.prepare('SELECT * FROM claims WHERE id=? AND organization_id=?').get(claimId, req.session.organization_id)
  if (!claim) throw problem(404, 'Meldung nicht gefunden.')
  if (editable && claim.status !== 'DRAFT') throw problem(409, 'Diese eingereichte Version ist gesperrt.')
  return claim
}
function isOpen(term) { const t = now(); return term && term.opens_at <= t && term.closes_at >= t }
function fileType(buffer) {
  if (buffer.subarray(0, 5).toString() === '%PDF-') return 'application/pdf'
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg'
  if (buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png'
  return null
}
function saveDocument(file, { organizationId, claimId = null, kind, userId = null }) {
  if (!file || !file.buffer?.length) throw problem(400, 'Bitte eine Datei auswählen.')
  const mime = fileType(file.buffer)
  if (!mime) throw problem(400, 'Nur PDF, JPEG und PNG sind erlaubt.')
  const documentId = id(), storageName = `${documentId}.bin`
  fs.writeFileSync(path.join(fileDir, storageName), file.buffer, { flag: 'wx', mode: 0o600 })
  const safeName = path.basename(file.originalname || 'Dokument').replace(/[\r\n"\\]/g, '_').slice(0, 160)
  db.prepare(`INSERT INTO documents VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    documentId, organizationId, claimId, kind, safeName, mime, file.size,
    digest(file.buffer), storageName, 'DEMO_ACCEPTED', userId, now(), null
  )
  return documentId
}
function claimView(row) {
  return { ...row, draft: JSON.parse(row.draft_json), draft_json: undefined,
    ruleResult: row.rule_result ? JSON.parse(row.rule_result) : null }
}

app.get('/api/health', (_req, res) => res.json({ ok: true, mode: 'DEMO', externalIntegrations: false }))
app.get('/api/session', (req, res) => {
  const s = session(req)
  if (!s) return res.json({ user: null, demo: DEMO })
  const csrf = s.csrf_enc ? decrypt(s.csrf_enc) : crypto.randomBytes(32).toString('hex')
  if (!s.csrf_enc) db.prepare('UPDATE sessions SET csrf_hash=?,csrf_enc=? WHERE token_hash=?').run(digest(csrf), encrypt(csrf), s.token_hash)
  res.json({ user: userPayload(s), csrf, demo: DEMO })
})
app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const input = parse(loginSchema, req.body)
  const user = db.prepare('SELECT u.*, o.status AS org_status FROM users u LEFT JOIN organizations o ON o.id=u.organization_id WHERE u.email=?').get(input.email)
  const invalid = () => {
    limited(`login:${input.email}`)
    throw problem(401, 'Anmeldung nicht möglich. Bitte Zugangsdaten und Freigabe prüfen.', 'LOGIN_FAILED')
  }
  if (!user) return invalid()
  const ok = await verify(user.password_hash, input.password)
  if (!ok || !user.email_verified || user.status !== 'ACTIVE' || (user.organization_id && user.org_status !== 'APPROVED')) return invalid()
  rate.delete(`login:${input.email}`)
  const result = challenge(user.id, 'LOGIN')
  mail(user.email, 'Ihr Anmeldecode', 'Ein neuer Anmeldecode wurde angefordert. Melden Sie sich nur auf der offiziellen Portalseite an.')
  res.json(result)
}))
app.post('/api/auth/verify', (req, res) => {
  const userId = consumeChallenge(req.body, 'LOGIN')
  const csrf = createSession(res, userId)
  const user = db.prepare(`SELECT u.id AS uid,u.name,u.email,u.role,u.organization_id,o.name AS org_name FROM users u LEFT JOIN organizations o ON o.id=u.organization_id WHERE u.id=?`).get(userId)
  audit(userId, user.organization_id, 'session', userId, 'LOGIN')
  res.json({ user: userPayload(user), csrf })
})
app.post('/api/auth/logout', requireUser, requireCsrf, (req, res) => {
  db.prepare('DELETE FROM sessions WHERE token_hash=?').run(req.session.token_hash)
  res.clearCookie('lawea_session', { path: '/' })
  res.json({ ok: true })
})

app.post('/api/register', upload.single('license'), asyncRoute(async (req, res) => {
  limited(`register:${req.ip}`, 4, 3600000)
  const input = parse(registration, req.body)
  if (input.password !== input.passwordAgain) throw problem(400, 'Passwörter stimmen nicht überein.')
  if (db.prepare('SELECT 1 FROM users WHERE email=?').get(input.email)) throw problem(409, 'Für diese E-Mail besteht bereits ein Zugang.')
  const orgId = id(), userId = id(), current = now()
  const passwordHash = await hash(input.password, { memoryCost: 19456, timeCost: 2, parallelism: 1 })
  let documentId
  db.transaction(() => {
    db.prepare(`INSERT INTO organizations (id,name,street,zip,city,owner,phone,iban_enc,homepage,status,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(orgId, input.pharmacyName, input.street, input.zip, input.city, input.owner, input.phone, encrypt(input.iban), input.homepage || null, 'PENDING_EMAIL', current)
    db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?,?,?,?)').run(userId, orgId, input.name, input.email, passwordHash, 'PHARMACY_ADMIN', 'PENDING_EMAIL', 0, current)
    documentId = saveDocument(req.file, { organizationId: orgId, kind: 'LICENSE', userId })
    db.prepare('UPDATE organizations SET license_document_id=? WHERE id=?').run(documentId, orgId)
    audit(userId, orgId, 'organization', orgId, 'REGISTERED')
  })()
  const result = challenge(userId, 'REGISTER')
  mail(input.email, 'E-Mail-Adresse bestätigen', 'Bitte geben Sie den Einmalcode im Portal ein. Anschließend wird Ihre Apotheke geprüft.')
  res.status(201).json({ ...result, status: 'PENDING_EMAIL' })
}))
app.post('/api/register/verify', (req, res) => {
  const userId = consumeChallenge(req.body, 'REGISTER')
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(userId)
  db.transaction(() => {
    db.prepare("UPDATE users SET email_verified=1,status='PENDING_APPROVAL' WHERE id=?").run(userId)
    db.prepare("UPDATE organizations SET status='PENDING_APPROVAL' WHERE id=?").run(user.organization_id)
    audit(userId, user.organization_id, 'organization', user.organization_id, 'EMAIL_VERIFIED')
  })()
  res.json({ status: 'PENDING_APPROVAL' })
})
app.post('/api/register/resubmit-evidence', upload.single('license'), asyncRoute(async (req, res) => {
  const input = parse(loginSchema, req.body)
  limited(`evidence:${input.email}`)
  const user = db.prepare("SELECT u.*,o.status AS org_status FROM users u JOIN organizations o ON o.id=u.organization_id WHERE u.email=? AND u.role='PHARMACY_ADMIN'").get(input.email)
  if (!user || user.org_status !== 'EVIDENCE_REQUESTED' || !(await verify(user.password_hash, input.password))) throw problem(401, 'Nachreichung nicht möglich.')
  let documentId
  db.transaction(() => {
    documentId = saveDocument(req.file, { organizationId: user.organization_id, kind: 'LICENSE', userId: user.id })
    db.prepare("UPDATE organizations SET license_document_id=?,status='PENDING_APPROVAL' WHERE id=?").run(documentId, user.organization_id)
    audit(user.id, user.organization_id, 'organization', user.organization_id, 'EVIDENCE_RESUBMITTED')
  })()
  res.json({ status: 'PENDING_APPROVAL' })
}))
function resetForUser(user) {
  const token = crypto.randomBytes(32).toString('hex')
  db.prepare('INSERT INTO password_resets VALUES (?,?,?,?,?,?)').run(id(), user.id, digest(token), new Date(Date.now() + 30 * 60000).toISOString(), null, now())
  mail(user.email, 'Passwort zurücksetzen', `Öffnen Sie ${origin}/reset?token=${token} und legen Sie ein neues Passwort fest.`)
  return DEMO ? `/reset?token=${token}` : undefined
}
app.post('/api/auth/reset/request', (req, res) => {
  const input = parse(z.object({ email }).strict(), req.body)
  limited(`reset:${input.email}`, 4, 3600000)
  const user = db.prepare("SELECT * FROM users WHERE email=? AND status='ACTIVE'").get(input.email)
  const demoLink = user ? resetForUser(user) : undefined
  res.json({ message: 'Falls ein aktiver Zugang besteht, wurde eine E-Mail versendet.', demoLink })
})
app.post('/api/auth/reset/complete', asyncRoute(async (req, res) => {
  const input = parse(z.object({ token: z.string().regex(/^[a-f0-9]{64}$/), password, passwordAgain: password }).strict(), req.body)
  if (input.password !== input.passwordAgain) throw problem(400, 'Passwörter stimmen nicht überein.')
  const row = db.prepare('SELECT * FROM password_resets WHERE token_hash=?').get(digest(input.token))
  if (!row || row.consumed_at || row.expires_at < now()) throw problem(400, 'Link ungültig oder abgelaufen.')
  const passwordHash = await hash(input.password, { memoryCost: 19456, timeCost: 2, parallelism: 1 })
  db.transaction(() => {
    db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(passwordHash, row.user_id)
    db.prepare('UPDATE password_resets SET consumed_at=? WHERE id=?').run(now(), row.id)
    db.prepare('DELETE FROM sessions WHERE user_id=?').run(row.user_id)
    audit(row.user_id, null, 'user', row.user_id, 'PASSWORD_RESET')
  })()
  res.json({ ok: true })
}))

app.get('/api/bootstrap', requireUser, (req, res) => {
  const s = req.session
  const terms = db.prepare('SELECT id,label,date,opens_at,closes_at,source FROM terms ORDER BY date DESC').all()
  const products = db.prepare('SELECT pzn,name,maker FROM products ORDER BY name').all()
  if (s.organization_id) {
    const org = db.prepare('SELECT * FROM organizations WHERE id=?').get(s.organization_id)
    const claims = db.prepare('SELECT c.*,t.date AS term_date,t.label AS term_label FROM claims c JOIN terms t ON t.id=c.term_id WHERE c.organization_id=? ORDER BY c.updated_at DESC').all(s.organization_id).map(claimView)
    const members = db.prepare('SELECT id,name,email,role,status FROM users WHERE organization_id=? ORDER BY name').all(s.organization_id)
    const invitations = s.role === 'PHARMACY_ADMIN' ? db.prepare(`SELECT id,name,email,role,expires_at,created_by
      FROM invitations WHERE organization_id=? AND consumed_at IS NULL AND revoked_at IS NULL AND expires_at>?
      ORDER BY expires_at ASC`).all(s.organization_id, now()) : []
    const credits = db.prepare("SELECT cr.id,cr.claim_id,cr.reference,cr.created_at,cr.published_at,cr.document_id,c.number AS claim_number FROM credits cr JOIN claims c ON c.id=cr.claim_id WHERE cr.organization_id=? AND cr.status='PUBLISHED' ORDER BY cr.published_at DESC").all(s.organization_id)
    const ownTermIds = new Set(claims.map(c => c.term_id))
    const visibleTerms = terms.filter(t => isOpen(t) || ownTermIds.has(t.id))
    res.json({ user: userPayload(s), organization: { id: org.id, name: org.name, street: org.street, zip: org.zip, city: org.city, owner: org.owner, phone: org.phone, ibanMasked: maskIban(decrypt(org.iban_enc)), status: org.status }, terms: visibleTerms, products, claims, members, invitations, credits, demo: DEMO })
  } else {
    const pending = s.role === 'REVIEWER' ? db.prepare("SELECT o.id,o.name,o.city,o.owner,o.created_at,o.license_document_id,u.name AS applicant,u.email FROM organizations o JOIN users u ON u.organization_id=o.id WHERE o.status='PENDING_APPROVAL' AND u.role='PHARMACY_ADMIN'").all() : []
    const claims = db.prepare(`SELECT c.*,o.name AS organization_name,t.date AS term_date,t.label AS term_label
      FROM claims c JOIN organizations o ON o.id=c.organization_id JOIN terms t ON t.id=c.term_id
      WHERE c.status IN ('MANUAL_REVIEW','APPROVED','REJECTED','COMPLETED') ORDER BY c.updated_at DESC`).all().map(row => s.role === 'REVIEWER' ? claimView(row) : {
        id: row.id, number: row.number, organization_id: row.organization_id, organization_name: row.organization_name,
        term_id: row.term_id, term_date: row.term_date, term_label: row.term_label, status: row.status,
        revision_no: row.revision_no, updated_at: row.updated_at, submitted_at: row.submitted_at,
        export_run_id: row.export_run_id
      })
    const exports = s.role === 'FINANCE' ? db.prepare('SELECT id,created_at,count,sha256,status FROM export_runs ORDER BY created_at DESC').all() : []
    const creditQueue = s.role === 'FINANCE' ? db.prepare('SELECT id,reference,status,reason,claim_id,document_id,created_at FROM credits ORDER BY created_at DESC').all() : []
    res.json({ user: userPayload(s), pending, claims, terms, products, exports, creditQueue, demo: DEMO })
  }
})
app.get('/api/products', requireUser, (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 80) : ''
  if (!q) return res.json([])
  const products = db.prepare('SELECT pzn,name,maker FROM products WHERE pzn LIKE ? OR name LIKE ? ORDER BY name LIMIT 20').all(`%${q}%`, `%${q}%`)
  res.json(products)
})
app.get('/api/documents/:id', requireUser, (req, res, next) => {
  try {
    if (!z.uuid().safeParse(req.params.id).success) throw problem(404, 'Dokument nicht gefunden.')
    const doc = db.prepare('SELECT * FROM documents WHERE id=?').get(req.params.id)
    if (!doc) throw problem(404, 'Dokument nicht gefunden.')
    const s = req.session
    const allowed = s.organization_id
      ? doc.organization_id === s.organization_id && doc.kind !== 'LICENSE' && (doc.kind === 'CREDIT' || !doc.removed_at)
      : s.role === 'REVIEWER' || (s.role === 'FINANCE' && doc.kind === 'CREDIT')
    if (!allowed) throw problem(404, 'Dokument nicht gefunden.')
    audit(s.uid, doc.organization_id, 'document', doc.id, 'DOWNLOAD')
    res.setHeader('Content-Type', doc.mime)
    res.setHeader('Content-Disposition', `attachment; filename="${doc.original_name.replace(/[\x00-\x1f\x7f"\\]/g, '_')}"`)
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.sendFile(doc.storage_name, { root: fileDir, dotfiles: 'deny' })
  } catch (e) { next(e) }
})
app.get('/api/audit', requireUser, requireRole('REVIEWER', 'FINANCE'), (req, res) => {
  res.json(db.prepare('SELECT object_type,object_id,action,detail,at,actor_id,organization_id FROM audit_events ORDER BY at DESC LIMIT 150').all())
})

app.post('/api/review/organizations/:id/approve', requireUser, requireRole('REVIEWER'), requireCsrf, (req, res) => {
  const org = db.prepare("SELECT * FROM organizations WHERE id=? AND status='PENDING_APPROVAL'").get(req.params.id)
  if (!org) throw problem(404, 'Antrag nicht gefunden.')
  const applicant = db.prepare("SELECT * FROM users WHERE organization_id=? AND role='PHARMACY_ADMIN'").get(org.id)
  if (!applicant?.email_verified || !org.license_document_id) throw problem(409, 'E-Mail oder Nachweis fehlen.')
  db.transaction(() => {
    db.prepare("UPDATE organizations SET status='APPROVED',reviewed_at=? WHERE id=?").run(now(), org.id)
    db.prepare("UPDATE users SET status='ACTIVE' WHERE organization_id=? AND email_verified=1").run(org.id)
    audit(req.session.uid, org.id, 'organization', org.id, 'APPROVED')
    mail(applicant.email, 'Ihr Zugang wurde freigegeben', 'Ihre Apotheke wurde freigegeben. Sie können sich nun im Portal anmelden.')
  })()
  res.json({ ok: true })
})
app.post('/api/review/organizations/:id/request-evidence', requireUser, requireRole('REVIEWER'), requireCsrf, (req, res) => {
  const reason = parse(z.object({ reason: required(1000) }).strict(), req.body).reason
  const org = db.prepare("SELECT * FROM organizations WHERE id=? AND status='PENDING_APPROVAL'").get(req.params.id)
  if (!org) throw problem(404, 'Antrag nicht gefunden.')
  db.prepare("UPDATE organizations SET status='EVIDENCE_REQUESTED' WHERE id=?").run(org.id)
  audit(req.session.uid, org.id, 'organization', org.id, 'EVIDENCE_REQUESTED', reason)
  const applicant = db.prepare("SELECT email FROM users WHERE organization_id=? AND role='PHARMACY_ADMIN'").get(org.id)
  mail(applicant.email, 'Nachweis benötigt', 'Für Ihren Antrag wird ein neuer Nachweis benötigt. Bitte melden Sie sich beim Support.')
  res.json({ ok: true })
})

app.post('/api/members/invite', requireUser, requireRole('PHARMACY_ADMIN'), requireCsrf, (req, res) => {
  const input = parse(invitationSchema, req.body)
  if (db.prepare('SELECT 1 FROM users WHERE email=?').get(input.email)) throw problem(409, 'Diese E-Mail hat bereits einen Zugang.')
  if (db.prepare('SELECT 1 FROM invitations WHERE organization_id=? AND email=? AND consumed_at IS NULL AND revoked_at IS NULL AND expires_at>?').get(req.session.organization_id, input.email, now())) throw problem(409, 'Für diese E-Mail besteht bereits eine offene Einladung.')
  const token = crypto.randomBytes(32).toString('hex'), invitationId = id()
  db.prepare('INSERT INTO invitations (id,organization_id,email,name,role,token_hash,expires_at,consumed_at,created_by) VALUES (?,?,?,?,?,?,?,?,?)').run(invitationId, req.session.organization_id, input.email, input.name, input.role, digest(token), new Date(Date.now() + 48 * 3600000).toISOString(), null, req.session.uid)
  audit(req.session.uid, req.session.organization_id, 'invitation', invitationId, 'CREATED')
  mail(input.email, 'Einladung zu LAWEA direkt Plus', `Sie wurden eingeladen. Öffnen Sie ${origin}/invite?token=${token} und legen Sie ein Passwort fest.`)
  res.status(201).json({ ok: true, demoLink: DEMO ? `/invite?token=${token}` : undefined })
})
app.post('/api/members/invitations/:id/resend', requireUser, requireRole('PHARMACY_ADMIN'), requireCsrf, (req, res) => {
  const invite = db.prepare('SELECT * FROM invitations WHERE id=? AND organization_id=? AND consumed_at IS NULL AND revoked_at IS NULL AND expires_at>?').get(req.params.id, req.session.organization_id, now())
  if (!invite) throw problem(404, 'Offene Einladung nicht gefunden.')
  const token = crypto.randomBytes(32).toString('hex')
  db.transaction(() => {
    db.prepare('UPDATE invitations SET token_hash=?,expires_at=? WHERE id=?').run(digest(token), new Date(Date.now() + 48 * 3600000).toISOString(), invite.id)
    audit(req.session.uid, invite.organization_id, 'invitation', invite.id, 'RESENT')
    mail(invite.email, 'Erneute Einladung zu LAWEA direkt Plus', `Öffnen Sie ${origin}/invite?token=${token} und legen Sie ein Passwort fest.`)
  })()
  res.json({ ok: true, demoLink: DEMO ? `/invite?token=${token}` : undefined })
})
app.post('/api/members/invitations/:id/revoke', requireUser, requireRole('PHARMACY_ADMIN'), requireCsrf, (req, res) => {
  const invite = db.prepare('SELECT * FROM invitations WHERE id=? AND organization_id=? AND consumed_at IS NULL AND revoked_at IS NULL').get(req.params.id, req.session.organization_id)
  if (!invite) throw problem(404, 'Offene Einladung nicht gefunden.')
  db.transaction(() => {
    db.prepare('UPDATE invitations SET revoked_at=? WHERE id=?').run(now(), invite.id)
    audit(req.session.uid, invite.organization_id, 'invitation', invite.id, 'REVOKED')
  })()
  res.json({ ok: true })
})
app.post('/api/members/accept', asyncRoute(async (req, res) => {
  const input = parse(z.object({ token: z.string().regex(/^[a-f0-9]{64}$/), password, passwordAgain: password }).strict(), req.body)
  if (input.password !== input.passwordAgain) throw problem(400, 'Passwörter stimmen nicht überein.')
  const invite = db.prepare('SELECT * FROM invitations WHERE token_hash=?').get(digest(input.token))
  if (!invite || invite.consumed_at || invite.revoked_at || invite.expires_at < now()) throw problem(400, 'Einladung ungültig oder abgelaufen.')
  if (db.prepare('SELECT 1 FROM users WHERE email=?').get(invite.email)) throw problem(409, 'Diese E-Mail hat bereits einen Zugang.')
  const userId = id(), passwordHash = await hash(input.password, { memoryCost: 19456, timeCost: 2, parallelism: 1 })
  db.transaction(() => {
    db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?,?,?,?)').run(userId, invite.organization_id, invite.name, invite.email, passwordHash, invite.role, 'PENDING_EMAIL', 0, now())
    db.prepare('UPDATE invitations SET consumed_at=? WHERE id=?').run(now(), invite.id)
    audit(invite.created_by, invite.organization_id, 'user', userId, 'INVITATION_ACCEPTED')
  })()
  const result = challenge(userId, 'INVITE')
  mail(invite.email, 'E-Mail-Adresse bestätigen', 'Bitte geben Sie den Einmalcode im Portal ein.')
  res.status(201).json(result)
}))
app.post('/api/members/verify', (req, res) => {
  const userId = consumeChallenge(req.body, 'INVITE')
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(userId)
  db.prepare("UPDATE users SET email_verified=1,status='ACTIVE' WHERE id=?").run(userId)
  audit(userId, user.organization_id, 'user', userId, 'EMAIL_VERIFIED')
  res.json({ ok: true })
})
app.post('/api/members/:id/role', requireUser, requireRole('PHARMACY_ADMIN'), requireCsrf, (req, res) => {
  const role = parse(z.object({ role: z.enum(['PHARMACY_ADMIN', 'PHARMACY_STAFF']) }).strict(), req.body).role
  const target = db.prepare('SELECT * FROM users WHERE id=? AND organization_id=?').get(req.params.id, req.session.organization_id)
  if (!target || target.status !== 'ACTIVE') throw problem(404, 'Mitarbeiter nicht gefunden.')
  if (target.id === req.session.uid) throw problem(403, 'Die eigene Rolle kann hier nicht geändert werden.', 'SELF_ROLE_CHANGE')
  db.transaction(() => {
    if (target.role === 'PHARMACY_ADMIN' && role !== target.role) {
      const n = db.prepare("SELECT count(*) AS n FROM users WHERE organization_id=? AND role='PHARMACY_ADMIN' AND status='ACTIVE'").get(target.organization_id).n
      if (n <= 1) throw problem(409, 'Mindestens ein aktiver Unternehmensadministrator ist erforderlich.')
    }
    db.prepare('UPDATE users SET role=? WHERE id=?').run(role, target.id)
    db.prepare('DELETE FROM sessions WHERE user_id=?').run(target.id)
    audit(req.session.uid, target.organization_id, 'user', target.id, 'ROLE_CHANGED', role)
  })()
  res.json({ ok: true })
})
app.post('/api/members/:id/reset', requireUser, requireRole('PHARMACY_ADMIN'), requireCsrf, (req, res) => {
  const target = db.prepare("SELECT * FROM users WHERE id=? AND organization_id=? AND status='ACTIVE'").get(req.params.id, req.session.organization_id)
  if (!target) throw problem(404, 'Mitarbeiter nicht gefunden.')
  const demoLink = resetForUser(target)
  audit(req.session.uid, target.organization_id, 'user', target.id, 'PASSWORD_RESET_REQUESTED')
  res.json({ ok: true, demoLink })
})
app.post('/api/members/:id/disable', requireUser, requireRole('PHARMACY_ADMIN'), requireCsrf, (req, res) => {
  const target = db.prepare('SELECT * FROM users WHERE id=? AND organization_id=?').get(req.params.id, req.session.organization_id)
  if (!target || target.status !== 'ACTIVE') throw problem(404, 'Mitarbeiter nicht gefunden.')
  db.transaction(() => {
    const active = db.prepare("SELECT count(*) AS n FROM users WHERE organization_id=? AND status='ACTIVE'").get(target.organization_id).n
    const admins = db.prepare("SELECT count(*) AS n FROM users WHERE organization_id=? AND role='PHARMACY_ADMIN' AND status='ACTIVE'").get(target.organization_id).n
    if (active <= 1 || (target.role === 'PHARMACY_ADMIN' && admins <= 1)) throw problem(409, 'Mindestens ein aktiver Mitarbeiter und Administrator sind erforderlich.')
    db.prepare("UPDATE users SET status='DISABLED' WHERE id=?").run(target.id)
    db.prepare('DELETE FROM sessions WHERE user_id=?').run(target.id)
    audit(req.session.uid, target.organization_id, 'user', target.id, 'DISABLED')
  })()
  res.json({ ok: true })
})
app.post('/api/members/:id/enable', requireUser, requireRole('PHARMACY_ADMIN'), requireCsrf, (req, res) => {
  const target = db.prepare("SELECT * FROM users WHERE id=? AND organization_id=? AND status='DISABLED' AND email_verified=1").get(req.params.id, req.session.organization_id)
  if (!target) throw problem(404, 'Gesperrter Mitarbeiter nicht gefunden.')
  db.transaction(() => {
    db.prepare("UPDATE users SET status='ACTIVE' WHERE id=?").run(target.id)
    audit(req.session.uid, target.organization_id, 'user', target.id, 'ENABLED')
    mail(target.email, 'Zugang wieder aktiviert', 'Ihr Zugang zu LAWEA direkt Plus wurde wieder aktiviert.')
  })()
  res.json({ ok: true })
})

app.post('/api/claims', requireUser, requireRole('PHARMACY_ADMIN', 'PHARMACY_STAFF'), requireCsrf, (req, res) => {
  const { termId } = parse(z.object({ termId: z.string().min(1).max(80) }).strict(), req.body)
  const term = db.prepare('SELECT * FROM terms WHERE id=?').get(termId)
  if (!isOpen(term)) throw problem(409, 'Dieser Senkungstermin ist nicht einreichbar.')
  const existing = db.prepare("SELECT id FROM claims WHERE organization_id=? AND term_id=? AND status<>'CANCELLED' ORDER BY created_at DESC LIMIT 1").get(req.session.organization_id, termId)
  if (existing) return res.json({ id: existing.id, existing: true })
  const claimId = id(), current = now(), number = `LWV-DEMO-${new Date().getUTCFullYear()}-${claimId.slice(0, 8).toUpperCase()}`
  const initial = { items: [], contactName: req.session.name, contactEmail: req.session.email, comment: '', declaration: false }
  db.prepare(`INSERT INTO claims (id,organization_id,term_id,number,status,draft_json,created_by,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(claimId, req.session.organization_id, termId, number, 'DRAFT', JSON.stringify(initial), req.session.uid, current, current)
  audit(req.session.uid, req.session.organization_id, 'claim', claimId, 'CREATED')
  res.status(201).json({ id: claimId, number })
})
app.get('/api/claims/:id', requireUser, (req, res) => {
  let claim
  if (req.session.organization_id) claim = pharmacyClaim(req, req.params.id)
  else if (req.session.role === 'REVIEWER') claim = db.prepare('SELECT * FROM claims WHERE id=?').get(req.params.id)
  if (!claim) throw problem(404, 'Meldung nicht gefunden.')
  const documents = db.prepare('SELECT id,kind,original_name,mime,size,scan_status,created_at,removed_at FROM documents WHERE claim_id=? ORDER BY created_at').all(claim.id)
  const revisions = db.prepare('SELECT revision_no,status,submitted_at,decision_at,decision_reason,snapshot_json FROM claim_revisions WHERE claim_id=? ORDER BY revision_no DESC').all(claim.id).map(r => ({ ...r, snapshot: JSON.parse(r.snapshot_json), snapshot_json: undefined }))
  const term = db.prepare('SELECT * FROM terms WHERE id=?').get(claim.term_id)
  const organization = db.prepare('SELECT id,name,city FROM organizations WHERE id=?').get(claim.organization_id)
  res.json({ claim: claimView(claim), documents, revisions, term, organization })
})
app.put('/api/claims/:id/draft', requireUser, requireRole('PHARMACY_ADMIN', 'PHARMACY_STAFF'), requireCsrf, (req, res) => {
  const claim = pharmacyClaim(req, req.params.id, true)
  const input = parse(draftSchema, req.body)
  if (input.version !== claim.version) throw problem(409, 'Der Entwurf wurde inzwischen geändert. Bitte laden Sie ihn neu.', 'VERSION_CONFLICT')
  const { version, ...draft } = input
  const changed = db.prepare("UPDATE claims SET draft_json=?, version=version+1, updated_at=? WHERE id=? AND version=? AND status='DRAFT'")
    .run(JSON.stringify(draft), now(), claim.id, version)
  if (!changed.changes) throw problem(409, 'Der Entwurf wurde inzwischen geändert.', 'VERSION_CONFLICT')
  audit(req.session.uid, claim.organization_id, 'claim', claim.id, 'DRAFT_SAVED')
  res.json({ version: version + 1, savedAt: now() })
})
app.post('/api/claims/:id/documents', requireUser, requireRole('PHARMACY_ADMIN', 'PHARMACY_STAFF'), requireCsrf, upload.single('file'), (req, res) => {
  const claim = pharmacyClaim(req, req.params.id, true)
  const documentId = saveDocument(req.file, { organizationId: claim.organization_id, claimId: claim.id, kind: 'EVIDENCE', userId: req.session.uid })
  audit(req.session.uid, claim.organization_id, 'document', documentId, 'UPLOADED')
  res.status(201).json({ id: documentId, name: req.file.originalname, size: req.file.size })
})
app.post('/api/claims/:id/documents/:documentId/remove', requireUser, requireRole('PHARMACY_ADMIN', 'PHARMACY_STAFF'), requireCsrf, (req, res) => {
  const claim = pharmacyClaim(req, req.params.id, true)
  const doc = db.prepare("SELECT * FROM documents WHERE id=? AND claim_id=? AND organization_id=? AND kind='EVIDENCE' AND removed_at IS NULL").get(req.params.documentId, claim.id, claim.organization_id)
  if (!doc) throw problem(404, 'Dokument nicht gefunden.')
  db.prepare('UPDATE documents SET removed_at=? WHERE id=?').run(now(), doc.id)
  audit(req.session.uid, claim.organization_id, 'document', doc.id, 'REMOVED_FROM_DRAFT')
  res.json({ ok: true })
})
app.post('/api/claims/:id/cancel', requireUser, requireRole('PHARMACY_ADMIN', 'PHARMACY_STAFF'), requireCsrf, (req, res) => {
  const claim = pharmacyClaim(req, req.params.id, true)
  db.prepare("UPDATE claims SET status='CANCELLED',updated_at=? WHERE id=?").run(now(), claim.id)
  audit(req.session.uid, claim.organization_id, 'claim', claim.id, 'CANCELLED')
  res.json({ ok: true })
})
function validateSubmission(claim) {
  const term = db.prepare('SELECT * FROM terms WHERE id=?').get(claim.term_id)
  if (!isOpen(term)) throw problem(409, 'Die Einreichungsfrist ist abgelaufen. Ihr Entwurf bleibt erhalten.')
  const draft = JSON.parse(claim.draft_json)
  const errors = []
  if (!draft.items.length) errors.push('Mindestens eine Position erfassen.')
  if (!draft.contactName?.trim()) errors.push('Ansprechpartner angeben.')
  if (!email.safeParse(draft.contactEmail).success) errors.push('E-Mail des Ansprechpartners prüfen.')
  if (!draft.declaration) errors.push('Richtigkeit der Angaben bestätigen.')
  const docs = db.prepare("SELECT id,scan_status FROM documents WHERE claim_id=? AND kind='EVIDENCE' AND removed_at IS NULL").all(claim.id)
  if (!docs.length) errors.push('Mindestens einen Nachweis hochladen.')
  if (docs.some(d => d.scan_status !== 'DEMO_ACCEPTED')) errors.push('Ein Nachweis ist noch nicht geprüft.')
  const seen = new Set()
  for (const [index, item] of draft.items.entries()) {
    const product = db.prepare('SELECT * FROM products WHERE pzn=?').get(item.pzn)
    if (!product) { errors.push(`Position ${index + 1}: PZN unbekannt.`); continue }
    if (!db.prepare('SELECT 1 FROM term_products WHERE term_id=? AND pzn=?').get(claim.term_id, item.pzn)) errors.push(`Position ${index + 1}: PZN ist zu diesem Termin nicht betroffen.`)
    if (!JSON.parse(product.valid_charges).includes(item.charge.trim().toUpperCase())) errors.push(`Position ${index + 1}: Charge wurde von der Demo-LAWEA-Prüfung nicht bestätigt.`)
    if (!Number.isInteger(item.quantity) || item.quantity < 1) errors.push(`Position ${index + 1}: Bestand muss eine positive ganze Packungszahl sein.`)
    const key = `${item.pzn}:${item.charge.trim().toUpperCase()}`
    if (seen.has(key)) errors.push(`Position ${index + 1}: PZN und Charge sind doppelt.`)
    seen.add(key)
    const other = db.prepare("SELECT draft_json FROM claims WHERE organization_id=? AND term_id=? AND id<>? AND status NOT IN ('DRAFT','CANCELLED','REJECTED')").all(claim.organization_id, claim.term_id, claim.id)
    if (other.some(c => JSON.parse(c.draft_json).items.some(i => i.pzn === item.pzn && i.charge.trim().toUpperCase() === item.charge.trim().toUpperCase()))) errors.push(`Position ${index + 1}: Diese PZN/Charge wurde bereits eingereicht.`)
  }
  if (errors.length) throw problem(422, errors.join(' '), 'CLAIM_INVALID')
  return { draft, docIds: docs.map(d => d.id) }
}
app.post('/api/claims/:id/submit', requireUser, requireRole('PHARMACY_ADMIN', 'PHARMACY_STAFF'), requireCsrf, (req, res) => {
  const key = parse(z.object({ key: actionKey }).strict(), req.body).key
  const scope = `submit:${req.params.id}`
  const previous = db.prepare('SELECT result_json FROM idempotency WHERE scope=? AND key=?').get(scope, key)
  if (previous) return res.json(JSON.parse(previous.result_json))
  const result = db.transaction(() => {
    const claim = pharmacyClaim(req, req.params.id, true)
    const { draft, docIds } = validateSubmission(claim)
    const submittedAt = now()
    const snapshot = { ...draft, documentIds: docIds, termId: claim.term_id, submittedAt }
    const flags = draft.items.filter(i => i.quantity > 25).map(i => ({ pzn: i.pzn, rule: 'DEMO_QUANTITY_SAMPLE', note: 'Demo-Beispielgrenze; fachlich nicht freigegeben' }))
    const ruleResult = { version: 'DEMO-1', flags, automaticApproval: false, adapter: 'DEMO_LAWEA' }
    db.prepare(`INSERT INTO claim_revisions VALUES (?,?,?,?,?,?,?,?,?,?)`).run(claim.id, claim.revision_no, JSON.stringify(snapshot), digest(JSON.stringify(snapshot)), 'MANUAL_REVIEW', req.session.uid, submittedAt, null, null, null)
    db.prepare("UPDATE claims SET status='MANUAL_REVIEW',rule_result=?,submitted_at=?,updated_at=? WHERE id=?")
      .run(JSON.stringify(ruleResult), submittedAt, submittedAt, claim.id)
    audit(req.session.uid, claim.organization_id, 'claim', claim.id, 'SUBMITTED', `Revision ${claim.revision_no}`)
    mail(req.session.email, 'Ihre Meldung ist eingegangen', `Ihre Meldung ${claim.number} zum Senkungstermin wurde eingereicht. Details sehen Sie im Portal.`)
    const payload = { id: claim.id, number: claim.number, status: 'MANUAL_REVIEW', revision: claim.revision_no }
    db.prepare('INSERT INTO idempotency VALUES (?,?,?)').run(scope, key, JSON.stringify(payload))
    return payload
  })()
  res.json(result)
})
app.post('/api/claims/:id/revise', requireUser, requireRole('PHARMACY_ADMIN', 'PHARMACY_STAFF'), requireCsrf, (req, res) => {
  const claim = pharmacyClaim(req, req.params.id)
  if (claim.status !== 'REJECTED') throw problem(409, 'Nur abgelehnte Meldungen können korrigiert werden.')
  const term = db.prepare('SELECT * FROM terms WHERE id=?').get(claim.term_id)
  if (!isOpen(term)) throw problem(409, 'Die Korrekturfrist ist abgelaufen.')
  const old = JSON.parse(claim.draft_json)
  const draft = { ...old, declaration: false }
  db.prepare("UPDATE claims SET status='DRAFT',revision_no=revision_no+1,version=version+1,draft_json=?,rejection_reason=NULL,updated_at=? WHERE id=?")
    .run(JSON.stringify(draft), now(), claim.id)
  audit(req.session.uid, claim.organization_id, 'claim', claim.id, 'REVISION_STARTED', String(claim.revision_no + 1))
  res.json({ id: claim.id, revision: claim.revision_no + 1 })
})
app.post('/api/review/claims/:id/decision', requireUser, requireRole('REVIEWER'), requireCsrf, (req, res) => {
  const input = parse(z.object({ decision: z.enum(['APPROVE', 'REJECT']), reason: z.string().trim().max(2000).optional() }).strict(), req.body)
  if (input.decision === 'REJECT' && !input.reason) throw problem(400, 'Bei Ablehnung ist ein Grund erforderlich.')
  const claim = db.prepare("SELECT * FROM claims WHERE id=? AND status='MANUAL_REVIEW'").get(req.params.id)
  if (!claim) throw problem(404, 'Vorgang nicht im Arbeitsvorrat.')
  const status = input.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED'
  db.transaction(() => {
    db.prepare('UPDATE claims SET status=?,rejection_reason=?,updated_at=? WHERE id=?').run(status, input.reason || null, now(), claim.id)
    db.prepare('UPDATE claim_revisions SET status=?,decision_by=?,decision_at=?,decision_reason=? WHERE claim_id=? AND revision_no=?')
      .run(status, req.session.uid, now(), input.reason || null, claim.id, claim.revision_no)
    audit(req.session.uid, claim.organization_id, 'claim', claim.id, input.decision, input.reason || '')
    const recipient = db.prepare('SELECT email FROM users WHERE id=?').get(claim.created_by)
    if (recipient) mail(recipient.email, 'Status Ihrer Meldung geändert', `Ihr Vorgang ${claim.number} wurde bearbeitet. Details finden Sie im Portal.`)
  })()
  res.json({ status })
})

app.post('/api/finance/exports', requireUser, requireRole('FINANCE'), requireCsrf, (req, res) => {
  const key = parse(z.object({ key: actionKey }).strict(), req.body).key
  const old = db.prepare('SELECT result_json FROM idempotency WHERE scope=? AND key=?').get('finance-export', key)
  if (old) return res.json(JSON.parse(old.result_json))
  const result = db.transaction(() => {
    const rows = db.prepare(`SELECT c.id,c.number,c.organization_id,t.date AS term_date
      FROM claims c JOIN terms t ON t.id=c.term_id WHERE c.status='APPROVED' AND c.export_run_id IS NULL ORDER BY c.submitted_at`).all()
    if (!rows.length) throw problem(409, 'Keine freigegebenen, noch nicht exportierten Vorgänge.')
    const content = ['DEMO-NICHT-DATEV;Vorgangsnummer;Apotheke-ID;Stichtag',
      ...rows.map(r => `DEMO;${r.number};${r.organization_id};${r.term_date}`)].join('\r\n') + '\r\n'
    const runId = id(), current = now(), sha = digest(content)
    db.prepare('INSERT INTO export_runs VALUES (?,?,?,?,?,?,?)').run(runId, req.session.uid, current, rows.length, sha, content, 'DEMO_CREATED')
    const update = db.prepare('UPDATE claims SET export_run_id=? WHERE id=? AND export_run_id IS NULL')
    for (const row of rows) update.run(runId, row.id)
    audit(req.session.uid, null, 'export', runId, 'DEMO_CREATED', `Anzahl ${rows.length}; Prüfsumme ${sha}`)
    const payload = { id: runId, count: rows.length, sha256: sha, status: 'DEMO_CREATED' }
    db.prepare('INSERT INTO idempotency VALUES (?,?,?)').run('finance-export', key, JSON.stringify(payload))
    return payload
  })()
  res.status(201).json(result)
})
app.get('/api/finance/exports/:id/download', requireUser, requireRole('FINANCE'), (req, res) => {
  const run = db.prepare('SELECT * FROM export_runs WHERE id=?').get(req.params.id)
  if (!run) throw problem(404, 'Exportlauf nicht gefunden.')
  audit(req.session.uid, null, 'export', run.id, 'DOWNLOADED')
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="DEMO-export-${run.id}.csv"`)
  res.setHeader('Cache-Control', 'no-store')
  res.send(run.content)
})
app.post('/api/finance/credits', requireUser, requireRole('FINANCE'), requireCsrf, upload.single('file'), (req, res) => {
  const reference = parse(z.object({ reference: required(100) }).strict(), req.body).reference
  const claim = db.prepare('SELECT * FROM claims WHERE number=?').get(reference)
  const existing = claim ? db.prepare("SELECT 1 FROM credits WHERE claim_id=? AND status IN ('READY','PUBLISHED')").get(claim.id) : null
  const ready = Boolean(claim && claim.status === 'APPROVED' && claim.export_run_id && !existing)
  const documentId = saveDocument(req.file, { organizationId: ready ? claim.organization_id : null, claimId: ready ? claim.id : null, kind: 'CREDIT', userId: req.session.uid })
  const creditId = id()
  const reason = ready ? null : !claim ? 'Keine eindeutige Vorgangsnummer gefunden.' : existing ? 'Für diesen Vorgang liegt bereits eine Gutschrift vor.' : claim.status !== 'APPROVED' ? 'Vorgang ist nicht freigegeben.' : 'Vorgang wurde noch nicht exportiert.'
  db.prepare('INSERT INTO credits VALUES (?,?,?,?,?,?,?,?,?,?)').run(creditId, ready ? claim.id : null, ready ? claim.organization_id : null, documentId, reference, ready ? 'READY' : 'ERROR', reason, req.session.uid, now(), null)
  audit(req.session.uid, ready ? claim.organization_id : null, 'credit', creditId, 'IMPORTED', ready ? 'READY' : 'ERROR')
  res.status(201).json({ id: creditId, status: ready ? 'READY' : 'ERROR', reason })
})
app.post('/api/finance/credits/:id/publish', requireUser, requireRole('FINANCE'), requireCsrf, (req, res) => {
  const credit = db.prepare("SELECT * FROM credits WHERE id=? AND status='READY'").get(req.params.id)
  if (!credit) throw problem(404, 'Gutschrift nicht zur Veröffentlichung bereit.')
  const claim = db.prepare("SELECT * FROM claims WHERE id=? AND status='APPROVED'").get(credit.claim_id)
  if (!claim) throw problem(409, 'Vorgang ist nicht freigegeben.')
  db.transaction(() => {
    db.prepare("UPDATE credits SET status='PUBLISHED',published_at=? WHERE id=?").run(now(), credit.id)
    db.prepare("UPDATE claims SET status='COMPLETED',updated_at=? WHERE id=?").run(now(), claim.id)
    db.prepare("UPDATE claim_revisions SET status='COMPLETED' WHERE claim_id=? AND revision_no=?").run(claim.id, claim.revision_no)
    audit(req.session.uid, claim.organization_id, 'credit', credit.id, 'PUBLISHED')
    const recipient = db.prepare('SELECT email FROM users WHERE id=?').get(claim.created_by)
    if (recipient) mail(recipient.email, 'Gutschrift verfügbar', `Zum Vorgang ${claim.number} ist eine Gutschrift im Portal verfügbar.`)
  })()
  res.json({ ok: true, status: 'PUBLISHED' })
})

app.use((req, _res, next) => next(problem(404, 'Nicht gefunden.', 'NOT_FOUND')))
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) return res.status(400).json({ code: 'UPLOAD', message: err.code === 'LIMIT_FILE_SIZE' ? 'Datei ist größer als 5 MB.' : 'Upload konnte nicht verarbeitet werden.' })
  const status = Number.isInteger(err.status) ? err.status : 500
  if (status >= 500) console.error('Interner Fehler:', err?.message)
  res.status(status).json({ code: err.code || 'ERROR', message: status >= 500 ? 'Ein interner Fehler ist aufgetreten.' : err.message })
})

export { app }
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  app.listen(port, host, () => console.log(`LAWEA direkt Plus DEMO API: http://${host}:${port}`))
}
