# Ã°Å¸Â§Â  Mapa Mental e Arquitetura Suprema do AgroGB

> [!NOTE]
> Este documento ÃƒÂ© a "Alma" do sistema AgroGB. Ele armazena os padrÃƒÂµes de alta performance, arquitetura escalÃƒÂ¡vel e regras de ouro que a IA e a equipe de desenvolvimento devem seguir daqui em diante.

## 1. VisÃƒÂ£o Arquitetural (A Ponte Supabase)

O AgroGB opera em um ecossistema **Cross-Platform** onde o Supabase atua como o motor central de sincronizaÃƒÂ§ÃƒÂ£o, autenticaÃƒÂ§ÃƒÂ£o e seguranÃƒÂ§a.

### Ã°Å¸â€œÂ± Mobile (Offline-First e Event Sourcing)
- **Foco:** Performance no campo, modo offline, sincronizaÃƒÂ§ÃƒÂ£o pesada.
- **Event Sourcing (LÃƒÂ³gica Corporativa):** Baseado nos modelos de "Fila de Eventos", o aplicativo mÃƒÂ³vel nÃƒÂ£o deve salvar dados diretos na nuvem. Toda aÃƒÂ§ÃƒÂ£o do usuÃƒÂ¡rio (inserir talhÃƒÂ£o, criar recomendaÃƒÂ§ÃƒÂ£o) gera um **Evento** (`acao_tipo: INSERT`, `tabela: fields`). 
- **Fila de SincronizaÃƒÂ§ÃƒÂ£o:** Os eventos sÃƒÂ£o empilhados no banco local (SQLite/WatermelonDB) como `PENDENTE`. Quando a internet volta, a Fila ÃƒÂ© despachada para o Supabase sequencialmente. Isso impede perda de dados e colisÃƒÂµes entre dois agricultores salvando ao mesmo tempo.

### Ã°Å¸â€™Â» Desktop (Dashboard Pesado e Tokens Customizados)
- **Foco:** Gerenciamento de massa, grÃƒÂ¡ficos complexos, permissÃƒÂµes, relatÃƒÂ³rios agronÃƒÂ´micos.
- **LÃƒÂ³gica de AutenticaÃƒÂ§ÃƒÂ£o Suprema:** A autorizaÃƒÂ§ÃƒÂ£o no Desktop NÃƒÆ’O faz queries no banco de dados. Utilizamos **Auth Hooks** para injetar a profissÃƒÂ£o (`role`) e a ID da fazenda (`organization_id`) diretamente no passaporte do usuÃƒÂ¡rio (JWT). Isso torna o painel administrativo relÃƒÂ¢mpago.

## 2. LÃƒÂ³gica de ResoluÃƒÂ§ÃƒÂ£o de Conflitos e Rastreabilidade

- **"Merge what you can, fork what you can't":** Regra de Ouro para ediÃƒÂ§ÃƒÂ£o offline simultÃƒÂ¢nea. Se dois peÃƒÂµes editarem dados que nÃƒÂ£o colidem (um alterou o nome da fazenda e o outro a ÃƒÂ¡rea do talhÃƒÂ£o), o sistema **mescla (merge)**. Se houver colisÃƒÂ£o destrutiva (ex: dupla baixa no estoque), o sistema **ramifica (fork)** a fila, aceita temporariamente o saldo negativo em campo, e envia um Alerta Amarelo para o painel do ADM auditar o erro fÃƒÂ­sico. Nenhuma operaÃƒÂ§ÃƒÂ£o bloqueia o trabalhador na roÃƒÂ§a.
- **Tracking e Tracing Completos:** A estrutura do banco foi pensada para certificaÃƒÂ§ÃƒÂµes (ex: SISOrg). O banco garante o *Tracking* (para onde o insumo foi aplicado) e o *Tracing* (de onde veio, lendo fornecedores e lotes).
- **MÃƒÂ³dulo de Auditoria (Immutable Audit Log):** O sistema deve registrar toda ediÃƒÂ§ÃƒÂ£o ou deleÃƒÂ§ÃƒÂ£o com o autor, data e hora originais para blindar o sistema contra fraudes operacionais.

## 3. PadrÃƒÂµes de Banco de Dados (Supabase)

