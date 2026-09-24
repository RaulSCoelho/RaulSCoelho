import { parseArgs } from 'node:util'

import { presets } from './presets.mjs'
import { commonOptions, filterOptions, hasSelection, selectionFromArgs, validateArguments } from '../lib/args.mjs'

export const help = `Uso: repoclean [opções]

Sem argumentos, abre o menu de limpeza.

Seleção (opções repetíveis e combináveis):
  --preset <nome>  ${Object.keys(presets).join(', ')}
  --file <nome>    Arquivo por nome ou caminho relativo
  --dir <caminho>  Diretório relativo à raiz, com todo seu conteúdo
  --ext <extensão> Arquivos por extensão
  --glob <padrão>  Arquivos ou diretórios por glob

Execução:
  --dry-run       Mostrar o que seria removido, sem apagar nada
  --yes           Apagar sem pedir confirmação
  --interactive   Abrir o menu para completar a seleção
  --help, -h      Mostrar ajuda
  --version, -v   Mostrar versão

Exemplos:
  repoclean --preset build --preset turbo --dry-run
  repoclean --preset workspace --yes
  repoclean --ext .log --dry-run

A remoção é permanente. --dry-run prevalece sobre --yes.`

/** @param {string[]} args */
export function parseCleanArgs(args) {
  const { values } = parseArgs({
    args,
    options: { ...commonOptions, ...filterOptions, preset: { type: 'string', multiple: true } }
  })
  validateArguments(values)
  const selection = { ...selectionFromArgs(values), presets: values.preset ?? [] }
  for (const preset of selection.presets)
    if (!Object.hasOwn(presets, preset)) throw new Error(`Preset desconhecido: ${preset}`)
  return {
    selection: hasSelection(selection) ? selection : undefined,
    help: values.help ?? false,
    interactive: values.interactive ?? args.length === 0,
    dryRun: values['dry-run'] ?? false,
    yes: values.yes ?? false
  }
}
