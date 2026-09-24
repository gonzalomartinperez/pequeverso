import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { buildStarfield, STAR_SEED, starCountFor } from "./starfield";

/** Handle returned by `mountScene`; `useSceneRuntime` owns its lifecycle. */
export type SceneRuntime = {
  /** Pauses or resumes the render loop (it also stops off-screen or in a hidden tab). */
  sync(paused: boolean): void;
  dispose(): void;
};

export type SceneOptions = {
  seed?: number | undefined;
  /** Star count; defaults to the static tile's density over the stage area. */
  count?: number | undefined;
  /** Scroll parallax of the starfield as a fraction of the stage height (default 0.12). */
  parallax?: number | undefined;
};

/** Camera rest distance, field of view and scroll dolly (world units). */
const BASE_Z = 12;
const FOV = 45;
const DOLLY = 3.2;
const FAR_Z = -34;
const NEAR_Z = 3;
/** Orbit period of the gold star, equal to `--duration-orbit` (48 s) so the handoff is seamless. */
const ORBIT_SECONDS = 48;
const ORBIT_DOTS = 110;
const TRAIL = 18;
/** Device-pixel-ratio cap and share of stars drawn per quality level (0 best). */
const DPR_CAP = [2, 1.5, 1] as const;
const STAR_SHARE = [1, 0.75, 0.5] as const;

const TAN_HALF = Math.tan((FOV * Math.PI) / 360);

const starVertex = `
attribute float size;
attribute float tint;
uniform float time;
uniform float pixelRatio;
uniform float aspect;
uniform float scroll;
uniform float parallax;
varying float vDepth;
varying float vTint;
varying float vTwinkle;
void main() {
  float depth = position.z;
  float z = mix(${FAR_Z.toFixed(1)}, ${NEAR_Z.toFixed(1)}, depth);
  float rest = ${BASE_Z.toFixed(1)} - z;
  float halfH = rest * ${TAN_HALF.toFixed(5)} * 1.18;
  float x = fract(position.x + time * 0.0035 * (0.35 + depth * 0.65));
  float y = fract(position.y + scroll * parallax * (0.85 - depth * 0.55));
  vec4 view = viewMatrix * vec4((x - 0.5) * 2.0 * halfH * aspect, (0.5 - y) * 2.0 * halfH, z, 1.0);
  gl_Position = projectionMatrix * view;
  float perspective = rest / max(0.5, -view.z);
  gl_PointSize = min(7.0, (1.2 + size * 1.5 * (0.55 + depth)) * perspective) * pixelRatio;
  vDepth = depth;
  vTint = tint;
  vTwinkle = 0.72 + 0.28 * sin(time * (0.5 + size) + position.x * 40.0);
}
`;

const starFragment = `
uniform vec3 whiteColor;
uniform vec3 goldColor;
varying float vDepth;
varying float vTint;
varying float vTwinkle;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = dot(c, c);
  if (d > 0.25) discard;
  float alpha = smoothstep(0.25, 0.02, d) * (0.35 + vDepth * 0.6) * vTwinkle;
  gl_FragColor = vec4(mix(whiteColor, goldColor, vTint), alpha);
  #include <colorspace_fragment>
}
`;

