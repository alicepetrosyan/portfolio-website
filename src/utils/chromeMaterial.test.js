/*
 * Feature: chrome-3d-folders — reflection env + chrome material config.
 * Validates Requirement 7.4 (linear-space equirectangular reflection) and
 * 2.9/7.5 (material factory produces a reusable chrome material per finish).
 *
 * NOTE: three.js ships ESM that CRA's Jest/Babel pipeline does not transform
 * cleanly, so we mock `three` with minimal stubs. This keeps the behavioral
 * assertions (what mapping/colorSpace/material params get set) meaningful
 * without loading the real WebGL library.
 */

// Minimal three stub. Constant values mirror three's stable public values.
jest.mock('three', () => {
  class MeshStandardMaterial {
    constructor(params = {}) {
      Object.assign(this, params);
    }
  }
  class Color {
    constructor(hex) {
      this.hex = hex;
    }
    equals(other) {
      return other && other.hex === this.hex;
    }
  }
  class Texture {
    constructor() {
      this.mapping = null;
      this.colorSpace = null;
    }
  }
  return {
    __esModule: true,
    MeshStandardMaterial,
    Color,
    Texture,
    TextureLoader: class {},
    EquirectangularReflectionMapping: 303,
    LinearSRGBColorSpace: 'srgb-linear',
  };
});

// Mock r3f so importing chromeMaterial.js (which imports useLoader/useThree)
// does not pull in the real ESM package under Jest.
jest.mock('@react-three/fiber', () => ({
  __esModule: true,
  useLoader: () => ({}),
  useThree: () => ({}),
}));

const {
  configureReflectionTexture,
  createChromeMaterial,
  SILVER_CHROME,
  BLUE_CYAN_CHROME,
} = require('./chromeMaterial');
const { Texture } = require('three');

describe('configureReflectionTexture (Requirement 7.4)', () => {
  it('sets equirectangular mapping and linear-sRGB color space', () => {
    const texture = new Texture();
    configureReflectionTexture(texture);
    expect(texture.mapping).toBe(303); // EquirectangularReflectionMapping
    expect(texture.colorSpace).toBe('srgb-linear'); // LinearSRGBColorSpace
  });
});

describe('createChromeMaterial (Requirements 2.9, 7.5)', () => {
  it('produces a polished metallic material with the given finish color', () => {
    const silver = createChromeMaterial(SILVER_CHROME);
    expect(silver.metalness).toBe(1);
    expect(silver.roughness).toBeCloseTo(0.1);
    expect(silver.color.hex).toBe(SILVER_CHROME);

    const cyan = createChromeMaterial(BLUE_CYAN_CHROME);
    expect(cyan.color.hex).toBe(BLUE_CYAN_CHROME);
    expect(cyan).not.toBe(silver);
    expect(cyan.color.hex).not.toBe(silver.color.hex);
  });

  it('allows overrides without affecting the defaults', () => {
    const custom = createChromeMaterial(SILVER_CHROME, { envMapIntensity: 2 });
    expect(custom.envMapIntensity).toBe(2);
    const standard = createChromeMaterial(SILVER_CHROME);
    expect(standard.envMapIntensity).toBe(1.1);
  });
});
