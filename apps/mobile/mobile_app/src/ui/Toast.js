import { Platform, Alert } from 'react-native';

/**
 * showToast - Feedback Visual Rápido e Não Bloqueante 📡🔔
 * Utiliza o ToastAndroid nativo no Android para avisos de sistema,
 * e Alert amigável no iOS/Web de forma a manter o fluxo resiliente.
 */
export function showToast(message) {
    if (!message) return;
    
    if (Platform.OS === 'android') {
        try {
            const { ToastAndroid } = require('react-native');
            ToastAndroid.show(message, ToastAndroid.SHORT);
        } catch (e) {
            console.log(`[AgroGB Toast Android Error] ${message}`);
        }
    } else {
        console.log(`[AgroGB Toast] ${message}`);
        // Alerta não bloqueante rápido para iOS e Web
        Alert.alert(
            'AgroGB',
            message,
            [{ text: 'OK', style: 'cancel' }],
            { cancelable: true }
        );
    }
}
