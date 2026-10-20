import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import {
  Box3,
  Color,
  EquirectangularReflectionMapping,
  LinearSRGBColorSpace,
  MeshStandardMaterial,
  TextureLoader,
  Vector3,
} from 'three';
import { Center, Text3D, useGLTF } from '@react-three/drei';
import useCanvasVisibility from '../utils/useCanvasVisibility';
import useThemeColor from '../utils/useThemeColor';
import { HERO_NAME_MODEL_URL, DRACO_DECODER_PATH } from '../utils/modelPaths';

// Static image used as the equirectangular reflection source so the chrome
// surface mirrors the hero backdrop (the same blue/white sky shown behind it).
const REFLECTION_IMAGE_URL = '/assets/backgrounds/hero-image.webp';

// Bright, lightly blue-leaning silver so the chrome reads light against the
// dark LED-grid backdrop (which it also reflects via the env map).
const CHROME_COLOR = new Color('#eef2f7');



// Fit a model to the available viewport. This scales both DOWN (large models)
// and UP (tiny models) — the hero GLB is modelled in meters and is only a few
// centimeters across, so without upscaling it renders as an invisible speck.
function getFitScale(viewportWidth, viewportHeight, modelWidth, modelHeight) {
  if (!modelWidth || !modelHeight) return 1;
  return Math.min((viewportWidth * 0.72) / modelWidth, (viewportHeight * 0.62) / modelHeight);
}

// Loads the hero background as a plain texture and wires it up as an
// equirectangular reflection map. We use TextureLoader directly (rather than
// drei's <Environment files=...jpg>, which routes JPEGs through a gain-map HDR
// loader and fails on ordinary photos, blanking the whole canvas). The texture
// is set as scene.environment so every metallic material reflects it, and is
// returned so it can also be assigned as the chrome material's envMap.
function useReflectionEnvironment() {
  const scene = useThree((state) => state.scene);
  const invalidate = useThree((state) => state.invalidate);
  const texture = useLoader(TextureLoader, REFLECTION_IMAGE_URL);

  useLayoutEffect(() => {
    texture.mapping = EquirectangularReflectionMapping;
    // Environment/reflection maps are sampled in linear space. Tagging the
    // sRGB photo as plain sRGB double-applies the curve and skews reflections
    // warm/pink; linear-sRGB keeps the blue-and-white backdrop true to color.
    texture.colorSpace = LinearSRGBColorSpace;
    const previous = scene.environment;
    scene.environment = texture;
    invalidate();
    return () => {
      if (scene.environment === texture) scene.environment = previous;
    };
  }, [scene, texture, invalidate]);

  return texture;
}

function TextName() {
  const textRef = useRef(null);
  const [bounds, setBounds] = useState(null);
  const viewportWidth = useThree((state) => state.viewport.width);
  const viewportHeight = useThree((state) => state.viewport.height);

  useEffect(() => {
    const geometry = textRef.current?.geometry;
    if (!geometry) return;
    if (!geometry.boundingBox) geometry.computeBoundingBox();
    const size = geometry.boundingBox.getSize(new Vector3());
    setBounds({ width: size.x, height: size.y });
  }, []);

  const scale = getFitScale(viewportWidth, viewportHeight, bounds?.width, bounds?.height);

  return (
    <group scale={scale}>
      <Center>
        <Text3D
          ref={textRef}
          font="https://threejs.org/examples/fonts/helvetiker_regular.typeface.json"
          size={0.72}
          height={0.22}
          curveSegments={8}
          bevelEnabled
          bevelThickness={0.03}
          bevelSize={0.02}
          letterSpacing={0.04}
        >
          alice petrosyan
          <meshStandardMaterial color={CHROME_COLOR} metalness={1} roughness={0.08} envMapIntensity={1.4} />
        </Text3D>
      </Center>
    </group>
  );
}

