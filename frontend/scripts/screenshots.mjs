import fs from "node:fs"
import path from "node:path"

import { chromium } from "playwright"

const baseURL = process.env.SMOKE_BASE_URL ?? "http://localhost:5173"
const outputDir = process.env.SMOKE_OUT ?? path.resolve("../docs/screenshots")
const channel = process.env.SMOKE_BROWSER_CHANNEL ?? "msedge"

fs.mkdirSync(outputDir, { recursive: true })

const browser = await chromium.launch({ channel, headless: true })
const context = await browser.newContext({
  viewport: { width: 1440, height: 960 },
  locale: "id-ID",
})
const page = await context.newPage()

async function shot(name, fullPage = true) {
  await page
    .waitForFunction(() =>
      Array.from(document.images).every((image) => image.complete),
    )
    .catch(() => undefined)
  await page
    .evaluate(() =>
      Promise.all(
        Array.from(document.images).map((image) =>
          image.decode().catch(() => undefined),
        ),
      ),
    )
    .catch(() => undefined)
  await page.screenshot({
    path: path.join(outputDir, `${name}.png`),
    fullPage,
  })
  console.log(`screenshot: ${name}`)
}

try {
  await page.goto(`${baseURL}/login`, { waitUntil: "networkidle" })
  await page.getByText("Selamat datang kembali").waitFor()
  await shot("login", false)

  await page.getByRole("button", { name: /admin@posbrew\.test/i }).click()
  await page.locator('button[type="submit"]').click()
  await page.waitForURL((url) => url.pathname === "/")
  await page.getByRole("heading", { name: "Dashboard", level: 1 }).waitFor()
  await page.waitForTimeout(4500)
  await shot("dashboard-id")

  await page.getByRole("button", { name: "English", exact: true }).click()
  await page.getByRole("link", { name: "Point of Sale", exact: true }).waitFor()
  await page.waitForTimeout(800)
  await shot("dashboard-en")
  await page.getByRole("button", { name: "Bahasa Indonesia", exact: true }).click()

  await page.getByRole("link", { name: "Kasir", exact: true }).click()
  await page.waitForURL("**/pos")
  await page.getByText("Latte").first().waitFor()
  await page.waitForTimeout(500)
  await shot("pos")

  await page.getByRole("link", { name: "Produk", exact: true }).click()
  await page.waitForURL("**/products")
  await page.getByRole("heading", { name: "Produk", exact: true, level: 1 }).waitFor()
  await page.waitForTimeout(500)
  await shot("products")

  await page.getByRole("link", { name: "Bahan", exact: true }).click()
  await page.waitForURL("**/ingredients")
  await page.getByRole("heading", { name: "Bahan", exact: true, level: 1 }).waitFor()
  await page.waitForTimeout(500)
  await shot("ingredients")

  await page.getByRole("link", { name: "Laporan", exact: true }).click()
  await page.waitForURL("**/reports")
  await page.getByRole("heading", { name: "Laporan", exact: true, level: 1 }).waitFor()
  await page.waitForTimeout(900)
  await shot("reports")

  await page.getByRole("link", { name: "Transaksi", exact: true }).click()
  await page.waitForURL("**/transactions")
  await page.getByRole("heading", { name: "Transaksi", exact: true, level: 1 }).waitFor()
  await page.waitForTimeout(500)
  await shot("transactions")

  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole("button", { name: "Menu", exact: true }).click()
  await page.getByRole("link", { name: "Kasir", exact: true }).click()
  await page.waitForURL("**/pos")
  await page.getByText("Latte").first().waitFor()
  await page.waitForTimeout(500)
  await shot("pos-mobile")
} catch (error) {
  console.error("screenshot failed:", error)
  process.exitCode = 1
} finally {
  await browser.close()
}
