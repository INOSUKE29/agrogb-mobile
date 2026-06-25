import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ValidateAgronomistScreen({ navigation }) {
    const [crea, setCrea] = useState('');
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);

    const handleValidate = () => {
        setLoading(true);
        
        if (crea.trim().length >= 6 || token.trim() === 'AGRO-PRO-2026') {
            setTimeout(() => {
                setLoading(false);
                Alert.alert('Sucesso', 'Credenciais validadas. Bem-vindo, Consultor!', [
                    { text: 'Avançar', onPress: () => navigation.navigate('PersonalData', { role: 'AGRONOMO' }) }
                ]);
            }, 800);
        } else {
            setLoading(false);
            Alert.alert('Acesso Negado', 'CREA inválido ou Token de Parceria não reconhecido. Por favor, verifique suas credenciais.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#0F3D2E', '#1B5E20', '#F8F9FA']}
                style={styles.atmosphere}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.iconCircle}>
                        <MaterialCommunityIcons name="shield-check" size={40} color="#1565C0" />
                    </View>
                    <Text style={styles.title}>Validação Profissional</Text>
                    <Text style={styles.subtitle}>
                        Para ativar os recursos avançados de Engenheiro Agrônomo, precisamos validar suas credenciais.
                    </Text>

                    <View style={styles.formContainer}>
                        <View style={styles.inputBox}>
                            <Text style={styles.label}>REGISTRO DO CREA</Text>
                            <View style={styles.inputContainer}>
                                <MaterialCommunityIcons name="card-account-details-outline" size={20} color="#1565C0" style={styles.icon} />
                                <TextInput 
                                    style={styles.input} 
                                    placeholder="Ex: 123456/SP" 
                                    autoCapitalize="characters" 
                                    value={crea} 
                                    onChangeText={setCrea} 
                                />
                            </View>
                        </View>
                        
                        <View style={styles.divider}>
                            <Text style={styles.dividerText}>OU</Text>
                        </View>

                        <View style={styles.inputBox}>
                            <Text style={styles.label}>TOKEN DE PARCERIA AGROGB</Text>
                            <View style={styles.inputContainer}>
                                <MaterialCommunityIcons name="key-variant" size={20} color="#1565C0" style={styles.icon} />
                                <TextInput 
                                    style={styles.input} 
                                    placeholder="Ex: AGRO-PRO-2026" 
                                    autoCapitalize="characters" 
                                    value={token} 
                                    onChangeText={setToken} 
                                />
                            </View>
                        </View>
                    </View>

                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.btnAction} onPress={handleValidate} activeOpacity={0.9} disabled={loading}>
                        <LinearGradient colors={['#1565C0', '#0D47A1']} style={styles.btnGrad}>
                            <Text style={styles.btnText}>{loading ? "VALIDANDO..." : "VALIDAR CREDENCIAIS"}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    atmosphere: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%' },
    header: { padding: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    content: { padding: 25, flexGrow: 1, alignItems: 'center' },
    iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    title: { fontSize: 26, fontWeight: '900', color: '#FFF', marginBottom: 10, textAlign: 'center' },
    subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.9)', marginBottom: 40, textAlign: 'center', lineHeight: 22 },
    formContainer: { width: '100%', backgroundColor: '#FFF', padding: 20, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
    inputBox: { width: '100%', marginBottom: 15 },
    label: { fontSize: 11, fontWeight: '900', color: '#90A4AE', marginBottom: 10, letterSpacing: 0.5 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1.5, borderColor: '#ECEFF1', paddingBottom: 5 },
    icon: { marginRight: 10 },
    input: { flex: 1, fontSize: 16, color: '#263238', height: 40, fontWeight: 'bold' },
    divider: { alignItems: 'center', marginVertical: 15 },
    dividerText: { fontSize: 12, fontWeight: 'bold', color: '#B0BEC5' },
    footer: { padding: 20, backgroundColor: '#F8F9FA' },
    btnAction: { borderRadius: 15, overflow: 'hidden' },
    btnGrad: { height: 60, justifyContent: 'center', alignItems: 'center' },
    btnText: { color: '#FFF', fontWeight: '900', fontSize: 15, letterSpacing: 1 }
});
