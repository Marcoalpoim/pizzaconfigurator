import * as THREE from "three";
function hexToRgb(hex) {
  const bigint = parseInt(hex.replace("#", ""), 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function noiseTex(size = 64, r, g, b, variance = 30) {
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const v = (Math.random() - 0.5) * variance;
    data[i * 4 + 0] = Math.min(255, Math.max(0, r + v));
    data[i * 4 + 1] = Math.min(255, Math.max(0, g + v));
    data[i * 4 + 2] = Math.min(255, Math.max(0, b + v));
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.needsUpdate = true;
  return tex;
}

function solidMat(
  color,
  rough = 0.8,
  metal = 0,
  emissive = 0x000000,
  emissiveInt = 0,
) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: rough,
    metalness: metal,
    emissive,
    emissiveIntensity: emissiveInt,
  });
}

function noiseMat(r, g, b, rough = 0.8, variance = 25) {
  return new THREE.MeshStandardMaterial({
    map: noiseTex(64, r, g, b, variance),
    roughness: rough,
    metalness: 0,
  });
}

function makePepperoni() {
  const group = new THREE.Group();
  const size = 128;
  const data = new Uint8Array(size * size * 4);

  const meat = hexToRgb("#a30800");
  const fat = hexToRgb("#FF8A57");
  const edge = hexToRgb("#7f0300");

  const fatDots = Array.from({ length: 35 }, () => ({
    x: Math.random() * size,
    y: Math.random() * size,
    r: 1 + Math.random() * 3,
  }));

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - size / 2,
        dy = y - size / 2;
      const d = Math.sqrt(dx * dx + dy * dy) / (size / 2);

      if (d > 1.0) {
        data[idx + 3] = 0;
        continue;
      }

      const onDot = fatDots.some(
        (dot) => Math.sqrt((x - dot.x) ** 2 + (y - dot.y) ** 2) < dot.r,
      );

      const v = (Math.random() - 0.5) * 15;

      let c = meat;
      if (d > 0.92) c = edge;
      else if (onDot) c = fat;

      data[idx] = Math.min(255, Math.max(0, c.r + v));
      data[idx + 1] = Math.min(255, Math.max(0, c.g + v));
      data[idx + 2] = Math.min(255, Math.max(0, c.b + v));
      data[idx + 3] = 255;
    }
  }

  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.needsUpdate = true;

  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.015, 32),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0 }),
  );
  disc.position.y = 0.008;

  group.add(disc);
  return group;
}

