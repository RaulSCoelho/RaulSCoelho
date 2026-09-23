import * as p from '@clack/prompts'
import clipboard from 'clipboardy'

import { chooseExclusion, chooseInclusion } from './choices.mjs'
import { buildClipboard, findFiles } from './collect.mjs'
import { ask, formatBytes } from '../lib/cli.mjs'

export async function copy({ root = process.cwd() } = {}) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('Execute "repoclip" em um terminal interativo.')
  }

  p.intro('RepoClip')

  const inclusion = await chooseInclusion()
  const exclusion = await chooseExclusion(root)
  if (!exclusion) {
    p.cancel('Operação cancelada.')
    return
  }

  const files = await findFiles(inclusion, exclusion, root)
  if (!files.length) {
    p.log.warn('Nenhum arquivo corresponde aos filtros escolhidos.')
    p.outro('Nada foi copiado.')
    return
  }

  const sensitive = files.filter(file =>
    /(^|\/)(?:\.env(?!\.example$)[^/]*|\.npmrc|id_rsa|id_ed25519|[^/]+\.(?:pem|key|p12|pfx))$/i.test(file)
  )
  if (sensitive.length) {
    p.log.warn(`Possíveis arquivos sensíveis encontrados: ${sensitive.slice(0, 5).join(', ')}`)
    const proceed = await ask(p.confirm({ message: 'Copiar também esses arquivos?', initialValue: false }))
    if (!proceed) {
      p.cancel('Cópia cancelada. Ajuste os filtros e tente novamente.')
      return
    }
  }

  const result = await buildClipboard(files, root)
  if (!result.copied) {
    p.log.warn('Nenhum arquivo de texto válido foi encontrado.')
    p.outro('Nada foi copiado.')
    return
  }

  if (result.bytes > 1024 ** 2) {
    p.log.warn(`O conteúdo tem ${formatBytes(result.bytes)}. Pode ultrapassar o limite de contexto de uma IA.`)
  }

  const writing = p.spinner()
  writing.start('Copiando para a área de transferência...')
  try {
    await clipboard.write(result.output)
    writing.stop('Área de transferência atualizada')
  } catch (error) {
    writing.stop('Não foi possível acessar a área de transferência')
    throw error
  }

  if (result.skipped.length) {
    p.log.warn(`${result.skipped.length} arquivo(s) ignorado(s): binários, links ou acima de 2 MiB.`)
    p.log.info(`Primeiros ignorados: ${result.skipped.slice(0, 5).join(', ')}`)
  }

  p.outro(`${result.copied} arquivos copiados · ${formatBytes(result.bytes)} · Pronto para colar!`)
}
