#!/usr/bin/env node
import { clean } from '@raulscoelho/script-utils/clean'
import { runCli } from '@raulscoelho/script-utils/lib/cli'

await runCli({
  name: 'repoclean',
  description: 'Selecione, revise e confirme a limpeza do diretório atual em um terminal interativo.',
  manifest: new URL('../package.json', import.meta.url),
  run: clean
})
