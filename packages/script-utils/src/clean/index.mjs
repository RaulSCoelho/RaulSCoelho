import * as p from '@clack/prompts'

import { chooseClean } from './choices.mjs'
import { planClean, removeCleanPlan } from './plan.mjs'
import { ask, createProgress, formatBytes } from '../lib/cli.mjs'

export async function clean({ root = process.cwd() } = {}) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('Execute "repoclean" em um terminal interativo.')
  }
  p.intro('RepoClean')
  p.log.step('Etapa 1/3 · Seleção')
  const selection = await chooseClean()
  const waiting = p.spinner()
  waiting.start('Preparando a prévia...')
  let plan
  try {
    plan = await planClean(selection, root)
    waiting.stop('Prévia pronta')
  } catch (error) {
    waiting.stop('Não foi possível preparar a limpeza')
    throw error
  }
  if (!plan.targets.length) {
    p.outro('Nenhum arquivo ou diretório corresponde à seleção.')
    return
  }
  p.log.step('Etapa 2/3 · Prévia')
  p.log.info(`Raiz: ${JSON.stringify(plan.root)}`)
  for (const target of plan.targets) p.log.message(`  ${JSON.stringify(target)}`)
  p.log.info(
    `${plan.count} itens · ${formatBytes(plan.bytes)} de arquivos. As pastas listadas incluem todo o conteúdo.`
  )
  p.log.warn('A remoção é permanente. Encerre builds e instalações antes de continuar.')
  p.log.step('Etapa 3/3 · Confirmação')
  if (!(await ask(p.confirm({ message: 'Excluir os alvos listados?', initialValue: false })))) {
    p.cancel('Nada foi excluído.')
    return
  }
  const bar = createProgress(plan.count, 'Validando e removendo itens')
  try {
    const removed = await removeCleanPlan(plan, { onProgress: bar.update })
    bar.stop('Limpeza concluída')
    p.outro(`${removed} itens removidos.`)
  } catch (error) {
    bar.stop('Limpeza interrompida')
    throw error
  }
}
