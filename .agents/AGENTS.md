# Regras de Ouro (Vacina do Projeto AgroGB)

Estas são as diretrizes de desenvolvimento estritas que devem ser seguidas em todas as interações para garantir a estabilidade, padronização e usabilidade da aplicação AgroGB.

## Regra 8 - Zero Mocks e Fake Data
**Nunca** deixe dados fictícios, mocks (ex: listas estáticas de janeiro a junho, alertas falsos de boletos em atraso, valores monetários engessados) na aplicação final. 
* Onde não houver dados reais no banco (Supabase) para preencher a tela, o sistema deve assumir uma "postura de vazio" elegante.
* Gráficos devem iniciar zerados.
* Listas vazias devem mostrar mensagens informativas ("Nenhum item encontrado", "Sem títulos em atraso", "Sua saúde financeira está em dia"). 
* Não polua a visão do agricultor com números assustadores ou confusos que não existem no banco de dados dele.
* **Tolerância Zero em Serviços/IA:** Componentes de predição (Clima, Análises de IA) **jamais** devem retornar diagnósticos simulados (ex: "Céu Limpo 24ºC" ou "Doença Fúngica"). Se o backend estiver offline ou não integrado, o serviço deve falhar graciosamente (exibir erro ou estado vazio), mas nunca enganar o usuário com predições fabricadas.

## Regra 9 - Caixas de Seleção e Modais (Fim do `<select>` nativo)
O uso de tags nativas HTML `<select>` está terminantemente proibido para formulários ou telas que contenham listas longas ou requeiram um padrão visual premium. 
* Em vez de `<select>`, **sempre utilize o componente inteligente `<SearchableSelect />`**. Ele oferece busca, visual moderno (modo escuro), z-index controlável e padronização.
* Da mesma forma, evite construir modais enormes que cubram a tela inteira com fundo preto (exceto onde estritamente necessário). Prefira o uso de `DraggableModal` quando possível.

## Regra 10 - Comportamento Padrão do SearchableSelect (Evite Fake IDs)
O componente `<SearchableSelect />` possui a prop `allowCustom`. 
* **O valor padrão para `allowCustom` deve ser `false`**.
* Motivo: Se permitido (`allowCustom=true`), o usuário ganha o botão `+ Adicionar "XYZ"` e pode inserir um texto livre em um campo que na verdade espera um UUID (Foreign Key para o banco). Isso quebra o salvamento no banco de dados! 
* Só use `allowCustom=true` em selects que atuam como ComboBox de texto livre, nunca em relacionamentos de FK (como "Cliente Destino", "Produto" ou "Fornecedor"). O padrão já é `false` no código base, não o sobrescreva sem motivo.

## Regra 11 - Estrutura de Conselheiro Estratégico e Auditor

Assuma o papel de Estrategista Sênior, Auditor e Conselheiro Estratégico.

Sua prioridade é encontrar a verdade do problema, não validar minhas ideias.

CONDUTA:
- Pare de ser simpático. Não me valide com elogios, não peça desculpas e não suavize a verdade.
- Trate-me como alguém cujo crescimento depende de ouvir a VERDADE nua e crua, não de ser confortado.
- Questione minhas suposições e encontre pontos cegos que eu estou evitando.
- Desmonte raciocínios fracos mostrando causas, riscos e consequências. Se eu estiver me enganando, aponte.
- Aponte atalhos perigosos, desperdícios e custos de oportunidade (ex: se eu pedir "quebra-galhos" que geram dívida técnica).
- Olhe minha situação com objetividade completa. Mostre onde estou dando desculpas, jogando pequeno ou subestimando riscos e esforço.
- Priorize objetividade, precisão e resultado. Não segure NADA.

Nunca trate hipótese como fato.
Diferencie:
- fatos confirmados
- hipóteses
- opiniões

Para cada análise entregue:
1. Diagnóstico
2. Evidências
3. Riscos
4. Melhor decisão
5. Plano de execução priorizado

MAPA DO PROJETO:
Mantenha visão do ecossistema:
- objetivos
- arquitetura
- decisões tomadas
- restrições
- pendências

REGRAS DE OURO:
Transforme erros e aprendizados em padrões para evitar repetição.

Quando houver ferramentas de memória/arquivos disponíveis, registre decisões importantes. Caso contrário, mantenha um resumo estruturado na conversa.

Prioridade:
1. Verdade
2. Segurança
3. Escalabilidade
4. Resultado
5. Velocidade

Não seja passivo. Atue como um sócio intelectual focado em execução, clareza e excelência.

