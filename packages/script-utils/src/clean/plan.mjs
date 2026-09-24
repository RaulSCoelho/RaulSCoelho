import { convertPathToPattern, globby } from 'globby'
import { lstat, readdir, realpath, rmdir, unlink } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'

import { presets } from './presets.mjs'
import { isGitMetadataPath, withinRoot } from '../lib/paths.mjs'
import { extensionPattern, filePattern, globPattern } from '../lib/patterns.mjs'

/**
 * @typedef {object} CleanSelection
 * @property {string[]} [presets]
 * @property {string[]} [files]
 * @property {string[]} [folders]
 * @property {string[]} [extensions]
 * @property {string[]} [globs]
 * @typedef {{ relative: string, info: import('node:fs').BigIntStats, children?: string[] }} Entry
 * @typedef {{ root: string, targets: readonly string[], count: number, bytes: number }} CleanPlan
 */

// A remoção aceita somente planos produzidos neste processo, sem caminhos editáveis pelo chamador.
/** @type {WeakMap<CleanPlan, { entries: Entry[], rootInfo: import('node:fs').BigIntStats }>} */
const plans = new WeakMap()

/** @param {CleanSelection} selection */
function patterns(selection, root = process.cwd()) {
  const files = (selection.files ?? []).map(value => filePattern(value, root))
  files.push(...(selection.extensions ?? []).map(extensionPattern))
  const folders = (selection.folders ?? []).map(value => convertPathToPattern(withinRoot(value, root).relative))
  for (const name of selection.presets ?? []) {
    if (!Object.hasOwn(presets, name)) throw new Error(`Preset desconhecido: ${name}`)
    const preset = presets[/** @type {keyof typeof presets} */ (name)]
    files.push(...preset.files.map(value => `**/${value}`))
    folders.push(...preset.folders.map(value => `**/${value}`))
  }
  return { files, folders, globs: (selection.globs ?? []).map(globPattern) }
}

/**
 * Verifica cada componente para impedir travessia de links em diretórios ancestrais.
 * @param {string} root
 * @param {string} relative
 */
async function inspect(root, relative) {
  const target = withinRoot(relative, root)
  if (target.relative !== relative) throw new Error(`Caminho não canônico: ${JSON.stringify(relative)}`)
  if (isGitMetadataPath(target.relative)) throw new Error(`Metadados Git protegidos: ${relative}`)
  let current = root
  const parts = target.relative.split('/')
  for (const part of parts.slice(0, -1)) {
    current = path.join(current, part)
    const info = await lstat(current, { bigint: true })
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error(`Diretório inseguro: ${relative}`)
  }
  return lstat(target.absolute, { bigint: true })
}

/** @param {import('node:fs').BigIntStats} left @param {import('node:fs').BigIntStats} right */
// BigInt preserva os identificadores de 64 bits, inclusive em volumes NTFS.
function sameIdentity(left, right) {
  return left.dev === right.dev && left.ino === right.ino && left.mode === right.mode
}

/**
 * Descobre alvos sem seguir links e registra todos os itens das pastas selecionadas.
 * @param {CleanSelection} selection
 */
export async function planClean(selection, root = process.cwd()) {
  root = await realpath(root)
  if (root === path.parse(root).root || root === (await realpath(homedir())) || isGitMetadataPath(root)) {
    throw new Error('Escolha um diretório de projeto, não a raiz do sistema, a pasta pessoal ou metadados Git.')
  }
  const rootInfo = await lstat(root, { bigint: true })
  const filters = patterns(selection, root)
  const options = {
    cwd: root,
    dot: true,
    followSymbolicLinks: false,
    expandDirectories: false,
    gitignore: false,
    // Inclui a pasta node_modules como alvo, mas nunca busca dentro das dependências.
    ignore: ['**/.git', '**/.git/**', '**/node_modules/**/*']
  }
  const matches = await Promise.all([
    globby(filters.files, { ...options, onlyFiles: true }),
    globby(filters.folders, { ...options, onlyDirectories: true }),
    globby(filters.globs, { ...options, onlyFiles: false })
  ])
  const candidates = [...new Set(matches.flat())].sort(
    (a, b) => a.split('/').length - b.split('/').length || a.localeCompare(b)
  )
  const chosen = new Set()
  for (const relative of candidates) {
    const parts = relative.split('/')
    if (parts.some((_, index) => chosen.has(parts.slice(0, index).join('/')))) continue
    const info = await inspect(root, relative)
    if (!info.isSymbolicLink()) chosen.add(relative)
  }
  const targets = [...chosen].sort((a, b) => a.localeCompare(b))
  /** @type {Entry[]} */
  const entries = []
  let bytes = 0
  /** @param {string} relative */
  async function visit(relative) {
    if (entries.length >= 500_000) throw new Error('Mais de 500.000 itens. Restrinja a seleção.')
    const info = await inspect(root, relative)
    if (info.dev !== rootInfo.dev) throw new Error(`Outro sistema de arquivos: ${relative}`)
    if (!info.isFile() && !info.isDirectory() && !info.isSymbolicLink()) {
      throw new Error(`Tipo de arquivo não suportado: ${relative}`)
    }
    /** @type {Entry} */
    const entry = { relative, info }
    entries.push(entry)
    if (info.isDirectory()) {
      entry.children = (await readdir(path.join(root, relative))).sort()
      for (const name of entry.children) await visit(`${relative}/${name}`)
    } else if (info.isFile()) bytes += Number(info.size)
  }
  for (const relative of targets) await visit(relative)
  const plan = Object.freeze({ root, targets: Object.freeze(targets), count: entries.length, bytes })
  plans.set(plan, { entries, rootInfo })
  return plan
}

