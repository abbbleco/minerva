"use client";

import { useEffect, useRef } from "react";

export function CustomCursor() {
  const cubeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const cube = cubeRef.current;
    if (!cube) return;
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let x = tx;
    let y = ty;
    let shown = false;
    let raf = 0;
    const onMove = (ev: MouseEvent): void => {
      tx = ev.clientX;
      ty = ev.clientY;
      if (!shown) {
        shown = true;
        cube.classList.add("visible");
      }
    };
    const loop = (): void => {
      x += (tx - x) * 0.2;
      y += (ty - y) * 0.2;
      cube.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden="true">
      <div className="cursor_cube" ref={cubeRef}>
        <div className="cube" />
      </div>
      <div className="cursor_label">
        <div className="wrapper" />
      </div>
    </div>
  );
}
