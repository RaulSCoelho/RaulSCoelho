/** Opções comuns aos CLIs; parseArgs permanece responsável pelos tipos e argumentos desconhecidos. */
export const commonOptions = /** @type {const} */ ({
  'dry-run': { type: 'boolean' },
  yes: { type: 'boolean' },
  interactive: { type: 'boolean' },
  help: { type: 'boolean', short: 'h' },
  version: { type: 'boolean', short: 'v' }
})

export const filterOptions = /** @type {const} */ ({
  file: { type: 'string', multiple: true },
  dir: { type: 'string', multiple: true },
  ext: { type: 'string', multiple: true },
  glob: { type: 'string', multiple: true }
})

/** @param {Record<string, string | string[] | boolean | undefined>} values */
export function validateArguments(values) {
  if (values.version && Object.keys(values).length !== 1) throw new Error('Use --version sem outras opções.')
  for (const [key, value] of Object.entries(values)) {
    if ((typeof value === 'string' && !value.trim()) || (Array.isArray(value) && value.some(item => !item.trim()))) {
      throw new Error(`Valor vazio: --${key}`)
    }
  }
}

/** @param {{file?: string[], dir?: string[], ext?: string[], glob?: string[]}} values */
export function selectionFromArgs(values) {
  return { files: values.file ?? [], folders: values.dir ?? [], extensions: values.ext ?? [], globs: values.glob ?? [] }
}

/** @param {{files?: string[], folders?: string[], extensions?: string[], globs?: string[], presets?: string[]}} selection */
export function hasSelection(selection) {
  return Object.values(selection).some(value => Array.isArray(value) && value.length > 0)
}