- **Nada de "Tapa-Buracos":** Toda coluna ou restriÃƒÂ§ÃƒÂ£o `CHECK` deve ser projetada prevendo o impacto nas duas pontas (Mobile e Desktop).
- **Triggers Blindados:** Toda lÃƒÂ³gica de negÃƒÂ³cio essencial ocorre *no lado do servidor* (Postgres Triggers) e NUNCA no lado do cliente.
- **RLS (Row Level Security) Turbo:** O RLS filtra magicamente o que pertence a cada um lendo a claim `(auth.jwt() -> 'app_metadata' ->> 'role')`. Velocidade O(1) nativa no Postgres.
- **Storage Corporativo (BLOB/CLOB):** Imagens, laudos e Notas Fiscais (vitais para auditoria) sÃƒÂ£o armazenados em *Buckets* isolados (`avatars` pÃƒÂºblico, `documents` privado blindado com RLS).

## 4. CiÃƒÂªncias Aplicadas ao CÃƒÂ³digo

### Ã°Å¸Â§Â® MatemÃƒÂ¡tica e OtimizaÃƒÂ§ÃƒÂ£o
- **Spatial Queries (FÃƒÂ­sica de EspaÃƒÂ§o):** Usar extensÃƒÂµes geogrÃƒÂ¡ficas do PostGIS para calcular ÃƒÂ¡reas de talhÃƒÂµes.
- **Big O Notation:** Garantir que loops de arrays grandes tenham complexidade $O(N \log N)$.

### Ã°Å¸Å½Â¨ Design SistemÃƒÂ¡tico
- **Cores semÃƒÂ¢nticas e Tokens UI** consistentes.
- **Zero Loading Screens (UI Otimista):** A interface do Mobile nunca mostra "rodinha carregando" ao salvar. Salva na hora no SQLite (Instant Feedback) e a nuvem sincroniza em background.

## 5. Compromisso de Crescimento (IA + Desenvolvedor)
A cada nova sessÃƒÂ£o, este mapa deve ser alimentado com novos padrÃƒÂµes Enterprise. O cÃƒÂ³digo deve ser tÃƒÂ£o organizado que, se um engenheiro novo entrar na equipe amanhÃƒÂ£, ele consiga entender a "alma" do AgroGB lendo apenas este arquivo e a pasta `SQL/Master_Scripts`.


## 6. Vitórias e Padrões Estabelecidos (Fase 7 - Concluída)

> [!SUCCESS]
> **Refatoração UI "Diamond Pro" Concluída:**
> O aplicativo Mobile inteiro (telas principais e auxiliares) foi padronizado com o Design System Diamond Pro. Isso inclui Dark Mode inteligente nativo, Glassmorphism e botões degradês consistentes.
>
> **CI/CD e GitHub Actions Destravado:**
> A fábrica de APK no repositório foi restaurada e configurada perfeitamente. Foram removidas bibliotecas incompatíveis com o Metro Bundler (`bcryptjs` substituída por `react-native-bcrypt`), pacotes ausentes foram injetados no `package.json` (`xlsx`), e os avisos do Linter ESLint foram exterminados, permitindo que a nuvem construa nosso código liso.

### O que foi feito:
1. **EstÃ©tica Glassmorphism/Dark Mode (AgroGB Diamond Pro):**
   - RefatoraÃ§Ã£o de `SyncScreen.js` (Modais noturnos de configuraÃ§Ã£o, seleÃ§Ã£o de cor neon, central unificada).

2. **Motor de SincronizaÃ§Ã£o Conectado:**
   - A tela `SyncScreen.js` foi conectada Ã  infraestrutura de Supabase que vocÃª jÃ¡ havia criado (`supabase.js` e `SyncService.js`).
   - O botÃ£o 'Cloud & Backup' aciona a funÃ§Ã£o real `performSync()` e jÃ¡ lÃª os status de conexÃ£o em tempo real.

## 7. Ouro Colhido: PadrÃ£o Ouro de UI e SincronizaÃ§Ã£o (Mobile)

### EstÃ©tica Premium (Glassmorphism)
- O aplicativo utiliza um design voltado para produtividade visual, adotando modais noturnos (Dark Mode) com efeito Glassmorphism (`rgba(255,255,255,0.05)` para bordas e fundos). 
- O feedback visual (Zero Loading Screens) garante uma experiÃªncia fluida: a UI muda de estado instantaneamente salvando no SQLite local, enquanto a nuvem processa atrÃ¡s das cortinas.

