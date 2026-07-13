**PROMPT PARA NOTEBOOKLM (Copie e cole no chat):**

Baseado nos documentos fornecidos sobre a nossa arquitetura AgroGB (Supabase, PostgreSQL, JWT Multi-Tenant e Offline-First), atue como um Arquiteto de Software Nível Staff e me dê soluções técnicas diretas para os seguintes 5 gargalos críticos:

1. **Segurança (JWT e Storage):** Qual o risco de injetar roles no `app_metadata` do JWT via Auth Hook? Na RLS do Storage, usar `(storage.foldername(name))[1]` para forçar isolamento Multi-Tenant protege contra "Traversal Attacks"?
2. **IoT e Particionamento:** Para a tabela `sensor_data` com milhões de linhas mensais usando `pg_partman`, quais devem ser as configurações exatas do `autovacuum` para evitar que o drop de partições (retenção de 5 anos via pg_cron) trave as escritas da base?
3. **Fila Offline-First:** 50 tratores recuperam o sinal 4G no mesmo segundo. Qual a melhor técnica (Advisory Locks, Webhooks ou CRON) para processar os payloads JSON da `mobile_sync_events` sem causar deadlocks ou "Race Conditions" no banco real?
4. **PostGIS (Geoespacial):** Em `ST_Area` e `ST_MakeValid` com polígonos pesados (`MultiPolygon`), a correção deve rodar via Trigger no banco ou Edge Function? Como usar índices GIST sem cair em *Table Scans*?
5. **Pooling e Views:** Qual modo do Supavisor (Transaction/Session) utilizar no Python/Flet para 1.000 chamadas simultâneas? E de quanto em quanto tempo é seguro rodar `REFRESH MATERIALIZED VIEW CONCURRENTLY` para o nosso Dashboard sem matar a CPU do servidor?
