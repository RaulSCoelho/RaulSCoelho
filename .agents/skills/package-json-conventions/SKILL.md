---
name: package-json-conventions
description: Padronize package.json ao criar, editar ou reorganizar manifests npm, seguindo a ordem de campos definida pelo usuário e preservando a semântica de resolução de módulos. Use em aplicações, bibliotecas e monorepos.
---

# Convenção de package.json

Aplique esta convenção aos manifests próprios do projeto. Ao editar um pacote, use a convenção naquele manifest; percorra todos apenas quando a solicitação abranger o projeto inteiro. Exclua dependências instaladas, caches, artefatos e código de terceiros. Inclua templates mantidos pelo projeto quando estiverem no escopo.

## Ordem dos campos

Use exatamente esta sequência para as propriedades de primeiro nível presentes:

```text
name
version
private
description
keywords
license
author
contributors
homepage
repository
bugs
funding
type
exports
imports
main
module
types
typesVersions
browser
bin
man
directories
sideEffects
files
publishConfig
packageManager
engines
devEngines
os
cpu
libc
workspaces
scripts
config
dependencies
peerDependencies
peerDependenciesMeta
optionalDependencies
bundledDependencies
devDependencies
overrides
resolutions
pnpm
eslintConfig
prettier
browserslist
```

Não crie propriedades vazias, separadores ou campos de agrupamento. Preserve campos desconhecidos ao final, em sua ordem relativa original; não os exclua nem invente significado para encaixá-los em um grupo.

## Regras de ordenação

- Ordene alfabeticamente os nomes de pacotes em `dependencies`, `peerDependencies`, `peerDependenciesMeta`, `optionalDependencies` e `devDependencies`. Se `bundledDependencies` for uma lista de nomes, ordene-a alfabeticamente sem adicionar ou remover itens; preserve outras formas válidas.
- Não aplique ordenação alfabética recursiva ao JSON. Preserve scripts, arrays e demais objetos, salvo a regra explícita para dependências.
- Preserve a ordem lógica de condições em `exports` e `imports`, inclusive em objetos aninhados e alternativas em arrays. Mantenha `default` por último em cada objeto de condições, sem reorganizar as demais condições. Não confunda chaves de subpaths (`.` ou `./...`) e imports (`#...`) com condições.
- Se mover `default` for necessário, registre essa mudança como ajuste de precedência de resolução; não a apresente como mera formatação. Não altere destinos ou acrescente condições.
- Preserve valores, versões, ranges, protocolos de dependências, visibilidade e entradas existentes. Use indentação de dois espaços e newline final, salvo convenção explícita do projeto.

## Estrutura e escopo

Ao criar bibliotecas modernas, priorize `exports`. Preserve `main` quando necessário para compatibilidade. `module` é uma convenção de ferramentas de build, não um substituto oficial para a resolução do Node.js. Uma solicitação de ordenação não autoriza migrar ou remover pontos de entrada existentes.

Em monorepos, mantenha `packageManager`, `workspaces` e configurações globais de resolução na raiz apropriada ao gerenciador. Não mova configurações automaticamente entre manifests quando isso puder mudar o comportamento; identifique a finalidade antes de corrigir sua localização. Projetos independentes dentro de templates têm sua própria raiz.

Mantenha `eslintConfig`, `prettier` e `browserslist` ao final conforme a sequência. Não extraia configurações para arquivos separados nem acrescente ferramentas por causa desta convenção.

## Scripts de qualidade

Use `lint` para verificar o código, `lint:fix` para aplicar correções de lint e formatação (com ESLint, `eslint . --fix`) e `typecheck` para checar tipos sem emitir arquivos. Use `lint:fix` para `eslint . --fix`, pois ele corrige regras de código e formatação. Atualize referências em documentação e tarefas do monorepo ao renomear.

Declare somente os scripts aplicáveis: não adicione `typecheck` sem código e configuração de checagem de tipos, nem lint fictício a pacotes que contêm apenas configurações JSON. Código JavaScript com `checkJs` pode ter `typecheck`; a extensão do arquivo sozinha não determina a necessidade. Ao configurar typecheck, forneça um comando funcional, sem mascarar erros. Na raiz do monorepo, delegue as tarefas ao orquestrador usado pelo projeto.

## Codificação e texto legível

Grave os manifests em UTF-8, mantendo acentos e outros caracteres Unicode imprimíveis diretamente no texto. Não converta `Utilitários` em `Utilit\u00e1rios`, mesmo que o arquivo original use escapes. Corrija escapes Unicode desnecessários nos manifests editados, preservando o valor interpretado pelo JSON.

Ao serializar com Python, use `json.dumps(data, ensure_ascii=False, indent=2)` e leitura/escrita com `encoding="utf-8"`. Com JavaScript, use `JSON.stringify(data, null, 2)` e escrita UTF-8. Não escolha a codificação de saída com base na presença de escapes no arquivo original.

Preserve escapes necessários à sintaxe JSON, caracteres de controle e sequências que representem texto literal intencional. Nunca faça substituição global de escapes sem interpretar o JSON. Na verificação final, confira tanto a igualdade dos valores quanto a ausência de escapes Unicode desnecessários para caracteres imprimíveis.

## Verificação

Antes de escrever, guarde o conteúdo dos manifests. Após a transformação, verifique JSON válido, sequência de campos e ordenação das dependências. Compare os valores antes e depois e confira separadamente a ordem de `exports` e `imports`, pois a igualdade de objetos pode ocultar mudanças de precedência. Reporte qualquer ajuste intencional de `default`.

Não reinstale dependências nem regenere lockfiles quando somente a ordem mudou. Não adicione testes ao projeto para essa transformação. Informe os manifests atualizados e eventuais alterações além da ordenação.
