"use strict";

/* ============================================================
   KONFIGURACJA — wszystko edytowalne w jednym miejscu.
   Layout i kolory: dokładne wartości z Figmy (Dev Mode).

   Prototyp pokazuje dwa ekrany gry, przełączane w pasku u góry:
   – INSTRUKTAŻ    — ekran wspólny (treść zadania + timer),
   – TABLET GRACZA — ekran w rękach gracza (odpowiedzi, punkty, życia).
   W realnej rozgrywce lecą równocześnie na dwóch różnych ekranach.
   ============================================================ */

/* --- Scena: wszystkie ramki w Figmie mają te same wymiary --- */
const SCENE = { width: 2880, height: 1800 };

/* --- Baza segmentu timera (komponent QUIZ/button rysowany pionowo) --- */
const PILL = { w: 83, h: 328 };

/* ============================================================
   WIDOK: INSTRUKTAŻ
   ============================================================ */

/* Tło ekranu instruktażu — rozciągnięcie wg Figmy */
const INSTRUKTAZ_BG = { src: "assets/bg-instruktaz.png", w: 100.45, h: 100.02, top: -0.01 };

/* --- WERSJA 1 timera: ramka dookoła.
   Figma: plik z7iTUuRRDivpY8NcMXptdR, node 1-35 --- */
const V1 = {
  /* Centralny panel (Frame 32) */
  panel: { x: 455, y: 454, w: 1959, h: 883 },

  /* Rzędy segmentów. Pozycje wizualne w px sceny:
     - top:    Frame 184 @ (491,103), 18 szt., rozstaw 107.529 px
     - bottom: Frame 183 @ (479,1361), 18 szt., rozstaw 108 px
     - right:  8 instancji @ x2445, y od 481 co 108 (poziome, 328×83)
     - left:   Frame 185 @ (106,481), 8 szt. co 108 (wariant „plain”) */
  rows: {
    top:    { count: 18, x0: 491,  y: 103,  pitch: 1828 / 17, orient: "v", variant: "shell", transform: "" },
    right:  { count: 8,  x: 2445,  y0: 481, pitch: 108,       orient: "h", variant: "shell", transform: "rotate(90deg) scaleY(-1)" },
    bottom: { count: 18, x0: 479,  y: 1361, pitch: 108,       orient: "v", variant: "shell", transform: "" },
    left:   { count: 8,  x: 106,   y0: 481, pitch: 108,       orient: "h", variant: "plain", transform: "rotate(90deg)" },
  },

  /* Narożniki: eksporty SVG (Group 42–45) — statyczny ornament ramki */
  corners: [
    { cls: "corner-tl", src: "assets/corner-tl.svg", x: 106,  y: 103,  transform: "scaleX(-1)" },
    { cls: "corner-tr", src: "assets/corner-tr.svg", x: 2416, y: 103,  transform: "" },
    { cls: "corner-bl", src: "assets/corner-bl.svg", x: 106,  y: 1333, transform: "rotate(180deg)" },
    { cls: "corner-br", src: "assets/corner-br.svg", x: 2416, y: 1327, transform: "scaleY(-1)" },
  ],
};

/* --- WERSJA 2 timera: dwie pionowe kolumny (bez panelu i narożników).
   Figma: plik UCzHnyMnTZ2AS0PnYsw6eR, node 1823-2387.
   Kolumny: Frame 161 (lewa, lustrzana) i Frame 162 (prawa),
   po 16 pigułek 328×83, rozstaw 103 px (83 + gap 20), start y=77. --- */
const V2 = {
  y0: 77,
  count: 16,
  pitch: 103,
  columns: [
    { id: "left",  x: 103,  transform: "rotate(90deg)" },
    { id: "right", x: 2442, transform: "rotate(90deg) scaleY(-1)" },
  ],
  /* Kierunek ładowania: "bottom" = od dołu do góry (tak jak zapalone
     segmenty na designie w Figmie). Zmiana na "top" odwraca kolejność. */
  fillFrom: "bottom",
};

/* Wersje timera do porównania (przełącznik w pasku nad sceną) */
const VERSIONS = [
  { id: "v1",  label: "V1 · ramka dookoła",      build: (l) => buildV1(l) },
  { id: "v2a", label: "V2 · kolumny równolegle", build: (l) => buildV2(l, { mode: "parallel" }) },
  { id: "v2b", label: "V2 · kolumny kolejno",    build: (l) => buildV2(l, { mode: "sequential" }) },
  /* V3 = start z pełnymi kolumnami, timer opada w dół i gasi je kolumna po
     kolumnie, aż wszystko jest puste. Warianty różni to, która kolumna
     opada pierwsza. */
  { id: "v3a", label: "V3 · opada od lewej",  build: (l) => buildV2(l, { mode: "sequential", invert: true, from: "top", first: "left" }) },
  { id: "v3b", label: "V3 · opada od prawej", build: (l) => buildV2(l, { mode: "sequential", invert: true, from: "top", first: "right" }) },
];
const DEFAULT_VERSION = "v1";

/* --- Rundy: tekst zadania + motyw + czas trwania (4000–5000 ms) --- */
const ROUNDS = [
  { text: "Nie naciskaj czerwonego przycisku", themeIndex: 0, durationMs: 4500 },
  { text: "Naciśnij tylko zielony", themeIndex: 1, durationMs: 4500 },
  { text: "Nie naciskaj jeśli tło jest żółte", themeIndex: 2, durationMs: 4500 },
  { text: "Naciśnij przeciwny kolor", themeIndex: 3, durationMs: 4500 },
  { text: "Nie ruszaj się przez 3 sekundy", themeIndex: 4, durationMs: 4500 },
];

/* --- Przebieg: pauza między rundami --- */
const INTER_ROUND_PAUSE_MS = 600;

/* ============================================================
   WIDOK: TABLET GRACZA — gra „Would You Press”
   Figma: plik UCzHnyMnTZ2AS0PnYsw6eR, node 1935-11833 („odpowiedzi”);
   kolory samych przycisków są nowsze i pochodzą z pliku
   feDfMhqinxZSqSzWsB7qFF (node 22-214 i 23-240).
   Ekran nie ma własnego zegara — żyje wciskaniem przycisków i życiami.
   ============================================================ */

/* Tło (warstwa „zagadka”) — rozciągnięcie wg Figmy */
const TABLET_BG = { src: "assets/bg-tablet.png", w: 100.91, h: 100.02, top: -0.01 };

/* Punkty (node 1935-11840): Caudex 72 px, tracking 3.6, środek u góry */
const POINTS = { value: "300", top: 91 };

