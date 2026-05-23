import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

const { width } = Dimensions.get('window');

/**
 * DashboardContent - Diamond Pro 2026 💎
 * Componente unificado de interface premium.
 */
export default function DashboardContent({ data }) {
    const { colors, isDark } = useTheme();
    const { roi, receita, despesa, harvest } = data;

    return (
        <View style={styles.container}>
            
            {/* CARD DE RESUMO FINANCEIRO (Glassmorphism) */}
            <View style={styles.glassContainer}>
                <BlurView intensity={30} tint="dark" style={styles.glassCard}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardLabel}>RESUMO FINANCEIRO</Text>
                        <View style={styles.roiBadge}>
                            <Text style={styles.roiText}>{roi}% ROI</Text>
                        </View>
                    </View>
                    <Text style={styles.mainValue}>R$ {receita.toLocaleString()}</Text>
                    <View style={styles.divider} />
                    <View style={styles.statsRow}>
                        <View>
                            <Text style={styles.statLabel}>CUSTO TOTAL</Text>
                            <Text style={[styles.statValue, { color: '#FCA5A5' }]}>R$ {despesa.toLocaleString()}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.statLabel}>STATUS</Text>
                            <Text style={[styles.statValue, { color: '#A3E635' }]}>SALDO POSITIVO</Text>
                        </View>
                    </View>
                </BlurView>
            </View>

            {/* PROGRESSO DA COLHEITA (Padrão Diamond) */}
            <View style={styles.sectionArea}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>PROGRESSO DA COLHEITA</Text>
                    <Ionicons name="leaf-outline" size={18} color="#A3E635" />
                </View>
                <View style={[styles.progressCard, { backgroundColor: 'rgba(255,255,255,0.03)' }]}>
                    <View style={styles.progressTop}>
                        <Text style={styles.progressLabel}>SAFRA ATUAL</Text>
                        <Text style={styles.progressPercent}>{harvest.percentual}%</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <LinearGradient
                            colors={['#A3E635', '#10B981']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.progressBarFill, { width: `${harvest.percentual}%` }]}
                        />
                    </View>
                    <Text style={styles.progressSub}>
                        {harvest.colhido.toLocaleString()} kg de {harvest.estimado.toLocaleString()} kg estimados
                    </Text>
                </View>
            </View>

            {/* GRID DE MÉTRICAS RÁPIDAS */}
            <View style={styles.grid}>
                <View style={[styles.miniCard, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                    <Ionicons name="trending-up" size={20} color="#A3E635" />
                    <Text style={styles.miniLabel}>PERFORMANCE</Text>
                    <Text style={styles.miniValue}>OTIMIZADA</Text>
                </View>
                <View style={[styles.miniCard, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                    <Ionicons name="cloud-done-outline" size={20} color="#A3E635" />
                    <Text style={styles.miniLabel}>SINCRONIA</Text>
                    <Text style={styles.miniValue}>100% ONLINE</Text>
                </View>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    glassContainer: { borderRadius: 30, overflow: 'hidden', marginBottom: 25 },
    glassCard: { padding: 24 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    cardLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
    roiBadge: { backgroundColor: 'rgba(163, 230, 53, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    roiText: { color: '#A3E635', fontSize: 11, fontWeight: 'bold' },
    mainValue: { color: '#FFF', fontSize: 32, fontWeight: '900', marginBottom: 20 },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 20 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 'bold', marginBottom: 5 },
    statValue: { fontSize: 14, fontWeight: '900' },

    sectionArea: { marginBottom: 25 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
    progressCard: { padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    progressTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    progressLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold' },
    progressPercent: { color: '#A3E635', fontSize: 16, fontWeight: '900' },
    progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 4 },
    progressSub: { color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 12, fontWeight: 'bold' },

    grid: { flexDirection: 'row', gap: 15 },
    miniCard: { flex: 1, padding: 20, borderRadius: 24, alignItems: 'center' },
    miniLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 'bold', marginTop: 10 },
    miniValue: { color: '#FFF', fontSize: 12, fontWeight: '900', marginTop: 4 }
});
