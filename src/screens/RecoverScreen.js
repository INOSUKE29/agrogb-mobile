import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, StatusBar } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function RecoverScreen({ navigation }) {
    const [code, setCode] = useState("");

    const handleRecover = () => {
        Alert.alert("Funcionalidade em desenvolvimento", "Em breve você poderá recuperar sua senha usando o código gerado no cadastro.");
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0B3D2E" />
            <LinearGradient colors={['#0B3D2E', '#114B36']} style={StyleSheet.absoluteFill} />

            <View style={styles.content}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Recuperar Acesso</Text>
                    <Text style={styles.subtitle}>Digite o código de recuperação</Text>
                </View>

                <View style={styles.card}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>CÓDIGO DE RECUPERAÇÃO</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="key-outline" size={20} color="#7A8793" style={styles.inputIcon} />
                            <View style={styles.verticalDivider} />
                            <TextInput
                                style={styles.textInput}
                                value={code}
                                onChangeText={setCode}
                                placeholder="Ex: 123456"
                                placeholderTextColor="#A0A0A0"
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    <TouchableOpacity style={styles.button} onPress={handleRecover}>
                        <Text style={styles.buttonText}>VALIDAR CÓDIGO</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0B3D2E" },
    content: { flex: 1, justifyContent: 'center', padding: 24 },
    header: { marginBottom: 30, alignItems: 'center' },
    backButton: { position: 'absolute', left: 0, top: 0, padding: 8 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#FFF', marginTop: 10 },
    subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 5 },

    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 30,
        elevation: 4
    },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 11, fontWeight: 'bold', color: '#7A8793', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
        borderWidth: 1,
        borderColor: '#E5E9EC',
        borderRadius: 12,
        height: 56,
        paddingHorizontal: 16
    },
    inputIcon: { marginRight: 12 },
    verticalDivider: { width: 1, height: 24, backgroundColor: '#E5E9EC', marginRight: 12 },
    textInput: { flex: 1, fontSize: 16, color: '#2E2E2E', height: 50 },

    button: {
        backgroundColor: '#F59E0B',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10
    },
    buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 }
});
