// ─── UTILITY: Imperial Measurement System ───────────────────────────────────
// Formatter adopted from Layout_CR27's formatter.js — map-based fraction lookup.
// Parser adopted from Layout_CR27's MeasurementParser.js — curly-quote normalization,
// two-phase architecture. Keeps null-return for unparseable input.

const FRAC_MAP = { "0.125": "1/8", "0.250": "1/4", "0.375": "3/8", "0.500": "1/2", "0.625": "5/8", "0.750": "3/4", "0.875": "7/8" };

function getFraction(decimal) {
  return FRAC_MAP[Number(decimal.toFixed(3)).toFixed(3)] || "";
}

function roundToEighth(v) { return Math.round(v * 8) / 8; }

function formatFeetInches(inches) {
  const rounded = roundToEighth(inches);
  const neg = rounded < 0;
  const abs = Math.abs(rounded);
  const feet = Math.floor(abs / 12);
  const remainder = abs % 12;
  const whole = Math.floor(remainder);
  const frac = getFraction(remainder - whole);
  const sign = neg ? "-" : "";
  if (feet === 0) {
    if (whole === 0 && !frac) return `${sign}0"`;
    if (frac && whole > 0) return `${sign}${whole}" ${frac}`;
    if (frac) return `${sign}${frac}"`;
    return `${sign}${whole}"`;
  }
  if (whole === 0 && !frac) return `${sign}${feet}'`;
  if (frac && whole > 0) return `${sign}${feet}' ${whole}" ${frac}`;
  if (frac) return `${sign}${feet}' ${frac}"`;
  return `${sign}${feet}' ${whole}"`;
}

function formatTotal(inches) {
  const rounded = roundToEighth(Math.abs(inches));
  const whole = Math.floor(rounded);
  const frac = getFraction(rounded - whole);
  const sign = inches < 0 ? "-" : "";
  if (frac && whole > 0) return `${sign}${whole}" ${frac}`;
  if (frac) return `${sign}${frac}"`;
  return `${sign}${whole}"`;
}

function decToImperial(decimalInches) {
  if (decimalInches == null || isNaN(decimalInches)) return { ft: 0, inch: 0, fracIdx: 0, display: '0"', displayWithTotal: '0" (0")' };
  const rounded = roundToEighth(decimalInches);
  const abs = Math.abs(rounded);
  const ft = Math.floor(abs / 12);
  const remainder = abs % 12;
  const inch = Math.floor(remainder);
  const fracDecimal = remainder - inch;
  const fracStr = getFraction(fracDecimal);
  const fracIdx = fracStr ? Math.round(fracDecimal * 8) : 0;
  const display = formatFeetInches(decimalInches);
  const total = formatTotal(decimalInches);
  return { ft, inch, fracIdx, display, displayWithTotal: `${display} (${total})` };
}

function parseInchPortion(text) {
  const cleaned = text.trim();
  if (!cleaned) return null;
  if (/^-?\d+(\.\d+)?$/.test(cleaned)) return Number(cleaned) || 0;
  const wholeFrac = cleaned.match(/^(-?\d+)[\s\-]+(\d+)\/(\d+)$/);
  if (wholeFrac) return (Number(wholeFrac[1]) || 0) + (Number(wholeFrac[2]) || 0) / (Number(wholeFrac[3]) || 1);
  const fracOnly = cleaned.match(/^(-?\d+)\/(\d+)$/);
  if (fracOnly) return (Number(fracOnly[1]) || 0) / (Number(fracOnly[2]) || 1);
  const parts = cleaned.split(/\s+/);
  if (parts.length === 2 && parts[1] && parts[1].includes("/")) {
    const whole = Number(parts[0]) || 0;
    const fp = parseInchPortion(parts[1]);
    if (fp !== null) return whole + fp;
  }
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}

function parseImperialInput(str) {
  if (!str || str.trim() === "") return null;
  // Normalize curly/smart quotes (from Layout_CR27)
  const text = str.replace(/[\u2032\u2018\u2019\u0060]/g, "'").replace(/[\u2033\u201C\u201D]/g, '"').replace(/\s+/g, " ").trim();
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text) || 0;
  let feet = 0, inches = 0;
  const feetMatch = text.match(/(-?\d+(?:\.\d+)?)\s*'/);
  if (feetMatch) feet = Number(feetMatch[1]) || 0;
  let inchText;
  if (feetMatch) {
    const fi = text.indexOf("'");
    inchText = text.slice(fi + 1).replace(/"/g, "").trim();
  } else {
    inchText = text.replace(/"/g, "").trim();
  }
  if (inchText) {
    const parsed = parseInchPortion(inchText);
    if (parsed === null && !feetMatch) return null;
    inches = parsed ?? 0;
  }
  const result = feet * 12 + inches;
  return result === 0 && text !== "0" && !feetMatch ? null : result;
}
