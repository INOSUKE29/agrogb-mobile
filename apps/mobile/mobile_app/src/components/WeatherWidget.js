import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWeather } from '../context/WeatherContext';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';

export default function WeatherWidget() {
    const { weather, loading, error, permissionDenied } = useWeather();
    const navigation = useNavigation();
    const { theme } = useTheme();

    if (loading && !weather) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="small" color={theme?.colors?.primary || '#10B981'} />
                <Text style={styles.loadingText}>Buscando clima local...</Text>
            </View>
        );
    }

    if (permissionDenied && !weather) {
        return (
            <TouchableOpacity onPress={() => navigation.navigate('Clima')} style={styles.container}>
                <Ionicons name="location-outline" size={16} color="#9CA3AF" />
                <Text style={styles.textMuted}>Toque para ativar o clima local</Text>
            </TouchableOpacity>
        );
    }

    if (error && !weather) {
        return (
            <TouchableOpacity onPress={() => navigation.navigate('Clima')} style={styles.container}>
                <Ionicons name="cloud-offline-outline" size={16} color="#EF4444" />
                <Text style={styles.textError}>Clima indisponível no momento</Text>
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

    return (
        <TouchableOpacity onPress={() => navigation.navigate('Clima')} activeOpacity={0.7} style={styles.touchableWrapper}>
            <View style={[styles.container, { backgroundColor: theme?.colors?.card || 'rgba(0,0,0,0.2)' }]}>
                <View style={styles.header}>
                    <Ionicons name={getIcon(weather.icon)} size={16} color="#FBBF24" />
                    <Text style={styles.city}>{weather.city}</Text>
                </View>
                
                <View style={styles.infoRow}>
                    <Text style={styles.mainTemp}>{weather.temp}°C</Text>
                    <Text style={styles.separator}>|</Text>
                    <Text style={styles.detailsText}>Umidade {weather.humidity}%</Text>
                </View>
                
                <View style={styles.subRow}>
                    <Text style={styles.detailsText}>Vento {weather.wind} km/h</Text>
                    <Text style={styles.separator}>•</Text>
                    <Text style={styles.detailsText}>Chuva: {weather.pop}%</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    touchableWrapper: {
        width: '100%',
        marginBottom: 10,
    },
    container: {
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    city: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: 'bold',
        marginLeft: 6,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    mainTemp: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '900',
    },
    separator: {
        color: '#6B7280',
        marginHorizontal: 6,
        fontSize: 12,
    },
    subRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailsText: {
        color: '#D1FAE5',
        fontSize: 12,
        fontWeight: '500',
    },
    loadingText: {
        color: '#9CA3AF',
        fontSize: 12,
        marginLeft: 8,
    },
    textMuted: {
        color: '#9CA3AF',
        fontSize: 12,
        marginLeft: 6,
    },
    textError: {
        color: '#FCA5A5',
        fontSize: 12,
        marginLeft: 6,
    }
});
