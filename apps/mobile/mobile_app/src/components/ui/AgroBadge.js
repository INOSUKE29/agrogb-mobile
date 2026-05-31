import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export default function AgroBadge({ status, label, style }) {
    const { colors } = useTheme();

    // Regras de fallback de cor baseados na keyword do status (simples e escalavel)
    let dotColor = colors.info;
    const lowerStatus = (label || status || '').toLowerCase();
    
    if (lowerStatus.includes('sucesso') || lowerStatus.includes('ativo') || lowerStatus.includes('pago') || lowerStatus.includes('confirmado')) {
        dotColor = colors.success;
    } else if (lowerStatus.includes('pendente') || lowerStatus.includes('atençao') || lowerStatus.includes('receber') || lowerStatus.includes('analise')) {
        dotColor = colors.warning;
    } else if (lowerStatus.includes('erro') || lowerStatus.includes('atrasado') || lowerStatus.includes('cancelado') || lowerStatus.includes('descartado')) {
        dotColor = colors.error;
    }

    // Estilo translúcido glass usando o hex como base se não existir helper
    return (
        <View style={[styles.badgeBase, { backgroundColor: dotColor + '20', borderColor: dotColor + '40' }, style]}>
            <View style={[styles.dot, { backgroundColor: dotColor }]} />
            <Text style={[styles.badgeText, { color: dotColor }]}>{label || status}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badgeBase: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        alignSelf: 'flex-start'
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase'
    }
});
