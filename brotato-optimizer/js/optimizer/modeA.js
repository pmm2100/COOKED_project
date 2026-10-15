import { search } from './search.js';
/** Mode A: best builds for one character (10 s time limit). */
export const runModeA = (chId, goal, cfg, ctx) => search(chId, goal, cfg, ctx, Date.now() + 10000);
