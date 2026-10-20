// Procedural placeholder "12oz Mason Jar" models.
//
// The chaiko_mockup.glb references four jar nodes (12oz Mason Jar-1..4) but their
// mesh geometry is empty, so nothing renders for them. This builds four stand-in
// jars (lathe-turned glass body + metal screw lid) laid out in a 2x2 grid that
// fits inside the enclosure, so the intended layout is visible until a corrected
// GLB (or exported SolidWorks mesh) is provided.

import * as THREE from 'three';

// Build a traditional (wide-mouth) mason jar silhouette as a lathe profile
// (x = radius, y = height), parameterised by body radius R and total height H.
// Characteristic shape: tall straight body, a short rounded shoulder, a wide
// mouth (no narrow neck), and a flared threaded-band rim at the top. No lid.
function makeJarProfile(R, H) {
  const neckR = R * 0.64;    // narrower neck — the classic mason-jar taper
  const bandR = R * 0.70;    // threaded band bulges slightly past the neck
  const mouthR = R * 0.60;   // mouth opening
  // The shoulder taper starts around mid-upper body (H*0.58) so the recognizable
  // mason-jar neck is visible below the enclosure rather than hidden under it.
  const pts = [
    new THREE.Vector2(0.0, 0.0),            // base center
    new THREE.Vector2(R * 0.72, 0.0),       // base
    new THREE.Vector2(R * 0.98, H * 0.03),  // base fillet
    new THREE.Vector2(R, H * 0.07),
    new THREE.Vector2(R, H * 0.52),         // straight lower body
    new THREE.Vector2(R * 0.99, H * 0.58),  // shoulder begins
    new THREE.Vector2(R * 0.95, H * 0.64),
    new THREE.Vector2(R * 0.84, H * 0.70),  // rounded shoulder curving in
    new THREE.Vector2(neckR, H * 0.78),     // into the neck
    new THREE.Vector2(neckR, H * 0.82),     // short neck
    new THREE.Vector2(bandR, H * 0.85),     // threaded band bulge
    new THREE.Vector2(bandR, H * 0.90),     // band straight section
    new THREE.Vector2(bandR * 0.97, H * 0.93),
    new THREE.Vector2(mouthR, H * 0.96),    // taper to the mouth
    new THREE.Vector2(mouthR, H),           // mouth rim
    new THREE.Vector2(mouthR * 0.88, H),    // inner lip
  ];
  return pts;
}

/**
 * Build a 2x2 grid of placeholder jars sized to fit the given enclosure box.
 * @param {THREE.Box3} enclosureBox world-space bounds of the enclosure base
 */
export function buildPlaceholderJars(enclosureBox) {
  const group = new THREE.Group();
  group.name = 'placeholder-jars';

  const size = enclosureBox.getSize(new THREE.Vector3());
  const center = enclosureBox.getCenter(new THREE.Vector3());

  // Footprint and interior height drive jar sizing.
  const footprint = Math.min(size.x, size.z);
  const interiorH = size.y;

  // 2x2 grid: cell is half the footprint; jar fills most of its cell.
  const spacing = footprint * 0.26;          // distance from center to each jar axis
  const jarR = footprint * 0.21;             // wider body — mason jars are stocky
  // The jars form a base that the enclosure rests on top of. Mason jars are
  // squat, roughly as tall as ~1.3x their diameter (not bottle-like).
  const jarH = jarR * 2.6;

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xcfe8e0,
    roughness: 0.05,
    metalness: 0.0,
    transmission: 0.94,
    thickness: jarR * 0.3,
    ior: 1.5,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
  });

  const profile = makeJarProfile(jarR, jarH);
  const offsets = [
    [-spacing, -spacing],
    [ spacing, -spacing],
    [-spacing,  spacing],
    [ spacing,  spacing],
  ];

  offsets.forEach(([dx, dz], i) => {
    const jar = new THREE.Group();
    jar.name = '12oz Mason Jar (placeholder) #' + (i + 1);

    const bodyGeo = new THREE.LatheGeometry(profile, 64);
    bodyGeo.computeVertexNormals();
    jar.add(new THREE.Mesh(bodyGeo, glassMat));

    // Jars form the base: the enclosure rests on top of them (open-mouthed, no
    // lid). Position each jar so its mouth rim meets the underside of the case.
    jar.position.set(center.x + dx, enclosureBox.min.y - jarH, center.z + dz);
    group.add(jar);
  });

  return group;
}
