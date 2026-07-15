const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)
const workspaceRoot = path.resolve(__dirname, '../..')
const workspaceModules = {
  '@repo/core': 'packages/core/src/index.ts',
  '@repo/db-expo-sqlite': 'packages/db-adapter-expo-sqlite/src/index.ts',
  '@repo/entity-appointment': 'packages/entity-appointment/src/index.ts',
  '@repo/entity-billing': 'packages/entity-billing/src/index.ts',
  '@repo/entity-customer': 'packages/entity-customer/src/index.ts',
  '@repo/entity-department': 'packages/entity-department/src/index.ts',
  '@repo/entity-doctor': 'packages/entity-doctor/src/index.ts',
  '@repo/entity-inventory': 'packages/entity-inventory/src/index.ts',
  '@repo/entity-medical-record': 'packages/entity-medical-record/src/index.ts',
  '@repo/entity-patient': 'packages/entity-patient/src/index.ts',
  '@repo/entity-prescription': 'packages/entity-prescription/src/index.ts',
  '@repo/ui-core': 'packages/ui-core/src/index.ts',
}

// Resolve workspaces/symlinks properly
config.watchFolders = [workspaceRoot]
config.resolver = {
  ...config.resolver,
  unstable_enableSymlinks: true,
  extraNodeModules: {
    ...config.resolver.extraNodeModules,
    '@repo/core': path.join(workspaceRoot, 'packages/core'),
    '@repo/db-expo-sqlite': path.join(workspaceRoot, 'packages/db-adapter-expo-sqlite'),
    '@repo/entity-appointment': path.join(workspaceRoot, 'packages/entity-appointment'),
    '@repo/entity-billing': path.join(workspaceRoot, 'packages/entity-billing'),
    '@repo/entity-customer': path.join(workspaceRoot, 'packages/entity-customer'),
    '@repo/entity-department': path.join(workspaceRoot, 'packages/entity-department'),
    '@repo/entity-doctor': path.join(workspaceRoot, 'packages/entity-doctor'),
    '@repo/entity-inventory': path.join(workspaceRoot, 'packages/entity-inventory'),
    '@repo/entity-medical-record': path.join(workspaceRoot, 'packages/entity-medical-record'),
    '@repo/entity-patient': path.join(workspaceRoot, 'packages/entity-patient'),
    '@repo/entity-prescription': path.join(workspaceRoot, 'packages/entity-prescription'),
    '@repo/ui-core': path.join(workspaceRoot, 'packages/ui-core'),
  },
  nodeModulesPaths: [
    path.resolve(__dirname, 'node_modules'),
    path.resolve(__dirname, '../../node_modules'),
  ],
  sourceExts: [...config.resolver.sourceExts, 'mjs'],
  resolveRequest(context, moduleName, platform) {
    if (moduleName.startsWith('@babel/runtime/')) {
      return {
        type: 'sourceFile',
        filePath: path.join(__dirname, 'node_modules', `${moduleName}.js`),
      }
    }

    const source = workspaceModules[moduleName]
    if (source) {
      return { type: 'sourceFile', filePath: path.join(workspaceRoot, source) }
    }

    return context.resolveRequest(context, moduleName, platform)
  },
}

module.exports = config
