/*
 * Shared chrome pipeline, generalized from the hero logo (TiltName.js) so the
 * projects and personal sections reuse one env-map load pattern and one
 * material per finish.
 *
 * Feature: chrome-3d-folders (Requirements 2.9, 3.1, 5.1, 7.4, 7.5)
 */
import { useLayoutEffect } from 'react';
import { useLoader, useThree } from '@react-three/fiber';
import {
  Color,
  EquirectangularReflectionMapping,
  LinearSRGBColorSpace,
  MeshStandardMaterial,
  TextureLoader,
} from 'three';

// Same reflection source the hero uses, so all chrome shares one backdrop.
export const REFLECTION_IMAGE_URL = '/assets/backgrounds/hero-image.webp';

// Finish tints. Silver matches the hero logo; blue/cyan is the personal variant.
export const SILVER_CHROME = '#eef2f7';
export const BLUE_CYAN_CHROME = '#7fe4f0';

/*
 * Loads the reflection image as an equirectangular environment map, assigns it
 * to scene.environment (restoring the previous one on cleanup), and returns the
 * texture so it can also be set as a material's envMap. Sampled in linear space
 * (an sRGB tag would double-apply the curve and skew the reflection warm).
 */
/*
 * Configures a loaded texture as an equirectangular reflection map sampled in
 * linear space. Extracted as a pure function so the configuration can be
 * verified without standing up a WebGL context.
 */
export function configureReflectionTexture(texture) {
  texture.mapping = EquirectangularReflectionMapping;
  texture.colorSpace = LinearSRGBColorSpace;
  return texture;
}

export function useReflectionEnvironment(url = REFLECTION_IMAGE_URL) {
  const scene = useThree((state) => state.scene);
  const invalidate = useThree((state) => state.invalidate);
  const texture = useLoader(TextureLoader, url);

  useLayoutEffect(() => {
    configureReflectionTexture(texture);
    const previous = scene.environment;
    scene.environment = texture;
    invalidate();
    return () => {
      if (scene.environment === texture) scene.environment = previous;
    };
  }, [scene, texture, invalidate]);

  return texture;
}

/*
 * Builds a polished chrome MeshStandardMaterial for a given finish color.
 * One instance should be created per finish per section and shared across all
 * folders of that finish (do not call this per folder).
 */
export function createChromeMaterial(colorHex, overrides = {}) {
  return new MeshStandardMaterial({
    color: new Color(colorHex),
    metalness: 1,
    roughness: 0.1,
    envMapIntensity: 1.1,
    ...overrides,
  });
}
