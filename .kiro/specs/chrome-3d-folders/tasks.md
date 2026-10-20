# Implementation Plan

Tasks are ordered so the app stays runnable throughout. All chrome rendering develops behind the `useChromeFoldersEnabled` gate, so the existing flat folder path keeps working until each section is wired in. Each task references the requirements and (where applicable) the design Correctness Properties it satisfies.

## 1. WebP image migration (independent, shippable first)

- [ ] 1.1 Add the image conversion script
  - Create `scripts/convert-images-to-webp.js` using `sharp` to generate a `.webp` twin next to each project cover/gallery source and convert `public/images/1.heic`, retaining all originals.
  - Add `sharp` as a dev dependency.
  - _Requirements: 6.1, 6.2_

- [ ] 1.2 Run the conversion and update project data
  - Run the script to produce the `.webp` files in `public/images`.
  - Update `src/data/projects.json`: add `coverWebp` to each entry and a `webp` field to each `type: "image"` gallery item; leave originals (`coverImage`, `src`) and video entries intact.
  - _Requirements: 6.1, 6.2, 6.4_

- [ ] 1.3 Add the `PictureImage` component
  - Create `src/components/common/PictureImage.js` rendering `<picture><source srcSet={webp} type="image/webp"/><img src={original} .../></picture>`, degrading to a plain `<img>` when no `webp` is supplied; pass through `alt`/`loading`/`decoding`/`className`.
  - _Requirements: 6.3_

- [ ] 1.4* Property test: `PictureImage` structure (fast-check)
  - Add `fast-check` as a dev dependency. Test over arbitrary `(webp, original)` pairs and `original`-only inputs that the `<source type="image/webp">` + `<img>` structure (or plain `<img>`) is produced.
  - Tag: `// Feature: chrome-3d-folders, Property 15`.
  - _Requirements: 6.2, 6.3 (Property 15)_

- [ ] 1.5 Swap image usages to `PictureImage`
  - Replace the cover `<img>` in `src/components/FolderCard.js`, and the gallery/cover `<img>` usages in `src/components/modal.js`, with `PictureImage`, passing the new webp paths. Modal behavior otherwise unchanged.
  - _Requirements: 6.3, 3.8_

- [ ] 1.6* Artifact-existence test
  - Assert every referenced original image has a `.webp` twin (including the HEIC source) and every original still exists; assert `projects.json` carries `coverWebp`/gallery `webp` where twins exist.
  - _Requirements: 6.1, 6.2, 6.4_

## 2. Shared chrome primitives and pure logic

- [ ] 2.1 Extract the shared chrome material/env module
  - Create `src/utils/chromeMaterial.js` exporting `useReflectionEnvironment(url)` (TextureLoader load, `EquirectangularReflectionMapping`, `LinearSRGBColorSpace`, assign/restore `scene.environment`, return texture), `createChromeMaterial(colorHex, overrides)` factory, and `SILVER_CHROME = '#eef2f7'` / `BLUE_CYAN_CHROME` constants.
  - _Requirements: 2.9, 7.4, 7.5, 3.1, 5.1_

- [ ] 2.2 Add the folder model path
  - Add `FOLDER_MODEL_URL` (default `/assets/models/folder.glb`) to `src/utils/modelPaths.js`.
  - _Requirements: 3.1, 5.1_

- [ ] 2.3 Add pure-logic helper modules
  - Implement and export small pure functions (co-located under `src/utils/` or `src/components/chrome/`): mode predicate `chromeFoldersEnabled(inputs)`, `windowFor(activeIndex, length)` (circular 3-set), `fitTitle(text, availableWidth, baseSize, measure)` (12px floor + truncation flag), `fitScale(stageHeight, modelHeight)`, `faceFor(progress, from, to)` (midpoint swap).
  - _Requirements: 1.1–1.4, 3.2, 3.3, 3.5, 3.6, 4.1–4.3, 5.6, 5.7_

- [ ] 2.4 Add the mode-detection hook
  - Create `src/components/chrome/useChromeFoldersEnabled.js`: combines `!matchMedia('(max-width:700px)')`, `matchMedia('(hover:hover) and (pointer:fine)')`, `!matchMedia('(prefers-reduced-motion:reduce)')`, and a cached `isWebGLAvailable()` probe; subscribes to media-query `change` + `resize`; returns boolean using the pure predicate from 2.3.
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_

