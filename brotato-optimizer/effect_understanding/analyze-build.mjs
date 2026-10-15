import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadData } from '../js/data/index.js';
import { computeStats } from '../js/engine/stats.js';
import GOALS from '../js/objectives/goals.js';
import { analyzeBuildEffects, getEffectModel } from './evaluate.js';
import { EFFECT_ASSUMPTIONS } from './data/effect-values.js';

const here = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(here, '../..');
const normalize = (value) => String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const parse = async (path) => JSON.parse(await readFile(path, 'utf8'));

const [base, dlc] = await Promise.all([
  parse(resolve(workspaceRoot, 'db_json/brotato_items.json')),
  parse(resolve(workspaceRoot, 'db_json/brotato_items_dlc.json')),
]);

const sourceItems = [
  ...Object.entries(base).map(([name, item]) => ({ edition: 'base', name, ...item })),
  ...Object.entries(dlc).map(([name, item]) => ({ edition: 'dlc', name, ...item })),
];

const numericTokens = (effect) => [...String(effect ?? '').matchAll(/[+-]?\d+(?:\.\d+)?%?/g)].map(([raw]) => ({
  raw,
  value: Number(raw.replace('%', '')),
  percent: raw.endsWith('%'),
}));

const catalog = {
  generatedAt: new Date().toISOString(),
  sources: ['db_json/brotato_items.json', 'db_json/brotato_items_dlc.json'],
  note: 'Numeric tokens are extracted verbatim; only entries with a model in data/effect-values.js affect optimizer scores.',
  assumptions: EFFECT_ASSUMPTIONS,
  items: sourceItems.map(({ edition, name, effect }) => ({
    edition,
    name,
    effect: effect ?? null,
    numericValues: numericTokens(effect),
    model: getEffectModel(name) ?? null,
  })),
};
await writeFile(resolve(here, 'data/effect-catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');

const ctx = loadData();
const statIds = new Set(ctx.stats.map((stat) => stat.id));
const statAliases = {
  damage: 'damage_pct', hp_regeneration: 'hp_regen', melee_damage: 'melee',
  ranged_damage: 'ranged', elemental_damage: 'elemental', crit_chance: 'crit',
};

const itemByName = new Map();
for (const item of sourceItems) {
  const id = normalize(item.name).replace(/ /g, '_');
  let appItem = ctx.items.get(id);

  if (!appItem) {
    const statModifiers = {};

    for (const [rawId, value] of Object.entries(item.stats ?? {})) {
      const statId = statAliases[rawId] ?? rawId;
      if (statIds.has(statId) && Number.isFinite(value)) statModifiers[statId] = value;
    }

    appItem = {
      id, name: item.name, dlc: item.edition === 'dlc' ? 'abyssal_terrors' : false,
      rarity: item.tier, price: item.price, maxStack: item.limit ?? null,
      statModifiers, effects: item.effect ?? '',
    };
    ctx.items.set(id, appItem);
  }
  itemByName.set(normalize(item.name), appItem);
}

const buildPath = process.argv[2];
if (!buildPath) {
  const modeled = catalog.items.filter((item) => item.model).length;
  const withEffects = catalog.items.filter((item) => item.effect).length;

  console.log(`Generated effect catalog at ${resolve(here, 'data/effect-catalog.json')}`);
  console.log(`Read ${base && Object.keys(base).length} base items and ${Object.keys(dlc).length} DLC items.`);
  console.log(`Found ${withEffects} effect descriptions; ${modeled} have numeric score models.`);
  console.log('Pass a build JSON file to calculate its effect-adjusted objective score.');
} else {
  const input = await parse(resolve(process.cwd(), buildPath));
  const items = {};

  for (const [inputId, count] of Object.entries(input.items ?? {})) {
    const item = ctx.items.get(inputId) ?? itemByName.get(normalize(inputId.replace(/_/g, ' ')));

    if (!item) 
      throw new Error(`Unknown item in build: ${inputId}`);
    const id = item.id ?? normalize(item.name).replace(/ /g, '_');
    if (!ctx.items.has(id)) ctx.items.set(id, item);
    items[id] = count;
  }
  const build = {
    characterId: ctx.chars.has(input.characterId) ? input.characterId : ctx.chars.keys().next().value,
    weapons: Array.isArray(input.weapons) ? input.weapons : [],
    items,
  };
  const baseStats = computeStats(build, ctx).final;
  const effects = analyzeBuildEffects(build, baseStats, ctx);
  const goal = GOALS.find((entry) => entry.id === input.goalId) ?? GOALS.find((entry) => entry.id === 'total_dps') ?? GOALS[0];
  console.log(JSON.stringify({
    build,
    goal: goal.id,
    scoreBeforeEffects: goal.score(baseStats, build, ctx),
    scoreAfterEffects: goal.score(effects.final, build, ctx),
    baseStats,
    effectAdjustedStats: effects.final,
    includedEffects: effects.entries,
    unmodeledEffects: effects.unmodeled,
  }, null, 2));
}
