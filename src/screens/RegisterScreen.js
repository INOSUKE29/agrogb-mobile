import React, { useState } from 'react';
import { Text, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import { register } from '../services/authService';

export default function RegisterScreen() {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = async () => {
        if (!nome || !email || !password) return Alert.alert('Ops', 'Preencha tudo.');
        
        try {
            const res = await register(nome, email, password);
            if (res.success) {
                Alert.alert('Sucesso', 'Sua conta foi criada! Faça login para começar.', [
                    { text: 'OK', onPress: () => navigation.navigate('Login') }
                ]);
            } else {
                Alert.alert('Erro no Cadastro', res.message);
            }
        } catch {
            Alert.alert('Erro', 'Falha na conexão com o servidor.');
        }
    };

    return (
        <AppContainer>
            <ScreenHeader title="CRIAR CONTA" onBack={() => navigation.goBack()} />
            <ScrollView contentContainerStyle={styles.content}>
                <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]} placeholder="NOME COMPLETO" value={nome} onChangeText={setNome} />
                <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]} placeholder="E-MAIL" value={email} onChangeText={setEmail} autoCapitalize="none" />
                <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]} placeholder="SENHA" value={password} onChangeText={setPassword} secureTextEntry />
                <TouchableOpacity style={styles.btn} onPress={handleRegister}><Text style={{ color: '#FFF', fontWeight: 'bold' }}>CADASTRAR</Text></TouchableOpacity>
            </ScrollView>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    content: { padding: 30 },
    input: { height: 50, borderWidth: 1, borderRadius: 10, paddingHorizontal: 15, marginBottom: 15 },
    btn: { height: 50, backgroundColor: '#15803D', borderRadius: 10, justifyContent: 'center', alignItems: 'center' }
});
