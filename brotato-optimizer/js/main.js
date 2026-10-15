import { loadData } from './data/index.js';
import GOALS from './objectives/goals.js';
import OPTIONS, { buildConfig } from './objectives/options.js';
import { buildOptions, sanitize } from './ui/form.js';
import { renderResults, renderMessage } from './ui/results.js';
import { el } from './ui/components.js';
import { runModeA } from './optimizer/modeA.js';
import { runModeB } from './optimizer/modeB.js';

const KEY = 'bbo:v1', $ = (id) => document.getElementById(id);
const data = loadData(), goals = new Map(GOALS.map((g) => [g.id, g]));

function load() {
  let raw = {};
  try { raw = JSON.parse(localStorage.getItem(KEY)) ?? {}; } catch { /* ignore broken storage */ }
  return { mode: raw.mode === 'B' ? 'B' : 'A', character: data.chars.has(raw.character) ? raw.character : data.chars.keys().next().value,
    goal: goals.has(raw.goal) ? raw.goal : GOALS[0].id, values: sanitize(raw.values, OPTIONS, data) };
}
const state = load();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable */ } };

function sync() {
  $('goal').value = state.goal;
  $('char').value = data.chars.get(state.character).name;
  $('charRow').hidden = state.mode !== 'A';
  $('modeA').setAttribute('aria-pressed', state.mode === 'A');
  $('modeB').setAttribute('aria-pressed', state.mode === 'B');
  buildOptions($('options'), OPTIONS, state.values, data, save);
}
function busy(on) { $('bar').hidden = !on; $('bar').value = 0; $('go').disabled = on; $('cancel').hidden = !on; }

if (data.warnings.length) { $('banner').hidden = false; $('banner').textContent = 'Data warnings: ' + data.warnings.join('; '); }
$('goal').replaceChildren(...GOALS.map((g) => el('option', { value: g.id, textContent: g.label, title: g.description })));
$('chars').replaceChildren(...[...data.chars.values()].map((c) => el('option', { value: c.name })));
$('modeA').onclick = () => { state.mode = 'A'; save(); sync(); };
$('modeB').onclick = () => { state.mode = 'B'; save(); sync(); };
$('goal').onchange = (e) => { if (goals.has(e.target.value)) { state.goal = e.target.value; save(); } };
$('char').onchange = (e) => {
  const c = [...data.chars.values()].find((x) => x.name.toLowerCase() === e.target.value.trim().toLowerCase());
  if (c) state.character = c.id; e.target.value = data.chars.get(state.character).name; save();
};
$('reset').onclick = () => { state.values = sanitize({}, OPTIONS, data); save(); sync(); };

let signal = { cancelled: false };
$('cancel').onclick = () => { signal.cancelled = true; };
$('form').addEventListener('submit', async (e) => {
  e.preventDefault(); save();
  const cfg = buildConfig(state.values), goal = goals.get(state.goal), root = $('results');
  signal = { cancelled: false }; busy(true); renderMessage(root, 'Searching…');
  try {
    const rows = state.mode === 'A' ? runModeA(state.character, goal, cfg, data)
      : await runModeB(goal, cfg, data, { signal, onProgress: (p) => { $('bar').value = p; } });
    renderResults(root, rows, data, goal, state.mode);
  } catch (err) { renderMessage(root, 'The search failed: ' + err.message); } finally { busy(false); }
});
sync();
