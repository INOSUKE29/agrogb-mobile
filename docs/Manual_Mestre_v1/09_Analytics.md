# Parte 9 – Analytics e Dashboards (Business Intelligence)

O AgroGB se livra dos relatórios em PDF pesados e adota visões de BI integradas. O foco do Analytics é gerar *Insights* Acionáveis, ao invés de apenas exibir gráficos bonitos.

## 9.1 Dashboard Gerencial (Nível Empresa)
- Faturamento Consolidado vs. Faturamento Projetado.
- Índice de Inadimplência.
- Performance de Vendas por Agrônomo/Consultor.
- Custo Operacional Total.

## 9.2 Dashboard Agronômico (Nível Técnico)
- **Mapa de Calor (Heatmap) Fitossanitário:** Mostra os talhões da região inteira. Se 3 fazendas próximas relataram Mosca-Branca hoje, o mapa de calor fica vermelho, alertando os outros agrônomos a fazerem controle preventivo.
- Evolução de NDVI (Índice de Vegetação) via integração com Satélites.
- Ranking de Eficiência de Protocolos (Lendo os dados da `kb_outcomes`).

## 9.3 Dashboard do Produtor (Nível Fazenda)
- Custo por Hectare Atual.
- Projeção de Colheita (Estimativa x Realizado).
- Histograma de Chuvas na propriedade (cruzando estações meteorológicas com previsão).

## 9.4 Relatórios Operacionais e de Conformidade
- O famoso **Caderno de Campo**: Extração detalhada exigida por frigoríficos, tradings e certificadoras (como GlobalG.A.P) contendo datas, produtos, períodos de carência respeitados e doses aplicadas.
- O sistema impossibilita "Mentiras Fiscais" (Ex: emitir caderno de campo dizendo que não aplicou defensivo quando o sistema tem a baixa de estoque atestando que houve a aplicação). Isso eleva o AgroGB a uma ferramenta de auditoria.
