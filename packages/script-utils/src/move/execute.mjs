import { createRecord, saveRecord, withHistoryLock } from './history.mjs'
import { validPlans } from './plan.mjs'
import { transfer } from './transfer.mjs'
import { safePath, statOrNull, verifySnapshot } from '../lib/filesystem.mjs'

/** @typedef {{signal?: AbortSignal, onProgress?: (completed: number) => void}} ExecutionOptions */

/** @param {import('./plan.mjs').MovePlan} plan @param {ExecutionOptions} options */
export async function executeMove(plan, { signal, onProgress } = {}) {
  if (!validPlans.has(plan)) throw new Error('Plano inválido ou já utilizado.')
  if (plan.errors.length) throw new Error(plan.errors.join('\n'))
  if (plan.config.dryRun) return { completed: 0, dryRun: true }
  validPlans.delete(plan)
  if (!plan.operations.some(op => !op.skip)) return { completed: 0, dryRun: false }
  let completed = 0
  const record = createRecord(plan)
  await withHistoryLock(plan.root, async () => {
    signal?.throwIfAborted()
    // Validação global antes de mover a primeira origem ou preparar backups.
    for (const op of record.operations) {
      await verifySnapshot(plan.root, op.from, op.before)
      const target = await safePath(plan.root, op.to)
      if (op.existing) await verifySnapshot(plan.root, op.to, op.existing)
      else if (await statOrNull(target)) throw new Error(`Destino ocupado após a prévia: ${op.to}`)
    }
    await saveRecord(record)
    try {
      for (const op of record.operations) {
        signal?.throwIfAborted()
        if (op.backup && op.existing) {
          op.status = 'backing-up'
          await saveRecord(record)
          await transfer(plan.root, op.to, op.backup, op.existing)
          op.status = 'backed-up'
          await saveRecord(record)
        }
        op.status = 'moving'
        await saveRecord(record)
        op.method = await transfer(plan.root, op.from, op.to, op.before, { copy: op.action === 'copy' })
        op.status = 'completed'
        completed++
        await saveRecord(record)
        onProgress?.(completed)
      }
      record.status = 'completed'
      await saveRecord(record)
    } catch (error) {
      const interrupted = record.operations.find(op => ['moving', 'backing-up', 'backed-up'].includes(op.status))
      if (interrupted) {
        try {
          await reconcile(record, interrupted)
        } catch {
          /* Estado ambíguo: preserva os dados e o estágio para recuperação manual. */
        }
      }
      completed = record.operations.filter(op => op.status === 'completed').length
      record.status = 'partial'
      record.error = error instanceof Error ? error.message : String(error)
      await saveRecord(record)
      throw new Error(
        `Operação interrompida: ${completed}/${record.operations.length} concluídas. Histórico ${record.id}. ${record.error}`
      )
    }
  })
  return { completed, dryRun: false, id: record.id }
}

/** Recupera apenas estados cuja origem e destino podem ser comprovados.
 * @param {import('./history.mjs').MoveRecord} record
 * @param {import('./history.mjs').HistoryOperation} op
 */
async function reconcile(record, op) {
  const source = await statOrNull(await safePath(record.root, op.from))
  const destination = await statOrNull(await safePath(record.root, op.to))
  if ((!source || op.action === 'copy') && destination && op.status === 'moving') {
    await verifySnapshot(record.root, op.to, op.before)
    op.status = 'completed'
    return
  }
  if (!source) return
  await verifySnapshot(record.root, op.from, op.before)
  if (!destination) {
    if (op.backup && op.existing) await transfer(record.root, op.backup, op.to, op.existing)
    op.status = 'pending'
  } else if (
    op.status === 'backing-up' &&
    op.existing &&
    op.backup &&
    !(await statOrNull(await safePath(record.root, op.backup, true)))
  ) {
    await verifySnapshot(record.root, op.to, op.existing)
    op.status = 'pending'
  }
}
