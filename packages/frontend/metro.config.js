// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for monorepo structure
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Make all packages in the monorepo visible to Metro
config.resolver.disableHierarchicalLookup = true;

// Add aliases for Node.js modules that don't exist in React Native
config.resolver.extraNodeModules = {
  fs: path.resolve(__dirname, 'shims/fs.js'),
  path: path.resolve(__dirname, 'shims/path.js'),
  dotenv: path.resolve(__dirname, 'shims/dotenv.js'),
};

// Add a resolver for the .js extension precedence for shared package components
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'cjs', 'json'];

module.exports = config; 