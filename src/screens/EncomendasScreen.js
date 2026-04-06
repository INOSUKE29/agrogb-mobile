import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar,
  SafeAreaView,
  Platform,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { executeQuery } from '../database/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function EncomendasScreen() {
  const navigation = useNavigation();
  const [encomendas, setEncomendas] = useState([]);
  const [filter, setFilter] = useState('TODOS');
  const [dashboardData, setDashboardData] = useState({ totalValor: 0, totalAtivas: 0 });

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadEncomendas);
    return unsubscribe;
  }, [navigation]);

  const loadEncomendas = async () => {
    try {
      const query = `
        SELECT o.*, c.nome as cliente_nome, p.nome as produto_nome
        FROM orders o
        LEFT JOIN clientes c ON o.cliente_id = c.uuid
        LEFT JOIN cadastro p ON o.produto_id = p.uuid
        WHERE o.is_deleted = 0
        ORDER BY o.data_prevista ASC`;
      const result = await executeQuery(query);
      const data = [];
      let totalValue = 0;
      let activeCount = 0;

      for (let i = 0; i < result.rows.length; i++) {
        const item = result.rows.item(i);
        data.push(item);
        if (item.status === 'PENDENTE' || item.status === 'PARCIAL') {
          activeCount++;
          totalValue += (item.quantidade_total * (item.valor_unitario || 0));
        }
      }
      setEncomendas(data);
      setDashboardData({ totalValor: totalValue, totalAtivas: activeCount });
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível carregar as encomendas.');
    }
  };

  const statusCounts = useMemo(() => {
    return encomendas.reduce(
      (acc, cur) => {
        acc.ALL++;
        if (cur.status === 'PENDENTE' || cur.status === 'PARCIAL') acc.PENDING++;
        else if (cur.status === 'CONCLUIDA') acc.DELIVERED++;
        else if (cur.status === 'CANCELADA') acc.CANCELED++;
        return acc;
      },
      { ALL: 0, PENDING: 0, DELIVERED: 0, CANCELED: 0 }
    );
  }, [encomendas]);

  const filteredData = useMemo(() => {
    let list = encomendas;
    if (filter === 'PENDENTE')
      list = encomendas.filter((e) => e.status === 'PENDENTE' || e.status === 'PARCIAL');
    else if (filter === 'ENTREGUE') list = encomendas.filter((e) => e.status === 'CONCLUIDA');
    else if (filter === 'CANCELADA') list = encomendas.filter((e) => e.status === 'CANCELADA');
    
    return list.sort((a, b) => {
      if (a.status === 'PENDENTE' && b.status !== 'PENDENTE') return -1;
      if (a.status !== 'PENDENTE' && b.status === 'PENDENTE') return 1;
      return 0;
    });
  }, [encomendas, filter]);

  const getStatusConfig = (status) => {
    switch (status) {
      case 'PENDENTE':
        return { color: '#F59E0B', bg: '#FFFBEB', icon: 'time', label: 'Pendente' };
      case 'PARCIAL':
        return { color: '#3B82F6', bg: '#EFF6FF', icon: 'sync-circle', label: 'Parcial' };
      case 'CONCLUIDA':
        return { color: '#10B981', bg: '#ECFDF5', icon: 'checkmark-circle', label: 'Entregue' };
      case 'CANCELADA':
        return { color: '#EF4444', bg: '#FEF2F2', icon: 'close-circle', label: 'Cancelada' };
      default:
        return { color: '#64748B', bg: '#F8FAFC', icon: 'help-circle', label: 'Desconhecido' };
    }
  };

  const renderItem = ({ item }) => {
    const cfg = getStatusConfig(item.status);
    const total = item.quantidade_total * (item.valor_unitario || 0);

    return (
      <View style={styles.cardContainer}>
        {/* Left Color Indicator */}
        <View style={[styles.cardIndicator, { backgroundColor: cfg.color }]} />
        
        <View style={styles.cardContent}>
          {/* Header */}
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.clientName}>{item.cliente_nome || 'Cliente não informado'}</Text>
              <Text style={styles.dateText}>
                {item.data_prevista ? new Date(item.data_prevista).toLocaleDateString('pt-BR') : 'Sem data definida'}
              </Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: cfg.color + '20' }]}>
              <Ionicons name={cfg.icon} size={12} color={cfg.color} style={{ marginRight: 4 }} />
              <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Details Row */}
          <View style={styles.detailsRow}>
            <View style={styles.productBlock}>
              <View style={styles.iconBox}>
                <Ionicons name="cube-outline" size={18} color="#94A3B8" />
              </View>
              <View>
                <Text style={styles.productName}>{item.produto_nome || 'Produto'}</Text>
                <Text style={styles.productQtd}>{item.quantidade_total} {item.unidade || 'un'}</Text>
              </View>
            </View>

            <View style={styles.valueBlock}>
              <Text style={styles.valueLabel}>Valor Total</Text>
              <Text style={styles.valueAmount}>
                R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          {/* Bottom Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.ghostButton} 
              onPress={() => navigation.navigate('NovaEncomenda', { encomenda: item })}>
              <Text style={styles.ghostButtonText}>Editar Pedido</Text>
            </TouchableOpacity>

            {(item.status === 'PENDENTE' || item.status === 'PARCIAL') && (
              <TouchableOpacity
                style={styles.primaryActionButton}
                onPress={() => navigation.navigate('Vendas', { 
                  autoFill: true, cliente: item.cliente_nome, produto: item.produto_nome, 
                  quantidade: item.quantidade_restante.toString(), order_id: item.id 
                })}
              >
                <Text style={styles.primaryActionText}>Dar Baixa</Text>
                <Ionicons name="arrow-forward" size={14} color="#FFF" style={{marginLeft: 4}}/>
              </TouchableOpacity>
            )}
          </View>

        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#060B12', '#0A121E']} style={StyleSheet.absoluteFill} />
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <SafeAreaView style={styles.safeArea}>
        
        {/* Superior Dashboard Section */}
        <View style={styles.topDashboard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.pageTitle}>Logística & Entregas</Text>
          </View>
          <View style={styles.summaryBox}>
            <View>
              <Text style={styles.summaryLabel}>Valor em Pendências</Text>
              <Text style={styles.summaryValue}>
                R$ {dashboardData.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.badgeCircle}>
              <Text style={styles.badgeNumber}>{dashboardData.totalAtivas}</Text>
              <Text style={styles.badgeLabel}>Ativas</Text>
            </View>
          </View>
        </View>

        {/* Custom Segmented Control */}
        <View style={styles.segmentsContainer}>
          {['TODOS', 'PENDENTE', 'ENTREGUE', 'CANCELADA'].map((chip) => {
            const isActive = filter === chip;
            return (
              <TouchableOpacity
                key={chip}
                style={[styles.segmentButton, isActive && styles.segmentButtonActive]}
                onPress={() => setFilter(chip)}
              >
                <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                  {chip === 'ENTREGUE' ? 'ENTREGUES' : chip === 'CANCELADA' ? 'CANCELADAS' : chip}
                </Text>
                {isActive && <View style={styles.activeDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Orders List */}
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <BlurView intensity={20} tint="dark" style={styles.emptyBlur}>
                <Ionicons name="rocket-outline" size={64} color="#334155" />
                <Text style={styles.emptyTitle}>Sem Encomendas Aqui</Text>
                <Text style={styles.emptyText}>Tudo limpo na sua rota de entregas.</Text>
              </BlurView>
            </View>
          }
        />

        {/* Premium FAB */}
        <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={() => navigation.navigate('NovaEncomenda')}>
          <LinearGradient colors={['#10B981', '#059669']} style={styles.fabGradient} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
            <Ionicons name="add" size={28} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060B12' },
  safeArea: { flex: 1, width: '100%', maxWidth: 650, alignSelf: 'center' },
  
  topDashboard: {
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 30,
    paddingBottom: 20,
  },
  backButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginRight: 12 },
  pageTitle: { color: '#FFF', fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },
  
  summaryBox: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: { color: '#94A3B8', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  summaryValue: { color: '#10B981', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  badgeCircle: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
  badgeNumber: { color: '#10B981', fontSize: 18, fontWeight: '800' },
  badgeLabel: { color: '#10B981', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },

  segmentsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  segmentButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginHorizontal: 4,
    borderRadius: 24,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  segmentText: { color: '#64748B', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  segmentTextActive: { color: '#FFF' },
  activeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#10B981', position: 'absolute', bottom: 4 },

  listContainer: { paddingHorizontal: 20, paddingBottom: 120, paddingTop: 10 },
  
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardIndicator: { width: 5 },
  cardContent: { flex: 1, padding: 18 },
  
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  clientName: { color: '#F8FAFC', fontSize: 17, fontWeight: '800', marginBottom: 4 },
  dateText: { color: '#64748B', fontSize: 13, fontWeight: '500' },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 16 },
  
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productBlock: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  productName: { color: '#CBD5E1', fontSize: 15, fontWeight: '600' },
  productQtd: { color: '#94A3B8', fontSize: 13, marginTop: 2 },
  
  valueBlock: { alignItems: 'flex-end' },
  valueLabel: { color: '#64748B', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  valueAmount: { color: '#F8FAFC', fontSize: 18, fontWeight: '800' },

  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 18, gap: 12 },
  ghostButton: { paddingVertical: 8, paddingHorizontal: 16 },
  ghostButtonText: { color: '#94A3B8', fontSize: 13, fontWeight: '700' },
  
  primaryActionButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
  },
  primaryActionText: { color: '#FFF', fontSize: 13, fontWeight: '800' },

  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyBlur: { alignItems: 'center', padding: 40, borderRadius: 30, overflow: 'hidden', width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.02)' },
  emptyTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '800', marginTop: 20 },
  emptyText: { color: '#64748B', fontSize: 14, marginTop: 10, textAlign: 'center' },

  fab: { position: 'absolute', right: 24, bottom: 24, shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 },
  fabGradient: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#34D399' },
});
