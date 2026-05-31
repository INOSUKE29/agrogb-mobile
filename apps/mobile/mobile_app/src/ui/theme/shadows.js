import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const SHADOWS = {
    light: isWeb ? {
        boxShadow: '0px 2px 10px rgba(31, 41, 55, 0.08)'
    } : {
        shadowColor: '#1F2937',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 2,
    },
    medium: isWeb ? {
        boxShadow: '0px 4px 15px rgba(31, 41, 55, 0.12)'
    } : {
        shadowColor: '#1F2937',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 15,
        elevation: 4,
    },
    heavy: isWeb ? {
        boxShadow: '0px 8px 25px rgba(31, 41, 55, 0.15)'
    } : {
        shadowColor: '#1F2937',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 25,
        elevation: 8,
    },
    glow: isWeb ? {
        boxShadow: '0px 0px 12px rgba(34, 197, 94, 0.4)'
    } : {
        shadowColor: '#22C55E',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 5,
    }
};
