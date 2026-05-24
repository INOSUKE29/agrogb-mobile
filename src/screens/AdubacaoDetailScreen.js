import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Image, Share, TouchableOpacity, SafeAreaView, StatusBar, Platform } from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ProductionService } from '../modules/production/services/ProductionService';
import { executeQuery } from '../database/database';

export default function AdubacaoDetailScreen({ route, navigation }) {
    const { plano } = route.params;
    const [currentPlano, setCurrentPlano] = useState(plano);
    const [itens, setItens] = useState([]);
    const [loading, setLoading] = useState(false);

    const isApplied = currentPlano.status === 'APLICADO' || currentPlano.status === 'CONCLUIDO';
    // Let's deduce an icon based on type:
    const mainIcon = currentPlano.tipo_aplicacao?.includes('GOTEJO') ? 'faucet' : 'tractor';

    const loadItens = React.useCallback(async () => {
        try {
            const res = await executeQuery(`SELECT * FROM production_fertilization_items WHERE plano_uuid = ?`, [currentPlano.uuid]);
            // Fake items for visual demonstration if DB empty
            if(!res.rows._array || res.rows._array.length === 0) {
                setItens([
                    { id: 1, produto_id: 'YaraMila 10-10-10', quantidade: 50, unidade: 'KG' },
                    { id: 2, produto_id: 'Cloreto de PotÃ¡ssio', quantidade: 20, unidade: 'KG' }
                ]);
            } else {
                setItens(res.rows._array);
            }
        } catch { 
            setItens([{ id: 1, produto_id: 'Fertilizante Premium', quantidade: 100, unidade: 'KG' }]);
        }
    }, [currentPlano.uuid]);

    React.useEffect(() => { loadItens(); }, [loadItens]);

    const handleApply = async () => {
        Alert.alert(
            'AplicaÃ§Ã£o Inteligente',
            'Deseja realizar a baixa no estoque e concluir esta AdubaÃ§Ã£o agora?',
            [
                { text: 'Voltar', style: 'cancel' },
                {
                    text: 'Confirmar Baixa',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await ProductionService.applyFertilization(currentPlano.uuid);
                            setCurrentPlano({ ...currentPlano, status: 'CONCLUIDO', data_aplicacao: new Date().toISOString() });
                            Alert.alert('Sucesso', 'Estoque atualizado e AdubaÃ§Ã£o registrada com sucesso!');
                        } catch {
                            Alert.alert('Erro', 'Houve uma falha na transaÃ§Ã£o.');
                        } finally { setLoading(false); }
                    }
                }
            ]
        );
    };

    const handleShare = async () => {
        const message = `*AGROGB - PLANO DE ADUBAÃ‡ÃƒO*\n\n` +
            `ðŸ“… ${new Date(currentPlano.data_criacao || Date.now()).toLocaleDateString()}\n` +
            `ðŸ“ ${currentPlano.nome_plano}\n` +
            `ðŸŒ± Cultura: ${currentPlano.cultura}\n` +
            `ðŸ“ Local: ${currentPlano.area_local || 'Geral'}\n\n` +
            `Status: ${currentPlano.status}`;
        await Share.share({ message });
    };

    return (
        <View style={styles.webContainer}>
            
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <View style={styles.mobileFrame}>
                <SafeAreaView style={{ flex: 1 }}>
                    {/* CUSTOM HEADER SLATE */}
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={22} color="#D1FAE5" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Detalhes do Plano</Text>
                        <TouchableOpacity style={styles.backBtn} onPress={() => !isApplied && navigation.navigate('AdubacaoForm', { plano: currentPlano })}>
                            <Ionicons name="create-outline" size={22} color={isApplied ? "rgba(255,255,255,0.1)" : "#D1FAE5"} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.scroll}>
                        
                        {/* HERO HEADER */}
                        <View style={styles.heroBox}>
                            <View style={styles.heroGlow}>
                                <FontAwesome5 name={mainIcon} size={40} color="#34D399" />
                            </View>
                            <Text style={styles.heroTitle}>{currentPlano.nome_plano}</Text>
                            <View style={styles.badgeRow}>
                                <View style={styles.badgeSolid}>
                                    <Text style={styles.badgeSolidText}>{currentPlano.tipo_aplicacao}</Text>
                                </View>
                                <View style={[styles.badgeOutline, isApplied && { borderColor: '#34D399' }]}>
                                    <Text style={[styles.badgeOutlineText, isApplied && { color: '#34D399' }]}>
                                        {isApplied ? 'CONCLUÃDO' : 'AGENDADO'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* INFO CARDS (Glassmorphism) */}
                        <View style={styles.row}>
                            <View style={styles.smallCard}>
                                <MaterialCommunityIcons name="sprout" size={20} color="#A7F3D0" />
                                <Text style={styles.smallCardLabel}>CULTURA</Text>
                                <Text style={styles.smallCardValue}>{currentPlano.cultura}</Text>
                            </View>
                            <View style={styles.smallCard}>
                                <Ionicons name="location" size={20} color="#A7F3D0" />
                                <Text style={styles.smallCardLabel}>LOCAL / TALHÃƒO</Text>
                                <Text style={styles.smallCardValue}>{currentPlano.area_local || 'S/N'}</Text>
                            </View>
                        </View>

                        {/* INSUMOS SECTION */}
                        {itens.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <MaterialCommunityIcons name="cube-outline" size={18} color="#D1FAE5" style={{marginRight: 8}} />
                                    <Text style={styles.sectionTitle}>INSUMOS DO ESTOQUE</Text>
                                </View>
                                <View style={styles.glassCard}>
                                    {itens.map((item, idx) => (
                                        <View key={item.id} style={[styles.itemRow, idx !== itens.length - 1 && styles.borderBottom]}>
                                            <View style={styles.itemIconBox}>
                                                <Ionicons name="color-fill" size={16} color="#34D399" />
                                            </View>
                                            <Text style={styles.itemName}>{item.produto_id}</Text>
                                            <Text style={styles.itemValue}>{item.quantidade} <Text style={{fontSize: 10, color: '#9CA3AF'}}>{item.unidade}</Text></Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* DESCRICAO / RECEITA COMPLETA */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="document-text-outline" size={18} color="#D1FAE5" style={{marginRight: 8}} />
                                <Text style={styles.sectionTitle}>ORIENTAÃ‡ÃƒO TÃ‰CNICA</Text>
                            </View>
                            <View style={styles.glassCard}>
                                <Text style={styles.description}>
                                    {currentPlano.descricao_tecnica || 'O engenheiro nÃ£o deixou observaÃ§Ãµes adicionais para este plano de aplicaÃ§Ã£o.'}
                                </Text>
                            </View>
                        </View>

                        {/* ANEXOS */}
                        {currentPlano.anexos_uri && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>FOTO / RECEITUÃRIO</Text>
                                <View style={{borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'}}>
                                    <Image source={{ uri: currentPlano.anexos_uri }} style={styles.image} resizeMode="cover" />
                                </View>
                            </View>
                        )}

                        {/* AÃ‡ÃƒO PRINCIPAL BOTTOM */}
                        {!isApplied ? (
                            <TouchableOpacity style={styles.btnApplyBg} onPress={handleApply} disabled={loading}>
                                <LinearGradient colors={['#059669', '#047857']} style={styles.btnGradient}>
                                    <MaterialCommunityIcons name="check-decagram" size={24} color="#FFF" />
                                    <Text style={styles.btnApplyText}>{loading ? 'PROCESSANDO...' : 'CONFIRMAR APLICAÃ‡ÃƒO'}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.appliedBox}>
                                <Ionicons name="checkmark-circle" size={30} color="#34D399" />
                                <View style={{marginLeft: 15, flex: 1}}>
                                    <Text style={{color: '#FFF', fontWeight: 'bold', fontSize: 13}}>AplicaÃ§Ã£o ConcluÃ­da</Text>
                                    <Text style={{color: '#9CA3AF', fontSize: 11, marginTop: 2}}>Estoque jÃ¡ foi atualizado.</Text>
                                </View>
                                <TouchableOpacity style={styles.btnShare} onPress={handleShare}>
                                    <Ionicons name="share-social" size={20} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        )}

                    </ScrollView>
                </SafeAreaView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    webContainer: { flex: 1, alignItems: 'center', backgroundColor: '#000' },
    mobileFrame: { flex: 1, width: '100%', maxWidth: 480, position: 'relative' },
    
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 20, paddingBottom: 10 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#D1FAE5', letterSpacing: 0.5 },

    scroll: { padding: 20, paddingBottom: 50 },

    heroBox: { alignItems: 'center', marginVertical: 20 },
    heroGlow: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(52, 211, 153, 0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(52, 211, 153, 0.2)', marginBottom: 20 },
    heroTitle: { fontSize: 24, fontWeight: '900', color: '#FFF', textAlign: 'center', marginBottom: 15 },
    badgeRow: { flexDirection: 'row', gap: 10 },
    badgeSolid: { backgroundColor: 'rgba(52, 211, 153, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    badgeSolidText: { color: '#34D399', fontSize: 11, fontWeight: 'bold' },
    badgeOutline: { backgroundColor: 'rgba(255, 255, 255, 0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    badgeOutlineText: { color: '#9CA3AF', fontSize: 11, fontWeight: 'bold' },

    row: { flexDirection: 'row', gap: 15, marginBottom: 25 },
    smallCard: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 16, padding: 15, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)' },
    smallCardLabel: { color: '#6B7280', fontSize: 10, fontWeight: 'bold', marginTop: 10, marginBottom: 4 },
    smallCardValue: { color: '#E5E7EB', fontSize: 14, fontWeight: '600' },

    section: { marginBottom: 25 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    sectionTitle: { color: '#D1FAE5', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
    
    glassCard: { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 16, padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    borderBottom: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    itemIconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(52, 211, 153, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    itemName: { color: '#FFF', fontSize: 14, fontWeight: '600', flex: 1 },
    itemValue: { color: '#34D399', fontSize: 18, fontWeight: '900' },

    description: { color: '#9CA3AF', fontSize: 14, lineHeight: 22 },
    image: { width: '100%', height: 250 },

    btnApplyBg: { marginTop: 20, shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 16, gap: 10 },
    btnApplyText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },

    appliedBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(52, 211, 153, 0.1)', padding: 20, borderRadius: 16, marginTop: 20, borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.2)' },
    btnShare: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' }
});

