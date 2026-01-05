#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Schema files to merge (base.prisma first for generator/datasource)
const schemaFiles = [
  'prisma/schema/base.prisma',
  'prisma/schema/user.prisma', 
  'prisma/schema/todo.prisma'
];

// Output file
const outputFile = 'prisma/schema.prisma';

// Read and merge all schema files
let mergedSchema = '';
let hasGenerator = false;
let hasDatasource = false;

schemaFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Skip generator/datasource if already added
    if (hasGenerator && content.includes('generator client')) return;
    if (hasDatasource && content.includes('datasource db')) return;
    
    if (content.includes('generator client')) hasGenerator = true;
    if (content.includes('datasource db')) hasDatasource = true;
    
    mergedSchema += '\n' + content;
    console.log(`Merged: ${file}`);
  } else {
    console.warn(`File not found: ${file}`);
  }
});

// Write merged schema
fs.writeFileSync(outputFile, mergedSchema.trim());
console.log(`✅ Merged schema written to: ${outputFile}`);