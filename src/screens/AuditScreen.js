import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    ActivityIndicator, 
    Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { executeQuery } from '../database/database';
import { useTheme } from '../context/ThemeContext';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import { showToast } from '../ui/Toast';
import { LoggingService } from '../modules/system/services/LoggingService';

export default function AuditScreen({ navigation }) {
    const { theme } = useTheme();
    const colors = theme?.colors || {};

    const [activeTab, setActiveTab] = useState('audit'); // 'audit' | 'errors'
    const [auditLogs, setAuditLogs] = useState([]);
    const [errorLogs, setErrorLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadLogs();
    }, [activeTab]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            if (activeTab === 'audit') {
                const res = await executeQuery('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 150');
                setAuditLogs(res.rows._array || []);
            } else {
                const res = await executeQuery('SELECT * FROM error_logs ORDER BY id DESC LIMIT 150');
                setErrorLogs(res.rows._array || []);
            }
        } catch (e) {
            console.error('[AuditScreen] Error loading logs:', e);
            showToast('Erro ao carregar logs');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            showToast('Gerando relatório...');
            const res = await LoggingService.exportLogs();
            if (res.success) {
                showToast('Exportado com sucesso!');
            } else {
                Alert.alert('Exportação', res.message);
            }
        } catch (e) {
            Alert.alert('Erro', e.message);
        }
    };

    const formatActionColor = (action) => {
        switch (action) {
            case 'INSERT': return '#10B981';
            case 'UPDATE': return '#3B82F6';
            case 'DELETE': return '#EF4444';
            default: return colors.text || '#111827';
        }
    };

    const renderAuditItem = ({ item }) => (
        <View style={[styles.logCard, { backgroundColor: colors.card || '#FFFFFF', borderColor: colors.border || '#E5E7EB' }]}>
            <View style={styles.logHeader}>
                <View style={[styles.badge, { backgroundColor: formatActionColor(item.acao) + '15' }]}>
                    <Text style={[styles.badgeText, { color: formatActionColor(item.acao) }]}>
                        {item.acao}
                    </Text>
                </View>
                <Text style={[styles.logTime, { color: colors.textMuted || '#9CA3AF' }]}>
                    {new Date(item.data).toLocaleTimeString()} - {new Date(item.data).toLocaleDateString()}
                </Text>
            </View>
            <Text style={[styles.logText, { color: colors.text || '#1F2937' }]}>
                Tabela: <Text style={styles.bold}>{item.tabela}</Text>
            </Text>
            {item.detalhes && (
                <Text style={[styles.logDetails, { color: colors.textMuted || '#4B5563' }]} numberOfLines={2}>
                    {item.detalhes}
                </Text>
            )}
            <Text style={[styles.logUser, { color: colors.textMuted || '#9CA3AF' }]}>
                User UUID: {item.usuario_uuid || 'SISTEMA'}
            </Text>
        </View>
    );

    const renderErrorItem = ({ item }) => (
        <View style={[styles.logCard, { backgroundColor: colors.card || '#FFFFFF', borderColor: '#EF4444' + '40', borderWidth: 1 }]}>
            <View style={styles.logHeader}>
                <View style={[styles.badge, { backgroundColor: '#EF444415' }]}>
                    <Text style={[styles.badgeText, { color: '#EF4444' }]}>
                        ERRO
                    </Text>
                </View>
                <Text style={[styles.logTime, { color: colors.textMuted || '#9CA3AF' }]}>
                    {item.created_at || item.data}
                </Text>
            </View>
            <Text style={[styles.logText, { color: colors.text || '#1F2937' }]}>
                Tela: <Text style={styles.bold}>{item.tela || 'N/A'}</Text>
            </Text>
            <Text style={[styles.logErrorText, { color: '#EF4444' }]}>
                {item.erro}
            </Text>
            {item.stack && (
                <Text style={[styles.logDetails, { color: colors.textMuted || '#4B5563', fontFamily: 'monospace', fontSize: 10 }]} numberOfLines={3}>
                    {item.stack}
                </Text>
            )}
        </View>
    );

    return (
        <AppContainer>
            <ScreenHeader title="Auditoria de Logs" onBack={() => navigation.goBack()} />

            {/* Abas */}
            <View style={[styles.tabBar, { borderBottomColor: colors.border || '#E5E7EB' }]}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'audit' && { borderBottomColor: colors.primary || '#10B981' }]}
                    onPress={() => setActiveTab('audit')}
                >
                    <Ionicons name="shield-outline" size={16} color={activeTab === 'audit' ? (colors.primary || '#10B981') : (colors.textMuted || '#9CA3AF')} />
                    <Text style={[styles.tabText, { color: activeTab === 'audit' ? (colors.text || '#111827') : (colors.textMuted || '#9CA3AF') }]}>
                        AUDITORIA
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'errors' && { borderBottomColor: colors.primary || '#10B981' }]}
                    onPress={() => setActiveTab('errors')}
                >
                    <Ionicons name="bug-outline" size={16} color={activeTab === 'errors' ? (colors.primary || '#10B981') : (colors.textMuted || '#9CA3AF')} />
                    <Text style={[styles.tabText, { color: activeTab === 'errors' ? (colors.text || '#111827') : (colors.textMuted || '#9CA3AF') }]}>
                        ERROS
                    </Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary || '#10B981'} />
                </View>
            ) : (
                <FlatList
                    data={activeTab === 'audit' ? auditLogs : errorLogs}
                    keyExtractor={item => item.id.toString()}
                    renderItem={activeTab === 'audit' ? renderAuditItem : renderErrorItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <Text style={[styles.empty, { color: colors.textMuted || '#9CA3AF' }]}>
                            Nenhum log registrado para esta categoria.
                        </Text>
                    }
                />
            )}

            {/* Botão de Exportação */}
            <TouchableOpacity 
                style={[styles.fab, { backgroundColor: colors.primary || '#10B981' }]} 
                onPress={handleExport}
                activeOpacity={0.8}
            >
                <Ionicons name="share-outline" size={24} color="#FFF" />
            </TouchableOpacity>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        height: 48,
    },
    tab: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabText: {
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    logCard: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    logTime: {
        fontSize: 10,
        fontWeight: '600',
    },
    logText: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 4,
    },
    logErrorText: {
        fontSize: 12,
        fontWeight: 'bold',
        marginVertical: 4,
    },
    bold: {
        fontWeight: 'bold',
    },
    logDetails: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 4,
    },
    logUser: {
        fontSize: 9,
        fontWeight: '600',
        marginTop: 8,
    },
    empty: {
        textAlign: 'center',
        marginTop: 60,
        fontSize: 13,
        fontWeight: 'bold',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    }
});
