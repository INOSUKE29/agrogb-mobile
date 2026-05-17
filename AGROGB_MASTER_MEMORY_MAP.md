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
*   **Banco Local:** SQLite local gerenciado de forma assíncrona pelo driver Nativo em `src/database/database.js`.
*   **Banco em Nuvem:** PostgreSQL hospedado no Supabase.
*   **Arquitetura:** *Offline-First* com sincronização em segundo plano via `SyncService.js`.
*   **Diretório Ativo:** `c:\Users\Bruno\Documents\AgroGB\agrogb-mobile.-main`

### Desktop/Web (Roadmap)

*   **Tecnologia:** Python SQLite local (`agrogb.db`) + Sincronização Supabase em `sync_cloud.py`.
*   **Diretório Ativo:** `c:\Users\Bruno\Documents\AgroGB\Desktop_App`

---

# 4. VISÃO DO PRODUTO

O AgroGB é um ERP agrícola inteligente para gestão completa da propriedade rural, focado em unificar a tomada de decisão no campo e no escritório de forma transparente, visualmente deslumbrante e resiliente à conectividade instável do campo.

## Áreas cobertas

*   **Agronomia:** Plantios, colheitas, dosagens e aplicações.
*   **Fertirrigação & Adubação:** Nutrição mineral inteligente por hectare com cálculos químicos.
*   **Estoque:** Abastecimento automático, baixa física, lotes e controle de validade/toxicidade.
*   **Financeiro:** Contas a pagar/receber, conciliação e geração automática de fluxo de caixa.
*   **Comercial:** Compras de insumos, vendas de produção agrícola e logística de encomendas.
*   **BI & Inteligência:** Painéis dinâmicos de faturamento, ROI por talhão e predição de safras.
*   **IA Generativa:** Análise de imagens e diagnóstico de pragas integrado a um chat inteligente.
*   **Sincronização & Segurança:** Criptografia biométrica, sessões seguras e backups locais offline.

---

# 5. PRINCÍPIOS DE ARQUITETURA

## Offline-first
O aplicativo móvel opera 100% de suas funções de forma local. Ele nunca bloqueia uma tela de cadastro ou inserção por falta de internet.

## Sync automático
A sincronização com a nuvem do Supabase usa campos de carimbo de data/hora (`last_updated`) e flags (`sync_status = 0` para pendente de sincronismo, `1` para sincronizado).

## UUIDs
Para evitar colisões de chaves primárias quando múltiplos dispositivos inserem registros offline ao mesmo tempo, todas as tabelas locais e remotas usam identificadores universais em texto **UUID (v4)**.

## Auditoria
Toda movimentação crítica de estoque ou alteração financeira gera um registro histórico de auditoria (na tabela `movimentacao_estoque` ou log descritivo no `caderno_notas`).

## Design System Premium
As telas seguem uma linguagem visual de vanguarda (estilo Diamond Pro / Neo-Brutalist): gradientes elegantes escuros (`#020617`, `#0A0F1C`), desfoques dinâmicos (`BlurView`), orbs ambientais brilhantes e componentes customizados reutilizáveis.

---

# 6. FONTES OFICIAIS DE VERDADE