- [ ] 2.5 Add the `SectionCanvas` wrapper
  - Create `src/components/chrome/SectionCanvas.js`: `useCanvasVisibility(containerRef)`, mount `<Canvas>` only when `mounted`, `frameloop={visible ? 'demand' : 'never'}`, `dpr={[1,1.25]}`, `gl={{ alpha:true, powerPreference:'high-performance' }}`; register `webglcontextlost`/`webglcontextrestored` to stop/resume the loop without reload; render `null` when unmounted.
  - _Requirements: 2.5, 2.6, 2.7, 2.8, 2.10, 7.2_

- [ ] 2.6* Property tests: mode predicate, title fit, fit scale, flip face (fast-check)
  - Property 1: `chromeFoldersEnabled` true iff `!narrow && hoverFine && !reducedMotion && webgl`, over all 16 boolean tuples.
  - Property 8: `fitTitle` result in `[12, base]`, fits-when-achievable, truncates-at-floor (injectable measure stub).
  - Property 10: `fitScale` yields `scaledHeight <= stageHeight` and is monotonic over positive heights.
  - Property 12: `faceFor` returns the start face while `progress < π/2`, target face at/after.
  - Tag each `// Feature: chrome-3d-folders, Property N`.
  - _Requirements: 1.1–1.4, 3.5, 3.6, 4.1–4.3, 5.6, 5.7 (Properties 1, 8, 10, 12)_

- [ ] 2.7* Example test: reflection environment config
  - After `useReflectionEnvironment`, assert `texture.colorSpace === LinearSRGBColorSpace` and `texture.mapping === EquirectangularReflectionMapping`.
  - _Requirements: 7.4_

## 3. Reusable ChromeFolder component

- [ ] 3.1 Implement `ChromeFolder`
  - Create `src/components/chrome/ChromeFolder.js`: `useGLTF(FOLDER_MODEL_URL)`, `useMemo(() => gltf.scene.clone(true), [gltf.scene])` (shares geometry, independent transform), assign the shared `material` prop to every mesh, remove embedded camera nodes; `getFitScale` sizing with resting rotation; props `position`/`scale`/`tilt`/`lift`/`hoverTilt`/`flip`/`onFlipMidpoint`/`animating`; `useFrame` lerp toward targets with `response = 1 - Math.exp(-k*delta)` and `invalidate()` only while moving; fire `onFlipMidpoint` as rotation crosses π/2; no per-frame work when at rest and `!animating`.
  - _Requirements: 2.8, 2.9, 3.1, 5.1, 5.6, 5.7, 7.5_

- [ ] 3.2* Property tests: shared material reuse and finish assignment (fast-check)
  - Property 4: for any folder count in a section, exactly one material instance per finish is created and every folder references it.
  - Property 5: every rendered folder references its section's shared finish material.
  - Render with r3f stubbed and the material factory spied.
  - _Requirements: 2.9, 3.1, 5.1, 7.5 (Properties 4, 5)_

## 4. Projects section chrome folders

- [ ] 4.1 Implement `ProjectsCanvas`
  - Create `src/components/chrome/ProjectsCanvas.js`: compute the circular window via `windowFor(activeIndex, 6)`, render exactly three `ChromeFolder` at prev/active/next positions mapped to the carousel offsets, silver finish, apply `tilt` to the active folder only, project each folder's bounds to screen pixels and report via `onFolderRects`.
  - _Requirements: 3.1, 3.2, 3.3, 3.7_

- [ ] 4.2 Fix carousel vertical sizing
  - In `src/components/ProjectCarousel.css`, replace `.carousel-stage { height: min(68vh, 580px); }` with `height: clamp(340px, 68dvh, 580px);` so short viewports do not clip; ensure the 3D fit derives from the measured stage/canvas height.
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 4.3 Wire `ProjectCarousel.js` chrome vs flat path
  - Call `useChromeFoldersEnabled()`. When false, render the existing flat `FolderCard` carousel (with fallback recolor from 4.6). When true, render `SectionCanvas` + `ProjectsCanvas` plus the DOM overlay layer.
  - Keep existing swipe/arrow/prev-next handlers updating `index` (which recomputes the window); clicking the active overlay opens the existing `Modal` via the existing `setSelected` path, unchanged.
  - _Requirements: 1.1, 1.2, 3.8, 3.9, 3.10_

- [ ] 4.4 Projects DOM overlay layer with title auto-fit
  - For each of the three visible folders, render an absolutely-positioned overlay (title + `PictureImage` cover) positioned from `onFolderRects`; keep the active folder's overlay tracking its tilt transform; apply `fitTitle` with the 12px floor and truncation fallback.
  - _Requirements: 3.4, 3.5, 3.6_

