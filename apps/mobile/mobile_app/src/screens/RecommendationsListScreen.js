import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, StyleSheet, ScrollView, TouchableOpacity, 
    ActivityIndicator, Alert, Share, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { RecommendationService } from '../services/RecommendationService';
import Card from '../components/common/Card';

export default function RecommendationsListScreen({ navigation, isTabbed }) {
    const { theme } = useTheme();
    const { user, role } = useAuth();
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        loadRecommendations();
    }, []);

    const loadRecommendations = async () => {
        setLoading(true);
        try {
            const data = await RecommendationService.getRecommendations(user.uuid, role);
            setRecommendations(data);
        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const data = await RecommendationService.getRecommendations(user.uuid, role);
            setRecommendations(data);
        } catch (e) {
            console.log(e);
        } finally {
            setRefreshing(false);
        }
    };

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleUpdateStatus = async (uuid, newStatus) => {
        const title = newStatus === 'APPLIED' ? 'Confirmar Aplicação' : 'Recusar Prescrição';
        const msg = newStatus === 'APPLIED' 
            ? 'Deseja marcar essa adubação como aplicada na lavoura agora? Isso atualizará o histórico de atividades.'
            : 'Deseja realmente recusar essa recomendação?';

        Alert.alert(title, msg, [
            { text: 'Cancelar', style: 'cancel' },
            { 
                text: 'SIM, CONFIRMAR', 
                onPress: async () => {
                    try {
                        const res = await RecommendationService.updateRecommendationStatus(uuid, newStatus);
                        if (res.success) {
                            Alert.alert('Sucesso!', `Prescrição marcada como ${newStatus === 'APPLIED' ? 'APLICADA' : 'RECUSADA'}.`);
                            loadRecommendations();
                        } else {
                            Alert.alert('Erro', res.error || 'Não foi possível atualizar.');
                        }
                    } catch (e) {
                        Alert.alert('Erro', 'Falha ao processar.');
                    }
                } 
            }
        ]);
    };

    const handleShare = async (item) => {
        try {
            const dateStr = new Date(item.last_updated).toLocaleDateString('pt-BR');
            let recipeLines = '';
            
            if (Array.isArray(item.recipe_data)) {
                item.recipe_data.forEach((r, idx) => {
                    recipeLines += `• *Insumo #${idx+1}:* ${r.product} — ${r.dosage} ${r.unit}\n`;
                });
            }

            const message = `🌱 *AgroGB — Receita e Prescrição Técnica*\n\n` +
                `👤 *Agrônomo:* ${item.agronomist_name || 'Técnico'}\n` +
                `🌾 *Cliente:* ${item.client_name || 'Produtor'}\n` +
                `📅 *Data Emissão:* ${dateStr}\n` +
                `🧪 *Método:* Adubação ${item.recipe_type}\n\n` +
                `⚡ *RECEITUÁRIO:*\n${recipeLines}\n` +
                `📝 *Observações:* ${item.notes || 'Nenhuma.'}\n\n` +
                `_Gerado automaticamente pelo aplicativo AgroGB._`;

            await Share.share({ message });
        } catch (e) {
            console.log(e);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'APPLIED': return { bg: '#D1FAE5', text: '#065F46', label: 'APLICADO' };
            case 'CANCELLED': return { bg: '#FEE2E2', text: '#991B1B', label: 'RECUSADO' };
            default: return { bg: '#FEF3C7', text: '#92400E', label: 'PENDENTE' };
        }
    };

    return (
        <View style={styles.container}>
            {!isTabbed && (
                <LinearGradient colors={['#064E3B', '#10B981']} style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.title}>RECEITAS & PRESCRIÇÕES</Text>
                    <Text style={styles.subtitle}>Gerencie receitas de gotejo e aplicação foliar.</Text>
                </LinearGradient>
            )}

            {loading && recommendations.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text style={styles.loadingText}>Carregando recomendações...</Text>
                </View>
            ) : (
                <ScrollView 
                    contentContainerStyle={styles.scroll} 
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#10B981']} />
                    }
                >
                    {recommendations.length === 0 ? (
                        <Card style={styles.emptyCard}>
                            <Ionicons name="receipt-outline" size={56} color="#9CA3AF" />
                            <Text style={styles.emptyTitle}>Nenhuma recomendação</Text>
                            <Text style={styles.emptySubtitle}>
                                {role === 'AGRONOMO' 
                                    ? 'Crie sua primeira prescrição técnica clicando no botão abaixo!'
                                    : 'Aguarde seu agrônomo vinculado enviar as primeiras prescrições técnicas.'}
                            </Text>
                        </Card>
                    ) : (
                        recommendations.map((item) => {
                            const isExpanded = expandedId === item.uuid;
                            const status = getStatusStyle(item.status);
                            const dateStr = new Date(item.last_updated).toLocaleDateString('pt-BR');

                            return (
                                <Card key={item.uuid} style={styles.itemCard}>
                                    <TouchableOpacity 
                                        activeOpacity={0.8}
                                        onPress={() => toggleExpand(item.uuid)}
                                        style={styles.cardHeader}
                                    >
                                        <View style={{ flex: 1, gap: 4 }}>
                                            <Text style={styles.cardTitle}>
                                                Adubação {item.recipe_type}
                                            </Text>
                                            <Text style={styles.cardMeta}>
                                                {role === 'AGRONOMO' 
                                                    ? `Destinatário: ${item.client_name}` 
                                                    : `Emitido por: ${item.agronomist_name}`}
                                            </Text>
                                            <Text style={styles.cardDate}>
                                                Emissão: {dateStr}
                                            </Text>
                                        </View>
                                        
                                        <View style={{ alignItems: 'flex-end', gap: 8 }}>
                                            <View style={[styles.badge, { backgroundColor: status.bg }]}>
                                                <Text style={[styles.badgeText, { color: status.text }]}>{status.label}</Text>
                                            </View>
                                            <Ionicons 
                                                name={isExpanded ? "chevron-up" : "chevron-down"} 
                                                size={20} 
                                                color="#9CA3AF" 
                                            />
                                        </View>
                                    </TouchableOpacity>

                                    {isExpanded && (
                                        <View style={styles.expandedContent}>
                                            <View style={styles.divider} />
                                            
                                            <Text style={styles.gridTitle}>FÓRMULA / PRESCRIÇÃO</Text>
                                            
                                            <View style={styles.grid}>
                                                <View style={styles.gridHeader}>
                                                    <Text style={[styles.gridCol, { flex: 3 }]}>PRODUTO</Text>
                                                    <Text style={[styles.gridCol, { flex: 1, textAlign: 'right' }]}>DOSE</Text>
                                                    <Text style={[styles.gridCol, { flex: 1, textAlign: 'center' }]}>UNID.</Text>
                                                </View>
                                                {Array.isArray(item.recipe_data) && item.recipe_data.map((r, i) => (
                                                    <View key={i} style={styles.gridRow}>
                                                        <Text style={[styles.gridText, { flex: 3 }]}>{r.product}</Text>
                                                        <Text style={[styles.gridText, { flex: 1, textAlign: 'right', fontWeight: 'bold' }]}>{r.dosage}</Text>
                                                        <Text style={[styles.gridText, { flex: 1, textAlign: 'center', color: '#10B981', fontWeight: 'bold' }]}>{r.unit}</Text>
                                                    </View>
                                                ))}
                                            </View>

                                            {item.notes ? (
                                                <View style={styles.notesContainer}>
                                                    <Text style={styles.notesTitle}>Instruções Técnicas:</Text>
                                                    <Text style={styles.notesText}>{item.notes}</Text>
                                                </View>
                                            ) : null}

                                            <View style={styles.actionsRow}>
                                                <TouchableOpacity 
                                                    style={styles.actionBtnShare}
                                                    onPress={() => handleShare(item)}
                                                >
                                                    <Ionicons name="logo-whatsapp" size={18} color="#FFF" />
                                                    <Text style={styles.actionTextShare}>ENVIAR</Text>
                                                </TouchableOpacity>

                                                {role === 'CLIENTE' && item.status === 'PENDING' && (
                                                    <View style={styles.clientActions}>
                                                        <TouchableOpacity 
                                                            style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                                                            onPress={() => handleUpdateStatus(item.uuid, 'APPLIED')}
                                                        >
                                                            <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
                                                            <Text style={styles.actionText}>APLICAR</Text>
                                                        </TouchableOpacity>
                                                        
                                                        <TouchableOpacity 
                                                            style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
                                                            onPress={() => handleUpdateStatus(item.uuid, 'CANCELLED')}
                                                        >
                                                            <Ionicons name="close-circle-outline" size={18} color="#FFF" />
                                                            <Text style={styles.actionText}>RECUSAR</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    )}
                                </Card>
                            );
                        })
                    )}
                </ScrollView>
            )}

            {/* FLOATING ACTION BUTTON (FAB) FOR AGRONOMISTS */}
            {role === 'AGRONOMO' && (
                <TouchableOpacity 
                    style={styles.fab}
                    onPress={() => navigation.navigate('CreateRecommendation')}
                    activeOpacity={0.8}
                >
                    <Ionicons name="add" size={32} color="#FFF" />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { paddingTop: 60, paddingBottom: 35, paddingHorizontal: 25, borderBottomLeftRadius: 35, borderBottomRightRadius: 35 },
    backBtn: { marginBottom: 15 },
    title: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: 2 },
    subtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 5, fontWeight: '600' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
    loadingText: { fontSize: 14, color: '#4B5563', fontWeight: '600' },
    scroll: { padding: 20, paddingBottom: 100 },
    
    /* Listing card */
    itemCard: { padding: 0, borderRadius: 20, overflow: 'hidden' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    cardTitle: { fontSize: 16, fontWeight: '900', color: '#111827' },
    cardMeta: { fontSize: 12, color: '#6B7280', marginTop: 2, fontWeight: '600' },
    cardDate: { fontSize: 10, color: '#9CA3AF', marginTop: 2, fontWeight: 'bold' },
    badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    badgeText: { fontSize: 10, fontWeight: '900' },

    /* Expandable body */
    expandedContent: { paddingHorizontal: 20, paddingBottom: 20 },
    divider: { height: 1.5, backgroundColor: '#F3F4F6', marginBottom: 15 },
    gridTitle: { fontSize: 10, fontWeight: '900', color: '#6B7280', letterSpacing: 1, marginBottom: 10 },
    grid: { backgroundColor: '#F9FAFB', borderRadius: 15, padding: 15, borderWidth: 1, borderColor: '#E5E7EB', gap: 8 },
    gridHeader: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#E5E7EB', paddingBottom: 8, marginBottom: 4 },
    gridCol: { fontSize: 10, fontWeight: '900', color: '#6B7280', letterSpacing: 0.5 },
    gridRow: { flexDirection: 'row', alignItems: 'center' },
    gridText: { fontSize: 12, color: '#374151', fontWeight: '700' },

    /* Notes inside body */
    notesContainer: { marginTop: 15, backgroundColor: '#ECFDF5', borderRadius: 12, padding: 15, borderLeftWidth: 3, borderColor: '#10B981' },
    notesTitle: { fontSize: 11, fontWeight: '900', color: '#065F46' },
    notesText: { fontSize: 12, color: '#065F46', lineHeight: 18, marginTop: 4, fontWeight: '600' },

    /* Action buttons */
    actionsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 20 },
    actionBtnShare: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2563EB', paddingVertical: 12, borderRadius: 12 },
    actionTextShare: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    clientActions: { flex: 2, flexDirection: 'row', gap: 8 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
    actionText: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 1 },

    /* Floating Action Button (FAB) */
    fab: { position: 'absolute', bottom: 30, right: 25, width: 60, height: 60, borderRadius: 30, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8, zIndex: 5 },

    /* Empty states */
    emptyCard: { padding: 45, alignItems: 'center', gap: 10, borderRadius: 25 },
    emptyTitle: { fontSize: 16, fontWeight: '900', color: '#4B5563' },
    emptySubtitle: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 18, fontWeight: '500', paddingHorizontal: 10 }
});
