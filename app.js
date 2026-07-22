"use strict";

/* ============================================================
   KONFIGURACJA — wszystko edytowalne w jednym miejscu.
   Layout i kolory: dokładne wartości z Figmy
   (plik z7iTUuRRDivpY8NcMXptdR, node 1-35 „instruktaz”).
   ============================================================ */

/* --- Scena: frame „instruktaz” --- */
const SCENE = { width: 2880, height: 1800 };

/* --- Centralny panel (Frame 32) --- */
const PANEL = { x: 455, y: 454, w: 1959, h: 883 };

/* --- Rzędy segmentów (QUIZ/button, baza 83×328 rysowana pionowo).
   Pozycje wizualne w px sceny, wprost z Figmy:
   - top:    Frame 184 @ (491,103), 18 szt., rozstaw 107.529 px
   - bottom: Frame 183 @ (479,1361), 18 szt., rozstaw 108 px
   - right:  8 instancji @ x2445, y od 481 co 108 (poziome, 328×83)
   - left:   Frame 185 @ (106,481), 8 szt. co 108 (wariant „plain”)
   Poziome segmenty to pionowa baza obrócona transformem (jak w Figmie). --- */
const ROWS = {
  top:    { count: 18, x0: 491,  y: 103,  pitch: 1828 / 17, orient: "v", variant: "shell", transform: "" },
  right:  { count: 8,  x: 2445,  y0: 481, pitch: 108,       orient: "h", variant: "shell", transform: "rotate(90deg) scaleY(-1)" },
  bottom: { count: 18, x0: 479,  y: 1361, pitch: 108,       orient: "v", variant: "shell", transform: "" },
  left:   { count: 8,  x: 106,   y0: 481, pitch: 108,       orient: "h", variant: "plain", transform: "rotate(90deg)" },
};

/* Rozmiar bazowej pigułki (pion) */
const PILL = { w: 83, h: 328 };

/* --- Narożniki: eksporty SVG (Group 42–45), pozycje z Figmy.
   To statyczny ornament ramki — w tym designie nie zapala się
   (kolory są wypalone w grafice SVG). --- */
const CORNERS = [
  { cls: "corner-tl", src: "assets/corner-tl.svg", x: 106,  y: 103,  transform: "scaleX(-1)" },
  { cls: "corner-tr", src: "assets/corner-tr.svg", x: 2416, y: 103,  transform: "" },
  { cls: "corner-bl", src: "assets/corner-bl.svg", x: 106,  y: 1333, transform: "rotate(180deg)" },
  { cls: "corner-br", src: "assets/corner-br.svg", x: 2416, y: 1327, transform: "scaleY(-1)" },
];

/* --- Motywy: 5 zestawów kolorów.
   Motyw 0 („yellow”) = tokeny z Figmy. Motywy 1–4 to placeholdery
   (kopie yellow) — kolory zostaną dopisane później.
   Uwaga: tło (PNG) i narożniki (SVG) mają kolory wypalone w assetach —
   motyw steruje segmentami, panelem i tekstem. --- */
