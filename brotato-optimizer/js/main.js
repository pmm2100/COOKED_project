import { loadData } from './data/index.js';
import GOALS from './objectives/goals.js';
import OPTIONS, { buildConfig } from './objectives/options.js';
import { buildOptions, sanitize } from './ui/form.js';
import { renderResults } from './ui/results.js';
import { el } from './ui/components.js';

const KEY = 'bbo:v1', $ = (id) => document.getElementById(id);
const data = loadData(), goals = new Map(GOALS.map((g) => [g.id, g]));
let activeWorker = null, cancelActiveSearch = null;

function load() {
  let raw = {};
  try { raw = JSON.parse(localStorage.getItem(KEY)) ?? {}; } catch { /* ignore broken storage */ }
  return { mode: raw.mode === 'B' ? 'B' : 'A', character: data.chars.has(raw.character) ? raw.character : data.chars.keys().next().value,
    goal: goals.has(raw.goal) ? raw.goal : GOALS[0].id, values: sanitize(raw.values, OPTIONS, data) };
}
const state = load();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable */ } };

function sync() {
  $('goal-select').value = state.goal;
  $('goal-description').textContent = goals.get(state.goal)?.description ?? '';
  $('opt-dlc').checked = state.values.dlc;
  $('character-search').value = data.chars.get(state.character)?.name ?? '';
  $('character-select').value = state.character;
  $('field-character').hidden = state.mode !== 'A';
  $('mode-a').checked = state.mode === 'A';
  $('mode-b').checked = state.mode === 'B';
  buildOptions($('options-root'), OPTIONS.filter((option) => option.id !== 'dlc'), state.values, data, save);
}
function setState(name) {
  for (const id of ['state-idle', 'state-loading', 'state-empty', 'state-error']) $(id).hidden = name !== id;
}
function busy(on) {
  $('btn-generate').disabled = on;
  $('btn-cancel').hidden = !on;
  $('progress-bar').style.width = '0%';
  $('progress-bar').parentElement.setAttribute('aria-valuenow', '0');
}
function updateCharacter(id) {
  if (!data.chars.has(id)) return;
  state.character = id;
  $('character-search').value = data.chars.get(id).name;
  $('character-select').value = id;
  save();
}
function runOptimization(mode, goalId, characterId, config, onProgress) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./optimizer/worker.js', import.meta.url), { type: 'module' });
    activeWorker = worker;
    const finish = (handler, value) => {
      worker.terminate();
      if (activeWorker === worker) {
        activeWorker = null;
        cancelActiveSearch = null;
      }
      handler(value);
    };
    cancelActiveSearch = () => finish(resolve, { cancelled: true });
    worker.addEventListener('message', ({ data: message }) => {
      if (activeWorker !== worker) return;
      if (message.type === 'progress') onProgress(message.progress);
      else if (message.type === 'done') finish(resolve, { rows: message.rows });
      else if (message.type === 'error') finish(reject, new Error(message.message));
    });
    worker.addEventListener('error', (event) => {
      event.preventDefault();
      finish(reject, new Error(event.message || 'Optimizer worker failed.'));
    });
    worker.postMessage({ mode, goalId, characterId, config });
  });
}

if (data.warnings.length) { $('data-banner').hidden = false; $('data-banner').textContent = 'Data warnings: ' + data.warnings.join('; '); }
$('goal-select').replaceChildren(...GOALS.map((g) => el('option', { value: g.id, textContent: g.label, title: g.description })));
$('character-list').replaceChildren(...[...data.chars.values()].map((c) => el('option', { value: c.name })));
$('character-select').replaceChildren(...[...data.chars.values()].map((c) => el('option', { value: c.id, textContent: c.name })));
$('mode-a').addEventListener('change', () => { if ($('mode-a').checked) { state.mode = 'A'; save(); sync(); } });
$('mode-b').addEventListener('change', () => { if ($('mode-b').checked) { state.mode = 'B'; save(); sync(); } });
$('goal-select').onchange = (e) => {
  if (goals.has(e.target.value)) {
    state.goal = e.target.value;
    $('goal-description').textContent = goals.get(state.goal).description;
    save();
  }
};
$('opt-dlc').onchange = (e) => { state.values.dlc = e.target.checked; save(); };
$('character-select').onchange = (e) => updateCharacter(e.target.value);
$('character-search').onchange = (e) => {
  const c = [...data.chars.values()].find((x) => x.name.toLowerCase() === e.target.value.trim().toLowerCase());
  if (c) updateCharacter(c.id);
  else e.target.value = data.chars.get(state.character)?.name ?? '';
};
$('build-form').addEventListener('reset', (e) => {
  e.preventDefault();
  cancelActiveSearch?.();
  state.mode = 'A';
  state.character = data.chars.keys().next().value;
  state.goal = GOALS[0].id;
  state.values = sanitize({}, OPTIONS, data);
  save();
  sync();
  $('results-list').replaceChildren();
  setState('state-idle');
});

$('btn-cancel').onclick = () => cancelActiveSearch?.();
$('build-form').addEventListener('submit', async (e) => {
  e.preventDefault(); save();
  const cfg = buildConfig(state.values), goal = goals.get(state.goal), root = $('results-list');
  busy(true);
  setState('state-loading');
  root.replaceChildren();
  try {
    const result = await runOptimization(state.mode, state.goal, state.character, cfg, (p) => {
        const progress = Math.round(p * 100);
        $('progress-bar').style.width = `${progress}%`;
        $('progress-bar').parentElement.setAttribute('aria-valuenow', String(progress));
      });
    if (result.cancelled) setState('state-idle');
    else if (!result.rows.length) setState('state-empty');
    else {
      setState(null);
      renderResults(root, result.rows, data, goal, state.mode);
    }
  } catch (err) {
    $('error-message').textContent = err.message;
    setState('state-error');
  } finally { busy(false); }
});
sync();
