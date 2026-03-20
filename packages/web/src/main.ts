type Vec2 = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };
type RouteName = "game" | "settings";
type ThemeName =
  | "dark"
  | "light"
  | "ocean"
  | "forest"
  | "volcano"
  | "purple"
  | "turquoise"
  | "orange"
  | "navy"
  | "army"
  | "air force";
type ThemeDef = {
  label: string;
  uiBg: string;
  uiPanel: string;
  uiPanelStrong: string;
  uiText: string;
  uiMuted: string;
  uiBorder: string;
  uiAccent: string;
  uiAccentText: string;
  uiShadow: string;
};
type InputState = {
  steer: number;
  throttle: number;
  brake: number;
  handbrake: boolean;
  reset: boolean;
  source: "keyboard" | "gamepad" | "mixed" | "idle";
};
type PerfStats = {
  fps: number;
  frameMs: number;
  inputMs: number;
  physicsMs: number;
  renderMs: number;
  resizeMs: number;
  uiUpdateMs: number;
  substeps: number;
  walls: number;
  ramps: number;
  checkpoints: number;
  speed: number;
  domWrites: number;
  benchmarkMode: boolean;
};

const themes: Record<ThemeName, ThemeDef> = {
  dark: {
    label: "Dark",
    uiBg: "#120f0c",
    uiPanel: "rgba(24, 19, 15, 0.76)",
    uiPanelStrong: "rgba(17, 14, 11, 0.88)",
    uiText: "#f4ead8",
    uiMuted: "#ccbda6",
    uiBorder: "rgba(244, 234, 216, 0.18)",
    uiAccent: "#c45433",
    uiAccentText: "#fff2e8",
    uiShadow: "rgba(0, 0, 0, 0.28)"
  },
  light: {
    label: "Light",
    uiBg: "#f4efe6",
    uiPanel: "rgba(255, 251, 244, 0.9)",
    uiPanelStrong: "rgba(255, 255, 255, 0.95)",
    uiText: "#2e271f",
    uiMuted: "#6d6357",
    uiBorder: "rgba(46, 39, 31, 0.12)",
    uiAccent: "#267cb3",
    uiAccentText: "#f7fcff",
    uiShadow: "rgba(67, 52, 36, 0.14)"
  },
  ocean: {
    label: "Ocean",
    uiBg: "#091b26",
    uiPanel: "rgba(11, 33, 47, 0.8)",
    uiPanelStrong: "rgba(7, 24, 35, 0.9)",
    uiText: "#dff5ff",
    uiMuted: "#91b7c9",
    uiBorder: "rgba(176, 228, 255, 0.22)",
    uiAccent: "#1da7c9",
    uiAccentText: "#effcff",
    uiShadow: "rgba(0, 0, 0, 0.32)"
  },
  forest: {
    label: "Forest",
    uiBg: "#101d14",
    uiPanel: "rgba(20, 42, 25, 0.8)",
    uiPanelStrong: "rgba(14, 30, 18, 0.9)",
    uiText: "#ebf7e9",
    uiMuted: "#9ab59b",
    uiBorder: "rgba(201, 236, 194, 0.2)",
    uiAccent: "#4eaa5f",
    uiAccentText: "#f5fff5",
    uiShadow: "rgba(0, 0, 0, 0.32)"
  },
  volcano: {
    label: "Volcano",
    uiBg: "#22100d",
    uiPanel: "rgba(50, 19, 16, 0.82)",
    uiPanelStrong: "rgba(34, 13, 11, 0.9)",
    uiText: "#ffe3d9",
    uiMuted: "#d4a497",
    uiBorder: "rgba(255, 191, 172, 0.2)",
    uiAccent: "#df5128",
    uiAccentText: "#fff4ef",
    uiShadow: "rgba(0, 0, 0, 0.34)"
  },
  purple: {
    label: "Purple",
    uiBg: "#1a1025",
    uiPanel: "rgba(39, 21, 59, 0.82)",
    uiPanelStrong: "rgba(26, 14, 39, 0.9)",
    uiText: "#f0e5ff",
    uiMuted: "#bca7d7",
    uiBorder: "rgba(225, 205, 255, 0.2)",
    uiAccent: "#9156ff",
    uiAccentText: "#f9f4ff",
    uiShadow: "rgba(0, 0, 0, 0.34)"
  },
  turquoise: {
    label: "Turquoise",
    uiBg: "#0e2020",
    uiPanel: "rgba(12, 45, 46, 0.82)",
    uiPanelStrong: "rgba(8, 31, 32, 0.9)",
    uiText: "#dffdfb",
    uiMuted: "#97cac5",
    uiBorder: "rgba(181, 255, 246, 0.2)",
    uiAccent: "#22b8b2",
    uiAccentText: "#efffff",
    uiShadow: "rgba(0, 0, 0, 0.32)"
  },
  orange: {
    label: "Orange",
    uiBg: "#26170d",
    uiPanel: "rgba(58, 31, 12, 0.82)",
    uiPanelStrong: "rgba(40, 22, 8, 0.9)",
    uiText: "#fff0dd",
    uiMuted: "#d6b48b",
    uiBorder: "rgba(255, 221, 173, 0.2)",
    uiAccent: "#ea8926",
    uiAccentText: "#fffaf1",
    uiShadow: "rgba(0, 0, 0, 0.34)"
  },
  navy: {
    label: "Navy",
    uiBg: "#0e1423",
    uiPanel: "rgba(18, 28, 52, 0.82)",
    uiPanelStrong: "rgba(12, 20, 38, 0.9)",
    uiText: "#e2ebff",
    uiMuted: "#97a8d1",
    uiBorder: "rgba(198, 214, 255, 0.2)",
    uiAccent: "#4d76d1",
    uiAccentText: "#f4f7ff",
    uiShadow: "rgba(0, 0, 0, 0.34)"
  },
  army: {
    label: "Army",
    uiBg: "#1b1c12",
    uiPanel: "rgba(45, 48, 26, 0.82)",
    uiPanelStrong: "rgba(30, 32, 17, 0.9)",
    uiText: "#eff1df",
    uiMuted: "#b0b59a",
    uiBorder: "rgba(230, 236, 194, 0.18)",
    uiAccent: "#8e9f4b",
    uiAccentText: "#fafdf1",
    uiShadow: "rgba(0, 0, 0, 0.34)"
  },
  "air force": {
    label: "Air Force",
    uiBg: "#111b24",
    uiPanel: "rgba(24, 42, 57, 0.82)",
    uiPanelStrong: "rgba(16, 29, 40, 0.9)",
    uiText: "#e4f2ff",
    uiMuted: "#9eb7c8",
    uiBorder: "rgba(202, 227, 247, 0.2)",
    uiAccent: "#5b97b8",
    uiAccentText: "#f6fbff",
    uiShadow: "rgba(0, 0, 0, 0.34)"
  }
};

