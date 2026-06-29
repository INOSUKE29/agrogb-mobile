import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../theme/ThemeContext';
import { executeQuery } from '../../../database/database';
import AgroInput from '../../../components/common/AgroInput';
import AgroButton from '../../../components/common/AgroButton';
import SearchableSelect from '../../../components/common/SearchableSelect';
import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NovaReceitaScreen({ navigation }) {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};
    const isDark = theme?.theme_mode === 'dark';

    const [loading, setLoading] = useState(false);
    const [clientes, setClientes] = useState([]);
    const [farms, setFarms] = useState([]);
    const [fields, setFields] = useState([]);
    const [produtos, setProdutos] = useState([]);

    const [form, setForm] = useState({
        client_id: '',
        farm_uuid: '',
        field_uuid: '',
        title: '',
        description: '',
        application_type: 'FOLIAR',
        recipe_data: '', // JSON string for product and dose
        scheduled_date: new Date().toISOString().split('T')[0],
        produto_id: '',
        dose: ''
    });

    useEffect(() => {
        loadCombos();
    }, []);

    const loadCombos = async () => {
        try {
            const resC = await executeQuery('SELECT uuid as value, nome as label FROM v2_clientes WHERE is_deleted=0 ORDER BY nome');
            const arrC = [];
            for (let i=0; i<resC.rows.length; i++) arrC.push(resC.rows.item(i));
            setClientes(arrC);

            const resF = await executeQuery('SELECT uuid as value, nome as label, owner_id FROM farms WHERE is_deleted=0');
            const arrF = [];
            for (let i=0; i<resF.rows.length; i++) arrF.push(resF.rows.item(i));
            setFarms(arrF);

            const resFi = await executeQuery('SELECT uuid as value, nome as label, farm_uuid FROM fields WHERE is_deleted=0');
            const arrFi = [];
            for (let i=0; i<resFi.rows.length; i++) arrFi.push(resFi.rows.item(i));
            setFields(arrFi);

            const resP = await executeQuery('SELECT uuid as value, nome as label FROM v2_produtos WHERE is_deleted=0 ORDER BY nome');
            const arrP = [];
            for (let i=0; i<resP.rows.length; i++) arrP.push(resP.rows.item(i));
            setProdutos(arrP);

        } catch (e) {
            console.error('Erro loadCombos:', e);
        }
    };

    const handleSave = async () => {
        if (!form.client_id || !form.farm_uuid || !form.field_uuid || !form.title || !form.produto_id || !form.dose) {
            Alert.alert('Erro', 'Preencha todos os campos obrigatórios (*).');
            return;
        }
        setLoading(true);
        try {
            const userJson = await AsyncStorage.getItem('user_session');
            const user = JSON.parse(userJson || '{}');

            const recUuid = uuidv4();
            const now = new Date().toISOString();
            
            const recipeDataJson = JSON.stringify({
                produto_id: form.produto_id,
                dose: form.dose
            });

            const payload = {
                uuid: recUuid,
                agronomist_id: user.id,
                client_id: form.client_id,
                farm_uuid: form.farm_uuid,
                field_uuid: form.field_uuid,
                title: form.title,
                description: form.description,
                application_type: form.application_type,
                recipe_data: recipeDataJson,
                scheduled_date: form.scheduled_date,
                status: 'PENDING',
                created_by: user.id,
                last_updated: now,
                sync_status: 0
            };

            await executeQuery(
                `INSERT INTO recommendations (
                    uuid, agronomist_id, client_id, farm_uuid, field_uuid, title, 
                    description, application_type, recipe_data, scheduled_date, 
                    status, created_by, last_updated, sync_status
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,0)`,
                [
                    payload.uuid, payload.agronomist_id, payload.client_id, payload.farm_uuid, payload.field_uuid, payload.title,
                    payload.description, payload.application_type, payload.recipe_data, payload.scheduled_date,
                    payload.status, payload.created_by, payload.last_updated
                ]
            );

            await executeQuery(
                `INSERT INTO sync_outbox (uuid, tabela, registro_uuid, acao, payload_json, status, criado_em) VALUES (?, ?, ?, ?, ?, 'PENDENTE', ?)`,
                [uuidv4(), 'recommendations', recUuid, 'INSERT', JSON.stringify(payload), now]
            );

            Alert.alert('Sucesso', 'Receita agronômica emitida com sucesso!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);

        } catch (e) {
            console.error(e);
            Alert.alert('Erro', 'Falha ao salvar receita.');
        } finally {
            setLoading(false);
        }
    };

    const filteredFarms = farms.filter(f => f.owner_id === form.client_id);
    const filteredFields = fields.filter(f => f.farm_uuid === form.farm_uuid);

    return (
        <View style={[styles.container, { backgroundColor: activeColors.bg || '#F3F4F6' }]}>
            <LinearGradient colors={['#06111C', '#0A1522']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>NOVA RECEITA</Text>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={[styles.card, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF' }]}>
                    
                    <Text style={[styles.sectionTitle, { color: activeColors.text }]}>1. Localização</Text>
                    <SearchableSelect 
                        label="Cliente / Produtor *"
                        options={clientes}
                        value={form.client_id}
                        onChange={(val) => setForm({...form, client_id: val, farm_uuid: '', field_uuid: ''})}
                    />
                    
                    <SearchableSelect 
                        label="Propriedade *"
                        options={filteredFarms}
                        value={form.farm_uuid}
                        onChange={(val) => setForm({...form, farm_uuid: val, field_uuid: ''})}
                    />

                    <SearchableSelect 
                        label="Talhão *"
                        options={filteredFields}
                        value={form.field_uuid}
                        onChange={(val) => setForm({...form, field_uuid: val})}
                    />

                    <View style={styles.divider} />
                    
                    <Text style={[styles.sectionTitle, { color: activeColors.text }]}>2. Prescrição</Text>
                    <AgroInput 
                        label="Título da Receita *"
                        placeholder="Ex: Manejo de Ferrugem Asiática"
                        value={form.title}
                        onChangeText={(txt) => setForm({...form, title: txt})}
                    />

                    <SearchableSelect 
                        label="Tipo de Aplicação *"
                        options={[
                            {label: 'Foliar', value: 'FOLIAR'},
                            {label: 'Solo', value: 'SOLO'},
                            {label: 'Semente', value: 'SEMENTE'}
                        ]}
                        value={form.application_type}
                        onChange={(val) => setForm({...form, application_type: val})}
                    />

                    <SearchableSelect 
                        label="Produto Comercial *"
                        options={produtos}
                        value={form.produto_id}
                        onChange={(val) => setForm({...form, produto_id: val})}
                    />

                    <AgroInput 
                        label="Dose Recomendada *"
                        placeholder="Ex: 2 Litros/ha"
                        value={form.dose}
                        onChangeText={(txt) => setForm({...form, dose: txt})}
                    />

                    <AgroInput 
                        label="Data Programada *"
                        value={form.scheduled_date}
                        onChangeText={(txt) => setForm({...form, scheduled_date: txt})}
                        placeholder="YYYY-MM-DD"
                    />

                    <AgroInput 
                        label="Observações Adicionais"
                        placeholder="Ex: Aplicar com adjuvante..."
                        value={form.description}
                        onChangeText={(txt) => setForm({...form, description: txt})}
                        multiline
                    />

                </View>

                <AgroButton 
                    title="Emitir Receita"
                    onPress={handleSave}
                    loading={loading}
                    style={{ marginTop: 20 }}
                />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingBottom: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    headerTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', marginLeft: 15, letterSpacing: 1 },
    scroll: { padding: 15, paddingBottom: 50 },
    card: { padding: 20, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(156,163,175,0.2)' },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 15, marginTop: 10, opacity: 0.8 },
    divider: { height: 1, backgroundColor: 'rgba(156,163,175,0.2)', marginVertical: 20 }
});