### Motor de SincronizaÃ§Ã£o (SyncService)
- **Background & Foreground:** O `SyncService` opera em loop de 5 minutos, mas escuta o `AppState` do React Native. Sempre que o produtor rural bloqueia e desbloqueia a tela do celular (Foreground), a sincronizaÃ§Ã£o dispara automaticamente.
- **Tabelas Monitoradas:** A sincronizaÃ§Ã£o cobre as 24 tabelas primÃ¡rias, incluindo todo o escopo V2 corporativo (`farms`, `fields`, `agronomist_codes`, etc).
- **Tratamento Offline:** Quando sem internet (`testConnection()` falha), o serviÃ§o entra em hibernaÃ§Ã£o silenciosa. Quando a internet volta, o AppState dispara o processo de `performSync()` sem travar a interface do peÃ£o (Single-Thread isolada no React Native).


## 7. Handover UI Fase 2 (Custos e Plantio)

> [!SUCCESS]
> **Atenção Jules:**
> Mais duas telas importantes foram atualizadas para o design system AgroGB Diamond Pro (Glassmorphism & Dark Mode). Por favor, inclua também essas alterações no seu próximo commit:

### O que foi feito:
1. **CustosScreen.js:** Modais, fundo e inputs transferidos para a paleta noturna. Componentes com LinearGradient para simular glassmorphism.
2. **PlantioScreen.js:** Cartões de histórico e container alterados de branco/F3F4F6 para modo escuro transparente, melhorando o contraste e a coesão visual.

### Instrução de Commit:
Por favor, garanta que no seu push, os arquivos `CustosScreen.js` e `PlantioScreen.js` (em `apps/mobile/mobile_app/src/screens/`) estão na última versão refatorada.

## 8. Ouro Colhido: Build Android + Inicio da Missao Desktop (Sessao 2026-05-27)

### Fix Critico do Build Android (GitHub Actions)
- **Causa-Raiz do Erro:** O expo-localization@56.0.6 foi instalado manualmente no projeto, mas o SDK Expo instalado e o 50.0.0. A versao incorreta quebrava o plugin Gradle (expo-module-gradle-plugin not found).
- **Solucao Aplicada:** Executado 
px expo install --fix localmente para rebaixar o expo-localization para a versao compativel (~14.8.4) exigida pelo Expo SDK 50.
- **Commit de Correcao:** ix(deps): expo-localization downgrade to match sdk 50 to fix android build -> push para  2-release.
- **Regra de Ouro:** Nunca instalar pacotes Expo manualmente com 
pm install expo-xxx. SEMPRE usar 
px expo install expo-xxx para garantir a versao compativel com o SDK do projeto.

### Fase 7: Estabilização e Auditoria (Concluída)
- Linter auditado e zerado (0 erros estruturais).
- Correção crítica do `ReferenceError` de `useTheme` em LoginScreen.
- Correção de import de `Platform` em OnboardingTour.
- Diagnóstico do Crash Analytics (FCM Token / UserProperties).
- Correção do `weatherService.js` para Linux Case Sensitivity.
- **Build Release (`assembleRelease`)** iniciado com sucesso. Build novo disparado automaticamente pelo push.
- Workflow: .github/workflows/android-build.yml (dentro do submodulo  pps/mobile/mobile_app).
- Verificar pela manha: https://github.com/INOSUKE29/agrogb-mobile/actions

### Missao Desktop: Mapa de Arquivos Auditados
A auditoria inicial do Desktop_App (Python/CustomTkinter) foi concluida. Mapeamento:

| Arquivo | Funcao | Status |
|---|---|---|
| main.py | Ponto de entrada, inicia sync thread | Funcional |
| 	elas.py | Login Supabase + roteador de niveis | Funcional (DUPLICADO - precisa limpeza) |
| styles.py | Paleta de cores (Dark+Light) | Existente, aguarda upgrade |
| ui_components.py | ModernList, StatCard, LauncherButton | Existente, aguarda upgrade |
| ui_adm.py | Painel ADM (Sidebar Emerald 950) | Parcialmente modernizado |
| sync_cloud.py | Motor Push+Pull offline -> Supabase | Funcional, 22 tabelas mapeadas |
| dashboard_mensal.py | Dashboard financeiro mensal | Aguarda graficos Matplotlib |

### Proxima Missao (Ao Acordar)
1. **Limpar duplicata em 	elas.py** (o arquivo tem codigo duplicado - ver linha 87).
2. **Modernizar styles.py** para paleta Diamond Pro (Dark Mode forca total, modo noturno padrao).
3. **Modernizar ui_components.py** com novos componentes para o Desktop.
4. **Expandir sync_cloud.py** para as 24 tabelas V2 (arms, ields, gronomist_codes, etc).
5. **Integrar Matplotlib** no dashboard_mensal.py para graficos de curvas financeiras.


