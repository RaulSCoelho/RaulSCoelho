#!/usr/bin/env node
import { help, runCopy } from '@raulscoelho/script-utils/copy'
import { runCli } from '@raulscoelho/script-utils/lib/cli'

await runCli({
  name: 'repoclip',
  description: 'Copie arquivos para a área de transferência ou stdout.',
  manifest: new URL('../package.json', import.meta.url),
  allowArgs: true,
  help,
  run: runCopy
})
