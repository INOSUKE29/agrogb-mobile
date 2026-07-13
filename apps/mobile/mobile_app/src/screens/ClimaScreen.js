import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import ScreenLayout from '../components/layout/ScreenLayout';
import { WeatherService, DadosClima, Recomendacao, AgronomicMetrics } from '../services/WeatherService';

export default function ClimaScreen() {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};
    
    const [activeTab, setActiveTab] = useState('HOJE');
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [recommendations, setRecommendations] = useState([]);
    const [metrics, setMetrics] = useState(null);

    const isDark = theme?.theme_mode === 'dark';
    const textColor = activeColors.text || (isDark ? '#FFFFFF' : '#111827');
    const textMuted = activeColors.textMuted || (isDark ? '#9CA3AF' : '#6B7280');
    const borderColor = activeColors.border || (isDark ? '#374151' : '#E5E7EB');
    const cardBg = activeColors.card || (isDark ? '#1F2937' : '#FFFFFF');

    const loadWeather = async () => {
        try {
            // Mock coordenadas (pode usar Geolocation na v9)
            const data = await WeatherService.fetchHyperlocalWeather(-23.5505, -46.6333);
            setWeatherData(data);
            setRecommendations(WeatherService.gerarRecomendacoesAgro(data));
            setMetrics(WeatherService.calcularMetricasAgronomicas(data));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadWeather();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadWeather();
    }, []);

    const getIcon = (iconCode) => {
        if (!iconCode) return 'cloud-outline';
        if (iconCode.includes('01')) return 'sunny';
        if (iconCode.includes('02')) return 'partly-sunny';
        if (iconCode.includes('03') || iconCode.includes('04')) return 'cloudy';
        if (iconCode.includes('09') || iconCode.includes('10')) return 'rainy';
        if (iconCode.includes('11')) return 'thunderstorm';
        return 'cloud-outline';
    };

    const TABS = [
        { id: 'HOJE', label: 'Hoje' },
        { id: 'PROXIMOS', label: 'Próximos Dias' },
        { id: 'RADAR', label: 'Radar Agro' },
        { id: 'HISTORICO', label: 'Histórico' }
    ];

    if (loading) {
        return (
            <ScreenLayout title="CENTRAL CLIMÁTICA">
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#10B981" />
                </View>
            </ScreenLayout>
        );
    }

    return (
        <ScreenLayout title="CENTRAL CLIMÁTICA">
            {/* TABS */}
            <View style={[styles.tabsContainer, { borderBottomColor: borderColor }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {TABS.map(tab => (
                        <TouchableOpacity 
                            key={tab.id}
                            style={[styles.tab, activeTab === tab.id && [styles.activeTab, { borderBottomColor: '#10B981' }]]}
                            onPress={() => setActiveTab(tab.id)}
                        >
                            <Text style={[styles.tabText, { color: activeTab === tab.id ? '#10B981' : textMuted }]}>{tab.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView 
                style={styles.content} 
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
            >
                {!weatherData ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, marginTop: 50 }}>
                        <Ionicons name="cloud-offline-outline" size={60} color={textMuted} />
                        <Text style={{ color: textMuted, textAlign: 'center', marginTop: 15, fontSize: 16 }}>
                            Dados climáticos indisponíveis no momento.
                        </Text>
                        <Text style={{ color: textMuted, textAlign: 'center', marginTop: 5, fontSize: 14 }}>
                            Conecte-se à internet para buscar a previsão hiperlocal.
                        </Text>
                    </View>
                ) : (
                    <>
                {activeTab === 'HOJE' && weatherData && (
                    <View style={styles.section}>
                        <LinearGradient colors={isDark ? ['#1F2937', '#111827'] : ['#10B981', '#059669']} style={[styles.heroCard, { borderColor }]}>
                            <View style={styles.heroTop}>
                                <View>
                                    <Text style={[styles.cityName, { color: '#FFF' }]}>Fazenda Principal</Text>
                                    <Text style={[styles.weatherDesc, { color: '#D1FAE5' }]}>{weatherData.descricao.toUpperCase()}</Text>
                                </View>
                                <Ionicons name={getIcon(weatherData.icone)} size={60} color="#FBBF24" />
                            </View>
                            <View style={styles.tempContainer}>
                                <Text style={[styles.tempMain, { color: '#FFF' }]}>{weatherData.temperaturaAtual}°</Text>
                                <View style={styles.tempMinMax}>
                                    <Text style={[styles.tempSub, { color: '#D1FAE5' }]}>Máx: {weatherData.temperaturaMaxima}°</Text>
                                    <Text style={[styles.tempSub, { color: '#D1FAE5' }]}>Mín: {weatherData.temperaturaMinima}°</Text>
                                </View>
                            </View>
                        </LinearGradient>

                        <Text style={[styles.sectionTitle, { color: textMuted }]}>RECOMENDAÇÕES DA IA (AGORA)</Text>
                        {recommendations.map((rec, index) => {
                            let icon = 'information-circle';
                            let color = '#3B82F6';
                            if (rec.tipo === 'AVISO') { icon = 'warning'; color = '#F59E0B'; }
                            if (rec.tipo === 'ALERTA') { icon = 'alert-circle'; color = '#EF4444'; }
                            if (rec.tipo === 'CRITICO' || rec.tipo === 'PERIGO_GEADA') { icon = 'skull'; color = '#991B1B'; }
                            if (rec.tipo === 'RECOMENDADO') { icon = 'checkmark-circle'; color = '#10B981'; }

                            return (
                                <View key={index} style={[styles.aiCard, { backgroundColor: cardBg, borderColor }]}>
                                    <View style={[styles.aiIconBox, { backgroundColor: color + '20' }]}>
                                        <Ionicons name={icon} size={24} color={color} />
                                    </View>
                                    <Text style={[styles.aiMessage, { color: textColor }]}>{rec.mensagem}</Text>
                                </View>
                            );
                        })}
                    </View>
                )}

                {activeTab === 'RADAR' && metrics && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: textMuted }]}>PARÂMETROS AGRONÔMICOS</Text>
                        
                        <View style={styles.grid}>
                            <View style={[styles.gridCard, { backgroundColor: cardBg, borderColor }]}>
                                <Ionicons name="water" size={24} color="#3B82F6" />
                                <Text style={[styles.gridValue, { color: textColor }]}>{metrics.et0} mm</Text>
                                <Text style={[styles.gridLabel, { color: textMuted }]}>Evapotranspiração (ET0)</Text>
                            </View>
                            
                            <View style={[styles.gridCard, { backgroundColor: cardBg, borderColor }]}>
                                <Ionicons name="leaf" size={24} color="#10B981" />
                                <Text style={[styles.gridValue, { color: textColor }]}>{metrics.hmf} h</Text>
                                <Text style={[styles.gridLabel, { color: textMuted }]}>Molhamento Foliar</Text>
                            </View>
                        </View>

                        <Text style={[styles.sectionTitle, { color: textMuted, marginTop: 20 }]}>JANELAS OPERACIONAIS</Text>
                        <View style={[styles.windowCard, { backgroundColor: cardBg, borderColor }]}>
                            <Text style={[styles.windowLabel, { color: textColor }]}>Pulverização Foliar:</Text>
                            <Text style={[styles.windowStatus, { color: metrics.janelaPulverizacao === 'IDEAL' ? '#10B981' : (metrics.janelaPulverizacao === 'RISCO' ? '#F59E0B' : '#EF4444') }]}>
                                {metrics.janelaPulverizacao}
                            </Text>
                        </View>
                        <View style={[styles.windowCard, { backgroundColor: cardBg, borderColor }]}>
                            <Text style={[styles.windowLabel, { color: textColor }]}>Irrigação:</Text>
                            <Text style={[styles.windowStatus, { color: metrics.janelaIrrigacao === 'IDEAL' ? '#10B981' : (metrics.janelaIrrigacao === 'DESNECESSARIA' ? '#F59E0B' : '#EF4444') }]}>
                                {metrics.janelaIrrigacao}
                            </Text>
                        </View>
                    </View>
                )}

                {activeTab === 'PROXIMOS' && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: textMuted }]}>PREVISÃO (7 DIAS)</Text>
                        
                        <View style={{ backgroundColor: cardBg, borderRadius: 16, borderColor, borderWidth: 1, padding: 15 }}>
                            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((dia, idx) => (
                                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: idx === 6 ? 0 : 1, borderBottomColor: borderColor }}>
                                    <Text style={{ color: textColor, fontWeight: '700', width: 40 }}>{dia}</Text>
                                    <Ionicons name={idx % 2 === 0 ? "partly-sunny" : "rainy"} size={22} color={idx % 2 === 0 ? "#FBBF24" : "#3B82F6"} />
                                    <View style={{ flexDirection: 'row', gap: 10 }}>
                                        <Text style={{ color: textMuted }}>{idx % 2 === 0 ? "0mm" : "15mm"}</Text>
                                        <Text style={{ color: textColor, fontWeight: '600' }}>2{8 - (idx%4)}°</Text>
                                        <Text style={{ color: textMuted }}>1{5 + (idx%3)}°</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {activeTab === 'HISTORICO' && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: textMuted }]}>VOLUME DE CHUVA (30 DIAS)</Text>
                        <View style={{ backgroundColor: cardBg, padding: 15, borderRadius: 16, borderColor, borderWidth: 1, alignItems: 'center' }}>
                            <LineChart
                                data={{
                                    labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4"],
                                    datasets: [{ data: [12, 45, 10, 80] }]
                                }}
                                width={Dimensions.get("window").width - 70}
                                height={220}
                                yAxisSuffix="mm"
                                chartConfig={{
                                    backgroundColor: cardBg,
                                    backgroundGradientFrom: cardBg,
                                    backgroundGradientTo: cardBg,
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                                    labelColor: (opacity = 1) => textMuted,
                                    style: { borderRadius: 16 },
                                    propsForDots: { r: "4", strokeWidth: "2", stroke: "#2563EB" }
                                }}
                                bezier
                                style={{ marginVertical: 8, borderRadius: 16 }}
                            />
                        </View>
                    </View>
                )}

                <View style={{ height: 40 }} />
                    </>
                )}
            </ScrollView>
        </ScreenLayout>
    );
}

