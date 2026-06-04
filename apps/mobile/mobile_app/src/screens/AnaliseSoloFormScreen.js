import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { executeQuery } from '../database/database';
import AgroInput from '../components/common/AgroInput';
import SafeBlurView from '../components/ui/SafeBlurView';
import uuid from 'react-native-uuid';

const RURAL_BG = require('../../assets/farm_bg.png');

export default function AnaliseSoloFormScreen({ navigation }) {
    const [talhoes, setTalhoes] = useState([]);
    const [selectedTalhao, setSelectedTalhao] = useState(null);

    const [dataAnalise, setDataAnalise] = useState(new Date().toISOString().split('T')[0]);
    const [laboratorio, setLaboratorio] = useState('');
    
    // Nutrientes
    const [ph, setPh] = useState('');
    const [ctc, setCtc] = useState('');
    const [v, setV] = useState('');
    const [mo, setMo] = useState('');
    const [p, setP] = useState('');
    const [k, setK] = useState('');
    const [ca, setCa] = useState('');
    const [mg, setMg] = useState('');

    useEffect(() => {
        loadTalhoes();
    }, []);

    const loadTalhoes = async () => {
        try {
            const result = await executeQuery(`SELECT id, nome FROM v2_talhoes ORDER BY nome ASC`);
            const loaded = [];
            for(let i=0; i<result.rows.length; i++) loaded.push(result.rows.item(i));
            setTalhoes(loaded);
        } catch (e) {
            console.error('Erro ao carregar talhões', e);
        }
    };

    const handleSave = async () => {
        if (!selectedTalhao || !dataAnalise) {
            Alert.alert("Atenção", "Talhão e Data da Análise são obrigatórios.");
            return;
        }

        try {
            const analiseId = uuid.v4();
            
            await executeQuery(`
                INSERT INTO v2_analise_solo 
                (id, talhao_id, data_analise, laboratorio, ph, ctc, saturacao_bases, materia_organica, fosforo, potassio, calcio, magnesio, sync_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
            `, [
                analiseId, selectedTalhao, dataAnalise, laboratorio,
                ph || null, ctc || null, v || null, mo || null, 
                p || null, k || null, ca || null, mg || null
            ]);

            Alert.alert("Sucesso", "Laudo salvo com sucesso!");
            navigation.goBack();
        } catch (error) {
            console.error('Erro ao salvar laudo', error);
            Alert.alert("Erro", "Falha ao salvar a análise de solo.");
        }
    };

    return (
        <ImageBackground source={RURAL_BG} style={styles.container} resizeMode="cover">
            <View style={styles.overlay} />
            
            <SafeBlurView intensity={30} tint="dark" style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Novo Laudo</Text>
            </SafeBlurView>

            <ScrollView contentContainerStyle={styles.scroll}>
                <SafeBlurView intensity={20} tint="dark" style={styles.formCard}>
                    
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Selecione o Talhão *</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                            {talhoes.map(t => (
                                <TouchableOpacity 
                                    key={t.id} 
                                    style={[styles.optionBtn, selectedTalhao === t.id && styles.optionBtnActive]}
                                    onPress={() => setSelectedTalhao(t.id)}
                                >
                                    <Text style={[styles.optionText, selectedTalhao === t.id && styles.optionTextActive]}>{t.nome}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <AgroInput
                        label="Data da Análise (YYYY-MM-DD) *"
                        icon="calendar-outline"
                        value={dataAnalise}
                        onChangeText={setDataAnalise}
                    />

                    <AgroInput
                        label="Laboratório"
                        icon="business-outline"
                        value={laboratorio}
                        onChangeText={setLaboratorio}
                        placeholder="Ex: SoloFértil Lab"
                    />

                    <Text style={styles.sectionTitle}>Atributos Químicos (Opcional)</Text>
                    
                    <View style={styles.row}>
                        <View style={styles.col}><AgroInput label="pH" value={ph} onChangeText={setPh} keyboardType="numeric" /></View>
                        <View style={styles.col}><AgroInput label="CTC" value={ctc} onChangeText={setCtc} keyboardType="numeric" /></View>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.col}><AgroInput label="V% (Saturação)" value={v} onChangeText={setV} keyboardType="numeric" /></View>
                        <View style={styles.col}><AgroInput label="M.O. (Mat. Orgânica)" value={mo} onChangeText={setMo} keyboardType="numeric" /></View>
                    </View>

                    <Text style={styles.sectionTitle}>Macronutrientes</Text>

                    <View style={styles.row}>
                        <View style={styles.col}><AgroInput label="P (Fósforo)" value={p} onChangeText={setP} keyboardType="numeric" /></View>
                        <View style={styles.col}><AgroInput label="K (Potássio)" value={k} onChangeText={setK} keyboardType="numeric" /></View>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.col}><AgroInput label="Ca (Cálcio)" value={ca} onChangeText={setCa} keyboardType="numeric" /></View>
                        <View style={styles.col}><AgroInput label="Mg (Magnésio)" value={mg} onChangeText={setMg} keyboardType="numeric" /></View>
                    </View>

                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                        <Ionicons name="checkmark-circle-outline" size={24} color="#FFF" />
                        <Text style={styles.saveBtnText}>Salvar Laudo</Text>
                    </TouchableOpacity>

                </SafeBlurView>
            </ScrollView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17, 24, 39, 0.85)' },
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20 },
    backBtn: { marginRight: 15 },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    scroll: { padding: 20, paddingBottom: 100 },
    formCard: { padding: 20, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    inputGroup: { marginBottom: 20 },
    label: { color: '#9CA3AF', fontSize: 12, marginBottom: 8, fontWeight: 'bold' },
    optionBtn: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginRight: 10 },
    optionBtnActive: { backgroundColor: 'rgba(59,130,246,0.2)', borderColor: '#3B82F6' },
    optionText: { color: '#9CA3AF', fontSize: 14, fontWeight: 'bold' },
    optionTextActive: { color: '#3B82F6' },
    sectionTitle: { color: '#3B82F6', fontSize: 14, fontWeight: 'bold', marginTop: 10, marginBottom: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(59,130,246,0.3)', paddingBottom: 5 },
    row: { flexDirection: 'row', gap: 10 },
    col: { flex: 1 },
    saveBtn: { backgroundColor: '#3B82F6', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15, borderRadius: 10, marginTop: 20 },
    saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, marginLeft: 10 }
});
