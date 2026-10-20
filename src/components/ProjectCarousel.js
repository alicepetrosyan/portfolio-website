import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import projects from '../data/projects.json';
import FolderCard from './FolderCard';
import Modal from './modal';
import TypingTitle from './TypingTitle';
import './ProjectCarousel.css';
import ArrowheadIcon from './ArrowheadIcon';
import useChromeFoldersEnabled from './chrome/useChromeFoldersEnabled';
import { windowFor } from '../utils/chromeFolderLogic';

// Only the WebGL folder canvas is lazy-loaded (it pulls in three.js). The rest
// of the carousel — section background, parallax image, title, overlays — is
// eager, so the backdrop and layout paint immediately on scroll while the 3D
// folders stream in behind the heavy chunk.
const ProjectsCanvasMount = lazy(() => import('./chrome/ProjectsCanvasMount'));

function rectByKey(rects, key) {
  if (!rects) return null;
  return rects.find((r) => r.key === key) || null;
}

// Invisible click target covering a folder's projected rect. The title + image
// are rendered in 3D on the folder itself; this makes the whole folder
// clickable: the active folder opens the modal, a neighbor navigates to it.
function FolderClickTarget({ project, rect, slot, onActivate, onOpen }) {
  if (!rect) return null;
  const isActive = slot === 'active';
  return (
    <button
      type="button"
      className="project-click-target"
      style={{
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
      }}
      onClick={isActive ? onOpen : onActivate}
      aria-label={isActive ? `Open ${project.title}` : `Go to ${project.title}`}
    />
  );
}

