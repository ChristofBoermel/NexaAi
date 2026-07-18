const { getDefaultConfig } = require('expo/metro-config')
const { withSentryConfig } = require('@sentry/react-native/metro')
const { withNativeWind } = require('nativewind/metro')

const config = getDefaultConfig(__dirname)

module.exports = withSentryConfig(withNativeWind(config, { input: './global.css' }))
