import fs from 'fs';
import path from 'path';
import projects from './projects.json';

// Feature: chrome-3d-folders — WebP migration artifact checks
// Verifies Requirements 6.1, 6.2, 6.4: every referenced project image has a
// WebP twin and the originals are retained, and projects.json carries the
// webp fields where twins exist.

const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public');
const toFsPath = (webPath) => path.join(PUBLIC_DIR, webPath.replace(/^\//, ''));

describe('project image WebP migration', () => {
  it('every project has a coverWebp whose file exists, and the original cover is retained', () => {
    projects.forEach((project) => {
      expect(project.coverWebp).toBeTruthy();
      expect(fs.existsSync(toFsPath(project.coverImage))).toBe(true);
      expect(fs.existsSync(toFsPath(project.coverWebp))).toBe(true);
    });
  });

  it('every image gallery item has a webp twin that exists, and the original is retained', () => {
    projects.forEach((project) => {
      project.gallery
        .filter((item) => item.type === 'image')
        .forEach((item) => {
          expect(item.webp).toBeTruthy();
          expect(fs.existsSync(toFsPath(item.src))).toBe(true);
          expect(fs.existsSync(toFsPath(item.webp))).toBe(true);
        });
    });
  });

  it('video gallery items are left unchanged (no webp field required)', () => {
    projects.forEach((project) => {
      project.gallery
        .filter((item) => item.type === 'video')
        .forEach((item) => {
          expect(item.src).toMatch(/\.mp4$/);
        });
    });
  });
});
