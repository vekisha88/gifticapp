// This is a shim for the Node.js path module in React Native
export default {
  join: (...args) => args.join('/'),
  dirname: (path) => {
    const parts = path.split('/');
    parts.pop();
    return parts.join('/');
  },
  parse: (path) => ({
    root: '/',
    dir: '/',
    base: path.split('/').pop(),
    ext: '',
    name: path.split('/').pop(),
  }),
  // Add other path methods as needed
}; 