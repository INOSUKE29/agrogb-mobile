# Regras de Ouro (Vacina do Projeto AgroGB)

Estas são as diretrizes de desenvolvimento estritas que devem ser seguidas em todas as interações para garantir a estabilidade, padronização e usabilidade da aplicação AgroGB.

## Regra 8 - Zero Mocks e Fake Data
**Nunca** deixe dados fictícios, mocks (ex: listas estáticas de janeiro a junho, alertas falsos de boletos em atraso, valores monetários engessados) na aplicação final. 
* Onde não houver dados reais no banco (Supabase) para preencher a tela, o sistema deve assumir uma "postura de vazio" elegante.
* Gráficos devem iniciar zerados.
* Listas vazias devem mostrar mensagens informativas ("Nenhum item encontrado", "Sem títulos em atraso", "Sua saúde financeira está em dia"). 
* Não polua a visão do agricultor com números assustadores ou confusos que não existem no banco de dados dele.

## Regra 9 - Caixas de Seleção e Modais (Fim do `<select>` nativo)
O uso de tags nativas HTML `<select>` está terminantemente proibido para formulários ou telas que contenham listas longas ou requeiram um padrão visual premium. 
* Em vez de `<select>`, **sempre utilize o componente inteligente `<SearchableSelect />`**. Ele oferece busca, visual moderno (modo escuro), z-index controlável e padronização.
* Da mesma forma, evite construir modais enormes que cubram a tela inteira com fundo preto (exceto onde estritamente necessário). Prefira o uso de `DraggableModal` quando possível.

## Regra 10 - Comportamento Padrão do SearchableSelect (Evite Fake IDs)
O componente `<SearchableSelect />` possui a prop `allowCustom`. 
* **O valor padrão para `allowCustom` deve ser `false`**.
* Motivo: Se permitido (`allowCustom=true`), o usuário ganha o botão `+ Adicionar "XYZ"` e pode inserir um texto livre em um campo que na verdade espera um UUID (Foreign Key para o banco). Isso quebra o salvamento no banco de dados! 
* Só use `allowCustom=true` em selects que atuam como ComboBox de texto livre, nunca em relacionamentos de FK (como "Cliente Destino", "Produto" ou "Fornecedor"). O padrão já é `false` no código base, não o sobrescreva sem motivo.
