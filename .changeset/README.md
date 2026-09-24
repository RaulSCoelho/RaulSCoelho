# Versões e publicação

Depois de alterar um pacote, execute:

```sh
pnpm changeset
```

Escolha os pacotes, o tipo de atualização e escreva um resumo para o changelog:
`patch` para correções, `minor` para funcionalidades e `major` para mudanças incompatíveis.
O comando cria um `.md` nesta pasta. Inclua-o no commit da alteração.

Quando for publicar:

```sh
pnpm changeset status   # conferir as versões previstas
pnpm version-packages  # aplicar versões, changelogs e lockfile
pnpm verify            # validar lint e tipos
pnpm pack:packages     # conferir os pacotes em artifacts/
```

Revise os arquivos e faça o commit **antes de publicar**, para que as tags apontem para
o código publicado. Com a conta npm autenticada e autorizada no escopo:

```sh
pnpm release
git push
git push --tags
```

`version-packages` remove os changesets consumidos; não os recrie para o mesmo release.
`release` valida novamente e publica no npm. Envie o commit e as tags após conferir o sucesso.

Consulte o [fluxo completo](../docs/packages.md#versões-e-publicação) para revisão,
commit e autenticação com `npm login`.
