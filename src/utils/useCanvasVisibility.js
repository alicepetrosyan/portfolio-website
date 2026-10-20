import { useEffect, useRef, useState } from 'react';

/**
 * Tracks whether a container is near/within the viewport so WebGL canvases can
 * both pause rendering and fully unmount when far off-screen.
 *
 * Returns:
 *  - visible: within (or very close to) the viewport. Use to drive the render
 *    loop (frameloop demand vs never).
 *  - mounted: within a larger margin. Use to decide whether to mount the
 *    <Canvas> at all. Keeping a wider margin than `visible` means the context
 *    is recreated slightly before it scrolls into view, avoiding a visible pop.
 */
function useCanvasVisibility(containerRef, { mountMargin = '600px', renderMargin = '120px' } = {}) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Keep the latest margins without re-subscribing the observers each render.
  const margins = useRef({ mountMargin, renderMargin });
  margins.current = { mountMargin, renderMargin };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      setMounted(true);
      return undefined;
    }

    const renderObserver = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: margins.current.renderMargin }
    );
    const mountObserver = new IntersectionObserver(
      ([entry]) => setMounted(entry.isIntersecting),
      { rootMargin: margins.current.mountMargin }
    );

    renderObserver.observe(container);
    mountObserver.observe(container);

    return () => {
      renderObserver.disconnect();
      mountObserver.disconnect();
    };
  }, [containerRef]);

  return { visible, mounted };
}

export default useCanvasVisibility;
