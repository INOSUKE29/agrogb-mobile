# 📖 Diário de Aprendizado de Bugs: AgroGB Mobile

Este documento registra os principais incidentes técnicos ("bugs") enfrentados durante o desenvolvimento e estabilização do AgroGB, para servir de consulta e ensino para novas implementações.

## 1. O Conflito do Painel Web (Violação de Check Constraint)

> [!WARNING]
> **O Sintoma:** Ao criar um usuário pelo Painel Web, o Supabase retornava um erro silencioso e bloqueava o login no celular com a mensagem "Acesso Negado".
> 
> **A Causa:** O código Web estava enviando a permissão (role) do usuário como `AGRICULTOR`. Porém, o banco de dados (Supabase) tinha uma "trava de segurança" (Check Constraint) exigindo que os perfis fossem classificados apenas como `CLIENTE`, `AGRONOMO` ou `ADMIN`. O banco recusava o salvamento e o usuário ficava no limbo.
> 
> **A Solução e o Aprendizado:** O código do Painel Web foi ajustado para enviar a role `CLIENTE` em vez de `AGRICULTOR`. **A Lição:** O "front-end" sempre deve falar a mesma língua do "back-end".

## 2. A Queda do Sincronismo (Falta da coluna `sync_status`)

> [!CAUTION]
> **O Sintoma:** Ao tentar usar o aplicativo off-line, ele congelava e as inserções falhavam misteriosamente.
> 
> **A Causa:** Houve uma atualização no banco de dados local do celular (SQLite). Foi adicionada a necessidade de todas as tabelas terem uma coluna `sync_status` para saber o que já tinha sido enviado para a nuvem. Porém, a tabela `usuarios` não recebeu essa coluna no script de migração.
> 
> **A Solução e o Aprendizado:** Recriamos a tabela SQLite injetando a coluna ausente. **A Lição:** Todas as alterações estruturais precisam ser feitas e testadas em um "Script de Migração" central antes do aplicativo ser compilado.

## 3. O "Crash" Invisível no Login (ReferenceError: cleanedEmail is not defined)

> [!IMPORTANT]
> **O Sintoma:** Mesmo usando o E-mail e PIN perfeitamente corretos e validados no Supabase, a tela dava um solavanco e exibia a mensagem de erro padrão: *"Ocorreu um erro ao processar sua solicitação"*.
> 
> **A Causa:** Ao introduzir suporte para login com números de telefone celular, a variável `cleanedEmail` foi renomeada para `cleanedIdentifier`. Porém, uma única linha no fim da verificação de sessão (linha 137) ainda estava tentando usar a palavra velha `cleanedEmail`. O aplicativo dava tela azul nos bastidores porque a variável não existia mais.
> 
> **A Prevenção (O Escudo Atual):** Para garantir que algo tão primário nunca mais aconteça, instalamos um "Porteiro" no projeto: o **Husky e o ESLint**. A partir de agora, o projeto recusa ser salvo se o ESLint detectar que o programador esqueceu de atualizar o nome de uma variável, blindando completamente o código contra esquecimentos.

## 4. O "Encolhimento" da Tela Branca (Falta do `flex: 1`)

> [!NOTE]
> **O Sintoma:** A tela de login abria com uma gigantesca folha em branco, empurrando todo o aplicativo para o teto.
> 
> **A Causa:** Durante uma melhora estética no filtro de imagem do plano de fundo (adicionando a cor Pôr do Sol), a propriedade CSS `container: { flex: 1 }` foi acidentalmente engolida pela quebra de linha. O `flex: 1` é o responsável por mandar o formulário ocupar 100% da tela.
> 
> **A Prevenção:** O uso do TypeScript (que já rodamos no Painel Web e começaremos a adotar no Mobile) junto com os inspetores de tela do React Native impedem que propriedades essenciais sejam descartadas sem aviso.

---
**Conclusão:** Cada erro enfrentado deixou o aplicativo e o ecossistema mais resiliente. O nível de blindagem do projeto AgroGB subiu para o nível Enterprise.
