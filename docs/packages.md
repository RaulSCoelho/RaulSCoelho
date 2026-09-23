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

```sh
pnpm changeset                # seleciona pacotes e tipo de mudança: patch, minor ou major
pnpm changeset status
pnpm version-packages         # atualiza versões, changelogs e lockfile
pnpm verify
pnpm pack:packages
npm login
pnpm release                  # valida e executa changeset publish
```

Cada pacote tem sua própria versão: não há grupos de versões fixas ou vinculadas no Changesets.
Registre changesets para os pacotes afetados por cada alteração. Dependências internas são
atualizadas conforme os releases e as regras de `.changeset/config.json`.

Revise e faça commit dos changesets, versões, changelogs e lockfile. A conta npm precisa de
permissão para publicar no escopo `@raulscoelho`. Após a publicação, envie os commits e tags
criados pelo Changesets com `git push --follow-tags`.

## Referências

- [pnpm: workspaces e dependências na publicação](https://pnpm.io/workspaces)
- [Turborepo: publicação de bibliotecas](https://turborepo.dev/docs/guides/publishing-libraries)
- [Changesets: configuração e dependências internas](https://github.com/changesets/changesets/blob/main/docs/config-file-options.md)
