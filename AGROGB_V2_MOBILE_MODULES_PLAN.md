# 🗺️ Tesouro de Funcionalidades: Mapeamento Completo dos Mockups

Analisei as principais imagens salvas na pasta `mockups` (como Tela Cultura, Relatórios, Contas, Adubação, Frotas, Colheita, Dashboard). Extraí **todas as lógicas, ferramentas, textos e funções** que essas imagens revelam. Este é o nosso "mapa do tesouro" para transformar o AgroGB no aplicativo agrícola definitivo.

## ❓ User Review Required
Este plano lista uma quantidade **massiva** de funcionalidades novas. Por favor, revise os módulos abaixo e me diga:
1. **Qual módulo devemos começar a desenvolver primeiro?** (Ex: Financeiro, Frota, Colheita ou Culturas?)
2. Você concorda com a lógica de abate de estoque sugerida na tela de adubação?

---

## 🛠️ 1. Módulo: Gestão de Culturas (`Tela Cultura.png`)
**Lógica e Funções:**
- **Indicadores de Topo (Cards):** Contagem de `Total Culturas`, soma de `Área Total (ha)` e `Em Produção`.
- **Filtros por Status:** Abas de navegação (Todas, Produção, Desenvolvimento, Plantado, Finalizadas).
- **Busca:** Barra de pesquisa por nome da cultura.
- **Card de Cultura (Ex: Morango, Milho):**
  - **Dados Exibidos:** Área plantada (ha), Variedade (Ex: Albion, Híbrido), Data de Plantio, Produção Total Acumulada, Última Colheita.
  - **Lógica de Status:** Uma tag colorida e ícone indicando a fase atual (Semente/Desenvolvimento/Produção).
  - **Ações:** Botões independentes para `[Ver]`, `[Editar]` e `[Excluir]`.

## 🛠️ 2. Módulo: Financeiro (Contas a Pagar/Receber) (`Tela de Contas.png` e `04.jpeg`)
**Lógica e Funções:**
- **Indicadores de Topo:** `Saldo Total` (Caixa atual), `Total a Pagar` (Vermelho), `Total a Receber` (Verde).
- **Abas de Filtro:** A Pagar, A Receber, Pagas, Todas.
- **Card de Lançamento:**
  - **Identificação:** Nome da conta (Ex: Adubo NPK, Conta de Luz, Venda de Morangos).
  - **Detalhes:** Forma de pagamento (Boleto, À Vista, Fiado, Cartão) + Data de Vencimento.
  - **Lógica de Status/Alerta:** Tags de urgência (`Vence hoje` em amarelo, `Atrasado` em vermelho, `A Receber` em verde, `Pago` em azul).
  - **Ação Rápida:** Botão `Swipe` (Deslizar) ou clique direto verde gigante com check `[Pagar]` para dar baixa instantânea.
- **Ação Principal:** Botão inferior longo `[Nova Conta]`.

## 🛠️ 3. Módulo: Relatórios Avançados (`Tela Relatorios.png`)
**Lógica e Funções:**
- **Filtro de Tempo:** Botões (Hoje, 7 dias, 30 dias, Personalizado).
- **Card Destaque (Lucro Líquido):** Mostra o saldo final e um comparativo percentual verde/vermelho vs período anterior (ex: `▲ 12% vs período anterior`).
- **Cards de Indicadores de Desempenho (KPIs):**
  - Receita total e Crescimento.
  - Custos totais e Crescimento.
  - Produção (kg) com mini-gráfico de linha embutido.
  - Ticket Médio com mini-gráfico de linha embutido.
- **Gráfico de Área/Linha (Receita vs Custos):** Cruzamento de dados de entradas e saídas no tempo.
- **Gráfico de Rosca (Custos por Categoria):** Separa em Insumos (40%), Mão de Obra (25%), Transporte (20%), Outros.
- **Ranking / Lista (Produção/Vendas por Cultura/Cliente):** Uma lista com avatar, nome e valor gerado (Ex: João Silva R$ 3.800).

## 🛠️ 4. Módulo: Receitas e Adubação (`Tela de adubação.png`)
**Lógica e Funções:**
- **Abas Principais:** `Receitas` (Formulação) e `Aplicações` (Execução no campo).
- **Card de Receita:** Mostra o nome, componentes e dosagem total.
- **Criar Nova Receita:**
  - `Nome da Receita` e `Tipo` (Foliar, Base, Cobertura).
  - Adição dinâmica de `Insumos`: O produtor escolhe o produto e dita a medida (ml, L, g, kg).
  - **Validação de Estoque (Lógica Crítica):** Ao adicionar o insumo, o sistema lê o estoque atual e avisa o "Custo médio", mostrando se há quantidade suficiente para a calda.
- **Editar/Abater Receita:**
  - O sistema pergunta: `"Deseja bater receita de 2,5 ha?"`.
  - **Alerta de Ruptura:** `⚠️ Bocashi 70 L mínimo. Estoque: 70 L. Custo R$ 20,00/L`.
  - O sistema propõe o desconto automático no Plano de Adubação Atual.

## 🛠️ 5. Módulo: Gestão de Frota e Máquinas (`02.jpeg`)
**Lógica e Funções:**
- **Painel de Cima (Colorido):** 
  - Máquinas (Verde - Ex: 12), Veículos (Azul - Ex: 5), Pendentes/Manutenção (Laranja - Ex: 3), Custo Mês de Manutenção (Amarelo - Ex: R$ 8.450).
- **Card do Veículo/Máquina:**
  - Nome (Ex: Trator John Deere 6110J).
  - Informação primária: Placa e Medidor de Uso (`Horímetro: 2.450h` ou `KM: 150.200`).
  - **Lógica de Manutenção:** Exibe a Data da Última Manutenção e tag de Status (`Ativo`, `Manutenção`, `Inativo`).
  - Botões `Ver` e `Editar`.

## 🛠️ 6. Módulo: Registro Operacional Múltiplo (`03.jpeg` - Colheita)
**Lógica e Funções:**
- **Abas de Operação:** Colheita, Congelamento, Descarte (mostra um fluxo completo de pós-colheita).
- **Cabeçalho do Registro:** Data do evento, seleção de Talhão/Área via modal e Observações Gerais.
- **Lista Dinâmica de Itens ("Carrinho"):**
  - O usuário pode adicionar múltiplas saídas de uma vez (Ex: Morango 120 cx + Tomate 300 kg).
  - Funcionalidade para Adicionar novo item, Editar peso/caixas e Excluir (ícone de lixeira vermelha).
- **Lógica de Backend:** Esse registro alimentará os "Relatórios" (Produção) e o "Financeiro" caso vire venda.

## 🎯 Próximos Passos (Plano de Ação)
Como este escopo é gigantesco (transforma o app num ERP completo), precisamos fatiar o elefante.
Para iniciarmos a programação no padrão **Dark Theme**, por qual funcionalidade quer começar?
(Responda a pergunta lá em cima no "User Review Required").