const app = document.getElementById("app");
if (!app) throw new Error("#app not found");

document.title = "Asimov Mini Machines";
document.body.style.margin = "0";
document.body.style.fontFamily = "Georgia, serif";

const themeOptions = (Object.keys(themes) as ThemeName[]).map((name) => {
  const theme = themes[name];
  return `
    <button class="theme-option" data-theme="${name}" type="button" aria-label="Use ${theme.label} theme">
      <span class="theme-swatch" style="background:${theme.uiAccent}"></span>
      <span>${theme.label}</span>
    </button>
  `;
}).join("");

app.innerHTML = `
  <style>
    :root {
      --ui-bg: ${themes.dark.uiBg};
      --ui-panel: ${themes.dark.uiPanel};
      --ui-panel-strong: ${themes.dark.uiPanelStrong};
      --ui-text: ${themes.dark.uiText};
      --ui-muted: ${themes.dark.uiMuted};
      --ui-border: ${themes.dark.uiBorder};
      --ui-accent: ${themes.dark.uiAccent};
      --ui-accent-text: ${themes.dark.uiAccentText};
      --ui-shadow: ${themes.dark.uiShadow};
    }
    #shell {
      position: relative;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      color: var(--ui-text);
      background: var(--ui-bg);
    }
    #game {
      display: block;
      width: 100%;
      height: 100%;
    }
    #ui-layer {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .panel {
      pointer-events: auto;
      background: var(--ui-panel);
      color: var(--ui-text);
      border: 1px solid var(--ui-border);
      border-radius: 14px;
      box-shadow: 0 10px 30px var(--ui-shadow);
      backdrop-filter: blur(8px);
    }
    .panel-strong {
      background: var(--ui-panel-strong);
    }
    .nav {
      position: absolute;
      left: 16px;
      right: 16px;
      top: 16px;
      display: flex;
      justify-content: center;
      z-index: 3;
    }
    .nav-inner {
      display: inline-flex;
      gap: 8px;
      padding: 8px;
    }
    .nav-link,
    .theme-option {
      appearance: none;
      border: 1px solid var(--ui-border);
      background: transparent;
      color: var(--ui-text);
      text-decoration: none;
      border-radius: 10px;
      cursor: pointer;
      font: inherit;
      transition: background 120ms ease, border-color 120ms ease, transform 120ms ease;
    }
    .nav-link {
      padding: 10px 14px;
      font-size: 13px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .nav-link.active,
    .nav-link:hover,
    .theme-option.active,
    .theme-option:hover {
      background: var(--ui-accent);
      border-color: transparent;
      color: var(--ui-accent-text);
    }
    .hud {
      position: absolute;
      left: 16px;
      top: 88px;
      max-width: 320px;
      padding: 14px 16px;
      line-height: 1.35;
      z-index: 2;
    }
    .perf-panel {
      position: absolute;
      right: 16px;
      top: 88px;
      width: 290px;
      padding: 0;
      z-index: 2;
    }
    .perf-panel summary {
      cursor: pointer;
      list-style: none;
      padding: 12px 14px;
      font-size: 12px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      user-select: none;
      color: var(--ui-text);
    }
    .perf-panel summary::-webkit-details-marker {
      display: none;
    }
    .perf-body {
      padding: 0 14px 14px 14px;
      font-size: 13px;
      line-height: 1.45;
      color: var(--ui-text);
    }
    .settings {
      position: absolute;
      inset: 88px 16px 16px 16px;
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 4;
      pointer-events: none;
    }
    .settings.active {
      display: flex;
    }
    .settings-card {
      width: min(860px, 100%);
      max-height: 100%;
      overflow: auto;
      padding: 24px;
      pointer-events: auto;
    }
    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
      margin-top: 18px;
    }
    .theme-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      text-align: left;
      width: 100%;
    }
    .theme-swatch {
      width: 16px;
      height: 16px;
      border-radius: 999px;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.2);
      flex: 0 0 auto;
    }
    .muted {
      color: var(--ui-muted);
    }
    @media (max-width: 900px) {
      .nav {
        justify-content: flex-start;
      }
      .perf-panel {
        width: min(290px, calc(100vw - 32px));
      }
      .hud {
        max-width: min(320px, calc(100vw - 32px));
      }
      .settings {
        inset: 80px 12px 12px 12px;
      }
    }
  </style>
  <div id="shell">
    <canvas id="game"></canvas>
    <div id="ui-layer">
      <div class="nav">
        <div class="nav-inner panel panel-strong">
          <a id="nav-game" class="nav-link" href="#/">Drive</a>
          <a id="nav-settings" class="nav-link" href="#/settings">Settings</a>
        </div>
      </div>
      <div id="hud" class="panel hud"></div>
      <details id="perf-panel" class="panel panel-strong perf-panel" open>
        <summary>Performance Monitor</summary>
        <div id="perf-body" class="perf-body"></div>
      </details>
      <section id="settings-route" class="settings">
        <div class="settings-card panel panel-strong">
          <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase" class="muted">Settings</div>
          <div style="font-size:34px;margin:2px 0 8px 0">UI Theme</div>
          <div class="muted" style="font-size:15px;line-height:1.5">
            Themes apply to the interface only. The game rendering stays unchanged.
          </div>
          <div id="theme-grid" class="settings-grid">${themeOptions}</div>
        </div>
      </section>
    </div>
  </div>
`;

