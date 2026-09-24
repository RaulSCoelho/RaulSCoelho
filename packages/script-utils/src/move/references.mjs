import { globby } from 'globby'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { discoveryOptions } from './discover.mjs'
import { safePath, statOrNull } from '../lib/filesystem.mjs'

/** Busca indicativa de referências literais; não resolve aliases nem imports dinâmicos.
 * @param {string} root @param {string[]} sources
 */
export async function findReferences(root, sources) {
  const candidates = await globby('**/*.{js,mjs,cjs,ts,tsx,jsx,json}', {
    ...discoveryOptions,
    cwd: root,
    gitignore: true
  })
  /** @type {string[]} */
  const references = []
  for (const file of candidates.slice(0, 2000)) {
    if (sources.some(source => file === source || file.startsWith(`${source}/`))) continue
    const absolute = await safePath(root, file)
    if (((await statOrNull(absolute))?.size ?? Infinity) > 256 * 1024) continue
    const text = await readFile(absolute, 'utf8')
    const literals = [...text.matchAll(/['"]([^'"\n]+)['"]/g)].map(match => match[1] ?? '')
    if (
      literals.some(literal => {
        const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(file), literal))
        return sources.some(
          source =>
            literal === source ||
            resolved === source ||
            resolved.startsWith(`${source}/`) ||
            source.replace(/\.[^/.]+$/, '') === resolved
        )
      })
    )
      references.push(file)
  }
  return references
}
