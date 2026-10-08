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
| **Tablet gracza · Would You Press** | ekran w rękach gracza: punkty, 4 okrągłe przyciski do wciskania, panel żyć, feedback po odpowiedzi |
| **Tablet gracza · quiz** | pytanie, 4 odpowiedzi 2×2 z animacją wciśnięcia, pasek czasu |
| **Ekran wyniku · Would You Press** | wynik gracza, imię i życia — w grze albo po odpadnięciu |
| **Instruktaż · wyniki** | ekran wspólny po grze: tabela wyników i ekran podium, w trzech wariantach animacji |

Można wysłać link prosto do jednego ekranu, dopisując `?view=` do adresu:
`?view=instruktaz`, `?view=tablet`, `?view=quiz`, `?view=wynik`,
`?view=wyniki`. Wybór zapamiętuje się w przeglądarce.

## Ekran: Instruktaż

To ekran wspólny — ten, który przy grze **Would You Press** pokazuje
zadanie i timer.

### Pięć wersji timera do porównania

Etykiety w pasku są skrócone, pełny opis jest w dymku po najechaniu.

| Wersja | Timer |
| --- | --- |
| **V1 · ramka** | 52 kafelki zapalają się po obwodzie: góra → prawo → dół → lewo |
| **V2 · równolegle** | dwie pionowe kolumny po 16 pigułek, obie ładują się jednocześnie od dołu do góry |
| **V2 · kolejno** | najpierw cała lewa kolumna, potem cała prawa (też od dołu do góry) |
| **V3 · od lewej** | wszystkie 32 pigułki startują zapalone i gasną kolumna po kolumnie, od góry w dół; pierwsza opada lewa |
| **V3 · od prawej** | to samo, ale pierwsza opada prawa kolumna |

V3 zaczyna rundę z pełnymi kolumnami i kończy z pustymi — odwrotnie niż V2.
Poza stanem różni się też kierunkiem w kolumnie: V2 ładuje się od dołu do
góry (jak zapalone segmenty w Figmie), a V3 opada od góry w dół, więc pełne
pigułki zostają na dole jak kurczący się zapas. Steruje tym opcja `from`
przy budowie wersji w `app.js`, osobno dla każdej z nich.

Wersję też można wskazać w adresie: `?v=v1`, `?v=v2a`, `?v=v2b`, `?v=v3a`
(opada od lewej), `?v=v3b` (opada od prawej).

W każdej wersji pełny timer = koniec czasu rundy (domyślnie 4500 ms), potem
600 ms pauzy i następna runda; po piątej rundzie prototyp zapętla się od nowa.

### Kolor timera

Timer chodzi w pięciu kolorach: czterech z przycisków Would You Press plus
biały. Kolor wybiera się próbkami w pasku (podpis „kolor"), a w adresie
parametrem `?timer=` — `red`, `yellow`, `blue`, `green`, `white`. Wybór
zapamiętuje się w przeglądarce; domyślny jest żółty.

Kafelek ma dwa stany:

| Stan kafelka | Kiedy |
| --- | --- |
| **aktywny** | czas jeszcze leci |
| **wygaszony** | czas minął — kafelek przygaszony |

Kafelki nie dostają animacji wciskania — to nie są przyciski, zmienia się
tylko kolor (120 ms).

Cztery kolory pochodzą wprost z Figmy (plik `feDfMhqinxZSqSzWsB7qFF`):

| Kolor | Node |
| --- | --- |
| czerwony | `30-332` |
| żółty | `30-370` |
| zielony | `30-408` |
| niebieski | `30-446` |

Każdy node to cały ekran instruktażu w danym kolorze, z kafelkami w obu
stanach. Wartości (`TIMER_COLORS` w `app.js`) są przeliczone z węzłów, bo
obrysy są gradientowe i leżą **na zewnątrz** ramki (3 px) — rdzeń ma więc
73×318 px, a nie 67×312. Efekty biorą te same zestawy cieni co przyciski:
`ring` (czerwony, zielony), `glow` z blurem (niebieski i wygaszony żółty)
albo `flat` — bez cieni i w pełni kryjący (aktywny żółty).

**Biały** nie ma designu: zbudowany jest tak samo jak żółty (ten sam układ
gradientów i te same efekty), tylko w neutralnych szarościach.

Zmierzona różnica jasności między kafelkiem aktywnym a wygaszonym (OKLCH):
czerwony 0.24, żółty 0.43, niebieski 0.14, zielony 0.27, biały 0.64.
Niebieski jest najmniej czytelny z daleka — to wynika wprost z designu,
bo jego aktywny kafelek jest ciemny.

## Ekran: Instruktaż · wyniki

Tabela wyników po grze, na ekranie wspólnym: tło instruktażu przykryte
przesłoną, tytuł „Wyniki" i sześć wierszy — trzy miejsca podium (złoty,
srebrny, brązowy) i trzy pozostałe (turkusowe).

