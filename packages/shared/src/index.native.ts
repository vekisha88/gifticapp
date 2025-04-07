// React Native specific entry point

// Re-export types
export * from './types';

// Export config
export * from './config/appConfig';

// Export error codes
export * from './errors/errorCodes';

// Note: This file selectively exports only what's compatible with React Native.
// No Node.js specific functionality should be exported here.

// Shared components, hooks, utils, types etc. specific to React Native environment

// Re-export standard shared items
export * from './index';

// Potentially override or add RN-specific implementations here
// Example: If there was an RN-specific utility or component
// export { default as RNSpecificUtil } from './utils/rnSpecificUtil';

// Update type export path if necessary (though ./index already exports the correct path now)
// export * from './types.ts'; // Old path (remove if present)
// Ensure './types/index' is effectively exported via './index' 