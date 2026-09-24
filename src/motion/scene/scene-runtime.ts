import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  OrthographicCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from "three";
import { buildStarfield, STAR_COUNT, STAR_SEED } from "./starfield";

/** Handle returned by `mountScene`; `SceneStage` owns its lifecycle. */
export type SceneRuntime = {
  /** Pauses or resumes the render loop (also stops when off-screen or the tab is hidden). */
  sync(paused: boolean): void;
  dispose(): void;
};

export type SceneOptions = {
  seed?: number;
  count?: number;
  /** Scroll parallax travel as a fraction of the stage height (default 0.12). */
  parallax?: number;
};

const vertexShader = `
attribute float size;
attribute float tint;
uniform float time;
uniform float pixelRatio;
uniform float drift;
uniform float parallax;
varying float vDepth;
varying float vTint;
varying float vTwinkle;
void main() {
  vec3 p = position;
  float depth = p.z;
  p.x = fract(p.x + time * drift * (0.35 + depth * 0.65));
  p.y = fract(p.y + parallax * (0.2 + depth * 0.8));
  vec4 clip = vec4(p.x * 2.0 - 1.0, 1.0 - p.y * 2.0, 0.0, 1.0);
  gl_Position = clip;
  gl_PointSize = (1.4 + size * 1.6 * (0.6 + depth)) * pixelRatio;
  vDepth = depth;
  vTint = tint;
  vTwinkle = 0.75 + 0.25 * sin(time * (0.6 + size) + p.x * 40.0);
}
`;

const fragmentShader = `
uniform vec3 whiteColor;
uniform vec3 goldColor;
varying float vDepth;
varying float vTint;
varying float vTwinkle;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = dot(c, c);
  if (d > 0.25) discard;
  float alpha = smoothstep(0.25, 0.02, d) * (0.4 + vDepth * 0.6) * vTwinkle;
  vec3 color = mix(whiteColor, goldColor, vTint);
  gl_FragColor = vec4(color, alpha);
  #include <colorspace_fragment>
}
`;

function readColor(host: HTMLElement, token: string, fallback: string): Color {
  const value = getComputedStyle(host).getPropertyValue(token).trim();
  const probe = document.createElement("span");
  probe.style.color = value || fallback;
  host.append(probe);
  const rgb = getComputedStyle(probe).color;
  probe.remove();
  return new Color(rgb || fallback);
}

/**
 * Mounts the drifting starfield on `canvas` inside `host`: one `Points` draw call, additive
 * blending, adaptive device-pixel ratio (drops to 1 when frames are slow), paused when the
 * stage leaves the viewport or the document is hidden, and a subtle scroll parallax driven by
 * gsap ScrollTrigger. Throws when WebGL is unavailable so the caller keeps the static fallback.
 */
export function mountScene(
  host: HTMLElement,
  canvas: HTMLCanvasElement,
  options: SceneOptions = {},
): SceneRuntime {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "low-power" });
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const field = buildStarfield(options.count ?? STAR_COUNT, options.seed ?? STAR_SEED);
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(field.positions, 3));
  geometry.setAttribute("size", new BufferAttribute(field.sizes, 1));
  geometry.setAttribute("tint", new BufferAttribute(Float32Array.from(field.tints), 1));
  const uniforms = {
    time: { value: 0 },
    pixelRatio: { value: 1 },
    drift: { value: 0.004 },
    parallax: { value: 0 },
    whiteColor: { value: readColor(host, "--pv-white", "#ffffff") },
    goldColor: { value: readColor(host, "--pv-gold", "#ffd840") },
  };
  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
    uniforms,
  });
  scene.add(new Points(geometry, material));
  gsap.registerPlugin(ScrollTrigger);

  const parallaxRange = options.parallax ?? 0.12;
  let paused = false;
  let onScreen = true;
  let frame = 0;
  let lastTime = 0;
  let elapsed = 0;
  let pixelRatio = 0;
  let slowFrames = 0;
  let progress = 0;

  const resize = () => {
    const width = host.clientWidth || 1;
    const height = host.clientHeight || 1;
    const target = Math.min(window.devicePixelRatio || 1, slowFrames >= 30 ? 1 : 2);
    if (target !== pixelRatio) {
      pixelRatio = target;
      renderer.setPixelRatio(pixelRatio);
      uniforms.pixelRatio.value = pixelRatio;
    }
    renderer.setSize(width, height, false);
  };

  const render = () => {
    uniforms.time.value = elapsed;
    uniforms.parallax.value = progress * parallaxRange;
    renderer.render(scene, camera);
  };

  const tick = (now: number) => {
    const delta = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0;
    lastTime = now;
    elapsed += delta;
    if (delta > 0.034) slowFrames += 1;
    if (slowFrames === 30) resize();
    render();
    frame = requestAnimationFrame(tick);
  };

  const sync = () => {
    const active = !paused && onScreen && !document.hidden;
    if (active && !frame) frame = requestAnimationFrame(tick);
    if (!active && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
    }
  };

  const trigger = ScrollTrigger.create({
    trigger: host,
    start: "top top",
    end: "bottom top",
    onUpdate: (self) => {
      progress = self.progress;
    },
  });
  const observer = new IntersectionObserver(([entry]) => {
    onScreen = entry?.isIntersecting ?? true;
    host.dataset.sceneVisible = String(onScreen);
    sync();
  });
  observer.observe(canvas);
  const resizeObserver = new ResizeObserver(() => {
    resize();
    render();
  });
  resizeObserver.observe(host);
  document.addEventListener("visibilitychange", sync);

  resize();
  render();
  sync();

  return {
    sync(value) {
      paused = value;
      sync();
    },
    dispose() {
      cancelAnimationFrame(frame);
      frame = 0;
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", sync);
      trigger.kill();
      delete host.dataset.sceneVisible;
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
