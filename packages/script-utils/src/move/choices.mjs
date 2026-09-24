import * as p from '@clack/prompts'
import path from 'node:path'

import { normalizeMove } from './config.mjs'
import { ask, splitList } from '../lib/cli.mjs'
import { safePath } from '../lib/filesystem.mjs'
import { advancedFilters, inputList } from '../lib/filters.mjs'

/** @param {string} root @param {string} message @param {boolean} directory @param {boolean} allowRoot */
async function choosePath(root, message, directory, allowRoot = false) {
  const value = await ask(
    p.path({
      root,
      directory,
      message,
      validate: async value => {
        if (!value) return 'Informe um caminho.'
        try {
          await safePath(
            root,
            path.isAbsolute(value) ? path.relative(root, value).split(path.sep).join('/') || '.' : value,
            false,
            allowRoot
          )
        } catch (error) {
          return error instanceof Error ? error.message : String(error)
        }
      }
    })
  )
  return path.isAbsolute(value) ? path.relative(root, value).split(path.sep).join('/') || '.' : value
}

/** @param {ReturnType<typeof normalizeMove>} initial @param {string} root */
export async function chooseMove(initial, root) {
  const config = { ...initial }
  if (!config.from.length && !config.globs.length && !config.extensions.length) {
    p.log.step('Etapa 1/5 · Origens')
    const mode = await ask(
      p.select({
        message: 'O que deseja mover?',
        options: [
          { value: 'files', label: 'Arquivos específicos' },
          { value: 'folders', label: 'Diretórios específicos' },
          { value: 'extensions', label: 'Extensões' },
          { value: 'globs', label: 'Globs' },
          { value: 'advanced', label: 'Avançado' }
        ]
      })
    )
    if (mode === 'files' || mode === 'folders') {
      config.from = []
      do {
        config.from.push(await choosePath(root, 'Selecione uma origem', mode === 'folders'))
      } while (await ask(p.confirm({ message: 'Adicionar outra origem?', initialValue: false })))
    } else if (mode === 'advanced') {
      const filters = await advancedFilters()
      config.from = [...filters.files, ...filters.folders]
      config.globs = filters.globs
      config.extensions = filters.extensions
    } else if (mode === 'extensions') config.extensions = await inputList('extensions', true)
    else config.globs = await inputList('globs', true)
  }
  if (!config.to) {
    p.log.step('Etapa 2/5 · Destino')
    const destinationMode = await ask(
      p.select({
        message: 'Destino',
        options: [
          { value: 'existing', label: 'Selecionar diretório existente' },
          { value: 'new', label: 'Criar novo diretório' }
        ]
      })
    )
    config.to =
      destinationMode === 'existing'
        ? await choosePath(root, 'Selecione o diretório de destino', true, true)
        : await ask(
            p.text({
              message: 'Caminho do novo diretório, relativo à raiz',
              validate: async value => {
                try {
                  await safePath(root, value ?? '')
                } catch (error) {
                  return error instanceof Error ? error.message : String(error)
                }
              }
            })
          )
  }
  if (config.interactive) {
    p.log.step('Etapa 3/5 · Comportamento')
    config.copy = await ask(
      p.select({
        message: 'O que deseja fazer com os originais?',
        initialValue: config.copy,
        options: [
          { value: false, label: 'Mover para o destino', hint: 'Remove os itens do local original' },
          { value: true, label: 'Copiar e manter os originais', hint: 'Cria uma cópia no destino' }
        ]
      })
    )
    const structure = await ask(
      p.select({
        message: 'Organização no destino',
        options: [
          {
            value: 'default',
            label: 'Padrão da seleção',
            hint: 'Lotes preservam os caminhos; origens explícitas mantêm o nome'
          },
          { value: 'tree', label: 'Preservar caminhos relativos à raiz' },
          { value: 'flat', label: 'Reunir arquivos no destino' }
        ]
      })
    )
    config.preserveTree = structure === 'tree'
    config.flatten = structure === 'flat'
    p.log.info(
      'Se selecionou somente um arquivo ou uma pasta, você pode mudar seu nome no destino. Deixe vazio para manter o nome atual.'
    )
    config.rename = await ask(
      p.text({
        message: 'Qual será o nome no destino? (opcional)',
        placeholder: 'Exemplo: ferias.jpg',
        initialValue: config.rename
      })
    )
    if (!config.copy) {
      p.log.info(
        'Entre os arquivos e pastas que você selecionou para mover, quais devem continuar onde estão? Deixe vazio para mover todos.'
      )
      config.exclude = splitList(
        await ask(
          p.text({
            message: 'Quais itens você não quer mover? (opcional; separe com ponto e vírgula)',
            placeholder: 'Exemplo: fotos/pessoal.jpg; fotos/hotel.jpg',
            initialValue: config.exclude.join('; ')
          })
        ),
        /[;\n]/
      )
      p.log.info(
        'Você já tem um arquivo, como .moveignore, que lista quais itens devem continuar onde estão? Informe esse arquivo ou deixe vazio.'
      )
      config.ignoreFiles = splitList(
        await ask(
          p.text({
            message: 'Qual arquivo contém essa lista? (opcional; separe vários com vírgula)',
            placeholder: 'Exemplo: .moveignore, outra.ignore',
            initialValue: config.ignoreFiles.join(', ')
          })
        )
      )
    }
    config.gitignore = await ask(
      p.confirm({ message: 'Respeitar .gitignore nas seleções em lote?', initialValue: config.gitignore })
    )
    config.onConflict = await ask(
      p.select({
        message: 'Como tratar conflitos?',
        initialValue: config.onConflict,
        options: [
          { value: 'error', label: 'Interromper' },
          { value: 'skip', label: 'Ignorar itens em conflito' },
          { value: 'rename', label: 'Gerar nomes alternativos' },
          { value: 'overwrite', label: 'Substituir com backup recuperável' }
        ]
      })
    )
  }
  return normalizeMove(config)
}
