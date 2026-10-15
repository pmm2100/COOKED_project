import { el } from './components.js';

export const clampNum = (v, o) => { const n = Number(v); return Number.isFinite(n) ? Math.min(o.max, Math.max(o.min, Math.round(n))) : o.default; };
const choicesOf = (o, data) => (typeof o.choices === 'function' ? o.choices(data) : o.choices);

/** Validates untrusted values (localStorage) against the option registry. */
export function sanitize(raw, options, data) {
  const out = {};
  for (const o of options) {
    const v = raw?.[o.id];
    if (o.type === 'toggle') out[o.id] = typeof v === 'boolean' ? v : o.default;
    else if (o.type === 'number') out[o.id] = clampNum(v, o);
    else { const ok = new Set(choicesOf(o, data).map((c) => c.value)); out[o.id] = Array.isArray(v) ? v.filter((x) => ok.has(x)) : o.default; }
  }
  return out;
}

/** Renders the whole options section from the registry. */
export function buildOptions(root, options, values, data, onChange) {
  const set = (o, v) => { values[o.id] = v; onChange(); };
  const field = (o) => {
    const id = 'opt-' + o.id;
    if (o.type === 'toggle') return el('label', { class: 'row' }, o.label, el('input', { type: 'checkbox', id, checked: values[o.id], onchange: (e) => set(o, e.target.checked) }));
    if (o.type === 'number') return el('label', { class: 'row' }, o.label, el('input', { type: 'number', id, min: o.min, max: o.max, value: values[o.id], onchange: (e) => { e.target.value = clampNum(e.target.value, o); set(o, Number(e.target.value)); } }));
    return el('fieldset', {}, el('legend', {}, o.label), choicesOf(o, data).map((c) => el('label', { class: 'chk' },
      el('input', { type: 'checkbox', checked: values[o.id].includes(c.value), onchange: (e) => { const s = new Set(values[o.id]); e.target.checked ? s.add(c.value) : s.delete(c.value); set(o, [...s]); } }), c.label)));
  };
  root.replaceChildren(...[...new Set(options.map((o) => o.group))].map((g) =>
    el('details', { open: g === 'Content' }, el('summary', {}, g), el('div', { class: 'grp' }, options.filter((o) => o.group === g).map(field)))));
}
