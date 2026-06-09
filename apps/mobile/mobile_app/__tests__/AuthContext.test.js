import React from 'react';
import { render } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { Text } from 'react-native';

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
}));
jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(() => Promise.resolve(null)),
    setItemAsync: jest.fn(() => Promise.resolve()),
    deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

const MockChild = () => {
    const { user } = useAuth();
    return <Text testID="user-text">{user ? user.nome : 'NO_USER'}</Text>;
};

describe('AuthContext Integration', () => {
    it('should provide a null user initially', async () => {
        const { getByTestId } = render(
            <AuthProvider>
                <MockChild />
            </AuthProvider>
        );
        expect(getByTestId('user-text').props.children).toBe('NO_USER');
    });
});
