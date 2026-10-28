// Plain JS so brand configuration can also be loaded by Node tools.
const source = require("../../../assets/brand/brand.json");

/** Optional public provider URLs, shared by native maps and the web CSP. */
function httpsUrl(key, value, mustContain = []) {
  if (value === undefined || value === "") return undefined;
  if (typeof value !== "string" || !/^https:\/\/\S+$/.test(value.trim())) {
    throw new Error(`Brand setting ${key} must be an https:// URL`);
  }
  const normalized = value.trim();
  for (const placeholder of mustContain) {
    if (!normalized.includes(placeholder)) {
      throw new Error(`Brand setting ${key} must contain ${placeholder}`);
    }
  }
  return normalized;
}

if (
  source.maps !== undefined &&
  (source.maps === null ||
    typeof source.maps !== "object" ||
    Array.isArray(source.maps))
) {
  throw new Error("Brand setting maps must be an object");
}

// Native launch surfaces use unambiguous 3- or 6-digit RGB colors.
function color(key, value) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized)) {
    throw new Error(`Brand setting ${key} must be a 3- or 6-digit hex colour`);
  }
  return normalized;
}

module.exports = {
  colors: {
    iconBackground: color(
      "colors.iconBackground",
      source.colors?.iconBackground,
    ),
    splashBackground: color(
      "colors.splashBackground",
      source.colors?.splashBackground,
    ),
    splashBackgroundDark:
      source.colors?.splashBackgroundDark === undefined ||
      source.colors.splashBackgroundDark === ""
        ? undefined
        : color(
            "colors.splashBackgroundDark",
            source.colors.splashBackgroundDark,
          ),
  },
  mapTilesUrl: httpsUrl("maps.tilesUrl", source.maps?.tilesUrl),
  mapGlyphsUrl: httpsUrl("maps.glyphsUrl", source.maps?.glyphsUrl, [
    "{fontstack}",
    "{range}",
  ]),
};
