# MAPA DE ARQUITETURA AGROGB (MONOREPO TURBO)

Conforme a nossa decisão estratégica, o projeto AgroGB migrou de aplicações separadas para um **Ecossistema Unificado Monorepo** usando `pnpm workspaces` e `Turborepo`.

## Estrutura Física Criada
```text
C:\Users\Bruno\Documents\AgroGB\
│
├── apps/
│   ├── desktop/      (Onde construiremos o painel Electron/React)
│   ├── web/          (Onde construiremos o painel para navegadores)
│   └── mobile/       
│       └── mobile_app/ (Repositório Original - Single Source of Truth do App e Builds)
│
├── packages/
│   ├── auth/         (Regras de autenticação Supabase / Permissões RLS)
│   ├── database/     (Schemas do banco de dados)
│   ├── services/     (Acesso ao banco: recommendationService.ts, etc)
│   ├── shared/       (Tipos globais, Constantes, Regras agronômicas)
│   └── ui/           (Botões, Cards, Cores, Design System Premium)
│
├── pnpm-workspace.yaml
└── turbo.json
```

## Como o Cérebro Funciona Agora
- **Nenhum código se repete.**
- Quando formos criar a função de "Adicionar Talhão" no Desktop, nós **não** vamos escrever a lógica no Desktop. Vamos escrever dentro de `packages/services/talhoesService.ts`.
- O aplicativo Mobile vai importar exatamente a mesma função.
- O aplicativo Desktop vai importar exatamente a mesma função.
- **Resultado:** A manutenção cai pela metade e os dois aplicativos trabalham em perfeita harmonia (Tempo Real).

## Evolução Recente (Maio/2026)
- **Migração Concluída:** Toda a base do aplicativo Mobile foi isolada em `apps/mobile/mobile_app`.
- **Auditoria Máxima:** Concluímos as 10 Fases da Auditoria Estrutural. Foi provado que o erro `useTheme` decorria de cache de versões anteriores, visto que os provedores relacionados (`WeatherProvider`, `SyncProvider`) foram expurgados da branch principal.
- **Limpeza de Build:** Limpamos mais de 350 MB de arquivos pesados inúteis (`agrogb-dev.apk`, backups `.zip`) que travavam o envio para o GitHub Actions.
- **Correção de CI/CD (GitHub Actions):** Removemos pastas `.git` residuais dentro de `apps/desktop` e `apps/mobile/mobile_app` e atualizamos todos os caminhos do arquivo `build-apk.yml` para apontarem corretamente para o novo Monorepo (`./apps/mobile/mobile_app/...`), garantindo que o NodeJS consiga fazer cache e compilar a APK em nuvem sem erros de rota.
# MAPA DE ARQUITETURA AGROGB (MONOREPO TURBO)

Conforme a nossa decisão estratégica, o projeto AgroGB migrou de aplicações separadas para um **Ecossistema Unificado Monorepo** usando `pnpm workspaces` e `Turborepo`.

## Estrutura Física Criada
```text
C:\Users\Bruno\Documents\AgroGB\
│
├── apps/
│   ├── desktop/      (Onde construiremos o painel Electron/React)
│   ├── web/          (Onde construiremos o painel para navegadores)
│   └── mobile/       
│       └── mobile_app/ (Repositório Original - Single Source of Truth do App e Builds)
│
├── packages/
│   ├── auth/         (Regras de autenticação Supabase / Permissões RLS)
│   ├── database/     (Schemas do banco de dados)
│   ├── services/     (Acesso ao banco: recommendationService.ts, etc)
│   ├── shared/       (Tipos globais, Constantes, Regras agronômicas)
│   └── ui/           (Botões, Cards, Cores, Design System Premium)
│
├── pnpm-workspace.yaml
└── turbo.json
```

