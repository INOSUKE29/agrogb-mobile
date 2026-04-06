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
                { uuid: 'f1', nome: 'John Deere 8R 370', tipo: 'TRATOR', placa: 'QWE-1234', horimetro_atual: 450, intervalo_revisao: 500, local_atual: 'Galpão Principal', consumo: '18 L/h', isTest: true },
                { uuid: 'f2', nome: 'Scania R540 Graneleiro', tipo: 'CAMINHAO', placa: 'AGRO-001', horimetro_atual: 12000, intervalo_revisao: 10000, local_atual: 'Rota Fazenda-Porto', consumo: '2.5 km/L', isTest: true },
                { uuid: 'f3', nome: 'Hilux CD 4x4 SRV', tipo: 'CARRO', placa: 'GBR-9988', horimetro_atual: 2450, intervalo_revisao: 5000, local_atual: 'Sede Administrativa', consumo: '10 km/L', isTest: true }
            ];
        }
        return machines;
    }, [machines]);

    const handleDelete = useCallback((item) => {
        if(item.isTest) return showToast('Apenas demonstração.');
        setItemToDelete(item);
        setConfirmVisible(true);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (itemToDelete) {
            try {
                await deleteMaquina(itemToDelete.uuid);
                setConfirmVisible(false);
                setItemToDelete(null);
                showToast('Veículo removido com sucesso!');
                fetchMachines();
            } catch (error) {
                showToast('Erro ao remover veículo.');
            }
        }
    }, [itemToDelete, fetchMachines]);

    const renderItem = useCallback(({ item }) => {
        const needsRevision = item.horimetro_atual >= item.intervalo_revisao && item.intervalo_revisao > 0;
        const progresso = item.intervalo_revisao > 0 ? Math.min(100, (item.horimetro_atual / item.intervalo_revisao) * 100) : 0;
        
        return (
            <TouchableOpacity onPress={() => item.isTest ? showToast('Apenas demonstração') : navigation.navigate('MaquinaForm', { editItem: item })} activeOpacity={0.85}>
                <View style={[styles.card, needsRevision && styles.cardWarning]}>
                    <View style={styles.cardHeader}>
                        {/* Avatar do Veículo (Placeholder) */}
                        <View style={styles.avatarBox}>
                            <MaterialCommunityIcons 
                                name={item.tipo === 'TRATOR' ? 'tractor' : item.tipo === 'CAMINHAO' ? 'truck' : 'car-pickup'} 
                                size={32} color="#A7F3D0" 
                            />
                        </View>
                        
                        <View style={styles.headerInfo}>
                            <Text style={styles.nomeVeiculo}>{item.nome}</Text>
                            <Text style={styles.placaVeiculo}>{item.placa || 'S/ PLACA'} • {item.tipo}</Text>
                        </View>

                        {needsRevision && (
                            <View style={styles.badgeWarning}>
                                <Ionicons name="warning" size={12} color="#FCA5A5" />
                                <Text style={styles.badgeTextWarning}>REVISÃO</Text>
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
                                <Text style={styles.infoValue}>{item.local_atual || 'Não rastreado'}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Barra de Progresso Manutenção */}
                    <View style={styles.revisionBox}>
                        <View style={styles.revisionRow}>
                            <Text style={styles.revisionLabel}>DESGASTE / REVISÃO PREVISTA</Text>
                            <Text style={styles.revisionValues}>{item.horimetro_atual}h / {item.intervalo_revisao}h</Text>
                        </View>
                        <View style={styles.progressBg}>
                            <View style={[styles.progressFill, { width: `${progresso}%`, backgroundColor: needsRevision ? '#EF4444' : '#10B981' }]} />
                        </View>
                    </View>

                    {/* Lixeira pra exclusão */}
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                        <Ionicons name="trash-outline" size={18} color="rgba(239, 68, 68, 0.7)" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    }, [navigation, handleDelete]);

    return (
        <View style={styles.webContainer}>
            <LinearGradient colors={['#1c2921', '#111b15', '#09100c']} style={StyleSheet.absoluteFill} />
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

            <View style={styles.mobileFrame}>
                <SafeAreaView style={{ flex: 1 }}>
                    {/* CUSTOM HEADER */}
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={24} color="#D1FAE5" />
                        </TouchableOpacity>
                        <View style={{alignItems: 'center'}}>
                            <Text style={styles.headerTitle}>Gestão de Frota</Text>
                            <Text style={styles.headerSub}>Máquinas e Caminhões</Text>
                        </View>
                        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('MaquinaForm')}>
                            <Ionicons name="add" size={24} color="#064E3B" />
                        </TouchableOpacity>
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
                                    <Text style={styles.emptyText}>Nenhum veículo registrado.</Text>
                                </View>
                            }
                        />
                    )}

                    <ConfirmModal
                        visible={confirmVisible}
                        title="EXCLUIR VEÍCULO"
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
    
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 20, paddingBottom: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
    headerSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
    addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#34D399', justifyContent: 'center', alignItems: 'center' },

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
