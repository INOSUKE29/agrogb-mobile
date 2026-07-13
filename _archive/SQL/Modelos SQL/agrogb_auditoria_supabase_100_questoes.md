# AgroGB: Auditoria Mestra Supabase & PostgreSQL (100 Questões)

> [!IMPORTANT]
> **Como usar no NotebookLM:** Faça o upload deste arquivo `.md` como uma das suas **Fontes**. Depois, no chat, peça algo como: *"No documento 'Auditoria Mestra 100 Questões', atue como um DBA sênior da Supabase e responda às questões da categoria [Nome da Categoria] focando em performance e segurança extrema."*

---

## 1. Auth, GoTrue e Multi-Tenancy JWT (1-10)
1. Qual o tamanho máximo seguro de bytes em um token JWT gerado pelo GoTrue antes de causar lentidão no PostgREST ou erros de `Header Too Large` no Cloudflare?
2. Ao injetar `organization_id` no JWT via Auth Hook, como lidar com usuários que pertencem a múltiplas organizações (Muitos-para-Muitos) de forma performática no `app_metadata`?
3. Se um Auth Hook falhar silenciosamente (timeout no Postgres), o Supabase bloqueia o login do usuário ou retorna o token sem as claims customizadas?
4. Como revogar instantaneamente uma sessão JWT validada no Edge (sem bater no banco) em caso de emergência ou quebra de segurança do tenant?
5. Existe diferença mensurável de CPU entre o parser de JSON do PostgreSQL para avaliar `(auth.jwt() -> 'app_metadata' ->> 'org_id')` vs o uso de uma função `auth.jwt_org()` `STABLE`?
6. Como o Supabase Auth lida com cache de metadados? Atualizar o banco (`profiles.role`) exige forçar logout ou o token se renova automaticamente com as novas regras?
7. Configuração de Session Expiry: Para o aplicativo móvel offline, qual o tempo ideal de expiração de refresh tokens sem degradar a experiência em zonas sem cobertura 4G?
8. No Supabase, o uso de MFA (AAL2) no login adiciona qual overhead de latência para a criação da sessão no servidor GoTrue local vs Cloud?
9. Bypass Seguro: Qual é a arquitetura correta no Supabase para um "Super Admin" ver dados de todas as organizações usando RLS dinâmico sem usar a temida `service_role` key?
10. Ataques de Força Bruta: Quais as proteções nativas contra rate-limit no endpoint de login e como blindar ataques específicos contra um `organization_id`?

## 2. Row-Level Security (RLS) Avançado (11-20)
11. `EXPLAIN ANALYZE` sobre políticas RLS: Como descobrir se o Planner do Postgres está rodando o RLS como `Index Scan` ou `Seq Scan` invisivelmente?
12. Políticas `SELECT` vs `ALL`: Escrever uma única política `FOR ALL` é computacionalmente pior do que escrever quatro políticas separadas (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) em tabelas Multi-Tenant?
13. RLS e Constraints de Unique: Se uma regra RLS esconde a linha de outro Tenant, a criação de um índice `UNIQUE` global pode revelar a existência daquela linha (vazamento de informação) se houver violação da constraint? Como mitigar?
14. Funções `SECURITY DEFINER`: Qual a diretriz oficial para impedir a vulnerabilidade "Search Path Injection" ao criar funções que operam com privilégio de Admin no banco?
15. Vistas (Views) e RLS: Por padrão, o PostgreSQL executa views com a permissão do criador (bypass RLS). Qual o impacto de setar `security_invoker = true` sobre views agregadas pesadas?
16. Política de `INSERT` com subquery: É possível (e seguro) validar o `organization_id` de um registro inserido fazendo um join com a tabela de permissões no `WITH CHECK`?
17. Limites lógicos de Políticas RLS: Acima de quantas lógicas `OR` aninhadas uma política RLS começa a desabilitar otimizações de índices do PostgreSQL?
18. Como monitorar no Supabase/pg_stat_statements o tempo de CPU exclusivamente gasto avaliando as regras RLS nas conexões autenticadas?
19. Performance do `auth.uid()`: Para operações em lote (Batch Insert via REST), o `auth.uid()` é reavaliado a cada linha inserida ou o PostgreSQL faz um "cache" para o *statement* inteiro?
20. O comando `TRUNCATE` ignora o RLS. Se habilitarmos RLS para Agrônomos, devemos bloquear as permissões globais de `TRUNCATE` na tabela explicitamente ou o RLS de `DELETE` resolve?

