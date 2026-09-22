# Quizsteries — prototyp

Prototyp gry-konkursu „Quizsteries". Czysty HTML + CSS + JS, bez build-stepa —
wystarczy otworzyć `index.html` w przeglądarce.

## Ekrany

Instruktaż i tablet w realnej rozgrywce lecą **równocześnie na dwóch różnych
ekranach**; tutaj przełącza się je selectem w pasku u góry (pasek nie jest
częścią designu). Tablet gracza ma dwa tryby gry, więc w selekcie są trzy
pozycje.

| Widok | Co pokazuje |
| --- | --- |
| **Instruktaż** | ekran wspólny: treść zadania + timer rundy |
| **Tablet gracza** | ekran w rękach gracza: punkty, 4 okrągłe przyciski, panel żyć |
| **Tablet gracza · quiz** | pytanie, 4 odpowiedzi 2×2 z animacją wciśnięcia, pasek czasu |

Można wysłać link prosto do jednego ekranu, dopisując `?view=` do adresu:
`?view=instruktaz`, `?view=tablet`, `?view=quiz`. Wybór zapamiętuje się
w przeglądarce.

## Ekran: Instruktaż

### Trzy wersje timera do porównania

| Wersja | Timer |
| --- | --- |
| **V1 · ramka dookoła** | 52 segmenty zapalają się po obwodzie: góra → prawo → dół → lewo |
| **V2 · kolumny równolegle** | dwie pionowe kolumny po 16 pigułek, obie ładują się jednocześnie od dołu do góry |
| **V2 · kolumny kolejno** | najpierw cała lewa kolumna, potem cała prawa (też od dołu do góry) |
| **V3 · opada od lewej** | wszystkie 32 pigułki startują zapalone i gasną kolumna po kolumnie, od góry w dół; pierwsza opada lewa |
| **V3 · opada od prawej** | to samo, ale pierwsza opada prawa kolumna |

V3 zaczyna rundę z pełnymi kolumnami i kończy z pustymi — odwrotnie niż V2.
Poza stanem różni się też kierunkiem w kolumnie: V2 ładuje się od dołu do
góry (jak zapalone segmenty w Figmie), a V3 opada od góry w dół, więc pełne
pigułki zostają na dole jak kurczący się zapas. Steruje tym opcja `from`
przy budowie wersji w `app.js`, osobno dla każdej z nich.

Wersję też można wskazać w adresie: `?v=v1`, `?v=v2a`, `?v=v2b`, `?v=v3a`
(opada od lewej), `?v=v3b` (opada od prawej).

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

## Ekran: Tablet gracza · quiz

Pytanie na górze, cztery odpowiedzi w siatce 2×2 i pasek czasu na dole.
Gracz ma **10 sekund** na odpowiedź:

- kliknięcie (dotknięcie) przycisku zaznacza odpowiedź — przycisk przechodzi
  w stan wciśnięty; zaznaczona może być tylko jedna,
- do końca czasu można zmienić zdanie i kliknąć inną,
- pasek czasu kurczy się od prawej do lewej; gdy zniknie, odpowiedzi są
  zablokowane,
- po 1,5 s stanu końcowego to samo pytanie startuje od nowa (prototyp się
  zapętla).

Czas, przerwa na końcu, treść pytania i odpowiedzi siedzą w `QUIZ`
i `QUIZ_ANSWERS` w `app.js`.

### Trzy wersje do porównania

We wszystkich wciśnięcie **przyciemnia** — to jest wybrany kierunek. Wersje
różnią się tylko jasnością stanu domyślnego; wciśnięty jest wszędzie ten sam.

| Wersja | Na starcie | Po wciśnięciu |
| --- | --- | --- |
| **V1.2 · jasne domyślne** | `light` | `darker` |
| **V1.3 · średnie domyślne** | `lightGradient` | `darker` |
| **V2 · ciemne domyślne** | `dark` | `darker` |

Twarze przycisków siedzą w `QUIZ_ANSWERS` w `app.js`:

| Twarz | Skąd | Jak wygląda |
| --- | --- | --- |
| `light` | ekran quizu, node `2168-692` | pełny jasny kolor, jasny obrys |
| `lightGradient` | drugi plik, node `15-148` | gradient przesunięty ku jaśniejszym |
| `dark` | node'y `2169-740` i dalsze | ciemny gradient |
| `darker` | drugi plik, node `15-115` | ciemniejszy gradient, ciemniejsze obrysy |

Etykiety w pasku są skrócone, żeby pasek się mieścił — pełny opis wersji
pokazuje się w dymku po najechaniu na przycisk.

Ruch jest we wszystkich wersjach identyczny i jest to **jeden gest**: cały
przycisk zjeżdża do 97 % rozmiaru, a w tym samym czasie i tą samą krzywą
twarz przechodzi we wciśniętą (180 ms, bez odbicia). Obudowa i kolorowy
rdzeń skalują się razem, bo skalowany jest cały przycisk — rdzeń nie ma
własnej animacji. Zmniejszenie **zostaje**, dopóki odpowiedź jest wybrana,
więc po siatce widać, który przycisk jest wciśnięty. Czas i krzywą trzyma
jedna zmienna `--qa-press` w `styles.css`. Animacja jest autorska, w Figmie
są tylko stany przed i po.

