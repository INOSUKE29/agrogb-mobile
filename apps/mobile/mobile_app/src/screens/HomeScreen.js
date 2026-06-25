import React from 'react';
import { useAuth } from '../context/AuthContext';
import HomeAgricultorScreen from './HomeAgricultorScreen';
import HomeAgronomoScreen from './HomeAgronomoScreen';

export default function HomeScreen(props) {
    const { role } = useAuth();
    
    // Dispatcher Arquitetural: Isola completamente os perfis em arquivos separados
    if (role === 'AGRONOMO') {
        return <HomeAgronomoScreen {...props} />;
    }
    
    return <HomeAgricultorScreen {...props} />;
}
