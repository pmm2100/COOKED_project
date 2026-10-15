# Analiza efektów przedmiotów

Moduł współpracuje z optymalizatorem w `brotato-optimizer/js` i korzysta z obu źródeł: `db_json/brotato_items.json` oraz `db_json/brotato_items_dlc.json`.

## Co się dzieje

1. Optymalizator wylicza zwykłe statystyki builda przez `computeStats()`.
2. `evaluate.js` analizuje wartościowe efekty dla kandydata builda i dopisuje ich wpływ do statystyk przed obliczeniem celu.
3. Wyniki buildów pokazują uwzględnione wartości liczbowe. Efekty bez jednoznacznego modelu są wypisane jako nieuwzględnione, zamiast dostawać zmyśloną wartość.
4. `analyze-build.mjs` odczytuje oba pliki JSON i tworzy `data/effect-catalog.json`. Katalog zachowuje oryginalne opisy oraz znalezione w nich liczby; modele używane do punktacji są w `data/effect-values.js`.

## Analiza builda z pliku

Uruchom z katalogu głównego repozytorium:

```sh
node effect_understanding/analyze-build.mjs path/to/build.json
```

Format builda:

```json
{
  "characterId": "well_rounded",
  "goalId": "total_dps",
  "weapons": [],
  "items": {
    "adrenaline": 1,
    "ghost_outfit": 1
  }
}
```

Bez ścieżki builda skrypt tworzy katalog efektów i podaje statystyki pokrycia modeli.

## Założenia

- Modele w `data/effect-values.js` są celowo jawne i audytowalne.
- Efekt Adrenaline jest estymacją: przyjęto 0,25 ataku przeciwnika na sekundę oraz szansę uniku z builda.
- „Permanentne” statystyki są przybliżane końcową wartością statystyki builda.
- Różne bronie oznaczają różne ID broni; kopie tej samej broni liczą się raz.
- Niewspierane efekty nie wpływają na wynik; w katalogu pozostają ich surowe liczby i opisy, aby można było dodać kolejne modele.
