import sharp from 'sharp'
import { readdirSync } from 'fs'
import { join } from 'path'

const dir = 'public/ingredients'
const files = readdirSync(dir).filter(f => f.endsWith('.png'))

for (const file of files) {
  const path = join(dir, file)
  const temp = join(dir, '_temp_' + file)
  await sharp(path).resize(48, 48).png().toFile(temp)
  const fs = await import('fs/promises')
  await fs.unlink(path)
  await fs.rename(temp, path)
  console.log(`✓ ${file}`)
}