import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StatusBar, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { v4 as uuidv4 } from 'uuid';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { executeQuery } from '../database/database';
import { useTheme } from '../theme/ThemeContext';
import Card from '../components/common/Card';
import AgroInput from '../components/common/AgroInput';
import AgroButton from '../components/common/AgroButton';
import SearchableSelect from '../components/common/SearchableSelect';

export default function ReceitaFormScreen() {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};
    const navigation = useNavigation();
    const isDark = theme?.theme_mode === 'dark';

    const [loading, setLoading] = useState(false);
    
    // Cascading Dropdowns data
    const [clientes, setClientes] = useState([]);
    const [fazendas, setFazendas] = useState([]);
    const [talhoes, setTalhoes] = useState([]);

    // Form fields
    const [clientId, setClientId] = useState('');
    const [farmId, setFarmId] = useState('');
    const [fieldId, setFieldId] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [applicationType, setApplicationType] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');

    const applicationTypes = [
        { id: 'FUNGICIDA', name: 'Fungicida' },
        { id: 'INSETICIDA', name: 'Inseticida' },
        { id: 'HERBICIDA', name: 'Herbicida' },
        { id: 'FERTILIZANTE', name: 'Fertilizante' },
        { id: 'BIOLOGICO', name: 'Biológico' },
        { id: 'OUTRO', name: 'Outro' }
    ];

    useEffect(() => {
        loadClientes();
    }, []);

    useEffect(() => {
        if (clientId) {
            loadFazendas(clientId);
            setFarmId('');
            setFieldId('');
            setFazendas([]);
            setTalhoes([]);
        }
    }, [clientId]);

    useEffect(() => {
        if (farmId) {
            loadTalhoes(farmId);
            setFieldId('');
            setTalhoes([]);
        }
    }, [farmId]);

    const loadClientes = async () => {
        try {
            const res = await executeQuery('SELECT uuid as id, nome as name FROM clientes WHERE is_deleted = 0 ORDER BY nome ASC');
            const rows = [];
            for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
            setClientes(rows);
        } catch (e) {
            console.error(e);
        }
    };

    const loadFazendas = async (ownerId) => {
        try {
            const res = await executeQuery('SELECT uuid as id, nome as name FROM farms WHERE is_deleted = 0 AND owner_id = ? ORDER BY nome ASC', [ownerId]);
            const rows = [];
            for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
            setFazendas(rows);
        } catch (e) {
            console.error(e);
        }
    };

    const loadTalhoes = async (fId) => {
        try {
            const res = await executeQuery('SELECT uuid as id, nome as name FROM fields WHERE is_deleted = 0 AND farm_uuid = ? ORDER BY nome ASC', [fId]);
            const rows = [];
            for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
            setTalhoes(rows);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSave = async () => {
        if (!clientId || !farmId || !fieldId || !title.trim() || !applicationType || !scheduledDate) {
            return Alert.alert('Atenção', 'Preencha todos os campos obrigatórios (*).');
        }

        // Basic date format check (YYYY-MM-DD for standard SQLite date functions, but we can accept a string for now)
        setLoading(true);
        try {
            const json = await AsyncStorage.getItem('user_session');
            const session = json ? JSON.parse(json) : { id: 'unknown' };
            const now = new Date().toISOString();
            const recUuid = uuidv4();
            
            // Insert into recommendations
            await executeQuery(
                `INSERT INTO recommendations 
                 (uuid, agronomist_id, client_id, farm_uuid, field_uuid, title, description, application_type, recipe_data, scheduled_date, status, created_by, last_updated, sync_status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, 0)`,
                [recUuid, session.id, clientId, farmId, fieldId, title, description, applicationType, '{}', scheduledDate, session.id, now]
            );

            // Queue outbox
            const payload = JSON.stringify({
                uuid: recUuid,
                agronomist_id: session.id,
                client_id: clientId,
                farm_uuid: farmId,
                field_uuid: fieldId,
                title: title,
                description: description,
                application_type: applicationType,
                recipe_data: '{}',
                scheduled_date: scheduledDate,
                status: 'PENDING'
            });

            await executeQuery(
                `INSERT INTO sync_outbox (uuid, tabela, registro_uuid, acao, payload_json, status, criado_em) VALUES (?, ?, ?, ?, ?, 'PENDENTE', ?)`,
                [uuidv4(), 'recommendations', recUuid, 'INSERT', payload, now]
            );

            Alert.alert('Sucesso', 'Prescrição criada! Ela será sincronizada automaticamente.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);

        } catch (e) {
            console.error(e);
            Alert.alert('Erro', 'Falha ao salvar a prescrição.');
        } finally {
            setLoading(false);
        }
    };

    const textColor = activeColors.text || '#1E293B';

    return (
        <View style={[styles.container, { backgroundColor: activeColors.bg || '#F3F4F6' }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            
            <LinearGradient colors={isDark ? ['#111827', '#0F172A'] : ['#2563EB', '#1D4ED8']} style={styles.header}>
                <SafeAreaView>
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                            <Ionicons name="arrow-back" size={22} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>NOVA PRESCRIÇÃO</Text>
                        <View style={{ width: 38 }} />
                    </View>
                    <Text style={styles.headerSub}>Recomendação de Manejo</Text>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <Card style={styles.card}>
                    <Text style={[styles.sectionTitle, { color: textColor }]}>1. DESTINO DA APLICAÇÃO</Text>
                    
                    <SearchableSelect 
                        label="CLIENTE *"
                        value={clientId}
                        options={clientes}
                        onSelect={setClientId}
                        icon="person-outline"
                    />

                    {clientId !== '' && (
                        <SearchableSelect 
                            label="FAZENDA / PROPRIEDADE *"
                            value={farmId}
                            options={fazendas}
                            onSelect={setFarmId}
                            icon="home-outline"
                            placeholder={fazendas.length === 0 ? 'Nenhuma fazenda cadastrada' : 'Selecione a fazenda...'}
                        />
                    )}

                    {farmId !== '' && (
                        <SearchableSelect 
                            label="TALHÃO / ÁREA *"
                            value={fieldId}
                            options={talhoes}
                            onSelect={setFieldId}
                            icon="leaf-outline"
                            placeholder={talhoes.length === 0 ? 'Nenhum talhão cadastrado' : 'Selecione o talhão...'}
                        />
                    )}
                </Card>

                <Card style={styles.card}>
                    <Text style={[styles.sectionTitle, { color: textColor }]}>2. DADOS DA RECEITA</Text>
                    
                    <AgroInput 
                        label="TÍTULO DA RECOMENDAÇÃO *" 
                        value={title} 
                        onChangeText={setTitle} 
                        placeholder="Ex: Combate à Ferrugem Asiática"
                        icon="create-outline"
                    />

                    <SearchableSelect 
                        label="TIPO DE APLICAÇÃO *"
                        value={applicationType}
                        options={applicationTypes}
                        onSelect={setApplicationType}
                        icon="beaker-outline"
                    />

                    <AgroInput 
                        label="DESCRIÇÃO / PRODUTOS (MVP)" 
                        value={description} 
                        onChangeText={setDescription} 
                        multiline
                        numberOfLines={4}
                        placeholder="Ex: Aplicar Produto X na dosagem Y L/ha, verificar condição de vento..."
                    />

                    <AgroInput 
                        label="DATA LIMITE / AGENDADA *" 
                        value={scheduledDate} 
                        onChangeText={setScheduledDate} 
                        placeholder="YYYY-MM-DD (Ex: 2024-03-15)"
                        icon="calendar-outline"
                    />
                </Card>

                <View style={styles.btnWrapper}>
                    <AgroButton 
                        title="SALVAR PRESCRIÇÃO" 
                        onPress={handleSave} 
                        loading={loading}
                        color="#3B82F6"
                        icon="save-outline"
                    />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 50, paddingBottom: 25, paddingHorizontal: 25, borderBottomLeftRadius: 35, borderBottomRightRadius: 35 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerTitle: { fontSize: 13, fontWeight: '900', color: '#FFF', letterSpacing: 1.5 },
    headerSub: { fontSize: 16, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
    iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.15)', justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: 20, paddingBottom: 40 },
    card: { marginBottom: 20 },
    sectionTitle: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15, marginTop: 5 },
    btnWrapper: { paddingBottom: 20 }
});
