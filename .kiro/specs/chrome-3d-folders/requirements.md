# Requirements Document

## Introduction

This feature replaces the flat CSS folder cards in the Projects carousel and the Personal photo grid of the React portfolio website with chrome 3D folder models rendered in WebGL (react-three-fiber / three.js / @react-three/drei). The 3D folders reuse the chrome aesthetic already established in the hero section's 3D logo: a shared equirectangular reflection environment map and a polished `MeshStandardMaterial`. The chrome folders are desktop-exclusive; mobile devices and visitors who prefer reduced motion continue to see the existing flat CSS folders, recolored to the site background color. Each section uses a single shared WebGL canvas (rather than one canvas per folder) that mounts only when near the viewport and renders on-demand, to stay within the browser's WebGL context budget and preserve scroll performance. The feature also migrates project cover and gallery images to WebP with original-format fallback, and fixes a bug where project folders are clipped when the viewport shrinks vertically.

## Glossary

- **Chrome_Folder_System**: The subsystem responsible for rendering folder shapes as chrome 3D models in WebGL and compositing HTML/DOM overlays over them.
- **Projects_Canvas**: The single shared WebGL `<Canvas>` instance serving the Projects carousel section.
- **Personal_Canvas**: The single shared WebGL `<Canvas>` instance serving the Personal photo grid section.
- **Project_Chrome_Folder**: A chrome 3D folder rendered within the Projects carousel using the silver chrome finish.
- **Personal_Chrome_Folder**: A chrome 3D folder rendered within the Personal photo grid using the blue/cyan tinted chrome finish.
- **Flat_Folder_Fallback**: The existing flat CSS folder cards (`FolderCard` and the `FolderCard.css` classes) shown on mobile and when reduced motion is preferred.
- **Chrome_Material**: A reusable `MeshStandardMaterial` configured for a polished chrome finish (high metalness, low roughness, environment reflection), matching the hero logo material.
- **Reflection_Environment_Map**: The shared equirectangular reflection texture, loaded via three's `TextureLoader` from a background image, assigned as `scene.environment` and as the chrome material's `envMap`.
- **Silver_Chrome_Finish**: The chrome material tint used by the hero logo and the Projects section folders.
- **Blue_Cyan_Chrome_Finish**: A blue/cyan tinted variant of the chrome material used by the Personal section folders.
- **DOM_Overlay**: HTML/DOM content (title, image, caption, photo number) positioned over a chrome folder so text and images remain crisp and accessible.
- **Pointer_Tilt**: The subtle pointer-driven rotation applied to a model, matching the hero logo's tilt behavior.
- **Canvas_Visibility_Controller**: The existing `useCanvasVisibility` utility that reports when a container is near the viewport (`mounted`) and within render range (`visible`).
- **Desktop_Mode**: The runtime condition in which the viewport does NOT match `(max-width: 700px)` AND the device matches `(hover: hover) and (pointer: fine)` AND Reduced_Motion_Mode is not active AND WebGL is available. Chrome 3D folders render only in this mode.
- **Mobile_Mode**: The runtime condition in which the viewport matches `(max-width: 700px)`.
- **Reduced_Motion_Mode**: The runtime condition in which the `prefers-reduced-motion: reduce` media query matches.
- **Modal**: The existing project detail dialog (`modal.js`) opened when the active project folder is clicked.
- **WebGL_Context_Budget**: The browser-imposed maximum number of simultaneous active WebGL rendering contexts.
- **Folder_Model**: The 3D folder shape asset located at `public/assets/models/folder.glb`.

## Requirements

### Requirement 1: Desktop-exclusive chrome rendering with flat fallback

**User Story:** As a desktop visitor, I want folders rendered as chrome 3D models, so that the Projects and Personal sections match the polished chrome aesthetic of the hero logo, while mobile and reduced-motion visitors still get a usable flat layout.

#### Acceptance Criteria

1. WHILE the viewport does not match `(max-width: 700px)` AND the device matches `(hover: hover) and (pointer: fine)` AND Reduced_Motion_Mode is not active AND WebGL is available, THE Chrome_Folder_System SHALL render the Projects and Personal section folders as chrome 3D models (Desktop_Mode).
2. WHILE Mobile_Mode is active, THE Chrome_Folder_System SHALL render the Flat_Folder_Fallback instead of chrome 3D models in the Projects and Personal sections.
3. WHILE Reduced_Motion_Mode is active, THE Chrome_Folder_System SHALL render the Flat_Folder_Fallback regardless of viewport width.
4. IF WebGL is unavailable in the browser, THEN THE Chrome_Folder_System SHALL render the Flat_Folder_Fallback regardless of viewport width or pointer capability.
5. WHILE the Flat_Folder_Fallback is rendered, THE Chrome_Folder_System SHALL color the folder tab and folder body using the site background color variable `--page-bg` as a single shared color.
6. WHEN the viewport or media-query state changes such that the active mode switches between Desktop_Mode and Mobile_Mode, THE Chrome_Folder_System SHALL switch between chrome 3D rendering and the Flat_Folder_Fallback to match the new mode after the change settles.

