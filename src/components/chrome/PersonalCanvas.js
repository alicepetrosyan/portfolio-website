/*
 * Personal-grid 3D renderer: draws every visible photo as a blue/cyan chrome
 * folder laid out on a grid that matches the DOM gallery. All folders live on
 * ONE shared canvas. Only the hovered folder animates (jumps up + tilts); it
 * falls back down on release. Clicking a folder flips the whole model, swapping
 * the front photo for the caption on the back at the flip midpoint.
 *
 * The grid is sized to the camera's visible world rectangle so the whole grid
 * fits inside the canvas regardless of viewport dimensions.
 *
 * Feature: chrome-3d-folders (Requirements 5.1–5.9)
 */
import { Suspense, useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { MathUtils, Vector3 } from 'three';
import ChromeFolder from './ChromeFolder';
import FolderFaceImage from './FolderFaceImage';
import FolderFaceTitle from './FolderFaceTitle';
import FolderFaceCaption from './FolderFaceCaption';
import {
  useReflectionEnvironment,
  createChromeMaterial,
  BLUE_CYAN_CHROME,
} from '../../utils/chromeMaterial';

// The folder GLB face spans ~0.104 x ~0.093 world units before per-folder scale.
const FACE_W = 0.104;
const FACE_H = 0.093;

// Fraction of a grid cell the folder fills (the rest is the gap between cells).
const CELL_FILL = 0.92;

// Hover animation targets: the hovered folder jumps up by HOVER_LIFT (world
// units, pre-scale) and tilts slightly toward the viewer.
const HOVER_LIFT = 0.12;
const HOVER_TILT = { x: -0.18, y: 0.1 };

// Camera (shared with the stage below). Vertical fov in degrees.
const CAMERA_Z = 15;
const CAMERA_FOV = 24;

// Derive the visible world rectangle at z=0, the per-cell world size, the
// folder base scale that fills CELL_FILL of a cell, and each folder's centre.
// Everything scales from the camera frustum so the grid always fits on screen.
function useGridLayout(count, columns, aspect) {
  return useMemo(() => {
    const cols = Math.max(1, columns);
    const rows = Math.max(1, Math.ceil(count / cols));
    // Visible world extent at the folders' plane (z = 0).
    const halfH = Math.tan(MathUtils.degToRad(CAMERA_FOV) / 2) * CAMERA_Z;
    const halfW = halfH * aspect;
    // Leave a small outer margin so edge folders don't kiss the canvas border.
    const usableW = halfW * 2 * 0.94;
    const usableH = halfH * 2 * 0.9;
    const cellW = usableW / cols;
    const cellH = usableH / rows;
    // Folder base scale: fill CELL_FILL of the smaller cell dimension so the
    // folder (incl. its taller-than-wide shape) never exceeds the cell.
    const baseScale = CELL_FILL * Math.min(cellW / FACE_W, cellH / FACE_H);
    const positions = Array.from({ length: count }, (_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        i,
        x: -usableW / 2 + cellW * (col + 0.5),
        y: usableH / 2 - cellH * (row + 0.5),
      };
    });
    return { positions, baseScale };
  }, [count, columns, aspect]);
}

// Projects each folder's on-screen rectangle (CSS px) so the DOM interaction
// layer (hover/click targets) can cover each folder exactly. The grid is
// STATIC — folders don't move on hover (the lift is a tiny z nudge that doesn't
// shift the screen rect meaningfully), so we recompute only when the layout
// actually changes (canvas size, positions, or baseScale) rather than every
// frame. This keeps the per-frame WebGL loop free of React setState churn.
function GridProjector({ positions, baseScale, onRects }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  useEffect(() => {
    const v = new Vector3();
    const toPx = (vx, vy, vz) => {
      v.set(vx, vy, vz).project(camera);
      return { px: ((v.x + 1) / 2) * size.width, py: (1 - (v.y + 1) / 2) * size.height };
    };
    const rects = positions.map(({ i, x, y }) => {
      const c = toPx(x, y, 0);
      const right = toPx(x + (FACE_W / 2) * baseScale, y, 0);
      const top = toPx(x, y + (FACE_H / 2) * baseScale, 0);
      const halfWpx = Math.abs(right.px - c.px);
      const halfHpx = Math.abs(top.py - c.py);
      return { i, left: c.px - halfWpx, top: c.py - halfHpx, width: halfWpx * 2, height: halfHpx * 2 };
    });
    onRects(rects);
  }, [camera, size.width, size.height, positions, baseScale, onRects]);
  return null;
}

function PersonalScene({ photos, columns, hoveredIndex, flipState, onRects, onFlipMidpoint }) {
  useReflectionEnvironment();
  const { size } = useThree();
  const material = useMemo(() => createChromeMaterial(BLUE_CYAN_CHROME, { envMapIntensity: 1.25 }), []);

  const aspect = size.height > 0 ? size.width / size.height : 1;
  const { positions, baseScale } = useGridLayout(photos.length, columns, aspect);

  return (
    <>
      {/* Lighting tuned so the cyan chrome reads as polished metal, matching the
          projects section's setup. */}
      <ambientLight intensity={0.34} />
      <directionalLight position={[5, 6, 6]} intensity={1.5} />
      <directionalLight position={[-6, 3, -4]} intensity={0.6} />
      <spotLight position={[6, 8, 9]} angle={0.5} penumbra={0.2} intensity={5} distance={0} decay={0} />
      <GridProjector positions={positions} baseScale={baseScale} onRects={onRects} />
      {positions.map(({ i, x, y }) => {
        const photo = photos[i];
        const hovered = i === hoveredIndex;
        const flip = flipState[i] ? Math.PI : 0;
        // Only the hovered OR a mid-flip folder needs per-frame work.
        const flipping = flipState[i] !== undefined;
        return (
          <ChromeFolder
            key={photo.id}
            material={material}
            position={[x, y, 0]}
            scale={baseScale}
            // Hover: jump up + tilt. Release: both targets return to rest, so
            // the folder falls back down. Only the hovered folder gets them.
            lift={hovered ? HOVER_LIFT : 0}
            hoverTilt={hovered ? HOVER_TILT : null}
            flip={flip}
            animating={hovered || flipping}
            onFlipMidpoint={() => onFlipMidpoint(i)}
            faceContent={(face) => (
              <Suspense fallback={null}>
                <FolderFaceImage
                  url={`/assets/personal-gallery/${photo.image}`}
                  face={face}
                  inset={0.16}
                  lift={0.08}
                />
                <FolderFaceTitle text={photo.id} face={face} bold color="#ffffff" fontFamily='"Comfortaa"' />
              </Suspense>
            )}
            backContent={(face) => (
              <FolderFaceCaption text={photo.caption} face={face} inset={0.16} lift={0.08} />
            )}
          />
        );
      })}
    </>
  );
}

export default PersonalScene;
