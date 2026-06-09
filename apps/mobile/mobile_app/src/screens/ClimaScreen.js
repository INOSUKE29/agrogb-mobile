import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import Card from '../components/common/Card';

export default function ClimaScreen({ navigation, isTabbed }) {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};
    
    const THEME = {
        bg: activeColors.bg || '#0F172A',
        cardBg: activeColors.cardBg || '#1E293B',
        textMain: activeColors.textMain || '#F8FAFC',
        textSub: activeColors.textSub || '#94A3B8',
        primary: activeColors.primary || '#3B82F6', // Azul para clima
    };

    return (
        <View style={[styles.container, { backgroundColor: THEME.bg }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            
            {!isTabbed && (
                <LinearGradient colors={['#1E3A8A', '#1E40AF']} style={styles.header}>
                    <View style={styles.navRow}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                            <Ionicons name="arrow-back" size={22} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>CLIMA & ESTAÇÃO</Text>
                        <View style={{ width: 38 }} />
                    </View>
                </LinearGradient>
            )}

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <Card style={[styles.mainWeatherCard, { backgroundColor: THEME.primary }]}>
                    <View style={styles.weatherHeader}>
                        <View>
                            <Text style={styles.cityText}>Fazenda Principal</Text>
                            <Text style={styles.dateText}>Hoje, 14:30</Text>
                        </View>
                        <Ionicons name="partly-sunny" size={48} color="#FFF" />
                    </View>
                    
                    <View style={styles.tempRow}>
                        <Text style={styles.tempText}>28°</Text>
                        <Text style={styles.tempDesc}>Parcialmente Nublado</Text>
                    </View>

                    <View style={styles.metricsRow}>
                        <View style={styles.metricItem}>
                            <Ionicons name="water-outline" size={20} color="#FFF" />
                            <Text style={styles.metricVal}>45%</Text>
                            <Text style={styles.metricLbl}>Umidade</Text>
                        </View>
                        <View style={styles.metricItem}>
                            <Ionicons name="leaf-outline" size={20} color="#FFF" />
                            <Text style={styles.metricVal}>12 km/h</Text>
                            <Text style={styles.metricLbl}>Vento</Text>
                        </View>
                        <View style={styles.metricItem}>
                            <Ionicons name="rainy-outline" size={20} color="#FFF" />
                            <Text style={styles.metricVal}>10 mm</Text>
                            <Text style={styles.metricLbl}>Chuva</Text>
                        </View>
                    </View>
                </Card>

                <Text style={[styles.sectionTitle, { color: THEME.textMain }]}>PREVISÃO DA SEMANA</Text>
                
                {[1, 2, 3, 4, 5].map((item) => (
                    <View key={item} style={[styles.forecastRow, { backgroundColor: THEME.cardBg }]}>
                        <Text style={[styles.dayText, { color: THEME.textMain }]}>Dia {item + 10}</Text>
                        <View style={styles.centerCol}>
                            <Ionicons name={item % 2 === 0 ? "rainy" : "sunny"} size={20} color={item % 2 === 0 ? "#60A5FA" : "#FBBF24"} />
                            <Text style={[styles.probText, { color: THEME.textSub }]}>{item % 2 === 0 ? '80%' : '10%'}</Text>
                        </View>
                        <Text style={[styles.rangeText, { color: THEME.textMain }]}>18° / 32°</Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
    iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.15)', justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: 20, paddingBottom: 100 },
    
    mainWeatherCard: { padding: 25, borderRadius: 25, marginBottom: 25 },
    weatherHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cityText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    dateText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 },
    tempRow: { marginVertical: 20 },
    tempText: { color: '#FFF', fontSize: 64, fontWeight: '900', includeFontPadding: false },
    tempDesc: { color: 'rgba(255,255,255,0.9)', fontSize: 16, fontWeight: '600' },
    
    metricsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 20, marginTop: 10 },
    metricItem: { alignItems: 'center' },
    metricVal: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginTop: 8 },
    metricLbl: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 4 },
    
    sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 15 },
    forecastRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 15, marginBottom: 10 },
    dayText: { fontSize: 14, fontWeight: 'bold', width: 80 },
    centerCol: { flexDirection: 'row', alignItems: 'center', width: 60, gap: 5 },
    probText: { fontSize: 11, fontWeight: '600' },
    rangeText: { fontSize: 14, fontWeight: 'bold', width: 80, textAlign: 'right' }
});