## 3. Storage Isolado e Traversal Prevention (21-30)
21. Por que `storage.foldername(name)` devolve `text[]`? Quais são as implicações disso se o arquivo estiver na raiz (`[]` vs `[1] = null`) e travar o RLS?
22. Se fizermos o parse `(storage.foldername(name))[1] = auth.jwt_org()::text`, como impedir que um Agrônomo crie pastas filhas simulando a estrutura (`orgA/orgB/laudo.pdf`) para bular políticas de leitura superior?
23. Qual é o limite de tamanho e inodes suportado por cada Bucket do Supabase Storage no plano AWS EC2 padrão?
24. Resizable Images nativo do Supabase consome cota de recursos de Banco ou do Edge? Gerar miniaturas do Bucket é seguro sob RLS rígido?
25. Upload de grandes laudos (PDFs de 100MB): Ao usar TUS Protocol no Supabase, as políticas RLS rodam a cada "chunk" enviado ou só no fechamento do arquivo?
26. Quando um registro no banco (ex: `laudo`) é deletado, criar uma Trigger que usa a extensão `http` ou pg_net para fazer o webhook de deletar o arquivo no Storage causa locks na transação do banco?
27. Downloads autenticados: Gerar URLs assinadas (Signed URLs) é mais escalável do que forçar o frontend a enviar cabeçalhos HTTP com o JWT via RLS Storage direto?
28. Buckets Privados vs Públicos: Qual o real isolamento lógico do S3 por trás do Supabase que separa a rede externa da interna nos Buckets privados?
29. Criptografia no repouso: Os buckets do Supabase aplicam AES-256 no banco de dados S3. É possível fornecer uma chave própria (Customer Managed Keys) para criptografar documentos fiscais AgroGB?
30. Prevenção de Path Traversal na API REST: Há alguma configuração oculta no Nginx do Supabase que impeça ataques `../` antes mesmo de baterem nas RLS de Storage?

## 4. PostGIS e Alta Performance Geográfica (31-40)
31. `Geometry(MultiPolygon, 4326)` vs `Geography`: A conversão em tempo de execução para cálculos de área esférica afeta quantas transações por segundo em instâncias ARM vs AMD no Supabase?
32. Índice de Árvore (GIST Index): O PostGIS GIST cobre `Geography` e `Geometry` da mesma forma? Qual a configuração de "fillfactor" recomendada para talhões (fields) que são alterados com muita frequência?
33. Correção de Geometria: Quando aplicar `ST_MakeValid` causa a criação de artefatos indesejados (`GeometryCollections`). Qual o padrão `CASE WHEN` para devolver apenas MultiPolygons após correção?
34. Spatial Joins Rápidos: Ao checar interseções de localização de trator com fazendas via `ST_Intersects`, como forçar o Postgres a utilizar Bounding Box (`&&` operator) primeiramente?
35. GeoJSON pelo PostgREST: Chamar `ST_AsGeoJSON` como uma "computed column" é processado pela CPU do Postgres antes de ir pra rede. Compensa fazer no banco ou deixar o React/Flutter gerar o GeoJSON do lado do cliente lendo WKB?
36. Simplificação Visual: Renderizar `ST_SimplifyPreserveTopology(boundary, 0.001)` consome muita RAM. Como usar Caches Geográficos ou criar uma coluna extra para a geometria simplificada de uso do frontend?
37. Topologia Real: Se as bordas de dois talhões se sobrepõem e queremos alertar o Agrônomo, qual é a query de "Overlaps" com `ST_Relate` mais barata para o banco rodar em tempo real?
38. PostGIS e Tabelas Particionadas: Como o `pg_partman` lida com índices GIST em tabelas filhas de dados de IoT que incluem posições geográficas de colheitadeiras ao longo do tempo?
39. Geohashing: O uso de colunas geradas (`GENERATED ALWAYS`) com `ST_GeoHash` ajuda na renderização de mapas temáticos massivos no Supabase mais rápido do que GIST Puro?
40. Backup Geoespacial: `pg_dump` de bancos com dados PostGIS massivos tem limitações na restauração em outras instâncias AWS EC2 do Supabase sem perder os `spatial_ref_sys`?