- [ ] 4.5 Projects pointer tilt
  - Add a `(hover:hover) and (pointer:fine)`-gated window `pointermove` → `tiltTarget` mapping (hero math), passed to `ProjectsCanvas`, applied to the active folder only.
  - _Requirements: 3.7_

- [ ] 4.6 Flat fallback recolor
  - In `src/components/FolderCard.css`, add a fallback modifier that sets the folder tab and body background to `var(--page-bg)` (single shared color) when the flat fallback is active.
  - _Requirements: 1.5_

- [ ] 4.7* Property/integration tests for projects
  - Property 6: `windowFor` returns exactly `{(a-1+6)%6, a, (a+1)%6}` for all active indices.
  - Property 7: overlay rect stays within tolerance / tracks tilt (deterministic projection).
  - Property 9: tilt target bounded and applied to active folder only.
  - Property 10: active folder fits the stage for any stage/model height.
  - Integration: click active overlay → existing `Modal` opens with that project; click neighbor → it becomes active (Req 3.8, 3.9). Short-viewport no-clip (Req 4).
  - Tag property tests `// Feature: chrome-3d-folders, Property N`.
  - _Requirements: 3.2, 3.3, 3.4, 3.7, 3.8, 3.9, 4.1–4.3 (Properties 6, 7, 9, 10)_

## 5. Personal section chrome folders

- [ ] 5.1 Implement `PersonalCanvas`
  - Create `src/components/chrome/PersonalCanvas.js`: lay out up to N `ChromeFolder` in a grid matching the DOM breakpoints (5/4/3 columns → 10/8/6 tiles), blue/cyan finish, animate lift+tilt on only the `hoveredId` folder (`animating` only for it), drive per-folder `flip` toward 0/π with `onFlipMidpoint(id)` at π/2, report screen rects via `onFolderRects`.
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [ ] 5.2 Wire `imagegallery.js` chrome vs flat path
  - Call `useChromeFoldersEnabled()`. When false, render the existing flip-tile grid (with fallback recolor from 5.4). When true, render `SectionCanvas` + `PersonalCanvas` plus the per-tile DOM overlay (number/photo via `PictureImage`/caption) positioned within 2px from `onFolderRects`.
  - Track `hoveredId` (pointer enter/leave) and `flipState[id]`; swap overlay face when `onFlipMidpoint(id)` fires; hold flip to completion before resetting lift if the pointer leaves mid-flip.
  - _Requirements: 1.1, 1.2, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.9_

- [ ] 5.3 Focusable flip controls with ARIA state
  - Expose each personal folder as a focusable control (click + Enter/Space) with `aria-pressed` and an `aria-label` reflecting whether the photo or caption is currently shown.
  - _Requirements: 5.8_

- [ ] 5.4 Personal flat fallback recolor
  - In `src/components/imagegallery.css` (and `FolderCard.css` as needed), recolor the fallback flip-tile tab/body to `var(--page-bg)` when the flat fallback is active.
  - _Requirements: 1.5_

- [ ] 5.5* Property/accessibility tests for personal
  - Property 2: one canvas per section for any folder count.
  - Property 3: at most two section canvases mounted across generated scroll offsets.
  - Property 11: only the hovered folder animates; enter→leave restores rest.
  - Property 13: pointer-leave mid-flip completes the flip before lift resets.
  - Property 14: each folder control focusable with state-accurate label.
  - Accessibility: keyboard flip (Tab/Enter/Space) toggles `aria-pressed`/label (Req 5.8).
  - Tag property tests `// Feature: chrome-3d-folders, Property N`.
  - _Requirements: 2.1–2.4, 5.3, 5.4, 5.5, 5.8, 5.9 (Properties 2, 3, 11, 13, 14)_

## 6. Final verification

- [ ] 6.1* Headless visual + performance verification (playwright-core)
  - Load the running build; screenshot Projects (three silver folders with reflections) and Personal (blue/cyan grid) to confirm chrome renders.
  - Assert `document.querySelectorAll('canvas').length <= 2` while scrolling the projects↔personal boundary (Req 2.4 / Property 3).
  - Resize to a short viewport and screenshot that the active project folder is not clipped (Req 4).
  - Confirm idle visible section draws 0 frames and an interaction produces frames (Req 2.8).
  - _Requirements: 2.4, 2.8, 4.1–4.3, 7.1_

- [ ] 6.2 Build, lint, and cleanup
  - Confirm `npm run build` passes and the dev server/lint stays green; remove any temporary verification scripts/screenshots created during 6.1.
  - _Requirements: 7.1_
