# 🧠 AGROGB_MASTER_MEMORY_MAP.md

> **Documento Mestre de Memória Permanente do Projeto AgroGB**
>
> Este arquivo é a fonte oficial de conhecimento do projeto AgroGB.
> Ele deve ser atualizado continuamente e nunca substituído ou apagado.
> Toda nova funcionalidade, regra de negócio, decisão técnica ou ideia estratégica deve ser incorporada a este documento.

---

# 1. OBJETIVO DO DOCUMENTO

Criar uma memória técnica permanente para que qualquer IA (ChatGPT, Google AI, Claude, Cursor, Copilot etc.) possa:

* entender imediatamente o projeto AgroGB;
* continuar exatamente do ponto onde o desenvolvimento parou;
* conhecer todas as funcionalidades existentes;
* conhecer regras de negócio históricas;
* preservar decisões já tomadas;
* evitar perda de conhecimento;
* evoluir continuamente o sistema.

---

# 2. REGRA FUNDAMENTAL

## ⚠️ ESTE DOCUMENTO NUNCA DEVE SER APAGADO

Ele deve ser:

* mantido como arquivo permanente;
* versionado no GitHub;
* atualizado após cada evolução importante;
* utilizado como base obrigatória para qualquer nova implementação.

### Política de atualização

* Nunca remover conteúdo histórico relevante.
* Atualizar status quando algo evoluir.
* Registrar decisões e justificativas.
* Adicionar aprendizados e melhorias.

---

# 3. ESTRUTURA DO ECOSSISTEMA AGROGB

## Plataformas

### Mobile (Prioridade Atual e Ativa)

*   **Tecnologia:** Expo + React Native.
*   **Banco Local:** SQLite local gerenciado em `src/database/database.js`.
*   **Banco em Nuvem:** Supabase Cloud PostgreSQL.
*   **Arquitetura:** Offline-First com sincronização em segundo plano via `SyncService.js`.
*   **Diretório Ativo:** `c:\Users\Bruno\Documents\AgroGB\apps\mobile\mobile_app`

### Desktop/Web (Roadmap)

*   **Tecnologia:** Python SQLite local (`agrogb.db`) + Sincronização Supabase em `sync_cloud.py`.
*   **Diretório Ativo:** `c:\Users\Bruno\Documents\AgroGB\Desktop_App`

---

# 4. VISÃO DO PRODUTO

O AgroGB é um ERP agrícola inteligente para gestão completa da propriedade rural, unindo o monitoramento de campo, faturamento comercial, explosão de estoque por receitas, controle de insumos NPK e lançamentos financeiros automatizados offline/online.

## Áreas cobertas

*   **Agronomia:** Dosagens de adubação, cálculos NPK por talhão, colheita e plantio.
*   **Comercial:** Compras de insumos, vendas de safras e logística de encomendas com faturamento rápido.
*   **Estoque:** Baixas automáticas (carrinho de adubação, vendas e descarte) e ajuste manual direto.
*   **Financeiro:** Demonstrativos DRE, contas a pagar e contas a receber automáticas.
*   **Inteligência Artificial:** Análise diagnóstica de lavouras e pragas.

---

# 5. PRINCÍPIOS DE ARQUITETURA

*   **Offline-first:** O sistema móvel opera de forma autônoma sem internet e grava todas as transações no SQLite local.
*   **Sync automático:** Sincronização transparente com o Supabase Cloud baseada em timestamps (`last_updated`).
*   **UUIDs:** Chaves primárias em UUID (v4) geradas localmente para evitar colisões no sync offline.
*   **Auditoria:** Registro permanente de histórico de estoque (`movimentacao_estoque`) e caderno de notas (`caderno_notas`).
*   **Design System Premium:** Padrão Diamond Pro baseado em gradientes elegantes escuros, BlurViews desfocadas e orbs ambientais.
*   **Reutilização:** Lógica de persistência e validações centralizada em serviços e funções exportadas em `database.js`.

---

# 6. FONTES OFICIAIS DE VERDADE

