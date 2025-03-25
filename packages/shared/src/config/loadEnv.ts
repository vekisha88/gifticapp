import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

/**
 * Loads environment variables from .env files
 * 
 * It follows this priority order (later ones override earlier ones):
 * 1. Default values (in env.ts)
 * 2. .env file in project root
 * 3. .env.local file in project root (if exists, not in Git)
 * 4. .env.{NODE_ENV} file in project root (if exists)
 * 5. Package-specific .env file (.e.g, packages/backend/.env)
 * 6. Environment variables already defined in process.env
 * 
 * @param packageName The name of the package (e.g., 'backend', 'frontend')
 * @param rootDir The root directory path
 */
export function loadEnv(packageName?: string, rootDir: string = process.cwd()): void {
  // Determine if we're in the monorepo root or a package directory
  let projectRoot = rootDir;
  if (fs.existsSync(path.join(rootDir, 'package.json'))) {
    const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
    if (packageJson.workspaces) {
      // We're in the monorepo root
      projectRoot = rootDir;
    } else {
      // We're in a package directory
      // Try to find the monorepo root by going up one directory
      const possibleRoot = path.join(rootDir, '..');
      if (fs.existsSync(path.join(possibleRoot, 'package.json'))) {
        const rootPackageJson = JSON.parse(fs.readFileSync(path.join(possibleRoot, 'package.json'), 'utf8'));
        if (rootPackageJson.workspaces) {
          projectRoot = possibleRoot;
        }
      }
    }
  }

  // Load the root .env file
  const rootEnvPath = path.join(projectRoot, '.env');
  if (fs.existsSync(rootEnvPath)) {
    dotenv.config({ path: rootEnvPath });
  }

  // Load the root .env.local file (if exists)
  const rootLocalEnvPath = path.join(projectRoot, '.env.local');
  if (fs.existsSync(rootLocalEnvPath)) {
    dotenv.config({ path: rootLocalEnvPath });
  }

  // Load the environment-specific .env file
  const nodeEnv = process.env.NODE_ENV || 'development';
  const envSpecificPath = path.join(projectRoot, `.env.${nodeEnv}`);
  if (fs.existsSync(envSpecificPath)) {
    dotenv.config({ path: envSpecificPath });
  }

  // If a package name is provided, load that package's .env file
  if (packageName) {
    const packageEnvPath = path.join(projectRoot, 'packages', packageName, '.env');
    if (fs.existsSync(packageEnvPath)) {
      dotenv.config({ path: packageEnvPath });
    }
  }

  // Log which environment is being used
  console.log(`Environment loaded: ${nodeEnv}`);
}

/**
 * Loads all package .env files
 * Useful for the root package
 */
export function loadAllEnvs(rootDir: string = process.cwd()): void {
  // Load the root .env files first
  loadEnv(undefined, rootDir);
  
  // Then try to load package-specific .env files
  const packagesDir = path.join(rootDir, 'packages');
  if (fs.existsSync(packagesDir)) {
    const packages = fs.readdirSync(packagesDir)
      .filter(item => fs.statSync(path.join(packagesDir, item)).isDirectory());
    
    for (const pkg of packages) {
      const packageEnvPath = path.join(packagesDir, pkg, '.env');
      if (fs.existsSync(packageEnvPath)) {
        dotenv.config({ path: packageEnvPath });
      }
    }
  }
} 