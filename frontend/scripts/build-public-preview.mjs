import { spawnSync } from 'node:child_process'
import { renameSync, existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

for (const args of [
  [join(process.cwd(), 'node_modules', 'typescript', 'bin', 'tsc'), '-b'],
  [join(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js'), 'build', '--configLoader', 'runner']
]) {
  const result = spawnSync(process.execPath, args, {
    cwd: process.cwd(),
    env: { ...process.env, PUBLIC_PREVIEW_BUILD: '1' },
    stdio: 'inherit'
  })
  if (result.status !== 0) process.exit(result.status || 1)
}
const html = join(process.cwd(), 'dist', 'preview.html')
if (!existsSync(html)) throw new Error('Die Vorschau wurde nicht erzeugt.')
renameSync(html, join(process.cwd(), 'dist', 'index.html'))
writeFileSync(join(process.cwd(), 'dist', 'vercel.json'), JSON.stringify({
  headers: [{ source: '/(.*)', headers: [
    { key: 'Content-Security-Policy', value: "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src blob:; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'" },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'no-referrer' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
  ] }]
}, null, 2))
