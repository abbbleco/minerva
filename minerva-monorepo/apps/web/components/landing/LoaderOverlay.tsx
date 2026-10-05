"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import gsap from "gsap";

export interface LoaderOverlayHandle {
  setProgress: (p: number) => void;
  playOutro: () => Promise<void>;
  skip: () => void;
}

const VERTEX_SRC = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAGMENT_SRC = `
precision highp float;
uniform vec2 uResolution;
uniform float uGridSpacing;
uniform float uPointSize;
uniform float uTime;
uniform float uOpacity;
uniform float uUvScale;
uniform float uFbm1Scale;
uniform float uFbm1TimeX;
uniform float uFbm1TimeY;
uniform float uFbm1Edge;
uniform float uFbm2Scale;
uniform float uFbm2Offset;
uniform float uFbm2TimeX;
uniform float uFbm2TimeY;
uniform float uFbm2Edge;
uniform float uInterference;
uniform float uScatterScale;
uniform float uScatterSpeed;
uniform float uThresholdBase;
uniform float uThresholdRange;
uniform vec3 uColor;
uniform float uFbm1Amp;
uniform float uFinalProgress;
uniform float uFbm1Freq;
uniform float uFbm2Amp;
uniform float uFbm2Freq;
uniform float uPsX;
uniform float uPsY;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0+h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p, vec2 timeOffset, float freqMul, float ampMul) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 2.0;
  for (int i = 0; i < 3; i++) {
    value += amplitude * snoise(p * frequency + timeOffset);
    frequency *= freqMul;
    amplitude *= ampMul;
  }
  return value;
}

void main() {
  vec2 px;
  px.x = gl_FragCoord.x - uResolution.x * 0.5;
  px.y = (uResolution.y - gl_FragCoord.y) - uResolution.y * 0.5;

  vec2 offset = mod(uResolution * 0.5, uGridSpacing);
  px += offset;

  vec2 cell = mod(px, uGridSpacing);
  float cellHalf = uGridSpacing * 0.5;
  vec2 d = abs(cell - cellHalf);
  if (d.x > uPointSize * uPsX || d.y > uPointSize * uPsY) discard;

  vec2 centerDist = px - offset;
  float exclusionRadius = uGridSpacing * 5.0;
  if (dot(centerDist, centerDist) < exclusionRadius * exclusionRadius) discard;

  vec2 gridPos = px - cell;
  vec2 uv = gridPos * uUvScale;

  float n1 = fbm(uv * uFbm1Scale, vec2(uTime * uFbm1TimeX, uTime * uFbm1TimeY), uFbm1Amp, uFbm1Freq);
  float n2 = fbm(uv * uFbm2Scale + uFbm2Offset, vec2(uTime * uFbm2TimeX, uTime * uFbm2TimeY), uFbm2Amp, uFbm2Freq);

  float edge1 = 1.0 - smoothstep(0.0, uFbm1Edge, abs(n1));
  float edge2 = 1.0 - smoothstep(0.0, uFbm2Edge, abs(n2));
  float mask = max(edge1, edge2);
  mask += edge1 * edge2 * uInterference;
  mask = clamp(mask, 0.0, 1.0);

  float scatter = snoise(gridPos * uScatterScale + uTime * uScatterSpeed);
  float threshold = uThresholdBase + scatter * uThresholdRange;

  if (mask < threshold * uFinalProgress) discard;

  gl_FragColor = vec4(uColor, uOpacity);
}`;

interface Params {
  gridSpacing: number;
  pointSize: number;
  uvScale: number;
  fbm1Scale: number;
  fbm1TimeX: number;
  fbm1TimeY: number;
  fbm1Edge: number;
  fbm2Scale: number;
  fbm2Offset: number;
  fbm2TimeX: number;
  fbm2TimeY: number;
  fbm2Edge: number;
  interference: number;
  scatterScale: number;
  scatterSpeed: number;
  thresholdBase: number;
  thresholdRange: number;
  timeSpeed: number;
}

const PARAMS: Params = {
  gridSpacing: 12,
  pointSize: 1,
  uvScale: 0.0027,
  fbm1Scale: 0.04,
  fbm1TimeX: 0.1,
  fbm1TimeY: 0.3,
  fbm1Edge: 0.25,
  fbm2Scale: 0.04,
  fbm2Offset: 8,
  fbm2TimeX: -0.3,
  fbm2TimeY: 0.2,
  fbm2Edge: 0.48,
  interference: 5,
  scatterScale: 0.9,
  scatterSpeed: 1.5,
  thresholdBase: 0.54,
  thresholdRange: 0.51,
  timeSpeed: 0.013,
};