/* Przyciski „Would You Press” (Frame 146): 4 × 572 px, odstęp 64 px, rząd
   wyśrodkowany w scenie, 43 px nad jej środkiem.
   To ten sam komponent co odpowiedzi w quizie (Quiz/button-types), tylko
   okrągły, więc i tu każdy kolor ma dwie twarze: domyślną i wciśniętą.
   Figma: plik feDfMhqinxZSqSzWsB7qFF, node 22-214 (domyślne) i 23-240
   (wciśnięte). Kąty gradientów są inne niż w quizie, bo przycisk jest
   kwadratowy — te same wypełnienia liczą się od proporcji pudełka.
   `ring` = obwódka 6 px zamiast rozmytej poświaty i bez blura
   (czerwony i zielony). */
const ANSWERS = [
  {
    id: "red", ring: true,
    light: {
      fill: "linear-gradient(10.507deg, #8f1616 -17.57%, #230606 158.65%)", // red/700 → red/950
      stroke: "linear-gradient(132.8deg, #b11719 16.61%, #210405 53.21%)", // red/600 → ciemny
    },
    dark: {
      fill: "linear-gradient(1.814deg, #3c0707 -120.19%, #230606 98.41%)", // red/900 → red/950
      stroke: "linear-gradient(132.8deg, #8f1616 16.61%, #210405 53.21%)", // red/700 → ciemny
    },
  },
  {
    id: "yellow", ring: false,
    light: {
      fill: "linear-gradient(180deg, #1a1804 -92.71%, #76670c 100%)", // yellow/900 → yellow/700
      stroke: "linear-gradient(120.305deg, #ceb935 5.69%, #1a1804 57.37%)", // yellow/500 → yellow/900
    },
    dark: {
      fill: "linear-gradient(180.876deg, #141302 -15.97%, #383106 186.94%)", // yellow/960 → ciemna oliwka
      stroke: "linear-gradient(120.305deg, #76670c 5.69%, #1a1804 57.37%)", // yellow/700 → yellow/900
    },
  },
  {
    id: "blue", ring: false,
    light: {
      fill: "linear-gradient(0.728deg, #113aa2 -9.25%, #060c23 189.65%)", // dark-blue/600 → dark-blue/800
      stroke: "linear-gradient(180.531deg, #1e57e6 -34%, #060c23 67.01%)", // dark-blue/500 → dark-blue/800
    },
    dark: {
      fill: "linear-gradient(360deg, #0e0f4a -41.57%, #060c23 130.57%)", // dark-blue/700 → dark-blue/800
      stroke: "linear-gradient(160.935deg, #1e57e6 19.57%, #020317 92.62%)", // dark-blue/500 → ciemny
    },
  },
  {
    id: "green", ring: true,
    light: {
      fill: "linear-gradient(180.31deg, #0d2805 -97.61%, #19980e 132.69%)", // green/900 → green/700
      stroke: "linear-gradient(150.551deg, #0fcd4e 9.1%, #042108 55.86%)",
    },
    dark: {
      fill: "linear-gradient(183.92deg, #021605 5.28%, #0d2805 129.84%)", // green/950 → green/900
      stroke: "linear-gradient(150.551deg, #19980e 9.1%, #042108 55.86%)", // green/700 → ciemny
    },
  },
];

/* Panel żyć (node 1935-11875 „życia”). Pozycja 1:1 z Dev Mode,
   reszta geometrii (odstępy, insety poświat) siedzi w styles.css. */
const LIVES = {
  max: 3,              // ile kryształów pokazuje panel (w Figmie 3)
  x: 1136.1015625,     // pozycja ramki „życia” w px sceny
  y: 1313,
  label: "Twoje życia:",
  frameAsset: "assets/lives-frame.svg", // ośmiokątna ramka (vector „życia”)
  lifeAsset: "assets/life.svg",         // pełne życie (Group 5/6/8 — identyczne)
  emptyAsset: "assets/life-empty.svg",  // zgaszone (Group 10, node 1936-11886)
};

/* Stan „brak żyć” — Figma node 1936-11876.
   Różnice wobec stanu pełnego: przyciski przygaszone do 40 %, kryształy
   podmienione na puste i komunikat na środku sceny. */
const NO_LIVES = {
  title: "Straciłeś wszystkie życia", // Caudex Bold 160 px
  subtitle: "Poczekaj do końca rundy", // Caudex Regular 72 px
};

/* Animacje utraty życia — trzy warianty do porównania.
   `ms` musi zgadzać się z czasem @keyframes w styles.css. */
const LIFE_ANIMS = [
  { id: "drain",   label: "wyciek",      ms: 900 },
  { id: "burnout", label: "przepalenie", ms: 780 },
  { id: "wobble",  label: "chwianie",    ms: 560 },
  { id: "flip",    label: "obrót",       ms: 620 },
];
const DEFAULT_ANIM = "wobble";

/* ============================================================
   WIDOK: QUIZ (drugi tryb tabletu gracza)
   Figma: plik UCzHnyMnTZ2AS0PnYsw6eR, node 2168-692
   („Quiz/Pytanie i odpowiedzi”) — pytanie, 4 odpowiedzi 2×2,
   pasek czasu na dole. Stany wciśnięte przycisków to osobne node'y:
   2169-740 (czerwony), 2169-742 (żółty), 2169-744 (niebieski),
   2169-773 (zielony).
   ============================================================ */

/* Tło (warstwa „bgbg 1”) — rozciągnięcie wg Figmy */
const QUIZ_BG = { src: "assets/bg-quiz.png", w: 101.04, h: 101.05, top: 0 };

const QUIZ = {
  question: "Co to jest? Ma klawisze, ale nie otwiera zamków?",
  durationMs: 10000, // czas na odpowiedź = pełny pasek na dole
  endHoldMs: 1500,   // po końcu czasu tyle stoi stan końcowy, potem pytanie od nowa
};

/* Odpowiedzi w kolejności siatki: górny rząd L→P, dolny rząd L→P.
   Każdy kolor ma pięć twarzy, od najjaśniejszej do najciemniejszej:
   – light     = jasna, jak na ekranie 2168-692 (pełny kolor, jasny obrys),
   – lightGradient = jaśniejsza domyślna z drugiego pliku Figmy
                 (feDfMhqinxZSqSzWsB7qFF, node 15-148) — gradient w tych
                 samych barwach co `dark`, tylko przesunięty ku jaśniejszym,
   – dark      = ciemna, jak w osobnych node'ach wciśniętych (gradienty),
   – darker    = ciemniejszy wariant wciśniętego z drugiego pliku Figmy
                 (node 15-115) — ta sama geometria, ciemniejsze gradienty,
   – darkest   = jeszcze ciemniejszy wciśnięty (node 19-169) — poprawiony
                 design; obrysy te same co w `darker`, ciemniejsze są
                 wypełnienia czerwonego, żółtego i zielonego (niebieski
                 wyszedł identycznie jak w `darker`).
   Która twarz jest domyślna, a która wciśnięta, decyduje wersja (QUIZ_VERSIONS).
   fill = wypełnienie ramki, stroke = obrys 6 px na zewnątrz; kolor albo
   gradient CSS. Gradienty ciemnych twarzy są przeliczone wprost z węzłów
   Figmy — eksport z Dev Mode gubi w nich minus i podaje tylko pierwszy
   kolor obrysu.
   `ring` = obwódka 6 px zamiast rozmytej poświaty i bez blura — w obu
   twarzach, tak samo jak w okrągłych przyciskach (czerwony i zielony). */
