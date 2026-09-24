const build = ['dist', 'build', 'out', '.next']
const generated = [...build, '.turbo', 'coverage']

export const presets = {
  build: { label: 'Build', folders: build, files: [] },
  turbo: { label: 'Turbo', folders: ['.turbo'], files: [] },
  'node-modules': { label: 'Node Modules', folders: ['node_modules'], files: [] },
  lockfiles: {
    label: 'Lockfiles',
    folders: [],
    files: ['pnpm-lock.yaml', 'package-lock.json', 'npm-shrinkwrap.json', 'yarn.lock', 'bun.lock', 'bun.lockb']
  },
  generated: { label: 'Generated', folders: generated, files: ['*.tsbuildinfo'] },
  workspace: { label: 'Workspace', folders: [...generated, 'node_modules'], files: ['*.tsbuildinfo'] }
}
