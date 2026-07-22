"use strict";

/* ============================================================
   KONFIGURACJA — wszystko edytowalne w jednym miejscu.
   UWAGA: wartości layoutu to FALLBACK ze specyfikacji.
   Figma (node 2193-8169 „instruktaz”) jest źródłem prawdy —
   po uzyskaniu dostępu do pliku przez MCP należy podmienić
   wymiary/pozycje/kolory na dokładne wartości z Dev Mode.
   ============================================================ */

/* --- Scena: stałe wymiary frame'a „instruktaz” z Figmy --- */
const SCENE = {
  width: 2880,
  height: 1800,
  cornerRadius: 96, // zaokrąglenie prostokąta tła
};

/* --- Ramka-timer: segmenty (pigułki) + narożniki ---
   Pigułka bazowa: 328 × 83, pełne zaokrąglenie (radius = 41.5).
   Geometria sceny (2880 szer.) wymusza orientację:
   - GÓRA / DÓŁ: 18 pigułek ustawionych PIONOWO (83 szer. × 328 wys.),
     bo 18 × 328 nie mieści się w 2880 px,
   - LEWO / PRAWO: 8 pigułek POZIOMO (328 szer. × 83 wys.).
   Grubość ramki jest wtedy spójna (~328 px) ze wszystkich stron.
   Dokładne x/y do zweryfikowania z Figmą. */
const FRAME = {
  padding: 40, // odstęp ramki od krawędzi sceny
  pill: { long: 328, short: 83, radius: 41.5 },
  corner: { w: 357, h: 363 },
  counts: { top: 18, bottom: 18, left: 8, right: 8 },
};

/* --- Narożnik: ścieżka SVG (placeholder — docelowo path z Figmy).
   viewBox 0 0 357 363, wariant „top-left”; pozostałe rogi przez lustrzane
   odbicia (transform w buildCorners). --- */
const CORNER_SVG_PATH = "M 357 0 H 190 A 190 190 0 0 0 0 190 V 363 H 357 Z";

/* --- Motywy: 5 zestawów kolorów.
   Motyw 0 („yellow”) = kolory z designu (fallback do potwierdzenia
   z tokenami Figmy). Motywy 1–4 to placeholdery (kopie yellow) —
   kolory zostaną dopisane później. --- */
const THEMES = [
  {
    name: "yellow",
    bg: "#f3e9d7", // beż tła
    segmentOff: "#e3d2a9", // żółty przygaszony
    segmentOn: "#ffc821", // żółty jasny
    corner: "#ffc821",
    text: "#2a2118", // ciemny tekst
  },
  { name: "theme-2 (placeholder)", bg: "#f3e9d7", segmentOff: "#e3d2a9", segmentOn: "#ffc821", corner: "#ffc821", text: "#2a2118" },
  { name: "theme-3 (placeholder)", bg: "#f3e9d7", segmentOff: "#e3d2a9", segmentOn: "#ffc821", corner: "#ffc821", text: "#2a2118" },
  { name: "theme-4 (placeholder)", bg: "#f3e9d7", segmentOff: "#e3d2a9", segmentOn: "#ffc821", corner: "#ffc821", text: "#2a2118" },
  { name: "theme-5 (placeholder)", bg: "#f3e9d7", segmentOff: "#e3d2a9", segmentOn: "#ffc821", corner: "#ffc821", text: "#2a2118" },
];

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
   LAYOUT — wyliczenie pozycji segmentów i narożników z configu.
   Zwraca listę elementów { x, y, w, h, kind, step }, gdzie `step`
   to indeks w kolejności zapalania po obwodzie:
   góra (L→P) → narożnik PG → prawo (G→D) → narożnik PD →
   dół (P→L) → narożnik LD → lewo (D→G) → narożnik LG.
   Narożniki zapalają się RAZEM z sąsiednim segmentem (ten sam step).
   ============================================================ */
