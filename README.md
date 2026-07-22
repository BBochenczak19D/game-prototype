# Quizsteries — prototyp widoku instruktażu

Prototyp widoku INSTRUKTAŻU gry-konkursu „Quizsteries". Czysty HTML + CSS + JS,
bez build-stepa — wystarczy otworzyć `index.html` w przeglądarce.

## Podgląd

Otwórz `index.html` (dwuklik) albo przez GitHub Pages / dowolny serwer statyczny.

## Sterowanie (testowe)

| Klawisz | Akcja |
| --- | --- |
| `Spacja` | pauza / wznowienie |
| `→` / `←` | następna / poprzednia runda |
| `R` | restart od rundy 1 |

## Jak to działa

- Scena ma stałe wymiary z Figmy (2880×1800 px) i jest skalowana do okna
  przez `transform: scale()` — wszystkie współrzędne wewnętrzne są w px sceny.
- Ramka-timer: 52 segmenty-pigułki + 4 narożniki SVG, generowane w pętli
  z configu w `app.js`. Segmenty zapalają się kolejno po obwodzie
  (góra → prawo → dół → lewo); pełny obwód = koniec czasu rundy.
- 5 rund (tekst + motyw + czas trwania) zapętlonych; konfiguracja w `ROUNDS`.
- 5 motywów kolorystycznych w `THEMES` — zmiana koloru całego widoku to
  podmiana jednego obiektu; kolory idą przez zmienne CSS.

## Status designu

Layout, kolory i assety pochodzą wprost z Figmy (plik `z7iTUuRRDivpY8NcMXptdR`,
node `1-35` „instruktaz”): pozycje wszystkich 52 segmentów, style przycisków
(gradienty, bordery, cienie), centralny panel, tekst (Caudex Bold 160px,
`#d8ca94`) oraz eksporty graficzne w `assets/` (tło-ramka PNG, tekstura panelu,
4 narożniki SVG, font Caudex woff2).

Uwaga: tło i narożniki mają kolory wypalone w assetach — motywy (`THEMES`
w `app.js`) sterują segmentami, panelem i tekstem. Motyw 1 („yellow”) jest
wypełniony tokenami z Figmy, motywy 2–5 to placeholdery do uzupełnienia.
