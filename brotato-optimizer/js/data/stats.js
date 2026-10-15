// TODO verify base/min/max values on https://brotato.wiki.spellsandguns.com/Stats (null = unknown, treated as 0 / no cap)
const S = (id, name, group, unit = 'flat') => ({ id, name, base: null, min: null, max: null, unit, group });
export default [
  S('max_hp', 'Max HP', 'defense'), S('hp_regen', 'HP Regeneration', 'defense'), S('life_steal', 'Life Steal', 'defense', 'percent'),
  S('armor', 'Armor', 'defense'), S('dodge', 'Dodge', 'defense', 'percent'),
  S('damage_pct', '% Damage', 'offense', 'percent'), S('melee', 'Melee Damage', 'offense'), S('ranged', 'Ranged Damage', 'offense'),
  S('elemental', 'Elemental Damage', 'offense'), S('attack_speed', 'Attack Speed', 'offense', 'percent'), S('crit', 'Crit Chance', 'offense', 'percent'),
  S('range', 'Range', 'offense'), S('knockback', 'Knockback', 'offense'), S('engineering', 'Engineering', 'utility'), S('speed', 'Speed', 'utility', 'percent'),
  S('luck', 'Luck', 'utility'), S('harvesting', 'Harvesting', 'utility'), S('curse', 'Curse', 'utility'),
];
