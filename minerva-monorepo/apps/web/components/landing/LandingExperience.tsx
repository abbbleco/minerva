"use client";

import { useCallback, useEffect, useRef } from "react";
import Lenis from "lenis";
import type { WorkItem } from "@/lib/landing/works";
import { HomeCarousel, type HomeCarouselHandle } from "./HomeCarousel";
import { LoaderOverlay, type LoaderOverlayHandle } from "./LoaderOverlay";
import { CustomCursor } from "./CustomCursor";

const MIN_LOADER_MS = 2000;
const LOAD_FAILSAFE_MS = 12000;

interface LandingExperienceProps {
  works: WorkItem[];
}

export function LandingExperience({ works }: LandingExperienceProps) {
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef(0);
  const carouselRef = useRef<HomeCarouselHandle | null>(null);
  const loaderRef = useRef<LoaderOverlayHandle | null>(null);
  const enteredRef = useRef(false);
  const bootRef = useRef(0);

  const enterLive = useCallback(() => {
    if (enteredRef.current) return;
    enteredRef.current = true;
    lenisRef.current?.start();
    carouselRef.current?.intro();
  }, []);

  useEffect(() => {
    document.body.classList.add("landing_body");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;

    const lenis = new Lenis({ infinite: true, lerp: 0.1, syncTouch: coarse });
    lenis.stop();
    lenisRef.current = lenis;

    const loop = (time: number): void => {
      lenis.raf(time);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    carouselRef.current?.attachScroll(lenis);

    if (reduced) {
      loaderRef.current?.skip();
      enterLive();
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      carouselRef.current?.dispose();
      lenis.destroy();
      lenisRef.current = null;
      document.body.classList.remove("landing_body");
    };
  }, [enterLive]);

  const handleProgress = useCallback((p: number) => {
    loaderRef.current?.setProgress(p);
  }, []);

  const handleLoaded = useCallback(() => {
    if (enteredRef.current) return;
    const wait = Math.max(0, MIN_LOADER_MS - (performance.now() - bootRef.current));
    window.setTimeout(() => {
      void loaderRef.current?.playOutro().then(enterLive);
    }, wait);
  }, [enterLive]);

  useEffect(() => {
    bootRef.current = performance.now();
    const failsafe = window.setTimeout(handleLoaded, LOAD_FAILSAFE_MS);
    return () => {
      window.clearTimeout(failsafe);
    };
  }, [handleLoaded]);

  return (
    <>
      <HomeCarousel
        ref={carouselRef}
        works={works}
        onProgress={handleProgress}
        onAllLoaded={handleLoaded}
      />
      <LoaderOverlay ref={loaderRef} />
      <CustomCursor />
    </>
  );
}
