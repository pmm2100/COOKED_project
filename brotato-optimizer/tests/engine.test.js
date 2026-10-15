import { loadData } from '../js/data/index.js';
import { computeStats, weaponDps } from '../js/engine/stats.js';
import { analyzeBuildEffects } from '../effect_understanding/evaluate.js';
import { search } from '../js/optimizer/search.js';
import { canAddItem, canAddWeapon } from '../js/engine/validate.js';
import { renderBuild, renderResults } from '../js/ui/results.js';
import GOALS from '../js/objectives/goals.js';
import { loadEffectData } from '../js/data/effects.js';
const d = await loadEffectData(loadData()), out = [];
const eq = (name, got, want, tol = 0) => out.push(`${Math.abs(got - want) <= tol ? 'PASS' : 'FAIL'} ${name}: got ${got}, expected ${want}`);
const same = (name, got, want) => out.push(`${got === want ? 'PASS' : 'FAIL'} ${name}: got ${got}, expected ${want}`);
const { final } = computeStats({ characterId: 'well_rounded', weapons: [], items: { alien_worm: 2 } }, d);
eq('Max HP = 10 + 5 + 2x3', final.max_hp, 21); eq('HP regen = 2x2', final.hp_regen, 4); eq('Speed', final.speed, 5);
eq('Base Max HP is included without items', computeStats({ characterId: 'well_rounded', weapons: [], items: {} }, d).final.max_hp, 15);
eq('Character Max HP is included before item stats', final.max_hp - 2 * d.items.get('alien_worm').statModifiers.max_hp, 15);
eq('Max HP cannot become negative', computeStats({ characterId: 'brawler', weapons: [
	{ id: 'scythe', tier: 4 }, { id: 'scythe', tier: 4 }, { id: 'scythe', tier: 4 },
	{ id: 'scythe', tier: 4 }, { id: 'scythe', tier: 4 }, { id: 'scythe', tier: 4 },
], items: { leather_vest: 5, blindfold: 5 } }, d).final.max_hp, 1);
eq('Fist tier I DPS (wiki: 10.3)', weaponDps(d.weapons.get('fist'), 1, final), 10.3, 0.1);
const classStats = computeStats({ characterId: 'well_rounded', weapons: [
	{ id: 'fist', tier: 1 }, { id: 'fist', tier: 1 }, { id: 'fist', tier: 1 },
], items: {} }, d).final;
eq('Unarmed class bonus is applied', classStats.dodge, 6);
eq('Weapon class bonus supports Life Steal builds', computeStats({ characterId: 'well_rounded', weapons: [
	{ id: 'sword', tier: 1 }, { id: 'sword', tier: 1 },
], items: {} }, d).final.life_steal, 1);
const g = computeStats({ characterId: 'chunky', weapons: [], items: { alien_worm: 2 } }, d).final;
eq('Chunky: Max HP x1.25 on items', g.max_hp, 17.5); eq('Chunky: HP regen x0.5 on items', g.hp_regen, 2);
const adrenaline = analyzeBuildEffects({ characterId: 'well_rounded', weapons: [], items: { adrenaline: 1 } }, { ...final, dodge: 50, hp_regen: 0 }, d);
eq('Adrenaline expected healing estimate', adrenaline.final.hp_regen, 0.3125, 0.0001);
const ghostOutfit = analyzeBuildEffects({ characterId: 'well_rounded', weapons: [], items: { ghost_outfit: 1 } }, { ...final, dodge: 80 }, d);
eq('Ghost Outfit effect caps Dodge at 70', ghostOutfit.final.dodge, 70);
const copyConfig = { maxCopies: 99, maxItems: 100, maxPrice: Infinity };
for (const [rarity, limit] of [[1, 8], [2, 5], [3, 3], [4, 1]]) {
	const item = { id: `tier_${rarity}`, rarity, price: 1 };
	eq(`Tier ${rarity} allows ${limit} copies`, canAddItem({ nItems: limit - 1, items: { [item.id]: limit - 1 }, price: 0 }, item, copyConfig), true);
	eq(`Tier ${rarity} blocks copy ${limit + 1}`, canAddItem({ nItems: limit, items: { [item.id]: limit }, price: 0 }, item, copyConfig), false);
}
same('Duplicate weapons are blocked by default', canAddWeapon({ weapons: [{ id: 'test', tier: 1 }], price: 0 },
	{ id: 'test', price: [10], tiers: [{}] }, 1, { allowDup: false, maxPrice: Infinity }), false);
