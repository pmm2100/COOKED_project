import stats from './stats.js';
import characters from './characters.js';
import weapons from './weapons.js';
import items from './items.js';

/** Loads and validates data. Bad records are skipped and reported in `warnings` (the app never crashes on them). */
export function loadData() {
  const warnings = [];
  const uniq = (list, kind, extra = () => true) => {
    const seen = new Map();
    for (const r of list) {
      if (!r?.id || seen.has(r.id)) warnings.push(`${kind}: missing or duplicate id "${r?.id}"`);
      else if (!extra(r)) warnings.push(`${kind} "${r.id}" skipped (invalid data)`);
      else seen.set(r.id, r);
    }
    return seen;
  };
  const S = uniq(stats, 'stat');
  const mods = (r) => Object.entries(r.statModifiers ?? {}).every(([k, v]) => S.has(k) && Number.isFinite(v));
  return {
    stats: [...S.values()],
    chars: uniq(characters, 'character', mods),
    items: uniq(items, 'item', (r) => mods(r) && Number.isFinite(r.price)),
    weapons: uniq(weapons, 'weapon', (r) => Array.isArray(r.tiers) && r.tiers.length === 4 &&
      r.tiers.every((t) => t === null || Object.keys(t.scaling).every((k) => S.has(k)))),
    warnings,
  };
}
