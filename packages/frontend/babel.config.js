module.exports = function (api) {
  api.cache(true);
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Optimize imports
      [
        'transform-inline-environment-variables',
        {
          include: ['NODE_ENV', 'API_URL']
        }
      ],
      // Add module resolver for Node.js module shims
      [
        'module-resolver',
        {
          alias: {
            fs: './shims/fs.js',
            path: './shims/path.js',
            dotenv: './shims/dotenv.js'
          }
        }
      ],
      // Add reanimated support
      'react-native-reanimated/plugin'
    ].filter(Boolean),
    env: {
      production: {
        // Optimize for production
        plugins: ['transform-remove-console']
      }
    }
  };
}; 