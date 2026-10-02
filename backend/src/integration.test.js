import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lawea-plus-test-'))
process.env.LAWEA_DATA_DIR = dataDir
process.env.DEMO_MODE = '1'
const { app } = await import('./index.js')
const { db } = await import('./db.js')
const evidence = fs.readFileSync(new URL('../test-fixtures/demo-evidence.png', import.meta.url))

test('vollständiger Demo-Prozess mit Rollen, Mandantentrennung und unveränderlichen Revisionen', async () => {
  const server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  const base = `http://127.0.0.1:${server.address().port}/api`
  const client = () => ({ cookie: '', csrf: '' })
  const admin = client(), other = client(), reviewer = client(), finance = client(), staff = client()
  const call = async (who, route, method = 'GET', body, expected = 200) => {
    const headers = {}
    if (who.cookie) headers.cookie = who.cookie
    if (who.csrf && method !== 'GET') headers['x-csrf-token'] = who.csrf
    if (body && !(body instanceof FormData)) headers['content-type'] = 'application/json'
    const response = await fetch(`${base}${route}`, { method, headers, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined })
    const setCookie = response.headers.get('set-cookie')
    if (setCookie?.startsWith('lawea_session=')) who.cookie = setCookie.split(';')[0]
    const result = await response.json().catch(() => ({}))
    assert.equal(response.status, expected, `${method} ${route}: ${JSON.stringify(result)}`)
    return result
  }
  const login = async (who, email) => {
    const challenge = await call(who, '/auth/login', 'POST', { email, password: 'Demo!Passwort2026' })
    const result = await call(who, '/auth/verify', 'POST', { challengeId: challenge.challengeId, code: challenge.demoCode })
    who.csrf = result.csrf
    return result.user
  }
  const formWithFile = (field, fields = {}) => {
    const form = new FormData()
    for (const [key, value] of Object.entries(fields)) form.set(key, value)
    form.set(field, new Blob([evidence], { type: 'image/png' }), 'nachweis.png')
    return form
  }
  try {
    for (const origin of ['http://localhost:4173', 'http://127.0.0.1:5173']) {
      const response = await fetch(`${base}/auth/login`, { method: 'POST', headers: { origin, 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'admin@rosen-apotheke.test', password: 'Demo!Passwort2026' }) })
      assert.equal(response.status, 200, `Lokaler Ursprung ${origin} muss funktionieren`)
    }
    const foreign = await fetch(`${base}/auth/login`, { method: 'POST', headers: { origin: 'https://example.invalid', 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'admin@rosen-apotheke.test', password: 'Demo!Passwort2026' }) })
    assert.equal(foreign.status, 403)
    const adminUser = await login(admin, 'admin@rosen-apotheke.test')
    const reviewerUser = await login(reviewer, 'pruefung@glenmark.test')
    const financeUser = await login(finance, 'finance@glenmark.test')
    assert.equal(adminUser.role, 'PHARMACY_ADMIN')
    assert.equal(reviewerUser.role, 'REVIEWER')
    assert.equal(financeUser.role, 'FINANCE')
    assert.equal((await call(admin, '/session')).csrf, admin.csrf)
    const boot = await call(admin, '/bootstrap')
    const claimId = boot.claims[0].id
    const original = await call(admin, `/claims/${claimId}`)
    assert.equal(original.claim.status, 'DRAFT')
    await call({ cookie: admin.cookie, csrf: '' }, `/claims/${claimId}/submit`, 'POST', { key: crypto.randomUUID() }, 403)
    await call(admin, `/members/${adminUser.id}/disable`, 'POST', {}, 409)
    await call(admin, `/members/${adminUser.id}/role`, 'POST', { role: 'PHARMACY_STAFF' }, 409)

    const registration = await call(other, '/register', 'POST', formWithFile('license', {
      pharmacyName: 'Test-Apotheke Süd', street: 'Testweg 1', zip: '80331', city: 'München',
      owner: 'Dr. Test', phone: '089 123456', iban: 'DE89370400440532013000', homepage: '',
      name: 'Test Nutzer', email: 'test@sued-apotheke.test',
      password: 'Demo!Passwort2026', passwordAgain: 'Demo!Passwort2026'
    }), 201)
    await call(other, '/register/verify', 'POST', { challengeId: registration.challengeId, code: registration.demoCode })
    const pending = await call(reviewer, '/bootstrap')
    const newOrg = pending.pending.find(o => o.name === 'Test-Apotheke Süd')
    assert.ok(newOrg)
    await call(reviewer, `/review/organizations/${newOrg.id}/request-evidence`, 'POST', { reason: 'Dokument im Test erneut anfordern.' })
    await call(other, '/register/resubmit-evidence', 'POST', formWithFile('license', {
      email: 'test@sued-apotheke.test', password: 'Demo!Passwort2026'
    }))
    await call(reviewer, `/review/organizations/${newOrg.id}/approve`, 'POST', {})
    await login(other, 'test@sued-apotheke.test')
    await call(other, `/claims/${claimId}`, 'GET', undefined, 404)
    await call(other, `/claims/${claimId}/draft`, 'PUT', { version: 1, items: [], contactName: '', contactEmail: '', comment: '', declaration: false }, 404)

    const invite = await call(admin, '/members/invite', 'POST', {
      name: 'Neuer Mitarbeiter', email: 'neu@rosen-apotheke.test', role: 'PHARMACY_STAFF'
    }, 201)
    const token = new URL(invite.demoLink, 'http://localhost').searchParams.get('token')
    const pendingInvites = (await call(admin, '/bootstrap')).invitations
    assert.equal(pendingInvites.length, 1)
    await call(other, `/members/invitations/${pendingInvites[0].id}/resend`, 'POST', {}, 404)
    const resent = await call(admin, `/members/invitations/${pendingInvites[0].id}/resend`, 'POST', {})
    await call(staff, '/members/accept', 'POST', { token, password: 'Demo!Passwort2026', passwordAgain: 'Demo!Passwort2026' }, 400)
    const newToken = new URL(resent.demoLink, 'http://localhost').searchParams.get('token')
    const accepted = await call(staff, '/members/accept', 'POST', {
      token: newToken, password: 'Demo!Passwort2026', passwordAgain: 'Demo!Passwort2026'
    }, 201)
    await call(staff, '/members/verify', 'POST', { challengeId: accepted.challengeId, code: accepted.demoCode })
    const staffUser = await login(staff, 'neu@rosen-apotheke.test')
    assert.equal(staffUser.role, 'PHARMACY_STAFF')
    assert.equal((await call(admin, '/bootstrap')).invitations.length, 0)
    await call(staff, '/members/invite', 'POST', { name: 'Unzulässig', email: 'x@test.test', role: 'PHARMACY_ADMIN' }, 403)
    assert.equal((await call(staff, `/claims/${claimId}`)).claim.id, claimId)
    const revocable = await call(admin, '/members/invite', 'POST', { name: 'Widerruf Test', email: 'widerruf@rosen-apotheke.test', role: 'PHARMACY_STAFF' }, 201)
    const revocableToken = new URL(revocable.demoLink, 'http://localhost').searchParams.get('token')
    const revocableId = (await call(admin, '/bootstrap')).invitations[0].id
    await call(admin, `/members/invitations/${revocableId}/revoke`, 'POST', {})
    await call(staff, '/members/accept', 'POST', { token: revocableToken, password: 'Demo!Passwort2026', passwordAgain: 'Demo!Passwort2026' }, 400)
    await call(admin, `/members/${staffUser.id}/disable`, 'POST', {})
    await call(staff, '/bootstrap', 'GET', undefined, 401)
    await call(other, `/members/${staffUser.id}/enable`, 'POST', {}, 404)
    await call(admin, `/members/${staffUser.id}/enable`, 'POST', {})
    await login(staff, 'neu@rosen-apotheke.test')

    const evidenceDoc = await call(admin, `/claims/${claimId}/documents`, 'POST', formWithFile('file'), 201)
    await call(other, `/documents/${evidenceDoc.id}`, 'GET', undefined, 404)
    const draft = { version: original.claim.version, items: [{ pzn: '04812345', charge: 'GL-2401', quantity: 12 }],
      contactName: 'Julia Berger', contactEmail: 'admin@rosen-apotheke.test', comment: 'Testmeldung', declaration: true }
    await call(admin, `/claims/${claimId}/draft`, 'PUT', draft)
    const key = crypto.randomUUID()
    const submitted = await call(admin, `/claims/${claimId}/submit`, 'POST', { key })
    assert.equal(submitted.status, 'MANUAL_REVIEW')
    assert.deepEqual(await call(admin, `/claims/${claimId}/submit`, 'POST', { key }), submitted)
    await call(admin, `/claims/${claimId}/draft`, 'PUT', { ...draft, version: draft.version + 1 }, 409)
    const review = await call(reviewer, `/claims/${claimId}`)
    assert.equal(review.revisions[0].snapshot.comment, 'Testmeldung')
    await call(reviewer, `/review/claims/${claimId}/decision`, 'POST', { decision: 'REJECT', reason: 'Bitte Bestand prüfen.' })
    await call(admin, `/claims/${claimId}/revise`, 'POST', {})
    const revised = await call(admin, `/claims/${claimId}`)
    assert.equal(revised.claim.revision_no, 2)
    assert.equal(revised.revisions[0].status, 'REJECTED')
    assert.equal(revised.revisions[0].snapshot.comment, 'Testmeldung')
    await call(admin, `/claims/${claimId}/draft`, 'PUT', { ...draft, version: revised.claim.version, comment: 'Korrigierter Bestand', declaration: false })
    await call(admin, `/claims/${claimId}/submit`, 'POST', { key: crypto.randomUUID() }, 422)
    const current = await call(admin, `/claims/${claimId}`)
    await call(admin, `/claims/${claimId}/draft`, 'PUT', { ...draft, version: current.claim.version, comment: 'Korrigierter Bestand' })
    await call(admin, `/claims/${claimId}/submit`, 'POST', { key: crypto.randomUUID() })
    const withTwoRevisions = await call(reviewer, `/claims/${claimId}`)
    assert.equal(withTwoRevisions.revisions.length, 2)
    assert.equal(withTwoRevisions.revisions[1].snapshot.comment, 'Testmeldung')
    await call(reviewer, `/review/claims/${claimId}/decision`, 'POST', { decision: 'APPROVE', reason: '' })
    await call(finance, `/claims/${claimId}`, 'GET', undefined, 404)
    const beforeExport = await call(finance, '/finance/credits', 'POST', formWithFile('file', { reference: submitted.number }), 201)
    assert.equal(beforeExport.status, 'ERROR')
    const exportKey = crypto.randomUUID()
    const exportRun = await call(finance, '/finance/exports', 'POST', { key: exportKey }, 201)
    assert.equal(exportRun.count, 1)
    assert.deepEqual(await call(finance, '/finance/exports', 'POST', { key: exportKey }), exportRun)
    const credit = await call(finance, '/finance/credits', 'POST', formWithFile('file', { reference: submitted.number }), 201)
    assert.equal(credit.status, 'READY')
    await call(finance, `/finance/credits/${credit.id}/publish`, 'POST', {})
    const complete = await call(admin, '/bootstrap')
    assert.equal(complete.claims[0].status, 'COMPLETED')
    assert.equal(complete.credits.length, 1)
    await call(other, `/documents/${complete.credits[0].document_id}`, 'GET', undefined, 404)
    for (let n = 0; n < 10; n++) await call(admin, '/auth/login', 'POST', {
      email: 'admin@rosen-apotheke.test', password: 'Demo!Passwort2026'
    })
    for (let n = 0; n < 8; n++) await call(staff, '/auth/login', 'POST', {
      email: 'neu@rosen-apotheke.test', password: 'Falsches!Passwort2026'
    }, 401)
    await call(staff, '/auth/login', 'POST', { email: 'neu@rosen-apotheke.test', password: 'Falsches!Passwort2026' }, 429)
    await call(staff, '/auth/login', 'POST', { email: 'neu@rosen-apotheke.test', password: 'Demo!Passwort2026' })
    await call(staff, '/auth/login', 'POST', { email: 'neu@rosen-apotheke.test', password: 'Falsches!Passwort2026' }, 401)
  } finally {
    await new Promise(resolve => server.close(resolve))
    db.close()
    fs.rmSync(dataDir, { recursive: true, force: true })
  }
})
