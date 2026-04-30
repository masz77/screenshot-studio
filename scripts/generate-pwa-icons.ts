import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import sharp from "sharp"

const ROOT = resolve(import.meta.dirname, "..")
const SRC = resolve(ROOT, "public/logo.svg")
const OUT = resolve(ROOT, "public/icons")
const BG = "#059669"

async function writeAnyPurpose(svg: Buffer, size: number, file: string) {
  // Render onto solid brand background so the icon has fully opaque pixels.
  // macOS .app bundle icons (used by Brave/Chrome PWA installs) render
  // transparency as the dock background, which would make a mostly-transparent
  // icon appear as a blank tile.
  const padPct = 0.1
  const inner = Math.round(size * (1 - padPct * 2))
  const innerPng = await sharp(svg, { density: 384 })
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
  const info = await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: innerPng, gravity: "center" }])
    .png()
    .toFile(resolve(OUT, file))
  console.log(`wrote ${file} (${size}x${size}) - ${info.size} bytes`)
}

async function writeOnSolid(svg: Buffer, size: number, padPct: number, file: string) {
  const inner = Math.round(size * (1 - padPct * 2))
  const innerPng = await sharp(svg, { density: 384 })
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
  const info = await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: innerPng, gravity: "center" }])
    .png()
    .toFile(resolve(OUT, file))
  console.log(`wrote ${file} (${size}x${size}, pad=${Math.round(padPct * 100)}%) - ${info.size} bytes`)
}

async function main() {
  const svg = await readFile(SRC)
  await writeAnyPurpose(svg, 192, "icon-192.png")
  await writeAnyPurpose(svg, 512, "icon-512.png")
  await writeOnSolid(svg, 192, 0.2, "icon-192-maskable.png")
  await writeOnSolid(svg, 512, 0.2, "icon-512-maskable.png")
  await writeOnSolid(svg, 180, 0.1, "apple-touch-icon.png")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
