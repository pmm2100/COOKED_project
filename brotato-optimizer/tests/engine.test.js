import { loadData } from '../js/data/index.js';
import { computeStats, weaponDps } from '../js/engine/stats.js';
import { analyzeBuildEffects } from '../effect_understanding/evaluate.js';
import { search } from '../js/optimizer/search.js';
import { renderBuild, renderResults } from '../js/ui/results.js';
import GOALS from '../js/objectives/goals.js';
import { loadEffectData } from '../js/data/effects.js';
const d = await loadEffectData(loadData()), out = [];
const eq = (name, got, want, tol = 0) => out.push(`${Math.abs(got - want) <= tol ? 'PASS' : 'FAIL'} ${name}: got ${got}, expected ${want}`);
const { final } = computeStats({ characterId: 'well_rounded', weapons: [], items: { alien_worm: 2 } }, d);
eq('Max HP = 5 + 2x3', final.max_hp, 11); eq('HP regen = 2x2', final.hp_regen, 4); eq('Speed', final.speed, 5);
eq('Fist tier I DPS (wiki: 10.3)', weaponDps(d.weapons.get('fist'), 1, final), 10.3, 0.1);
const g = computeStats({ characterId: 'chunky', weapons: [], items: { alien_worm: 2 } }, d).final;
eq('Chunky: Max HP x1.25 on items', g.max_hp, 7.5); eq('Chunky: HP regen x0.5 on items', g.hp_regen, 2);
const adrenaline = analyzeBuildEffects({ characterId: 'well_rounded', weapons: [], items: { adrenaline: 1 } }, { ...final, dodge: 50, hp_regen: 0 }, d);
eq('Adrenaline expected healing estimate', adrenaline.final.hp_regen, 0.3125, 0.0001);
const ghostOutfit = analyzeBuildEffects({ characterId: 'well_rounded', weapons: [], items: { ghost_outfit: 1 } }, { ...final, dodge: 80 }, d);
eq('Ghost Outfit effect caps Dodge at 70', ghostOutfit.final.dodge, 70);
const effectItems = new Map(d.items);
effectItems.set('snowball', { id: 'snowball', name: 'Snowball', statModifiers: {}, effects: '' });
effectItems.set('strange_book', { id: 'strange_book', name: 'Strange Book', statModifiers: {}, effects: '' });
effectItems.set('elemental_item', { id: 'elemental_item', name: 'Elemental Item', statModifiers: { elemental: 1 }, effects: '' });
const chainedEffects = analyzeBuildEffects({ characterId: 'well_rounded', weapons: [], items: { snowball: 1, strange_book: 1, elemental_item: 1 } },
	{ ...final, elemental: 0, engineering: 0 }, { ...d, items: effectItems });
eq('Chained effects use recalculated stats', chainedEffects.final.engineering, 1);
eq('Base JSON effect item is available to optimizer', d.items.has('bloody_hand'), true);
eq('DLC JSON effect item is available to optimizer', d.items.has('pearl'), true);
eq('Effect descriptions are populated from source JSON', d.items.get('adrenaline')?.effects.includes('5 HP'), true);
const tinyCtx = {
	stats: d.stats,
	chars: new Map([['well_rounded', d.chars.get('well_rounded')]]),
	items: new Map([['adrenaline', d.items.get('adrenaline')]]),
	weapons: new Map(),
};
const tinyConfig = {
	dlc: false, rarities: ['3'], banned: [], noDownsides: false, maxCopies: 1,
	maxItems: 1, maxWeapons: 0, preferredTier: 4, maxPrice: Infinity,
	minStats: {}, beam: 10, results: 1, allowDup: false,
};
const effectSearch = search('well_rounded', { score: (stats) => stats.hp_regen }, tinyConfig, tinyCtx);
eq('Search scoring includes modeled item effects', effectSearch[0]?.score, 0.03125, 0.0001);
eq('Search selects effect item', effectSearch[0]?.build.items.adrenaline, 1);
if (typeof document !== 'undefined') {
	const card = renderBuild({ build: { characterId: 'well_rounded', weapons: [], items: {} }, score: 5, ok: true }, d, GOALS[0]);
	eq('Build result uses styled card class', card.classList.contains('build-card'), true);
	eq('Goal statistic uses styled highlight class', Boolean(card.querySelector('tr.is-goal')), true);
	const rankRoot = document.createElement('div');
	renderResults(rankRoot, [{ build: { characterId: 'well_rounded', weapons: [], items: {} }, score: 5, ok: true,
		character: d.chars.get('well_rounded') }], d, GOALS[0], 'B');
	const rankButton = rankRoot.querySelector('.rank-toggle');
	const rankDetail = rankRoot.querySelector('.rank-detail');
	eq('Mode B uses styled rank row', Boolean(rankRoot.querySelector('.rank-row')), true);
	rankButton.click();
	eq('Mode B rank expands on click', rankButton.getAttribute('aria-expanded') === 'true', true);
	eq('Mode B detail becomes visible', rankDetail.hidden, false);
}
if (typeof document !== 'undefined') document.getElementById('out').textContent = out.join('\n') + (d.warnings.length ? '\nWARN ' + d.warnings : '');
else console.log(out.join('\n'));
