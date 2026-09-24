import * as p from '@clack/prompts'

import { help, parseCleanArgs } from './args.mjs'
import { chooseClean } from './choices.mjs'
import { planClean, removeCleanPlan } from './plan.mjs'
import { ask, createProgress, formatBytes } from '../lib/cli.mjs'

export { help }

/** @param {{root?: string, selection?: import('./plan.mjs').CleanSelection | undefined, interactive?: boolean, dryRun?: boolean, yes?: boolean}} options */
export async function clean({
  root = process.cwd(),
  selection,
  interactive = !selection,
  dryRun = false,
  yes = false
} = {}) {
  const tty = Boolean(process.stdin.isTTY && process.stdout.isTTY)
  if (interactive && !tty)
    throw new Error(
      'O modo interativo exige um terminal. Use --preset, --file, --dir, --ext ou --glob com --dry-run ou --yes.'
    )
  if (tty) p.intro('RepoClean')
  if (!selection) {
    if (!tty) throw new Error('Informe o que limpar: --preset, --file, --dir, --ext ou --glob.')
    p.log.step('Etapa 1/3 · Seleção')
    selection = await chooseClean()
  } else if (interactive) {
    const extra = await chooseClean()
    selection = Object.fromEntries(
      ['presets', 'files', 'folders', 'extensions', 'globs'].map(key => {
        const field = /** @type {keyof import('./plan.mjs').CleanSelection} */ (key)
        return [key, [...(selection?.[field] ?? []), ...(extra[field] ?? [])]]
      })
    )
  }
  const log = tty ? p.log.info : console.log
  const finish = tty ? p.outro : log
  const waiting = tty ? p.spinner() : null
  waiting?.start('Preparando a prévia...')
  let plan
  try {
    plan = await planClean(selection, root)
    waiting?.stop('Prévia pronta')
  } catch (error) {
    waiting?.stop('Não foi possível preparar a limpeza')
    throw error
  }
  if (!plan.targets.length) {
    finish('Nenhum arquivo ou diretório corresponde à seleção.')
    return
  }
  if (tty) p.log.step('Etapa 2/3 · Prévia')
  log(`Raiz: ${JSON.stringify(plan.root)}`)
  for (const target of plan.targets) log(JSON.stringify(target))
  log(`${plan.count} itens · ${formatBytes(plan.bytes)} de arquivos. As pastas listadas incluem todo o conteúdo.`)
  if (dryRun) {
    finish('Simulação concluída. Nada foi excluído.')
    return
  }
  log('A remoção é permanente. Encerre builds e instalações antes de continuar.')
  if (!yes) {
    if (!tty) throw new Error('Sem terminal: use --yes para apagar ou --dry-run para simular.')
    p.log.step('Etapa 3/3 · Confirmação')
    if (!(await ask(p.confirm({ message: 'Excluir os alvos listados?', initialValue: false })))) {
      p.cancel('Nada foi excluído.')
      return
    }
  }
  const bar = tty ? createProgress(plan.count, 'Validando e removendo itens') : null
  try {
    const removed = await removeCleanPlan(plan, { onProgress: count => bar?.update(count) })
    bar?.stop('Limpeza concluída')
    finish(`${removed} itens removidos.`)
  } catch (error) {
    bar?.stop('Limpeza interrompida')
    throw error
  }
}

/** @param {string[]} args */
export async function runClean(args = process.argv.slice(2)) {
  const options = parseCleanArgs(args)
  if (options.help) {
    console.log(help)
    return
  }
  await clean(options)
}
