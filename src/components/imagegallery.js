import './imagegallery.css';
import './FolderCard.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import photos from '../data/personal-gallery.json';
import useChromeFoldersEnabled from './chrome/useChromeFoldersEnabled';
import SectionCanvas from './chrome/SectionCanvas';
import PersonalScene from './chrome/PersonalCanvas';

// Visible tile counts match the flat grid's breakpoints (5/4/3 cols).
function columnsForWidth(width) {
  if (width <= 720) return 3;
  if (width <= 1000) return 4;
  return 5;
}

// Rows per breakpoint: mobile (≤720px) shows 3 rows, wider shows 2. Keep in
// sync with the flat grid's nth-child caps in imagegallery.css.
function rowsForWidth(width) {
  return width <= 720 ? 3 : 2;
}

function rectByIndex(rects, i) {
  if (!rects) return null;
  return rects.find((r) => r.i === i) || null;
}

// Invisible control covering a folder's projected rect. Hover drives the lift;
// click/Enter/Space flips the folder. Exposed as a focusable button with an
// aria-label + aria-pressed reflecting whether the photo or caption shows.
function FolderControl({ photo, rect, flipped, onHover, onLeave, onToggle }) {
  if (!rect) return null;
  return (
    <button
      type="button"
      className="personal-click-target"
      style={{
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
      }}
      aria-pressed={flipped}
      aria-label={flipped ? `Show photo ${photo.id}` : `Show caption for photo ${photo.id}`}
      onPointerEnter={onHover}
      onPointerLeave={onLeave}
      onFocus={onHover}
      onBlur={onLeave}
      onClick={onToggle}
    />
  );
}

function ChromeGallery({ visiblePhotos, columns }) {
  const stageRef = useRef(null);
  const [rects, setRects] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [flipState, setFlipState] = useState({});

  const toggleFlip = useCallback((i) => {
    setFlipState((cur) => ({ ...cur, [i]: !cur[i] }));
  }, []);
  const onFlipMidpoint = useCallback(() => {}, []);

  return (
    <div className="personal-chrome-stage" ref={stageRef}>
      <div className="personal-canvas">
        <SectionCanvas containerRef={stageRef} camera={{ position: [0, 0, 15], fov: 24 }}>
          <PersonalScene
            photos={visiblePhotos}
            columns={columns}
            hoveredIndex={hoveredIndex}
            flipState={flipState}
            onRects={setRects}
            onFlipMidpoint={onFlipMidpoint}
          />
        </SectionCanvas>
      </div>
      <div className="personal-overlays">
        {visiblePhotos.map((photo, i) => (
          <FolderControl
            key={photo.id}
            photo={photo}
            rect={rectByIndex(rects, i)}
            flipped={Boolean(flipState[i])}
            onHover={() => setHoveredIndex(i)}
            onLeave={() => setHoveredIndex((cur) => (cur === i ? -1 : cur))}
            onToggle={() => toggleFlip(i)}
          />
        ))}
      </div>
    </div>
  );
}

function FlatGallery({ visiblePhotos }) {
  const [flippedPhotos, setFlippedPhotos] = useState({});
  const togglePhoto = (id) => {
    setFlippedPhotos((current) => ({ ...current, [id]: !current[id] }));
  };
  return (
    <div className="personal-gallery">
      {visiblePhotos.map((photo) => {
        const flipped = Boolean(flippedPhotos[photo.id]);
        return (
          <figure className="gallery-tile" key={photo.id}>
            <button
              type="button"
              className={`gallery-flip ${flipped ? 'is-flipped' : ''}`}
              onClick={() => togglePhoto(photo.id)}
              aria-label={flipped ? `Show photo ${photo.id}` : `Show caption for photo ${photo.id}`}
              aria-pressed={flipped}
            >
              <span className="gallery-flip-inner">
                <span className="gallery-face gallery-face-front" aria-hidden={flipped}>
                  <span className="folder-tab">{photo.id}</span>
                  <span className="folder-body">
                    <img
                      src={`/assets/personal-gallery/${photo.image}`}
                      alt={`Personal ${photo.id}`}
                      loading="lazy"
                      decoding="async"
                    />
                  </span>
                </span>
                <span className="gallery-face gallery-face-back" aria-hidden={!flipped}>
                  <span className="folder-tab folder-tab--empty" aria-hidden="true" />
                  <span className="folder-body gallery-caption-body">
                    <span className="gallery-caption">{photo.caption}</span>
                  </span>
                </span>
              </span>
            </button>
          </figure>
        );
      })}
    </div>
  );
}

function ImageGallery() {
  const chromeEnabled = useChromeFoldersEnabled();
  const [{ columns, rows }, setGrid] = useState(() => {
    const w = typeof window === 'undefined' ? 1200 : window.innerWidth;
    return { columns: columnsForWidth(w), rows: rowsForWidth(w) };
  });

  useEffect(() => {
    const update = () =>
      setGrid({ columns: columnsForWidth(window.innerWidth), rows: rowsForWidth(window.innerWidth) });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Fill the grid at the active column count and row count (3 rows on mobile,
  // 2 otherwise), matching the flat grid's nth-child caps.
  const visiblePhotos = useMemo(() => photos.slice(0, columns * rows), [columns, rows]);

  if (chromeEnabled) {
    return <ChromeGallery visiblePhotos={visiblePhotos} columns={columns} />;
  }
  return <FlatGallery visiblePhotos={visiblePhotos} />;
}

export default ImageGallery;
