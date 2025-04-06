// This is a shim for the Node.js fs module in React Native
export default {
  existsSync: () => false,
  readFileSync: () => '',
  // Add other fs methods as needed, with no-op implementations
}; 