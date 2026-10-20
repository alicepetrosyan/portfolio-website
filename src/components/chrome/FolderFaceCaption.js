/*
 * Renders a photo caption as a transparent texture on a plane that is part of a
 * personal chrome folder's BACK face, so the caption flips in with the folder
 * (it is a child of the folder's animated group). Text wraps to multiple lines
 * and auto-shrinks to fit the folder body, mirroring the front image's framing.
 *
 * Feature: chrome-3d-folders (Requirement 5.6, 5.7)
 */
import { useMemo, useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { CanvasTexture, SRGBColorSpace } from 'three';

// Canvas is square so the caption shares the body square's aspect (no stretch).
const CANVAS = 512;
const PADDING = 48;
const MAX_LINES = 5;
const FONT_FAMILY = '"Comfortaa"';

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

function makeCaptionTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS;
  canvas.height = CANVAS;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, CANVAS, CANVAS);

  const maxWidth = CANVAS - PADDING * 2;
  const maxHeight = CANVAS - PADDING * 2;
  const maxFont = 72;
  const minFont = 28;
  const lineFactor = 1.3;
  const font = (s) => `${s}px ${FONT_FAMILY}, monospace`;

  // Largest font (down to the floor) at which the caption fits in up to
  // MAX_LINES lines, both horizontally and vertically.
  let chosen = null;
  for (let s = maxFont; s >= minFont; s -= 2) {
    ctx.font = font(s);
    const lines = wrapToLines(ctx, text, maxWidth, MAX_LINES);
    if (lines && lines.length * s * lineFactor <= maxHeight) {
      chosen = { size: s, lines };
      break;
    }
  }
  if (!chosen) {
    ctx.font = font(minFont);
    chosen = { size: minFont, lines: wrapToLines(ctx, text, maxWidth, MAX_LINES) || [text] };
  }

  ctx.font = font(chosen.size);
  ctx.fillStyle = '#ffffff'; // pure white
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // A very light outline stroke in the fill colour thickens the stems just
  // enough to read clearly on the chrome without turning bold/blobby.
  ctx.strokeStyle = '#ffffff';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(0.75, chosen.size * 0.03);

  const lineHeight = chosen.size * lineFactor;
  const blockHeight = chosen.lines.length * lineHeight;
  let y = CANVAS / 2 - blockHeight / 2 + lineHeight / 2;
  for (const line of chosen.lines) {
    ctx.strokeText(line, CANVAS / 2, y);
    ctx.fillText(line, CANVAS / 2, y);
    y += lineHeight;
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function FolderFaceCaption({ text, face, inset = 0.16, lift = 0 }) {
  const invalidate = useThree((state) => state.invalidate);
  const [fontReady, setFontReady] = useState(
    () => typeof document === 'undefined' || !document.fonts || document.fonts.check(`32px ${FONT_FAMILY}`)
  );
  useEffect(() => {
    if (fontReady || !document.fonts) return undefined;
    let alive = true;
    document.fonts.load(`32px ${FONT_FAMILY}`).finally(() => alive && setFontReady(true));
    return () => {
      alive = false;
    };
  }, [fontReady]);
  const texture = useMemo(() => makeCaptionTexture(text), [text, fontReady]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    invalidate();
    return () => texture.dispose();
  }, [texture, invalidate]);

  // Match the front image's square framing so the caption occupies the same
  // body cavity (below the tab) as the photo it describes.
  const TAB_FRACTION = 0.14;
  const bodyTop = face.height * 0.5 - face.height * TAB_FRACTION;
  const bodyBottom = -face.height * 0.5 + face.height * inset;
  const bodyHeight = bodyTop - bodyBottom;
  const bodyWidth = face.width * (1 - inset * 2);
  const side = Math.min(bodyWidth, bodyHeight);
  const centerY = (bodyTop + bodyBottom) / 2 - face.height * lift;

  return (
    <mesh position={[0, centerY, 0.003]}>
      <planeGeometry args={[side, side]} />
      <meshBasicMaterial map={texture} transparent toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

export default FolderFaceCaption;