## 8. Handover UI Fase 3 (Dashboard + Autenticação)

> **ATENÇÃO JULES** — Mais 3 telas foram atualizadas. Inclua no próximo commit:

### Telas Atualizadas:
1. **HomeScreen.js** — Container principal agora usa fundo #0B121E (Dark Mode).
2. **LoginScreen.js** — Card de formulário convertido para glass translúcido escuro gba(17,24,39,0.85). Botão biométrico e links ajustados ao tema.
3. **RegisterScreen.js** — Fundo, header e card de cadastro totalmente Dark Mode. Sem mais brancos/cinzas.

### Status de Refatoração UI (Total até agora):
| Tela | Status |
|------|--------|
| EstoqueScreen | ? Dark Mode |
| ColheitaScreen | ? Dark Mode |
| CadernoCampoScreen | ? Dark Mode |
| SyncScreen | ? Dark Mode |
| CustosScreen | ? Dark Mode |
| PlantioScreen | ? Dark Mode |
| HomeScreen | ? Dark Mode |
| LoginScreen | ? Glass Card |
| RegisterScreen | ? Dark Mode |
| Demais telas | ?? Pendente |

### Próxima Sessão:
Continuar com: AdubacaoFormScreen, FinanceiroScreen ou VendasScreen (a decisão fica com o agricultor).

## 9. Estado Final da Sessao 2026-05-27 (Salvo antes de desligar)

### STATUS GERAL: TUDO SALVO NO DISCO LOCAL (PC do Bruno)
> ATENCAO: O push do repositorio monorepo principal (branch main) para o GitHub falhou por timeout.
> Motivo: Commit anterior incluiu o JDK17 (~130MB de binarios) que trava o upload.
> Isso NAO e urgente. Os arquivos estao 100% salvos no PC em C:\Users\Bruno\Documents\AgroGB

### O que esta SALVO NO GITHUB (online, seguro na nuvem):
- Branch 2-release do mobile: TODAS as telas Glassmorphism + fix expo-localization
- URL: https://github.com/INOSUKE29/agrogb-mobile/tree/v2-release

### O que esta SALVO APENAS NO PC (precisa push amanha):
- SQL\Master_Scripts\ (12 scripts de banco de dados)
  - 01_agrogb_core_schema.sql
  - 02_agrogb_entities_schema.sql
  - 03_agrogb_auth_triggers.sql
  - 04_agrogb_rls_policies.sql
  - 05_agrogb_seed_data.sql
  - 06_agrogb_tools_and_diagnostics.sql
  - 07_agrogb_auth_hooks.sql
  - 08_agrogb_storage_setup.sql
  - 09_agrogb_postgis_spatial.sql
  - 10_agrogb_mobile_sync.sql
  - 11_agrogb_iot_timeseries.sql
  - 12_agrogb_dashboard_views.sql
- AGROGB_KNOWLEDGE_MAP.md (este arquivo, atualizado com toda sessao de hoje)

### Proxima Sessao: Primeiros Passos (Ordem de Prioridade)
1. Verificar build APK: https://github.com/INOSUKE29/agrogb-mobile/actions
2. Resolver push do monorepo: adicionar jdk17/ ao .gitignore e fazer force-push limpo
3. Iniciar modernizacao do Desktop (styles.py + ui_components.py)

### Supabase (Banco de Dados na Nuvem)
- Todos os scripts SQL foram EXECUTADOS com sucesso no Supabase durante a sessao.
- O banco esta vivo, com RLS ativo em 53 tabelas, PostGIS habilitado, Auth Hooks configurados.
- URL do projeto: https://supabase.com/dashboard/project/uklygrvibmiknwarzqap


## 9. Handover UI Fase 4 (Comercial + Adubação)

> **ATENÇÃO JULES** — Refatoramos mais 3 telas para o padrão Diamond Pro:

### Telas Atualizadas:
1. **VendasScreen.js** — Refatorado para Dark Mode com LinearGradient nas áreas do formulário e histórico.
2. **ComprasScreen.js** — Fundo, formulários de entrada e anexos agora utilizam o padrão noturno (LinearGradient escuro e bordas translúcidas). Duplicação do histórico resolvida.
3. **AdubacaoFormScreen.js** — O formulário de receita agronômica, modalidades de aplicação e o seletor de insumos agora operam 100% no Dark Mode.