function makeMushroom() {
  const group = new THREE.Group();
  const sc = 0.5 + Math.random() * 0.5;
  const thick = 0.05 * sc; // thin slice thickness (Y axis)
  const capR = 0.22 * sc;
  const stemW = capR * 0.9;
  const stemD = capR * 0.9;
  const capH = capR * 1.2; // D-shape height in XZ plane

  const capShape = new THREE.Shape();
  capShape.moveTo(-capR, 0);
  capShape.lineTo(capR, 0);
  capShape.bezierCurveTo(capR, capH * 0.6, capR * 0.5, capH, 0, capH);
  capShape.bezierCurveTo(-capR * 0.5, capH, -capR, capH * 0.6, -capR, 0);

  const capGeom = new THREE.ExtrudeGeometry(capShape, {
    depth: thick,
    bevelEnabled: false,
  });
  capGeom.rotateX(-Math.PI / 2); // now shape lies flat: X stays X, old Y becomes -Z, extrusion goes up Y
  capGeom.translate(0, 0, 0);
  group.add(
    new THREE.Mesh(
      capGeom,
      new THREE.MeshStandardMaterial({
        map: noiseTex(128, 225, 210, 185, 14),
        roughness: 0.82,
      }),
    ),
  );

  // --- Brown skin ring ---
  const skinR = capR * 1.06;
  const skinH = capH * 1.06;
  const skinShape = new THREE.Shape();
  skinShape.moveTo(-skinR, 0);
  skinShape.lineTo(skinR, 0);
  skinShape.bezierCurveTo(skinR, skinH * 0.6, skinR * 0.5, skinH, 0, skinH);
  skinShape.bezierCurveTo(-skinR * 0.5, skinH, -skinR, skinH * 0.6, -skinR, 0);
  const skinHole = new THREE.Path();
  skinHole.moveTo(-capR, 0);
  skinHole.lineTo(capR, 0);
  skinHole.bezierCurveTo(capR, capH * 0.6, capR * 0.5, capH, 0, capH);
  skinHole.bezierCurveTo(-capR * 0.5, capH, -capR, capH * 0.6, -capR, 0);
  skinShape.holes.push(skinHole);
  const skinGeom = new THREE.ExtrudeGeometry(skinShape, {
    depth: thick,
    bevelEnabled: false,
  });
  skinGeom.rotateX(-Math.PI / 2);
  group.add(
    new THREE.Mesh(
      skinGeom,
      new THREE.MeshStandardMaterial({
        map: noiseTex(32, 105, 72, 42, 25),
        roughness: 0.92,
      }),
    ),
  );

  // --- Stem: flat box, positioned behind the flat edge of the D ---
  const stemGeom = new THREE.BoxGeometry(stemW, thick, stemD);
  const stem = new THREE.Mesh(
    stemGeom,
    new THREE.MeshStandardMaterial({
      map: noiseTex(64, 222, 208, 182, 10),
      roughness: 0.86,
    }),
  );
  stem.position.set(0, thick / 2, stemD / 2); // sits behind the flat bottom of the D
  group.add(stem);

  // --- Gills on the flat cut face (Y=0 plane) ---
  const gillMat = new THREE.MeshStandardMaterial({
    color: 0xc8a87a,
    roughness: 0.95,
  });
  const gillCount = 16;
  for (let i = 0; i < gillCount; i++) {
    const t = i / (gillCount - 1);
    const gx = (-capR + t * capR * 2) * 0.92;
    const xNorm = gx / capR;
    const gz = -capH * (1 - xNorm * xNorm) * 0.88;
    const pts = [
      new THREE.Vector3(gx, 0.002, 0),
      new THREE.Vector3(gx * 0.85, 0.002, gz * 0.5),
      new THREE.Vector3(gx * 0.7, 0.002, gz),
    ];
    group.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 4, 0.0015, 4),
        gillMat,
      ),
    );
  }

  group.rotation.y = Math.random() * Math.PI * 2;
  return group;
}

function makeOlive() {
  const group = new THREE.Group();
  const isBlack = Math.random() > 0.5;

  const outerR = 0.1;
  const innerR = 0.08;
  const h = 0.06;

  // Use Torus for softer, rounded organic edges instead of Extrude
  const geom = new THREE.TorusGeometry(outerR - 0.03, 0.04, 12, 24);
  geom.scale(1, 1, 0.6);
  geom.rotateX(Math.PI / 2);

  const mat = new THREE.MeshStandardMaterial({
    color: isBlack ? 0x1a1a1a : 0x556b2f,
    roughness: 0.1, // Wet/Oily
    metalness: 0.05,
  });

  const body = new THREE.Mesh(geom, mat);
  group.add(body);

  return group;
}

function makeBasil() {
  const group = new THREE.Group();
  const sc = 0.6 + Math.random() * 0.4;

  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(-0.2, 0.05, -0.25, 0.2, -0.1, 0.35);
  shape.bezierCurveTo(-0.05, 0.4, 0.05, 0.4, 0.1, 0.35);
  shape.bezierCurveTo(0.25, 0.2, 0.2, 0.05, 0, 0);

  const geom = new THREE.ShapeGeometry(shape, 32);
  const pos = geom.attributes.position;

  // Organic deformation (folding)
  const foldFreq = 10 + Math.random() * 5;
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i),
      py = pos.getY(i);
    const wave = Math.sin(px * foldFreq) * 0.02 + Math.cos(py * 5) * 0.02;
    pos.setZ(i, wave + px * px * 0.1);
  }
  geom.computeVertexNormals();

  const leaf = new THREE.Mesh(
    geom,
    new THREE.MeshStandardMaterial({
      color: 0x3a9d23,
      roughness: 0.3, // Waxy reflection
      side: THREE.DoubleSide,
      emissive: 0x113300,
      emissiveIntensity: 0.3,
    }),
  );
  leaf.rotation.x = -Math.PI / 2;
  group.add(leaf);

  group.scale.setScalar(sc);
  return group;
}

