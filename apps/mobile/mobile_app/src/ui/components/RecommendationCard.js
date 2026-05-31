import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/common/Card';

/**
 * RecommendationCard - Cartão de Recomendações Agronômicas da IA 💡🌾
 * Exibe insights técnicos e botão de ação para aplicar melhorias de campo.
 */
export default function RecommendationCard({ recommendation, onAction }) {
    const { theme } = useTheme();
    const colors = theme?.colors || {};

    const { titulo, descricao, grau_urgencia, categoria } = recommendation || {};

    const urgencyColor = grau_urgencia === 'Alto' ? '#EF4444' : (grau_urgencia === 'Médio' ? '#F59E0B' : '#10B981');
    const urgencyBg = grau_urgencia === 'Alto' ? 'rgba(239, 68, 68, 0.1)' : (grau_urgencia === 'Médio' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)');

    return (
        <Card style={[styles.card, { backgroundColor: colors.card || 'rgba(30, 41, 59, 0.25)' }]}>
            <View style={styles.header}>
                <View style={styles.categoryRow}>
                    <Ionicons name="bulb-outline" size={14} color={colors.primary || '#A3E635'} />
                    <Text style={[styles.category, { color: colors.primary || '#A3E635' }]}>{(categoria || 'Geral').toUpperCase()}</Text>
                </View>
                <View style={[styles.urgencyBadge, { backgroundColor: urgencyBg }]}>
                    <Text style={[styles.urgencyText, { color: urgencyColor }]}>{(grau_urgencia || 'Normal').toUpperCase()}</Text>
                </View>
            </View>

            <Text style={[styles.title, { color: colors.text || '#FFF' }]}>{titulo}</Text>
            <Text style={styles.desc}>{descricao}</Text>

            <TouchableOpacity 
                style={[styles.btn, { borderColor: colors.primary || '#A3E635' }]} 
                onPress={onAction}
                activeOpacity={0.7}
            >
                <Text style={[styles.btnText, { color: colors.primary || '#A3E635' }]}>MARCAR COMO APLICADO</Text>
            </TouchableOpacity>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: { marginHorizontal: 20, padding: 20, borderRadius: 24, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    category: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    urgencyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    urgencyText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
    title: { fontSize: 15, fontWeight: '800', marginBottom: 8, letterSpacing: -0.2 },
    desc: { fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 20, marginBottom: 16, fontWeight: '500' },
    btn: { height: 42, borderRadius: 12, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.01)' },
    btnText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 }
});
