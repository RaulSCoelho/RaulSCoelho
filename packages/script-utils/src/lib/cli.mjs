import { cancel, isCancel, progress } from '@clack/prompts'
import { readFile } from 'node:fs/promises'

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

/** @param {{ name: string, description: string, manifest: URL, run: () => Promise<void>, allowArgs?: boolean, help?: string }} options */
export async function runCli({ name, description, manifest, run, allowArgs = false, help }) {
  const args = process.argv.slice(2)
  try {
    if (args.length === 1 && ['--help', '-h'].includes(args[0] ?? '')) {
      console.log(help ?? `Uso: ${name}\n\n${description}\nOpções: --help, --version`)
    } else if (args.length === 1 && ['--version', '-v'].includes(args[0] ?? '')) {
      const { version } = JSON.parse(await readFile(manifest, 'utf8'))
      console.log(version)
    } else if (args.length && !allowArgs) {
      throw new Error(`Argumentos desconhecidos: ${args.join(' ')}`)
    } else {
      await run()
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}

/** @param {number} total @param {string} label */
export function createProgress(total, label) {
  const bar = progress({ max: total })
  bar.start(`${label} · 0%`)
  let displayed = 0
  return {
    /** @param {number} current */
    update(current) {
      const percent = total ? Math.floor((current * 100) / total) : 100
      if (percent > Math.floor((displayed * 100) / total) || current === total) {
        bar.advance(current - displayed, `${label} · ${percent}% (${current}/${total})`)
        displayed = current
      }
    },
    /** @param {string} message */
    stop(message) {
      bar.stop(message)
    }
  }
}
