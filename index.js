import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import { Alert } from 'react-native';

import App from './App';

// catch any errors globalmente antes do app inicializar
const defaultErrorHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.log('Global Error Handler Triggered:', error);

    // Mostra erro fatal em popup nativo caso falhe o mount da tela do ErrorBoundary
    if (isFatal) {
        Alert.alert(
            "Erro Fatal no Startup",
            `Detalhe do erro: ${error.message}\n\nTire print desta tela e reporte.`,
            [{ text: "Tentar Continuar" }]
        );
    }

    defaultErrorHandler(error, isFatal);
});

registerRootComponent(App);
