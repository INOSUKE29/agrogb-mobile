# PLANO DE APERFEIÇOAMENTO DE PRODUTIVIDADE: SINCRONIZAÇÃO OFFLINE-FIRST (AGROGB DIAMOND PRO)

Este documento traça as diretrizes técnicas e o plano estratégico para a próxima fase evolutiva do AgroGB Mobile v7.0: a implementação de uma arquitetura **Offline-First com Sincronização Incremental Bidirecional**.

---

## 1. Visão Geral da Arquitetura Offline-First

Para maximizar a produtividade do produtor rural em áreas sem conectividade (zonas rurais remotas), o aplicativo deve operar com **autonomia local absoluta**. A gravação local em SQLite serve como a única fonte da verdade em tempo de execução, e uma camada de sincronização em segundo plano cuida da comunicação com os servidores em nuvem (Supabase/Desktop API).

```
                      [ INTERFACE DO USUÁRIO (MOBILE UI) ]
                                      │
                                      ▼
                      [ CAMADA LOCAL DE BANCO (SQLite) ]
                                      │
                                      ▼
             [ FILA DE SAÍDA DE EVENTOS (Transaction Outbox) ]
                                      │
                                      ├─(Sem Conexão)──> [ Retém na Fila Local ]
                                      │
                                      └─(Com Conexão)──> [ Sincronizador Bidirecional ]
                                                                 ▲
                                                                 │ (REST / Delta API)
                                                                 ▼
                                                     [ SUPABASE / CLOUD BACKEND ]
```

---

## 2. Padrão Transaction Outbox (Fila de Postagem)

Para garantir resiliência e evitar perda de dados operacionais, todo lançamento de venda, compra ou plantio criará simultaneamente um evento na tabela de fila local (`sync_outbox`):

```sql
CREATE TABLE sync_outbox (
    uuid TEXT PRIMARY KEY,
    tabela TEXT NOT NULL,         -- 'vendas', 'compras', 'plantio', etc.
    operacao TEXT NOT NULL,       -- 'INSERT', 'UPDATE', 'DELETE'
    dados_json TEXT NOT NULL,     -- Payload completo serializado em JSON
    criado_em TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING' -- 'PENDING', 'SYNCED', 'FAILED'
);
```

### Protocolo de Execução da Fila:
1.  **Garantia Transacional:** A gravação na tabela operacional e na tabela `sync_outbox` ocorre dentro de uma única transação SQLite (`db.transaction`). Se uma falhar, ambas sofrem rollback automático.
2.  **Monitoramento de Conectividade:** Um serviço escuta as mudanças de rede (`NetInfo` do Expo). Assim que a conexão de internet é detectada como ativa (`wifi` ou `celular`), a fila de saída é disparada em lotes (`batches`).

---

## 3. Estratégia de Resolução de Conflitos (Conflict Resolution)

Em um ambiente distribuído com múltiplos dispositivos de campo alterando registros simultaneamente, conflitos são inevitáveis. Definimos o protocolo de resolução baseando-se em regras de negócio claras:

*   **Última Gravação Prevalece (Last-Write-Wins - LWW):** Baseado no carimbo de data/hora universal UTC (`last_updated`). O registro com o timestamp mais recente substitui os anteriores na nuvem.
*   **Merge Baseado em Campos (Field-Level Merge):** Se dois usuários alterarem campos diferentes de um mesmo cliente (ex: João alterou o telefone e Maria alterou o endereço), o servidor funde as alterações de forma transparente.
*   **Conflito Financeiro Estrito:** Alterações em transações financeiras geradas por vendas ou compras marcadas como reconciliadas no desktop **não** podem ser sobrescritas pelo app móvel. Nesse caso, a versão da nuvem sempre prevalece e um alerta de divergência é enviado ao painel do usuário.

---

## 4. Roteiro de Implementação (Roadmap)

### Fase 1: Rastreamento de Alterações (Deltas) — *Prazo: 2 Semanas*
*   Criação da tabela `sync_outbox` e modificação das queries operacionais.
*   Adição da coluna `last_updated` em todas as tabelas locais (clientes, produtos, talhões, vendas, compras, plantios).

### Fase 2: Motor de Sincronização em Background — *Prazo: 3 Semanas*
*   Implementação do sincronizador periódico em background utilizando `expo-task-manager` e `expo-background-fetch`.
*   Desenvolvimento de rotas de Delta API no backend para enviar apenas registros criados ou modificados após o último timestamp de sincronização do dispositivo móvel.

### Fase 3: Validação, Resiliência e Logs — *Prazo: 2 Semanas*
*   Construção de interface visual de monitoramento de sincronização para o usuário (indicador visual de "Nuvem Sincronizada" ou "Lançamentos Pendentes").
*   Mecanismo de tratamento e repetição exponencial em caso de falha de conexão no meio da transferência de lote.
