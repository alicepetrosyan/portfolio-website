/*
 * Shared WebGL canvas wrapper for a section. Mounts the r3f <Canvas> only when
 * the container is near the viewport (freeing the context otherwise), renders
 * on demand when visible / never when out of render range, and handles WebGL
 * context loss/restore without a page reload.
 *
 * Feature: chrome-3d-folders (Requirements 2.5–2.8, 2.10, 7.2)
 */
import { Suspense, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import useCanvasVisibility from '../../utils/useCanvasVisibility';

// Rendered inside <Canvas> so it can reach the gl domElement via the r3f store
// and attach context-loss listeners to the actual canvas element.
function ContextLossGuard({ onLost, onRestored }) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event) => {
      event.preventDefault(); // allow the context to be restored
      onLost?.();
    };
    const restored = () => onRestored?.();
    canvas.addEventListener('webglcontextlost', lost);
    canvas.addEventListener('webglcontextrestored', restored);
    return () => {
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('webglcontextrestored', restored);
    };
  }, [gl, onLost, onRestored]);
  return null;
}

function SectionCanvas({ containerRef, camera, children, className, visibilityOptions }) {
  const { visible, mounted } = useCanvasVisibility(containerRef, visibilityOptions);
  const [contextLost, setContextLost] = useState(false);

  // While the context is lost, pause the loop; resume on restore.
  const frameloop = contextLost ? 'never' : visible ? 'demand' : 'never';

  if (!mounted) return null;

  return (
    <Canvas
      className={className}
      camera={camera}
      dpr={[1, 1.25]}
      frameloop={frameloop}
      gl={{ alpha: true, powerPreference: 'high-performance' }}
    >
      <ContextLossGuard
        onLost={() => setContextLost(true)}
        onRestored={() => setContextLost(false)}
      />
      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  );
}

export default SectionCanvas;
