import React, { useCallback, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, StatusBar, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useFleet } from '../modules/farm/hooks/useFleet';
import { deleteMaquina } from '../database/database';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ConfirmModal from '../ui/ConfirmModal';

import { showToast } from '../ui/Toast';

export default function FrotaScreen() {
    const navigation = useNavigation();
    const { machines, loading, fetchMachines } = useFleet();
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    useFocusEffect(useCallback(() => { 
        fetchMachines(); 
    }, [fetchMachines]));
    
    // Inject mock data if DB is empty to showcase the premium UI
    const displayMachines = useMemo(() => {
        if (!machines || machines.length === 0) {
            return [
                { uuid: 'f1', nome: 'John Deere 8R 370', tipo: 'TRATOR', placa: 'QWE-1234', horimetro_atual: 450, intervalo_revisao: 500, local_atual: 'GalpÃ£o Principal', consumo: '18 L/h', isTest: true },
                { uuid: 'f2', nome: 'Scania R540 Graneleiro', tipo: 'CAMINHAO', placa: 'AGRO-001', horimetro_atual: 12000, intervalo_revisao: 10000, local_atual: 'Rota Fazenda-Porto', consumo: '2.5 km/L', isTest: true },
                { uuid: 'f3', nome: 'Hilux CD 4x4 SRV', tipo: 'CARRO', placa: 'GBR-9988', horimetro_atual: 2450, intervalo_revisao: 5000, local_atual: 'Sede Administrativa', consumo: '10 km/L', isTest: true }
            ];
        }
        return machines;
    }, [machines]);

    const handleDelete = useCallback((item) => {
        if(item.isTest) return showToast('Apenas demonstraÃ§Ã£o.');
        setItemToDelete(item);
        setConfirmVisible(true);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (itemToDelete) {
            try {
                await deleteMaquina(itemToDelete.uuid);
                setConfirmVisible(false);
                setItemToDelete(null);
                showToast('VeÃ­culo removido com sucesso!');
                fetchMachines();
            } catch (error) {
                showToast('Erro ao remover veÃ­culo.');
            }
        }
    }, [itemToDelete, fetchMachines]);

    const renderItem = useCallback(({ item }) => {
        const needsRevision = item.horimetro_atual >= item.intervalo_revisao && item.intervalo_revisao > 0;
        const progresso = item.intervalo_revisao > 0 ? Math.min(100, (item.horimetro_atual / item.intervalo_revisao) * 100) : 0;
        
        return (
            <TouchableOpacity onPress={() => item.isTest ? showToast('Apenas demonstraÃ§Ã£o') : navigation.navigate('MaquinaForm', { editItem: item })} activeOpacity={0.85}>
                <View style={[styles.card, needsRevision && styles.cardWarning]}>
                    <View style={styles.cardHeader}>
                        {/* Avatar do VeÃ­culo (Placeholder) */}
                        <View style={styles.avatarBox}>
                            <MaterialCommunityIcons 
                                name={item.tipo === 'TRATOR' ? 'tractor' : item.tipo === 'CAMINHAO' ? 'truck' : 'car-pickup'} 
                                size={32} color="#A7F3D0" 
                            />
                        </View>
                        
                        <View style={styles.headerInfo}>
                            <Text style={styles.nomeVeiculo}>{item.nome}</Text>
                            <Text style={styles.placaVeiculo}>{item.placa || 'S/ PLACA'} â€¢ {item.tipo}</Text>
                        </View>

                        {needsRevision && (
                            <View style={styles.badgeWarning}>
                                <Ionicons name="warning" size={12} color="#FCA5A5" />
                                <Text style={styles.badgeTextWarning}>REVISÃƒO</Text>
                            </View>
                        )}
                        {!needsRevision && (
                            <View style={styles.badgeOk}>
                                <Text style={styles.badgeTextOk}>ATIVO</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.infoRowGrid}>
                        <View style={styles.infoBlock}>
                            <MaterialCommunityIcons name="gas-station" size={14} color="#9CA3AF" style={{marginRight: 6}} />
                            <View>
                                <Text style={styles.infoLabel}>CONSUMO</Text>
                                <Text style={styles.infoValue}>{item.consumo || '0 L/h'}</Text>
                            </View>
                        </View>
                        <View style={styles.infoBlock}>
                            <Ionicons name="location" size={14} color="#9CA3AF" style={{marginRight: 6}} />
                            <View>
                                <Text style={styles.infoLabel}>LOCAL ATUAL</Text>
                                <Text style={styles.infoValue}>{item.local_atual || 'NÃ£o rastreado'}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Barra de Progresso ManutenÃ§Ã£o */}
                    <View style={styles.revisionBox}>
                        <View style={styles.revisionRow}>
                            <Text style={styles.revisionLabel}>DESGASTE / REVISÃƒO PREVISTA</Text>
                            <Text style={styles.revisionValues}>{item.horimetro_atual}h / {item.intervalo_revisao}h</Text>
                        </View>
                        <View style={styles.progressBg}>
                            <View style={[styles.progressFill, { width: `${progresso}%`, backgroundColor: needsRevision ? '#EF4444' : '#10B981' }]} />
                        </View>
                    </View>

                    {/* Lixeira pra exclusÃ£o */}
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                        <Ionicons name="trash-outline" size={18} color="rgba(239, 68, 68, 0.7)" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    }, [navigation, handleDelete]);

    return (
        <View style={styles.webContainer}>
            
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

            <View style={styles.mobileFrame}>
                <SafeAreaView style={{ flex: 1 }}>
                    {/* CUSTOM HEADER */}
                    {/* HUB TOP NAVIGATION */}
                    <View style={styles.hubTopRow}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={24} color="#D1FAE5" />
                        </TouchableOpacity>
                        <Text style={styles.hubHeaderText}>GESTÃƒO DE FROTA</Text>
                    </View>

                    {/* HUB DASHBOARD */}
                    <View intensity={20} style={styles.hubDashboardCard}>
                        <View style={styles.hubStatsRow}>
                            <View style={styles.hubStat}>
                                <Text style={styles.hubStatLabel}>TOTAL</Text>
                                <Text style={styles.hubStatValue}>{displayMachines.length}</Text>
                                <Text style={styles.hubStatSub}>VEÃCULOS</Text>
                            </View>
                            <View style={styles.hubDivider} />
                            <View style={styles.hubStat}>
                                <Text style={styles.hubStatLabel}>REVISÃƒO</Text>
                                <Text style={[styles.hubStatValue, { color: '#EF4444' }]}>
                                    {displayMachines.filter(m => m.horimetro_atual >= (m.intervalo_revisao || 0)).length}
                                </Text>
                                <Text style={styles.hubStatSub}>ALERTAS</Text>
                            </View>
                            <View style={styles.hubDivider} />
                            <View style={styles.hubStat}>
                                <Text style={styles.hubStatLabel}>ATIVOS</Text>
                                <Text style={[styles.hubStatValue, { color: '#10B981' }]}>
                                    {displayMachines.filter(m => m.horimetro_atual < (m.intervalo_revisao || 99999)).length}
                                </Text>
                                <Text style={styles.hubStatSub}>DISPONÃVEIS</Text>
                            </View>
                        </View>
                    </View>

                    {/* QUICK ACTIONS */}
                    <View style={styles.quickActionsRow}>
                        <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('MaquinaForm')}>
                            <LinearGradient colors={['#34D399', '#059669']} style={styles.qaGradient}>
                                <Ionicons name="add-circle" size={20} color="#064E3B" />
                                <Text style={styles.qaText}>NOVO VEÃCULO</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.quickActionBtnSecondary}>
                            <Ionicons name="construct-outline" size={18} color="#A7F3D0" />
                            <Text style={styles.qaTextSecondary}>MANUTENÃ‡ÃƒO</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.headerSection}>
                        <View style={styles.indicator} />
                        <Text style={styles.sectionTitle}>LISTAGEM DA FROTA OPERACIONAL</Text>
                    </View>

                    {/* MAIN LIST */}
                    {loading ? (
                        <ActivityIndicator size="large" color="#34D399" style={{ marginTop: 50 }} />
                    ) : (
                        <FlatList
                            data={displayMachines}
                            renderItem={renderItem}
                            keyExtractor={item => item.uuid}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <Ionicons name="bus-outline" size={64} color="rgba(255,255,255,0.1)" />
                                    <Text style={styles.emptyText}>Nenhum veÃ­culo registrado.</Text>
                                </View>
                            }
                        />
                    )}

                    <ConfirmModal
                        visible={confirmVisible}
                        title="EXCLUIR VEÃCULO"
                        message={`Deseja realmente remover ${itemToDelete?.nome} da frota?`}
                        onConfirm={confirmDelete}
                        onCancel={() => setConfirmVisible(false)}
                    />
                </SafeAreaView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    webContainer: { flex: 1, alignItems: 'center', backgroundColor: '#000' },
    mobileFrame: { flex: 1, width: '100%', maxWidth: 480, position: 'relative' },
    
    hubTopRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 20, marginBottom: 15, gap: 15 },
    backBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    hubHeaderText: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
    
    hubDashboardCard: { marginHorizontal: 20, borderRadius: 24, paddingVertical: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
    hubStatsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    hubStat: { alignItems: 'center', flex: 1 },
    hubStatLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 4 },
    hubStatValue: { color: '#FFF', fontSize: 20, fontWeight: '900' },
    hubStatSub: { color: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: '800', marginTop: 2 },
    hubDivider: { width: 1, height: 35, backgroundColor: 'rgba(255,255,255,0.08)' },

    quickActionsRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 15, gap: 12 },
    quickActionBtn: { flex: 1.2, height: 50, borderRadius: 15, overflow: 'hidden' },
    qaGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    qaText: { color: '#064E3B', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
    quickActionBtnSecondary: { flex: 1, height: 50, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    qaTextSecondary: { color: '#A7F3D0', fontSize: 11, fontWeight: '900' },

    headerSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 25, marginBottom: 15 },
    indicator: { width: 4, height: 16, borderRadius: 2, backgroundColor: '#34D399', marginRight: 10 },
    sectionTitle: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '900', letterSpacing: 1 },

    listContent: { paddingHorizontal: 20, paddingBottom: 100 },
    
    card: { backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: 20, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
    cardWarning: { borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.05)' },
    
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    avatarBox: { width: 55, height: 55, borderRadius: 15, backgroundColor: 'rgba(52, 211, 153, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.3)' },
    headerInfo: { flex: 1 },
    nomeVeiculo: { color: '#FFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
    placaVeiculo: { color: '#9CA3AF', fontSize: 13, marginTop: 4, fontWeight: '500' },
    
    badgeWarning: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
    badgeTextWarning: { color: '#FCA5A5', fontSize: 10, fontWeight: 'bold', marginLeft: 4, letterSpacing: 0.5 },
    badgeOk: { backgroundColor: 'rgba(52, 211, 153, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.2)' },
    badgeTextOk: { color: '#6EE7B7', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },

    infoRowGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, backgroundColor: 'rgba(0,0,0,0.2)', padding: 15, borderRadius: 12 },
    infoBlock: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    infoLabel: { fontSize: 9, color: '#6B7280', fontWeight: 'bold', letterSpacing: 1, marginBottom: 2 },
    infoValue: { fontSize: 13, color: '#E5E7EB', fontWeight: '600' },

    revisionBox: { marginTop: 5 },
    revisionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    revisionLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: 'bold', letterSpacing: 0.5 },
    revisionValues: { fontSize: 12, color: '#D1FAE5', fontWeight: 'bold' },
    progressBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },

    deleteBtn: { position: 'absolute', top: 20, right: 20, opacity: 0.8 },
    
    emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { color: '#9CA3AF', marginTop: 15, fontSize: 15 }
});

