type LogMethod = (message: string, ...values: unknown[]) => void;

export type Logger = {
  log: LogMethod;
  warn: LogMethod;
  error: LogMethod;
  success: LogMethod;
  out: LogMethod;
  in: LogMethod;
  failed: LogMethod;
};

type LogType = keyof Logger;

type Badge = {
  /** Carries the level on its own where CSS doesn't reach — see below. */
  icon: string;
  label: string;
  color: string;
};

/**
 * One entry per level: the emoji that survives anywhere, the word that reads
 * in a crowded console, and the badge colour.
 *
 * The emoji isn't decoration. `%c` styling is only understood by
 * browser-style consoles — React Native DevTools and the web — and prints
 * literally in the Metro terminal, where the icon is then the only thing
 * telling one level from another at a glance.
 *
 * Colours are darkened from the obvious hues so white text clears WCAG's 4.5:1
 * on every badge; the plain yellow and green they replace sat near 2:1.
 */
const BADGES: Record<LogType, Badge> = {
  log: { icon: "💬", label: "LOG", color: "#0079ff" },
  warn: { icon: "⚠️", label: "WARN", color: "#b45309" },
  error: { icon: "⛔", label: "ERROR", color: "#9f1239" },
  success: { icon: "✅", label: "SUCCESS", color: "#38ca3a" },
  out: { icon: "➡️", label: "OUT", color: "#0079ff" },
  in: { icon: "⬅️", label: "IN", color: "#38ca3a" },
  failed: { icon: "💥", label: "FAILED", color: "#9f1239" },
};

const RESET_STYLE =
  "color: inherit; background: transparent; font-weight: normal;";

function badgeStyle(color: string): string {
  return [
    `background: ${color}`,
    "color: #ffffff",
    "font-weight: 700",
    "border-radius: 4px",
    "padding: 2px 6px",
    "letter-spacing: 0.4px",
  ].join("; ");
}

export function createLogger(enabled: boolean): Logger {
  const methods = (Object.keys(BADGES) as LogType[]).map((type) => {
    const { icon, label, color } = BADGES[type];

    const method: LogMethod = (message, ...values) => {
      if (!enabled) return;

      console.log(
        `%c ${icon} ${label} %c`,
        badgeStyle(color),
        RESET_STYLE,
        message,
        ...values,
      );
    };

    return [type, method] as const;
  });

  return Object.fromEntries(methods) as Logger;
}

const logger = createLogger(__DEV__);

export default logger;

/** Field names whose values never reach a log, wherever they're nested. */
const SENSITIVE_KEY =
  /password|token|secret|otp|code|authorization|cookie|card|cvv/i;

/** A JSON Web Token anywhere in a string: three base64url parts, header first. */
const JWT = /eyJ[\w-]*\.[\w-]+\.[\w-]*/g;

/** `?token=…` and the like in a URL's query. */
const SENSITIVE_PARAM =
  /([?&][^=&#]*(?:password|token|secret|otp|code|authorization|cookie|card|cvv)[^=&#]*=)[^&#]*/gi;

const REDACTED = "[redacted]";

/** Deep enough for any request body; deeper is more likely a cycle. */
const MAX_DEPTH = 8;

function isPlainObject(value: object): boolean {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * A copy of `value` that is safe to log: sensitive fields become
 * `"[redacted]"`, JWTs inside strings are masked, and anything that isn't
 * plain data — `FormData`, a `Blob`, a class instance — is named rather
 * than printed, since what's inside it can't be checked.
 *
 * For values that come from outside the code — request and response
 * bodies, query params. The original is never modified.
 *
 * @example
 * redact({ email: "a@b.c", password: "hunter2" });
 * // { email: "a@b.c", password: "[redacted]" }
 */
export function redact(value: unknown, depth = 0): unknown {
  if (typeof value === "string") return value.replace(JWT, REDACTED);
  if (typeof value !== "object" || value === null) return value;
  if (depth >= MAX_DEPTH) return "[…]";

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1));
  }
  if (!isPlainObject(value)) {
    return `[${value.constructor?.name ?? "object"}]`;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      SENSITIVE_KEY.test(key) ? REDACTED : redact(item, depth + 1),
    ]),
  );
}

/** A URL with sensitive query values and any JWT masked. */
export function redactUrl(url: string): string {
  return url.replace(SENSITIVE_PARAM, `$1${REDACTED}`).replace(JWT, REDACTED);
}