const canvasEl = document.getElementById("game");
const hudEl = document.getElementById("hud");
const perfBodyEl = document.getElementById("perf-body");
const perfPanelEl = document.getElementById("perf-panel");
const settingsRouteEl = document.getElementById("settings-route");
const navGameEl = document.getElementById("nav-game");
const navSettingsEl = document.getElementById("nav-settings");
const themeGridEl = document.getElementById("theme-grid");

if (
  !(canvasEl instanceof HTMLCanvasElement) ||
  !(hudEl instanceof HTMLDivElement) ||
  !(perfBodyEl instanceof HTMLDivElement) ||
  !(perfPanelEl instanceof HTMLDetailsElement) ||
  !(settingsRouteEl instanceof HTMLElement) ||
  !(navGameEl instanceof HTMLAnchorElement) ||
  !(navSettingsEl instanceof HTMLAnchorElement) ||
  !(themeGridEl instanceof HTMLDivElement)
) {
  throw new Error("UI not initialized");
}

const canvas: HTMLCanvasElement = canvasEl;
const hud: HTMLDivElement = hudEl;
const perfBody: HTMLDivElement = perfBodyEl;
const perfPanel: HTMLDetailsElement = perfPanelEl;
const settingsRoute: HTMLElement = settingsRouteEl;
const navGame: HTMLAnchorElement = navGameEl;
const navSettings: HTMLAnchorElement = navSettingsEl;
const themeGrid: HTMLDivElement = themeGridEl;

const glContext = canvas.getContext("webgl", { antialias: true });
if (!glContext) throw new Error("WebGL not available");
const gl: WebGLRenderingContext = glContext;

const themeStorageKey = "asimov-mini-machines-theme";
const searchParams = new URLSearchParams(window.location.search);
const benchmarkMode = searchParams.get("benchmark") === "1";
const showPerfInBenchmark = searchParams.get("perf") === "1";
const PERF_MONITOR_INTERVAL_MS = 1000;

function isThemeName(value: string): value is ThemeName {
  return Object.hasOwn(themes, value);
}

function loadTheme(): ThemeName {
  const stored = window.localStorage.getItem(themeStorageKey);
  return stored && isThemeName(stored) ? stored : "dark";
}

