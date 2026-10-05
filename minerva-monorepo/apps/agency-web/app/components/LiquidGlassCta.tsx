"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo, useRef } from "react";
import type {
  JSX,
  MutableRefObject,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";

const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = `
precision highp float;

varying vec2 vUv;

uniform vec2 u_res;
uniform float u_time;
uniform float u_radius;
uniform vec2 u_pointer;
uniform float u_hover;
uniform vec3 u_colorA;
uniform vec3 u_colorB;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(11.3, 7.1);
    a *= 0.5;
  }
  return v;
}

mat2 rot(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

vec3 bg(vec2 q) {
  vec2 a = rot(u_time * 0.035) * q;
  float g1 = fbm(a + vec2(0.0, u_time * 0.012));
  float g2 = fbm(a * 1.7 - vec2(u_time * 0.02, 0.0) + 9.0);
  vec3 col = mix(u_colorB, u_colorA, clamp(g1 * 0.9 + g2 * 0.25, 0.0, 1.0));
  col += vec3(g2 * g2) * 0.05;
  return col;
}

void main() {
  vec2 p = vUv * u_res;
  vec2 c = u_res * 0.5;
  vec2 halfB = u_res * 0.5 - 2.0;
  float d = sdRoundBox(p - c, halfB, u_radius);
  float aa = fwidth(d);
  float mask = 1.0 - smoothstep(-aa, aa, d);
  float dd = clamp(-d, 0.0, 24.0);

  vec2 q = (p - c) / u_res;
  float t = u_time;
  vec2 field = rot(t * 0.14) * (q * 3.6 + vec2(1.7));
  float n1 = fbm(field + vec2(t * 0.05, -t * 0.03));
  float n2 = fbm(field * 2.1 - vec2(t * 0.045) + 7.3);
  vec2 nrm = (vec2(n1, n2) - 0.5) * 2.6;

  float edgeBend = (1.0 - smoothstep(0.0, 16.0, dd)) * 0.5;
  float centerBend = smoothstep(14.0, 46.0, dd) * 0.16;
  vec2 outDir = normalize(q + 0.0001);
  vec2 warp = nrm * 0.016 + outDir * (edgeBend * 0.9 + centerBend) * 0.045;

  vec2 dir = warp + 0.0001;
  vec3 r = bg(q - warp + dir * 0.004);
  vec3 g = bg(q - warp);
  vec3 b = bg(q - warp - dir * 0.004);
  vec3 refr = vec3(r.r, g.g, b.b);

  vec3 N = normalize(vec3(nrm * 1.5, 1.0));
  vec3 V = vec3(0.0, 0.0, 1.0);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  float rim = fres * 0.3 + fres * fres * 0.4;

  vec3 Lk = normalize(vec3(-0.35, 0.95, 0.55));
  float key = pow(max(dot(N, Lk), 0.0), 60.0) * 0.9;
  float keyWide = pow(max(dot(N, Lk), 0.0), 8.0) * 0.1;

  vec2 mp = u_pointer - p;
  float md = length(mp);
  vec3 Lc = normalize(vec3(mp / max(md, 1.0), 1.6));
  float spot = pow(max(dot(N, Lc), 0.0), 120.0) * exp(-md * md / 5200.0) * (0.7 + u_hover * 1.2);
  float glow = exp(-md * md / (u_res.x * u_res.x * 0.05)) * (0.04 + u_hover * 0.08);

  vec3 col = refr * (0.6 + keyWide + glow * 0.6);
  col += vec3(1.0) * (key * 0.35 + spot * 1.15 + rim * 0.5);
  col += vec3(0.09, 0.1, 0.13) * (edgeBend + 0.15) * fbm(q * 9.0 + vec2(t * 0.18, 0.0));
  col += vec3(1.0) * u_hover * 0.06 * fbm(q * 4.0 + vec2(t * 0.1, 0.0));

  float topLine = (1.0 - smoothstep(0.0, 3.0, dd)) * smoothstep(0.0, 0.35, vUv.y) * 0.42;
  float bottomShade = (1.0 - smoothstep(0.0, 4.0, dd)) * (1.0 - smoothstep(0.65, 1.0, vUv.y)) * 0.28;
  col += vec3(1.0) * topLine;
  col -= vec3(0.35) * bottomShade;

  float outSh = smoothstep(0.0, 16.0, d) * 0.5;
  float alpha = mask * (0.82 + glow * 0.6) + (1.0 - mask) * outSh;
  col = mix(col, vec3(0.01, 0.01, 0.012), (1.0 - mask) * outSh);

  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}
`;

function GlassMesh(props: {
  pointer: MutableRefObject<{ x: number; y: number }>;
  hover: MutableRefObject<number>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size } = useThree();

  const uniforms = useMemo(
    () =>
      ({
        u_res: { value: new THREE.Vector2(1, 1) },
        u_time: { value: 0 },
        u_radius: { value: 30 },
        u_pointer: { value: new THREE.Vector2(-9999, -9999) },
        u_hover: { value: 0 },
        u_colorA: { value: new THREE.Color(0x05070b) },
        u_colorB: { value: new THREE.Color(0x101828) },
      }) as Record<string, THREE.IUniform>,
    [],
  );

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
      }),
    [uniforms],
  );

  const reduced = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh || size.width === 0 || size.height === 0) return;
    if (mesh.scale.x !== size.width || mesh.scale.y !== size.height) {
      mesh.scale.set(size.width, size.height, 1);
    }
    (uniforms.u_res.value as THREE.Vector2).set(size.width, size.height);
    (uniforms.u_radius.value as number) =
      Math.min(size.width, size.height) * 0.48;
    if (!reduced) {
      (uniforms.u_time.value as number) += Math.min(delta, 0.05);
    }
    const target = props.hover.current;
    const curVal = uniforms.u_hover.value as number;
    (uniforms.u_hover.value as number) =
      curVal + (target - curVal) * Math.min(1, delta * 12);
    (uniforms.u_pointer.value as THREE.Vector2).set(
      props.pointer.current.x,
      props.pointer.current.y,
    );
  });

  return (
    <mesh ref={meshRef} material={material}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}

