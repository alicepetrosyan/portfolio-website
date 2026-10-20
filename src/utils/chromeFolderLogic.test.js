import fc from 'fast-check';
import {
  chromeFoldersEnabled,
  windowFor,
  fitTitle,
  fitScale,
  faceFor,
  MIN_TITLE_FONT_PX,
} from './chromeFolderLogic';

// Feature: chrome-3d-folders, Property 1: Mode selection is chrome only when
// all conditions hold.
describe('chromeFoldersEnabled (Property 1)', () => {
  it('is true iff not-narrow AND hover-fine AND not-reduced-motion AND webgl', () => {
    fc.assert(
      fc.property(fc.boolean(), fc.boolean(), fc.boolean(), fc.boolean(), (narrow, hover, reduced, webgl) => {
        const expected = !narrow && hover && !reduced && webgl;
        expect(
          chromeFoldersEnabled({
            viewportNarrow: narrow,
            hoverFine: hover,
            reducedMotion: reduced,
            webglAvailable: webgl,
          })
        ).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: chrome-3d-folders, Property 6: Projects render the exact circular
// three-folder window.
describe('windowFor (Property 6)', () => {
  it('returns exactly {(a-1+n)%n, a, (a+1)%n}', () => {
    fc.assert(
      fc.property(fc.integer({ min: 3, max: 50 }), fc.integer({ min: 0, max: 999 }), (length, rawIndex) => {
        const a = rawIndex % length;
        const w = windowFor(a, length);
        expect(w.activeIndex).toBe(a);
        expect(w.prevIndex).toBe((a - 1 + length) % length);
        expect(w.nextIndex).toBe((a + 1) % length);
        const set = new Set([w.prevIndex, w.activeIndex, w.nextIndex]);
        expect(set.size).toBe(3);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: chrome-3d-folders, Property 8: Title auto-fit respects the 12px
// floor and truncates at the floor.
describe('fitTitle (Property 8)', () => {
  // Deterministic measure: width is proportional to char count * fontPx.
  const measure = (text, fontPx) => text.length * fontPx * 0.6;

  it('keeps font size within [12, base], fits when achievable, truncates at floor', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 40 }),
        fc.integer({ min: 20, max: 2000 }),
        fc.integer({ min: 14, max: 48 }),
        (text, availableWidth, baseSize) => {
          const { fontSize, truncated } = fitTitle(text, availableWidth, baseSize, measure);
          expect(fontSize).toBeGreaterThanOrEqual(MIN_TITLE_FONT_PX);
          expect(fontSize).toBeLessThanOrEqual(baseSize);

          const longest = text
            .split(/\s+/)
            .reduce((l, w) => (measure(w, baseSize) > measure(l, baseSize) ? w : l), '');
          const fitsAtFloor = measure(longest, MIN_TITLE_FONT_PX) <= availableWidth;
          if (!fitsAtFloor) {
            expect(fontSize).toBe(MIN_TITLE_FONT_PX);
            expect(truncated).toBe(true);
          } else {
            // When it fits at the floor, it must not be marked truncated.
            expect(truncated).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: chrome-3d-folders, Property 10: Active folder fits within the stage
// vertically for any stage height.
describe('fitScale (Property 10)', () => {
  it('produces scaledHeight <= stageHeight and is monotonic in stage height', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 5000, noNaN: true }),
        fc.double({ min: 0.001, max: 5000, noNaN: true }),
        (stageHeight, modelHeight) => {
          const scale = fitScale(stageHeight, modelHeight);
          expect(scale * modelHeight).toBeLessThanOrEqual(stageHeight + 1e-6);
          // Monotonic: larger stage -> larger-or-equal scale.
          const bigger = fitScale(stageHeight * 2, modelHeight);
          expect(bigger).toBeGreaterThanOrEqual(scale - 1e-9);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: chrome-3d-folders, Property 12: Flip swaps the overlay face exactly
// at the midpoint.
describe('faceFor (Property 12)', () => {
  it('shows the start face before π/2 and the target face at/after', () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: Math.PI, noNaN: true }), (progress) => {
        const face = faceFor(progress, 'photo', 'caption');
        expect(face).toBe(progress < Math.PI / 2 ? 'photo' : 'caption');
      }),
      { numRuns: 100 }
    );
  });
});
