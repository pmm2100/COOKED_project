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
- `js/data/*.js` – dane (moduły ES) + `index.js` (walidacja, błędny rekord jest pomijany i pokazany w banerze); rekordy przedmiotów, postaci i broni z `brotato-optimizer/db_json/` są ładowane automatycznie
- `js/engine/` – czyste funkcje: `computeStats` (z rozbiciem źródeł), `weaponDps`, wzory, reguły buildu
- `js/objectives/goals.js` – cele; `options.js` – opcje. **Nowy cel/opcja = jeden obiekt w rejestrze**, formularz i optymalizator zadziałają bez dalszych zmian
- `js/optimizer/` – beam search (`search.js`), tryb A (`modeA.js`), tryb B (`modeB.js`)
- `js/ui/` – formularz generowany z rejestru, karty wyników; wszystko przez `textContent`/`createElement`

`brotato-optimizer/db_json/brotato_characters.json` zawiera pełne rekordy 64 postaci z wiki: statystyki oryginalne,
warunki odblokowania, nagrody, wyposażenie startowe, tagi i efekty. Dane dodatkowych broni wymagają osobnego źródła z tierami,
obrażeniami, cooldownami i przelicznikami statystyk.

`brotato-optimizer/db_json/brotato_weapons.json` zawiera dane broni z tabel Weapons wiki (melee i ranged), w tym
tiery, obrażenia, cooldown, ceny, klasy i podstawowe skalowanie. Loader dodaje je do rejestru
wyszukiwarki przy starcie aplikacji. Wyszukiwanie uwzględnia bonusy klas broni od 2 do 6
wyposażonych broni, preferuje wypełnienie ustawionego limitu `Max weapons` i filtruje bronie
według celu statystycznego, np. Life Steal.

## Znane uproszczenia (TODO)
- specjalne efekty pojedynczych broni (np. pociski, eksplozje i resetowanie cooldownu) są zachowane w opisie, ale nie wszystkie są modelowane liczbowo
- efekty warunkowe i specjalne są tylko opisane jako tekst („Not included in calculation”)
- wzór pancerza i formuła szybkości ataku do potwierdzenia na wiki (`engine/stats.js`); bazowe Max HP wynosi 10, a wynik jest ograniczony do minimum 1
- brak: Web Workera, ulepszania lokalnego, share linku, presetów, custom weights, celu dodatkowego, `tools/scrape-wiki.mjs`
