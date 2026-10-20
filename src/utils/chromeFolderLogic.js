/*
 * Pure, framework-free logic for the chrome folder system. Extracted so each
 * piece can be property-tested without a live GPU or DOM.
 *
 * Feature: chrome-3d-folders
 */

/*
 * Desktop_Mode predicate (Requirements 1.1–1.4). Chrome renders iff the
 * viewport is not narrow AND the pointer is fine/hover AND reduced motion is
 * off AND WebGL is available.
 */
export function chromeFoldersEnabled({ viewportNarrow, hoverFine, reducedMotion, webglAvailable }) {
  return !viewportNarrow && hoverFine && !reducedMotion && webglAvailable;
}

/*
 * Circular 3-folder window (Requirements 3.2, 3.3, 3.10). Returns the previous,
 * active, and next indices wrapping around a list of `length` items.
 */
export function windowFor(activeIndex, length) {
  if (length <= 0) return { prevIndex: 0, activeIndex: 0, nextIndex: 0 };
  const a = ((activeIndex % length) + length) % length;
  return {
    prevIndex: (a - 1 + length) % length,
    activeIndex: a,
    nextIndex: (a + 1) % length,
  };
}

export const MIN_TITLE_FONT_PX = 12;

/*
 * Auto-fit a title's font size to the available width (Requirements 3.5, 3.6).
 * `measure(text, fontPx)` returns the rendered pixel width of `text` at that
 * size (injectable so this is testable without canvas). Shrinks from baseSize
 * down to a 12px floor; if the longest word still overflows at the floor,
 * returns the floor with `truncated: true`.
 */
export function fitTitle(text, availableWidth, baseSize, measure) {
  if (!text || availableWidth <= 0 || !baseSize) {
    return { fontSize: baseSize || MIN_TITLE_FONT_PX, truncated: false };
  }
  const longestWord = text
    .split(/\s+/)
    .reduce((longest, word) => (measure(word, baseSize) > measure(longest, baseSize) ? word : longest), '');

  const widthAtBase = measure(longestWord, baseSize);
  if (widthAtBase <= availableWidth) {
    return { fontSize: baseSize, truncated: false };
  }
  // Scale down proportionally, clamped to the floor.
  const scaled = baseSize * (availableWidth / widthAtBase);
  if (scaled >= MIN_TITLE_FONT_PX) {
    return { fontSize: scaled, truncated: false };
  }
  // Still overflows at the floor: hold the floor and signal truncation.
  const fitsAtFloor = measure(longestWord, MIN_TITLE_FONT_PX) <= availableWidth;
  return { fontSize: MIN_TITLE_FONT_PX, truncated: !fitsAtFloor };
}

/*
 * Fit a model to the available space, scaling both down and up (Requirements
 * 4.1–4.3). Guarantees scaledHeight <= stageHeight.
 */
export function fitScale(stageHeight, modelHeight, { widthLimit, modelWidth } = {}) {
  if (!modelHeight || modelHeight <= 0) return 1;
  let scale = stageHeight / modelHeight;
  if (widthLimit && modelWidth && modelWidth > 0) {
    scale = Math.min(scale, widthLimit / modelWidth);
  }
  return scale;
}

/*
 * Which face a flipping folder shows at a given rotation progress
 * (Requirements 5.6, 5.7). Shows the starting face until the π/2 midpoint,
 * then the target face. `progress` is the current rotation in radians [0, π].
 */
export function faceFor(progress, fromFace, toFace) {
  return progress < Math.PI / 2 ? fromFace : toFace;
}