const THEMES = [
  {
    name: "yellow",
    bg: "#100903",                      // tło sceny / letterbox
    panelBorder: "#5c500a",             // yellow/800
    segBorderOff: "#f6e472",            // yellow/400
    segLeftBorderOff: "#5c500a",        // yellow/800 (lewa kolumna)
    segGradFrom: "#141302",             // yellow/960
    segGradTo: "#76670c",               // yellow/700
    shellFrom: "rgba(6, 20, 26, 0.32)", // turquoise/925
    shellTo: "rgba(8, 70, 66, 0.32)",   // turquoise/700
    segOn: "#ceb935",                   // zapalony segment
    segOnBorder: "#f6e472",
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
   LAYOUT — segmenty w kolejności zapalania po obwodzie:
   góra (L→P) → prawo (G→D) → dół (P→L) → lewo (D→G).
   ============================================================ */
function buildSegments() {
  const segs = [];
  let step = 0;

  // GÓRA: od lewej do prawej
  for (let i = 0; i < ROWS.top.count; i++) {
    segs.push({ row: "top", x: ROWS.top.x0 + i * ROWS.top.pitch, y: ROWS.top.y, step: step++ });
  }
  // PRAWO: z góry na dół
  for (let i = 0; i < ROWS.right.count; i++) {
    segs.push({ row: "right", x: ROWS.right.x, y: ROWS.right.y0 + i * ROWS.right.pitch, step: step++ });
  }
  // DÓŁ: od prawej do lewej
  for (let i = ROWS.bottom.count - 1; i >= 0; i--) {
    segs.push({ row: "bottom", x: ROWS.bottom.x0 + i * ROWS.bottom.pitch, y: ROWS.bottom.y, step: step++ });
  }
  // LEWO: z dołu do góry
  for (let i = ROWS.left.count - 1; i >= 0; i--) {
    segs.push({ row: "left", x: ROWS.left.x, y: ROWS.left.y0 + i * ROWS.left.pitch, step: step++ });
  }

  return { segs, totalSteps: step };
}

/* ============================================================
   RENDER — budowa DOM sceny (raz, przy starcie)
   ============================================================ */
const sceneEl = document.getElementById("scene");
const layout = buildSegments();
let litElements = []; // [{ el, step }] — do animacji

function buildScene() {
  sceneEl.style.width = SCENE.width + "px";
  sceneEl.style.height = SCENE.height + "px";

  // Tło (ornamentowa ramka z Figmy)
  const bg = document.createElement("img");
  bg.className = "scene-bg";
  bg.src = "assets/bg-instruktaz.png";
  bg.alt = "";
  sceneEl.appendChild(bg);

  // Centralny panel z teksturą
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.style.left = PANEL.x + "px";
  panel.style.top = PANEL.y + "px";
  panel.style.width = PANEL.w + "px";
  panel.style.height = PANEL.h + "px";
  panel.innerHTML = '<img class="panel-texture" src="assets/panel-texture.png" alt="">';
  sceneEl.appendChild(panel);

  // Segmenty timera — baza pionowa 83×328; poziome przez transform.
  // Dla poziomych: box 328×83 uzyskujemy obracając bazę wokół środka,
  // stąd korekta pozycji o (328−83)/2 = 122.5 px.
  layout.segs.forEach((seg) => {
    const row = ROWS[seg.row];
    const el = document.createElement("div");
    el.className = "seg " + row.variant;
    el.style.width = PILL.w + "px";
    el.style.height = PILL.h + "px";
    if (row.orient === "v") {
      el.style.left = seg.x + "px";
      el.style.top = seg.y + "px";
    } else {
      el.style.left = seg.x + (PILL.h - PILL.w) / 2 + "px";
      el.style.top = seg.y - (PILL.h - PILL.w) / 2 + "px";
      el.style.transform = row.transform;
    }
    el.innerHTML = '<div class="seg-core"></div>';
    sceneEl.appendChild(el);
    litElements.push({ el, step: seg.step });
  });

  // Narożniki (statyczny ornament)
  CORNERS.forEach((c) => {
    const el = document.createElement("div");
    el.className = "corner " + c.cls;
    el.style.left = c.x + "px";
    el.style.top = c.y + "px";
    if (c.transform) el.style.transform = c.transform;
    el.innerHTML = `<img src="${c.src}" alt="">`;
    sceneEl.appendChild(el);
  });

  // Tekst zadania
  const text = document.createElement("div");
  text.className = "task-text";
  text.id = "task-text";
  sceneEl.appendChild(text);
}

/* --- Skalowanie sceny do okna (proporcje zachowane, wycentrowana) --- */
function fitScene() {
  const scale = Math.min(
    window.innerWidth / SCENE.width,
    window.innerHeight / SCENE.height
  );
  sceneEl.style.transform = `translate(-50%, -50%) scale(${scale})`;
}
window.addEventListener("resize", fitScene);

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
  root.setProperty("--text", theme.text);
}

/* ============================================================
   ROZGRYWKA + TIMER (requestAnimationFrame)
   Segmenty zapalają się kolejno po obwodzie; pełny obwód = koniec
   czasu rundy. Po rundzie pauza INTER_ROUND_PAUSE_MS i następna
   runda; po ostatniej — zapętlenie od pierwszej.
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
  document.getElementById("task-text").textContent = round.text;
  litElements.forEach(({ el }) => el.classList.remove("on"));
  state.phase = "running";
  state.phaseStart = performance.now();
  state.elapsedInPhase = 0;
}

function setSegmentsProgress(progress) {
  // Segment ze `step` zapala się, gdy progress przekroczy jego próg
  litElements.forEach(({ el, step }) => {
    el.classList.toggle("on", progress >= (step + 1) / layout.totalSteps);
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

/* --- Sterowanie testowe: spacja = pauza, ←/→ = rundy, R = restart --- */
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
  }
});

/* --- Start --- */
buildScene();
fitScene();
startRound(0);
requestAnimationFrame(tick);
