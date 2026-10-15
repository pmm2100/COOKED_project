import { search } from './search.js';
/** Mode A: best builds for one character (60 s time limit). */
export const runModeA = (chId, goal, cfg, ctx) => search(chId, goal, cfg, ctx, Date.now() + 60000);
