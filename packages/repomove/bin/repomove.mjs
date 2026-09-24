#!/usr/bin/env node
import { runCli } from '@raulscoelho/script-utils/lib/cli'
import { help, runMove } from '@raulscoelho/script-utils/move'

await runCli({
  name: 'repomove',
  description: 'Mova arquivos com prévia, histórico e reversão.',
  manifest: new URL('../package.json', import.meta.url),
  allowArgs: true,
  help,
  run: runMove
})
