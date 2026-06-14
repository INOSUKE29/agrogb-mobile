import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { executeQuery } from '../database/database';
import AgroInput from '../components/common/AgroInput';
import SafeBlurView from '../components/ui/SafeBlurView';
import { useAuth } from '../context/AuthContext';
import { v4 as uuidv4 } from 'uuid';

const RURAL_BG = require('../../assets/farm_bg.png');

export default function TaskFormScreen({ navigation }) {
    const { user, role } = useAuth();
    
    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [tipo, setTipo] = useState('OPERACAO_CAMPO'); // VISITA_TECNICA, OPERACAO_CAMPO, MANUTENCAO, OUTROS
    const [prioridade, setPrioridade] = useState('MEDIA'); // BAIXA, MEDIA, ALTA, URGENTE
    const [dataAgendada, setDataAgendada] = useState(''); // YYYY-MM-DD
    
    // Selectors
    const [fazendas, setFazendas] = useState([]);
    const [selectedFazenda, setSelectedFazenda] = useState(null);

    useEffect(() => {
        loadFazendas();
    }, []);

    const loadFazendas = async () => {
        try {
            const result = await executeQuery(`SELECT id, nome FROM v2_fazendas ORDER BY nome ASC`);
            const loaded = [];
            for(let i=0; i<result.rows.length; i++) loaded.push(result.rows.item(i));
            setFazendas(loaded);
        } catch (e) {
            console.error('Erro ao carregar fazendas', e);
        }
    };

    const handleSave = async () => {
        if (!titulo) {
            Alert.alert("Erro", "O título da tarefa é obrigatório.");
            return;
        }

        try {
            const taskId = uuidv4();
            const criadorId = user?.id || null;
            
            await executeQuery(`
                INSERT INTO v2_tarefas (id, titulo, descricao, tipo, status, prioridade, data_agendada, fazenda_id, criador_id, sync_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
            `, [taskId, titulo, descricao, tipo, 'PENDENTE', prioridade, dataAgendada, selectedFazenda, criadorId]);

            Alert.alert("Sucesso", "Tarefa criada com sucesso!");
            navigation.goBack();
        } catch (error) {
            console.error('Erro ao salvar tarefa', error);
            Alert.alert("Erro", "Ocorreu um erro ao salvar a tarefa.");
        }
    };

    const renderOptionSelector = (label, options, selectedValue, onSelect) => (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.optionsRow}>
                {options.map(opt => (
                    <TouchableOpacity 
                        key={opt.value} 
                        style={[styles.optionBtn, selectedValue === opt.value && styles.optionBtnActive]}
                        onPress={() => onSelect(opt.value)}
                    >
                        <Text style={[styles.optionText, selectedValue === opt.value && styles.optionTextActive]}>{opt.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    return (
        <ImageBackground source={RURAL_BG} style={styles.container} resizeMode="cover">
            <View style={styles.overlay} />
            
            <SafeBlurView intensity={30} tint="dark" style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Nova Tarefa</Text>
            </SafeBlurView>

            <ScrollView contentContainerStyle={styles.scroll}>
                <SafeBlurView intensity={20} tint="dark" style={styles.formCard}>
                    
                    <AgroInput
                        label="Título da Tarefa *"
                        icon="create-outline"
                        value={titulo}
                        onChangeText={setTitulo}
                        placeholder="Ex: Pulverizar Soja"
                    />

                    <AgroInput
                        label="Descrição"
                        icon="document-text-outline"
                        value={descricao}
                        onChangeText={setDescricao}
                        placeholder="Instruções adicionais..."
                    />

                    <AgroInput
                        label="Data Agendada (YYYY-MM-DD)"
                        icon="calendar-outline"
                        value={dataAgendada}
                        onChangeText={setDataAgendada}
                        placeholder="Ex: 2026-06-10"
                    />

                    {renderOptionSelector('Tipo de Tarefa', [
                        {label: 'Visita Técnica', value: 'VISITA_TECNICA'},
                        {label: 'Operação', value: 'OPERACAO_CAMPO'},
                        {label: 'Manutenção', value: 'MANUTENCAO'}
                    ], tipo, setTipo)}

                    {renderOptionSelector('Prioridade', [
                        {label: 'Baixa', value: 'BAIXA'},
                        {label: 'Média', value: 'MEDIA'},
                        {label: 'Alta', value: 'ALTA'},
                        {label: 'Urgente', value: 'URGENTE'}
                    ], prioridade, setPrioridade)}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Vincular à Fazenda (Opcional)</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                            <TouchableOpacity 
                                style={[styles.optionBtn, !selectedFazenda && styles.optionBtnActive]}
                                onPress={() => setSelectedFazenda(null)}
                            >
                                <Text style={[styles.optionText, !selectedFazenda && styles.optionTextActive]}>Nenhuma</Text>
                            </TouchableOpacity>
                            {fazendas.map(f => (
                                <TouchableOpacity 
                                    key={f.id} 
                                    style={[styles.optionBtn, selectedFazenda === f.id && styles.optionBtnActive]}
                                    onPress={() => setSelectedFazenda(f.id)}
                                >
                                    <Text style={[styles.optionText, selectedFazenda === f.id && styles.optionTextActive]}>{f.nome}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                        <Ionicons name="checkmark-circle-outline" size={24} color="#FFF" />
                        <Text style={styles.saveBtnText}>Salvar Tarefa</Text>
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
    optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    optionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginRight: 10, marginBottom: 10 },
    optionBtnActive: { backgroundColor: 'rgba(16,185,129,0.2)', borderColor: '#10B981' },
    optionText: { color: '#9CA3AF', fontSize: 12, fontWeight: 'bold' },
    optionTextActive: { color: '#10B981' },
    saveBtn: { backgroundColor: '#10B981', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15, borderRadius: 10, marginTop: 10 },
    saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, marginLeft: 10 }
});