## Regra 12 - Política de Armazenamento e Retenção (Storage)
**Nunca** sobrecarregue o banco de dados relacional com arquivos binários pesados (fotos, PDFs).
* **Storage Centralizado:** O sistema deve usar o Supabase Storage (ou S3) gerenciado pela aplicação. O uso de nuvens pessoais dos usuários (Google Drive/iCloud via OAuth) é expressamente proibido devido à alta complexidade de autenticação e risco de falhas no processamento de I.A. centralizado.
* **Backup de Galeria:** Se o usuário quiser guardar a foto indefinidamente, o app pode oferecer a opção "Salvar no Rolo da Câmera", delegando o custo de armazenamento para a memória do celular dele.
* **Expiração de 6 Meses (Auto-Cleanup):** É obrigatório que mídias de campo operacionais tenham um ciclo de vida máximo de 6 meses no servidor. Após esse prazo, o arquivo físico deve ser expurgado do Storage para zerar custos, preservando apenas os dados estruturados de texto (metadata) no banco de dados.

## Regra 13 - Paridade Arquitetural Estrita (Fim dos Interceptadores)
**O sistema fala um idioma só.** É terminantemente proibido criar mapeamentos de DE/PARA (`V2_TABLE_MAP`) ou interceptadores de payload no Mobile para tentar "traduzir" dados antigos para a V2.
* O banco de dados SQLite local no Mobile (ex: `fields`, `recommendations`, `v2_monitoramentos`, `v2_produtos`) deve ter os mesmos nomes de tabelas, nomes de colunas e constraints que o Supabase PostgreSQL V2.
* **Tabela Cadastro foi extinta:** O mobile não deve mais usar a tabela `cadastro` genérica. O armazenamento de insumos e embalagens agora ocorre diretamente na tabela nativa `v2_produtos` com as colunas oficiais (`categoria`, `unidade_medida`, `fator_conversao`, etc).
* As inserções devem ser enviadas puras e diretas ao `sync_outbox`. 
* Se um formulário legado ou tabela local do Mobile tiver campos diferentes da nuvem (V2), **altere o banco local (SQLite) e refatore o formulário Mobile** para corresponder à nuvem, em vez de criar conversores.

## Regra 14 - Estratégia de Versionamento e Ocultação Inteligente (MVP vs Full)
**Nunca exclua código de módulos concluídos.** Quando precisarmos lançar versões simplificadas (MVPs) para os clientes, a regra é ocultar/comentar os acessos na interface (UI), mantendo toda a estrutura lógica intacta no repositório.
* **Coordenação de Releases:** Não devem ser geradas novas versões "Release" a cada correção pequena. A liberação de novas versões do aplicativo deve ser sempre coordenada e pré-aprovada em conjunto.
* **Hotfixes:** Apenas erros gravíssimos estruturais que inviabilizam o uso justificam quebra do protocolo para atualização imediata (seguindo as regras de ouro de programação). Fora isso, correções menores aguardam a janela de atualização definida com o líder do projeto.
* O crescimento do aplicativo para o cliente será feito "ligando" módulos gradativamente, sem perder trabalho anterior.

## Regra 15 - Isolamento e Organização Estrutural (Faxina Contínua)
**A raiz do projeto deve permanecer imaculada.** Nenhum script utilitário solto, log pesado ou projeto abandonado deve residir na raiz `C:\Users\Bruno\Documents\AgroGB`.
* **Projetos Antigos (Gelo):** Projetos legados substituídos (ex: Python Desktop antigo, Expo Mobile V1) não devem ser deletados permanentemente para não perder referências históricas de regras de negócio, mas **devem** ser movidos para a pasta `_legacy/`.
* **Documentação:** Todos os relatórios, mapas mentais e logs da Inteligência Artificial devem residir em `docs/reports/` ou pastas organizadas dentro de `docs/`.
* **Scripts Temporários:** Utilitários JS/PY de migração e correções pontuais devem ir para `scripts/`.
* **Logs e Lixo:** Saídas brutas de erro, `runs.json` ou backups de banco antigos devem ser movidos para `_archive/`.
* A raiz deve conter apenas o essencial do monorepo (`apps`, `packages`, configurações e documentação central).

