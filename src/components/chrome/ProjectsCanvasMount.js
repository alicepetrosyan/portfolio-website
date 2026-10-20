/*
 * The WebGL half of the Projects carousel, isolated so it can be lazy-loaded on
 * its own. Importing this module is what pulls in three.js / r3f / drei, so
 * keeping it separate lets ProjectCarousel render its lightweight DOM shell
 * (parallax background, title, layout) EAGERLY — those paint immediately on
 * scroll — while only the 3D folders stream in behind the heavy chunk.
 *
 * Feature: chrome-3d-folders
 */
import SectionCanvas from './SectionCanvas';
import ProjectsScene from './ProjectsCanvas';

function ProjectsCanvasMount({ stageRef, projects, index, tiltTarget, baseScale, onRects }) {
  return (
    <SectionCanvas
      containerRef={stageRef}
      camera={{ position: [0, 0, 15], fov: 20 }}
      /* Mount a bit earlier than the default so the folders have drawn their
         first frame before the section scrolls into view — but not so early
         (was 1200px) that the projects context stays alive while personal's
         also mounts, which risked 3 live WebGL contexts at once. 800px gives a
         head start while limiting overlap to at most two adjacent contexts. */
      visibilityOptions={{ mountMargin: '800px', renderMargin: '300px' }}
    >
      <ProjectsScene
        projectCount={projects.length}
        projectsList={projects}
        activeIndex={index}
        tiltTarget={tiltTarget}
        baseScale={baseScale}
        onRects={onRects}
      />
    </SectionCanvas>
  );
}

export default ProjectsCanvasMount;
