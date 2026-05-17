# 🧠 AGROGB LIVING BRAIN MAP — MAPA ATIVO DE INTELIGÊNCIA E REGRAS de NEGÓCIO

> [!IMPORTANT]
> **PROTOCOLO DE MEMÓRIA ETERNA PARA AGENTES E IAs:**
> 1. Qualquer Inteligência Artificial que trabalhe neste repositório **DEVE ler este arquivo antes de sugerir ou fazer qualquer alteração no código.**
> 2. É terminantemente proibido simplificar, remover ou "cortar caminhos" nas lógicas de negócio listadas aqui.
> 3. Sempre que uma nova funcionalidade for adicionada ou uma regra for alterada, a IA **DEVE atualizar este mapa ativamente na mesma jogada.**

---

## 🌐 1. ARQUITETURA SISTÊMICA & SINCRONIZAÇÃO
O AgroGB é composto por um ecossistema multiplataforma (Mobile React Native + Desktop Python SQLite) integrado à nuvem do Supabase por um modelo **Offline-First com Sincronização Bidirecional**.

### 🔗 Fluxo de Dados:
*   **Banco Local Mobile:** `agrogb_mobile.db` (SQLite local gerenciado pelo `database.js`).
*   **Banco Local Desktop:** `agrogb.db` (SQLite local gerenciado pelo `agrogb.py` / `desktop`).
*   **Banco de Dados Nuvem:** PostgreSQL hospedado no Supabase (`uklygrvibmiknwarzqap.supabase.co`).
*   **Chaves de ID Unificadas:** Todos os registros usam **UUID (v4)** gerados localmente para garantir inserção offline segura sem sobreposição de chaves primárias.

---

## 🌾 2. COMPILAR DE REGRAS DE NEGÓCIO E MÓDULOS INTELIGENTES

### MÓDULO A: ESTOQUE E INTEGRIDADE FÍSICA (`EstoqueScreen.js` / `database.js`)
*   **Ajuste Direto de Insumos:** Permite inicializar saldos físicos diretamente via botão **"Entrada"** ou **"Saída"** na tela de estoque, sem a obrigatoriedade de registrar notas de compra (`atualizarEstoque(produto, delta)`).
*   **Regra de Ouro Antinegativa:** Se uma saída de estoque (por adubação ou venda) tentar deixar o saldo negativo, a função `atualizarEstoque` ajusta automaticamente a quantidade para `0` e registra o aviso, evitando saldos negativos fictícios.
*   **Regra de Data de Corte (Histórico):** Lançamentos com data de referência anteriores a **`2026-01-01`** não alteram o estoque atual, preservando os saldos atuais e impedindo distorções históricas.
*   **Status de Estoque Dinâmico:**
    *   `Quantidade <= 0` ➔ Status: **Esgotado** (Badge Vermelho)
    *   `0 < Quantidade <= 10` ➔ Status: **Baixo** (Badge Amarelo - Alerta de Reposição)
    *   `Quantidade > 10` ➔ Status: **Normal** (Badge Verde)

---

### MÓDULO B: ADUBAÇÃO E INTELIGÊNCIA NUTRICIONAL (`AdubacaoFormScreen.js` / `AdubacaoDetailScreen.js`)
*   **Carrinho de Insumos:** Permite ao agrônomo selecionar múltiplos insumos ativos e definir dosagens específicas por hectare.
*   **Inteligência Nutricional NPK (Cálculo Dinâmico):** Ao exibir a etapa de adubação, o sistema realiza cálculos automáticos de nutrientes de acordo com os percentuais dos elementos químicos do insumo:
    *   Elemento **N (Nitrogênio)** = `Qtd Total Insumo * Fator de N (10% padrão)`
    *   Elemento **P (Fósforo)** = `Qtd Total Insumo * Fator de P (10% padrão)`
    *   Elemento **K (Potássio)** = `Qtd Total Insumo * Fator de K (10% padrão)`
*   **Alerta de Estoque Insuficiente:** Se a quantidade de insumo exigida pela receita for maior do que o saldo físico no estoque, a tela exibe um ícone vermelho de alerta e bloqueia a ação para evitar furos no sistema.
*   **Baixa e Escrita Automática no Caderno de Notas:** Ao aplicar a adubação com sucesso:
    1.  Deduz as quantidades de cada insumo físico do estoque.
    2.  Gera um log descritivo profissional em formato de texto estruturado na tabela `caderno_notas` detalhando a área aplicada, data, insumos e dosagem.

---

