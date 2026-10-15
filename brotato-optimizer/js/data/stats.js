// TODO verify base/min/max values on https://brotato.wiki.spellsandguns.com/Stats (null = unknown, treated as 0 / no cap)
const S = (id, name, group, unit = 'flat', base = null, min = null) => ({ id, name, base, min, max: null, unit, group });
export default [
  S('max_hp', 'Max HP', 'defense', 'flat', 10, 1), S('hp_regen', 'HP Regeneration', 'defense'), S('life_steal', 'Life Steal', 'defense', 'percent'),
  S('armor', 'Armor', 'defense'), S('dodge', 'Dodge', 'defense', 'percent'),
  S('damage_pct', '% Damage', 'offense', 'percent'), S('melee', 'Melee Damage', 'offense'), S('ranged', 'Ranged Damage', 'offense'),
  S('elemental', 'Elemental Damage', 'offense'), S('attack_speed', 'Attack Speed', 'offense', 'percent'), S('crit', 'Crit Chance', 'offense', 'percent'),
  S('range', 'Range', 'offense'), S('knockback', 'Knockback', 'offense'), S('engineering', 'Engineering', 'utility'), S('speed', 'Speed', 'utility', 'percent'),
  S('luck', 'Luck', 'utility'), S('harvesting', 'Harvesting', 'utility'), S('curse', 'Curse', 'utility'),
  S('enemies', 'Enemies', 'utility', 'percent'), S('enemy_damage', 'Enemy Damage', 'utility', 'percent'),
  S('enemy_health', 'Enemy Health', 'utility', 'percent'), S('enemy_speed', 'Enemy Speed', 'utility', 'percent'),
  S('explosion_damage', 'Explosion Damage', 'offense'), S('hp_recovered_from_consumables', 'HP from Consumables', 'defense'),
  S('items_price', 'Item Price', 'utility', 'percent'), S('map_size', 'Map Size', 'utility', 'percent'),
  S('materials_dropped', 'Materials Dropped', 'utility', 'percent'), S('pickup_range', 'Pickup Range', 'utility'),
  S('weapons_price', 'Weapon Price', 'utility', 'percent'), S('xp_gain', 'XP Gain', 'utility', 'percent'),
];
