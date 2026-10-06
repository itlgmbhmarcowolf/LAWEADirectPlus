import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import Database from 'better-sqlite3'

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lawea-charge-migration-'))
process.env.LAWEA_DATA_DIR = dataDir
const legacy = new Database(path.join(dataDir, 'lawea.sqlite'))
legacy.exec(`CREATE TABLE products (
  pzn TEXT PRIMARY KEY, name TEXT NOT NULL, maker TEXT NOT NULL,
  valid_charges TEXT NOT NULL, source TEXT NOT NULL
);
INSERT INTO products VALUES ('04812345', 'Demo-Produkt', 'Glenmark', '["GL-2401"]', 'DEMO');`)
legacy.close()

const { db } = await import('./db.js')

test('bestehende Demo-Datenbank entfernt die alte Chargenliste ohne PZN-Verlust', () => {
  try {
    const columns = db.prepare('PRAGMA table_info(products)').all().map(column => column.name)
    assert.ok(!columns.includes('valid_charges'))
    assert.deepEqual(db.prepare('SELECT pzn,name,maker,source FROM products').get(), {
      pzn: '04812345', name: 'Demo-Produkt', maker: 'Glenmark', source: 'DEMO'
    })
  } finally {
    db.close()
    fs.rmSync(dataDir, { recursive: true, force: true })
  }
})
