import fs from "node:fs"
import path from "node:path"

const root = path.resolve("src")
const id = (await import("../src/i18n/locales/id.ts")).default
const en = (await import("../src/i18n/locales/en.ts")).default

function flatten(value, prefix = "", output = new Set()) {
  for (const [key, child] of Object.entries(value)) {
    const next = prefix ? `${prefix}.${key}` : key
    if (child && typeof child === "object") {
      flatten(child, next, output)
    } else {
      output.add(next)
    }
  }
  return output
}

const idKeys = flatten(id)
const enKeys = flatten(en)
const onlyId = [...idKeys].filter((key) => !enKeys.has(key))
const onlyEn = [...enKeys].filter((key) => !idKeys.has(key))

const files = []
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (full.endsWith(".tsx") || full.endsWith(".ts")) files.push(full)
  }
}
walk(root)

const used = new Set()
const dynamic = new Set()
for (const file of files) {
  if (file.includes(`${path.sep}i18n${path.sep}`)) continue
  const source = fs.readFileSync(file, "utf8")
  for (const match of source.matchAll(/\bt\(\s*["']([^"']+)["']/g)) {
    used.add(match[1])
  }
  for (const match of source.matchAll(/\bt\(\s*`([^`$]+)\$\{/g)) {
    dynamic.add(match[1])
  }
}

const missing = [...used].filter((key) => !idKeys.has(key) || !enKeys.has(key))

console.log(`translation keys: ${idKeys.size} id, ${enKeys.size} en`)
console.log(`static keys used: ${used.size}`)
console.log(`missing in id/en: ${missing.length}`)
for (const key of missing) console.log(`  - ${key}`)
console.log(`only in id: ${onlyId.length}`)
for (const key of onlyId) console.log(`  - ${key}`)
console.log(`only in en: ${onlyEn.length}`)
for (const key of onlyEn) console.log(`  - ${key}`)
console.log(`dynamic prefixes: ${[...dynamic].join(", ")}`)

if (missing.length > 0 || onlyId.length > 0 || onlyEn.length > 0) {
  process.exitCode = 1
}
