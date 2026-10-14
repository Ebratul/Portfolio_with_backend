"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const TYPE_MS = 75;
const ERASE_MS = 38;
const HOLD_MS = 1700;
const GAP_MS = 350;

/** Types and erases each role in turn. Static (first role) under prefers-reduced-motion. */
export function TypingText({ words }: { words: string[] }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [erasing, setErasing] = useState(false);

  useEffect(() => {
    if (reduce || words.length === 0) return;
    const word = words[index % words.length] ?? "";
    let delay: number;
    if (!erasing && text === word) delay = HOLD_MS;
    else if (erasing && text === "") delay = GAP_MS;
    else delay = erasing ? ERASE_MS : TYPE_MS;

    const t = setTimeout(() => {
      if (!erasing && text === word) setErasing(true);
      else if (erasing && text === "") {
        setErasing(false);
        setIndex((i) => (i + 1) % words.length);
      } else setText(erasing ? word.slice(0, text.length - 1) : word.slice(0, text.length + 1));
    }, delay);
    return () => {
      clearTimeout(t);
    };
  }, [text, erasing, index, words, reduce]);

  if (reduce) return <span>{words[0]}</span>;
  return (
    <>
      <span className="sr-only">{words.join(", ")}</span>
      <span aria-hidden="true">
        {text}
        <span className="animate-blink ml-0.5 inline-block w-0.5 bg-current align-middle" style={{ height: "1em" }} />
      </span>
    </>
  );
}
