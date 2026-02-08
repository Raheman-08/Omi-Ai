const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');

/**
 * Required for Expo SDK 53 / RN 0.79:
 * - unstable_enablePackageExports = false (fixes require not defined)
 * - resolveRequest: resolve @babel/runtime/* so "Unknown named module" is fixed when exports are disabled
 */
let config = getDefaultConfig(__dirname);
config = wrapWithReanimatedMetroConfig(config);
config.resolver ??= {};
config.resolver.unstable_enablePackageExports = false;
// Force empty module to resolve from project root (avoids metro-config/node_modules/metro-runtime path)
config.resolver.emptyModulePath = require.resolve('metro-runtime/src/modules/empty-module.js', {
  paths: [__dirname],
});

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@babel/runtime/')) {
    try {
      const resolved = require.resolve(moduleName, { paths: [context.originModulePath || __dirname] });
      return { type: 'sourceFile', filePath: resolved };
    } catch {
      // fall through to default
    }
  }
  const defaultResolve = context.resolveRequest;
  if (typeof defaultResolve !== 'function') {
    throw new Error(`Metro custom resolver: context.resolveRequest is not a function (got ${typeof defaultResolve}). Cannot delegate for "${moduleName}".`);
  }
  const result = defaultResolve(context, moduleName, platform);
  if (result == null) {
    throw new Error(`Metro resolver returned null for "${moduleName}" (origin: ${context.originModulePath}). Metro requires a resolution object with .type.`);
  }
  return result;
};

const requireShimPath = path.resolve(__dirname, 'metro-require-shim.js');
const originalGetModulesRunBeforeMainModule = config.serializer?.getModulesRunBeforeMainModule;
config.serializer ??= {};
config.serializer.getModulesRunBeforeMainModule = () => {
  const before = originalGetModulesRunBeforeMainModule
    ? originalGetModulesRunBeforeMainModule()
    : [];
  return [requireShimPath, ...before];
};

module.exports = config;
