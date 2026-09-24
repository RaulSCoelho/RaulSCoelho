import * as p from '@clack/prompts'
import { realpath } from 'node:fs/promises'

import { help, parseCopyArgs } from './args.mjs'
import { chooseExclusion, chooseInclusion } from './choices.mjs'
import { buildClipboard, findFiles } from './collect.mjs'
import { ask, formatBytes } from '../lib/cli.mjs'
import { writeClipboard } from '../lib/clipboard.mjs'
import { safePath, statOrNull } from '../lib/filesystem.mjs'

export { help }

/** @param {{root?: string, inclusion?: import('./collect.mjs').Selection | undefined, exclusion?: import('./collect.mjs').Selection | undefined, interactive?: boolean, yes?: boolean, dryRun?: boolean, stdout?: boolean}} options */
export async function copy({
  root = process.cwd(),
  inclusion,
  exclusion,
  interactive = !inclusion,
  yes = false,
  dryRun = false,
  stdout = false
} = {}) {
  const tty = Boolean(process.stdin.isTTY && process.stdout.isTTY) && !stdout
  if (interactive && !tty)
    throw new Error(
      'O modo interativo exige um terminal. Use --all, --file, --dir, --ext ou --glob; --stdout permite usar sem clipboard.'
    )
  if (!inclusion && !tty) throw new Error('Informe --all ou filtros: --file, --dir, --ext ou --glob.')
  const log = stdout ? console.error : tty ? p.log.info : console.log
  const finish = tty ? p.outro : log
  if (tty) p.intro('RepoClip')
  inclusion ??= await chooseInclusion()
  exclusion ??= interactive ? await chooseExclusion(root) : { mode: 'gitignore' }
  if (!exclusion) {
    finish('Operação cancelada.')
    return
  }
  root = await realpath(root)
  for (const file of exclusion.ignoreFiles ?? []) {
    const info = await statOrNull(await safePath(root, file))
    if (!info && file === '.gitignore') continue
    if (!info?.isFile()) throw new Error(`Arquivo de regras não encontrado: ${file}`)
  }
  const files = await findFiles(inclusion, exclusion, root, { quiet: !tty })
  if (!files.length) {
    finish('Nenhum arquivo corresponde aos filtros. Nada foi copiado.')
    return
  }
  if (dryRun) {
    for (const file of files) log(JSON.stringify(file))
    finish(`${files.length} arquivos selecionados. Nenhum conteúdo foi copiado.`)
    return
  }
  const sensitive = files.filter(file =>
    /(^|\/)(?:\.env(?!\.example$)[^/]*|\.npmrc|id_rsa|id_ed25519|[^/]+\.(?:pem|key|p12|pfx))$/i.test(file)
  )
  if (sensitive.length) {
    log(`Possíveis arquivos sensíveis: ${sensitive.slice(0, 5).join(', ')}`)
    if (!yes) {
      if (!tty) throw new Error('Exclua os arquivos sensíveis ou use --yes para autorizar a cópia.')
      if (!(await ask(p.confirm({ message: 'Copiar também esses arquivos?', initialValue: false })))) {
        p.cancel('Cópia cancelada. Ajuste os filtros e tente novamente.')
        return
      }
    }
  }
  const result = await buildClipboard(files, root, { quiet: !tty })
  if (!result.copied) {
    finish('Nenhum arquivo de texto válido foi encontrado. Nada foi copiado.')
    return
  }
  if (result.bytes > 1024 ** 2)
    log(`O conteúdo tem ${formatBytes(result.bytes)}. Pode ultrapassar o limite de contexto de uma IA.`)
  if (stdout) process.stdout.write(result.output + '\n')
  else {
    const writing = tty ? p.spinner() : null
    writing?.start('Copiando para a área de transferência...')
    try {
      await writeClipboard(result.output)
      writing?.stop('Área de transferência atualizada')
    } catch (error) {
      writing?.stop('Não foi possível acessar a área de transferência')
      throw new Error(
        `Não foi possível acessar a área de transferência. Use --stdout para escrever no terminal. ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
  if (result.skipped.length) log(`${result.skipped.length} arquivo(s) ignorado(s): binários, links ou acima de 2 MiB.`)
  finish(`${result.copied} arquivos copiados · ${formatBytes(result.bytes)}`)
}

/** @param {string[]} args */
export async function runCopy(args = process.argv.slice(2)) {
  const options = parseCopyArgs(args)
  if (options.help) {
    console.log(help)
    return
  }
  await copy(options)
}
