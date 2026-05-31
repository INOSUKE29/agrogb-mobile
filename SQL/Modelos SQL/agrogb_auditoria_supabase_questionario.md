# Dossiê de Auditoria Nível PhD: Arquitetura Supabase & PostgreSQL (AgroGB)

> [!IMPORTANT]
> **Objetivo da Auditoria:** Extrair o máximo de inteligência do NotebookLM e da IA do Supabase. Este questionário de 50 perguntas investiga até as entranhas do PostgreSQL, cobrindo Segurança, Multi-Tenancy, IoT, Sync Offline e Geoespacial.

---

## 🏛️ Capítulo 1: Core Architecture & Multi-Tenancy
1. **Design Isolado:** Na modelagem Multi-Tenant, qual o custo de performance de propagar o `organization_id` para *todas* as tabelas filhas (ex: `fields`, `plantings`, `recommendations`) em vez de fazer joins com a tabela mãe (`farms`)?
2. **UUID vs BIGINT:** Considerando inserções massivas de IoT e Sync Mobile, o uso de `uuid_generate_v4()` causa mais degradação de índices B-Tree no longo prazo comparado com chaves primárias sequenciais BIGINT? O UUIDv7 seria mais recomendado neste cenário Supabase?
3. **Foreign Key Locking:** Ao executar deleções em cascata (`ON DELETE CASCADE`) na tabela `organizations`, como evitar bloqueios pesados na base de dados inteira (table locks) quando existem milhões de registros dependentes de IoT e Estoque?
4. **Bypass RLS:** Em scripts de manutenção do servidor backend, é mais seguro utilizar uma chave `service_role` (que ignora todo RLS) ou criar um super-usuário via banco com limitações geográficas/IP específicas?
5. **Schema Público vs Privado:** Manter todas as nossas tabelas operacionais no schema `public` expõe o banco de forma perigosa ao PostgREST? Que tabelas deveriam ir obrigatoriamente para um schema isolado (ex: `agrogb_private`)?

## 🔐 Capítulo 2: Auth Hooks & Custom JWT Claims
6. **Limites do Payload:** O Supabase possui alguma restrição rígida de tamanho em bytes (kb) para o array `app_metadata` injetado pelo Auth Hook, que poderia corromper a requisição HTTP?
7. **Race Conditions no Sign-up:** Se o Trigger de criação do Profile for milissegundos mais lento que o Auth Hook durante o primeiro login, o JWT será gerado sem a role, exigindo reautenticação? Qual o workaround oficial?
8. **Validação de Token:** Como o PostgREST lida em memória com os JWTs? O `auth.jwt_role()` roda no momento da requisição ou há cache na camada do banco?
9. **Revogação de JWT:** Em caso de demissão repentina de um Agrônomo, como revogar o token JWT imediatamente antes da sua expiração natural (geralmente 1h) usando arquitetura nativa do Supabase?
10. **Segurança do Hook:** A função definida como `SECURITY DEFINER` do nosso custom hook permite que invasores manipulem as variáveis de `$event->claims` no cliente? Como blindar esse parsing?

## 🛡️ Capítulo 3: Row-Level Security (RLS) Mastery
11. **Subqueries no RLS:** Por que o Supabase avisa que colocar `EXISTS (SELECT 1 FROM table)` no RLS pode derrubar o banco se a tabela tiver muitas linhas? Qual é o custo real por row no PostgreSQL planner?
12. **Políticas Conflitantes:** O PostgreSQL une as políticas do mesmo tipo (`SELECT`) com a porta lógica `OR`. Isso significa que se uma política for muito permissiva, ela inutiliza as outras. Como debugar qual política vazou os dados?
13. **Leakage por Views:** Se uma View não-materializada (`CREATE VIEW`) não tiver a tag `security_invoker = true`, os usuários podem ignorar o RLS através da chamada de View via REST API?
14. **Performance do `auth.uid()`:** Executar `auth.uid()` invoca uma função do Supabase todas as vezes. Avaliando uma varredura de 1 milhão de linhas, o uso de `current_setting('request.jwt.claim.sub', true)` nativo do Postgres é mensuravelmente mais rápido?
15. **RLS Bypass via Funções:** Funções `SECURITY DEFINER` pulam o RLS. Se um usuário criar um registro com um ID falso através de uma RPC chamada pelo app, como protegemos o banco?

