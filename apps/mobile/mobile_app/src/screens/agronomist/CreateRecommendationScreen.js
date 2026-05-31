import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../services/supabaseClient';
import { sendPushNotification } from '../../services/notificationService';

export default function CreateRecommendationScreen({ route, navigation }) {
    const { clientId, clientName, recommendationId } = route.params || {};

    const [farm, setFarm] = useState('');
    const [farmId, setFarmId] = useState(null);
    const [talhao, setTalhao] = useState('');
    const [cultura, setCultura] = useState('');
    const [instructions, setInstructions] = useState('');
    
    // Dynamic products array: { name, dosage }
    const [products, setProducts] = useState([{ id: Date.now().toString(), name: '', dosage: '' }]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchFarm = async () => {
            if (!clientId) {
                Alert.alert('Erro', 'Cliente não selecionado.');
                navigation.goBack();
                return;
            }
            try {
                const { data, error } = await supabase.from('farms').select('id, name').eq('owner_id', clientId).limit(1).single();
                if (data) {
                    setFarm(data.name);
                    setFarmId(data.id);
                } else {
                    setFarm(clientName || 'Fazenda Exemplo');
                }
            } catch (err) {
                setFarm(clientName || 'Fazenda Exemplo');
            }
        };
        fetchFarm();
    }, [clientId]);

    const addProduct = () => {
        setProducts([...products, { id: Date.now().toString(), name: '', dosage: '' }]);
    };

    const removeProduct = (id) => {
        setProducts(products.filter(p => p.id !== id));
    };

    const updateProduct = (id, field, value) => {
        setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleSave = async (isDraft = false) => {
        if (!talhao || !cultura || products.length === 0 || !farmId) {
            Alert.alert('Atenção', 'Preencha Talhão, Cultura e adicione ao menos um produto. O cliente precisa ter uma fazenda cadastrada.');
            return;
        }

        try {
            setSaving(true);
            const { data: sessionData } = await supabase.auth.getSession();
            const agronomistId = sessionData?.session?.user?.id;
            
            if (!agronomistId) throw new Error("Usuário não autenticado.");

            const { error } = await supabase.from('recommendations').insert([{
                agronomist_id: agronomistId,
                client_id: clientId,
                farm_id: farmId,
                title: `Recomendação ${cultura} - ${talhao}`,
                description: JSON.stringify({ products, instructions }),
                status: isDraft ? 'DRAFT' : 'PENDING'
            }]);

            if (error) throw error;

            Alert.alert('Sucesso', isDraft ? 'Rascunho salvo!' : 'Recomendação enviada para o produtor!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);

            if (!isDraft) {
                try {
                    const { data: clientProfile } = await supabase.from('profiles').select('expo_push_token').eq('id', clientId).single();
                    if (clientProfile?.expo_push_token) {
                        await sendPushNotification(clientProfile.expo_push_token, 'Nova Receita Recebida! 📝', `Nova recomendação para ${cultura} no ${talhao}.`);
                    }
                } catch (e) { }
            }
        } catch (error) {
            Alert.alert('Erro', 'Falha ao salvar a recomendação.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#64748B" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Nova Recomendação</Text>
                    <View style={{ width: 40 }} />
                </View>

                {loading ? (
                    <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
                        <ActivityIndicator size="large" color="#10B981" />
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                        
                        <View style={styles.infoCard}>
                            <View style={styles.infoRow}>
                                <View style={styles.iconCircle}><Ionicons name="person" size={16} color="#10B981" /></View>
                                <View>
                                    <Text style={styles.infoLabel}>Cliente</Text>
                                    <Text style={styles.infoValue}>{farm}</Text>
                                </View>
                            </View>
                            <View style={styles.divider} />
                            
                            <View style={styles.inputRow}>
                                <MaterialCommunityIcons name="map-marker-path" size={20} color="#64748B" style={styles.inputIcon} />
                                <TextInput style={styles.inputGhost} placeholder="Talhão (Ex: Talhão 12)" placeholderTextColor="#64748B" value={talhao} onChangeText={setTalhao} />
                            </View>
                            <View style={styles.divider} />
                            
                            <View style={styles.inputRow}>
                                <Ionicons name="leaf-outline" size={20} color="#64748B" style={styles.inputIcon} />
                                <TextInput style={styles.inputGhost} placeholder="Cultura (Ex: Soja)" placeholderTextColor="#64748B" value={cultura} onChangeText={setCultura} />
                            </View>
                        </View>

                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>Produtos</Text>
                            <TouchableOpacity onPress={addProduct}>
                                <Text style={styles.addBtnText}>Adicionar produto</Text>
                            </TouchableOpacity>
                        </View>

                        {products.map((prod, index) => (
                            <View key={prod.id} style={styles.productCard}>
                                <View style={{ flex: 1 }}>
                                    <TextInput 
                                        style={styles.productInput} 
                                        placeholder="Nome do Produto (Ex: Roundup)" 
                                        placeholderTextColor="#64748B"
                                        value={prod.name}
                                        onChangeText={(val) => updateProduct(prod.id, 'name', val)}
                                    />
                                    <TextInput 
                                        style={styles.dosageInput} 
                                        placeholder="Dosagem (Ex: 2,0 L/ha)" 
                                        placeholderTextColor="#64748B"
                                        value={prod.dosage}
                                        onChangeText={(val) => updateProduct(prod.id, 'dosage', val)}
                                    />
                                </View>
                                {products.length > 1 && (
                                    <TouchableOpacity onPress={() => removeProduct(prod.id)} style={styles.trashBtn}>
                                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}

                        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Instruções</Text>
                        <TextInput 
                            style={styles.textArea} 
                            placeholder="Aplicar em pré-emergência..." 
                            placeholderTextColor="#64748B"
                            multiline 
                            value={instructions}
                            onChangeText={setInstructions}
                        />

                    </ScrollView>
                )}

                {!loading && (
                    <View style={styles.footerRow}>
                        <TouchableOpacity style={[styles.btnAction, styles.btnDraft]} onPress={() => handleSave(true)} disabled={saving}>
                            <Text style={styles.btnDraftText}>Salvar rascunho</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btnAction, styles.btnSend]} onPress={() => handleSave(false)} disabled={saving}>
                            {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnSendText}>Enviar ao cliente</Text>}
                        </TouchableOpacity>
                    </View>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B121E' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, backgroundColor: '#111827', borderBottomWidth: 1, borderBottomColor: '#1F2937' },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#1F2937', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#F8FAFC' },
    
    content: { padding: 20 },
    
    infoCard: { backgroundColor: '#111827', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#1F2937', marginBottom: 30 },
    infoRow: { flexDirection: 'row', alignItems: 'center' },
    iconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    infoLabel: { color: '#64748B', fontSize: 11, fontWeight: '700' },
    infoValue: { color: '#F8FAFC', fontSize: 15, fontWeight: '800' },
    divider: { height: 1, backgroundColor: '#1F2937', marginVertical: 15 },
    
    inputRow: { flexDirection: 'row', alignItems: 'center' },
    inputIcon: { marginRight: 15 },
    inputGhost: { flex: 1, color: '#F8FAFC', fontSize: 15, fontWeight: '600' },
    
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#F8FAFC' },
    addBtnText: { color: '#10B981', fontSize: 13, fontWeight: '700' },
    
    productCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#1F2937', marginBottom: 10 },
    productInput: { color: '#F8FAFC', fontSize: 15, fontWeight: '700', marginBottom: 5 },
    dosageInput: { color: '#94A3B8', fontSize: 13, fontWeight: '500' },
    trashBtn: { padding: 10 },
    
    textArea: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#1F2937', borderRadius: 12, padding: 15, color: '#F8FAFC', height: 120, textAlignVertical: 'top', marginTop: 10 },
    
    footerRow: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderColor: '#1F2937', gap: 10 },
    btnAction: { flex: 1, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    btnDraft: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#334155' },
    btnDraftText: { color: '#94A3B8', fontWeight: '700' },
    btnSend: { backgroundColor: '#10B981' },
    btnSendText: { color: '#FFF', fontWeight: '800' }
});
