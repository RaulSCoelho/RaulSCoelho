import { createHash } from 'node:crypto'
import { constants } from 'node:fs'
import { lstat, mkdir, open, readdir, realpath, rmdir, unlink } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'

import { hasControlCharacters, isGitMetadataPath, isNodeModulesPath, withinRoot } from './paths.mjs'

/** @param {unknown} error @param {string} code */
export function hasCode(error, code) {
  return error instanceof Error && 'code' in error && error.code === code
}

/** @param {string} file */
export async function statOrNull(file) {
  try {
    return await lstat(file)
  } catch (error) {
    if (hasCode(error, 'ENOENT')) return null
    throw error
  }
}

/** @param {string} relative */
export function protectedPath(relative) {
  return (
    isGitMetadataPath(relative) ||
    isNodeModulesPath(relative) ||
    relative
      .split('/')
      .some(part => part.toLowerCase() === '.repomove' || part.toLowerCase().startsWith('.repomove-tmp-'))
  )
}

/** @param {string} root */
export async function projectRoot(root) {
  const resolved = await realpath(root)
  if (resolved === path.parse(resolved).root || resolved === (await realpath(homedir())) || protectedPath(resolved))
    throw new Error('Escolha uma raiz de projeto, fora de diretórios protegidos.')
  return resolved
}

/** Valida todos os ancestrais; links simbólicos não são aceitos.
 * @param {string} root @param {string} value @param {boolean} internal @param {boolean} allowRoot
 */
export async function safePath(root, value, internal = false, allowRoot = false) {
  if (allowRoot && value === '.') {
    if ((await realpath(root)) !== root) throw new Error('A raiz do projeto mudou.')
    return root
  }
  const target = withinRoot(value, root)
  if (target.relative !== value || hasControlCharacters(value))
    throw new Error(`Caminho não canônico: ${JSON.stringify(value)}`)
  if (isGitMetadataPath(value) || isNodeModulesPath(value) || (protectedPath(value) && !internal))
    throw new Error(`Caminho protegido: ${value}`)
  if ((await realpath(root)) !== root) throw new Error('A raiz do projeto mudou.')
  let current = root
  const parts = value.split('/')
  for (const [index, part] of parts.entries()) {
    current = path.join(current, part)
    const info = await statOrNull(current)
    if (!info) break
    if (info.isSymbolicLink()) throw new Error(`Link simbólico não permitido: ${value}`)
    if (index < parts.length - 1 && !info.isDirectory()) throw new Error(`Ancestral não é diretório: ${value}`)
  }
  return target.absolute
}

/** @param {string} root @param {string} value @param {boolean} internal */
export async function makeParents(root, value, internal = false) {
  const parts = value.split('/').slice(0, -1)
  for (let index = 1; index <= parts.length; index++) {
    const relative = parts.slice(0, index).join('/')
    const absolute = await safePath(root, relative, internal)
    try {
      await mkdir(absolute)
    } catch (error) {
      if (!hasCode(error, 'EEXIST')) throw error
    }
    if (!(await lstat(absolute)).isDirectory()) throw new Error(`Diretório inválido: ${relative}`)
    await safePath(root, relative, internal)
  }
}

/** @typedef {{ digest: string, files: number, directories: number, bytes: number }} Snapshot */
/** Hash de conteúdo, nomes e permissões, independente de inode/volume.
 * @param {string} root @param {string} relative @param {boolean} internal
 * @returns {Promise<Snapshot>}
 */
export async function snapshot(root, relative, internal = false) {
  const hash = createHash('sha256')
  let files = 0,
    directories = 0,
    bytes = 0
  /** @param {string} current @param {string} suffix */
  async function visit(current, suffix) {
    const absolute = await safePath(root, current, internal)
    const info = await lstat(absolute, { bigint: true })
    if (++entries > 100_000) throw new Error('Mais de 100.000 itens. Restrinja a seleção.')
    hash.update(JSON.stringify([suffix, Number(info.mode)]))
    if (info.isDirectory()) {
      directories++
      const children = (await readdir(absolute)).sort()
      for (const name of children) await visit(`${current}/${name}`, `${suffix}/${name}`)
      if (JSON.stringify(children) !== JSON.stringify((await readdir(absolute)).sort()))
        throw new Error(`Diretório mudou durante a leitura: ${current}`)
    } else if (info.isFile()) {
      const handle = await open(absolute, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
      try {
        const before = await handle.stat({ bigint: true })
        if (before.ino !== info.ino || before.dev !== info.dev) throw new Error(`Arquivo substituído: ${current}`)
        const content = createHash('sha256')
        for await (const chunk of handle.createReadStream({ autoClose: false })) content.update(chunk)
        const after = await handle.stat({ bigint: true })
        if (before.size !== after.size || before.mtimeNs !== after.mtimeNs || before.ctimeNs !== after.ctimeNs)
          throw new Error(`Arquivo mudou durante a leitura: ${current}`)
        hash.update(content.digest())
        files++
        bytes += Number(info.size)
      } finally {
        await handle.close()
      }
    } else throw new Error(`Tipo de arquivo não permitido: ${current}`)
  }
  let entries = 0
  await visit(relative, '')
  return { digest: hash.digest('hex'), files, directories, bytes }
}

/** @param {string} root @param {string} relative @param {Snapshot} expected @param {boolean} internal */
export async function verifySnapshot(root, relative, expected, internal = false) {
  if ((await snapshot(root, relative, internal)).digest !== expected.digest)
    throw new Error(`O conteúdo mudou: ${relative}`)
}

/** Remove somente a árvore verificada, sem seguir links e sem rm recursivo.
 * @param {string} root @param {string} relative @param {Snapshot} expected @param {boolean} internal
 */
export async function removeVerified(root, relative, expected, internal = false) {
  /** @type {{relative: string, directory: boolean, expected: Snapshot | null}[]} */
  const entries = []
  /** @param {string} current */
  async function collect(current) {
    const absolute = await safePath(root, current, internal)
    const info = await lstat(absolute)
    entries.push({
      relative: current,
      directory: info.isDirectory(),
      expected: info.isDirectory() ? null : await snapshot(root, current, internal)
    })
    if (info.isDirectory()) for (const name of await readdir(absolute)) await collect(`${current}/${name}`)
  }
  await collect(relative)
  await verifySnapshot(root, relative, expected, internal)
  for (const entry of entries.toReversed()) {
    const absolute = await safePath(root, entry.relative, internal)
    if (entry.directory) await rmdir(absolute)
    else {
      if (entry.expected) await verifySnapshot(root, entry.relative, entry.expected, internal)
      await unlink(absolute)
    }
  }
}
