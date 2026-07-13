
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3️⃣ PROMPT INTERNO DA IA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const SYSTEM_PROMPT_ANALYSIS = `
VOCÊ É UMA IA AGRONÔMICA ESPECIALISTA.
SEU OBJETIVO: Analisar mídias (texto, imagem, PDF) e extrair dados técnicos estruturados.

ANTES DE RESPONDER:
1. Classificar o conteúdo em: DOENÇA, PRAGA, DEFICIÊNCIA, MANEJO, RECEITA, ARTIGO ou OBSERVAÇÃO.
2. Vincular obrigatoriamente a uma Cultura e Área (se identificável no texto).
3. Extrair: Sintomas, Causa Provável, Tipo de Problema, Controle (Bio/Químico/Cultural), Produtos/Dosagens.
4. Separar Fatos (Fonte) de Interpretação (IA).

SAÍDA ESPERADA (JSON):
{
  "classificacao_principal": "...",
  "sintomas": "...",
  "causa_provavel": "...",
  "tipo_problema": "...",
  "sugestao_controle": "...",
  "produtos": [ { "nome": "...", "dosagem": "..." } ],
  "observacoes_tecnicas": "...",
  "nivel_confianca_sugerido": "TÉCNICO"
}
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4️⃣ PROMPT DE RESPOSTA AO USUÁRIO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const USER_RESPONSE_TEMPLATE = `
FORMATO PADRÃO DE RESPOSTA:
1. O QUE FOI IDENTIFICADO: (Resumo claro)
2. POSSÍVEL CAUSA: (Agente causador)
3. MANEJO SUGERIDO: (Ações práticas)
4. OBSERVAÇÕES: (Contexto)
5. FONTE: (Origem da info)
6. ⚠️ AVISO: Esta análise é uma sugestão de IA e não substitui a visita de um Eng. Agrônomo.
`;

/**
 * Simula (ou realiza) a análise de Inteligência Artificial.
 * No futuro, substituir o 'mock' pela chamada real à API OpenAI/Gemini.
 */
export const analyzeContent = async (sourceUri, sourceType, mediaContent = null) => {
    // ---------------------------------------------------------
    // ROTEAMENTO DE EXECUÇÃO REAL VS SIMULAÇÃO
    // ---------------------------------------------------------
    console.log(`[AI SERVICE] processando: ${sourceType} -> ${sourceUri}`);

    // SIMULAÇÃO INTELIGENTE (Para demonstração do fluxo sem API Key)
    // Retorna uma análise estruturada baseada no "tipo" ou conteúdo mockado.

    return new Promise((resolve) => {
        setTimeout(() => {
            const emptyAnalysis = {
                classificacao_principal: "Serviço IA Indisponível",
                sintomas: "-",
                causa_provavel: "-",
                tipo_problema: "OFFLINE",
                sugestao_controle: "O motor de IA não está conectado. Contate o suporte técnico.",
                produtos_citados: "-",
                dosagem: "-",
                forma_aplicacao: "-",
                observacoes_tecnicas: "Regra 8: Sistema não retorna dados fantasmas.",
                fonte_informacao: "Sistema AgroGB",
                nivel_confianca_sugerido: "N/A"
            };

            resolve({
                success: false,
                data: emptyAnalysis,
                formattedResponse: "❌ Serviço de IA indisponível no momento. Não é possível gerar análise."
            });
        }, 1000);
    });
};

/**
 * Predição de Safra v5.5
 * Estima a data e o volume de colheita baseado em dados de plantio e monitoramento.
 */
export const predictHarvest = async (plantioData) => {
    console.log(`[AI PREDICT] Analisando ciclo para: ${plantioData.cultura}`);
    
    // Simulação de ciclo biológico (Pode ser expandido com API Climática)
    const ciclos = {
        'TOMATE': 90,
        'ALFACE': 45,
        'MORANGO': 120,
        'MILHO': 110,
        'SOJA': 120,
        'GERAL': 60
    };

    const diasCiclo = ciclos[plantioData.cultura.toUpperCase()] || ciclos['GERAL'];
    const dataPlantio = new Date(plantioData.data);
    const dataEstimada = new Date(dataPlantio);
    dataEstimada.setDate(dataPlantio.getDate() + diasCiclo);

    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: false,
                data: {
                    data_estimada: dataEstimada.toISOString().split('T')[0],
                    volume_estimado_kg: 0,
                    confianca: "0%",
                    status: "AGUARDANDO DADOS",
                    recomendacao: "Sem histórico suficiente para predição. O sistema de I.A. preditivo requer conexão online ativa."
                }
            });
        }, 1000);
    });
};

const formatUserResponse = (data) => {
    return `
🟢 1. IDENTIFICADO: ${data.classificacao_principal}

🔍 2. POSSÍVEL CAUSA: 
${data.causa_provavel}

🛠️ 3. MANEJO SUGERIDO:
${data.sugestao_controle}
Produtos citados: ${data.produtos_citados} (${data.dosagem})

📝 4. OBSERVAÇÕES:
${data.observacoes_tecnicas}

📚 5. FONTE: ${data.fonte_informacao}

⚠️ AVISO TÉCNICO: Sugestão gerada por IA. Confirme com um Responsável Técnico antes da aplicação.
    `.trim();
};
