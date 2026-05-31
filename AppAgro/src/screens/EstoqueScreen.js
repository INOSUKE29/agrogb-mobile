import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ToastAndroid, Platform, FlatList } from "react-native";
import { addToQueue, getQueue, processSyncEngine } from "../services/syncQueue";

export default function EstoqueScreen({ navigation }) {
    const [insumo, setInsumo] = useState("");
    const [quantidade, setQuantidade] = useState("");
    const [recentList, setRecentList] = useState([]);

    useEffect(() => {
        refreshQueueList();
        
        // Simula o Background Sync processando a cada 5 segundos se a tela estiver aberta
        const interval = setInterval(() => {
            processSyncEngine((updatedQueue) => setRecentList(updatedQueue));
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const refreshQueueList = async () => {
        const q = await getQueue();
        setRecentList(q);
    };

    const handleSalvarOtimista = async () => {
        if (!insumo || !quantidade) {
            showToast("Preencha o insumo e a quantidade!");
            return;
        }

        const operation = {
            tipo: "CONSUMO_ESTOQUE",
            insumo: insumo,
            quantidade: parseFloat(quantidade)
        };

        // Salva na fila local instantaneamente
        await addToQueue(operation);
        
        // Limpa a tela imediatamente (Optimistic UI)
        setInsumo("");
        setQuantidade("");
        await refreshQueueList();
        
        showToast("✅ Salvo Offline! O Sincronizador já pegou.");
        
        // Gatilho imediato do Sync
        processSyncEngine((updatedQueue) => setRecentList(updatedQueue));
    };

    const showToast = (message) => {
        if (Platform.OS === 'android') {
            ToastAndroid.show(message, ToastAndroid.SHORT);
        } else {
            alert(message);
        }
    };

    const renderItem = ({ item }) => {
        let icon = "☁️"; // PENDING
        if (item.status === 'SYNCING') icon = "🔄";
        if (item.status === 'DONE') icon = "✅";

        return (
            <View style={styles.listItem}>
                <View>
                    <Text style={styles.itemTitle}>{item.payload.insumo}</Text>
                    <Text style={styles.itemSub}>{item.payload.quantidade} KG/L</Text>
                </View>
                <Text style={styles.itemIcon}>{icon}</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>⬅ Voltar</Text>
                </TouchableOpacity>
                <Text style={styles.syncStatus}>Sincronização Ativa</Text>
            </View>

            <Text style={styles.title}>Lançamento de Campo</Text>
            <Text style={styles.subtitle}>Apontamento Rápido Offline-First</Text>

            <View style={styles.card}>
                <TextInput
                    style={styles.input}
                    placeholder="Nome do Insumo (Ex: Adubo NPK)"
                    placeholderTextColor="#9CA3AF"
                    value={insumo}
                    onChangeText={setInsumo}
                />
                
                <TextInput
                    style={styles.input}
                    placeholder="Quantidade Aplicada (KG/L)"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={quantidade}
                    onChangeText={setQuantidade}
                />

                <TouchableOpacity style={styles.btnSalvar} onPress={handleSalvarOtimista}>
                    <Text style={styles.btnText}>SALVAR OPERAÇÃO</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.listHeader}>Lançamentos Recentes</Text>
            <FlatList
                data={recentList}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0f2e1f", padding: 20, paddingTop: 50 },
    header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30, alignItems: "center" },
    backBtn: { padding: 10, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 8 },
    backText: { color: "#FFF", fontWeight: "bold" },
    syncStatus: { color: "#4ADE80", fontWeight: "bold", fontSize: 14 },
    title: { fontSize: 26, fontWeight: "bold", color: "#FFF", marginBottom: 5 },
    subtitle: { fontSize: 14, color: "#A1A1AA", marginBottom: 20 },
    card: { backgroundColor: "rgba(255,255,255,0.08)", padding: 20, borderRadius: 15, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", marginBottom: 20 },
    input: { backgroundColor: "rgba(0,0,0,0.3)", color: "#FFF", padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
    btnSalvar: { backgroundColor: "#10B981", padding: 18, borderRadius: 10, alignItems: "center", marginTop: 5 },
    btnText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
    listHeader: { fontSize: 18, fontWeight: "bold", color: "#FFF", marginBottom: 10 },
    listItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)", padding: 15, borderRadius: 10, marginBottom: 10 },
    itemTitle: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
    itemSub: { color: "#A1A1AA", fontSize: 14 },
    itemIcon: { fontSize: 24 }
});
