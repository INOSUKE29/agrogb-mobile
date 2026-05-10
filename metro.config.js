// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// WORKAROUND MÁXIMO PRO WINDOWS (node:sea) - Apenas se o arquivo existir para não quebrar o CI
try {
    const mockPath = './mock-sea.js';
    if (require('fs').existsSync(mockPath)) {
        config.resolver.extraNodeModules = {
            ...config.resolver.extraNodeModules,
            'node:sea': require.resolve(mockPath),
        };
    }
} catch (e) {
    console.warn('⚠️ Aviso: Falha ao carregar mock-sea.js');
}

// Limitar workers para economizar memória no CI
config.maxWorkers = 1;

module.exports = config;
