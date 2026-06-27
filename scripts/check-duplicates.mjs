import { readdir } from 'node:fs/promises';
import path from 'node:path';

const ignored = new Set(['.git', '.next', 'node_modules', 'test-results', 'playwright-report', 'coverage']);
const ignoredFiles = [
  /^public\/sw(?: \d+)?\.js(?:\.map)?$/,
  /^public\/swe-worker(?: \d+)?-[^/]+\.js$/,
  /^public\/workbox(?: \d+)?-[^/]+\.js$/,
];
const duplicates = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(full);
    else {
      const relative = path.relative(process.cwd(), full);
      if (/ \d+(?=\.[^.]+$)/.test(entry.name) && !ignoredFiles.some((pattern) => pattern.test(relative))) {
        duplicates.push(relative);
      }
    }
  }
}
await walk(process.cwd());
if (duplicates.length) {
  console.error(`Archivos duplicados detectados:\n${duplicates.join('\n')}`);
  process.exit(1);
}
