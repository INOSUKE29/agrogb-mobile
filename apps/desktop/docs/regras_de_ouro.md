# Regras de Ouro (AgroGB)

Este documento atua como uma "Vacina" contra erros repetitivos no desenvolvimento do AgroGB. Deve ser consultado e respeitado em todas as implementações futuras.

## 1. Simplicidade Extrema no Campo
O usuário final (Agrônomo ou Produtor) está no sol, no campo e sem tempo. **NÃO crie formulários de 6 passos (Wizards)** para tarefas rotineiras. 
- Mantenha tudo em uma única tela rolável.
- Esconda campos avançados ou torne-os opcionais (ex: janela climática, vento).
- Permita blocos de informações repetíveis na mesma tela (ex: Múltiplas aplicações em uma recomendação).

## 2. Prevenção da Tela Branca (React Router)
Ao remover um arquivo (`.tsx`) ou componente, **VERIFIQUE IMEDIATAMENTE** todos os arquivos de rotas (`App.tsx`, `DashboardLayout.tsx`). 
- Nunca apague uma tela sem remover sua importação e sua rota correspondente.
- Componentes não encontrados geram falha catastrófica de renderização (Tela Branca).

## 3. Blindagem de RLS (Row-Level Security)
O Supabase bloqueia inserções silenciosamente se o `payload` violar as políticas da tabela.
- Ao inserir dados, inclua sempre o `user_id` (ou `agronomist_id`/`cliente_id`) se a política exigir `auth.uid() = user_id`.
- Evite inserir em tabelas cujo RLS seja restritivo sem antes garantir que o Auth Context tem os dados necessários.
- Ao adicionar novas lógicas, faça scripts genéricos `.sql` com `IF NOT EXISTS` para não quebrar o banco existente.

## 4. Integração Prática vs Enfeites
Funcionalidades como **"IA Agronômica", "Mapas de Satélite" e "Bibliotecas Enormes de Pragas"** são para o futuro. O foco atual é a operação: cadastrar visita, lançar recomendação (receita) de forma rápida e eficiente. Menos firula e mais funcionamento prático.

### 6. Módulos Incompletos e Estados (Vacinas #17 e #19)
- Todo módulo deve possuir ciclos completos: `Loading`, `Success`, `Empty`, `Error` e `Offline`.
- Para garantir essa padronização, deve-se usar o componente central **`AgroStateOverlay`** (Mobile) e **`StateOverlay`** (Desktop). Jamais retorne uma tela preta ou uma mensagem de texto simples sem formatação caso a busca não retorne dados.

### 7. Arquitetura de Formulários Mobile e Contraste
O produtor está no sol, os formulários precisam de altíssimo contraste (Fundo Escuro, Input Branco). Além disso, é absolutamente proibido criar telas longas sem a trinca de ferro: `<SafeAreaView>`, `<KeyboardAvoidingView>` e `<ScrollView>`. (Vide ADS para regras de UI completas).

## 6. Documentos-Mestre da Arquitetura
Consulte sempre os artefatos sagrados antes de alterar qualquer código central:
- **[Mapa de Erros e Vacinas](file:///C:/Users/Bruno/Documents/AgroGB/apps/desktop/docs/mapa_de_erros.md)**

## 7. Unificação de Processos no Campo (Agenda vs Visitas)
Não crie telas separadas para "Planejar" e "Executar" se a ação no campo for a mesma. 
- Agenda e Visitas devem ser a mesma tela: o status (Agendado vs Realizado) é o que diferencia o tempo.

## 8. Evitar Dados Falsos e Lúdicos
O sistema é para uso real.
- Em Dashboards e Visões Administrativas, prefira mostrar um número "0" ou omitir um gráfico do que colocar dados "mock" fakes de milhares de reais que poluem a visão. Foque nos cadastros e dados reais do banco (ex: Total de Usuários Ativos).

## 9. Fluxo de Crowdsourcing e Componentes Inteligentes (Desktop)
- **NUNCA** use tags nativas `<select>` do HTML que geram rolagem infinita. Use o componente `<SearchableSelect />` padronizado.
- **Gatilho de Inserção:** Ao tentar adicionar um item que não existe na lista local/global, o sistema deve SEMPRE abrir o `<QuickAddModal />` (ou equivalente) para capturar o "Nome" e "Categoria".
- **Salvamento Duplo:** A inserção desse novo item deve salvar localmente para uso imediato do produtor E salvar com `status_aprovacao = 'PENDENTE'` na Biblioteca Global (Portal Admin). Mágicas invisíveis que apenas gravam texto livre no banco sem estruturar a informação são terminantemente proibidas.

## 10. Integridade de Dados: Padronização Maiúscula
- **Regra:** Todo texto de entrada que alimentar os bancos de dados do AgroGB, especialmente as tabelas de Cadastros e Dicionários Globais (como Culturas, Produtos, Talhões, Nomes Oficiais), deve ser convertido usando `.toUpperCase()` obrigatoriamente.
- Não permita que o produtor ou o sistema salvem "banana" e "Banana" em locais diferentes. Isso gera poluição irreparável na Inteligência do Sistema.

## 11. Arquitetura de Banco de Dados: Tabelas V2 e Biblioteca Global
- **Regra de Transição V1 para V2:** Nunca misture tabelas antigas (ex: `produtos_cadastro`) com a nova arquitetura V2.
- O fluxo oficial de dados do AgroGB é:
  1. **Locais (Produtor):** `v2_produtos`, `v2_talhoes`, `v2_visitas`, etc.
  2. **Globais (Inteligência/Admin):** `kb_products`, `kb_crops`, `kb_pests`, etc.
- **Aprovações:** A tela do Admin deve **sempre** ler as aprovações pendentes diretamente das tabelas locais do produtor (ex: `v2_produtos` onde `status_aprovacao = 'PENDENTE'`). Quando o Admin aprova, o sistema injeta os dados nas tabelas `kb_` e libera para todos. Mantenha essa separação estrita entre o "Mundo Local do Produtor" e o "Cérebro Global".
