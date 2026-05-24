import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../../context/ThemeContext';
import Card from '../common/Card';

const { width } = Dimensions.get('window');

export default function ProductionChart({ data }) {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};

    if (!data || !data.labels || data.labels.length === 0) return null;

    const bgGradient = activeColors.card || '#FFFFFF';
    const primaryColor = activeColors.primary || '#10B981';
    
    // Cores de rótulo e grade reativas por tema
    const labelColorOpacity = theme?.theme_mode === 'dark' 
        ? (opacity = 1) => `rgba(248, 250, 252, ${opacity * 0.6})`
        : (opacity = 1) => `rgba(15, 23, 42, ${opacity * 0.6})`;

    const gridColorOpacity = theme?.theme_mode === 'dark'
        ? (opacity = 1) => `rgba(30, 41, 59, ${opacity * 0.5})`
        : (opacity = 1) => `rgba(226, 232, 240, ${opacity * 0.5})`;

    return (
        <Card style={styles.container}>
            <Text style={[styles.title, { color: activeColors.textMuted || '#9CA3AF' }]}>PRODUÇÃO (ÚLTIMOS 7 DIAS)</Text>
            <LineChart
                data={data}
                width={width - 70}
                height={180}
                chartConfig={{
                    backgroundColor: bgGradient,
                    backgroundGradientFrom: bgGradient,
                    backgroundGradientTo: bgGradient,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                    labelColor: labelColorOpacity,
                    propsForBackgroundLines: {
                        stroke: gridColorOpacity(0.5),
                        strokeDasharray: '', // Grade sólida sutil
                    },
                    style: { borderRadius: 16 },
                    propsForDots: { r: "4", strokeWidth: "2", stroke: primaryColor }
                }}
                bezier
                style={{ marginVertical: 8, borderRadius: 16 }}
            />
        </Card>
    );
}

const styles = StyleSheet.create({
    container: { marginHorizontal: 20, marginBottom: 20, padding: 15 },
    title: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10 }
});
