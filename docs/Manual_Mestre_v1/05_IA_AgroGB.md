# Parte 5 – Inteligência Artificial AgroGB

O módulo de IA do AgroGB não é um simples Chatbot encaixado no sistema. É um **Copiloto Híbrido** que cruza Modelos de Linguagem de Grande Escala (LLMs) com RAG (Geração Aumentada por Recuperação) alimentado exclusivamente pela *Biblioteca Global (Memória Técnica)* e dados reais do cliente.

A IA opera em Múltiplos Motores:

## 5.1 Motor Diagnóstico Fitossanitário e Visual
- **Como Funciona:** O usuário tira uma foto da folha doente pelo app Offline/Mobile.
- **Cruzamento de Dados:** A IA compara a foto com a tabela `kb_images`, busca sintomas na `kb_symptoms` e analisa o clima do `Talhão` nas últimas semanas (Alta umidade? Calor?).
- **Saída:** Diagnóstico provável com nível de confiança (Ex: "85% Oídio, 15% Deficiência de Boro").

## 5.2 Motor de Prescrição Nutricional
- **Como Funciona:** O agrônomo sobe o PDF da análise de solo/folha do laboratório.
- **Cruzamento de Dados:** A IA faz OCR e extrai as métricas (pH, MO, Ca, Mg), compara com os `kb_indicators` ideais da Cultura X na Fase Fenológica Y, verifica o saldo em estoque (`Estoque Módulo`) e os custos (`kb_products`).
- **Saída:** Minuta de Receita de Fertirrigação formatada, priorizando os produtos já comprados e no barracão, visando economia e precisão.

## 5.3 Motor de Risco e Conflito (IA Guardiã)
- **Como Funciona:** Atua silenciosamente no fundo. Ao salvar uma receita ou protocolo, a IA analisa a lista de produtos.
- **Cruzamento de Dados:** Consulta a tabela `kb_combinations` (Misturas de Tanque) e os `kb_outcomes` negativos da região.
- **Saída:** Alerta Vermelho: *"Atenção! Você está misturando Cobre com Fosfito, alto risco de fitotoxidade"*.

## 5.4 Motor de Sucesso e Score (Reforço Preditivo)
A IA aprende com o erro e com o acerto. Se o Agrônomo contraria a recomendação da IA e obtém 100% de sucesso, a IA registra o laudo em `kb_outcomes`, altera o peso daquela decisão em `kb_decisions` e na próxima vez, adota a metodologia do agrônomo para problemas similares (Transferência de "Know-How").

## 5.5 Assistente Conversacional Contextualizado (O "Copiloto")
O chat flutuante presente na tela do agrônomo.
- Se perguntado: *"Qual o histórico dessa área?"*
A IA não joga no Google. Ela lê o banco Supabase: *"O Talhão 2 teve alta incidência de Ácaro há 3 meses. Custo total acumulado da safra está em R$ 45.000."*