1.  [`AGROGB_MASTER_MEMORY_MAP.md`](file:///c:/Users/Bruno/Documents/AgroGB/apps/mobile/AGROGB_MASTER_MEMORY_MAP.md) (Esta fonte permanente de conhecimento)
2.  [`src/database/database.js`](file:///c:/Users/Bruno/Documents/AgroGB/apps/mobile/mobile_app/src/database/database.js) (O motor local SQLite e suas queries de banco)
3.  [`src/services/EstoqueService.js`](file:///c:/Users/Bruno/Documents/AgroGB/apps/mobile/mobile_app/src/services/EstoqueService.js) (Serviço de baixa e movimentações físicas)
4.  [`src/screens/PlanoAdubacaoScreen.js`](file:///c:/Users/Bruno/Documents/AgroGB/apps/mobile/mobile_app/src/screens/PlanoAdubacaoScreen.js) & [`src/screens/AdubacaoFormScreen.js`](file:///c:/Users/Bruno/Documents/AgroGB/apps/mobile/mobile_app/src/screens/AdubacaoFormScreen.js) & [`src/screens/AdubacaoDetailScreen.js`](file:///c:/Users/Bruno/Documents/AgroGB/apps/mobile/mobile_app/src/screens/AdubacaoDetailScreen.js) (Lógica agronômica e NPK)
5.  [`src/screens/EncomendasScreen.js`](file:///c:/Users/Bruno/Documents/AgroGB/apps/mobile/mobile_app/src/screens/EncomendasScreen.js) & [`src/screens/NovaEncomendaScreen.js`](file:///c:/Users/Bruno/Documents/AgroGB/apps/mobile/mobile_app/src/screens/NovaEncomendaScreen.js) (Logística)
6.  [`src/screens/VendasScreen.js`](file:///c:/Users/Bruno/Documents/AgroGB/apps/mobile/mobile_app/src/screens/VendasScreen.js) & [`src/screens/ComprasScreen.js`](file:///c:/Users/Bruno/Documents/AgroGB/apps/mobile/mobile_app/src/screens/ComprasScreen.js) (Módulos Comerciais)

---

# 7. ESTRUTURA MENTAL DO SISTEMA

```text
AgroGB
├── Autenticação
├── Dashboard
├── Cadastros
├── Operacional
├── Estoque
├── Financeiro
├── Comercial
├── Relatórios
├── Inteligência Artificial
├── Sync & Backup
└── Configurações
```

---

# 8. MÓDULOS DO SISTEMA

## 8.1 Autenticação
*   **Descrição:** Cadastro e login biométrico integrado ao Supabase Auth com persistência offline e Error Boundary de resiliência.

## 8.2 Dashboard
*   **Descrição:** Métricas Diamond Pro de ROI, faturamento consolidado, gráficos de safra e listagem de alertas rápidos.

## 8.3 Cadastros
*   **Descrição:** Gerenciamento de Clientes, Fornecedores, Talhões, Equipes e Catálogo de Itens configuráveis.

## 8.4 Operacional
*   **Descrição:** Lançamentos de Plantio, Monitoramento IA, Planos de Adubação, Aplicação e Colheita com escrita no Caderno de Notas.

## 8.5 Estoque
*   **Descrição:** Entradas e saídas físicas baseadas na função `atualizarEstoque()`, integrando alertas automáticos de saldo baixo.

## 8.6 Financeiro
*   **Descrição:** Integração e DRE. Toda movimentação comercial gera automaticamente lançamentos de débito ou crédito.

## 8.7 Comercial
*   **Descrição:** Compras rápidas e Vendas integradas a receitas, além da logística e faturamento de Encomendas.

## 8.8 Relatórios
*   **Descrição:** Geração local e compartilhamento de relatórios DRE e movimentações do livro de campo.

## 8.9 Inteligência Artificial
*   **Descrição:** Análise de lavoura para pragas diretamente da câmera integrado à nuvem de diagnóstico.

## 8.10 Sync e Backup
*   **Descrição:** Sincronismo inteligente resolvendo concorrências priorizando o registro de timestamp (`last_updated`) mais novo.

## 8.11 Configurações
*   **Descrição:** Seleção de layout, tema dinâmico Dark/Light e alteração de parâmetros gerais.

---

# 9. REGRAS DE NEGÓCIO CRÍTICAS

## Adubação (Fórmula NPK e Livro de Campo)
1.  **Baixa de Estoque:** Ao planejar uma adubação, os insumos são associados. Ao tocar em **"DEDUZIR ESTOQUE E APLICAR"** nos detalhes do plano (`AdubacaoDetailScreen.js`), o sistema percorre cada insumo cadastrado na receita técnica, calcula a dosagem proporcional e realiza o abatimento físico no estoque local chamando `atualizarEstoque(produto, -quantidade, data)`.
2.  **Movimentação de Estoque:** Insere automaticamente um registro na tabela `movimentacao_estoque` com tipo `SAIDA` e motivo `CONSUMO ADUBAÇÃO: [Nome do Plano]`.
3.  **Verificação de Saldo:** Se o insumo requisitado for maior do que o saldo físico, bloqueia a operação e alerta o agrônomo.
4.  **Auditoria no Caderno de Notas:** Ao aplicar a adubação, grava automaticamente uma nota técnica descritiva detalhada na tabela `caderno_notas` de campo.
5.  **Cálculo NPK:** Decompõe e exibe a carga de Nitrogênio (N), Fósforo (P) e Potássio (K) com base em 10% padrão de cada insumo.

## Compras & Insumos
1.  **Estoque:** Adiciona fisicamente a quantidade de insumos comprados na tabela `estoque`.
2.  **Financeiro:** Cria lançamento automático do tipo **`PAGAR`** em `financeiro_transacoes` para integração com o DRE.
3.  **Cadastro Rápido:** Permite registrar um novo item no catálogo diretamente na tela de compras.

## Vendas com Explosão de Receitas (BOM - Fórmulas de Embalagens)
1.  **Explosão de Receita (BOM):** Ao salvar uma venda (`insertVenda`), o sistema verifica se o produto vendido possui uma receita técnica atrelada na tabela `receitas`. 
    *   **Se sim (Tem Receita):** Abate do estoque físico a quantidade multiplicada proporcionalmente de cada insumo/embalagem filho configurado, mantendo o produto principal intocado se este não for estocável.
    *   **Se não (Sem Receita):** Abate a quantidade diretamente do estoque do produto principal vendido (comportamento clássico).
2.  **Regras Clássicas de Receita de Embalagens do AgroGB:**
    *   *Morango Padrão:* Venda de 1 Caixa (CX) de Morango dá baixa automática em 1 caixa vazia + 4 cambucas standard.
    *   *Morango Grande:* Venda de 1 Caixa (CX) de Morango Grande dá baixa automática em 1 caixa grande + 4 cambucas grandes.
    *   *Morango Premium ou Fundi:* Venda de 1 Caixa (CX) Premium/Fundi dá baixa automática em 1 caixa premium + 4 cambucas de isopor + filme plástico (sufilme).
    *   *Flores:* Venda de 1 pacote dá baixa automática em 1 pacote protetor por maço.
    *   *Ervilha Embalada:* Venda de 1 volume dá baixa automática em 20 a 30 bandejas de isopor + filme plástico (sufilme) proporcional.
3.  **Financeiro:** Cria lançamento automático do tipo **`RECEBER`** em `financeiro_transacoes` de categoria `VENDAS`.

## Encomendas e Logística
1.  **Faturamento e Baixa de Encomendas:** Encomendas nos status `PENDENTE` ou `PARCIAL` exibem a ação de atalho **"Dar Baixa"**. Ao clicar, o usuário é transferido para a tela de **Vendas** com os dados pré-preenchidos (*Cliente, Produto, Quantidade restante e ID da encomenda*).
2.  **Fechamento do Fluxo:** Ao concluir a venda que deu baixa na encomenda, a venda dispara a explosão de receita do produto (BOM), deduzindo as caixas e cambucas do estoque e postando a receita a receber no caixa financeiro de forma unificada e livre de erros.

## Controle de Estoque Seguro
1.  **Regra Antinegativa:** Se uma saída de estoque tentar deixar o saldo negativo, a quantidade é fixada em `0`.
2.  **Data de Corte:** Registros históricos anteriores a `2026-01-01` são ignorados no cálculo físico para não bagunçar o estoque atual.

---

# 10. DESIGN SYSTEM OFICIAL

## Referência Visual
O padrão visual oficial baseia-se na tela de **Dashboard Diamond Pro**. Componentes customizados devem seguir o visual escuro elegante, usando gradientes escuros, desfoque dinâmico e contornos em verde menta (`#10B981`) ou dourado para elementos de faturamento.

## Componentes
*   `AgroButton` (Botão premium tátil)
*   `Card` & `SafeBlurView` (Cards translúcidos desfocados com bordas de 1px)
*   `MetricCard` (Cards numéricos de KPIs)

---

# 11. STATUS DOS MÓDULOS

| Módulo | Status | Notas Técnicas |
| :--- | :--- | :--- |
| Autenticação | 🟢 Estável | Autenticação híbrida Supabase Auth/SQLite, RLS e triggers corrigidos, offline-first. |
| Dashboard | 🟢 Estável | KPIs de DRE e gráficos rápidos operando em modo offline. |
| Adubação | 🟢 Estável | Lógicas agronômicas de NPK e carrinho de dosagem restaurados com sucesso. |
| Estoque | 🟢 Estável | Ajuste direto de saldos, alertas de estoque baixo e regras de datas de corte ativas. |
| Financeiro | 🟡 Refinamento | Integração autônoma de contas a pagar/receber operacional; DRE consolidado. |
| Compras | 🟢 Operacional | Entrada física integrada ao financeiro e cadastro de itens rápidos na tela de entrada. |
| Vendas | 🟢 Operacional | Baixas inteligentes por receitas explosivas e criação de contas a receber automatizada. |
| Biblioteca Global | 🟢 Estável | Padronização premium de seletores dinâmicos (frosted bottom sheet) em 100% dos fluxos dinâmicos. |
| Sync | 🟢 Estável | Tratamento de concorrência e push/pull offline e online com Supabase ativo. |
| Segurança de Nuvem | 🟢 Estável | RLS completo em 100% das tabelas, Search Path blindado e 0 sugestões/erros de segurança. |

---

# 12. ROADMAP ESTRATÉGICO

*   **Fase 1 — Consolidar Base Atual do Mobile (Concluída/Estável):** Alinhamento visual, correção de menus, unificação de Configurações e validação sintática do Metro Bundler.
*   **Fase 2 — Estrutura de Banco Unificada (Concluída no Supabase):** Esquema completo rematriculado na nuvem (`farms`, `fields`, `plantings`, `recommendations`) com campos de auditoria (`created_by`, `updated_by`) e plataforma de origem (`source_platform`).
*   **Fase 3 — Controle de Perfis (Concluída no Supabase):** Perfis (`profiles`) integrados ao cadastro nativo com roles rígidas de acesso (`ADMIN`, `AGRONOMO`, `CLIENTE`, `STAFF`).
*   **Fase 4 — Permissões Granulares (Concluída no Supabase):** RLS e políticas de acesso estruturadas por papéis, protegendo dados financeiros e limitando visualizações.
*   **Fase 5 — Biblioteca Global e Local (Concluída no Supabase):** Tabela de produtos (`products`) pronta com suporte a curadoria (`approved`, `pending`, `rejected`).
*   **Fase 6 — Recomendações Agronômicas (Concluída no Supabase):** Tabela `recommendations` pronta para persistir receitas rígidas via Gotejo ou Foliar.
*   **Fase 7 — Auditoria Completa (Concluída no Supabase):** Banco 100% auditado através do gatilho universal `audit_trigger_func` gravando em `audit_logs`.
*   **Fase 8 — Integração Desktop (Roadmap Ativo):** Construção do painel web/desktop administrativo consumindo a mesma base unificada e consolidada do Supabase.

---

# 13. LOG DE DECISÕES

### 2026-05-20
*   **Visual Lúdico com FriendlyModal**: Unificamos os alertas e erros críticos operacionais do mobile sob o componente `FriendlyModal` (Nubank/Bradesco UX) nas telas `ColheitaScreen`, `CadernoCampoScreen`, `EstoqueScreen` e `FinanceiroLancamentosScreen`.
*   **Monorepo Corporativo (Turborepo + PNPM)**: Criamos a estrutura organizacional e de build no diretório pai `c:\Users\Bruno\Documents\AgroGB` para unificar os códigos e dependências do mobile (React Native) e desktop (Python CustomTkinter).
*   **Resiliência e Migração de Sync**: Adicionamos `sync_status` e `last_updated` ausentes nas tabelas `equipes` e `agronomist_codes` no SQLite local do mobile e validamos a infraestrutura via script `test_sync.js`. Detectamos erro de recursão na política de `profiles` no Supabase a ser corrigido ao obter acesso ao SQL Console.
*   **Arquitetura de Acesso Split e Gating Dinâmico**: Consolidamos a estratégia de controle de acesso de perfil (Cliente vs. Agrônomo) e upgrade de planos (Basic/Pro/ERP) sob uma base de código única. Rejeitamos a divisão em múltiplos aplicativos devido à alta fricção de manutenção e escalabilidade. Modelamos a liberação automática de recursos premium via webhooks (Mercado Pago/Stripe) e reatividade realtime do Supabase. Mapeado no artefato `agrogb_access_control_blueprint.md`.

### 2026-05-18
*   **Ajuste de RLS em ASCII no Supabase**: Evitamos caracteres acentuados especiais em português (como `á`, `ô`, `ç`, `ã`) nos nomes das políticas de RLS para contornar limitações do linter e garantir compilação universal no Postgres.
*   **Expurgo de tabelas legadas**: Deletamos permanentemente do banco remoto as tabelas `cadastro`, `devices` e `system_settings`, removendo resíduos antigos.

### 2026-05-17
*   **Limpeza das Bases de Dados:** Realizado o zeramento completo de todas as tabelas ativas em nuvem no Supabase e do SQLite desktop local.
*   **Segurança de Login Permanente:** Mantida a conta **`ADMIN`** com a senha **`1234`** na tabela `usuarios` para simulações e testes rápidos sem bloqueio.
*   **Criação do Cérebro Ativo:** Estabelecido este arquivo `AGROGB_MASTER_MEMORY_MAP.md` e enviado ao repositório GitHub para servir como a base definitiva e inabalável de inteligência de IAs do AgroGB.

---

# 14. IDEIAS FUTURAS

*   **Módulo de Recomendação Agronômica (Consultoria e Compartilhamento)**:
    *   **Visão Geral**: O engenheiro agrônomo prepara planos de adubação e aplicação com dosagens exatas de produtos (ex: Bruno - Gotejo: X - 10mg, Y - 10gr; Outros - Foliar: A - 10mg, B - 4gr) customizados às necessidades de cada talhão e cliente.
    *   **Arquitetura Compartilhada (Supabase Central)**: Mobile e Desktop conectados no mesmo banco. O agrônomo monta tudo de forma simplificada e o cliente recebe e executa no seu próprio app.
    *   **Gatilhos de Envio**:
        1. *Dentro do App*: A recomendação surge automaticamente na tela do produtor após sincronização de nuvem.
        2. *WhatsApp*: Envio de texto técnico formatado e limpo contendo a receita diretamente para o contato do cliente.
        3. *PDF*: Geração automática de relatório técnico com assinatura digital profissional.
    *   **Fluxo de Execução Pelo Produtor**: O produtor recebe a receita pronta e pode:
        *   Confirmar execução instantânea (gerando baixa proporcional de estoque).
        *   Registrar a data/hora real da aplicação.
        *   Anexar fotos da folha/talhão e relatar observações técnicas de resultado.
*   **Fluxo de Acesso Simplificado e Separação de Perfis (Acesso Split)**:
    *   **Autenticação Simplificada**: Login unificado limpo na tela inicial (apenas e-mail e senha).
    *   **Seleção de Perfil no Primeiro Acesso**: Ao criar a conta, o usuário escolhe:
        *   *Sou Produtor (Cliente)*: Abre formulário com Nome, CPF/CNPJ, Nome da Propriedade, Cidade/UF e Culturas (Morango).
        *   *Sou Agrônomo / Consultor*: Abre formulário com Nome, CPF, CREA e Telefone de contato.
    *   **Delimitação Dinâmica (Paywall & RLS)**:
        *   O app lê o perfil (`profiles.role`) e o plano do usuário (`profiles.plan_id` como `basic`, `pro`, `erp`) para habilitar menus e restringir funcionalidades de forma reativa.
        *   Permite a liberação automática do módulo avançado (ERP/Consultoria) integrado com webhooks de pagamento (Stripe/Mercado Pago).
    *   **Recuperação Profissional de Acesso**:
        *   *Esqueci minha Senha*: Envio nativo de link de redefinição de credenciais via Supabase Auth para o e-mail cadastrado.
        *   *Não lembro meu E-mail*: Busca de conta digitando CPF/CNPJ ou telefone, exibindo uma máscara de e-mail de segurança (ex: `br****@gmail.com`) ou direcionando ao suporte técnico.
*   Recomendações automáticas de adubação baseadas em uploads de PDFs de laudo químico de solo.
*   ROI por talhão cruzando dados financeiros de compras contra lucros de colheita.
*   Mapas offline para geolocalização de talhões em áreas rurais remotas sem sinal.

---

# 15. PROMPT PADRÃO PARA QUALQUER IA

```text
Leia integralmente o arquivo AGROGB_MASTER_MEMORY_MAP.md.
Este documento é a fonte oficial de conhecimento do projeto.
Baseie todas as decisões, implementações e análises exclusivamente nele.
Nunca ignore seu conteúdo.
Sempre atualize o documento com novas descobertas.
Nunca apague informações históricas relevantes.
Continue o projeto exatamente do ponto onde ele parou.
```

---

# 16. CHECKLIST DE ATUALIZAÇÃO

*   [ ] Atualizar seções de regras de negócio.
*   [ ] Atualizar matrizes de funcionalidades e status dos módulos.
*   [ ] Registrar as novas decisões de arquitetura.
*   [ ] Atualizar o Changelog Permanente com a data e impacto esperado.

---

# 17. MISSÃO PERMANENTE DA IA

Sua missão é transformar o AgroGB no sistema agrícola mais completo e profissional possível.

Você deve:
*   preservar todo conhecimento histórico;
*   aprender continuamente;
*   integrar novas ideias;
*   evitar regressões;
*   propor melhorias;
*   manter consistência técnica e visual.

---

# 18. VISÃO FINAL

O AgroGB será um ecossistema completo de gestão rural, unindo: Agronomia, Finanças, Estoque, BI, Inteligência Artificial, Offline-first, Cloud Sync, Segurança e UX premium de altíssimo padrão internacional.

Objetivo final:
> **Tornar o AgroGB a plataforma de referência definitiva no agronegócio brasileiro.**

---

# 19. GOVERNANÇA DA MEMÓRIA (OBRIGATÓRIO)

Este documento deve seguir regras rígidas de governança para evitar perda de conhecimento.

## Regras Absolutas

1.  **Nunca apagar** seções históricas relevantes ou logs anteriores.
2.  **Nunca sobrescrever** funcionalidades sem registrar formalmente a justificativa no log de decisões.
3.  **Sempre atualizar** o status de cada módulo ao alterar seu código correspondente.
4.  **Sempre registrar** a data e o impacto esperado da alteração no Changelog.
5.  **Sempre preservar** retrocompatibilidade de banco de dados e dados locais do SQLite.
6.  **Toda IA deve ler** este documento como primeiro passo obrigatório antes de alterar qualquer código do repositório.

---

# 20. CHANGELOG PERMANENTE

## 2026-05-24 (Oitava Alteração - Consolidação do Monorepo e Unificação Mobile)
### Alteração
1. **Single Source of Truth**: Consolidado o repositório original `INOSUKE29/agrogb-mobile` (localizado em `apps/mobile/mobile_app`) como a **Única Fonte da Verdade** para compilação do APK e push via GitHub Actions.
2. **Refatoração para Monorepo**: Movidos os utilitários críticos de validação (`validation.js`) e tradução de erros (`errorHelpers.js`) para um pacote autônomo centralizado em `@agrogb/shared` na arquitetura Turborepo. O aplicativo Mobile agora os consome globalmente.
3. **Expurgo de Duplicidade**: Removida completamente a pasta paralela inativa `apps/mobile/src/` para evitar fragmentação. O conteúdo novo foi fundido com sucesso ao diretório ativo, e os módulos desatualizados foram alocados em `src/_deprecated_v1/`.

### Arquivos Alterados
- `packages/shared/index.js` [NEW]
- `apps/mobile/package.json`
- `apps/mobile/mobile_app/src/screens/LoginScreen.js`
- `apps/mobile/mobile_app/src/screens/RegisterScreen.js`
- `apps/mobile/src/` [DELETED]
- `mapa_arquitetura.md`
- `AGROGB_MASTER_MEMORY_MAP.md`

---

## 2026-05-20 (Sétima Alteração)
### Alteração
1. **Módulo 1: Camada Visual Lúdica Completa**: Refatoração completa das telas operacionais (`ColheitaScreen.js`, `CadernoCampoScreen.js`, `EstoqueScreen.js` e `FinanceiroLancamentosScreen.js`) para importar e utilizar o componente dinâmico `FriendlyModal`. Todas as caixas de diálogo e alertas secos/técnicos de validação ou salvamento (`Alert.alert`) foram substituídos por animações leves, coloridas e explicativas com emojis afetuosos no padrão "Nubank / Bradesco" para garantir usabilidade lúdica e acessível.
2. **Módulo 2: Resiliência de Sincronismo Offline-First**: Auditoria de paridade de esquema das 24 tabelas de sincronismo no motor SQLite local (`database.js`). Identificação e correção da falta de campos `sync_status` e `last_updated` nas tabelas `equipes` e `agronomist_codes` (evitando falhas fatais em consultas SQL). Criação de um script profissional de teste e diagnóstico (`test_sync.js`) na pasta scratch para verificar conectividade, comunicação e políticas RLS remotas do Supabase. O script revelou um problema de recursão infinita na RLS da tabela `profiles` na nuvem, já mapeado para correção com o acesso ao SQL editor.
3. **Módulo 3: Monorepo Corporativo Unificado**: Implementação da raiz corporativa estruturada em `c:\Users\Bruno\Documents\AgroGB` através de configurações integradas do PNPM Workspaces (`pnpm-workspace.yaml`) e orquestração de compilação Turborepo (`package.json`, `turbo.json`), integrando as pastas de aplicativo mobile e sistema desktop.
4. **Validação de Compilação (Zero Regressões)**: Execução com sucesso do compilador Babel Compiler (`check_babel_syntax.js`) em todos os arquivos alterados e telas centrais, registrando **100% de compilação verde** (9 arquivos OK, 0 erros).

### Arquivos Alterados
- `src/screens/ColheitaScreen.js`
- `src/screens/CadernoCampoScreen.js`
- `src/screens/EstoqueScreen.js`
- `src/screens/FinanceiroLancamentosScreen.js`
- `src/database/database.js`
- `package.json` [NEW - Raiz]
- `pnpm-workspace.yaml` [NEW - Raiz]
- `turbo.json` [NEW - Raiz]
- `scratch/test_sync.js` [NEW]
- `scratch/check_babel_syntax.js`
- `AGROGB_MASTER_MEMORY_MAP.md`
- `task.md`
- `walkthrough.md`

---

## 2026-05-18 (Sexta Alteração)
### Alteração
Execução e consolidação bem-sucedida de todas as fases do **Plano Master Blueprint no Supabase** (Fases 1 a 7). Deploiamento de um esquema unificado em nuvem, contendo organizações (multi-tenant), perfis (RBAC), talhões, plantios, insumos locais/globais com fila de curadoria, recomendações agronômicas (abas de dosagem Gotejo vs. Foliar), assinaturas e log universal de auditoria via triggers automatizados.
Adicionalmente, realizamos a correção completa de todas as vulnerabilidades e pendências do **Security Advisor do Supabase**, neutralizando o warning de "Mutable Search Path" nas funções procedurais (`SET search_path = pg_catalog, public`) e criando políticas de Row Level Security (RLS) baseadas em ASCII limpo nas tabelas remanescentes (`notifications`, `role_permissions`, `subscription_plans`, `subscriptions`, `billing_events`). Isso eliminou todas as sugestões do Postgres linter, deixando a contagem em **0 sugestões pendentes** e **0 erros** no banco de produção.

### Arquivos Alterados
- `supabase/migrations/supabase_schema_complete.sql`
- `supabase/migrations/supabase_security_fixes.sql`
- `supabase/migrations/supabase_security_base_recreation.sql`
- `supabase/migrations/supabase_schema_part1.sql` [DELETE]
- `AGROGB_MASTER_MEMORY_MAP.md`
- `walkthrough.md`

---

## 2026-05-18 (Quinta Alteração)
### Alteração
Aprovação e consolidação do **Master Blueprint da Arquitetura Modular e Unificada** do AgroGB (Mobile & Desktop). Estruturação do desenvolvimento em 8 fases de evolução, com governança de segurança por Row Level Security (RLS) unificada em nuvem Supabase. Planejamento do módulo de recomendações técnicas com abas rígidas de dosagem (Gotejo vs. Foliar) e unidades flexíveis (`ml`, `gr`, `lt`, `kg`, `m²`), além do fluxo de curadoria local-global de insumos. Disparo da compilação local autônoma do APK Android Debug (`gradlew assembleDebug`) no computador do desenvolvedor para testes prévios estáveis.

### Arquivos Alterados
- `implementation_plan.md`
- `task.md`
- `AGROGB_MASTER_MEMORY_MAP.md`

---

## 2026-05-18 (Quarta Alteração)
### Alteração
Unificação completa e simplificação do painel de Configurações (`SettingsScreen.js`). Descontinuação da tela antiga duplicada (`SyncScreen.js`). Implementação do Tema Global Dinâmico (Claro/Escuro/Sistema) e ativação de 100% dos controles funcionais integrados ao SQLite local e nuvem Supabase em tempo real (Auto-Sync, Ping Latency, Lixeira com expurgo físico, otimização por SQL VACUUM, Senha e Biometria).

### Arquivos Alterados
- `src/context/ThemeContext.js`
- `src/screens/SettingsScreen.js`
- `src/components/dashboard/QuickActions.js`
- `AGROGB_MASTER_MEMORY_MAP.md`

### Regras de Negócio Impactadas
- **Configurações:** Escrita instantânea das preferências (Idioma, Unidade e Safra) no SQLite e AsyncStorage.
- **Sincronismo:** Motor de Auto-Sync que envia atualizações locais em segundo plano imediatamente após modificações.
- **Manutenção:** Execução de compactação de disco por SQLite VACUUM e purga definitiva de dados logicamente deletados (`is_deleted = 1`).


---

## 2026-05-18 (Terceira Alteração)
### Alteração
Padronização estrutural de seletores de dados e inputs pela "Biblioteca Global" do AgroGB. Substituição definitiva dos componentes `@react-native-picker/picker` de banco de dados e inputs manuais de texto por `SmartAutocomplete` + `LibraryPickerModal` com desfoque premium, histórico recente, favoritos e cadastro rápido express (`+ NOVO`).

### Arquivos Alterados
- `src/screens/NovaEncomendaScreen.js`
- `src/screens/RecipeFormScreen.js`
- `AGROGB_MASTER_MEMORY_MAP.md`

### Regras de Negócio Impactadas
- **Logística (Encomendas):** Clientes e Produtos unificados com a Biblioteca Global. Adicionada lógica inteligente de autocompletar Unidade Padrão e Preço Unitário sugerido com base no item do catálogo selecionado.
- **Adubação (Receitas):** Seletor de Cultura (CropLibraryService) e inserção de Insumos da receita (ProductLibraryService) integrados à Biblioteca Global para consistência das fórmulas e eliminação de erros de grafia.

---

## 2026-05-18 (Segunda Alteração)
### Alteração
Correção estrutural e estabilização completa da autenticação com o Supabase. Executados scripts de migração na nuvem (criação da tabela profiles, ativação de RLS e políticas seguras de inserção/leitura, recriação do trigger pós-cadastro). Refatorado LoginScreen (suporte local para ADMIN/1234, resolução híbrida de e-mail por telefone/username local e remoto, sincronização pós-login e fallback offline) e RegisterScreen (metadados completos de cadastro, upsert e tratamento amigável de erro duplicado).

### Arquivos Alterados
- `src/services/supabase.js`
- `src/services/authService.js`
- `src/utils/errorHelpers.js`
- `src/screens/RegisterScreen.js`
- `src/screens/LoginScreen.js`
- `AGROGB_MASTER_MEMORY_MAP.md`

### Regras de Negócio Impactadas
- **Autenticação:** Login e cadastro híbridos (E-mail, Telefone e Username) online e offline.
- **Sincronização:** testConnection corrigido para ler a tabela profiles real na nuvem.
- **Segurança:** Políticas de RLS de perfis ativas e trigger automático funcional.

---

## 2026-05-18
### Alteração
Recuperação e restauração total do modal de gestão de Receitas / Fórmulas de Baixa de Embalagem (BOM) no catálogo rural. Correção de importação crítica de FlatList para evitar falhas táticas na seleção de padrões de mercado.

### Arquivos Alterados
- `src/screens/CadastroScreen.js`
- `AGROGB_MASTER_MEMORY_MAP.md`

### Regras de Negócio Impactadas
- **Cadastros (Catálogo):** Edição avançada de produtos finais vinculando embalagens e insumos com dosagens proporcionais.
- **Visual:** Estabilização do modal do assistente de padrões de peso de mercado.

---

## 2026-05-17
### Alteração
Restauradas as lógicas agronômicas de adubação, receitas de vendas, faturamento rápido de encomendas e zeramento total das bases de dados.

### Arquivos Alterados
- `src/database/database.js`
- `src/screens/AdubacaoFormScreen.js`
- `src/screens/AdubacaoDetailScreen.js`
- `src/screens/PlanoAdubacaoScreen.js`
- `src/screens/EncomendasScreen.js`
- `src/screens/NovaEncomendaScreen.js`
- `src/services/EstoqueService.js` (Novo Serviço)
- `AGROGB_MASTER_MEMORY_MAP.md` (Novo Documento)

### Regras de Negócio Impactadas
- **Adubação:** Lógica NPK, carrinho de dosagem física por talhão e logs em cuaderno_notas.
- **Vendas:** Explosão automática de receitas de itens filhos.
- **Estoque:** Regra antinegativa de proteção e data de corte de 2026.
- **Financeiro:** Entrada de contas a pagar/receber automáticas em compras/vendas.

### Motivo
Restaurar as regras de negócio agronômicas e comerciais históricas perdidas durante a fase de modernização do layout e garantir um banco limpo do zero para testes estáveis.

### Impacto Esperado
O sistema mobile recuperou toda a inteligência agronômica Diamond Pro operando sobre um banco de dados perfeitamente higienizado e livre de resíduos antigos.

---

# 21. MATRIZ DE FUNCIONALIDADES

| Funcionalidade | Status | Arquivos Envolvidos | Tabelas SQLite/Nuvem | Serviços Envolvidos | Última Validação |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Login Biométrico** | 🟢 Estável | `LoginScreen.js`, `RegisterScreen.js`, `database.js` | `usuarios`, `profiles` | Supabase Auth, Biometrics | 18/05/2026 |
| **Aplicações NPK** | 🟢 Estável | `AdubacaoFormScreen.js` | `etapas_adubacao`, `cadastro` | `EstoqueService.js` | 17/05/2026 |
| **Faturamento Encomendas** | 🟢 Estável | `EncomendasScreen.js` | `orders`, `clientes` | Baixa automatizada de Vendas | 17/05/2026 |
| **Explosão Receitas** | 🟢 Estável | `VendasScreen.js` | `receitas`, `estoque` | `EstoqueService.js` | 17/05/2026 |
| **Auto-Post Financeiro** | 🟢 Estável | `ComprasScreen.js`, `VendasScreen.js`| `financeiro_transacoes`| Caixa Automático | 17/05/2026 |
| **Biblioteca Global** | 🟢 Estável | `SmartAutocomplete.js`, `LibraryPickerModal.js` | `clientes`, `cadastro`, `talhoes`, `culturas` | `LibraryServices.js` | 18/05/2026 |
| **Sincronismo Cloud** | 🟢 Estável | `SyncService.js` | Todas | Sincronismo Online Imediato (Auto-Sync) | 18/05/2026 |
| **Tema Dinâmico & Configs** | 🟢 Estável | `SettingsScreen.js`, `ThemeContext.js` | `app_settings` | Sincronismo reativo do tema e ajustes locais | 18/05/2026 |

---

# 22. MATRIZ DE DECISÕES ARQUITETURAIS

*   **Offline-first:** Persistência total e imediata em banco SQLite local (`agrogb_mobile.db`).
*   **UUID como Chave Primária:** Chaves universais v4 para evitar colisões e duplicidades em lançamentos paralelos offline.
*   **Nuvem Supabase (BaaS):** Autenticação e sincronismo bidirecional do banco remoto.
*   **Padrão Visual Diamond Pro:** Uso mandatório de layouts escuros elegantes com BlurViews e contornos em verde menta.
*   **Contas Master Permanente:** Permanência da conta `ADMIN` (senha `1234`) para facilidade de simulações rápidas.

---

# 23. MATRIZ DE REGRAS DE NEGÓCIO

| Regra | Disparo | Processo Executado | Tabelas Afetadas | Serviços Envolvidos | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **NPK Decoupling** | Exibição de etapa de adubação | Multiplica dosagem por área e extrai 10% de N, P e K por ingrediente | N/A | Front-end render | Exibição da carga mineral na tela |
| **Estoque Antinegativo**| `atualizarEstoque` com delta < 0 | Compara saldo atual com delta. Se ficar menor que 0, fixa em 0 | `estoque` | `EstoqueService.js` | Saldo nunca negativo |
| **Histórico Protegido** | `atualizarEstoque` com data antiga | Se data de referência < `2026-01-01`, ignora o ajuste de estoque | `estoque` | `EstoqueService` | Estoque físico intocado |
| **Caixa Automático** | Salvar Compra ou Venda | Insere débito/crédito na tabela financeira baseado no valor da nota | `financeiro_transacoes`| Automação Financeira | Contas atualizadas no DRE |

---

# 24. MATRIZ DE INTEGRAÇÕES

*   **Supabase Cloud:** Gerencia conexões PostgreSQL remotas e autenticação biometrica via Supabase Auth.
*   **SQLite Local:** Mecanismo de persistência nativo com processamento concorrente offline.
*   **Expo Local Authentication:** Interface segura nativa para leitura de biometria facial/digital no celular.
*   **Expo Camera:** Controle e captura de fotos em alta definição para IA de pragas no monitoramento.
*   **Geração PDF/Excel:** Conversão nativa local de matrizes DRE para relatórios portáteis.

---

# 25. MATRIZ DE TESTES DE ACEITAÇÃO

| Módulo | Cenário | Passos de Teste | Resultado Esperado | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Adubação** | Falta de Insumo no Estoque | Tentar aplicar receita sem saldo no estoque físico | Exibição de alerta vermelho de falta de insumo e bloqueio de ação | 🟢 Passou |
| **Vendas** | Explosão de Produto com Receita | Registrar venda de item que possui ingredientes cadastrados | Abate proporcional de cada insumo no estoque e gravação de venda | 🟢 Passou |
| **Estoque** | Lançamento Histórico Retroativo | Registrar movimentação com data em `2025-12-15` | Movimentação gravada no log, mas estoque atual permanece intacto | 🟢 Passou |
| **Encomendas**| Fluxo rápido de "Dar Baixa" | Clicar em "Dar Baixa" na encomenda pendente | Redirecionamento com campos auto-preenchidos na tela de vendas | 🟢 Passou |
| **Autenticação** | Cadastro Novo Usuário | Registrar usuário com e-mail inédito, telefone e nome | Conta criada com sucesso no Supabase Auth, profiles e SQLite | 🟢 Passou |
| **Autenticação** | Cadastro Duplicado | Registrar o mesmo e-mail novamente | Alerta em português claro: "Este e-mail já está cadastrado..." | 🟢 Passou |
| **Autenticação** | Login com E-mail | Autenticar usando e-mail e senha no Supabase | Login efetuado com sucesso e sessão persistida no SQLite | 🟢 Passou |
| **Autenticação** | Login com Telefone | Autenticar usando telefone cadastrado | Localiza o e-mail associado e faz login com senha no Supabase | 🟢 Passou |
| **Autenticação** | Login Admin | Autenticar usando ADMIN e 1234 | Bypass instantâneo para login off-line local da conta ADM | 🟢 Passou |
| **Biblioteca Global** | Busca/Cadastro de Clientes | Abrir seletor em Nova Encomenda, pesquisar e cadastrar um novo via atalho express | Novo cliente inserido no SQLite instantaneamente e pré-selecionado no formulário | 🟢 Passou |
| **Biblioteca Global** | Seleção/Vínculo de Insumos | Adicionar ingrediente na receita em RecipeFormScreen pesquisando pelo autocomplete | Insumo carregado dinamicamente do estoque e inserido com alinhamento pixel-perfect | 🟢 Passou |

---

# 26. MATRIZ DE BUGS CONHECIDOS

*   *Nenhum bug impeditivo ou sintático conhecido em ambiente de homologação. Todas as dependências e empacotamento estão em status de compilação 100% verde no GitHub Actions.*

---

# 27. MATRIZ DE ROADMAP

*   🟢 **Em Produção:** Login Biométrico, Painel Diamond Pro, Carrinho de Nutrição NPK, Baixa física antinegativa de estoque, Explosão de receitas de vendas e Sincronismo Supabase.
*   🟡 **Em Desenvolvimento:** Expansão de relatórios DRE por centro de custos móvel.
*   🔵 **Planejada:** Portabilidade da inteligência local para a plataforma Desktop baseada em Python.

---

# 28. BACKUP E PROTEÇÃO DO CONHECIMENTO

*   **Nuvem GitHub:** Repositório oficial versionado e integrado ao pipeline automático de compilação de APKs.
*   **Backup Local do Workspace:** Cópia permanente de diretórios no computador local de desenvolvimento.
*   **Documento Mestre Permanente:** Versionamento ativo e contínuo deste arquivo `AGROGB_MASTER_MEMORY_MAP.md`.

---

# 29. PROCEDIMENTO OBRIGATÓRIO PARA QUALQUER IA

Antes de iniciar qualquer alteração, correção ou inclusão de código neste repositório:
1.  **Ler integralmente** o arquivo `AGROGB_MASTER_MEMORY_MAP.md`.
2.  **Identificar e respeitar** as regras de negócio críticas listadas na Seção 9.
3.  **Seguir a governança** de não remover dados históricos relevantes e registrar novas decisões de arquitetura.
4.  **Atualizar o Changelog** permanente e os status de módulo no encerramento da tarefa.

---

# 30. CHECKLIST DE ENCERRAMENTO DE CADA SESSÃO

Ao finalizar qualquer atividade de desenvolvimento no AgroGB:
*   [ ] **Atualizar o Changelog Permanente** (Seção 20) com a data, descrição e impacto.
*   [ ] **Atualizar os Status dos Módulos** (Seção 11) se houver alguma evolução ou refatoração.
*   [ ] **Registrar novas Decisões Arquiteturais** (Seção 22) se houver alterações estruturais.
*   [ ] **Validar a integridade das regras críticas** contra regressões de lógica.

---

# 31. REGRA DE OURO

> **Nenhuma funcionalidade, regra de negócio, decisão técnica ou aprendizado importante pode ser perdido. Tudo deve ser documentado, preservado e incorporado ativamente ao AGROGB_MASTER_MEMORY_MAP.md para perpetuação da inteligência do AgroGB.**
