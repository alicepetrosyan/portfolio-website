/*
 * Projects-specific 3D renderer: draws exactly three silver chrome folders
 * (previous, active, next — circular) positioned to match the carousel's
 * center/left/right slot layout, with a subtle pointer tilt on the active one.
 * The cover image is textured onto each folder's face (so it stays perfectly
 * aligned through tilt), while the title is a crisp DOM overlay above.
 * Rendered inside a SectionCanvas.
 *
 * Feature: chrome-3d-folders (Requirements 3.1, 3.2, 3.3, 3.4, 3.7)
 */
import { Suspense, useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import ChromeFolder from './ChromeFolder';
import FolderFaceImage from './FolderFaceImage';
import FolderFaceTitle from './FolderFaceTitle';
import {
  useReflectionEnvironment,
  createChromeMaterial,
  SILVER_CHROME,
} from '../../utils/chromeMaterial';

// On-screen the folder face spans these half-extents in MODEL units (before the
// per-folder scale). Derived from the folder GLB face (~0.105 wide x ~0.093
// tall after the base orientation). Used to project a full pixel rectangle for
// each folder so DOM overlays can cover the whole folder (title + click area).
const FACE_HALF_W = 0.052;
const FACE_HALF_H = 0.047;

// Projects each folder's full on-screen rectangle (left/top/width/height in
// canvas pixels) each frame and reports them, so the DOM overlays can exactly
// cover each folder regardless of scale/viewport.
// The three slot pixel rects (prev/active/next) are fixed per layout — folders
// swing BETWEEN these fixed slot positions during navigation, but the slot
// screen locations only change on resize/baseScale. So recompute only when the
// layout changes (not every animation frame), keeping React setState out of the
// per-frame WebGL loop. `slotsKey` captures the slot geometry so the effect
// re-runs when the window (prev/active/next geometry) changes.
function SlotProjector({ slots, baseScale, onRects }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const slotsKey = JSON.stringify(slots);
  useEffect(() => {
    const v = new Vector3();
    const toPx = (vx, vy, vz) => {
      v.set(vx, vy, vz).project(camera);
      return { px: ((v.x + 1) / 2) * size.width, py: (1 - (v.y + 1) / 2) * size.height };
    };
    const rects = slots.map(({ key, x, z, scale }) => {
      const s = baseScale * scale;
      const c = toPx(x, 0, z);
      const right = toPx(x + FACE_HALF_W * s, 0, z);
      const top = toPx(x, FACE_HALF_H * s, z);
      const halfWpx = Math.abs(right.px - c.px);
      const halfHpx = Math.abs(top.py - c.py);
      return { key, left: c.px - halfWpx, top: c.py - halfHpx, width: halfWpx * 2, height: halfHpx * 2 };
    });
    onRects(rects);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, size.width, size.height, slotsKey, baseScale, onRects]);
  return null;
}

// Full-ring carousel geometry. Every folder sits on a horizontal circle of
// radius CYL_RADIUS centred behind the screen; the active folder is at the
// FRONT of the ring (facing the camera) and the rest are distributed evenly
// around it, the farthest ones curving around to the BACK. Navigating rotates
// the whole ring, so folders travel ALONG the circle (prev/next swing in from
// the sides and the one leaving swings toward the back) instead of being
// kicked off the edges of the screen.
// Ring radius expressed in FOLDER-WIDTHS, not raw world units. The folder face
// is ~0.104 world units wide; the on-screen folder is that times `baseScale`.
// Because the folders scale with the stage (baseScale) but their ring positions
// must scale the same way, we derive the radius from baseScale at render time
// (see ringRadiusFor) so the gap between folders stays constant relative to
// their size at every window dimension — otherwise big (full-screen) folders
// overlap a fixed-size ring.
const FOLDER_FACE_W = 0.104; // approx model-unit width of a folder face
const RADIUS_IN_FOLDER_WIDTHS = 1.42; // centre-to-centre spacing room on the arc
// (bigger => folders sit farther apart along the ring). Tuned with FRONT_ANGLE
// so that at the (now larger) full-screen folder size the neighbor centre lands
// ~1 folder-width from the active one and recedes in z, leaving the folders
// just clear of each other while their outer edges stay inside the stage.

function ringRadiusFor(baseScale) {
  // Radius in world units = (folders of spacing) * (one folder's world width).
  return RADIUS_IN_FOLDER_WIDTHS * FOLDER_FACE_W * baseScale;
}
const SIDE_SCALE = 1; // all folders render at the same size as the active one
// Front neighbors (offset ±1) sit on a gentle frontal arc so they read clearly
// rather than edge-on; everything farther compresses around toward the back.
const FRONT_ANGLE = 0.72; // radians (~41°) for the immediate neighbors — turned
// enough that they recede slightly in z (reading a touch smaller / behind) so
// the larger folders clear each other, yet still sit near the centre folder.

// Signed ring angle for a folder at integer `offset` from the active one, on a
// ring of `count` folders. Offsets 0/±1 use the gentle FRONT_ANGLE; beyond that
// the remaining folders are spread evenly across the rest of the circle so they
// wrap around to the back and the ring stays continuous when rotating.
function ringAngle(offset, count) {
  if (offset === 0) return 0;
  if (Math.abs(offset) === 1) return Math.sign(offset) * FRONT_ANGLE;
  // Folders at |offset| >= 2 fill the remaining arc between the ±1 neighbors
  // (at ±FRONT_ANGLE) and the exact back of the ring (±π), stepping evenly.
  const beyond = Math.abs(offset) - 1; // 1,2,...
  const backSlots = Math.max(1, count - 3); // folders not in {0, ±1}
  const rearSteps = Math.ceil(backSlots / 2) + 1; // steps from FRONT_ANGLE to π
  const t = Math.min(1, beyond / rearSteps);
  return Math.sign(offset) * (FRONT_ANGLE + (Math.PI - FRONT_ANGLE) * t);
}

// Position/rotation/scale for a folder at signed ring offset `offset` (0 =
// front/active). The folder is placed on the circle and turned to face outward
// from the ring centre, so the front one faces the camera and the side ones
// angle away as on a real carousel.
function slotForOffset(offset, count, radius) {
  const theta = ringAngle(offset, count);
  return {
    x: radius * Math.sin(theta),
    // Front of the ring sits at z≈0; folders recede as they wrap toward the
    // back (z goes negative, down to -2R directly behind).
    z: radius * (Math.cos(theta) - 1),
    rotationY: theta, // face outward along the ring (left angles left, etc.)
    scale: offset === 0 ? 1 : SIDE_SCALE,
  };
}

function coverFor(project) {
  return project.coverWebp || project.coverImage;
}

// Signed circular offset of index i relative to the active index, in [-h, h].
function circularOffset(i, active, length) {
  let d = i - active;
  const half = Math.floor(length / 2);
  if (d > half) d -= length;
  if (d < -half) d += length;
  return d;
}

function ProjectsScene({ projectCount, projectsList, activeIndex, tiltTarget, baseScale, onRects }) {
  useReflectionEnvironment();
  const material = useMemo(() => createChromeMaterial(SILVER_CHROME), []);

  // Render EVERY folder, each parked at its signed position around the ring.
  // Keyed by project id so when the active index changes each folder animates
  // (swings) to its new angle rather than remounting. Folders that wrap to the
  // back of the ring face away and are naturally hidden by depth/perspective.
  const rendered = projectsList.map((project, i) => ({
    project,
    i,
    offset: circularOffset(i, activeIndex, projectCount),
  }));

  // Ring radius scales with the folders (baseScale) so spacing stays constant
  // relative to folder size — this is what keeps full-screen folders from
  // overlapping while smaller windows still look right.
  const radius = ringRadiusFor(baseScale);

  // Only the three front folders (|offset|<=1) get DOM click/overlay rects.
  const slotsForProjection = rendered
    .filter(({ offset }) => Math.abs(offset) <= 1)
    .map(({ offset }) => {
      const slot = slotForOffset(offset, projectCount, radius);
      return {
        key: offset === 0 ? 'active' : offset === -1 ? 'prev' : 'next',
        x: slot.x,
        z: slot.z,
        scale: slot.scale,
      };
    });

  return (
    <>
      {/* Lighting tuned like the hero so the chrome reads as polished metal. */}
      <ambientLight intensity={0.32} />
      <directionalLight position={[5, 6, 6]} intensity={1.5} />
      <directionalLight position={[-6, 3, -4]} intensity={0.6} />
      <spotLight position={[6, 8, 9]} angle={0.5} penumbra={0.2} intensity={5} distance={0} decay={0} />
      <SlotProjector slots={slotsForProjection} baseScale={baseScale} onRects={onRects} />
      {rendered.map(({ project, offset }) => {
        const slot = slotForOffset(offset, projectCount, radius);
        const isActive = offset === 0;
        return (
          <ChromeFolder
            key={project.id}
            material={material}
            position={[slot.x, 0, slot.z]}
            scale={baseScale * slot.scale}
            baseRotationY={slot.rotationY}
            tilt={isActive ? tiltTarget : null}
            animating={isActive && Boolean(tiltTarget)}
            faceContent={(face) => (
              <Suspense fallback={null}>
                <FolderFaceImage url={coverFor(project)} face={face} inset={0.16} lift={0.08} zoom={project.coverZoom || 1} />
                <FolderFaceTitle text={project.title} face={face} />
              </Suspense>
            )}
          />
        );
      })}
    </>
  );
}

export default ProjectsScene;
