import { cancel, isCancel } from '@clack/prompts'

/**
 * @template T
 * @param {Promise<T | typeof import('@clack/prompts').CANCEL_SYMBOL>} question
 * @returns {Promise<T>}
 */
export async function ask(question) {
  const answer = await question

  if (isCancel(answer)) {
    cancel('Operação cancelada.')
    process.exit(0)
  }

  return answer
}

/** @param {unknown} value */
export function splitList(value, separator = /[,;\n]/) {
  return [
    ...new Set(
      String(value ?? '')
        .split(separator)
        .map(item => item.trim())
        .filter(Boolean)
    )
  ]
}

/** @param {number} bytes */
export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KiB`
  return `${(bytes / 1024 ** 2).toFixed(1)} MiB`
}
