import { Platform } from 'react-native';

export const TYPOGRAPHY = {
    family: {
        regular: Platform.OS === 'ios' ? 'System' : 'Roboto',
        medium: Platform.OS === 'ios' ? 'System' : 'Roboto',
        bold: Platform.OS === 'ios' ? 'System' : 'Roboto',
        black: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    size: {
        xxs: 10,
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 20,
        xxl: 24,
        title: 26,
    },
    weight: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        heavy: '800',
        black: '900',
    }
};