### Requirement 2: Shared per-section WebGL canvas within the context budget

**User Story:** As a visitor on any device, I want the site to use WebGL sparingly, so that pages stay responsive and the browser does not drop rendering contexts.

#### Acceptance Criteria

1. WHILE Desktop_Mode is active and the Projects section renders chrome folders, THE Chrome_Folder_System SHALL render all Project_Chrome_Folder instances within a single Projects_Canvas.
2. WHILE Desktop_Mode is active and the Personal section renders chrome folders, THE Chrome_Folder_System SHALL render all Personal_Chrome_Folder instances within a single Personal_Canvas.
3. WHILE a section renders more than one chrome folder, THE Chrome_Folder_System SHALL NOT create more than one WebGL canvas for that section.
4. THE Chrome_Folder_System SHALL ensure that no more than two of the site's section canvases (hero, about, projects, personal) are mounted simultaneously at any time, including during scroll transitions between adjacent sections.
5. WHEN the Canvas_Visibility_Controller reports a section container as not near the viewport (beyond its mount margin), THE Chrome_Folder_System SHALL unmount that section's WebGL canvas and release its WebGL context.
6. WHEN the Canvas_Visibility_Controller reports a section container as near the viewport (within its mount margin), THE Chrome_Folder_System SHALL mount that section's WebGL canvas.
7. WHILE a section's WebGL canvas is mounted and the Canvas_Visibility_Controller reports the section as not within render range, THE Chrome_Folder_System SHALL set that canvas render loop to never render frames.
8. WHILE a section's WebGL canvas is mounted and the Canvas_Visibility_Controller reports the section as within render range, THE Chrome_Folder_System SHALL render frames on demand only, rendering in response to camera changes, pointer-driven tilt/hover updates, or flip animation updates, and rendering zero frames while idle.
9. THE Chrome_Folder_System SHALL reuse a single Reflection_Environment_Map and a single Chrome_Material per chrome finish within each section rather than creating one Reflection_Environment_Map or Chrome_Material per folder.
10. IF a section's WebGL context is lost, THEN THE Chrome_Folder_System SHALL stop that canvas's render loop and attempt to restore rendering without requiring a page reload.

### Requirement 3: Projects section silver chrome folders

**User Story:** As a desktop visitor browsing projects, I want the active project folder shown as a silver chrome 3D folder with its title and cover image, so that the carousel reads as a polished chrome object consistent with the hero logo.

#### Acceptance Criteria

1. WHILE Desktop_Mode is active, THE Chrome_Folder_System SHALL apply the Silver_Chrome_Finish to every Project_Chrome_Folder.
2. WHILE Desktop_Mode is active, THE Chrome_Folder_System SHALL render exactly three Project_Chrome_Folder instances as chrome panels: the active folder, the folder immediately before the active folder, and the folder immediately after the active folder, where "before" and "after" wrap circularly across the six projects (before index 0 is index 5; after index 5 is index 0).
3. WHILE Desktop_Mode is active, THE Chrome_Folder_System SHALL NOT render any Project_Chrome_Folder other than the active folder and its immediate preceding and following folders as chrome panels.
4. WHILE Desktop_Mode is active, THE Chrome_Folder_System SHALL render each visible project's title and cover image as a DOM_Overlay positioned to align with its Project_Chrome_Folder, and SHALL keep the active folder's overlay aligned with the folder as its Pointer_Tilt transform changes.
5. WHEN a project title would exceed the available overlay width at the base font size, THE Chrome_Folder_System SHALL reduce the title font size so the title fits within the available overlay width without overflow, down to a minimum of 12px.
6. IF a project title still exceeds the available overlay width at the 12px minimum font size, THEN THE Chrome_Folder_System SHALL hold the 12px size and truncate the overflow with a visible truncation indicator.
7. WHILE a Project_Chrome_Folder is the active folder AND the device matches `(hover: hover) and (pointer: fine)`, THE Chrome_Folder_System SHALL apply Pointer_Tilt to the active folder, rotating it toward the pointer position in the subtle style of the hero logo.
8. WHEN the active project folder is clicked, THE Chrome_Folder_System SHALL open the existing Modal for that project without altering the Modal behavior.
9. WHEN a non-swipe interaction selects a neighboring folder in Desktop_Mode, THE Chrome_Folder_System SHALL make the selected folder the active folder.
10. WHEN swipe or arrow-key navigation changes the active project, THE Chrome_Folder_System SHALL update which three folders are rendered as chrome panels to reflect the new active folder and its immediate neighbors.

