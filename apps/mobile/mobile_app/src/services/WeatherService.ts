import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DadosClima {
    temperaturaAtual: number;
    temperaturaMinima: number;
    temperaturaMaxima: number;
    sensacaoTermica: number;
    umidadeRelativa: number;
    probabilidadeChuva: number; // 0-100
    volumeChuvaMmMagnitude: number; // em mm
    velocidadeVento: number; // km/h
    rajadasVento: number; // km/h
    indiceUV: number;
    nascerSol: string;
    porSol: string;
    descricao: string;
    icone: string;
}

export interface Recomendacao {
    tipo: 'AVISO' | 'ALERTA' | 'CRITICO' | 'PERIGO_GEADA' | 'RECOMENDADO';
    mensagem: string;
}

export interface AgronomicMetrics {
    et0: number; // Evapotranspiração (mm/dia)
    hmf: number; // Horas de Molhamento Foliar (horas)
    janelaPulverizacao: 'IDEAL' | 'RISCO' | 'PROIBIDO';
    janelaIrrigacao: 'IDEAL' | 'DESNECESSARIA' | 'SUSPENSA';
}

const CACHE_KEY = '@agrogb_weather_data';
const CACHE_EXPIRATION_MS = 30 * 60 * 1000; // 30 minutos

export const WeatherService = {
    // 1. Motor de Regras IA (Conforme solicitado)
    gerarRecomendacoesAgro: (dadosClima: DadosClima): Recomendacao[] => {
        const recomendacoes: Recomendacao[] = [];
        
        // Regra 1: Precipitação vs Irrigação
        if (dadosClima.probabilidadeChuva > 80 && dadosClima.volumeChuvaMmMagnitude > 5) {
            recomendacoes.push({
                tipo: 'AVISO',
                mensagem: `Previsão de chuva de ${dadosClima.probabilidadeChuva}% (${dadosClima.volumeChuvaMmMagnitude}mm). Suspenda a irrigação programada para evitar encharcamento do solo.`
            });
        }
        
        // Regra 2: Umidade e Deriva de Pulverização
        if (dadosClima.umidadeRelativa > 85) {
            recomendacoes.push({
                tipo: 'ALERTA',
                mensagem: 'Umidade relativa do ar muito alta. Evite pulverizações foliares agora para mitigar o risco de proliferação de fungos.'
            });
        }
        
        // Regra 3: Velocidade do Vento (Risco de Deriva)
        if (dadosClima.velocidadeVento > 20) {
            recomendacoes.push({
                tipo: 'CRITICO',
                mensagem: `Vento em ${dadosClima.velocidadeVento} km/h (Rajadas de ${dadosClima.rajadasVento} km/h). Risco crítico de deriva: suspenda a aplicação de defensivos imediatamente.`
            });
        }

        // Regra 4: Alertas Climáticos Extremos
        if (dadosClima.temperaturaMinima <= 4) {
            recomendacoes.push({
                tipo: 'PERIGO_GEADA',
                mensagem: `Atenção: Temperatura mínima prevista de ${dadosClima.temperaturaMinima}°C. Risco iminente de geada na lavoura!`
            });
        }
        
        // Se estiver tudo bem para pulverização
        if (dadosClima.velocidadeVento > 3 && dadosClima.velocidadeVento <= 10 && dadosClima.temperaturaAtual < 30 && dadosClima.umidadeRelativa > 50 && dadosClima.umidadeRelativa <= 85) {
            recomendacoes.push({
                tipo: 'RECOMENDADO',
                mensagem: 'Janela climática IDEAL para pulverização e aplicação foliar neste momento.'
            });
        }

        return recomendacoes;
    },

    // 2. Cálculos Agronômicos Base
    calcularMetricasAgronomicas: (dadosClima: DadosClima): AgronomicMetrics => {
        // Cálculo simplificado de ET0 (Mock para Penman-Monteith)
        // Usamos uma base empírica ligada à temperatura e vento
        const et0Base = (dadosClima.temperaturaMaxima * 0.2); 
        const et0 = Math.max(0, et0Base + (dadosClima.velocidadeVento * 0.05));

        // HMF: Estimativa baseada na umidade (se umidade > 90%, acumula molhamento)
        const hmf = dadosClima.umidadeRelativa >= 90 ? 4.5 : (dadosClima.umidadeRelativa > 80 ? 2 : 0);

        let janelaPulverizacao: 'IDEAL' | 'RISCO' | 'PROIBIDO' = 'IDEAL';
        if (dadosClima.velocidadeVento > 15 || dadosClima.temperaturaAtual > 32) janelaPulverizacao = 'RISCO';
        if (dadosClima.velocidadeVento > 20 || dadosClima.probabilidadeChuva > 80) janelaPulverizacao = 'PROIBIDO';

        let janelaIrrigacao: 'IDEAL' | 'DESNECESSARIA' | 'SUSPENSA' = 'IDEAL';
        if (dadosClima.probabilidadeChuva > 50) janelaIrrigacao = 'DESNECESSARIA';
        if (dadosClima.probabilidadeChuva > 80 && dadosClima.volumeChuvaMmMagnitude > 5) janelaIrrigacao = 'SUSPENSA';

        return {
            et0: Number(et0.toFixed(2)),
            hmf,
            janelaPulverizacao,
            janelaIrrigacao
        };
    },

    // 3. Cache Local (30 minutos) e Fetch Mock
    fetchHyperlocalWeather: async (lat: number, lon: number): Promise<DadosClima> => {
        try {
            const cached = await AsyncStorage.getItem(CACHE_KEY);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_EXPIRATION_MS) {
                    return data as DadosClima;
                }
            }

            // SIMULAÇÃO DA API AGROMETEOROLÓGICA REAL (OpenWeather / WeatherAPI)
            // A ser substituído pela chamada real de contrato:
            /*
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=YOUR_API_KEY&units=metric`);
            const json = await response.json();
            ... mapeamento ...
            */
           
            const mockData: DadosClima = {
                temperaturaAtual: 24,
                temperaturaMinima: 18,
                temperaturaMaxima: 29,
                sensacaoTermica: 25,
                umidadeRelativa: 65,
                probabilidadeChuva: 15,
                volumeChuvaMmMagnitude: 0,
                velocidadeVento: 8,
                rajadasVento: 12,
                indiceUV: 6,
                nascerSol: '06:15',
                porSol: '18:05',
                descricao: 'Céu limpo',
                icone: '01d'
            };

            await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
                data: mockData,
                timestamp: Date.now()
            }));

            return mockData;
        } catch (error) {
            console.error('Erro no serviço agrometeorológico:', error);
            throw error;
        }
    }
};
