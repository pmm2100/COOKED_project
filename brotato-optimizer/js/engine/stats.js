// Pure functions, no DOM. ctx = result of loadData().
export const dmgTaken = (armor) => (armor >= 0 ? 15 / (15 + armor) : 1 - armor / 15); // TODO verify on /Armor
export const effectiveHp = (s) => Math.max(1, s.max_hp) / dmgTaken(s.armor) / (1 - Math.min(s.dodge, 90) / 100); // TODO verify dodge cap

/** Final stats = base + character + items (item modifiers scaled by character multipliers), then caps. */
export function computeStats(build, ctx, withBreakdown = false) {
  const ch = ctx.chars.get(build.characterId), mult = ch.statMultipliers ?? {}, final = {}, breakdown = {};
  for (const s of ctx.stats) final[s.id] = s.base ?? 0;
  const add = (id, v, source) => { final[id] += v; if (withBreakdown) (breakdown[id] ??= []).push({ source, value: v }); };
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
