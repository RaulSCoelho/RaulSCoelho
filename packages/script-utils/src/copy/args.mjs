import { parseArgs } from 'node:util'

import { commonOptions, filterOptions, hasSelection, selectionFromArgs, validateArguments } from '../lib/args.mjs'

export const help = `Uso: repoclip [opções]

Sem argumentos, abre os menus de seleção e exclusão.

Seleção:
  --all                    Selecionar todo o projeto
  --file <nome>             Arquivo por nome ou caminho (repetível)
  --dir <caminho>           Arquivos de uma pasta (repetível)
  --ext <extensão>          Arquivos por extensão (repetível)
  --glob <padrão>           Arquivos por glob (repetível)

Exclusões (repetíveis):
  --exclude <glob>          Excluir arquivos por glob
  --exclude-file <nome>     Excluir arquivo por nome ou caminho
  --exclude-dir <caminho>   Excluir uma pasta e seus arquivos
  --exclude-ext <extensão>  Excluir arquivos por extensão
  --ignore-file <arquivo>   Carregar regras de exclusão
  --no-gitignore           Desabilitar .gitignore automático

Saída:
  --stdout                 Escrever o conteúdo no terminal, sem usar o clipboard
  --dry-run                Listar os arquivos, sem copiar conteúdo
  --yes                    Autorizar também arquivos potencialmente sensíveis
  --interactive            Perguntar os filtros que não foram informados
  --help, -h               Mostrar ajuda
  --version, -v            Mostrar versão

Exemplos:
  repoclip --dir src
  repoclip --ext .ts --exclude '**/*.test.ts' --dry-run
  repoclip --all --stdout > codigo.txt

Sem --stdout, o conteúdo vai para a área de transferência.`

/** @param {string[]} args */
export function parseCopyArgs(args) {
  const { values } = parseArgs({
    args,
    options: {
      ...commonOptions,
      ...filterOptions,
      all: { type: 'boolean' },
      stdout: { type: 'boolean' },
      exclude: { type: 'string', multiple: true },
      'exclude-file': { type: 'string', multiple: true },
      'exclude-dir': { type: 'string', multiple: true },
      'exclude-ext': { type: 'string', multiple: true },
      'ignore-file': { type: 'string', multiple: true },
      'no-gitignore': { type: 'boolean' }
    }
  })
  validateArguments(values)
  const filters = selectionFromArgs(values)
  if (values.all && hasSelection(filters)) throw new Error('Use --all ou filtros de seleção, não ambos.')
  if (values.stdout && values['dry-run'])
    throw new Error('Use --stdout para o conteúdo ou --dry-run para a lista de arquivos.')
  const interactive = values.interactive ?? args.length === 0
  const hasExclusions = Object.keys(values).some(
    key => key.startsWith('exclude') || ['ignore-file', 'no-gitignore'].includes(key)
  )
  return {
    help: values.help ?? false,
    interactive,
    stdout: values.stdout ?? false,
    yes: values.yes ?? false,
    dryRun: values['dry-run'] ?? false,
    inclusion: values.all ? { mode: 'all' } : hasSelection(filters) ? filters : undefined,
    exclusion:
      interactive && !hasExclusions
        ? undefined
        : {
            mode: 'advanced',
            ignoreMode: 'ignore-files',
            ignoreFiles: [...(values['no-gitignore'] ? [] : ['.gitignore']), ...(values['ignore-file'] ?? [])],
            globs: values.exclude ?? [],
            files: values['exclude-file'] ?? [],
            folders: values['exclude-dir'] ?? [],
            extensions: values['exclude-ext'] ?? []
          }
  }
}