### Requirement 4: Projects carousel vertical sizing fix

**User Story:** As a visitor viewing projects in a short window, I want folders to stay fully visible, so that project folders are not cut off when the window is short.

#### Acceptance Criteria

1. WHILE the Projects section is displayed, THE Chrome_Folder_System SHALL size the project folders so that the active folder remains fully within the vertical bounds of the carousel stage.
2. WHEN the viewport height decreases, THE Chrome_Folder_System SHALL adjust the project folder sizing so that the active folder is not clipped by the carousel stage.
3. WHEN the viewport height increases, THE Chrome_Folder_System SHALL adjust the project folder sizing to use the available vertical space without clipping.

### Requirement 5: Personal section blue/cyan chrome folders

**User Story:** As a desktop visitor browsing personal photos, I want each photo shown as a blue/cyan chrome 3D folder that reacts to hover and flips to a caption, so that the gallery feels tactile and distinct from the projects section.

#### Acceptance Criteria

1. WHILE Desktop_Mode is active, THE Chrome_Folder_System SHALL apply the Blue_Cyan_Chrome_Finish to every Personal_Chrome_Folder.
2. WHILE Desktop_Mode is active, THE Chrome_Folder_System SHALL render each photo's number, image, and caption as a DOM_Overlay positioned to align within 2px of its Personal_Chrome_Folder.
3. WHEN the pointer enters a Personal_Chrome_Folder in Desktop_Mode, THE Chrome_Folder_System SHALL animate that folder to move upward and tilt.
4. WHEN the pointer leaves a Personal_Chrome_Folder in Desktop_Mode, THE Chrome_Folder_System SHALL animate that folder back to its resting position and orientation.
5. WHILE a Personal_Chrome_Folder is animating on hover, THE Chrome_Folder_System SHALL animate only the hovered folder and SHALL leave all other Personal_Chrome_Folder instances at rest.
6. WHEN a Personal_Chrome_Folder is activated by click or keyboard in Desktop_Mode while it is showing its photo, THE Chrome_Folder_System SHALL perform a 3D flip of the whole model and swap the DOM_Overlay from photo to caption at the flip midpoint.
7. WHEN a Personal_Chrome_Folder is activated by click or keyboard in Desktop_Mode while it is showing its caption, THE Chrome_Folder_System SHALL perform a 3D flip of the whole model and swap the DOM_Overlay from caption to photo at the flip midpoint.
8. THE Chrome_Folder_System SHALL expose each Personal_Chrome_Folder as a focusable control with an accessible label reflecting whether it currently shows the photo or the caption.
9. IF the pointer leaves a Personal_Chrome_Folder while a flip animation is in progress, THEN THE Chrome_Folder_System SHALL complete the flip before returning the folder to its resting position.

### Requirement 6: Project image migration to WebP with fallback

**User Story:** As a visitor, I want project images delivered efficiently, so that the projects section loads quickly while still displaying on browsers that lack WebP support.

#### Acceptance Criteria

1. THE Chrome_Folder_System SHALL provide a WebP version of each project cover image and each project gallery image, including the image currently stored in HEIC format.
2. THE Chrome_Folder_System SHALL retain each project image's original-format file as a fallback source.
3. WHEN a project cover or gallery image is displayed, THE Chrome_Folder_System SHALL offer the WebP source and the original-format fallback source through a `<picture>` element so the browser selects a supported source.
4. THE Chrome_Folder_System SHALL update `src/data/projects.json` and the related image references to point at the migrated image sources.

### Requirement 7: Performance and correctness constraints

**User Story:** As a visitor, I want the 3D folders to run smoothly without exhausting browser resources, so that scrolling and interaction stay fluid.

#### Acceptance Criteria

1. THE Chrome_Folder_System SHALL keep the number of simultaneously active WebGL contexts within the WebGL_Context_Budget.
2. WHEN a section's WebGL canvas is off-screen beyond the mount margin, THE Chrome_Folder_System SHALL release that canvas's WebGL context by unmounting the canvas.
3. WHILE a section is within render range, THE Chrome_Folder_System SHALL render frames only on demand rather than continuously.
4. WHILE the Reflection_Environment_Map is loaded as an sRGB photo, THE Chrome_Folder_System SHALL sample it in linear color space for the chrome reflections.
5. WHILE chrome folders are rendered, THE Chrome_Folder_System SHALL reuse the shared Reflection_Environment_Map and Chrome_Material across folders of the same finish rather than duplicating them per folder.