function GltfName() {
  // Second arg = Draco decoder path: the hero GLB is Draco-compressed, decoded
  // with the locally-served decoder in public/draco.
  const gltf = useGLTF(HERO_NAME_MODEL_URL, DRACO_DECODER_PATH);
  const viewportWidth = useThree((state) => state.viewport.width);
  const viewportHeight = useThree((state) => state.viewport.height);
  const invalidate = useThree((state) => state.invalidate);
  const envMap = useReflectionEnvironment();

  // A single chrome material applied to every mesh in the model so the whole
  // thing reads as polished silver. The background image is set both as the
  // explicit envMap and (via useReflectionEnvironment) as scene.environment.
  const chromeMaterial = useMemo(() => {
    const material = new MeshStandardMaterial({
      color: CHROME_COLOR,
      // Polished chrome finish: fully metallic, low roughness for crisp
      // mirror-like reflections of the environment.
      metalness: 1,
      roughness: 0.1,
      envMapIntensity: 1.1,
    });
    return material;
  }, []);

  useLayoutEffect(() => {
    chromeMaterial.envMap = envMap;
    chromeMaterial.needsUpdate = true;
    invalidate();
  }, [chromeMaterial, envMap, invalidate]);

  useLayoutEffect(() => {
    // The GLB ships its own (orthographic) camera node. r3f renders through the
    // <Canvas> camera, so remove the embedded one to keep it out of bounds/Center
    // calculations.
    const cameras = [];
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.material = chromeMaterial;
        child.castShadow = false;
        child.receiveShadow = false;
      } else if (child.isCamera) {
        cameras.push(child);
      }
    });
    cameras.forEach((camera) => camera.parent?.remove(camera));
    invalidate();
  }, [gltf.scene, chromeMaterial, invalidate]);

  const bounds = useMemo(
    () => new Box3().setFromObject(gltf.scene).getSize(new Vector3()),
    [gltf.scene]
  );
  // The model comes in rotated 90° CCW, so we rotate it -90° about Z to make it
  // upright. That swaps its width/height, so fit against the swapped bounds.
  const scale = getFitScale(viewportWidth, viewportHeight, bounds.y, bounds.x);

  return (
    <group scale={scale}>
      <group rotation={[0, 0, -Math.PI / 2]}>
        <Center>
          <primitive object={gltf.scene} />
        </Center>
      </group>
    </group>
  );
}

function usePointerTiltEnabled() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setEnabled(query.matches && window.innerWidth > 768);
    update();
    query.addEventListener('change', update);
    window.addEventListener('resize', update);
    return () => {
      query.removeEventListener('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return enabled;
}

function NameModel({ enableTilt }) {
  const group = useRef();
  const target = useRef({ x: 0, y: 0 });
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (!enableTilt) return undefined;

    const onMove = (event) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = (event.clientY / window.innerHeight) * 2 - 1;
      target.current = { x: y * 0.5, y: x * 0.32 };
      invalidate();
    };

    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [enableTilt, invalidate]);

  useFrame((state, delta) => {
    if (!group.current) return;
    const response = 1 - Math.exp(-8 * delta);
    const targetRotation = enableTilt ? target.current : { x: 0, y: 0 };
    group.current.rotation.x += (targetRotation.x - group.current.rotation.x) * response;
    group.current.rotation.y += (targetRotation.y - group.current.rotation.y) * response;
    if (
      Math.abs(targetRotation.x - group.current.rotation.x) > 0.001 ||
      Math.abs(targetRotation.y - group.current.rotation.y) > 0.001
    ) {
      state.invalidate();
    }
  });

  return (
    <group ref={group}>
      {HERO_NAME_MODEL_URL ? <GltfName /> : <TextName />}
    </group>
  );
}

function TiltName() {
  const enableTilt = usePointerTiltEnabled();
  const containerRef = useRef(null);
  const { visible, mounted } = useCanvasVisibility(containerRef);
  const accent = useThemeColor('--blue-highlight');

  return (
    <div className="tilt-name" ref={containerRef}>
      {/* Unmount the WebGL context when scrolled well past the hero so it does
          not hold a context slot or GPU memory while off-screen. */}
      {mounted && (
        <Canvas
          /* Very narrow FOV from far back ≈ near-orthographic projection, which
             removes almost all perspective foreshortening so the model reads
             flat/even rather than bowed. */
          camera={{ position: [0, 0, 22], fov: 12 }}
          dpr={[1, 1.25]}
          frameloop={visible ? 'demand' : 'never'}
          gl={{ alpha: true }}
        >
          {/* Low ambient + a harsh, concentrated spotlight so highlights snap
              sharply to shadow across the bevels — that hard specular edge is
              what makes the 3D letter edges pop. The directionals shape the
              broad form; the spot adds the crisp glint. */}
          <ambientLight intensity={0.22} />
          <directionalLight position={[6, 7, 6]} intensity={1.6} />
          <directionalLight position={[-6, 3, -4]} intensity={0.5} color={accent || undefined} />
          <directionalLight position={[0, -4, 2]} intensity={0.25} />
          {/* Harsh key spotlight: tight cone, sharp edge (low penumbra), high
              intensity for a hard specular highlight on the chrome. */}
          <spotLight
            position={[7, 9, 10]}
            angle={0.5}
            penumbra={0.15}
            intensity={6}
            distance={0}
            decay={0}
          />
          <Suspense fallback={null}>
            {/* The reflection env map is loaded inside the model component via
                useReflectionEnvironment and assigned to scene.environment, so
                the chrome mirrors the hero backdrop. The canvas stays
                transparent (gl alpha) so the CSS GIF shows through behind it. */}
            <NameModel enableTilt={enableTilt} />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}

export default TiltName;
