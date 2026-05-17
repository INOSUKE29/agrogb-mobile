# AGROGB MOBILE - PLANO DE RECONSTRUÇÃO E INTEGRAÇÃO FINAL (v7.0)

Este documento apresenta o plano técnico estruturado e definitivo para consolidar 100% da lógica operacional clássica da pasta `mobile_app` dentro da arquitetura premium e estável da pasta `agrogb-mobile-main`.

---

## 1. REVISÃO DO USUÁRIO REQUERIDA

> [!IMPORTANT]
> A modernização visual do AgroGB Mobile v7.0 obteve sucesso absoluto em estabilizar o build Gradle, evitar crashes em cascata de biometria e consolidar o design system escuro baseado em HSL. A restauração da lógica deve preservar essa estabilidade intocada.

> [!WARNING]
> O banco de dados do AgroGB v7.0 agora utiliza UUIDs em formato texto para todas as PKs em vez de IDs autoincrementais de inteiros clássicos. Isso evita conflitos de chaves durante a sincronização em tempo real de múltiplos dispositivos offline com o Supabase. Todas as funções históricas importadas foram adaptadas para usar a biblioteca `uuid` (`v4`).

---

## 2. PROPOSTA DE MODIFICAÇÕES POR COMPONENTES

### MÓDULO DE ADUBAÇÃO E RECEITAS
Garantir o fluxo completo: Criação de Receita -> Baixa Automática no Estoque -> Registro no Livro de Campo -> Lançamento Financeiro.

#### [MODIFY] [database.js](file:///c:/Users/Bruno/Documents/AgroGB/agrogb-mobile.-main/src/database/database.js)
*   **O que muda:** Inicialização garantida da tabela `production_fertilization_items` no esquema principal.
*   **Motivo:** Suporte ao carrinho de insumos do estoque vinculados a cada plano individual.

#### [MODIFY] [AdubacaoFormScreen.js](file:///c:/Users/Bruno/Documents/AgroGB/agrogb-mobile.-main/src/screens/AdubacaoFormScreen.js)
*   **O que muda:** Reincorporação do Modal de Estoque com consulta dinâmica em tempo real via `getEstoque()`.
*   **Motivo:** Permitir ao produtor selecionar produtos reais, unidades e dosagens ao criar planos agrícolas.

#### [MODIFY] [AdubacaoDetailScreen.js](file:///c:/Users/Bruno/Documents/AgroGB/agrogb-mobile.-main/src/screens/AdubacaoDetailScreen.js)
*   **O que muda:** Loop de abate físico em `atualizarEstoque()`, inserção em `movimentacao_estoque` e geração automática do log descritivo em `caderno_notas`.
*   **Motivo:** Automação completa do ciclo físico-agronômico na finalização da adubação.

---

### MÓDULO DE INTEGRAÇÃO FINANCEIRA
Garantir a alimentação de dados em tempo real nas abas de DRE e Fluxo de Caixa a partir das atividades físicas.

#### [MODIFY] [VendaService.js](file:///c:/Users/Bruno/Documents/AgroGB/agrogb-mobile.-main/src/services/VendaService.js)
*   **O que muda:** Adição de gatilho automático pós-venda para inserir uma transação de entrada pendente (`RECEBER`) na tabela `financeiro_transacoes`.
*   **Motivo:** Alimentar dinamicamente o fluxo de caixa de receitas sem exigir lançamentos manuais redundantes do produtor.

#### [MODIFY] [CompraService.js](file:///c:/Users/Bruno/Documents/AgroGB/agrogb-mobile.-main/src/services/CompraService.js)
*   **O que muda:** Adição de gatilho automático pós-compra de insumo para inserir uma transação de saída pendente (`PAGAR`) na tabela `financeiro_transacoes`.
*   **Motivo:** Garantir a entrada automática das obrigações financeiras no DRE da safra corrente.

---

## 3. PLANO DE VERIFICAÇÃO E CORREÇÃO FORENSE

### Testes Automatizados no Banco
Executar rotinas SQL locais para garantir que a gravação do plano adubação, receita de insumos, caderno de campo e abate de estoque ocorram sob transações seguras:
```bash
# Comando de validação do banco local sqlite
node scripts/validate_db_integrity.js
```

### Validação Visual com Dispositivo/Emulador
1.  **Criação de Plano:** Abrir o novo formulário de Adubação, abrir o catálogo do estoque, selecionar adubos e salvar.
2.  **Baixa de Estoque:** Acessar os detalhes do plano criado, pressionar **"DEDUZIR ESTOQUE E APLICAR"**, verificar o alerta de sucesso.
3.  **Livro de Campo:** Acessar a aba "Caderno de Campo" e verificar a nota técnica gerada automaticamente.
4.  **Saldos do Estoque:** Acessar a aba "Estoque" e auditar se os insumos aplicados foram fisicamente subtraídos dos saldos correntes.

---

## 4. CRITÉRIOS DE ACEITAÇÃO DE SUCESSO

O projeto será certificado como **100% Reconstituído** quando:
1.  A totalidade das regras agronômicas e de estoque de `mobile_app` estiver executando em `agrogb-mobile-main`.
2.  Nenhuma tela premium ou navegação da v7.0 modernizada quebrar ou apresentar regressões visuais.
3.  O pipeline de build e empacotamento do APK compilar sem erros de bundling ou arquivos ausentes.
