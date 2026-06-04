# DOCUMENTO 2: O Banco de Dados Definitivo (Escala 75 Blocos)

O "Coração" do AgroGB foi desenhado para não apenas armazenar dados, mas para garantir *observabilidade*, *segurança em nível granular* e *arquivamento temporal*.

## EIXO 1: A FUNDAÇÃO (Platform Engineering)

### 1. Motor Granular de Permissões (RBAC Dinâmico)
Substitui a regra fixa de 3 perfis para um modelo dinâmico.
- **`roles`**: `id`, `name` (Ex: Supervisor, Agrônomo Júnior, Consultor Financeiro).
- **`permissions`**: `id`, `name` (Ex: `can_edit_formula`, `can_approve_report`).
- **`role_permissions`**: Pivot `role_id` <-> `permission_id`.
- **`user_roles`**: Pivot `user_id` <-> `role_id`.

### 2. Feature Flags & Multitenancy (Módulos)
- **`empresas_revendas`**: `id`, `nome`, `cnpj`, `configuracoes_json`. (Isolamento total multi-empresa).
- **`feature_flags`**: `id`, `empresa_id`, `feature_name`, `is_active`. (Permite ligar/desligar módulos como Financeiro, IA, Portal Cliente sem deploy).

### 3. Observabilidade e Telemetria
- **`audit_logs` (Intocável):** `id`, `user_id`, `action`, `table_name`, `old_data`, `new_data`, `timestamp`.
- **`telemetria_ux`:** `id`, `user_id`, `tela_acessada`, `tempo_tela`, `acao_clicada`.
- **`app_errors`:** `id`, `error_message`, `stack_trace`, `user_info`, `resolved_at`.

---

## EIXO 2: O NÚCLEO AGRONÔMICO (Operação)

### 1. Hierarquia de Espaço e Tempo
- **`clientes`**: Elo entre Produtor e Empresa/Agrônomo (`agronomo_id`, `empresa_id`).
- **`propriedades`**: Áreas físicas da fazenda.
- **`talhoes`**: Subdivisões e Glebas com coordenadas (PostGIS).
- **`culturas`**: A união entre Espaço e Tempo (`talhao_id`, data_inicio, data_fim, cultura).

### 2. O Histórico Operacional (Event Sourcing)
- Tudo que acontece no campo gera um evento em uma tabela de rastreabilidade, permitindo a "Linha do Tempo da Cultura".
- **`eventos_campo`**: `id`, `cultura_id`, `tipo` (Plantio, Colheita, Aplicação, Monitoramento), `dados_json`, `data_evento`, `status_sincronizacao` (Para modo offline).

### 3. Análises Científicas e Recomendações Versionadas
- **`analises_solo` / `analises_foliares`**: Armazenamento químico e biológico longo prazo.
- **`prescricoes_versoes`**: Guarda o histórico. Rascunho -> Aprovado -> Versão Final.

---

## EIXO 3: GESTÃO EMPRESARIAL (CRM & ERP)

### 1. CRM e Contratos
- **`crm_leads`**: Pipeline de vendas de consultoria (Prospect, Negociação).
- **`contratos_servico`**: Vigência, Plano SaaS (Básico, Premium), Valores.

### 2. Estoque, Custos e Comercialização
- **`estoque_local`**: Entradas e saídas físicas do galpão da fazenda.
- **`custos_safra`**: Insumos consumidos atrelados à cultura X.
- **`colheita_comercializacao`**: Controle de lotes, romaneios, receitas, e qualidade (Rastreabilidade).

---

## EIXO 4: INTELIGÊNCIA (Data Lake & IA)

### 1. Bancos de Conhecimento (Read-Only Global)
- **`biblioteca_insumos`**: Base técnica mundial de bulas e produtos.
- **`biblioteca_pragas_doencas`**: Base de imagens e sintomas (Para treinar IA).
- **`protocolos_manejos`**: "Receitas de Bolo" salvas pelos Agrônomos Seniores.

### 2. Data Warehouse (Analytics)
Para onde os dados vão para morrer ou renascer em Dashboards:
- Visões materializadas calculando: Lucro/ha, Eficiência Nutricional e Gráficos de Chuva (integração climática).
