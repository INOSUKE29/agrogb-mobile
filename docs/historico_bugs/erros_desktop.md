# 🖥️ Diário de Aprendizado de Bugs: AgroGB Desktop (Portal ADM)

Este documento registra os principais incidentes técnicos, "bugs silenciosos" e instabilidades críticas que assombraram o desenvolvimento do **AgroGB Desktop (Web/Vite/React)**, visando servir de consulta e ensino para garantir a imunidade do sistema.

A Diretriz Suprema de Desenvolvimento do Desktop declara que **todas as falhas listadas abaixo geraram vacinas que nunca podem ser desativadas no ESLint**.

---

## 1. O Sombreamento de Variáveis (Variable Shadowing)

> [!WARNING]
> **O Sintoma:** A tela de Financeiro Global começou a quebrar aleatoriamente (Crash de tela preta), ou emitia erros de TypeScript como `toast is possibly null`.
> 
> **A Causa:** Importamos a biblioteca global `toast` do pacote `react-hot-toast` para exibir notificações. Em seguida, declaramos um estado local chamado `const [toast, setToast] = useState(...)`. A variável local escondeu (sombreado) a importação global, destruindo o funcionamento dos alertas e causando um conflito de tipos.
> 
> **A Vacina (O Escudo Atual):** A regra `@typescript-eslint/no-shadow` foi definida como `"error"`. O código se recusa a compilar se dois escopos tentarem usar o mesmo nome de variável.

---

## 2. O Abismo do `window.require` (Contexto Incompatível)

> [!CAUTION]
> **O Sintoma:** A tela ficava completamente branca no carregamento inicial. O console do navegador exibia o erro crítico `Uncaught TypeError: window.require is not a function`.
> 
> **A Causa:** O código Vite (Browser) estava tentando importar arquivos destinados ao Node.js ou Electron (como módulos `fs`, `path` ou chamadas `require`). O navegador não conhece o `require` do Node, gerando falha letal de renderização.
> 
> **A Solução:** Separação estrita entre scripts de servidor/Electron e a interface UI.

---

## 3. A Falsa Promessa no Navegador (`NodeJS.Timeout`)

> [!NOTE]
> **O Sintoma:** Erros de TypeScript `Cannot find namespace 'NodeJS'` impediam a hot-reload (HMR) e a compilação de produção (`vite build`).
> 
> **A Causa:** Ao utilizar `setTimeout` para funcionalidades de "Optimistic UI" (como a opção "Desfazer"), o retorno do temporizador foi tipado erroneamente como `NodeJS.Timeout`. Contudo, em ambientes puros de navegador configurados no Vite, o ambiente Node não é globalmente reconhecido.
> 
> **A Solução:** Trocar o uso de `NodeJS.Timeout` por `ReturnType<typeof setTimeout>`. O "Escudo Rígido" de tipagem estrita (`no-explicit-any`) obriga o desenvolvedor a lidar com essas inconsistências de ambiente corretamente.

---

## 4. O Bloqueio Invisível (Row Level Security & Search Path)

> [!IMPORTANT]
> **O Sintoma:** O administrador logava no painel e visualizava zero solicitações pendentes na "Biblioteca Global", mas o banco de dados tinha centenas de dados. Da mesma forma, o agricultor tentava enviar dados e eles evaporavam.
> 
> **A Causa:** O Supabase aplica segurança por padrão (Row Level Security). Quando adicionamos a tabela `global_library_submissions`, esquecemos de redigir as permissões (`Policies`). O Supabase executava a regra de segurança perfeita: ninguém lê e ninguém escreve. Adicionalmente, as funções de RPC SQL (`is_admin`) sofriam bloqueios porque o `search_path` de segurança não estava exposto a esquemas públicos.
> 
> **A Lição:** O Frontend NUNCA deve confiar no próprio retorno do banco em caso de erro silencioso. E a infraestrutura do Supabase precisa sempre ter Políticas de SELECT e INSERT explícitas.

---

## 5. Abas Críticas Ocultas por Layout Responsivo

> [!NOTE]
> **O Sintoma:** Clientes ligando dizendo que não havia Aba de "Aprovações Pendentes", embora ela estivesse ativada pelo React.
> 
> **A Causa:** Excesso de conteúdo com rolagem horizontal (overflow-x) escondia as últimas abas da view, obrigando um arrasto oculto. Associado a isso, o número do "Badge" de pendências só era carregado via API se a aba fosse ativada (clicada), resultando em ausência de notificação visual global.
> 
> **A Solução:** Abas com fila de revisão (Aprovações) devem ter precedência de layout. O Fetch do contador do Badge precisa ser agnóstico à Tab ativa.

---

## 6. O Pânico do Hook Infinito (Rate Limiting)

> [!WARNING]
> **O Sintoma:** Travamento massivo de performance, alertas de limites estourados no plano do Supabase API.
> 
> **A Causa:** Efeitos React (`useEffect`) com funções dependentes ausentes em seu array de dependências, causando requisições infinitas a cada renderização do React.
> 
> **A Vacina (O Escudo Atual):** A regra `react-hooks/exhaustive-deps` foi escalada de `warn` para `"error"`. Uma única dependência faltante no Hook impedirá completamente o build.

---
**Status da Auditoria:** Concluída.
O sistema encontra-se vacinado no núcleo do Linter (`eslint.config.js`). Nunca repita esses erros.