## 5. IoT, Particionamento e Big Data (pg_partman) (41-50)
41. Time-Series: O limite do `pg_partman` sem o TimescaleDB é IOPS e tabelas filhas. Quantas partições ativas por tabela o PostgreSQL versão 15 do Supabase aguenta antes de perder velocidade de planejamento de queries?
42. Retenção IoT: Configurar `retention_keep_table = false` no `pg_partman` dá Drop físico na tabela. Existe risco de "Deadlocks" em queries analíticas do Dashboard ocorrendo ao mesmo tempo do Drop noturno pelo `pg_cron`?
43. Upsert e Particionamento: A sintaxe `ON CONFLICT DO UPDATE` é nativamente suportada na tabela pai particionada no PostgreSQL sem gerar erros complexos de roteamento (routing table constraints)?
44. Configuração de `autovacuum` nas partições: É recomendável desativar o autovacuum para partições muito antigas (read-only) geradas pelo partman, garantindo menor varredura no disco? Como automatizar isso?
45. Ingestão de Lote (Batch Inserts): 10 tratores mandam 10 mil leituras juntas. O REST do PostgREST usando `prefer: return=minimal` sustenta inserções massivas de 50.000 rows/s sem esgotar RAM no Supabase?
46. Modelagem Estreita vs Larga: É mais rápido no IoT ter 1 coluna JSONB (`payload_sensores`) ou 30 colunas de floats (umidade, temp, vento, etc) sabendo que teremos milhões de linhas por mês?
47. Índices BRIN (Block Range Index): Para timeseries ordenadas por data (`reading_time`), o índice BRIN economiza giga-bytes no disco do Supabase. Qual o "pages_per_range" ideal para leituras de IoT por Mês?
48. Cold Storage: Como exportar as partições com mais de 5 anos do PostgreSQL para o S3 (Supabase Storage CSV) de forma automatizada via Functions no banco, antes delas serem extintas pelo cron?
49. Rollup em tempo real: Como criar Continuous Aggregates puramente no PostgreSQL (sem Timescale) usando Triggers Incrementais (`AFTER INSERT`) para calcular médias horárias de sensores de solo?
50. Crash Loop do Partman: Se o `pg_cron` falhar em rodar o script do partman por 3 meses (banco desligado ou travado) e as partições pararem de existir, os novos Inserts irão para onde (Default Partition) ou gerarão exceção fatal no IoT?

## 6. Sincronização Offline-First e Concorrência (51-60)
51. Fila Síncrona vs Assíncrona: Inserir a fila do SQLite (`mobile_sync_events`) com uma RPC no Supabase que processa imediatamente na mesma transação ou usar `NOTIFY`/Edge Functions em background?
52. Throttling de Drenagem: Se 5.000 devices conectam no mesmo momento e mandam payloads de 2MB, como proteger a RAM da instância usando "Leaky Bucket" limiters ou Advisory Locks de transação do PG?
53. Event Sourcing Puro: No lugar de dar updates nas fazendas, devemos ter tabelas apenas Append-Only (`events`). O motor Materialized View do Postgres consegue reproduzir o estado final do sistema Rápido o suficiente para o Dashboard em tempo real?
54. Resolução de Conflitos: Se 2 usuários offline alteram o status de um Insumo. O Timestamp win na hora do sync é blindado usando a constraint `WHERE record_updated_at < new_updated_at` nativamente. E como retornar para o frontend que "perdeu" a batalha?
55. Garbage Collection do Frontend: Após processar a `mobile_sync_events`, devemos dar `DELETE` físico nas linhas no Postgres para economizar disco ou adicionar `status='PROCESSED'` e jogar em partições frias para auditoria?
56. CRDTs Simplificados: Podemos imitar CRDTs usando a função `jsonb_deep_merge` customizada dentro do banco de dados na hora que a RPC consome o payload da fila Offline?
57. Deadlocks na Fila: Se a função de processamento da fila tentar atualizar a tabela `products` e `farms` em ordens trocadas para usuários diferentes simultaneamente, ocorrerá lock cíclico. Como ordenar alfabeticamente atualizações na RPC?
58. Uso de UUID v7 (Time Sorted) no SQLite do Mobile garante inserção B-Tree ótima quando a fila descarrega no PostgREST, reduzindo fragmentation?
59. Versionamento de Schema (GraphQL vs REST): O celular offline ficou sem atualizar por 1 ano. Como tratar no Supabase o payload da fila se as colunas obrigatórias do banco já mudaram? 
60. Como a ferramenta PGlite/WatermelonDB (SQLite na Web/Mobile) lida com replicação P2P nativa sem precisar da nossa própria arquitetura `mobile_sync_events` e como ela se integra ao Supabase?

