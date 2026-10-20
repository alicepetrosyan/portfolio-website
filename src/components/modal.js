import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import TypingTitle from './TypingTitle';
import PictureImage from './common/PictureImage';
import './modal.css';

// Locks page scrolling while the modal is open and restores it on close. The
// full-screen .modal-background overlay already blocks pointer interaction with
// the page behind it; this additionally prevents the body from scrolling.
// Scrollbar-width compensation avoids a layout shift when the bar disappears.
function useScrollLock(active) {
  useEffect(() => {
    if (!active) return undefined;
    const { body, documentElement: html } = document;
    const scrollbarWidth = window.innerWidth - html.clientWidth;
    // Capture the current scroll position. We pin the body with position:fixed
    // at the negated scroll offset so the page stays put (just toggling
    // overflow:hidden with scroll-snap/sticky content caused the page to jump
    // to the top on unlock). On close we undo it and restore the exact scroll
    // position, so the user returns to the same context they opened from.
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const prev = {
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      bodyPaddingRight: body.style.paddingRight,
      htmlScrollBehavior: html.style.scrollBehavior,
    };
    // Disable any smooth-scroll so the restore is instant, not animated.
    html.style.scrollBehavior = 'auto';
    body.style.position = 'fixed';
    body.style.top = `${-scrollY}px`;
    body.style.width = '100%';
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      body.style.position = prev.bodyPosition;
      body.style.top = prev.bodyTop;
      body.style.width = prev.bodyWidth;
      body.style.paddingRight = prev.bodyPaddingRight;
      window.scrollTo(0, scrollY);
      html.style.scrollBehavior = prev.htmlScrollBehavior;
    };
  }, [active]);
}

const modalVariants = {
  hidden: { scale: 0.94, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { duration: 0.18 } },
  exit: { scale: 0.94, opacity: 0 },
};

// Normalizes a project into a flat list of content blocks so the modal can
// render any shape of data. Supported block types:
//   { type: 'heading', text }            -> an animated section header
//   { type: 'paragraph', text }          -> a <p>
//   { type: 'list', items: [...] }       -> a <ul> of bullet points
//
// Preferred source: project.sections — an ordered array where each section is
//   { heading?, body: [ "a paragraph string"
//                      | { type: 'text', text }
//                      | { type: 'list', items: [...] } ] }
// A plain string in `body` is shorthand for a paragraph. This lets you add any
// number of custom headers and drop bullet lists wherever you want.
//
// Fallback: the older { description, why, how } fields are still rendered if no
// `sections` array is present, so unmigrated projects keep working.
function buildBlocks(project) {
  const blocks = [];

  if (Array.isArray(project.sections)) {
    project.sections.forEach((section) => {
      if (section.heading) {
        blocks.push({ type: 'heading', text: section.heading });
      }
      const body = Array.isArray(section.body)
        ? section.body
        : section.body != null
          ? [section.body]
          : [];
      body.forEach((entry) => {
        if (typeof entry === 'string') {
          blocks.push({ type: 'paragraph', text: entry });
        } else if (entry && entry.type === 'list' && Array.isArray(entry.items)) {
          blocks.push({ type: 'list', items: entry.items });
        } else if (entry && (entry.type === 'text' || entry.type === 'paragraph')) {
          blocks.push({ type: 'paragraph', text: entry.text });
        }
      });
    });
    return blocks;
  }

  // Legacy fallback.
  if (project.description) blocks.push({ type: 'paragraph', text: project.description });
  if (project.why) {
    blocks.push({ type: 'heading', text: 'why?' });
    blocks.push({ type: 'paragraph', text: project.why });
  }
  if (project.how) {
    blocks.push({ type: 'heading', text: 'how?' });
    blocks.push({ type: 'paragraph', text: project.how });
  }
  return blocks;
}

function Modal({ project, closeModal }) {
  const gallery = project?.gallery || [];
  const blocks = project ? buildBlocks(project) : [];
  const [activeMedia, setActiveMedia] = useState(gallery[0] || null);

  // Lock the page while the modal is open (hooks must run before any early
  // return, so this is gated on `project` rather than placed after it).
  useScrollLock(Boolean(project));

  // Close on Escape for keyboard users.
  useEffect(() => {
    if (!project) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [project, closeModal]);

  if (!project) return null;

  return (
    <AnimatePresence>
      <div className="modal-background" onClick={closeModal}>
        <motion.div
          className="modal-container"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="button-container">
            <button type="button" className="button" onClick={closeModal} aria-label="Close">
              X
            </button>
          </div>
          <TypingTitle className="modal-title pixel-title" text={project.title} />
          {project.tools && <p className="modal-tools">{project.tools}</p>}
          {blocks.map((block, index) => {
            if (block.type === 'heading') {
              return <TypingTitle as="h3" key={`heading-${index}`} text={block.text} />;
            }
            if (block.type === 'list') {
              return (
                <ul className="modal-list" key={`list-${index}`}>
                  {block.items.map((item, itemIndex) => (
                    <li key={itemIndex}>{item}</li>
                  ))}
                </ul>
              );
            }
            return <p key={`paragraph-${index}`}>{block.text}</p>;
          })}
          {gallery.length > 0 && (
            <div className="modal-gallery">
              <div className="gallery-feature">
                {activeMedia?.type === 'video' ? (
                  <video src={activeMedia.src} controls />
                ) : (
                  <PictureImage src={activeMedia?.src} webp={activeMedia?.webp} alt="" loading="eager" />
                )}
              </div>
              <div className="gallery-thumbs">
                {gallery.map((item) => (
                  <button
                    type="button"
                    key={`${item.type}-${item.src}`}
                    className={`gallery-thumb ${activeMedia?.src === item.src ? 'is-current' : ''}`}
                    onClick={() => setActiveMedia(item)}
                  >
                    {item.type === 'video' ? (
                      <span className="thumb-video">video</span>
                    ) : (
                      <PictureImage src={item.src} webp={item.webp} alt="" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default Modal;
