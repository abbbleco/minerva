"use client";

import { useEffect } from "react";

const INTERACTIVE_SELECTOR =
  "a, button, .cursor-none, .tag, .dropdown, .video-widget, .pill-wrapper, .clickable, .vs_swiper-nav-btn, .vs-slide_video-play-btn, .vs-slide_video-pause-btn, .vs-slide_video-controls, .services-page-review_card, .faq_list-item";

export default function CustomCursor() {
  useEffect(() => {
    const cursorDot = document.getElementById("cursorDot");
    const cursorInnerDot = document.getElementById("cursorInnerDot");
    if (!cursorDot || !cursorInnerDot) return;

    let mouseX = 0;
    let mouseY = 0;
    let dotX = 0;
    let dotY = 0;
    let innerX = 0;
    let innerY = 0;
    let raf = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const animateCursor = () => {
      dotX += (mouseX - dotX) * 0.12;
      dotY += (mouseY - dotY) * 0.12;
      cursorDot.style.left = dotX + "px";
      cursorDot.style.top = dotY + "px";

      innerX += (mouseX - innerX) * 0.5;
      innerY += (mouseY - innerY) * 0.5;
      cursorInnerDot.style.left = innerX + "px";
      cursorInnerDot.style.top = innerY + "px";

      raf = requestAnimationFrame(animateCursor);
    };

    const interactiveElements = document.querySelectorAll(INTERACTIVE_SELECTOR);
    const addHover = () => cursorDot.classList.add("hover");
    const removeHover = () => cursorDot.classList.remove("hover");
    interactiveElements.forEach((el) => {
      el.addEventListener("mouseenter", addHover);
      el.addEventListener("mouseleave", removeHover);
    });

    document.addEventListener("mousemove", onMouseMove);
    raf = requestAnimationFrame(animateCursor);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", onMouseMove);
      interactiveElements.forEach((el) => {
        el.removeEventListener("mouseenter", addHover);
        el.removeEventListener("mouseleave", removeHover);
      });
    };
  }, []);

  return (
    <>
      <div className="cursor-dot" id="cursorDot" />
      <div className="cursor-inner-dot" id="cursorInnerDot" />
    </>
  );
}