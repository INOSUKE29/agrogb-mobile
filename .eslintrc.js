module.exports = {
    extends: [
        'plugin:react/recommended',
        'plugin:react-native/all'
    ],
    env: {
        'react-native/react-native': true,
        'es2021': true
    },
    parserOptions: {
        ecmaVersion: 2021,
        ecmaFeatures: {
            jsx: true
        },
        sourceType: 'module'
    },
    plugins: [
        'react',
        'react-native',
        'import'
    ],
    rules: {
        'react-native/no-inline-styles': 'off', // Allow for now
        'react-native/no-color-literals': 'off', // Allow hex codes
        'react-native/sort-styles': 'off',
        'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
        'no-undef': 'error', // Critical: undefined variables -> Crash
        'import/no-unresolved': 'off', // Native resolution is tricky in plain ESLint
        'react/prop-types': 'off'
    },
    globals: {
        '__DEV__': 'readonly',
        'module': 'readonly',
        'require': 'readonly',
        'console': 'readonly',
        'process': 'readonly',
        'setTimeout': 'readonly',
        'clearTimeout': 'readonly',
        'setInterval': 'readonly',
        'clearInterval': 'readonly',
        'global': 'readonly',
        'Promise': 'readonly',
        'alert': 'readonly' // React Native Alert
    }
};