const QUIZ_ANSWERS = [
  {
    id: "red", text: "Odpowiedź", ring: true,
    light: { fill: "#b11719", stroke: "#f64949" }, // red/600, red/400
    lightGradient: {
      fill: "linear-gradient(3.371deg, #8f1616 -17.57%, #230606 158.65%)", // red/700 → red/950
      stroke: "linear-gradient(161.069deg, #b11719 16.61%, #210405 53.21%)", // red/600 → ciemny
    },
    dark: {
      fill: "linear-gradient(0.362deg, #8f1616 -29%, #230606 150.01%)", // red/700 → red/950
      stroke: "linear-gradient(161.069deg, #b11719 16.61%, #210405 53.21%)",
    },
    darker: {
      fill: "linear-gradient(0.362deg, #3c0707 -29%, #230606 150.01%)", // red/900 → red/950
      stroke: "linear-gradient(161.069deg, #8f1616 16.61%, #210405 53.21%)", // red/700 → ciemny
    },
    darkest: {
      fill: "linear-gradient(0.576deg, #3c0707 -120.19%, #230606 98.41%)", // red/900 → red/950
      stroke: "linear-gradient(161.069deg, #8f1616 16.61%, #210405 53.21%)", // jak w `darker`
    },
  },
  {
    id: "yellow", text: "Odpowiedź", ring: false,
    light: { fill: "#a89311", stroke: "#f6e472" }, // yellow/600, yellow/400
    lightGradient: {
      fill: "linear-gradient(180deg, #1a1804 -92.71%, #76670c 100%)", // yellow/900 → yellow/700
      stroke: "linear-gradient(151.48deg, #ceb935 5.57%, #1a1804 57.39%)", // yellow/500 → yellow/900
    },
    dark: {
      fill: "linear-gradient(180deg, #1a1804 -27.86%, #76670c 126%)", // yellow/900 → yellow/700
      stroke: "linear-gradient(151.48deg, #ceb935 5.57%, #1a1804 57.39%)", // yellow/500 → yellow/900
    },
    darker: {
      fill: "linear-gradient(180deg, #1a1804 -27.86%, #5c500a 225.14%)", // yellow/900 → yellow/800
      stroke: "linear-gradient(151.48deg, #76670c 5.57%, #1a1804 57.39%)", // yellow/700 → yellow/900
    },
    darkest: {
      fill: "linear-gradient(180.278deg, #141302 -15.97%, #383106 186.94%)", // yellow/960 → ciemna oliwka
      stroke: "linear-gradient(151.48deg, #76670c 5.57%, #1a1804 57.39%)", // jak w `darker`
    },
  },
  {
    id: "blue", text: "Odpowiedź", ring: false,
    light: { fill: "#1e57e6", stroke: "#4d80ff" }, // dark-blue/500, dark-blue/400
    lightGradient: {
      fill: "linear-gradient(0.231deg, #113aa2 -9.25%, #060c23 189.65%)", // dark-blue/600 → dark-blue/800
      stroke: "linear-gradient(180.169deg, #1e57e6 -33.03%, #060c23 66.81%)", // dark-blue/500 → dark-blue/800
    },
    dark: {
      fill: "linear-gradient(0.231deg, #113aa2 -40.42%, #060c23 129.56%)", // dark-blue/600 → dark-blue/800
      stroke: "linear-gradient(180.169deg, #1e57e6 -33.03%, #060c23 66.81%)", // dark-blue/500 → dark-blue/800
    },
    darker: {
      fill: "linear-gradient(360deg, #0e0f4a -41.57%, #060c23 130.57%)", // dark-blue/700 → dark-blue/800
      stroke: "linear-gradient(180.169deg, #113aa2 -33.03%, #060c23 66.81%)", // dark-blue/600 → dark-blue/800
    },
    darkest: {
      /* niebieski jest w nowym designie taki sam jak w `darker` */
      fill: "linear-gradient(360deg, #0e0f4a -41.57%, #060c23 130.57%)", // dark-blue/700 → dark-blue/800
      stroke: "linear-gradient(180.169deg, #113aa2 -33.03%, #060c23 66.81%)",
    },
  },
  {
    id: "green", text: "Odpowiedź", ring: true,
    light: { fill: "#19980e", stroke: "#53f653" }, // green/700, green/400
    lightGradient: {
      fill: "linear-gradient(180.099deg, #0d2805 -97.61%, #19980e 132.69%)", // green/900 → green/700
      stroke: "linear-gradient(169.834deg, #0fcd4e 9.24%, #042108 55.84%)",
    },
    dark: {
      fill: "linear-gradient(180.099deg, #0d2805 -61.87%, #19980e 149.03%)", // green/900 → green/700
      stroke: "linear-gradient(169.834deg, #0fcd4e 9.24%, #042108 55.84%)",
    },
    darker: {
      fill: "linear-gradient(178.169deg, #0d2805 -5.6%, #086318 236.91%)", // green/900 → green/800
      stroke: "linear-gradient(169.834deg, #19980e 9.24%, #042108 55.84%)", // green/700 → ciemny
    },
    darkest: {
      fill: "linear-gradient(181.247deg, #021605 5.28%, #0d2805 129.84%)", // green/950 → green/900
      stroke: "linear-gradient(169.834deg, #19980e 9.24%, #042108 55.84%)", // jak w `darker`
    },
  },
];

/* Wersje do porównania (przełącznik w pasku nad sceną).
   We wszystkich wciśnięcie przyciemnia i ruch jest identyczny — różni je
   tylko jasność stanu domyślnego (klucze twarzy z QUIZ_ANSWERS).
   Wciśnięty jest wszędzie ten sam: `darker` z node'a 15-115. */
const QUIZ_VERSIONS = [
  { id: "v1.2", label: "V1.2 · jasne domyślne", idle: "light", pressed: "darker",
    title: "Domyślne pełne jasne (ekran quizu), wciśnięty ciemniejszy (node 15-115)" },
  { id: "v1.3", label: "V1.3 · średnie domyślne", idle: "lightGradient", pressed: "darkest",
    title: "Domyślne jaśniejszy gradient (node 15-148), wciśnięty najciemniejszy (node 19-169)" },
  { id: "v2", label: "V2 · ciemne domyślne", idle: "dark", pressed: "darker",
    title: "Domyślne ciemny gradient, wciśnięty jeszcze ciemniejszy (node 15-115)" },
];
const DEFAULT_QUIZ_VERSION = "v1.2";

/* ============================================================
   WIDOKI (select w pasku nad sceną)
   ============================================================ */
