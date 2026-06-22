import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWeather } from '../context/WeatherContext';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';

export default function WeatherWidget() {
    const { weather, loading, error, permissionDenied } = useWeather();
    const navigation = useNavigation();
    const { theme } = useTheme();

    if (loading && !weather) {
        return (
            <BlurView intensity={50} tint="dark" style={[styles.container, styles.centerAll]}>
                <ActivityIndicator size="small" color="#FFF" />
                <Text style={styles.loadingText}>Atualizando Clima...</Text>
            </BlurView>
        );
    }

    if (permissionDenied && !weather) {
        return (
            <TouchableOpacity onPress={() => navigation.navigate('Clima')}>
                <BlurView intensity={50} tint="dark" style={[styles.container, styles.centerAll]}>
                    <Ionicons name="location-outline" size={24} color="#FFF" />
                    <Text style={styles.text}>Ativar Clima da Fazenda</Text>
                    <Text style={styles.subTextMsg}>Necessário para recomendações precisas</Text>
                </BlurView>
            </TouchableOpacity>
        );
    }

    if (error && !weather) {
        return (
            <TouchableOpacity onPress={() => navigation.navigate('Clima')}>
                <BlurView intensity={50} tint="dark" style={[styles.container, styles.centerAll]}>
                    <Ionicons name="cloud-offline-outline" size={24} color="#FFF" />
                    <Text style={styles.text}>Serviço de Clima Inativo</Text>
                    <Text style={styles.subTextMsg}>Toque para tentar novamente</Text>
                </BlurView>
            </TouchableOpacity>
        );
    }

    if (!weather) return null;

    const getIcon = (iconCode) => {
        if (!iconCode) return 'cloud-outline';
        if (iconCode.includes('01')) return 'sunny';
        if (iconCode.includes('02')) return 'partly-sunny';
        if (iconCode.includes('03') || iconCode.includes('04')) return 'cloudy';
        if (iconCode.includes('09') || iconCode.includes('10')) return 'rainy';
        if (iconCode.includes('11')) return 'thunderstorm';
        return 'cloud-outline';
    };

    const getUVLevel = (uvIndex) => {
        if (uvIndex < 3) return 'Baixo';
        if (uvIndex < 6) return 'Moderado';
        if (uvIndex < 8) return 'Alto';
        if (uvIndex < 11) return 'Muito Alto';
        return 'Extremo';
    };

    const formatDayOfWeek = (dateString) => {
        const d = new Date(dateString);
        d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        return days[d.getDay()];
    };

    // Gera recomendações dinâmicas da IA baseadas no clima atual
    const generateAIRecommendations = () => {
        const recs = [];
        const isRaining = weather.pop > 50 || weather.description.toLowerCase().includes('chuva');
        const isHot = weather.temp > 30;
        const isHumid = weather.humidity > 80;
        const isWindy = weather.wind > 15;

        if (isRaining || isWindy) {
            recs.push({ text: 'Pulverização: Suspender (Vento/Chuva)', type: 'error' });
        } else {
            recs.push({ text: 'Pulverização recomendada até 09:30', type: 'success' });
        }

        if (isRaining) {
            recs.push({ text: 'Irrigação: Não necessária hoje', type: 'success' });
        } else if (isHot) {
            recs.push({ text: 'Irrigação: Ligar pivô (Alta transpiração)', type: 'warning' });
        } else {
            recs.push({ text: 'Irrigação: Ciclo normal', type: 'success' });
        }

        if (isHumid && isHot) {
            recs.push({ text: 'Monitorar risco de fungos (Alta umidade e calor)', type: 'warning' });
        }

        return recs;
    };

    const recommendations = generateAIRecommendations();
    // Pegar apenas os próximos 3 dias da previsão
    const nextDays = weather.forecast && weather.forecast.length > 1 
        ? weather.forecast.slice(1, 4) 
        : [];

    return (
        <TouchableOpacity onPress={() => navigation.navigate('Clima')} activeOpacity={0.9} style={styles.touchableWrapper}>
            <BlurView intensity={theme?.theme_mode === 'dark' ? 60 : 80} tint={theme?.theme_mode === 'dark' ? "dark" : "light"} style={styles.container}>
                
                {/* Header Clima Hoje */}
                <View style={styles.headerRow}>
                    <View style={styles.titleCol}>
                        <Text style={styles.titleLabel}>🌤 Clima Hoje</Text>
                        <View style={styles.locationBadge}>
                            <Ionicons name="location" size={12} color="#10B981" />
                            <Text style={styles.locationText}>{weather.city}</Text>
                        </View>
                    </View>
                    <View style={styles.tempCol}>
                        <Text style={styles.mainTemp}>{weather.temp}°C</Text>
                        <Text style={styles.weatherDesc}>{weather.description}</Text>
                    </View>
                </View>

                {/* Grid de Métricas */}
                <View style={styles.metricsGrid}>
                    <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>💧 Umidade</Text>
                        <Text style={styles.metricValue}>{weather.humidity}%</Text>
                    </View>
                    <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>🌧️ Chuva</Text>
                        <Text style={styles.metricValue}>{weather.pop}%</Text>
                    </View>
                    <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>💨 Vento</Text>
                        <Text style={styles.metricValue}>{weather.wind} km/h</Text>
                    </View>
                    <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>☀️ UV</Text>
                        <Text style={styles.metricValue}>{getUVLevel(weather.uv)}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Recomendações da IA */}
                <View style={styles.aiSection}>
                    <Text style={styles.aiTitle}>🤖 Recomendações da IA</Text>
                    {recommendations.map((rec, index) => (
                        <View key={index} style={styles.aiRow}>
                            <Ionicons 
                                name={rec.type === 'success' ? 'checkmark-circle' : rec.type === 'warning' ? 'warning' : 'close-circle'} 
                                size={14} 
                                color={rec.type === 'success' ? '#10B981' : rec.type === 'warning' ? '#F59E0B' : '#EF4444'} 
                            />
                            <Text style={styles.aiText}>{rec.text}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.divider} />

                {/* Próximos 3 Dias */}
                <View style={styles.forecastSection}>
                    <Text style={styles.forecastTitle}>📅 Próximos dias</Text>
                    <View style={styles.forecastRow}>
                        {nextDays.map((day, index) => (
                            <View key={index} style={styles.forecastDay}>
                                <Text style={styles.dayLabel}>{formatDayOfWeek(day.date)}</Text>
                                <Ionicons name={getIcon(day.icon)} size={20} color={day.icon.includes('01') ? '#FBBF24' : '#9CA3AF'} style={{ marginVertical: 4 }} />
                                <Text style={styles.dayTemp}>{day.tempMax}°</Text>
                            </View>
                        ))}
                    </View>
                </View>

            </BlurView>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    touchableWrapper: {
        width: '100%',
        marginTop: 5,
        marginBottom: 15,
    },
    container: {
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        overflow: 'hidden',
        padding: 16,
    },
    centerAll: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 30,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    titleLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    locationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    locationText: {
        color: '#D1FAE5',
        fontSize: 11,
        fontWeight: '600',
        marginLeft: 4,
    },
    tempCol: {
        alignItems: 'flex-end',
    },
    mainTemp: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFFFFF',
        lineHeight: 36,
    },
    weatherDesc: {
        fontSize: 12,
        color: '#E0F2FE',
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    metricItem: {
        width: '48%',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        padding: 8,
        borderRadius: 12,
        marginBottom: 8,
    },
    metricLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: 'bold',
        marginBottom: 2,
    },
    metricValue: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '800',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginVertical: 12,
    },
    aiSection: {
        marginBottom: 4,
    },
    aiTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#A7F3D0',
        marginBottom: 8,
    },
    aiRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    aiText: {
        fontSize: 12,
        color: '#FFFFFF',
        marginLeft: 8,
        flex: 1,
    },
    forecastSection: {
        marginTop: 4,
    },
    forecastTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#D1FAE5',
        marginBottom: 8,
    },
    forecastRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    forecastDay: {
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 8,
        borderRadius: 12,
        minWidth: 50,
    },
    dayLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '600',
    },
    dayTemp: {
        fontSize: 13,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    text: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginTop: 12 },
    subTextMsg: { color: '#9CA3AF', fontSize: 12, marginTop: 4 },
    loadingText: { color: '#FFFFFF', fontSize: 14, marginTop: 12, fontWeight: '600' },
});
