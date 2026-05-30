import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, ActivityIndicator, Dimensions, ScrollView, StatusBar, SafeAreaView, Linking } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import * as Location from 'expo-location';
import { insertCliente, getClientes, deleteCliente, updateCliente } from '../database/database';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// Design System
import Card from '../components/common/Card';
import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';
import AgroOptionsModal from '../components/common/AgroOptionsModal';

const { width } = Dimensions.get('window');

export default function ClientesScreen({ navigation }) {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};
    
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [gpsLoading, setGpsLoading] = useState(false);
    
    // Form State
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [endereco, setEndereco] = useState('');
    const [cpf, setCpf] = useState('');
    const [observacao, setObservacao] = useState('');

    const [selectedItemActions, setSelectedItemActions] = useState(null);
    const [editingItem, setEditingItem] = useState(null);

    useEffect(() => { 
        loadData(); 
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getClientes();
            setItems(data);
        } catch (e) {
            console.error('Erro ao carregar clientes:', e);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEditingItem(null);
        setNome('');
        setTelefone('');
        setEndereco('');
        setCpf('');
        setObservacao('');
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setNome(item.nome);
        setTelefone(item.telefone || '');
        setEndereco(item.endereco || '');
        setCpf(item.cpf_cnpj || '');
        setObservacao(item.observacao || '');
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!nome.trim()) return Alert.alert('Atenção', 'O nome do cliente ou empresa é obrigatório.');
        try {
            const payload = {
                uuid: editingItem ? editingItem.uuid : uuidv4(),
                nome: nome.toUpperCase(),
                telefone,
                endereco: endereco.toUpperCase(),
                cpf_cnpj: cpf,
                observacao: observacao.toUpperCase()
            };

            if (editingItem) {
                await updateCliente(payload);
                Alert.alert('Sucesso', 'Parceiro comercial atualizado!');
            } else {
                await insertCliente(payload);
                Alert.alert('Sucesso', 'Parceiro comercial cadastrado!');
            }

            setModalVisible(false);
            resetForm();
            loadData();
        } catch (e) {
            Alert.alert('Erro', 'Falha ao salvar dados do cliente.');
        }
    };

    const handleDelete = (item) => {
        Alert.alert('Remover Parceiro', `Deseja realmente excluir ${item.nome} da sua lista de contatos?`, [
            { text: 'Cancelar', style: 'cancel' },
            { 
                text: 'Remover Agora', 
                style: 'destructive', 
                onPress: async () => { 
                    try {
                        await deleteCliente(item.id); 
                        loadData(); 
                    } catch (e) {
                        Alert.alert('Erro', 'Falha ao excluir.');
                    }
                } 
            }
        ]);
    };

    const handleWhatsApp = (phone) => {
        if (!phone) return;
        const clean = phone.replace(/\D/g, '');
        // Prepend Brazil country code 55 if not already present
        const fullPhone = clean.length <= 11 ? `55${clean}` : clean;
        const url = `https://wa.me/${fullPhone}`;
        Linking.openURL(url).catch(() => Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.'));
    };

    const handleCall = (phone) => {
        if (!phone) return;
        Linking.openURL(`tel:${phone}`).catch(() => Alert.alert('Erro', 'Não foi possível efetuar a ligação.'));
    };

    const captureGPS = async () => {
        setGpsLoading(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permissão Negada', 'Acesso à localização é necessário para capturar coordenadas.');
                setGpsLoading(false);
                return;
            }

            let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const coordsStr = `LAT: ${loc.coords.latitude.toFixed(6)}, LNG: ${loc.coords.longitude.toFixed(6)}`;
            setEndereco(coordsStr);
            Alert.alert('Coordenadas Capturadas', 'Localização GPS vinculada com sucesso ao endereço!');
        } catch (err) {
            Alert.alert('Erro', 'Não foi possível capturar a localização atual.');
        } finally {
            setGpsLoading(false);
        }
    };

    const isDark = theme?.theme_mode === 'dark';
    const textColor = activeColors.text || '#1E293B';
    const textMutedColor = activeColors.textMuted || '#64748B';
    const cardBg = activeColors.card || '#FFFFFF';
    const borderCol = activeColors.border || 'rgba(0,0,0,0.1)';

    return (
        <View style={[styles.container, { backgroundColor: activeColors.bg || '#F3F4F6' }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <LinearGradient colors={isDark ? ['#111827', '#0F172A'] : [activeColors.primary || '#10B981', activeColors.primaryDeep || '#064E3B']} style={styles.header}>
                <SafeAreaView>
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                            <Ionicons name="arrow-back" size={22} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>CLIENTES E PARCEIROS</Text>
                        <View style={{ width: 38 }} />
                    </View>
                    <Text style={styles.headerSub}>Gestão de Contatos & CRM Agrícola</Text>
                </SafeAreaView>
            </LinearGradient>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={activeColors.primary} /></View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={item => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <Card 
                            style={styles.itemCard} 
                            noPadding 
                            onPress={() => handleEdit(item)}
                            onLongPress={() => setSelectedItemActions(item)}
                        >
                            <View style={styles.premiumCardInner}>
                                <View style={styles.premiumCardBody}>
                                    <View style={[styles.avatarBox, { backgroundColor: (activeColors.primary || '#10B981') + '15' }]}>
                                        <Text style={[styles.avatarTxt, { color: activeColors.primary || '#10B981' }]}>{item.nome.charAt(0)}</Text>
                                    </View>
                                    <View style={styles.cardInfo}>
                                        <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={1}>{item.nome}</Text>
                                        
                                        {item.telefone ? (
                                            <View style={styles.cardInfoRow}>
                                                <Ionicons name="call-outline" size={12} color={textMutedColor} />
                                                <Text style={[styles.cardSub, { color: textMutedColor }]}>{item.telefone}</Text>
                                            </View>
                                        ) : null}

                                        {item.endereco ? (
                                            <View style={styles.cardInfoRow}>
                                                <Ionicons name="location-outline" size={12} color={textMutedColor} />
                                                <Text style={[styles.cardSub, { color: textMutedColor }]} numberOfLines={1}>{item.endereco}</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                </View>

                                {item.telefone ? (
                                    <View style={styles.premiumCardActions}>
                                        <TouchableOpacity 
                                            style={[styles.actionRoundBtn, { backgroundColor: '#10B98115' }]} 
                                            onPress={() => handleWhatsApp(item.telefone)}
                                        >
                                            <Ionicons name="logo-whatsapp" size={18} color="#10B981" />
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={[styles.actionRoundBtn, { backgroundColor: '#3B82F615' }]} 
                                            onPress={() => handleCall(item.telefone)}
                                        >
                                            <Ionicons name="call" size={18} color="#3B82F6" />
                                        </TouchableOpacity>
                                    </View>
                                ) : null}
                            </View>
                        </Card>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <MaterialCommunityIcons name="account-group-outline" size={60} color={textMutedColor} style={{ opacity: 0.5 }} />
                            <Text style={[styles.emptyTxt, { color: textMutedColor }]}>Nenhum parceiro comercial cadastrado.</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity style={[styles.fab, { backgroundColor: activeColors.primary || '#10B981' }]} onPress={() => { resetForm(); setModalVisible(true); }}>
                <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>

            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.overlay}>
                    <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: textColor }]}>{editingItem ? 'EDITAR PARCEIRO' : 'NOVO PARCEIRO'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close-circle" size={30} color={textMutedColor} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                            <Card style={{ marginBottom: 20 }}>
                                <AgroInput label="NOME COMPLETO / EMPRESA *" value={nome} onChangeText={t => setNome(t.toUpperCase())} autoCapitalize="characters" icon="person-outline" />
                                <AgroInput label="TELEFONE / WHATSAPP" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" icon="call-outline" />
                                <AgroInput label="CPF / CNPJ" value={cpf} onChangeText={setCpf} icon="card-outline" />
                                
                                <View style={{ position: 'relative' }}>
                                    <AgroInput label="ENDEREÇO / LOCALIZAÇÃO" value={endereco} onChangeText={t => setEndereco(t.toUpperCase())} autoCapitalize="characters" icon="location-outline" />
                                    <TouchableOpacity 
                                        style={styles.gpsCaptureBtn} 
                                        onPress={captureGPS}
                                        disabled={gpsLoading}
                                    >
                                        {gpsLoading ? (
                                            <ActivityIndicator size="small" color="#10B981" />
                                        ) : (
                                            <View style={styles.gpsBadge}>
                                                <Ionicons name="pin" size={12} color="#10B981" />
                                                <Text style={styles.gpsText}>GPS</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                </View>

                                <AgroInput label="OBSERVAÇÕES ADICIONAIS" value={observacao} onChangeText={setObservacao} multiline placeholder="Preferências do cliente, restrições, etc." icon="create-outline" />
                            </Card>

                            <AgroButton title={editingItem ? "SALVAR ALTERAÇÕES" : "CADASTRAR PARCEIRO"} onPress={handleSave} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* OPTIONS MODAL DE TOQUE LONGO */}
            <AgroOptionsModal
                visible={!!selectedItemActions}
                onClose={() => setSelectedItemActions(null)}
                title={selectedItemActions?.nome || ''}
                subtitle={selectedItemActions?.telefone || 'Sem Telefone'}
                onEdit={() => handleEdit(selectedItemActions)}
                onDelete={() => handleDelete(selectedItemActions)}
                editLabel="Editar Contato"
                deleteLabel="Excluir Contato"
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
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: { padding: 20, paddingBottom: 100 },
    itemCard: { marginBottom: 12 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyBox: { alignItems: 'center', marginTop: 80, opacity: 0.4 },
    emptyTxt: { marginTop: 15, fontWeight: '700', fontSize: 14 },
    fab: { position: 'absolute', bottom: 30, right: 25, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 8 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, height: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },

    // Premium UI Styles
    premiumCardInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15 },
    premiumCardBody: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatarBox: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    avatarTxt: { fontSize: 22, fontWeight: '900' },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
    cardInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
    cardSub: { fontSize: 12, fontWeight: '600' },
    premiumCardActions: { flexDirection: 'row', gap: 8, marginLeft: 10 },
    actionRoundBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    
    // GPS Style
    gpsCaptureBtn: { position: 'absolute', right: 12, top: 40, padding: 6, borderRadius: 8 },
    gpsBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#10B98115', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    gpsText: { fontSize: 9, fontWeight: '900', color: '#10B981' }
});
