const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure polyfills are loaded first
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;