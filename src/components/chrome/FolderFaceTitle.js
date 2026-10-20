/*
 * Renders a project title as a transparent texture on a plane that is part of
 * the chrome folder's face, so the title tilts, slides, and scales WITH the
 * folder (it is a child of the folder's animated group). Text auto-shrinks and
 * wraps to up to three lines to fit the folder's tab.
 *
 * The canvas and the 3D plane share the same aspect ratio, and text is measured
 * in canvas pixels that map proportionally to the plane width, so wrapping is
 * accurate on the model surface.
 *
 * Feature: chrome-3d-folders (Requirements 3.4, 3.5, 3.6)
 */
import { useMemo, useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { CanvasTexture, SRGBColorSpace } from 'three';

// Canvas pixel dimensions. The plane that uses this texture is sized with the
// SAME width:height ratio so text is not distorted.
const CANVAS_W = 512;
const CANVAS_H = 224;
const PADDING = 16;
const MAX_LINES = 3;
// Default label font/colour (projects titles). Callers can override per folder
// section — e.g. the personal number uses white Comfortaa.
const DEFAULT_FONT_FAMILY = '"DotGothic16"';
const DEFAULT_COLOR = '#000000';
// Max font size (canvas px) for a title rendered on 1, 2, or 3 lines.
const SIZE_CAP_BY_LINES = [60, 48, 40];

function wrapToLines(ctx, text, maxWidth, maxLines) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (ctx.measureText(trial).width <= maxWidth || !current) {
      current = trial;
    } else {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) return null;
    }
  }
  if (current) lines.push(current);
  if (lines.length > maxLines) return null;
  if (lines.some((l) => ctx.measureText(l).width > maxWidth)) return null;
  return lines;
}

function makeTitleTexture(text, { bold = false, color = DEFAULT_COLOR, fontFamily = DEFAULT_FONT_FAMILY } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H); // transparent background

  // Generous right margin so wrapping/shrinking triggers well before text
  // reaches the plane's right edge (prevents overflow past the tab).
  // Text may only use ~half the plane: the tab ends around the middle of the
  // folder face, and anything past it is occluded by the tab's raised rim.
  const maxWidth = CANVAS_W * 0.52 - PADDING;
  const maxHeight = CANVAS_H - PADDING;
  const maxFont = 72;
  const minFont = 30;
  const lineFactor = 1.12;
  const font = (s) => `${s}px ${fontFamily}, monospace`;

  // Largest font (down to the floor) at which the title fits in up to
  // MAX_LINES lines, both horizontally and vertically.
  let chosen = null;
  for (let s = maxFont; s >= minFont; s -= 2) {
    ctx.font = font(s);
    const lines = wrapToLines(ctx, text, maxWidth, MAX_LINES);
    // Wrapped titles get a smaller cap so 2–3 line labels stay on the tab.
    if (lines && s <= SIZE_CAP_BY_LINES[lines.length - 1] && lines.length * s * lineFactor <= maxHeight) {
      chosen = { size: s, lines };
      break;
    }
  }
  // Floor fallback: wrap greedily to MAX_LINES at the min font and ellipsize
  // whatever is left (also hard-truncates any single over-long word).
  if (!chosen) {
    ctx.font = font(minFont);
    const fit = (str) => {
      let out = str;
      while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) out = out.slice(0, -1);
      return `${out}…`;
    };
    const lines = [''];
    let truncated = false;
    for (const w of text.split(/\s+/)) {
      const li = lines.length - 1;
      const trial = lines[li] ? `${lines[li]} ${w}` : w;
      if (ctx.measureText(trial).width <= maxWidth) lines[li] = trial;
      else if (!lines[li]) lines[li] = fit(w);
      else if (lines.length < MAX_LINES) lines.push(ctx.measureText(w).width <= maxWidth ? w : fit(w));
      else {
        truncated = true;
        break;
      }
    }
    if (truncated) lines[lines.length - 1] = fit(lines[lines.length - 1]);
    chosen = { size: minFont, lines };
  }

  ctx.font = font(chosen.size);
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const lineHeight = chosen.size * lineFactor;
  // Top-aligned so extra lines grow downward from the tab, not upward off it.
  let y = PADDING + lineHeight / 2;
  // When `bold`, thicken each glyph by stroking its outline in the fill colour
  // (single-weight webfonts can't give a real bold, so this fakes a heavier
  // label). Otherwise render the plain regular-weight fill.
  if (bold) {
    ctx.strokeStyle = color;
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(0.75, chosen.size * 0.03);
  }
  for (const line of chosen.lines) {
    if (bold) ctx.strokeText(line, PADDING, y);
    ctx.fillText(line, PADDING, y);
    y += lineHeight;
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function FolderFaceTitle({ text, face, bold = false, color = DEFAULT_COLOR, fontFamily = DEFAULT_FONT_FAMILY }) {
  const invalidate = useThree((state) => state.invalidate);
  // Re-measure once the webfont is ready; measuring with the fallback font
  // gives the wrong widths and lets text overflow the tab.
  const [fontReady, setFontReady] = useState(
    () => typeof document === 'undefined' || !document.fonts || document.fonts.check(`32px ${fontFamily}`)
  );
  useEffect(() => {
    if (fontReady || !document.fonts) return undefined;
    let alive = true;
    document.fonts.load(`32px ${fontFamily}`).finally(() => alive && setFontReady(true));
    return () => {
      alive = false;
    };
  }, [fontReady, fontFamily]);
  const texture = useMemo(
    () => makeTitleTexture(text, { bold, color, fontFamily }),
    [text, bold, color, fontFamily, fontReady] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    invalidate();
    return () => texture.dispose();
  }, [texture, invalidate]);

  // Plane confined to the tab region (upper-left of the folder face), with the
  // SAME aspect ratio as the canvas so text is not stretched. Smaller + higher
  // so the title reads as a label on the tab and does not cover the image.
  const planeW = face.width * 0.58;
  const planeH = planeW * (CANVAS_H / CANVAS_W);
  // Left-aligned on the tab, pinned to the very top edge of the folder face so
  // the title sits ON the tab (higher), inset from the left so the first
  // characters never clip on the angled side folders.
  const x = -face.width * 0.5 + planeW * 0.5 + face.width * 0.15;
  const y = face.height * 0.5 - planeH * 0.5 + face.height * 0.02;

  return (
    <mesh position={[x, y, 0.003]}>
      <planeGeometry args={[planeW, planeH]} />
      <meshBasicMaterial map={texture} transparent toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

export default FolderFaceTitle;
