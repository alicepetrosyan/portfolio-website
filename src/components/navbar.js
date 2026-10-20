import React, { useEffect, useState } from 'react';
import './navbar.css';
import { SECTIONS, scrollToSection } from '../utils/scroll';

const LABELS = {
  home: 'home',
  about: 'about',
  projects: 'projects',
  personal: 'personal',
  contact: 'contact',
};

function Navbar() {
  const [click, setClick] = useState(false);
  const [projectsActive, setProjectsActive] = useState(false);
  const [heroActive, setHeroActive] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      // Query the sections on every run (not once at mount): the navbar can
      // mount before the sections commit, which previously left these refs
      // null forever so the classes never applied.
      const projects = document.getElementById('projects');

      if (projects) {
        const bounds = projects.getBoundingClientRect();
        // The nav sits in the top 72px; projects is "behind the nav" while its
        // box crosses that band.
        const active = bounds.top <= 72 && bounds.bottom > 72;
        setProjectsActive((current) => (current === active ? current : active));
      }
      // The hero (#home) is position:sticky, so its rect always sits at the top
      // of the viewport and can't tell us whether we've scrolled past it. Use
      // the scroll position instead: the hero backdrop is behind the nav only
      // while we're within (roughly) the first viewport-height of scroll.
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const heroActiveNow = scrollY < viewportHeight - 72;
      setHeroActive((current) => (current === heroActiveNow ? current : heroActiveNow));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    // Run a few times after mount so the first paint (and late-committing
    // sections) are picked up even before any scroll.
    update();
    const settle = window.setTimeout(update, 100);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const handleClick = () => {
    setClick(!click);
    const audio = new Audio('sounds/pop_sound_effect.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {});
  };

  const goTo = (id) => {
    setClick(false);
    const audio = new Audio('sounds/pop_sound_effect.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {});
    scrollToSection(id);
  };

  return (
    <nav className={`navbar ${projectsActive ? 'is-projects-active' : ''} ${heroActive ? 'is-hero-active' : ''}`}>
      <div className="navbar-container">
        <div className="menu-icon" onClick={handleClick} role="button" tabIndex={0}>
          <i className={click ? 'fas fa-times' : 'fas fa-bars'} />
        </div>
        <ul className={click ? 'nav-menu active' : 'nav-menu'}>
          {SECTIONS.map((id) => (
            <li className="nav-item" key={id}>
              <button type="button" className="nav-links" onClick={() => goTo(id)}>
                {LABELS[id]}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