const styles = StyleSheet.create({
    tabsContainer: { flexDirection: 'row', borderBottomWidth: 1 },
    tab: { paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    activeTab: {},
    tabText: { fontSize: 13, fontWeight: 'bold' },
    content: { flex: 1, padding: 20 },
    section: { marginBottom: 20 },
    
    heroCard: { padding: 25, borderRadius: 24, borderWidth: 1, marginBottom: 25, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
    heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cityName: { fontSize: 20, fontWeight: 'bold' },
    weatherDesc: { fontSize: 14, fontWeight: '500', marginTop: 4 },
    tempContainer: { marginTop: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    tempMain: { fontSize: 56, fontWeight: '900', lineHeight: 60 },
    tempMinMax: { alignItems: 'flex-end', paddingBottom: 5 },
    tempSub: { fontSize: 14, fontWeight: '600' },

    sectionTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1, marginBottom: 15 },
    
    aiCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
    aiIconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    aiMessage: { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 18 },

    grid: { flexDirection: 'row', gap: 12, marginBottom: 10 },
    gridCard: { flex: 1, padding: 20, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    gridValue: { fontSize: 20, fontWeight: 'bold', marginVertical: 8 },
    gridLabel: { fontSize: 11, textAlign: 'center' },

    windowCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
    windowLabel: { fontSize: 14, fontWeight: '600' },
    windowStatus: { fontSize: 14, fontWeight: '900' },
});
