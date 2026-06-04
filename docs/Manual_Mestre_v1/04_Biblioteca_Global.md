# Parte 4 – Biblioteca Global AgroGB (A Memória Técnica)

A maior vantagem competitiva do AgroGB não é o seu código fonte, mas sim o seu banco de dados estruturado: A **Memória Técnica Acumulada** (Scripts SQL `14_A` e `14_B`).

A Biblioteca é um imenso Grafo de Conhecimento que liga o Conhecimento Estático à Experiência Prática.

## 4.1 Entidades Núcleo (Estáticas)
1. **`kb_crops` & `kb_crop_varieties`:** O DNA das plantas (Morango -> San Andreas).
2. **`kb_nutrients`:** A tabela periódica da fazenda (N, P, K, Ca).
3. **`kb_products` & `kb_product_nutrients`:** Cadastro universal (tipo "Bula") dos insumos comerciais do mercado e suas concentrações garantidas.
4. **`kb_pests`, `kb_diseases`, `kb_deficiencies`:** O catálogo de problemas agronômicos.
5. **`kb_symptoms` & `kb_images`:** O Dicionário Visual. Permite relacionar "borda seca" a "Oídio" ou "Falta de K", base crucial para treinamento de Visão Computacional.
6. **`kb_articles`:** Referências científicas, PDFs e teses aprovadas pela curadoria do AgroGB.

## 4.2 Entidades de Manejo (Táticas)
1. **`kb_phenological_phases`:** Os estágios de vida da planta (Muda, Floração, Frutificação).
2. **`kb_fertigation_protocols` & `kb_foliar_protocols`:** Receitas padronizadas, criadas por Agrônomos ou pela Empresa, linkadas diretamente à Fase Fenológica da Cultura.
3. **`kb_combinations`:** A Matriz de Incompatibilidade. Produto A + Produto B no mesmo tanque gera fumaça? A biblioteca avisa antes do tratorista errar.
4. **`kb_indicators`:** As réguas de sucesso. Qual o Brix ideal do Morango San Andreas na colheita? 8 a 12.

## 4.3 O Motor de Aprendizado (Dinâmico)
Aqui o AgroGB se destaca do mundo:
1. **`kb_outcomes` (Resultados de Campo):** Toda recomendação tem um laudo posterior. O agrônomo aplica *Abamectina* e, 15 dias depois, a plataforma obriga a registrar o *Resultado (% de controle)*. O AgroGB acumula milhares dessas estatísticas ao longo das safras.
2. **`kb_decisions`:** O diário lógico do Agrônomo. ("Condição: Baixo Cálcio" -> "Decisão: Aumentar Nitrato de Ca" -> "Motivo: Melhorar firmeza de parede celular").
3. **`kb_experiences`:** Casos de sucesso, testes e experimentos.

**Resultado:** Em 5 anos, o AgroGB não pesquisa apenas uma bula, ele informa: *"A mistura X e Y tem 94% de sucesso na sua região para controle de Oídio no mês de Junho."*
