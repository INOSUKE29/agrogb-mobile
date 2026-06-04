import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { executeQuery } from '../database/database';
import SafeBlurView from '../components/ui/SafeBlurView';

const RURAL_BG = require('../../assets/farm_bg.png');

export default function TasksScreen({ navigation }) {
    const { role } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [filter, setFilter] = useState('PENDENTE'); // PENDENTE, CONCLUIDO

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadTasks();
        });
        return unsubscribe;
    }, [navigation, filter]);

    const loadTasks = async () => {
        try {
            const query = `
                SELECT t.*, f.nome as fazenda_nome, tal.nome as talhao_nome 
                FROM v2_tarefas t
                LEFT JOIN v2_fazendas f ON f.id = t.fazenda_id
                LEFT JOIN v2_talhoes tal ON tal.id = t.talhao_id
                WHERE t.status = ?
                ORDER BY t.data_agendada ASC
            `;
            const result = await executeQuery(query, [filter]);
            const loaded = [];
            for (let i = 0; i < result.rows.length; i++) {
                loaded.push(result.rows.item(i));
            }
            setTasks(loaded);
        } catch (error) {
            console.error('Erro ao buscar tarefas:', error);
        }
    };

    const toggleTaskStatus = async (task) => {
        const novoStatus = task.status === 'PENDENTE' ? 'CONCLUIDO' : 'PENDENTE';
        try {
            await executeQuery(`UPDATE v2_tarefas SET status = ?, updated_at = datetime('now'), sync_status = 'pending' WHERE id = ?`, [novoStatus, task.id]);
            loadTasks();
            if (novoStatus === 'CONCLUIDO') {
                // Aqui entraria um som de sucesso (haptic feedback, etc)
                Alert.alert("Sucesso!", "Tarefa concluída com sucesso! ✅");
            }
        } catch (error) {
            Alert.alert("Erro", "Não foi possível atualizar a tarefa.");
        }
    };

    const getPriorityColor = (prioridade) => {
        switch (prioridade) {
            case 'URGENTE': return '#EF4444';
            case 'ALTA': return '#F59E0B';
            case 'BAIXA': return '#3B82F6';
            default: return '#10B981';
        }
    };

    const getIconForType = (tipo) => {
        switch (tipo) {
            case 'VISITA_TECNICA': return 'briefcase-outline';
            case 'MANUTENCAO': return 'build-outline';
            default: return 'leaf-outline';
        }
    };

    const renderTaskCard = ({ item }) => (
        <SafeBlurView intensity={20} tint="dark" style={[styles.card, { borderLeftColor: getPriorityColor(item.prioridade) }]}>
            <View style={styles.cardHeader}>
                <View style={styles.badgeContainer}>
                    <Ionicons name={getIconForType(item.tipo)} size={14} color="#FFF" />
                    <Text style={styles.badgeText}>{item.tipo.replace('_', ' ')}</Text>
                </View>
                <Text style={styles.dateText}>{item.data_agendada ? new Date(item.data_agendada).toLocaleDateString('pt-BR') : 'Sem Data'}</Text>
            </View>
            
            <Text style={styles.title}>{item.titulo}</Text>
            {item.descricao ? <Text style={styles.description}>{item.descricao}</Text> : null}
            
            {(item.fazenda_nome || item.talhao_nome) && (
                <View style={styles.locationContainer}>
                    <Ionicons name="location-outline" size={12} color="#9CA3AF" />
                    <Text style={styles.locationText}>{item.fazenda_nome} {item.talhao_nome ? `• ${item.talhao_nome}` : ''}</Text>
                </View>
            )}

            <View style={styles.footer}>
                <Text style={[styles.priority, { color: getPriorityColor(item.prioridade) }]}>{item.prioridade}</Text>
                <TouchableOpacity 
                    style={[styles.checkBtn, item.status === 'CONCLUIDO' && styles.checkBtnDone]} 
                    onPress={() => toggleTaskStatus(item)}
                >
                    <Ionicons name={item.status === 'CONCLUIDO' ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={item.status === 'CONCLUIDO' ? '#10B981' : '#FFF'} />
                    <Text style={[styles.checkBtnText, item.status === 'CONCLUIDO' && { color: '#10B981' }]}>
                        {item.status === 'CONCLUIDO' ? 'Concluído' : 'Concluir'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeBlurView>
    );

    return (
        <ImageBackground source={RURAL_BG} style={styles.container} resizeMode="cover">
            <View style={styles.overlay} />
            
            <SafeBlurView intensity={30} tint="dark" style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Gestão de Visitas e Tarefas</Text>
            </SafeBlurView>

            <View style={styles.tabs}>
                <TouchableOpacity style={[styles.tab, filter === 'PENDENTE' && styles.tabActive]} onPress={() => setFilter('PENDENTE')}>
                    <Text style={[styles.tabText, filter === 'PENDENTE' && styles.tabTextActive]}>Pendentes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, filter === 'CONCLUIDO' && styles.tabActive]} onPress={() => setFilter('CONCLUIDO')}>
                    <Text style={[styles.tabText, filter === 'CONCLUIDO' && styles.tabTextActive]}>Concluídas</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={tasks}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                renderItem={renderTaskCard}
                ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma tarefa encontrada.</Text>}
            />

            {(role === 'agronomo' || role === 'admin' || role === 'produtor') && (
                <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('TaskForm')}>
                    <Ionicons name="add" size={30} color="#FFF" />
                </TouchableOpacity>
            )}
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17, 24, 39, 0.85)' },
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20 },
    backBtn: { marginRight: 15 },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    tabs: { flexDirection: 'row', margin: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 5 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
    tabActive: { backgroundColor: '#10B981' },
    tabText: { color: '#9CA3AF', fontWeight: 'bold' },
    tabTextActive: { color: '#FFF' },
    list: { paddingHorizontal: 20, paddingBottom: 100 },
    emptyText: { color: '#9CA3AF', textAlign: 'center', marginTop: 50 },
    card: { padding: 15, borderRadius: 15, borderLeftWidth: 5, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    badgeContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    badgeText: { color: '#FFF', fontSize: 10, marginLeft: 5, fontWeight: 'bold' },
    dateText: { color: '#9CA3AF', fontSize: 12 },
    title: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
    description: { color: '#D1FAE5', fontSize: 13, marginBottom: 10, opacity: 0.8 },
    locationContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    locationText: { color: '#9CA3AF', fontSize: 12, marginLeft: 5 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 10 },
    priority: { fontSize: 12, fontWeight: 'bold' },
    checkBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    checkBtnDone: { backgroundColor: 'rgba(16,185,129,0.1)' },
    checkBtnText: { color: '#FFF', marginLeft: 8, fontWeight: 'bold' },
    fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 }
});
