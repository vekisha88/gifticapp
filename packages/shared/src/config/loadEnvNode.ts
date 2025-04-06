/**
 * This file contains Node.js-specific code for loading environment variables.
 * It is separated from the main module to avoid bundling issues in React Native.
 * This file should only be imported dynamically in a Node.js environment.
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

/**
 * Gets the monorepo root directory
 */
function getMonorepoRoot(): string {
  let currentDir = process.cwd();
  
  // Navigate up until we find package.json with workspaces 
  // or hit the root of the filesystem
  while (currentDir !== path.parse(currentDir).root) {
    const packageJsonPath = path.join(currentDir, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (packageJson.workspaces) {
          return currentDir;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    currentDir = path.dirname(currentDir);
  }
  
  // If we can't find the monorepo root, return current directory
  return process.cwd();
}

/**
 * Loads environment variables from .env files in multiple locations
 * Prioritizes package-specific .env over root .env
 * Only works in Node.js environment
 */
export function loadEnvNode(packageName?: string): void {
  try {
    // First load the root .env
    const monorepoRoot = getMonorepoRoot();
    const rootEnvPath = path.join(monorepoRoot, '.env');
    
    // Then try to load package-specific .env if provided
    let packageEnvPath = '';
    if (packageName) {
      packageEnvPath = path.join(monorepoRoot, 'packages', packageName, '.env');
    }
    
    // Load root .env first
    if (fs.existsSync(rootEnvPath)) {
      const envConfig = dotenv.parse(fs.readFileSync(rootEnvPath));
      
      // Update process.env with values from root .env file
      for (const key in envConfig) {
        process.env[key] = envConfig[key];
      }
      
      console.log(`Root environment loaded from ${rootEnvPath}`);
    }
    
    // Then override with package-specific .env if it exists
    if (packageName && fs.existsSync(packageEnvPath)) {
      const packageEnvConfig = dotenv.parse(fs.readFileSync(packageEnvPath));
      
      // Update process.env with values from package .env file (overriding root)
      for (const key in packageEnvConfig) {
        process.env[key] = packageEnvConfig[key];
      }
      
      console.log(`Package environment loaded from ${packageEnvPath}`);
    }
    
  } catch (error) {
    console.error('Error loading environment variables:', error);
  }
} 