/**
 * Execute apenas depois de apresentar o plano e obter confirmação do usuário.
 * @param {CleanPlan} plan
 * @param {{ onProgress?: (removed: number) => void }} [options]
 */
export async function removeCleanPlan(plan, { onProgress } = {}) {
  const snapshot = plans.get(plan)
  if (!snapshot) throw new Error('Plano inválido ou já utilizado. Gere uma nova prévia.')
  plans.delete(plan)
  const { entries, rootInfo } = snapshot
  const checkRoot = async () => {
    const info = await lstat(plan.root, { bigint: true })
    if (!sameIdentity(info, rootInfo) || (await realpath(plan.root)) !== plan.root) {
      throw new Error('A raiz mudou após a prévia. Gere um novo plano.')
    }
  }
  await checkRoot()
  // Detecta substituições, alterações de arquivos e inclusões em pastas antes da primeira remoção.
  for (const entry of entries) {
    const info = await inspect(plan.root, entry.relative)
    if (entry.children) {
      const children = (await readdir(path.join(plan.root, entry.relative))).sort()
      if (
        children.length !== entry.children.length ||
        children.some((name, index) => name !== entry.children?.[index])
      ) {
        throw new Error(`O diretório mudou após a prévia: ${entry.relative}. Gere um novo plano.`)
      }
    }
    if (
      !sameIdentity(info, entry.info) ||
      info.nlink !== entry.info.nlink ||
      info.size !== entry.info.size ||
      info.mtimeNs !== entry.info.mtimeNs ||
      info.ctimeNs !== entry.info.ctimeNs
    ) {
      throw new Error(`O alvo mudou após a prévia: ${entry.relative}. Gere um novo plano.`)
    }
  }
  let removed = 0
  /** @type {Map<string, bigint>} */
  const removedLinks = new Map()
  try {
    // Sem rm recursivo: arquivos criados depois da prévia nunca entram na remoção.
    for (const entry of entries.toReversed()) {
      await checkRoot()
      const info = await inspect(plan.root, entry.relative)
      const identity = `${entry.info.dev}:${entry.info.ino}`
      const unlinked = removedLinks.get(identity) ?? 0n
      // Unlink altera o ctime dos hard links restantes, mas não o conteúdo ou o mtime.
      const expected = { ...entry.info, nlink: entry.info.nlink - unlinked }
      /** @type {('dev' | 'ino' | 'mode' | 'nlink' | 'size' | 'mtimeNs' | 'ctimeNs')[]} */
      const fields = ['dev', 'ino', 'mode']
      if (!info.isDirectory()) {
        fields.push('nlink', 'size', 'mtimeNs')
        if (unlinked === 0n) fields.push('ctimeNs')
      }
      const changes = fields
        .filter(field => info[field] !== expected[field])
        .map(field => `${field}: ${expected[field]} → ${info[field]}`)
      if (changes.length) {
        throw new Error(`O alvo foi alterado: ${entry.relative} (${changes.join('; ')})`)
      }
      const absolute = path.join(plan.root, entry.relative)
      if (info.isDirectory()) await rmdir(absolute)
      else {
        await unlink(absolute)
        if (entry.info.nlink > 1n) removedLinks.set(identity, unlinked + 1n)
      }
      removed++
      onProgress?.(removed)
    }
  } catch (error) {
    throw new Error(
      `Limpeza interrompida após ${removed} itens: ${error instanceof Error ? error.message : String(error)}`
    )
  }
  return removed
}
