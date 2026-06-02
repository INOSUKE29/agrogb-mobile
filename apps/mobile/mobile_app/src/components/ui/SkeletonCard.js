import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export default function SkeletonCard({ height = 120, width = '100%', borderRadius = 24, style }) {
    const { colors, isDark } = useTheme();
    const pulseAnim = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 0.8,
                    duration: 1200, // Smoother pulse
                    useNativeDriver: true
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.4,
                    duration: 1200,
                    useNativeDriver: true
                })
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [pulseAnim]);

    return (
        <View style={[
            styles.container,
            { 
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9', // Matching the new input/card bg
                height, 
                width, 
                borderRadius,
                borderColor: colors.border,
                borderWidth: 1.5,
            },
            style
        ]}>
            <Animated.View style={[
                styles.pulse,
                { 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', 
                    opacity: pulseAnim 
                }
            ]} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        overflow: 'hidden',
        position: 'relative',
    },
    pulse: {
        flex: 1,
    }
});
