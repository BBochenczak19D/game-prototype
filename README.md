# Quizsteries — prototyp

Prototyp gry-konkursu „Quizsteries". Czysty HTML + CSS + JS, bez build-stepa —
wystarczy otworzyć `index.html` w przeglądarce.

## Dwa ekrany

W realnej rozgrywce lecą **równocześnie na dwóch różnych ekranach**; tutaj
przełącza się je selectem w pasku u góry (pasek nie jest częścią designu).

| Ekran | Co pokazuje |
| --- | --- |
| **Instruktaż** | ekran wspólny: treść zadania + timer rundy |
| **Tablet gracza** | ekran w rękach gracza: punkty, 4 przyciski odpowiedzi, panel żyć |

Można wysłać link prosto do jednego ekranu, dopisując `?view=` do adresu:
`?view=instruktaz`, `?view=tablet`. Wybór zapamiętuje się w przeglądarce.

## Ekran: Instruktaż

### Trzy wersje timera do porównania

| Wersja | Timer |
| --- | --- |
| **V1 · ramka dookoła** | 52 segmenty zapalają się po obwodzie: góra → prawo → dół → lewo |
| **V2 · kolumny równolegle** | dwie pionowe kolumny po 16 pigułek, obie ładują się jednocześnie od dołu do góry |
| **V2 · kolumny kolejno** | najpierw cała lewa kolumna, potem cała prawa (też od dołu do góry) |

Wersję też można wskazać w adresie: `?v=v1`, `?v=v2a`, `?v=v2b`.

W każdej wersji pełny timer = koniec czasu rundy (domyślnie 4500 ms), potem
600 ms pauzy i następna runda; po piątej rundzie prototyp zapętla się od nowa.

## Ekran: Tablet gracza

Na razie **statyczny** — odwzorowanie designu, bez klikania w odpowiedzi.
Ruchome są tylko życia i ekran końca gry (do pokazywania stanów).

- **Punkty** — na sztywno `300` (stała `POINTS` w `app.js`).
- **Cztery przyciski odpowiedzi** — czerwony, żółty, niebieski, zielony.
  Geometria i turkusowa skorupa są wspólne; kolory rdzeni siedzą w tablicy
  `ANSWERS`.
- **Panel żyć** — „Twoje życia:" + trzy kryształy. Liczbę żyć zmienia się
  w pasku (`3 / 2 / 1 / 0`) albo klawiszami.

### Stan „brak żyć"

Przy zerze żyć ekran przechodzi w stan z Figmy: przyciski gasną do 40 %,
a na środku wchodzi komunikat „Straciłeś wszystkie życia / Poczekaj do końca
rundy". Instruktaż leci dalej — runda się nie zatrzymuje, dokładnie jak mówi
ten komunikat.

### Trzy warianty animacji utraty życia

Kafelek to pusty kryształ z nałożonym pełnym; animowana jest tylko warstwa
wierzchnia, więc pod spodem od razu jest właściwy zgaszony kafelek z Figmy.

| Wariant | Co się dzieje |
| --- | --- |
| **wyciek** | energia opada od góry — kryształ pustoszeje za świecącą poziomą linią, która zsuwa się do dołu (900 ms) |
| **przepalenie** | kryształ miga jak konająca żarówka (twarde przeskoki), na koniec jeden mocny błysk i ciemność (780 ms) |
| **chwianie** | coś uderza w kryształ — dostaje kloca, ściska się i kołysze wokół środka coraz słabiej, aż stanie i zgaśnie (560 ms) |
| **obrót** | kafelek obraca się jak karta i wraca już pusty; jako jedyny odsłania puste życie ruchem, zamiast gasić pełne (620 ms) |

Wariant przełącza się w pasku (kliknięcie od razu pokazuje podgląd) albo
w adresie: `?anim=` z `drain`, `burnout`, `wobble`, `flip`. Domyślny:
`wobble`.

Przyciski `3 / 2 / 1 / 0` skaczą wprost do stanu, bez animacji — animację
odpala utrata pojedynczego życia (`−1 życie` albo klawisz `Z`).

## Sterowanie (testowe)

| Klawisz | Akcja |
| --- | --- |
| `Spacja` | pauza / wznowienie (instruktaż) |
| `→` / `←` | następna / poprzednia runda |
| `R` | restart: runda 1 i pełne życia |
| `1` / `2` / `3` | wersja timera (na instruktażu) |
| `0`–`3` | skok wprost do stanu żyć (na tablecie, bez animacji) |
| `Z` | zła odpowiedź — jedno życie mniej, z animacją |

## Jak to działa

- Scena ma stałe wymiary z Figmy (2880×1800 px) i jest skalowana do okna
  przez `transform: scale()` — wszystkie współrzędne wewnętrzne są w px sceny.
- Każdy ekran budowany jest do warstwy `.view`, wymienianej przy przełączaniu.
  Ekran końca gry leży poza nią, więc przeżywa zmianę widoku.
- Segmenty timera generowane są w pętli z konfiguracji (`V1`, `V2`). Każdy
  segment dostaje `threshold` — ułamek czasu rundy, po którym się zapala.
  To jedyne, co odróżnia trzy wersje timera od siebie.
- 5 rund (tekst + motyw + czas trwania) zapętlonych; konfiguracja w `ROUNDS`.
- 5 motywów kolorystycznych w `THEMES` — zmiana koloru całego widoku to
  podmiana jednego obiektu; kolory idą przez zmienne CSS.

## Status designu

Wszystko pochodzi wprost z Figmy (Dev Mode), łącznie z pozycjami co do
piksela, stylami przycisków (gradienty, bordery, cienie) i eksportami
w `assets/`:

- **Instruktaż V1** — plik `z7iTUuRRDivpY8NcMXptdR`, node `1-35` („instruktaz"):
  ramka z 52 segmentów, centralny panel z teksturą, 4 narożniki SVG.
- **Instruktaż V2** — plik `UCzHnyMnTZ2AS0PnYsw6eR`, node `1823-2387`:
  dwie kolumny po 16 pigułek (328×83, rozstaw 103 px, start y = 77);
  w tym wariancie designu nie ma panelu ani narożników.
- **Tablet gracza** — plik `UCzHnyMnTZ2AS0PnYsw6eR`, node `1935-11833`
  („odpowiedzi"): tło `bg-tablet.png`, punkty (Caudex 72 px, tracking 3.6),
  rząd 4 przycisków 572×572 co 636 px, panel żyć (node `1935-11875`)
  na pozycji 1136,1 × 1313.
- **Tablet gracza, brak żyć** — ten sam plik, node `1936-11876`: przyciski
  na 40 % krycia, pusty kryształ (`life-empty.svg`, node `1936-11886`)
  i komunikat (Frame 165) 1772×360 na środku sceny.

Animacje utraty życia są autorskie — w Figmie ich nie ma, jest tylko stan
przed i po.

Uwaga: tła i narożniki mają kolory wypalone w assetach — motywy (`THEMES`
w `app.js`) sterują segmentami, panelem i tekstem. Motyw 1 („yellow") jest
wypełniony tokenami z Figmy, motywy 2–5 to placeholdery do uzupełnienia.

### Czeka na design

**Caudex Regular** — w repo jest tylko odmiana Bold, a „300", „Twoje życia:"
i „Poczekaj do końca rundy" są w Figmie Regular, więc wychodzą grubsze niż
w designie. Brakuje pliku `caudex-regular-*.woff2` w `assets/fonts/`
i drugiej pary `@font-face` w `styles.css`.
