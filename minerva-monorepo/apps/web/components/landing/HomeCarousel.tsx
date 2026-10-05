"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type Lenis from "lenis";
import gsap from "gsap";
import {
  ICON_PERSPECTIVES,
  type IconPerspective,
  type WorkItem,
} from "@/lib/landing/works";
import { scrambleText } from "./scramble";

export interface HomeCarouselHandle {
  attachScroll: (lenis: Lenis) => void;
  intro: () => void;
  dispose: () => void;
}

interface HomeCarouselProps {
  works: WorkItem[];
  onProgress: (p: number) => void;
  onAllLoaded: () => void;
  onWorkClick?: (slug: string) => void;
}

const VERTEX_SRC = `
attribute vec2 aPos;
attribute vec2 aUv;
uniform mat4 uMVP;
varying vec2 vUv;
void main() {
  vUv = aUv;
  gl_Position = uMVP * vec4(aPos, 0.0, 1.0);
}`;

const FRAGMENT_SRC = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTexture;
uniform sampler2D uNextTexture;
uniform float uOpacity;
uniform float uGrayscale;
uniform float uZoom;
uniform float uBlack;
uniform float uGoldToNeon;
uniform float uNeonGlow;
uniform float uPerspMix;

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  vec2 uv = (vUv - 0.5) / uZoom + 0.5;
  vec4 colorA = texture2D(uTexture, uv);
  vec4 colorB = texture2D(uNextTexture, uv);
  vec4 color = mix(colorA, colorB, uPerspMix);
  vec3 hsv = rgb2hsv(color.rgb);
  float hueMask =
    smoothstep(0.04, 0.06, hsv.x) * (1.0 - smoothstep(0.18, 0.22, hsv.x));
  float satMask = smoothstep(0.2, 0.45, hsv.y);
  vec3 neonHsv = vec3(0.35, clamp(hsv.y * 1.15 + 0.05, 0.0, 1.0), hsv.z);
  vec3 recolored = hsv2rgb(neonHsv);
  vec3 base = mix(color.rgb, recolored, hueMask * satMask * uGoldToNeon);

  float ia = color.a * uOpacity;
  float ga =
    (1.0 - smoothstep(0.14, 0.5, length(vUv - vec2(0.5, 0.46)))) *
    0.34 *
    uNeonGlow *
    uOpacity;
  float outA = ia + ga * (1.0 - ia);
  vec3 comp =
    (base * ia + vec3(0.04, 0.85, 0.12) * ga * (1.0 - ia)) / max(outA, 1e-4);

  float gray = dot(comp, vec3(0.299, 0.587, 0.114));
  vec3 finalColor = mix(comp, vec3(gray), uGrayscale);
  vec3 c = mix(finalColor, vec3(0.0), uBlack);
  gl_FragColor = vec4(c, outA);
}`;

interface PlaneState {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  mediaAspect: number;
  scaleT: { x: number; y: number };
  offset: { timeOffset: number };
  op: { value: number };
  hover: {
    zoom: { value: number };
    black: { value: number };
    grayscale: { value: number };
  };
  textures: Record<IconPerspective, WebGLTexture>;
}

const PERSPECTIVE_CYCLE: readonly IconPerspective[] = [
  "iso",
  "dynamic",
  "front",
];

type Vec3 = { x: number; y: number; z: number };

function perspective(
  fovy: number,
  aspect: number,
  near: number,
  far: number,
): Float32Array {
  const f = 1 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);
  return new Float32Array([
    f / aspect,
    0,
    0,
    0,
    0,
    f,
    0,
    0,
    0,
    0,
    (far + near) * nf,
    -1,
    0,
    0,
    2 * far * near * nf,
    0,
  ]);
}

function multiply(a: Float32Array, b: Float32Array): Float32Array {
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      out[c * 4 + r] =
        a[r] * b[c * 4] +
        a[4 + r] * b[c * 4 + 1] +
        a[8 + r] * b[c * 4 + 2] +
        a[12 + r] * b[c * 4 + 3];
    }
  }
  return out;
}

function trs(
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
): Float32Array {
  return new Float32Array([sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, 1, 0, x, y, z, 1]);
}

function translation(x: number, y: number, z: number): Float32Array {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]);
}

const INDEX_BASE = "FOR CONTEXT & CACHE CULTURE";
const LABEL_BASE = "CONSTELLATION";
const FOVY = (70 * Math.PI) / 180;
const PLANE_HEIGHT_DESKTOP = 0.25;
const PLANE_HEIGHT_MOBILE = 0.12;

function planeHeight(isMobile: boolean): number {
  return isMobile ? PLANE_HEIGHT_MOBILE : PLANE_HEIGHT_DESKTOP;
}

export const HomeCarousel = forwardRef<HomeCarouselHandle, HomeCarouselProps>(
  function HomeCarousel({ works, onProgress, onAllLoaded, onWorkClick }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const apiRef = useRef<{
      attachScroll: (lenis: Lenis) => void;
      intro: () => void;
      outro: () => void;
      dispose: () => void;
    } | null>(null);

    useImperativeHandle(ref, () => ({
      attachScroll(lenis: Lenis) {
        apiRef.current?.attachScroll(lenis);
      },
      intro() {
        apiRef.current?.intro();
      },
      dispose() {
        apiRef.current?.dispose();
      },
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const gl = canvas.getContext("webgl", {
        alpha: true,
        antialias: true,
        premultipliedAlpha: false,
      });
      if (!gl) {
        onAllLoaded();
        return;
      }

      let isMobile = window.innerWidth <= 768;
      let width = window.innerWidth;
      let height = window.innerHeight;
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const failSoft = (reason: string): void => {
        console.error(`[HomeCarousel] ${reason} — continuing without carousel`);
        onAllLoaded();
      };
      if (gl.isContextLost()) {
        failSoft("WebGL context lost before setup");
        return;
      }

      const compile = (type: number, src: string): WebGLShader | null => {
        const sh = gl.createShader(type);
        if (!sh) return null;
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
          const log = gl.getShaderInfoLog(sh);
          console.error(
            `[HomeCarousel] shader compile failed: ${log ?? "(no info — WebGL context lost)"}`,
          );
          gl.deleteShader(sh);
          return null;
        }
        return sh;
      };
      const vs = compile(gl.VERTEX_SHADER, VERTEX_SRC);
      const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SRC);
      if (!vs || !fs || gl.isContextLost()) {
        failSoft("shader setup failed");
        return;
      }
      const program = gl.createProgram();
      if (!program) {
        failSoft("program allocation failed");
        return;
      }
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const linkLog = gl.getProgramInfoLog(program);
        failSoft(`program link failed: ${linkLog ?? "(no info)"}`);
        return;
      }
      gl.useProgram(program);

      const quad = new Float32Array([
        -0.5, -0.5, 0, 0, 0.5, -0.5, 1, 0, -0.5, 0.5, 0, 1, 0.5, 0.5, 1, 1,
      ]);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
      const aPos = gl.getAttribLocation(program, "aPos");
      const aUv = gl.getAttribLocation(program, "aUv");
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
      gl.enableVertexAttribArray(aUv);
      gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 16, 8);

      const uMVP = gl.getUniformLocation(program, "uMVP");
      const uTextureLoc = gl.getUniformLocation(program, "uTexture");
      const uOpacityLoc = gl.getUniformLocation(program, "uOpacity");
      const uGrayLoc = gl.getUniformLocation(program, "uGrayscale");
      const uZoomLoc = gl.getUniformLocation(program, "uZoom");
      const uBlackLoc = gl.getUniformLocation(program, "uBlack");
      const uGoldToNeonLoc = gl.getUniformLocation(program, "uGoldToNeon");
      const uNeonGlowLoc = gl.getUniformLocation(program, "uNeonGlow");
      const uNextTextureLoc = gl.getUniformLocation(program, "uNextTexture");
      const uPerspMixLoc = gl.getUniformLocation(program, "uPerspMix");

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
      gl.uniform1i(uTextureLoc, 0);
      gl.uniform1i(uNextTextureLoc, 1);
      gl.uniform1f(uGoldToNeonLoc, 1);
      gl.uniform1f(uNeonGlowLoc, 1);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

      const n = works.length;
      const planes: PlaneState[] = [];
      const texturesToDispose: WebGLTexture[] = [];

      let rx = isMobile ? 0.43 : 0.58;
      let ry = isMobile ? 0.23 : 0.32;
      let tilt = isMobile ? Math.PI / 6 : Math.PI / 7;

      interface LutPoint {
        x: number;
        y: number;
        length: number;
        t: number;
      }
      let lut: LutPoint[] = [];
      const buildEllipseLUT = (): void => {
        const pts: LutPoint[] = [];
        let acc = 0;
        for (let i = 0; i <= 1000; i++) {
          const angle = (i / 1000) * Math.PI * 2;
          const ex = Math.cos(angle) * rx;
          const ey = Math.sin(angle) * ry;
          const x = ex * Math.cos(tilt) - ey * Math.sin(tilt);
          const y = ex * Math.sin(tilt) + ey * Math.cos(tilt);
          if (i > 0) {
            const p = pts[i - 1];
            acc += Math.hypot(x - p.x, y - p.y);
          }
          pts.push({ x, y, length: acc, t: 0 });
        }
        pts.forEach((p) => {
          p.t = p.length / acc;
        });
        lut = pts;
      };
      buildEllipseLUT();

      const getEllipsePoint = (tRaw: number): Vec3 => {
        const t = ((tRaw % 1) + 1) % 1;
        let lo = 0;
        let hi = lut.length - 1;
        while (lo < hi - 1) {
          const mid = Math.floor((lo + hi) / 2);
          if (lut[mid].t < t) lo = mid;
          else hi = mid;
        }
        const a = lut[lo];
        const b = lut[hi];
        const f = (t - a.t) / (b.t - a.t || 1);
        return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, z: 0 };
      };

      const createTexture = (
        source: HTMLImageElement | HTMLVideoElement,
      ): WebGLTexture => {
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          source,
        );
        texturesToDispose.push(tex);
        return tex as WebGLTexture;
      };

      let disposed = false;
      let running = true;
      let introPlaying = !reducedMotion;
      let outroPlaying = false;
      let direction = 1;
      let speed = 0.015;
      let time = 0.8;
      let velocityBonus = 0;
      let camZ = 4;
      let lastHovered = -1;
      let zCounter = 0;
      let mouseNdcX = 9999;
      let mouseNdcY = 9999;
      let raf = 0;
      let prevClock = performance.now();
      const finePointerRef = {
        current: window.matchMedia("(pointer: fine)").matches,
      };
      const scrambleTimeouts: number[] = [];

      const resize = (): void => {
        width = window.innerWidth;
        height = window.innerHeight;
        const wasMobile = isMobile;
        isMobile = width <= 768;
        finePointerRef.current = window.matchMedia("(pointer: fine)").matches;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        gl.viewport(0, 0, canvas.width, canvas.height);
        if (wasMobile !== isMobile) {
          rx = isMobile ? 0.43 : 0.58;
          ry = isMobile ? 0.23 : 0.32;
          tilt = isMobile ? Math.PI / 6 : Math.PI / 7;
          buildEllipseLUT();
          planes.forEach((p) => {
            p.height = planeHeight(isMobile);
            p.width = p.height * p.mediaAspect;
          });
        }
      };
      resize();

      const onMouseMove = (ev: MouseEvent): void => {
        mouseNdcX = (ev.clientX / width) * 2 - 1;
        mouseNdcY = -(ev.clientY / height) * 2 + 1;
      };

      const updateHover = (hoveredIndex: number): void => {
        if (hoveredIndex !== -1 && hoveredIndex !== lastHovered) {
          const w = works[hoveredIndex];
          scrambleTimeouts.forEach(clearTimeout);
          scrambleTimeouts.length = 0;
          scrambleTimeouts.push(
            ...scrambleText(
              document.getElementById("worksIndex")?.textContent ?? "",
              String(hoveredIndex + 1).padStart(3, "0"),
              (t) => {
                const el = document.getElementById("worksIndex");
                if (el) el.textContent = t;
              },
            ),
            ...scrambleText(
              document.getElementById("worksLabel")?.textContent ?? "",
              w.title,
              (t) => {
                const el = document.getElementById("worksLabel");
                if (el) el.textContent = t;
              },
            ),
          );
          lastHovered = hoveredIndex;
        } else if (hoveredIndex === -1 && lastHovered !== -1) {
          scrambleTimeouts.forEach(clearTimeout);
          scrambleTimeouts.length = 0;
          scrambleTimeouts.push(
            ...scrambleText(
              document.getElementById("worksIndex")?.textContent ?? "",
              INDEX_BASE,
              (t) => {
                const el = document.getElementById("worksIndex");
                if (el) el.textContent = t;
              },
            ),
            ...scrambleText(
              document.getElementById("worksLabel")?.textContent ?? "",
              LABEL_BASE,
              (t) => {
                const el = document.getElementById("worksLabel");
                if (el) el.textContent = t;
              },
            ),
          );
          lastHovered = -1;
        }
        planes.forEach((p, i) => {
          const isHovered = hoveredIndex !== -1 && i === hoveredIndex;
          const dimmed = hoveredIndex !== -1 && i !== hoveredIndex;
          document.body.style.cursor =
            hoveredIndex !== -1 ? "pointer" : "default";
          gsap.to(p.hover.black, {
            value: dimmed ? 0.5 : 0,
            duration: dimmed ? 0.4 : 0.6,
            ease: dimmed ? "power3.out" : "power1.out",
            overwrite: true,
          });
          gsap.to(p.scaleT, {
            x: isHovered ? 1.4 : 1,
            y: isHovered ? 1.4 : 1,
            duration: isHovered ? 1.2 : 0.7,
            ease: "expo.out",
            overwrite: true,
          });
          gsap.to(p.hover.zoom, {
            value: isHovered ? 1 : 1.15,
            duration: isHovered ? 1.2 : 0.7,
            ease: "expo.out",
            overwrite: true,
          });
          gsap.to(p.hover.grayscale, {
            value: dimmed ? 1 : 0,
            duration: dimmed ? 0.4 : 0.6,
            ease: dimmed ? "power3.out" : "power1.out",
            overwrite: true,
          });
        });
        if (hoveredIndex !== -1) {
          zCounter += 5e-7;
          planes[hoveredIndex].z = zCounter;
        }
      };

      const pickPlane = (): number => {
        const visH = 2 * Math.tan(FOVY / 2) * camZ;
        const visW = visH * (width / height);
        const mx = mouseNdcX * (visW / 2);
        const my = mouseNdcY * (visH / 2);
        let best = -1;
        let bestZ = -Infinity;
        planes.forEach((p, i) => {
          if (
            Math.abs(mx - p.x) <= (p.width * p.scaleT.x) / 2 &&
            Math.abs(my - p.y) <= (p.height * p.scaleT.y) / 2
          ) {
            if (p.z > bestZ) {
              bestZ = p.z;
              best = i;
            }
          }
        });
        return best;
      };

      const onClick = (): void => {
        if (introPlaying || outroPlaying) return;
        const idx = pickPlane();
        if (idx === -1) return;
        const w = works[idx];
        if (!w) return;
        if (onWorkClick) {
          outroPlaying = true;
          playOutroScene();
          onWorkClick(w.slug);
        }
      };

      const playOutroScene = (): void => {
        gsap.to(
          { z: camZ },
          {
            z: 2.9,
            duration: 1,
            ease: "power3.inOut",
            onUpdate: function () {
              camZ = (this.targets()[0] as { z: number }).z;
            },
          },
        );
        gsap.to(
          { s: speed },
          {
            s: 0.85,
            duration: 1.2,
            ease: "power2.out",
            onUpdate: function () {
              speed = (this.targets()[0] as { s: number }).s;
            },
          },
        );
        planes.forEach((p, i) => {
          gsap.to(p.op, {
            value: 0,
            duration: 0.45,
            ease: "none",
            delay: i * 0.025,
          });
        });
      };

      const detachLenisRef: { fn: (() => void) | null } = { fn: null };

      let ready = false;
      let introQueued = false;

      const render = (): void => {
        if (!running) return;
        if (gl.isContextLost()) {
          running = false;
          failSoft("WebGL context lost while rendering");
          return;
        }
        if (!ready) {
          raf = requestAnimationFrame(render);
          return;
        }
        const now = performance.now();
        const delta = Math.min((now - prevClock) / 1000, 0.05);
        prevClock = now;
        velocityBonus *= 0.6;
        const step = speed * direction + velocityBonus;
        time -= step * delta;

        let hovered = -1;
        if (
          !introPlaying &&
          !outroPlaying &&
          matchMedia("(pointer: fine)").matches
        ) {
          hovered = pickPlane();
        }
        planes.forEach((p) => {
          if (!p) return;
          const pt = getEllipsePoint(p.offset.timeOffset + time);
          p.x = pt.x;
          p.y = pt.y;
        });
        updateHover(hovered);

        gl.clear(gl.COLOR_BUFFER_BIT);
        const proj = perspective(FOVY, width / height, 0.1, 1000);
        const view = translation(0, 0, -camZ);
        const vp = multiply(proj, view);
        [...planes]
          .filter((p): p is PlaneState => Boolean(p))
          .sort((a, b) => a.z - b.z)
          .forEach((p) => {
            const tNorm = (((p.offset.timeOffset + time) % 1) + 1) % 1;
            const nPersp = PERSPECTIVE_CYCLE.length;
            const pPos = tNorm * nPersp;
            const baseIdx = Math.floor(pPos);
            const idx = (((baseIdx % nPersp) + nPersp) % nPersp) as number;
            const f = pPos - baseIdx;
            const blendHalf = 0.16;
            let from: IconPerspective = PERSPECTIVE_CYCLE[idx];
            let to: IconPerspective = from;
            let m = 0;
            if (f > 1 - blendHalf) {
              to = PERSPECTIVE_CYCLE[(idx + 1) % nPersp];
              m = (f - (1 - blendHalf)) / (2 * blendHalf);
            } else if (f < blendHalf) {
              from = PERSPECTIVE_CYCLE[(idx + nPersp - 1) % nPersp];
              to = PERSPECTIVE_CYCLE[idx];
              m = 0.5 + (0.5 * f) / blendHalf;
            }
            m = m * m * (3 - 2 * m);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, p.textures[from]);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, p.textures[to]);
            gl.uniform1f(uPerspMixLoc, m);
            gl.uniformMatrix4fv(
              uMVP,
              false,
              multiply(
                vp,
                trs(p.x, p.y, p.z, p.scaleT.x * p.width, p.scaleT.y * p.height),
              ),
            );
            gl.uniform1f(uOpacityLoc, p.op.value);
            gl.uniform1f(uGrayLoc, p.hover.grayscale.value);
            gl.uniform1f(uZoomLoc, p.hover.zoom.value);
            gl.uniform1f(uBlackLoc, p.hover.black.value);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          });
        raf = requestAnimationFrame(render);
      };

      const loadImage = (src: string): Promise<HTMLImageElement | null> =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = src;
        });

      const loadAssets = async (): Promise<void> => {
        let loaded = 0;
        const report = (): void => {
          loaded += 1;
          onProgress(Math.min(loaded / n, 1));
        };
        const jobs = works.map(async (w, i) => {
          const images = await Promise.all(
            ICON_PERSPECTIVES.map((key) => loadImage(w.perspectives[key])),
          );
          report();
          if (planes[i]) return;
          const [isoImg, dynamicImg, frontImg] = images;
          if (!isoImg || !dynamicImg || !frontImg) return;
          const mediaAspect = isoImg.naturalWidth / isoImg.naturalHeight || 1;
          const h = planeHeight(isMobile);
          planes[i] = {
            x: 0,
            y: 0,
            z: 0,
            width: h * mediaAspect,
            height: h,
            mediaAspect,
            scaleT: { x: 1, y: 1 },
            offset: { timeOffset: i / n + 0.5 },
            op: { value: 0 },
            hover: {
              zoom: { value: 1.2 },
              black: { value: 0 },
              grayscale: { value: 0 },
            },
            textures: {
              iso: createTexture(isoImg),
              dynamic: createTexture(dynamicImg),
              front: createTexture(frontImg),
            },
          };
        });
        await Promise.all(jobs);
        for (let i = n - 1; i >= 0; i--) {
          if (!planes[i]) planes.splice(i, 1);
        }
      };

      void loadAssets().then(() => {
        if (disposed) return;
        ready = true;
        if (introQueued) {
          introQueued = false;
          intro();
        }
        onAllLoaded();
      });

      const startRender = (): void => {
        prevClock = performance.now();
        raf = requestAnimationFrame(render);
      };
      startRender();

      const intro = (): void => {
        if (!ready) {
          introQueued = true;
          return;
        }
        if (reducedMotion) {
          camZ = 1;
          speed = 0.015;
          introPlaying = false;
          planes.forEach((p, i) => {
            p.offset.timeOffset = i / n;
            p.op.value = 1;
          });
          return;
        }
        introPlaying = true;
        gsap.to(
          { z: camZ },
          {
            z: 1,
            duration: 1.6,
            ease: "power2.out",
            onUpdate: function () {
              camZ = (this.targets()[0] as { z: number }).z;
            },
            onComplete: () => {
              introPlaying = false;
            },
          },
        );
        speed = 0.5;
        direction = 1;
        gsap.to(
          { s: speed },
          {
            s: 0.015,
            duration: 3.3,
            ease: "power1.out",
            onUpdate: function () {
              speed = (this.targets()[0] as { s: number }).s;
            },
            onComplete: () => {
              velocityBonus = 0;
            },
          },
        );
        planes.forEach((p, i) => {
          p.op.value = 0;
          const startOffset = i / n + 0.5;
          p.offset.timeOffset = startOffset;
          gsap.to(p.offset, {
            timeOffset: i / n,
            duration: 1.8,
            ease: "expo.out",
            delay: (n - 1 - i) * 0.045,
          });
          gsap.to(p.op, {
            value: 1,
            duration: 0.65,
            ease: "none",
            delay: (n - 1 - i) * 0.082,
          });
        });
      };

      const attachScroll = (lenis: Lenis): void => {
        const handler = ({
          velocity,
          direction: dir,
        }: {
          velocity: number;
          direction: number;
        }): void => {
          if (outroPlaying || introPlaying) return;
          direction = dir >= 0 ? 1 : -1;
          const v = isMobile ? velocity * 2.5 : velocity;
          velocityBonus = v * 0.01;
        };
        lenis.on("scroll", handler);
        detachLenisRef.fn = () => {
          lenis.off("scroll", handler);
        };
      };

      const dispose = (): void => {
        if (disposed) return;
        disposed = true;
        running = false;
        cancelAnimationFrame(raf);
        detachLenisRef.fn?.();
        scrambleTimeouts.forEach(clearTimeout);
        const tweenTargets: object[] = [];
        planes.forEach((p) => {
          if (!p) return;
          tweenTargets.push(
            p.hover.black,
            p.hover.grayscale,
            p.hover.zoom,
            p.scaleT,
            p.op,
            p.offset,
          );
        });
        gsap.killTweensOf(tweenTargets);
        texturesToDispose.forEach((t) => gl.deleteTexture(t));
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
      };

      apiRef.current = { attachScroll, intro, outro: playOutroScene, dispose };

      window.addEventListener("resize", resize);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("click", onClick);

      return () => {
        window.removeEventListener("resize", resize);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("click", onClick);
        dispose();
        apiRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <canvas className="home_canvas" ref={canvasRef} aria-hidden="true" />
    );
  },
);
