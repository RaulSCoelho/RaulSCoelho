import { parseArgs } from 'node:util'

import { normalizeMove } from './config.mjs'
import { commonOptions, validateArguments } from '../lib/args.mjs'

export const help = `Uso: repomove [opções] | undo [opções] | history

Seleção:
  --from <caminho>       Origem explícita (repetível)
  --to <diretório>       Destino relativo à raiz atual
  --glob <padrão>        Seleção por glob (repetível)
  --ext <extensão>       Seleção por extensão (repetível)
  --exclude <padrão>     Excluir caminho ou glob (repetível)
  --ignore-file <arquivo> Regras de exclusão (repetível)
  --no-gitignore        Desabilitar .gitignore automático

Comportamento:
  --copy                Copiar para o destino e manter os originais
  --rename <nome>        Renomear uma única origem
  --preserve-tree       Preservar caminhos relativos
  --flatten             Reunir arquivos no destino
  --on-conflict <modo>   error (padrão), skip, rename ou overwrite com backup
  --dry-run             Apenas simular, mesmo com --yes
  --yes                 Executar sem perguntar
  --interactive         Abrir os menus
  --help, -h            Mostrar ajuda
  --version, -v         Mostrar versão

Exemplos:
  repomove --from src/old.ts --to src --rename new.ts --dry-run
  repomove --ext .log --to logs --flatten --on-conflict rename --yes
  repomove undo --dry-run
  repomove history

Sem argumentos, abre o modo interativo. Undo reverte o último registro pendente.`

/** @param {string[]} args */
export function parseMoveArgs(args) {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      from: { type: 'string', multiple: true },
      to: { type: 'string' },
      glob: { type: 'string', multiple: true },
      ext: { type: 'string', multiple: true },
      exclude: { type: 'string', multiple: true },
      'ignore-file': { type: 'string', multiple: true },
      'no-gitignore': { type: 'boolean' },
      copy: { type: 'boolean' },
      rename: { type: 'string' },
      'preserve-tree': { type: 'boolean' },
      flatten: { type: 'boolean' },
      'on-conflict': { type: 'string' },
      ...commonOptions
    }
  })
  const command = positionals[0] ?? 'move'
  if (positionals.length > 1 || !['move', 'undo', 'history'].includes(command))
    throw new Error('Use repomove, repomove undo ou repomove history.')
  if (command !== 'move') {
    const allowed = command === 'undo' ? ['dry-run', 'yes', 'help', 'version'] : ['help', 'version']
    if (Object.keys(values).some(key => !allowed.includes(key))) throw new Error(`Opção incompatível com ${command}.`)
  }
  validateArguments(values)
  if (values['on-conflict'] && !['error', 'skip', 'rename', 'overwrite'].includes(values['on-conflict']))
    throw new Error('Use --on-conflict error, skip, rename ou overwrite.')
  return {
    command,
    help: values.help ?? false,
    version: values.version ?? false,
    config: normalizeMove({
      from: values.from ?? [],
      to: values.to ?? '',
      globs: values.glob ?? [],
      extensions: values.ext ?? [],
      exclude: values.exclude ?? [],
      ignoreFiles: values['ignore-file'] ?? [],
      gitignore: !values['no-gitignore'],
      rename: values.rename ?? '',
      preserveTree: values['preserve-tree'] ?? false,
      flatten: values.flatten ?? false,
      onConflict: /** @type {'error'|'skip'|'rename'|'overwrite'} */ (values['on-conflict'] ?? 'error'),
      copy: values.copy ?? false,
      dryRun: values['dry-run'] ?? false,
      yes: values.yes ?? false,
      interactive: values.interactive ?? args.length === 0
    })
  }
}