const VIEWS = [
  { id: "instruktaz", label: "Instruktaż",           build: buildInstruktaz },
  { id: "tablet",     label: "Tablet gracza · Would You Press", build: buildTablet },
  { id: "quiz",       label: "Tablet gracza · quiz", build: buildQuiz },
];
const DEFAULT_VIEW = "instruktaz";

/* Podpowiedzi klawiszowe — inne dla każdego widoku */
const HINTS = {
  instruktaz: "spacja — pauza · ←/→ — runda · R — restart",
  tablet: "kliknij przycisk · Z — tracisz życie · 0–3 — skok do stanu · R — restart",
  quiz: "kliknij odpowiedź · spacja — pauza · R — od nowa · 1–3 — wersja",
};

const STORAGE_KEY = "quizsteries-version";
const VIEW_STORAGE_KEY = "quizsteries-view";
const ANIM_STORAGE_KEY = "quizsteries-anim";
const QUIZ_STORAGE_KEY = "quizsteries-quiz";

/* ============================================================
   MOTYWY — 5 zestawów kolorów.
   Motyw 0 („yellow”) = tokeny z Figmy. Motywy 1–4 to placeholdery
   (kopie yellow) — kolory zostaną dopisane później.
   Uwaga: tła (PNG) i narożniki (SVG) mają kolory wypalone w assetach —
   motyw steruje segmentami, panelem i tekstem.
   ============================================================ */
const THEMES = [
  {
    name: "yellow",
    bg: "#100903",                      // tło sceny / letterbox (brown/900)
    panelBorder: "#5c500a",             // yellow/800
    segBorderOff: "#f6e472",            // yellow/400
    segLeftBorderOff: "#5c500a",        // yellow/800 (lewa kolumna w v1)
    segGradFrom: "#141302",             // yellow/960
    segGradTo: "#76670c",               // yellow/700
    shellFrom: "rgba(6, 20, 26, 0.32)", // turquoise/925
    shellTo: "rgba(8, 70, 66, 0.32)",   // turquoise/700
    segOn: "#ceb935",                   // zapalony segment (v1, płaski)
    segOnBorder: "#f6e472",
    segOnFrom: "#5c500a",               // zapalony segment (v2, gradient)
    segOnTo: "#ceb935",
    text: "#d8ca94",                    // beige/500
  },
];
// Motywy 2–5: na razie kopie yellow (placeholdery)
for (let i = 1; i < 5; i++) THEMES.push({ ...THEMES[0], name: `theme-${i + 1} (placeholder)` });

/* ============================================================
   ELEMENTY SCENY
   ============================================================ */
const sceneEl = document.getElementById("scene");
const viewportEl = document.getElementById("viewport");
const viewEl = document.createElement("div"); // zawartość bieżącego widoku
const layerEl = document.createElement("div"); // warstwa timera (tylko instruktaż)
let textEl = null;
let litElements = []; // [{ el, threshold }]
let lifeEls = []; // kryształy w panelu żyć, od lewej
let answerEls = []; // okrągłe przyciski „Would You Press” (tablet gracza)
let quizEls = null; // { grid, bar, answers } — tylko na widoku quizu
let currentViewId = DEFAULT_VIEW;
let currentVersionId = DEFAULT_VERSION;
let currentAnimId = DEFAULT_ANIM;
let currentQuizVersionId = DEFAULT_QUIZ_VERSION;

/* Tło widoku — każdy ekran ma własne rozciągnięcie z Figmy */
function makeBg(cfg) {
  const img = document.createElement("img");
  img.className = "scene-bg";
  img.src = cfg.src;
  img.alt = "";
  img.style.width = cfg.w + "%";
  img.style.height = cfg.h + "%";
  img.style.top = cfg.top + "%";
  return img;
}

/* ============================================================
   INSTRUKTAŻ — segmenty timera
   Każdy segment dostaje `threshold` — ułamek czasu rundy (0..1),
   po przekroczeniu którego się zapala. To jedyne, co odróżnia
   trzy wersje timera od siebie.
   ============================================================ */

/* Segment: baza 83×328; poziomy = ta sama baza obrócona wokół środka
   (stąd korekta pozycji o (328−83)/2 = 122.5 px), dokładnie jak w Figmie. */
function makeSegment({ x, y, orient, transform, variant, pill }) {
  const el = document.createElement("div");
  el.className = "seg " + variant + (pill ? " pill" : "");
  el.style.width = PILL.w + "px";
  el.style.height = PILL.h + "px";
  if (orient === "v") {
    el.style.left = x + "px";
    el.style.top = y + "px";
  } else {
    el.style.left = x + (PILL.h - PILL.w) / 2 + "px";
    el.style.top = y - (PILL.h - PILL.w) / 2 + "px";
    el.style.transform = transform;
  }
  el.innerHTML = '<div class="seg-core"></div>';
  return el;
}

/* --- WERSJA 1: panel + 52 segmenty po obwodzie + narożniki.
   Kolejność zapalania: góra (L→P) → prawo (G→D) → dół (P→L) → lewo (D→G). --- */
function buildV1(layer) {
  // Centralny panel z teksturą
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.style.left = V1.panel.x + "px";
  panel.style.top = V1.panel.y + "px";
  panel.style.width = V1.panel.w + "px";
  panel.style.height = V1.panel.h + "px";
  panel.innerHTML = '<img class="panel-texture" src="assets/panel-texture.png" alt="">';
  layer.appendChild(panel);

  // Segmenty w kolejności obwodu
  const order = [];
  const R = V1.rows;
  for (let i = 0; i < R.top.count; i++) order.push({ row: R.top, x: R.top.x0 + i * R.top.pitch, y: R.top.y });
  for (let i = 0; i < R.right.count; i++) order.push({ row: R.right, x: R.right.x, y: R.right.y0 + i * R.right.pitch });
  for (let i = R.bottom.count - 1; i >= 0; i--) order.push({ row: R.bottom, x: R.bottom.x0 + i * R.bottom.pitch, y: R.bottom.y });
  for (let i = R.left.count - 1; i >= 0; i--) order.push({ row: R.left, x: R.left.x, y: R.left.y0 + i * R.left.pitch });

  const segs = order.map((item, k) => {
    const el = makeSegment({
      x: item.x,
      y: item.y,
      orient: item.row.orient,
      transform: item.row.transform,
      variant: item.row.variant,
      pill: false,
    });
    layer.appendChild(el);
    return { el, threshold: (k + 1) / order.length };
  });

  // Narożniki na wierzchu segmentów (jak w Figmie)
  V1.corners.forEach((c) => {
    const el = document.createElement("div");
    el.className = "corner " + c.cls;
    el.style.left = c.x + "px";
    el.style.top = c.y + "px";
    if (c.transform) el.style.transform = c.transform;
    el.innerHTML = `<img src="${c.src}" alt="">`;
    layer.appendChild(el);
  });

  return segs;
}

