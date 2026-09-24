import path from 'node:path'

/** @param {string} value */
export function withinRoot(value, root = process.cwd()) {
  const input = value.trim().replaceAll('\\', '/')

  if (!input || path.isAbsolute(input) || /^[A-Za-z]:/.test(input)) {
    throw new Error('Informe um caminho relativo à raiz do projeto.')
  }

  const absolute = path.resolve(root, input)
  const relative = path.relative(root, absolute)

  if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`)) {
    throw new Error('O caminho precisa estar dentro do projeto.')
  }

  return { absolute, relative: relative.split(path.sep).join('/') }
}

// Regra compartilhada: pastas node_modules nunca entram nas tarefas de cópia.
/** @param {string} file */
export function isNodeModulesPath(file) {
  return file
    .replaceAll('\\', '/')
    .split('/')
    .some(part => part.toLowerCase() === 'node_modules')
}

/** @param {string} file */
export function isGitMetadataPath(file) {
  return file
    .replaceAll('\\', '/')
    .split('/')
    .some(part => part.toLowerCase() === '.git')
}

/** @param {string} value */
export function hasControlCharacters(value) {
  return [...value].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)
}
