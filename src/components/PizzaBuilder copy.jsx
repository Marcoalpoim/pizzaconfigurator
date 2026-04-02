// src/components/PizzaBuilder.jsx
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import IngredientPanel from "./PizzaBuilder/IngredientsPanel";
import PizzaControls from "./PizzaBuilder/PizzaControls";
import { INGREDIENTS } from "../data/ingredients";

export default function PizzaBuilder({
  user,
  publishToFeed,
  showConfig,
  setShowConfig,
}) {
  const [sauceType, setSauceType] = useState("tomate");
  const [baseType, setBaseType] = useState("medium");
  const [baseSize, setBaseSize] = useState(33);
  const [baseFormat, setBaseFormat] = useState("round");
  const [snapToRings, setSnapToRings] = useState(true);
  const [cheeseType, setCheeseType] = useState("mozzarella");
  const [ingredientCounts, setIngredientCounts] = useState({});

  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const baseRef = useRef(null);
  const sauceRef = useRef(null);
  const cheeseGroupRef = useRef(null);
  const toppingsGroupRef = useRef(null);
  const modelsRef = useRef({});

  const snapToRingsRef = useRef(snapToRings);
  useEffect(() => { snapToRingsRef.current = snapToRings; }, [snapToRings]);

  // Keep baseFormat accessible inside closures (scene useEffect)
  const baseFormatRef = useRef(baseFormat);
  const baseTypeRef = useRef(baseType);
  const baseSizeRef = useRef(baseSize);
  useEffect(() => { baseFormatRef.current = baseFormat; }, [baseFormat]);
  useEffect(() => { baseTypeRef.current = baseType; }, [baseType]);
  useEffect(() => { baseSizeRef.current = baseSize; }, [baseSize]);

  // ---------- Helpers ----------

  const getBaseDims = (type, size) => {
    const height = type === "thin" ? 0.04 : type === "medium" ? 0.08 : 0.15;
    const radius = size === 28 ? 1.9 : size === 33 ? 2.2 : 2.7;
    return { height, radius };
  };

  // Returns a THREE.Shape outline for each format (used for both crust ring and sauce)
  function getOuterShape(format, radius) {
    const shape = new THREE.Shape();
    if (format === "square") {
      const s = radius;
      shape.moveTo(-s, -s); shape.lineTo(s, -s);
      shape.lineTo(s, s);   shape.lineTo(-s, s);
      shape.closePath();
    } else if (format === "triangle") {
      shape.moveTo(0, radius);
      shape.lineTo(-radius * Math.sin(Math.PI * 2 / 3), -radius * Math.cos(Math.PI * 2 / 3));
      shape.lineTo( radius * Math.sin(Math.PI * 2 / 3), -radius * Math.cos(Math.PI * 2 / 3));
      shape.closePath();
    } else if (format === "diamond") {
      shape.moveTo(0, radius); shape.lineTo(radius, 0);
      shape.lineTo(0, -radius); shape.lineTo(-radius, 0);
      shape.closePath();
    } else if (format === "oval") {
      const rx = radius * 1.2, rz = radius * 0.75;
      shape.moveTo(rx, 0);
      for (let i = 1; i <= 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        shape.lineTo(Math.cos(a) * rx, Math.sin(a) * rz);
      }
      shape.closePath();
    } else if (format === "star") {
      const outerR = radius, innerR = radius * 0.45;
      const pts = 6;
      for (let i = 0; i < pts * 2; i++) {
        const a = (i / (pts * 2)) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      shape.closePath();
    }
    return shape;
  }

  // Same shape but scaled down for the inner flat area (inside the crust ring)
  function getInnerShape(format, innerRadius) {
    return getOuterShape(format, innerRadius);
  }

  function makeDoughMaterial() {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";
    const doughTexture = loader.load("/textures/dough-texture.jpg");
    doughTexture.wrapS = doughTexture.wrapT = THREE.RepeatWrapping;
    doughTexture.repeat.set(4, 2);
    doughTexture.anisotropy = 8;
    const normalMap = loader.load("/textures/dough-texture.jpg");
    normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(4, 2);
    return new THREE.MeshStandardMaterial({
      map: doughTexture, normalMap,
      normalScale: new THREE.Vector2(0.25, 0.25),
      roughness: 0.88, metalness: 0.0,
      color: new THREE.Color(0xe8a85a),
      side: THREE.DoubleSide, flatShading: false,
    });
  }

  // --- ROUND base: your working lathe code, untouched ---
  function createRoundBase(type, size) {
    const { height, radius } = getBaseDims(type, size);
    const innerRadius = radius * 0.82;
    const crustWidth = radius * 0.18;
    const crustHeight = height * 3.0;
    const segments = 192;

    const points = [];
    points.push(new THREE.Vector2(0, 0));
    points.push(new THREE.Vector2(innerRadius, 0));

    const CRUST_STEPS = 64;
    for (let i = 0; i <= CRUST_STEPS; i++) {
      const t = i / CRUST_STEPS;
      const angle = Math.PI + t * Math.PI * 2;
      const r = innerRadius + crustWidth * 0.5 + Math.cos(angle) * crustWidth * 0.5;
      const y = Math.sin(angle) * crustHeight * 0.5;
      points.push(new THREE.Vector2(r, y));
    }

    let geom = new THREE.LatheGeometry(points, segments);
    geom = mergeVertices(geom, 1e-4);
    geom.computeVertexNormals();
    geom.computeBoundingBox();
    geom.center();
    geom.computeBoundingBox();

    const mesh = new THREE.Mesh(geom, makeDoughMaterial());

    
    mesh.castShadow = true;
    mesh.receiveShadow = true;

const bbox = geom.boundingBox;

// position base on ground
mesh.position.y = -bbox.min.y;

// ✅ correct top surface
mesh.userData.topY = bbox.max.y + mesh.position.y;
    return mesh;
  }

  // --- SHAPED base: crust ring only (hollow in the middle so sauce/cheese/toppings show) ---
  function createShapedBase(type, size, format) {
    const { height, radius } = getBaseDims(type, size);
    const outerRadius = radius;
const innerRadius = radius * 0.90;     // thinner crust ring
const crustHeight = height * 1.8;      // less inflated
const bevelSize = radius * 0.04;       // softer edge
const bevelThickness = crustHeight * 0.25;

    // Outer shape with inner hole punched out → only the crust ring is extruded
    const outerShape = getOuterShape(format, outerRadius);
    const holeShape = getInnerShape(format, innerRadius);

    // The hole path must be added as a hole to the outer shape
    const holePath = new THREE.Path();
    // Copy points from inner shape into a Path
    const innerShapeForHole = getOuterShape(format, innerRadius);
    const innerPts = innerShapeForHole.getPoints(64);
    holePath.setFromPoints(innerPts);
    outerShape.holes.push(holePath);

    // Also create the flat inner disc separately so the pizza has a bottom
    const innerDiscShape = getInnerShape(format, innerRadius * 0.99);

    const crustGeom = new THREE.ExtrudeGeometry(outerShape, {
      depth: height,
      bevelEnabled: true,
      bevelThickness,
      bevelSize,
      bevelSegments: 10,
    });
    crustGeom.rotateX(-Math.PI / 2);

    const discGeom = new THREE.ExtrudeGeometry(innerDiscShape, {
      depth: height * 0.5, // thinner than crust
      bevelEnabled: false,
    });
    discGeom.rotateX(-Math.PI / 2);

    const mat = makeDoughMaterial();

    const crustMesh = new THREE.Mesh(crustGeom, mat);
    const discMesh = new THREE.Mesh(discGeom, mat);

    crustGeom.computeBoundingBox();
    discGeom.computeBoundingBox();

    // Group both so they move together
    const group = new THREE.Group();
    group.add(crustMesh);
    group.add(discMesh);

    // Position: sit on y=0
    crustGeom.computeBoundingBox();
    const minY = crustGeom.boundingBox.min.y;
    group.position.y = -minY;

    // topY = top of the disc (not crust) so toppings sit on the flat surface
    discGeom.computeBoundingBox();
   // group.userData.topY = discGeom.boundingBox.max.y - minY + 0.02;

   const crustTop = crustGeom.boundingBox.max.y - minY;
const discTop = discGeom.boundingBox.max.y - minY;

// toppings should sit on DISC, not crust
group.userData.topY = discTop + 0.01;

// BUT store crust top separately (optional)
group.userData.crustTopY = crustTop;

    group.castShadow = true;
    group.receiveShadow = true;
    return group;
  }

  function createBase(type, size, format) {
    if (!format || format === "round") return createRoundBase(type, size);
    return createShapedBase(type, size, format);
  }

  // Sauce shape matches base format, sits inside the crust ring
  function createSauce(type, size, sType, format) {
    const { height, radius } = getBaseDims(type, size);
    const innerRadius = radius * 0.82 * 0.99; // just inside the crust ring

    let geom;
    if (!format || format === "round") {
      geom = new THREE.CircleGeometry(innerRadius * 0.95, 64);
    } else {
      const shape = getOuterShape(format, innerRadius * 0.95);
      geom = new THREE.ShapeGeometry(shape);
    }

    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";
    const texture = loader.load("/textures/dough-texture.jpg");
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);

    const key = String(sType || "").toLowerCase();
    let color = 0xc23b22;
    if (key.includes("carbon") || key === "carbonara") color = 0xf5deb3;
    else if (key.includes("pesto")) color = 0x4f7942;
    else if (key.includes("barb") || key === "barbecue") color = 0x5c1b00;

    const mat = new THREE.MeshStandardMaterial({
      map: texture, color,
      roughness: 0.6, metalness: 0.1,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = height - 0.001;
    return mesh;
  }

  // Returns a random point constrained inside the base shape
  function randomPointInShape(format, radius) {
    const innerR = radius * 0.80; // stay well inside the crust ring
    let x, z;
    // Rejection sampling — try until point is inside shape
    for (let attempt = 0; attempt < 50; attempt++) {
      x = (Math.random() * 2 - 1) * innerR;
      z = (Math.random() * 2 - 1) * innerR;
      if (isInsideShape(format, x, z, innerR)) return { x, z };
    }
    return { x: 0, z: 0 }; // fallback
  }

  function isInsideShape(format, x, z, r) {
    if (!format || format === "round") {
      return x * x + z * z <= r * r;
    } else if (format === "square") {
      return Math.abs(x) <= r && Math.abs(z) <= r;
    } else if (format === "oval") {
      const rx = r * 1.2, rz = r * 0.75;
      return (x * x) / (rx * rx) + (z * z) / (rz * rz) <= 1;
    } else if (format === "triangle") {
      // Point-in-triangle test for equilateral triangle
      const h = r * Math.cos(Math.PI / 6);
      const inBottom = z >= -h * 0.6;
      const inLeft = x + z / Math.tan(Math.PI / 3) >= -r;
      const inRight = -x + z / Math.tan(Math.PI / 3) >= -r;
      return inBottom && inLeft && inRight;
    } else if (format === "diamond") {
      return Math.abs(x) / r + Math.abs(z) / r <= 1;
    } else if (format === "star") {
      // Approximate: use inner circle of star
      return x * x + z * z <= (r * 0.45) * (r * 0.45);
    }
    return x * x + z * z <= r * r;
  }

  function createCheeseBlob(format, radius, y, cheeseType) {
    const geom = new THREE.SphereGeometry(0.18 + Math.random() * 0.05, 12, 8);
    const loader = new THREE.TextureLoader();
    const texturePaths = {
      cheddar: "/textures/cheddar.jpg",
      parmesan: "/textures/parmesan.jpg",
      gorgonzola: "/textures/gorgonzola.jpg",
    };
    const cheeseTexture = loader.load(texturePaths[cheeseType] || "/textures/dough-texture.jpg");
    const normal = loader.load("/textures/dough-texture.jpg");
    const mat = new THREE.MeshStandardMaterial({
      map: cheeseTexture, normalMap: normal,
      normalScale: new THREE.Vector2(0.4, 0.4),
      color: new THREE.Color(0xffffff),
      roughness: 0.55, metalness: 0.02,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.scale.set(
      1.0 + Math.random() * 0.4,
      0.06 + Math.random() * 0.04,
      1.0 + Math.random() * 0.4
    );
    const { x, z } = randomPointInShape(format, radius);
    mesh.position.set(x, y + Math.random() * 0.01, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // ---------- Ingredient count handlers ----------

  function addIngredient(id) {
    setIngredientCounts((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  }
  function removeIngredient(id) {
    setIngredientCounts((prev) => ({ ...prev, [id]: Math.max((prev[id] || 0) - 1, 0) }));
  }
  function removeAllToppings() { setIngredientCounts({}); }

  // ---------- Scene helpers ----------

  function getToppingSurfaceY() {
    if (sauceRef.current) return sauceRef.current.position.y + 0.02;
    if (baseRef.current?.geometry) {
      baseRef.current.geometry.computeBoundingBox();
      const bbox = baseRef.current.geometry.boundingBox;
      const top = new THREE.Vector3(0, bbox.max.y, 0);
      baseRef.current.localToWorld(top);
      return top.y + 0.01;
    }
    return 0.02;
  }

  function snapToRingsIfNeeded(posVec) {
    if (!snapToRingsRef.current) return posVec;
    const { radius } = getBaseDims(baseTypeRef.current, baseSizeRef.current);
    const dx = posVec.x, dz = posVec.z;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d < 0.001) return posVec;
    const RING_FRACTIONS = [0.25, 0.5, 0.75, 1];
    const ringRadii = RING_FRACTIONS.map((f) => f * radius);
    let nearest = ringRadii[0], minDiff = Math.abs(d - ringRadii[0]);
    for (let i = 1; i < ringRadii.length; i++) {
      const diff = Math.abs(d - ringRadii[i]);
      if (diff < minDiff) { minDiff = diff; nearest = ringRadii[i]; }
    }
    const threshold = 0.3;
    const finalR = Math.abs(d - nearest) <= threshold ? nearest : Math.min(d, radius - 0.12);
    const factor = finalR / d;
    return new THREE.Vector3(dx * factor, posVec.y, dz * factor);
  }

  // Constrain a world position to stay inside the current base shape
  function constrainToShape(posVec) {
    const { radius } = getBaseDims(baseTypeRef.current, baseSizeRef.current);
    const innerR = radius * 0.80;
    const fmt = baseFormatRef.current;
    if (isInsideShape(fmt, posVec.x, posVec.z, innerR)) return posVec;
    // Push toward centre until inside
    const len = Math.sqrt(posVec.x * posVec.x + posVec.z * posVec.z);
    if (len < 0.001) return posVec;
    const scale = innerR / len * 0.95;
    return new THREE.Vector3(posVec.x * scale, posVec.y, posVec.z * scale);
  }

  function createMeshForIngredient(ing) {
    let mesh;
    if (ing.id === "pepperoni" && modelsRef.current.pepperoni) {
      mesh = modelsRef.current.pepperoni.clone();
      mesh.scale.set(0.08, 0.08, 0.08);
    } else if ((ing.id === "mushroom" || ing.id === "cogumelos") && modelsRef.current.mushroom) {
      mesh = modelsRef.current.mushroom.clone();
    } else if (ing.id === "olive" && modelsRef.current.olive) {
      mesh = modelsRef.current.olive.clone();
    } else {
      const mat = new THREE.MeshStandardMaterial({ color: ing.color, roughness: 0.75 });
      switch (ing.kind) {
        case "cylinder":
          mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.01, 16), mat); break;
        case "mushroom": case "cogumelos":
          mesh = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat); break;
        case "torus":
          mesh = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.035, 6, 12), mat);
          mesh.rotation.x = Math.PI / 2; break;
        case "leaf":
          mesh = new THREE.Mesh(new THREE.CircleGeometry(0.14, 8), mat);
          mesh.rotation.x = -Math.PI / 2; break;
        case "pineapple": {
          const shape = new THREE.Shape();
          shape.moveTo(0, 0);
          shape.absarc(0, 0, 0.28, -Math.PI / 6, Math.PI / 6, false);
          shape.lineTo(0, 0);
          const geom = new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false, curveSegments: 16 });
          geom.rotateX(-Math.PI / 2);
          const tex = new THREE.TextureLoader().load("/textures/pineapple.jpg");
          mesh = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0.02 }));
          const s = 0.7 + Math.random() * 0.5;
          mesh.scale.set(s, s, s); break;
        }
        default:
          mesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), mat);
      }
    }
    mesh.rotation.y = Math.random() * Math.PI * 2;
    mesh.userData.baseScale = mesh.scale.clone();
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function addIngredientAtWorldPos(ing, worldPos) {
    const fullIng = INGREDIENTS.find((i) => i.id === ing.id) || ing;
    const mesh = createMeshForIngredient(fullIng);
    mesh.userData.ing = { ...fullIng };
    // Snap rings for round, constrain to shape for others
    let pos;
    if (!baseFormatRef.current || baseFormatRef.current === "round") {
      pos = snapToRingsIfNeeded(worldPos);
    } else {
      pos = constrainToShape(worldPos);
    }
    const toppingY = getToppingSurfaceY();
    mesh.position.set(pos.x, toppingY, pos.z);
    mesh.userData.baseScale = mesh.scale.clone();
    if (toppingsGroupRef.current) toppingsGroupRef.current.add(mesh);
    return mesh;
  }

  // ---------- Random pizza ----------

  function generateRandomPizza() {
    const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
    setBaseType(rand(["thin", "medium", "thick"]));
    setBaseSize(rand([28, 33, 40]));
    setBaseFormat(rand(["round", "square", "triangle", "diamond", "oval", "star"]));
    setSauceType(rand(["tomato", "carbonara", "pesto", "barbecue"]));
    const MIN_TOPPINGS = 35;
    let remaining = MIN_TOPPINGS;
    const randomCounts = {};
    const shuffled = [...INGREDIENTS].sort(() => Math.random() - 0.5);
    for (let i = 0; i < shuffled.length; i++) {
      if (remaining <= 0) break;
      if (Math.random() > 0.4 && i !== shuffled.length - 1) continue;
      const amount = i === shuffled.length - 1 ? remaining : Math.floor(Math.random() * remaining);
      if (amount > 0) { randomCounts[shuffled[i].id] = amount; remaining -= amount; }
    }
    if (Object.keys(randomCounts).length === 0) {
      const ing = rand(INGREDIENTS);
      randomCounts[ing.id] = MIN_TOPPINGS;
    }
    setIngredientCounts(randomCounts);
  }

  // ---------- Scene setup (runs once) ----------

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    while (container.firstChild) container.removeChild(container.firstChild);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);
    sceneRef.current = scene;

    const textureLoader = new THREE.TextureLoader();
    const floorTexture = textureLoader.load("/textures/woodtable.jpg");
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(10, 10);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.MeshStandardMaterial({ map: floorTexture })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.02;
    floor.receiveShadow = true;
    scene.add(floor);

    const wallMat = (color) => new THREE.MeshStandardMaterial({ color });
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(50, 20), wallMat(0xf5e9d7));
    backWall.position.set(0, 10, -15); scene.add(backWall);
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(50, 20), wallMat(0xf0e4d0));
    leftWall.rotation.y = Math.PI / 2; leftWall.position.set(-25, 10, 0); scene.add(leftWall);
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(50, 20), wallMat(0xf0e4d0));
    rightWall.rotation.y = -Math.PI / 2; rightWall.position.set(25, 10, 0); scene.add(rightWall);

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 6, 12);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(3, 5, 3); dir.castShadow = true; dir.shadow.mapSize.set(2048, 2048);
    scene.add(dir);
    const warmLight = new THREE.PointLight(0xfff2cc, 1.2, 15);
    warmLight.position.set(2, 6, 3); warmLight.castShadow = true; scene.add(warmLight);
    const fillLight = new THREE.DirectionalLight(0xffeedd, 0.4);
    fillLight.position.set(-3, 4, -2); scene.add(fillLight);
    const pizzaSpot = new THREE.SpotLight(0xfff2cc, 3);
    pizzaSpot.position.set(0, 6, 2); pizzaSpot.angle = Math.PI / 6;
    pizzaSpot.penumbra = 0.6; pizzaSpot.decay = 2; pizzaSpot.distance = 20;
    pizzaSpot.castShadow = true; scene.add(pizzaSpot);

    const table = new THREE.Mesh(
      new THREE.CircleGeometry(2.8, 64),
      new THREE.MeshStandardMaterial({ color: 0xe3dfd7, roughness: 0.9, opacity: 0.5, transparent: true })
    );
    table.rotation.x = -Math.PI / 2; table.position.y = 0; table.receiveShadow = true;
    scene.add(table);

    const base = createBase(baseType, baseSize, baseFormat);
    scene.add(base); baseRef.current = base;
    pizzaSpot.target = base; scene.add(pizzaSpot.target);

    const sauce = createSauce(baseType, baseSize, sauceType, baseFormat);
    scene.add(sauce); sauceRef.current = sauce;

    const cheeseGroup = new THREE.Group();
    cheeseGroupRef.current = cheeseGroup; scene.add(cheeseGroup);

    const toppingsGroup = new THREE.Group();
    toppingsGroupRef.current = toppingsGroup; scene.add(toppingsGroup);

    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const dropPoint = new THREE.Vector3();
    const pointer = new THREE.Vector2();
    const pointerState = { dragging: false, offset: new THREE.Vector3() };
    let selected = null;

    const safeParse = (raw) => { try { return JSON.parse(raw); } catch { return null; } };
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e) => {
      e.preventDefault();
      try {
        const rawJson = e.dataTransfer.getData("application/json");
        const rawText = e.dataTransfer.getData("text/plain");
        let ing = safeParse(rawJson) || safeParse(rawText);
        if (!ing && rawText) ing = { id: rawText.trim() };
        if (!ing) return;
        const fullIng = INGREDIENTS.find((i) => i.id === ing.id) || ing;
        const rect = renderer.domElement.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera({ x, y }, cameraRef.current);
        const targets = [sauceRef.current, baseRef.current].filter(Boolean);
        const hits = raycaster.intersectObjects(targets, true);
        const toppingY = getToppingSurfaceY();
        if (hits.length > 0) {
          const hp = hits[0].point;
          addIngredientAtWorldPos(fullIng, new THREE.Vector3(hp.x, toppingY, hp.z));
        } else {
          const planePoint = new THREE.Vector3();
          if (raycaster.ray.intersectPlane(plane, planePoint))
            addIngredientAtWorldPos(fullIng, new THREE.Vector3(planePoint.x, toppingY, planePoint.z));
        }
        setIngredientCounts((prev) => ({ ...prev, [fullIng.id]: (prev[fullIng.id] || 0) + 1 }));
      } catch (err) { console.warn("drop parse error", err); }
    };

    const onPointerDown = (e) => {
      if (e.button !== 0) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, cameraRef.current);
      const intersects = raycaster.intersectObjects(toppingsGroup.children, true);
      if (intersects.length > 0) {
        selected = intersects[0].object;
        selected.userData.originalScale = selected.scale.clone();
        selected.scale.multiplyScalar(1.15);
        pointerState.dragging = true;
        pointerState.offset.copy(selected.position).sub(intersects[0].point);
      } else if (selected) {
        if (selected.userData.originalScale) selected.scale.copy(selected.userData.originalScale);
        selected = null;
      }
    };
    const onPointerMove = (e) => {
      if (!pointerState.dragging || !selected) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, cameraRef.current);
      if (raycaster.ray.intersectPlane(plane, dropPoint)) {
        const target = dropPoint.clone().add(pointerState.offset);
        const constrained = constrainToShape(target);
        selected.position.set(constrained.x, getToppingSurfaceY(), constrained.z);
      }
    };
    const onPointerUp = () => {
      pointerState.dragging = false;
      if (selected?.userData.originalScale) selected.scale.copy(selected.userData.originalScale);
    };
    const onKeyDown = (e) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selected) {
        if (selected.parent) selected.parent.remove(selected);
        selected = null;
      }
    };

    renderer.domElement.addEventListener("dragover", handleDragOver);
    renderer.domElement.addEventListener("drop", handleDrop);
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("keydown", onKeyDown);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.minDistance = 2.2;
    controls.maxDistance = 10;
    controlsRef.current = controls;

    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth, h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    resizeObserver.observe(container);

    let zoomProgress = 0;
    const startPos = new THREE.Vector3(0, 8, 18);
    const endPos = new THREE.Vector3(0.5, 3.6, 5);
    const easeInOut = (t) => t * t * (3 - 2 * t);
    const animate = () => {
      requestAnimationFrame(animate);
      if (zoomProgress < 1) {
        zoomProgress += 0.005;
        camera.position.copy(startPos.clone().lerp(endPos, easeInOut(zoomProgress)));
        camera.lookAt(0, 0, 0);
        controls.enabled = false;
      } else {
        controls.enabled = true;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      try {
        renderer.domElement.removeEventListener("dragover", handleDragOver);
        renderer.domElement.removeEventListener("drop", handleDrop);
        renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      } catch {}
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("keydown", onKeyDown);
      if (renderer.domElement && container.contains(renderer.domElement))
        container.removeChild(renderer.domElement);
    };
  }, []);

  // ---------- Rebuild toppings ----------
  useEffect(() => {
    const group = toppingsGroupRef.current;
    if (!group) return;
    group.clear();
    const toppingY = getToppingSurfaceY();
    const { radius } = getBaseDims(baseType, baseSize);
    Object.entries(ingredientCounts).forEach(([id, count]) => {
      if (!count) return;
      const ing = INGREDIENTS.find((i) => i.id === id);
      if (!ing) return;
      for (let i = 0; i < count; i++) {
        // Use shape-aware random placement instead of ring-based
        const { x, z } = randomPointInShape(baseFormat, radius * 0.80);
        addIngredientAtWorldPos(ing, new THREE.Vector3(x, toppingY, z));
      }
    });
  }, [ingredientCounts, baseType, baseSize, baseFormat]);

  // ---------- Rebuild base/sauce ----------
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (baseRef.current) {
      scene.remove(baseRef.current);
      if (baseRef.current.isGroup) {
        baseRef.current.children.forEach((c) => { c.geometry?.dispose(); c.material?.dispose(); });
      } else {
        baseRef.current.geometry?.dispose();
        baseRef.current.material?.dispose();
      }
      baseRef.current = null;
    }
    if (sauceRef.current) {
      scene.remove(sauceRef.current);
      sauceRef.current.geometry?.dispose();
      sauceRef.current.material?.dispose();
      sauceRef.current = null;
    }

    const base = createBase(baseType, baseSize, baseFormat);
    scene.add(base); baseRef.current = base;

    const sauce = createSauce(baseType, baseSize, sauceType, baseFormat);
    scene.add(sauce); sauceRef.current = sauce;

    baseRef.current.updateMatrixWorld(true);
    sauceRef.current.updateMatrixWorld(true);

    const toppingsGroup = toppingsGroupRef.current;
    if (toppingsGroup?.children.length > 0) {
      const toppingY = getToppingSurfaceY();
      toppingsGroup.children.forEach((child) => { child.position.y = toppingY; });
    }
  }, [baseType, baseSize, sauceType, baseFormat]);

  // ---------- Rebuild cheese ----------
  useEffect(() => {
    const group = cheeseGroupRef.current;
    if (!group) return;
    group.clear();
    if (cheeseType === "none") return;
    const { height, radius } = getBaseDims(baseType, baseSize);
    const cheeseY = height - 0.02;
    for (let i = 0; i < 300; i++) {
      group.add(createCheeseBlob(baseFormat, radius, cheeseY, cheeseType));
    }
  }, [cheeseType, baseType, baseSize, baseFormat]);

  // ---------- Load GLTF models ----------
  useEffect(() => {
    const loader = new GLTFLoader();
    const load = (path, key, scale = 0.25) => {
      loader.load(path, (gltf) => {
        const model = gltf.scene;
        model.scale.set(scale, scale, scale);
        modelsRef.current[key] = model;
      });
    };
    load("/models/pepperoni.glb", "pepperoni");
    load("/models/mushroom.glb", "mushroom");
    load("/models/olive.glb", "olive");
  }, []);

  // ---------- Snapshot / publish ----------
  async function captureSnapshot({ scale = 1 } = {}) {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera) return null;
    const canvas = renderer.domElement;
    const prevWidth = canvas.clientWidth;
    const prevHeight = canvas.clientHeight;
    const prevPixelRatio = renderer.getPixelRatio();
    try {
      const w = Math.floor(prevWidth * scale);
      const h = Math.floor(prevHeight * scale);
      renderer.setPixelRatio(scale > 1 ? 1 : prevPixelRatio);
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
      return renderer.domElement.toDataURL("image/jpeg", 0.3);
    } catch (err) {
      console.warn("Snapshot capture failed:", err);
      return null;
    } finally {
      renderer.setPixelRatio(prevPixelRatio);
      renderer.setSize(prevWidth, prevHeight);
      camera.aspect = prevWidth / prevHeight;
      camera.updateProjectionMatrix();
    }
  }

  const downloadSnapshot = async (highRes = false) => {
    const data = await captureSnapshot({ scale: highRes ? 2 : 1 });
    if (!data) { alert("Snapshot failed."); return; }
    const a = document.createElement("a");
    a.href = data; a.download = `pizza-${Date.now()}.png`; a.click();
  };

  const buildRecipe = (image) => ({
    id: Date.now(),
    author: user?.displayName || user?.name || "Anonymous Chef",
    userId: user?.uid || user?.id || "guest",
    baseType, baseSize, baseFormat, cheeseType, sauceType,
    toppings: (toppingsGroupRef.current?.children || []).map((c) => {
      const ing = c.userData.ing || {};
      return {
        id: ing.id || Math.random().toString(36).slice(2),
        name: ing.name || "Unknown",
        color: ing.color ?? 0xffffff,
        pos: { x: c.position.x, y: c.position.y, z: c.position.z },
      };
    }),
    image: image || null,
    createdAt: new Date().toISOString(),
  });

  const handlePublish = async () => {
    let image = null;
    try { image = await captureSnapshot({ scale: 1 }); } catch {}
    publishToFeed?.(buildRecipe(image));
  };

  const handleSaveToProfile = async () => {
    if (!user) { alert("Please log in first!"); return; }
    let image = null;
    try { image = await captureSnapshot({ scale: 1 }); } catch {}
    const recipe = { ...buildRecipe(image), userId: user.uid };
    let stored = [];
    try { stored = JSON.parse(localStorage.getItem("userRecipes")) || []; } catch {}
    stored.push(recipe);
    localStorage.setItem("userRecipes", JSON.stringify(stored));
    alert("✅ Recipe saved to your profile!");
  };

  return (
    <div>
      <div className="config-wrapper">
        <div className="config-container">
          <aside className={`config-modal ${showConfig ? "open" : "closed"}`}>
            <button onClick={generateRandomPizza} style={{ padding: "8px 12px" }}>
              Generate Recipe
            </button>
            <IngredientPanel
              addIngredient={addIngredient}
              removeIngredient={removeIngredient}
              ingredientCounts={ingredientCounts}
            />
            <PizzaControls
              sauceType={sauceType} setSauceType={setSauceType}
              baseType={baseType} setBaseType={setBaseType}
              baseSize={baseSize} setBaseSize={setBaseSize}
              baseFormat={baseFormat} setBaseFormat={setBaseFormat}
              cheeseType={cheeseType} setCheeseType={setCheeseType}
              downloadSnapshot={downloadSnapshot}
              handlePublish={handlePublish}
              handleSaveToProfile={handleSaveToProfile}
              removeAllToppings={removeAllToppings}
            />
          </aside>
        </div>
        <div className="config-toggle">
          <button onClick={() => setShowConfig((prev) => !prev)}>
            {showConfig ? "✖ Close" : "🍕 Builder"}
          </button>
        </div>
      </div>
      <div>
        <main style={{ width: "100%", height: "100%" }}>
          <div ref={mountRef} className="three-root" />
        </main>
      </div>
    </div>
  );
}
