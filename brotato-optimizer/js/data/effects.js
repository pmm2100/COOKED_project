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
  const [base, dlc, characterSource] = await Promise.all([
    fetchJson(new URL('../../../db_json/brotato_items.json', import.meta.url)),
    fetchJson(new URL('../../../db_json/brotato_items_dlc.json', import.meta.url)),
    fetchJson(new URL('../../../db_json/brotato_weapons.json', import.meta.url)),
  ]);
  const statIds = new Set(ctx.stats.map((stat) => stat.id));
  const toModifiers = (sourceStats) => Object.fromEntries(
    Object.entries(sourceStats ?? [])
      .map(([sourceId, value]) => [statAliases[sourceId] ?? sourceId, value])
      .filter(([id, value]) => statIds.has(id) && Number.isFinite(value)),
  );
  const byName = new Map([...ctx.items.values()].map((item) => [normalize(item.name), item]));

  for (const [edition, source] of [['base', base], ['dlc', dlc]]) {
    for (const [name, record] of Object.entries(source)) {
      const key = normalize(name);
      let item = byName.get(key);
      if (!item) {
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
          statModifiers: toModifiers(record.stats),
          effects: record.effect ?? '',
        };
        ctx.items.set(id, item);
        byName.set(key, item);
      } else {
        item.statModifiers = { ...toModifiers(record.stats), ...item.statModifiers };
        item.rarity ??= record.tier;
        item.price ??= record.price;
        item.maxStack ??= record.limit;
        item.effects = record.effect ?? item.effects;
        if (edition === 'dlc') item.dlc = 'abyssal_terrors';
      }
    }
  }

  const byCharacterName = new Map([...ctx.chars.values()].map((character) => [normalize(character.name), character]));
  for (const [name, record] of Object.entries(characterSource)) {
    const key = normalize(name);
    const existing = byCharacterName.get(key);
    const character = existing ?? {
      id: key.replace(/ /g, '_'),
      name,
      dlc: record.dlc ? 'abyssal_terrors' : false,
      statModifiers: {},
      statMultipliers: {},
      caps: {},
      maxWeapons: 6,
      minTier: 1,
      weaponRestrictions: null,
      startingWeapons: [],
      note: '',
    };
    character.statModifiers = { ...toModifiers(record.stats), ...character.statModifiers };
    character.dlc = record.dlc ? 'abyssal_terrors' : character.dlc;
    character.startingWeapons = record.starting_weapons ?? character.startingWeapons;
    character.note = record.effect ?? character.note;
    if (!existing) ctx.chars.set(character.id, character);
  }

  return ctx;
}