## 📂 Capítulo 4: Storage Policies e Tratamento de Arrays
16. **Array Indexing no RLS:** Ao corrigir o erro de `text[] = text`, usar `(storage.foldername(name))[1] = auth.jwt_org()::text` é totalmente seguro, ou pode retornar nulo se o `name` for um arquivo direto na raiz do bucket?
17. **Traversal Attacks:** Nas políticas do Storage, como impedir que um hacker passe o caminho de arquivo `../../outra_organizacao/laudo.pdf` para burlar a política do `foldername`?
18. **Bucket Isolation:** Ter múltiplos buckets menores (ex: `fotos_org_A`, `fotos_org_B`) diminui o peso do RLS em comparação com usar um único bucket `documents` isolado internamente por caminhos de pasta?
19. **Download Performance:** Políticas RLS de Storage muito complexas aumentam significativamente a latência na hora de gerar "Signed URLs" no lado do Edge Network da Supabase?
20. **Limpeza de Storage Órfão:** Como arquitetar uma trigger ou cron que apague o arquivo físico do bucket Storage automaticamente assim que a linha correspondente for deletada da tabela `laudos` ou `perfis`?

## 🌍 Capítulo 5: PostGIS & Geoespacialização
21. **Geometry vs Geography:** Ao utilizar `extensions.geometry(MultiPolygon, 4326)`, os cálculos de área `ST_Area` estão em graus radianos. Ao fazer casting `::geography`, qual o impacto em milissegundos para o processador do servidor ao invocar trigonometria esférica sobre matrizes com mais de 500 vértices?
22. **Simplificação Geométrica:** Na exibição do Dashboard, compensa utilizar `ST_SimplifyPreserveTopology` no retorno do banco ou o Desktop/App que deve lidar com o peso computacional de renderizar mapas complexos?
23. **GIST Index Efficiency:** Acima de quantos milhares de talhões (fields) um índice GIST começa a justificar seu peso no disco durante as inserções?
24. **Auto-Correção:** O uso de `ST_MakeValid()` salva contra polígonos que "fazem nó", mas converte em coleções geométricas indesejadas (`GeometryCollection`). Como forçar a manutenção em formato `Polygon/MultiPolygon` apenas?
25. **Spatial Join:** Como evitar que uma consulta espacial `ST_Intersects` (para saber se o maquinário está dentro da fazenda) não cause Table Scan full no Supabase e de fato utilize o índice GIST?

## 📡 Capítulo 6: IoT & Time-Series (pg_partman)
26. **Particionamento Nativo:** O `pg_partman` consome muito mais transações em tabelas mães/filhas. Ao atingir 1.000 partições mensais, a árvore de tabelas herdadas começa a onerar o plano de execução (`EXPLAIN`) das queries agregadas?
27. **Drop Automático:** Quando o `pg_cron` roda o drop por `retention = '5 years'`, o PostgreSQL bloqueia (lock) a leitura da tabela global inteira durante a deleção física dos arquivos (unlink)?
28. **Insert Routing:** Se um sensor meteorológico enviar um log do mês passado por falta de sinal, o Postgres automaticamente redireciona (routing) o insert pra partição do mês correto ou haverá um erro de trigger?
29. **Autovacuum Tuning:** Devido à natureza "Append-Only" do IoT, como deveriam ser configuradas as flags `autovacuum_vacuum_scale_factor` e `autovacuum_analyze_scale_factor` nas partições?
30. **TimescaleDB Comparação:** Existem ganhos reais absolutos em trocar `pg_partman` pelo TimescaleDB para uso de `continuous aggregates`, sendo que a arquitetura do Supabase pode apresentar limitações ao gerenciar as extensões do Timescale?

## 📱 Capítulo 7: Sincronização Offline-First (Fila)
31. **Drain de Fila via RPC:** O app enviando um JSON com 500 comandos para uma única função RPC (Stored Procedure) é melhor do que dar 500 POSTs na REST API?
32. **Event Sourcing:** Se o usuário deletou um item no app e o mesmo item sofreu update no servidor por outro usuário, como tratar nativamente em PostgreSQL o "Conflict Resolution" (Timestamp Win)?
33. **JSONB Patching:** A leitura de payloads profundos no JSONB para buscar IDs de talhões via `payload->>'field_id'` pode ser perfeitamente indexada (GIN Index) ou isso adiciona muita sobrecarga de escrita na fila offline?
34. **Gargalo no Sync (Throttling):** É possível no PostgreSQL utilizar *Advisory Locks* (ex: `pg_try_advisory_xact_lock()`) para garantir que apenas uma conexão processe os eventos de uma mesma `organization_id` simultaneamente?
35. **Webhook Asynchronous:** Disparar Webhooks do banco a cada inserção da fila `mobile_sync_events` onera mais do que enfileirar mensagens em um serviço como pg_amqp/RabbitMQ? O Supabase lida bem com milhares de webhooks de banco enfileirados?