Imiona i wyniki siedzą w `RESULTS` w `app.js`. W Figmie wszyscy nazywają
się „Adam" (placeholder), tutaj mają różne imiona — inaczej odsłanianie
podium nie miałoby sensu.

### Przebieg V1 — odsłanianie podium w tabeli

1. Od dołu, od prawej wjeżdżają miejsca **6, 5, 4** — jedno po drugim.
2. Tak samo wjeżdża podium (**3, 2, 1**), ale **bez imion** — do tego
   momentu nie wiadomo, kto wygrał. Sam design z Figmy pokazuje dokładnie
   ten stan: imiona na podium mają tam krycie 0.
3. Po pauzie odsłania się imię na **3. miejscu**, a cały kafelek robi
   delikatny scale up / down. Po odstępie to samo dzieje się na **2.**,
   na końcu na **1.**
4. Miejsca spoza podium **wylatują w lewo** za ekran — dalej tą samą drogą,
   którą przyjechały — a podium **po kolei zjeżdża na środek** i delikatnie
   rośnie (do 106 %).

Animacja jest autorska; w Figmie jest tylko stan końcowy kroku 2.

### Przebieg V2 — najpierw podium, potem tabela

1. Na osobnym ekranie (design: node `2307-61203`) miejsca pojawiają się
   po kolei **3 → 2 → 1**, a każde w dwóch krokach: najpierw sama
   **plakietka z numerem** (wskok z dołu, scale up i spokojne domknięcie),
   a **0,55 s później imię gracza i punkty**. Dopiero potem rusza
   następne miejsce.
2. Gotowe podium stoi ok. **3,8 s**, a potem cały ekran gaśnie w górę.
3. Tabela wjeżdża **z prawej na swoje miejsca, tak jak w V1** — od dołu
   w górę (6. miejsce rusza pierwsze), jednym ciągiem, bez przerwy przed
   podium. W tej wersji **imiona i wyniki są widoczne od razu** —
   niespodziankę zrobiło już podium — a tytuł „Wyniki" wraca razem
   z tabelą (na ekranie podium go nie ma, tak jak w Figmie).

### Trzy warianty do porównania

| Wersja | Długość | Czym się różni |
| --- | --- | --- |
| **V1 · wolna** | ok. 13,5 s | pełne odsłanianie podium w tabeli |
| **V1 · bardzo wolna** | ok. 17 s | ten sam przebieg, dłuższe wjazdy i pauzy |
| **V2 · podium najpierw** | ok. 13,5 s | ekran podium, przejście, tabela z prawej |

Wszystkie czasy (wjazd, odstępy, pauzy, wylot, zjazd na środek) siedzą
w `RESULTS_VERSIONS` w `app.js` — każdy jako osobna liczba, więc da się
dostroić pojedynczy etap bez ruszania reszty. Pole `kind` wybiera sam
przebieg (`table` albo `podium`), więc ten sam ruch da się dołożyć
w kolejnym tempie jednym wpisem.

Wersję przełącza się w pasku, klawiszami `1` / `2` / `3` albo w adresie:
`?view=wyniki&wyniki=v1-wolna`, `…&wyniki=v1-bardzo-wolna`, `…&wyniki=v2`.
Przycisk **▶ od nowa** (albo klawisz `R`) odtwarza całość jeszcze raz.

## Ekran: Tablet gracza · Would You Press

Ekran gry **Would You Press**: cztery duże, okrągłe przyciski, punkty
i panel żyć.

- **Punkty** — na sztywno `300` (stała `POINTS` w `app.js`).
- **Cztery przyciski** — czerwony, żółty, niebieski, zielony. Każdy ma dwie
  twarze: domyślną (jaśniejszą) i wciśniętą (ciemną), jak odpowiedzi
  w quizie. Kolory siedzą w tablicy `ANSWERS` w `app.js`.
- **Wciśnięcie** — kliknięcie (dotknięcie) wciska przycisk: ten sam ruch co
  w quizie, czyli przejście w ciemną twarz i zmniejszenie do 98 % rozmiaru,
  przy którym przycisk zostaje. Wciśnięty jest jeden naraz; kliknięcie
  innego przenosi wybór, a `R` czyści. Przy zerze żyć przyciski nie reagują
  — ekran mówi wtedy „Poczekaj do końca rundy".
