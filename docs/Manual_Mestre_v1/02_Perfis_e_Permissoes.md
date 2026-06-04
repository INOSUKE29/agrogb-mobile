# Parte 2 – Perfis e Permissões (RBAC Granular)

O AgroGB abandonou a ideia de "hardcode" (onde os acessos são travados diretamente no código da interface) e adotou um **Motor de Permissões Granulares (RBAC)** baseado no Supabase.

A arquitetura do banco possui as tabelas:
- `usuarios` (Auth)
- `roles` (Perfis genéricos, ex: 'Agrônomo Sênior')
- `permissions` (Ações isoladas, ex: 'edit_recipe')
- `role_permissions` (A matriz que cruza Roles com Permissions)
- `user_roles` (Tabela que liga um usuário a uma ou mais Roles)

Isso permite criar infinitas combinações sem tocar em uma linha de código Front-end.

## 2.1 Perfis Padrão Planejados

1. **ADM (Master / Proprietário)**
   - **Descrição:** Dono da revenda, dono da fazenda grande ou o super-admin do AgroGB.
   - **Permissões Típicas:** Acesso global (`view_all_clients`, `manage_users`, `manage_billing`, `manage_global_library`). Pode visualizar dados financeiros globais, cadastrar novos agrônomos, gerenciar módulos ligados e configurar parâmetros de toda a Tenant.

2. **Agrônomo Sênior / Consultor Principal**
   - **Descrição:** Possui acesso livre à sua carteira de clientes, pode validar e modificar receitas, cria e edita protocolos dentro do *Cérebro Técnico*.
   - **Permissões Típicas:** `manage_own_clients`, `create_protocol`, `approve_protocol`, `view_client_financials` (opcional).

3. **Agrônomo Júnior / Assistente Técnico**
   - **Descrição:** Faz as visitas, aplica formulários, relata problemas, mas muitas vezes suas receitas ou protocolos precisam passar por revisão.
   - **Permissões Típicas:** `view_assigned_clients`, `create_draft_protocol`, `submit_visit_report`.

4. **Técnico Agrícola / Operador de Campo (Futuro)**
   - **Descrição:** Funcionário da fazenda ou da consultoria que faz as aplicações (tratorista, irrigante, aplicador). Foco em tarefas, batida de ponto de atividades e baixa de estoque de insumos.
   - **Permissões Típicas:** `view_tasks`, `complete_task`, `consume_stock`, `view_own_data`.

5. **Supervisor / Gerente Técnico**
   - **Descrição:** Coordena um grupo de Agrônomos. Pode visualizar o desempenho, relatórios e clientes de sua equipe.
   - **Permissões Típicas:** `view_team_clients`, `approve_expenses`.

6. **Cliente (Produtor Rural / Fazendeiro)**
   - **Descrição:** O dono da terra. Ele quer ver os resultados.
   - **Permissões Típicas:** `view_own_data` (Acesso isolado aos seus talhões, clima, tarefas, recomendações da consultoria), `manage_own_finances`, `manage_farm_users`.

7. **Funcionário do Cliente (Operador da Fazenda)**
   - **Descrição:** Semelhante ao Técnico, porém gerenciado pelo Cliente e não pela Revenda.
   - **Permissões Típicas:** Acesso restrito a um Talhão ou Cultura específica para lançar dados (colheita, aplicações).

8. **Financeiro / Administrativo**
   - **Descrição:** Trabalha na Retaguarda (Backoffice) da Revenda/Cooperativa.
   - **Permissões Típicas:** Acesso a notas fiscais, faturamento de vendas, contas a pagar/receber e comissões, mas **zero acesso** ao Caderno Agrícola.

## 2.2 Isolamento RLS (Segurança Mestra)
Tudo isso é respaldado no Banco de Dados por *Row Level Security (RLS)*. Mesmo que um usuário mal-intencionado force a interface, o Supabase impedirá a leitura ou gravação de uma linha se a permissão não for atendida pelas funções como `can_read_kb()` ou cruzamento de Tenant.
