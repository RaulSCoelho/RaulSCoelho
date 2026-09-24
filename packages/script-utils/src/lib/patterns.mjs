import { convertPathToPattern } from 'globby'

import { withinRoot } from './paths.mjs'

/**
 * @param {string} value
 * @param {string} root
 */
export function filePattern(value, root) {
  const { relative } = withinRoot(value, root)
  const literal = convertPathToPattern(relative)
  return relative.includes('/') ? literal : `**/${literal}`
}

/**
 * @param {string} value
 * @param {string} root
 */
export function folderPattern(value, root) {
  const { relative } = withinRoot(value.replace(/[/\\]+$/, ''), root)
  return `${convertPathToPattern(relative)}/**/*`
}

/** @param {string} value */
export function extensionPattern(value) {
  const extension = value.trim().startsWith('.') ? value.trim() : `.${value.trim()}`
  if (!/^\.[\w.+-]+$/.test(extension)) throw new Error(`Extensão inválida: ${value}`)
  return `**/*${convertPathToPattern(extension)}`
}

/** @param {string} value */
export function globPattern(value) {
  const glob = value.trim().replaceAll('\\', '/')
  if (
    !glob ||
    glob.startsWith('!') ||
    glob.startsWith('/') ||
    /^[A-Za-z]:/.test(glob) ||
    /(^|\/)\.\.(\/|$)/.test(glob)
  ) {
    throw new Error(`Glob inválido ou fora do projeto: ${value}`)
  }
  return glob
}