function makeAnanas() {
  const group = new THREE.Group();
  const sc = 0.7 + Math.random() * 0.4;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(0.22 * sc, 0.08 * sc);
  shape.lineTo(0.26 * sc, 0);
  shape.lineTo(0.22 * sc, -0.08 * sc);
  shape.lineTo(0, 0);
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: 0.04,
    bevelEnabled: true,
    bevelSize: 0.01,
    bevelThickness: 0.01,
  });
  geom.rotateX(-Math.PI / 2);
  group.add(
    new THREE.Mesh(
      geom,
      new THREE.MeshStandardMaterial({
        map: noiseTex(64, 255, 210, 40, 20),
        roughness: 0.6,
         emissive: new THREE.Color(0.18, 0.12, 0.0), // warm yellow push
  emissiveIntensity: 1.0,
      }),
    ),
  );
  return group;
}

function makeCebola() {
  const group = new THREE.Group();
  const numRings = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < numRings; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.08 + i * 0.06, 0.018, 6, 28),
      new THREE.MeshStandardMaterial({
        color: 0xf0ece0,
        roughness: 0.4,
        transparent: true,
        opacity: 0.85,
      }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.rotation.z = Math.random() * Math.PI * 2;
    ring.position.y = 0.005 * i;
    group.add(ring);
  }
  return group;
}
 
function makeFrango() {
  const group = new THREE.Group();
  const sc = 0.4 + Math.random() * 0.4;

  const filletShape = new THREE.Shape();
  filletShape.ellipse(0, 0, 0.22 * sc, 0.13 * sc, 0, Math.PI * 2, false, 0);
  const filletGeom = new THREE.ExtrudeGeometry(filletShape, {
    depth: 0.03,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.015,
    bevelSegments: 3,
  });
  filletGeom.rotateX(-Math.PI / 2);

  const size = 44;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const grill =
        Math.abs((x + y) % 18) < 3 || Math.abs((x - y + size) % 18) < 3;
      const v = (Math.random() - 0.5) * 20;
      if (grill) {
        data[idx] = 90 + v;
        data[idx + 1] = 45 + v;
        data[idx + 2] = 15 + v;
      } else {
        data[idx] = 220 + v;
        data[idx + 1] = 155 + v;
        data[idx + 2] = 65 + v;
      }
      data[idx + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.needsUpdate = true;
  group.add(
    new THREE.Mesh(
      filletGeom,
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.72 }),
    ),
  );
  group.rotation.y = Math.random() * Math.PI * 2;
  return group;
}
 
function makeCarneVaca() {
  const group = new THREE.Group();
  const sc = 0.5 + Math.random() * 0.4;
  const size = 34;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - size / 2,
        dy = y - size / 2;
      const d = Math.sqrt(dx * dx + dy * dy) / (size / 2);
      const v = (Math.random() - 0.5) * 18;
      if (d > 0.82) {
        data[idx] = 55 + v;
        data[idx + 1] = 28 + v;
        data[idx + 2] = 10 + v;
      } else if (d > 0.6) {
        data[idx] = 120 + v;
        data[idx + 1] = 60 + v;
        data[idx + 2] = 20 + v;
      } else {
        data[idx] = 160 + v;
        data[idx + 1] = 85 + v;
        data[idx + 2] = 35 + v;
      }
      data[idx + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.needsUpdate = true;

  const shape = new THREE.Shape();
  shape.moveTo(0.18 * sc, 0);
  shape.bezierCurveTo(
    0.2 * sc,
    0.1 * sc,
    0.08 * sc,
    0.18 * sc,
    -0.04 * sc,
    0.16 * sc,
  );
  shape.bezierCurveTo(
    -0.18 * sc,
    0.14 * sc,
    -0.2 * sc,
    0.02 * sc,
    -0.16 * sc,
    -0.1 * sc,
  );
  shape.bezierCurveTo(
    -0.1 * sc,
    -0.18 * sc,
    0.1 * sc,
    -0.16 * sc,
    0.18 * sc,
    0,
  );
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: 0.055,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.01,
    bevelSegments: 2,
  });
  geom.rotateX(-Math.PI / 2);
  group.add(
    new THREE.Mesh(
      geom,
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 }),
    ),
  );
  group.rotation.y = Math.random() * Math.PI * 2;
  return group;
}
 
