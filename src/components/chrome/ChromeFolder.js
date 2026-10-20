/*
 * Reusable chrome 3D folder. One instance per visible folder. All instances in
 * a section share one loaded GLTF (geometry) and one finish material; each gets
 * an independent cloned scene-graph node so it can be transformed/animated on
 * its own. Animations (tilt, hover lift, flip) are lerped in a demand-frameloop
 * useFrame and only run while moving.
 *
 * Feature: chrome-3d-folders (Requirements 2.8, 2.9, 3.1, 5.1, 5.6, 5.7, 7.5)
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Box3, Vector3 } from 'three';
import { useGLTF } from '@react-three/drei';
import { FOLDER_MODEL_URL } from '../../utils/modelPaths';

// Inner rotation makes the GLB's flat face (authored in the Y-Z plane) point at
// the camera (+Z), upright and readable. The extra Math.PI about Y turns the
// model around so its BACK face is the one presented to the camera (the folder
// was authored front-forward; the back reads better here).
const FACE_CAMERA_ROTATION = [0, Math.PI / 2 + Math.PI, 0];
// Outer, screen-plane adjustments applied AFTER the folder faces the camera:
// a 90° clockwise spin about the viewing axis (Z) and a horizontal mirror.
// The mirror sign is chosen so the tab lands in the SAME screen position it had
// before the back-face flip (the Y flip above would otherwise swap it L<->R).
const SCREEN_SPIN = [0, 0, -Math.PI / 2];
const SCREEN_MIRROR = [1, 1, 1];

/*
 * Assigns the shared finish material to every mesh of a cloned folder scene and
 * strips any embedded camera nodes. Pure (operates on the passed object); kept
 * separate so the material-sharing contract can be unit-tested without a GPU.
 * Returns the set of distinct materials assigned (for test assertions).
 */
export function applyChromeToClone(clone, material) {
  const cameras = [];
  const assigned = new Set();
  clone.traverse((child) => {
    if (child.isMesh) {
      child.material = material;
      child.castShadow = false;
      child.receiveShadow = false;
      assigned.add(child.material);
    } else if (child.isCamera) {
      cameras.push(child);
    }
  });
  cameras.forEach((cam) => cam.parent?.remove(cam));
  return assigned;
}

