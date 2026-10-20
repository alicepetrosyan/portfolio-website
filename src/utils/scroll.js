import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollToPlugin);

export const SECTIONS = ['home', 'about', 'projects', 'personal', 'contact'];

export function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;

  // The hero (#home) is position:sticky, so its resolved offset isn't a stable
  // scroll position — scrolling "to the element" lands wherever it's currently
  // pinned instead of the top. For the first section, scroll to absolute 0.
  const target = id === SECTIONS[0] ? 0 : el;

  gsap.to(window, {
    duration: 0.95,
    scrollTo: { y: target, offsetY: 0 },
    ease: 'power2.inOut',
    overwrite: 'auto',
  });
}

export function getActiveSectionIndex() {
  const marker = window.innerHeight * 0.45;
  let index = 0;

  SECTIONS.forEach((id, i) => {
    const el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top <= marker) {
      index = i;
    }
  });

  return index;
}
