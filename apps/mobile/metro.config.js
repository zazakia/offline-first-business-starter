const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)

// Resolve workspaces/symlinks properly
config.resolver = {
  ...config.resolver,
  unstable_enableSymlinks: true,
  extraNodeModules: {
    ...config.resolver.extraNodeModules,
  },
  nodeModulesPaths: [
    path.resolve(__dirname, 'node_modules'),
    path.resolve(__dirname, '../../node_modules'),
  ],
  sourceExts: [...config.resolver.sourceExts, 'mjs'],
}

module.exports = config