## 7. Performance de Desktop (Python) e Pooling (61-70)
61. Modo "Session" vs "Transaction" do PgBouncer/Supavisor: Qual é estritamente obrigatório no Python (`supabase-py`) rodando com milhares de threads simultâneas em PCs Windows de campo?
62. Prepared Statements (`PREPARE`): Incompatibilidade clássica com PgBouncer no modo Transação. O Supavisor resolve isso nativamente ou o Python perderá cache de query execution plan o tempo todo?
63. Latência do JWT no Python: Usar a API REST (Supabase Client Py) passa por todo o ecossistema (Cloudflare, Kong, PostgREST, Postgres). Qual a latência adicional comparada com conectar o Python diretamente via psycopg2 TCP porta 5432 / 6543 usando senha direta?
64. Supabase Realtime no Flet (Python): Existe limitação para suportar Websockets e canais de Presence no Python nativo frente à versão robusta do Javascript JS SDK?
65. O Python gerando gráficos de produtividade precisa baixar 2GB de dados IoT? Ou qual a arquitetura de RPC para forçar a GPU/CPU do PostgreSQL a montar os agregados e devolver apenas 2Kb de arrays numéricos?
66. Paralelismo de Queries Analíticas (`max_parallel_workers`): Como ativar queries massivas paralelas (CPU multi-core) para o Dashboard da Diretoria no Postgres sem esgotar workers de queries transacionais críticas (Mobile sync)?
67. O uso do protocolo HTTP/2 ou HTTP/3 (QUIC) suportado no Edge Network do Supabase acelera de forma perceptível conexões instáveis de internet rural usadas no Desktop?
68. Em requisições REST massivas, enviar headers `Prefer: count=exact` obriga o banco a rodar 2 vezes (um Full Seq Scan só para a contagem). Como evitar esse erro estrutural de ORMs e APIs?
69. `LIMIT` e `OFFSET` com Performance: Offset alto mata o banco. Qual é o padrão de "Keyset Pagination" (Cursor) a ser usado pelo Python (via ID > last_id) no Supabase?
70. Proteção contra OOM (Out Of Memory): O Dashboard puxa tudo. Como limitar os `shared_buffers` e a `work_mem` para queries pesadas de Desktop para impedir que a AWS crashe a instância reiniciando o Docker do Supabase?

## 8. Views Materializadas, Triggers e Hooks de Rede (71-80)
71. Bloqueios de Concorrência: `REFRESH MATERIALIZED VIEW CONCURRENTLY` exige tabelas base quietas? Inserções IoT travam se a View estiver sendo refrescada há 3 minutos?
72. Triggers em Cascata: Triggers em `BEFORE UPDATE` afetam consideravelmente queries via Supabase REST. Como debugar o tempo real gasto por triggers usando `pg_stat_statements`?
73. Diferença entre "Generated Columns" (`GENERATED ALWAYS`) vs "Triggers" de cálculo de coluna e "Views Materializadas". Qual gasta menos IOPS de disco?
74. Webhooks Nativos vs `pg_net`: Disparar Webhooks no banco com Triggers (para chamar a IA ou APIs externas do Agro) é mais seguro usando `pg_net` (Assíncrono) ou a extensão `http` (Síncrona)?
75. Carga Externa: O Supabase Wrappers (Foreign Data Wrappers) seria ideal para consultar o Overture Maps e Climatempo diretamente do SQL sem passar pelo Python? Qual a velocidade disso para Join?
76. Rollups Dimensionais (CUBE e ROLLUP): Gerar Dashboards de faturamento e custos agrícolas usando o operador CUBE do PostgreSQL dentro de Views tira quanto peso do framework front-end?
77. `UNLOGGED TABLES`: O uso de tabelas sem write-ahead log (WAL) para receber dados efêmeros da fila do Mobile e só gravar definitivamente quando processado vale o risco se o container do banco reiniciar?
78. Supabase Cron (`pg_cron`) Reliability: Se houver picos de CPU, os jobs do `pg_cron` entram em timeout silencioso ou rodam em fila assim que aliviar?
79. Como estruturar a arquitetura para evitar falhas do tipo `idle in transaction` causados por Hooks de rede em triggers lentos?
80. Extensões C personalizadas (PL/V8, PL/Rust): Qual a segurança e possibilidade real de se programar lógicas de Agro diretamente no banco usando Rust ou Javascript (PLV8) via dashboard do Supabase?

