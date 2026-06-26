import { readdir } from 'node:fs/promises';
import path from 'node:path';

const ignored = new Set(['.git', '.next', 'node_modules', 'test-results', 'playwright-report', 'coverage']);
const duplicates = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (/ \d+(?=\.[^.]+$)/.test(entry.name)) duplicates.push(path.relative(process.cwd(), full));
  }
}
await walk(process.cwd());
if (duplicates.length) {
  console.error(`Archivos duplicados detectados:\n${duplicates.join('\n')}`);
  process.exit(1);
}
