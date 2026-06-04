# DOCUMENTO 1: Mapa Completo de Telas (AgroGB 75 Blocos)

Mapeamento da Experiência do Usuário (UX/UI) englobando todas as interfaces do Nível Máximo da Plataforma, divididas por contexto de uso.

## A. O CORE DE ENTRADA (Desktop/Mobile)
- **Tela de Autenticação / SSO:** Login via Email ou Integrações Corporativas.
- **Onboarding Multi-Empresa:** Tela de seleção de Tenant (Qual filial o usuário vai operar hoje).
- **Central de Preferências (Perfil):** Troca de idioma, modo dark/light e opções de assinatura de relatórios.

---

## B. A SALA DO GENERAL (Configurações de Plataforma - Desktop)
Telas dedicadas à engrenagem estrutural do sistema (Platform Engineering). Visíveis apenas para o Sênior/Admin.

- **Dashboard de Observabilidade:** Visão técnica (Erros, Tempo de resposta, Logs de sistema).
- **Gestão de Feature Flags e Módulos:** Liga/Desliga módulos como "Portal Cliente" ou "IA Diagnóstico".
- **Motor de Governança (RBAC Builder):** Criação visual de Cargos. Drag & Drop de permissões (Ex: cria cargo "Consultor Parceiro" e arrasta as flags `view_clients`, `edit_forms`).
- **Data Lake Explorer:** Tela para buscar arquivos arquivados/mortos com filtros pesados.
- **Construtor de Formulários / Relatórios:** Tela onde o administrador cria os templates dinâmicos de PDFs que os agrônomos utilizarão.

---

## C. CRM E BACKOFFICE EMPRESARIAL (Desktop)
A vida financeira e comercial da Consultoria Agrícola.

- **Dashboard Executivo:** Faturamento Geral, Clientes Ativos, Crescimento.
- **Funil de Vendas (CRM):** Kanban (Contato -> Proposta -> Negociação -> Fechado).
- **Gestão de Contratos e Planos:** Controle de vencimentos, alertas de renovação.
- **Faturamento e NF:** Geração de faturas SaaS e relatórios financeiros (Custos VS Lucro).

---

## D. O TÁTICO AGRONÔMICO (Operação - Desktop/Mobile)
O dia a dia de quem atende o produtor rural.

- **Painel Tático Pessoal:** Resumo do dia do Agrônomo (O que tem que visitar hoje).
- **Gestão de Tarefas e Calendário Agrícola:** View em formato de calendário (Plantios futuros, coletas agendadas).
- **Central de Clientes e Rastreabilidade:** Listagem de produtores. Ficha técnica detalhada (Lead, Prospect ou Cliente Ativo).
- **Histórico Consolidado e Linha do Tempo:** Uma Super-Timeline cruzando tudo que aconteceu na fazenda (Aplicações, Colheitas, Chuvas) desde 2024.
- **Centro de Decisão Agronômica (Painel Avançado):** Gráficos cruzando dados de Solo + Foliar + Clima para embasar as receitas.

---

## E. A VISÃO 360 DA PROPRIEDADE (Produtor e Agrônomo)
Quando você entra em uma Fazenda específica.

- **Propriedades e Talhões:** Desenho no mapa (Polígonos).
- **Painel Climático:** Integração com APIs externas de Estações Meteorológicas.
- **Culturas e Multiculturas:** Guias separadas se a fazenda rodar Soja, Milho ou Hortaliças simultaneamente.
- **Operacional (Manejos):** Formulários offline-first de Registro de Monitoramento (pragas) e Irrigação.
- **Motor de Recomendações (Prescrição):** A grande tela de emissão de receita com Sugestão Assistida (IA).
- **Gestão de Estoque e Compras Locais:** Controle logístico da própria fazenda.
- **Controle de Colheita e Comercialização:** Lotes colhidos e romaneios.
- **Central de Documentos Inteligente:** Pastas com busca (Contratos, Laudos, Receitas).

---

## F. O FUTURO: A CAMADA DE INTELIGÊNCIA ARTIFICIAL (Mobile/Desktop)
Telas dedicadas a auxiliar a carga cognitiva.

- **IA Diagnóstico (Câmera):** Tela no Mobile onde se aponta a câmera para a folha e o sistema tenta inferir a doença baseado na Biblioteca Técnica de Pragas.
- **Assistente Técnico Integrado:** Chat (estilo LLM) embutido no painel que responde perguntas como "Qual foi o custo médio de fertilizantes no cliente João em 2025?".