- **Panel żyć** — „Twoje życia:" + trzy kryształy. Liczbę żyć zmienia się
  w pasku (`3 / 2 / 1 / 0`) albo klawiszami.

W Figmie przyciski Would You Press i odpowiedzi w quizie to **ten sam
komponent** (`Quiz/button-types`), tylko raz okrągły, a raz prostokątny —
dlatego w kodzie dzielą klasy `.qa*`, a okrągły wariant to `.qa-round`.
Te same wypełnienia mają w obu ekranach inne kąty gradientów, bo kąt liczy
się od proporcji pudełka.

### Stan „brak żyć"

Przy zerze żyć ekran przechodzi w stan z Figmy: przyciski gasną do 40 %,
a na środku wchodzi komunikat „Straciłeś wszystkie życia / Poczekaj do końca
rundy". Instruktaż leci dalej — runda się nie zatrzymuje, dokładnie jak mówi
ten komunikat.

### Cztery warianty animacji utraty życia

Kafelek to pusty kryształ z nałożonym pełnym; animowana jest tylko warstwa
wierzchnia, więc pod spodem od razu jest właściwy zgaszony kafelek z Figmy.

Ten sam zestaw animacji obsługuje także **ekran wyniku**, gdzie kryształy są
2,25 × większe. Wszystko, co zależy od rozmiaru (granice kryształu w pudełku
obrazka, oś kołysania, siła wychyleń, grubość linii energii), siedzi
w zmiennych `--life-*` na `.life` — duży kafelek nadpisuje je klasą
`.life-xl` i korzysta z tych samych `@keyframes`.

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

### Feedback po odpowiedzi

Po wciśnięciu przycisku gracz może dostać informację, czy odpowiedział
dobrze. W pasku są dwa przełączniki: **feedback** (wersja) i **dobra / zła**
(czym ma być następne wciśnięcie).

| Wersja | Co się dzieje po wciśnięciu |
| --- | --- |
| **bez** | dotychczasowe zachowanie — przycisk tylko ciemnieje, nic więcej się nie dzieje |
| **V1 · tekst** | nad przyciskami wchodzi „Dobrze!" / „Źle!" — fade in z lekkim zjazdem z góry (36 px, 420 ms) |
| **V2 · ramka ERROR** | zła odpowiedź: ramka **ERROR** rozwijana od środka, a wciśnięty przycisk trzęsie się na boki |

Przy złej odpowiedzi **równocześnie** rusza animacja utraty życia
w wybranym wariancie. Komunikat zostaje do następnej odpowiedzi albo do `R`.

Feedback jest wyłącznie tekstowy. Wariant, w którym wciśnięty przycisk
robił się zielony albo czerwony (nody `254-110` i `254-131`), został
odrzucony przy przeglądzie i jego kod został usunięty — na obu
przywołanych ekranach z Figmy ten kolor jeszcze jest, w prototypie już
nie.

**V2 — ramka ERROR** (node `260-250`): blok 427,436×207 na (1226, 282),
w nim tabliczka 406×182 i cztery narożniki 93×91 po rogach (jeden kształt
odbijany lustrzanie, stąd jeden plik SVG). Rozwija się od środka: najpierw
w poziom do pełnej szerokości, potem w pion z lekkim przeskoczeniem, a na
końcu dochodzi napis (460 ms razem). Trzęsienie przyciskiem to ten sam
pomysł co pole hasła w iOS — siedem wychyleń, każde słabsze (560 ms).

W Figmie jest tylko stan dla złej odpowiedzi, więc **dobra odpowiedź
pokazuje w V2 ten sam zielony tekst co w V1**. Gdyby miała dostać własną
ramkę, trzeba do niej designu.

Wersję można też podać w adresie: `?feedback=off|v1|v2` oraz
`?odpowiedz=ok|bad`.

## Ekran: Ekran wyniku · Would You Press

Osobny ekran gry Would You Press: w ramce na całą scenę wynik gracza, jego
imię i te same trzy kryształy życia co na tablecie — więc i ta sama
mechanika. Panel żyć w pasku (`3 / 2 / 1 / 0`, `−1 życie`, wybór animacji)
jest wspólny dla obu ekranów Would You Press.

### Dwa stany tego samego ekranu

| Stan | Figma | Czym się różni |
| --- | --- | --- |
| **gracz w grze** | node `250-35` | jaśniejsze tło panelu (`#06141a`), obrys z turkusowymi końcami, imię z poświatą przy 98 % krycia, kryształy pełne |
| **gracz odpadł** | node `250-17` | tło panelu zrównane z ramką (`#030e10`), z obrysu znikają jasne końce, imię **i wynik** bez poświaty przy 80 %, kryształy puste i przygaszone do 50 % |

