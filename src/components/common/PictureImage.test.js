import { render } from '@testing-library/react';
import fc from 'fast-check';
import PictureImage from './PictureImage';

// Feature: chrome-3d-folders, Property 15: PictureImage offers WebP with
// original-format fallback — with both sources it renders a <source
// type="image/webp"> plus an <img> whose src is the original; with only an
// original it renders a plain <img> and no <source>.

const pathArb = fc
  .tuple(fc.string({ minLength: 1, maxLength: 20 }), fc.constantFrom('jpg', 'png', 'webp'))
  .map(([name, ext]) => `/images/${name.replace(/[^a-zA-Z0-9]/g, '') || 'img'}.${ext}`);

describe('PictureImage (Property 15)', () => {
  it('renders a webp <source> and original <img> when both are provided', () => {
    fc.assert(
      fc.property(pathArb, pathArb, (original, webp) => {
        const { container } = render(<PictureImage src={original} webp={webp} alt="" />);
        const picture = container.querySelector('picture');
        const source = container.querySelector('source');
        const img = container.querySelector('img');

        expect(picture).not.toBeNull();
        expect(source).not.toBeNull();
        expect(source.getAttribute('type')).toBe('image/webp');
        expect(source.getAttribute('srcset') || source.getAttribute('srcSet')).toBe(webp);
        expect(img).not.toBeNull();
        expect(img.getAttribute('src')).toBe(original);
      }),
      { numRuns: 100 }
    );
  });

  it('renders a plain <img> with no <source> or <picture> when webp is absent', () => {
    fc.assert(
      fc.property(pathArb, (original) => {
        const { container } = render(<PictureImage src={original} alt="" />);
        expect(container.querySelector('picture')).toBeNull();
        expect(container.querySelector('source')).toBeNull();
        const img = container.querySelector('img');
        expect(img).not.toBeNull();
        expect(img.getAttribute('src')).toBe(original);
      }),
      { numRuns: 100 }
    );
  });
});
