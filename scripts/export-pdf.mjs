import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const slidesFile = process.argv[2]
const host = '127.0.0.1'
const port = slidesFile ? 4174 : 4173
const baseUrl = `http://${host}:${port}/`
const printUrl = `${baseUrl}?export=print`
const pdfName = slidesFile
  ? `${path.basename(slidesFile, path.extname(slidesFile))}.pdf`
  : 'lt-slide.pdf'
const pdfPath = path.resolve('output/export', pdfName)

if (slidesFile && !existsSync(slidesFile)) {
  console.error(`ファイルが見つかりません: ${slidesFile}`)
  process.exit(1)
}

async function isReady() {
  try {
    const response = await fetch(baseUrl, {
      headers: { accept: 'text/html' },
      signal: AbortSignal.timeout(2000),
    })
    return response.ok
  } catch {
    return false
  }
}

async function waitUntilReady(timeoutMs) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    if (await isReady()) return
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`${baseUrl} が ${timeoutMs}ms 以内に応答しませんでした。`)
}

const serverArgs = ['dev', '--host', host, '--port', String(port), '--strictPort']
if (slidesFile) serverArgs.push(slidesFile)

const alreadyRunning = slidesFile ? false : await isReady()
const server = alreadyRunning
  ? null
  : spawn(path.resolve('node_modules/.bin/slidev-react'), serverArgs, { stdio: 'inherit' })

try {
  if (server) await waitUntilReady(120_000)

  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({
      viewport: { width: 2400, height: 1600 },
    })
    await page.goto(printUrl, { waitUntil: 'networkidle' })
    await page.waitForSelector('[data-export-view="print"]')
    await page.waitForFunction(
      () => document.querySelectorAll('[data-export-slide-ready="false"]').length === 0,
    )
    const viewport = await page.locator('[data-export-view="print"]').evaluate((node) => ({
      width: Number.parseInt(node.getAttribute('data-export-viewport-width') ?? '1920', 10),
      height: Number.parseInt(node.getAttribute('data-export-viewport-height') ?? '1080', 10),
    }))
    await mkdir(path.dirname(pdfPath), { recursive: true })
    await page.emulateMedia({ media: 'print' })
    await page.pdf({
      path: pdfPath,
      landscape: viewport.width > viewport.height,
      printBackground: true,
      preferCSSPageSize: true,
    })
    console.log(pdfPath)
  } finally {
    await browser.close()
  }
} finally {
  if (server) server.kill('SIGTERM')
}
