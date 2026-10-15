import { totalDps, effectiveHp } from '../engine/stats.js';
// Goal = { id, label, description, stat?, score(stats, build, ctx) -> number }. Add a goal by adding one object.
const stat = (id, label) => ({ id: 'stat_' + id, label, stat: id, description: `Highest possible ${label}.`, score: (s) => s[id] });
export default [
  stat('max_hp', 'Max HP'), stat('hp_regen', 'HP Regeneration'), stat('life_steal', 'Life Steal'),
  stat('melee', 'Melee Damage'), stat('ranged', 'Ranged Damage'), stat('elemental', 'Elemental Damage'),
  stat('attack_speed', 'Attack Speed'), stat('crit', 'Crit Chance'), stat('armor', 'Armor'), stat('dodge', 'Dodge'),
  stat('speed', 'Speed'), stat('harvesting', 'Harvesting'), stat('luck', 'Luck'), stat('range', 'Range'), stat('engineering', 'Engineering'),
  { id: 'total_dps', label: 'Total DPS', description: 'Combined DPS of all weapons (no special effects).', score: (s, b, c) => totalDps(b, s, c) },
  { id: 'ehp', label: 'Effective HP', stat: 'max_hp', description: 'Max HP adjusted for armor and dodge.', score: (s) => effectiveHp(s) },
  { id: 'balanced_tank', label: 'Balanced Tank', description: 'Effective HP boosted by regeneration (heuristic).', score: (s) => effectiveHp(s) * (1 + Math.max(0, s.hp_regen) / 10) },
  { id: 'glass_cannon', label: 'Glass Cannon', description: 'DPS first, Crit and Speed as bonuses (heuristic).', score: (s, b, c) => totalDps(b, s, c) + 0.5 * s.crit + 0.25 * s.speed },
  { id: 'sustain', label: 'Sustain', description: 'HP regeneration + 2 × Life Steal (heuristic).', score: (s) => s.hp_regen + 2 * s.life_steal },
];