### MÓDULO C: ENCOMENDAS E LOGÍSTICA (`EncomendasScreen.js` / `NovaEncomendaScreen.js`)
*   **Dashboard Financeiro de Carga:** A tela exibe o somatório monetário das cargas ativas que estão em trânsito ou pendentes de entrega.
*   **Fluxo de Baixa Rápida para Vendas:** Encomendas nos status `PENDENTE` ou `PARCIAL` exibem a ação **"Dar Baixa"**. Ao clicar, o usuário é transferido para a tela de **Vendas** com os dados pré-preenchidos (*Cliente, Produto, Quantidade restante e ID da encomenda*).
*   **Estados das Encomendas:**
    *   `PENDENTE`: Carga ainda não entregue.
    *   `PARCIAL`: Parte da carga foi faturada via vendas, restando saldo.
    *   `CONCLUIDA`: Carga 100% faturada e entregue.
    *   `CANCELADA`: Registro invalidado.

---

### MÓDULO D: VENDAS COM EXPLOSÃO DE RECEITAS (`VendasScreen.js`)
*   **Explosão Automática de Ingredientes:** Quando um item é vendido, o sistema verifica se ele possui receita cadastrada na tabela `receitas`:
    *   *Caso Exista Receita:* O sistema calcula os componentes filhos exigidos, multiplica pela quantidade vendida e abate **cada ingrediente individualmente** do estoque (Ex: Venda de "Bandeja de Morangos" ➔ Abate caixa plástica + fita adesiva + morangos in natura do estoque).
    *   *Caso Não Exista Receita:* Abate a quantidade diretamente do item vendido no estoque.
*   **Integração Financeira Direta:** Toda venda registrada gera de forma automatizada um lançamento do tipo **`RECEBER`** na tabela `financeiro_transacoes`, usando o cálculo de `quantidade * valor_unitario`, garantindo o DRE atualizado.

---

### MÓDULO E: COMPRAS E ENTRADA DE PRODUTOS (`ComprasScreen.js`)
*   **Cadastro Rápido On-The-Fly:** Se o usuário tentar dar entrada em uma compra de um insumo que ainda não existe no catálogo, a tela de Compras permite criar o cadastro simplificado do item diretamente, sem ter que sair da tela atual.
*   **Entrada Física e Financeira Automática:** Ao salvar uma compra:
    1.  O sistema roda `atualizarEstoque(produto, quantidade)` para adicionar as unidades fisicamente ao estoque.
    2.  Gera automaticamente um lançamento do tipo **`PAGAR`** na tabela `financeiro_transacoes`, alimentando o fluxo de caixa de saídas.

---

## 🔒 3. CREDENCIAIS E PARAMETRIZAÇÃO DE TESTE
*   **Conta Master Padrão (Sem Bloqueio):**
    *   `Usuário:` **`ADMIN`**
    *   `Senha:` **`1234`**
    *   `Nível:` **`ADM`** (Acesso total às telas administrativas, tabelas de controle e auditoria do app).
*   *Nota:* Esta credencial é recriada no banco de dados local por scripts de manutenção e limpeza para garantir facilidade de simulações em ambiente de desenvolvimento.

---

## 📝 4. REGISTRO DE ALTERAÇÕES DE INTELIGÊNCIA (CHANGE LEDGER)
Esta tabela acompanha cronologicamente todas as regras e módulos que nós refinamos, protegendo o histórico do projeto contra apagamentos.

| Data | Responsável | Ação Realizada | Arquivos Afetados | Impacto Técnico |
| :--- | :--- | :--- | :--- | :--- |
| **17/05/2026** | **Antigravity** | Criação do Living Brain Map e Consolidação dos Módulos | `AGROGB_LIVING_BRAIN_MAP.md` | **Marco Inicial de Proteção de Memória Eterna do AgroGB.** |
| **17/05/2026** | **Antigravity** | Restauração da Lógica de Adubação, Carrinho, Caderno e Estoque | `AdubacaoFormScreen.js`, `AdubacaoDetailScreen.js`, `database.js` | Restabelecimento completo das lógicas de NPK e baixas automáticas de insumos. |
| **17/05/2026** | **Antigravity** | Zeramento das Bases Supabase e SQLite Local | `clean_db.py` (Scratch) | Esvaziamento de 100% de tabelas lixo, mantendo apenas conta ADMIN/1234 ativa. |

---
> [!TIP]
> **PARA NOVAS ALTERAÇÕES:** Mantenha sempre a tabela acima atualizada e insira novas regras de negócio conforme elas forem descobertas ou criadas no código!
