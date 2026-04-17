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

function canvasTex(size, drawFn) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  drawFn(c.getContext("2d"), size);
  return new THREE.CanvasTexture(c);
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
  const thick = 0.045 * sc;
  const capR = 0.22 * sc;
  const capH = capR * 1.2;
 
  const fleshTex = canvasTex(128, (ctx, s) => {
    ctx.fillStyle = "#e0d4b8";
    ctx.fillRect(0, 0, s, s);
    // Fine fiber lines
    for (let i = 0; i < 60; i++) {
      ctx.strokeStyle = `rgba(${150 + Math.random() * 40},${120 + Math.random() * 30},${80 + Math.random() * 20},${0.15 + Math.random() * 0.2})`;
      ctx.lineWidth = 0.5 + Math.random();
      const y = Math.random() * s;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s, y + (Math.random() - 0.5) * 8); ctx.stroke();
    }
    // Moisture spots
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * s, y = Math.random() * s, r = 4 + Math.random() * 10;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(240,225,195,0.4)"); g.addColorStop(1, "rgba(220,200,165,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  });
 
  const skinTex = canvasTex(64, (ctx, s) => {
    ctx.fillStyle = "#5a3a1a";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(${30 + Math.random() * 40},${15 + Math.random() * 20},${5 + Math.random() * 10},${0.3 + Math.random() * 0.4})`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 3, 1 + Math.random() * 3);
    }
  });
 
  // Cap shape
  const capShape = new THREE.Shape();
  capShape.moveTo(-capR, 0); capShape.lineTo(capR, 0);
  capShape.bezierCurveTo(capR, capH * 0.6, capR * 0.5, capH, 0, capH);
  capShape.bezierCurveTo(-capR * 0.5, capH, -capR, capH * 0.6, -capR, 0);
  const capGeom = new THREE.ExtrudeGeometry(capShape, { depth: thick, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.005, bevelSegments: 2 });
  capGeom.rotateX(-Math.PI / 2);
 
  // Organic surface deformation
  const pos = capGeom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    pos.setY(i, pos.getY(i) + Math.sin(x * 30 + z * 22) * 0.002);
  }
  capGeom.computeVertexNormals();
  group.add(new THREE.Mesh(capGeom, new THREE.MeshStandardMaterial({ map: fleshTex, roughness: 0.85 })));
 
  // Skin ring
  const skinR = capR * 1.07, skinH = capH * 1.07;
  const skinShape = new THREE.Shape();
  skinShape.moveTo(-skinR, 0); skinShape.lineTo(skinR, 0);
  skinShape.bezierCurveTo(skinR, skinH * 0.6, skinR * 0.5, skinH, 0, skinH);
  skinShape.bezierCurveTo(-skinR * 0.5, skinH, -skinR, skinH * 0.6, -skinR, 0);
  const skinHole = new THREE.Path();
  skinHole.moveTo(-capR, 0); skinHole.lineTo(capR, 0);
  skinHole.bezierCurveTo(capR, capH * 0.6, capR * 0.5, capH, 0, capH);
  skinHole.bezierCurveTo(-capR * 0.5, capH, -capR, capH * 0.6, -capR, 0);
  skinShape.holes.push(skinHole);
  const skinGeom = new THREE.ExtrudeGeometry(skinShape, { depth: thick, bevelEnabled: false });
  skinGeom.rotateX(-Math.PI / 2);
  group.add(new THREE.Mesh(skinGeom, new THREE.MeshStandardMaterial({ map: skinTex, roughness: 0.92 })));
 
  // Stem
  const stemGeom = new THREE.BoxGeometry(capR * 0.9, thick, capR * 0.9);
  const stem = new THREE.Mesh(stemGeom, new THREE.MeshStandardMaterial({ map: fleshTex, roughness: 0.86 }));
  stem.position.set(0, thick / 2, capR * 0.45);
  group.add(stem);
 
  // Gills
  const gillMat = solidMat(0xb89060, 0.95);
  for (let i = 0; i < 18; i++) {
    const t = i / 17;
    const gx = (-capR + t * capR * 2) * 0.9;
    const xNorm = gx / capR;
    const gz = -capH * (1 - xNorm * xNorm) * 0.88;
    const pts = [new THREE.Vector3(gx, 0.002, 0), new THREE.Vector3(gx * 0.8, 0.002, gz * 0.5), new THREE.Vector3(gx * 0.65, 0.002, gz)];
    group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 4, 0.0018, 4), gillMat));
  }
 
  group.rotation.y = Math.random() * Math.PI * 2;
  return group;
}

function makeOlive() {
  const group = new THREE.Group();
  const isBlack = Math.random() > 0.3;

  const outerR = 0.15;
  const innerR = 0.02;
  const h = 0.06;

  // Use Torus for softer, rounded organic edges instead of Extrude
  const geom = new THREE.TorusGeometry(outerR - 0.03, 0.04, 12, 24);
  geom.scale(0.6, 0.6, 0.6);
  geom.rotateX(Math.PI / 1.8);

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
  const sc = 0.35 + Math.random() * 0.4;
 
  const tex = canvasTex(128, (ctx, s) => {
    // Rich green base with subtle veining
    ctx.fillStyle = "#2e8a1a";
    ctx.fillRect(0, 0, s, s);
    // Central vein
    ctx.strokeStyle = "rgba(20,60,10,0.5)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(s / 2, s * 0.9); ctx.lineTo(s / 2, s * 0.05); ctx.stroke();
    // Side veins
    for (let i = 0; i < 5; i++) {
      const y = s * 0.2 + i * s * 0.14;
      const spread = (0.3 + i * 0.04) * s;
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(s / 2, y); ctx.lineTo(s / 2 - spread * 0.5, y + spread * 0.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s / 2, y); ctx.lineTo(s / 2 + spread * 0.5, y + spread * 0.2); ctx.stroke();
    }
    // Waxy highlight
    const sh = ctx.createRadialGradient(s * 0.38, s * 0.35, 1, s * 0.5, s * 0.5, s * 0.55);
    sh.addColorStop(0, "rgba(160,255,120,0.2)"); sh.addColorStop(1, "rgba(60,160,40,0)");
    ctx.fillStyle = sh; ctx.fillRect(0, 0, s, s);
  });
 
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(-0.18, 0.04, -0.24, 0.18, -0.09, 0.33);
  shape.bezierCurveTo(-0.04, 0.39, 0.04, 0.39, 0.09, 0.33);
  shape.bezierCurveTo(0.24, 0.18, 0.18, 0.04, 0, 0);
 
  const geom = new THREE.ShapeGeometry(shape, 48);
  const pos = geom.attributes.position;
  const freq = 9 + Math.random() * 5;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    pos.setZ(i, Math.sin(x * freq) * 0.018 + Math.cos(y * 6) * 0.015 + x * x * 0.12);
  }
  geom.computeVertexNormals();
 
  const leaf = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({
    map: tex, roughness: 0.28, side: THREE.DoubleSide,
    emissive: 0x0a2200, emissiveIntensity: 0.35,
  }));
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
  const sc = 0.5 + Math.random() * 0.3;

  // Irregular breast-fillet shape
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.12 * sc, -0.04 * sc, 0.22 * sc, 0.02 * sc, 0.24 * sc, 0.1 * sc);
  shape.bezierCurveTo(0.26 * sc, 0.18 * sc, 0.2 * sc,  0.26 * sc, 0.1 * sc,  0.28 * sc);
  shape.bezierCurveTo(0.0,       0.3 * sc,  -0.12 * sc, 0.26 * sc, -0.18 * sc, 0.16 * sc);
  shape.bezierCurveTo(-0.22 * sc, 0.06 * sc, -0.14 * sc, -0.04 * sc, 0, 0);

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: 0.032,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.012,
    bevelSegments: 4,
  });
  geom.rotateX(-Math.PI / 2);

  // Deform vertices for organic bumpy surface
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    pos.setY(i, pos.getY(i) + Math.sin(x * 28 + z * 19) * 0.004 + Math.cos(z * 22) * 0.003);
  }
  geom.computeVertexNormals();

  // Canvas texture: golden sear + grill marks + moisture sheen
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Base golden-brown
  const grad = ctx.createRadialGradient(size*0.45, size*0.4, 4, size*0.5, size*0.5, size*0.65);
  grad.addColorStop(0,   '#e09040');
  grad.addColorStop(0.5, '#c07020');
  grad.addColorStop(1,   '#7a3a08');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Grill marks (diagonal stripes)
  ctx.save();
  ctx.rotate(Math.PI / 5);
  for (let i = -size; i < size * 2; i += 18) {
    const g = ctx.createLinearGradient(i, 0, i + 7, 0);
    g.addColorStop(0,   'rgba(25,8,0,0)');
    g.addColorStop(0.4, 'rgba(18,5,0,0.7)');
    g.addColorStop(0.6, 'rgba(18,5,0,0.7)');
    g.addColorStop(1,   'rgba(25,8,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(i, 0, 7, size * 3);
  }
  ctx.restore();

  // Moisture/fat sheen spots
  for (let i = 0; i < 12; i++) {
    const x = Math.random() * size, y = Math.random() * size, r = 4 + Math.random() * 7;
    const s = ctx.createRadialGradient(x, y, 0, x, y, r);
    s.addColorStop(0, 'rgba(255,210,100,0.22)');
    s.addColorStop(1, 'rgba(255,190,60,0)');
    ctx.fillStyle = s;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);

  group.add(new THREE.Mesh(geom, new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.74,
    metalness: 0.02,
  })));

  group.rotation.y = Math.random() * Math.PI * 2;
  return group;
}
function makeCarneVaca() {
  const group = new THREE.Group();
  const sc = 0.5 + Math.random() * 0.4;
 
  const tex = canvasTex(128, (ctx, s) => {
    // Seared outer
    const base = ctx.createRadialGradient(s * 0.5, s * 0.5, s * 0.1, s * 0.5, s * 0.5, s * 0.6);
    base.addColorStop(0, "#b85020"); base.addColorStop(0.55, "#8a3010"); base.addColorStop(1, "#3a1005");
    ctx.fillStyle = base; ctx.fillRect(0, 0, s, s);
    // Fat marbling streaks
    for (let i = 0; i < 18; i++) {
      ctx.strokeStyle = `rgba(230,200,160,${0.18 + Math.random() * 0.25})`;
      ctx.lineWidth = 1 + Math.random() * 2.5;
      const sx = Math.random() * s, sy = Math.random() * s;
      ctx.beginPath(); ctx.moveTo(sx, sy);
      ctx.bezierCurveTo(sx + (Math.random() - 0.5) * 40, sy + (Math.random() - 0.5) * 20,
        sx + (Math.random() - 0.5) * 40, sy + (Math.random() - 0.5) * 20,
        sx + (Math.random() - 0.5) * 60, sy + (Math.random() - 0.5) * 40);
      ctx.stroke();
    }
    // Sear crust darkening at edge
    const rim = ctx.createRadialGradient(s / 2, s / 2, s * 0.3, s / 2, s / 2, s * 0.58);
    rim.addColorStop(0, "rgba(0,0,0,0)"); rim.addColorStop(1, "rgba(0,0,0,0.5)");
    ctx.fillStyle = rim; ctx.fillRect(0, 0, s, s);
  });
 
  const shape = new THREE.Shape();
  shape.moveTo(0.18 * sc, 0);
  shape.bezierCurveTo(0.2 * sc, 0.1 * sc, 0.08 * sc, 0.18 * sc, -0.04 * sc, 0.16 * sc);
  shape.bezierCurveTo(-0.18 * sc, 0.14 * sc, -0.2 * sc, 0.02 * sc, -0.16 * sc, -0.1 * sc);
  shape.bezierCurveTo(-0.1 * sc, -0.18 * sc, 0.1 * sc, -0.16 * sc, 0.18 * sc, 0);
 
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: 0.05, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 3,
  });
  geom.rotateX(-Math.PI / 2);
 
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    pos.setY(i, pos.getY(i) + Math.sin(x * 20 + z * 15) * 0.005);
  }
  geom.computeVertexNormals();
 
  group.add(new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.72, metalness: 0.03 })));
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
  const sc = 0.85 + Math.random() * 0.3;
 
  const tex = canvasTex(128, (ctx, s) => {
    for (let y = 0; y < s; y++) {
      const stripe = Math.floor(y / 14) % 2;
      if (stripe === 0) ctx.fillStyle = `rgb(${168 + Math.random() * 18},${48 + Math.random() * 15},${25 + Math.random() * 12})`;
      else ctx.fillStyle = `rgb(${232 + Math.random() * 15},${198 + Math.random() * 15},${152 + Math.random() * 15})`;
      ctx.fillRect(0, y, s, 1);
    }
    // Fat bubble texture on white strips
    for (let i = 0; i < 12; i++) {
      const x = Math.random() * s, y = Math.random() * s, r = 3 + Math.random() * 6;
      const b = ctx.createRadialGradient(x, y, 0, x, y, r);
      b.addColorStop(0, "rgba(255,240,200,0.35)"); b.addColorStop(1, "rgba(240,215,170,0)");
      ctx.fillStyle = b; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    // Sizzle darkening at edges
    const edge = ctx.createLinearGradient(0, 0, s, 0);
    edge.addColorStop(0, "rgba(0,0,0,0.3)"); edge.addColorStop(0.08, "rgba(0,0,0,0)");
    edge.addColorStop(0.92, "rgba(0,0,0,0)"); edge.addColorStop(1, "rgba(0,0,0,0.3)");
    ctx.fillStyle = edge; ctx.fillRect(0, 0, s, s);
  });
 
const geom = new THREE.BoxGeometry(0.44 * sc, 0.02 * sc, 0.2 * sc, 18, 2, 5);
const pos = geom.attributes.position;

for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i);
  const z = pos.getZ(i);

 
  const wave1 = Math.sin(x * 8) * 0.03;
 
  const wave2 = Math.sin(x * 20 + z * 10) * 0.008;

 
  const noise = (Math.random() - 0.5) * 0.003;

  pos.setY(i, pos.getY(i) + wave1 + wave2 + noise);
}

geom.computeVertexNormals();
  const strip = new THREE.Mesh(
  geom,
  new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.45,
    metalness: 0.05,
    side: THREE.DoubleSide,
  })
);
  strip.rotation.x = 0.05;
  strip.position.y = 0.02;
  group.add(strip);
  group.rotation.y = Math.random() * Math.PI * 2;
  return group;
}

 
function makeChourico(hexColor = "#9b260f") {
  const group = new THREE.Group();
  const sc = 0.85 + Math.random() * 0.25;
  const size = 128;
  const data = new Uint8Array(size * size * 4);

  const base = hexToRgb(hexColor);
  const edge = { r: Math.round(base.r * 0.52), g: Math.round(base.g * 0.58), b: Math.round(base.b * 0.53) };
  const fat  = { r: 228, g: 205, b: 175 };

  const fatChunks = Array.from({ length: 14 }, () => ({
    x: Math.random() * size,
    y: Math.random() * size,
    r: 5 + Math.random() * 8,
  }));

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - size / 2, dy = y - size / 2;
      const d = Math.sqrt(dx * dx + dy * dy) / (size / 2);

     if (d > 1.0) { data[idx + 3] = 0; continue; }

const onFat = fatChunks.some(
  (c) => Math.sqrt((x - c.x) ** 2 + (y - c.y) ** 2) < c.r
);
const v = (Math.random() - 0.5) * 18;

// 👇 removido o "if (d > 0.88)" — agora só fat ou base
if (onFat) {
  data[idx]     = fat.r + v;
  data[idx + 1] = fat.g + v;
  data[idx + 2] = fat.b + v;
} else {
  data[idx]     = base.r + v;
  data[idx + 1] = base.g + v;
  data[idx + 2] = base.b + v;
}
data[idx + 3] = 255;
    }
  }

  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.needsUpdate = true;

  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22 * sc, 0.215 * sc, 0.028, 48),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, transparent: true })
  );

  group.add(disc);
  return group;
}


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
 
function makePimento() {
  const group = new THREE.Group();
  const numRings = 1 + Math.floor(Math.random() * 2);
 
  for (let i = 0; i < numRings; i++) {
    const R = 0.1 + Math.random() * 0.04;
    const shape = new THREE.Shape();
    shape.absarc(0, 0, R, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, R * 0.6, 0, Math.PI * 2, true);
    shape.holes.push(hole);
 
    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: 0.025, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.006, bevelSegments: 2,
    });
    geom.rotateX(-Math.PI / 2);
 
    // Slight irregular wobble
    const pos = geom.attributes.position;
    for (let j = 0; j < pos.count; j++) {
      const x = pos.getX(j), z = pos.getZ(j);
      const a = Math.atan2(z, x);
      const w = Math.sin(a * 6) * 0.005;
      pos.setX(j, x + Math.cos(a) * w); pos.setZ(j, z + Math.sin(a) * w);
    }
    geom.computeVertexNormals();
 
    const tex = canvasTex(64, (ctx, s) => {
      ctx.fillStyle = "#2ea832"; ctx.fillRect(0, 0, s, s);
      // Cell wall lines
      for (let k = 0; k < 10; k++) {
        ctx.strokeStyle = `rgba(15,60,15,${0.25 + Math.random() * 0.3})`; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(0, Math.random() * s); ctx.lineTo(s, Math.random() * s); ctx.stroke();
      }
      // Waxy sheen
      const sh = ctx.createRadialGradient(s * 0.35, s * 0.3, 1, s / 2, s / 2, s * 0.55);
      sh.addColorStop(0, "rgba(180,255,160,0.3)"); sh.addColorStop(1, "rgba(60,180,50,0)");
      ctx.fillStyle = sh; ctx.fillRect(0, 0, s, s);
    });
 
    const ring = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.45, emissive: 0x082a08, emissiveIntensity: 0.15,
    }));
    ring.position.set((Math.random() - 0.5) * 0.04, 0.004 * i, (Math.random() - 0.5) * 0.04);
    group.add(ring);
  }
  return group;
}
 
function makeTomateCherry() {
  const group = new THREE.Group();
  const sc = 0.8 + Math.random() * 0.35;
  const R = 0.14 * sc;
  const isCut = Math.random() > 0.45;

  // ── SKIN ──────────────────────────────────────────────────────────────────
  const skinGeom = new THREE.SphereGeometry(
    R, 28, 20, 0, Math.PI * 2, 0, Math.PI * (isCut ? 0.52 : 1.0)
  );

  // Build skin texture with plain DataTexture (like noiseTex / makePepperoni)
  const skinSize = 128;
  const skinData = new Uint8Array(skinSize * skinSize * 4);
  for (let py = 0; py < skinSize; py++) {
    for (let px = 0; px < skinSize; px++) {
      const idx = (py * skinSize + px) * 4;
      // Radial darkening toward edges (simulate sphere shading in texture)
      const dx = (px / skinSize - 0.5) * 2;
      const dy = (py / skinSize - 0.5) * 2;
      const d = Math.sqrt(dx * dx + dy * dy); // 0=center, ~1.4=corner
      const edge = Math.min(1, d * 0.7);
      // Specular hot-spot top-left
      const sdx = px / skinSize - 0.35;
      const sdy = py / skinSize - 0.3;
      const spec = Math.max(0, 1 - Math.sqrt(sdx * sdx + sdy * sdy) / 0.22);
      const v = (Math.random() - 0.5) * 18;
      const r = Math.min(255, Math.max(0, 210 - edge * 100 + spec * 55 + v));
      const g = Math.min(255, Math.max(0,  32 - edge *  20 + spec * 25 + v * 0.3));
      const b = Math.min(255, Math.max(0,  18 - edge *  10 + spec * 18 + v * 0.2));
      skinData[idx]     = r;
      skinData[idx + 1] = g;
      skinData[idx + 2] = b;
      skinData[idx + 3] = 255;
    }
  }
  const skinTex = new THREE.DataTexture(skinData, skinSize, skinSize, THREE.RGBAFormat);
  skinTex.needsUpdate = true;

  const skin = new THREE.Mesh(skinGeom, new THREE.MeshStandardMaterial({
    map: skinTex,
    roughness: 0.18,
    metalness: 0.06,
    emissive: new THREE.Color(0.06, 0.0, 0.0),
    emissiveIntensity: 1.0,
  }));
  skin.castShadow = true;
  group.add(skin);

  // ── CUT FACE ──────────────────────────────────────────────────────────────
  if (isCut) {
    const size = 128;
    const data = new Uint8Array(size * size * 4);
    const cx = size / 2, cy = size / 2, r = size / 2 - 1;

    // 2 locule ellipses (seed chambers), cherry tomatoes have 2
    const locules = [
      { x: cx - size * 0.18, y: cy, rx: size * 0.13, ry: size * 0.17 },
      { x: cx + size * 0.18, y: cy, rx: size * 0.13, ry: size * 0.17 },
    ];

    // 4 seeds, 2 per locule
    
  

    for (let py = 0; py < size; py++) {
      for (let px = 0; px < size; px++) {
        const idx = (py * size + px) * 4;
        const dx = px - cx, dy = py - cy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > r) { data[idx + 3] = 0; continue; }

        const t = d / r; // 0=center, 1=rim
        const v = (Math.random() - 0.5) * 14;

        // Check locule membership
        let inLocule = false;
        for (const l of locules) {
          const lx = (px - l.x) / l.rx, ly = (py - l.y) / l.ry;
          if (lx * lx + ly * ly < 1) { inLocule = true; break; }
        }

 
        // Membrane lines from center
        const angle = Math.atan2(dy, dx);
        const membraneAngle = ((angle / (Math.PI * 2)) * 8) % 1; // 8 spokes
        const onMembrane = t > 0.12 && t < 0.9 && membraneAngle < 0.04;

        // Center core (pale, connects locules)
        const inCore = d < size * 0.1;

          if (inCore) {
          // Pale center
          data[idx]     = Math.min(255, 238 + v);
          data[idx + 1] = Math.min(255, 165 + v);
          data[idx + 2] = Math.min(255, 120 + v);
        } else if (inLocule) {
          // Orange-red gel
          data[idx]     = Math.min(255, 210 + v);
          data[idx + 1] = Math.min(255,  72 + v * 0.5);
          data[idx + 2] = Math.min(255,  38 + v * 0.3);
        } else if (onMembrane) {
          // Darker membrane lines
          data[idx]     = Math.min(255, 155 + v);
          data[idx + 1] = Math.min(255,  38 + v * 0.5);
          data[idx + 2] = Math.min(255,  18 + v * 0.3);
        } else {
          // Flesh: pale near center, deep red toward rim
          data[idx]     = Math.min(255, Math.max(0, 195 + (1 - t) * 35 + v));
          data[idx + 1] = Math.min(255, Math.max(0,  48 + (1 - t) * 20 + v * 0.4));
          data[idx + 2] = Math.min(255, Math.max(0,  28 + (1 - t) * 12 + v * 0.3));
        }
        data[idx + 3] = 255;
      }
    }

    const cutTex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    cutTex.needsUpdate = true;

    const cutFace = new THREE.Mesh(
      new THREE.CircleGeometry(R * 0.995, 48),
      new THREE.MeshStandardMaterial({
        map: cutTex,
        roughness: 0.38,
        metalness: 0.02,
        transparent: true,
      })
    );
    cutFace.rotation.x = -Math.PI / 2;
    cutFace.position.y = 0.0008;
    cutFace.receiveShadow = true;
    group.add(cutFace);
  }

 

  group.rotation.y = Math.random() * Math.PI * 2;
  return group;
}

 
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

 
function makeCamarao() {
  const group = new THREE.Group();
  const sc = 0.8 + Math.random() * 0.35;
 
  const tex = canvasTex(64, (ctx, s) => {
    const base = ctx.createLinearGradient(0, 0, s, 0);
    base.addColorStop(0, "#e87050"); base.addColorStop(0.5, "#f09060"); base.addColorStop(1, "#d05838");
    ctx.fillStyle = base; ctx.fillRect(0, 0, s, s);
    // Segment lines
    for (let i = 0; i < 8; i++) {
      const x = (i / 8) * s;
      ctx.strokeStyle = `rgba(150,40,20,${0.3 + Math.random() * 0.2})`; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, s); ctx.stroke();
    }
    // Sheen
    const sh = ctx.createLinearGradient(0, 0, 0, s);
    sh.addColorStop(0, "rgba(255,200,180,0.3)"); sh.addColorStop(0.5, "rgba(255,180,150,0)");
    ctx.fillStyle = sh; ctx.fillRect(0, 0, s, s);
  });
 
  const points = [];
  const arcR = 0.13 * sc;
  for (let i = 0; i <= 22; i++) {
    const t = i / 22;
    const angle = t * Math.PI * 1.5 - Math.PI * 0.75;
    const taper = 1 - t * 0.35;
    points.push(new THREE.Vector3(Math.cos(angle) * arcR * taper, 0, Math.sin(angle) * arcR));
  }
  const curve = new THREE.CatmullRomCurve3(points);
 
  group.add(new THREE.Mesh(
    new THREE.TubeGeometry(curve, 60, 0.04 * sc, 10, false),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35, metalness: 0.08 }),
  ));
 
  // Segment rings
  for (let i = 1; i <= 8; i++) {
    const pt = curve.getPoint(i / 10);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.036 * sc, 0.005 * sc, 4, 12),
      solidMat(0xb03828, 0.45),
    );
    ring.position.copy(pt);
    group.add(ring);
  }
 
  // Tail fan
  const tailPt = curve.getPoint(1);
  const tailDir = curve.getTangent(1);
  for (let i = 0; i < 3; i++) {
    const fan = new THREE.Mesh(
      new THREE.ConeGeometry(0.018 * sc, 0.048 * sc, 4),
      solidMat(0xd06050, 0.42),
    );
    fan.position.copy(tailPt);
    fan.position.x += (i - 1) * 0.025 * sc;
    group.add(fan);
  }
 
  group.rotation.y = Math.random() * Math.PI * 2;
  return group;
}

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
