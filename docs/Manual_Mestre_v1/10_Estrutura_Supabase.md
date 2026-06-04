# Parte 10 – Estrutura Supabase (Banco de Dados)

O Supabase não é apenas um "PostgreSQL na nuvem" para o AgroGB. Ele é a espinha dorsal de Autenticação, Segurança (RLS), Armazenamento de Fotos (Storage) e processamento em Tempo Real.

## 10.1 Blocos de Tabelas (Esquema Público)
O banco é logicamente dividido em Blocos (prefixos):

1. **Bloco de Sistema e Autenticação (Core)**
   - `profiles`, `roles`, `permissions`, `role_permissions`, `user_roles`.
   - Controlam "Quem entra" e "O que pode fazer".

2. **Bloco de Negócios / ERP**
   - `clientes`, `fazendas`, `talhoes`, `culturas` (a instanciada no campo, ex: O Morango do João, diferente da Cultura genérica da biblioteca).
   - `financeiro_receitas`, `financeiro_despesas`.

3. **Bloco de Apontamentos (Operação)**
   - `monitoramentos`, `apontamentos`, `receituarios`.
   - São as tabelas pesadas, onde a operação lança dados diários do celular via Offline-Sync.

4. **Bloco de Conhecimento (A Biblioteca Global - prefixo `kb_`)**
   - `kb_crops`, `kb_products`, `kb_pests`, `kb_outcomes`, `kb_combinations`.
   - É o cérebro estático e preditivo que alimenta a IA.

5. **Bloco de IoT e Timeseries (Séries Temporais)**
   - `iot_devices`, `iot_telemetry`.
   - Projetadas para altíssimo volume de Inserção (sensores meteorológicos e de estufas mandando dados a cada 5 minutos).

## 10.2 Relacionamentos (Chaves Estrangeiras)
A arquitetura é fortemente normalizada. Não duplicamos dados. Se o nome de um defensivo agrícola mudar na Biblioteca Global (`kb_products`), a Receita Agronômica aponta para o ID dele e a alteração reflete imediatamente (se desejado) ou usa versionamento de receitas (`kb_recipes`) para não alterar laudos passados de auditoria.

## 10.3 Índices de Performance
Como o app precisa baixar dados pesados para o Offline-First e filtrar por cliente, todas as chaves estrangeiras (ex: `cliente_id`, `fazenda_id`) e datas de criação (`created_at`) possuem índices **B-Tree** otimizados, e campos de pesquisa textual (como descrições de pragas) utilizam índices **GIN/Trigram**.

## 10.4 Row Level Security (RLS)
Nenhum Select "Puxa tudo".
O Supabase injeta o `auth.uid()` (ID do usuário logado) em todas as requisições. 
As políticas de segurança dizem:
- "Só retorne a `fazenda` se o `cliente_id` bater com a lista de clientes permitidos para este `auth.uid()` na tabela de Permissões."
Isso torna o AgroGB **Impenetrável** contra vazamento cruzado de dados entre fazendeiros ou revendas.
