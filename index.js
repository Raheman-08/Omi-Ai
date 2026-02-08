/**
 * @format
 * First line: set global.require for Hermes/SDK 53.
 */
require('./metro-require-shim.js');
require('react-native-url-polyfill/auto');
const { registerRootComponent } = require('expo');
const App = require('./App').default;
registerRootComponent(App);
