import { readHistory, saveRecord, withHistoryLock } from './history.mjs'
import { transfer } from './transfer.mjs'
import { removeVerified, safePath, statOrNull, verifySnapshot } from '../lib/filesystem.mjs'

/** @typedef {{root: string, id: string, operations: {from: string, to: string, backup: string | null, copy: boolean}[]}} UndoPlan */
/** @type {WeakMap<UndoPlan, {record: import('./history.mjs').MoveRecord, serialized: string}>} */
const plans = new WeakMap()

/** @param {import('./history.mjs').MoveRecord} record */
async function validateUndo(record) {
  for (const op of record.operations) {
    if (['pending', 'undone'].includes(op.status)) continue
    if (op.status !== 'completed')
      throw new Error(
        `Operação interrompida em ${op.status}: ${op.from} → ${op.to}. Confira os caminhos e backups no histórico antes de recuperar manualmente.`
      )
    await verifySnapshot(record.root, op.to, op.before)
    if (op.action === 'copy') await verifySnapshot(record.root, op.from, op.before)
    else if (await statOrNull(await safePath(record.root, op.from)))
      throw new Error(`Não é seguro desfazer: origem ocupada ${op.from}`)
    if (op.backup && op.existing) await verifySnapshot(record.root, op.backup, op.existing, true)
  }
}

/** @param {string} root @returns {Promise<UndoPlan>} */
export async function planUndo(root = process.cwd()) {
  const records = await readHistory(root)
  const record = records.findLast(item => item.status !== 'undone')
  if (!record) throw new Error('Nenhuma operação disponível para desfazer.')
  await validateUndo(record)
  const operations = record.operations
    .filter(op => op.status === 'completed')
    .toReversed()
    .map(op => Object.freeze({ from: op.to, to: op.from, backup: op.backup, copy: op.action === 'copy' }))
  const plan = { root: record.root, id: record.id, operations }
  Object.freeze(operations)
  Object.freeze(plan)
  plans.set(plan, { record, serialized: JSON.stringify(record) })
  return plan
}

/** @param {UndoPlan} plan @param {import('./execute.mjs').ExecutionOptions & {dryRun?: boolean}} options */
export async function executeUndo(plan, { dryRun = false, signal, onProgress } = {}) {
  const saved = plans.get(plan)
  if (!saved) throw new Error('Plano de reversão inválido ou já utilizado.')
  if (dryRun) return { completed: 0, dryRun: true }
  plans.delete(plan)
  let completed = 0
  await withHistoryLock(plan.root, async () => {
    const current = (await readHistory(plan.root)).find(record => record.id === plan.id)
    if (!current || JSON.stringify(current) !== saved.serialized) throw new Error('O histórico mudou após a prévia.')
    await validateUndo(current)
    try {
      for (const op of current.operations.toReversed()) {
        if (op.status !== 'completed') continue
        signal?.throwIfAborted()
        op.status = 'undoing'
        await saveRecord(current)
        if (op.action === 'copy') {
          await verifySnapshot(plan.root, op.from, op.before)
          await removeVerified(plan.root, op.to, op.before)
        } else await transfer(plan.root, op.to, op.from, op.before)
        if (op.backup && op.existing) await transfer(plan.root, op.backup, op.to, op.existing)
        op.status = 'undone'
        completed++
        await saveRecord(current)
        onProgress?.(completed)
      }
      current.status = 'undone'
      await saveRecord(current)
    } catch (error) {
      current.status = 'partial-undo'
      current.error = error instanceof Error ? error.message : String(error)
      await saveRecord(current)
      throw new Error(`Reversão interrompida: ${completed} concluídas. ${current.error}`)
    }
  })
  return { completed, dryRun: false }
}
