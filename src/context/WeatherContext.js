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
            const locInfo = await WeatherService.getLocationOrManual(forceRequest);
            if (locInfo) {
                setPermissionDenied(false);
                const data = await WeatherService.getWeather(locInfo);
                if (data) setWeather(data);
                else setError(true);
            } else {
                setPermissionDenied(true);
            }
        } catch (e) {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { refreshWeather(false); }, []);

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