const UNIFORM_NAMES = [
  "uResolution",
  "uGridSpacing",
  "uPointSize",
  "uTime",
  "uOpacity",
  "uUvScale",
  "uFbm1Scale",
  "uFbm1TimeX",
  "uFbm1TimeY",
  "uFbm1Edge",
  "uFbm2Scale",
  "uFbm2Offset",
  "uFbm2TimeX",
  "uFbm2TimeY",
  "uFbm2Edge",
  "uInterference",
  "uScatterScale",
  "uScatterSpeed",
  "uThresholdBase",
  "uThresholdRange",
  "uColor",
  "uFbm1Amp",
  "uFinalProgress",
  "uFbm1Freq",
  "uFbm2Amp",
  "uFbm2Freq",
  "uPsX",
  "uPsY",
] as const;

type UniformName = (typeof UNIFORM_NAMES)[number];

interface UniformSlot {
  value: number | [number, number] | [number, number, number];
  location: WebGLUniformLocation | null;
}

type Uniforms = Record<UniformName, UniformSlot>;

function collectUniforms(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
): Uniforms {
  const out = {} as Uniforms;
  for (const name of UNIFORM_NAMES) {
    const location = gl.getUniformLocation(program, name);
    const value: UniformSlot["value"] =
      name === "uResolution" ? [0, 0] : name === "uColor" ? [1, 1, 1] : 0;
    out[name] = { value, location };
  }
  return out;
}

function apply(
  gl: WebGLRenderingContext,
  u: Uniforms,
  name: UniformName,
): void {
  const slot = u[name];
  if (!slot.location) return;
  if (typeof slot.value === "number") gl.uniform1f(slot.location, slot.value);
  else if (slot.value.length === 2)
    gl.uniform2f(slot.location, slot.value[0], slot.value[1]);
  else gl.uniform3f(slot.location, slot.value[0], slot.value[1], slot.value[2]);
}

function applyAll(gl: WebGLRenderingContext, u: Uniforms): void {
  for (const name of UNIFORM_NAMES) apply(gl, u, name);
}

