import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import AgroButton from './AgroButton';

export default function AgroStateOverlay({ state, message, onRetry, icon }) {
    const { theme } = useTheme();

    if (state === 'loading') {
        return (
            <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#0F172A' }]}>
                <ActivityIndicator size="large" color={theme?.colors?.primary || '#10B981'} />
                <Text style={[styles.text, { color: theme?.colors?.textMuted || '#94A3B8', marginTop: 15 }]}>{message || 'Carregando...'}</Text>
            </View>
        );
    }

    if (state === 'error') {
        return (
            <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#0F172A' }]}>
                <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                <Text style={[styles.title, { color: theme?.colors?.textMain || '#F8FAFC' }]}>Ops! Ocorreu um erro</Text>
                <Text style={[styles.text, { color: theme?.colors?.textMuted || '#94A3B8' }]}>{message}</Text>
                {onRetry && (
                    <AgroButton title="TENTAR NOVAMENTE" onPress={onRetry} style={{ marginTop: 20, width: '80%' }} />
                )}
            </View>
        );
    }

    if (state === 'empty') {
        return (
            <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#0F172A' }]}>
                <Ionicons name={icon || "folder-open-outline"} size={64} color={theme?.colors?.textSub || '#6B7280'} />
                <Text style={[styles.title, { color: theme?.colors?.textMain || '#F8FAFC' }]}>Nada por aqui</Text>
                <Text style={[styles.text, { color: theme?.colors?.textMuted || '#94A3B8' }]}>{message}</Text>
                {onRetry && (
                    <AgroButton title="ADICIONAR AGORA" onPress={onRetry} style={{ marginTop: 20, width: '80%' }} />
                )}
            </View>
        );
    }

    return null;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
        minHeight: 300
    },
    title: {
        fontSize: 18,
        fontWeight: '900',
        marginTop: 20,
        marginBottom: 10,
        textAlign: 'center'
    },
    text: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22
    }
});
