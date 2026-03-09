import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWeather } from '../context/WeatherContext';
import { useTheme } from '../theme/ThemeContext';

export default function WeatherWidget() {
    const { weather, loading, permissionDenied, refreshWeather } = useWeather();
    const { colors } = useTheme();
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
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading && !weather) {
        return (
            <View style={[styles.container, { backgroundColor: colors.surface }]}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Atualizando clima...</Text>
            </View>
        );
    }

    if (permissionDenied && !weather) {
        return (
            <TouchableOpacity onPress={() => refreshWeather(true)} style={[styles.container, { backgroundColor: colors.surface }]}>
                <Ionicons name="location-outline" size={24} color={colors.primary} />
                <Text style={[styles.text, { color: colors.textSecondary }]}>Ativar previsão meteorológica</Text>
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
            <View style={[styles.container, { backgroundColor: colors.surface }]}>
                <View style={styles.leftCol}>
                    <View style={[styles.iconCircle, { backgroundColor: (colors.primary || '#1E8E5A') + '15', borderColor: colors.border }]}>
                        <Ionicons name={getIcon(weather?.icon || '01d')} size={30} color={colors.primary} />
                    </View>
                    <View style={styles.infoCol}>
                        <Text style={[styles.mainText, { color: colors.text }]}>{weather.temp}°C</Text>
                        <Text style={[styles.subText, { color: colors.textSecondary }]}>{weather.city}</Text>
                    </View>
                </View>

                <View style={styles.rightCol}>
                    <View style={styles.timeBadge}>
                        <Ionicons name="time" size={10} color={colors.textSecondary} style={{ marginRight: 4 }} />
                        <Text style={[styles.timeBadgeText, { color: colors.textSecondary }]}>{currentTime}</Text>
                    </View>
                    <View style={styles.detailsRow}>
                        <View style={styles.detailItem}>
                            <Ionicons name="water" size={10} color={colors.primary} />
                            <Text style={[styles.detailText, { color: colors.textSecondary }]}>{weather.humidity}%</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Ionicons name="leaf" size={10} color={colors.primary} />
                            <Text style={[styles.detailText, { color: colors.textSecondary }]}>{weather.wind}kmh</Text>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    touchableWrapper: {
        width: '100%',
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12, // Reduzido para caber melhor no layout lado a lado
        paddingVertical: 14,
    },
    leftCol: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
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
        marginBottom: 6,
    },
    timeBadgeText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5
    },
    detailsRow: {
        flexDirection: 'column',
        gap: 4,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    detailText: {
        fontSize: 10,
        fontWeight: '800',
    },
    loadingText: { fontSize: 11, marginLeft: 6, fontWeight: '700' },
    text: { fontSize: 11, marginLeft: 6, fontWeight: '700' },
    mainText: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
    subText: { fontSize: 10, fontWeight: '800', opacity: 1, textTransform: 'uppercase' },
});