/* --- WERSJE 2 i 3: dwie kolumny po 16 pigułek, obsługiwane od dołu do góry.
   mode   = "parallel"   → obie kolumny działają równocześnie
            "sequential" → najpierw cała jedna kolumna, potem druga
   invert = false → segmenty się zapalają (V2: od pustych do pełnych)
            true  → segmenty gasną     (V3: od pełnych do pustych)
   first  = "left" | "right" → która kolumna idzie pierwsza (tylko sequential)
   from   = "bottom" | "top" → od którego końca kolumny zaczyna się zmiana

   V2 ładuje się od dołu do góry (tak jak zapalone segmenty w Figmie), a V3
   opada od góry w dół, żeby pełne zostawały na dole jak kurczący się zapas.
   Stąd `from` jest per wersja, a nie wspólne. --- */
function buildV2(layer, { mode, invert = false, first = "left", from = V2.fillFrom }) {
  const n = V2.count;
  const segs = [];

  /* Kolejność obsługi kolumn. Pozycja kolumny na scenie (x, transform)
     zostaje ta sama — odwracamy tylko to, która jest pierwsza w kolejce. */
  const columns = first === "right" ? [...V2.columns].reverse() : V2.columns;

  columns.forEach((col, c) => {
    for (let row = 0; row < n; row++) {
      // pozycja w kolejce wewnątrz kolumny (0 = zmienia się pierwszy)
      const order = from === "bottom" ? n - 1 - row : row;
      const threshold =
        mode === "sequential" ? (c * n + order + 1) / (2 * n) : (order + 1) / n;

      const el = makeSegment({
        x: col.x,
        y: V2.y0 + row * V2.pitch,
        orient: "h",
        transform: col.transform,
        variant: "shell",
        pill: true,
      });
      layer.appendChild(el);
      segs.push({ el, threshold, invert });
    }
  });

  return segs;
}

/* --- Widok instruktażu: tło + warstwa timera + tekst zadania --- */
function buildInstruktaz(root) {
  root.appendChild(makeBg(INSTRUKTAZ_BG));

  layerEl.innerHTML = "";
  root.appendChild(layerEl);

  textEl = document.createElement("div");
  textEl.className = "task-text";
  root.appendChild(textEl);

  mountVersion(currentVersionId);
}

/* ============================================================
   TABLET GRACZA — punkty, przyciski odpowiedzi, panel żyć
   ============================================================ */

/* Przycisk „Would You Press”: ten sam komponent co odpowiedź w quizie,
   tylko okrągły — te same klasy CSS, więc i ta sama animacja wciśnięcia.
   Rdzeń ma dwie twarze: domyślną i wciśniętą, która wchodzi przejściem
   krycia (kolory wstawiamy jako zmienne CSS). */
function makeAnswer(cfg) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "qa qa-round";
  btn.dataset.answer = cfg.id;
  btn.setAttribute("aria-pressed", "false");

  btn.style.setProperty("--qa-fill", asImage(cfg.light.fill));
  btn.style.setProperty("--qa-stroke", asImage(cfg.light.stroke));
  btn.style.setProperty("--qa-fill-pressed", asImage(cfg.dark.fill));
  btn.style.setProperty("--qa-stroke-pressed", asImage(cfg.dark.stroke));

  btn.innerHTML =
    `<span class="qa-shell"><span class="qa-core${cfg.ring ? " ring" : ""}">` +
    `<span class="qa-face"></span><span class="qa-face qa-face-pressed"></span>` +
    `</span></span>`;

  /* Sterowanie jak w quizie: wybór na dotknięcie, bez fokusu po myszy */
  btn.addEventListener("pointerdown", (e) => {
    if (e.button === 0) pressAnswer(cfg.id);
  });
  btn.addEventListener("mousedown", (e) => e.preventDefault());
  btn.addEventListener("click", (e) => {
    if (e.detail === 0) pressAnswer(cfg.id);
  });
  return btn;
}

/* Wciśnięty przycisk: jeden naraz, jak odpowiedź w quizie. Przy zerze żyć
   gracz nic nie wciśnie — ekran mówi „Poczekaj do końca rundy”. */
function pressAnswer(id) {
  if (state.lives === 0) return;
  answerEls.forEach((el) => {
    el.setAttribute("aria-pressed", String(el.dataset.answer === id));
  });
}

function clearPressedAnswer() {
  answerEls.forEach((el) => el.setAttribute("aria-pressed", "false"));
}

/* Panel żyć: etykieta „Twoje życia:” + ramka z kryształami w środku */
function buildLives(root) {
  const box = document.createElement("div");
  box.className = "lives";
  box.style.left = LIVES.x + "px";
  box.style.top = LIVES.y + "px";

  const label = document.createElement("div");
  label.className = "lives-label";
  label.textContent = LIVES.label;
  box.appendChild(label);

  const frame = document.createElement("div");
  frame.className = "lives-frame";
  frame.innerHTML = `<img src="${LIVES.frameAsset}" alt="">`;

  /* Każdy kafelek to pusty kryształ z nałożonym pełnym. Utrata życia =
     odsłonięcie pustego, więc animacja rusza tylko warstwę wierzchnią. */
  const row = document.createElement("div");
  row.className = "lives-row";
  lifeEls = [];
  for (let i = 0; i < LIVES.max; i++) {
    const life = document.createElement("div");
    life.className = "life";
    life.innerHTML =
      `<img class="life-img life-empty" src="${LIVES.emptyAsset}" alt="">` +
      `<img class="life-img life-full" src="${LIVES.lifeAsset}" alt="">`;
    row.appendChild(life);
    lifeEls.push(life);
  }

  frame.appendChild(row);
  box.appendChild(frame);
  root.appendChild(box);
}

/* --- Widok tabletu gracza: tło + punkty + odpowiedzi + życia --- */
function buildTablet(root) {
  root.appendChild(makeBg(TABLET_BG));

  const points = document.createElement("div");
  points.className = "tablet-points";
  points.style.top = POINTS.top + "px";
  points.textContent = POINTS.value;
  root.appendChild(points);

  const row = document.createElement("div");
  row.className = "tablet-answers";
  answerEls = ANSWERS.map((cfg) => {
    const el = makeAnswer(cfg);
    row.appendChild(el);
    return el;
  });
  root.appendChild(row);

  buildLives(root);

  /* Komunikat stanu „brak żyć” — pokazywany klasą .no-lives na warstwie */
  const msg = document.createElement("div");
  msg.className = "tablet-nolives";
  msg.innerHTML =
    `<div class="tablet-nolives-title"></div><div class="tablet-nolives-sub"></div>`;
  msg.querySelector(".tablet-nolives-title").textContent = NO_LIVES.title;
  msg.querySelector(".tablet-nolives-sub").textContent = NO_LIVES.subtitle;
  root.appendChild(msg);

  renderLives();

  /* Tablet nie ma rund — kolory bierze z motywu bazowego */
  applyTheme(THEMES[0]);
}

/* ============================================================
   QUIZ — pytanie, odpowiedzi 2×2, pasek czasu
   ============================================================ */

