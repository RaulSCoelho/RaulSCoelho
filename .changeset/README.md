# Changesets

Antes de versionar, execute `pnpm changeset` para selecionar os pacotes alterados, o tipo de
atualização (`patch`, `minor` ou `major`) e um resumo. O comando gera um arquivo `.md` nesta
pasta; seu texto será usado nos changelogs. Inclua-o no commit da alteração.

Para publicar, siga esta ordem:

1. Confira os aumentos com `pnpm changeset status`.
2. Execute `pnpm version-packages` para atualizar versões, changelogs e lockfile.
3. Valide com `pnpm verify` e confira os tarballs gerados por `pnpm pack:packages`.
4. Revise as alterações e faça o commit antes da publicação.
5. Execute `pnpm release` para publicar no npm.
6. Envie o commit com `git push` e as tags com `git push --tags`.

`version-packages` remove os changesets consumidos. Não os recrie para o mesmo release.

Consulte o [fluxo completo de publicação](../docs/packages.md#versões-e-publicação)
para os comandos de revisão, commit e autenticação.
