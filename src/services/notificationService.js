import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configura como a notificação aparece quando o app está aberto em primeiro plano
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

/**
 * Solicita permissão e retorna o Expo Push Token
 */
export async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#1B5E20',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
            console.log('[Push] Permissão para notificações foi negada!');
            return null;
        }

        try {
            // Usa o project ID caso exista, senão tenta resolver automático
            const tokenData = await Notifications.getExpoPushTokenAsync();
            token = tokenData.data;
            console.log('[Push] Expo Push Token obtido:', token);
        } catch (e) {
            console.log('[Push] Erro ao obter Token:', e);
        }
    } else {
        console.log('[Push] Notificações Push requerem um dispositivo físico (não funciona bem em emuladores).');
    }

    return token;
}

/**
 * Envia Notificação Push via API do Expo (Para o MVP, a ser migrado para o backend no futuro)
 */
export async function sendPushNotification(expoPushToken, title, body, data = {}) {
    const message = {
        to: expoPushToken,
        sound: 'default',
        title: title,
        body: body,
        data: data,
    };

    try {
        await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });
        console.log('[Push] Notificação enviada com sucesso para:', expoPushToken);
    } catch (e) {
        console.log('[Push] Erro ao enviar notificação:', e);
    }
}
