import { EFFECT_VALUES } from './data/effect-values.js';

const normalize = (value) => String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const modelsByName = new Map(Object.entries(EFFECT_VALUES).map(([name, model]) => [normalize(name), model]));
export const getEffectModel = (name) => modelsByName.get(normalize(name));

const roundBy = (value, mode) => mode === 'floor' ? Math.floor(value) : mode === 'ceil' ? Math.ceil(value) : value;

/** Evaluate supported item effects after the optimizer has computed the ordinary build stats. */
export function analyzeBuildEffects(build, baseStats, ctx) {
  const modeled = [], unmodeled = [];
  const distinctWeapons = new Set((build.weapons ?? []).map((weapon) => weapon.id)).size;

  for (const [itemId, count] of Object.entries(build.items ?? {})) {
    const item = ctx.items.get(itemId);

    if (!item)
      continue;

    const model = getEffectModel(item.name);

    if (!model) {
      if (item.effects)
        unmodeled.push({ item: item.name, effect: item.effects, reason: 'No numeric model yet' });

      continue;
    }
    modeled.push({ item, model, count });
  }

  const calculate = (stats) => {
    const modifiers = {}, effectCaps = {}, entries = [];

    for (const { item, model, count } of modeled) {
      let value = 0;

      if (model.kind === 'perStat') {
        value = roundBy((stats[model.sourceStat] ?? 0) / model.divisor, model.rounding) * model.amount * count;
      } else if (model.kind === 'perWeapon') {
        value = distinctWeapons * model.amount * count;
      } else if (model.kind === 'expectedHealOnDodge') {
        const dodgeChance = Math.max(0, Math.min(90, stats.dodge ?? 0)) / 100;
        value = model.heal * model.chance * model.incomingAttacksPerSecond * dodgeChance * count;
      } else if (model.kind === 'perItemStat') {
        const sourceItemCount = Object.entries(build.items ?? {}).reduce((total, [sourceId, sourceCount]) => {
          const sourceItem = ctx.items.get(sourceId);
          return total + (sourceItem?.statModifiers?.[model.sourceStat] > 0 ? sourceCount : 0);
        }, 0);
        value = sourceItemCount * model.amount * count;
      } else if (model.kind === 'statCap') {
        const before = baseStats[model.stat] ?? 0;
        value = Math.min(before, model.cap) - before;
        effectCaps[model.stat] = Math.min(effectCaps[model.stat] ?? Infinity, model.cap);
      }

      if (!Number.isFinite(value)) continue;
      if (model.kind !== 'statCap' && value !== 0) modifiers[model.stat] = (modifiers[model.stat] ?? 0) + value;
      entries.push({
        item: item.name, effect: model.effect, stat: model.stat, value,
        applied: value !== 0 || model.kind === 'statCap',
        ...(model.estimate ? { estimate: true } : {}),
        ...(model.assumption ? { assumption: model.assumption } : {}),
      });
    }
    return { modifiers, effectCaps, entries };
  };

  const character = ctx.chars.get(build.characterId);
  const apply = ({ modifiers, effectCaps }) => {
    const final = { ...baseStats };
    for (const [statId, value] of Object.entries(modifiers)) final[statId] = (final[statId] ?? 0) + value;
    for (const stat of ctx.stats) {
      const cap = character?.caps?.[stat.id] ?? stat.max;

      if (cap != null)
        final[stat.id] = Math.min(final[stat.id], cap);

      if (effectCaps[stat.id] != null)
        final[stat.id] = Math.min(final[stat.id], effectCaps[stat.id]);

      if (stat.min != null)
        final[stat.id] = Math.max(final[stat.id], stat.min);
    }
    return final;
  };
  const changed = (left, right) => [...new Set([...Object.keys(left), ...Object.keys(right)])]
    .some((key) => Math.abs((left[key] ?? 0) - (right[key] ?? 0)) > 1e-9);

  let final = { ...baseStats };

  for (let i = 0; i < 8; i++) {
    const next = apply(calculate(final));
    if (!changed(final, next)) { final = next; break; }
    final = next;
  }
  const { modifiers, entries } = calculate(final);

  return { final, modifiers, entries, unmodeled };
}
