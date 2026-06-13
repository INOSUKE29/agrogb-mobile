import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useWeather } from '../context/WeatherContext';
import ScreenHeader from '../components/ui/ScreenHeader';

export default function ClimaScreen() {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};
    const { weather, loading, error, refreshWeather } = useWeather();
    
    const [activeTab, setActiveTab] = useState('HOJE');

    const isDark = theme?.theme_mode === 'dark';
    const textColor = activeColors.text || '#FFFFFF';
    const textMuted = activeColors.textMuted || '#9CA3AF';
    const cardBg = activeColors.card || '#1F2937';
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

    return (
        <View style={[styles.container, { backgroundColor: activeColors.bg || '#0B121E' }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <SafeAreaView style={{ flex: 1 }}>
                <ScreenHeader title="CLIMA DA FAZENDA" onBack={() => navigation.goBack()} />

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
                        <Text style={[styles.tabText, { color: activeTab === '7DIAS' ? (activeColors.primary || '#10B981') : textMuted }]}>PRÓXIMOS 7 DIAS</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {activeTab === 'HOJE' ? (
                        <>
                            {weather ? (
                                <LinearGradient colors={['#1F2937', '#111827']} style={[styles.heroCard, { borderColor }]}>
                                    <View style={styles.heroTop}>
                                        <View>
                                            <Text style={styles.cityName}>{weather.city}</Text>
                                            <Text style={styles.weatherDesc}>{weather.description}</Text>
                                        </View>
                                        <Ionicons name={getIcon(weather.icon)} size={56} color="#FBBF24" />
                                    </View>
                                    <Text style={styles.tempMain}>{weather.temp}°C</Text>
                                    
                                    <View style={styles.statsRow}>
                                        <View style={styles.statItem}>
                                            <Ionicons name="umbrella" size={20} color="#60A5FA" />
                                            <Text style={styles.statLabel}>Chuva</Text>
                                            <Text style={styles.statValue}>{weather.pop}%</Text>
                                        </View>
                                        <View style={styles.statItem}>
                                            <Ionicons name="water" size={20} color="#60A5FA" />
                                            <Text style={styles.statLabel}>Umidade</Text>
                                            <Text style={styles.statValue}>{weather.humidity}%</Text>
                                        </View>
                                        <View style={styles.statItem}>
                                            <Ionicons name="leaf" size={20} color="#34D399" />
                                            <Text style={styles.statLabel}>Vento</Text>
                                            <Text style={styles.statValue}>{weather.wind} km/h</Text>
                                        </View>
                                    </View>
                                </LinearGradient>
                            ) : (
                                <View style={[styles.heroCard, { borderColor, alignItems: 'center', justifyContent: 'center', height: 200 }]}>
                                    <Text style={{ color: textMuted }}>{loading ? 'Carregando clima...' : 'Nenhum dado de clima disponível'}</Text>
                                    <TouchableOpacity style={{ marginTop: 15 }} onPress={() => refreshWeather(true)}>
                                        <Text style={{ color: activeColors.primary || '#10B981', fontWeight: 'bold' }}>Tentar Novamente</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* IA SUGESTÃO */}
                            <LinearGradient colors={['rgba(139, 92, 246, 0.15)', 'rgba(139, 92, 246, 0.05)']} style={[styles.aiCard, { borderColor: 'rgba(139, 92, 246, 0.3)' }]}>
                                <View style={styles.aiHeader}>
                                    <Ionicons name="sparkles" size={20} color="#C4B5FD" />
                                    <Text style={styles.aiTitle}>Sugestão da IA (AgroGB)</Text>
                                </View>
                                <Text style={styles.aiDesc}>
                                    A previsão indica baixa probabilidade de chuva hoje, com ventos favoráveis. 
                                    Este é um momento ideal para pulverização de foliares ou tratos culturais. 
                                    A umidade está adequada para garantir a fixação dos insumos.
                                </Text>
                            </LinearGradient>
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
                                            <Text style={styles.forecastPop}>{day.pop}%</Text>
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
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    tabsContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        marginTop: 10
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
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)'
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        color: '#9CA3AF',
        fontSize: 11,
        fontWeight: 'bold',
        marginTop: 8,
    },
    statValue: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '900',
        marginTop: 4,
    },
    aiCard: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
    },
    aiHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    aiTitle: {
        color: '#C4B5FD',
        fontWeight: 'bold',
        fontSize: 14,
    },
    aiDesc: {
        color: '#E2E8F0',
        fontSize: 13,
        lineHeight: 20,
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
        marginTop: 2,
    },
    forecastIconCol: {
        alignItems: 'center',
        width: 80,
    },
    forecastPop: {
        color: '#60A5FA',
        fontSize: 11,
        fontWeight: 'bold',
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
        marginTop: 2,
    }
});
