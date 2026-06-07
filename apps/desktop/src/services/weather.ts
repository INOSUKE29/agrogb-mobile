export interface WeatherData {
    current: {
        temperature: number;
        humidity: number;
        precipitation: number;
        wind_speed: number;
        is_day: boolean;
        weathercode: number;
    };
    hourly: {
        time: string[];
        temperature_2m: number[];
        precipitation_probability: number[];
    };
    daily: {
        time: string[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        precipitation_sum: number[];
    };
}

// Mapeamento simples dos códigos da WMO para descrições legíveis
export const getWeatherDescription = (code: number) => {
    if (code === 0) return 'Céu Limpo';
    if (code === 1 || code === 2 || code === 3) return 'Parcialmente Nublado';
    if (code === 45 || code === 48) return 'Neblina';
    if (code >= 51 && code <= 55) return 'Garoa';
    if (code >= 61 && code <= 65) return 'Chuva';
    if (code >= 71 && code <= 77) return 'Neve';
    if (code >= 80 && code <= 82) return 'Pancadas de Chuva';
    if (code >= 95) return 'Tempestade';
    return 'Desconhecido';
};

// Mapeamento simples para ícones
export const getWeatherIconType = (code: number) => {
    if (code === 0) return 'Sun';
    if (code <= 3) return 'Cloud';
    if (code >= 51 && code <= 82) return 'CloudRain';
    if (code >= 95) return 'CloudLightning';
    return 'Cloud';
};

export async function fetchRealWeather(lat: number, lon: number): Promise<WeatherData> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,is_day,weather_code&hourly=temperature_2m,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Falha ao buscar dados climáticos');
        }
        
        const data = await response.json();
        
        return {
            current: {
                temperature: data.current.temperature_2m,
                humidity: data.current.relative_humidity_2m,
                precipitation: data.current.precipitation,
                wind_speed: data.current.wind_speed_10m,
                is_day: data.current.is_day === 1,
                weathercode: data.current.weather_code
            },
            hourly: {
                time: data.hourly.time,
                temperature_2m: data.hourly.temperature_2m,
                precipitation_probability: data.hourly.precipitation_probability
            },
            daily: {
                time: data.daily.time,
                temperature_2m_max: data.daily.temperature_2m_max,
                temperature_2m_min: data.daily.temperature_2m_min,
                precipitation_sum: data.daily.precipitation_sum
            }
        };
    } catch (error) {
        console.error("Open-Meteo API Error:", error);
        throw error;
    }
}
