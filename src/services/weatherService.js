import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ FREE TIER KEYS - REPLACE IF NEEDED
const API_KEY = '5a6875971488c5d20775d7b8764b85c8';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

export const WeatherService = {
    // 1. Get Permission & Location On-Demand
    getLocation: async (forceRequest = false) => {
        try {
            // Verifica status atual SEM acionar popup
            let { status } = await Location.getForegroundPermissionsAsync();

            // Só pede permissão se for explicitly chamado pelo clique do usuario
            if (status !== 'granted' && forceRequest) {
                const req = await Location.requestForegroundPermissionsAsync();
                status = req.status;
            }

            if (status !== 'granted') {
                return null; // Silent deny
            }

            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const coords = {
                lat: location.coords.latitude,
                lon: location.coords.longitude
            };

            await AsyncStorage.setItem('user_location', JSON.stringify(coords));
            return coords;

        } catch (error) {
            console.warn('Error getting location:', error);
            const cached = await AsyncStorage.getItem('user_location');
            return cached ? JSON.parse(cached) : null;
        }
    },

    // 2. Fetch Weather Data
    getWeather: async (lat, lon) => {
        try {
            const response = await fetch(
                `${BASE_URL}?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&appid=${API_KEY}`
            );

            if (!response.ok) {
                throw new Error('Weather API Error');
            }

            const data = await response.json();

            const weatherData = {
                temp: Math.round(data.main.temp),
                description: data.weather[0].description,
                icon: data.weather[0].icon,
                humidity: data.main.humidity,
                wind: Math.round(data.wind.speed * 3.6), // m/s to km/h
                city: data.name,
                timestamp: new Date().getTime()
            };

            // Cache weather data (30 min expiry logic handled in Context)
            await AsyncStorage.setItem('weather_cache', JSON.stringify(weatherData));

            return weatherData;

        } catch (error) {
            console.warn('Error fetching weather:', error);
            // Fallback to cached weather
            const cached = await AsyncStorage.getItem('weather_cache');
            return cached ? JSON.parse(cached) : null;
        }
    }
};