## 9. Manutenção, Diagnósticos e Tunning Fino (81-90)
81. `VACUUM` Agressivo (Bloat removal): O Supabase tem autovacuum ativo, mas tabelas altamente engajadas como `mobile_sync_events` criarão milhares de Dead Tuples (`pg_stat_user_tables`). Qual é a query de alerta máxima?
82. Índices B-Tree Gulosos: Usar B-Tree vs HASH index vs GIN Index para queries JSONB no Payload da Fila. Qual consome menos megabytes de RAM da instância Base do Supabase?
83. Uso de `EXPLAIN (ANALYZE, BUFFERS)` para diagnosticar se a query do Dashboard hitou o "Shared Hit" (RAM) ou o "Read" (Disco). Quantos Mbs de buffer shareds a AWS nos dá no Pro Plan?
84. Alertas Automáticos: Qual a via oficial do Supabase para gerar e-mails ou Webhooks do sistema (Exemplo: Alerta de disco enchendo 90%, Alta RAM)?
85. Log Analítico do Kong (API Gateway): No painel do Supabase, como extrair os Top 10 IP's que mais dão chamadas em nossa RLS e estouram a CPU via chamadas anônimas?
86. `pg_stat_statements` reset: É seguro rodar o reset da `pg_stat_statements` mensalmente em produção para focar apenas nas queries lentas que nasceram após o último deploy de banco?
87. O que fazer quando uma migração local via Supabase CLI "supa db push" falha no meio e o banco de Produção fica num estado inconsistente? Tem Rollback Transacional no CLI?
88. Qual o custo IOPS e CPU de usar criptografia de coluna (TDE - Transparent Data Encryption pgsodium) para CPFs e informações financeiras dos Agrônomos no AgroGB?
89. Como blindar (Hardening) o banco PostgreSQL do Supabase contra ataques de força bruta no Supavisor externo sem limitar ips (IP Allow-List), permitindo acesso rural?
90. Tuning de Custo/Benefício: Upgrade de instância vs Réplica Geográfica (Read Replica). Qual abaixa mais a latência no Brasil (Supabase São Paulo `sa-east-1`) se temos muito `SELECT` analítico?

## 10. Casos Extremos, Disasters e Edge Computing (91-100)
91. Edge Functions em Deno vs Supabase Banco de Dados. A latência de invocar Deno Functions da Supabase chamando Postgres localmente (Direct Connection) é sub 10ms?
92. Se deletarmos a conta de uma organização (`organization_id`), qual a técnica arquitetural perfeita para fazer "Soft Delete" (arquivamento inativo) de 100 mil registros sem travar RLS?
93. Point In Time Recovery (PITR) no Supabase. O banco AgroGB perdeu dados às 14:02. Restaurar para 14:00 causará perda da fila de sync local de milhões de apps nos tratores que subiram logs às 14:01? Como tratar essa janela na restauração?
94. Local Development (Docker do Supabase CLI): A emulação do `pg_partman` e extensões de PostGIS em MacOS ARM M1 roda 100% fiel ao Cloud para debugar problemas pesados de Views e Triggers localmente antes de commitar?
95. Webhooks Timeout na AWS Lambda: Se o webhook do banco disparar e a resposta do servidor externo der Timeout. O banco de dados Supabase retenta sozinho via pgboss nativo?
96. O uso contínuo do comando `VACUUM FULL` como crontab para compactação de disco noturno causará exclusão (Exclusive Locks) e derrubará a API REST inteira durante sua execução? Qual a melhor alternativa (`pg_repack`)?
97. O que é o "Burst IOPS" da AWS na camada básica da Supabase e como saber se a arquitetura de sincronização do nosso App Rural estourou a cota e parou o banco num feriado prolongado?
98. Arquiteturas de Shadow Tables e Change Data Capture (CDC): Como o Supabase envia eventos WebSocket para o Flet. O `wal2json` no `pg_logical` está habilitado com qual limite máximo de eventos no Replication Slot para não estourar o disco se o client websockets (tratores) estiverem offline?
99. Prevenção de corrupção Silent (Data rot): Qual extensão no PostgreSQL (Page Checksums `data_checksums = on`) verifica corrompimento a nível de disco devido a falhas da AWS infra e avisa o DBA?
100. Migração Pós-Sucesso: Se AgroGB atingir 5 Terabytes de disco, quais ferramentas migratórias (Zero Downtime Logical Replication) a Supabase oferece para extrairmos os bancos `agrogb_private` sem bloquear novos acessos dos clientes?