Wersja przełącza się w pasku, klawiszami `1`–`3` albo w adresie:
`?view=quiz&quiz=v1.2`, `…&quiz=v1.3`, `…&quiz=v2`. Domyślna to V1.2.

Wcześniej były jeszcze dwie wersje z wciśnięciem **rozjaśniającym** (V1
i V3 z ciemnymi jednolitymi przyciskami) — wypadły po wyborze kierunku,
ale siedzą w historii gita (commit `d56814d`), więc da się je przywrócić.

## Sterowanie (testowe)

| Klawisz | Akcja |
| --- | --- |
| `Spacja` | pauza / wznowienie (instruktaż i quiz) |
| `→` / `←` | następna / poprzednia runda |
| `R` | restart: runda 1 i pełne życia; w quizie pytanie od nowa |
| `1`–`5` | wersja timera (na instruktażu) |
| `1`–`5` | wersja animacji wciśnięcia (w quizie) |
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
- Instruktaż i quiz mają osobne zegary faz, liczone jedną funkcją
  (`phaseElapsed`) — pauza spacją działa w obu i czas postoju się nie wlicza.
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

- **Tablet gracza · quiz** — ten sam plik, node `2168-692` („Quiz/Pytanie
  i odpowiedzi”): tło `bg-quiz.png`, punkty i pytanie w Noto Sans Medium,
  siatka odpowiedzi 2 × 1134×382 na (247, 747), pasek czasu 1424×45 na
  (723, 1690). Stany wciśnięte przycisków: node'y `2169-740` (czerwony),
  `2169-742` (żółty), `2169-744` (niebieski), `2169-773` (zielony).
- **Quiz, dodatkowe warianty przycisków** — **inny plik**:
  `feDfMhqinxZSqSzWsB7qFF` („Estigroup — Newsletter”), node `15-115`
  (ciemniejsze wciśnięte, twarz `darker`) i node `15-148` (jaśniejsze
  domyślne, twarz `lightGradient`). Geometria identyczna jak w quizie,
  różnią się tylko kolory rdzeni.

Animacje utraty życia i wciśnięcia odpowiedzi są autorskie — w Figmie ich
nie ma, są tylko stany przed i po.

### Quiz — na co uważać przy kolejnych designach

Przy quizie sama zakładka Dev Mode (eksport CSS) okazała się niepełna.
Wartości w repo są sprawdzone bezpośrednio na węzłach Figmy i nałożeniem
renderu z Figmy na prototyp:

- **Ramka ma 2869,75×1768,67**, a nie 2880×1800 (tło w niej ma pełne
  2880×1800). Elementy „na środku” liczą się od środka ramki, więc stoją na
  x 1435, a nie 1440 — prototyp trzyma pozycje z Figmy.
- **Obrysy rdzeni przycisków leżą na zewnątrz** ramki (6 px), a obrysy
  skorupy i paska czasu w środku; żaden nie zajmuje miejsca w układzie.
- **Obrysy są gradientami** (skorupa: od ciemnego do złotego, pasek czasu:
  od ciemnego do żółtego, wciśnięte przyciski: od koloru do prawie
  czarnego) — eksport podaje tylko ich pierwszy kolor.
- **Gradienty wypełnień wciśniętych przycisków** mają ujemny pierwszy punkt
  (np. `-61.87%`), a eksport gubi minus — przyciski wychodziły przez to
  ciemniejsze niż w Figmie.
- **Cienie skorupy** mają spread 2 i 12 px (eksport podaje 0).
- Tekst quizu ma `-webkit-font-smoothing: antialiased` — bez tego Chrome na
  macOS rysuje jasne litery na ciemnym tle wyraźnie grubiej niż Figma.

**Font:** Noto Sans Medium ładuje się z Google Fonts (link w `index.html`),
więc do poprawnego wyglądu quizu potrzebny jest internet — bez niego
przeglądarka podstawi zwykły systemowy font. Caudex leży lokalnie
w `assets/fonts/`.

Uwaga: tła i narożniki mają kolory wypalone w assetach — motywy (`THEMES`
w `app.js`) sterują segmentami, panelem i tekstem. Motyw 1 („yellow") jest
wypełniony tokenami z Figmy, motywy 2–5 to placeholdery do uzupełnienia.

### Czeka na design

**Caudex Regular** — w repo jest tylko odmiana Bold, a „300", „Twoje życia:"
i „Poczekaj do końca rundy" są w Figmie Regular, więc wychodzą grubsze niż
w designie. Brakuje pliku `caudex-regular-*.woff2` w `assets/fonts/`
i drugiej pary `@font-face` w `styles.css`.
