import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, FlatList, TouchableOpacity, 
    Alert, TextInput, Modal, ActivityIndicator, SafeAreaView, StatusBar, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { v4 as uuidv4 } from 'uuid';
import { getCategoriasDespesa, insertCategoriaDespesa, deleteCategoriaDespesa } from '../database/database';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function CategoriasDespesaScreen({ navigation }) {
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [nome, setNome] = useState('');
    const [tipo, setTipo] = useState('FIXA');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getCategoriasDespesa();
            setCategorias(data);
        } catch {
            // log error
            Alert.alert('Erro', 'Não foi possível carregar as categorias.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!nome) {
            Alert.alert('Atenção', 'Informe o nome da categoria.');
            return;
        }

        try {
            const id = uuidv4();
            await insertCategoriaDespesa({ id, nome: nome.trim(), tipo });
            setModalVisible(false);
            setNome('');
            setTipo('FIXA');
            loadData();
        } catch {
            Alert.alert('Erro', 'Não foi possível registrar a categoria.');
        }
    };

    const handleDelete = (id, nomeCategoria) => {
        Alert.alert(
            'Excluir Categoria',
            `Deseja realmente apagar "${nomeCategoria}"?\nIsso não apagará os custos já lançados.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteCategoriaDespesa(id);
                            loadData();
                        } catch {
                            Alert.alert('Erro', 'Falha ao remover categoria.');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#040914', '#0A1220']} style={StyleSheet.absoluteFill} />
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <SafeAreaView style={{ flex: 1, width: '100%', maxWidth: 500, alignSelf: 'center' }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={28} color="#FFF" />
                    </TouchableOpacity>
                    <View style={{flex: 1, marginLeft: 10}}>
                        <Text style={styles.headerTitle}>Categorias de Custo</Text>
                        <Text style={styles.headerSub}>Gerencie o balanço das contas</Text>
                    </View>
                    <TouchableOpacity style={styles.topAddBtn} onPress={() => setModalVisible(true)}>
                        <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.topAddGradient}>
                            <Ionicons name="add" size={24} color="#FFF" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#10B981" />
                    </View>
                ) : (
                    <FlatList
                        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                        data={categorias}
                        keyExtractor={i => i.id.toString()}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="wallet-outline" size={60} color="rgba(255,255,255,0.1)" />
                                <Text style={styles.emptyText}>Opções financeiras em branco.</Text>
                                <Text style={styles.emptySubText}>Comece mapeando os custos da operação.</Text>
                            </View>
                        }
                        renderItem={({ item }) => (
                            <View style={styles.glassCard}>
                                <View style={{ flex: 1 }}>
                                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                        <Ionicons 
                                            name={item.tipo === 'FIXA' ? 'business-outline' : 'trending-up-outline'} 
                                            size={18} 
                                            color={item.tipo === 'FIXA' ? '#F59E0B' : '#E879F9'} 
                                            style={{marginRight: 8}}
                                        />
                                        <Text style={styles.cTitle} numberOfLines={1}>{item.nome}</Text>
                                    </View>
                                    
                                    <View style={{flexDirection: 'row', marginTop: 10}}>
                                        <View style={[styles.badge, item.tipo === 'FIXA' ? styles.badgeYellow : styles.badgePurple]}>
                                            <Text style={styles.badgeText}>{item.tipo === 'FIXA' ? 'CUSTO FIXO' : 'VARIAVEL'}</Text>
                                        </View>
                                    </View>
                                </View>
                                
                                <TouchableOpacity onPress={() => handleDelete(item.id, item.nome)} style={styles.delBtn}>
                                    <Ionicons name="trash-outline" size={20} color="#F87171" />
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                )}

            </SafeAreaView>

            {/* Modal Glassmorphism */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalBg}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setModalVisible(false)} />
                    
                    <BlurView intensity={50} tint="dark" style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>NOVO GRUPO</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close-circle" size={28} color="rgba(255,255,255,0.4)" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>TÍTULO DO GASTO DA OPERAÇÃO</Text>
                            <View style={styles.inputPill}>
                                <TextInput
                                    style={styles.input}
                                    placeholderTextColor="#64748B"
                                    placeholder="Ex: QUÍMICOS, COMBUSTÍVEL, TRATOR"
                                    value={nome}
                                    onChangeText={t => setNome(t.toUpperCase())}
                                    autoCapitalize="characters"
                                    autoFocus
                                />
                            </View>
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>COMPORTAMENTO DA CONTA</Text>
                            <View style={styles.radioGroup}>
                                <TouchableOpacity
                                    style={[styles.radioBtn, tipo === 'FIXA' && styles.radioBtnActiveA]}
                                    onPress={() => setTipo('FIXA')}>
                                    <Ionicons name="server-outline" size={16} color={tipo === 'FIXA' ? '#F59E0B' : '#64748B'} />
                                    <Text style={[styles.radioText, tipo === 'FIXA' && { color: '#F59E0B' }]}> FIXO</Text>
                                    {tipo === 'FIXA' && <View style={[styles.glowDot, { backgroundColor: '#F59E0B'} ]} />}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.radioBtn, tipo === 'VARIÁVEL' && styles.radioBtnActiveB]}
                                    onPress={() => setTipo('VARIÁVEL')}>
                                    <Ionicons name="stats-chart-outline" size={16} color={tipo === 'VARIÁVEL' ? '#E879F9' : '#64748B'} />
                                    <Text style={[styles.radioText, tipo === 'VARIÁVEL' && { color: '#E879F9' }]}> VARIAVEL</Text>
                                    {tipo === 'VARIÁVEL' && <View style={[styles.glowDot, { backgroundColor: '#E879F9'} ]} />}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity activeOpacity={0.8} style={styles.saveBtnOuter} onPress={handleSave}>
                            <LinearGradient colors={['#10B981', '#059669']} style={styles.saveBtnGradient}>
                                <Ionicons name="md-checkmark-circle" size={20} color="#FFF" />
                                <Text style={styles.saveBtnText}>ADICIONAR CATEGORIA</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </BlurView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#040914' },
    
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 30, paddingBottom: 20, zIndex: 10 },
    backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    headerTitle: { color: '#FFF', fontSize: 22, fontWeight: '800' },
    headerSub: { color: '#34D399', fontSize: 13, fontWeight: '600', marginTop: 2 },
    
    topAddBtn: { shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    topAddGradient: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },

    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
    emptyText: { color: '#F8FAFC', fontSize: 16, fontWeight: '800', marginTop: 20 },
    emptySubText: { color: '#64748B', fontSize: 14, marginTop: 5 },

    glassCard: { flexDirection: 'row', backgroundColor: 'rgba(15, 23, 42, 0.5)', borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center' },
    cTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
    
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
    badgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 1, color: '#FFF' },
    badgeYellow: { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.4)' },
    badgePurple: { backgroundColor: 'rgba(232, 121, 249, 0.1)', borderColor: 'rgba(232, 121, 249, 0.4)' },
    
    delBtn: { width: 44, height: 44, backgroundColor: 'rgba(248,113,113,0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)', justifyContent: 'center', alignItems: 'center' },

    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center' },
    modalSheet: { width: '90%', maxWidth: 500, alignSelf: 'center', borderRadius: 32, padding: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(11, 17, 32, 0.95)', overflow: 'hidden' },
    modalHandle: { display: 'none' },
    
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
    
    field: { marginBottom: 25 },
    label: { color: '#64748B', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10 },
    
    inputPill: { backgroundColor: '#0B151F', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, height: 56, justifyContent: 'center' },
    input: { flex: 1, color: '#FFF', fontSize: 16, fontWeight: '700', paddingHorizontal: 16, ...Platform.select({ web: { outlineStyle: 'none' } }) },

    radioGroup: { flexDirection: 'row', gap: 12 },
    radioBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 16, height: 56, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' },
    radioBtnActiveA: { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.4)' },
    radioBtnActiveB: { backgroundColor: 'rgba(232, 121, 249, 0.1)', borderColor: 'rgba(232, 121, 249, 0.4)' },
    radioText: { fontSize: 13, fontWeight: '800', letterSpacing: 1, color: '#64748B' },
    glowDot: { position: 'absolute', bottom: -1, width: 20, height: 3, borderRadius: 2, shadowOpacity: 1, shadowRadius: 5 },

    saveBtnOuter: { marginTop: 10, shadowColor: '#10B981', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 12, marginBottom: 10 },
    saveBtnGradient: { flexDirection: 'row', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#34D399' },
    saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 1 }
});
