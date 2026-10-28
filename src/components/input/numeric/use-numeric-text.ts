import { useState } from "react";

/**
 * Keeps only digits, a single leading "-", and a single ".", so typing "-1.5"
 * digit-by-digit never gets characters silently dropped mid-entry.
 */
function sanitize(raw: string): string {
  let out = "";
  let hasDot = false;

  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    if (char === "-" && i === 0) {
      out += char;
    } else if (char === "." && !hasDot) {
      out += char;
      hasDot = true;
    } else if (char >= "0" && char <= "9") {
      out += char;
    }
  }

  return out;
}

function clamp(value: number, min?: number, max?: number): number {
  if (min !== undefined && value < min) return min;
  if (max !== undefined && value > max) return max;
  return value;
}

/**
 * Buffers the raw typed text separately from the numeric `value`. A
 * TextInput controlled directly by `String(value)` can't represent
 * in-progress input like "1." or a bare "-" — they'd parse to a number,
 * re-render back to "1"/"", and the trailing character the user just typed
 * would vanish. Only committing valid numbers (via onChange) while echoing
 * whatever was actually typed avoids that.
 */
export default function useNumericText(
  value: number | null,
  onChange: (value: number | null) => void,
  min?: number,
  max?: number,
) {
  const [text, setText] = useState(value === null ? "" : String(value));

  // Resync the displayed text when `value` changes from outside (a reset,
  // another field driving it, ...) — done during render, React's documented
  // way to adjust state from a prop change without an extra render pass from
  // an effect. https://react.dev/learn/you-might-not-need-an-effect
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    const parsedText = text === "" || text === "-" ? null : Number(text);
    if (parsedText !== value) {
      setText(value === null ? "" : String(value));
    }
  }

  function onChangeText(raw: string) {
    const sanitized = sanitize(raw);
    setText(sanitized);

    if (sanitized === "" || sanitized === "-" || sanitized.endsWith(".")) {
      if (sanitized === "") onChange(null);
      return;
    }

    const parsed = Number(sanitized);
    if (!Number.isNaN(parsed)) {
      onChange(clamp(parsed, min, max));
    }
  }

  return { text, onChangeText };
}
