import { useEffect, useRef, useState } from 'react';
import './ScrollArrow.css';
import ArrowheadIcon from './ArrowheadIcon';
import { SECTIONS, getActiveSectionIndex, scrollToSection } from '../utils/scroll';

function ScrollArrow() {
  const arrowRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [overProjects, setOverProjects] = useState(false);
  const [overHero, setOverHero] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setIndex((current) => {
        const next = getActiveSectionIndex();
        return next === current ? current : next;
      });
      // Switch the arrow color only while its rendered box actually overlaps a
      // dark-backdrop section, so the change lines up with what sits behind it.
      const arrow = arrowRef.current;
      const box = arrow ? arrow.getBoundingClientRect() : null;

      const projects = document.getElementById('projects');
      let onProjects = false;
      if (projects && box) {
        const section = projects.getBoundingClientRect();
        onProjects = box.top < section.bottom && box.bottom > section.top;
      }
      setOverProjects((current) => (current === onProjects ? current : onProjects));

      // The hero has a dark backdrop too (and is pinned to the viewport bottom),
      // so light the arrow while it overlaps the hero.
      const hero = document.getElementById('home');
      let onHero = false;
      if (hero && box) {
        const section = hero.getBoundingClientRect();
        onHero = box.top < section.bottom && box.bottom > section.top;
      }
      setOverHero((current) => (current === onHero ? current : onHero));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const isLast = index >= SECTIONS.length - 1;
  const nextId = isLast ? SECTIONS[0] : SECTIONS[index + 1];

  return (
    <button
      ref={arrowRef}
      type="button"
      className={`scroll-arrow ${isLast ? 'scroll-arrow-up' : ''} ${overProjects ? 'scroll-arrow-projects' : ''} ${overHero ? 'scroll-arrow-hero' : ''}`}
      onClick={() => scrollToSection(nextId)}
      aria-label={isLast ? 'Scroll to top' : 'Scroll to next section'}
    >
      <ArrowheadIcon className="scroll-arrow-glyph" />
    </button>
  );
}

export default ScrollArrow;