Wynik przy odpadnięciu gaśnie razem z imieniem (80 %, bez poświaty) — to
świadome odejście od Figmy, gdzie w node `250-17` został jasny.

To jeden widok, nie dwa — stan przełącza liczba żyć (zero = odpadł), tak jak
na tablecie. Przejście między nimi jest jednym płynnym przenikaniem (420 ms):
tło panelu, końce obrysu, krycie imienia i krycie rzędu kryształów zmieniają
się równocześnie. Zaczyna się dopiero wtedy, gdy ostatni kryształ dopali się
wybranym wariantem animacji — najpierw gaśnie życie, potem gaśnie ekran.

Obrys panelu jest gradientem, a przeglądarka nie umie przenikać między
gradientami o różnej liczbie stopów — dlatego oba stany mają ten sam układ
stopów, a różni je tylko kolor skrajnych, trzymany w `@property --score-tip`
(zmienne zarejestrowane przez `@property` są animowalne, zwykłe nie).

### Kryształy

Kształt ten sam co na tablecie, ale w Figmie ramkę powiększono bez skalowania
efektów — poświata została tej samej wielkości, więc eksport ma inne
marginesy. Stąd osobne pliki `assets/score-life.svg` (308,883 × 530,492)
i `assets/score-life-empty.svg` (292,986 × 516,663), a nie przeskalowane
`life.svg`. Marginesy poświaty idą w CSS w pikselach wprost z granic renderu
w Figmie: pełny −41 / −53 / +65 / +53, pusty −33,524 / −43,784 / +58,647
/ +46,32.

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
| **V1.3 · średnie domyślne** | `lightGradient` | `darkest` |
| **V2 · ciemne domyślne** | `dark` | `darker` |

Twarze przycisków siedzą w `QUIZ_ANSWERS` w `app.js`:

| Twarz | Skąd | Jak wygląda |
| --- | --- | --- |
| `light` | ekran quizu, node `2168-692` | pełny jasny kolor, jasny obrys |
| `lightGradient` | drugi plik, node `15-148` | gradient przesunięty ku jaśniejszym |
| `dark` | node'y `2169-740` i dalsze | ciemny gradient |
| `darker` | drugi plik, node `15-115` | ciemniejszy gradient, ciemniejsze obrysy |
| `darkest` | drugi plik, node `19-169` | poprawiony, jeszcze ciemniejszy wciśnięty |

`darkest` różni się od `darker` tylko wypełnieniami czerwonego, żółtego
i zielonego — obrysy są te same, a niebieski w nowym designie wyszedł
identycznie jak wcześniej.

Etykiety w pasku są skrócone, żeby pasek się mieścił — pełny opis wersji
pokazuje się w dymku po najechaniu na przycisk.

Ruch jest we wszystkich wersjach identyczny i jest to **jeden gest**: cały
przycisk zjeżdża do 98 % rozmiaru, a w tym samym czasie i tą samą krzywą
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
| `R` | restart: runda 1, pełne życia, zwolniony przycisk; w quizie pytanie od nowa, na wynikach animacja od nowa |
| `1`–`5` | wersja timera (na instruktażu) |
| `1`–`3` | wersja animacji wciśnięcia (w quizie) |
| `1`–`3` | wersja animacji wyników (na ekranie wyników) |
| `0`–`3` | skok wprost do stanu żyć (na tablecie i ekranie wyniku, bez animacji) |
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
- **Tablet gracza · Would You Press** — plik `UCzHnyMnTZ2AS0PnYsw6eR`, node
  `1935-11833` („odpowiedzi"): tło `bg-tablet.png`, punkty (Caudex 72 px,
  tracking 3.6), rząd 4 przycisków 572×572 co 636 px, panel żyć
  (node `1935-11875`) na pozycji 1136,1 × 1313. **Kolory przycisków** są
  nowsze i pochodzą z drugiego pliku (`feDfMhqinxZSqSzWsB7qFF`): node
  `22-214` (domyślne) i `23-240` (wciśnięte).
- **Tablet gracza, brak żyć** — ten sam plik, node `1936-11876`: przyciski
  na 40 % krycia, pusty kryształ (`life-empty.svg`, node `1936-11886`)
  i komunikat (Frame 165) 1772×360 na środku sceny.
