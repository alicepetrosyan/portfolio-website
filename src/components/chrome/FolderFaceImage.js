/*
 * An image textured onto a plane sized to a chrome folder's face, rendered as
 * folder face content so it tilts/flips in perfect alignment with the folder.
 * Loaded as an sRGB texture (color image, unlike the linear reflection map).
 *
 * Feature: chrome-3d-folders (Requirements 3.4, 5.2)
 */
import { useEffect } from 'react';
import { useLoader, useThree } from '@react-three/fiber';
import { TextureLoader, SRGBColorSpace } from 'three';

// Fraction of the face height taken up by the tab notch at the top of the
// folder. The image body starts just below this so the picture doesn't ride up
// onto the raised tab.
const TAB_FRACTION = 0.14;

function FolderFaceImage({ url, face, inset = 0.06, lift = 0, zoom = 1 }) {
  const texture = useLoader(TextureLoader, url);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    texture.colorSpace = SRGBColorSpace;
    // Fill a square plane with a (possibly non-square) source image by
    // center-cropping via the texture matrix, so the picture is skewed to a
    // square aspect without distortion and still covers the whole plane.
    // `zoom` > 1 tightens the crop further (shows a smaller central slice),
    // enlarging the subject on the folder face — useful when a cover image has
    // padding around its subject that reads as "zoomed out".
    const img = texture.image;
    const z = zoom > 0 ? zoom : 1;
    if (img && img.width && img.height) {
      const ar = img.width / img.height;
      texture.center.set(0.5, 0.5);
      if (ar > 1) {
        // Wide image: show the central square slice horizontally.
        texture.repeat.set(1 / (ar * z), 1 / z);
      } else {
        // Tall image: show the central square slice vertically.
        texture.repeat.set(1 / z, ar / z);
      }
    }
    invalidate();
  }, [texture, invalidate, zoom]);

  // The folder's inner cavity: its body spans the full face width (minus a thin
  // chrome rim) and the portion of the face below the tab notch at the top. Fit
  // the largest SQUARE that touches those inner edges so the image sits flush
  // against the folder frame instead of floating inside a large margin.
  const bodyTop = face.height * 0.5 - face.height * TAB_FRACTION; // under the tab
  const bodyBottom = -face.height * 0.5 + face.height * inset; // thin bottom rim
  const bodyHeight = bodyTop - bodyBottom;
  const bodyWidth = face.width * (1 - inset * 2);
  // Square side = the smaller of the two inner spans so it touches an edge.
  const side = Math.min(bodyWidth, bodyHeight);
  // Centre the square within the body cavity.
  const centerY = (bodyTop + bodyBottom) / 2 - face.height * lift;

  return (
    <mesh position={[0, centerY, 0]}>
      <planeGeometry args={[side, side]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

export default FolderFaceImage;
