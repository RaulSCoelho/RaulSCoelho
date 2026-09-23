import * as p from '@clack/prompts'
import { convertPathToPattern, globby } from 'globby'
import { lstat, readFile, realpath } from 'node:fs/promises'
import path from 'node:path'

import { formatBytes } from '../lib/cli.mjs'
import { isNodeModulesPath, withinRoot } from '../lib/paths.mjs'

/**
 * @typedef {object} Selection
 * @property {string} [mode]
 * @property {string[]} [files]
 * @property {string[]} [folders]
 * @property {string[]} [extensions]
 * @property {string[]} [globs]
 * @property {string} [ignoreMode]
 * @property {string[]} [ignoreFiles]
 */

const MAX_FILES = 10_000
const MAX_FILE_BYTES = 2 * 1024 ** 2
const MAX_TOTAL_BYTES = 20 * 1024 ** 2
const decoder = new TextDecoder('utf-8', { fatal: true })

// Imutável: nem "nenhuma exclusão" nem um !node_modules do ignore podem reverter isto.
const MANDATORY_IGNORE = ['**/node_modules/**']

/**
 * @param {string} value
 * @param {string} root
 */
function filePattern(value, root) {
  const { relative } = withinRoot(value, root)
  const literal = convertPathToPattern(relative)
  return relative.includes('/') ? literal : `**/${literal}`
}

/**
 * @param {string} value
 * @param {string} root
 */
function folderPattern(value, root) {
  const { relative } = withinRoot(value.replace(/[/\\]+$/, ''), root)
  return `${convertPathToPattern(relative)}/**/*`
}

/** @param {string} value */
function extensionPattern(value) {
  const extension = value.trim().startsWith('.') ? value.trim() : `.${value.trim()}`
  if (!/^\.[\w.+-]+$/.test(extension)) throw new Error(`Extensão inválida: ${value}`)
  return `**/*${convertPathToPattern(extension)}`
}

/** @param {string} value */
function globPattern(value) {
  const glob = value.trim().replaceAll('\\', '/')
  if (
    !glob ||
    glob.startsWith('!') ||
    glob.startsWith('/') ||
    /^[A-Za-z]:/.test(glob) ||
    /(^|\/)\.\.(\/|$)/.test(glob)
  ) {
    throw new Error(`Glob inválido ou fora do projeto: ${value}`)
  }
  return glob
}

// Mesma lógica para inclusão e exclusão: os quatro filtros usam união (OU).
/** @param {Selection} selection */
export function patternsFor(selection, root = process.cwd()) {
  return [
    ...new Set([
      ...(selection.files ?? []).map(value => filePattern(value, root)),
      ...(selection.folders ?? []).map(value => folderPattern(value, root)),
      ...(selection.extensions ?? []).map(extensionPattern),
      ...(selection.globs ?? []).map(globPattern)
    ])
  ]
}

/** @param {Selection} selection */
export function inclusionPatterns(selection, root = process.cwd()) {
  return selection.mode === 'all' ? ['**/*'] : patternsFor(selection, root)
}

/** @param {Selection} selection */
export function exclusionOptions(selection, root = process.cwd()) {
  const ignoreMode = selection.mode === 'advanced' ? selection.ignoreMode : selection.mode

  const selected = ignoreMode === 'ignore-files' ? (selection.ignoreFiles ?? []) : []
  const gitignore = ignoreMode === 'gitignore' || selected.includes('.gitignore')
  const otherIgnoreFiles = selected.filter(
    file => file !== '.gitignore' && !(gitignore && file.endsWith('/.gitignore'))
  )

  return {
    gitignore,
    ...(otherIgnoreFiles.length ? { ignoreFiles: otherIgnoreFiles.map(convertPathToPattern) } : {}),
    ignore: [...MANDATORY_IGNORE, ...(gitignore ? ['**/.git/**'] : []), ...patternsFor(selection, root)]
  }
}

/**
 * @param {Selection} inclusion
 * @param {Selection} exclusion
 */
export async function findFiles(inclusion, exclusion, root = process.cwd()) {
  const waiting = p.spinner()
  waiting.start('Localizando arquivos...')

  try {
    const matches = await globby(inclusionPatterns(inclusion, root), {
      cwd: root,
      dot: true,
      onlyFiles: true,
      followSymbolicLinks: false,
      expandDirectories: false,
      ...exclusionOptions(exclusion, root)
    })

    // Segunda proteção: o bloqueio não depende do comportamento do glob ou do ignore.
    const files = [...new Set(matches)].filter(file => !isNodeModulesPath(file)).sort((a, b) => a.localeCompare(b))

    if (files.length > MAX_FILES) {
      throw new Error(`Mais de ${MAX_FILES} arquivos. Restrinja os filtros de inclusão.`)
    }

    waiting.stop(`${files.length} arquivos encontrados`)
    return files
  } catch (error) {
    waiting.stop('Não foi possível localizar os arquivos')
    throw error
  }
}

/** @param {Buffer} buffer */
function looksLikeText(buffer) {
  if (buffer.includes(0)) return false

  const sample = buffer.subarray(0, Math.min(buffer.length, 8192))
  let controls = 0
  for (const byte of sample) {
    if (byte < 32 && ![9, 10, 13].includes(byte)) controls++
  }
  return controls <= sample.length * 0.02
}

/** @param {string[]} files */
export async function buildClipboard(files, root = process.cwd()) {
  const bar = p.progress({ max: files.length })
  bar.start('Lendo arquivos · 0%')

  const chunks = []
  const skipped = []
  let totalBytes = 0
  let displayed = 0

  try {
    for (const [i, relative] of files.entries()) {
      const absolute = path.resolve(root, relative)

      if (isNodeModulesPath(relative)) {
        skipped.push(relative)
      } else {
        const info = await lstat(absolute)
        const real = await realpath(absolute)
        const inside = path.relative(root, real)
        const safe = inside && inside !== '..' && !inside.startsWith(`..${path.sep}`)

        if (
          !info.isFile() ||
          info.isSymbolicLink() ||
          !safe ||
          isNodeModulesPath(inside) ||
          info.size > MAX_FILE_BYTES
        ) {
          skipped.push(relative)
        } else {
          const buffer = await readFile(absolute)
          let content

          if (buffer.length <= MAX_FILE_BYTES && looksLikeText(buffer)) {
            try {
              content = decoder.decode(buffer)
            } catch {
              /* Arquivo não UTF-8 */
            }
          }

          if (content === undefined) {
            skipped.push(relative)
          } else {
            const chunk = `${relative}\n${content}`
            const bytes = Buffer.byteLength(chunk) + (chunks.length ? 2 : 0)

            if (totalBytes + bytes > MAX_TOTAL_BYTES) {
              throw new Error(`Limite de ${formatBytes(MAX_TOTAL_BYTES)} excedido. Restrinja a seleção.`)
            }

            chunks.push(chunk)
            totalBytes += bytes
          }
        }
      }

      const current = i + 1
      const percent = Math.floor((current * 100) / files.length)
      if (percent > Math.floor((displayed * 100) / files.length) || current === files.length) {
        bar.advance(current - displayed, `Lendo arquivos · ${percent}% (${current}/${files.length})`)
        displayed = current
      }
    }

    bar.stop(`${chunks.length} arquivos preparados`)
    return { output: chunks.join('\n\n'), copied: chunks.length, skipped, bytes: totalBytes }
  } catch (error) {
    bar.stop('Não foi possível preparar a cópia')
    throw error
  }
}