const uiState = {
  route: "game" as RouteName,
  theme: loadTheme(),
  benchmarkMode
};

function getRouteFromHash(hash: string): RouteName {
  return hash === "#/settings" ? "settings" : "game";
}

function setTheme(themeName: ThemeName): void {
  uiState.theme = themeName;
  const theme = themes[themeName];
  const root = document.documentElement.style;
  root.setProperty("--ui-bg", theme.uiBg);
  root.setProperty("--ui-panel", theme.uiPanel);
  root.setProperty("--ui-panel-strong", theme.uiPanelStrong);
  root.setProperty("--ui-text", theme.uiText);
  root.setProperty("--ui-muted", theme.uiMuted);
  root.setProperty("--ui-border", theme.uiBorder);
  root.setProperty("--ui-accent", theme.uiAccent);
  root.setProperty("--ui-accent-text", theme.uiAccentText);
  root.setProperty("--ui-shadow", theme.uiShadow);
  document.body.style.background = theme.uiBg;
  window.localStorage.setItem(themeStorageKey, themeName);

  const buttons = themeGrid.querySelectorAll<HTMLButtonElement>(".theme-option");
  for (const button of buttons) {
    button.classList.toggle("active", button.dataset.theme === themeName);
  }
}

function applyRoute(route: RouteName): void {
  uiState.route = route;
  const onSettings = route === "settings";
  settingsRoute.classList.toggle("active", onSettings);
  const hideHud = onSettings || uiState.benchmarkMode;
  const hidePerf = onSettings || (uiState.benchmarkMode && !showPerfInBenchmark);
  hud.style.display = hideHud ? "none" : "block";
  perfPanel.style.display = hidePerf ? "none" : "block";
  navGame.classList.toggle("active", route === "game");
  navSettings.classList.toggle("active", route === "settings");
}

window.addEventListener("hashchange", () => {
  applyRoute(getRouteFromHash(window.location.hash));
});

themeGrid.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const button = target.closest<HTMLButtonElement>(".theme-option");
  const themeName = button?.dataset.theme;
  if (!themeName || !isThemeName(themeName)) return;
  setTheme(themeName);
});

setTheme(uiState.theme);
applyRoute(getRouteFromHash(window.location.hash));

const vertexShaderSource = `
attribute vec2 aPosition;
uniform vec2 uResolution;
void main() {
  vec2 zeroToOne = aPosition / uResolution;
  vec2 zeroToTwo = zeroToOne * 2.0;
  vec2 clip = zeroToTwo - 1.0;
  gl_Position = vec4(clip * vec2(1.0, -1.0), 0.0, 1.0);
}
`;

const fragmentShaderSource = `
precision mediump float;
uniform vec4 uColor;
void main() {
  gl_FragColor = uColor;
}
`;

function createShader(type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Shader creation failed");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || "Shader compile failed");
  }
  return shader;
}

function createProgram(vertexSource: string, fragmentSource: string): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error("Program creation failed");
  gl.attachShader(program, createShader(gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || "Program link failed");
  }
  return program;
}

const program = createProgram(vertexShaderSource, fragmentShaderSource);
const positionLocation = gl.getAttribLocation(program, "aPosition");
const resolutionLocation = gl.getUniformLocation(program, "uResolution");
const colorLocation = gl.getUniformLocation(program, "uColor");
const buffer = gl.createBuffer();
if (!buffer || !resolutionLocation || !colorLocation) {
  throw new Error("WebGL setup failed");
}

const keyboard = new Set<string>();
window.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "KeyR"].includes(event.code)) {
    event.preventDefault();
  }
  keyboard.add(event.code);
});
window.addEventListener("keyup", (event) => keyboard.delete(event.code));

window.addEventListener("gamepadconnected", () => {
  hud.dataset.gamepad = "connected";
});

const world = {
  width: 62,
  height: 40,
  outerInset: 2.6,
  walls: [
    { x: 17, y: 7, w: 6, h: 8 },
    { x: 31, y: 24, w: 8, h: 5 },
    { x: 45, y: 10, w: 4, h: 12 },
    { x: 11, y: 26, w: 7, h: 4 }
  ] satisfies Rect[],
  ramps: [
    { x: 23, y: 16, w: 5.5, h: 2.2 },
    { x: 42, y: 30, w: 5, h: 2.5 }
  ] satisfies Rect[],
  checkpoints: [
    { x: 9, y: 8, w: 9, h: 2.2 },
    { x: 49, y: 8, w: 2.2, h: 10 },
    { x: 43, y: 32, w: 11, h: 2.2 },
    { x: 9, y: 24, w: 2.2, h: 10 }
  ] satisfies Rect[]
};

const spawn = { x: 8, y: 20, angle: 0 };

