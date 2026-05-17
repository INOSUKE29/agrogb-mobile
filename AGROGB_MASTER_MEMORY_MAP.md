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
*   **Diretório Ativo:** `c:\Users\Bruno\Documents\AgroGB\agrogb-mobile.-main`

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

1.  [`AGROGB_MASTER_MEMORY_MAP.md`](file:///c:/Users/Bruno/Documents/AgroGB/agrogb-mobile.-main/AGROGB_MASTER_MEMORY_MAP.md) (Esta fonte permanente de conhecimento)
2.  [`src/database/database.js`](file:///c:/Users/Bruno/Documents/AgroGB/agrogb-mobile.-main/src/database/database.js) (O motor local SQLite e suas queries de banco)
3.  [`src/services/EstoqueService.js`](file:///c:/Users/Bruno/Documents/AgroGB/agrogb-mobile.-main/src/services/EstoqueService.js) (Serviço de baixa e movimentações físicas)
4.  [`src/screens/PlanoAdubacaoScreen.js`](file:///c:/Users/Bruno/Documents/AgroGB/agrogb-mobile.-main/src/screens/PlanoAdubacaoScreen.js) & [`src/screens/AdubacaoFormScreen.js`](file:///c:/Users/Bruno/Documents/AgroGB/agrogb-mobile.-main/src/screens/AdubacaoFormScreen.js) & [`src/screens/AdubacaoDetailScreen.js`](file:///c:/Users/Bruno/Documents/AgroGB/agrogb-mobile.-main/src/screens/AdubacaoDetailScreen.js) (Lógica agronômica e NPK)
5.  [`src/screens/EncomendasScreen.js`](file:///c:/Users/Bruno/Documents/AgroGB/agrogb-mobile.-main/src/screens/EncomendasScreen.js) & [`src/screens/NovaEncomendaScreen.js`](file:///c:/Users/Bruno/Documents/AgroGB/agrogb-mobile.-main/src/screens/NovaEncomendaScreen.js) (Logística)
6.  [`src/screens/VendasScreen.js`](file:///c:/Users/Bruno/Documents/AgroGB/agrogb-mobile.-main/src/screens/VendasScreen.js) & [`src/screens/ComprasScreen.js`](file:///c:/Users/Bruno/Documents/AgroGB/agrogb-mobile.-main/src/screens/ComprasScreen.js) (Módulos Comerciais)

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
1.  **Baixa de Estoque:** Abate cada insumo da receita proporcionalmente à dosagem e área do talhão.
2.  **Verificação de Saldo:** Se o insumo requisitado for maior do que o saldo físico, bloqueia a operação e alerta o agrônomo.
3.  **Auditoria Caderno:** Cria e grava automaticamente o log descritivo da aplicação em `caderno_notas`.
4.  **Cálculo NPK:** Decompõe e exibe a carga de Nitrogênio (N), Fósforo (P) e Potássio (K) com base em 10% padrão de cada insumo.

## Compras & Insumos
1.  **Estoque:** Adiciona fisicamente a quantidade de insumos na tabela `estoque`.
2.  **Financeiro:** Cria lançamento automático do tipo **`PAGAR`** em `financeiro_transacoes`.
3.  **Cadastro Rápido:** Permite registrar um novo item no catálogo diretamente na tela de compras.

## Vendas com Explosão de Receitas
1.  **Explosão de Receita:** Verifica se o produto vendido possui uma receita em `receitas`. Se sim, abate proporcionalmente cada ingrediente/embalagem do estoque; se não, abate o produto diretamente.
2.  **Financeiro:** Cria lançamento automático do tipo **`RECEBER`** em `financeiro_transacoes`.

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
| Autenticação | 🟢 Estável | Suporta biometria e tratamento de erros do Supabase Auth. |
| Dashboard | 🟢 Estável | KPIs de DRE e gráficos rápidos operando em modo offline. |
| Adubação | 🟢 Estável | Lógicas agronômicas de NPK e carrinho de dosagem restaurados com sucesso. |
| Estoque | 🟢 Estável | Ajuste direto de saldos, alertas de estoque baixo e regras de datas de corte ativas. |
| Financeiro | 🟡 Refinamento | Integração autônoma de contas a pagar/receber operacional; DRE consolidado. |
| Compras | 🟢 Operacional | Entrada física integrada ao financeiro e cadastro de itens rápidos na tela de entrada. |
| Vendas | 🟢 Operacional | Baixas inteligentes por receitas explosivas e criação de contas a receber automatizada. |
| Sync | 🟢 Estável | Tratamento de concorrência e push/pull offline e online com Supabase ativo. |

---

# 12. ROADMAP ESTRATÉGICO

*   **Fase 1 — Estabilização (Concluída):** Correção de bugs de sintaxe e de empacotamento no build do GitHub Actions.
*   **Fase 2 — Recuperação de Lógica Histórica (Concluída):** Reincorporação das regras de adubação, NPK, receitas de vendas e baixas no caderno de notas.
*   **Fase 3 — Limpeza e Reinicialização Operacional (Concluída):** Zeramento completo das 17 tabelas ativas no Supabase e banco local.
*   **Fase 4 — Testes de Campo (Em Andamento):** Testes de campo com a nova build APK gerada no GitHub.
*   **Fase 5 — Versão Desktop (Roadmap):** Portabilidade unificada das regras de negócio para a interface em Python.

---

# 13. LOG DE DECISÕES

### 2026-05-17
*   **Limpeza das Bases de Dados:** Realizado o zeramento completo de todas as tabelas ativas em nuvem no Supabase e do SQLite desktop local.
*   **Segurança de Login Permanente:** Mantida a conta **`ADMIN`** com a senha **`1234`** na tabela `usuarios` para simulações e testes rápidos sem bloqueio.
*   **Criação do Cérebro Ativo:** Estabelecido este arquivo `AGROGB_MASTER_MEMORY_MAP.md` e enviado ao repositório GitHub para servir como a base definitiva e inabalável de inteligência de IAs do AgroGB.

---

# 14. IDEIAS FUTURAS

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
| **Login Biométrico** | 🟢 Estável | `LoginScreen.js`, `database.js` | `usuarios` | Supabase Auth, Biometrics | 17/05/2026 |
| **Aplicações NPK** | 🟢 Estável | `AdubacaoFormScreen.js` | `etapas_adubacao`, `cadastro` | `EstoqueService.js` | 17/05/2026 |
| **Faturamento Encomendas** | 🟢 Estável | `EncomendasScreen.js` | `orders`, `clientes` | Baixa automatizada de Vendas | 17/05/2026 |
| **Explosão Receitas** | 🟢 Estável | `VendasScreen.js` | `receitas`, `estoque` | `EstoqueService.js` | 17/05/2026 |
| **Auto-Post Financeiro** | 🟢 Estável | `ComprasScreen.js`, `VendasScreen.js`| `financeiro_transacoes`| Caixa Automático | 17/05/2026 |
| **Sincronismo Cloud** | 🟢 Estável | `SyncService.js` | Todas | `SyncService.js` | 17/05/2026 |

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
