// Pure functions, no DOM. ctx = result of loadData().
export const dmgTaken = (armor) => (armor >= 0 ? 15 / (15 + armor) : 1 - armor / 15); // TODO verify on /Armor
export const effectiveHp = (s) => Math.max(1, s.max_hp) / dmgTaken(s.armor) / (1 - Math.min(s.dodge, 90) / 100); // TODO verify dodge cap

const WEAPON_CLASS_BONUSES = {
  Blade: [{ melee: 1, life_steal: 1 }, { melee: 2, life_steal: 2 }, { melee: 3, life_steal: 3 }, { melee: 4, life_steal: 4 }, { melee: 5, life_steal: 5 }],
  Blunt: [{ armor: 1, speed: -2 }, { armor: 1, max_hp: 3, speed: -4 }, { armor: 2, max_hp: 3, speed: -6 }, { armor: 2, max_hp: 6, speed: -8 }, { armor: 3, max_hp: 6, speed: -10 }],
  Elemental: [{ elemental: 1 }, { elemental: 2 }, { elemental: 3 }, { elemental: 4 }, { elemental: 5 }],
  Ethereal: [{ dodge: 6, armor: -1 }, { dodge: 12, armor: -2 }, { dodge: 18, armor: -3 }, { dodge: 24, armor: -4 }, { dodge: 30, armor: -5 }],
  Explosive: [{ explosive_size: 5 }, { explosive_size: 10 }, { explosive_size: 15 }, { explosive_size: 20 }, { explosive_size: 25 }],
  Gun: [{ range: 10 }, { range: 20 }, { range: 30 }, { range: 40 }, { range: 50 }],
  Heavy: [{ damage_pct: 5 }, { damage_pct: 10 }, { damage_pct: 15 }, { damage_pct: 20 }, { damage_pct: 25 }],
  Legendary: [{ max_hp: -20 }, { max_hp: -40 }, { max_hp: -60 }, { max_hp: -80 }, { max_hp: -100 }],
  Medical: [{ hp_regen: 1 }, { hp_regen: 2 }, { hp_regen: 3 }, { hp_regen: 4 }, { hp_regen: 5 }],
  Medieval: [{ armor: 1 }, { armor: 1, dodge: 3 }, { armor: 2, dodge: 3 }, { armor: 2, dodge: 6 }, { armor: 3, dodge: 6 }],
  Precise: [{ crit: 3 }, { crit: 6 }, { crit: 9 }, { crit: 12 }, { crit: 15 }],
  Primitive: [{ max_hp: 3 }, { max_hp: 6 }, { max_hp: 9 }, { max_hp: 12 }, { max_hp: 15 }],
  Support: [{ harvesting: 5 }, { harvesting: 10 }, { harvesting: 15 }, { harvesting: 20 }, { harvesting: 25 }],
  Tool: [{ engineering: 1 }, { engineering: 2 }, { engineering: 3 }, { engineering: 4 }, { engineering: 5 }],
  Unarmed: [{ dodge: 3 }, { dodge: 6 }, { dodge: 9 }, { dodge: 12 }, { dodge: 15 }],
};

function addWeaponClassBonuses(build, ctx, add) {
  const counts = new Map();
  for (const equipped of build.weapons) {
    for (const weaponClass of ctx.weapons.get(equipped.id)?.classes ?? []) {
      counts.set(weaponClass, Math.min(6, (counts.get(weaponClass) ?? 0) + 1));
    }
  }
  for (const [weaponClass, count] of counts) {
    if (count < 2) continue;
    for (const [statId, value] of Object.entries(WEAPON_CLASS_BONUSES[weaponClass]?.[count - 2] ?? {})) {
      add(statId, value, `${weaponClass} weapons ×${count}`);
    }
  }
}

/** Final stats = base + character + items (item modifiers scaled by character multipliers), then caps. */
export function computeStats(build, ctx, withBreakdown = false) {
  const ch = ctx.chars.get(build.characterId), mult = ch.statMultipliers ?? {}, final = {}, breakdown = {};
  for (const s of ctx.stats) final[s.id] = s.base ?? 0;
  const add = (id, v, source) => {
    if (!(id in final)) return;
    final[id] += v;
    if (withBreakdown) (breakdown[id] ??= []).push({ source, value: v });
  };
  addWeaponClassBonuses(build, ctx, add);
  for (const [k, v] of Object.entries(ch.statModifiers)) add(k, v, ch.name);
  for (const [id, n] of Object.entries(build.items)) {
    const it = ctx.items.get(id);
    for (const [k, v] of Object.entries(it.statModifiers)) add(k, v * n * (mult[k] ?? 1), `${it.name} ×${n}`);
  }
  for (const s of ctx.stats) {
    const cap = ch.caps?.[s.id] ?? s.max;
    if (cap != null) final[s.id] = Math.min(final[s.id], cap);
    if (s.min != null) final[s.id] = Math.max(final[s.id], s.min);
  }
  return { final, breakdown, characterStats: { ...ch.statModifiers } };
}

/** DPS = damage(base + Σ scaling × stat) × crit factor / (cooldown / attack speed). Special effects excluded. TODO verify attack speed formula. */
export function weaponDps(weapon, tier, st) {
  const t = weapon.tiers[tier - 1];
  if (!t) return 0;
  let dmg = t.baseDamage;
  for (const [k, c] of Object.entries(t.scaling)) dmg += c * (st[k] ?? 0);
  dmg *= Math.max(0, 1 + st.damage_pct / 100);
  const cd = t.cooldown / Math.max(0.1, 1 + st.attack_speed / 100);
  const cc = Math.min(1, Math.max(0, t.critChance + st.crit / 100));
  return (dmg * (1 + cc * (t.critMultiplier - 1))) / cd;
}

export const totalDps = (build, st, ctx) => build.weapons.reduce((a, w) => a + weaponDps(ctx.weapons.get(w.id), w.tier, st), 0);
