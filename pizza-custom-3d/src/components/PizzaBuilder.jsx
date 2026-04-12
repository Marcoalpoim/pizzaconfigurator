import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
//import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { setupScene, createAnimateLoop } from "../components/PizzaScene";
import IngredientPanel from "./PizzaBuilder/IngredientsPanel";
import PizzaControls from "./PizzaBuilder/PizzaControls";
import PizzaControlsBtns from "./PizzaBuilder/PizzaControlsBtns";
import { INGREDIENTS } from "../data/ingredients";
import Bake from "./PizzaBuilder/Bake";
import CalorieCounter from "./PizzaBuilder/CalorieCounter";
import { createMeshForIngredient } from "../data/ingredientMeshFactory";

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

  const SAUCE_OFFSET = 0.002;
  const CHEESE_OFFSET = 0.012;
  const TOPPING_OFFSET = 0.035;

  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const baseRef = useRef(null);
  const sauceRef = useRef(null);
  const cheeseGroupRef = useRef(null);
  const toppingsGroupRef = useRef(null);
  //const modelsRef = useRef({});

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

  // ── HELPERS ──────────────────────────────────────────────────────────────

  const getBaseDims = (type, size) => {
    const height = type === "thin" ? 0.04 : type === "medium" ? 0.08 : 0.15;
    const radius = size === 28 ? 1.9 : size === 33 ? 2.2 : 2.7;
    return { height, radius };
  };

  function makeDoughMat() {
    const loader = new THREE.TextureLoader();
    const tex = loader.load("/textures/dough.jpg");
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 2);
    tex.anisotropy = 8;
    const nrm = loader.load("/textures/dough.jpg");
    nrm.wrapS = nrm.wrapT = THREE.RepeatWrapping;
    nrm.repeat.set(4, 2);
    return new THREE.MeshStandardMaterial({
      map: tex,
      normalMap: nrm,
      normalScale: new THREE.Vector2(0.25, 0.25),
      roughness: 0.88,
      metalness: 0,
      color: new THREE.Color(0xffd19f),
      side: THREE.DoubleSide,
    });
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
        innerR = r * 0.55,
        points = 5;
      for (let i = 0; i < points * 2; i++) {
        const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
        const rr = i % 2 === 0 ? outerR : innerR;
        if (i === 0) s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
        else s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      s.lineTo(
        Math.cos(-Math.PI / 2) * outerR,
        Math.sin(-Math.PI / 2) * outerR,
      );
      s.closePath();
    } else if (shape === "heart") {
      const sc = r * 0.55;
      s.moveTo(0, -r * 0.9);
      s.bezierCurveTo(-sc * 2, -sc * 0.5, -sc * 2, sc * 1.2, 0, sc * 0.8);
      s.bezierCurveTo(sc * 2, sc * 1.2, sc * 2, -sc * 0.5, 0, -r * 0.9);
      s.closePath();
    } else {
      s.absarc(0, 0, r, 0, Math.PI * 2, false);
    }
    return s;
  }

  function createBase(type, size, shape) {
    const { height, radius } = getBaseDims(type, size);
    const innerRadius = radius * 0.8;
    const crustWidth = 0.08;
    const mat = makeDoughMat();

    let discGeom;
    if (!shape || shape === "circle") {
      discGeom = new THREE.CylinderGeometry(
        innerRadius,
        innerRadius,
        height,
        110,
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

    const crustCentreR = innerRadius + crustWidth * 0.3;
    const sharpShapes = ["square", "triangle", "diamond", "star"];
    const isSharp = sharpShapes.includes(shape);

    let curve3D;
    if (!shape || shape === "circle") {
      const pts = [];
      for (let i = 0; i < 128; i++) {
        const a = (i / 128) * Math.PI * 2;
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
      const pts2D = makeShape2D(shape, crustCentreR).getPoints(256);
      const last = pts2D[pts2D.length - 1],
        first = pts2D[0];
      if (
        Math.abs(last.x - first.x) < 1e-4 &&
        Math.abs(last.y - first.y) < 1e-4
      )
        pts2D.pop();
      const pts3D = pts2D.map((p) => new THREE.Vector3(p.x, 0, -p.y));
      const path = new THREE.CurvePath();
      for (let i = 0; i < pts3D.length; i++)
        path.add(new THREE.LineCurve3(pts3D[i], pts3D[(i + 1) % pts3D.length]));
      curve3D = path;
    } else {
      const pts2D = makeShape2D(shape, crustCentreR).getPoints(128);
      curve3D = new THREE.CatmullRomCurve3(
        pts2D.map((p) => new THREE.Vector3(p.x, 0, -p.y)),
        true,
      );
    }

    const tubeRadius = crustWidth + height * 0.8;
    const tubeGeom = new THREE.TubeGeometry(
      curve3D,
      isSharp ? 400 : 200,
      tubeRadius,
      20,
      true,
    );
    const discBottom = discGeom.boundingBox.min.y;
    tubeGeom.translate(0, discBottom + tubeRadius, 0);
    const crustMesh = new THREE.Mesh(tubeGeom, mat);
    crustMesh.castShadow = true;
    crustMesh.receiveShadow = true;

    const group = new THREE.Group();
    group.add(discMesh);
    group.add(crustMesh);
    group.position.y = -discBottom;
    group.userData.surfaceY = group.position.y;
    return group;
  }

  function createSauce(type, size, sType, shape) {
    const { radius } = getBaseDims(type, size);
    const innerR = radius * 0.86 * 0.97;
    const geom =
      !shape || shape === "circle"
        ? new THREE.CircleGeometry(innerR, 64)
        : new THREE.ShapeGeometry(makeShape2D(shape, innerR));
    const loader = new THREE.TextureLoader();
    const tex = loader.load("/textures/sauce.jpg");
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    const key = String(sType || "").toLowerCase();
    let color = 0xaf1917;
    if (key.includes("carbon")) color = 0xf5deb3;
    else if (key.includes("pesto")) color = 0x4f7942;
    else if (key.includes("barb")) color = 0x5c1b00;
    const mesh = new THREE.Mesh(
      geom,
      new THREE.MeshStandardMaterial({
        map: tex,
        color,
        roughness: 0.8,
        metalness: 0.1,
        side: THREE.DoubleSide,
      }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = getSauceY();
    return mesh;
  }

  // ── PLACEMENT ────────────────────────────────────────────────────────────

  function sign(px, pz, v1, v2) {
    return (px - v2.x) * (v1.z - v2.z) - (v1.x - v2.x) * (pz - v2.z);
  }
  function pointInTriangle(px, pz, v1, v2, v3) {
    const d1 = sign(px, pz, v1, v2),
      d2 = sign(px, pz, v2, v3),
      d3 = sign(px, pz, v3, v1);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  }
function pointInPolygon(px, pz, points2D) {
  let inside = false;
  for (let i = 0, j = points2D.length - 1; i < points2D.length; j = i++) {
    const xi = points2D[i].x, zi = points2D[i].y;
    const xj = points2D[j].x, zj = points2D[j].y;
    if ((zi > pz) !== (zj > pz) && px < ((xj - xi) * (pz - zi)) / (zj - zi) + xi)
      inside = !inside;
  }
  return inside;
}
  function isInsideShape(shape, x, z, r) {
    if (!shape || shape === "circle") return x * x + z * z <= r * r;
    if (shape === "square") return Math.abs(x) <= r && Math.abs(z) <= r;
    if (shape === "oval") {
      const rx = r * 1.3,
        rz = r * 0.7;
      return (x * x) / (rx * rx) + (z * z) / (rz * rz) <= 1;
    }
    if (shape === "diamond") return Math.abs(x) / r + Math.abs(z) / r <= 1;
    if (shape === "triangle")
      return pointInTriangle(
        x,
        z,
        { x: 0, z: r },
        { x: r * 0.866, z: -r * 0.5 },
        { x: -r * 0.866, z: -r * 0.5 },
      );
    if (shape === "star") {
  const starShape = makeShape2D("star", r);
  const pts = starShape.getPoints(64);
  // makeShape2D is in XY but placement is in XZ, so pass x and -z
  return pointInPolygon(x, -z, pts);
}
    if (shape === "heart") {
      const sc = r * 0.3,
        lobeR = sc * 1.8,
        lz = sc * 0.4,
        lx = sc * 0.5;
      if ((x - lx) ** 2 + (z - lz) ** 2 <= lobeR * lobeR) return true;
      if ((x + lx) ** 2 + (z - lz) ** 2 <= lobeR * lobeR) return true;
      return pointInTriangle(
        x,
        z,
        { x: -sc * 1.5, z: -sc * 0.1 },
        { x: sc * 1.5, z: -sc * 0.1 },
        { x: 0, z: r * 0.85 },
      );
    }
    return x * x + z * z <= r * r;
  }

  function randomPointInShape(shape, radius) {
    const bounds = {
      oval: { rx: radius * 0.78 * 1.3, rz: radius * 0.78 * 0.7 },
      heart: { rx: radius * 0.65, rz: radius * 0.85 },
    };
    for (let attempt = 0; attempt < 120; attempt++) {
      let x, z;
      if (shape === "oval") {
        x = (Math.random() * 2 - 1) * bounds.oval.rx;
        z = (Math.random() * 2 - 1) * bounds.oval.rz;
      } else if (shape === "heart") {
        x = (Math.random() * 2 - 1) * bounds.heart.rx;
        z = (Math.random() * 2 - 1) * bounds.heart.rz;
      } else if (shape === "star") {
        const r = radius * 0.72;
        x = (Math.random() * 2 - 1) * r;
        z = (Math.random() * 2 - 1) * r;
      } else {
        const r = radius * 0.78;
        x = (Math.random() * 2 - 1) * r;
        z = (Math.random() * 2 - 1) * r;
      }
      if (isInsideShape(shape, x, z, radius * 0.78)) return { x, z };
    }
    return { x: 0, z: 0 };
  }

  function getBaseSurfaceY() {
    return baseRef.current?.userData?.surfaceY ?? 0;
  }
  function getSauceY() {
    return getBaseSurfaceY() + SAUCE_OFFSET;
  }
  function getCheeseY() {
    return getBaseSurfaceY() + CHEESE_OFFSET;
  }
  function getToppingSurfaceY() {
    return getBaseSurfaceY() + TOPPING_OFFSET;
  }

  function snapToRingsIfNeeded(posVec) {
    if (!snapToRingsRef.current || pizzaShapeRef.current !== "circle")
      return posVec;
    const { radius } = getBaseDims(baseTypeRef.current, baseSizeRef.current);
    const dx = posVec.x,
      dz = posVec.z;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d < 0.001) return posVec;
    const ringRadii = [0.25, 0.5, 0.75, 1].map((f) => f * radius);
    let nearest = ringRadii[0],
      minDiff = Math.abs(d - ringRadii[0]);
    for (let i = 1; i < ringRadii.length; i++) {
      const diff = Math.abs(d - ringRadii[i]);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = ringRadii[i];
      }
    }
    const finalR =
      Math.abs(d - nearest) <= 0.3 ? nearest : Math.min(d, radius - 0.12);
    return new THREE.Vector3(dx * (finalR / d), posVec.y, dz * (finalR / d));
  }

  function constrainToShape(posVec) {
    const shape = pizzaShapeRef.current;
    const { radius } = getBaseDims(baseTypeRef.current, baseSizeRef.current);
    const r = radius * 0.78;
    if (isInsideShape(shape, posVec.x, posVec.z, r)) return posVec;
    const len = Math.sqrt(posVec.x * posVec.x + posVec.z * posVec.z);
    if (len < 0.001) return posVec;
    return new THREE.Vector3(
      (posVec.x * (r * 0.95)) / len,
      posVec.y,
      (posVec.z * (r * 0.95)) / len,
    );
  }

  // ── CHEESE ───────────────────────────────────────────────────────────────

  function createCheeseBlob(shape, radius, y, cheeseType) {
    const geom = new THREE.SphereGeometry(0.18 + Math.random() * 0.05, 12, 8);
    const loader = new THREE.TextureLoader();
    const paths = {
      cheddar: "/textures/cheddar.png",
      parmesan: "/textures/parmesan.jpg",
      gorgonzola: "/textures/gorganzola.jpg",
    };
    const texPath = paths[cheeseType] || "/textures/mozzarelacheese.jpeg";

    const mat = new THREE.MeshStandardMaterial({
      map: loader.load(texPath),
      // ✅ Removed: normalMap no longer reuses the color texture
      roughness: 0.75,
      metalness: 0.0,
      // Slight emissive warmth so cheese doesn't look dark and muddy
      emissive: new THREE.Color(0.08, 0.05, 0.0),
    });

    const mesh = new THREE.Mesh(geom, mat);

    mesh.scale.set(
      1.0 + Math.random() * 0.4,
      0.08 + Math.random() * 0.04,
      1.0 + Math.random() * 0.4,
    );

    // ✅ Random rotation so blobs look scattered, not stamped
    mesh.rotation.y = Math.random() * Math.PI * 2;
    mesh.rotation.z = (Math.random() - 0.5) * 0.3;

    const { x, z } = randomPointInShape(shape, radius);
    mesh.position.set(x, y + Math.random() * 0.01, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function addIngredientAtWorldPos(ing, worldPos) {
    const fullIng = INGREDIENTS.find((i) => i.id === ing.id) || ing;
    const mesh = createMeshForIngredient(fullIng);
    mesh.userData.ing = { ...fullIng };
    const pos =
      pizzaShapeRef.current === "circle"
        ? snapToRingsIfNeeded(worldPos)
        : constrainToShape(worldPos);
    mesh.position.set(pos.x, getToppingSurfaceY(), pos.z);
    mesh.userData.baseScale = mesh.scale.clone();
    if (toppingsGroupRef.current) toppingsGroupRef.current.add(mesh);
    return mesh;
  }

  // ── INGREDIENT COUNTS ────────────────────────────────────────────────────

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

  // ── RANDOM PIZZA ─────────────────────────────────────────────────────────

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
    if (Object.keys(randomCounts).length === 0)
      randomCounts[rand(INGREDIENTS).id] = MIN_TOPPINGS;
    setIngredientCounts(randomCounts);
  }

  // ── SCENE SETUP (runs once) ───────────────────────────────────────────────

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    while (container.firstChild) container.removeChild(container.firstChild);

    const refs = {
      sceneRef,
      cameraRef,
      rendererRef,
      baseRef,
      sauceRef,
      cheeseGroupRef,
      toppingsGroupRef,
    };

    const { scene, camera, renderer } = setupScene(container, refs, {
      baseType,
      baseSize,
      pizzaShape,
      sauceType,
      createBase,
      createSauce,
    });

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.minDistance = 2.2;
    controls.maxDistance = 10;
    controlsRef.current = controls;

    const cancelAnimate = createAnimateLoop({
      scene,
      camera,
      renderer,
      controls,
      showConfigRef,
    });

    // Drag & drop
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

    const onPointerDown = (e) => {
      if (e.button !== 0) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, cameraRef.current);
      const intersects = raycaster.intersectObjects(
        toppingsGroupRef.current.children,
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

    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth,
        h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimate();
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();

      if (renderer.domElement && container.contains(renderer.domElement))
        container.removeChild(renderer.domElement);
    };
  }, []);

  // ── REACTIVE EFFECTS ──────────────────────────────────────────────────────

  useEffect(() => {
    const group = toppingsGroupRef.current;
    if (!group) return;
    group.clear();
    const { radius } = getBaseDims(baseType, baseSize);
    Object.entries(ingredientCounts).forEach(([id, count]) => {
      if (!count) return;
      const ing = INGREDIENTS.find((i) => i.id === id);
      if (!ing) return;
      for (let i = 0; i < count; i++) {
        const { x, z } = randomPointInShape(pizzaShape, radius);
        addIngredientAtWorldPos(
          ing,
          new THREE.Vector3(x, getToppingSurfaceY(), z),
        );
      }
    });
  }, [ingredientCounts, baseType, baseSize, pizzaShape]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      controls.target.set(0, showConfig ? -2 : 0, 0);
    } else {
      controls.target.set(showConfig ? -1.2 : 0, 0, 0);
    }
    controls.update();
  }, [showConfig]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (baseRef.current) {
      scene.remove(baseRef.current);
      baseRef.current.isGroup
        ? baseRef.current.children.forEach((c) => {
            c.geometry?.dispose();
            c.material?.dispose();
          })
        : (baseRef.current.geometry?.dispose(),
          baseRef.current.material?.dispose());
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
    toppingsGroupRef.current?.children.forEach((c) => {
      c.position.y = getToppingSurfaceY();
    });
  }, [baseType, baseSize, sauceType, pizzaShape]);

  useEffect(() => {
    const group = cheeseGroupRef.current;
    if (!group) return;
    group.clear();
    if (cheeseType === "none") return;
    const { radius } = getBaseDims(baseType, baseSize);
    for (let i = 0; i < 180; i++)
      group.add(
        createCheeseBlob(pizzaShape, radius * 0.9, getCheeseY(), cheeseType),
      );
  }, [cheeseType, baseType, baseSize, pizzaShape]);

  /*
  useEffect(() => {
    const loader = new GLTFLoader();
    const load = (path, key, scale = 1.05) =>
      loader.load(path, (gltf) => {
        gltf.scene.scale.set(scale, scale, scale);
        modelsRef.current[key] = gltf.scene;
      });
    load("/models/pepperoni.glb", "pepperoni");
    load("/models/baby_bella_mushroom.glb", "mushroom");
    load("/models/olive.glb", "olive");
  }, []);
*/
  // ── SNAPSHOT / PUBLISH ────────────────────────────────────────────────────

  async function captureSnapshot({ scale = 1 } = {}) {
    const renderer = rendererRef.current,
      scene = sceneRef.current,
      camera = cameraRef.current;
    if (!renderer || !scene || !camera) return null;
    const canvas = renderer.domElement;
    const prevWidth = canvas.clientWidth,
      prevHeight = canvas.clientHeight,
      prevPixelRatio = renderer.getPixelRatio();
    try {
      const w = Math.floor(prevWidth * scale),
        h = Math.floor(prevHeight * scale);
      renderer.setPixelRatio(scale > 1 ? 1 : prevPixelRatio);
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
      return renderer.domElement.toDataURL("image/jpeg", 0.3);
    } catch (err) {
      console.warn("Snapshot failed:", err);
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
    author: user?.displayName || user?.name || "Anonimo",
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
      alert("Faz LogIn primeiro!");
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
    alert("Receita guardada no perfil!");
  };

  // ── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="config-wrapper">
        <div className="settings-wrapper">
          <aside className={`config-modal ${showConfig ? "open" : "closed"}`}>
            <div className="config-modal-header">
              <Bake
                baseRef={baseRef}
                cheeseGroupRef={cheeseGroupRef}
                toppingsGroupRef={toppingsGroupRef}
              />
            </div>
            <div className="config-content">
              <button onClick={generateRandomPizza} className="btn-wrapper">
                <div className="randompizza-container">
                  <img src="/icons/save.svg" alt="save" />
                  <span>Gerar Receita Aleatória</span>
                </div>
              </button>
              <IngredientPanel
                addIngredient={addIngredient}
                removeIngredient={removeIngredient}
                ingredientCounts={ingredientCounts}
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
              <div className="caloriescounter-wrapper">
                <CalorieCounter
                  ingredientCounts={ingredientCounts}
                  baseType={baseType}
                  baseSize={baseSize}
                  sauceType={sauceType}
                  cheeseType={cheeseType}
                />
              </div>
            </div>
            <div className="btn-container">
              <PizzaControlsBtns
                downloadSnapshot={downloadSnapshot}
                handlePublish={handlePublish}
                handleSaveToProfile={handleSaveToProfile}
                removeAllToppings={removeAllToppings}
                baseType={baseType}
                baseSize={baseSize}
                sauceType={sauceType}
                cheeseType={cheeseType}
                ingredientCounts={ingredientCounts}
              />
            </div>
          </aside>
        </div>
        <div className="config-toggle-wrapper">
          <button
            className="config-toggle"
            onClick={() => setShowConfig((prev) => !prev)}
          >
            <img src="/icons/config.svg" alt="config" width={30} height={30} />
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