1.  [`AGROGB_MASTER_MEMORY_MAP.md`](file:///c:/Users/Bruno/Documents/AgroGB/agrogb-mobile.-main/AGROGB_MASTER_MEMORY_MAP.md) (Esta fonte permanente de conhecimento)
2.  [`src/database/database.js`](file:///c:/Users/Bruno/Documents/AgroGB/agrogb-mobile.-main/src/database/database.js) (O motor local SQLite e suas queries de banco)
3.  [`src/services/EstoqueService.js`](file:///c:/Users/Bruno/Documents/AgroGB/agrogb-mobile.-main/src/services/EstoqueService.js) (Serviço de baixa e movimentações físicas)
4.  [`src/screens/PlanoAdubacaoScreen.js`](file:///c:/Users/Bruno/Documents/AgroGB/agrogb-mobile.-main/src/screens/PlanoAdubacaoScreen.js) & [`src/screens/AdubacaoFormScreen.js`](file:///c:/Users/Bruno/Documents/AgroGB/agrogb-mobile.-main/src/screens/AdubacaoFormScreen.js) (Os formulários de receitas e cálculos de NPK)
5.  [`src/screens/EncomendasScreen.js`](file:///c:/Users/Bruno/Documents/AgroGB/agrogb-mobile.-main/src/screens/EncomendasScreen.js) & [`src/screens/NovaEncomendaScreen.js`](file:///c:/Users/Bruno/Documents/AgroGB/agrogb-mobile.-main/src/screens/NovaEncomendaScreen.js) (Gestão de cargas de logística)
6.  [`src/screens/VendasScreen.js`](file:///c:/Users/Bruno/Documents/AgroGB/agrogb-mobile.-main/src/screens/VendasScreen.js) & [`src/screens/ComprasScreen.js`](file:///c:/Users/Bruno/Documents/AgroGB/agrogb-mobile.-main/src/screens/ComprasScreen.js) (Os módulos comerciais inteligentes)
7.  [`src/services/SyncService.js`](file:///c:/Users/Bruno/Documents/AgroGB/agrogb-mobile.-main/src/services/SyncService.js) (Gerenciador de sincronismo Supabase)

---

# 7. ESTRUTURA MENTAL DO SISTEMA

```text
AgroGB
├── Autenticação (Login, Register, ForgotPassword, Biometria)
├── Dashboard (KPIs de Custo, Receita, Faturamento, Gráficos de Safra)
├── Cadastros (Clientes, Culturas, Insumos, Fornecedores, Talhões, Equipes)
├── Operacional (Plantio, Colheita, Adubação, Irrigação, Caderno de Campo)
├── Estoque (Entradas, Saídas, Movimentações, Ajustes Diretos, Alertas)
├── Financeiro (Contas a Pagar/Receber, Transações DRE, Fluxo de Caixa)
├── Comercial (Compras de Insumos, Vendas, Encomendas, Logística)
├── Relatórios (Relatórios PDF, Excel, Histórico e Auditoria)
├── Inteligência Artificial (Diagnósticos de Doenças, Recomendador NPK)
├── Sync & Backup (Sincronismo Supabase Cloud, Limpeza, Restore SQLite)
└── Configurações (Configurações Gerais, Temas Escuro/Claro, Moedas)
```

---

# 8. MÓDULOS DO SISTEMA

### 8.1 Autenticação
*   **Telas:** `LoginScreen.js`, `RegisterScreen.js`, `ForgotPasswordScreen.js`, `RecoverScreen.js`.
*   **Regras:** Suporta validação em tempo real de idade/CPF, login biométrico seguro persistindo tokens em Keychain, e Error Boundary customizado para evitar falhas em cascata de renderização de temas.

### 8.2 Dashboard
*   **Telas:** `DashboardScreen.js`, `src/components/dashboard/QuickActions.js`.
*   **Regras:** Exibe KPIs de faturamento e alertas críticos de estoque baixo em tempo real, integrando gráficos dinâmicos de safras vigentes e botões de atalho rápido Diamond Pro.

### 8.3 Cadastros
*   **Telas:** `CadastroScreen.js` (Catálogo Geral), `ClientesScreen.js`, `EquipesScreen.js`.
*   **Regras:** Registra e edita fichas cadastrais completas configurando estocabilidade (`estocavel = 1`) e vendabilidade (`vendavel = 1`) para alimentação de outros fluxos.

### 8.4 Operacional
*   **Telas:** `PlantioScreen.js`, `ColheitaScreen.js`, `PlanoAdubacaoScreen.js`, `AdubacaoFormScreen.js`, `AdubacaoDetailScreen.js`, `MonitoramentoScreen.js`.
*   **Regras:** Lida com todo o ciclo agronômico real. O monitoramento suporta integração de IA generativa para imagens de folhas infectadas de pragas.

### 8.5 Estoque
*   **Telas:** `EstoqueScreen.js`, `database.js` (`atualizarEstoque`).
*   **Regras:** Monitoramento de saldos por insumo/produto com alertas visuais dinâmicos (*Esgotado, Baixo, Normal*) e recurso de ajuste/inicialização rápida de saldo manual (sem nota fiscal).

### 8.6 Financeiro
*   **Telas:** `FinanceiroScreen.js`.
*   **Regras:** Lançamentos de despesas e receitas. Toda alteração comercial e física com impacto financeiro cria de forma autônoma uma entrada correspondente no caixa geral.

### 8.7 Comercial
*   **Telas:** `ComprasScreen.js`, `VendasScreen.js`, `EncomendasScreen.js`, `NovaEncomendaScreen.js`.
*   **Regras:** Entrada de compras (aumentando estoque e gerando contas a pagar) e saída de vendas (reduzindo estoque física ou por receitas explosivas e gerando contas a receber).

### 8.8 Relatórios
*   **Telas:** Exportação de fluxos locais e relatórios do DRE em PDF/Excel.

### 8.9 Inteligência Artificial
*   **Telas:** `MonitoramentoScreen.js` integrado à biblioteca de câmera para diagnósticos rápidos de lavoura.

### 8.10 Sync e Backup
*   **Serviços:** `SyncService.js`.
*   **Regras:** Disparado de forma transparente e assíncrona. Resolve conflitos de concorrência priorizando o carimbo de data/hora mais recente de atualização (`last_updated`).

### 8.11 Configurações
*   **Telas:** Preferências de layout, troca instantânea de cores do design system e alteração de senha de segurança.

---

# 9. REGRAS DE NEGÓCIO CRÍTICAS

## Adubação & Nutrição (Fórmula NPK)
Ao criar e aplicar uma etapa do Plano de Adubação:
1.  **Cálculo NPK Dinâmico:** O sistema calcula a carga nutricional multiplicando a dosagem por hectare aplicada pela área do talhão, decompondo os elementos químicos (N, P, K) na proporção de 10% padrão de cada insumo utilizado.
2.  **Verificação de Saldo:** Verifica se a quantidade necessária para cobrir a área do talhão existe fisicamente no estoque. Se faltar insumo, exibe alerta vermelho e bloqueia a finalização da aplicação.
3.  **Abate Físico:** Reduz automaticamente a quantidade necessária do estoque usando `atualizarEstoque()`.
4.  **Log de Livro de Campo:** Gera e insere um registro descritivo detalhado com data, talhão, área e dosagens aplicadas na tabela `caderno_notas`.

## Vendas (Carrinho & Explosão de Receitas)
Ao registrar uma Venda:
1.  **Explosão de Receita:** O sistema verifica se o produto vendido possui uma receita cadastrada na tabela `receitas`. 
    *   *Se houver receita:* Ele calcula e deduz do estoque as quantidades dos **ingredientes que compõem o produto** (Ex: Venda de Caixa de Morango ➔ Abate embalagem plástica + fita adesiva + morangos in natura do estoque).
    *   *Se não houver receita:* Deduz a quantidade diretamente do item vendido no estoque.
2.  **Lançamento Financeiro:** Insere automaticamente um lançamento de crédito (**`RECEBER`**) na tabela `financeiro_transacoes` com o valor total calculado da venda.

## Compras & Entrada de Insumos
Ao registrar uma Compra:
1.  **Entrada de Estoque:** Adiciona fisicamente a quantidade de insumos comprada na tabela de estoque.
2.  **Lançamento Financeiro:** Insere automaticamente um lançamento de débito (**`PAGAR`**) na tabela `financeiro_transacoes` com a data de vencimento da fatura.
3.  **Cadastro On-The-Fly:** Se o fornecedor entregar um insumo que ainda não está no catálogo, a tela de compras permite registrá-lo rapidamente sem fechar a operação.

## Controle de Estoque Seguro
1.  **Segurança Antinegativa:** Se uma saída de estoque for maior do que a quantidade física disponível, a função zera o estoque (`0`) em vez de permitir números negativos.
2.  **Proteção de Histórico:** Lançamentos com data de referência anteriores a `2026-01-01` são ignorados no cálculo de estoque atual para evitar que relatórios antigos de safras passadas alterem os saldos reais vigentes do estoque físico.

---

# 10. DESIGN SYSTEM OFICIAL

## Referência Visual
A tela de **Menu / Dashboard Principal** é o padrão oficial de design system do AgroGB ( Diamond Pro). Componentes customizados devem seguir o visual escuro elegante, combinando vidro fosco e contrastes sutis em verde menta (`#10B981` ou `#34D399`) e dourado elegante para botões de destaque e ícones de peso.

## Componentes Oficiais
*   `AgroButton` ➔ Botão com gradiente, borda interna e feedback tátil.
*   `Card` & `SafeBlurView` ➔ Cards com efeito translúcido desfocado (`BlurView`) e bordas suaves semi-transparentes de 1px.
*   `MetricCard` ➔ Exibição de KPIs com badges de porcentagem positivos/negativos.

---

# 11. STATUS DOS MÓDULOS

| Módulo | Status | Notas Técnicas |
| :--- | :--- | :--- |
| **Autenticação** | 🟢 Estável | Suporta biometria e recuperação segura de contas via Supabase Auth. |
| **Dashboard** | 🟢 Estável | KPIs consolidados e gráficos de colheita rápidos operando offline. |
| **Adubação** | 🟢 Estável | Lógicas agronômicas de NPK, carrinho de dosagem e escrita no caderno restaurados. |
| **Estoque** | 🟢 Estável | Ajuste direto de saldos, alertas de estoque baixo e regras de datas de corte ativas. |
| **Financeiro** | 🟡 Refinamento | Fluxo de DRE consolidado; integração autônoma de contas a pagar/receber operacional. |
| **Compras** | 🟢 Operacional | Entrada física integrada ao financeiro e cadastro de itens rápidos na tela de entrada. |
| **Vendas** | 🟢 Operacional | Baixas inteligentes por receitas explosivas e criação de contas a receber automatizada. |
| **Sync** | 🟢 Estável | Tratamento de conflitos de banco de dados offline/online ativo no Supabase. |

---

# 12. ROADMAP ESTRATÉGICO

## Fase 1 — Estabilização (Concluída)
*   Remoção de bugs e correção de sintaxe de empacotamento no build do GitHub Actions.

## Fase 2 — Recuperação de Lógica Histórica (Concluída)
*   Reincorporação integral das regras de adubação, NPK, explosão de vendas e baixas no caderno de notas.

## Fase 3 — Limpeza e Reinicialização Operacional (Concluída)
*   Zeramento total seguro de bases de dados do Supabase e SQLite desktop local para novos testes sem resíduos de dados fictícios.

## Fase 4 — Testes de Campo (Em Andamento)
*   Instalação da nova build de produção gerada pelo APK para testes físicos na propriedade rural.

## Fase 5 — Versão Desktop Completa (Roadmap)
*   Portabilidade da lógica de serviços unificada para o ecossistema desktop Python.

---

# 13. LOG DE DECISÕES

### 2026-05-17
*   **Limpeza de Testes:** Realizado o zeramento completo de todas as 17 tabelas ativas no Supabase na nuvem e o SQLite desktop local para permitir novos cadastros operacionais limpos.
*   **Segurança de Login Permanente:** Definido e mantido o login **`ADMIN`** com a senha **`1234`** na tabela `usuarios` local e na nuvem como conta master permanente para testes rápidos.
*   **Criação do Cérebro Ativo:** Estabelecido este arquivo `AGROGB_MASTER_MEMORY_MAP.md` e enviado ao repositório GitHub para servir como a base definitiva e inabalável de inteligência de IAs do AgroGB.

---

# 14. IDEIAS FUTURAS
*   Recomendações automatizadas de fertilização preditiva baseadas em análise química de solo carregada por foto ou arquivo PDF.
*   ROI real por talhão cruzando dados financeiros diretos de aplicações de insumos contra lucros de colheita.
*   Suporte a mapas de satélite offline para georeferenciamento de talhões em áreas sem rede de dados celular.

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

Sempre que houver alteração importante:
*   [ ] Atualizar funcionalidades.
*   [ ] Atualizar regras de negócio.
*   [ ] Atualizar status dos módulos.
*   [ ] Atualizar roadmap.
*   [ ] Registrar decisões.
*   [ ] Registrar novas ideias.

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
