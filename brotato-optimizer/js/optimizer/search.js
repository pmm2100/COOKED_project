import { computeStats } from '../engine/stats.js';
import { canAddItem, canAddWeapon } from '../engine/validate.js';
import { analyzeBuildEffects } from '../../effect_understanding/evaluate.js';

/**
 * Beam search over "add one weapon / add one item" steps; stops when no step improves the best score.
 * @returns {{build:object, score:number, ok:boolean}[]} top cfg.results builds (ok = stat constraints met)
 */
export function search(chId, goal, cfg, ctx, deadline = Infinity) {
  const ch = ctx.chars.get(chId), maxW = Math.min(cfg.maxWeapons, ch.maxWeapons ?? 6);
  const items = [...ctx.items.values()].filter((i) => (cfg.dlc || !i.dlc) && cfg.rarities.includes(String(i.rarity)) &&
    !cfg.banned.includes(i.id) && (!cfg.noDownsides || Object.values(i.statModifiers).every((v) => v >= 0)));
  const weps = [];
  for (const w of ctx.weapons.values()) {
    if (!cfg.dlc && w.dlc) continue;
    const tiers = [1, 2, 3, 4].filter((t) => t <= cfg.preferredTier && t >= (ch.minTier ?? 1) && w.tiers[t - 1]);
    for (const t of cfg.maxPrice === Infinity ? tiers.slice(-1) : tiers) weps.push({ w, tier: t });
  }
  const viol = (f) => Object.entries(cfg.minStats).reduce((a, [k, m]) => a + Math.max(0, m - f[k]), 0);
  const evalState = (st) => {
    const b = { characterId: chId, ...st }, { final: baseStats } = computeStats(b, ctx);
    const effects = analyzeBuildEffects(b, baseStats, ctx), final = effects.final, v = viol(final);
    return { ...st, effects, score: goal.score(final, b, ctx) - (v ? 1e6 + v * 1e3 : 0), ok: !v };
  };
  const key = (st) => st.weapons.map((x) => x.id + x.tier).sort().join() + '|' + Object.entries(st.items).sort().join();
  let beam = [evalState({ weapons: [], items: {}, nItems: 0, price: 0 })], best = beam[0].score;
  for (let step = 0; step < maxW + cfg.maxItems && Date.now() < deadline; step++) {
    const next = new Map(), put = (st) => { const k = key(st); if (!next.has(k)) next.set(k, evalState(st)); };
    for (const st of beam) {
      for (const it of items) if (canAddItem(st, it, cfg)) put({ weapons: st.weapons, items: { ...st.items, [it.id]: (st.items[it.id] ?? 0) + 1 }, nItems: st.nItems + 1, price: st.price + it.price });
      if (st.weapons.length < maxW) for (const { w, tier } of weps) if (canAddWeapon(st, w, tier, cfg)) put({ weapons: [...st.weapons, { id: w.id, tier }], items: st.items, nItems: st.nItems, price: st.price + w.price[tier - 1] });
    }
    const sorted = [...next.values()].sort((a, b) => b.score - a.score).slice(0, cfg.beam);
    if (!sorted.length || sorted[0].score <= best) break;
    beam = sorted; best = sorted[0].score;
  }
  return beam.slice(0, cfg.results).map((s) => ({ build: { characterId: chId, weapons: s.weapons, items: s.items }, score: s.score, ok: s.ok, effects: s.effects }));
}
