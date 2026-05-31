import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";

export default function RecoverScreen({ navigation }) {
    const [code, setCode] = useState("");

    const handleRecover = () => {
        Alert.alert("Simulação", "Em um app real, aqui validaríamos o código e redefiniríamos a senha.");
    };

    return (
        <View style={styles.container}>
            <View style={styles.glassCard}>
                <Text style={styles.title}>Recuperar</Text>
                <Text style={styles.subtitle}>Digite o código de recuperação</Text>

                <TextInput
                    placeholder="Código (ex: 123456)"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    style={styles.input}
                    value={code}
                    onChangeText={setCode}
                    keyboardType="numeric"
                />

                <TouchableOpacity style={styles.button} onPress={handleRecover}>
                    <Text style={styles.buttonText}>VALIDAR</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.linkText}>Cancelar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0f2e1f", justifyContent: "center", padding: 20 },
    glassCard: {
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: 25,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
    },
    title: { fontSize: 28, fontWeight: "bold", color: "#FFF", textAlign: "center", marginBottom: 5 },
    subtitle: { fontSize: 14, color: "#A1A1AA", textAlign: "center", marginBottom: 30 },
    input: {
        backgroundColor: "rgba(0,0,0,0.2)",
        borderRadius: 12,
        padding: 15,
        color: "#FFF",
        marginBottom: 15,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)"
    },
    button: { backgroundColor: "#F59E0B", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 10, marginBottom: 20 },
    buttonText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
    linkText: { color: "#D1D5DB", textAlign: "center", fontSize: 14 }
});
