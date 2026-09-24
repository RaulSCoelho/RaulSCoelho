#!/usr/bin/env node
import { copy } from '@raulscoelho/script-utils/copy'
import { runCli } from '@raulscoelho/script-utils/lib/cli'

await runCli({
  name: 'repoclip',
  description: 'Copie arquivos do diretório atual em um terminal interativo.',
  manifest: new URL('../package.json', import.meta.url),
  run: copy
})