const car = {
  pos: { x: spawn.x, y: spawn.y },
  vel: { x: 0, y: 0 },
  angle: spawn.angle,
  steer: 0,
  radius: 1.05,
  width: 1.75,
  length: 2.9,
  hop: 0,
  respawnTimer: 0,
  lap: 0,
  checkpointIndex: 0
};

const camera = {
  x: car.pos.x,
  y: car.pos.y,
  zoom: 18
};
const perf = {
  frameMs: 0,
  inputMs: 0,
  physicsMs: 0,
  renderMs: 0,
  resizeMs: 0,
  uiUpdateMs: 0,
  fps: 0,
  alpha: 0.12
};
const PHYSICS_SUBSTEPS = 10;
let perfLastUpdatedAt = 0;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function vecLength(v: Vec2): number {
  return Math.hypot(v.x, v.y);
}

function normalize(v: Vec2): Vec2 {
  const len = vecLength(v) || 1;
  return { x: v.x / len, y: v.y / len };
}

function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

function inRect(point: Vec2, rect: Rect): boolean {
  return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}

function resetCar(): void {
  car.pos.x = spawn.x;
  car.pos.y = spawn.y;
  car.vel.x = 0;
  car.vel.y = 0;
  car.angle = spawn.angle;
  car.steer = 0;
  car.hop = 0;
  car.respawnTimer = 0;
}

function readInput(): InputState {
  const keySteer = (keyboard.has("ArrowRight") ? 1 : 0) - (keyboard.has("ArrowLeft") ? 1 : 0);
  const keyThrottle = keyboard.has("ArrowUp") ? 1 : 0;
  const keyBrake = keyboard.has("ArrowDown") ? 1 : 0;
  const keyHandbrake = keyboard.has("Space");
  const keyReset = keyboard.has("KeyR");

  let padSteer = 0;
  let padThrottle = 0;
  let padBrake = 0;
  let padHandbrake = false;
  let padReset = false;
  let activePads = 0;

  const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const gamepad of gamepads) {
    if (!gamepad) continue;
    activePads += 1;
    padSteer = Math.abs(gamepad.axes[0] ?? 0) > 0.12 ? clamp(gamepad.axes[0] ?? 0, -1, 1) : padSteer;
    const rt = gamepad.buttons[7]?.value ?? 0;
    const lt = gamepad.buttons[6]?.value ?? 0;
    const south = gamepad.buttons[0]?.pressed ? 1 : 0;
    const west = gamepad.buttons[2]?.pressed ? 1 : 0;
    padThrottle = Math.max(padThrottle, rt, south);
    padBrake = Math.max(padBrake, lt, west);
    padHandbrake = padHandbrake || !!gamepad.buttons[1]?.pressed || !!gamepad.buttons[5]?.pressed;
    padReset = padReset || !!gamepad.buttons[9]?.pressed;
  }

  const keyboardUsed = keySteer !== 0 || keyThrottle > 0 || keyBrake > 0 || keyHandbrake;
  const gamepadUsed = Math.abs(padSteer) > 0 || padThrottle > 0 || padBrake > 0 || padHandbrake;

  const source: InputState["source"] =
    keyboardUsed && gamepadUsed ? "mixed" : gamepadUsed ? "gamepad" : keyboardUsed ? "keyboard" : activePads > 0 ? "gamepad" : "idle";

  return {
    steer: clamp(Math.abs(padSteer) > Math.abs(keySteer) ? padSteer : keySteer, -1, 1),
    throttle: Math.max(keyThrottle, padThrottle),
    brake: Math.max(keyBrake, padBrake),
    handbrake: keyHandbrake || padHandbrake,
    reset: keyReset || padReset,
    source
  };
}

function updateCheckpointProgress(): void {
  const checkpoint = world.checkpoints[car.checkpointIndex];
  if (!checkpoint || !inRect(car.pos, checkpoint)) return;
  car.checkpointIndex += 1;
  if (car.checkpointIndex >= world.checkpoints.length) {
    car.checkpointIndex = 0;
    car.lap += 1;
  }
}