## Como o Cérebro Funciona Agora
- **Nenhum código se repete.**
- Quando formos criar a função de "Adicionar Talhão" no Desktop, nós **não** vamos escrever a lógica no Desktop. Vamos escrever dentro de `packages/services/talhoesService.ts`.
- O aplicativo Mobile vai importar exatamente a mesma função.
- O aplicativo Desktop vai importar exatamente a mesma função.
- **Resultado:** A manutenção cai pela metade e os dois aplicativos trabalham em perfeita harmonia (Tempo Real).

## Evolução Recente (Maio/2026)
- **Migração Concluída:** Toda a base do aplicativo Mobile foi isolada em `apps/mobile/mobile_app`.
- **Auditoria Máxima:** Concluímos as 10 Fases da Auditoria Estrutural. Foi provado que o erro `useTheme` decorria de cache de versões anteriores, visto que os provedores relacionados (`WeatherProvider`, `SyncProvider`) foram expurgados da branch principal.
- **Limpeza de Build:** Limpamos mais de 350 MB de arquivos pesados inúteis (`agrogb-dev.apk`, backups `.zip`) que travavam o envio para o GitHub Actions.
- **Correção de CI/CD (GitHub Actions):** Removemos pastas `.git` residuais dentro de `apps/desktop` e `apps/mobile/mobile_app` e atualizamos todos os caminhos do arquivo `build-apk.yml` para apontarem corretamente para o novo Monorepo (`./apps/mobile/mobile_app/...`), garantindo que o NodeJS consiga fazer cache e compilar a APK em nuvem sem erros de rota.
- **Banco de Dados (SQL):** Mapeamos e adicionamos novos módulos cruciais para o ecossistema: Tarefas Kanban (`06_A_tarefas_kanban.sql`) e Compras/Fornecedores (`07_A_compras_fornecedores.sql`).
- **Expansão Futura (Idea/Roadmap):** Registramos no código e na arquitetura que a **Biblioteca Global**, atualmente focada em Produtos/Insumos, poderá no futuro ser expandida para abrigar o **Catálogo Fitossanitário (Doenças e Pragas de Plantio)** com galeria de fotos.

## Próximos Passos (Imediatos)
1. Iniciar o desenvolvimento dos Shared Services dentro da pasta `packages/` (transferindo lógicas do Mobile para a raiz).
2. Plugar o React Native (Mobile) e o Vite/Next.js (Desktop) simultaneamente neste novo motor compartilhado.

## Documentos Essenciais
- [AgroGB Knowledge Map](./AGROGB_KNOWLEDGE_MAP.md) - Regras de negócio.
- [Plano de Melhoria de Produtividade](./AGROGB_PRODUCTIVITY_ENHANCEMENT_PLAN.md) - Plano de desenvolvimento UI/UX futuro.
- **[Relatório de Ouro do AgroGB](file:///C:/Users/Bruno/.gemini/antigravity/brain/0dea86f6-86d7-4607-ae4c-0a0711bd4641/artifacts/RELATORIO_DE_OURO.md)** - Dossiê técnico definitivo contendo os melhores componentes, motores e integrações já desenvolvidos na história do projeto.
- **[Walkthrough de Integração de UI](file:///C:/Users/Bruno/.gemini/antigravity/brain/0dea86f6-86d7-4607-ae4c-0a0711bd4641/artifacts/walkthrough.md)** - Registro das últimas injeções de componentes na Tela Inicial.

## Dinâmica de Trabalho com IA (Antigravity + Jules)
Para garantir máxima eficiência no desenvolvimento do AgroGB, estabelecemos um modelo de **Liderança Técnica (Tech Lead)**:
- **Antigravity (Eu):** Atuo como Tech Lead e desenvolvedor focado no momento. Faço modificações rápidas, ajustes de UI/UX, resolvo erros instantâneos e tomo decisões de arquitetura em pair programming.
- **Jules (Agente Autônomo Google):** Atua como desenvolvedor de background. Recebe as tarefas que eu delego via terminal (ex: `jules new "tarefa"`) para realizar o "trabalho pesado" (refatorações em massa, criação de testes, atualizações em dezenas de arquivos) de forma assíncrona, abrindo Pull Requests no GitHub quando finalizar.