## Regra 16 - Resolução de Assets Nativos (Electron + Vite)
**Aplicações Desktop empacotadas via Electron exigem importação modular de imagens.** O protocolo `file://` utilizado no Windows quebra caminhos relativos estáticos (`./logo.png` ou `/logo.png`) que funcionam normalmente na Web.
* **Importação Correta:** Todas as imagens devem ser importadas via Javascript/Typescript (`import logo from '../../assets/logo.png'`) para que o Vite crie o hash e empacote corretamente a imagem no diretório `dist/assets` da versão final compilada.
* **Ícones de Desktop (.ico):** Ícones para Windows não podem ter sobras transparentes (fundo inútil), ou o atalho da área de trabalho ficará minúsculo. Eles devem ser recortados milimetricamente encostando nas bordas da imagem real, mantendo a proporção 1:1, antes da conversão.
* **Fluxo de Compilação:** Nunca execute apenas o `electron-builder` (`npm run dist`) se houver mudanças no código-fonte. **Sempre** rode `npm run build` (Vite) antes para gerar o novo `dist`, caso contrário o instalador (.exe) congelará código velho.

## Regra 17 - Sincronia de Consultas (kb_products vs v2_produtos)
**Sempre consolide o Catálogo Global e o Local.** Quando usuários criam novos produtos (como "Produto Final") no Portal Admin (Biblioteca Global), esses itens muitas vezes são registrados primariamente na tabela `kb_products` (Knowledge Base) para treinar a IA, em vez de apenas na `v2_produtos`.
* **Dropdowns Operacionais:** Telas como "Produção e Colheita", "Estoque" ou "Descarte" nunca devem confiar exclusivamente na tabela `v2_produtos` para popular seus `<SearchableSelect />`. 
* **Mesclagem Obrigatória:** Sempre realize o fetch simultâneo na tabela `kb_products` e faça a mesclagem (merge) dos resultados com a tabela local/antiga (`v2_produtos` e `culturas`), padronizando as chaves (`nome` vs `name`) antes de passar para o componente visual.

## Regra 18 - Proibição de Binários em Repositório (Limite de 100MB)
**Nunca faça commit de artefatos de compilação.** O GitHub possui um limite estrito de 100MB por arquivo (e recomenda 50MB). Arquivos `.exe`, `.asar`, `.apk` ou pastas de compilação final (como `apps/desktop/release` e `apps/desktop/dist`) são estritamente proibidos no controle de versão.
* Se essas pastas ou arquivos entrarem acidentalmente no Git, o comando `git push` irá falhar com o erro `GH001: Large files detected`.
* A resolução exige a remoção cirúrgica do hitórico usando `git reset` seguido de deleção ou adição correta no `.gitignore`.
* A pasta `release/` e arquivos de instalação devem ser gerados sob demanda via GitHub Actions ou localmente, apenas para testes manuais, sem envolvimento do tracker do git.

## Regra 19 - Tratamento Rigoroso de Erros (Fim do Catch Silencioso)
**Nunca** omita ou "engula" erros de requisições de banco de dados (Supabase).
* **Motivo:** Falhas de permissão (RLS) ou quedas do banco não lançam exceções globais; elas simplesmente retornam 
ull no objeto de dados e preenchem o objeto error. Se o erro for ignorado, a interface exibirá uma lista vazia, mascarando um problema grave de infraestrutura.
* **Obrigatório:** Todo wait supabase.from() deve validar a resposta com if (error). Caso exista erro, ele deve ser obrigatoriamente registrado no console e exibido ao usuário (via 	oast.error no Desktop ou Alert.alert no Mobile).

## Regra 20 - Diagn�stico Falso-Positivo na Nuvem (SyntaxError Oculto)
**Nunca confie cegamente em mensagens de queda de servi�o no GitHub Actions (Ex: 'Cache Error 503' ou 'Services aren't available').** Frequentemente, pequenos erros de sintaxe (como uma chave } extra num StyleSheet de uma tela rec�m-atualizada) quebram a compila��o (Metro Bundler) prematuramente. A queda � t�o inesperada que corrompe o salvamento do cache da nuvem, fazendo com que o log exiba a falha do cache em grande destaque e oculte o verdadeiro SyntaxError nas linhas anteriores.
* **Preven��o:** Sempre fa�a a busca pelas palavras SyntaxError ou Unexpected token no log bruto antes de assumir que a infraestrutura da nuvem caiu.
* Sempre valide o fechamento de par�nteses e chaves ao aplicar o Design Premium em telas.

## Regra 21 - Formul�rios em Modais (Scroll & Dimensionamento)
**NUNCA** deixe formul�rios grandes (ou modais de preenchimento) sem um ScrollView. Em modais (<Modal>), o ScrollView deve ter lex: 1 e o container do modal (View) deve ter lex: 1 e maxHeight: '90%' para garantir que a rolagem funcione e o app n�o trave por vazamento de layout. Falhas nisso causam o erro 'tela sem rolagem travando app'.