function makePancetta() {
  const group = new THREE.Group();
  const sc = 0.8 + Math.random() * 0.35;
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const stripe = Math.floor(y / 14) % 3;
      const v = (Math.random() - 0.5) * 18;
      if (stripe === 0) {
        data[idx] = 235 + v;
        data[idx + 1] = 205 + v;
        data[idx + 2] = 170 + v;
      } else if (stripe === 1) {
        data[idx] = 185 + v;
        data[idx + 1] = 70 + v;
        data[idx + 2] = 55 + v;
      } else {
        data[idx] = 218 + v;
        data[idx + 1] = 180 + v;
        data[idx + 2] = 145 + v;
      }
      data[idx + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.needsUpdate = true;
  const geom = new THREE.BoxGeometry(0.38 * sc, 0.06, 0.2 * sc);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) > 0) {
      pos.setX(i, pos.getX(i) * 0.92);
      pos.setZ(i, pos.getZ(i) * 0.92);
    }
  }
  geom.computeVertexNormals();
  group.add(
    new THREE.Mesh(
      geom,
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.62 }),
    ),
  );
  group.position.y = 0.03;
  group.rotation.y = Math.random() * Math.PI * 2;
  return group;
}
 
function makeBacon() {
  const group = new THREE.Group();
  const sc = 0.8 + Math.random() * 0.35;
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const stripe = Math.floor(y / 16) % 2;
      const v = (Math.random() - 0.5) * 15;
      if (stripe === 0) {
        data[idx] = 175 + v;
        data[idx + 1] = 55 + v;
        data[idx + 2] = 30 + v;
      } else {
        data[idx] = 238 + v;
        data[idx + 1] = 205 + v;
        data[idx + 2] = 160 + v;
      }
      data[idx + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.needsUpdate = true;
  const geom = new THREE.PlaneGeometry(0.44 * sc, 0.18 * sc, 14, 4);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    pos.setZ(i, Math.sin(x * 9) * 0.025 + 0.04);
  }
  geom.computeVertexNormals();
  const strip = new THREE.Mesh(
    geom,
    new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.58,
      side: THREE.DoubleSide,
    }),
  );
  strip.rotation.x = -Math.PI / 2;
  strip.position.y = 0.04;
  group.add(strip);
  group.scale.setScalar(sc);
  group.rotation.y = Math.random() * Math.PI * 2;
  return group;
}

// ─────────────────────────────────────────────────────────────────────────────
// CHOURIÇO — dark smoky red, chunky white fat, thick dark skin
// ─────────────────────────────────────────────────────────────────────────────
function makeChourico() {
  const group = new THREE.Group();
  const sc = 0.85 + Math.random() * 0.25;
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  const fatChunks = Array.from({ length: 14 }, () => ({
    x: Math.random() * size,
    y: Math.random() * size,
    r: 5 + Math.random() * 8,
  }));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - size / 2,
        dy = y - size / 2;
      const d = Math.sqrt(dx * dx + dy * dy) / (size / 2);
      if (d > 1.0) {
        data[idx + 3] = 0;
        continue;
      }
      const onFat = fatChunks.some(
        (c) => Math.sqrt((x - c.x) ** 2 + (y - c.y) ** 2) < c.r,
      );
      const v = (Math.random() - 0.5) * 18;
      if (d > 0.88) {
        data[idx] = 80 + v;
        data[idx + 1] = 22 + v;
        data[idx + 2] = 8 + v;
      } else if (onFat) {
        data[idx] = 228 + v;
        data[idx + 1] = 205 + v;
        data[idx + 2] = 175 + v;
      } else {
        data[idx] = 155 + v;
        data[idx + 1] = 38 + v;
        data[idx + 2] = 15 + v;
      }
      data[idx + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.needsUpdate = true;
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22 * sc, 0.215 * sc, 0.028, 48),
    new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.7,
      transparent: true,
    }),
  );
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.218 * sc, 0.02, 8, 48),
    solidMat(0x4a0e04, 0.85),
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.008;
  group.add(disc);
  group.add(rim);
  return group;
}

