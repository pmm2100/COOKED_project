import { computeStats, totalDps } from '../engine/stats.js';
import { canAddItem, canAddWeapon } from '../engine/validate.js';
import { analyzeBuildEffects } from '../../effect_understanding/evaluate.js';

/**
 * Beam search over "add one weapon / add one item" steps; stops when no step improves the best score.
 * @returns {{build:object, score:number, ok:boolean}[]} top cfg.results builds (ok = stat constraints met)
 */
export function search(chId, goal, cfg, ctx, deadline = Infinity, onProgress = () => {}) {
  const ch = ctx.chars.get(chId), maxW = Math.max(0, Math.min(cfg.maxWeapons, ch.maxWeapons ?? 6));
  let evaluations = 0;
  const items = [...ctx.items.values()].filter((i) => (cfg.dlc || !i.dlc) && cfg.rarities.includes(String(i.rarity)) &&
    !cfg.banned.includes(i.id) && (!cfg.noDownsides || Object.values(i.statModifiers).every((v) => v >= 0)));
  const cheapestItem = Math.min(...items.map((item) => item.price).filter((price) => Number.isFinite(price) && price > 0));
  const budgetItemLimit = cfg.maxPrice === Infinity || !Number.isFinite(cheapestItem)
    ? cfg.maxItems
    : Math.floor(cfg.maxPrice / cheapestItem);
  const maxItems = Math.min(cfg.maxItems, budgetItemLimit);
  const minItems = cfg.minItems ?? 0;
  const requireWeapon = cfg.requireWeapon ?? true;
  const itemConfig = { ...cfg, maxItems };
  const totalSteps = Math.max(1, maxW + maxItems);
  const candidates = [];
  const weps = [];
  for (const w of ctx.weapons.values()) {
    if (!cfg.dlc && w.dlc) continue;
    const tiers = [1, 2, 3, 4].filter((t) => t <= cfg.preferredTier && t >= (ch.minTier ?? 1) &&
      w.tiers[t - 1] && Number.isFinite(w.price?.[t - 1]));
    for (const t of tiers) weps.push({ w, tier: t });
  }
  const maxEvaluations = Math.max(
    1000000,
    cfg.beam * (items.length + weps.length + 1) * Math.max(1, Math.min(totalSteps, 60)) * 4,
  );
  const viol = (f) => Object.entries(cfg.minStats).reduce((a, [k, m]) => a + Math.max(0, m - f[k]), 0);
  const goalClasses = {
    max_hp: ['Primitive', 'Blunt'],
    hp_regen: ['Medical'],
    life_steal: ['Blade'],
    melee: ['Blade', 'Heavy', 'Primitive'],
    ranged: ['Gun'],
    elemental: ['Elemental'],
    crit: ['Precise'],
    armor: ['Blunt', 'Medieval'],
    dodge: ['Ethereal', 'Unarmed'],
    range: ['Gun'],
    harvesting: ['Support'],
    engineering: ['Tool'],
  };
  const preferredClasses = goalClasses[goal.stat] ?? [];
  const weaponGoalScore = (weapons) => weapons.reduce(
    (sum, weapon) => sum + (preferredClasses.some((weaponClass) => ctx.weapons.get(weapon.id)?.classes.includes(weaponClass)) ? 1 : 0),
    0,
  );
  const rank = (a, b) => b.score - a.score ||
    b.weaponGoalScore - a.weaponGoalScore ||
    b.weaponTierScore - a.weaponTierScore ||
    b.weapons.length - a.weapons.length ||
    b.tieScore - a.tieScore;
  let currentStep = 0;
  const evalState = (st) => {
    evaluations++;
    if (evaluations % 100 === 0) onProgress(Math.min(0.99, (currentStep + evaluations / maxEvaluations) / totalSteps));
    const b = { characterId: chId, ...st }, { final: baseStats } = computeStats(b, ctx);
    const effects = analyzeBuildEffects(b, baseStats, ctx), final = effects.final, v = viol(final);
    const score = goal.score(final, b, ctx) - (v ? 1e6 + v * 1e3 : 0);
    const distinctWeapons = new Set(st.weapons.map(({ id }) => id)).size;
    const result = {
      ...st,
      effects,
      score,
      weaponGoalScore: weaponGoalScore(st.weapons),
      weaponTierScore: st.weapons.reduce((sum, weapon) => sum + weapon.tier, 0),
      tieScore: st.weapons.length * 1e9 + totalDps(b, final, ctx) * 1e3 + distinctWeapons,
      ok: !v,
    };
    if ((!requireWeapon || st.weapons.length > 0) && st.nItems >= minItems) candidates.push(result);
    return result;
  };
  const key = (st) => st.weapons.map((x) => `${x.id}:${x.tier}`).sort().join('|') + '|' +
    Object.entries(st.items).sort(([a], [b]) => a.localeCompare(b)).map(([id, count]) => `${id}:${count}`).join('|');
  let beam = [evalState({ weapons: [], items: {}, nItems: 0, price: 0 })];
  for (let step = 0; step < totalSteps && Date.now() < deadline && evaluations < maxEvaluations; step++) {
    currentStep = step;
    const next = new Map(), put = (st) => { const k = key(st); if (!next.has(k)) next.set(k, evalState(st)); };
    for (const st of beam) {
      if (st.weapons.length < maxW) for (const { w, tier } of weps) {
        if (evaluations >= maxEvaluations) break;
        if (canAddWeapon(st, w, tier, cfg)) put({ weapons: [...st.weapons, { id: w.id, tier }], items: st.items, nItems: st.nItems, price: st.price + w.price[tier - 1] });
      }
      for (const it of items) {
        if (evaluations >= maxEvaluations) break;
        if (canAddItem(st, it, itemConfig)) put({ weapons: st.weapons, items: { ...st.items, [it.id]: (st.items[it.id] ?? 0) + 1 }, nItems: st.nItems + 1, price: st.price + it.price });
      }
    }
    const ranked = [...next.values()].sort(rank);
    const protectedWeaponCounts = new Map();
    for (const state of ranked) {
      if (!protectedWeaponCounts.has(state.weapons.length)) protectedWeaponCounts.set(state.weapons.length, state);
    }
    const protectedStates = [...protectedWeaponCounts.values()].sort(rank);
    const protectedKeys = new Set(protectedStates.map((state) => state));
    const sorted = [
      ...protectedStates,
      ...ranked.filter((state) => !protectedKeys.has(state)),
    ].slice(0, cfg.beam);
    if (!sorted.length) break;
    beam = sorted;
    onProgress(Math.min(0.99, (step + 1) / totalSteps));
  }
  onProgress(0.99);
  return candidates.sort(rank).slice(0, cfg.results)
    .map((s) => ({ build: { characterId: chId, weapons: s.weapons, items: s.items }, score: s.score, ok: s.ok, effects: s.effects }));
}
