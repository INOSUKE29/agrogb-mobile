import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertCultura, getCulturas, deleteCultura } from '../database/database';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// Design System
import Card from '../components/common/Card';
import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';

const { width } = Dimensions.get('window');

export default function CulturasScreen({ navigation }) {
    const { theme } = useTheme();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [nome, setNome] = useState('');
    const [observacao, setObservacao] = useState('');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try { 
            const data = await getCulturas(); 
            setItems(data); 
        } catch (e) { 
        } finally { 
            setLoading(false); 
        }
    };

    const handleSave = async () => {
        if (!nome.trim()) return Alert.alert('Atenção', 'O nome da cultura ou área é obrigatório.');
        try {
            await insertCultura({ uuid: uuidv4(), nome: nome.toUpperCase(), observacao: observacao.toUpperCase() });
            setModalVisible(false); 
            setNome(''); 
            setObservacao(''); 
            loadData();
            Alert.alert('Sucesso', 'Área/Cultura cadastrada com sucesso!');
        } catch (e) { 
            Alert.alert('Erro', 'Não foi possível salvar os dados.'); 
        }
    };

    const handleDelete = (item) => {
        Alert.alert('Excluir Área', `Deseja realmente remover ${item.nome} do sistema?`, [
            { text: 'Cancelar', style: 'cancel' }, 
            { 
                text: 'Sim, Excluir', 
                style: 'destructive', 
                onPress: async () => { 
                    await deleteCultura(item.id); 
                    loadData(); 
                } 
            }
        ]);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#F3F4F6' }]}>
            <LinearGradient colors={[theme?.colors?.primary || '#14B8A6', '#0F766E']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>CULTURAS E ÁREAS</Text>
                    <View style={{ width: 24 }} />
                </View>
                <Text style={styles.headerSub}>Mapeamento de Produção e Talhões</Text>
            </LinearGradient>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={theme?.colors?.primary} /></View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={item => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <Card style={styles.itemCard} noPadding onPress={() => Alert.alert('Info', item.nome)}>
                            <View style={styles.cardInner}>
                                <View style={[styles.iconBox, { backgroundColor: (theme?.colors?.primary || '#14B8A6') + '15' }]}>
                                    <MaterialCommunityIcons name="sprout" size={24} color={theme?.colors?.primary} />
                                </View>
                                <View style={styles.cardBody}>
                                    <Text style={styles.cardTitle}>{item.nome}</Text>
                                    <Text style={styles.cardSub} numberOfLines={1}>{item.observacao || 'SEM OBSERVAÇÕES TÉCNICAS'}</Text>
                                </View>
                                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
                                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        </Card>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <MaterialCommunityIcons name="map-marker-outline" size={60} color="#D1D5DB" />
                            <Text style={styles.emptyTxt}>Nenhuma área ou cultura registrada.</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity style={[styles.fab, { backgroundColor: theme?.colors?.primary || '#14B8A6' }]} onPress={() => setModalVisible(true)}>
                <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>

            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.overlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>NOVA ÁREA / CULTURA</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close-circle" size={30} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Card style={{ marginBottom: 20 }}>
                                <AgroInput 
                                    label="NOME DO LOCAL / ÁREA *" 
                                    value={nome} 
                                    onChangeText={t => setNome(t.toUpperCase())} 
                                    autoCapitalize="characters" 
                                    placeholder="EX: TALHÃO 01, ESTUFA SUL"
                                    icon="map-outline"
                                />
                                <AgroInput 
                                    label="OBSERVAÇÕES TÉCNICAS" 
                                    value={observacao} 
                                    onChangeText={t => setObservacao(t.toUpperCase())} 
                                    multiline 
                                    autoCapitalize="characters"
                                    icon="document-text-outline"
                                />
                            </Card>

                            <AgroButton title="SALVAR ATIVO DE PRODUÇÃO" onPress={handleSave} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 25, borderBottomLeftRadius: 35, borderBottomRightRadius: 35 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerTitle: { fontSize: 13, fontWeight: '900', color: '#FFF', letterSpacing: 1.5 },
    headerSub: { fontSize: 16, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
    list: { padding: 20, paddingBottom: 100 },
    itemCard: { marginBottom: 12 },
    cardInner: { flexDirection: 'row', alignItems: 'center', padding: 15 },
    iconBox: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    cardBody: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: '800', color: '#1F2937' },
    cardSub: { fontSize: 11, color: '#9CA3AF', fontWeight: 'bold', marginTop: 2, textTransform: 'uppercase' },
    deleteBtn: { padding: 10, backgroundColor: '#FEF2F2', borderRadius: 12 },
    fab: { position: 'absolute', bottom: 30, right: 25, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 8 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, height: '70%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 12, fontWeight: '900', color: '#111827', letterSpacing: 1.5 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyBox: { alignItems: 'center', marginTop: 80, opacity: 0.4 },
    emptyTxt: { color: '#6B7280', marginTop: 15, fontWeight: '700', fontSize: 14 }
});
