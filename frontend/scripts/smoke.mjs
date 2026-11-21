import fs from "node:fs"
import path from "node:path"

import { chromium } from "playwright"

const baseURL = process.env.SMOKE_BASE_URL ?? "http://localhost:5173"
const outputDir = process.env.SMOKE_OUT ?? path.resolve("smoke-output")
const channel = process.env.SMOKE_BROWSER_CHANNEL ?? "msedge"

fs.mkdirSync(outputDir, { recursive: true })

const browser = await chromium.launch({ channel, headless: true })
const context = await browser.newContext({
  viewport: { width: 1440, height: 960 },
  locale: "id-ID",
})
const page = await context.newPage()

const consoleErrors = []
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text())
})
page.on("pageerror", (error) => consoleErrors.push(error.message))

async function shot(name, fullPage = true) {
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
  console.log("open login")
  await page.goto(`${baseURL}/login`, { waitUntil: "networkidle" })
  await page.getByText("Selamat datang kembali").waitFor()
  await shot("01-login", false)

  console.log("login as admin")
  await page.getByRole("button", { name: /admin@posbrew\.test/i }).click()
  await Promise.all([
    page.waitForURL((url) => url.pathname === "/"),
    page.locator('button[type="submit"]').click(),
  ])
  await page.getByRole("heading", { name: "Dashboard", level: 1 }).waitFor()
  await page.waitForTimeout(1200)
  await shot("02-dashboard")

  console.log("open POS")
  await page.getByRole("link", { name: "Kasir", exact: true }).click()
  await page.waitForURL("**/pos")
  await page.getByText("Latte").first().waitFor()
  await page.waitForTimeout(500)
  await shot("03-pos")

  console.log("add product to cart")
  await page.getByRole("button", { name: /Latte/ }).first().click()
  await page.locator("#cart-panel").getByText("Latte").waitFor()
  await page.getByRole("button", { name: "Uang pas" }).click()

  console.log("checkout")
  const [checkoutResponse] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/v1/transactions") &&
        response.request().method() === "POST",
    ),
    page.getByRole("button", { name: "Bayar sekarang" }).click(),
  ])
  if (!checkoutResponse.ok()) {
    throw new Error(
      `checkout failed: ${checkoutResponse.status()} ${await checkoutResponse.text()}`,
    )
  }
  await page.getByRole("heading", { name: "Struk pembayaran" }).waitFor()
  await shot("04-receipt", false)
  await page.getByRole("button", { name: "Pesanan baru" }).click()

  console.log("open transactions and cancel the new sale")
  await page.getByRole("link", { name: "Transaksi", exact: true }).click()
  await page.waitForURL("**/transactions")
  await page.getByRole("heading", { name: "Transaksi", exact: true, level: 1 }).waitFor()
  await page.waitForTimeout(800)
  await page
    .getByRole("button", { name: "Batalkan transaksi" })
    .first()
    .click()
  await page
    .locator("dialog")
    .getByRole("button", { name: "Batalkan transaksi" })
    .click()
  await page.getByText("Transaksi dibatalkan").waitFor()
  await page.waitForTimeout(800)
  await shot("05-transactions")

  console.log("products page")
  await page.getByRole("link", { name: "Produk", exact: true }).click()
  await page.waitForURL("**/products")
  await page.getByRole("heading", { name: "Produk", exact: true, level: 1 }).waitFor()
  await page.waitForTimeout(600)
  await shot("06-products")

  console.log("ingredients page")
  await page.getByRole("link", { name: "Bahan", exact: true }).click()
  await page.waitForURL("**/ingredients")
  await page.getByRole("heading", { name: "Bahan", exact: true, level: 1 }).waitFor()
  await page.waitForTimeout(600)
  await shot("07-ingredients")

  console.log("stock page")
  await page.getByRole("link", { name: "Stok", exact: true }).click()
  await page.waitForURL("**/stock")
  await page.getByRole("heading", { name: "Stok", exact: true, level: 1 }).waitFor()
  await page.waitForTimeout(600)
  await shot("08-stock")

  console.log("recipes page")
  await page.getByRole("link", { name: "Resep", exact: true }).click()
  await page.waitForURL("**/recipes")
  await page.getByRole("heading", { name: "Resep", exact: true, level: 1 }).waitFor()
  await page.waitForTimeout(800)
  await shot("09-recipes")

  console.log("reports page")
  await page.getByRole("link", { name: "Laporan", exact: true }).click()
  await page.waitForURL("**/reports")
  await page.getByRole("heading", { name: "Laporan", exact: true, level: 1 }).waitFor()
  await page.waitForTimeout(900)
  await shot("10-reports")

  console.log("users page")
  await page.getByRole("link", { name: "Pengguna", exact: true }).click()
  await page.waitForURL("**/users")
  await page.getByRole("heading", { name: "Pengguna", exact: true, level: 1 }).waitFor()
  await page.waitForTimeout(600)
  await shot("11-users")

  console.log("switch to English")
  await page.getByRole("link", { name: "Dashboard", exact: true }).click()
  await page.waitForURL((url) => url.pathname === "/")
  await page.getByRole("button", { name: "English", exact: true }).click()
  await page.getByRole("link", { name: "Point of Sale", exact: true }).waitFor()
  await page.waitForTimeout(600)
  await shot("12-dashboard-en")

  console.log("mobile POS")
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole("button", { name: "Menu", exact: true }).click()
  await page.getByRole("link", { name: "Point of Sale", exact: true }).click()
  await page.waitForURL("**/pos")
  await page.getByText("Latte").first().waitFor()
  await page.waitForTimeout(500)
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  )
  console.log(`mobile horizontal overflow: ${overflow}`)
  await shot("13-pos-mobile")

  if (consoleErrors.length > 0) {
    console.log("console errors:")
    for (const error of consoleErrors) console.log(`- ${error}`)
    process.exitCode = 1
  } else {
    console.log("no console errors")
  }
} catch (error) {
  console.error("smoke test failed:", error)
  if (consoleErrors.length > 0) {
    console.log("console errors:")
    for (const message of consoleErrors) console.log(`- ${message}`)
  }
  await shot("99-failure")
  process.exitCode = 1
} finally {
  await browser.close()
}
