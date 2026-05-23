import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../services/supabaseClient';

export default function LinkAgronomistScreen({ route, navigation }) {
    const { userData } = route.params;
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFinish = async () => {
        setLoading(true);
        try {
            if (inviteCode.trim() !== '') {
                const cleanCode = inviteCode.trim().toUpperCase();
                
                // 1. Buscar o agrônomo pelo código
                const { data: codeData, error: codeErr } = await supabase
                    .from('agronomist_codes')
                    .select('agronomist_id')
                    .eq('invite_code', cleanCode)
                    .single();

                if (codeErr || !codeData) {
                    Alert.alert('Erro', 'Código de convite inválido ou não encontrado.');
                    setLoading(false);
                    return;
                }

                // 2. Pegar o ID do usuário logado (Cliente que acabou de se registrar)
                const { data: sessionData } = await supabase.auth.getSession();
                const userId = sessionData?.session?.user?.id || userData?.id;

                if (!userId) {
                    Alert.alert('Erro', 'Sessão não encontrada. Tente fazer login novamente.');
                    setLoading(false);
                    return;
                }

                // 3. Criar o vínculo pendente
                const { error: linkErr } = await supabase.from('agronomist_client_links').insert([{
                    agronomist_id: codeData.agronomist_id,
                    client_id: userId,
                    status: 'PENDING'
                }]);

                if (linkErr) throw linkErr;
            }

            Alert.alert('Parabéns!', 'Sua conta foi configurada com sucesso no AgroGB.', [
                { text: 'Ir para o App', onPress: () => navigation.navigate('SessionRouter') }
            ]);

        } catch (error) {
            Alert.alert('Erro', 'Falha ao processar a solicitação: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#1B5E20" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Vínculo Técnico</Text>
                    <TouchableOpacity onPress={handleFinish}>
                        <Text style={styles.skipBtn}>PULAR</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.iconCircle}>
                        <MaterialCommunityIcons name="account-search-outline" size={40} color="#1565C0" />
                    </View>
                    <Text style={styles.title}>Possui um Agrônomo?</Text>
                    <Text style={styles.subtitle}>
                        Se você foi convidado por um engenheiro agrônomo parceiro, digite o <Text style={{fontWeight: 'bold', color: '#1565C0'}}>Código de Convite</Text> abaixo para vincular sua conta automaticamente.
                    </Text>

                    <View style={styles.inputBox}>
                        <Text style={styles.label}>CÓDIGO DO AGRÔNOMO (OPCIONAL)</Text>
                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons name="key-variant" size={20} color="#1565C0" style={styles.icon} />
                            <TextInput 
                                style={styles.input} 
                                placeholder="Ex: AGR-12345" 
                                autoCapitalize="characters" 
                                value={inviteCode} 
                                onChangeText={setInviteCode} 
                            />
                        </View>
                    </View>

                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={20} color="#78909C" />
                        <Text style={styles.infoText}>Você pode pular esta etapa e usar o AgroGB de forma 100% independente, ou vincular um agrônomo depois pelas configurações.</Text>
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.btnAction} onPress={handleFinish} activeOpacity={0.9} disabled={loading}>
                        <LinearGradient colors={['#1565C0', '#0D47A1']} style={styles.btnGrad}>
                            <Text style={styles.btnText}>{inviteCode.length > 0 ? "VINCULAR E CONCLUIR" : "CONCLUIR CADASTRO"}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1565C0' },
    skipBtn: { fontSize: 14, fontWeight: 'bold', color: '#90A4AE' },
    content: { padding: 25, flexGrow: 1, alignItems: 'center' },
    iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 26, fontWeight: '900', color: '#263238', marginBottom: 10, textAlign: 'center' },
    subtitle: { fontSize: 15, color: '#78909C', marginBottom: 40, textAlign: 'center', lineHeight: 22 },
    inputBox: { width: '100%', marginBottom: 25 },
    label: { fontSize: 11, fontWeight: '900', color: '#90A4AE', marginBottom: 10, letterSpacing: 0.5 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1.5, borderColor: '#ECEFF1', paddingBottom: 5 },
    icon: { marginRight: 10 },
    input: { flex: 1, fontSize: 16, color: '#263238', height: 40, textAlign: 'center', fontWeight: 'bold', letterSpacing: 2 },
    infoBox: { flexDirection: 'row', backgroundColor: '#F5F7F8', padding: 15, borderRadius: 10, width: '100%', marginTop: 20 },
    infoText: { flex: 1, fontSize: 12, color: '#78909C', marginLeft: 10, lineHeight: 18 },
    footer: { padding: 20, borderTopWidth: 1, borderColor: '#ECEFF1' },
    btnAction: { borderRadius: 15, overflow: 'hidden' },
    btnGrad: { height: 60, justifyContent: 'center', alignItems: 'center' },
    btnText: { color: '#FFF', fontWeight: '900', fontSize: 15, letterSpacing: 1 }
});
