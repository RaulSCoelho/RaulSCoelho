import * as p from '@clack/prompts'

import { help, parseMoveArgs } from './args.mjs'
import { chooseMove } from './choices.mjs'
import { normalizeMove } from './config.mjs'
import { executeMove } from './execute.mjs'
import { readHistory } from './history.mjs'
import { planMove } from './plan.mjs'
import { executeUndo, planUndo } from './undo.mjs'
import { ask, createProgress, formatBytes } from '../lib/cli.mjs'
import { projectRoot } from '../lib/filesystem.mjs'

export { help, normalizeMove, planMove, executeMove, readHistory, planUndo, executeUndo }

/** @param {string[]} lines @param {boolean} interactive */
async function preview(lines, interactive) {
  const write = interactive ? p.log.message : console.log
  for (const line of lines.slice(0, interactive ? 20 : lines.length)) write(line)
  if (
    interactive &&
    lines.length > 20 &&
    (await ask(p.confirm({ message: `Mostrar os ${lines.length - 20} itens restantes?`, initialValue: false })))
  ) {
    for (const line of lines.slice(20)) write(line)
  }
}

/** @param {string[]} args @param {string} root */
export async function runMove(args = process.argv.slice(2), root = process.cwd()) {
  const parsed = parseMoveArgs(args)
  if (parsed.help) {
    console.log(help)
    return
  }
  if (parsed.version) throw new Error('Use --version isoladamente pelo binário repomove.')
  root = await projectRoot(root)
  const tty = Boolean(process.stdin.isTTY && process.stdout.isTTY)
  if (parsed.command === 'history') {
    const records = await readHistory(root)
    for (const record of records)
      console.log(
        `${record.id} · ${record.date} · ${record.status}\n${record.operations.map(op => `  ${op.status} (${op.action ?? 'move'}): ${JSON.stringify(op.from)} → ${JSON.stringify(op.to)}${op.backup ? ` · backup: ${JSON.stringify(op.backup)}` : ''}`).join('\n')}${record.error ? `\n  ${record.error}` : ''}`
      )
    if (!records.length) console.log('Nenhuma movimentação registrada.')
    return
  }
  let config = parsed.config
  if (config.interactive && !tty)
    throw new Error('O modo interativo exige um terminal. Informe --from/--glob/--ext, --to e --yes ou --dry-run.')
  if (tty) p.intro('RepoMove')
  const log = tty ? p.log.info : console.log
  let movePlan, undoPlan
  if (parsed.command === 'move') {
    const missing = !config.to || (!config.from.length && !config.globs.length && !config.extensions.length)
    if (tty && (config.interactive || missing)) config = await chooseMove(config, root)
    else if (missing)
      throw new Error('Informe --from, --glob ou --ext e --to; não há terminal para perguntar os valores ausentes.')
  }
  const waiting = tty ? p.spinner() : null
  waiting?.start('Preparando e verificando a prévia...')
  try {
    if (parsed.command === 'undo') undoPlan = await planUndo(root)
    else movePlan = await planMove(config, root)
    waiting?.stop('Prévia pronta')
  } catch (error) {
    waiting?.stop('Não foi possível preparar a prévia')
    throw error
  }
  log(`Raiz: ${JSON.stringify(root)}`)
  if (movePlan) {
    if (tty) p.log.step('Etapa 4/5 · Prévia')
    log(movePlan.config.copy ? 'Copiar e manter os originais.' : 'Mover e remover do local original.')
    log(`${movePlan.files} arquivos · ${movePlan.directories} diretórios · ${formatBytes(movePlan.bytes)}`)
    await preview(
      movePlan.operations.map(
        op =>
          `${op.skip ? '[ignorar] ' : ''}${JSON.stringify(op.from)} → ${JSON.stringify(op.to)}${op.existing ? ' [backup + sobrescrita]' : ''}`
      ),
      tty
    )
    for (const warning of [...movePlan.warnings, ...movePlan.conflicts]) log(warning)
    if (movePlan.references.length) log(`Possíveis referências: ${movePlan.references.join(', ')}`)
    log('Imports não serão atualizados. A busca de referências é limitada e pode não encontrar todas.')
    if (movePlan.errors.length) throw new Error(movePlan.errors.join('\n'))
  } else if (undoPlan)
    await preview(
      undoPlan.operations.map(
        op =>
          `${op.copy ? `Remover cópia ${JSON.stringify(op.from)}` : `${JSON.stringify(op.from)} → ${JSON.stringify(op.to)}`}${op.backup ? ' [restaurar backup]' : ''}`
      ),
      tty
    )
  if (config.dryRun) {
    log('Simulação concluída. Nenhum arquivo foi alterado.')
    return
  }
  const total = movePlan ? movePlan.operations.filter(op => !op.skip).length : (undoPlan?.operations.length ?? 0)
  if (!total) {
    log('Nenhuma operação a executar.')
    return
  }
  if (!config.yes) {
    if (!tty) throw new Error('Sem terminal: use --yes para executar ou --dry-run para simular.')
    p.log.step('Etapa 5/5 · Confirmação')
    if (!(await ask(p.confirm({ message: 'Executar as operações apresentadas?', initialValue: false })))) {
      p.cancel('Nenhum arquivo foi alterado.')
      return
    }
  }
  const controller = new AbortController()
  const interrupt = () => controller.abort(new Error('Interrompido pelo usuário.'))
  process.on('SIGINT', interrupt)
  process.on('SIGTERM', interrupt)
  const bar = tty ? createProgress(total, config.copy ? 'Copiando itens' : 'Movendo itens') : null
  try {
    const options = {
      signal: controller.signal,
      onProgress: (/** @type {number} */ completed) => bar?.update(completed)
    }
    const result = movePlan
      ? await executeMove(movePlan, options)
      : undoPlan
        ? await executeUndo(undoPlan, options)
        : null
    bar?.stop('Operação concluída')
    log(`${result?.completed ?? 0} operações concluídas.`)
  } catch (error) {
    bar?.stop('Operação interrompida')
    throw error
  } finally {
    process.off('SIGINT', interrupt)
    process.off('SIGTERM', interrupt)
  }
}
