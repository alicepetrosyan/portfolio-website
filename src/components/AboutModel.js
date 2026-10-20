import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Box3, Vector3 } from 'three';
import { Center, useGLTF } from '@react-three/drei';
import useCanvasVisibility from '../utils/useCanvasVisibility';
import useThemeColor from '../utils/useThemeColor';
import PictureImage from './common/PictureImage';
import { ABOUT_MODEL_URL } from '../utils/modelPaths';

function getFitScale(viewportWidth, viewportHeight, modelWidth, modelHeight) {
  if (!modelWidth || !modelHeight) return 1;
  return Math.min(1, (viewportWidth * 0.82) / modelWidth, (viewportHeight * 0.82) / modelHeight);
}

function GltfFigure() {
  const gltf = useGLTF(ABOUT_MODEL_URL);
  const viewportWidth = useThree((state) => state.viewport.width);
  const viewportHeight = useThree((state) => state.viewport.height);
  const bounds = useMemo(
    () => new Box3().setFromObject(gltf.scene).getSize(new Vector3()),
    [gltf.scene]
  );
  const scale = getFitScale(viewportWidth, viewportHeight, bounds.x, bounds.y);

  return (
    <group scale={scale}>
      <Center>
        <primitive object={gltf.scene} />
      </Center>
    </group>
  );
}

// 3D canvas path — used once an about model exists (ABOUT_MODEL_URL set).
function AboutCanvas() {
  const containerRef = useRef(null);
  const { visible, mounted } = useCanvasVisibility(containerRef);
  const background = useThemeColor('--blue-panel');

  return (
    <div className="about-model" ref={containerRef}>
      {/* Only mount the WebGL context when the section is near the viewport.
          Far off-screen the Canvas unmounts, releasing GPU memory and freeing
          a WebGL context slot (browsers cap simultaneous contexts). */}
      {mounted && (
        <Canvas
          camera={{ position: [0, 0.2, 4.2], fov: 40 }}
          dpr={[1, 1.25]}
          frameloop={visible ? 'demand' : 'never'}
        >
          {background && <color attach="background" args={[background]} />}
          <ambientLight intensity={0.8} />
          <directionalLight position={[3, 4, 5]} intensity={1.2} />
          <Suspense fallback={null}>
            <GltfFigure />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}

// Static image placeholder shown until the 3D about model is ready. Swap to the
// 3D render by setting ABOUT_MODEL_URL (env var or default path in modelPaths).
function AboutModel() {
  if (ABOUT_MODEL_URL) {
    return <AboutCanvas />;
  }
  return (
    <div className="about-model about-model--image">
      <PictureImage
        src="/images/photostack1.jpg"
        webp="/images/photostack1.webp"
        alt="Alice"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

export default AboutModel;
