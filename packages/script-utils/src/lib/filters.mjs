import * as p from '@clack/prompts'

import { ask, splitList } from './cli.mjs'

// Reutilizado nas etapas de inclusão e exclusão.
const FIELDS = {
  files: {
    message: 'Arquivos (nomes ou caminhos, separados por vírgula)',
    placeholder: 'package.json, index.tsx'
  },
  folders: {
    message: 'Diretórios relativos à raiz (separados por vírgula)',
    placeholder: 'apps/web, packages/ui'
  },
  extensions: {
    message: 'Extensões (separadas por vírgula)',
    placeholder: '.ts, .tsx, .json'
  },
  globs: {
    message: 'Globs (separados por ponto e vírgula)',
    placeholder: '**/*.test.ts; apps/**/index.tsx',
    separator: /[;\n]/
  }
}

/** @param {keyof typeof FIELDS} field */
export async function inputList(field, required = false) {
  /** @type {{ message: string, placeholder: string, separator?: RegExp }} */
  const config = FIELDS[field]
  const answer = await ask(
    p.text({
      message: config.message,
      placeholder: config.placeholder,
      validate: value => (required && !String(value ?? '').trim() ? 'Informe pelo menos um item.' : undefined)
    })
  )

  return splitList(answer, config.separator)
}

export async function advancedFilters(required = true) {
  while (true) {
    const filters = {
      files: await inputList('files'),
      folders: await inputList('folders'),
      extensions: await inputList('extensions'),
      globs: await inputList('globs')
    }

    if (!required || Object.values(filters).some(values => values.length)) {
      return filters
    }

    p.log.warn('Preencha pelo menos um filtro ou escolha outra opção.')
  }
}
