import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function FarmDataScreen({ route, navigation }) {
    const { userData } = route.params;
    
    const [farmName, setFarmName] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [areaTotal, setAreaTotal] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFinish = async () => {
        if (!farmName || !city || !state) {
            Alert.alert('Atenção', 'Preencha os campos obrigatórios da propriedade.');
            return;
        }

        setLoading(true);
        try {
            // TODO: Integrar com a AuthService para criar o User + Profile + Farm
            // const res = await AuthService.registerClientWithFarm(userData, { farmName, city, state, areaTotal });
            
            Alert.alert('Sucesso', 'Cadastro realizado com sucesso!', [
                { text: 'OK', onPress: () => navigation.navigate('LinkAgronomist', { userData }) }
            ]);
        } catch (error) {
            Alert.alert('Erro', 'Falha ao salvar a propriedade.');
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
                    <Text style={styles.headerTitle}>Sua Propriedade</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <Text style={styles.title}>Dados da Fazenda</Text>
                    <Text style={styles.subtitle}>Onde você produz? Esses dados são importantes para as recomendações técnicas.</Text>

                    <View style={styles.inputBox}>
                        <Text style={styles.label}>NOME DA PROPRIEDADE *</Text>
                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons name="barn" size={20} color="#1B5E20" style={styles.icon} />
                            <TextInput style={styles.input} placeholder="Ex: Fazenda Boa Vista" value={farmName} onChangeText={setFarmName} />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputBox, { flex: 2, marginRight: 15 }]}>
                            <Text style={styles.label}>CIDADE *</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="location-outline" size={20} color="#1B5E20" style={styles.icon} />
                                <TextInput style={styles.input} placeholder="Sua cidade" value={city} onChangeText={setCity} />
                            </View>
                        </View>
                        <View style={[styles.inputBox, { flex: 1 }]}>
                            <Text style={styles.label}>UF *</Text>
                            <View style={styles.inputContainer}>
                                <TextInput style={styles.input} placeholder="SP" maxLength={2} autoCapitalize="characters" value={state} onChangeText={setState} />
                            </View>
                        </View>
                    </View>

                    <View style={styles.inputBox}>
                        <Text style={styles.label}>ÁREA TOTAL (Hectares)</Text>
                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons name="texture-box" size={20} color="#1B5E20" style={styles.icon} />
                            <TextInput style={styles.input} placeholder="Ex: 350" keyboardType="numeric" value={areaTotal} onChangeText={setAreaTotal} />
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.btnAction} onPress={handleFinish} activeOpacity={0.9} disabled={loading}>
                        <LinearGradient colors={['#1B5E20', '#166534']} style={styles.btnGrad}>
                            <Text style={styles.btnText}>{loading ? "SALVANDO..." : "AVANÇAR"}</Text>
                            {!loading && <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 10 }} />}
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
    subtitle: { fontSize: 14, color: '#78909C', marginBottom: 30, lineHeight: 20 },
    inputBox: { marginBottom: 25 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    label: { fontSize: 11, fontWeight: '900', color: '#90A4AE', marginBottom: 10, letterSpacing: 0.5 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1.5, borderColor: '#ECEFF1', paddingBottom: 5 },
    icon: { marginRight: 10 },
    input: { flex: 1, fontSize: 16, color: '#263238', height: 40 },
    footer: { padding: 20, borderTopWidth: 1, borderColor: '#ECEFF1' },
    btnAction: { borderRadius: 15, overflow: 'hidden' },
    btnGrad: { height: 60, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    btnText: { color: '#FFF', fontWeight: '900', fontSize: 15, letterSpacing: 1 }
});
