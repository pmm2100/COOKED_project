// Source: /Characters. statMultipliers = "X modifications are increased/reduced" (applied to item modifiers only).
// Conditional / per-stat scaling effects are kept as text in `note` (not included in calculation).
const C = (id, name, statModifiers, o = {}) => ({
  id, name, dlc: o.dlc ? 'abyssal_terrors' : false, statModifiers, statMultipliers: o.mult ?? {}, caps: o.caps ?? {},
  maxWeapons: o.maxWeapons ?? 6, minTier: o.minTier ?? 1, weaponRestrictions: null, startingWeapons: o.start ?? [], note: o.note ?? '',
});
export default [
  C('well_rounded', 'Well Rounded', { max_hp: 5, speed: 5, harvesting: 8 }),
  C('brawler', 'Brawler', { dodge: 15, range: -50, ranged: -50 }, { start: ['fist'], note: '+50% Attack Speed with Unarmed weapons' }),
  C('crazy', 'Crazy', { attack_speed: 25, dodge: -30, engineering: -10, ranged: -10 }, { start: ['knife'], note: '+100 Range with Precise weapons' }),
  C('loud', 'Loud', { damage_pct: 30 }, { note: '+50% enemies; -3 Harvesting at the end of a wave' }),
  C('gladiator', 'Gladiator', { melee: 5, attack_speed: -40, luck: -30 }, { note: '+20% Attack Speed for every different weapon; cannot equip ranged weapons' }),
  C('sick', 'Sick', { max_hp: 12, life_steal: 25, hp_regen: -100 }, { note: 'You take 1 damage per second' }),
  C('ghost', 'Ghost', { dodge: 30, armor: -100 }, { caps: { dodge: 90 }, note: '+10 Damage with Ethereal weapons' }),
  C('doctor', 'Doctor', { hp_regen: 5, harvesting: 5, attack_speed: -100 }, { mult: { hp_regen: 2, armor: 0.5 }, note: '+200% Attack Speed with Medical weapons' }),
  C('lich', 'Lich', { hp_regen: 10, life_steal: 10 }, { mult: { damage_pct: 0.5 }, note: 'Deals damage to a random enemy when you heal' }),
  C('bull', 'Bull', { max_hp: 20, hp_regen: 15, armor: 10 }, { mult: { hp_regen: 1.5 }, maxWeapons: 0, note: 'Cannot equip weapons; explodes when taking damage' }),
  C('one_armed', 'One Armed', { attack_speed: 200 }, { mult: { damage_pct: 2 }, maxWeapons: 1 }),
  C('knight', 'Knight', { armor: 3 }, { mult: { attack_speed: 0.5, harvesting: 0.2 }, minTier: 2, note: '+2 Melee Damage per Armor; cannot equip ranged weapons' }),
  C('golem', 'Golem', { max_hp: 20 }, { mult: { max_hp: 1.33, armor: 1.33 }, note: "Can't heal; bonus Attack Speed/Speed below 50% HP" }),
  C('chunky', 'Chunky', { life_steal: -100 }, { mult: { max_hp: 1.25, hp_regen: 0.5, dodge: 0.5, speed: 0 }, note: '+1% Damage per 3 Max HP; +3 HP from consumables' }),
  C('ogre', 'Ogre', { melee: 10, attack_speed: -50, speed: -10 }, { dlc: 1, note: 'Enemies that take double their max health explode; cannot equip ranged weapons' }),
];
