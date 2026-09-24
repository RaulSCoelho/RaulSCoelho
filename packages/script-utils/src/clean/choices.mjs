import * as p from '@clack/prompts'

import { presets } from './presets.mjs'
import { ask } from '../lib/cli.mjs'
import { advancedFilters, inputList } from '../lib/filters.mjs'

export async function chooseClean() {
  const selected = await ask(
    p.multiselect({
      message: 'O que deseja limpar? (Espaço para marcar)',
      options: [
        ...Object.entries(presets).map(([value, preset]) => ({
          value,
          label: preset.label,
          hint: [...preset.folders, ...preset.files].join(', ')
        })),
        { value: 'files', label: 'Arquivos', hint: 'Nomes ou caminhos específicos' },
        { value: 'folders', label: 'Diretórios', hint: 'Caminhos relativos ao projeto' },
        { value: 'extensions', label: 'Extensões', hint: '.log, .tmp...' },
        { value: 'advanced', label: 'Avançado', hint: 'Arquivos, diretórios, extensões e globs' }
      ],
      required: true
    })
  )

  /** @type {import('./plan.mjs').CleanSelection} */
  const selection = { presets: selected.filter(value => Object.hasOwn(presets, value)) }
  if (selected.includes('advanced')) Object.assign(selection, await advancedFilters(selected.length === 1))
  for (const field of /** @type {const} */ (['files', 'folders', 'extensions'])) {
    if (selected.includes(field)) selection[field] = [...(selection[field] ?? []), ...(await inputList(field, true))]
  }
  return selection
}
