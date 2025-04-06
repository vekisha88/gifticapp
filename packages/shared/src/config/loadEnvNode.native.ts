/**
 * This is the React Native version of loadEnvNode, which does nothing
 * but provides an API-compatible implementation to avoid bundling errors.
 */

/**
 * Dummy loadEnvNode for React Native - does nothing
 */
export function loadEnvNode(packageName?: string): void {
  console.log('React Native environment detected, environment loading skipped');
}

// Export the same interface but with no-op implementation
export default { loadEnvNode }; 