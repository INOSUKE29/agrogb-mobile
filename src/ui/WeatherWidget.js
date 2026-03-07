import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWeather } from '../context/WeatherContext';
import { BlurView } from 'expo-blur';

export default function WeatherWidget() {
    const { weather, loading, error, permissionDenied, refreshWeather } = useWeather();
    const [currentTime, setCurrentTime] = useState('');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const formatter = new Intl.DateTimeFormat('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'America/Sao_Paulo',
            });
            setCurrentTime(formatter.format(now));
        };
        updateTime();
        const interval = setInterval(updateTime, 60000); // Atualiza a cada minuto
        return () => clearInterval(interval);
    }, []);

    if (loading && !weather) {
        return (
            <BlurView intensity={50} tint="dark" style={styles.container}>
                <ActivityIndicator size="small" color="#FFF" />
                <Text style={styles.loadingText}>Atualizando...</Text>
            </BlurView>
        );
    }

    if (permissionDenied && !weather) {
        return (
            <TouchableOpacity onPress={() => refreshWeather(true)}>
                <BlurView intensity={50} tint="dark" style={styles.container}>
                    <Ionicons name="location-outline" size={20} color="#FFF" />
                    <Text style={styles.text}>Ativar Clima da Fazenda</Text>
                </BlurView>
            </TouchableOpacity>
        );
    }

    if (error && !weather) {
        return (
            <TouchableOpacity onPress={() => refreshWeather(true)}>
                <BlurView intensity={50} tint="dark" style={styles.container}>
                    <Ionicons name="cloud-offline-outline" size={20} color="#FFF" />
                    <Text style={styles.text}>Serviço de Clima Inativo</Text>
                </BlurView>
            </TouchableOpacity>
        );
    }

    if (!weather) return null;

    const getIcon = (iconCode) => {
        if (iconCode.includes('01')) return 'sunny';
        if (iconCode.includes('02')) return 'partly-sunny';
        if (iconCode.includes('03') || iconCode.includes('04')) return 'cloudy';
        if (iconCode.includes('09') || iconCode.includes('10')) return 'rainy';
        if (iconCode.includes('11')) return 'thunderstorm';
        return 'cloud-outline';
    };

    return (
        <TouchableOpacity onPress={() => refreshWeather(true)} activeOpacity={0.8} style={styles.touchableWrapper}>
            <BlurView intensity={60} tint="dark" style={styles.container}>
                <View style={styles.leftCol}>
                    <View style={styles.iconCircle}>
                        <Ionicons name={getIcon(weather.icon)} size={32} color="#FBBF24" style={styles.shadowIcon} />
                    </View>
                    <View style={styles.infoCol}>
                        <Text style={styles.mainText}>{weather.temp}°C</Text>
                        <Text style={styles.subText}>{weather.city}</Text>
                    </View>
                </View>

                <View style={styles.rightCol}>
                    <View style={styles.timeBadge}>
                        <Ionicons name="time" size={12} color="#FFF" style={{ marginRight: 4 }} />
                        <Text style={styles.timeBadgeText}>{currentTime} (BRT)</Text>
                    </View>
                    <View style={styles.detailsRow}>
                        <Text style={styles.detailText}><Ionicons name="umbrella" size={10} color="#E0F2FE" /> {weather.pop}% Chuva</Text>
                        <Text style={styles.detailText}><Ionicons name="water" size={10} color="#E0F2FE" /> {weather.humidity}%</Text>
                        <Text style={styles.detailText}><Ionicons name="leaf" size={10} color="#E0F2FE" /> {weather.wind} km/h</Text>
                    </View>
                </View>
            </BlurView>
            {/* ALERTAS ESTILO DEFESA CIVIL */}
            {weather.alerts && weather.alerts.length > 0 && (
                <View style={[styles.alertBar, { backgroundColor: weather.alerts[0].color + 'E6' }]}>
                    <Ionicons name="warning" size={16} color="#FFF" style={{ marginRight: 6 }} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.alertEvent}>{weather.alerts[0].event}</Text>
                        <Text style={styles.alertDesc}>{weather.alerts[0].description}</Text>
                    </View>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    touchableWrapper: {
        width: '100%',
        marginTop: 5,
        marginBottom: 5,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        overflow: 'hidden'
    },
    leftCol: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    shadowIcon: {
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3
    },
    infoCol: {
        justifyContent: 'center',
    },
    rightCol: {
        alignItems: 'flex-end',
        justifyContent: 'center'
    },
    timeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 6
    },
    timeBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold'
    },
    detailsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    detailText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '600',
        textShadowColor: 'rgba(0,0,0,0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2
    },
    alertBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        marginTop: -10, // Para colar embaixo do widget de cima
        zIndex: -1 // Para ficar debaixo do Blur principal
    },
    alertEvent: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
    alertDesc: { color: '#FFF', fontSize: 9 },
    loadingText: { color: '#FFFFFF', fontSize: 13, marginLeft: 8, fontWeight: '600' },
    text: { color: '#FFFFFF', fontSize: 13, marginLeft: 8, fontWeight: '600' },
    mainText: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', lineHeight: 28, textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
    subText: { color: '#E0F2FE', fontSize: 13, fontWeight: '600', paddingBottom: 1, textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
});
