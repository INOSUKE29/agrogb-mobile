import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Alert, StatusBar, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { executeQuery } from '../database/database';
import { v4 as uuidv4 } from 'uuid';
import Card from '../components/common/Card';
import AgroStateOverlay from '../components/common/AgroStateOverlay';
import AgroOptionsModal from '../components/common/AgroOptionsModal';

export default function ReceitasScreen() {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};
    const isDark = theme?.theme_mode === 'dark';

    const [receitas, setReceitas] = useState([]);
    const [selectedItemActions, setSelectedItemActions] = useState(null);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadData();
        });
        return unsubscribe;
    }, [navigation]);

    const loadData = async () => {
        try {
            const res = await executeQuery(`
                SELECT r.*, 
                       c.nome as cliente_nome, 
                       f.nome as farm_nome, 
                       fd.nome as field_nome
                FROM recommendations r
                LEFT JOIN clientes c ON r.client_id = c.uuid
                LEFT JOIN farms f ON r.farm_uuid = f.uuid
                LEFT JOIN fields fd ON r.field_uuid = fd.uuid
                WHERE r.is_deleted = 0
                ORDER BY r.created_em DESC, r.scheduled_date DESC
            `);
            const rows = [];
            for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
            setReceitas(rows);
        } catch (e) {
            console.error('Erro ao carregar receitas:', e);
            // Ignore missing columns for created_em if not exists
            try {
                const fallbackRes = await executeQuery(`
                    SELECT r.*, 
                           c.nome as cliente_nome, 
                           f.nome as farm_nome, 
                           fd.nome as field_nome
                    FROM recommendations r
                    LEFT JOIN clientes c ON r.client_id = c.uuid
                    LEFT JOIN farms f ON r.farm_uuid = f.uuid
                    LEFT JOIN fields fd ON r.field_uuid = fd.uuid
                    WHERE r.is_deleted = 0
                    ORDER BY r.scheduled_date DESC
                `);
                const rows = [];
                for (let i = 0; i < fallbackRes.rows.length; i++) rows.push(fallbackRes.rows.item(i));
                setReceitas(rows);
            } catch (err) {
                console.error('Erro fallback ao carregar receitas:', err);
            }
        }
    };

    const handleDelete = (item) => {
        Alert.alert('Excluir', `Deseja excluir a prescrição "${item.title}"?`, [
            { text: 'Cancelar', style: 'cancel' },
            { 
                text: 'EXCLUIR', 
                style: 'destructive',
                onPress: async () => {
                    const now = new Date().toISOString();
                    await executeQuery('UPDATE recommendations SET is_deleted = 1, sync_status = 0, last_updated = ? WHERE uuid = ?', [now, item.uuid]);
                    
                    const payload = JSON.stringify({ uuid: item.uuid, is_deleted: 1 });
                    await executeQuery(
                        `INSERT INTO sync_outbox (uuid, tabela, registro_uuid, acao, payload_json, status, criado_em) VALUES (?, ?, ?, ?, ?, 'PENDENTE', ?)`,
                        [uuidv4(), 'recommendations', item.uuid, 'UPDATE', payload, now]
                    );

                    loadData();
                }
            }
        ]);
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'PENDING': return '#F59E0B'; // Amarelo
            case 'APPLIED': return '#10B981'; // Verde
            case 'EXPIRED': return '#EF4444'; // Vermelho
            default: return '#6B7280'; // Cinza
        }
    };

    const getStatusLabel = (status) => {
        switch(status) {
            case 'PENDING': return 'PENDENTE';
            case 'APPLIED': return 'APLICADA';
            case 'EXPIRED': return 'VENCIDA';
            default: return status;
        }
    };

    const formatData = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    };

    const renderItem = ({ item }) => (
        <Card 
            style={styles.itemCard}
            onPress={() => {}} 
            onLongPress={() => setSelectedItemActions(item)}
        >
            <View style={styles.itemHeader}>
                <View style={[styles.iconContainer, { backgroundColor: isDark ? '#1F2937' : '#EFF6FF' }]}>
                    <Ionicons name="receipt-outline" size={24} color="#3B82F6" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, { color: activeColors.text || '#1F2937' }]}>{item.title}</Text>
                    <Text style={[styles.itemSub, { color: activeColors.textSub || '#6B7280' }]} numberOfLines={1}>
                        {item.cliente_nome} • {item.farm_nome} • {item.field_nome}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{getStatusLabel(item.status)}</Text>
                </View>
            </View>

            <View style={[styles.divider, { backgroundColor: activeColors.border || 'rgba(0,0,0,0.05)' }]} />

            <View style={styles.itemFooter}>
                <View style={styles.infoBlock}>
                    <Ionicons name="beaker-outline" size={14} color="#64748B" />
                    <Text style={[styles.infoText, { color: activeColors.textSub || '#64748B' }]}>{item.application_type}</Text>
                </View>
                <View style={styles.infoBlock}>
                    <Ionicons name="calendar-outline" size={14} color="#64748B" />
                    <Text style={[styles.infoText, { color: activeColors.textSub || '#64748B' }]}>Agendado: {formatData(item.scheduled_date)}</Text>
                </View>
            </View>
        </Card>
    );

    return (
        <View style={[styles.container, { backgroundColor: activeColors.bg || '#F3F4F6' }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            
            <LinearGradient colors={isDark ? ['#111827', '#0F172A'] : ['#2563EB', '#1D4ED8']} style={styles.header}>
                <SafeAreaView>
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                            <Ionicons name="arrow-back" size={22} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>PRESCRIÇÕES (MANEJO)</Text>
                        <View style={{ width: 38 }} />
                    </View>
                    <Text style={styles.headerSub}>Recomendações Agronômicas</Text>
                </SafeAreaView>
            </LinearGradient>

            <FlatList
                data={receitas}
                renderItem={renderItem}
                keyExtractor={item => item.uuid}
                contentContainerStyle={receitas.length === 0 ? {flex: 1} : styles.list}
                ListEmptyComponent={
                    <AgroStateOverlay 
                        state="empty" 
                        message="Nenhuma prescrição gerada. Clique no botão + para criar uma nova recomendação para seus clientes."
                        icon="receipt-outline"
                    />
                }
            />

            <TouchableOpacity 
                style={[styles.fab, { backgroundColor: '#3B82F6' }]} 
                onPress={() => navigation.navigate('ReceitaForm')}
            >
                <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>

            <AgroOptionsModal
                visible={!!selectedItemActions}
                onClose={() => setSelectedItemActions(null)}
                title={selectedItemActions?.title || ''}
                subtitle="Ações da Receita"
                onEdit={() => {}} // Could be implemented later
                onDelete={() => handleDelete(selectedItemActions)}
                editLabel="Editar Prescrição (Desabilitado)"
                deleteLabel="Excluir Prescrição"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 50, paddingBottom: 25, paddingHorizontal: 25, borderBottomLeftRadius: 35, borderBottomRightRadius: 35 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerTitle: { fontSize: 13, fontWeight: '900', color: '#FFF', letterSpacing: 1.5 },
    headerSub: { fontSize: 16, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
    iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.15)', justifyContent: 'center', alignItems: 'center' },
    list: { padding: 20, paddingBottom: 100 },
    itemCard: { marginBottom: 15, padding: 15 },
    itemHeader: { flexDirection: 'row', alignItems: 'center' },
    iconContainer: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    itemName: { fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
    itemSub: { fontSize: 12 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 'auto' },
    statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    divider: { height: 1, marginVertical: 12 },
    itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    infoBlock: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    infoText: { fontSize: 11, fontWeight: '500' },
    fab: { position: 'absolute', bottom: 30, right: 30, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#3B82F6', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.4, shadowRadius: 8 }
});
