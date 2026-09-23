#!/usr/bin/env node
import { copy } from '@raulscoelho/script-utils/copy'
import { readFile } from 'node:fs/promises'

const args = process.argv.slice(2)

try {
  if (args.length === 1 && ['--help', '-h'].includes(args[0] ?? '')) {
    console.log(
      'Uso: repoclip\n\nCopie arquivos do diretório atual em um terminal interativo.\nOpções: --help, --version'
    )
  } else if (args.length === 1 && ['--version', '-v'].includes(args[0] ?? '')) {
    const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
    console.log(version)
  } else if (args.length) {
    throw new Error(`Argumentos desconhecidos: ${args.join(' ')}`)
  } else {
    await copy()
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
