import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function ScreenHeader({ title, onBack, transparent, rightElement }) {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};
    
    const isDark = theme?.theme_mode === 'dark';
    
    // Configurações de cores de fundo reativas
    const bgColor = transparent 
        ? 'transparent' 
        : (isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)');

    return (
        <View style={[
            styles.headerContainer, 
            { 
                backgroundColor: bgColor,
                borderBottomColor: transparent ? 'transparent' : (activeColors.border || 'rgba(0,0,0,0.05)'),
                borderBottomWidth: transparent ? 0 : 1
            }
        ]}>
            <View style={styles.contentRow}>
                {onBack ? (
                    <TouchableOpacity onPress={onBack} style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                        <Ionicons name="arrow-back" size={22} color={activeColors.text || '#1E293B'} />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.placeholder} />
                )}

                <Text style={[styles.title, { color: activeColors.text || '#1E293B' }]} numberOfLines={1}>
                    {title}
                </Text>

                {rightElement ? (
                    <View style={styles.rightContainer}>
                        {rightElement}
                    </View>
                ) : (
                    <View style={styles.placeholder} />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        paddingTop: Platform.OS === 'ios' ? 15 : 45,
        paddingBottom: 15,
        paddingHorizontal: 20,
        justifyContent: 'center',
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 44,
    },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1.5,
        textAlign: 'center',
        flex: 1,
        marginHorizontal: 15,
        textTransform: 'uppercase',
    },
    placeholder: {
        width: 38,
        height: 38,
    },
    rightContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    }
});
