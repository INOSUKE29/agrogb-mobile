import React, { createContext, useState, useEffect, useContext } from 'react';
import { WeatherService } from '../services/weatherService';

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
                } else {
                    setError(true);
                }
            } else {
                setPermissionDenied(true); // O usuário não deu permissão ou ainda não foi solicitada
            }
        } catch (e) {
            console.error(e);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    // Tenta carregar no início SEM forçar pedido de permissão (apenas se já concedida)
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
    if (!context) {
        return {
            weather: null,
            loading: false,
            error: null,
            permissionDenied: true,
            refreshWeather: () => { }
        };
    }
    return context;
};
