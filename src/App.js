import './App.css';
import { lazy, Suspense, useEffect } from 'react';
import Navbar from './components/navbar';
import HeroSection from './components/herosection';
import ProjectCarousel from './components/ProjectCarousel';
import ScrollArrow from './components/ScrollArrow';
import { FOLDER_MODEL_URL } from './utils/modelPaths';
import projects from './data/projects.json';

// Code-split the below-the-fold sections. The hero is kept eager because it is
// above the fold and must paint immediately; everything after it (which pulls
// in three.js / r3f / drei for the projects + personal 3D canvases, plus the
// contact PDFs) is loaded on demand so it does not block first paint or inflate
// the initial bundle.
//
// Each import is a named factory so it can be used BOTH by React.lazy and by
// the idle prefetch below (webpack dedupes, so calling it twice just warms the
// chunk cache).
// ProjectCarousel is now EAGER: its three.js canvas was split out into a lazy
// child (ProjectsCanvasMount), so the component itself is lightweight DOM. Being
// eager means its section background (parallax image) and title paint the
// instant the user scrolls, while the heavy 3D folder chunk streams in behind.
const importAbout = () => import('./components/about');
const importPersonal = () => import('./components/PersonalSection');
const importContact = () => import('./components/Contact');
// The projects WebGL canvas chunk, prefetched during idle (see below).
const importProjectsCanvas = () => import('./components/chrome/ProjectsCanvasMount');

const About = lazy(importAbout);
const PersonalSection = lazy(importPersonal);
const Contact = lazy(importContact);

// Opaque, full-height placeholder shown while a section's lazy chunk downloads.
// It carries the real section's `id` and reserves a full viewport of height so
// (a) it covers the pinned hero behind it (no bleed-through during the load),
// and (b) in-page anchor links (#about/#projects/...) resolve and scroll to the
// right place even before the chunk has mounted. Matches the page background so
// the swap to the real section is invisible.
function SectionFallback({ id }) {
  return <div id={id} className="section section-fallback" aria-hidden="true" />;
}

// Warm the below-the-fold chunks (and the folder 3D model) during browser idle
// time, AFTER the hero has painted. This means that by the time the visitor
// scrolls to Projects/Personal, the three.js code and folder.glb are already in
// cache, so the 3D folders render immediately instead of popping in after a
// download delay. Prefetching on idle keeps it off the critical first-paint
// path. Ordered Projects-first since it is the first 3D section encountered.
function usePrefetchSections() {
  useEffect(() => {
    let cancelled = false;
    const idle =
      window.requestIdleCallback || ((cb) => window.setTimeout(() => cb({ timeRemaining: () => 0 }), 1));
    const cancelIdle = window.cancelIdleCallback || window.clearTimeout;

    const handle = idle(() => {
      if (cancelled) return;
      // Prefetch the JS chunks (dedupes with the eventual lazy mount). The
      // projects 3D canvas chunk is warmed first since Projects is the first
      // 3D section the visitor reaches.
      importProjectsCanvas();
      importPersonal();
      importAbout();
      importContact();
      // Warm the folder GLB and the project cover images into cache so, by the
      // time Projects scrolls in, the parallax + folder cover textures are
      // ready even though the folder model itself may still be arriving. Image
      // decode is kicked off via the Image() constructor (also populates the
      // browser's image cache that three's TextureLoader reuses). All
      // low-priority and failure-safe.
      const warmImage = (url) => {
        if (!url) return;
        const img = new Image();
        img.decoding = 'async';
        img.src = url;
      };
      projects.forEach((proj) => warmImage(proj.coverWebp || proj.coverImage));
      try {
        fetch(FOLDER_MODEL_URL, { cache: 'force-cache' }).catch(() => {});
      } catch {
        /* no-op */
      }
    });

    return () => {
      cancelled = true;
      try {
        cancelIdle(handle);
      } catch {
        /* no-op */
      }
    };
  }, []);
}

function App() {
  usePrefetchSections();

  return (
    <div className="app-shell">
      <Navbar />
      <main>
        <HeroSection />
        <Suspense fallback={<SectionFallback id="about" />}>
          <About />
        </Suspense>
        <ProjectCarousel />
        <Suspense fallback={<SectionFallback id="personal" />}>
          <PersonalSection />
        </Suspense>
        <Suspense fallback={<SectionFallback id="contact" />}>
          <Contact />
        </Suspense>
      </main>
      <ScrollArrow />
    </div>
  );
}

export default App;
