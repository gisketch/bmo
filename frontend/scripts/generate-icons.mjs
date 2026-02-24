import sharp from 'sharp'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = path.join(frontendRoot, 'public')
const svgPath = path.join(publicDir, 'favicon.svg')

const svg = await readFile(svgPath)

const outputs = [
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32.png', size: 32 },
  { name: 'favicon-16.png', size: 16 },
]

await Promise.all(
  outputs.map(({ name, size }) =>
    sharp(svg, { density: 512 })
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(path.join(publicDir, name)),
  ),
)

process.stdout.write(`Generated ${outputs.length} icons into ${publicDir}\n`)