/* Kolor jako obraz CSS — twarze układają wypełnienie i obrys warstwami tła */
const asImage = (paint) => (paint.startsWith("linear-gradient") ? paint : `linear-gradient(${paint}, ${paint})`);

/* Przycisk odpowiedzi (Quiz/button-types 1134×382): skorupa → rdzeń → twarze
   + tekst. Twarz domyślna leży pod spodem, wciśnięta na niej wchodzi
   przejściem krycia. Wersja decyduje, która twarz jest którą, więc
   CSS dostaje gotowe obrazy i nie musi znać wersji. */
function makeQuizAnswer(cfg, version) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "qa";
  btn.dataset.answer = cfg.id;
  btn.setAttribute("aria-pressed", "false");

  const idle = cfg[version.idle];
  const pressed = cfg[version.pressed];
  btn.style.setProperty("--qa-fill", asImage(idle.fill));
  btn.style.setProperty("--qa-stroke", asImage(idle.stroke));
  btn.style.setProperty("--qa-fill-pressed", asImage(pressed.fill));
  btn.style.setProperty("--qa-stroke-pressed", asImage(pressed.stroke));

  btn.innerHTML =
    `<span class="qa-shell"><span class="qa-core${cfg.ring ? " ring" : ""}">` +
    `<span class="qa-face"></span><span class="qa-face qa-face-pressed"></span>` +
    `<span class="qa-text"></span></span></span>`;
  btn.querySelector(".qa-text").textContent = cfg.text;

  /* Wybór na dotknięcie, a nie na puszczenie — w grze na czas liczy się
     moment reakcji. Enter z klawiatury daje sam click (detail = 0). */
  btn.addEventListener("pointerdown", (e) => {
    if (e.button === 0) selectAnswer(cfg.id);
  });
  /* Bez fokusu po kliknięciu myszą — inaczej spacja (pauza) naciśnięta po
     kliknięciu zapala obwódkę fokusu na odpowiedzi. Tab dalej działa. */
  btn.addEventListener("mousedown", (e) => e.preventDefault());
  btn.addEventListener("click", (e) => {
    if (e.detail === 0) selectAnswer(cfg.id);
  });
  return btn;
}

/* --- Widok quizu: tło + punkty + pytanie + odpowiedzi + pasek czasu --- */
function buildQuiz(root) {
  root.appendChild(makeBg(QUIZ_BG));

  const points = document.createElement("div");
  points.className = "quiz-points";
  points.textContent = POINTS.value;
  root.appendChild(points);

  const question = document.createElement("div");
  question.className = "quiz-question";
  question.textContent = QUIZ.question;
  root.appendChild(question);

  const grid = document.createElement("div");
  grid.className = "quiz-answers";
  root.appendChild(grid);

  const timer = document.createElement("div");
  timer.className = "quiz-timer";
  const bar = document.createElement("div");
  bar.className = "quiz-timer-fill";
  timer.appendChild(bar);
  root.appendChild(timer);

  quizEls = { grid, bar, answers: [] };

  /* Quiz nie ma rund — kolory bierze z motywu bazowego */
  applyTheme(THEMES[0]);
  mountQuizVersion(currentQuizVersionId);
}

/* ============================================================
   SCENA I PRZEŁĄCZANIE WIDOKÓW
   ============================================================ */

function buildScene() {
  sceneEl.style.width = SCENE.width + "px";
  sceneEl.style.height = SCENE.height + "px";

  viewEl.className = "view";
  sceneEl.appendChild(viewEl);
}

function mountView(id) {
  const view = VIEWS.find((v) => v.id === id) || VIEWS[0];
  currentViewId = view.id;

  /* Warstwa timera wraca do puli — instruktaż wstawia ją z powrotem */
  layerEl.remove();
  litElements = [];
  lifeEls = [];
  answerEls = [];
  quizEls = null;
  textEl = null;

  viewEl.innerHTML = "";
  view.build(viewEl);

  applyNoLives();

  document.getElementById("view-select").value = view.id;
  document.getElementById("topbar-hint").textContent = HINTS[view.id];
  /* Każdy widok ma w pasku własną grupę sterowania: #ctrl-<id widoku> */
  VIEWS.forEach((v) => {
    const group = document.getElementById("ctrl-" + v.id);
    if (group) group.hidden = v.id !== view.id;
  });

  remember(VIEW_STORAGE_KEY, view.id);
}

function mountVersion(id) {
  const version = VERSIONS.find((v) => v.id === id) || VERSIONS[0];
  currentVersionId = version.id;

  layerEl.innerHTML = "";
  litElements = version.build(layerEl);

  document.querySelectorAll("#version-switch button").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.version === version.id));
  });

  remember(STORAGE_KEY, version.id);
  startRound(state.roundIndex); // restart rundy, żeby animacja poszła od zera
}

/* Wersja quizu: przyciski budujemy od nowa, więc od razu stoją w nowej
   twarzy domyślnej (bez przejścia ze starej), a pytanie startuje od zera. */
function mountQuizVersion(id) {
  const version = QUIZ_VERSIONS.find((v) => v.id === id) || QUIZ_VERSIONS[0];
  currentQuizVersionId = version.id;

  if (quizEls) {
    quizEls.grid.innerHTML = "";
    quizEls.answers = QUIZ_ANSWERS.map((cfg) => {
      const el = makeQuizAnswer(cfg, version);
      quizEls.grid.appendChild(el);
      return el;
    });
    startQuestion();
  }

  document.querySelectorAll("#quiz-switch button").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.quiz === version.id));
  });

  remember(QUIZ_STORAGE_KEY, version.id);
}

/* --- Skalowanie sceny do okna pod paskiem (proporcje zachowane).
   ResizeObserver zamiast samego window.resize: łapie też moment,
   w którym kontener dostaje wymiary już po starcie skryptu. --- */
function fitScene() {
  const w = viewportEl.clientWidth;
  const h = viewportEl.clientHeight;
  if (!w || !h) return; // jeszcze bez layoutu — poczekaj na obserwatora
  sceneEl.style.transform =
    `translate(-50%, -50%) scale(${Math.min(w / SCENE.width, h / SCENE.height)})`;
}
window.addEventListener("resize", fitScene);
if (window.ResizeObserver) new ResizeObserver(fitScene).observe(viewportEl);

/* --- Motyw: podmiana zmiennych CSS --- */
function applyTheme(theme) {
  const root = document.documentElement.style;
  root.setProperty("--bg", theme.bg);
  root.setProperty("--panel-border", theme.panelBorder);
  root.setProperty("--seg-border-off", theme.segBorderOff);
  root.setProperty("--seg-left-border-off", theme.segLeftBorderOff);
  root.setProperty("--seg-grad-from", theme.segGradFrom);
  root.setProperty("--seg-grad-to", theme.segGradTo);
  root.setProperty("--shell-from", theme.shellFrom);
  root.setProperty("--shell-to", theme.shellTo);
  root.setProperty("--seg-on", theme.segOn);
  root.setProperty("--seg-on-border", theme.segOnBorder);
  root.setProperty("--seg-on-from", theme.segOnFrom);
  root.setProperty("--seg-on-to", theme.segOnTo);
  root.setProperty("--text", theme.text);
}

