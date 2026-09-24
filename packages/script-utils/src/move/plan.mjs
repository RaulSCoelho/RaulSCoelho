import path from 'node:path'

import { normalizeMove } from './config.mjs'
import { discover } from './discover.mjs'
import { findReferences } from './references.mjs'
import { projectRoot, safePath, snapshot, statOrNull } from '../lib/filesystem.mjs'

/**
 * @typedef {import('../lib/filesystem.mjs').Snapshot} Snapshot
 * @typedef {{from: string, to: string, before: Snapshot, existing: Snapshot | null, skip: boolean}} MoveOperation
 * @typedef {{root: string, config: ReturnType<typeof normalizeMove>, operations: MoveOperation[], errors: string[], warnings: string[], conflicts: string[], references: string[], files: number, directories: number, bytes: number}} MovePlan
 */
/** @type {WeakSet<MovePlan>} */
export const validPlans = new WeakSet()

/** @param {import('./config.mjs').MoveOptions} input @param {string} root @returns {Promise<MovePlan>} */
export async function planMove(input, root = process.cwd()) {
  const config = normalizeMove(input)
  root = await projectRoot(root)
  if (!config.to || (!config.from.length && !config.globs.length && !config.extensions.length))
    throw new Error('Informe uma origem (--from, --glob ou --ext) e --to.')
  const destination = await safePath(root, config.to, false, true)
  const info = await statOrNull(destination)
  if (info && !info.isDirectory()) throw new Error('O destino --to precisa ser um diretório.')
  for (const from of config.from) {
    const source = await statOrNull(await safePath(root, from))
    if (source?.isDirectory() && (config.to === from || config.to.startsWith(`${from}/`))) {
      throw new Error(`Não é permitido mover um diretório para dentro de si mesmo: ${from}`)
    }
  }
  const { items, warnings } = await discover(config, root)
  if (items.length > 10_000) throw new Error('Mais de 10.000 operações. Restrinja a seleção.')
  if (config.rename && items.length !== 1) throw new Error('--rename exige exatamente uma origem.')
  /** @type {MovePlan} */
  const plan = {
    root,
    config,
    operations: [],
    errors: [],
    warnings,
    conflicts: [],
    references: [],
    files: 0,
    directories: 0,
    bytes: 0
  }
  for (const item of items) {
    const before = await snapshot(root, item.from)
    let to = path.posix.join(
      config.to,
      config.rename || item.output || (item.tree && !config.flatten ? item.from : path.posix.basename(item.from))
    )
    await safePath(root, to)
    if (to === item.from || to.startsWith(`${item.from}/`)) {
      plan.errors.push(`Destino igual à origem ou dentro dela: ${item.from} → ${to}`)
      continue
    }
    const overlaps = (/** @type {string} */ target) =>
      plan.operations.some(
        op => !op.skip && (op.to === target || op.to.startsWith(`${target}/`) || target.startsWith(`${op.to}/`))
      )
    const sourceOverlap = (/** @type {string} */ target) =>
      items.some(
        source => source.from === target || target.startsWith(`${source.from}/`) || source.from.startsWith(`${target}/`)
      )
    if (sourceOverlap(to)) {
      plan.errors.push(`Destino sobrepõe uma origem: ${to}`)
      continue
    }
    let existing = await statOrNull(await safePath(root, to))
    const collision = overlaps(to)
    let skip = false
    if (existing || collision) {
      plan.conflicts.push(`${item.from} → ${to}: ${collision ? 'destino repetido entre origens' : 'já existe'}`)
      if (config.onConflict === 'skip') skip = true
      else if (config.onConflict === 'rename') {
        const ancestor = plan.operations.find(op => !op.skip && to.startsWith(`${op.to}/`))
        const suffix = ancestor ? to.slice(ancestor.to.length) : ''
        const extension = ancestor || before.directories ? '' : path.posix.extname(to)
        const base = ancestor ? ancestor.to : to.slice(0, to.length - extension.length)
        let index = 1
        do {
          to = `${base}-${index++}${extension}${suffix}`
          await safePath(root, to)
        } while (overlaps(to) || sourceOverlap(to) || (await statOrNull(path.join(root, to))))
        existing = null
      } else if (config.onConflict === 'error' || collision) {
        plan.errors.push(`Conflito sem resolução: ${item.from} → ${to}`)
      }
    }
    // Mesmo um overwrite precisa validar toda a árvore anterior, inclusive caminhos protegidos.
    const previous = existing && !skip ? await snapshot(root, to) : null
    plan.operations.push({ from: item.from, to, before, existing: previous, skip })
    if (!skip) {
      plan.files += before.files
      plan.directories += before.directories
      plan.bytes += before.bytes
    }
  }
  try {
    plan.references = await findReferences(
      root,
      items.map(item => item.from)
    )
  } catch (error) {
    plan.warnings.push(`Busca de referências incompleta: ${error instanceof Error ? error.message : String(error)}`)
  }
  for (const op of plan.operations) {
    Object.freeze(op.before)
    if (op.existing) Object.freeze(op.existing)
    Object.freeze(op)
  }
  for (const value of Object.values(config)) if (Array.isArray(value)) Object.freeze(value)
  Object.freeze(config)
  for (const value of Object.values(plan)) if (Array.isArray(value)) Object.freeze(value)
  Object.freeze(plan)
  validPlans.add(plan)
  return plan
}