function resolveWorldCollisions(): void {
  const left = world.outerInset;
  const top = world.outerInset;
  const right = world.width - world.outerInset;
  const bottom = world.height - world.outerInset;

  if (car.pos.x - car.radius < left) {
    car.pos.x = left + car.radius;
    car.vel.x = Math.abs(car.vel.x) * 0.18;
  }
  if (car.pos.x + car.radius > right) {
    car.pos.x = right - car.radius;
    car.vel.x = -Math.abs(car.vel.x) * 0.18;
  }
  if (car.pos.y - car.radius < top) {
    car.pos.y = top + car.radius;
    car.vel.y = Math.abs(car.vel.y) * 0.18;
  }
  if (car.pos.y + car.radius > bottom) {
    car.pos.y = bottom - car.radius;
    car.vel.y = -Math.abs(car.vel.y) * 0.18;
  }

  for (const rect of world.walls) {
    const nearestX = clamp(car.pos.x, rect.x, rect.x + rect.w);
    const nearestY = clamp(car.pos.y, rect.y, rect.y + rect.h);
    const dx = car.pos.x - nearestX;
    const dy = car.pos.y - nearestY;
    const distSq = dx * dx + dy * dy;
    if (distSq >= car.radius * car.radius) continue;

    const dist = Math.sqrt(distSq) || 0.0001;
    const overlap = car.radius - dist;
    const normal = distSq === 0
      ? normalize({
          x: car.pos.x < rect.x + rect.w * 0.5 ? -1 : 1,
          y: car.pos.y < rect.y + rect.h * 0.5 ? -1 : 1
        })
      : { x: dx / dist, y: dy / dist };

    car.pos.x += normal.x * overlap;
    car.pos.y += normal.y * overlap;
    const vn = dot(car.vel, normal);
    if (vn < 0) {
      car.vel.x -= normal.x * vn * 1.15;
      car.vel.y -= normal.y * vn * 1.15;
    }
    car.vel.x *= 0.86;
    car.vel.y *= 0.86;
  }
}

function updatePhysics(dt: number, input: InputState): void {
  const substeps = PHYSICS_SUBSTEPS;
  const step = dt / substeps;
  const maxSpeed = 24;
  const engineAccel = 27;
  const reverseAccel = 12;
  const brakeForce = 22;
  const drag = 1.9;
  const lateralGrip = input.handbrake ? 3.2 : 8.7;
  const angularGrip = input.handbrake ? 1.9 : 4.6;

  if (input.reset) resetCar();

  for (let i = 0; i < substeps; i += 1) {
    const forward = { x: Math.cos(car.angle), y: Math.sin(car.angle) };
    const right = { x: -forward.y, y: forward.x };
    const forwardSpeed = dot(car.vel, forward);
    const lateralSpeed = dot(car.vel, right);

    car.steer = lerp(car.steer, input.steer, 0.22);

    let accel = 0;
    if (input.throttle > 0) accel += engineAccel * input.throttle;
    if (input.brake > 0) {
      accel -= forwardSpeed > 0 ? brakeForce * input.brake : reverseAccel * input.brake;
    }
    if (forwardSpeed > maxSpeed && accel > 0) accel *= 0.2;
    if (forwardSpeed < -maxSpeed * 0.4 && accel < 0) accel *= 0.1;

    car.vel.x += forward.x * accel * step;
    car.vel.y += forward.y * accel * step;

    const speed = vecLength(car.vel);
    const steerScale = clamp(speed / 7, 0.2, 1.2);
    const turnRate = car.steer * steerScale * 2.45 * Math.sign(forwardSpeed || 1);
    car.angle += turnRate * step;

    car.vel.x -= right.x * lateralSpeed * Math.min(1, lateralGrip * step);
    car.vel.y -= right.y * lateralSpeed * Math.min(1, lateralGrip * step);

    car.vel.x *= Math.max(0, 1 - drag * step);
    car.vel.y *= Math.max(0, 1 - drag * step);
    car.angle += lateralSpeed * 0.008 * angularGrip * step;

    car.pos.x += car.vel.x * step;
    car.pos.y += car.vel.y * step;

    for (const ramp of world.ramps) {
      if (inRect(car.pos, ramp) && car.hop <= 0.02) {
        car.hop = 0.32;
        const boost = 2.2;
        car.vel.x += forward.x * boost;
        car.vel.y += forward.y * boost;
      }
    }

    resolveWorldCollisions();
    updateCheckpointProgress();
  }

  car.hop = Math.max(0, car.hop - dt);
  if (vecLength(car.vel) < 0.08 && input.throttle === 0 && input.brake === 0) {
    car.vel.x = 0;
    car.vel.y = 0;
  }
}

function resize(): void {
  const dpr = window.devicePixelRatio || 1;
  const width = Math.floor(canvas.clientWidth * dpr);
  const height = Math.floor(canvas.clientHeight * dpr);
  if (canvas.width === width && canvas.height === height) return;
  canvas.width = width;
  canvas.height = height;
  gl.viewport(0, 0, width, height);
}

function worldToScreen(point: Vec2): Vec2 {
  const aspect = canvas.width / Math.max(1, canvas.height);
  const visibleHeight = camera.zoom;
  const visibleWidth = visibleHeight * aspect;
  return {
    x: ((point.x - (camera.x - visibleWidth / 2)) / visibleWidth) * canvas.width,
    y: ((point.y - (camera.y - visibleHeight / 2)) / visibleHeight) * canvas.height
  };
}

