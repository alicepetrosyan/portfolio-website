/*
 * Single source of truth for Desktop_Mode: chrome 3D folders render only when
 * the viewport is wide enough, the pointer is fine/hover, reduced motion is
 * off, and WebGL is available. Otherwise the flat fallback is used.
 *
 * Feature: chrome-3d-folders (Requirements 1.1–1.4, 1.6)
 */
import { useEffect, useState } from 'react';
import { chromeFoldersEnabled } from '../../utils/chromeFolderLogic';

// WebGL availability does not change at runtime, so probe once and cache.
let webglAvailableCache;
function isWebGLAvailable() {
  if (webglAvailableCache !== undefined) return webglAvailableCache;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    webglAvailableCache = Boolean(gl);
  } catch {
    webglAvailableCache = false;
  }
  return webglAvailableCache;
}

function compute() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return chromeFoldersEnabled({
    viewportNarrow: window.matchMedia('(max-width: 700px)').matches,
    hoverFine: window.matchMedia('(hover: hover) and (pointer: fine)').matches,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    webglAvailable: isWebGLAvailable(),
  });
}

function useChromeFoldersEnabled() {
  const [enabled, setEnabled] = useState(() => compute());

  useEffect(() => {
    const queries = [
      window.matchMedia('(max-width: 700px)'),
      window.matchMedia('(hover: hover) and (pointer: fine)'),
      window.matchMedia('(prefers-reduced-motion: reduce)'),
    ];
    const update = () => setEnabled(compute());
    update();
    queries.forEach((q) => q.addEventListener('change', update));
    window.addEventListener('resize', update);
    return () => {
      queries.forEach((q) => q.removeEventListener('change', update));
      window.removeEventListener('resize', update);
    };
  }, []);

  return enabled;
}

export default useChromeFoldersEnabled;
