import { convertPathToPattern, globby, isIgnoredByIgnoreFiles } from 'globby'
import { readdir } from 'node:fs/promises'
import path from 'node:path'

import { protectedPath, safePath, statOrNull } from '../lib/filesystem.mjs'
import { extensionPattern } from '../lib/patterns.mjs'

export const discoveryOptions = {
  dot: true,
  followSymbolicLinks: false,
  expandDirectories: false,
  ignore: [
    '**/.git',
    '**/.git/**',
    '**/node_modules',
    '**/node_modules/**',
    '**/.repomove',
    '**/.repomove/**',
    '**/.repomove-tmp-*/**'
  ]
}

/** @param {ReturnType<import('./config.mjs').normalizeMove>} config @param {string} root */
export async function discover(config, root) {
  const gitFiles = config.gitignore ? await globby('**/.gitignore', { ...discoveryOptions, cwd: root }) : []
  for (const file of [...gitFiles, ...config.ignoreFiles]) {
    const absolute = await safePath(root, file)
    if (!(await statOrNull(absolute))?.isFile()) throw new Error(`Arquivo de exclusão ausente: ${file}`)
  }
  const gitIgnored = gitFiles.length
    ? await isIgnoredByIgnoreFiles(gitFiles.map(convertPathToPattern), { cwd: root })
    : () => false
  const ignored = config.ignoreFiles.length
    ? await isIgnoredByIgnoreFiles(config.ignoreFiles.map(convertPathToPattern), { cwd: root })
    : () => false
  /** @param {string} file */
  const excluded = file =>
    ignored(file) ||
    config.exclude.some(pattern => {
      const parts = file.split('/')
      return parts.some((_, index) => path.matchesGlob(parts.slice(0, index + 1).join('/'), pattern.replace(/\/$/, '')))
    })
  /** @type {Map<string, {from: string, tree: boolean, output?: string}>} */
  const selected = new Map()
  /** @type {string[]} */
  const warnings = []
  for (const from of config.from) {
    const absolute = await safePath(root, from)
    const info = await statOrNull(absolute)
    if (!info) throw new Error(`Origem não encontrada: ${from}`)
    if (excluded(from)) continue
    if (gitIgnored(from) || (info.isDirectory() && config.gitignore))
      warnings.push(`Origem explícita inclui conteúdo mesmo quando ignorado pelo Git: ${from}`)
    selected.set(from, { from, tree: config.preserveTree })
  }
  const matches = await globby([...config.globs, ...config.extensions.map(extensionPattern)], {
    ...discoveryOptions,
    cwd: root,
    onlyFiles: true
  })
  for (const from of matches.sort()) {
    if (!protectedPath(from) && !gitIgnored(from) && !excluded(from) && !selected.has(from))
      selected.set(from, { from, tree: !config.flatten })
  }
  // Um diretório com exclusões vira operações sobre seus filhos permitidos.
  // O diretório original e os itens excluídos permanecem no lugar.
  for (const item of [...selected.values()]) {
    const absolute = await safePath(root, item.from)
    if (!(await statOrNull(absolute))?.isDirectory()) continue
    /** @type {string[]} */
    const children = []
    let hasExclusions = false
    /** @param {string} current */
    async function walk(current) {
      const file = await safePath(root, current)
      if (excluded(current)) {
        hasExclusions = true
        return
      }
      if ((await statOrNull(file))?.isDirectory()) {
        const names = await readdir(file)
        if (!names.length) children.push(current)
        for (const name of names) await walk(`${current}/${name}`)
      } else children.push(current)
    }
    await walk(item.from)
    if (hasExclusions || config.flatten) {
      if (config.rename) throw new Error('--rename não pode dividir uma pasta por exclusões ou --flatten.')
      selected.delete(item.from)
      for (const from of children)
        selected.set(from, {
          from,
          tree: item.tree,
          output: config.flatten
            ? path.basename(from)
            : item.tree
              ? from
              : `${path.basename(item.from)}/${path.relative(item.from, from).split(path.sep).join('/')}`
        })
    }
  }
  const items = [...selected.values()].sort((a, b) => a.from.length - b.from.length || a.from.localeCompare(b.from))
  return {
    items: items.filter(
      (item, index) => !items.slice(0, index).some(parent => item.from.startsWith(`${parent.from}/`))
    ),
    warnings
  }
}
