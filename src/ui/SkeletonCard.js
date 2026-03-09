import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function SkeletonCard({ height = 100, width = '100%', borderRadius = 10, style }) {
    const { colors } = useTheme();
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true
                })
            ])
        ).start();
    }, [opacity]);

    return (
        <Animated.View style={[
            styles.skeleton,
            { backgroundColor: colors.border, height, width, borderRadius, opacity },
            style
        ]} />
    );
}

const styles = StyleSheet.create({
    skeleton: {
        marginBottom: 12,
        overflow: 'hidden',
    }
});
