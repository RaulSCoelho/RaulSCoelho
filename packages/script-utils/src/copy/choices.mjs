import * as p from '@clack/prompts'
import { globby } from 'globby'

import { ask } from '../lib/cli.mjs'
import { advancedFilters, inputList } from '../lib/filters.mjs'
import { isGitMetadataPath, isNodeModulesPath } from '../lib/paths.mjs'

export async function chooseInclusion() {
  p.log.step('Etapa 1/2 · Inclusão')

  /** @type {'all' | 'files' | 'folders' | 'extensions' | 'advanced'} */
  const mode = await ask(
    p.select({
      message: 'O que deseja copiar?',
      initialValue: 'all',
      options: [
        { value: 'all', label: 'Projeto completo', hint: 'Padrão: todos os arquivos permitidos' },
        { value: 'files', label: 'Arquivos específicos', hint: 'package.json, index.tsx...' },
        { value: 'folders', label: 'Diretórios específicos', hint: 'apps/web, packages/ui...' },
        { value: 'extensions', label: 'Por extensão', hint: '.ts, .tsx, .json...' },
        { value: 'advanced', label: 'Avançado', hint: 'Combine arquivos, diretórios, extensões e globs' }
      ]
    })
  )

  if (mode === 'all') return { mode }
  if (mode === 'advanced') return { mode, ...(await advancedFilters()) }

  return { mode, [mode]: await inputList(mode, true) }
}

// Descobre arquivos de ignore mesmo quando eles próprios estão ignorados pelo Git.
// Somente node_modules e metadados do Git ficam fora da descoberta.
export async function discoverIgnoreFiles(root = process.cwd()) {
  const found = await globby(['**/.*ignore', '**/*.ignore'], {
    cwd: root,
    dot: true,
    onlyFiles: true,
    followSymbolicLinks: false,
    expandDirectories: false,
    gitignore: false,
    ignore: ['**/node_modules/**', '**/.git/**']
  })

  return [...new Set(found)]
    .filter(file => !isNodeModulesPath(file) && !isGitMetadataPath(file))
    .sort((a, b) => {
      if (a === '.gitignore') return -1
      if (b === '.gitignore') return 1
      return a.localeCompare(b)
    })
}

/** @param {string} root */
async function selectIgnoreFiles(root) {
  const files = await discoverIgnoreFiles(root)

  if (!files.length) {
    p.log.warn('Nenhum arquivo de ignore encontrado no projeto.')
    return null
  }

  return ask(
    p.multiselect({
      message: 'Selecione os arquivos de ignore (Espaço para marcar)',
      options: files.map(file => ({
        value: file,
        label: file,
        ...(file === '.gitignore' ? { hint: 'Inclui os .gitignore internos' } : {})
      })),
      initialValues: files.includes('.gitignore') ? ['.gitignore'] : [],
      required: true,
      maxItems: 12
    })
  )
}

export async function chooseExclusion(root = process.cwd()) {
  p.log.step('Etapa 2/2 · Exclusão')

  while (true) {
    /** @type {'gitignore' | 'ignore-files' | 'files' | 'folders' | 'extensions' | 'advanced' | 'none'} */
    const mode = await ask(
      p.select({
        message: 'O que deseja excluir?',
        initialValue: 'gitignore',
        options: [
          { value: 'gitignore', label: '.gitignore', hint: 'Padrão: respeita também os .gitignore das subpastas' },
          {
            value: 'ignore-files',
            label: 'Selecionar arquivos de ignore',
            hint: 'Escolha um ou vários arquivos encontrados'
          },
          { value: 'files', label: 'Arquivos específicos', hint: 'package.json, index.tsx...' },
          { value: 'folders', label: 'Diretórios específicos', hint: 'docs, apps/web...' },
          { value: 'extensions', label: 'Por extensão', hint: '.log, .md, .json...' },
          { value: 'advanced', label: 'Avançado', hint: 'Combine arquivos de ignore e filtros manuais' },
          { value: 'none', label: 'Nenhuma exclusão', hint: 'Exceto node_modules, que nunca é copiado' }
        ]
      })
    )

    if (mode === 'gitignore') return { mode }

    if (mode === 'none') {
      p.log.warn('Arquivos como .env e .git poderão entrar na cópia; node_modules permanece bloqueado.')
      const confirmed = await ask(
        p.confirm({
          message: 'Deseja continuar sem outras exclusões?',
          initialValue: false
        })
      )
      if (confirmed) return { mode }
      continue
    }

    if (mode === 'ignore-files') {
      const ignoreFiles = await selectIgnoreFiles(root)
      if (ignoreFiles) return { mode, ignoreFiles }
      continue
    }

    if (mode === 'advanced') {
      const ignoreMode = await ask(
        p.select({
          message: 'Quais arquivos de ignore deseja aplicar?',
          initialValue: 'gitignore',
          options: [
            { value: 'gitignore', label: '.gitignore automático', hint: 'Inclui as regras de subpastas' },
            { value: 'ignore-files', label: 'Selecionar arquivos de ignore', hint: 'Um ou vários' },
            { value: 'none', label: 'Nenhum arquivo de ignore' }
          ]
        })
      )

      /** @type {string[]} */
      let ignoreFiles = []
      if (ignoreMode === 'ignore-files') {
        const selected = await selectIgnoreFiles(root)
        if (!selected) continue
        ignoreFiles = selected
      }

      p.log.info('Os filtros manuais abaixo serão combinados com as regras escolhidas.')
      const filters = await advancedFilters(ignoreMode === 'none')

      return { mode, ignoreMode, ignoreFiles, ...filters }
    }

    return { mode, [mode]: await inputList(mode, true) }
  }
}
