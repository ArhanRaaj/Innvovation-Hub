/**
 * 3D Rotating Geometric Monolith for Hero Section
 * Powered by Three.js WebGL with specular metallic facets, nested counter-rotating wireframes,
 * volumetric point lights, and smooth mouse-tracking parallax.
 */

declare const THREE: any;

export function initHeroRotatingMonolith(containerId: string = 'hero-monolith-canvas-container'): void {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Ensure Three.js is loaded
  if (typeof THREE === 'undefined') {
    // Retry when script finishes loading
    setTimeout(() => initHeroRotatingMonolith(containerId), 200);
    return;
  }

  // Clear previous canvas if any
  container.innerHTML = '';

  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  // Scene & Camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
  camera.position.set(0, 0.1, 6.4);

  // WebGL Renderer
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  const canvas = renderer.domElement;
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  container.appendChild(canvas);

  // Monolith Root Group
  const monolithRoot = new THREE.Group();
  scene.add(monolithRoot);

  // 1. Outer Faceted Metallic Icosahedron
  const outerGeom = new THREE.IcosahedronGeometry(2.1, 0);
  const outerMat = new THREE.MeshPhysicalMaterial({
    color: 0x0a0c10,
    metalness: 0.92,
    roughness: 0.22,
    reflectivity: 0.95,
    clearcoat: 0.9,
    clearcoatRoughness: 0.15,
    transparent: true,
    opacity: 0.88,
    flatShading: true,
    side: THREE.DoubleSide
  });
  const outerMesh = new THREE.Mesh(outerGeom, outerMat);
  monolithRoot.add(outerMesh);

  // Outer Crisp Beveled Wireframe Edges
  const outerEdges = new THREE.EdgesGeometry(outerGeom);
  const outerLine = new THREE.LineSegments(
    outerEdges,
    new THREE.LineBasicMaterial({ color: 0xc8d5e5, transparent: true, opacity: 0.85 })
  );
  monolithRoot.add(outerLine);

  // 2. Middle Nested Wireframe Icosahedron (Counter-rotating)
  const innerCage = new THREE.Group();
  monolithRoot.add(innerCage);

  const midGeom = new THREE.IcosahedronGeometry(1.45, 0);
  const midEdges = new THREE.EdgesGeometry(midGeom);
  const midLine = new THREE.LineSegments(
    midEdges,
    new THREE.LineBasicMaterial({ color: 0x00f2fe, transparent: true, opacity: 0.9 })
  );
  innerCage.add(midLine);

  // 3. Innermost Octahedron / Core Star Cage
  const coreCage = new THREE.Group();
  innerCage.add(coreCage);

  const coreGeom = new THREE.OctahedronGeometry(0.9, 0);
  const coreEdges = new THREE.EdgesGeometry(coreGeom);
  const coreLine = new THREE.LineSegments(
    coreEdges,
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 })
  );
  coreCage.add(coreLine);

  // Center Glowing Core Orb
  const orbGeom = new THREE.SphereGeometry(0.24, 32, 32);
  const orbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const centerOrb = new THREE.Mesh(orbGeom, orbMat);
  coreCage.add(centerOrb);

  // Volumetric Point Light inside Core
  const corePointLight = new THREE.PointLight(0x00f2fe, 4.5, 16);
  coreCage.add(corePointLight);

  // 4. Studio Lighting
  const ambientLight = new THREE.AmbientLight(0x1e293b, 1.4);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
  keyLight.position.set(6, 8, 5);
  scene.add(keyLight);

  const cyanRimLight = new THREE.DirectionalLight(0x00f2fe, 2.5);
  cyanRimLight.position.set(-6, -4, 4);
  scene.add(cyanRimLight);

  const topRim = new THREE.DirectionalLight(0x38bdf8, 2.0);
  topRim.position.set(0, 8, -4);
  scene.add(topRim);

  // Mouse Parallax Interactivity
  let mouseX = 0;
  let mouseY = 0;
  let targetTiltX = 0;
  let targetTiltY = 0;
  let currentTiltX = 0;
  let currentTiltY = 0;

  window.addEventListener('mousemove', (e: MouseEvent) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    targetTiltX = mouseY * 0.35;
    targetTiltY = mouseX * 0.45;
  });

  // Handle Resize
  window.addEventListener('resize', () => {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  // Animation Loop
  let clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    // 1. Continuous Smooth 3D Rotation
    outerMesh.rotation.y += 0.004;
    outerLine.rotation.y += 0.004;

    outerMesh.rotation.x = Math.sin(elapsedTime * 0.35) * 0.14;
    outerLine.rotation.x = Math.sin(elapsedTime * 0.35) * 0.14;

    // 2. Counter-Rotating Inner Cage
    innerCage.rotation.y -= 0.008;
    innerCage.rotation.z += 0.004;

    // 3. Innermost Star Cage
    coreCage.rotation.x += 0.012;
    coreCage.rotation.y += 0.008;

    // 4. Pulsing Core Light
    const pulse = Math.sin(elapsedTime * 2.8);
    centerOrb.scale.setScalar(1 + pulse * 0.18);
    corePointLight.intensity = 3.8 + pulse * 1.8;

    // 5. Smooth Mouse Lerp
    currentTiltX += (targetTiltX - currentTiltX) * 0.05;
    currentTiltY += (targetTiltY - currentTiltY) * 0.05;

    monolithRoot.rotation.x = currentTiltX;
    monolithRoot.rotation.y = currentTiltY;

    renderer.render(scene, camera);
  }

  animate();
}
