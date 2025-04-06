// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // Enable optimizations
  transformer: {
    minifierPath: 'metro-minify-terser',
    minifierConfig: {
      // Speed up initial load by disabling some transformations
      keep_fnames: true,
      mangle: false,
      compress: false
    }
  },
  resolver: {
    // Optimize asset resolution
    assetExts: ['bin', 'txt', 'jpg', 'png', 'ttf'],
    sourceExts: ['js', 'jsx', 'json', 'ts', 'tsx', 'cjs'],
    
    // Explicitly block problematic Node.js modules and files
    blockList: [
      // Block Node.js core modules
      /\/node_modules\/fs\//,
      /\/node_modules\/path\//,
      /\/node_modules\/dotenv\/.*\.js/,
      
      // Block the Node.js specific file in shared package
      /.*loadEnvNode\.js$/,
      /.*loadEnvNode\.ts$/,
      /.*\/node\/.*\.js$/, // Block any files in the 'node' directory
      /.*\/config\/node\/.*\.js$/,

      // For even safer exclusion, block specific path patterns
      new RegExp(path.join('shared', 'dist', 'esm', 'config', 'node').replace(/\\/g, '\\\\')),
      new RegExp(path.join('shared', 'dist', 'esm', 'config', 'loadEnvNode.js').replace(/\\/g, '\\\\'))
    ],
    
    // Provide empty versions of Node.js modules
    extraNodeModules: {
      'fs': path.resolve(__dirname, 'src/utils/empty-module.js'),
      'path': path.resolve(__dirname, 'src/utils/empty-module.js'),
      'dotenv': path.resolve(__dirname, 'src/utils/empty-module.js')
    }
  },
  maxWorkers: 4,
  // Increase caching for faster reloads
  cacheStores: [],
  // Decrease the timeout to speed up connection
  server: {
    port: 8081,
    enhanceMiddleware: (middleware) => {
      return middleware;
    }
  }
});

// Enable symlinks for monorepo structure
config.resolver.disableHierarchicalLookup = true;
config.watchFolders = [
  // Add path to shared package
  ...(config.watchFolders || []),
];

module.exports = config; 