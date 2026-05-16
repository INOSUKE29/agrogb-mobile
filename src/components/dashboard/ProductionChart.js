import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Card from '../common/Card';

const { width } = Dimensions.get('window');

export default function ProductionChart({ data }) {
    if (!data || !data.labels || data.labels.length === 0) return null;

    return (
        <Card style={styles.container}>
            <Text style={styles.title}>PRODUÇÃO (ÚLTIMOS 7 DIAS)</Text>
            <LineChart
                data={data}
                width={width - 60}
                height={180}
                chartConfig={{
                    backgroundColor: "#FFF",
                    backgroundGradientFrom: "#FFF",
                    backgroundGradientTo: "#FFF",
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                    style: { borderRadius: 16 },
                    propsForDots: { r: "4", strokeWidth: "2", stroke: "#10B981" }
                }}
                bezier
                style={{ marginVertical: 8, borderRadius: 16 }}
            />
        </Card>
    );
}

const styles = StyleSheet.create({
    container: { marginHorizontal: 20, marginBottom: 20, padding: 15 },
    title: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 10 }
});
