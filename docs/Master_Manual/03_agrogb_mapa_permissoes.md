# DOCUMENTO 3: Mapa de Governança e Permissões (RBAC Granular)

O antigo modelo engessado (Admin / Agrônomo / Cliente) agora dá lugar a um motor altamente granular. Isso evita o colapso estrutural quando a empresa precisar que um "Supervisor" veja os dados, mas sem privilégios de deletar clientes.

## 1. HIERARQUIA DE ISOLAMENTO

1. **Camada Multitenant (A Empresa):** O topo absoluto. Ninguém do Tenant A enxerga o Tenant B. Tudo possui `empresa_id` ou deriva de algo que possui `empresa_id`.
2. **Camada de Visibilidade (Atendimento):** O Agrônomo A atende os Clientes 1, 2 e 3. Ele jamais verá os Clientes 4, 5 e 6 que pertencem ao Agrônomo B.
3. **Camada de Função (O que pode fazer na interface):** Mesmo atendendo os Clientes 1, 2 e 3, as "Permissões de Ação" dizem se o Agrônomo A pode deletar a fazenda ou apenas adicionar visitas.

---

## 2. A MATRIZ DINÂMICA DE ROLES

Os papéis deixam de ser estáticos. A revenda (ADM) pode criar seus próprios "Cargos" cruzando N permissões.

### Exemplos Práticos de Cargos (Roles):

- **Administrador Sênior:** `['*']` (Todas as permissões).
- **Consultor Estratégico (Supervisor):**
  - Pode ler todos os clientes da empresa (`view_all_clients`).
  - Pode ver finanças globais (`view_financials`).
  - NÃO pode alterar insumos ou deletar usuários.
- **Técnico Agrícola (Júnior):**
  - Só pode lançar visitas e tirar fotos (`create_visit`, `create_monitoring`).
  - NÃO pode emitir recomendações que envolvam compra de insumos sem revisão.
- **Produtor Rural (Cliente Master):**
  - Liderança da fazenda. Controle total sobre financeiro local, maquinário e compras.
- **Funcionário da Fazenda:**
  - Apenas aponta horímetro do trator e registra entrada de chuva no pluviômetro. Sem acesso ao financeiro.

---

## 3. EVENT SOURCING COMO BARREIRA ANTI-FRAUDE

Permissões impedem quem tenta entrar pela porta da frente. O **Event Sourcing** protege o histórico.
- Quando o Agrônomo altera uma prescrição química, o Supabase RLS checa se ele tem a permissão `edit_prescription`.
- Se tiver, o sistema **não** altera o arquivo original apagando seu rastro. Ele cria um evento "Prescrição Editada" na tabela de `audit_logs` e sobe a versão para "v2.0".

---

## 4. SISTEMA DE APROVAÇÕES E ASSINATURA DIGITAL

As permissões estendem-se aos fluxos (Workflows):
- Se um Técnico criar uma recomendação, ela fica com status `DRAFT` (Rascunho).
- Um Agrônomo responsável deve possuir a permissão `approve_prescription` para mudar o status para `APPROVED` e assinar digitalmente (chave JWT registrada no BD).
- Apenas relatórios/receitas no estado `APPROVED` disparam push notifications para os Produtores.
