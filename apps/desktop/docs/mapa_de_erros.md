# Mapa de Erros (AgroGB)

Este documento cataloga os erros mais críticos enfrentados durante o desenvolvimento e como resolvê-los rapidamente (vacinas).

## Erro 1: "Tela Branca" ao acessar o sistema (React Router)
**Sintomas**: Toda a interface some, o React não renderiza o Header nem o Sidebar, console mostra erro de "Element type is invalid" ou "No routes matched".
**Causa**: Um arquivo `.tsx` de uma rota foi apagado, movido ou renomeado, mas o `App.tsx` continua tentando importá-lo.
**Solução (Vacina)**:
1. Sempre que remover ou renomear um arquivo em `src/screens`, vá imediatamente ao `src/App.tsx`.
2. Remova o `import` quebrado.
3. Remova ou comente a tag `<Route path="..." element={<Screen />} />`.

## Erro 2: Supabase falha silenciosamente ao salvar no Banco (RLS)
**Sintomas**: Você clica em "Salvar", nenhuma mensagem de erro aparece no console do frontend, mas os dados não aparecem na tabela do Supabase.
**Causa**: O banco de dados tem `Row Level Security (RLS)` ativado. Se você tentar dar `insert` numa linha onde a coluna de dono (`agronomist_id`, `cliente_id`, ou `user_id`) não bater com o `auth.uid()` do token logado, o Supabase descarta o insert silenciosamente (ou lança erro PGRST116/401 se você estiver escutando).
**Solução (Vacina)**:
1. Antes de enviar o payload para inserção, injete explicitamente o ID do usuário: `agronomist_id: (await supabase.auth.getUser()).data.user.id`.
2. Se o dado pertencer ao produtor, garanta que a política RLS tem regra para "Agrônomos podem inserir dados para seus clientes".

## Erro 3: Insumos de Receita desaparecendo / Salvos errados
**Sintomas**: Ao salvar uma "Receita/Recomendação" com blocos múltiplos (Foliar, Solo), todos os insumos perdem a referência de qual bloco pertenciam.
**Causa**: O banco não possuía a coluna `etapa_aplicacao` em `receita_insumos` para separar os itens de cada aplicação.
**Solução (Vacina)**:
Foi injetada a coluna `etapa_aplicacao`. O frontend agora envia no payload da API: `etapa_aplicacao: 'Foliar 1'`. Se for recriar tabelas no Supabase, sempre lembre de prever como as listas 1:N serão categorizadas.

## Erro 4: Dropdowns com Fundo Branco em Temas Escuros
**Sintomas**: Tags `<select>` tem o CSS correto, mas ao clicar para abrir as opções, a lista suspensa (`<option>`) fica com fundo branco e texto branco, tornando-se invisível.
**Causa**: O `<select>` base estava com `bg-transparent` (ou rgba transparente), fazendo o sistema operacional injetar a cor branca nativa no dropdown.
**Solução (Vacina)**:
Colocar uma cor de fundo sólida no select principal (ex: `className="bg-[#112240]"`) e nas tags option (`className="bg-[#0a192f]"`).

## Erro 5: ClienteDashboard / AdminDashboard poluídos
**Sintomas**: Produtor acha o sistema difícil de usar, muita informação sobre "Frota", "Custos" que não foi contratado. Admin vendo gráficos com dados "mockados" que geram confusão com dados reais.
**Causa**: Importação de templates de ERP genéricos.
**Solução (Vacina)**:
Excluir dados lúdicos ("fake data"). Na ausência de faturamento real, melhor exibir a mensagem "Gráficos Disponíveis em Breve" do que injetar dados falsos. Limpar os atalhos mantendo apenas a essência: Recomendações e Meu Consultor.
