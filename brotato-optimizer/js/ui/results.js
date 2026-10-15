import { el } from './components.js';
import { computeStats, totalDps } from '../engine/stats.js';
import { analyzeBuildEffects } from '../../effect_understanding/evaluate.js';
const ROMAN = ['I', 'II', 'III', 'IV'], fmt = (n) => String(Math.round(n * 10) / 10);

const parts = (b, ctx) => ({
  weapons: b.weapons.map((w) => `${ctx.weapons.get(w.id).name} ${ROMAN[w.tier - 1]}`),
  items: Object.entries(b.items).map(([id, n]) => `${ctx.items.get(id).name} ×${n}`),
});
export function buildText(b, ctx, score) {
  const p = parts(b, ctx);
  return `${ctx.chars.get(b.characterId).name} (score ${fmt(score)})\nWeapons: ${p.weapons.join(', ') || 'none'}\nItems: ${p.items.join(', ') || 'none'}`;
}
export const renderMessage = (root, text) => root.replaceChildren(el('p', {}, text));

export function renderBuild(r, ctx, goal) {
  const b = r.build, ch = ctx.chars.get(b.characterId), { final: baseStats, breakdown } = computeStats(b, ctx, true), p = parts(b, ctx);
  const effects = analyzeBuildEffects(b, baseStats, ctx), final = effects.final;
  const rows = ctx.stats.filter((s) => final[s.id]).map((s) => el('tr', { class: goal.stat === s.id ? 'goal' : '' },
    el('th', { scope: 'row' }, s.name), el('td', { class: final[s.id] < 0 ? 'neg' : '' }, fmt(final[s.id]) + (s.unit === 'percent' ? '%' : ''))));
  rows.push(el('tr', {}, el('th', { scope: 'row' }, 'Total DPS'), el('td', {}, fmt(totalDps(b, final, ctx)))));
  const notes = [...new Set([ch.note && `${ch.name}: ${ch.note}`,
    ...effects.unmodeled.map((x) => `${x.item}: ${x.effect}`),
    ...b.weapons.map((w) => ctx.weapons.get(w.id).note)].filter(Boolean))];
  const copy = (e) => navigator.clipboard?.writeText(buildText(b, ctx, r.score)).then(() => { e.target.textContent = 'Copied'; });
  return el('article', { class: 'card' },
    el('h3', {}, ch.name),
    el('p', { class: 'score' }, `${goal.label}: ${fmt(r.score)}`, r.ok ? '' : ' (stat constraints not met)'),
    el('p', {}, el('strong', {}, 'Weapons: '), p.weapons.join(', ') || 'none'),
    el('p', {}, el('strong', {}, 'Items: '), p.items.join(', ') || 'none'),
    el('table', {}, el('tbody', {}, rows)),
    effects.entries.length ? el('details', { open: true }, el('summary', {}, 'Numeric effects included in score'), el('ul', {}, effects.entries.map((x) =>
      el('li', {}, `${x.item}: ${x.stat} ${x.value > 0 ? '+' : ''}${fmt(x.value)}${x.estimate ? ' (estimate)' : ''} (${x.effect})${x.assumption ? ` — ${x.assumption}` : ''}`)))) : null,
    notes.length ? el('details', {}, el('summary', {}, 'Effects not included in calculation'), el('ul', {}, notes.map((n) => el('li', {}, n)))) : null,
    el('details', {}, el('summary', {}, 'Where the numbers come from'), el('ul', {}, Object.entries(breakdown).map(([id, src]) =>
      el('li', {}, `${ctx.stats.find((s) => s.id === id).name}: ${src.map((x) => `${x.source} ${x.value > 0 ? '+' : ''}${fmt(x.value)}`).join(', ')}`)))),
    el('button', { type: 'button', onclick: copy }, 'Copy build as text'));
}

export function renderResults(root, rows, ctx, goal, mode) {
  if (!rows.length) return renderMessage(root, 'No build matches your constraints. Relax the options and try again.');
  if (mode === 'A') return root.replaceChildren(...rows.map((r) => renderBuild(r, ctx, goal)));
  root.replaceChildren(...rows.map((r, i) => el('details', { class: 'rank', open: i === 0 },
    el('summary', {}, `${i + 1}. ${r.character.name}, ${goal.label}: ${fmt(r.score)}`), renderBuild(r, ctx, goal))));
}