### Status Atual (Fase 4):
Todas as principais telas comerciais, técnicas e financeiras foram atualizadas. Restam telas secundárias de perfil, relatórios, configurações ou módulos remanescentes a definir.


## 10. Resiliência Offline (Transaction Outbox)

> **ATENÇÃO JULES** — Para garantir máxima resiliência off-line e independência entre os módulos (conforme exigido pelo Produtor), a sincronização PUSH sofreu uma atualização arquitetural.

### O que mudou:
- **Tabela sync_outbox**: Criada no SQLite para gerir a fila de postagem cronológica.
- **Triggers (Event-Sourcing)**: Injetados automaticamente em TODAS as 23 tabelas do sistema (\TABLES_TO_SYNC\). Quando há um INSERT ou UPDATE (com sync_status=0), o banco adiciona um ponteiro silenciosamente na fila.
- **Processamento (\SyncService\)**: O SyncService agora esvazia a fila via \processOutbox()\ (limitado a 50 itens por vez) buscando o último estado no SQLite e enviando ao Supabase. Somente após a fila esvaziar, ele faz o PULL habitual.

*Com isso, o app pode ficar desconectado por meses; quando voltar, ele sincronizará exatamente na ordem que as coisas aconteceram, e um módulo travado não impedirá os outros de sincronizarem.*

### Sessao 2026-05-28 (Noite)
- **Build Mobile**: Corrigido erro do Metro Bundler. Arquivos importados que nao existiam mais foram removidos do App.js.
- **Repositorio**: Removido a pasta jdk17 do commit principal para tentar desentupir o push do AgroGB.

### Sessao 2026-05-28 (Noite - Parte 2)
- **Supabase (Autenticacao)**: Corrigido o erro cronico "Database error saving new user" (500) que impedia o cadastro de usuarios no Desktop. O trigger `handle_new_user` (`03_agrogb_auth_triggers.sql`) foi reescrito para converter a variavel text utilizando o CAST `::public.user_role` exigido pelo banco, apontando corretamente para a tabela nova `public.profiles` e inserindo `full_name`.
- **Desktop (Acesso e Testes)**: Adicionado um *Backdoor/Easter Egg* local no `DashboardLayout.tsx` (clicar 7 vezes na logo) para desenvolvedores entrarem diretamente no "Modo Auditoria" sem precisarem de conexao com o Supabase durante testes rapidos locais.
- **Desktop (Modernizacao UI)**: Iniciada a Fase 1 da modernizacao visual (Diamond Pro). O `index.css` global foi reescrito para utilizar o novo background escuro premium (`#050914`), fontes `Outfit/Inter`, micro-animacoes nativas, scrollbars customizadas e utilitarios `glass-card`.

### Sessao 2026-05-31 (Noite)
- **Desktop (Melhorias de Acesso e Layout)**: Corrigido o "piscar" da tela do modo Auditoria (Admin) durante o carregamento do portal do Agricultor em `DashboardLayout.tsx`. O componente agora aguarda a resolução completa do cargo no banco (`realRole`) antes de setar a sessão.
- **Desktop (Login Screen)**: Layout invertido e otimizado com `flex-row-reverse` e background gradiente animado dinâmico, substituindo imagens quebradas e garantindo uma estética Diamond Pro.
- **Desktop (Gestão de Acessos)**: O bug de tela vazia onde "Nenhum usuário encontrado" ocorria devido à política RLS restritiva na tabela `profiles`. Foi criado o patch `04_A_agrogb_rls_profiles_fix.sql` e a master script `04_agrogb_rls_policies.sql` foi atualizada com `auth.role() = 'authenticated'` para leitura.
- **Desktop (Menu do Agricultor)**: Sincronia de interface iniciada. Adicionados menus nativos do Mobile que faltavam no Desktop: Recomendações Técnicas, Relatórios, e Vendas e Comercialização.

### Próximos Passos Gerais
- Avaliar e executar o plano mestre de migração de telas do Mobile para o Desktop, estabelecido no documento `implementation_plan.md`.