export default function LiquidGlassCta(): JSX.Element {
  const pointer = useRef({ x: -9999, y: -9999 });
  const hover = useRef(0);

  const onMove = (e: ReactPointerEvent<HTMLAnchorElement>): void => {
    const rect = e.currentTarget.getBoundingClientRect();
    pointer.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onEnter = (): void => {
    hover.current = 1;
  };

  const onLeave = (): void => {
    hover.current = 0;
    pointer.current = { x: -9999, y: -9999 };
  };

  return (
    <a
      data-w-id="2d414d78-fa06-2d36-5df7-ba8561aed590"
      href="/contact"
      className="button nav-cta liquid-glass-cta w-inline-block"
      onPointerMove={onMove}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div className="liquid-glass-cta__stage" aria-hidden="true">
        <Canvas
          orthographic
          camera={{ position: [0, 0, 10], near: 0.1, far: 100 }}
          dpr={[1, 2]}
          gl={{
            alpha: true,
            antialias: false,
            powerPreference: "high-performance",
          }}
        >
          <GlassMesh pointer={pointer} hover={hover} />
        </Canvas>
      </div>
      <div
        className="button_text"
        style={{
          position: "relative",
          zIndex: 1,
          pointerEvents: "none",
          transform:
            "translate3d(0px, 0px, 0px) scale3d(1, 1, 1) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skew(0deg, 0deg)",
          transformStyle: "preserve-3d",
        }}
      >
        Contact Us
      </div>
      <div
        className="button_arrow-wrapper"
        style={{
          pointerEvents: "none",
          transform:
            "translate3d(10px, 0px, 0px) scale3d(0, 0, 1) rotateX(0deg) rotateY(0deg) rotateZ(45deg) skew(0deg, 0deg)",
          transformStyle: "preserve-3d",
        }}
      >
        <div className="code-embed navbar_button-arrow w-embed">
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 7.00049L11.9999 7.00049"
              stroke="#141515"
              strokeWidth="2"
            ></path>
            <path
              d="M5.99609 13L11.9961 7L5.99609 1"
              stroke="#141515"
              strokeWidth="2"
            ></path>
          </svg>
        </div>
      </div>
    </a>
  );
}
