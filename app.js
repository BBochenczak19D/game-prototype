"use strict";

/* ============================================================
   KONFIGURACJA — wszystko edytowalne w jednym miejscu.
   Layout i kolory: dokładne wartości z Figmy (Dev Mode).
   ============================================================ */

/* --- Scena: frame „instruktaz” (obie wersje mają te same wymiary) --- */
const SCENE = { width: 2880, height: 1800 };

/* --- Baza segmentu (komponent QUIZ/button rysowany pionowo) --- */
const PILL = { w: 83, h: 328 };

/* ============================================================
   WERSJA 1 — timer jako ramka dookoła
   Figma: plik z7iTUuRRDivpY8NcMXptdR, node 1-35
   ============================================================ */
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

/* ============================================================
   WERSJA 2 — timer jako dwie pionowe kolumny (bez panelu i narożników)
   Figma: plik UCzHnyMnTZ2AS0PnYsw6eR, node 1823-2387
   Kolumny: Frame 161 (lewa, lustrzana) i Frame 162 (prawa),
   po 16 pigułek 328×83, rozstaw 103 px (83 + gap 20), start y=77.
   ============================================================ */
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

/* ============================================================
   WERSJE DO PORÓWNANIA (przełącznik w pasku nad sceną)
   ============================================================ */
const VERSIONS = [
  { id: "v1",  label: "V1 · ramka dookoła",      build: (layer) => buildV1(layer) },
  { id: "v2a", label: "V2 · kolumny równolegle", build: (layer) => buildV2(layer, "parallel") },
  { id: "v2b", label: "V2 · kolumny kolejno",    build: (layer) => buildV2(layer, "sequential") },
];
const DEFAULT_VERSION = "v1";
const STORAGE_KEY = "quizsteries-version";

/* ============================================================
   MOTYWY — 5 zestawów kolorów.
   Motyw 0 („yellow”) = tokeny z Figmy. Motywy 1–4 to placeholdery
   (kopie yellow) — kolory zostaną dopisane później.
   Uwaga: tło (PNG) i narożniki (SVG) mają kolory wypalone w assetach —
   motyw steruje segmentami, panelem i tekstem.
   ============================================================ */
const THEMES = [
  {
    name: "yellow",
    bg: "#100903",                      // tło sceny / letterbox
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
   BUDOWA ELEMENTÓW
   Każdy segment dostaje `threshold` — ułamek czasu rundy (0..1),
   po przekroczeniu którego się zapala. To jedyne, co odróżnia
   trzy wersje timera od siebie.
   ============================================================ */
const sceneEl = document.getElementById("scene");
const viewportEl = document.getElementById("viewport");
const layerEl = document.createElement("div"); // warstwa zależna od wersji
let textEl = null;
let litElements = []; // [{ el, threshold }]
let currentVersionId = DEFAULT_VERSION;

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

/* --- Scena: tło + warstwa wersji + tekst (tło i tekst są wspólne) --- */
function buildScene() {
  sceneEl.style.width = SCENE.width + "px";
  sceneEl.style.height = SCENE.height + "px";

  const bg = document.createElement("img");
  bg.className = "scene-bg";
  bg.src = "assets/bg-instruktaz.png";
  bg.alt = "";
  sceneEl.appendChild(bg);

  sceneEl.appendChild(layerEl);

  textEl = document.createElement("div");
  textEl.className = "task-text";
  sceneEl.appendChild(textEl);
}

/* --- Przełącznik wersji w pasku nad sceną --- */
function buildSwitch() {
  const box = document.getElementById("version-switch");
  VERSIONS.forEach((v) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = v.label;
    btn.dataset.version = v.id;
    btn.addEventListener("click", () => mountVersion(v.id));
    box.appendChild(btn);
  });
}

function mountVersion(id) {
  const version = VERSIONS.find((v) => v.id === id) || VERSIONS[0];
  currentVersionId = version.id;

  layerEl.innerHTML = "";
  litElements = version.build(layerEl);

  document.querySelectorAll("#version-switch button").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.version === version.id));
  });

  try {
    localStorage.setItem(STORAGE_KEY, version.id);
  } catch (e) {
    /* tryb prywatny — trudno, wersja po prostu się nie zapamięta */
  }

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
};

function startRound(index) {
  state.roundIndex = ((index % ROUNDS.length) + ROUNDS.length) % ROUNDS.length;
  const round = ROUNDS[state.roundIndex];
  applyTheme(THEMES[round.themeIndex]);
  textEl.textContent = round.text;
  litElements.forEach(({ el }) => el.classList.remove("on"));
  state.phase = "running";
  state.phaseStart = performance.now();
  state.elapsedInPhase = 0;
}

function setSegmentsProgress(progress) {
  litElements.forEach(({ el, threshold }) => {
    el.classList.toggle("on", progress >= threshold);
  });
}

function tick(now) {
  if (!state.paused) {
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
  requestAnimationFrame(tick);
}

/* --- Sterowanie testowe: spacja = pauza, ←/→ = rundy, R = restart,
       1/2/3 = wersja timera --- */
window.addEventListener("keydown", (e) => {
  switch (e.code) {
    case "Space":
      e.preventDefault();
      if (state.paused) {
        state.phaseStart = performance.now(); // wznowienie — nie liczymy czasu pauzy
      } else {
        state.elapsedInPhase += performance.now() - state.phaseStart;
      }
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
    case "KeyR":
      state.paused = false;
      startRound(0);
      break;
    case "Digit1":
    case "Digit2":
    case "Digit3": {
      const v = VERSIONS[Number(e.code.slice(5)) - 1];
      if (v) mountVersion(v.id);
      break;
    }
  }
});

/* --- Start ---
   Wersja startowa: parametr w adresie (np. ?v=v2a — wygodne do wysłania
   klientowi linku prosto do jednej wersji), potem ostatni wybór
   z localStorage, na końcu domyślna. */
function initialVersion() {
  const fromUrl = new URLSearchParams(location.search).get("v");
  if (VERSIONS.some((v) => v.id === fromUrl)) return fromUrl;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (VERSIONS.some((v) => v.id === saved)) return saved;
  } catch (e) {
    /* brak dostępu do localStorage — startujemy od wersji domyślnej */
  }
  return DEFAULT_VERSION;
}

buildScene();
buildSwitch();
fitScene();
mountVersion(initialVersion());
requestAnimationFrame(tick);
