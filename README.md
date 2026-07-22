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

Layout i kolory to na razie wartości ze specyfikacji (fallback). Źródłem prawdy
jest Figma: plik `qbUbOoHoC3O0QjA8TeN0vG`, node `2193-8169` („instruktaz”) —
po uzyskaniu dostępu MCP do pliku wymiary, pozycje, ścieżki narożników
i tokeny kolorów zostaną podmienione na dokładne wartości z Dev Mode.
Wszystko jest w obiektach `SCENE`, `FRAME`, `THEMES` na górze `app.js`,
więc podmiana jest punktowa.