// ─────────────────────────────────────────────────────────────────────────────
// FIAMBRE — pale pink irregular disc
// ─────────────────────────────────────────────────────────────────────────────
function makeFiambre() {
  const group = new THREE.Group();
  const sc = 0.75 + Math.random() * 0.35;
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 0.2, 0, Math.PI * 2, false);
  const geom = new THREE.ShapeGeometry(shape, 24);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * 0.025);
    pos.setY(i, pos.getY(i) + (Math.random() - 0.5) * 0.025);
  }
  geom.computeVertexNormals();
  const disc = new THREE.Mesh(
    geom,
    new THREE.MeshStandardMaterial({
      map: noiseTex(64, 235, 175, 165, 18),
      roughness: 0.45,
      metalness: 0.05,
    }),
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.008;
  group.add(disc);
  group.scale.setScalar(sc);
  return group;
}

// ─────────────────────────────────────────────────────────────────────────────
// PIMENTO VERDE — bright green ring slices
// ─────────────────────────────────────────────────────────────────────────────
function makePimento() {
  const group = new THREE.Group();
  const numRings = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < numRings; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.12 + Math.random() * 0.04, 0.025, 6, 22),
      solidMat(0x2ea832, 0.55, 0, 0x082a08, 0.1),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(
      (Math.random() - 0.5) * 0.05,
      0.005 * i,
      (Math.random() - 0.5) * 0.05,
    );
    group.add(ring);
  }
  return group;
}

// ─────────────────────────────────────────────────────────────────────────────
// TOMATE CHERRY — halved, showing seed pattern inside
// ─────────────────────────────────────────────────────────────────────────────
function makeTomateCherry() {
  const group = new THREE.Group();
  const sc = 0.8 + Math.random() * 0.35;
  const R = 0.14 * sc;

  // Dome skin
  const skinGeom = new THREE.SphereGeometry(
    R,
    24,
    16,
    0,
    Math.PI * 2,
    0,
    Math.PI * 0.5,
  );
  const skin = new THREE.Mesh(
    skinGeom,
    new THREE.MeshStandardMaterial({
      map: noiseTex(64, 215, 42, 28, 18),
      roughness: 0.28,
      metalness: 0.04,
      emissive: 0x2a0000,
      emissiveIntensity: 0.08,
    }),
  );
  skin.rotation.x = Math.PI;

  // Cut face with seeds
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  const seeds = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2;
    return { x: Math.cos(a) * 18 + 32, y: Math.sin(a) * 18 + 32 };
  });
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - 32,
        dy = y - 32;
      const d = Math.sqrt(dx * dx + dy * dy) / 32;
      if (d > 1) {
        data[idx + 3] = 0;
        continue;
      }
      const onSeed = seeds.some(
        (s) => Math.sqrt((x - s.x) ** 2 + (y - s.y) ** 2) < 7,
      );
      const v = (Math.random() - 0.5) * 15;
      if (onSeed) {
        data[idx] = 230 + v;
        data[idx + 1] = 195 + v;
        data[idx + 2] = 55 + v;
      } else {
        data[idx] = 205 + v;
        data[idx + 1] = 55 + v;
        data[idx + 2] = 35 + v;
      }
      data[idx + 3] = 255;
    }
  }
  const cutTex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  cutTex.needsUpdate = true;
  const cutFace = new THREE.Mesh(
    new THREE.CircleGeometry(R, 32),
    new THREE.MeshStandardMaterial({
      map: cutTex,
      roughness: 0.5,
      transparent: true,
    }),
  );
  cutFace.rotation.x = -Math.PI / 2;
  cutFace.position.y = 0.001;

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.007, 0.01, 0.04, 6),
    solidMat(0x2a6010, 0.9),
  );
  stem.position.y = R + 0.015;

  group.add(cutFace);
  group.add(skin);
  group.add(stem);
  group.rotation.y = Math.random() * Math.PI * 2;
  return group;
}

// ─────────────────────────────────────────────────────────────────────────────
// CEBOLA CARAMELIZADA — amber strand pile
// ─────────────────────────────────────────────────────────────────────────────
function makeCebolaCaramelizada() {
  const group = new THREE.Group();
  const numStrands = 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < numStrands; i++) {
    const pts = [];
    let x = (Math.random() - 0.5) * 0.18,
      z = (Math.random() - 0.5) * 0.18;
    for (let j = 0; j < 6; j++) {
      x += (Math.random() - 0.5) * 0.04;
      z += (Math.random() - 0.5) * 0.04;
      pts.push(new THREE.Vector3(x, 0.005, z));
    }
    group.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.014, 6),
        noiseMat(175, 100, 20, 0.7, 15),
      ),
    );
  }
  return group;
}

