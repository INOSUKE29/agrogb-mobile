# Mapa Arquitetural e Regras de Ouro (AgroGB)

> [!TIP]
> Este documento consolida os aprendizados, diretrizes e o mapa de refatoração aplicados nas telas da versão Desktop para garantir excelência em UI/UX e manutenibilidade.

## 🗺️ Mapa de Telas Unificadas

Com o objetivo de **reduzir a poluição no menu lateral** e tornar a navegação mais fluida, agrupamos telas que pertencem a um mesmo ecossistema de operação agrícola usando **Navegação por Abas Internas (Tabs)**.

### 1. Gestão de Áreas e Plantio (`AreasEPlantioScreen.tsx`)
Criada como uma Tela Mestra para gerenciar tudo relacionado ao uso do solo e safras.
- **Aba 1:** Talhões e Áreas (`TalhoesScreen.tsx`)
- **Aba 2:** Culturas e Safras (`CulturasScreen.tsx`)
- **Aba 3:** Ciclo de Plantio (`PlantioScreen.tsx`)

### 2. Colheitas e Produção (`HarvestScreen.tsx`)
Tela mestra que absorveu as regras exatas de negócio validadas previamente no App Mobile, dividida nas lógicas de destino da colheita:
- **Colheita Boa**
- **Congelamento**
- **Descarte**
- **Histórico (Listagem)**

---

## ⭐ Regras de Ouro de UI/UX

Para mantermos a aplicação Desktop em nível premium, as seguintes regras devem ser rigorosamente aplicadas em novas telas ou refatorações:

### 1. Modais Arrastáveis (Draggable Modal)
- **A Regra:** Nunca mais usar modais fixos e centralizados que cobrem os dados principais da tela.
- **A Solução:** Utilizar exclusivamente o componente `<DraggableModal />` para qualquer formulário de criação/edição.
- **Benefício:** Permite ao usuário arrastar a janela para o lado e ler o conteúdo da tabela no fundo enquanto preenche o formulário.

### 2. Estética Premium e Glassmorphism
- **A Regra:** A aplicação precisa causar o efeito "WOW". Evite cores sólidas chapadas e modais bloqueantes.
- **A Solução:** Use `bg-white/5` ou `bg-black/20` com `backdrop-blur-md` e bordas sutis (`border-white/10`).
- **Raio de Borda:** Use cantos bem arredondados (`rounded-2xl`, `rounded-3xl` para cards grandes, e `rounded-xl` para botões e inputs).

### 3. Redundância Zero no Roteamento
- **A Regra:** O `App.tsx` deve ser a única fonte da verdade de roteamento da página. Se uma tela se tornou uma Aba de outra tela, o roteamento direto (`Route path`) deve ser removido do `App.tsx` e o link do `DashboardLayout.tsx` unificado.

### 4. Preservação de Regras Nativas
- **A Regra:** Ao migrar ou espelhar telas do Mobile para o Desktop, as lógicas vitais de inserção de banco de dados (ex: Subtração do saldo do Talhão após Colheita, Validação de Congelamento) devem ser copiadas 1:1. Nunca simplifique o fluxo sacrificando dados do banco.