function ChromeFolder({
  material,
  position = [0, 0, 0],
  scale = 1,
  tilt = null,
  lift = 0,
  hoverTilt = null,
  flip = 0,
  baseRotationY = 0,
  animating = false,
  onFlipMidpoint,
  faceContent = null,
  backContent = null,
}) {
  const outer = useRef(); // position + lift
  const inner = useRef(); // tilt + flip rotation
  const invalidate = useThree((state) => state.invalidate);
  const gltf = useGLTF(FOLDER_MODEL_URL);
  // Target position lives in a ref (not bound as a group prop) so r3f never
  // hard-sets the group position and overrides the lerp. useFrame eases the
  // actual position toward this target.
  const targetPos = useRef([position[0], position[1], position[2]]);
  const initialPos = useRef([position[0], position[1], position[2]]);
  const targetScale = useRef(scale);
  const initialScale = useRef(scale);
  const crossedMidpoint = useRef(false);

  // Independent scene-graph instance per folder; clone(true) shares the
  // underlying BufferGeometry so only one geometry is uploaded to the GPU.
  const object = useMemo(() => {
    const clone = gltf.scene.clone(true);
    applyChromeToClone(clone, material);
    return clone;
  }, [gltf.scene, material]);

  // Center + size of the model (post-recenter the center sits at the origin).
  // After FACE_CAMERA_ROTATION the folder face lies in the screen plane; we
  // expose the face half-extents so callers can size overlay content to it.
  const { center, face } = useMemo(() => {
    const box = new Box3().setFromObject(object);
    const c = box.getCenter(new Vector3());
    const size = box.getSize(new Vector3());
    // The authored model is thin in X; its flat face spans Y (height) and
    // Z (width). After FACE_CAMERA_ROTATION + SCREEN_SPIN those map to the
    // on-screen height/width of the face.
    return {
      center: c,
      face: { width: size.z, height: size.y, depth: size.x },
    };
  }, [object]);

  useLayoutEffect(() => {
    // Initialize the inner rotation at the arc angle so a freshly-mounted folder
    // does not spin in from 0 on first appearance.
    if (inner.current) inner.current.rotation.y = baseRotationY || 0;
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [object, invalidate]);

  // When the target slot changes, update the ref and wake the render loop so
  // the position lerp animates toward it (demand frameloop needs the kick).
  useLayoutEffect(() => {
    targetPos.current = [position[0], position[1], position[2]];
    targetScale.current = scale;
    invalidate();
  }, [position, scale, invalidate]);

  useFrame((state, delta) => {
    if (!outer.current || !inner.current) return;
    const response = 1 - Math.exp(-9 * delta);

    const targetTilt = hoverTilt || tilt || { x: 0, y: 0 };
    // baseRotationY orients the folder on the cylinder arc; flip + tilt are
    // layered on top. All lerp together via inner.rotation.y.
    const targetY = (baseRotationY || 0) + (flip || 0) + (targetTilt.y || 0);
    const targetX = targetTilt.x || 0;
    const targetLift = lift || 0;

    inner.current.rotation.x += (targetX - inner.current.rotation.x) * response;
    inner.current.rotation.y += (targetY - inner.current.rotation.y) * response;
    // Lerp the full position toward the target slot so slot-to-slot moves
    // (carousel navigation) and the hover lift both animate smoothly.
    const [tpx, tpy, tpz] = targetPos.current;
    outer.current.position.x += (tpx - outer.current.position.x) * response;
    outer.current.position.y += (tpy + targetLift - outer.current.position.y) * response;
    outer.current.position.z += (tpz - outer.current.position.z) * response;

    // Ease scale too, so slot changes grow/shrink smoothly.
    const ts = targetScale.current;
    const cs = outer.current.scale.x + (ts - outer.current.scale.x) * response;
    outer.current.scale.set(cs, cs, cs);

    // Fire the flip midpoint once as the flip component of the Y rotation
    // crosses π/2 (base arc rotation + tilt excluded) so overlays swap faces.
    const flipAngle = inner.current.rotation.y - (targetTilt.y || 0) - (baseRotationY || 0);
    const past = Math.abs(flipAngle) >= Math.PI / 2;
    if (past && !crossedMidpoint.current) {
      crossedMidpoint.current = true;
      onFlipMidpoint?.();
    } else if (!past && crossedMidpoint.current) {
      crossedMidpoint.current = false;
    }

    const moving =
      Math.abs(targetX - inner.current.rotation.x) > 0.0005 ||
      Math.abs(targetY - inner.current.rotation.y) > 0.0005 ||
      Math.abs(tpx - outer.current.position.x) > 0.0005 ||
      Math.abs(tpy + targetLift - outer.current.position.y) > 0.0005 ||
      Math.abs(tpz - outer.current.position.z) > 0.0005 ||
      Math.abs(targetScale.current - outer.current.scale.x) > 0.0005;
    if (moving || animating) state.invalidate();
  });

  // Place overlay content right ON the folder face. The face sits in the screen
  // plane after the base transforms; we lay content flush against the front
  // surface (a hair of +Z just to avoid z-fighting with the chrome) so the
  // title and image read as a texture printed on the folder rather than a panel
  // floating in front of it.
  const frontZ = face.depth / 2 + 0.0005;

  return (
    <group ref={outer} position={initialPos.current} scale={initialScale.current}>
      {/* inner = animated tilt + flip (starts at zero) */}
      <group ref={inner}>
        {/* Screen-plane spin (90° CW) + horizontal mirror, applied around the
            already-centered, camera-facing folder. */}
        <group rotation={SCREEN_SPIN} scale={SCREEN_MIRROR}>
          {/* Face the camera, then recenter so animated rotations pivot about
              the model center. */}
          <group rotation={FACE_CAMERA_ROTATION}>
            <group position={[-center.x, -center.y, -center.z]}>
              <primitive object={object} />
            </group>
          </group>
        </group>

        {/* Overlay content lives in the same tilt/flip space as the folder, so
            it is always perfectly aligned. The face span (width x height) is
            provided so content can size itself in folder units. Front content
            faces +Z; back content is rotated to face the opposite way for the
            3D flip. */}
        {faceContent && (
          <group position={[0, 0, frontZ]}>{faceContent(face)}</group>
        )}
        {backContent && (
          <group position={[0, 0, -frontZ]} rotation={[0, Math.PI, 0]}>
            {backContent(face)}
          </group>
        )}
      </group>
    </group>
  );
}

useGLTF.preload(FOLDER_MODEL_URL);

export default ChromeFolder;
