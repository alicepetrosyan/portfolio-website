import { useLayoutEffect, useRef } from 'react';
import './FolderCard.css';
import PictureImage from './common/PictureImage';

function FolderCard({ project, active, onOpen }) {
  const titleRef = useRef(null);

  useLayoutEffect(() => {
    const title = titleRef.current;
    if (!title) return undefined;

    const fitTitle = () => {
      const style = window.getComputedStyle(title);
      const baseSize = Number.parseFloat(style.fontSize);
      const availableWidth = title.clientWidth
        - Number.parseFloat(style.paddingLeft)
        - Number.parseFloat(style.paddingRight);
      const context = document.createElement('canvas').getContext('2d');
      if (!context || availableWidth <= 0) return;

      context.font = style.font;
      const textWidth = Math.max(
        ...project.title.split(/\s+/).map((word) => context.measureText(word).width)
      );
      const size = textWidth > 0 ? Math.min(baseSize, baseSize * availableWidth / textWidth) : baseSize;
      title.style.fontSize = `${size}px`;
    };

    fitTitle();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(fitTitle);
    observer.observe(title);
    return () => observer.disconnect();
  }, [project.title]);

  return (
    <button
      type="button"
      className={`folder-card ${active ? 'is-active' : ''}`}
      onClick={() => active && onOpen(project)}
      aria-label={active ? `Open ${project.title}` : project.title}
      tabIndex={active ? 0 : -1}
    >
      <span className="folder-tab" ref={titleRef}>{project.title}</span>
      <span className="folder-body">
        {project.coverImage ? (
          <PictureImage src={project.coverImage} webp={project.coverWebp} alt="" />
        ) : (
          <span className="folder-placeholder">project image</span>
        )}
      </span>
    </button>
  );
}

export default FolderCard;
