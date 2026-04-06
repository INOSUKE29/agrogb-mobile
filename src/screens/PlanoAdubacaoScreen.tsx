import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { supabase } from "../lib/supabase";

export default function PlanoAdubacaoScreen() {
  const [etapas, setEtapas] = useState<any[]>([]);
  const [resumo, setResumo] = useState({
    n: 0,
    p: 0,
    k: 0,
    custo: 0,
    custoHa: 0,
  });

  // Fetch etapas and enrich with recipe data, cost and stock alerts
  const fetchEtapas = async () => {
    const { data: etapasData } = await supabase
      .from("etapas_adubacao")
      .select("*")
      .order("created_at", { ascending: true });

    if (!etapasData) return;

    const etapasProcessadas = await Promise.all(
      etapasData.map(async (etapa) => {
        // Load linked recipe items
        const { data: itens } = await supabase
          .from("receita_itens")
          .select("*")
          .eq("receita_id", etapa.receita_id);

        let custoTotal = 0;
        let alerta = false;
        let totalN = 0,
          totalP = 0,
          totalK = 0;

        for (const item of itens || []) {
          // Get current stock for the product
          const { data: estoque } = await supabase
            .from("estoque_insumos")
            .select("*")
            .eq("produto_id", item.produto_id)
            .single();

          const quantidadeTotal = item.quantidade * Number(etapa.area);
          const custo = quantidadeTotal * (estoque?.custo_medio || 0);
          custoTotal += custo;

          // Nutrient contribution (assumes item stores % composition)
          totalN += quantidadeTotal * ((item.n || 0) / 100);
          totalP += quantidadeTotal * ((item.p || 0) / 100);
          totalK += quantidadeTotal * ((item.k || 0) / 100);

          if (!estoque || estoque.quantidade < quantidadeTotal) {
            alerta = true;
          }
        }

        return {
          ...etapa,
          custo_total: custoTotal,
          alerta,
          n: totalN,
          p: totalP,
          k: totalK,
        };
      })
    );

    setEtapas(etapasProcessadas);
    calcularResumo(etapasProcessadas);
  };

  const calcularResumo = (lista: any[]) => {
    const totalN = lista.reduce((acc, e) => acc + (e.n || 0), 0);
    const totalP = lista.reduce((acc, e) => acc + (e.p || 0), 0);
    const totalK = lista.reduce((acc, e) => acc + (e.k || 0), 0);
    const custo = lista.reduce((acc, e) => acc + (e.custo_total || 0), 0);
    const area = lista[0]?.area || 1;
    setResumo({
      n: totalN,
      p: totalP,
      k: totalK,
      custo,
      custoHa: custo / area,
    });
  };

  useEffect(() => {
    fetchEtapas();
  }, []);

  // Register application in Caderno Agrícola
  const registrarCaderno = async (etapa: any, itensAplicados: any[]) => {
    await supabase.from("caderno_agricola").insert([
      {
        plano_id: etapa.plano_id,
        etapa_id: etapa.id,
        data: new Date(),
        tipo: "adubacao",
        descricao: etapa.nome_etapa,
        insumos: itensAplicados,
        custo_total: etapa.custo_total,
      },
    ]);
  };

  // Apply an etapa: stock decrement, history, caderno register
  const aplicarEtapa = async (etapa: any) => {
    if (etapa.alerta) {
      Alert.alert("Erro", "Estoque insuficiente para esta etapa!");
      return;
    }

    // Load recipe items again (needed for stock operations)
    const { data: itens } = await supabase
      .from("receita_itens")
      .select("*")
      .eq("receita_id", etapa.receita_id);

    const itensAplicados = [];
    for (const item of itens || []) {
      const quantidadeTotal = item.quantidade * Number(etapa.area);

      // Decrease stock via RPC function
      await supabase.rpc("baixar_estoque", {
        p_produto_id: item.produto_id,
        p_quantidade: quantidadeTotal,
      });

      // Save applied item for Caderno
      itensAplicados.push({
        produto: item.produto_nome,
        quantidade: quantidadeTotal,
        unidade: item.unidade,
      });

      // Persist application record
      await supabase.from("aplicacoes_insumos").insert([
        {
          etapa_id: etapa.id,
          produto_id: item.produto_id,
          produto_nome: item.produto_nome,
          quantidade: quantidadeTotal,
          unidade: item.unidade,
        },
      ]);
    }

    // Register in Caderno Agrícola
    await registrarCaderno(etapa, itensAplicados);

    // Update status
    await supabase
      .from("etapas_adubacao")
      .update({ status: "aplicado" })
      .eq("id", etapa.id);

    Alert.alert("Sucesso", "Etapa aplicada e registrada no Caderno Agrícola.");
    fetchEtapas();
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.nome}>{item.nome_etapa}</Text>
      <Text style={styles.info}>Receita: {item.receita_nome || "—"}</Text>
      <Text style={styles.info}>💰 R$ {item.custo_total?.toFixed(2)}</Text>
      <Text style={styles.info}>📊 NPK: {item.n?.toFixed(2)}/{item.p?.toFixed(2)}/{item.k?.toFixed(2)}</Text>
      {item.alerta && <Text style={styles.alerta}>⚠️ Falta insumo</Text>}
      <Text style={styles.status}>Status: {item.status === "aplicado" ? "✅ Aplicado" : "⏳ Planejado"}</Text>
      {item.status === "planejado" && (
        <TouchableOpacity style={styles.botaoAplicar} onPress={() => aplicarEtapa(item)}>
          <Text style={{ color: "#fff" }}>Aplicar</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Plano de Adubação</Text>
      {/* Resumo */}
      <View style={styles.resumo}>
        <Text style={styles.resumoText}>N: {resumo.n.toFixed(2)} kg</Text>
        <Text style={styles.resumoText}>P: {resumo.p.toFixed(2)} kg</Text>
        <Text style={styles.resumoText}>K: {resumo.k.toFixed(2)} kg</Text>
        <Text style={styles.resumoText}>💰 Total: R$ {resumo.custo.toFixed(2)}</Text>
        <Text style={styles.resumoText}>R$/ha: {resumo.custoHa.toFixed(2)}</Text>
      </View>

      {/* Lista de etapas */}
      <FlatList data={etapas} keyExtractor={(item) => item.id} renderItem={renderItem} />

      {/* Botão adicionar */}
      <TouchableOpacity style={styles.fab} onPress={() => {/* navigation to create etapa screen */}}>
        <Text style={{ color: "#fff", fontSize: 24 }}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", padding: 16 },
  title: { color: "#fff", fontSize: 22, marginBottom: 12 },
  resumo: { backgroundColor: "#1e293b", padding: 14, borderRadius: 12, marginBottom: 12 },
  resumoText: { color: "#fff", marginBottom: 4 },
  card: { backgroundColor: "#1e293b", padding: 14, borderRadius: 12, marginBottom: 10 },
  nome: { color: "#22c55e", fontWeight: "bold", fontSize: 16 },
  info: { color: "#cbd5f5", marginTop: 4 },
  alerta: { color: "#f59e0b", marginTop: 6 },
  status: { color: "#94a3b8", marginTop: 6 },
  botaoAplicar: { backgroundColor: "#22c55e", padding: 10, borderRadius: 8, marginTop: 10, alignItems: "center" },
  fab: { position: "absolute", bottom: 20, right: 20, backgroundColor: "#22c55e", width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center" },
});
