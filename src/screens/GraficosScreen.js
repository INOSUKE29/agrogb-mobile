import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { executeQuery } from '../database/database';

const { width } = Dimensions.get('window');

export default function GraficosScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    
    // Estados para os dados dos gráficos
    const [prodSemanal, setProdSemanal] = useState([0, 0, 0, 0, 0]); // Seg a Sex
    const [finMensal, setFinMensal] = useState({ vendas: 0, custos: 0, lucro: 0 });
    const [custosCat, setCustosCat] = useState([]);
    const [prodCultura, setProdCultura] = useState({ labels: ['Sem Dados'], data: [0] });

    // Carregar dados sempre que a tela ganhar foco
    useFocusEffect(
        useCallback(() => {
            loadAllData();
        }, [])
    );

    const loadAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchProducaoSemanal(),
                fetchFinanceiroMensal(),
                fetchDistribuicaoCustos(),
                fetchProducaoPorCultura()
            ]);
        } catch (error) {
            console.error("Erro ao carregar gráficos:", error);
        } finally {
            setLoading(false);
        }
    };

    // 1. Produção Semanal (Segunda a Sexta) - Baseado na coluna data_colheita (ou data)
    const fetchProducaoSemanal = async () => {
        // SQLite não tem WEEKDAY ou extract DOW direto de forma universal sem strftime com 'w'
        // strftime('%w', data) -> 0=Domingo, 1=Segunda ... 6=Sábado
        // Vamos buscar colheitas dos últimos 7 dias e mapear no JS para focar Segunda a Sexta.
        const query = `
            SELECT quantidade, strftime('%w', data) as dia_semana 
            FROM colheitas 
            WHERE is_deleted = 0 
            AND date(data) >= date('now', '-7 days')
        `;
        const result = await executeQuery(query);
        
        // Mapear: Seg=1, Ter=2, Qua=3, Qui=4, Sex=5
        let seg=0, ter=0, qua=0, qui=0, sex=0;

        for (let i = 0; i < result.rows.length; i++) {
            const row = result.rows.item(i);
            const qtd = parseFloat(row.quantidade) || 0;
            switch(row.dia_semana) {
                case '1': seg += qtd; break;
                case '2': ter += qtd; break;
                case '3': qua += qtd; break;
                case '4': qui += qtd; break;
                case '5': sex += qtd; break;
                // Ignora sáb(6) e dom(0) para este card específico
            }
        }
        
        setProdSemanal([seg, ter, qua, qui, sex]);
    };

    // 2. Financeiro do Mês Atual (Vendas vs Custos)
    const fetchFinanceiroMensal = async () => {
        // Total de vendas no mês atual
        const vendasQ = await executeQuery(`
            SELECT SUM(valor) as total_vendas 
            FROM vendas 
            WHERE is_deleted = 0 
            AND strftime('%Y-%m', data) = strftime('%Y-%m', 'now')
        `);
        const total_vendas = parseFloat(vendasQ.rows.item(0)?.total_vendas) || 0;

        // Total de custos/compras no mês atual (considerando a tabela 'compras')
        const comprasQ = await executeQuery(`
            SELECT SUM(valor) as total_compras 
            FROM compras 
            WHERE is_deleted = 0 
            AND strftime('%Y-%m', data) = strftime('%Y-%m', 'now')
        `);
        const total_custos = parseFloat(comprasQ.rows.item(0)?.total_compras) || 0;

        const lucro = total_vendas - total_custos;

        setFinMensal({ vendas: total_vendas, custos: total_custos, lucro });
    };

    // 3. Distribuição de Custos (PieChart)
    const fetchDistribuicaoCustos = async () => {
        // Vamos usar a tabela de custos profissionais se houver dados, senão agrupamos a tabela de 'compras' genérica.
        // O prompt cita "Adubação, Insumos, Mão de obra, Transporte", vamos tentar capturar categorias_despesa ou usar o campo 'observacao' / 'tipo'
        
        // Estratégia híbrida: Tentar pegar da tabela 'costs' (V8), se vazio pega da tabela 'compras'.
        // Como o app tem a V8 implementada:
        const catQuery = await executeQuery(`
            SELECT cc.name as categoria, SUM(c.total_value) as total
            FROM costs c
            JOIN cost_categories cc ON c.category_id = cc.id
            WHERE c.is_deleted = 0 AND strftime('%Y-%m', c.created_at) = strftime('%Y-%m', 'now')
            GROUP BY cc.name
        `);

        if (catQuery.rows.length > 0) {
            const cores = ['#22C55E', '#F97316', '#3B82F6', '#EF4444', '#EAB308', '#A855F7', '#EC4899'];
            let distribuicao = [];
            for (let i = 0; i < catQuery.rows.length; i++) {
                const item = catQuery.rows.item(i);
                distribuicao.push({
                    name: item.categoria,
                    total: parseFloat(item.total) || 0,
                    color: cores[i % cores.length],
                    legendFontColor: "#FFFFFF",
                    legendFontSize: 11
                });
            }
            setCustosCat(distribuicao);
        } else {
            // Se não usar a tabela nova, tenta agrupar a coluna 'item' ou 'cultura' da tabela 'compras'
            const genericQuery = await executeQuery(`
                SELECT item as categoria, SUM(valor) as total
                FROM compras
                WHERE is_deleted = 0
                GROUP BY item
                ORDER BY total DESC
                LIMIT 5
            `);
            const cores = ['#22C55E', '#F97316', '#3B82F6', '#EF4444', '#EAB308'];
            let distribuicao = [];
            for (let i = 0; i < genericQuery.rows.length; i++) {
                const item = genericQuery.rows.item(i);
                distribuicao.push({
                    name: (item.categoria || 'Outros').substring(0, 15),
                    total: parseFloat(item.total) || 0,
                    color: cores[i % cores.length],
                    legendFontColor: "#FFFFFF",
                    legendFontSize: 11
                });
            }
            
            // Fallback se não tiver nada
            if (distribuicao.length === 0) {
                 distribuicao = [
                     { name: 'Adubação', total: 0, color: '#22C55E', legendFontColor: '#FFF', legendFontSize: 11 },
                     { name: 'Insumos', total: 0, color: '#F97316', legendFontColor: '#FFF', legendFontSize: 11 }
                 ];
            }
            
            setCustosCat(distribuicao);
        }
    };

    // 4. Produção por Cultura (BarChart)
    const fetchProducaoPorCultura = async () => {
        const query = await executeQuery(`
            SELECT cultura, SUM(quantidade) as total
            FROM colheitas
            WHERE is_deleted = 0
            GROUP BY cultura
            ORDER BY total DESC
            LIMIT 5
        `);
        
        const labels = [];
        const data = [];
        
        for (let i = 0; i < query.rows.length; i++) {
            const item = query.rows.item(i);
            labels.push((item.cultura || 'Geral').substring(0, 8)); // Abrevia o nome
            data.push(parseFloat(item.total) || 0);
        }

        if (labels.length === 0) {
            labels.push('Sem Dados');
            data.push(0);
        }

        setProdCultura({ labels, data });
    };

    // Chart configs
    const chartConfig = {
        backgroundGradientFrom: '#243447',
        backgroundGradientTo: '#243447',
        color: () => `rgba(255, 255, 255, 1)`,
        labelColor: () => `rgba(255, 255, 255, 1)`,
        strokeWidth: 3, 
        barPercentage: 0.6,
        useShadowColorFromDataset: false,
        propsForVerticalLabels: { fontSize: 10 },
        propsForHorizontalLabels: { fontSize: 10 }
    };

    return (
        <AppContainer style={{ backgroundColor: '#0B1F35' }}>
            <ScreenHeader 
                title="GRÁFICOS" 
                subtitle="Análise da produção e financeiro"
                onBack={() => navigation?.goBack()} 
            />

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#22C55E" />
                </View>
            ) : (
                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* CARD 1 - Produção Semanal */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Produção Semanal (kg)</Text>
                        <LineChart
                            data={{
                                labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
                                datasets: [{ data: prodSemanal }]
                            }}
                            width={width - 64} // padding 16*2 + inner padding
                            height={220}
                            yAxisSuffix=""
                            chartConfig={{
                                ...chartConfig,
                                color: () => `rgba(34, 197, 94, 1)`, // #22C55E
                            }}
                            bezier
                            style={styles.chartStyle}
                        />
                    </View>

                    {/* CARD 2 - Financeiro Mensal */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Financeiro do mês</Text>
                        <BarChart
                            data={{
                                labels: ['Vendas', 'Custos', 'Lucro'],
                                datasets: [{
                                    data: [finMensal.vendas, finMensal.custos, finMensal.lucro],
                                    colors: [
                                        () => `#22C55E`, // Vendas: Verde
                                        () => `#EF4444`, // Custos: Vermelho
                                        () => `#3B82F6`  // Lucro: Azul
                                    ]
                                }]
                            }}
                            width={width - 64}
                            height={220}
                            yAxisLabel="R$"
                            chartConfig={chartConfig}
                            withCustomBarColorFromData={true}
                            flatColor={true}
                            style={styles.chartStyle}
                        />
                    </View>

                    {/* CARD 3 - Distribuição de Custos */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Distribuição de custos</Text>
                        <PieChart
                            data={custosCat}
                            width={width - 64}
                            height={200}
                            chartConfig={chartConfig}
                            accessor={"total"}
                            backgroundColor={"transparent"}
                            paddingLeft={"15"}
                            center={[0, 0]}
                            absolute
                        />
                    </View>

                    {/* CARD 4 - Produção por Cultura */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Produção por cultura</Text>
                        <BarChart
                            data={{
                                labels: prodCultura.labels,
                                datasets: [{ data: prodCultura.data }]
                            }}
                            width={width - 64}
                            height={220}
                            yAxisSuffix="kg"
                            chartConfig={{
                                ...chartConfig,
                                color: () => `rgba(59, 130, 246, 1)`, // Azul genérico
                            }}
                            style={styles.chartStyle}
                        />
                    </View>
                    
                    <View style={{ height: 40 }} />
                </ScrollView>
            )}
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40
    },
    card: {
        backgroundColor: '#243447',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 4,               // Android shadow
        shadowColor: "#000",        // iOS shadow start
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.10,
        shadowRadius: 8,            // iOS shadow end
        alignItems: 'center'
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 16,
        alignSelf: 'flex-start',
        letterSpacing: 0.5
    },
    chartStyle: {
        borderRadius: 16,
        alignSelf: 'center',
    }
});
