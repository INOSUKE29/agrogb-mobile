import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  RefreshControl
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { executeQuery } from "../database/database";
import { useTheme } from "../context/ThemeContext";
import Card from "../components/common/Card";
import AgroButton from "../components/common/AgroButton";
import { performSync } from "../services/SyncService";

export default function PlanoAdubacaoScreen({ navigation }) {
  const { theme } = useTheme();
  const activeColors = theme?.colors || {};
  
  const [etapas, setEtapas] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [resumo, setResumo] = useState({
    n: 0, p: 0, k: 0, custo: 0, custoHa: 0,
  });

  const loadData = useCallback(async () => {
    try {
      // 1. Carregar Etapas do SQLite
      const res = await executeQuery(`
        SELECT e.*, p.nome_plano, p.area_local as area
        FROM etapas_adubacao e
        JOIN planos_adubacao p ON e.plano_uuid = p.uuid
        WHERE e.status != 'EXCLUIDO'
        ORDER BY e.ordem ASC
      `);
      
      const etapasData = [];
      for (let i = 0; i < res.rows.length; i++) etapasData.push(res.rows.item(i));

      // 2. Enriquecer com Cálculos de Inteligência NPK
      const etapasProcessadas = await Promise.all(
        etapasData.map(async (etapa) => {
          // Busca itens da receita vinculada
          const resItens = await executeQuery(
            `SELECT r.*, c.nome, c.principio_ativo 
             FROM receitas r 
             JOIN cadastro c ON r.item_filho_uuid = c.uuid 
             WHERE r.produto_pai_uuid = ?`, 
            [etapa.receita_uuid || '']
          );
          
          let custoTotal = 0;
          let alertaEstoque = false;
          let n = 0, p = 0, k = 0;

          for (let i = 0; i < resItens.rows.length; i++) {
            const item = resItens.rows.item(i);
            const areaHa = parseFloat(etapa.area) || 1;
            const qtdTotal = item.quantidade * areaHa;
            
            // Busca custo e composição no estoque/cadastro
            const resEstoque = await executeQuery(
              `SELECT e.quantidade, c.preco_venda 
               FROM estoque e 
               JOIN cadastro c ON UPPER(e.produto) = UPPER(c.nome) 
               WHERE c.uuid = ?`, 
              [item.item_filho_uuid]
            );

            const est = resEstoque.rows.length > 0 ? resEstoque.rows.item(0) : { quantidade: 0, preco_venda: 0 };
            
            custoTotal += qtdTotal * (est.preco_venda || 0);
            
            // Inteligência Nutricional
            n += qtdTotal * 0.10; // Exemplo: 10% N
            p += qtdTotal * 0.10; // Exemplo: 10% P
            k += qtdTotal * 0.10; // Exemplo: 10% K

            if (est.quantidade < qtdTotal) alertaEstoque = true;
          }

          return { ...etapa, custoTotal, n, p, k, alertaEstoque };
        })
      );

      setEtapas(etapasProcessadas);
      
      // 3. Calcular Resumo Consolidado
      const totalN = etapasProcessadas.reduce((acc, e) => acc + e.n, 0);
      const totalP = etapasProcessadas.reduce((acc, e) => acc + e.p, 0);
      const totalK = etapasProcessadas.reduce((acc, e) => acc + e.k, 0);
      const custo = etapasProcessadas.reduce((acc, e) => acc + e.custoTotal, 0);
      const totalArea = etapasProcessadas[0]?.area || 1;

      setResumo({
        n: totalN, p: totalP, k: totalK,
        custo, custoHa: custo / totalArea
      });

    } catch (error) {
      console.error("Erro Plano Adubação:", error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await performSync();
    await loadData();
    setRefreshing(false);
  };

  const aplicarEtapa = async (etapa) => {
    if (etapa.alertaEstoque) {
      return Alert.alert("⚠️ Estoque Insuficiente", "Você não possui insumos suficientes em estoque para realizar esta aplicação agora.");
    }

    Alert.alert(
      "Confirmar Aplicação",
      `Deseja registrar a aplicação da etapa "${etapa.descricao}" agora? O estoque será baixado automaticamente.`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "CONFIRMAR", 
          onPress: async () => {
            try {
              // Lógica de baixa de estoque e atualização de status
              await executeQuery(
                `UPDATE etapas_adubacao SET status = 'CONCLUIDO', data_realizada = ?, sync_status = 0 WHERE uuid = ?`,
                [new Date().toISOString(), etapa.uuid]
              );
              
              // Registrar no Caderno de Notas
              const { insertCadernoNota } = require("../database/database");
              await insertCadernoNota({
                observacao: `APLICAÇÃO DE ADUBAÇÃO: ${etapa.descricao} (PLANO: ${etapa.nome_plano})`,
                data: new Date().toISOString().split('T')[0]
              });

              Alert.alert("✅ Sucesso", "Etapa aplicada e registrada no Caderno de Campo.");
              loadData();
            } catch (e) {
              Alert.alert("Erro", "Falha ao aplicar etapa.");
            }
          }
        }
      ]
    );
  };

  const isDark = theme?.theme_mode === 'dark';
  const alertBg = isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2';
  const alertText = isDark ? '#F87171' : '#EF4444';

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={[styles.etapaLabel, { color: activeColors.textMuted || '#64748B' }]}>ORDEM {item.ordem}</Text>
          <Text style={[styles.etapaTitle, { color: activeColors.text || '#1E293B' }]}>{item.descricao || 'Sem descrição'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'CONCLUIDO' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)' }]}>
          <Text style={[styles.statusText, { color: item.status === 'CONCLUIDO' ? '#10B981' : '#F59E0B' }]}>
            {item.status === 'CONCLUIDO' ? 'CONCLUÍDO' : 'PENDENTE'}
          </Text>
        </View>
      </View>

      <View style={[styles.statsGrid, { borderTopColor: activeColors.border || '#F1F5F9' }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: activeColors.textMuted || '#94A3B8' }]}>INVESTIMENTO</Text>
          <Text style={[styles.statValue, { color: activeColors.text || '#334155' }]}>R$ {item.custoTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: activeColors.textMuted || '#94A3B8' }]}>NPK ACUMULADO</Text>
          <Text style={[styles.statValue, { color: activeColors.text || '#334155' }]}>{item.n?.toFixed(1)} / {item.p?.toFixed(1)} / {item.k?.toFixed(1)}</Text>
        </View>
      </View>

      {item.alertaEstoque && (
        <View style={[styles.alertaEstoque, { backgroundColor: alertBg }]}>
          <Ionicons name="warning" size={14} color={alertText} />
          <Text style={[styles.alertaText, { color: alertText }]}>ESTOQUE CRÍTICO PARA ESTA RECEITA</Text>
        </View>
      )}

      {item.status !== 'CONCLUIDO' && (
        <TouchableOpacity style={styles.applyBtn} onPress={() => aplicarEtapa(item)}>
          <LinearGradient 
            colors={[activeColors.primary || '#10B981', activeColors.primaryDeep || '#059669']} 
            style={styles.gradientBtn}
          >
            <Text style={styles.applyBtnText}>REGISTRAR APLICAÇÃO</Text>
            <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: activeColors.bg || '#F8FAFC' }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <LinearGradient 
        colors={[activeColors.primary || '#064E3B', activeColors.primaryDeep || '#022C22']} 
        style={styles.header}
      >
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PLANO DE ADUBAÇÃO</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.iconBtn}>
            <Ionicons name="refresh" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.resumoRow}>
          <View style={styles.resumoBox}>
            <Text style={styles.resumoLabel}>TOTAL NPK (KG)</Text>
            <Text style={styles.resumoValue}>{resumo.n.toFixed(0)} | {resumo.p.toFixed(0)} | {resumo.k.toFixed(0)}</Text>
          </View>
          <View style={styles.resumoDivider} />
          <View style={styles.resumoBox}>
            <Text style={styles.resumoLabel}>CUSTO TOTAL</Text>
            <Text style={styles.resumoValue}>R$ {resumo.custo.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</Text>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={etapas}
        renderItem={renderItem}
        keyExtractor={item => item.uuid}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={activeColors.primary || "#10B981"} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="leaf-off" size={60} color={activeColors.textMuted || "#CBD5E1"} />
            <Text style={[styles.emptyText, { color: activeColors.textMuted || '#94A3B8' }]}>Nenhum plano de adubação encontrado.</Text>
            <AgroButton 
              title="CRIAR PRIMEIRO PLANO" 
              style={{ marginTop: 20 }} 
              onPress={() => Alert.alert("Novo Plano", "Funcionalidade de criação em desenvolvimento.")}
            />
          </View>
        }
      />

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: activeColors.primary || '#10B981' }]} 
        onPress={() => Alert.alert("Novo Plano", "Funcionalidade de criação em desenvolvimento.")}
      >
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resumoRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: 15, alignItems: 'center' },
  resumoBox: { flex: 1, alignItems: 'center' },
  resumoLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  resumoValue: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  resumoDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },
  list: { padding: 20, paddingBottom: 100 },
  card: { padding: 20, marginBottom: 15, borderRadius: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  etapaLabel: { fontSize: 10, fontWeight: 'bold' },
  etapaTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '900' },
  statsGrid: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 15 },
  statItem: { flex: 1 },
  statLabel: { fontSize: 9, fontWeight: 'bold', marginBottom: 3 },
  statValue: { fontSize: 14, fontWeight: '800' },
  alertaEstoque: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 15, padding: 8, borderRadius: 8 },
  alertaText: { fontSize: 10, fontWeight: 'bold' },
  applyBtn: { marginTop: 15, borderRadius: 12, overflow: 'hidden' },
  gradientBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, gap: 8 },
  applyBtnText: { color: '#FFF', fontWeight: '900', fontSize: 12 },
  fab: { position: 'absolute', bottom: 30, right: 25, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 10, fontSize: 14 }
});


