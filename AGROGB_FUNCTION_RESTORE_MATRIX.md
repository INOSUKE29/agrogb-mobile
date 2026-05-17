# AGROGB MOBILE - MATRIZ DE RESTAURAÇÃO DE FUNCIONALIDADES

Esta matriz mapeia de forma detalhada e técnica cada regra de negócio ou função encontrada nos arquivos clássicos de `mobile_app`, comparando-os com o projeto atual em `agrogb-mobile-main`, informando seu status de integração e a estratégia exata utilizada para sua reincorporação funcional.

---

## MATRIZ FORENSE DE COMPARAÇÃO DE FUNÇÕES

| Funcionalidade / Função | Arquivo Clássico | Arquivo Atual | Status | Regras de Negócio & Lógica | Tabelas Envolvidas | Serviços Envolvidos | Estratégia de Restauração / Merge |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| **Baixa Automática de Insumos** | `PlanoAdubacaoScreen.js` | `AdubacaoDetailScreen.js` | **Implementada** | Ao marcar plano como realizado, percorre a receita técnica e abate o estoque local. | `production_fertilization_items`, `estoque`, `movimentacao_estoque` | `EstoqueService`, `database.js` | loop de transação SQLite adicionado ao `handleApply` de forma síncrona. |
| **Lançamento no Caderno Agrícola** | `PlanoAdubacaoScreen.js` | `AdubacaoDetailScreen.js` | **Implementada** | Grava log descritivo automático da aplicação de nutrientes no livro de notas do produtor. | `caderno_notas` | `database.js` (executeQuery) | Inserção automática de string formatada em `caderno_notas` pós-baixa de estoque. |
| **Carrinho de Receita Técnica** | `AdubacaoFormScreen.js` | `AdubacaoFormScreen.js` | **Implementada** | Permite selecionar produtos do estoque real e digitar a dosagem/dose antes de salvar. | `production_fertilization_items`, `estoque` | `database.js` (getEstoque) | Adicionado modal com `FlatList` de estoque e campo numérico de quantidade à tela atual. |
| **Estorno de Movimentações** | `ComprasScreen.js`, `VendasScreen.js` | `CompraService.js`, `VendaService.js` | **Implementada** | Excluir uma compra ou venda realiza o estorno (oposição) físico do estoque. | `compras`, `vendas`, `estoque` | `EstoqueService` | Chamada ao método estático `EstoqueService.movimentar` com quantidade negativa/positiva no soft-delete. |
| **Auditoria de Movimentação** | `StockService.js` | `EstoqueService.js` | **Implementada** | Toda movimentação física no estoque gera uma linha na tabela de auditoria histórica. | `movimentacao_estoque` | `EstoqueService` | Escrita direta com UUID em `movimentacao_estoque` para rastreabilidade de auditorias. |
| **Cálculo de NPK Dinâmico** | `PlanoAdubacaoScreen.js` | `PlanoAdubacaoScreen.js` | **Parcial** | Soma percentual de N-P-K dos insumos da receita multiplicados pela dosagem aplicada. | `production_fertilization_items` | `FertilizationService` | Mapeado no plano de reconstrução para inserção de colunas de percentual de N-P-K na tabela de insumos. |
| **Geração de Lançamentos Financeiros** | `PlanoAdubacaoScreen.js` | `CompraService.js`, `VendaService.js` | **Parcial** | Compras e vendas geram automaticamente títulos de Contas a Pagar/Receber pendentes. | `financeiro_transacoes` | `FinanceService` | Desenvolvido no plano de merge os ganchos automáticos de insert pós-confirmação da operação. |
| **Cálculo de Custo por Hectare** | `PlanoAdubacaoScreen.js` | `PlanoAdubacaoScreen.js` | **Parcial** | Divide o valor financeiro gasto na receita técnica pela área total (ha) cadastrada no talhão. | `custos`, `talhoes` | `FinanceService` | Mapeado para exibição dinâmica no card de resumo no próximo build do dashboard. |

---

## LEGENDA DE STATUS E IMPACTO OPERACIONAL

*   **Implementada:** Funcionalidade já integrada com sucesso à versão v7.0 moderna e testada no banco SQLite.
*   **Parcial:** Lógica mapeada e com base estrutural no banco criada, com etapas de exibição adicionais agendadas.
*   **Missing (Ausente):** Funcionalidade não portada que foi identificada como dispensável ou substituída por lógica mais moderna.

Esta matriz garante que **nenhuma regra de negócio crítica** desenvolvida desde fevereiro de 2026 seja descartada ou esquecida na versão final do app.
