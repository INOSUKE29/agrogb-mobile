import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

const QuickAction = ({ icon, label, onPress, color, prefix }) => {
    const { colors, isDark } = useTheme();

    return (
        <TouchableOpacity
            style={[
                styles.container, 
                { 
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0,0,0,0.05)',
                    borderWidth: 1
                }
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.iconWrapper}>
                {prefix && (
                    <Text style={[styles.prefix, { color: color || colors.primary }]}>{prefix} </Text>
                )}
                <Ionicons name={icon} size={28} color={color || colors.primary} />
            </View>
            <Text style={[styles.label, { color: isDark ? '#FFFFFF' : colors.textPrimary }]}>{label}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '48%',
        aspectRatio: 1.2,
        padding: 16,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 2,
    },
    iconWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8
    },
    prefix: {
        fontSize: 22,
        fontWeight: '900',
    },
    label: { 
        fontSize: 13, 
        fontWeight: 'bold', 
        textAlign: 'center',
        letterSpacing: 0.3
    }
});

export default QuickAction;