- **Ekran wyniku · Would You Press** — **trzeci plik**:
  `nZLMCPYklALDluh6mTvcPO` („Illustrations"), node `250-35` (gracz w grze)
  i `250-17` (gracz odpadł). Ramka 2748×1686 na (66, 57), w niej panel
  2620×1558 z paddingiem 64 i obrysami gradientowymi (2 px i 3 px, oba
  INSIDE). W panelu wyśrodkowany blok: wynik Noto Sans Bold 600 px,
  imię Noto Sans Regular 160 px z trackingiem 5 %, odstęp 64, a pod nim
  (odstęp 80) rząd trzech kryształów 202,883×424,492 co 80 px.
  Dev Mode podaje oba obrysy jako jeden płaski kolor — w węzłach to
  gradienty liniowe, więc policzone są z `gradientTransform`.

- **Tablet gracza, feedback po odpowiedzi** — plik
  `nZLMCPYklALDluh6mTvcPO`, node `254-110` (dobra odpowiedź) i `254-131`
  (zła). Z tych dwóch został sam komunikat: blok 1878×108 wyśrodkowany
  w scenie (środek na y 358), Noto Sans Regular 72 px, `#0bf80b` dla
  „Dobrze!" i `#f64949` dla „Źle!". Kolorowanie wciśniętego przycisku,
  które też tam jest, zostało odrzucone.
- **Tablet gracza, ramka ERROR** — ten sam plik, node `260-250`, grupa
  „fedback message": tabliczka `#5B1213` przy 40 % krycia i cztery
  narożniki obrysowane 3 px `#e01717` (obrys na środku linii, więc plik
  SVG jest o 1,5 px większy z dwóch stron). Napis Noto Sans Bold 90 px,
  tracking 5 %, z ciemnym obrysem 4 px na zewnątrz liter.
  **Uwaga — te dwa ekrany mają nowszy panel żyć i inny font punktów**
  (ramka 647×261 bez podpisu „Twoje życia:", punkty w Noto Sans zamiast
  Caudex). Prototyp został przy starszej wersji z node `1935-11833`, bo
  zmiana panelu nie była przedmiotem zadania.
- **Tablet gracza · quiz** — ten sam plik, node `2168-692` („Quiz/Pytanie
  i odpowiedzi”): tło `bg-quiz.png`, punkty i pytanie w Noto Sans Medium,
  siatka odpowiedzi 2 × 1134×382 na (247, 747), pasek czasu 1424×45 na
  (723, 1690). Stany wciśnięte przycisków: node'y `2169-740` (czerwony),
  `2169-742` (żółty), `2169-744` (niebieski), `2169-773` (zielony).
- **Instruktaż · wyniki** — ten sam plik, node `2305-61159` („Tabela
  wyników / pokolorowane podium"): przesłona `rgba(2,2,2,0.51)` na tle
  instruktażu, panel 2353×1544 na (263,5 , 128), tytuł 144 px, lista
  1312 px od y 232, wiersze 2353×192 co 32 px. Eksport podaje tła podium
  jako obrazki — w węzłach to gradienty z gradientowymi obrysami, więc
  wszystko jest na CSS, bez dodatkowych plików.
- **Instruktaż · wyniki, ekran podium (V2)** — ten sam plik, node
  `2307-61203`: blok 2353×968,661 wyśrodkowany w panelu (y 287,669),
  kolumny rozsunięte do krawędzi i dosunięte do dołu — stąd zwycięzca
  jest wyższy (638,584×968,661) od miejsc 2 i 3 (524×677). Numery
  200 px / 400 px Bold, imię 90 px Bold, punkty 64 px Medium. Plakietki
  to wektory z cieniem, więc leżą jako SVG w `assets/podium-<1|2|3>-
  <outer|inner>.svg`; pliki są większe od swoich pól o margines cienia
  (42 px górą i prawą, 62 px dołem i lewą), dlatego w CSS mają ujemne
  `left`/`top`. Tytułu „Wyniki" na tym ekranie nie ma.
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
w `app.js`) sterują panelem, skorupami i tekstem. Motyw 1 („yellow") jest
wypełniony tokenami z Figmy, motywy 2–5 to placeholdery do uzupełnienia.
Kolor kafelków timera jest osobno, w `TIMER_COLORS`, bo wybiera się go
przełącznikiem.

### Czeka na design

**Caudex Regular** — w repo jest tylko odmiana Bold, a „300", „Twoje życia:"
i „Poczekaj do końca rundy" są w Figmie Regular, więc wychodzą grubsze niż
w designie. Brakuje pliku `caudex-regular-*.woff2` w `assets/fonts/`
i drugiej pary `@font-face` w `styles.css`.
