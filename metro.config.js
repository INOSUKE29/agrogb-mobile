// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// WORKAROUND MÁXIMO PRO WINDOWS (node:sea)
config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    'node:sea': require.resolve('./mock-sea.js'),
};

module.exports = config;