same('Missing weapon prices are not treated as free', canAddWeapon({ weapons: [], price: [0] },
	{ id: 'test', price: [null], tiers: [{}] }, 1, { allowDup: true, maxPrice: Infinity }), false);
same('Missing item prices are not treated as free', canAddItem({ nItems: 0, items: {}, price: 0 },
	{ id: 'test', rarity: 1, price: null }, { maxCopies: 99, maxItems: 1, maxPrice: Infinity }), false);
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
eq('All JSON item records are available to optimizer', d.items.size, 247);
eq('JSON character records are available to optimizer', d.chars.size, 64);
same('Character unlock metadata is loaded', d.chars.get('generalist')?.unlocks, 'Big Arms');
eq('Character starting items are loaded', d.chars.get('mage')?.startingItems.includes('Snake'), true);
eq('Character tags are loaded', d.chars.get('generalist')?.itemTags.includes('Melee Damage'), true);
eq('Original Brawler ranged penalty is applied', d.chars.get('brawler')?.statModifiers.ranged, -50);
eq('Original Chunky consumable stat is applied', d.chars.get('chunky')?.statModifiers.hp_recovered_from_consumables, 3);
eq('Original Ranger range stat is applied', d.chars.get('ranger')?.statModifiers.range, 50);
eq('Wiki weapon records are available to optimizer', d.weapons.size >= 78, true);
eq('Wiki ranged weapon is searchable', d.weapons.has('blunderbuss'), true);
const tinyCtx = {
	stats: d.stats,
	chars: new Map([['well_rounded', d.chars.get('well_rounded')]]),
	items: new Map([['adrenaline', d.items.get('adrenaline')]]),
	weapons: new Map(),
};
const tinyConfig = {
	dlc: false, rarities: ['3'], banned: [], noDownsides: false, maxCopies: 1,
	maxItems: 1, maxWeapons: 0, preferredTier: 4, maxPrice: Infinity,
	minStats: {}, beam: 10, results: 1, allowDup: false, requireWeapon: false,
};
const effectSearch = search('well_rounded', { score: (stats) => stats.hp_regen }, tinyConfig, tinyCtx);
eq('Search scoring includes modeled item effects', effectSearch[0]?.score, 0.03125, 0.0001);
eq('Search selects effect item', effectSearch[0]?.build.items.adrenaline, 1);
const budgetSearch = search('well_rounded', { score: (stats) => stats.max_hp }, {
  ...tinyConfig, rarities: ['1'], maxCopies: 99, minItems: 2, maxItems: 5, maxPrice: 30,
}, { ...tinyCtx, items: new Map([['cheap', { id: 'cheap', name: 'Cheap', rarity: 1, price: 10, statModifiers: { max_hp: 1 }, effects: '' }]]) });
same('Search respects minimum item count', (budgetSearch[0]?.build.items.cheap ?? 0) >= 2, true);
eq('Search limits items by budget', Object.values(budgetSearch[0]?.build.items ?? {}).reduce((sum, count) => sum + count, 0), 3);
const deepSearch = search('well_rounded', { score: (stats) => stats.max_hp }, {
  ...tinyConfig, rarities: ['3'], maxCopies: 99, minItems: 0, maxItems: 30, maxPrice: 3000,
}, { ...tinyCtx, items: new Map([['alien_baby', { id: 'alien_baby', name: 'Alien Baby', rarity: 3, price: 80, statModifiers: { max_hp: 15 }, effects: '' }]]) });
eq('Search explores beyond the first two items', deepSearch[0]?.build.items.alien_baby, 3);
const weaponTieSearch = search('well_rounded', { score: (stats) => stats.max_hp }, {
	...tinyConfig, rarities: [], maxItems: 0, maxWeapons: 1, beam: 100, results: 1,
}, d);
same('Weapon ties prefer highest DPS instead of first registry weapon', weaponTieSearch[0]?.build.weapons[0]?.id, 'excalibur');
const tierSearch = search('well_rounded', { score: (stats) => stats.max_hp }, {
	...tinyConfig, rarities: [], maxItems: 0, maxWeapons: 1, preferredTier: 2, maxPrice: Infinity, allowDup: false, beam: 100, results: 1,
}, d);
same('Weapon search keeps tiers at or below selected tier', tierSearch[0]?.build.weapons[0]?.tier <= 2, true);
const budgetWeaponSearch = search('well_rounded', { score: (stats) => stats.max_hp }, {
	...tinyConfig, rarities: [], maxItems: 0, maxWeapons: 1, maxPrice: 20, beam: 100, results: 1,
}, d);
same('Weapon budget excludes unaffordable tier', budgetWeaponSearch[0]?.build.weapons[0]?.tier, 1);
const multiWeaponSearch = search('well_rounded', { score: (stats) => stats.life_steal }, {
	...tinyConfig, rarities: [], maxItems: 0, maxWeapons: 4, beam: 100, results: 1,
}, d);
eq('Search fills available weapon slots for a weapon-focused build', multiWeaponSearch[0]?.build.weapons.length, 4);
const fullWeaponSearch = search('well_rounded', { score: (stats) => stats.max_hp }, {
	...tinyConfig, rarities: ['1'], maxItems: 30, maxWeapons: 6, beam: 12, results: 1,
}, d);
eq('Search preserves six-weapon paths with item search enabled', fullWeaponSearch[0]?.build.weapons.length, 6);
same('Characters that cannot equip weapons return no required-weapon build', search('bull', { score: (stats) => stats.max_hp }, {
	...tinyConfig, rarities: [], maxItems: 0, maxWeapons: 6, results: 1, requireWeapon: true,
}, d).length, 0);
const harvestingCtx = {
	...tinyCtx,
	items: new Map([['harvesting_item', { id: 'harvesting_item', name: 'Harvesting Item', rarity: 1, price: 10, statModifiers: { harvesting: 25 }, effects: '' }]]),
	weapons: new Map([['test_weapon', { id: 'test_weapon', name: 'Test Weapon', price: [10, 20, 40, 80],
		tiers: [{ baseDamage: 1, cooldown: 1, scaling: {} }, { baseDamage: 2, cooldown: 1, scaling: {} },
			{ baseDamage: 3, cooldown: 1, scaling: {} }, { baseDamage: 4, cooldown: 1, scaling: {} }], classes: [] }]]),
};
const harvestingSearch = search('well_rounded', { score: (stats) => stats.harvesting }, {
	...tinyConfig, rarities: ['1'], maxItems: 1, maxWeapons: 1, beam: 20, results: 1,
}, harvestingCtx);
same('Harvesting search keeps the best harvesting item', harvestingSearch[0]?.build.items.harvesting_item, 1);
const unrestrictedTierSearch = search('well_rounded', { score: () => 0 }, {
	...tinyConfig, rarities: [], maxItems: 0, maxWeapons: 1, beam: 20, results: 1,
}, harvestingCtx);
same('Unrestricted weapon search prefers tier IV', unrestrictedTierSearch[0]?.build.weapons[0]?.tier, 4);
const harvestingWeaponSearch = search('well_rounded', GOALS.find((goal) => goal.id === 'stat_harvesting'), {
	...tinyConfig, rarities: [], maxItems: 0, maxWeapons: 1, beam: 100, results: 1,
}, d);
same('Harvesting search prefers Support weapons over Excalibur', d.weapons.get(harvestingWeaponSearch[0]?.build.weapons[0]?.id)?.classes.includes('Support'), true);
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
