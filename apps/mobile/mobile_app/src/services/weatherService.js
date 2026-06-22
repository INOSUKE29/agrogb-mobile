import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';

// API Open-Meteo (Sem necessidade de Chave / 100% Gratuita e Confiável)
const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

export const WeatherService = {
    getLocation: async (forceRequest = false) => {
        try {
            let { status } = await Location.getForegroundPermissionsAsync();

            if (status !== 'granted' && forceRequest) {
                const req = await Location.requestForegroundPermissionsAsync();
                status = req.status;
            }

            if (status !== 'granted') return null;

            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const coords = { lat: location.coords.latitude, lon: location.coords.longitude };
            await AsyncStorage.setItem('user_location', JSON.stringify(coords));
            return coords;
        } catch (error) {
            const cached = await AsyncStorage.getItem('user_location');
            return cached ? JSON.parse(cached) : null;
        }
    },

    getWeather: async (lat, lon) => {
        try {
            // URL da Open-Meteo com Temperatura, Humidade, Vento, Código WMO, Previsão Max/Min diária e Índice UV
            const endpoint = `${BASE_URL}?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relative_humidity_2m,precipitation_probability,uv_index&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max&timezone=auto`;

            const response = await fetch(endpoint);

            if (!response.ok) {
                console.log('⚠️ Aviso Weather API:', response.status);
                throw new Error('Weather API Error');
            }

            const data = await response.json();
            
            // Dados Atuais
            const current = data.current_weather;
            const temp = Math.round(current.temperature);
            const wind = Math.round(current.windspeed);
            const wmoCode = current.weathercode;
            
            // Humidade (Pegando a humidade da hora atual)
            const hourIndex = new Date().getHours();
            const humidity = data.hourly?.relative_humidity_2m?.[hourIndex] || 50;
            const pop = data.hourly?.precipitation_probability?.[hourIndex] || 0;
            const uv = data.hourly?.uv_index?.[hourIndex] || 0;

            // Previsão Máx e Mín de hoje
            const tempMax = Math.round(data.daily?.temperature_2m_max?.[0] || temp);
            const tempMin = Math.round(data.daily?.temperature_2m_min?.[0] || temp);

            // Mapeando Códigos WMO
            const mapWmoCode = (code) => {
                let description = 'Céu Limpo';
                let iconCode = '01d';
                if (code === 0) { description = 'Céu Limpo'; iconCode = '01d'; }
                else if (code >= 1 && code <= 3) { description = 'Parcialmente Nublado'; iconCode = '02d'; }
                else if (code === 45 || code === 48) { description = 'Neblina'; iconCode = '03d'; }
                else if (code >= 51 && code <= 67) { description = 'Chuva Leve/Moderada'; iconCode = '09d'; }
                else if (code >= 71 && code <= 77) { description = 'Neve'; iconCode = '13d'; }
                else if (code >= 80 && code <= 82) { description = 'Pancadas de Chuva'; iconCode = '10d'; }
                else if (code >= 95) { description = 'Tempestade Elétrica'; iconCode = '11d'; }
                return { description, iconCode };
            };

            const currentWmo = mapWmoCode(wmoCode);

            let alerts = [];
            if (wind > 40) {
                alerts.push({ event: 'Alerta Laranja (Ventos Fortes)', description: 'Rajadas de vento perigosas detectadas.', color: '#F59E0B' }); 
            }
            if (wmoCode >= 95) {
                alerts.push({ event: 'Alerta Vermelho (Tempestade)', description: 'Risco iminente de raios e chuvas intensas.', color: '#EF4444' }); 
            }

            // Mapear 7 dias
            const forecast = [];
            if (data.daily && data.daily.time) {
                for (let i = 0; i < 7; i++) {
                    if (data.daily.time[i]) {
                        const dayWmo = mapWmoCode(data.daily.weathercode?.[i] || 0);
                        forecast.push({
                            date: data.daily.time[i],
                            tempMax: Math.round(data.daily.temperature_2m_max?.[i] || 0),
                            tempMin: Math.round(data.daily.temperature_2m_min?.[i] || 0),
                            pop: data.daily.precipitation_probability_max?.[i] || 0,
                            icon: dayWmo.iconCode,
                            description: dayWmo.description
                        });
                    }
                }
            }

            const weatherData = {
                temp: temp,
                tempMax: tempMax,
                tempMin: tempMin,
                description: currentWmo.description,
                icon: currentWmo.iconCode,
                humidity: humidity,
                wind: wind,
                uv: uv,
                city: 'Fazenda AgroGB', 
                pop: pop,
                alerts: alerts,
                forecast: forecast,
                timestamp: new Date().getTime()
            };

            await AsyncStorage.setItem('weather_cache', JSON.stringify(weatherData));
            return weatherData;
        } catch (error) {
            console.log('❌ Erro Genuíno no Fetch do Clima:', error.message || error);
            const cached = await AsyncStorage.getItem('weather_cache');
            if (cached) return JSON.parse(cached);

            return null; // Força mostrar erro ou recarregar
        }
    }
};
