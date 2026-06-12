const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Bundle .txt files as assets (What's New demo descriptions in app/demos/)
config.resolver.assetExts.push('txt');

module.exports = withNativeWind(config, { input: './app/globals.css'});
