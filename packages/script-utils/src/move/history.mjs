import { randomUUID } from 'node:crypto'
import { mkdir, readdir, readFile, rmdir } from 'node:fs/promises'
import writeFileAtomic from 'write-file-atomic'

import { hasCode, makeParents, projectRoot, safePath, statOrNull } from '../lib/filesystem.mjs'

/**
 * @typedef {import('./plan.mjs').MoveOperation & {status: string, backup: string | null, method?: string, action?: 'move' | 'copy'}} HistoryOperation
 * @typedef {{id: string, root: string, date: string, status: string, operations: HistoryOperation[], error?: string}} MoveRecord
 */

/** @param {string} root @param {() => Promise<unknown>} action */
export async function withHistoryLock(root, action) {
  await makeParents(root, '.repomove/lock', true)
  const lock = await safePath(root, '.repomove/lock', true)
  try {
    await mkdir(lock)
  } catch (error) {
    if (hasCode(error, 'EEXIST'))
      throw new Error(
        'RepoMove já está em execução ou foi interrompido. Confira history e remova .repomove/lock somente se não houver outro processo ativo.'
      )
    throw error
  }
  try {
    return await action()
  } finally {
    await safePath(root, '.repomove/lock', true)
    await rmdir(lock)
  }
}

/** @param {MoveRecord} record */
export async function saveRecord(record) {
  const relative = `.repomove/${record.id}/record.json`
  await makeParents(record.root, relative, true)
  const file = await safePath(record.root, relative, true)
  await writeFileAtomic(file, `${JSON.stringify(record, null, 2)}\n`, {
    mode: 0o600,
    fsync: true,
    // A biblioteca pode aguardar outra escrita; revalida o caminho ao retomar.
    tmpfileCreated: () => safePath(record.root, relative, true)
  })
}

/** @param {import('./plan.mjs').MovePlan} plan @returns {MoveRecord} */
export function createRecord(plan) {
  const id = `${Date.now()}-${randomUUID()}`
  return {
    id,
    root: plan.root,
    date: new Date().toISOString(),
    status: 'running',
    operations: plan.operations
      .filter(op => !op.skip)
      .map((op, index) => ({
        ...op,
        action: plan.config.copy ? 'copy' : 'move',
        status: 'pending',
        backup: op.existing ? `.repomove/${id}/backups/${index}` : null
      }))
  }
}

/** @param {unknown} value */
function validSnapshot(value) {
  if (!value || typeof value !== 'object') return false
  return (
    'digest' in value &&
    typeof value.digest === 'string' &&
    /^[a-f0-9]{64}$/.test(value.digest) &&
    ['files', 'directories', 'bytes'].every(key => key in value && typeof Reflect.get(value, key) === 'number')
  )
}

/** @param {string} root @returns {Promise<MoveRecord[]>} */
export async function readHistory(root = process.cwd()) {
  root = await projectRoot(root)
  const folder = await safePath(root, '.repomove', true)
  if (!(await statOrNull(folder))) return []
  /** @type {MoveRecord[]} */
  const records = []
  for (const id of (await readdir(folder)).sort()) {
    if (!/^\d{13}-[a-f0-9-]{36}$/.test(id)) continue
    const file = await safePath(root, `.repomove/${id}/record.json`, true)
    if (!(await statOrNull(file))) continue
    /** @type {MoveRecord} */
    const record = JSON.parse(await readFile(file, 'utf8'))
    if (record.id !== id || record.root !== root || !Array.isArray(record.operations))
      throw new Error(`Histórico inválido: ${id}`)
    for (const [index, op] of record.operations.entries()) {
      if (
        (op.action !== undefined && !['move', 'copy'].includes(op.action)) ||
        !validSnapshot(op.before) ||
        (op.existing !== null && !validSnapshot(op.existing)) ||
        op.backup !== (op.existing ? `.repomove/${id}/backups/${index}` : null)
      )
        throw new Error(`Registro inválido: ${id}`)
      await safePath(root, op.from)
      await safePath(root, op.to)
      if (op.backup) await safePath(root, op.backup, true)
    }
    records.push(record)
  }
  return records
}