function drawTriangles(vertices: number[], color: [number, number, number, number]): void {
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
  gl.uniform4f(colorLocation, color[0], color[1], color[2], color[3]);
  gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
}

function rectVertices(x: number, y: number, w: number, h: number): number[] {
  return [x, y, x + w, y, x, y + h, x, y + h, x + w, y, x + w, y + h];
}

function drawWorldRect(rect: Rect, color: [number, number, number, number]): void {
  const p0 = worldToScreen({ x: rect.x, y: rect.y });
  const p1 = worldToScreen({ x: rect.x + rect.w, y: rect.y + rect.h });
  drawTriangles(rectVertices(p0.x, p0.y, p1.x - p0.x, p1.y - p0.y), color);
}

function drawRotatedRect(center: Vec2, w: number, h: number, angle: number, color: [number, number, number, number]): void {
  const hw = w / 2;
  const hh = h / 2;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const corners = [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh }
  ].map((corner) => ({
    x: center.x + corner.x * cos - corner.y * sin,
    y: center.y + corner.x * sin + corner.y * cos
  })).map(worldToScreen);

  const [c0, c1, c2, c3] = corners;
  if (!c0 || !c1 || !c2 || !c3) return;

  drawTriangles([
    c0.x, c0.y,
    c1.x, c1.y,
    c2.x, c2.y,
    c0.x, c0.y,
    c2.x, c2.y,
    c3.x, c3.y
  ], color);
}

function drawCircle(center: Vec2, radius: number, color: [number, number, number, number], segments = 24): void {
  const c = worldToScreen(center);
  const edge = worldToScreen({ x: center.x + radius, y: center.y });
  const screenRadius = Math.abs(edge.x - c.x);
  const vertices: number[] = [];
  for (let i = 0; i < segments; i += 1) {
    const a0 = (i / segments) * Math.PI * 2;
    const a1 = ((i + 1) / segments) * Math.PI * 2;
    vertices.push(
      c.x, c.y,
      c.x + Math.cos(a0) * screenRadius, c.y + Math.sin(a0) * screenRadius,
      c.x + Math.cos(a1) * screenRadius, c.y + Math.sin(a1) * screenRadius
    );
  }
  drawTriangles(vertices, color);
}

function renderGameHud(input: InputState): void {
  if (uiState.benchmarkMode || uiState.route !== "game") return;

  const speed = vecLength(car.vel);
  const connected = (navigator.getGamepads?.() ?? []).some(Boolean);
  hud.innerHTML = `
    <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:var(--ui-muted)">Asimov Mini Machines</div>
    <div style="font-size:30px;margin:2px 0 8px 0">Desk Rally</div>
    <div style="font-size:14px;opacity:0.92">
      Arrow keys steer and drive. Space handbrake. R reset.<br />
      Gamepad: left stick steer, triggers accelerate/brake.
    </div>
    <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--ui-border);font-size:14px">
      <div>Input: <strong>${input.source}</strong>${connected ? " / gamepad ready" : ""}</div>
      <div>Speed: <strong>${speed.toFixed(1)}</strong></div>
      <div>Laps: <strong>${car.lap}</strong></div>
      <div>Checkpoint: <strong>${car.checkpointIndex + 1}/${world.checkpoints.length}</strong></div>
      <div>Theme: <strong>${themes[uiState.theme].label}</strong></div>
    </div>
  `;
}

