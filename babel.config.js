module.exports = function (api) {
  api.cache(true);
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Add reanimated support
      'react-native-reanimated/plugin',
      
      // Add a plugin to replace Node.js module imports with empty objects
      ['module-resolver', {
        alias: {
          // These modules should be empty in React Native
          'fs': './src/utils/empty-module.js',
          'path': './src/utils/empty-module.js',
          'dotenv': './src/utils/empty-module.js',
          
          // This will prevent importing the loadEnvNode module
          './loadEnvNode': './src/utils/empty-module.js',
          './config/loadEnvNode': './src/utils/empty-module.js',
          './node/loadEnvNode': './src/utils/empty-module.js'
        }
      }]
    ].filter(Boolean),
    env: {
      production: {
        // Optimize for production
        plugins: ['transform-remove-console']
      }
    }
  };
}; 