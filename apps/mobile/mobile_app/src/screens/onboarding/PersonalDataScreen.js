import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function PersonalDataScreen({ route, navigation }) {
    const { role } = route.params || { role: 'CLIENTE' }; // 'CLIENTE' ou 'AGRONOMO'
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    const handleNext = () => {
        if (!name || !email || !password) {
            alert('Por favor, preencha os campos obrigatórios.');
            return;
        }

        const userData = { role, name, email, phone, password };

        if (role === 'CLIENTE') {
            // Cliente precisa cadastrar a propriedade no próximo passo
            navigation.navigate('FarmData', { userData });
        } else {
            // Agrônomo pode finalizar o cadastro direto ou gerar o código
            navigation.navigate('LinkAgronomist', { userData }); // Vamos reusar ou criar uma tela final
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#1B5E20" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Dados Pessoais</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <Text style={styles.title}>Crie sua conta</Text>
                    <Text style={styles.subtitle}>
                        Você está se cadastrando como <Text style={{fontWeight: 'bold', color: '#1B5E20'}}>{role}</Text>.
                    </Text>

                    <View style={styles.inputBox}>
                        <Text style={styles.label}>NOME COMPLETO *</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color="#1B5E20" style={styles.icon} />
                            <TextInput style={styles.input} placeholder="Seu nome" value={name} onChangeText={setName} />
                        </View>
                    </View>

                    <View style={styles.inputBox}>
                        <Text style={styles.label}>EMAIL *</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color="#1B5E20" style={styles.icon} />
                            <TextInput style={styles.input} placeholder="seu@email.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
                        </View>
                    </View>

                    <View style={styles.inputBox}>
                        <Text style={styles.label}>TELEFONE (WHATSAPP)</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="call-outline" size={20} color="#1B5E20" style={styles.icon} />
                            <TextInput style={styles.input} placeholder="(00) 00000-0000" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
                        </View>
                    </View>

                    <View style={styles.inputBox}>
                        <Text style={styles.label}>SENHA *</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#1B5E20" style={styles.icon} />
                            <TextInput style={styles.input} placeholder="••••••••" secureTextEntry value={password} onChangeText={setPassword} />
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.btnAction} onPress={handleNext} activeOpacity={0.9}>
                        <LinearGradient colors={['#1B5E20', '#166534']} style={styles.btnGrad}>
                            <Text style={styles.btnText}>CONTINUAR</Text>
                            <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 10 }} />
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
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F8E9', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1B5E20' },
    content: { padding: 25, flexGrow: 1 },
    title: { fontSize: 28, fontWeight: '900', color: '#263238', marginBottom: 5 },
    subtitle: { fontSize: 14, color: '#78909C', marginBottom: 30 },
    inputBox: { marginBottom: 25 },
    label: { fontSize: 11, fontWeight: '900', color: '#90A4AE', marginBottom: 10, letterSpacing: 0.5 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1.5, borderColor: '#ECEFF1', paddingBottom: 5 },
    icon: { marginRight: 10 },
    input: { flex: 1, fontSize: 16, color: '#263238', height: 40 },
    footer: { padding: 20, borderTopWidth: 1, borderColor: '#ECEFF1' },
    btnAction: { borderRadius: 15, overflow: 'hidden' },
    btnGrad: { height: 60, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    btnText: { color: '#FFF', fontWeight: '900', fontSize: 15, letterSpacing: 1 }
});
