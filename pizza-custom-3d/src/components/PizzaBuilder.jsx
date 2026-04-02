// src/components/PizzaBuilder.jsx
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import IngredientPanel from "./PizzaBuilder/IngredientsPanel";
import PizzaControls from "./PizzaBuilder/PizzaControls";
import PizzaControlsBtns from "./PizzaBuilder/PizzaControlsBtns";
import { INGREDIENTS } from "../data/ingredients";
import AiJuri from "./PizzaBuilder/AiJuri";

export default function PizzaBuilder({
  user,
  publishToFeed,
  showConfig,
  setShowConfig,
}) {
  const [sauceType, setSauceType] = useState("tomate");
  const [baseType, setBaseType] = useState("medium");
  const [baseSize, setBaseSize] = useState(33);
  const [pizzaShape, setPizzaShape] = useState("circle");
  const [snapToRings, setSnapToRings] = useState(true);
  const [cheeseType, setCheeseType] = useState("mozzarella");
  const [ingredientCounts, setIngredientCounts] = useState({});
  // Y offsets above the base disc surface — tweak these to adjust layer heights
  const SAUCE_OFFSET = 0.002; // sauce sits just on the dough
  const CHEESE_OFFSET = 0.012; // cheese sits on top of the sauce
  const TOPPING_OFFSET = 0.035; // toppings sit on top of the cheese

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

  // Refs so scene closures always read current values
  const snapToRingsRef = useRef(snapToRings);
  const pizzaShapeRef = useRef(pizzaShape);
  const baseTypeRef = useRef(baseType);
  const baseSizeRef = useRef(baseSize);
  const showConfigRef = useRef(showConfig);

  useEffect(() => {
    snapToRingsRef.current = snapToRings;
  }, [snapToRings]);
  useEffect(() => {
    pizzaShapeRef.current = pizzaShape;
  }, [pizzaShape]);
  useEffect(() => {
    baseTypeRef.current = baseType;
  }, [baseType]);
  useEffect(() => {
    baseSizeRef.current = baseSize;
  }, [baseSize]);
  useEffect(() => {
    showConfigRef.current = showConfig;
  }, [showConfig]);
  // ---------- Helpers ----------

  const getBaseDims = (type, size) => {
    const height = type === "thin" ? 0.04 : type === "medium" ? 0.08 : 0.15;
    const radius = size === 28 ? 1.9 : size === 33 ? 2.2 : 2.7;
    return { height, radius };
  };

  // Shared dough material
  function makeDoughMat() {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";
    const tex = loader.load("/textures/dough-texture.jpg");
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 2);
    tex.anisotropy = 8;
    const nrm = loader.load("/textures/dough-texture.jpg");
    nrm.wrapS = nrm.wrapT = THREE.RepeatWrapping;
    nrm.repeat.set(4, 2);
    return new THREE.MeshStandardMaterial({
      map: tex,
      normalMap: nrm,
      normalScale: new THREE.Vector2(0.25, 0.25),
      roughness: 0.88,
      metalness: 0,
      color: new THREE.Color(0xe8a85a),
      side: THREE.DoubleSide,
      flatShading: false,
    });
  }

  function createBase(type, size, shape) {
    const { height, radius } = getBaseDims(type, size);
    const innerRadius = radius * 0.82;
    const crustWidth = radius * 0.18;

    const mat = makeDoughMat();

    // --- 1. Flat inner disc ---
    let discGeom;
    if (!shape || shape === "circle") {
      discGeom = new THREE.CylinderGeometry(
        innerRadius,
        innerRadius,
        height,
        128,
        1,
        false,
      );
      discGeom.translate(0, -height / 2, 0);
    } else {
      const innerShape = makeShape2D(shape, innerRadius * 1.05);
      discGeom = new THREE.ExtrudeGeometry(innerShape, {
        depth: height,
        bevelEnabled: false,
      });
      discGeom.rotateX(-Math.PI / 2);
      discGeom.computeBoundingBox();
      discGeom.translate(0, -discGeom.boundingBox.max.y, 0);
    }
    discGeom.computeBoundingBox();

    const discMesh = new THREE.Mesh(discGeom, mat);
    discMesh.receiveShadow = true;

    // --- 2. Crust tube along the shape outline ---
    const crustCentreR = innerRadius + crustWidth * 0.3;
    const sharpShapes = ["square", "triangle", "diamond", "star"];
    const isSharp = sharpShapes.includes(shape);

    let curve3D;
    if (!shape || shape === "circle") {
      // Perfect circle — sample points around the circumference
      const STEPS = 128;
      const pts = [];
      for (let i = 0; i < STEPS; i++) {
        const a = (i / STEPS) * Math.PI * 2;
        pts.push(
          new THREE.Vector3(
            Math.cos(a) * crustCentreR,
            0,
            Math.sin(a) * crustCentreR,
          ),
        );
      }
      curve3D = new THREE.CatmullRomCurve3(pts, true);
    } else if (isSharp) {
      // Sharp corners — use LineCurve3 segments so edges stay straight
      const pts2D = makeShape2D(shape, crustCentreR).getPoints(256);
      const last = pts2D[pts2D.length - 1];
      const first = pts2D[0];
      if (
        Math.abs(last.x - first.x) < 1e-4 &&
        Math.abs(last.y - first.y) < 1e-4
      )
        pts2D.pop();
      const pts3D = pts2D.map((p) => new THREE.Vector3(p.x, 0, -p.y));
      const path = new THREE.CurvePath();
      for (let i = 0; i < pts3D.length; i++) {
        path.add(new THREE.LineCurve3(pts3D[i], pts3D[(i + 1) % pts3D.length]));
      }
      curve3D = path;
    } else {
      // Smooth curved shapes — CatmullRomCurve3 flows naturally
      const pts2D = makeShape2D(shape, crustCentreR).getPoints(128);
      curve3D = new THREE.CatmullRomCurve3(
        pts2D.map((p) => new THREE.Vector3(p.x, 0, -p.y)),
        true,
      );
    }

    const tubeRadius = crustWidth * 0.1 + height * 0.8;
    const tubeSegments = isSharp ? 400 : 200;
    const tubeGeom = new THREE.TubeGeometry(
      curve3D,
      tubeSegments,
      tubeRadius,
      20,
      true,
    );

    const discBottom = discGeom.boundingBox.min.y;
    tubeGeom.translate(0, discBottom + tubeRadius, 0);

    const crustMesh = new THREE.Mesh(tubeGeom, mat);
    crustMesh.castShadow = true;
    crustMesh.receiveShadow = true;

    // --- 3. Group and lift so disc bottom sits on the floor ---
    const group = new THREE.Group();
    group.add(discMesh);
    group.add(crustMesh);

    group.position.y = -discBottom;
    group.userData.surfaceY = group.position.y;

    return group;
  }
  function makeShape2D(shape, r) {
    const s = new THREE.Shape();

    if (shape === "square") {
      s.moveTo(-r, -r);
      s.lineTo(r, -r);
      s.lineTo(r, r);
      s.lineTo(-r, r);
      s.closePath();
    } else if (shape === "triangle") {
      s.moveTo(0, -r);
      s.lineTo(r * 0.866, r * 0.5);
      s.lineTo(-r * 0.866, r * 0.5);
      s.closePath();
    } else if (shape === "diamond") {
      s.moveTo(0, -r);
      s.lineTo(r, 0);
      s.lineTo(0, r);
      s.lineTo(-r, 0);
      s.closePath();
    } else if (shape === "oval") {
      const rx = r * 1.3,
        ry = r * 0.7;
      s.moveTo(rx, 0);
      for (let i = 1; i <= 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        s.lineTo(Math.cos(a) * rx, Math.sin(a) * ry);
      }
      s.closePath();
    } else if (shape === "star") {
      const outerR = r,
        innerR = r * 0.55;
      const points = 5;
      for (let i = 0; i < points * 2; i++) {
        const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
        const rr = i % 2 === 0 ? outerR : innerR;
        if (i === 0) s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
        else s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      const firstA = -Math.PI / 2;
      s.lineTo(Math.cos(firstA) * outerR, Math.sin(firstA) * outerR);
      s.closePath();
    } else if (shape === "heart") {
      const sc = r * 0.55;
      s.moveTo(0, -r * 0.9);
      s.bezierCurveTo(-sc * 2, -sc * 0.5, -sc * 2, sc * 1.2, 0, sc * 0.8);
      s.bezierCurveTo(sc * 2, sc * 1.2, sc * 2, -sc * 0.5, 0, -r * 0.9);
      s.closePath();
    } else {
      // circle fallback
      s.absarc(0, 0, r, 0, Math.PI * 2, false);
    }

    return s;
  }

  // ── SAUCE ─────────────────────────────────────────────────────────────────
  function createSauce(type, size, sType, shape) {
    const { height, radius } = getBaseDims(type, size);
    const innerR = radius * 0.86 * 0.97; // just inside crust ring

    let geom;
    if (!shape || shape === "circle") {
      geom = new THREE.CircleGeometry(innerR, 64);
    } else {
      geom = new THREE.ShapeGeometry(makeShape2D(shape, innerR));
    }

    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";
    const tex = loader.load("/textures/dough-texture.jpg");
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);

    const key = String(sType || "").toLowerCase();
    let color = 0xc23b22;
    if (key.includes("carbon")) color = 0xf5deb3;
    else if (key.includes("pesto")) color = 0x4f7942;
    else if (key.includes("barb")) color = 0x5c1b00;

    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      color,
      roughness: 0.6,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = getSauceY();
    return mesh;
  }

  // ── PLACEMENT HELPERS ─────────────────────────────────────────────────────
  // Returns a random {x, z} guaranteed to be inside the pizza's inner area
  function randomPointInShape(shape, radius) {
    // Use shape-appropriate bounding boxes for efficient sampling
    const bounds = {
      oval: { rx: radius * 0.78 * 1.3, rz: radius * 0.78 * 0.7 },
      star: { rx: radius * 0.38, rz: radius * 0.38 }, // stay in inner circle
      heart: { rx: radius * 0.65, rz: radius * 0.85 },
    };

    for (let attempt = 0; attempt < 120; attempt++) {
      let x, z;
      if (shape === "oval") {
        x = (Math.random() * 2 - 1) * bounds.oval.rx;
        z = (Math.random() * 2 - 1) * bounds.oval.rz;
      } else if (shape === "star") {
        x = (Math.random() * 2 - 1) * bounds.star.rx;
        z = (Math.random() * 2 - 1) * bounds.star.rz;
      } else if (shape === "heart") {
        x = (Math.random() * 2 - 1) * bounds.heart.rx;
        z = (Math.random() * 2 - 1) * bounds.heart.rz;
      } else {
        const r = radius * 0.78;
        x = (Math.random() * 2 - 1) * r;
        z = (Math.random() * 2 - 1) * r;
      }

      if (isInsideShape(shape, x, z, radius * 0.78)) return { x, z };
    }
    return { x: 0, z: 0 };
  }

  function isInsideShape(shape, x, z, r) {
    if (!shape || shape === "circle") {
      return x * x + z * z <= r * r;
    }
    if (shape === "square") {
      return Math.abs(x) <= r && Math.abs(z) <= r;
    }
    if (shape === "oval") {
      const rx = r * 1.3,
        rz = r * 0.7;
      return (x * x) / (rx * rx) + (z * z) / (rz * rz) <= 1;
    }
    if (shape === "diamond") {
      return Math.abs(x) / r + Math.abs(z) / r <= 1;
    }
    if (shape === "triangle") {
      const v1 = { x: 0, z: r };
      const v2 = { x: r * 0.866, z: -r * 0.5 };
      const v3 = { x: -r * 0.866, z: -r * 0.5 };
      return pointInTriangle(x, z, v1, v2, v3);
    }
    if (shape === "star") {
      const outerR = r,
        innerR = r * 0.55;
      const points = 5;
      // Check all 10 triangles that make up the full star (each spike + each inner kite)
      for (let i = 0; i < points; i++) {
        const aOuter1 = (i / points) * Math.PI * 2 - Math.PI / 2;
        const aInnerL = ((i + 0.5) / points) * Math.PI * 2 - Math.PI / 2;
        const aOuter2 = ((i + 1) / points) * Math.PI * 2 - Math.PI / 2;
        const aInnerR =
          ((i - 0.5 + points) / points) * Math.PI * 2 - Math.PI / 2;

        const tip = {
          x: Math.cos(aOuter1) * outerR,
          z: Math.sin(aOuter1) * outerR,
        };
        const innerL = {
          x: Math.cos(aInnerL) * innerR,
          z: Math.sin(aInnerL) * innerR,
        };
        const innerR_ = {
          x: Math.cos(aInnerR) * innerR,
          z: Math.sin(aInnerR) * innerR,
        };
        const center = { x: 0, z: 0 };

        // Spike triangle: tip → left inner → right inner
        if (pointInTriangle(x, z, tip, innerL, innerR_)) return true;
        // Inner kite: center → tip's left inner → tip → tip's right inner
        if (pointInTriangle(x, z, center, innerL, tip)) return true;
        if (pointInTriangle(x, z, center, tip, innerR_)) return true;
      }
      return false;
    }
    if (shape === "heart") {
      // Heart in makeShape2D: tip at 2D(0, -r*0.9) → world z = +r*0.9
      // Lobes at 2D(±sc, +sc) → world x = ±sc, z = -sc
      // sc = r * 0.55
      const sc = r * 0.3;
      const lobeR = sc * 1.8;

      // Two circles for the left and right lobes
      // Lobe centres: world x = ±sc*1.1, z = -sc*0.35
      const lz = -sc * -0.4;
      const lx = sc * -0.5;
      if ((x - lx) ** 2 + (z - lz) ** 2 <= lobeR * lobeR) return true;
      if ((x + lx) ** 2 + (z - lz) ** 2 <= lobeR * lobeR) return true;

      // Triangle for the lower body down to the tip
      const tv1 = { x: -sc * 1.5, z: -sc * 0.1 };
      const tv2 = { x: sc * 1.5, z: -sc * 0.1 };
      const tv3 = { x: 0, z: r * 0.85 };
      if (pointInTriangle(x, z, tv1, tv2, tv3)) return true;

      return false;
    }
    return x * x + z * z <= r * r;
  }

  function pointInTriangle(px, pz, v1, v2, v3) {
    const d1 = sign(px, pz, v1, v2);
    const d2 = sign(px, pz, v2, v3);
    const d3 = sign(px, pz, v3, v1);
    const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
    const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
    return !(hasNeg && hasPos);
  }

  function sign(px, pz, v1, v2) {
    return (px - v2.x) * (v1.z - v2.z) - (v1.x - v2.x) * (pz - v2.z);
  }

  // ── CHEESE ────────────────────────────────────────────────────────────────
  function createCheeseBlob(shape, radius, y, cheeseType) {
    const geom = new THREE.SphereGeometry(0.18 + Math.random() * 0.05, 12, 8);
    const loader = new THREE.TextureLoader();
    const texturePaths = {
      cheddar: "/textures/cheddar.jpg",
      parmesan: "/textures/parmesan.jpg",
      gorgonzola: "/textures/gorgonzola.jpg",
    };
    const cheeseTexture = loader.load(
      texturePaths[cheeseType] || "/textures/dough-texture.jpg",
    );
    const normal = loader.load("/textures/dough-texture.jpg");
    const mat = new THREE.MeshStandardMaterial({
      map: cheeseTexture,
      normalMap: normal,
      normalScale: new THREE.Vector2(0.4, 0.4),
      color: new THREE.Color(0xffffff),
      roughness: 0.55,
      metalness: 0.02,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.scale.set(
      1.0 + Math.random() * 0.4,
      0.06 + Math.random() * 0.04,
      1.0 + Math.random() * 0.4,
    );
    const { x, z } = randomPointInShape(shape, radius);
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
    setIngredientCounts((prev) => ({
      ...prev,
      [id]: Math.max((prev[id] || 0) - 1, 0),
    }));
  }
  function removeAllToppings() {
    setIngredientCounts({});
  }

  // ---------- Scene helpers ----------

  // The pizza disc surface Y in world space — stored on the base mesh/group
  function getBaseSurfaceY() {
    return baseRef.current?.userData?.surfaceY ?? 0;
  }

  function getSauceY() {
    return getBaseSurfaceY() + SAUCE_OFFSET;
  }
  function getCheeseY() {
    return getBaseSurfaceY() + CHEESE_OFFSET;
  }
  function getToppingY() {
    return getBaseSurfaceY() + TOPPING_OFFSET;
  }

  // Keep old name for drag/drop callers
  function getToppingSurfaceY() {
    return getToppingY();
  }

  function snapToRingsIfNeeded(posVec) {
    if (!snapToRingsRef.current || pizzaShapeRef.current !== "circle")
      return posVec;
    const { radius } = getBaseDims(baseTypeRef.current, baseSizeRef.current);
    const dx = posVec.x,
      dz = posVec.z;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d < 0.001) return posVec;
    const RING_FRACTIONS = [0.25, 0.5, 0.75, 1];
    const ringRadii = RING_FRACTIONS.map((f) => f * radius);
    let nearest = ringRadii[0],
      minDiff = Math.abs(d - ringRadii[0]);
    for (let i = 1; i < ringRadii.length; i++) {
      const diff = Math.abs(d - ringRadii[i]);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = ringRadii[i];
      }
    }
    const threshold = 0.3;
    const finalR =
      Math.abs(d - nearest) <= threshold ? nearest : Math.min(d, radius - 0.12);
    return new THREE.Vector3(dx * (finalR / d), posVec.y, dz * (finalR / d));
  }

  function constrainToShape(posVec) {
    const shape = pizzaShapeRef.current;
    const { radius } = getBaseDims(baseTypeRef.current, baseSizeRef.current);
    const r = radius * 0.78;
    if (isInsideShape(shape, posVec.x, posVec.z, r)) return posVec;
    // push toward centre until inside
    const len = Math.sqrt(posVec.x * posVec.x + posVec.z * posVec.z);
    if (len < 0.001) return posVec;
    const scale = (r * 0.95) / len;
    return new THREE.Vector3(posVec.x * scale, posVec.y, posVec.z * scale);
  }

  function createMeshForIngredient(ing) {
    let mesh;
    if (ing.id === "pepperoni" && modelsRef.current.pepperoni) {
      mesh = modelsRef.current.pepperoni.clone();
      mesh.scale.set(0.08, 0.08, 0.08);
    } else if (
      (ing.id === "mushroom" || ing.id === "cogumelos") &&
      modelsRef.current.mushroom
    ) {
      mesh = modelsRef.current.mushroom.clone();
    } else if (ing.id === "olive" && modelsRef.current.olive) {
      mesh = modelsRef.current.olive.clone();
    } else {
      const mat = new THREE.MeshStandardMaterial({
        color: ing.color,
        roughness: 0.75,
      });
      switch (ing.kind) {
        case "cylinder":
          mesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.18, 0.01, 16),
            mat,
          );
          break;
        case "mushroom":
        case "cogumelos":
          mesh = new THREE.Mesh(
            new THREE.SphereGeometry(
              0.18,
              12,
              8,
              0,
              Math.PI * 2,
              0,
              Math.PI / 2,
            ),
            mat,
          );
          break;
        case "torus":
          mesh = new THREE.Mesh(
            new THREE.TorusGeometry(0.09, 0.035, 6, 12),
            mat,
          );
          mesh.rotation.x = Math.PI / 2;
          break;
        case "leaf":
          mesh = new THREE.Mesh(new THREE.CircleGeometry(0.14, 8), mat);
          mesh.rotation.x = -Math.PI / 2;
          break;
        case "pineapple": {
          const shape = new THREE.Shape();
          shape.moveTo(0, 0);
          shape.absarc(0, 0, 0.28, -Math.PI / 6, Math.PI / 6, false);
          shape.lineTo(0, 0);
          const geom = new THREE.ExtrudeGeometry(shape, {
            depth: 0.05,
            bevelEnabled: false,
            curveSegments: 16,
          });
          geom.rotateX(-Math.PI / 2);
          const pTex = new THREE.TextureLoader().load(
            "/textures/pineapple.jpg",
          );
          mesh = new THREE.Mesh(
            geom,
            new THREE.MeshStandardMaterial({
              map: pTex,
              roughness: 0.55,
              metalness: 0.02,
            }),
          );
          const s = 0.7 + Math.random() * 0.5;
          mesh.scale.set(s, s, s);
          break;
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

    let pos;
    if (pizzaShapeRef.current === "circle") {
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
    setSauceType(rand(["tomato", "carbonara", "pesto", "barbecue"]));
    setPizzaShape(
      rand([
        "circle",
        "square",
        "triangle",
        "diamond",
        "oval",
        "star",
        "heart",
      ]),
    );
    const MIN_TOPPINGS = 35;
    let remaining = MIN_TOPPINGS;
    const randomCounts = {};
    const shuffled = [...INGREDIENTS].sort(() => Math.random() - 0.5);
    for (let i = 0; i < shuffled.length; i++) {
      if (remaining <= 0) break;
      if (Math.random() > 0.4 && i !== shuffled.length - 1) continue;
      const amount =
        i === shuffled.length - 1
          ? remaining
          : Math.floor(Math.random() * remaining);
      if (amount > 0) {
        randomCounts[shuffled[i].id] = amount;
        remaining -= amount;
      }
    }
    if (Object.keys(randomCounts).length === 0) {
      randomCounts[rand(INGREDIENTS).id] = MIN_TOPPINGS;
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
      new THREE.MeshStandardMaterial({ map: floorTexture }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.02;
    floor.receiveShadow = true;
    scene.add(floor);

    const wallMat = (color) => new THREE.MeshStandardMaterial({ color });
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 20),
      wallMat(0xf5e9d7),
    );
    backWall.position.set(0, 10, -15);
    scene.add(backWall);
    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 20),
      wallMat(0xf0e4d0),
    );
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-25, 10, 0);
    scene.add(leftWall);
    const rightWall = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 20),
      wallMat(0xf0e4d0),
    );
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(25, 10, 0);
    scene.add(rightWall);

    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );
    camera.position.set(0, 6, 12);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(3, 5, 3);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    scene.add(dir);
    const warmLight = new THREE.PointLight(0xfff2cc, 1.2, 15);
    warmLight.position.set(2, 6, 3);
    warmLight.castShadow = true;
    scene.add(warmLight);
    const fillLight = new THREE.DirectionalLight(0xffeedd, 0.4);
    fillLight.position.set(-3, 4, -2);
    scene.add(fillLight);
    const pizzaSpot = new THREE.SpotLight(0xfff2cc, 3);
    pizzaSpot.position.set(0, 6, 2);
    pizzaSpot.angle = Math.PI / 6;
    pizzaSpot.penumbra = 0.6;
    pizzaSpot.decay = 2;
    pizzaSpot.distance = 20;
    pizzaSpot.castShadow = true;
    scene.add(pizzaSpot);

    const table = new THREE.Mesh(
      new THREE.CircleGeometry(2.8, 64),
      new THREE.MeshStandardMaterial({
        color: 0xe3dfd7,
        roughness: 0.9,
        opacity: 0.5,
        transparent: true,
      }),
    );
    table.rotation.x = -Math.PI / 2;
    table.position.y = 0;
    table.receiveShadow = true;
    scene.add(table);

    const base = createBase(baseType, baseSize, pizzaShape);
    scene.add(base);
    baseRef.current = base;
    pizzaSpot.target = base;
    scene.add(pizzaSpot.target);

    const sauce = createSauce(baseType, baseSize, sauceType, pizzaShape);
    scene.add(sauce);
    sauceRef.current = sauce;

    const cheeseGroup = new THREE.Group();
    cheeseGroupRef.current = cheeseGroup;
    scene.add(cheeseGroup);

    const toppingsGroup = new THREE.Group();
    toppingsGroupRef.current = toppingsGroup;
    scene.add(toppingsGroup);

    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const dropPoint = new THREE.Vector3();
    const pointer = new THREE.Vector2();
    const pointerState = { dragging: false, offset: new THREE.Vector3() };
    let selected = null;

    const safeParse = (raw) => {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    };
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
          addIngredientAtWorldPos(
            fullIng,
            new THREE.Vector3(hp.x, toppingY, hp.z),
          );
        } else {
          const planePoint = new THREE.Vector3();
          if (raycaster.ray.intersectPlane(plane, planePoint))
            addIngredientAtWorldPos(
              fullIng,
              new THREE.Vector3(planePoint.x, toppingY, planePoint.z),
            );
        }
        setIngredientCounts((prev) => ({
          ...prev,
          [fullIng.id]: (prev[fullIng.id] || 0) + 1,
        }));
      } catch (err) {
        console.warn("drop parse error", err);
      }
    };

    const onPointerDown = (e) => {
      if (e.button !== 0) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, cameraRef.current);
      const intersects = raycaster.intersectObjects(
        toppingsGroup.children,
        true,
      );
      if (intersects.length > 0) {
        selected = intersects[0].object;
        selected.userData.originalScale = selected.scale.clone();
        selected.scale.multiplyScalar(1.15);
        pointerState.dragging = true;
        pointerState.offset.copy(selected.position).sub(intersects[0].point);
      } else if (selected) {
        if (selected.userData.originalScale)
          selected.scale.copy(selected.userData.originalScale);
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
        const constrained =
          pizzaShapeRef.current === "circle"
            ? snapToRingsIfNeeded(target)
            : constrainToShape(target);
        selected.position.set(
          constrained.x,
          getToppingSurfaceY(),
          constrained.z,
        );
      }
    };
    const onPointerUp = () => {
      pointerState.dragging = false;
      if (selected?.userData.originalScale)
        selected.scale.copy(selected.userData.originalScale);
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
      const w = container.clientWidth,
        h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    resizeObserver.observe(container);

    let zoomProgress = 0;
    const startPos = new THREE.Vector3(0, 8, 18);
    const endPos = new THREE.Vector3(0.5, 3.6, 5);
    const easeInOut = (t) => t * t * (3 - 2 * t);

    // In the animate() zoom intro, shift the lookAt target too
    const isMobile = window.innerWidth < 768;
    const endTarget = isMobile
      ? new THREE.Vector3(0, showConfigRef.current ? -0.8 : 0, 0)
      : new THREE.Vector3(showConfigRef.current ? -1.2 : 0, 0, 0);

    const animate = () => {
      requestAnimationFrame(animate);
      if (zoomProgress < 1) {
        zoomProgress += 0.005;
        camera.position.copy(
          startPos.clone().lerp(endPos, easeInOut(zoomProgress)),
        );
        camera.lookAt(endTarget); // look slightly left if panel open
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
        const { x, z } = randomPointInShape(pizzaShape, radius);
        addIngredientAtWorldPos(ing, new THREE.Vector3(x, toppingY, z));
      }
    });
  }, [ingredientCounts, baseType, baseSize, pizzaShape]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      // On mobile the panel slides up, so shift the camera target down
      // so the pizza stays visible above the panel
      const targetY = showConfig ? -2 : 0;
      controls.target.set(0, targetY, 0);
    } else {
      // On desktop the panel slides in from the left, shift target left
      const targetX = showConfig ? -1.2 : 0;
      controls.target.set(targetX, 0, 0);
    }
    controls.update();
  }, [showConfig]);
  // ---------- Rebuild base/sauce ----------
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (baseRef.current) {
      scene.remove(baseRef.current);
      if (baseRef.current.isGroup) {
        baseRef.current.children.forEach((c) => {
          c.geometry?.dispose();
          c.material?.dispose();
        });
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

    const base = createBase(baseType, baseSize, pizzaShape);
    scene.add(base);
    baseRef.current = base;

    const sauce = createSauce(baseType, baseSize, sauceType, pizzaShape);
    scene.add(sauce);
    sauceRef.current = sauce;

    baseRef.current.updateMatrixWorld(true);
    sauceRef.current.updateMatrixWorld(true);

    const toppingsGroup = toppingsGroupRef.current;
    if (toppingsGroup?.children.length > 0) {
      const toppingY = getToppingSurfaceY();
      toppingsGroup.children.forEach((child) => {
        child.position.y = toppingY;
      });
    }
  }, [baseType, baseSize, sauceType, pizzaShape]);

  // ---------- Rebuild cheese ----------
  useEffect(() => {
    const group = cheeseGroupRef.current;
    if (!group) return;
    group.clear();
    if (cheeseType === "none") return;
    const { radius } = getBaseDims(baseType, baseSize);
    const cheeseY = getCheeseY();
    const cheeseRadius = radius * 0.9;
    for (let i = 0; i < 180; i++) {
      group.add(
        createCheeseBlob(pizzaShape, cheeseRadius, cheeseY, cheeseType),
      );
    }
  }, [cheeseType, baseType, baseSize, pizzaShape]);

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
    if (!data) {
      alert("Snapshot failed.");
      return;
    }
    const a = document.createElement("a");
    a.href = data;
    a.download = `pizza-${Date.now()}.png`;
    a.click();
  };

  const buildRecipe = (image) => ({
    id: Date.now(),
    author: user?.displayName || user?.name || "Anonymous Chef",
    userId: user?.uid || user?.id || "guest",
    baseType,
    baseSize,
    pizzaShape,
    cheeseType,
    sauceType,
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
    try {
      image = await captureSnapshot({ scale: 1 });
    } catch {}
    publishToFeed?.(buildRecipe(image));
  };

  const handleSaveToProfile = async () => {
    if (!user) {
      alert("Please log in first!");
      return;
    }
    let image = null;
    try {
      image = await captureSnapshot({ scale: 1 });
    } catch {}
    const recipe = { ...buildRecipe(image), userId: user.uid };
    let stored = [];
    try {
      stored = JSON.parse(localStorage.getItem("userRecipes")) || [];
    } catch {}
    stored.push(recipe);
    localStorage.setItem("userRecipes", JSON.stringify(stored));
    alert("✅ Recipe saved to your profile!");
  };

  return (
    <div>
      <div className="config-wrapper">
        <div className="settings-wrapper">
          <aside className={`config-modal ${showConfig ? "open" : "closed"}`}>
            <div className="config-content">
              <button
                onClick={generateRandomPizza}
                style={{ padding: "8px 12px" }}
              >
                Generate Recipe
              </button>
              <IngredientPanel
                addIngredient={addIngredient}
                removeIngredient={removeIngredient}
                ingredientCounts={ingredientCounts}
              />
              <AiJuri
                pizzaShape={pizzaShape}
                baseType={baseType}
                baseSize={baseSize}
                sauceType={sauceType}
                cheeseType={cheeseType}
                ingredientCounts={ingredientCounts}
                sceneRef={sceneRef}
                baseRef={baseRef}
                cheeseGroupRef={cheeseGroupRef}
                toppingsGroupRef={toppingsGroupRef}
              />
              <PizzaControls
                sauceType={sauceType}
                setSauceType={setSauceType}
                baseType={baseType}
                setBaseType={setBaseType}
                baseSize={baseSize}
                setBaseSize={setBaseSize}
                pizzaShape={pizzaShape}
                setPizzaShape={setPizzaShape}
                cheeseType={cheeseType}
                setCheeseType={setCheeseType}
              />
            </div>
            <div className="btn-container">
              <PizzaControlsBtns
                downloadSnapshot={downloadSnapshot}
                handlePublish={handlePublish}
                handleSaveToProfile={handleSaveToProfile}
                removeAllToppings={removeAllToppings}
              />
            </div>
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
