import { hasControlCharacters } from '../lib/paths.mjs'
import { extensionPattern, globPattern } from '../lib/patterns.mjs'

/**
 * @typedef {object} MoveOptions
 * @property {string[]} [from]
 * @property {string} [to]
 * @property {string[]} [globs]
 * @property {string[]} [extensions]
 * @property {string[]} [exclude]
 * @property {string[]} [ignoreFiles]
 * @property {boolean} [gitignore]
 * @property {string} [rename]
 * @property {boolean} [preserveTree]
 * @property {boolean} [flatten]
 * @property {'error'|'skip'|'rename'|'overwrite'} [onConflict]
 * @property {boolean} [copy]
 * @property {boolean} [dryRun]
 * @property {boolean} [yes]
 * @property {boolean} [interactive]
 */

/** @param {MoveOptions} input */
export function normalizeMove(input = {}) {
  if (input.flatten && input.preserveTree) throw new Error('--flatten e --preserve-tree são incompatíveis.')
  if (
    input.rename &&
    (!/^[^/\\]+$/.test(input.rename) || hasControlCharacters(input.rename) || ['.', '..'].includes(input.rename))
  ) {
    throw new Error('--rename deve ser um nome simples, sem diretórios.')
  }
  const onConflict = input.onConflict ?? 'error'
  if (!['error', 'skip', 'rename', 'overwrite'].includes(onConflict))
    throw new Error('Estratégia de conflito inválida.')
  /** @param {string[] | undefined} values */
  const list = values => [...new Set(values ?? [])]
  const config = {
    from: list(input.from),
    to: input.to ?? '',
    globs: list(input.globs).map(globPattern),
    extensions: list(input.extensions),
    exclude: list(input.exclude).map(globPattern),
    ignoreFiles: list(input.ignoreFiles),
    gitignore: input.gitignore ?? true,
    rename: input.rename ?? '',
    preserveTree: input.preserveTree ?? false,
    flatten: input.flatten ?? false,
    onConflict,
    copy: input.copy ?? false,
    dryRun: input.dryRun ?? false,
    yes: input.yes ?? false,
    interactive: input.interactive ?? false
  }
  config.extensions.forEach(extensionPattern)
  return config
}
