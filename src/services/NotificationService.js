import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const NotificationService = {
    requestPermissions: async () => {
        const { status } = await Notifications.requestPermissionsAsync();
        return status === 'granted';
    },

    scheduleHarvestAlert: async (cultura, data) => {
        const trigger = new Date(data);
        trigger.setHours(8, 0, 0); // Alerta às 8 da manhã

        await Notifications.scheduleNotificationAsync({
            content: {
                title: "🌱 Hora de Colher!",
                body: `A colheita de ${cultura} está estimada para hoje. Prepare a equipe!`,
                data: { screen: 'Colheita' },
            },
            trigger,
        });
    },

    scheduleCarenciaAlert: async (produto, talhao, dataLib) => {
        const trigger = new Date(dataLib);
        trigger.setHours(7, 0, 0);

        await Notifications.scheduleNotificationAsync({
            content: {
                title: "⚠️ Carência Finalizada",
                body: `O talhão ${talhao} está livre de carência (Produto: ${produto}).`,
                data: { screen: 'Monitoramento' },
            },
            trigger,
        });
    }
};
