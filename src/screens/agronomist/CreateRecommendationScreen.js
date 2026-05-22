import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../services/supabaseClient';
import { sendPushNotification } from '../../services/notificationService'; // NOVO: Serviço de Push

export default function CreateRecommendationScreen({ route, navigation }) {
    // Parâmetros passados pela tela de Clientes
    const { clientId, clientName } = route.params || {};

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    
    const [farms, setFarms] = useState([]);
    const [selectedFarmId, setSelectedFarmId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadFarms = async () => {
            if (!clientId) {
                Alert.alert('Erro', 'Nenhum cliente selecionado.');
                navigation.goBack();
                return;
            }
            try {
                const { data, error } = await supabase.from('farms').select('id, name').eq('owner_id', clientId);
                if (error) throw error;
                setFarms(data || []);
                if (data && data.length > 0) {
                    setSelectedFarmId(data[0].id); // Seleciona a primeira por padrão
                }
            } catch (err) {
                console.log(err);
            } finally {
                setLoading(false);
            }
        };
        loadFarms();
    }, [clientId]);

    const handleSave = async () => {
        if (!title || !date || !selectedFarmId) {
            Alert.alert('Atenção', 'Preencha o título, data e garanta que uma fazenda esteja selecionada.');
            return;
        }

        try {
            setSaving(true);
            const { data: sessionData } = await supabase.auth.getSession();
            const agronomistId = sessionData.session.user.id;

            // Converter data DD/MM/AAAA para YYYY-MM-DD
            const [day, month, year] = date.split('/');
            const formattedDate = `${year}-${month}-${day}`;

            const { error } = await supabase.from('recommendations').insert([{
                agronomist_id: agronomistId,
                client_id: clientId,
                farm_id: selectedFarmId,
                title: title,
                description: description,
                application_type: 'Pulverização', // fixo no MVP
                scheduled_date: formattedDate,
                status: 'PENDING'
            }]);

            if (error) throw error;

            Alert.alert('Sucesso', 'Recomendação enviada para o produtor!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);

            // NOVO: Disparo da Notificação Push
            try {
                // 1. Pega o nome do agrônomo atual
                const { data: agroProfile } = await supabase.from('profiles').select('full_name').eq('id', agronomistId).single();
                const agroName = agroProfile?.full_name || 'Seu Agrônomo';

                // 2. Busca o Push Token do Produtor
                const { data: clientProfile } = await supabase.from('profiles').select('expo_push_token').eq('id', clientId).single();
                
                if (clientProfile && clientProfile.expo_push_token) {
                    await sendPushNotification(
                        clientProfile.expo_push_token,
                        'Nova Receita Recebida! 📝',
                        `${agroName} enviou a recomendação: ${title}. Abra para ver os detalhes da aplicação.`
                    );
                }
            } catch (pushErr) {
                console.log('[CreateRecommendation] Falha não crítica ao enviar Push:', pushErr.message);
            }

        } catch (error) {
            Alert.alert('Erro', 'Falha ao salvar a recomendação: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="close" size={24} color="#1B5E20" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Nova Receita</Text>
                    <View style={{ width: 40 }} />
                </View>

                {loading ? (
                    <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
                        <ActivityIndicator size="large" color="#1B5E20" />
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                        <Text style={styles.sectionTitle}>Destinatário</Text>
                        
                        <View style={styles.selectorCard}>
                            <View style={styles.selectorRow}>
                                <Ionicons name="person" size={20} color="#64748B" />
                                <Text style={styles.selectorLabel}>Produtor:</Text>
                                <Text style={styles.selectorValue}>{clientName || 'Desconhecido'}</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.selectorRow}>
                                <MaterialCommunityIcons name="barn" size={20} color="#64748B" />
                                <Text style={styles.selectorLabel}>Fazenda:</Text>
                                {farms.length > 0 ? (
                                    <Text style={styles.selectorValue}>{farms.find(f => f.id === selectedFarmId)?.name}</Text>
                                ) : (
                                    <Text style={[styles.selectorValue, {color: '#EF4444'}]}>Nenhuma fazenda cadastrada</Text>
                                )}
                            </View>
                        </View>

                        <Text style={styles.sectionTitle}>Detalhes da Aplicação</Text>

                        <View style={styles.inputBox}>
                            <Text style={styles.label}>TÍTULO DA RECOMENDAÇÃO *</Text>
                            <View style={styles.inputContainer}>
                                <TextInput 
                                    style={styles.input} 
                                    placeholder="Ex: Adubação Foliar - Cálcio e Boro" 
                                    value={title} 
                                    onChangeText={setTitle} 
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputBox, { flex: 1, marginRight: 15 }]}>
                                <Text style={styles.label}>DATA PROGRAMADA *</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="calendar-outline" size={20} color="#1B5E20" style={styles.icon} />
                                    <TextInput 
                                        style={styles.input} 
                                        placeholder="DD/MM/AAAA" 
                                        value={date} 
                                        onChangeText={setDate} 
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>
                            <View style={[styles.inputBox, { flex: 1 }]}>
                                <Text style={styles.label}>TIPO</Text>
                                <View style={styles.inputContainer}>
                                    <TextInput style={styles.input} placeholder="Pulverização" editable={false} />
                                </View>
                            </View>
                        </View>

                        <View style={styles.inputBox}>
                            <Text style={styles.label}>PREPARO DA CALDA / OBSERVAÇÕES</Text>
                            <View style={[styles.inputContainer, { borderBottomWidth: 0, backgroundColor: '#F1F5F9', borderRadius: 12, padding: 10, marginTop: 5 }]}>
                                <TextInput 
                                    style={[styles.input, { height: 100, textAlignVertical: 'top' }]} 
                                    placeholder="Descreva os produtos, dosagens e orientações..." 
                                    multiline 
                                    value={description} 
                                    onChangeText={setDescription} 
                                />
                            </View>
                        </View>

                    </ScrollView>
                )}

                {!loading && (
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.btnAction} onPress={handleSave} activeOpacity={0.9} disabled={saving}>
                            <LinearGradient colors={['#1B5E20', '#166534']} style={styles.btnGrad}>
                                {saving ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <>
                                        <Text style={styles.btnText}>ENVIAR PARA O PRODUTOR</Text>
                                        <Ionicons name="send" size={18} color="#FFF" style={{ marginLeft: 10 }} />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, borderBottomWidth: 1, borderColor: '#ECEFF1' },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F8E9', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1B5E20' },
    content: { padding: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 15, marginTop: 10 },
    selectorCard: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 15, marginBottom: 30, borderWidth: 1, borderColor: '#E2E8F0' },
    selectorRow: { flexDirection: 'row', alignItems: 'center' },
    selectorLabel: { fontSize: 14, color: '#64748B', marginLeft: 10, width: 80 },
    selectorValue: { fontSize: 15, fontWeight: '700', color: '#1E293B', flex: 1 },
    divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 },
    inputBox: { marginBottom: 25 },
    row: { flexDirection: 'row' },
    label: { fontSize: 11, fontWeight: '900', color: '#90A4AE', marginBottom: 8, letterSpacing: 0.5 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1.5, borderColor: '#ECEFF1', paddingBottom: 5 },
    icon: { marginRight: 10 },
    input: { flex: 1, fontSize: 16, color: '#263238' },
    footer: { padding: 20, borderTopWidth: 1, borderColor: '#ECEFF1' },
    btnAction: { borderRadius: 15, overflow: 'hidden' },
    btnGrad: { height: 60, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    btnText: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 }
});