// ─────────────────────────────────────────────────────────────────────────────
// CAMARÃO — plump round C-shape with visible segments
// ─────────────────────────────────────────────────────────────────────────────
function makeCamarao() {
  const group = new THREE.Group();
  const sc = 0.8 + Math.random() * 0.35;

  // Tight C-curve arc
  const points = [];
  const segs = 20;
  const arcR = 0.13 * sc;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const angle = t * Math.PI * 1.5 - Math.PI * 0.75;
    points.push(
      new THREE.Vector3(Math.cos(angle) * arcR, 0, Math.sin(angle) * arcR),
    );
  }
  const curve = new THREE.CatmullRomCurve3(points);

  // Plump tube, tapers toward tail
  const bodyGeom = new THREE.TubeGeometry(
    curve,
    segs * 3,
    0.042 * sc,
    10,
    false,
  );
  group.add(
    new THREE.Mesh(
      bodyGeom,
      new THREE.MeshStandardMaterial({
        map: noiseTex(32, 238, 130, 100, 22),
        roughness: 0.38,
        metalness: 0.06,
      }),
    ),
  );

  // Segment rings
  for (let i = 1; i <= 7; i++) {
    const pt = curve.getPoint(i / 9);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.038 * sc, 0.006 * sc, 4, 12),
      solidMat(0xc04030, 0.5),
    );
    ring.position.copy(pt);
    group.add(ring);
  }

  // Tail
  const tailPt = curve.getPoint(1);
  const tail = new THREE.Mesh(
    new THREE.ConeGeometry(0.028 * sc, 0.05 * sc, 5),
    solidMat(0xe07060, 0.45),
  );
  tail.position.copy(tailPt);
  group.add(tail);

  group.rotation.y = Math.random() * Math.PI * 2;
  return group;
}

// ─────────────────────────────────────────────────────────────────────────────
// ATUM — pale pink flaky chunks
// ─────────────────────────────────────────────────────────────────────────────
function makeAtum() {
  const group = new THREE.Group();
  const numFlakes = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < numFlakes; i++) {
    const geom = new THREE.SphereGeometry(0.07 + Math.random() * 0.04, 8, 6);
    geom.scale(1.6 + Math.random(), 0.4, 1.0 + Math.random() * 0.5);
    const flake = new THREE.Mesh(
      geom,
      new THREE.MeshStandardMaterial({
        map: noiseTex(32, 220, 185, 165, 20),
        roughness: 0.7,
      }),
    );
    flake.position.set(
      (Math.random() - 0.5) * 0.12,
      Math.random() * 0.02,
      (Math.random() - 0.5) * 0.12,
    );
    flake.rotation.y = Math.random() * Math.PI * 2;
    group.add(flake);
  }
  return group;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN FACTORY
// ─────────────────────────────────────────────────────────────────────────────
export function createMeshForIngredient(ing) {
  let group;
  switch (ing.id) {
    case "pepperoni":
      group = makePepperoni();
      break;
    case "mushroom":
    case "cogumelos":
      group = makeMushroom();
      break;
    case "olive":
    case "azeitona":
      group = makeOlive();
      break;
    case "basil":
    case "manjericao":
      group = makeBasil();
      break;
    case "pineapple":
    case "ananas":
      group = makeAnanas();
      break;
    case "cebola":
    case "onion":
      group = makeCebola();
      break;
    case "frango":
      group = makeFrango();
      break;
    case "carne":
    case "beef":
      group = makeCarneVaca();
      break;
    case "pancetta":
      group = makePancetta();
      break;
    case "bacon":
      group = makeBacon();
      break;
    case "chourico":
      group = makeChourico();
      break;
    case "fiambre":
      group = makeFiambre();
      break;
    case "pimento":
      group = makePimento();
      break;
    case "tomate_cherry":
    case "cherry_tomato":
      group = makeTomateCherry();
      break;
    case "cebola_caramelizada":
      group = makeCebolaCaramelizada();
      break;
    case "camarao":
      group = makeCamarao();
      break;
    case "atum":
      group = makeAtum();
      break;
    default:
      group = new THREE.Group();
      group.add(
        new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.1, 1),
          new THREE.MeshStandardMaterial({ color: ing.color ?? 0xaaaaaa }),
        ),
      );
  }
  group.rotation.y = Math.random() * Math.PI * 2;
  group.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return group;
}