/* Zapamiętanie wyboru; w trybie prywatnym po prostu się nie zapamięta */
function remember(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    /* brak dostępu do localStorage — trudno */
  }
}

/* ============================================================
   PASEK PODGLĄDU (poza designem)
   ============================================================ */
function buildTopbar() {
  const select = document.getElementById("view-select");
  VIEWS.forEach((v) => {
    const opt = document.createElement("option");
    opt.value = v.id;
    opt.textContent = v.label;
    select.appendChild(opt);
  });
  select.addEventListener("change", () => mountView(select.value));

  const versions = document.getElementById("version-switch");
  VERSIONS.forEach((v) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = v.label;
    btn.dataset.version = v.id;
    btn.addEventListener("click", () => mountVersion(v.id));
    versions.appendChild(btn);
  });

  const lives = document.getElementById("lives-switch");
  for (let n = LIVES.max; n >= 0; n--) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = String(n);
    btn.dataset.lives = String(n);
    btn.addEventListener("click", () => setLives(n));
    lives.appendChild(btn);
  }

  document.getElementById("lose-life").addEventListener("click", loseLife);

  const anims = document.getElementById("anim-switch");
  LIFE_ANIMS.forEach((a) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = a.label;
    btn.dataset.anim = a.id;
    /* Podgląd wariantu: przywróć życie i od razu je zabierz */
    btn.addEventListener("click", () => {
      setLifeAnim(a.id);
      if (state.lives === 0) setLives(1);
      loseLife();
    });
    anims.appendChild(btn);
  });

  const quizSwitch = document.getElementById("quiz-switch");
  QUIZ_VERSIONS.forEach((v) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = v.label;
    btn.title = v.title; // pełny opis w dymku — etykiety są skrócone, żeby pasek się mieścił
    btn.dataset.quiz = v.id;
    btn.addEventListener("click", () => mountQuizVersion(v.id));
    quizSwitch.appendChild(btn);
  });
}

/* Wariant animacji trzymamy klasą na scenie — przeżywa przebudowę widoku */
function setLifeAnim(id) {
  currentAnimId = LIFE_ANIMS.some((a) => a.id === id) ? id : DEFAULT_ANIM;
  LIFE_ANIMS.forEach((a) => {
    sceneEl.classList.toggle("anim-" + a.id, a.id === currentAnimId);
  });
  document.querySelectorAll("#anim-switch button").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.anim === currentAnimId));
  });
  remember(ANIM_STORAGE_KEY, currentAnimId);
}

/* ============================================================
   ROZGRYWKA + TIMER (requestAnimationFrame)
   Pełny timer = koniec czasu rundy. Po rundzie pauza
   INTER_ROUND_PAUSE_MS i następna; po ostatniej — zapętlenie.
   ============================================================ */
const state = {
  roundIndex: 0,
  phase: "running", // "running" | "between" (pauza między rundami)
  phaseStart: 0, // performance.now() startu bieżącej fazy
  elapsedInPhase: 0, // czas skumulowany (do obsługi pauzy)
  paused: false,
  frozenAt: 0, // od kiedy stoimy (pauza); 0 = idzie
  lives: LIVES.max,
};

/* Pytanie w quizie — własny zegar faz, pauza wspólna z instruktażem */
const quiz = {
  phase: "running", // "running" | "ended" (czas minął, odpowiedzi zablokowane)
  phaseStart: 0,
  elapsedInPhase: 0,
  frozenAt: 0,
  selected: null, // id wybranej odpowiedzi albo null
};

/* --- Życia ---
   setLives  = skok wprost do stanu (przyciski w pasku) — bez animacji,
   loseLife  = utrata jednego życia z animacją wybranego wariantu. --- */
function setLives(n) {
  state.lives = Math.max(0, Math.min(LIVES.max, n));
  renderLives();
}

/* Malowanie stanu żyć — panel istnieje tylko na widoku tabletu.
   Zdejmuje też animację w locie, gdy ktoś skoczy do innego stanu. */
function renderLives() {
  lifeEls.forEach((el, i) => {
    el.classList.remove("losing");
    el.classList.toggle("lost", i >= state.lives);
  });
  syncLivesSwitch();
  applyNoLives();
}

function syncLivesSwitch() {
  document.querySelectorAll("#lives-switch button").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(Number(btn.dataset.lives) === state.lives));
  });
}

/* Zero żyć = przygaszone przyciski + komunikat (Figma node 1936-11876) */
function applyNoLives() {
  viewEl.classList.toggle("no-lives", state.lives === 0 && currentViewId === "tablet");
}

function loseLife() {
  if (state.lives <= 0) return;

  const el = lifeEls[state.lives - 1]; // gaśnie ostatni świecący, od prawej
  state.lives -= 1;
  syncLivesSwitch();

  const full = el && el.querySelector(".life-full");
  if (!full) {
    renderLives(); // panel niezbudowany (inny widok) — tylko stan
    return;
  }

  /* Komunikat wchodzi dopiero, gdy kryształ zgaśnie. Poza animationend
     trzymamy budzik na czas trwania wariantu — karta w tle albo przerwana
     animacja tego zdarzenia nie wyśle, a stan musi się domknąć tak czy siak. */
  const anim = LIFE_ANIMS.find((a) => a.id === currentAnimId);
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    el.classList.remove("losing");
    el.classList.add("lost");
    applyNoLives();
  };

  el.classList.add("losing");
  full.addEventListener("animationend", finish, { once: true });
  setTimeout(finish, (anim ? anim.ms : 800) + 80);
}

function startRound(index) {
  state.roundIndex = ((index % ROUNDS.length) + ROUNDS.length) % ROUNDS.length;
  const round = ROUNDS[state.roundIndex];
  applyTheme(THEMES[round.themeIndex]);
  if (textEl) textEl.textContent = round.text;
  /* Stan startowy liczymy z progresu 0, a nie gasimy na sztywno — inaczej
     wersje odwrócone (V3) zaczynałyby rundę puste zamiast pełne. */
  setSegmentsProgress(0);
  state.phase = "running";
  state.phaseStart = performance.now();
  state.elapsedInPhase = 0;
  state.frozenAt = 0;
}

/* Segment zwykły zapala się po przekroczeniu swojego progu; odwrócony (V3)
   startuje zapalony i w tym samym momencie gaśnie. */
function setSegmentsProgress(progress) {
  litElements.forEach(({ el, threshold, invert }) => {
    el.classList.toggle("on", invert ? progress < threshold : progress >= threshold);
  });
}

