import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWeather } from '../context/WeatherContext';

export default function WeatherWidget() {
    const { weather, loading, error, permissionDenied, refreshWeather } = useWeather();

    if (loading && !weather) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="small" color="#A7F3D0" />
                <Text style={styles.loadingText}>Atualizando...</Text>
            </View>
        );
    }

    if (permissionDenied && !weather) {
        return (
            <TouchableOpacity style={styles.container} onPress={() => refreshWeather(true)}>
                <Ionicons name="location-outline" size={16} color="#A7F3D0" />
                <Text style={styles.text}>Ativar Clima</Text>
            </TouchableOpacity>
        );
    }

    if (error && !weather) {
        return (
            <TouchableOpacity style={styles.container} onPress={() => refreshWeather(true)}>
                <Ionicons name="cloud-offline-outline" size={16} color="#A7F3D0" />
                <Text style={styles.text}>Toque p/ atualizar</Text>
            </TouchableOpacity>
        );
    }

    if (!weather) return null;

    // Icon mapping (simple)
    const getIcon = (iconCode) => {
        if (iconCode.includes('01')) return 'sunny';
        if (iconCode.includes('02')) return 'partly-sunny';
        if (iconCode.includes('03') || iconCode.includes('04')) return 'cloudy';
        if (iconCode.includes('09') || iconCode.includes('10')) return 'rainy';
        if (iconCode.includes('11')) return 'thunderstorm';
        return 'cloud-outline';
    };

    return (
        <TouchableOpacity style={styles.container} onPress={refreshWeather}>
            <Ionicons name={getIcon(weather.icon)} size={18} color="#FFD700" style={{ marginRight: 6 }} />

            <Text style={styles.mainText}>
                {weather.temp}°C
            </Text>

            <View style={styles.divider} />

            <Text style={styles.subText}>
                Chuva {weather.humidity}%
            </Text>

            <View style={styles.divider} />

            <Text style={styles.subText}>
                Vento {weather.wind} km/h
            </Text>

            {/* Invisible spacer or location text if needed, but keeping it compact as requested */}
            {/* <Text style={[styles.subText, { marginLeft: 8, fontStyle: 'italic' }]}>{weather.city}</Text> */}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
        // No background, just text on the green header
    },
    loadingText: { color: '#A7F3D0', fontSize: 12, marginLeft: 6 },
    text: { color: '#A7F3D0', fontSize: 12, marginLeft: 6 },
    mainText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
    subText: { color: '#E0F2FE', fontSize: 12 },
    divider: {
        width: 1, height: 10,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginHorizontal: 8
    }
});
