import { randomUUID } from 'node:crypto'
import fs, { lstat, mkdir, open, rmdir, unlink } from 'node:fs/promises'
import path from 'node:path'

import { hasCode, makeParents, removeVerified, safePath, statOrNull, verifySnapshot } from '../lib/filesystem.mjs'

/** Reserva um nome sem substituir conteúdo que tenha surgido após a prévia.
 * @param {string} target @param {boolean} directory
 */
async function reserve(target, directory) {
  if (directory) await mkdir(target)
  else {
    const file = await open(target, 'wx', 0o600)
    await file.close()
  }
  return lstat(target, { bigint: true })
}

/** @param {string} target @param {import('node:fs').BigIntStats} reserved */
async function checkReservation(target, reserved) {
  const current = await lstat(target, { bigint: true })
  if (
    current.ino !== reserved.ino ||
    current.dev !== reserved.dev ||
    current.size !== reserved.size ||
    current.mtimeNs !== reserved.mtimeNs ||
    current.ctimeNs !== reserved.ctimeNs
  )
    throw new Error(`Destino reservado foi alterado: ${target}`)
}

/** Move sem substituir um destino existente. EXDEV mantém a cópia validada se a remoção falhar.
 * @param {string} root @param {string} from @param {string} to
 * @param {import('../lib/filesystem.mjs').Snapshot} expected
 * @param {{copy?: boolean}} options
 */
export async function transfer(root, from, to, expected, { copy = false } = {}) {
  const internal = to.startsWith('.repomove/') || from.startsWith('.repomove/')
  const source = await safePath(root, from, internal)
  await makeParents(root, to, internal)
  const target = await safePath(root, to, internal)
  await verifySnapshot(root, from, expected, internal)
  if (await statOrNull(target)) throw new Error(`Destino ocupado após a prévia: ${to}`)
  const directory = (await lstat(source)).isDirectory()
  /** @type {import('node:fs').BigIntStats | null} */
  let reserved = await reserve(target, directory)
  try {
    // Windows não renomeia uma pasta sobre a pasta vazia usada como reserva.
    // Mantém a reserva e copia com criação exclusiva, sem abrir uma janela para sobrescritas.
    if (directory && process.platform === 'win32') {
      await safePath(root, to, internal)
      await checkReservation(target, reserved)
      reserved = null
      for (const name of await fs.readdir(source)) {
        await safePath(root, `${from}/${name}`, internal)
        const child = await safePath(root, `${to}/${name}`, internal)
        await fs.cp(path.join(source, name), child, {
          recursive: true,
          dereference: false,
          force: false,
          errorOnExist: true,
          preserveTimestamps: true
        })
      }
      await fs.chmod(target, (await lstat(source)).mode)
      await verifySnapshot(root, from, expected, internal)
      await verifySnapshot(root, to, expected, internal)
      if (!copy) await removeVerified(root, from, expected, internal)
      return 'copy'
    }
    await safePath(root, from, internal)
    await safePath(root, to, internal)
    await checkReservation(target, reserved)
    let needsCopy = copy
    if (!needsCopy) {
      try {
        await fs.rename(source, target)
      } catch (error) {
        if (!hasCode(error, 'EXDEV')) throw error
        needsCopy = true
      }
    }
    if (needsCopy) {
      const temporary = path.posix.join(path.posix.dirname(to), `.repomove-tmp-${randomUUID()}`)
      const temporaryPath = await safePath(root, temporary, true)
      // cp não segue links; a validação rejeita qualquer link surgido durante a cópia.
      await fs.cp(source, temporaryPath, {
        recursive: true,
        dereference: false,
        force: false,
        errorOnExist: true,
        preserveTimestamps: true
      })
      await verifySnapshot(root, temporary, expected, true)
      await verifySnapshot(root, from, expected, internal)
      await safePath(root, to, internal)
      await checkReservation(target, reserved)
      await fs.rename(temporaryPath, target)
      reserved = null
      await verifySnapshot(root, to, expected, internal)
      if (!copy) await removeVerified(root, from, expected, internal)
      return 'copy'
    }
    reserved = null
    await verifySnapshot(root, to, expected, internal)
    return 'rename'
  } catch (error) {
    // Remove apenas a reserva intacta; cópias e backups são preservados para recuperação.
    if (reserved) {
      try {
        await safePath(root, to, internal)
        await checkReservation(target, reserved)
        if (directory) await rmdir(target)
        else await unlink(target)
      } catch {
        /* Um destino alterado pertence ao usuário e deve permanecer intacto. */
      }
    }
    throw error
  }
}