/* --- Quiz --- */
function startQuestion() {
  quiz.phase = "running";
  quiz.phaseStart = performance.now();
  quiz.elapsedInPhase = 0;
  quiz.frozenAt = 0;
  setSelected(null);
  setQuizProgress(0);
}

/* Jedna odpowiedź naraz; do końca czasu można zmienić zdanie.
   Po czasie przyciski już nie reagują. */
function selectAnswer(id) {
  if (!quizEls || quiz.phase !== "running") return;
  setSelected(id);
  /* Całą animację wciśnięcia robią przejścia CSS na przycisku
     (zmniejszenie i zmiana twarzy) — tu wystarczy zmiana stanu. */
}

function setSelected(id) {
  quiz.selected = id;
  if (!quizEls) return;
  quizEls.answers.forEach((el) => {
    el.setAttribute("aria-pressed", String(el.dataset.answer === id));
  });
}

/* Pasek czasu kurczy się do lewej. Gradient liczy się od bieżącej
   szerokości, więc jasny koniec zostaje na czubku jak dopalający się lont. */
function setQuizProgress(progress) {
  if (!quizEls) return;
  quizEls.bar.style.width = (1 - progress) * 100 + "%";
  quizEls.bar.style.visibility = progress >= 1 ? "hidden" : "";
}

/* Zegar fazy z obsługą pauzy: wejście w postój domyka licznik fazy,
   wyjście przesuwa start, więc czas postoju nie wlicza się do fazy.
   Zwraca czas od startu fazy albo null, gdy stoimy. */
function phaseElapsed(clock, now) {
  const frozen = state.paused;
  if (frozen && !clock.frozenAt) {
    clock.elapsedInPhase += now - clock.phaseStart;
    clock.frozenAt = now;
  } else if (!frozen && clock.frozenAt) {
    clock.phaseStart = now;
    clock.frozenAt = 0;
  }
  return frozen ? null : clock.elapsedInPhase + (now - clock.phaseStart);
}

/* Instruktaż to ekran wspólny — utrata żyć przez gracza go nie zatrzymuje
   („Poczekaj do końca rundy”). Stoi tylko na pauzie. */
function tickInstruktaz(now) {
  const elapsed = phaseElapsed(state, now);
  if (elapsed === null) return;
  const round = ROUNDS[state.roundIndex];

  if (state.phase === "running") {
    const progress = Math.min(elapsed / round.durationMs, 1);
    setSegmentsProgress(progress);
    if (progress >= 1) {
      state.phase = "between";
      state.phaseStart = now;
      state.elapsedInPhase = 0;
    }
  } else if (state.phase === "between") {
    if (elapsed >= INTER_ROUND_PAUSE_MS) {
      startRound(state.roundIndex + 1); // po 5. rundzie zapętla od 1.
    }
  }
}

/* Quiz: pełny pasek = cały czas na odpowiedź, potem chwila stanu
   końcowego i to samo pytanie od nowa (prototyp się zapętla). */
function tickQuiz(now) {
  const elapsed = phaseElapsed(quiz, now);
  if (elapsed === null) return;

  if (quiz.phase === "running") {
    const progress = Math.min(elapsed / QUIZ.durationMs, 1);
    setQuizProgress(progress);
    if (progress >= 1) {
      quiz.phase = "ended";
      quiz.phaseStart = now;
      quiz.elapsedInPhase = 0;
    }
  } else if (elapsed >= QUIZ.endHoldMs) {
    startQuestion();
  }
}

function tick(now) {
  /* Zegar chodzi tylko na widokach, które go mają — Would You Press
     nie odlicza czasu */
  if (currentViewId === "instruktaz") tickInstruktaz(now);
  else if (currentViewId === "quiz") tickQuiz(now);

  requestAnimationFrame(tick);
}

/* --- Sterowanie testowe: spacja = pauza, ←/→ = rundy, Z = zła odpowiedź,
       R = restart, cyfry = wersja albo liczba żyć (zależnie od widoku).
       Rozliczaniem czasu pauzy zajmuje się phaseElapsed(). --- */
window.addEventListener("keydown", (e) => {
  if (e.target instanceof HTMLSelectElement) return; // nie porywaj klawiszy z selecta

  switch (e.code) {
    case "Space":
      e.preventDefault();
      state.paused = !state.paused;
      break;
    case "ArrowRight":
      state.paused = false;
      startRound(state.roundIndex + 1);
      break;
    case "ArrowLeft":
      state.paused = false;
      startRound(state.roundIndex - 1);
      break;
    case "KeyZ": // zła odpowiedź — jedno życie mniej, z animacją
      loseLife();
      break;
    case "KeyR":
      state.paused = false;
      setLives(LIVES.max);
      clearPressedAnswer();
      startRound(0);
      if (currentViewId === "quiz") startQuestion();
      break;
    /* Cyfry: na instruktażu wersja timera (1–5), na tablecie liczba żyć (0–3),
       w quizie wersja wciśnięcia (1–3). Cyfry spoza zakresu są ignorowane. */
    case "Digit0":
    case "Digit1":
    case "Digit2":
    case "Digit3":
    case "Digit4":
    case "Digit5": {
      const n = Number(e.code.slice(5));
      if (currentViewId === "tablet") {
        if (n <= LIVES.max) setLives(n);
      } else if (currentViewId === "quiz") {
        if (n >= 1 && QUIZ_VERSIONS[n - 1]) mountQuizVersion(QUIZ_VERSIONS[n - 1].id);
      } else if (n >= 1 && VERSIONS[n - 1]) {
        mountVersion(VERSIONS[n - 1].id);
      }
      break;
    }
  }
});

/* --- Start ---
   Widok i wersja startowa: parametry w adresie (np. ?view=tablet&v=v2a —
   wygodne do wysłania klientowi linku prosto do jednego ekranu),
   potem ostatni wybór z localStorage, na końcu domyślne. */
function initialChoice(param, key, allowed, fallback) {
  const fromUrl = new URLSearchParams(location.search).get(param);
  if (allowed.includes(fromUrl)) return fromUrl;
  try {
    const saved = localStorage.getItem(key);
    if (allowed.includes(saved)) return saved;
  } catch (e) {
    /* brak dostępu do localStorage — startujemy od domyślnego */
  }
  return fallback;
}

buildScene();
buildTopbar();
currentVersionId = initialChoice("v", STORAGE_KEY, VERSIONS.map((v) => v.id), DEFAULT_VERSION);
currentQuizVersionId = initialChoice("quiz", QUIZ_STORAGE_KEY, QUIZ_VERSIONS.map((v) => v.id), DEFAULT_QUIZ_VERSION);
setLifeAnim(initialChoice("anim", ANIM_STORAGE_KEY, LIFE_ANIMS.map((a) => a.id), DEFAULT_ANIM));
fitScene();
mountView(initialChoice("view", VIEW_STORAGE_KEY, VIEWS.map((v) => v.id), DEFAULT_VIEW));
requestAnimationFrame(tick);