function renderScene(): void {
  gl.clearColor(0.11, 0.08, 0.06, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const lookAhead = normalize(car.vel);
  camera.x = lerp(camera.x, car.pos.x + lookAhead.x * 4, 0.08);
  camera.y = lerp(camera.y, car.pos.y + lookAhead.y * 3, 0.08);

  drawWorldRect({ x: 0, y: 0, w: world.width, h: world.height }, [0.28, 0.23, 0.17, 1]);
  drawWorldRect(
    {
      x: world.outerInset,
      y: world.outerInset,
      w: world.width - world.outerInset * 2,
      h: world.height - world.outerInset * 2
    },
    [0.75, 0.67, 0.47, 1]
  );

  for (const checkpoint of world.checkpoints) {
    drawWorldRect(checkpoint, [0.8, 0.27, 0.18, 0.18]);
  }
  for (const ramp of world.ramps) {
    drawWorldRect(ramp, [0.26, 0.49, 0.72, 0.9]);
  }
  for (const wall of world.walls) {
    drawWorldRect(wall, [0.31, 0.36, 0.4, 1]);
    drawWorldRect({ x: wall.x + 0.18, y: wall.y + 0.18, w: wall.w - 0.36, h: wall.h - 0.36 }, [0.42, 0.48, 0.53, 1]);
  }

  const hopLift = Math.sin((1 - car.hop / 0.32) * Math.PI) * 0.55;
  drawRotatedRect({ x: car.pos.x + 0.18, y: car.pos.y + 0.22 }, car.width * 1.05, car.length * 1.03, car.angle, [0, 0, 0, 0.26]);
  drawRotatedRect({ x: car.pos.x, y: car.pos.y - hopLift }, car.width, car.length, car.angle, [0.82, 0.16, 0.09, 1]);
  drawRotatedRect({ x: car.pos.x, y: car.pos.y - hopLift - 0.08 }, car.width * 0.7, car.length * 0.45, car.angle, [0.96, 0.79, 0.37, 1]);

  const nose = {
    x: car.pos.x + Math.cos(car.angle) * 1.15,
    y: car.pos.y + Math.sin(car.angle) * 1.15 - hopLift
  };
  drawCircle(nose, 0.28, [0.98, 0.92, 0.75, 1], 18);
}

function updatePerfStats(stats: PerfStats): void {
  if (uiState.route !== "game") return;
  if (uiState.benchmarkMode && !showPerfInBenchmark) return;

  perfBody.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr auto;gap:4px 10px">
      <div>FPS</div><div><strong>${stats.fps.toFixed(1)}</strong></div>
      <div>Frame</div><div><strong>${stats.frameMs.toFixed(2)} ms</strong></div>
      <div>Input CPU</div><div>${stats.inputMs.toFixed(3)} ms</div>
      <div>Physics CPU</div><div>${stats.physicsMs.toFixed(3)} ms</div>
      <div>Render CPU</div><div>${stats.renderMs.toFixed(3)} ms</div>
      <div>Resize CPU</div><div>${stats.resizeMs.toFixed(3)} ms</div>
      <div>UI Update CPU</div><div>${stats.uiUpdateMs.toFixed(3)} ms</div>
      <div>Substeps</div><div>${stats.substeps}</div>
      <div>Walls</div><div>${stats.walls}</div>
      <div>Ramps</div><div>${stats.ramps}</div>
      <div>Checkpoints</div><div>${stats.checkpoints}</div>
      <div>Speed</div><div>${stats.speed.toFixed(1)}</div>
      <div>DOM Writes</div><div>${stats.domWrites}</div>
      <div>Benchmark</div><div>${stats.benchmarkMode ? "on" : "off"}</div>
    </div>
    <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--ui-border);color:var(--ui-muted)">
      Track hotspots while optimizing in this order: frame budget, physics substeps, collision count, render cost, then input overhead.
    </div>
  `;
}

let lastTime = performance.now();
function frame(now: number): void {
  const frameDeltaMs = now - lastTime;
  let domWrites = 0;

  const resizeStart = performance.now();
  resize();
  const resizeMs = performance.now() - resizeStart;

  const dt = Math.min(0.033, frameDeltaMs / 1000);
  lastTime = now;

  const inputStart = performance.now();
  const input = readInput();
  const inputMs = performance.now() - inputStart;

  const physicsStart = performance.now();
  updatePhysics(dt, input);
  const physicsMs = performance.now() - physicsStart;

  const renderStart = performance.now();
  renderScene();
  const renderMs = performance.now() - renderStart;

  const uiStart = performance.now();
  if (!uiState.benchmarkMode && uiState.route === "game") {
    renderGameHud(input);
    domWrites += 1;
  }

  const alpha = perf.alpha;
  perf.resizeMs = lerp(perf.resizeMs, resizeMs, alpha);
  perf.inputMs = lerp(perf.inputMs, inputMs, alpha);
  perf.physicsMs = lerp(perf.physicsMs, physicsMs, alpha);
  perf.renderMs = lerp(perf.renderMs, renderMs, alpha);
  perf.frameMs = lerp(perf.frameMs, frameDeltaMs, alpha);
  perf.fps = perf.frameMs > 0 ? 1000 / perf.frameMs : 0;
  if (now - perfLastUpdatedAt >= PERF_MONITOR_INTERVAL_MS) {
    if (uiState.route === "game" && (!uiState.benchmarkMode || showPerfInBenchmark)) {
      updatePerfStats({
        fps: perf.fps,
        frameMs: perf.frameMs,
        inputMs: perf.inputMs,
        physicsMs: perf.physicsMs,
        renderMs: perf.renderMs,
        resizeMs: perf.resizeMs,
        uiUpdateMs: perf.uiUpdateMs,
        substeps: PHYSICS_SUBSTEPS,
        walls: world.walls.length,
        ramps: world.ramps.length,
        checkpoints: world.checkpoints.length,
        speed: vecLength(car.vel),
        domWrites: domWrites + 1,
        benchmarkMode: uiState.benchmarkMode
      });
      domWrites += 1;
    }
    perfLastUpdatedAt = now;
  }

  const uiUpdateMs = performance.now() - uiStart;
  perf.uiUpdateMs = lerp(perf.uiUpdateMs, uiUpdateMs, alpha);

  requestAnimationFrame(frame);
}

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(frame);
