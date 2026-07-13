# Regras de Ouro (Vacina do Projeto AgroGB)

## Trava Anti-Regressão no Catálogo Rural

**NUNCA altere a lista de categorias do Catálogo Rural sem manter explicitamente os itens a seguir:**
- `BIOESTIMULANTES` (Bioestimulantes / Aminoácidos)
- `NUTRICAO_MINERAL` (Nutrição Mineral / Cálcio / Boro / Micronutrientes)
- `SAUDE_ANIMAL` (Saúde Animal / Vacinas / Medicamentos)

Essas categorias são críticas para a lógica de negócio (Pecuária, Cultivo Especial) e seu apagamento acidental quebra o ecossistema do produtor. As atualizações em `CadastroScreen.js` (e outros pontos que declarem `CATEGORIES`) deverão SOMENTE adicionar novas categorias ou modificar visuais, jamais apagar os pilares acima.
