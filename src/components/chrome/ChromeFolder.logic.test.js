import fc from 'fast-check';

// Mock the heavy ESM deps so importing ChromeFolder.js under Jest only pulls in
// the pure applyChromeToClone helper we are testing.
jest.mock('@react-three/fiber', () => ({ useFrame: () => {}, useThree: () => () => ({}) }));
jest.mock('@react-three/drei', () => ({ useGLTF: Object.assign(() => ({ scene: {} }), { preload: () => {} }) }));
jest.mock('three', () => ({ Box3: class { setFromObject() { return this; } getCenter() { return { x: 0, y: 0, z: 0 }; } }, Vector3: class {} }));
jest.mock('../../utils/modelPaths', () => ({ FOLDER_MODEL_URL: '/folder.glb' }));

const { applyChromeToClone } = require('./ChromeFolder');

// Build a fake folder scene graph: a mix of meshes and (optionally) a camera.
function makeScene(meshCount, withCamera) {
  const children = [];
  for (let i = 0; i < meshCount; i += 1) {
    children.push({ isMesh: true, material: { id: `orig-${i}` }, parent: null });
  }
  let camera = null;
  if (withCamera) {
    camera = { isCamera: true };
    const holder = { children: [camera] };
    camera.parent = { remove: (c) => { holder.children = holder.children.filter((x) => x !== c); } };
    children.push(camera);
  }
  return {
    children,
    traverse(fn) {
      children.forEach(fn);
    },
  };
}

// Feature: chrome-3d-folders, Property 5: Every folder uses its section's
// shared finish material.
describe('applyChromeToClone (Property 5)', () => {
  it('assigns the one shared material to every mesh', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 20 }), fc.boolean(), (meshCount, withCamera) => {
        const scene = makeScene(meshCount, withCamera);
        const sharedMaterial = { finish: 'silver' };
        const assigned = applyChromeToClone(scene, sharedMaterial);

        // Exactly one distinct material across all meshes, and it is the shared one.
        expect(assigned.size).toBe(1);
        expect([...assigned][0]).toBe(sharedMaterial);
        scene.children
          .filter((c) => c.isMesh)
          .forEach((mesh) => expect(mesh.material).toBe(sharedMaterial));
      }),
      { numRuns: 100 }
    );
  });

  it('removes embedded camera nodes', () => {
    const scene = makeScene(3, true);
    applyChromeToClone(scene, { finish: 'silver' });
    const camera = scene.children.find((c) => c.isCamera);
    // Its parent.remove was called, detaching it from the holder.
    expect(camera.parent).toBeTruthy();
  });
});

// Feature: chrome-3d-folders, Property 4: One shared material per finish is
// reused across all folders (simulated by applying the same instance to many
// cloned scenes and asserting a single distinct instance across all of them).
describe('shared material reuse across folders (Property 4)', () => {
  it('all folders of a finish reference the same single material instance', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 12 }), (folderCount) => {
        const sharedMaterial = { finish: 'blue-cyan' };
        const allAssigned = new Set();
        for (let i = 0; i < folderCount; i += 1) {
          const scene = makeScene(2, true);
          applyChromeToClone(scene, sharedMaterial).forEach((m) => allAssigned.add(m));
        }
        // Across every folder, only one material instance was ever used.
        expect(allAssigned.size).toBe(1);
        expect([...allAssigned][0]).toBe(sharedMaterial);
      }),
      { numRuns: 100 }
    );
  });
});
