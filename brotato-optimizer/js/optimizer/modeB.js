import { search } from './search.js';
/** Mode B: best build for every allowed character, ranked by score. Yields to the UI between characters. */
export async function runModeB(goal, cfg, ctx, { onProgress = () => {}, signal = {}, limitMs = 10000 } = {}) {
  const deadline = Date.now() + limitMs, rows = [];
  const chars = [...ctx.chars.values()].filter((c) => cfg.dlc || !c.dlc);
  for (const [i, c] of chars.entries()) {
    if (signal.cancelled || Date.now() > deadline) break;
    const r = search(c.id, goal, { ...cfg, results: 1 }, ctx, deadline)[0];
    if (r) rows.push({ ...r, character: c });
    onProgress((i + 1) / chars.length);
    await new Promise((res) => setTimeout(res));
  }
  return rows.sort((a, b) => b.score - a.score);
}
