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

## 5. Arquitetura de Formulários Mobile e Contraste
O produtor está no sol, os formulários precisam de altíssimo contraste (Fundo Escuro, Input Branco). Além disso, é absolutamente proibido criar telas longas sem a trinca de ferro: `<SafeAreaView>`, `<KeyboardAvoidingView>` e `<ScrollView>`. (Vide ADS para regras de UI completas).

## 6. Documentos-Mestre da Arquitetura
Consulte sempre os artefatos sagrados antes de alterar qualquer código central:
- **[AgroGB Development Standard (ADS)](file:///C:/Users/Bruno/.gemini/antigravity/brain/0dea86f6-86d7-4607-ae4c-0a0711bd4641/artifacts/AGROGB_DEVELOPMENT_STANDARD.md)**
- **[Histórico de Erros e Vacinas](file:///C:/Users/Bruno/.gemini/antigravity/brain/0dea86f6-86d7-4607-ae4c-0a0711bd4641/artifacts/HISTORICO_ERROS_E_VACINAS.md)**