function ProjectCarousel() {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [tiltTarget, setTiltTarget] = useState(null);
  const [baseScale, setBaseScale] = useState(10);
  const [slotRects, setSlotRects] = useState(null);
  const pointerStart = useRef(null);
  const swiped = useRef(false);
  const sectionRef = useRef(null);
  const backgroundRef = useRef(null);
  const stageRef = useRef(null);

  const chromeEnabled = useChromeFoldersEnabled();

  useEffect(() => {
    const query = window.matchMedia('(max-width: 700px)');
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  // Parallax background (unchanged behavior).
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduceMotion.matches) return undefined;

    let frame = null;
    const update = () => {
      frame = null;
      const section = sectionRef.current;
      const background = backgroundRef.current;
      if (!section || !background) return;
      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const factor = 0.12;
      const sectionCenterOffset = rect.top + rect.height / 2 - viewportHeight / 2;
      const shift = -sectionCenterOffset * (1 - factor);
      const maxShift = rect.height * 0.28;
      const clamped = Math.max(-maxShift, Math.min(maxShift, shift));
      background.style.transform = `translate3d(0, ${clamped}px, 0)`;
    };
    const onScroll = () => {
      if (frame === null) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, []);

  // Derive the 3D base scale from the measured stage height so folders fit the
  // available vertical space and are never clipped (Requirement 4).
  useEffect(() => {
    if (!chromeEnabled) return undefined;
    const el = stageRef.current;
    if (!el) return undefined;
    const compute = () => {
      const h = el.clientHeight || 480;
      // The folder model (post-fit) spans ~0.1 units tall; scale with height so
      // folders fill the stage vertically. The ring radius scales with this
      // same baseScale (see ringRadiusFor), so a bigger scale makes the folders
      // bigger AND spreads the ring proportionally — they grow without clipping.
      setBaseScale(Math.max(26, Math.min(34, h / 13.5)));
    };
    compute();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [chromeEnabled]);

  // Pointer tilt for the active folder (desktop only). rAF-batched so we commit
  // at most ONE React state update per frame rather than one per pointermove
  // event (which can fire far more often than 60fps and re-render the carousel
  // each time). Only updates while the projects section is actually on screen.
  useEffect(() => {
    if (!chromeEnabled) return undefined;
    let frame = null;
    let pending = null;
    const commit = () => {
      frame = null;
      setTiltTarget(pending);
    };
    const onMove = (event) => {
      const section = sectionRef.current;
      if (section) {
        const rect = section.getBoundingClientRect();
        // Skip work when projects isn't in view — no point tilting an offscreen
        // folder (and it keeps the demand loop asleep).
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      }
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = (event.clientY / window.innerHeight) * 2 - 1;
      pending = { x: y * 0.18, y: x * 0.22 };
      if (frame === null) frame = window.requestAnimationFrame(commit);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [chromeEnabled]);

  const prev = useCallback(() => setIndex((i) => (i === 0 ? projects.length - 1 : i - 1)), []);
  const next = useCallback(() => setIndex((i) => (i === projects.length - 1 ? 0 : i + 1)), []);

  const handlePointerDown = (event) => {
    pointerStart.current = { x: event.clientX, y: event.clientY };
  };
  const handlePointerUp = (event) => {
    if (!pointerStart.current) return;
    const deltaX = event.clientX - pointerStart.current.x;
    const deltaY = event.clientY - pointerStart.current.y;
    pointerStart.current = null;
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;
    swiped.current = true;
    if (deltaX < 0) next();
    else prev();
  };
  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') prev();
    if (event.key === 'ArrowRight') next();
  };

  const openSelected = (project) => {
    if (!swiped.current) setSelected(project);
  };


  return (
    <section
      id="projects"
      className={`section projects-section ${chromeEnabled ? '' : 'is-flat-fallback'}`}
      ref={sectionRef}
    >
      <img
        ref={backgroundRef}
        className="projects-background-image"
        src="/assets/backgrounds/projects-background.jpg"
        alt=""
        aria-hidden="true"
        decoding="async"
      />
      <TypingTitle className="pixel-title projects-title" text="projects" />
      <div className="carousel">
        <button type="button" className="carousel-btn carousel-btn-prev" onClick={prev} aria-label="Previous project">
          <ArrowheadIcon className="carousel-arrow-icon" />
        </button>
        <div
          className="carousel-stage"
          ref={stageRef}
          role="region"
          aria-label="Project carousel. Swipe or use the arrow keys to browse projects."
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => { pointerStart.current = null; }}
          onClickCapture={(event) => {
            if (!swiped.current) return;
            event.preventDefault();
            event.stopPropagation();
            swiped.current = false;
          }}
          onKeyDown={handleKeyDown}
        >
          {chromeEnabled ? (
            <>
              <div className="carousel-canvas">
                <Suspense fallback={null}>
                  <ProjectsCanvasMount
                    stageRef={stageRef}
                    projects={projects}
                    index={index}
                    tiltTarget={tiltTarget}
                    baseScale={baseScale}
                    onRects={setSlotRects}
                  />
                </Suspense>
              </div>
              <div className="carousel-overlays">
                <FolderClickTarget
                  project={projects[windowFor(index, projects.length).prevIndex]}
                  rect={rectByKey(slotRects, 'prev')}
                  slot="prev"
                  onActivate={prev}
                />
                <FolderClickTarget
                  project={projects[index]}
                  rect={rectByKey(slotRects, 'active')}
                  slot="active"
                  onOpen={() => openSelected(projects[index])}
                />
                <FolderClickTarget
                  project={projects[windowFor(index, projects.length).nextIndex]}
                  rect={rectByKey(slotRects, 'next')}
                  slot="next"
                  onActivate={next}
                />
              </div>
            </>
          ) : (
            projects.map((project, i) => {
              const offset = i - index;
              const wrapped =
                offset < -Math.floor(projects.length / 2)
                  ? offset + projects.length
                  : offset > Math.floor(projects.length / 2)
                    ? offset - projects.length
                    : offset;
              const active = wrapped === 0;
              const distance = Math.abs(wrapped);
              return (
                <div
                  key={project.id}
                  className={`carousel-slide ${active ? 'is-active' : ''}`}
                  data-offset={wrapped}
                  aria-hidden={distance > 2}
                  style={{
                    opacity: distance > 2 ? 0 : 1,
                    visibility: distance > 2 ? 'hidden' : 'visible',
                    zIndex: 10 - distance,
                    pointerEvents: 'none',
                  }}
                  onClick={() => {
                    if (!active && !isMobile) setIndex(i);
                  }}
                >
                  <FolderCard project={project} active={active} onOpen={openSelected} />
                </div>
              );
            })
          )}
        </div>
        <button type="button" className="carousel-btn carousel-btn-next" onClick={next} aria-label="Next project">
          <ArrowheadIcon className="carousel-arrow-icon" />
        </button>
      </div>
      {selected && <Modal project={selected} closeModal={() => setSelected(null)} />}
    </section>
  );
}

export default ProjectCarousel;
