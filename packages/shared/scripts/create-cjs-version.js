#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '../dist');

// Function to process a file
function processFile(filePath) {
  if (filePath.endsWith('.js') && !filePath.endsWith('.cjs')) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Create a CommonJS version by adding .js to imports
    let cjsContent = content
      // Convert ES imports to CommonJS
      .replace(/import\s+(\{[^}]+\}|\*\s+as\s+[^\s;]+|[^\s;,]+)\s+from\s+(['"])([^'"]+)(['"])/g, 
               (_, imports, quote, importPath, endQuote) => {
        // Add .js extension to relative imports that don't already have an extension
        if (importPath.startsWith('.') && !importPath.match(/\.[a-zA-Z0-9]+$/)) {
          importPath = `${importPath}.js`;
        }
        return `import ${imports} from ${quote}${importPath}${endQuote}`;
      });
    
    // Write the CJS version
    const cjsPath = filePath.replace(/\.js$/, '.cjs');
    fs.writeFileSync(cjsPath, cjsContent);
    console.log(`Created CJS version: ${cjsPath}`);
  }
}

// Process all files in a directory recursively
function processDir(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      processDir(fullPath);
    } else {
      processFile(fullPath);
    }
  }
}

// Main function
function main() {
  console.log('Creating CommonJS versions of ESM modules...');
  
  if (!fs.existsSync(distDir)) {
    console.error(`Dist directory not found: ${distDir}`);
    process.exit(1);
  }
  
  processDir(distDir);
  
  // Create main index.cjs file
  const indexPath = path.join(distDir, 'index.js');
  if (fs.existsSync(indexPath)) {
    processFile(indexPath);
  }
  
  console.log('CommonJS conversion complete!');
}

main(); 