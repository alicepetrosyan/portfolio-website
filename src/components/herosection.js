import './herosection.css';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';

// Lazy-load the 3D chrome name so three.js / r3f / drei are split out of the
// main bundle. The hero's CSS gradient + background image paint immediately for
// a fast first paint; the chrome model streams in once its chunk arrives.
const TiltName = lazy(() => import('./TiltName'));

function HeroSection() {
  const sectionRef = useRef(null);
  // Once the hero has fully scrolled out of view we stop painting it entirely.
  // The hero is position:sticky at z-index 0, pinned behind every later
  // section; if a front section (projects/personal) is slow to paint its 3D
  // content, the still-painted hero can peek through. Hiding it when it is no
  // longer on screen removes it as a bleed-through source in ALL browsers
  // (independent of CSS scroll-timeline support). It is restored the moment it
  // scrolls back into view.
  const [past, setPast] = useState(false);

  useEffect(() => {
    // Drive hide/show off scroll DEPTH rather than IntersectionObserver on the
    // sticky element: when a below-the-fold section is still loading its lazy
    // chunk the layout can be shorter than expected, which left the observer
    // reporting the hero as "visible" even after the user scrolled to projects.
    // A scroll-position threshold is immune to that layout collapse.
    //
    // Only hide the hero once it is FULLY covered — i.e. after a whole viewport
    // of scroll, by which point the opaque about section (100vh) completely
    // overlaps it. Hiding earlier (mid-reveal) made the about background appear
    // to snap to the top, because the sticky hero it was sliding over vanished
    // partway through the reveal. A small hysteresis band (hide at 1.0vh, show
    // again at 0.9vh) prevents flicker right at the threshold.
    const onScroll = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      const vh = window.innerHeight || document.documentElement.clientHeight;
      setPast((prev) => (prev ? y > vh * 0.9 : y >= vh));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <section
      id="home"
      className="section hero-container"
      ref={sectionRef}
      style={past ? { visibility: 'hidden' } : undefined}
    >
      <div className="hero-inner">
        <div className="hero-liquid" aria-hidden="true">
          <img className="hero-background-image" src="/assets/backgrounds/hero-image.webp" alt="" />
        </div>
        <Suspense fallback={null}>
          <TiltName />
        </Suspense>
      </div>
    </section>
  );
}

export default HeroSection;
