# Parte 3 – Módulos Principais

O AgroGB é desenhado como um sistema de **Feature Flags / Módulos**. Nem todo cliente precisa de tudo. O sistema permite "ligar e desligar" módulos por empresa (Tenant) sem refatorar o código. 

Abaixo, os módulos operacionais primários:

## 3.1 Dashboard e Visão Executiva
O ponto de entrada. Deve fornecer respostas em 5 segundos.
- **Para o Cliente:** Rentabilidade da safra, alertas de clima, tarefas do dia, última recomendação do agrônomo.
- **Para o Agrônomo:** Clientes com problemas fitossanitários críticos, visitas agendadas, notificações de análises de solo prontas.
- **Para o Admin:** Faturamento global, novos leads, performance da equipe.

## 3.2 Clientes, Propriedades e Talhões
- **Clientes:** Cadastro robusto (CRM) com histórico, limites de crédito (para a revenda) e documentos.
- **Propriedades (Fazendas):** Polígonos de mapa (GIS), localização, área total, área agricultável, matrícula, clima integrado.
- **Talhões (Glebas / Setores):** A menor unidade gerencial. Onde os custos e aplicações realmente acontecem. Histórico rotacional de safras por talhão.

## 3.3 Culturas e Plantio
- Definição do que está plantado, espaçamento, densidade, data de plantio, cultivar/variedade, estimativa de colheita. Rastreabilidade completa da "semente ao prato".

## 3.4 Monitoramento (MIP/MID)
- O "Prontuário Médico" do campo. Agrônomos registram pontos de praga, doença ou deficiências.
- Suporte a fotos georreferenciadas, anotações de severidade (%) e armadilhas.
- Integração profunda com o Módulo de IA Visual e a *Biblioteca Global*.

## 3.5 Nutrição e Irrigação (Fertirrigação)
- Cálculos de lâmina d'água, tempo de injeção, condutividade elétrica (CE) e pH almejados.
- Leitura de sensores IoT e Estações Meteorológicas.
- Emissão de Receitas Nutricionais (Ex: Fase Fenológica 2 = 5kg Calcinit + 3kg Sulfato).

## 3.6 Fitossanitário e Receituário
- Ferramenta de precisão para emitir **Receituário Agronômico**.
- Checagem automática de **período de carência**, dose máxima, número de aplicações por safra e **compatibilidade de misturas** (evitar fitotoxidade).

## 3.7 Logística, Estoque e Compras
- **Estoque Multilocal:** Barracão Principal, Depósito de Agroquímicos, Carro do Agrônomo.
- Baixa automática de insumos ao aplicar um receituário.
- Módulo de "Compras/Cotação" onde o Agrônomo sugere a compra e o Financeiro da fazenda aprova e cota.

## 3.8 Caderno Agrícola / Custos (Apontamentos)
- Apontamentos Diários (Colheita, Tratos Culturais, Maquinário).
- Custeio Agrícola rateado: O diesel do trator divide o custo proporcionalmente aos talhões trabalhados.
- Integração com Folha de Pagamento/Equipes.

## 3.9 Relatórios Dinâmicos
- Motor de relatórios exportáveis para PDF/Excel com logo da Empresa/Agrônomo.
- Caderno de Campo Oficial para auditorias (GlobalG.A.P, etc.).
