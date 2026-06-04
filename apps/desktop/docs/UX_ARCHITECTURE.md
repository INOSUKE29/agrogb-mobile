# Manifesto de UX e Design de Contexto (AgroGB Pro)

Este documento atua como o "Mapa de Conhecimento" do ecossistema AgroGB, consolidando as diretrizes de UX Architecture, Design System e Engenharia de Qualidade estabelecidas para o ciclo 2025-2026. Ele deve ser a fonte da verdade para futuras implementações guiadas por IA ou desenvolvedores humanos.

## 1. Fundamentos: Human-Centered Design (HCD) & HCAI
Baseado na ISO 9241-210, o sistema não foca apenas na interface (UCD), mas no bem-estar organizacional e redução de atritos operacionais no campo.
* **HCAI (Human-Centered AI):** A IA atua como orquestradora de estados e "aceleradora de produtividade". O controle final pertence ao humano (accountability).
* **Prevenção do "Gap de Mês 3":** Projetar para o contexto real (campo, luz do sol, cansaço) e não apenas para testes de laboratório.

## 2. As Heurísticas Aplicadas ao AgroGB
Baseadas em Jakob Nielsen, com foco absoluto nas duas principais:
1. **Visibilidade do Status:** Uso obrigatório de `Skeleton.tsx` em transições de dados de rede. Telas vazias estão proibidas.
2. **Prevenção e Recuperação de Erros:** Ações destrutivas (Ex: "Excluir Talhão") devem ser envelopadas obrigatoriamente por nosso `Modal.tsx` de confirmação.

## 3. Ergonomia e "Thumb Zone"
Considerando o uso tático no campo (mesmo em tablets/mobile access):
* Zonas verdes (CTAs principais) concentradas em áreas de fácil alcance inferior/central.
* Alvos de toque (touch targets) estritamente maiores que 44x44px.

## 4. Arquitetura de Tokens (M3 Expressive)
O Figma Code / Design System é governado por três camadas rígidas, refletidas no TailwindCSS v4 (`index.css`):
1. **Tokens Primitivos:** Valores brutos (ex: `#10B981`). Não usar no código de UI.
2. **Tokens Semânticos:** Propósitos (ex: `--color-primary`, `--color-background`).
3. **Componentes Slots:** Interfaces resilientes baseadas em Auto Layout (ex: `<Card><CardHeader/></Card>`).

**Regra do Desanexo (Detach Test):** O desenvolvedor não deve ter que usar `style={{}}` ou `!important`. Se o componente não prevê o estado, o componente deve ser corrigido.

## 5. Qualidade de Software (Obrigatória)
A velocidade da IA (Vibe Coding) não substitui auditorias. A arquitetura exige:
* Respeito à renderização nativa (sem latências).
* Início iminente de testes E2E (Ex: Cypress) focados em fluxos críticos para evitar o "Gap de Mês 3".
  * **Casos Críticos (CT):** Todo componente de segurança de UX (Modais de prevenção de erro) e de feedback visual (Skeletons) deve possuir cobertura.
  * **Exemplo Ativo:** O script `cypress/e2e/talhoes.cy.ts` já garante por contrato que as Heurísticas de Nielsen (Visibilidade de Status e Prevenção de Erro) não sejam acidentalmente quebradas no futuro da aplicação.

## 6. Pipeline de Design Tokens e MD3
Em preparação para escalar o AgroGB:
* **Translation Layers:** A evolução natural será usar ferramentas (como Style Dictionary) para que as variáveis do Figma gerem automaticamente as variáveis do `index.css` via pipeline de CI/CD.
* **Formas MD3:** Aderir aos 35 formatos e tipografia enfatizada do Material Design 3.

## 7. Context Design e MCP
Não fazemos mais "Prompt Engineering", fazemos "Context Design". O agente de IA utiliza o protocolo MCP para entender o ecossistema dinâmico (histórico, estado, ferramentas) e prever inconsistências de design e arquitetura antes do código ser escrito.

## 8. Arquitetura Desktop (Electron Trade-offs)
Sabemos que nossa base atual web envelopada no Desktop via Electron/WebView foca em velocidade de *time-to-market*. Para mitigar o alto consumo de RAM intrínseco dessa arquitetura web, a prioridade absoluta é implementar estratégias rigorosas de *Lazy Loading* e gestão de memória conforme a aplicação for crescendo.
