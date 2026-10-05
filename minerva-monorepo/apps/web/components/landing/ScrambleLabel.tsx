"use client";

import { useRef } from "react";
import { scrambleText } from "./scramble";

interface ScrambleLabelProps {
  text: string;
}

export function ScrambleLabel({ text }: ScrambleLabelProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const timeoutsRef = useRef<number[]>([]);

  const onEnter = (): void => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    const el = ref.current;
    if (!el) return;
    timeoutsRef.current = scrambleText(el.textContent ?? "", text, (t) => {
      if (ref.current) ref.current.textContent = t;
    });
  };

  return (
    <span className="label" ref={ref} onMouseEnter={onEnter}>
      {text}
    </span>
  );
}