const planetVertex = `
uniform float halo;
varying vec2 vPoint;
void main() {
  vPoint = position.xy * halo;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/* A lit sphere impostor: same light direction and three stops as the CSS planet gradients. */
const planetFragment = `
uniform vec3 hiColor;
uniform vec3 baseColor;
uniform vec3 loColor;
uniform float time;
uniform float bands;
varying vec2 vPoint;
void main() {
  float r = length(vPoint);
  if (r > 1.0) {
    float glow = exp(-(r - 1.0) * 7.0) * 0.32;
    gl_FragColor = vec4(baseColor, glow);
    #include <colorspace_fragment>
    return;
  }
  vec3 n = vec3(vPoint, sqrt(1.0 - r * r));
  float light = clamp(dot(n, normalize(vec3(-0.5, 0.55, 0.68))), 0.0, 1.0);
  vec3 color = mix(loColor, baseColor, smoothstep(0.05, 0.62, light));
  color = mix(color, hiColor, smoothstep(0.62, 1.0, light));
  float band = sin(vPoint.y * 11.0 + sin(vPoint.x * 2.3 + time * 0.12) * 0.7);
  color *= 1.0 - bands * (0.5 + 0.5 * band);
  color += hiColor * pow(1.0 - n.z, 3.0) * 0.28;
  float edge = smoothstep(1.0, 0.975, r);
  gl_FragColor = vec4(color, edge);
  #include <colorspace_fragment>
}
`;

const orbitVertex = `
attribute float angle;
attribute float kind;
uniform vec3 center;
uniform vec2 radii;
uniform float tilt;
uniform float rotation;
uniform float phase;
uniform float starSize;
uniform float rest;
uniform float pixelRatio;
varying float vKind;
varying float vFade;
void main() {
  float a = kind < 0.5 ? angle : phase + angle;
  vec2 e = vec2(radii.x * cos(a), radii.y * sin(a));
  float c = cos(rotation);
  float s = sin(rotation);
  vec3 world = center + vec3(c * e.x - s * e.y, s * e.x + c * e.y, -tilt * sin(a));
  vec4 view = viewMatrix * vec4(world, 1.0);
  gl_Position = projectionMatrix * view;
  float perspective = rest / max(0.5, -view.z);
  vFade = kind > 0.5 && kind < 1.5 ? 1.0 - angle / ${(TRAIL * 0.02).toFixed(3)} : 1.0;
  float size = kind < 0.5 ? 2.8 : kind < 1.5 ? starSize * 0.3 * vFade : starSize;
  gl_PointSize = size * perspective * pixelRatio;
  vKind = kind;
}
`;

/* Dots of the dashed ellipse, a fading gold trail, and the brand's five-point star with its glow. */
const orbitFragment = `
uniform vec3 whiteColor;
uniform vec3 goldColor;
varying float vKind;
varying float vFade;
float star5(vec2 p, float r, float rf) {
  const vec2 k1 = vec2(0.809016994375, -0.587785252292);
  const vec2 k2 = vec2(-k1.x, k1.y);
  p.x = abs(p.x);
  p -= 2.0 * max(dot(k1, p), 0.0) * k1;
  p -= 2.0 * max(dot(k2, p), 0.0) * k2;
  p.x = abs(p.x);
  p.y -= r;
  vec2 ba = rf * vec2(-k1.y, k1.x) - vec2(0.0, 1.0);
  float h = clamp(dot(p, ba) / dot(ba, ba), 0.0, r);
  return length(p - ba * h) * sign(p.y * ba.x - p.x * ba.y);
}
void main() {
  vec2 p = (gl_PointCoord - 0.5) * vec2(2.0, -2.0);
  float d = length(p);
  if (vKind < 0.5) {
    if (d > 1.0) discard;
    gl_FragColor = vec4(whiteColor, smoothstep(1.0, 0.2, d) * 0.34);
  } else if (vKind < 1.5) {
    if (d > 1.0) discard;
    gl_FragColor = vec4(goldColor, smoothstep(1.0, 0.0, d) * 0.5 * vFade);
  } else {
    float body = smoothstep(0.03, -0.03, star5(p, 0.5, 0.42));
    float glow = exp(-d * 3.2) * 0.55;
    gl_FragColor = vec4(goldColor, clamp(body + glow, 0.0, 1.0));
  }
  #include <colorspace_fragment>
}
`;

const paint = document.createElement("canvas").getContext("2d", { willReadFrequently: true });

/** Resolves a CSS colour token (any syntax, OKLCH included) to a three.js colour. */
function tokenColor(host: HTMLElement, token: string, fallback: string): Color {
  const value = getComputedStyle(host).getPropertyValue(token).trim() || fallback;
  const color = new Color(fallback);
  if (!paint) return color;
  paint.clearRect(0, 0, 1, 1);
  paint.fillStyle = fallback;
  paint.fillStyle = value;
  paint.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0] = paint.getImageData(0, 0, 1, 1).data;
  return color.setRGB(r / 255, g / 255, b / 255, SRGBColorSpace);
}

type Planet = {
  element: HTMLElement;
  mesh: Mesh<PlaneGeometry, ShaderMaterial>;
  z: number;
  base: Vector3;
  lift: number;
  time: { value: number };
};

const HALO = 1.3;
const round = (value: number) => Math.round(value * 10000) / 10000;

/**
 * Mounts the "pequeño universo" on `canvas` inside the scene stage `host`: a layered starfield
 * with depth, the soft planets and the gold star on its orbit, each placed exactly where the
 * server-rendered static layers (`[data-scene-planet]`, `[data-scene-orbit]`) sit, so the
 * crossfade is seamless. One scroll progress (a scrubbed gsap ScrollTrigger) drives a gentle
 * dolly; fine pointers add parallax through gsap.quickTo; the loop runs on gsap's ticker. Adaptive quality lowers the
 * pixel ratio and star count on slow frames; the loop stops off-screen and in hidden tabs.
 * Throws when WebGL is unavailable so the caller keeps the static fallback.
 */
export function mountScene(
  host: HTMLElement,
  canvas: HTMLCanvasElement,
  options: SceneOptions = {},
): SceneRuntime {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "low-power" });
  renderer.setClearColor(0x000000, 0);
  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 80);
  camera.position.set(0, 0, BASE_Z);
  const white = tokenColor(host, "--pv-white", "#ffffff");
  const gold = tokenColor(host, "--pv-gold", "#ffd840");

  const starCount = options.count ?? starCountFor(host.clientWidth, host.clientHeight);
  const field = buildStarfield(starCount, options.seed ?? STAR_SEED);
  const starGeometry = new BufferGeometry();
  starGeometry.setAttribute("position", new BufferAttribute(field.positions, 3));
  starGeometry.setAttribute("size", new BufferAttribute(field.sizes, 1));
  starGeometry.setAttribute("tint", new BufferAttribute(Float32Array.from(field.tints), 1));
  const starUniforms = {
    time: { value: 0 },
    pixelRatio: { value: 1 },
    aspect: { value: 1 },
    scroll: { value: 0 },
    parallax: { value: options.parallax ?? 0.12 },
    whiteColor: { value: white },
    goldColor: { value: gold },
  };
  const starMaterial = new ShaderMaterial({
    vertexShader: starVertex,
    fragmentShader: starFragment,
    uniforms: starUniforms,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
  });
  const stars = new Points(starGeometry, starMaterial);
  stars.frustumCulled = false;
  scene.add(stars);

  const quad = new PlaneGeometry(2, 2);
  const planets: Planet[] = [...host.querySelectorAll<HTMLElement>("[data-scene-planet]")].map((element) => {
    const name = element.dataset.scenePlanet ?? "teal";
    const planetTime = { value: 0 };
    const material = new ShaderMaterial({
      vertexShader: planetVertex,
      fragmentShader: planetFragment,
      uniforms: {
        halo: { value: HALO },
        time: planetTime,
        bands: { value: Number(element.dataset.sceneBands ?? 0.05) },
        hiColor: { value: tokenColor(host, `--pv-planet-${name}-hi`, "#ffffff") },
        baseColor: { value: tokenColor(host, `--pv-${name}`, "#007d79") },
        loColor: { value: tokenColor(host, `--pv-planet-${name}-lo`, "#00234e") },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
    const mesh = new Mesh(quad, material);
    const z = Number(element.dataset.sceneDepth ?? 0);
    mesh.renderOrder = Math.round(z * 10);
    scene.add(mesh);
    return {
      element,
      mesh,
      z,
      base: new Vector3(),
      lift: Number(element.dataset.sceneLift ?? 0),
      time: planetTime,
    };
  });

  const orbitElement = host.querySelector<SVGSVGElement>("[data-scene-orbit]");
  const orbitGeometry = new BufferGeometry();
  const angles = new Float32Array(ORBIT_DOTS + TRAIL + 1);
  const kinds = new Float32Array(ORBIT_DOTS + TRAIL + 1);
  for (let index = 0; index < ORBIT_DOTS; index += 1) angles[index] = (index / ORBIT_DOTS) * Math.PI * 2;
  for (let index = 0; index < TRAIL; index += 1) {
    angles[ORBIT_DOTS + index] = (index + 1) * 0.02;
    kinds[ORBIT_DOTS + index] = 1;
  }
  kinds[ORBIT_DOTS + TRAIL] = 2;
  orbitGeometry.setAttribute("position", new BufferAttribute(new Float32Array(angles.length * 3), 3));
  orbitGeometry.setAttribute("angle", new BufferAttribute(angles, 1));
  orbitGeometry.setAttribute("kind", new BufferAttribute(kinds, 1));
  const orbitUniforms = {
    center: { value: new Vector3() },
    radii: { value: new Vector2(1, 0.4) },
    tilt: { value: 1.6 },
    rotation: { value: (12 * Math.PI) / 180 },
    phase: { value: 0 },
    starSize: { value: 36 },
    rest: { value: BASE_Z },
    pixelRatio: { value: 1 },
    whiteColor: { value: white },
    goldColor: { value: gold },
  };
  const orbitMaterial = new ShaderMaterial({
    vertexShader: orbitVertex,
    fragmentShader: orbitFragment,
    uniforms: orbitUniforms,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
  });
  const orbit = new Points(orbitGeometry, orbitMaterial);
  orbit.frustumCulled = false;
  orbit.renderOrder = 100;
  if (orbitElement) scene.add(orbit);

  gsap.registerPlugin(ScrollTrigger);
  const finePointer = matchMedia("(pointer: fine)");
  let paused = false;
  let onScreen = true;
  let running = false;
  let elapsed = 0;
  let width = 0;
  let height = 0;
  let quality = 0;
  let pixelRatio = 0;
  let sampleTime = 0;
  let sampleFrames = 0;
  let slowWindows = 0;
  let fastWindows = 0;
  let orbitPhase = 0;
  /** Smoothed state written by gsap: `progress` by a scrubbed ScrollTrigger, `x`/`y` by quickTo. */
  const state = { progress: 0, x: 0, y: 0 };
  const applied = new Vector3(Number.NaN, 0, 0);

  /** World size of one CSS pixel at depth `z` (camera at rest). */
  const unitAt = (z: number) => (2 * (BASE_Z - z) * TAN_HALF) / height;

  const layout = () => {
    const box = host.getBoundingClientRect();
    for (const planet of planets) {
      const rect = planet.element.getBoundingClientRect();
      const unit = unitAt(planet.z);
      const radius = (rect.width / 2) * unit;
      planet.base.set(
        (rect.left + rect.width / 2 - box.left - width / 2) * unit,
        (height / 2 - (rect.top + rect.height / 2 - box.top)) * unit,
        planet.z,
      );
      planet.mesh.scale.setScalar(radius * HALO);
      planet.mesh.position.copy(planet.base);
    }
    if (orbitElement) {
      const rect = orbitElement.getBoundingClientRect();
      const scale = rect.width / 400;
      const unit = unitAt(0);
      orbitUniforms.center.value.set(
        (rect.left + rect.width / 2 - box.left - width / 2) * unit,
        (height / 2 - (rect.top + rect.width / 2 - box.top)) * unit,
        0,
      );
      orbitUniforms.radii.value.set(190 * scale * unit, 72 * scale * unit);
      orbitUniforms.tilt.value = 72 * scale * unit * 1.4;
      orbitUniforms.starSize.value = 36 * scale;
    }
  };

  /** Starts the WebGL star where the CSS traveller currently is. */
  const syncOrbitPhase = () => {
    const traveller = orbitElement?.querySelector<SVGGraphicsElement>(".pv-orbit-traveller");
    if (!orbitElement || !traveller) return;
    const box = orbitElement.getBoundingClientRect();
    const star = traveller.getBoundingClientRect();
    const scale = box.width / 400;
    const dx = star.left + star.width / 2 - (box.left + box.width / 2);
    const dy = star.top + star.height / 2 - (box.top + box.width / 2);
    const turn = (12 * Math.PI) / 180;
    const x = dx * Math.cos(turn) - dy * Math.sin(turn);
    const y = dx * Math.sin(turn) + dy * Math.cos(turn);
    orbitPhase = Math.atan2(-y / (72 * scale), x / (190 * scale));
  };

  const applyQuality = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, DPR_CAP[quality] ?? 1);
    if (ratio !== pixelRatio) {
      pixelRatio = ratio;
      renderer.setPixelRatio(ratio);
      renderer.setSize(width, height, false);
      starUniforms.pixelRatio.value = ratio;
      orbitUniforms.pixelRatio.value = ratio;
    }
    starGeometry.setDrawRange(0, Math.round(field.count * (STAR_SHARE[quality] ?? 1)));
    host.dataset.sceneQuality = String(quality);
  };

  const resize = () => {
    const nextWidth = Math.max(1, host.clientWidth);
    const nextHeight = Math.max(1, host.clientHeight);
    if (nextWidth !== width || nextHeight !== height) {
      width = nextWidth;
      height = nextHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      starUniforms.aspect.value = camera.aspect;
    }
    applyQuality();
    layout();
    applied.x = Number.NaN;
  };

  const measureQuality = (delta: number) => {
    sampleTime += delta;
    sampleFrames += 1;
    if (sampleTime < 3) return;
    const averageMs = (sampleTime * 1000) / sampleFrames;
    slowWindows = averageMs > 24 ? slowWindows + 1 : 0;
    fastWindows = averageMs < 18 ? fastWindows + 1 : 0;
    const next =
      slowWindows >= 2 ? Math.min(2, quality + 1) : fastWindows >= 5 ? Math.max(0, quality - 1) : quality;
    if (next !== quality) {
      quality = next;
      slowWindows = 0;
      fastWindows = 0;
      applyQuality();
    }
    sampleTime = 0;
    sampleFrames = 0;
  };

  /** Applies scroll and pointer state; camera and planets are written only when they change. */
  const place = () => {
    const progress = state.progress;
    const x = round(state.x * 0.55);
    const y = round(-state.y * 0.35);
    const z = round(BASE_Z - progress * DOLLY);
    if (x === applied.x && y === applied.y && z === applied.z) return;
    applied.set(x, y, z);
    camera.position.set(x, y, z);
    starUniforms.scroll.value = progress;
    for (const planet of planets) {
      planet.mesh.position.set(planet.base.x, planet.base.y + progress * planet.lift, planet.base.z);
    }
  };

  const render = () => {
    starUniforms.time.value = elapsed;
    orbitUniforms.phase.value = orbitPhase - (elapsed / ORBIT_SECONDS) * Math.PI * 2 - state.progress * 0.9;
    for (const planet of planets) planet.time.value = elapsed;
    place();
    renderer.render(scene, camera);
  };

  /** Runs on gsap's ticker (one rAF for every gsap animation on the page); `deltaTime` in ms. */
  const tick = (_time: number, deltaTime: number) => {
    const raw = deltaTime / 1000;
    elapsed += Math.min(raw, 0.05);
    render();
    if (raw > 0) measureQuality(Math.min(raw, 0.25));
  };

  const sync = () => {
    const active = !paused && onScreen && !document.hidden;
    if (active && !running) gsap.ticker.add(tick);
    if (!active && running) {
      gsap.ticker.remove(tick);
      sampleTime = 0;
      sampleFrames = 0;
    }
    running = active;
  };

  const toX = gsap.quickTo(state, "x", { duration: 0.9, ease: "power3.out" });
  const toY = gsap.quickTo(state, "y", { duration: 0.9, ease: "power3.out" });

  const onPointer = (event: PointerEvent) => {
    if (event.pointerType !== "mouse" || !finePointer.matches) return;
    const box = host.getBoundingClientRect();
    if (event.clientY > box.bottom) return;
    toX(Math.max(-1, Math.min(1, ((event.clientX - box.left) / box.width) * 2 - 1)));
    toY(Math.max(-1, Math.min(1, ((event.clientY - box.top) / box.height) * 2 - 1)));
  };
  const onLeave = () => {
    toX(0);
    toY(0);
  };

  /** The single scroll authority: the hero's scroll-out, smoothed by a 0.8 s scrub. */
  const scroll = gsap.to(state, {
    progress: 1,
    ease: "none",
    scrollTrigger: { trigger: host, start: "top top", end: "bottom top", scrub: 0.8 },
  });
  const observer = new IntersectionObserver(([entry]) => {
    onScreen = entry?.isIntersecting ?? true;
    host.dataset.sceneVisible = String(onScreen);
    sync();
  });
  observer.observe(host);
  const resizeObserver = new ResizeObserver(() => {
    resize();
    render();
  });
  resizeObserver.observe(host);
  document.addEventListener("visibilitychange", sync);
  window.addEventListener("pointermove", onPointer, { passive: true });
  document.documentElement.addEventListener("pointerleave", onLeave);

  syncOrbitPhase();
  resize();
  render();
  sync();

  return {
    sync(value) {
      paused = value;
      sync();
      if (paused) render();
    },
    dispose() {
      gsap.ticker.remove(tick);
      running = false;
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pointermove", onPointer);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      scroll.scrollTrigger?.kill();
      scroll.kill();
      gsap.killTweensOf(state);
      delete host.dataset.sceneVisible;
      delete host.dataset.sceneQuality;
      starGeometry.dispose();
      starMaterial.dispose();
      quad.dispose();
      for (const planet of planets) planet.mesh.material.dispose();
      orbitGeometry.dispose();
      orbitMaterial.dispose();
      renderer.dispose();
    },
  };
}
