import { execFileSync } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import OPTIONS from '../js/objectives/options.js';
import GOALS from '../js/objectives/goals.js';
import { loadData } from '../js/data/index.js';
import { loadEffectData } from '../js/data/effects.js';

const root = dirname(fileURLToPath(import.meta.url));
const sourceRoots = ['../js', '../effect_understanding'].map((path) => join(root, path));
const sourceFiles = [];

async function collectJavaScriptFiles(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await collectJavaScriptFiles(path);
    else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) sourceFiles.push(path);
  }
}

for (const sourceRoot of sourceRoots) await collectJavaScriptFiles(sourceRoot);
for (const sourceFile of sourceFiles) execFileSync(process.execPath, ['--check', sourceFile], { stdio: 'inherit' });

const data = await loadEffectData(loadData());
const uniqueIds = (records, label) => {
  const ids = records.map(({ id }) => id);
  if (new Set(ids).size !== ids.length) throw new Error(`${label} contains duplicate ids.`);
};

uniqueIds(GOALS, 'Goals');
uniqueIds(OPTIONS, 'Options');
if (!data.chars.size || !data.items.size || !data.weapons.size) throw new Error('Required data registry is empty.');
if (data.warnings.length) throw new Error(`Data validation warnings: ${data.warnings.join('; ')}`);

console.log(`Build validation passed: ${sourceFiles.length} JavaScript files and ${data.items.size} items checked.`);
