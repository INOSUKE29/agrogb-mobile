import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { logout, checkSession } from "../services/authService";
import { getPendingCount } from "../services/syncQueue";
import { useFocusEffect } from '@react-navigation/native';

export default function HomeScreen({ navigation }) {
    const [user, setUser] = useState("Usuário");
    const [pendencias, setPendencias] = useState(0);

    useEffect(() => {
        loadUser();
        const timer = setTimeout(() => {
            handleLogout();
            Alert.alert("Sessão Expirada", "Você foi desconectado por inatividade.");
        }, 5 * 60 * 1000);
        return () => clearTimeout(timer);
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            refreshPendencias();
        }, [])
    );

    const refreshPendencias = async () => {
        const count = await getPendingCount();
        setPendencias(count);
    };

    const loadUser = async () => {
        const session = await checkSession();
        if (session) setUser(session.user);
    };

    const handleLogout = async () => {
        await logout();
        navigation.replace("Login");
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.welcome}>Olá, {user}!</Text>
                <View style={styles.bellContainer}>
                    <Text style={styles.bellIcon}>🔔</Text>
                    {pendencias > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{pendencias}</Text>
                        </View>
                    )}
                </View>
            </View>
            
            <Text style={styles.info}>Você está logado no módulo seguro.</Text>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Status do Sistema</Text>
                <Text style={styles.cardText}>✅ Criptografia Ativa</Text>
                <Text style={styles.cardText}>✅ Armazenamento Seguro</Text>
                <Text style={styles.cardText}>✅ Modo Offline</Text>
            </View>

            <TouchableOpacity 
                style={[styles.logoutBtn, { backgroundColor: '#10B981', marginBottom: 15 }]} 
                onPress={() => navigation.navigate("Estoque")}
            >
                <Text style={styles.logoutText}>🚜 LANÇAMENTO DE ESTOQUE</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutText}>SAIR AGORA</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0f2e1f", padding: 30, paddingTop: 60 },
    welcome: { fontSize: 28, fontWeight: "bold", color: "#FFF", marginBottom: 10 },
    info: { fontSize: 16, color: "#ccc", marginBottom: 40 },
    card: {
        backgroundColor: "rgba(255,255,255,0.1)",
        padding: 20,
        borderRadius: 15,
        marginBottom: 40
    },
    cardTitle: { fontSize: 18, color: "#4ADE80", marginBottom: 15, fontWeight: "bold" },
    cardText: { fontSize: 16, color: "#FFF", marginBottom: 8 },
    logoutBtn: {
        backgroundColor: "#EF4444",
        padding: 15,
        borderRadius: 10,
        alignItems: "center"
    },
    logoutText: { color: "#FFF", fontWeight: "bold" },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    bellContainer: { position: 'relative', padding: 5 },
    bellIcon: { fontSize: 24 },
    badge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#EF4444', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
    badgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold', paddingHorizontal: 4 }
});
