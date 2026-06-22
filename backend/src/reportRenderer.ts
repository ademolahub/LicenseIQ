import { existsSync } from 'fs'
import { rm } from 'fs/promises'
import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import { createServer } from 'net'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'
import puppeteer, { Browser, ConnectOptions } from 'puppeteer'
import { AssessmentSnapshot } from '../../shared/types'

function renderValue(value: unknown, fallback = 'N/A'): string {
  if (value === undefined || value === null || value === '') {
    return fallback
  }
  return String(value)
}

function formatCurrency(value: number | undefined): string {
  if (value === undefined || value === null) return 'N/A'
  return `$${(value / 100).toFixed(2)}`
}

function buildHtml(snapshot: AssessmentSnapshot): string {
  const title = renderValue(snapshot.tenantName, 'Tenant Name')
  const date = renderValue(new Date(snapshot.completedAt ?? snapshot.createdAt).toLocaleString(), 'Unknown Date')
  const healthScore = renderValue(snapshot.healthScore?.score, 'N/A')
  const healthGrade = renderValue(snapshot.healthScore?.grade, 'N/A')
  const totalMonthly = formatCurrency(snapshot.summary?.totalMonthlySavingsUSD)
  const totalAnnual = formatCurrency(snapshot.summary?.totalAnnualSavingsUSD)
  const totalLicenses = renderValue(snapshot.summary?.totalLicenses)
  const assignedLicenses = renderValue(snapshot.summary?.assignedLicenses)
  const utilizationPct = renderValue(snapshot.summary?.utilizationPct)
  const inactiveUsers = renderValue(snapshot.summary?.inactiveUsers)
  const disabledUsers = renderValue(snapshot.summary?.disabledWithLicense)
  const guestUsers = renderValue(snapshot.summary?.guestsWithLicense)
  const unassignedSeats = renderValue(snapshot.summary?.unassignedSeats)

  const recommendations = Array.isArray(snapshot.recommendations) ? snapshot.recommendations : []
  const topRecommendations = recommendations.slice(0, 5)

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>LicenseIQ Assessment Report</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 24px; color: #1f2937; background: #f8fafc; }
      .container { max-width: 960px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
      h1, h2, h3 { margin: 0 0 16px; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
      .meta { color: #4b5563; font-size: 0.95rem; }
      .score { background: #eef2ff; padding: 18px; border-radius: 12px; width: 100%; text-align: center; margin-top: 16px; }
      .score .value { font-size: 3rem; font-weight: 700; color: #4338ca; }
      .score .grade { font-size: 1.15rem; margin-top: 8px; color: #1e3a8a; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-top: 24px; }
      .card { background: #f3f4f6; border-radius: 12px; padding: 18px; }
      .card strong { display: block; margin-bottom: 12px; color: #111827; }
      .recommendations { margin-top: 32px; }
      .recommendation { border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px; margin-bottom: 16px; }
      .recommendation h3 { margin-bottom: 8px; font-size: 1rem; }
      .recommendation p { margin: 0 0 8px; color: #374151; }
      .tag { display: inline-block; background: #e0e7ff; color: #1e40af; border-radius: 9999px; padding: 4px 10px; font-size: 0.8rem; margin-right: 8px; }
      .footer { margin-top: 40px; color: #6b7280; font-size: 0.9rem; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div>
          <h1>${title}</h1>
          <div class="meta">Report generated: ${date}</div>
        </div>
      </div>

      <div class="score">
        <div class="value">${healthScore}</div>
        <div class="grade">Grade ${healthGrade}</div>
      </div>

      <section class="grid">
        <div class="card">
          <strong>KPI Summary</strong>
          <div>Total licenses: ${totalLicenses}</div>
          <div>Assigned licenses: ${assignedLicenses}</div>
          <div>Utilization: ${utilizationPct}%</div>
        </div>
        <div class="card">
          <strong>Usage Risks</strong>
          <div>Inactive users: ${inactiveUsers}</div>
          <div>Disabled w/ license: ${disabledUsers}</div>
          <div>Guests w/ license: ${guestUsers}</div>
        </div>
        <div class="card">
          <strong>Cost & Savings</strong>
          <div>Monthly savings: ${totalMonthly}</div>
          <div>Annual savings: ${totalAnnual}</div>
          <div>Unassigned seats: ${unassignedSeats}</div>
        </div>
      </section>

      <section class="recommendations">
        <h2>Top ${topRecommendations.length} Recommendations</h2>
        ${topRecommendations.map((recommendation, index) => {
          const title = renderValue(recommendation.title, 'Recommendation')
          const rationale = renderValue(recommendation.rationale, 'No rationale available')
          const savings = formatCurrency(recommendation.estMonthlySavingsUSD)
          const users = Array.isArray(recommendation.affectedUsers) && recommendation.affectedUsers.length > 0
            ? recommendation.affectedUsers.join(', ')
            : 'None'
          return `
            <div class="recommendation">
              <div class="tag">${renderValue(recommendation.type, 'Review')}</div>
              <h3>${index + 1}. ${title}</h3>
              <p>${rationale}</p>
              <p><strong>Impact:</strong> ${savings} / month</p>
              <p><strong>Affected users:</strong> ${users}</p>
            </div>
          `
        }).join('')}
      </section>

      <div class="footer">
        <p>This report is produced by LicenseIQ. Assumptions are based on available user sign-in and license assignment data.</p>
      </div>
    </div>
  </body>
</html>`
}

const localBrowserPaths = [
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
]

function resolveBrowserExecutable(): string | undefined {
  for (const path of localBrowserPaths) {
    if (existsSync(path)) {
      return path
    }
  }
  return undefined
}

async function cleanupTempProfile(profilePath: string): Promise<void> {
  try {
    await rm(profilePath, { recursive: true, force: true })
  } catch {
    // best-effort cleanup only
  }
}

function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, () => {
      const address = server.address()
      if (address && typeof address !== 'string') {
        const port = address.port
        server.close(() => resolve(port))
      } else {
        reject(new Error('Could not determine free port'))
      }
    })
  })
}

async function launchRemoteBrowser(executablePath: string, userDataDir: string): Promise<{ browser: Browser, process: ChildProcessWithoutNullStreams }> {
  const port = await findFreePort()
  const args = [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--user-data-dir=' + userDataDir,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--mute-audio',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--disable-extensions',
    '--disable-popup-blocking',
    '--disable-translate',
    'about:blank',
  ]

  const child = spawn(executablePath, args, { stdio: ['ignore', 'pipe', 'pipe'] })

  return new Promise((resolve, reject) => {
    let stderr = ''
    let finished = false
    const timeout = setTimeout(() => {
      child.kill()
      if (!finished) {
        reject(new Error(`Browser failed to start in time. stderr: ${stderr}`))
      }
    }, 10000)

    child.stderr.on('data', (chunk) => { stderr += chunk.toString() })
    child.stdout.on('data', () => {})
    child.on('error', (err) => {
      clearTimeout(timeout)
      if (!finished) {
        finished = true
        reject(err)
      }
    })

    const check = () => {
      const net = require('net')
      const socket = net.createConnection(port, '127.0.0.1')
      socket.on('connect', async () => {
        socket.destroy()
        if (!finished) {
          finished = true
          clearTimeout(timeout)
          try {
            const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${port}` })
            resolve({ browser, process: child })
          } catch (err) {
            reject(err)
          }
        }
      })
      socket.on('error', () => setTimeout(check, 100))
    }

    check()
  })
}

export async function renderAssessmentPdf(snapshot: AssessmentSnapshot): Promise<Buffer> {
  const executablePath = resolveBrowserExecutable()
  const userDataDir = join(tmpdir(), `licenseiq-puppeteer-${randomUUID()}`)
  let browser: Browser | undefined
  let childProcess: ChildProcessWithoutNullStreams | undefined

  try {
    if (executablePath) {
      const launched = await launchRemoteBrowser(executablePath, userDataDir)
      browser = launched.browser
      childProcess = launched.process
    } else {
      browser = await puppeteer.launch({
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-background-networking',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--mute-audio',
          '--single-process',
        ],
        userDataDir,
      })
    }

    const page = await browser!.newPage()
    const html = buildHtml(snapshot)
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '16px', right: '16px', bottom: '16px', left: '16px' } })
    return pdf
  } finally {
    try {
      if (browser) {
        await browser.close()
      }
    } catch {
      // ignore
    }
    if (childProcess) {
      childProcess.kill()
    }
    await cleanupTempProfile(userDataDir)
  }
}
