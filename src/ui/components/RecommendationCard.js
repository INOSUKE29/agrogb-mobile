
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RecommendationCard({ recommendation, onAction }) {
    const isCrisis = recommendation.tipo === 'Calagem' || recommendation.titulo.includes('Crítico');

    return (
        <View style={[styles.card, isCrisis && styles.crisisCard]}>
            <View style={styles.header}>
                <Ionicons 
                    name={isCrisis ? "alert-circle" : "bulb-outline"} 
                    size={24} 
                    color={isCrisis ? "#B91C1C" : "#15803D"} 
                />
                <Text style={[styles.title, isCrisis && styles.crisisTitle]}>{recommendation.titulo}</Text>
            </View>

            <Text style={styles.description}>{recommendation.descricao}</Text>

            <View style={styles.pillRow}>
                <View style={styles.pill}>
                    <Text style={styles.pillText}>{recommendation.produto_sugerido}</Text>
                </View>
                <View style={[styles.pill, { backgroundColor: '#E0F2FE' }]}>
                    <Text style={[styles.pillText, { color: '#0369A1' }]}>{recommendation.dose_sugerida}</Text>
                </View>
            </View>

            <Text style={styles.footer}>Baseado em: {recommendation.baseado_em}</Text>

            <TouchableOpacity style={styles.actionBtn} onPress={onAction}>
                <Text style={styles.actionText}>MARCAR COMO APLICADO</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, marginVertical: 8, elevation: 3, borderLeftWidth: 4, borderLeftColor: '#15803D' },
    crisisCard: { borderLeftColor: '#B91C1C', backgroundColor: '#FEF2F2' },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    title: { fontSize: 16, fontWeight: 'bold', color: '#15803D', marginLeft: 8 },
    crisisTitle: { color: '#B91C1C' },
    description: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
    pillRow: { flexDirection: 'row', marginVertical: 12 },
    pill: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginRight: 8 },
    pillText: { fontSize: 11, fontWeight: '700', color: '#166534' },
    footer: { fontSize: 10, color: '#9CA3AF', fontStyle: 'italic' },
    actionBtn: { marginTop: 12, paddingVertical: 10, backgroundColor: '#F3F4F6', borderRadius: 8, alignItems: 'center' },
    actionText: { fontSize: 12, fontWeight: 'bold', color: '#374151' }
});
