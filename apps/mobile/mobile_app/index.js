import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';

import App from './App';

// catch any errors (opcional, removido ErrorUtils legada p/ conformidade Expo 50)
// registerRootComponent cuida do erro básico, monitoramento real deve ser via Sentry.

registerRootComponent(App);