## ⚡ Capítulo 8: Views Materializadas & Concorrência
36. **Custo do Refresh:** O comando `REFRESH MATERIALIZED VIEW CONCURRENTLY` exige um `UNIQUE INDEX`. Qual a pegada em disco que esse índice duplicado exige?
37. **Stale Data:** Quando usamos o `CONCURRENTLY`, a visão do usuário não é bloqueada. O tempo que a view leva para recarregar (ex: 20 segundos) causa algum gap ou anomalia nas leituras paralelas via PostgREST nesse exato período?
38. **Agrupamentos Massivos:** Uma Materialized View consumindo JOINs de 10 tabelas e bilhões de partições IoT vai parar de rodar dentro do Timeout padrão da API de 15 segundos do Supabase? Como ignorar esse timeout nativamente num Job?
39. **Incremental Views:** O PostgreSQL 16 traz melhorias para Materialized Views, mas já existe no horizonte o suporte nativo a Incremental View Maintenance (IVM) para Supabase ou devemos usar extensões externas (ex: `pg_ivm`)?
40. **Tabelas Agregadas Manuais:** É melhor utilizar Triggers incrementais (`+1`, `-1` nas contas) na tabela real ou depender 100% de Views Materializadas recarregadas por Cron?

## 🚂 Capítulo 9: PgBouncer, Connection Pooling & Tunning
41. **Supavisor vs PgBouncer:** O Supabase migrou para o Supavisor para Connection Pooling. Qual é o limite de conexões ativas na porta 5432 vs 6543 e o que afeta requisições massivas do app desktop na camada Flet/Python?
42. **Mode de Pool (Transaction vs Session):** Para o Python enviar 1.000 requisições simultâneas de queries curtas, a conexão no modo Transação reduz a criação/demolição de sockets o suficiente para não tomarmos limite de CPU de rede?
43. **Cache de Plano de Execução (Prepared Statements):** Prepared statements no PostgreSQL colidem diretamente com o Pooler no modo Transação. Qual é o método aceito pelo Supabase para utilizar queries preparadas sem corromper a conexão de outros Tenants?
44. **WORK_MEM Setup:** Ao rodar grandes ordenações em Dashboard ou junções PostGIS, como ajustar a configuração `work_mem` e `shared_buffers` nativa da AWS EC2 do Supabase para impedir ordenações de cair pro disco (`external merge disk`)?
45. **Statement Timeout:** Onde podemos blindar uma consulta analítica (Dashboard) contra um `statement_timeout` mal configurado globalmente, configurando o timeout apenas dentro da Stored Procedure responsável por consultar a View?

## 🚨 Capítulo 10: Disaster Recovery, CI/CD e Scaling
46. **PITR (Point in Time Recovery):** Se ativarmos PITR e o aplicativo Mobile corromper massivamente a base (Sync de erros via app), quão granular (em segundos/minutos) é a restauração de apenas UMA tabela afetada pelo WAL logs?
47. **Migrações e Downtime:** Num banco com centenas de Giga, aplicar um `ALTER TABLE fields ADD COLUMN` pode travar todas as escritas no sistema inteiro (Table Lock). Como conduzir migrações `Zero Downtime` no Supabase CLI?
48. **Logical Replication Slot:** Se o AgroGB crescer e precisar espelhar o banco PostgreSQL localmente em um DataCenter da própria Fazenda para contornar instabilidades de internet rural, a replicação lógica via slot WAL nativa do Supabase entra em colapso com partições ativas de IoT?
49. **Replicação Geográfica (Read Replicas):** Quando um Agrônomo na filial ler do servidor de Réplica (Read-only), o delay da rede causará problemas com os tokens do Auth Hook validados localmente?
50. **Stress Test Limit:** Num "Dia D", com 1.000 tratores emitindo ping de localização simultâneo de hora em hora usando Supabase Realtime, os canais Websocket da porta caem antes do disco do banco PostgreSQL ficar saturado com os Inserts?

---

**🔥 Dica ao Analista:**
Esse nível de escrutínio separa um aplicativo amador de um SAAS Global. Ao rodar no NotebookLM e nas IA's oficias, colete todas as métricas exatas fornecidas (números, timeouts, tamanhos de buffer), pois essas respostas formarão as configurações de produção do nosso arquivo `supabase/config.toml`.
