import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export default function SkeletonDashboard() {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const Block = ({ style }) => <Animated.View style={[styles.block, style, { opacity }]} />;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Block style={styles.avatar} />
                <View style={{ flex: 1 }}>
                    <Block style={styles.lineSmall} />
                    <Block style={styles.lineMedium} />
                </View>
            </View>

            <View style={styles.card}>
                <Block style={styles.lineMedium} />
                <Block style={styles.lineLarge} />
                <View style={styles.row}>
                    <Block style={styles.halfLine} />
                    <Block style={styles.halfLine} />
                </View>
            </View>

            <View style={styles.grid}>
                {[1, 2, 3, 4].map(i => (
                    <Block key={i} style={styles.gridItem} />
                ))}
            </View>

            <View style={styles.footer}>
                <Block style={styles.lineSmall} />
                <Block style={styles.cardSmall} />
                <Block style={styles.cardSmall} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    block: { backgroundColor: '#E5E7EB', borderRadius: 8 },
    header: { height: 180, backgroundColor: '#D1D5DB', paddingHorizontal: 20, paddingTop: 60, flexDirection: 'row', alignItems: 'center', gap: 15 },
    avatar: { width: 45, height: 45, borderRadius: 22.5 },
    lineSmall: { width: 60, height: 10, marginBottom: 8 },
    lineMedium: { width: 120, height: 14, marginBottom: 8 },
    lineLarge: { width: '80%', height: 25, marginBottom: 20 },
    card: { marginHorizontal: 20, marginTop: -30, height: 180, backgroundColor: '#FFF', borderRadius: 20, padding: 20, elevation: 5 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
    halfLine: { width: '45%', height: 40 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 15, justifyContent: 'space-between' },
    gridItem: { width: '48%', height: 120, marginBottom: 15, backgroundColor: '#FFF', borderRadius: 15 },
    footer: { paddingHorizontal: 20 },
    cardSmall: { width: '100%', height: 80, marginBottom: 12, backgroundColor: '#FFF', borderRadius: 15 }
});
