# @raulscoelho/repoclean

CLI interativo para limpar arquivos e diretórios do projeto, com prévia e confirmação antes de excluir.

Requer Node.js 24+ e terminal interativo.

## Instalação e uso

```sh
pnpm add -D @raulscoelho/repoclean
pnpm exec repoclean
```

Execute no diretório que deseja limpar. Marque as opções com Espaço, pressione Enter e confira os caminhos apresentados. A confirmação começa em **Não**. Após confirmar, uma barra acompanha a quantidade de itens removidos.

Para usar `pnpm clean`, adicione ao `package.json`:

```json
{
  "scripts": {
    "clean": "repoclean"
  }
}
```

## Opções

| Opção | Alvos |
| --- | --- |
| Build | Pastas `dist`, `build`, `out` e `.next` |
| Turbo | Pastas `.turbo` |
| Node Modules | Pastas `node_modules` |
| Lockfiles | `pnpm-lock.yaml`, `package-lock.json`, `npm-shrinkwrap.json`, `yarn.lock`, `bun.lock` e `bun.lockb` |
| Generated | Build, Turbo, `coverage` e arquivos `*.tsbuildinfo` |
| Workspace | Generated e Node Modules |
| Arquivos | Nomes ou caminhos relativos, como `debug.log` ou `apps/web/debug.log` |
| Diretórios | Caminhos relativos, como `apps/web/cache` |
| Extensões | Extensões como `.log` e `.tmp` |
| Avançado | Combinação de arquivos, diretórios, extensões e globs |

As opções podem ser combinadas na mesma execução. Os presets procuram alvos também nas subpastas, sem percorrer dependências instaladas. Workspace mantém os lockfiles do projeto, salvo se Lockfiles também for selecionado ou se estiverem dentro de uma pasta que será removida.

Arquivos, diretórios e extensões são separados por vírgula. Globs são separados por ponto e vírgula, como `apps/**/cache; **/*.tmp`. Os filtros são combinados por união, e alvos sobrepostos são removidos uma única vez.

## Prévia e remoção

A prévia mostra a raiz, todos os caminhos selecionados, a quantidade de itens e o tamanho dos arquivos. Uma pasta selecionada inclui todo o seu conteúdo. A busca inclui arquivos ocultos e ignorados pelo Git.

A raiz do projeto e os metadados `.git` são protegidos. Pastas que contenham metadados Git também bloqueiam a operação. Links simbólicos não são seguidos; links dentro de pastas selecionadas são removidos sem apagar seus destinos.

Encerre builds, servidores e instalações antes de limpar. Os alvos são conferidos novamente antes da remoção; alterações detectadas interrompem a operação. A limpeza é permanente e não é uma transação: em caso de erro durante a execução, itens já removidos não são restaurados. Mudanças concorrentes no sistema de arquivos não podem ser eliminadas apenas por essas verificações.

## Ajuda

```sh
pnpm exec repoclean --help
pnpm exec repoclean --version
```
