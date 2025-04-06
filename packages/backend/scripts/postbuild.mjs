import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Configuration ---
// Resolve dist directory relative to this script's location
const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const fileExtensionToAdd = '.js';
// Regex to find relative import/export statements (import/export ... from './relative/path')
// It captures the quote and the relative path (starting with .)
// It specifically avoids matching paths that already end in .js or .mjs
const importRegex = /(import|export)(?:["'\s]*(?:[\w*{}\n\r\t, ]+)from\s*)?(["'])((\.\.?\/)[^'"\n\r\t]+)\2/g;
// --- End Configuration ---

async function processFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let changed = false;
    const logPrefix = `  [${path.relative(distDir, filePath)}]:`;

    // Use replace with a function to apply fixes conditionally
    const newContent = content.replace(importRegex, (match, typeOrKeyword, quote, fullPath, relativeStart) => {
      // Check if the path already has a JS-like extension
      if (/\.(m?js|json)$/i.test(fullPath)) {
        return match; // Keep original if extension already exists
      }

      // Heuristic: Check if it looks like a directory import (common mistake)
      // If it doesn't contain a '.' suggesting a file extension was intended before TS compilation
      // This is optional and might need refinement
      // if (!fullPath.includes('.')) {
      //   console.warn(`${logPrefix} Possible directory import? Skipping fix for: ${fullPath}`);
      //   return match;
      // }

      const newPath = fullPath + fileExtensionToAdd;
      console.log(`${logPrefix} Fixing import -> ${newPath}`);
      changed = true;
      // Reconstruct the import/export statement carefully
      // The regex captures the keyword (import/export), quote, full path, and relative start
      return match.replace(quote + fullPath + quote, quote + newPath + quote);
    });

    if (changed) {
      await fs.writeFile(filePath, newContent, 'utf8');
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

async function findJsFiles(dir) {
  let files = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.resolve(dir, entry.name);
      if (entry.isDirectory()) {
        // Recursively search subdirectories
        files = files.concat(await findJsFiles(fullPath));
      } else if (entry.isFile() && fullPath.endsWith('.js')) {
        // Add .js files to the list
        files.push(fullPath);
      }
    }
  } catch (error) {
      // Gracefully handle if dist directory doesn't exist yet
      if (error.code === 'ENOENT') {
          // console.warn(`Directory not found during search: ${dir}. Skipping.`);
      } else {
          console.error(`Error reading directory ${dir}:`, error);
      }
  }
  return files;
}

async function run() {
  console.log(`[Postbuild] Starting script to fix relative imports in: ${distDir}`);
  const jsFiles = await findJsFiles(distDir);

  if (jsFiles.length === 0) {
      console.warn("[Postbuild] No JavaScript files found in 'dist' directory. Ensure 'tsc' ran successfully before this script.");
      return;
  }

  console.log(`[Postbuild] Found ${jsFiles.length} JavaScript files. Processing...`);
  await Promise.all(jsFiles.map(processFile));
  console.log('[Postbuild] Script finished.');
}

run().catch(error => {
  console.error("[Postbuild] Script failed:", error);
  process.exit(1);
}); 