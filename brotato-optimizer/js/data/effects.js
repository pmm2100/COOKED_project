import { getEffectModel } from '../../effect_understanding/evaluate.js';

const normalize = (value) => String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const statAliases = {
  damage: 'damage_pct', hp_regeneration: 'hp_regen', melee_damage: 'melee',
  ranged_damage: 'ranged', elemental_damage: 'elemental', crit_chance: 'crit',
};

async function fetchJson(url) {
  if (url.protocol === 'file:' && typeof process !== 'undefined' && process.versions?.node) {
    const { readFile } = await import('node:fs/promises');
    return JSON.parse(await readFile(url, 'utf8'));
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load effect data (${response.status}): ${url}`);
  return response.json();
}

/** Load both source JSON files and add effect-modeled items to the optimizer's item registry. */
export async function loadEffectData(ctx) {
  const [base, dlc] = await Promise.all([
    fetchJson(new URL('../../../db_json/brotato_items.json', import.meta.url)),
    fetchJson(new URL('../../../db_json/brotato_items_dlc.json', import.meta.url)),
  ]);
  const byName = new Map([...ctx.items.values()].map((item) => [normalize(item.name), item]));
  const statIds = new Set(ctx.stats.map((stat) => stat.id));

  for (const [edition, source] of [['base', base], ['dlc', dlc]]) {
    for (const [name, record] of Object.entries(source)) {
      if (!record.effect || !getEffectModel(name)) continue;
      const key = normalize(name);
      let item = byName.get(key);
      if (!item) {
        const statModifiers = {};
        for (const [sourceId, value] of Object.entries(record.stats ?? {})) {
          const id = statAliases[sourceId] ?? sourceId;
          if (statIds.has(id) && Number.isFinite(value)) statModifiers[id] = value;
        }
        const id = key.replace(/ /g, '_');
        item = {
          id,
          name,
          dlc: edition === 'dlc' ? 'abyssal_terrors' : false,
          rarity: record.tier,
          price: record.price,
          maxStack: record.limit ?? null,
          unique: record.limit === 1,
          tags: [],
          statModifiers,
          effects: record.effect,
        };
        ctx.items.set(id, item);
        byName.set(key, item);
      } else {
        // Keep the optimizer's existing stat model, but use the complete source effect text for analysis/display.
        item.effects = record.effect;
        if (edition === 'dlc') item.dlc = 'abyssal_terrors';
      }
    }
  }

  return ctx;
}