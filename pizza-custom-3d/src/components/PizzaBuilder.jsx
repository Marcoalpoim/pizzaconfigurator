// src/components/PizzaBuilder.jsx
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { saveRecipeToUser } from "../utils/storage";

const INGREDIENTS = [
  { id: "pepperoni", name: "Pepperoni", color: 0xb23d3d, kind: "cylinder" },
  { id: "mushroom", name: "Mushroom", color: 0xdcd2c1, kind: "mushroom" },
  { id: "olive", name: "Olive", color: 0x2a3a2a, kind: "torus" },
  { id: "basil", name: "Basil", color: 0x3c7a3c, kind: "leaf" },
  { id: "pineapple", name: "Pineapple", color: 0xffe7a3, kind: "cube" },
  { id: "onion", name: "Onion", color: 0xe6b0ff, kind: "sphere" },
];

export default function PizzaBuilder({ user, publishToFeed }) {
  // UI state
  const [baseType, setBaseType] = useState("medium");
  const [baseSize, setBaseSize] = useState(33);
  const [snapToRings, setSnapToRings] = useState(true);
  const [feedLocal, setFeedLocal] = useState([]);
  const [cheeseAmount, setCheeseAmount] = useState(250);

  // refs
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const baseRef = useRef(null);
  const sauceRef = useRef(null);
  const cheeseGroupRef = useRef(null);
  const toppingsGroupRef = useRef(null);

  // helper: dims
  const getBaseDims = (type, size) => {
    const height = type === "thin" ? 0.04 : type === "medium" ? 0.08 : 0.15;
    const radius = size === 28 ? 1.9 : size === 33 ? 2.2 : 2.7;
    return { height, radius };
  };

  function createBase(type, size) {
    const { height, radius } = getBaseDims(type, size);
    const segments = 128;
    const points = [];
    const innerRadius = radius * 0.9;
    const crustThickness = height * 2.2;
    const crustDepth = radius * 0.15;

    points.push(new THREE.Vector2(innerRadius, 0));
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const r = innerRadius + Math.sin(t * Math.PI * 0.5) * crustDepth;
      const y = -Math.sin(t * Math.PI) * crustThickness * 0.4;
      points.push(new THREE.Vector2(r, y));
    }
    for (let i = 0; i <= 32; i++) {
      const t = i / 32;
      const r = innerRadius + Math.sin(t * Math.PI * 0.5) * crustDepth;
      const y = Math.sin(t * Math.PI) * crustThickness * 0.5;
      points.push(new THREE.Vector2(r, y));
    }
    points.push(new THREE.Vector2(innerRadius, 0));

    let geom = new THREE.LatheGeometry(points, segments);
    geom = mergeVertices(geom, 1e-4);
    geom.computeVertexNormals();
    geom.computeBoundingBox();
    geom.center();

    const loader = new THREE.TextureLoader();
    const doughTexture = loader.load("/textures/dough-texture.jpg", () => {});
    doughTexture.wrapS = doughTexture.wrapT = THREE.RepeatWrapping;
    doughTexture.repeat.set(3, 3);

    const mat = new THREE.MeshStandardMaterial({
      map: doughTexture,
      color: 0xf5deb3,
      roughness: 0.8,
      metalness: 0,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const bbox = geom.boundingBox;
    mesh.position.y = -bbox.min.y;
    mesh.userData.topY = bbox.max.y - bbox.min.y + mesh.position.y;

    return mesh;
  }

  function createSauce(type, size) {
    const { height, radius } = getBaseDims(type, size);
    const geom = new THREE.CircleGeometry(radius * 0.95, 64);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xc23b22,
      roughness: 0.6,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = height - 0.01;
    return mesh;
  }

  function createCheeseBlob(radius, y) {
    const geom = new THREE.SphereGeometry(0.12 + Math.random() * 0.05, 8, 8);
    const baseColor = new THREE.Color(0xfff2a1);
    baseColor.offsetHSL((Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.1, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.8,
      metalness: 0.05,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.scale.set(1.0 + Math.random() * 0.5, 0.15 + Math.random() * 0.08, 1.0 + Math.random() * 0.5);
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * radius * 0.9;
    mesh.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // Topping surface Y: prefer sauce position; fallback to base top
  function getToppingSurfaceY() {
    if (sauceRef.current) {
      return sauceRef.current.position.y + 0.02;
    }
    if (baseRef.current && baseRef.current.geometry) {
      baseRef.current.geometry.computeBoundingBox();
      const bbox = baseRef.current.geometry.boundingBox;
      const top = new THREE.Vector3(0, bbox.max.y, 0);
      baseRef.current.localToWorld(top);
      return top.y + 0.02;
    }
    return 0.02;
  }

  function createMeshForIngredient(ing) {
    const mat = new THREE.MeshStandardMaterial({ color: ing.color, roughness: 0.75 });
    let mesh;
    switch (ing.kind) {
      case "cylinder":
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.06, 16), mat);
        break;
      case "mushroom":
        mesh = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat);
        break;
      case "torus":
        mesh = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.035, 6, 12), mat);
        mesh.rotation.x = Math.PI / 2;
        break;
      case "leaf":
        mesh = new THREE.Mesh(new THREE.CircleGeometry(0.14, 8), mat);
        mesh.rotation.x = -Math.PI / 2;
        break;
      case "cube":
        mesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.22), mat);
        break;
      default:
        mesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), mat);
    }
    mesh.userData.baseScale = mesh.scale.clone();
    mesh.userData.ing = ing;
    mesh.castShadow = true;
    return mesh;
  }

  function snapToRingsIfNeeded(posVec) {
    if (!snapToRings) return posVec;
    const base = baseRef.current;
    if (!base) return posVec;
    const radius = (base.geometry.parameters?.radiusTop ?? 2.2) * base.scale.x;
    const dx = posVec.x;
    const dz = posVec.z;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d < 0.001) return posVec;
    const RING_FRACTIONS = [0.25, 0.5, 0.75, 1];
    const ringRadii = RING_FRACTIONS.map((f) => f * radius);
    let nearest = ringRadii[0];
    let minDiff = Math.abs(d - ringRadii[0]);
    for (let i = 1; i < ringRadii.length; i++) {
      const diff = Math.abs(d - ringRadii[i]);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = ringRadii[i];
      }
    }
    const threshold = 0.3;
    let finalR = d;
    if (Math.abs(d - nearest) <= threshold) finalR = nearest;
    else finalR = Math.min(d, radius - 0.12);
    const factor = finalR / d;
    return new THREE.Vector3(dx * factor, posVec.y, dz * factor);
  }

  function addIngredientAtWorldPos(ing, worldPos) {
    const mesh = createMeshForIngredient(ing);
    const pos = snapToRingsIfNeeded(worldPos);
    const toppingY = getToppingSurfaceY();
    mesh.position.set(pos.x, toppingY, pos.z);
    mesh.userData.baseScale = mesh.scale.clone();
    if (toppingsGroupRef.current) toppingsGroupRef.current.add(mesh);
    return mesh;
  }

  // ---------- Scene setup ----------
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    while (container.firstChild) container.removeChild(container.firstChild);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 3.8, 5.2);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // lights
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

    // table
    const table = new THREE.Mesh(new THREE.CircleGeometry(2.8, 64), new THREE.MeshStandardMaterial({ color: 0xe3dfd7, roughness: 0.9, opacity: 0.5, transparent: true }));
    table.rotation.x = -Math.PI / 2;
    table.position.y = 0;
    table.receiveShadow = true;
    scene.add(table);

    // base & sauce
    const base = createBase(baseType, baseSize);
    scene.add(base);
    baseRef.current = base;

    const sauce = createSauce(baseType, baseSize);
    scene.add(sauce);
    sauceRef.current = sauce;

    // cheese & toppings groups
    const cheeseGroup = new THREE.Group();
    scene.add(cheeseGroup);
    cheeseGroupRef.current = cheeseGroup;

    const toppingsGroup = new THREE.Group();
    scene.add(toppingsGroup);
    toppingsGroupRef.current = toppingsGroup;

    // raycaster + plane + drop helpers
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const dropPoint = new THREE.Vector3();
    const pointer = new THREE.Vector2();
    const pointerState = { dragging: false, offset: new THREE.Vector3() };
    let selected = null;

    // handlers (define here so we can remove later)
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e) => {
      e.preventDefault();
      try {
        const raw = e.dataTransfer.getData("application/json") || e.dataTransfer.getData("text/plain");
        const ing = JSON.parse(raw);
        const rect = renderer.domElement.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera({ x, y }, cameraRef.current);

        const targets = [];
        if (sauceRef.current) targets.push(sauceRef.current);
        if (baseRef.current) targets.push(baseRef.current);
        const hits = raycaster.intersectObjects(targets, true);

        if (hits.length > 0) {
          const hp = hits[0].point;
          const toppingY = getToppingSurfaceY();
          addIngredientAtWorldPos(ing, new THREE.Vector3(hp.x, toppingY, hp.z));
        } else {
          const planePoint = new THREE.Vector3();
          if (raycaster.ray.intersectPlane(plane, planePoint)) {
            const toppingY = getToppingSurfaceY();
            addIngredientAtWorldPos(ing, new THREE.Vector3(planePoint.x, toppingY, planePoint.z));
          }
        }
      } catch (err) {
        console.warn("drop parse error", err);
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
        const snapped = snapToRingsIfNeeded(target);
        const toppingY = getToppingSurfaceY();
        selected.position.set(snapped.x, toppingY, snapped.z);
      }
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
        const hitPoint = intersects[0].point.clone();
        pointerState.offset.copy(selected.position).sub(hitPoint);
      } else {
        if (selected) {
          if (selected.userData.originalScale) selected.scale.copy(selected.userData.originalScale);
          selected = null;
        }
      }
    };

    const onPointerUp = () => {
      pointerState.dragging = false;
      if (selected && selected.userData.originalScale) selected.scale.copy(selected.userData.originalScale);
    };

    const onKeyDown = (e) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selected) {
        if (selected.parent) selected.parent.remove(selected);
        selected = null;
      }
    };

    // attach listeners
    renderer.domElement.addEventListener("dragover", handleDragOver);
    renderer.domElement.addEventListener("drop", handleDrop);
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("keydown", onKeyDown);

    // controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.minDistance = 2.2;
    controls.maxDistance = 10;
    controlsRef.current = controls;

    // resize
    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    resizeObserver.observe(container);

    // animation
    const animate = () => {
      requestAnimationFrame(animate);
      if (baseRef.current) baseRef.current.rotation.y += 0.0001;
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // cleanup on unmount
    return () => {
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      try {
        renderer.domElement.removeEventListener("dragover", handleDragOver);
        renderer.domElement.removeEventListener("drop", handleDrop);
        renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      } catch (e) {}
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("keydown", onKeyDown);
      if (renderer.domElement && container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []); // one-time scene init

  // When baseType or baseSize changes, rebuild base & sauce and realign toppings
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // remove old base & sauce
    if (baseRef.current) {
      scene.remove(baseRef.current);
      try { baseRef.current.geometry.dispose(); baseRef.current.material.dispose(); } catch {}
      baseRef.current = null;
    }
    if (sauceRef.current) {
      scene.remove(sauceRef.current);
      try { sauceRef.current.geometry.dispose(); sauceRef.current.material.dispose(); } catch {}
      sauceRef.current = null;
    }

    // create new base & sauce
    const base = createBase(baseType, baseSize);
    scene.add(base);
    baseRef.current = base;

    const sauce = createSauce(baseType, baseSize);
    scene.add(sauce);
    sauceRef.current = sauce;

    // Force world matrices then realign toppings to new topping surface height
    // Small timeout sometimes helps but updateMatrixWorld should suffice.
    if (baseRef.current) baseRef.current.updateMatrixWorld(true);
    if (sauceRef.current) sauceRef.current.updateMatrixWorld(true);

    const toppingsGroup = toppingsGroupRef.current;
    if (toppingsGroup && toppingsGroup.children.length > 0) {
      const toppingY = getToppingSurfaceY();
      toppingsGroup.children.forEach((child) => {
        child.position.y = toppingY;
      });
    }
  }, [baseType, baseSize]);

  // cheese rebuild
  useEffect(() => {
    const group = cheeseGroupRef.current;
    if (!group) return;
    group.clear();
    const { height, radius } = getBaseDims(baseType, baseSize);
    const cheeseY = height - 0.02;
    for (let i = 0; i < cheeseAmount; i++) {
      group.add(createCheeseBlob(radius, cheeseY));
    }
  }, [cheeseAmount, baseType, baseSize]);

  // UI handlers for drag start (left panel)
  const handleDragStart = (e, ing) => {
    e.dataTransfer.setData("application/json", JSON.stringify(ing));
    e.dataTransfer.setData("text/plain", JSON.stringify(ing));
  };

  // Snapshot function
  const downloadSnapshot = () => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    const data = renderer.domElement.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = data;
    a.download = `pizza-${Date.now()}.png`;
    a.click();
  };

  const removeAllToppings = () => {
    const group = toppingsGroupRef.current;
    if (group) {
      while (group.children.length > 0) {
        const child = group.children.pop();
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      }
    }
  };

  // Publish: gather minimal recipe metadata and publish via prop
  const handlePublish = () => {
    const toppings = (toppingsGroupRef.current?.children || []).map((c) => ({
      ingId: c.userData.ing?.id,
      pos: { x: c.position.x, y: c.position.y, z: c.position.z },
    }));
    const recipe = {
      author: user.displayName,
      userId: user.id,
      baseType,
      baseSize,
      cheeseAmount,
      toppings,
      createdAt: new Date().toISOString(),
    };
    publishToFeed && publishToFeed(recipe);
  };

  // Save to user profile (local storage)
  const handleSaveToProfile = async () => {
    const toppings = (toppingsGroupRef.current?.children || []).map((c) => ({
      ingId: c.userData.ing?.id,
      pos: { x: c.position.x, y: c.position.y, z: c.position.z },
    }));
    const recipe = { baseType, baseSize, cheeseAmount, toppings, createdAt: new Date().toISOString() };
    await saveRecipeToUser(user.id, recipe);
    alert("Saved to your profile (local)");
  };

  // UI: left panel + canvas + small feed controls
  return (
    <div style={{ height: "100vh", display: "flex", overflow: "hidden" }}>
      <aside style={{ width: 230, padding: 16, borderRight: "1px solid #2b2b2b", background: "#111", color: "#fff" }}>
        <h2 style={{ marginBottom: 12 }}>Ingredients</h2>
        <div style={{ display: "grid", gap: 8, height: 220, overflowY: "auto", marginBottom: 14 }}>
          {INGREDIENTS.map((ing) => (
            <div
              key={ing.id}
              draggable
              onDragStart={(e) => handleDragStart(e, ing)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 6, background: "#222", cursor: "grab" }}
            >
              <div style={{ width: 36, height: 36, background: `#${ing.color.toString(16).padStart(6, "0")}`, borderRadius: 6 }} />
              <div>{ing.name}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 6 }}>
          <div style={{ marginBottom: 8 }}>Base Type</div>
          <select value={baseType} onChange={(e) => setBaseType(e.target.value)} style={{ width: "100%", padding: 8 }}>
            <option value="thin">Thin</option>
            <option value="medium">Medium</option>
            <option value="thick">Thick</option>
          </select>

          <div style={{ marginTop: 12, marginBottom: 8 }}>Size</div>
          <select value={baseSize} onChange={(e) => setBaseSize(parseInt(e.target.value))} style={{ width: "100%", padding: 8 }}>
            <option value={28}>28 cm</option>
            <option value={33}>33 cm</option>
            <option value={40}>40 cm</option>
          </select>

          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
            <input type="checkbox" checked={snapToRings} onChange={(e) => setSnapToRings(e.target.checked)} />
            Snap to rings
          </label>

          <div style={{ display: "flex", gap: 8, marginTop: 12, flexDirection: "column" }}>
            <button onClick={downloadSnapshot} style={{ padding: "8px 12px" }}>Snapshot</button>
            <button onClick={handlePublish} style={{ padding: "8px 12px" }}>Publish to feed</button>
            <button onClick={handleSaveToProfile} style={{ padding: "8px 12px", background: "#5a1c1c", color: "#fff" }}>Save to profile</button>
            <button onClick={removeAllToppings} style={{ padding: "8px 12px" }}> Remove Toppings </button>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 8 }}>Cheese Amount</div>
            <input type="range" min={200} max={750} value={cheeseAmount} onChange={(e) => setCheeseAmount(parseInt(e.target.value))} style={{ width: "100%" }} />
            <div style={{ fontSize: 12, color: "#aaa" }}>{cheeseAmount} blobs</div>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, position: "relative", background: "#222" }}>
        <div ref={mountRef} style={{ position: "absolute", inset: 0 }} />
      </main>

      <aside style={{ width: 120, padding: 16, borderLeft: "1px solid #2b2b2b", background: "#111", color: "#eee" }}>
        <h3>Local feed</h3>
        {feedLocal.length === 0 ? <div style={{ marginTop: 8, color: "#999" }}> — no local posts —</div> : null}
      </aside>
    </div>
  );
}
