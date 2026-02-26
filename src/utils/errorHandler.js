import { Alert } from 'react-native';

/**
 * Global Error Handler Helper
 * Centralizes error logging and user notification.
 */

export const handleError = (error, context = '') => {
    // 1. Log to Console (Dev)
    console.error(`[Error] ${context}:`, error);

    // 2. Log to Sentry or Analytics (Future Integration)
    // if (Sentry) Sentry.captureException(error);

    // 3. Notify User (Friendly Message)
    let userMessage = 'Ocorreu um erro inesperado. Tente novamente.';

    if (error.message) {
        if (error.message.includes('Network')) userMessage = 'Sem conexão com a internet. Verifique sua rede.';
        if (error.message.includes('auth')) userMessage = 'Sessão expirada ou inválida. Faça login novamente.';
        if (error.message.includes('permission')) userMessage = 'Permissão negada.';
    }

    Alert.alert('Atenção', userMessage);
};

export const wrapAsync = (fn, context) => async (...args) => {
    try {
        await fn(...args);
    } catch (error) {
        handleError(error, context);
    }
};
