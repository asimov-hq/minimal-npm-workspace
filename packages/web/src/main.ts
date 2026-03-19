type Vec2 = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };
type InputState = {
  steer: number;
  throttle: number;
  brake: number;
  handbrake: boolean;
  reset: boolean;
  source: "keyboard" | "gamepad" | "mixed" | "idle";
};

const app = document.getElementById("app");
if (!app) throw new Error("#app not found");

document.title = "Asimov Mini Machines";
document.body.style.margin = "0";
document.body.style.background = "#1c140f";
document.body.style.color = "#f8ecd7";
document.body.style.fontFamily = "Georgia, serif";

app.innerHTML = `
  <div style="position:relative;width:100vw;height:100vh;overflow:hidden;background:
    radial-gradient(circle at top, #5a7c67 0%, #31473b 35%, #1c140f 100%);">
    <canvas id="game" style="display:block;width:100%;height:100%"></canvas>
    <div id="hud" style="
      position:absolute;left:16px;top:16px;max-width:320px;
      background:rgba(22,17,13,0.72);backdrop-filter:blur(8px);
      border:1px solid rgba(248,236,215,0.18);border-radius:14px;
      padding:14px 16px;line-height:1.35;box-shadow:0 10px 30px rgba(0,0,0,0.25);
    "></div>
  </div>
`;

const canvasEl = document.getElementById("game");
const hudEl = document.getElementById("hud");
if (!(canvasEl instanceof HTMLCanvasElement) || !(hudEl instanceof HTMLDivElement)) {
  throw new Error("UI not initialized");
}
const canvas: HTMLCanvasElement = canvasEl;
const hud: HTMLDivElement = hudEl;

const glContext = canvas.getContext("webgl", { antialias: true });
if (!glContext) throw new Error("WebGL not available");
const gl: WebGLRenderingContext = glContext;

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
  const substeps = 10;
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

function render(input: InputState): void {
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

  const speed = vecLength(car.vel);
  const connected = (navigator.getGamepads?.() ?? []).some(Boolean);
  hud.innerHTML = `
    <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.75">Asimov Mini Machines</div>
    <div style="font-size:30px;margin:2px 0 8px 0">Desk Rally</div>
    <div style="font-size:14px;opacity:0.92">
      Arrow keys steer and drive. Space handbrake. R reset.<br />
      Gamepad: left stick steer, triggers accelerate/brake.
    </div>
    <div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(248,236,215,0.12);font-size:14px">
      <div>Input: <strong>${input.source}</strong>${connected ? " / gamepad ready" : ""}</div>
      <div>Speed: <strong>${speed.toFixed(1)}</strong></div>
      <div>Laps: <strong>${car.lap}</strong></div>
      <div>Checkpoint: <strong>${car.checkpointIndex + 1}/${world.checkpoints.length}</strong></div>
      <div>Grip: <strong>${input.handbrake ? "slide" : "planted"}</strong></div>
    </div>
  `;
}

let lastTime = performance.now();
function frame(now: number): void {
  resize();
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;
  const input = readInput();
  updatePhysics(dt, input);
  render(input);
  requestAnimationFrame(frame);
}

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(frame);