export const LoaderOverlay = forwardRef<LoaderOverlayHandle>(
  function LoaderOverlay(_, ref) {
    const rootRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const readoutRef = useRef<HTMLDivElement>(null);
    const uniformsRef = useRef<Uniforms | null>(null);
    const glRef = useRef<WebGLRenderingContext | null>(null);
    const stopRef = useRef<(() => void) | null>(null);

    useImperativeHandle(ref, () => ({
      setProgress(p: number) {
        const el = readoutRef.current;
        if (!el) return;
        const pct = Math.round(Math.min(Math.max(p, 0), 1) * 100);
        el.textContent = `${pct}%`;
        gsap.to(el, {
          opacity: 1,
          duration: 0.4,
          ease: "none",
          overwrite: true,
        });
      },
      skip() {
        const u = uniformsRef.current;
        if (u) {
          gsap.killTweensOf([
            u.uOpacity,
            u.uFbm1Amp,
            u.uFbm1Freq,
            u.uFbm1Edge,
            u.uFinalProgress,
            u.uUvScale,
            u.uFbm2Freq,
          ]);
        }
        stopRef.current?.();
        const root = rootRef.current;
        const readout = readoutRef.current;
        if (root) root.style.display = "none";
        if (readout) readout.style.display = "none";
      },
      playOutro() {
        return new Promise<void>((resolve) => {
          window.setTimeout(resolve, 400);
          const overlay = rootRef.current?.querySelector(".overlay_loader");
          const readout = readoutRef.current;
          const root = rootRef.current;
          const u = uniformsRef.current;
          const gl = glRef.current;
          if (!overlay || !readout || !root || !u || !gl) {
            gsap.to([root, readout].filter(Boolean), {
              opacity: 0,
              duration: 0.5,
              ease: "none",
            });
            return;
          }
          const tl = gsap.timeline({
            onComplete: () => {
              stopRef.current?.();
              root.style.display = "none";
              readout.style.display = "none";
            },
          });
          tl.to(
            u.uFinalProgress,
            { value: 0.1, duration: 1.2, ease: "power3.out" },
            0,
          )
            .to(
              u.uUvScale,
              { value: 1e-5, duration: 1.2, ease: "power3.out" },
              0,
            )
            .to(
              u.uFbm1Freq,
              { value: 0.5, duration: 1.2, ease: "power3.out" },
              0,
            )
            .to(
              u.uFbm2Freq,
              { value: 0.5, duration: 1.2, ease: "power3.out" },
              0,
            )
            .to(u.uOpacity, { value: 0, duration: 0.5, ease: "none" }, 0.4)
            .to(readout, { opacity: 0, duration: 0.4, ease: "none" }, 0)
            .to(overlay, { opacity: 0, duration: 0.5, ease: "none" }, 0);
        });
      },
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const gl = canvas.getContext("webgl", {
        alpha: true,
        antialias: false,
        premultipliedAlpha: false,
      });
      if (!gl) return;
      glRef.current = gl;

      const bailOut = (reason: string): void => {
        console.error(`[LoaderOverlay] ${reason} — hiding loader backdrop`);
        canvas.style.display = "none";
      };
      if (gl.isContextLost()) {
        bailOut("WebGL context lost before setup");
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
            `[LoaderOverlay] shader compile failed: ${log ?? "(no info — WebGL context lost)"}`,
          );
          gl.deleteShader(sh);
          return null;
        }
        return sh;
      };

      const vs = compile(gl.VERTEX_SHADER, VERTEX_SRC);
      const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SRC);
      if (!vs || !fs || gl.isContextLost()) {
        bailOut("shader setup failed");
        return;
      }
      const program = gl.createProgram();
      if (!program) {
        bailOut("program allocation failed");
        return;
      }
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const linkLog = gl.getProgramInfoLog(program);
        bailOut(`program link failed: ${linkLog ?? "(no info)"}`);
        return;
      }
      gl.useProgram(program);

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 3, -1, -1, 3]),
        gl.STATIC_DRAW,
      );
      const loc = gl.getAttribLocation(program, "aPos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);

      const u = collectUniforms(gl, program);
      uniformsRef.current = u;

      const resize = (): void => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(window.innerWidth * dpr);
        canvas.height = Math.floor(window.innerHeight * dpr);
        gl.viewport(0, 0, canvas.width, canvas.height);
        u.uResolution.value = [canvas.width, canvas.height];
        u.uGridSpacing.value = PARAMS.gridSpacing * dpr;
        u.uPointSize.value = PARAMS.pointSize * dpr;
      };

      u.uUvScale.value = PARAMS.uvScale;
      u.uFbm1Scale.value = PARAMS.fbm1Scale;
      u.uFbm1TimeX.value = PARAMS.fbm1TimeX;
      u.uFbm1TimeY.value = PARAMS.fbm1TimeY;
      u.uFbm2Scale.value = PARAMS.fbm2Scale;
      u.uFbm2Offset.value = PARAMS.fbm2Offset;
      u.uFbm2TimeX.value = PARAMS.fbm2TimeX;
      u.uFbm2TimeY.value = PARAMS.fbm2TimeY;
      u.uFbm2Edge.value = PARAMS.fbm2Edge;
      u.uInterference.value = PARAMS.interference;
      u.uScatterScale.value = PARAMS.scatterScale;
      u.uScatterSpeed.value = PARAMS.scatterSpeed;
      u.uThresholdBase.value = PARAMS.thresholdBase;
      u.uThresholdRange.value = PARAMS.thresholdRange;
      u.uFbm2Amp.value = 1;
      u.uFbm2Freq.value = 0.9;
      u.uFinalProgress.value = 1;
      u.uPsX.value = 1;
      u.uPsY.value = 1;
      u.uOpacity.value = 0;
      u.uFbm1Edge.value = 2;
      u.uFbm1Amp.value = 0;
      u.uFbm1Freq.value = 0;
      resize();

      let time = 0;
      let raf = 0;
      let running = true;

      const render = (): void => {
        if (!running) return;
        if (gl.isContextLost()) {
          running = false;
          canvas.style.display = "none";
          return;
        }
        time += PARAMS.timeSpeed;
        u.uTime.value = time;
        applyAll(gl, u);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        raf = requestAnimationFrame(render);
      };

      const onResize = (): void => resize();
      const onLost = (): void => {
        running = false;
        cancelAnimationFrame(raf);
        canvas.style.display = "none";
        console.error(
          "[LoaderOverlay] WebGL context lost — hiding loader backdrop",
        );
      };
      window.addEventListener("resize", onResize);
      canvas.addEventListener("webglcontextlost", onLost);

      gsap.to(u.uOpacity, { value: 0.6, duration: 1.3, ease: "none" });
      gsap.to(u.uFbm1Amp, { value: 2, duration: 1.9, ease: "power2.inOut" });
      gsap.to(u.uFbm1Freq, { value: 0.5, duration: 1.9, ease: "power2.inOut" });
      gsap.to(u.uFbm1Edge, {
        value: PARAMS.fbm1Edge,
        duration: 1,
        ease: "power2.inOut",
      });

      stopRef.current = () => {
        running = false;
        cancelAnimationFrame(raf);
      };
      raf = requestAnimationFrame(render);

      return () => {
        running = false;
        cancelAnimationFrame(raf);
        gsap.killTweensOf([
          u.uOpacity,
          u.uFbm1Amp,
          u.uFbm1Freq,
          u.uFbm1Edge,
          u.uFinalProgress,
          u.uUvScale,
          u.uFbm2Freq,
        ]);
        window.removeEventListener("resize", onResize);
        canvas.removeEventListener("webglcontextlost", onLost);
      };
    }, []);

    return (
      <>
        <div className="loader" ref={rootRef}>
          <canvas ref={canvasRef} />
          <div className="overlay_loader" />
        </div>
        <div className="loader_readout" ref={readoutRef} aria-hidden="true">
          %
        </div>
      </>
    );
  },
);
