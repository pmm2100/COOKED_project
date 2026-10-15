// Source: /Weapons (melee table only). TODO: ranged weapons and the remaining melee weapons. Set bonuses by class not modeled yet.
// Chances are fractions (0.03 = 3%); arrays are tiers I-IV, null = tier does not exist.
const p = (v, i) => (Array.isArray(v) ? v[i] : v);
const T = (d, cd, cc, cm, s) => d.map((x, i) => x == null ? null : {
  baseDamage: x, cooldown: cd[i], critChance: p(cc, i), critMultiplier: p(cm, i),
  scaling: Object.fromEntries(Object.entries(s).map(([k, v]) => [k, p(v, i)])),
});
const W = (id, name, classes, price, tiers, o = {}) => ({ id, name, dlc: o.dlc ? 'abyssal_terrors' : false, type: 'melee', classes, price, tiers, note: o.note ?? '' });
export default [
  W('fist', 'Fist', ['Unarmed'], [10, 22, 45, 91], T([8, 16, 32, 64], [.78, .73, .69, .59], .01, 1.5, { melee: 1 })),
  W('knife', 'Knife', ['Precise'], [10, 22, 45, 91], T([9, 13, 18, 25], [1.01, .93, .86, .78], [.2, .3, .4, .5], [2.5, 3, 3.5, 4], { melee: .8 })),
  W('hatchet', 'Hatchet', ['Primitive'], [10, 22, 45, 91], T([7, 11, 22, 45], [.68, .67, .65, .63], .03, 2, { melee: 1, attack_speed: .2 })),
  W('chopper', 'Chopper', ['Blade'], [15, 31, 61, 122], T([6, 12, 18, 30], [.99, .99, .96, .89], [.1, .15, .2, .25], 2, { melee: .5, max_hp: [.15, .2, .25, .3] }), { note: 'Chopper: extra HP from consumables' }),
  W('rock', 'Rock', ['Primitive', 'Blunt'], [10, 22, 45, 91], T([20, 35, 50, 70], [1.68, 1.61, 1.53, 1.46], [.1, .15, .2, .25], 1.5, { melee: 1 }), { note: 'Rock: bonus Armor/Max HP per tier' }),
  W('hammer', 'Hammer', ['Blunt', 'Heavy'], [null, 46, 86, 151], T([null, 40, 75, 120], [null, 1.67, 1.59, 1.5], .03, 1.75, { melee: [0, 1.5, 1.75, 2] })),
  W('ghost_axe', 'Ghost Axe', ['Ethereal'], [20, 39, 74, 149], T([12, 18, 24, 40], [1.73, 1.66, 1.58, 1.51], .03, 2, { melee: 1 }), { note: 'Ghost Axe: +1% Damage per kills' }),
  W('scissors', 'Scissors', ['Medical', 'Precise'], [15, 31, 61, 122], T([5, 10, 15, 20], [1.01, .98, .94, .86], [.1, .12, .15, .2], [2, 2.15, 2.3, 2.5], { melee: .8 }), { note: 'Scissors: Lifesteal 40-60%' }),
  W('excalibur', 'Excalibur', ['Legendary', 'Blade'], [null, null, null, 230], T([null, null, null, 200], [null, null, null, .66], .1, 2.5, { melee: 2, max_hp: 2 }), { note: 'Excalibur: -2 Armor for every weapon you have' }),
  W('scythe', 'Scythe', ['Legendary', 'Ethereal'], [null, null, null, 285], T([null, null, null, 150], [null, null, null, .72], .03, 2, { melee: 1.5, life_steal: 1 }), { note: 'Scythe: you take 3 damage per second' }),
  W('mace', 'Mace', ['Heavy', 'Medieval'], [null, 46, 92, 185], T([null, 40, 60, 100], [null, 1.39, 1.31, 1.23], [0, .04, .08, .12], 1.5, { melee: 1, attack_speed: [0, -.5, -.75, -1] }), { dlc: 1 }),
];
