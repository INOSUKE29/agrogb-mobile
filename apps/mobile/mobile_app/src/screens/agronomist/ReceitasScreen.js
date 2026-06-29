import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../theme/ThemeContext';
import { executeQuery } from '../../../database/database';
import AgroStateOverlay from '../../../components/common/AgroStateOverlay';

export default function ReceitasScreen({ navigation }) {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};
    const isDark = theme?.theme_mode === 'dark';

    const [loading, setLoading] = useState(true);
    const [receitas, setReceitas] = useState([]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadReceitas();
        });
        loadReceitas();
        return unsubscribe;
    }, [navigation]);

    const loadReceitas = async () => {
        setLoading(true);
        try {
            const query = `
                SELECT 
                    r.uuid, r.title, r.scheduled_date, r.status, r.application_type,
                    c.nome as cliente_nome, f.nome as farm_nome
                FROM recommendations r
                LEFT JOIN v2_clientes c ON r.client_id = c.uuid
                LEFT JOIN farms f ON r.farm_uuid = f.uuid
                WHERE r.is_deleted = 0
                ORDER BY r.scheduled_date DESC
            `;
            const res = await executeQuery(query);
            const rows = [];
            for (let i = 0; i < res.rows.length; i++) {
                rows.push(res.rows.item(i));
            }
            setReceitas(rows);
        } catch (e) {
            console.error('Erro ao carregar receitas:', e);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'PENDING': return { bg: 'rgba(234, 179, 8, 0.2)', text: '#EAB308', label: 'Pendente' };
            case 'COMPLETED': return { bg: 'rgba(16, 185, 129, 0.2)', text: '#10B981', label: 'Aplicado' };
            case 'CANCELLED': return { bg: 'rgba(239, 68, 68, 0.2)', text: '#EF4444', label: 'Cancelado' };
            default: return { bg: 'rgba(156, 163, 175, 0.2)', text: '#9CA3AF', label: status };
        }
    };

    const renderItem = ({ item }) => {
        const st = getStatusColor(item.status);
        return (
            <View style={[styles.card, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }]}>
                <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="document-text-outline" size={24} color="#10B981" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.fieldTitle, { color: activeColors.text || '#1F2937' }]}>{item.title}</Text>
                        <Text style={[styles.farmName, { color: activeColors.textSub || '#6B7280' }]}>
                            {item.cliente_nome} • {item.farm_nome}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                        <Text style={[styles.statusText, { color: st.text }]}>{st.label}</Text>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.infoBadge}>
                        <Ionicons name="calendar-outline" size={14} color={activeColors.textSub || '#6B7280'} />
                        <Text style={[styles.infoText, { color: activeColors.textSub || '#6B7280' }]}>
                            Data: {new Date(item.scheduled_date).toLocaleDateString('pt-BR')}
                        </Text>
                    </View>
                    <View style={styles.infoBadge}>
                        <Ionicons name="flask-outline" size={14} color={activeColors.textSub || '#6B7280'} />
                        <Text style={[styles.infoText, { color: activeColors.textSub || '#6B7280' }]}>
                            {item.application_type}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: activeColors.bg || '#F3F4F6' }]}>
            <LinearGradient colors={['#06111C', '#0A1522']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>RECEITAS (PRESCRIÇÕES)</Text>
                </View>
            </LinearGradient>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#10B981" />
                </View>
            ) : (
                <FlatList
                    data={receitas}
                    renderItem={renderItem}
                    keyExtractor={item => item.uuid}
                    contentContainerStyle={receitas.length === 0 ? { flex: 1 } : styles.list}
                    ListEmptyComponent={
                        <AgroStateOverlay 
                            state="empty" 
                            message="Nenhuma receita agronômica emitida ainda."
                            icon="document-text-outline"
                        />
                    }
                />
            )}

            <TouchableOpacity 
                style={[styles.fab, { backgroundColor: '#10B981' }]} 
                onPress={() => navigation.navigate('NovaReceita')}
            >
                <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingBottom: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    headerTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', marginLeft: 15, letterSpacing: 1 },
    list: { padding: 15, paddingBottom: 100 },
    card: { 
        borderRadius: 16, 
        padding: 16, 
        marginBottom: 15, 
        borderWidth: 1,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4
    },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 15 },
    iconContainer: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(16, 185, 129, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    fieldTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    farmName: { fontSize: 13, fontWeight: '600' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
    statusText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
    cardFooter: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(156, 163, 175, 0.2)', paddingTop: 15, gap: 15 },
    infoBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(156, 163, 175, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    infoText: { fontSize: 12, fontWeight: 'bold' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    fab: { position: 'absolute', bottom: 30, right: 30, width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 }
});
