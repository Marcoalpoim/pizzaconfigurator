import * as THREE from "three";

export function setupScene(container, refs, options = {}) {
  const { baseType, baseSize, pizzaShape, sauceType, createBase, createSauce } =
    options;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a0f07);
  scene.fog = new THREE.FogExp2(0x1a0f07, 0.028);

  const textureLoader = new THREE.TextureLoader();

  // ── FLOOR ────────────────────────────────────────────────────────────────
  const floorTex = textureLoader.load("/textures/woodtable.jpg");
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(12, 12);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({
      map: floorTex,
      color: 0x150c05,
      roughness: 1.0,
      metalness: 0,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.5;
  floor.receiveShadow = true;
  scene.add(floor);

  // ── WALLS ────────────────────────────────────────────────────────────────
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x180e06,
    roughness: 1.0,
  });
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(100, 40), wallMat);
  backWall.position.set(0, 20, -30);
  scene.add(backWall);
  const leftWall = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 40),
    wallMat.clone(),
  );
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-50, 20, 0);
  scene.add(leftWall);
  const rightWall = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 40),
    wallMat.clone(),
  );
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(50, 20, 0);
  scene.add(rightWall);

  // ── TABLE — centred on origin, camera looks straight at it ───────────────
  const tableTex = textureLoader.load("/textures/woodtable.jpg");
  tableTex.wrapS = tableTex.wrapT = THREE.RepeatWrapping;
  tableTex.repeat.set(5, 3);

  // The table top sits at y=0, pizza sits on top of it
  const tableSlab = new THREE.Mesh(
    new THREE.BoxGeometry(40, 0.18, 16),
    new THREE.MeshStandardMaterial({
      map: tableTex,
      color: 0x3d2410,
      roughness: 0.75,
      metalness: 0.04,
    }),
  );
  tableSlab.position.set(0, -0.09, 0); // centred, top face at y=0
  tableSlab.receiveShadow = true;
  tableSlab.castShadow = true;
  scene.add(tableSlab);

  // Peel sits flush on table top
  const peelMat = new THREE.MeshStandardMaterial({
    map: tableTex,
    color: 0x7a4a22,
    roughness: 0.8,
  });
  const peel = new THREE.Mesh(
    new THREE.CylinderGeometry(3.5, 3.5, 0.04, 64),
    peelMat,
  );
  peel.position.set(0, 0.02, 0);
  peel.receiveShadow = true;
  scene.add(peel);

  // ── FLOUR DUST ───────────────────────────────────────────────────────────
  const flourMat = new THREE.MeshBasicMaterial({
    color: 0xf0ece0,
    transparent: true,
    opacity: 0.1,
  });
  [
    [2.4, 0.01, 1.8],
    [-3.2, 0.01, 1.0],
    [4.2, 0.01, -1.2],
    [-1.6, 0.01, -0.8],
    [5.5, 0.01, 0.5],
  ].forEach(([x, y, z]) => {
    const r = 0.2 + Math.random() * 0.45;
    const f = new THREE.Mesh(new THREE.CircleGeometry(r, 16), flourMat);
    f.rotation.x = -Math.PI / 2;
    f.position.set(x, y, z);
    scene.add(f);
  });

  // ── PROPS ────────────────────────────────────────────────────────────────
 
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x1a3010,
    roughness: 0.12,
    metalness: 0.15,
    transparent: true,
    opacity: 0.88,
  });
  const bottleBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.2, 1.0, 14),
    glassMat,
  );
  bottleBody.position.set(6.5, 0.5, -1.5);
  scene.add(bottleBody);
  const bottleNeck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.14, 0.3, 12),
    glassMat,
  );
  bottleNeck.position.set(6.5, 1.15, -1.5);
  scene.add(bottleNeck);
  const bottleCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.075, 0.05, 10),
    new THREE.MeshStandardMaterial({
      color: 0xb89020,
      roughness: 0.3,
      metalness: 0.7,
    }),
  );
  bottleCap.position.set(6.5, 1.33, -1.5);
  scene.add(bottleCap);

  // Ceramic bowl — left side
  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0xd8c4a0,
    roughness: 0.6,
    metalness: 0.04,
  });
  const bowl = new THREE.Mesh(
    new THREE.SphereGeometry(0.52, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
    ceramicMat,
  );
  bowl.rotation.x = Math.PI;
  bowl.position.set(-6.5, 0.36, -1.0);
  scene.add(bowl);

  // Tomatoes in bowl
  const tomMat = new THREE.MeshStandardMaterial({
    color: 0xbb1a0a,
    roughness: 0.65,
  });
  [
    [-6.3, 0.68, -0.8],
    [-6.7, 0.72, -1.2],
    [-6.5, 0.76, -0.95],
  ].forEach(([x, y, z]) => {
    const t = new THREE.Mesh(
      new THREE.SphereGeometry(0.17 + Math.random() * 0.04, 12, 10),
      tomMat,
    );
    t.position.set(x, y, z);
    scene.add(t);
  });

  // Rolling pin — lying flat on table
  const pinMat = new THREE.MeshStandardMaterial({
    color: 0x8c5a2a,
    roughness: 0.85,
  });
  const pinBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.13, 3.0, 16),
    pinMat,
  );
  pinBody.rotation.z = Math.PI / 2;
  pinBody.position.set(-5.2, 0.13, 2.8);
  scene.add(pinBody);

  // Basil leaves near pizza
  const basilMat = new THREE.MeshStandardMaterial({
    color: 0x1a5218,
    roughness: 0.9,
  });
  [
    [4.2, 0.05, 1.6],
    [4.8, 0.05, 2.2],
    [-4.0, 0.05, 1.2],
  ].forEach(([x, y, z]) => {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 5), basilMat);
    leaf.scale.set(1.1, 0.15, 1.5);
    leaf.rotation.y = Math.random() * Math.PI;
    leaf.position.set(x, y, z);
    scene.add(leaf);
  });

  // ── LIGHTING ─────────────────────────────────────────────────────────────

  // Soft ambient — just enough to lift shadows off pure black
  scene.add(new THREE.AmbientLight(0xffddb0, 0.7));

  // KEY LIGHT — soft, wide, from upper-left
  // Low intensity so it doesn't blow out the pizza surface
  const keyLight = new THREE.DirectionalLight(0xfff2d8, 1.4);
  keyLight.position.set(-4, 8, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(4096, 4096);
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 50;
  keyLight.shadow.camera.left = -14;
  keyLight.shadow.camera.right = 14;
  keyLight.shadow.camera.top = 14;
  keyLight.shadow.camera.bottom = -14;
  keyLight.shadow.bias = -0.0002;
  scene.add(keyLight);

  // FILL — from right, very soft, warm
  const fillLight = new THREE.DirectionalLight(0xffd090, 0.5);
  fillLight.position.set(7, 5, 3);
  scene.add(fillLight);

  // RIM — from behind, warm orange edge light
  const rimLight = new THREE.DirectionalLight(0xff8833, 0.4);
  rimLight.position.set(1, 4, -10);
  scene.add(rimLight);

  // PIZZA SPOT — overhead, soft cone, warm white
  // Wide penumbra = soft falloff, no harsh burn
  const pizzaSpot = new THREE.SpotLight(0xffeedd, 2.2);
  pizzaSpot.position.set(0, 7, 1);
  pizzaSpot.angle = Math.PI / 6;
  pizzaSpot.penumbra = 0.85; // very soft edge
  pizzaSpot.decay = 1.2;
  pizzaSpot.distance = 24;
  pizzaSpot.castShadow = true;
  pizzaSpot.shadow.mapSize.set(2048, 2048);
  pizzaSpot.shadow.bias = -0.0003;
  scene.add(pizzaSpot);

  // TABLE BOUNCE — low, subtle, warm
  const bounceLight = new THREE.PointLight(0xffcc88, 0.4, 10);
  bounceLight.position.set(0, 0.3, 3);
  scene.add(bounceLight);

  // ── PIZZA BASE ───────────────────────────────────────────────────────────
  const base = createBase(baseType, baseSize, pizzaShape);
  scene.add(base);
  refs.baseRef.current = base;
  pizzaSpot.target = base;
  scene.add(pizzaSpot.target);

  const sauce = createSauce(baseType, baseSize, sauceType, pizzaShape);
  scene.add(sauce);
  refs.sauceRef.current = sauce;

  const cheeseGroup = new THREE.Group();
  refs.cheeseGroupRef.current = cheeseGroup;
  scene.add(cheeseGroup);

  const toppingsGroup = new THREE.Group();
  refs.toppingsGroupRef.current = toppingsGroup;
  scene.add(toppingsGroup);

  // ── RENDERER ─────────────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9; // slightly under-exposed = richer, less blown out
  container.appendChild(renderer.domElement);
  refs.rendererRef.current = renderer;

  // ── CAMERA ───────────────────────────────────────────────────────────────
  const isMobileInit = window.innerWidth < 768;

const camera = new THREE.PerspectiveCamera(
  42,
  container.clientWidth / container.clientHeight,
  0.1,
  1000,
);
// Start further back on mobile
camera.position.set(0, isMobileInit ? 19 : 60, isMobileInit ? 30 : 22);
camera.lookAt(0, 0, 0);
  refs.cameraRef.current = camera;
  refs.sceneRef.current = scene;

  return { scene, camera, renderer };
}

export function createAnimateLoop({
  scene,
  camera,
  renderer,
  controls,
  showConfigRef,
}) {
  let frameId;
  let zoomProgress = 0;
 
  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

const isMobile = window.innerWidth < 768;
const startPos = new THREE.Vector3(4, 9, 18);
const endPos = isMobile
  ? new THREE.Vector3(4, 15, 22)   // more zoomed out on mobile
  : new THREE.Vector3(4, 3.8, 6.0);
const endTarget = isMobile
  ? new THREE.Vector3(0, showConfigRef.current ? -0.8 : 0, 0)
  : new THREE.Vector3(showConfigRef.current ? -1.2 : 0, 0, 0);

  function animate() {
    frameId = requestAnimationFrame(animate);

    if (zoomProgress < 1) {
      zoomProgress += 0.0025; // slow, cinematic
      camera.position.copy(
        startPos.clone().lerp(endPos, easeInOut(Math.min(zoomProgress, 1))),
      );
      camera.lookAt(endTarget);
      controls.enabled = false;
    } else {
      controls.enabled = true;
    }

    controls.update();
    renderer.render(scene, camera);
  }

  animate();

  return () => cancelAnimationFrame(frameId);
}
