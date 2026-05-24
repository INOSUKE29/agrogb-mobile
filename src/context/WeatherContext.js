import React, { createContext, useState, useEffect, useContext } from 'react';
import { WeatherService } from '../services/WeatherService';

const WeatherContext = createContext();

export const WeatherProvider = ({ children }) => {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);

    const refreshWeather = async (forceRequest = false) => {
        setLoading(true);
        setError(false);
        try {
            const coords = await WeatherService.getLocation(forceRequest);
            if (coords) {
                setPermissionDenied(false);
                const data = await WeatherService.getWeather(coords.lat, coords.lon);
                if (data) {
                    setWeather(data);
                    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                    await AsyncStorage.setItem('@weather_cache', JSON.stringify(data));
                } else setError(true);
            } else {
                setPermissionDenied(true);
            }
        } catch (e) {
            setError(true);
            // Tentar carregar do cache se houver erro (provavelmente offline)
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const cached = await AsyncStorage.getItem('@weather_cache');
            if (cached) setWeather(JSON.parse(cached));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { 
        refreshWeather(false); 
    }, []);

    return (
        <WeatherContext.Provider value={{ weather, loading, error, permissionDenied, refreshWeather }}>
            {children}
        </WeatherContext.Provider>
    );
};

export const useWeather = () => {
    const context = useContext(WeatherContext);
    if (!context) return { weather: null, loading: false, error: null, permissionDenied: true, refreshWeather: () => { } };
    return context;
};
