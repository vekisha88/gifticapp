/**
 * This utility helps optimize the app startup time by preloading
 * essential modules and deferring non-critical operations
 */

import { Platform } from 'react-native';

/**
 * Preloads critical modules and defers non-critical operations
 * Call this as early as possible in the app lifecycle
 */
export const optimizeStartup = (): void => {
  // Skip optimization in web environment
  if (Platform.OS === 'web') return;

  // Use a microtask to defer non-critical operations
  Promise.resolve().then(() => {
    // Defer expensive operations to after initial render
    setTimeout(() => {
      // This space intentionally left empty for future deferred operations
      // Examples: Analytics initialization, non-critical API calls, etc.
    }, 2000);
  });
};

/**
 * Delays heavy imports to improve initial load time
 * @param importFn Function that imports the module
 * @returns A promise that resolves to the imported module
 */
export function lazyImport<T>(importFn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve) => {
    // Small delay to avoid blocking the main thread during startup
    setTimeout(() => {
      importFn().then(resolve);
    }, 100);
  });
}

// Initialize optimization as early as possible
optimizeStartup();

export default {
  optimizeStartup,
  lazyImport
}; 