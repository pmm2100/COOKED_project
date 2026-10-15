# Brotato Build Optimizer

Czysty JS (moduły ES), bez backendu i bez bundlera. Dane z https://brotato.wiki.spellsandguns.com (Characters, Items, Weapons).

## Uruchomienie
Moduły ES nie działają z `file://`, więc:
```
python -m http.server 8000     # albo: npx serve
```
i otwórz http://localhost:8000. Testy: http://localhost:8000/tests/engine.test.html (albo `node tests/engine.test.js`).

Walidacja przed wdrożeniem:
```
cd brotato-optimizer
npm test
npm run build
```
`npm run build` sprawdza składnię wszystkich modułów oraz spójność rejestrów danych, celów i opcji.

Jeśli konsola pokazuje błąd w adresie `chrome-extension://.../content.js`, pochodzi on z rozszerzenia
Chrome, a nie z tej aplikacji. Należy wyłączyć rozszerzenie lub powtórzyć test w oknie incognito bez
tego rozszerzenia. Błędy aplikacji będą wskazywać adres `http://.../brotato-optimizer/...`.

## Architektura
- `js/data/*.js` – dane (moduły ES) + `index.js` (walidacja, błędny rekord jest pomijany i pokazany w banerze); rekordy przedmiotów i postaci z `db_json/` są ładowane automatycznie
- `js/engine/` – czyste funkcje: `computeStats` (z rozbiciem źródeł), `weaponDps`, wzory, reguły buildu
- `js/objectives/goals.js` – cele; `options.js` – opcje. **Nowy cel/opcja = jeden obiekt w rejestrze**, formularz i optymalizator zadziałają bez dalszych zmian
- `js/optimizer/` – beam search (`search.js`), tryb A (`modeA.js`), tryb B (`modeB.js`)
- `js/ui/` – formularz generowany z rejestru, karty wyników; wszystko przez `textContent`/`createElement`

`db_json/brotato_weapons.json` zawiera rekordy postaci (64 wpisy), mimo nazwy pliku, a nie dane broni.
Dlatego jest integrowany z rejestrem postaci. Dane dodatkowych broni wymagają osobnego źródła z tierami,
obrażeniami, cooldownami i przelicznikami statystyk.

## Znane uproszczenia (TODO)
- dane: tylko wycinek wiki (15 postaci, 11 broni wręcz, 26 przedmiotów); brak broni dystansowych, bonusów setów, wartości bazowych statystyk (`null` + `TODO verify`)
- efekty warunkowe i specjalne są tylko opisane jako tekst („Not included in calculation”)
- wzór pancerza i formuła szybkości ataku do potwierdzenia na wiki (`engine/stats.js`)
- brak: Web Workera, ulepszania lokalnego, share linku, presetów, custom weights, celu dodatkowego, `tools/scrape-wiki.mjs`
