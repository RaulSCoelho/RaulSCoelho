# Desenvolvimento de pacotes

Este monorepo usa pnpm, Turborepo e Changesets para desenvolver e publicar pacotes independentes
no npm sob o escopo `@raulscoelho`. As versões de Node.js e pnpm utilizadas pelo projeto estão
nos campos `engines` e `packageManager` do `package.json` da raiz.

## Organização

Cada pacote fica em `packages/<nome>/`, com seu próprio `package.json` e `README.md`.
Consulte o README do pacote para instalação, API, comandos, requisitos e validações específicas.
Esta documentação descreve apenas as convenções e o fluxo compartilhado do monorepo.

A raiz é privada e concentra as ferramentas de desenvolvimento e publicação. Os workspaces
são definidos em `pnpm-workspace.yaml`. Projetos de exemplo, fixtures e templates aninhados
não devem participar do workspace de publicação.

Para listar os pacotes atuais:

```sh
pnpm -r list --depth -1
```

## Desenvolvimento e validação

```sh
pnpm install --frozen-lockfile
pnpm verify                   # executa lint e typecheck disponíveis nos pacotes
pnpm lint
pnpm lint:fix
pnpm typecheck                # executa nos pacotes que declaram essa tarefa
pnpm pack:packages             # gera tarballs em artifacts/
```

As tarefas de cada pacote são declaradas em seu `package.json` e orquestradas pelo Turborepo.
Para executar uma tarefa em um pacote específico, use `pnpm --filter <nome-do-pacote> <tarefa>`.
A configuração de ESLint também concentra as regras de formatação.

Padronize os scripts aplicáveis como `lint` (verificação), `lint:fix` (ESLint com `--fix`) e
`typecheck` (checagem de tipos sem emissão). Não crie comandos vazios em pacotes sem código
analisável. Os pacotes com código `.mjs` usam TypeScript com `allowJs`, `checkJs` e modo estrito,
com contratos JSDoc quando necessário. Pacotes que contêm apenas presets JSON não declaram
`typecheck`. Execute `pnpm typecheck` para verificar todos os pacotes que oferecem essa tarefa.

## Adicionar um pacote

1. Crie `packages/<nome>/package.json` com nome no escopo `@raulscoelho`, versão inicial e descrição.
2. Defina os pontos de entrada com `exports` e, quando houver CLI, `bin`. Use `files` para limitar
   o conteúdo publicado e `publishConfig.access: "public"` para publicação pública.
3. Declare dependências de execução no próprio pacote. Para dependências internas publicáveis,
   use `workspace:^`; o pnpm converte esse protocolo em ranges semver ao empacotar e publicar.
4. Adicione os scripts de desenvolvimento adequados ao pacote. Se houver compilação, configure as dependências
   de tarefas e os artefatos de saída no Turborepo.
5. Documente instalação, uso e particularidades no `README.md` do pacote.
6. Execute `pnpm install` para atualizar o lockfile.
7. Registre as alterações com Changesets e valide o conteúdo do tarball antes de publicar.

O diretório é descoberto pelo padrão de workspaces; não é necessário manter um catálogo nesta documentação.

## Versões e publicação

Cada pacote tem sua própria versão. O fluxo tem três etapas: registrar as mudanças,
aplicar as versões e publicar no npm.

### 1. Registrar as mudanças

Depois de implementar uma alteração, execute:

```sh
pnpm changeset
pnpm changeset status
```

O primeiro comando pergunta quais pacotes mudaram, o tipo de atualização (`patch` para
correções, `minor` para funcionalidades ou `major` para mudanças incompatíveis) e um resumo.
Ele cria `.changeset/<nome>.md`; esse resumo será usado nos changelogs. Inclua o arquivo
no commit da alteração se a publicação ficar para depois.

O comando `status` mostra os aumentos previstos, incluindo os propagados por dependências
internas. Não é necessário criar outro changeset se a alteração já estiver registrada.

### 2. Aplicar as versões e validar

Quando estiver pronto para publicar os changesets pendentes:

```sh
pnpm version-packages
pnpm verify
pnpm pack:packages
```

`version-packages` consome os arquivos de changeset, atualiza versões e dependências internas,
gera os changelogs e atualiza o lockfile. Os arquivos consumidos são removidos; não os recrie
para o mesmo release.

`verify` executa lint e typecheck. `pack:packages` gera os tarballs em `artifacts/` para conferir
os arquivos e manifests que serão publicados, sem enviar nada ao npm.

Revise as alterações, incluindo versões, changelogs e lockfile, e faça o commit **antes de
publicar**. Assim, as tags do release apontarão para o commit que contém o código publicado.

```sh
git status
git diff
# Selecione os arquivos revisados para o commit.
git add <arquivos-do-release>
git diff --cached
git commit -m "chore(release): version packages"
```

### 3. Publicar e enviar ao Git

A conta npm precisa de permissão para publicar no escopo `@raulscoelho`. Autentique-se
com `npm login` caso ainda não esteja conectado. Depois:

```sh
pnpm release
git push
git push --tags
```

`release` executa `verify` novamente e publica as versões ainda ausentes no npm. O Changesets
cria as tags locais dos pacotes publicados; os comandos Git enviam o commit e as tags ao remoto.
Execute os pushes depois de conferir que a publicação terminou com sucesso.

## Referências

- [pnpm: workspaces e dependências na publicação](https://pnpm.io/workspaces)
- [Turborepo: publicação de bibliotecas](https://turborepo.dev/docs/guides/publishing-libraries)
- [Changesets: configuração e dependências internas](https://github.com/changesets/changesets/blob/main/docs/config-file-options.md)