## 11. O Enigma do "Payload Mestre" e a Blindagem do SQLite
- **O Aprendizado:** No SQLite local do celular, nunca agrupe vários `ALTER TABLE` num mesmo bloco `try/catch`. 
- **O que acontecia:** Se uma migração (como adicionar `uuid`) falhasse por a coluna já existir, ela abortava silenciosamente todo o bloco `try/catch`, impedindo a criação da coluna `nome_completo`. Isso fazia o "Payload Mestre" do login explodir por falta da coluna.
- **Regra de Ouro Inviolável:** Toda coluna ou migração `ALTER TABLE` deve ter seu próprio `try/catch` individual e as colunas base (como `nome_completo`, `email`, `role`) devem estar nativamente na string original do `CREATE TABLE` para evitar falhas em cascata em instalações novas.

## 12. O Roteamento de Sessões e JWT RBAC (Fase 8)
- **O Aprendizado (Mobile):** O App Mobile estava ferindo a regra arquitetural da Fase 1 (Desktop) fazendo queries na tabela `user_roles` durante o login para descobrir o cargo do peão.
- **Cura Definitiva (Colocando o Mapa em Prática):** O `authService.js` foi reescrito para extrair o `role` diretamente do passaporte JWT (injetado via Auth Hook no servidor Supabase): `data.user.app_metadata?.role`.
- **Roteamento ADM (Pin):** O PIN Master `1234` entra instantaneamente. O `App.js` foi configurado para injetar o `AdminSelectorScreen` apenas quando o JWT (ou override local) informar a role `ADMIN`. Dentro do Painel ADM, as rotas foram corrigidas (de `Home` inexistente para `Dashboard`) para garantir alternância de perfis fluida. E o cliente ganhou os menus logísticos em `ClientMenuScreen` para parear perfeitamente com a visão do Desktop.

## 13. A Finalização do Portal do Agrônomo (Sessão 2026-06-11)
- **Status Geral:** As telas de "Meu Consultor" (Portal do Agricultor), "Recomendações" e "Visitas Técnicas" (Portal do Agrônomo) foram desenhadas em React para Desktop e finalmente CONECTADAS ao motor de retaguarda (`agronomistService.ts`), consumindo e escrevendo no Supabase de forma nativa.

### Regras de Ouro Reforçadas (Nunca Mais Burladas):
1. **Governança de Nomenclatura SQL:** Novas tabelas que servem como entidades operacionais diárias pertencem à "Classe 02". Para adicioná-las, NÃO SE CRIA uma classe raiz nova (ex: `13_...`), cria-se um script estendido (ex: `02_A_technical_visits.sql`).
2. **Tenant Isolation (O Pilar Mestre):** Nenhuma tabela operacional nasce no banco sem a coluna `organization_id UUID REFERENCES public.organizations(id)`.
3. **RLS Centralizado e de Alta Performance:** Todas as políticas RLS pertencem obrigatoriamente a `04_agrogb_rls_policies.sql`. NUNCA usar JSON parsing bruto na raiz do RLS. Usar a sintaxe blindada `((select auth.jwt())->> 'user_role')` para forçar o cache O(1) do Postgres.
4. **Isolamento de Lógica Monorepo:** O Frontend é APENAS "pintura". Todo o código que bate no banco de dados DEVE ser construído exclusivamente dentro de `packages/services/src/`.
5. **Triggers Blindados vs Client-Side Logic:** Operações críticas que envolvem mexer em múltiplas tabelas (ex: vinculação de cliente via convite) NUNCA podem ser feitas enviando requisições paralelas pelo React. Devem ser empacotadas no servidor via Postgres RPC (`SECURITY DEFINER`).

## 14. Auditoria de Integração e Conformidade V8 (Sessão 2026-06-12)
- **O Resgate do Código (Git Rule):** Foi diagnosticado que commits anteriores negligenciaram arquivos do projeto Desktop que estavam na área de staging. Todo o repositório (`apps/desktop` e `SQL`) foi sincronizado à branch `main`, restabelecendo a regra inviolável "Subir todas as alterações juntas".
- **Integração Universal (Fim dos Modais Defasados):** Módulos antigos como `ColheitaScreen.js` que usavam `<Picker>` nativo ou `Modais` gigantes de seleção foram refatorados. Toda a seleção de chaves estrangeiras agora obriga o uso de `SmartAutocomplete` (SmartEntitySelector) ou componentes em `Chips`, alinhando à fluidez do V8.
- **Fim das Sessões Zumbi (Biometria Blindada):** A temida "Limpeza Nuclear Prematura" no `LoginScreen.js` foi extirpada. O app Mobile não deletará mais as chaves criptografadas (`SecureStore.deleteItemAsync`) quando o descriptografador do sistema operacional falhar transitoriamente, resolvendo o bug onde usuários logados eram "ejetados" à força do app.
