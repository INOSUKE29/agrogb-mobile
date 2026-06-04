# DOCUMENTO 4: Roadmap de Desenvolvimento (75 Blocos)

Este documento dita a esteira de construção e entrega de valor do AgroGB. Ele é dividido em dois eixos simultâneos: **Desenvolvimento de Produto (O que o usuário vê)** e **Platform Engineering (O que garante que não vai quebrar)**.

---

## FASE 1: O NÚCLEO DURO (ONDE ESTAMOS)
**Foco:** Garantir que o básico funciona com excelência e nunca corrompe dados.

| Eixo Produto (Operacional) | Eixo Plataforma (Engenharia) |
| :--- | :--- |
| Mapeamento de Propriedades/Talhões. | Migrações controladas do Banco (`migrations`). |
| Fluxo de emissão de Recomendações e PDFs. | RLS (Row-Level Security) Isolamento Clientes. |
| Cadastro de Insumos / Motor de Exportação. | Separação de Ambientes (Dev / Prod). |
| Autenticação (Admin / Agrônomo / Produtor). | Setup inicial do Electron Desktop. |

---

## FASE 2: GESTÃO AVANÇADA E OPERAÇÃO DE CAMPO
**Foco:** Entregar valor diário ao agrônomo, transformando o AgroGB de um "emissor de relatórios" para um "calendário técnico ativo".

| Eixo Produto (Operacional) | Eixo Plataforma (Engenharia) |
| :--- | :--- |
| Calendário Agrícola (Linha do tempo cultura). | **Sincronização Offline First** (Cache local do Mobile). |
| Sistema de Tarefas e Gestão de Visitas. | Telemetria (Qual botão está sendo mais clicado). |
| Histórico de Análise de Solo / Foliar. | Motor de Permissões Granulares (`roles / permissions`). |
| Motor de Assinatura Digital de relatórios. | Setup de Testes E2E Automatizados (Cypress/Playwright). |

---

## FASE 3: ESCALADA ERP, SaaS E SAÚDE DO NEGÓCIO
**Foco:** Multiempresa, cobrança, e complexidade financeira. O App vira um sistema SaaS profissional.

| Eixo Produto (Operacional) | Eixo Plataforma (Engenharia) |
| :--- | :--- |
| Sistema de Planos (Básico, Pro) e Faturamento. | **Feature Flags** (Ligar/Desligar módulos por empresa). |
| CRM de Consultoria Agrícola (Funil Vendas). | Auditoria de Segurança Inviolável (Event Sourcing). |
| Dashboard Climático e Integração API Externa. | Data Lake Setup (Transferência de arquivos frios/antigos). |
| Rastreabilidade Completa (Insumo -> Colheita). | Motor Dinâmico de Relatórios e Formulários. |

---

## FASE 4: O HORIZONTE DA INTELIGÊNCIA ARTIFICIAL
**Foco:** Reduzir a carga mental do agrônomo com decisões auxiliadas pela máquina.

| Eixo Produto (Operacional) | Eixo Plataforma (Engenharia) |
| :--- | :--- |
| IA de Diagnóstico (Tira foto, aponta doença). | Pipelines de Machine Learning MLOps. |
| Motor de Recomendação Baseado em Déficit. | Data Warehouse (Modelos analíticos pesados isolados). |
| Assistente Técnico via NLP (Chatbot interno). | Alertas e Gatilhos Inteligentes em Real-time. |
| KPIs Preditivos (Previsão de perda/lucro). | Observabilidade com Alertas Automáticos de lentidão sistêmica. |
