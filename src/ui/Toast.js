import React, { useState, useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, DeviceEventEmitter, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

/**
 * Funções globais para exibir e esconder o Toast
 */
export const showToast = (message, type = 'success', duration = 2000) => {
    DeviceEventEmitter.emit('SHOW_TOAST', { message, type, duration });
};

export const hideToast = () => {
    DeviceEventEmitter.emit('HIDE_TOAST');
};

export default function Toast() {
    const [visible, setVisible] = useState(false);
    const [config, setConfig] = useState({ message: '', type: 'success' });
    const translateY = useRef(new Animated.Value(100)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const timerRef = useRef(null);

    useEffect(() => {
        const listenerShow = DeviceEventEmitter.addListener('SHOW_TOAST', ({ message, type, duration }) => {
            if (timerRef.current) clearTimeout(timerRef.current);

            setConfig({ message, type });
            setVisible(true);

            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 8,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                })
            ]).start();

            timerRef.current = setTimeout(() => {
                hide();
            }, duration);
        });

        const listenerHide = DeviceEventEmitter.addListener('HIDE_TOAST', () => {
            hide();
        });

        return () => {
            listenerShow.remove();
            listenerHide.remove();
        };
    }, []);

    const hide = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: 100,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            })
        ]).start(() => setVisible(false));
    };

    if (!visible) return null;

    const getTypeStyles = () => {
        switch (config.type) {
            case 'success': return { bg: styles.successBg, icon: "checkmark-circle" };
            case 'warning': return { bg: styles.warningBg, icon: "warning" };
            case 'error':
            default: return { bg: styles.errorBg, icon: "alert-circle" };
        }
    };

    const { bg, icon } = getTypeStyles();

    return (
        <Animated.View style={[
            styles.container,
            bg,
            { transform: [{ translateY }], opacity }
        ]}>
            <Ionicons name={icon} size={22} color="#FFF" />
            <Text style={styles.text}>{config.message}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        backgroundColor: '#111827',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
        zIndex: 9999,
    },
    successBg: {
        backgroundColor: '#059669', // Verde
    },
    errorBg: {
        backgroundColor: '#DC2626', // Vermelho
    },
    warningBg: {
        backgroundColor: '#D97706', // Laranja (warning)
    },
    text: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    }
});
