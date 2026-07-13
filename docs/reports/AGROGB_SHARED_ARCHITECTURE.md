# AGROGB SHARED ARCHITECTURE (V7.0)
## MOBILE <=> DESKTOP SYNC PROTOCOL

## 1. DATA MODEL (ESQUEMA COMPARTILHADO)
Para garantir a sincronização sem conflitos entre AgroGB Desktop e Mobile, as seguintes tabelas seguem o padrão de **UUID (Universal Unique Identifier)** como chave primária de sincronização.

### 1.1. Core Tables
*   **`usuarios`**: Gestão de acessos.
    *   *Mapeamento*: `uuid` (Mobile) <=> `auth.users.id` (Supabase) <=> `id_global` (Desktop).
*   **`colheitas`**: Registros de produção.
*   **`vendas` / `compras`**: Fluxo financeiro.
*   **`estoque`**: Saldo consolidado (Sincronização via Pull-Only no Mobile para evitar inconsistência de saldo).

## 2. PROTOCOLO DE SINCRONIZAÇÃO
O AgroGB Mobile utiliza um motor de sincronização bidirecional em tempo real:

1.  **PUSH (Local -> Cloud)**:
    *   Registros criados offline recebem `sync_status = 0`.
    *   O `SyncService` busca registros pendentes e realiza `upsert` no Supabase via `uuid`.
    *   Após sucesso, `sync_status` é alterado para `1`.

2.  **PULL (Cloud -> Local)**:
    *   O app consulta o Supabase por registros onde `last_updated > MAX(last_updated_local)`.
    *   Novos dados são integrados via `INSERT OR REPLACE`.

## 3. SEGURANÇA E AUDITORIA
*   **Audit Trail**: Toda operação de escrita (INSERT/UPDATE/DELETE) gera um log automático na tabela `audit_logs` local, que é sincronizada para a nuvem.
*   **Soft Delete**: Registros deletados não são removidos fisicamente, mas marcados com `is_deleted = 1` para garantir a propagação da deleção entre plataformas.

## 4. PADRÕES DE CODIFICAÇÃO
*   **Text Case**: Todas as strings de identificação (Nomes de produtos, Talhões, Clientes) são convertidas para `UPPERCASE` antes da persistência para evitar duplicidade por erro de digitação.
*   **Date Format**: Padrão ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`).

## 5. INTEGRAÇÃO COM IA
O AgroGB Mobile v7.0 está preparado para consumir o motor de IA do AgroGB Desktop através do `AIService`, permitindo análises preditivas de produtividade diretamente no campo.

---
*Documentação Técnica de Paridade de Arquitetura - 2026*
