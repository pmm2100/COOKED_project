// Option = { id, label, group, type: toggle|number|multiselect, default, min/max | choices, apply(cfg, value) }.
// Add an option by adding one object: the form and the optimizer pick it up automatically.
const ROMAN = ['I', 'II', 'III', 'IV'];
const num = (id, label, group, def, min, max, apply) => ({ id, label, group, type: 'number', default: def, min, max, apply });
const tog = (id, label, group, def, apply) => ({ id, label, group, type: 'toggle', default: def, apply });
const OPTIONS = [
  tog('dlc', 'Include Abyssal Terrors DLC', 'Content', true, (c, v) => { c.dlc = v; }),
  { id: 'rarities', label: 'Allowed item tiers', group: 'Content', type: 'multiselect', default: ['1', '2', '3', '4'],
    choices: () => ROMAN.map((r, i) => ({ value: String(i + 1), label: `Tier ${r}` })), apply: (c, v) => { c.rarities = v; } },
  num('maxWeapons', 'Max weapons', 'Build size', 6, 0, 6, (c, v) => { c.maxWeapons = v; }),
  num('minItems', 'Min items', 'Build size', 0, 0, 60, (c, v) => { c.minItems = v; }),
  num('maxItems', 'Max items', 'Build size', 30, 0, 60, (c, v) => { c.maxItems = v; }),
  num('tier', 'Highest weapon tier', 'Weapons', 4, 1, 4, (c, v) => { c.preferredTier = v; }),
  tog('allowDup', 'Allow duplicate weapons', 'Weapons', true, (c, v) => { c.allowDup = v; }),
  num('maxPrice', 'Total price budget (0 = off)', 'Budget', 0, 0, 9999, (c, v) => { c.maxPrice = v > 0 ? v : Infinity; }),
  num('minArmor', 'Minimum Armor (0 = off)', 'Stat constraints', 0, 0, 100, (c, v) => { if (v > 0) c.minStats.armor = v; }),
  num('minDodge', 'Minimum Dodge (0 = off)', 'Stat constraints', 0, 0, 90, (c, v) => { if (v > 0) c.minStats.dodge = v; }),
  num('minHp', 'Minimum Max HP (0 = off)', 'Stat constraints', 0, 0, 500, (c, v) => { if (v > 0) c.minStats.max_hp = v; }),
  num('minSpeed', 'Minimum Speed (0 = off)', 'Stat constraints', 0, 0, 100, (c, v) => { if (v > 0) c.minStats.speed = v; }),
  tog('noNegSpeed', 'Avoid negative Speed', 'Penalties', false, (c, v) => { if (v) c.minStats.speed = Math.max(c.minStats.speed ?? 0, 0); }),
  tog('noDownsides', 'Exclude items with downsides', 'Penalties', false, (c, v) => { c.noDownsides = v; }),
  num('maxCopies', 'Max copies per item', 'Item filters', 99, 1, 99, (c, v) => { c.maxCopies = v; }),
  { id: 'banned', label: 'Banned items', group: 'Item filters', type: 'multiselect', default: [],
    choices: (d) => [...d.items.values()].map((i) => ({ value: i.id, label: i.name })), apply: (c, v) => { c.banned = v; } },
  num('results', 'Number of results', 'Results', 3, 1, 10, (c, v) => { c.results = v; }),
  num('beam', 'Search width', 'Search', 12, 4, 40, (c, v) => { c.beam = v; }),
];
export default OPTIONS;

export function buildConfig(values) {
  const c = { dlc: true, rarities: [], banned: [], noDownsides: false, maxCopies: 99, maxWeapons: 6, minItems: 0, maxItems: 30,
    preferredTier: 4, allowDup: true, maxPrice: Infinity, minStats: {}, results: 3, beam: 12 };
  for (const o of OPTIONS) o.apply(c, values[o.id]);
  c.maxItems = Math.max(c.minItems, c.maxItems);
  return c;
}
