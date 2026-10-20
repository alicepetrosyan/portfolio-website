# Unused Assets

Audit of files under `public/` cross-referenced against every asset reference in
`src/**` (JS/CSS/JSON), `public/index.html`, and `public/manifest.json`.

Generated to track candidates for deletion. **Nothing here has been deleted yet.**
Verify once more before removing (e.g. `git grep` the filename) in case a
reference is added later.

> Reachability note: the app entry is `src/App.js`, which renders
> `Navbar, HeroSection, About, ProjectCarousel, PersonalSection, Contact,
> ScrollArrow`. There is **no router**, so `src/components/pages/*` and anything
> only they import is dead code (see "Used only by dead code" below).

---

## 1. Definitely unused — safe to delete

No reference anywhere in source, HTML, or manifest.

### Large / high-impact (worth removing first)
| File | Size |
| --- | --- |
| `public/images/noise.png` | ~69.4 MB |
| `public/videos/placeholder-gif.gif` | ~15.1 MB |
| `public/images/personal-background.png` | ~12.1 MB |
| `public/images/6.png` | ~27.0 MB |
| `public/images/4.png` | ~8.4 MB |
| `public/images/20.png` | ~7.8 MB |
| `public/images/2.png` | ~6.1 MB |
| `public/images/3.png` | ~6.1 MB |
| `public/images/5.png` | ~3.1 MB |

### Numbered source images (originals already copied into `assets/personal-gallery/*.webp`)
These `images/1.heic` … `images/20.*` files are not referenced; the personal
gallery loads its own `assets/personal-gallery/*.webp` copies instead.
| File | Size |
| --- | --- |
| `public/images/1.heic` | ~0.9 MB |
| `public/images/7.jpg` | ~1.5 MB |
| `public/images/8.jpg` | ~0.3 MB |
| `public/images/9.jpg` | ~0.5 MB |
| `public/images/10.jpg` | ~0.25 MB |
| `public/images/11.jpg` | ~0.5 MB |
| `public/images/12.jpg` | ~0.4 MB |
| `public/images/13.jpg` | ~0.4 MB |
| `public/images/14.jpg` | ~1.6 MB |
| `public/images/15.jpg` | ~2.1 MB |
| `public/images/16.jpg` | ~2.3 MB |
| `public/images/17.jpg` | ~2.9 MB |
| `public/images/18.jpg` | ~2.6 MB |
| `public/images/19.jpeg` | ~0.4 MB |

### Other unused images
| File | Size |
| --- | --- |
| `public/assets/backgrounds/hero-background.gif` | ~0.9 MB (hero renders `hero-image.jpg`, not this) |
| `public/images/hero-section-background-2.jpg` | ~0.47 MB |
| `public/images/about-content.png` | ~0.21 MB |
| `public/images/about-me-container-2.png` | ~0.11 MB |
| `public/images/camera-frame-3.png` | ~0.19 MB |
| `public/images/background-placeholder.jpg` | ~0.07 MB |
| `public/images/navbutton.png` | ~0.49 MB |
| `public/images/navbutton_noring.png` | ~0.34 MB |
| `public/images/navbar-border.gif` | ~2 KB |

---

## 2. Now fully unused — the dead components were deleted

The dead-code components below were **deleted**, so the assets they referenced
are now unreferenced and safe to remove.

Deleted components (done):
- `src/components/pages/` (home.js, projects.js, personal.js) — whole directory
- `src/components/projectcards.js`, `src/components/projectcards.css`
- `src/components/SpotlightCard.js`, `src/components/SpotlightCard.css`
- `src/components/projectdata.js`
- `src/components/CardStack.js`, `src/components/CardStack.css`

Assets they referenced (now safe to delete):
| File | Size |
| --- | --- |
| `public/images/hero-section-background.jpg` | ~48 KB |
| `public/images/photostack2.jpg` | ~0.7 MB |
| `public/images/photostack3.jpg` | ~0.78 MB |
| `public/images/photostack4.jpg` | ~0.82 MB |

(`SpotlightCard.js` had defaulted `img` to `images/icon-placeholder.jpg`, but
that file IS used by the live projects data, so keep it.)

---

## 3. In use — DO NOT delete

- `public/favicon.ico`, `public/logo192.png`, `public/logo512.png` (index.html + manifest.json)
- `public/assets/backgrounds/hero-image.jpg` (hero backdrop + reflection map)
- `public/assets/backgrounds/projects-background.jpg` (projects parallax)
- `public/assets/models/hero_section.glb` (hero 3D name)
- `public/assets/models/folder.glb` (projects + personal 3D folders)
- `public/assets/personal-gallery/*.webp` (all 19 — personal gallery)
- `public/images/photostack1.jpg` + `photostack1.webp` (about section placeholder)
- Project covers/gallery (live via `src/data/projects.json`):
  `icon-placeholder.{jpg,webp}`, `melodie.{jpg,webp}`, `rear-wing.{jpg,webp}`,
  `servo-depositor.{jpg,webp}`, `tsi-nozzle.{png,webp}`
- `public/videos/placeholder-video.mp4` (projects.json gallery entries)
- Resume/portfolio PDFs imported by `src/components/Contact.js`

---

## Rough space recoverable
Deleting Section 1 alone frees **~180 MB** (dominated by `noise.png` 69 MB,
`6.png` 27 MB, `placeholder-gif.gif` 15 MB, `personal-background.png` 12 MB, and
the numbered PNG/JPG originals). Section 2 adds ~2.3 MB more.
