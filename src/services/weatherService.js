import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';

const API_KEY = '5a6875971488c5d20775d7b8764b85c8';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';

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
            const endpoint = `${BASE_URL}?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&appid=${API_KEY}`;
            const forecastEnd = `${FORECAST_URL}?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&appid=${API_KEY}`;

            const [response, forecastRes] = await Promise.all([
                fetch(endpoint),
                fetch(forecastEnd).catch(() => null)
            ]);

            if (!response.ok) {
                console.log('⚠️ Aviso Weather API:', response.status);
                throw new Error('Weather API Error');
            }

            const data = await response.json();
            let pop = 0; // chance de chuva
            let alerts = [];

            if (forecastRes && forecastRes.ok) {
                const fData = await forecastRes.json();
                if (fData.list && fData.list.length > 0) {
                    // Previsão das próximas 3 horas (Probability of Precipitation 0 a 1)
                    pop = Math.round((fData.list[0].pop || 0) * 100);
                }
            }

            // A API gratuita de Weather/Forecast não costuma trazer alertas governamentais (apenas OneCall 3.0). 
            // Para criar a base visual solicitada pelo usuário, simularemos uma integração de metadados reais 
            // baseados em condições extremas do clima atual (ventos fortes, tempestades).
            if (data.wind.speed > 15) {
                alerts.push({ event: 'Alerta Laranja (Ventos Fortes)', description: 'Rajadas de vento perigosas detectadas.', color: '#F59E0B' }); // Amarelo/Laranja
            }
            if (data.weather[0].id >= 200 && data.weather[0].id <= 232) {
                alerts.push({ event: 'Alerta Vermelho (Tempestade Elétrica)', description: 'Risco iminente de raios e chuvas intensas.', color: '#EF4444' }); // Vermelho
            }

            const weatherData = {
                temp: Math.round(data.main.temp),
                description: data.weather[0].description,
                icon: data.weather[0].icon,
                humidity: data.main.humidity,
                wind: Math.round(data.wind.speed * 3.6),
                city: data.name,
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

            // Fallback Offline amigável para não travar a tela
            return {
                temp: 25,
                description: 'Offline',
                icon: '03d',
                humidity: 50,
                wind: 10,
                city: 'Local',
                pop: 0,
                alerts: [],
                timestamp: new Date().getTime()
            };
        }
    }
};
