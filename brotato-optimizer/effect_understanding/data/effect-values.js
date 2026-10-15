// Numeric effect models. Source text comes from db_json/brotato_items*.json.
// Values are evaluated against final stats from the build optimizer.
const perStat = (effect, stat, sourceStat, amount, divisor = 1, rounding = 'none') => ({
  effect, kind: 'perStat', stat, sourceStat, amount, divisor, rounding,
});

const perWeapon = (effect, stat, amount) => ({ effect, kind: 'perWeapon', stat, amount });

export const EFFECT_VALUES = {
  "bloody hand": perStat('+2% Damage for every 1% Life Steal you have.', 'damage_pct', 'life_steal', 2),
  adrenaline: {
    effect: '50% chance to heal 5 HP when dodging an attack.',
    kind: 'expectedHealOnDodge', stat: 'hp_regen', chance: 0.5, heal: 5,
    incomingAttacksPerSecond: 0.25, estimate: true,
    assumption: 'Estimated using 0.25 incoming attacks/second and this build’s Dodge chance.',
  },
  coil: perStat('+1% Damage for every 1 Knockback you have.', 'damage_pct', 'knockback', 1),
  focus: perWeapon('-3% Attack Speed for every different weapon you have.', 'attack_speed', -3),
  jelly: perWeapon('+1 Max HP for every different weapon you have.', 'max_hp', 1),
  'lucky coin': perStat('+2 Luck for every 1% Crit Chance you have.', 'luck', 'crit', 2),
  'ghost outfit': { effect: 'Dodge is capped at 70%.', kind: 'statCap', stat: 'dodge', cap: 70 },
  pearl: perStat('+1% Damage for every permanent 10 Luck you have.', 'damage_pct', 'luck', 1, 10, 'floor'),
  'power generator': perStat('+1% Damage for every permanent 1% Speed you have.', 'damage_pct', 'speed', 1),
  "retromation's hoodie": perStat('+2% Attack Speed for every 1% Dodge you have.', 'attack_speed', 'dodge', 2),
  spider: perWeapon('+6% Attack Speed for every different weapon you have.', 'attack_speed', 6),
  'stone skin': perStat('+1 Max HP for every permanent 1 Armor you have.', 'max_hp', 'armor', 1),
  'strange book': perStat('+1 Engineering for every permanent 1 Elemental Damage you have.', 'engineering', 'elemental', 1),
  snowball: {
    effect: '+1 Elemental Damage every time you get an item that increases Elemental Damage.',
    kind: 'perItemStat', stat: 'elemental', sourceStat: 'elemental', amount: 1,
  },
};

export const EFFECT_ASSUMPTIONS = {
  permanentStatProxy: 'Uses the final build stat as a proxy when an effect says permanent stat.',
  weaponDiversity: 'Counts distinct weapon IDs in the candidate build; duplicate copies count once.',
  adrenaline: 'Expected healing uses 0.25 incoming attacks per second and the build Dodge chance; actual combat varies.',
  unsupportedEffects: 'Conditional effects without a deterministic build-only value are reported but do not affect the score.',
};