function buildLayout() {
  const { padding, pill, corner, counts } = FRAME;
  const items = [];

  // Równomierne rozmieszczenie n elementów o rozmiarze `size`
  // na odcinku [start, start+span] (luz także przy końcach odcinka).
  function distribute(start, span, n, size) {
    const gap = (span - n * size) / (n + 1);
    const out = [];
    for (let i = 0; i < n; i++) out.push(start + gap + i * (size + gap));
    return out;
  }

  const innerXStart = padding + corner.w;
  const innerXSpan = SCENE.width - 2 * (padding + corner.w);
  const innerYStart = padding + corner.h;
  const innerYSpan = SCENE.height - 2 * (padding + corner.h);

  let step = 0;

  // GÓRA: pigułki pionowe, zapalanie od lewej do prawej
  const topXs = distribute(innerXStart, innerXSpan, counts.top, pill.short);
  topXs.forEach((x) => {
    items.push({ kind: "segment", x, y: padding, w: pill.short, h: pill.long, step: step++ });
  });

  // Narożnik PRAWY-GÓRNY — razem z ostatnim segmentem góry
  items.push({
    kind: "corner", variant: "tr",
    x: SCENE.width - padding - corner.w, y: padding,
    w: corner.w, h: corner.h, step: step - 1,
  });

  // PRAWO: pigułki poziome, zapalanie z góry na dół
  const rightYs = distribute(innerYStart, innerYSpan, counts.right, pill.short);
  rightYs.forEach((y) => {
    items.push({ kind: "segment", x: SCENE.width - padding - pill.long, y, w: pill.long, h: pill.short, step: step++ });
  });

  // Narożnik PRAWY-DOLNY — razem z ostatnim segmentem prawej kolumny
  items.push({
    kind: "corner", variant: "br",
    x: SCENE.width - padding - corner.w, y: SCENE.height - padding - corner.h,
    w: corner.w, h: corner.h, step: step - 1,
  });

  // DÓŁ: pigułki pionowe, zapalanie od prawej do lewej
  const bottomXs = distribute(innerXStart, innerXSpan, counts.bottom, pill.short).reverse();
  bottomXs.forEach((x) => {
    items.push({ kind: "segment", x, y: SCENE.height - padding - pill.long, w: pill.short, h: pill.long, step: step++ });
  });

  // Narożnik LEWY-DOLNY — razem z ostatnim segmentem dołu
  items.push({
    kind: "corner", variant: "bl",
    x: padding, y: SCENE.height - padding - corner.h,
    w: corner.w, h: corner.h, step: step - 1,
  });

  // LEWO: pigułki poziome, zapalanie z dołu do góry
  const leftYs = distribute(innerYStart, innerYSpan, counts.left, pill.short).reverse();
  leftYs.forEach((y) => {
    items.push({ kind: "segment", x: padding, y, w: pill.long, h: pill.short, step: step++ });
  });

  // Narożnik LEWY-GÓRNY — razem z ostatnim segmentem lewej kolumny
  items.push({
    kind: "corner", variant: "tl",
    x: padding, y: padding,
    w: corner.w, h: corner.h, step: step - 1,
  });

  return { items, totalSteps: step };
}

/* ============================================================
   RENDER — budowa DOM sceny (raz, przy starcie)
   ============================================================ */
const sceneEl = document.getElementById("scene");
const layout = buildLayout();
let litElements = []; // [{ el, step }] — do animacji

function buildScene() {
  sceneEl.style.width = SCENE.width + "px";
  sceneEl.style.height = SCENE.height + "px";

  // Tło
  const bg = document.createElement("div");
  bg.className = "scene-bg";
  bg.style.borderRadius = SCENE.cornerRadius + "px";
  sceneEl.appendChild(bg);

  // Lustrzane odbicia narożnika bazowego (wariant „tl”)
  const cornerTransforms = {
    tl: "",
    tr: "scaleX(-1)",
    bl: "scaleY(-1)",
    br: "scale(-1, -1)",
  };

  layout.items.forEach((item) => {
    let el;
    if (item.kind === "segment") {
      el = document.createElement("div");
      el.className = "segment";
      el.style.borderRadius = FRAME.pill.radius + "px";
    } else {
      el = document.createElement("div");
      el.className = "corner";
      el.innerHTML =
        `<svg viewBox="0 0 ${FRAME.corner.w} ${FRAME.corner.h}" ` +
        `style="transform:${cornerTransforms[item.variant]}" ` +
        `xmlns="http://www.w3.org/2000/svg"><path d="${CORNER_SVG_PATH}"/></svg>`;
    }
    el.style.left = item.x + "px";
    el.style.top = item.y + "px";
    el.style.width = item.w + "px";
    el.style.height = item.h + "px";
    sceneEl.appendChild(el);
    litElements.push({ el, step: item.step });
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
  root.setProperty("--segment-off", theme.segmentOff);
  root.setProperty("--segment-on", theme.segmentOn);
  root.setProperty("--corner", theme.corner);
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
  // Element ze `step` zapala się, gdy progress przekroczy jego próg
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
