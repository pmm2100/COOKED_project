# Brotato Build Optimizer

Czysty JS (moduły ES), bez backendu i bez bundlera. Dane z https://brotato.wiki.spellsandguns.com (Characters, Items, Weapons).

## Uruchomienie
Moduły ES nie działają z `file://`, więc:
```
python -m http.server 8000     # albo: npx serve
```
i otwórz http://localhost:8000. Testy: http://localhost:8000/tests/engine.test.html (albo `node tests/engine.test.js`).

## Architektura
- `js/data/*.js` – dane (moduły ES) + `index.js` (walidacja, błędny rekord jest pomijany i pokazany w banerze)
- `js/engine/` – czyste funkcje: `computeStats` (z rozbiciem źródeł), `weaponDps`, wzory, reguły buildu
- `js/objectives/goals.js` – cele; `options.js` – opcje. **Nowy cel/opcja = jeden obiekt w rejestrze**, formularz i optymalizator zadziałają bez dalszych zmian
- `js/optimizer/` – beam search (`search.js`), tryb A (`modeA.js`), tryb B (`modeB.js`)
- `js/ui/` – formularz generowany z rejestru, karty wyników; wszystko przez `textContent`/`createElement`

## Znane uproszczenia (TODO)
- dane: tylko wycinek wiki (15 postaci, 11 broni wręcz, 26 przedmiotów); brak broni dystansowych, bonusów setów, wartości bazowych statystyk (`null` + `TODO verify`)
- efekty warunkowe i specjalne są tylko opisane jako tekst („Not included in calculation”)
- wzór pancerza i formuła szybkości ataku do potwierdzenia na wiki (`engine/stats.js`)
- brak: Web Workera, ulepszania lokalnego, share linku, presetów, custom weights, celu dodatkowego, `tools/scrape-wiki.mjs`
