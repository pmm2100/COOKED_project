import { loadData } from '../data/index.js';
import GOALS from '../objectives/goals.js';
import { search } from './search.js';
import { runModeB } from './modeB.js';

const ctx = loadData();
const goals = new Map(GOALS.map((goal) => [goal.id, goal]));

self.addEventListener('message', async ({ data }) => {
  const goal = goals.get(data.goalId);
  if (!goal) {
    self.postMessage({ type: 'error', message: `Unknown goal: ${data.goalId}` });
    return;
  }

  try {
    const rows = data.mode === 'A'
      ? search(data.characterId, goal, data.config, ctx, Date.now() + 10000)
      : await runModeB(goal, data.config, ctx, {
        limitMs: 10000,
        onProgress: (progress) => self.postMessage({ type: 'progress', progress }),
      });
    self.postMessage({ type: 'done', rows });
  } catch (error) {
    self.postMessage({ type: 'error', message: error?.message ?? String(error) });
  }
});
