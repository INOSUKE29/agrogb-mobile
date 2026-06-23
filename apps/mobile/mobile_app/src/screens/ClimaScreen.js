import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useWeather } from '../context/WeatherContext';
import ScreenHeader from '../components/ui/ScreenHeader';
import ScreenLayout from '../components/layout/ScreenLayout';

export default function ClimaScreen() {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};
    const { weather, loading, error, refreshWeather } = useWeather();
    
    const [activeTab, setActiveTab] = useState('HOJE');

    const isDark = theme?.theme_mode === 'dark';
    const textColor = activeColors.text || '#FFFFFF';
    const textMuted = activeColors.textMuted || '#9CA3AF';
    const borderColor = activeColors.border || 'rgba(255,255,255,0.05)';

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

    const generateAIRecommendations = () => {
        if (!weather) return [];
        const recs = [];
        const isRaining = weather.pop > 50 || weather.description.toLowerCase().includes('chuva');
        const isHot = weather.temp > 30;
        const isHumid = weather.humidity > 80;
        const isWindy = weather.wind > 15;

        if (isRaining || isWindy) {
            recs.push({ text: 'Pulverização: Suspender (Vento/Chuva)', type: 'error' });
        } else {
            recs.push({ text: 'Pulverização: Recomendada', type: 'success' });
        }

        if (isRaining) {
            recs.push({ text: 'Irrigação: Não necessária hoje', type: 'success' });
        } else if (isHot) {
            recs.push({ text: 'Irrigação: Ligar pivô (Calor alto)', type: 'warning' });
        } else {
            recs.push({ text: 'Irrigação: Ciclo normal', type: 'success' });
        }

        if (isHumid && isHot) {
            recs.push({ text: 'Monitorar risco de fungos (Alta umidade)', type: 'warning' });
        }

        return recs;
    };

    const recommendations = generateAIRecommendations();

    return (
        <ScreenLayout title="CLIMA DA FAZENDA">
            <View style={styles.tabsContainer}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'HOJE' && [styles.activeTab, { borderBottomColor: activeColors.primary || '#10B981' }]]}
                    onPress={() => setActiveTab('HOJE')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'HOJE' ? (activeColors.primary || '#10B981') : textMuted }]}>HOJE</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === '7DIAS' && [styles.activeTab, { borderBottomColor: activeColors.primary || '#10B981' }]]}
                    onPress={() => setActiveTab('7DIAS')}
                >
                    <Text style={[styles.tabText, { color: activeTab === '7DIAS' ? (activeColors.primary || '#10B981') : textMuted }]}>PRÓXIMOS DIAS</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {activeTab === 'HOJE' ? (
                    <>
                        {weather ? (
                            <>
                                <LinearGradient colors={['#1F2937', '#111827']} style={[styles.heroCard, { borderColor }]}>
                                    <View style={styles.heroTop}>
                                        <View>
                                            <Text style={styles.cityName}>{weather.city}</Text>
                                            <Text style={styles.weatherDesc}>{weather.description}</Text>
                                        </View>
                                        <Ionicons name={getIcon(weather.icon)} size={56} color="#FBBF24" />
                                    </View>
                                    <Text style={styles.tempMain}>{weather.temp}°C</Text>
                                    
                                    <View style={styles.metricsGrid}>
                                        <View style={styles.metricItem}>
                                            <Ionicons name="umbrella" size={20} color="#60A5FA" />
                                            <Text style={styles.statLabel}>Chuva</Text>
                                            <Text style={styles.statValue}>{weather.pop}%</Text>
                                        </View>
                                        <View style={styles.metricItem}>
                                            <Ionicons name="water" size={20} color="#60A5FA" />
                                            <Text style={styles.statLabel}>Umidade</Text>
                                            <Text style={styles.statValue}>{weather.humidity}%</Text>
                                        </View>
                                        <View style={styles.metricItem}>
                                            <Ionicons name="leaf" size={20} color="#34D399" />
                                            <Text style={styles.statLabel}>Vento</Text>
                                            <Text style={styles.statValue}>{weather.wind} km/h</Text>
                                        </View>
                                        <View style={styles.metricItem}>
                                            <Ionicons name="sunny" size={20} color="#FBBF24" />
                                            <Text style={styles.statLabel}>Índice UV</Text>
                                            <Text style={styles.statValue}>{weather.uv ? getUVLevel(weather.uv) : '--'}</Text>
                                        </View>
                                    </View>
                                </LinearGradient>

                                {/* ALERTAS DE DEFESA CIVIL */}
                                {weather.alerts && weather.alerts.length > 0 && (
                                    <View style={[styles.alertBar, { backgroundColor: weather.alerts[0].color + 'E6' }]}>
                                        <Ionicons name="warning" size={20} color="#FFF" style={{ marginRight: 10 }} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.alertEvent}>{weather.alerts[0].event}</Text>
                                            <Text style={styles.alertDesc}>{weather.alerts[0].description}</Text>
                                        </View>
                                    </View>
                                )}

                                {/* IA RECOMENDAÇÕES */}
                                <View style={styles.aiCard}>
                                    <View style={styles.aiHeader}>
                                        <Ionicons name="sparkles" size={20} color="#C4B5FD" />
                                        <Text style={styles.aiTitle}>Recomendações da IA (AgroGB)</Text>
                                    </View>
                                    <View style={styles.aiList}>
                                        {recommendations.map((rec, index) => (
                                            <View key={index} style={styles.aiRow}>
                                                <Ionicons 
                                                    name={rec.type === 'success' ? 'checkmark-circle' : rec.type === 'warning' ? 'warning' : 'close-circle'} 
                                                    size={16} 
                                                    color={rec.type === 'success' ? '#10B981' : rec.type === 'warning' ? '#F59E0B' : '#EF4444'} 
                                                />
                                                <Text style={styles.aiText}>{rec.text}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </>
                        ) : (
                            <View style={[styles.heroCard, { borderColor, alignItems: 'center', justifyContent: 'center', height: 200 }]}>
                                {loading ? (
                                    <ActivityIndicator size="large" color="#10B981" />
                                ) : (
                                    <>
                                        <Text style={{ color: textMuted }}>Nenhum dado de clima disponível</Text>
                                        <TouchableOpacity style={{ marginTop: 15 }} onPress={() => refreshWeather(true)}>
                                            <Text style={{ color: activeColors.primary || '#10B981', fontWeight: 'bold' }}>Buscar Clima</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        )}
                    </>
                ) : (
                    <View style={{ paddingVertical: 10 }}>
                        {weather?.forecast?.map((day, index) => {
                            const dateObj = new Date(day.date + 'T12:00:00Z');
                            const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase();
                            const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                            
                            return (
                                <View key={index} style={[styles.forecastRow, { borderBottomColor: borderColor }]}>
                                    <View style={{ width: 60 }}>
                                        <Text style={styles.forecastDay}>{dayName}</Text>
                                        <Text style={styles.forecastDate}>{dateStr}</Text>
                                    </View>
                                    <View style={styles.forecastIconCol}>
                                        <Ionicons name={getIcon(day.icon)} size={28} color="#FBBF24" />
                                        <Text style={styles.forecastPop}>{day.pop}% chuva</Text>
                                    </View>
                                    <View style={styles.forecastTempCol}>
                                        <Text style={styles.forecastTempMax}>{day.tempMax}°</Text>
                                        <Text style={styles.forecastTempMin}>{day.tempMin}°</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}
                
                <View style={{ height: 40 }} />
            </ScrollView>
        </ScreenLayout>
    );
}

const styles = StyleSheet.create({
    tabsContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    tab: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 3,
    },
    tabText: {
        fontSize: 13,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    heroCard: {
        borderRadius: 24,
        padding: 25,
        borderWidth: 1,
        marginBottom: 20,
    },
    heroTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cityName: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    weatherDesc: {
        color: '#9CA3AF',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
        textTransform: 'capitalize'
    },
    tempMain: {
        color: '#FFF',
        fontSize: 64,
        fontWeight: '900',
        marginVertical: 10,
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingTop: 15
    },
    metricItem: {
        width: '48%',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        alignItems: 'center',
    },
    statLabel: {
        color: '#9CA3AF',
        fontSize: 11,
        fontWeight: 'bold',
        marginTop: 6,
    },
    statValue: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '900',
        marginTop: 2,
    },
    alertBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
    },
    alertEvent: { color: '#FFF', fontSize: 13, fontWeight: 'bold', marginBottom: 2 },
    alertDesc: { color: '#FFF', fontSize: 11, opacity: 0.9 },
    aiCard: {
        borderRadius: 20,
        padding: 20,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
    },
    aiHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    aiTitle: {
        color: '#C4B5FD',
        fontWeight: 'bold',
        fontSize: 14,
        marginLeft: 8,
    },
    aiList: {
        gap: 10,
    },
    aiRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    aiText: {
        color: '#E2E8F0',
        fontSize: 13,
        marginLeft: 8,
        flex: 1,
    },
    forecastRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        borderBottomWidth: 1,
    },
    forecastDay: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    forecastDate: {
        color: '#9CA3AF',
        fontSize: 12,
    },
    forecastIconCol: {
        alignItems: 'center',
        flex: 1,
    },
    forecastPop: {
        color: '#60A5FA',
        fontSize: 11,
        marginTop: 4,
    },
    forecastTempCol: {
        alignItems: 'flex-end',
        width: 60,
    },
    forecastTempMax: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    forecastTempMin: {
        color: '#9CA3AF',
        fontSize: 14,
    }
});
