import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWeather } from '../../context/WeatherContext';
import { useTheme } from '../../theme/ThemeContext';
import GlowCard from './GlowCard';

export default function WeatherIntelligenceCard() {
    const { weather } = useWeather();
    const { theme } = useTheme();
    const isDark = theme?.dark || false;

    if (!weather || !weather.alerts || weather.alerts.length === 0) {
        // Se não tiver alertas, mostra uma dica padrão de manejo
        return (
            <GlowCard style={styles.container}>
                <View style={styles.header}>
                    <Ionicons name="bulb" size={20} color="#F59E0B" />
                    <Text style={[styles.title, { color: isDark ? '#FFF' : '#1F2937' }]}>
                        INTELIGÊNCIA CLIMÁTICA
                    </Text>
                </View>
                <Text style={[styles.description, { color: isDark ? '#9CA3AF' : '#4B5563' }]}>
                    O clima está estável hoje. Condições ideais para aplicações foliares e vistorias em campo.
                </Text>
            </GlowCard>
        );
    }

    return (
        <GlowCard style={[styles.container, { borderColor: '#EF4444' }]}>
            <View style={styles.header}>
                <Ionicons name="warning" size={20} color="#EF4444" />
                <Text style={[styles.title, { color: '#EF4444' }]}>
                    ALERTA CLIMÁTICO
                </Text>
            </View>
            {weather.alerts.map((alert, index) => (
                <View key={index} style={styles.alertBox}>
                    <Text style={[styles.alertEvent, { color: alert.color || '#EF4444' }]}>
                        {alert.event}
                    </Text>
                    <Text style={[styles.description, { color: isDark ? '#FFF' : '#1F2937' }]}>
                        {alert.description}
                    </Text>
                </View>
            ))}
        </GlowCard>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 8,
    },
    title: {
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 1,
    },
    description: {
        fontSize: 13,
        lineHeight: 20,
        fontWeight: '500',
    },
    alertBox: {
        marginTop: 5,
    },
    alertEvent: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
    }
});
