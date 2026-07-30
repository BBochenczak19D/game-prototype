# Quizsteries — prototyp widoku instruktażu

Prototyp widoku INSTRUKTAŻU gry-konkursu „Quizsteries". Czysty HTML + CSS + JS,
bez build-stepa — wystarczy otworzyć `index.html` w przeglądarce.

## Podgląd

Otwórz `index.html` (dwuklik) albo przez GitHub Pages / dowolny serwer statyczny.

## Trzy wersje timera do porównania

Pasek nad sceną (to podgląd, nie część designu) przełącza wersje:

| Wersja | Timer |
| --- | --- |
| **V1 · ramka dookoła** | 52 segmenty zapalają się po obwodzie: góra → prawo → dół → lewo |
| **V2 · kolumny równolegle** | dwie pionowe kolumny po 16 pigułek, obie ładują się jednocześnie od dołu do góry |
| **V2 · kolumny kolejno** | najpierw cała lewa kolumna, potem cała prawa (też od dołu do góry) |

Wybór zapamiętuje się w przeglądarce. Można też wysłać link prosto do jednej
wersji, dopisując `?v=` do adresu: `?v=v1`, `?v=v2a`, `?v=v2b`.

W każdej wersji pełny timer = koniec czasu rundy (domyślnie 4500 ms), potem
600 ms pauzy i następna runda; po piątej rundzie prototyp zapętla się od nowa.

## Sterowanie (testowe)

| Klawisz | Akcja |
| --- | --- |
| `Spacja` | pauza / wznowienie |
| `→` / `←` | następna / poprzednia runda |
| `R` | restart od rundy 1 |
| `1` / `2` / `3` | wersja timera |

## Jak to działa

- Scena ma stałe wymiary z Figmy (2880×1800 px) i jest skalowana do okna
  przez `transform: scale()` — wszystkie współrzędne wewnętrzne są w px sceny.
- Segmenty generowane są w pętli z konfiguracji w `app.js` (`V1`, `V2`).
  Każdy segment dostaje `threshold` — ułamek czasu rundy, po którym się zapala.
  To jedyne, co odróżnia trzy wersje timera od siebie.
- 5 rund (tekst + motyw + czas trwania) zapętlonych; konfiguracja w `ROUNDS`.
- 5 motywów kolorystycznych w `THEMES` — zmiana koloru całego widoku to
  podmiana jednego obiektu; kolory idą przez zmienne CSS.

## Status designu

Wszystko pochodzi wprost z Figmy (Dev Mode), łącznie z pozycjami segmentów
co do piksela, stylami przycisków (gradienty, bordery, cienie), tekstem
(Caudex Bold 160 px, `#d8ca94`) i eksportami w `assets/`:

- **V1** — plik `z7iTUuRRDivpY8NcMXptdR`, node `1-35` („instruktaz"):
  ramka z 52 segmentów, centralny panel z teksturą, 4 narożniki SVG.
- **V2** — plik `UCzHnyMnTZ2AS0PnYsw6eR`, node `1823-2387` („instruktaz"):
  dwie kolumny po 16 pigułek (328×83, rozstaw 103 px, start y = 77);
  w tym wariancie designu nie ma panelu ani narożników.

Uwaga: tło i narożniki mają kolory wypalone w assetach — motywy (`THEMES`
w `app.js`) sterują segmentami, panelem i tekstem. Motyw 1 („yellow") jest
wypełniony tokenami z Figmy, motywy 2–5 to placeholdery do uzupełnienia.
