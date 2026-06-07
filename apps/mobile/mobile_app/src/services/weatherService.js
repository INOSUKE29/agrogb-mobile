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
            // URL da Open-Meteo com Temperatura, Humidade, Vento, Código WMO, e Previsão Max/Min diária
            const endpoint = `${BASE_URL}?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relative_humidity_2m,precipitation_probability&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;

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

            // Previsão Máx e Mín de hoje
            const tempMax = Math.round(data.daily?.temperature_2m_max?.[0] || temp);
            const tempMin = Math.round(data.daily?.temperature_2m_min?.[0] || temp);

            // Mapeando Códigos WMO
            let description = 'Céu Limpo';
            let iconCode = '01d'; // Usando os mesmos códigos pro app não quebrar

            if (wmoCode === 0) { description = 'Céu Limpo'; iconCode = '01d'; }
            else if (wmoCode >= 1 && wmoCode <= 3) { description = 'Parcialmente Nublado'; iconCode = '02d'; }
            else if (wmoCode === 45 || wmoCode === 48) { description = 'Neblina'; iconCode = '03d'; }
            else if (wmoCode >= 51 && wmoCode <= 67) { description = 'Chuva Leve/Moderada'; iconCode = '09d'; }
            else if (wmoCode >= 71 && wmoCode <= 77) { description = 'Neve'; iconCode = '13d'; }
            else if (wmoCode >= 80 && wmoCode <= 82) { description = 'Pancadas de Chuva'; iconCode = '10d'; }
            else if (wmoCode >= 95) { description = 'Tempestade Elétrica'; iconCode = '11d'; }

            let alerts = [];
            if (wind > 40) {
                alerts.push({ event: 'Alerta Laranja (Ventos Fortes)', description: 'Rajadas de vento perigosas detectadas.', color: '#F59E0B' }); 
            }
            if (wmoCode >= 95) {
                alerts.push({ event: 'Alerta Vermelho (Tempestade)', description: 'Risco iminente de raios e chuvas intensas.', color: '#EF4444' }); 
            }

            const weatherData = {
                temp: temp,
                tempMax: tempMax,
                tempMin: tempMin,
                description: description,
                icon: iconCode,
                humidity: humidity,
                wind: wind,
                city: 'Localização Atual', // Open-Meteo não retorna cidade, podemos geocodificar ou deixar genérico
                pop: pop,
                alerts: alerts,
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
