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
  { id: "v1",  label: "V1 · ramka dookoła",      build: (layer) => buildV1(layer) },
  { id: "v2a", label: "V2 · kolumny równolegle", build: (layer) => buildV2(layer, "parallel") },
  { id: "v2b", label: "V2 · kolumny kolejno",    build: (layer) => buildV2(layer, "sequential") },
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
   WIDOK: TABLET GRACZA
   Figma: plik UCzHnyMnTZ2AS0PnYsw6eR, node 1935-11833 („odpowiedzi”).
   Widok statyczny — kolejne stany designu dojdą później.
   ============================================================ */

/* Tło (warstwa „zagadka”) — rozciągnięcie wg Figmy */
const TABLET_BG = { src: "assets/bg-tablet.png", w: 100.91, h: 100.02, top: -0.01 };

/* Punkty (node 1935-11840): Caudex 72 px, tracking 3.6, środek u góry */
const POINTS = { value: "300", top: 91 };

/* Przyciski odpowiedzi (Frame 146): 4 × 572 px, odstęp 64 px, rząd
   wyśrodkowany w scenie, 43 px nad jej środkiem.
   Skorupa i geometria są wspólne (komponent Quiz/button-types) —
   różni je tylko kolor rdzenia, więc tylko to trzymamy w tablicy.
   `ring` = wariant cienia z obwódką 6 px zamiast rozmytej poświaty
   (w Figmie mają go czerwony i zielony; te dwa nie mają też blura). */
const ANSWERS = [
  { id: "red",    border: "#b11719", angle: 2.4514, from: "#110102", fromAt: "8.4863%", to: "#a11214", toAt: "366.25%", ring: true },
  { id: "yellow", border: "#f6e472", angle: 5.5927, from: "#141302", fromAt: "12.611%", to: "#76670c", toAt: "271.55%", ring: false },
  { id: "blue",   border: "#1e57e6", angle: 2.3351, from: "#0e0f4a", fromAt: "6.4769%", to: "#1e57e6", toAt: "285.21%", ring: false },
  { id: "green",  border: "#0fcd4e", angle: 0.5993, from: "#021605", fromAt: "10.083%", to: "#2dd01e", toAt: "477.01%", ring: true },
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
   WIDOKI (select w pasku nad sceną)
   ============================================================ */
const VIEWS = [
  { id: "instruktaz", label: "Instruktaż",    build: buildInstruktaz },
  { id: "tablet",     label: "Tablet gracza", build: buildTablet },
];
const DEFAULT_VIEW = "instruktaz";

/* Podpowiedzi klawiszowe — inne dla każdego widoku */
const HINTS = {
  instruktaz: "spacja — pauza · ←/→ — runda · R — restart",
  tablet: "Z — tracisz życie (z animacją) · 0–3 — skok do stanu · R — restart",
};

const STORAGE_KEY = "quizsteries-version";
const VIEW_STORAGE_KEY = "quizsteries-view";
const ANIM_STORAGE_KEY = "quizsteries-anim";

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
let currentViewId = DEFAULT_VIEW;
let currentVersionId = DEFAULT_VERSION;
let currentAnimId = DEFAULT_ANIM;

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

/* --- WERSJA 2: dwie kolumny po 16 pigułek, ładowane od dołu do góry.
   mode = "parallel"   → obie kolumny zapalają się równocześnie
   mode = "sequential" → najpierw cała lewa, potem cała prawa --- */
function buildV2(layer, mode) {
  const n = V2.count;
  const segs = [];

  V2.columns.forEach((col, c) => {
    for (let row = 0; row < n; row++) {
      // pozycja w kolejce zapalania wewnątrz kolumny (0 = zapala się pierwszy)
      const order = V2.fillFrom === "bottom" ? n - 1 - row : row;
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
      segs.push({ el, threshold });
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

/* Przycisk odpowiedzi (Quiz/button-types): kadr → skorupa → rdzeń.
   Kadr i skorupa są dla wszystkich takie same, kolorem różni się rdzeń. */
function makeAnswer(cfg) {
  const btn = document.createElement("div");
  btn.className = "qbtn";
  btn.dataset.answer = cfg.id;

  const shell = document.createElement("div");
  shell.className = "qbtn-shell";

  const core = document.createElement("div");
  core.className = "qbtn-core" + (cfg.ring ? " ring" : "");
  core.style.borderColor = cfg.border;
  core.style.backgroundImage =
    `linear-gradient(${cfg.angle}deg, ${cfg.from} ${cfg.fromAt}, ${cfg.to} ${cfg.toAt})`;

  shell.appendChild(core);
  btn.appendChild(shell);
  return btn;
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
  ANSWERS.forEach((cfg) => row.appendChild(makeAnswer(cfg)));
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
  textEl = null;

  viewEl.innerHTML = "";
  view.build(viewEl);

  applyNoLives();

  document.getElementById("view-select").value = view.id;
  document.getElementById("topbar-hint").textContent = HINTS[view.id];
  document.getElementById("ctrl-instruktaz").hidden = view.id !== "instruktaz";
  document.getElementById("ctrl-tablet").hidden = view.id !== "tablet";

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
  litElements.forEach(({ el }) => el.classList.remove("on"));
  state.phase = "running";
  state.phaseStart = performance.now();
  state.elapsedInPhase = 0;
  state.frozenAt = 0;
}

function setSegmentsProgress(progress) {
  litElements.forEach(({ el, threshold }) => {
    el.classList.toggle("on", progress >= threshold);
  });
}

function tick(now) {
  /* Rundy lecą tylko na instruktażu — tablet jest na razie statyczny */
  if (currentViewId === "instruktaz") {
    /* Instruktaż to ekran wspólny — utrata żyć przez gracza go nie zatrzymuje
       („Poczekaj do końca rundy”). Stoi tylko na pauzie: wejście w postój
       domyka licznik fazy, wyjście przesuwa start, więc czas postoju nie
       wlicza się do rundy. */
    const frozen = state.paused;
    if (frozen && !state.frozenAt) {
      state.elapsedInPhase += now - state.phaseStart;
      state.frozenAt = now;
    } else if (!frozen && state.frozenAt) {
      state.phaseStart = now;
      state.frozenAt = 0;
    }

    if (!frozen) {
      const elapsed = state.elapsedInPhase + (now - state.phaseStart);
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
  }

  requestAnimationFrame(tick);
}

/* --- Sterowanie testowe: spacja = pauza, ←/→ = rundy, 0–3 = życia,
       Z = zła odpowiedź, G = podgląd końca gry, R = restart,
       1/2/3 = wersja timera (na instruktażu).
       Rozliczaniem czasu pauzy zajmuje się tick(). --- */
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
      startRound(0);
      break;
    /* Cyfry: na instruktażu wersja timera, na tablecie liczba żyć */
    case "Digit0":
    case "Digit1":
    case "Digit2":
    case "Digit3": {
      const n = Number(e.code.slice(5));
      if (currentViewId === "tablet") {
        setLives(n);
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
setLifeAnim(initialChoice("anim", ANIM_STORAGE_KEY, LIFE_ANIMS.map((a) => a.id), DEFAULT_ANIM));
fitScene();
mountView(initialChoice("view", VIEW_STORAGE_KEY, VIEWS.map((v) => v.id), DEFAULT_VIEW));
requestAnimationFrame(tick);
