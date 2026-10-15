// Source: /Items (first 26 numeric items). `effects` = text of effects not included in the calculation.
const I = (id, name, rarity, price, statModifiers, o = {}) => ({
  id, name, dlc: o.dlc ? 'abyssal_terrors' : false, rarity, price, statModifiers,
  maxStack: o.limit ?? null, unique: o.limit === 1, tags: [], effects: o.note ?? '',
});

export default [
  I('acid', 'Acid', 2, 65, { max_hp: 8, dodge: -2 }),
  I('adrenaline', 'Adrenaline', 3, 60, { dodge: 5 }, { limit: 1, note: '50% chance to heal 5 HP when dodging' }),
  I('alien_baby', 'Alien Baby', 3, 80, { max_hp: 15 }, { note: '+10% enemy health' }),
  I('alien_magic', 'Alien Magic', 3, 85, { max_hp: 8, hp_regen: 3, luck: -8 }),
  I('alien_worm', 'Alien Worm', 1, 15, { max_hp: 3, hp_regen: 2 }, { note: '-1 HP recovered from consumables' }),
  I('alloy', 'Alloy', 3, 80, { melee: 3, ranged: 3, elemental: 3, engineering: 3, crit: 5, dodge: -6 }),
  I('ashes', 'Ashes', 4, 100, { damage_pct: 20, attack_speed: 20, range: 100 }, { dlc: 1, note: '-1 Armor at the end of a wave' }),
  I('ball_and_chain', 'Ball and Chain', 3, 75, { damage_pct: 15, armor: 3, speed: -3 }, { limit: 1, note: '+5 Knockback; min. weapon cooldown 0.75s' }),
  I('bat', 'Bat', 1, 20, { life_steal: 2, harvesting: -2 }),
  I('big_arms', 'Big Arms', 4, 105, { melee: 12, ranged: 6, attack_speed: -3, speed: -3 }),
  I('blindfold', 'Blindfold', 2, 45, { crit: 5, dodge: 5, range: -15 }),
  I('blood_leech', 'Blood Leech', 2, 45, { life_steal: 2, hp_regen: 2, harvesting: -3 }),
  I('boxing_glove', 'Boxing Glove', 1, 18, { melee: 1 }),
  I('broken_mouth', 'Broken Mouth', 1, 25, { max_hp: 5, hp_regen: -1 }),
  I('cake', 'Cake', 1, 15, { max_hp: 3, damage_pct: -1 }),
  I('cape', 'Cape', 4, 110, { life_steal: 5, dodge: 20, melee: -2, ranged: -2, elemental: -2 }),
  I('clover', 'Clover', 3, 65, { luck: 20, dodge: 6, life_steal: -2 }),
  I('coffee', 'Coffee', 1, 20, { attack_speed: 10, damage_pct: -2 }),
  I('cyclops_worm', 'Cyclops Worm', 2, 45, { damage_pct: 12, range: -12 }),
  I('exoskeleton', 'Exoskeleton', 4, 90, { armor: 3, crit: 5, engineering: 5, speed: 5, hp_regen: -2, life_steal: -2 }),
  I('fin', 'Fin', 3, 65, { speed: 10, life_steal: 3, luck: -8 }),
  I('gentle_alien', 'Gentle Alien', 1, 30, { max_hp: 2, damage_pct: 5 }, { limit: 10, note: '+5% enemies' }),
  I('ghost_outfit', 'Ghost Outfit', 3, 80, { dodge: 10, speed: -5, armor: -3 }, { limit: 1, note: 'Dodge is capped at 70%' }),
  I('glass_cannon', 'Glass Cannon', 3, 75, { damage_pct: 25, armor: -3 }),
  I('glasses', 'Glasses', 1, 20, { range: 20 }),
  I('gnome', 'Gnome', 4, 100, { melee: 10, elemental: 10, range: -20 }),
];
