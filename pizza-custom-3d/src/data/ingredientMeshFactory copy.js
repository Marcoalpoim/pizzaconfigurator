import * as THREE from "three";

// ─── Shared helpers ───────────────────────────────────────────────────────────

function solidMat(color, rough = 0.8, metal = 0, emissive = 0x000000, emissiveInt = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, emissive, emissiveIntensity: emissiveInt });
}

function canvasTex(size, drawFn) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  drawFn(c.getContext("2d"), size);
  return new THREE.CanvasTexture(c);
}

// ─── PEPPERONI ────────────────────────────────────────────────────────────────
function makePepperoni() {
  const group = new THREE.Group();
  const sc = 0.85 + Math.random() * 0.2;

  const tex = canvasTex(128, (ctx, s) => {
    // Dark red base
    const base = ctx.createRadialGradient(s * 0.45, s * 0.4, 2, s * 0.5, s * 0.5, s * 0.55);
    base.addColorStop(0, "#c01008");
    base.addColorStop(0.7, "#8a0500");
    base.addColorStop(1, "#4a0200");
    ctx.fillStyle = base;
    ctx.beginPath(); ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2); ctx.fill();

    // Fat dots
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * s * 0.44;
      const x = s / 2 + Math.cos(a) * r, y = s / 2 + Math.sin(a) * r;
      const dot = ctx.createRadialGradient(x, y, 0, x, y, 3 + Math.random() * 4);
      dot.addColorStop(0, "rgba(255,160,100,0.95)");
      dot.addColorStop(1, "rgba(200,100,60,0)");
      ctx.fillStyle = dot;
      ctx.beginPath(); ctx.arc(x, y, 4 + Math.random() * 4, 0, Math.PI * 2); ctx.fill();
    }

    // Spice flecks
    for (let i = 0; i < 20; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * s * 0.42;
      ctx.fillStyle = `rgba(30,5,0,${0.3 + Math.random() * 0.4})`;
      ctx.beginPath(); ctx.arc(s / 2 + Math.cos(a) * r, s / 2 + Math.sin(a) * r, 0.8 + Math.random() * 1.5, 0, Math.PI * 2); ctx.fill();
    }

    // Dark edge rim
    const rim = ctx.createRadialGradient(s / 2, s / 2, s * 0.38, s / 2, s / 2, s * 0.52);
    rim.addColorStop(0, "rgba(0,0,0,0)");
    rim.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = rim;
    ctx.beginPath(); ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2); ctx.fill();
  });

  // Slightly cupped disc
  const geom = new THREE.CylinderGeometry(0.22 * sc, 0.215 * sc, 0.018, 40);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) > 0) {
      const x = pos.getX(i), z = pos.getZ(i);
      const d = Math.sqrt(x * x + z * z) / (0.22 * sc);
      pos.setY(i, pos.getY(i) + d * d * 0.012);
    }
  }
  geom.computeVertexNormals();

  group.add(new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.62, metalness: 0.02 })));
  return group;
}

// ─── MUSHROOM ─────────────────────────────────────────────────────────────────
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

// ─── OLIVE ────────────────────────────────────────────────────────────────────
function makeOlive() {
  const group = new THREE.Group();
  const isBlack = Math.random() > 0.3;
  const sc = 0.8 + Math.random() * 0.3;
  const R = 0.13 * sc;

  // Thin half-ring slice shape
  const shape = new THREE.Shape();
  shape.absarc(0, 0, R, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, R * 0.45, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const geom = new THREE.ExtrudeGeometry(shape, { depth: 0.022, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.004, bevelSegments: 2 });
  geom.rotateX(-Math.PI / 2);

  // Organic edge wobble
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const a = Math.atan2(z, x);
    const wobble = Math.sin(a * 7) * 0.004;
    pos.setX(i, x + Math.cos(a) * wobble);
    pos.setZ(i, z + Math.sin(a) * wobble);
  }
  geom.computeVertexNormals();

  const col = isBlack ? "#1c1c1c" : "#3a5a1a";
  const tex = canvasTex(64, (ctx, s) => {
    ctx.fillStyle = isBlack ? "#1a1a1a" : "#3a5820";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 20; i++) {
      const v = (Math.random() - 0.5) * 25;
      const base = isBlack ? 26 : 55;
      ctx.fillStyle = `rgba(${base + v},${(isBlack ? 26 : 90) + v},${(isBlack ? 26 : 30) + v},0.5)`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 2 + Math.random() * 4, 2 + Math.random() * 4);
    }
    // Oily sheen
    const sh = ctx.createRadialGradient(s * 0.35, s * 0.3, 1, s * 0.5, s * 0.5, s * 0.5);
    sh.addColorStop(0, "rgba(255,255,200,0.18)"); sh.addColorStop(1, "rgba(255,255,200,0)");
    ctx.fillStyle = sh; ctx.fillRect(0, 0, s, s);
  });

  group.add(new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.12, metalness: 0.06 })));

  // Pimento fill (orange-red center)
  const fillGeom = new THREE.CylinderGeometry(R * 0.42, R * 0.42, 0.024, 20);
  group.add(new THREE.Mesh(fillGeom, new THREE.MeshStandardMaterial({ color: 0xd04010, roughness: 0.6 })));

  return group;
}

// ─── BASIL ────────────────────────────────────────────────────────────────────
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

// ─── PINEAPPLE ────────────────────────────────────────────────────────────────
function makeAnanas() {
  const group = new THREE.Group();
  const sc = 0.75 + Math.random() * 0.35;

  const tex = canvasTex(128, (ctx, s) => {
    // Golden-yellow base
    const base = ctx.createLinearGradient(0, 0, s, s);
    base.addColorStop(0, "#f5c820"); base.addColorStop(0.5, "#e8a810"); base.addColorStop(1, "#c07808");
    ctx.fillStyle = base; ctx.fillRect(0, 0, s, s);
    // Cell pattern (pineapple skin texture)
    ctx.strokeStyle = "rgba(140,80,0,0.35)"; ctx.lineWidth = 1;
    for (let y = 0; y < s; y += 14) {
      for (let x = 0; x < s; x += 12) {
        ctx.beginPath(); ctx.arc(x + (y % 24 < 12 ? 6 : 0), y, 5, 0, Math.PI * 2); ctx.stroke();
      }
    }
    // Juicy sheen
    const sh = ctx.createRadialGradient(s * 0.35, s * 0.3, 1, s * 0.5, s * 0.5, s * 0.6);
    sh.addColorStop(0, "rgba(255,245,180,0.35)"); sh.addColorStop(1, "rgba(255,220,80,0)");
    ctx.fillStyle = sh; ctx.fillRect(0, 0, s, s);
  });

  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.06 * sc, -0.06 * sc, 0.2 * sc, -0.05 * sc, 0.24 * sc, 0);
  shape.bezierCurveTo(0.28 * sc, 0.05 * sc, 0.22 * sc, 0.1 * sc, 0.12 * sc, 0.1 * sc);
  shape.bezierCurveTo(0.02 * sc, 0.1 * sc, -0.04 * sc, 0.06 * sc, 0, 0);

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: 0.035, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.008, bevelSegments: 3,
  });
  geom.rotateX(-Math.PI / 2);

  // Surface bumps
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) > 0.02) pos.setY(i, pos.getY(i) + Math.sin(pos.getX(i) * 40 + pos.getZ(i) * 35) * 0.003);
  }
  geom.computeVertexNormals();

  group.add(new THREE.Mesh(geom, new THREE.MeshStandardMaterial({
    map: tex, roughness: 0.55, metalness: 0.02,
    emissive: new THREE.Color(0.12, 0.08, 0), emissiveIntensity: 0.6,
  })));
  return group;
}

// ─── ONION ────────────────────────────────────────────────────────────────────
function makeCebola() {
  const group = new THREE.Group();
  const numRings = 1 + Math.floor(Math.random() * 3);

  for (let i = 0; i < numRings; i++) {
    const R = 0.06 + i * 0.055;
    const ringTex = canvasTex(64, (ctx, s) => {
      ctx.fillStyle = "rgba(245,238,210,0.9)";
      ctx.fillRect(0, 0, s, s);
      // Translucent cell lines
      for (let j = 0; j < 15; j++) {
        ctx.strokeStyle = `rgba(200,185,150,${0.2 + Math.random() * 0.3})`;
        ctx.lineWidth = 0.6 + Math.random();
        const y = Math.random() * s;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s, y + (Math.random() - 0.5) * 6); ctx.stroke();
      }
    });

    // Extruded arc segment (not full ring) — break to look cut
    const arcSpan = Math.PI * (1.4 + Math.random() * 0.5);
    const arcStart = Math.random() * Math.PI * 2;
    const shape = new THREE.Shape();
    shape.absarc(0, 0, R, arcStart, arcStart + arcSpan, false);
    shape.absarc(0, 0, R - 0.016, arcStart + arcSpan, arcStart, true);

    const geom = new THREE.ShapeGeometry(shape, 40);
    const mesh = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({
      map: ringTex, roughness: 0.45, transparent: true, opacity: 0.88, side: THREE.DoubleSide,
    }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.003 * i;
    group.add(mesh);
  }
  return group;
}

// ─── CHICKEN (FRANGO) ─────────────────────────────────────────────────────────
function makeFrango() {
  const group = new THREE.Group();
  const sc = 0.5 + Math.random() * 0.3;

  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.12 * sc, -0.04 * sc, 0.22 * sc, 0.02 * sc, 0.24 * sc, 0.1 * sc);
  shape.bezierCurveTo(0.26 * sc, 0.18 * sc, 0.2 * sc, 0.26 * sc, 0.1 * sc, 0.28 * sc);
  shape.bezierCurveTo(0.0, 0.3 * sc, -0.12 * sc, 0.26 * sc, -0.18 * sc, 0.16 * sc);
  shape.bezierCurveTo(-0.22 * sc, 0.06 * sc, -0.14 * sc, -0.04 * sc, 0, 0);

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: 0.032, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.012, bevelSegments: 4,
  });
  geom.rotateX(-Math.PI / 2);

  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    pos.setY(i, pos.getY(i) + Math.sin(x * 28 + z * 19) * 0.004 + Math.cos(z * 22) * 0.003);
  }
  geom.computeVertexNormals();

  const tex = canvasTex(128, (ctx, s) => {
    const grad = ctx.createRadialGradient(s * 0.45, s * 0.4, 4, s * 0.5, s * 0.5, s * 0.65);
    grad.addColorStop(0, "#e09040"); grad.addColorStop(0.5, "#c07020"); grad.addColorStop(1, "#7a3a08");
    ctx.fillStyle = grad; ctx.fillRect(0, 0, s, s);
    ctx.save(); ctx.rotate(Math.PI / 5);
    for (let i = -s; i < s * 2; i += 18) {
      const g = ctx.createLinearGradient(i, 0, i + 7, 0);
      g.addColorStop(0, "rgba(25,8,0,0)"); g.addColorStop(0.4, "rgba(18,5,0,0.7)");
      g.addColorStop(0.6, "rgba(18,5,0,0.7)"); g.addColorStop(1, "rgba(25,8,0,0)");
      ctx.fillStyle = g; ctx.fillRect(i, 0, 7, s * 3);
    }
    ctx.restore();
    for (let i = 0; i < 12; i++) {
      const x = Math.random() * s, y = Math.random() * s, r = 4 + Math.random() * 7;
      const sh = ctx.createRadialGradient(x, y, 0, x, y, r);
      sh.addColorStop(0, "rgba(255,210,100,0.22)"); sh.addColorStop(1, "rgba(255,190,60,0)");
      ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  });

  group.add(new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.74, metalness: 0.02 })));
  group.rotation.y = Math.random() * Math.PI * 2;
  return group;
}

// ─── BEEF (CARNE DE VACA) ─────────────────────────────────────────────────────
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

// ─── PANCETTA ─────────────────────────────────────────────────────────────────
function makePancetta() {
  const group = new THREE.Group();
  const sc = 0.8 + Math.random() * 0.35;

  const tex = canvasTex(128, (ctx, s) => {
    // Fat/meat layers
    for (let y = 0; y < s; y++) {
      const stripe = Math.floor(y / 12) % 3;
      if (stripe === 0) ctx.fillStyle = `rgb(${230 + Math.random() * 15},${198 + Math.random() * 15},${162 + Math.random() * 15})`;
      else if (stripe === 1) ctx.fillStyle = `rgb(${175 + Math.random() * 15},${62 + Math.random() * 15},${48 + Math.random() * 15})`;
      else ctx.fillStyle = `rgb(${212 + Math.random() * 15},${175 + Math.random() * 15},${138 + Math.random() * 15})`;
      ctx.fillRect(0, y, s, 1);
    }
    // Inter-layer connective tissue lines
    for (let i = 0; i < 8; i++) {
      const y = Math.random() * s;
      ctx.strokeStyle = `rgba(200,150,100,${0.2 + Math.random() * 0.3})`; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s, y + (Math.random() - 0.5) * 5); ctx.stroke();
    }
    // Top glaze
    const glaze = ctx.createLinearGradient(0, 0, 0, s * 0.3);
    glaze.addColorStop(0, "rgba(255,200,150,0.18)"); glaze.addColorStop(1, "rgba(255,200,150,0)");
    ctx.fillStyle = glaze; ctx.fillRect(0, 0, s, s * 0.3);
  });

  const geom = new THREE.BoxGeometry(0.38 * sc, 0.055, 0.2 * sc);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) > 0) {
      const x = pos.getX(i), z = pos.getZ(i);
      pos.setX(i, x * 0.92); pos.setZ(i, z * 0.92);
      pos.setY(i, pos.getY(i) + Math.sin(x * 18 + z * 14) * 0.004);
    }
  }
  geom.computeVertexNormals();
  group.add(new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.58 })));
  group.rotation.y = Math.random() * Math.PI * 2;
  return group;
}

// ─── BACON ────────────────────────────────────────────────────────────────────
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

  const geom = new THREE.PlaneGeometry(0.44 * sc, 0.2 * sc, 18, 5);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    pos.setZ(i, Math.sin(x * 10) * 0.022 + Math.cos(y * 8) * 0.006 + 0.038);
  }
  geom.computeVertexNormals();
  const strip = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, side: THREE.DoubleSide }));
  strip.rotation.x = -Math.PI / 2;
  strip.position.y = 0.04;
  group.add(strip);
  group.rotation.y = Math.random() * Math.PI * 2;
  return group;
}

// ─── CHOURIÇO ─────────────────────────────────────────────────────────────────
function makeChourico() {
  const group = new THREE.Group();
  const sc = 0.85 + Math.random() * 0.25;

  const tex = canvasTex(128, (ctx, s) => {
    ctx.beginPath(); ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2);
    // Deep smoky red base
    const base = ctx.createRadialGradient(s * 0.4, s * 0.38, 2, s / 2, s / 2, s * 0.52);
    base.addColorStop(0, "#c03010"); base.addColorStop(0.6, "#901808"); base.addColorStop(1, "#3a0602");
    ctx.fillStyle = base; ctx.fill();

    // Fat chunks
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * s * 0.42;
      const x = s / 2 + Math.cos(a) * r, y = s / 2 + Math.sin(a) * r;
      const chunk = ctx.createRadialGradient(x, y, 0, x, y, 4 + Math.random() * 9);
      chunk.addColorStop(0, "rgba(228,210,180,0.95)"); chunk.addColorStop(1, "rgba(200,175,140,0)");
      ctx.fillStyle = chunk; ctx.beginPath(); ctx.arc(x, y, 6 + Math.random() * 9, 0, Math.PI * 2); ctx.fill();
    }

    // Paprika speckle
    for (let i = 0; i < 25; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * s * 0.44;
      ctx.fillStyle = `rgba(60,5,0,${0.3 + Math.random() * 0.4})`;
      ctx.beginPath(); ctx.arc(s / 2 + Math.cos(a) * r, s / 2 + Math.sin(a) * r, 0.8 + Math.random() * 1.8, 0, Math.PI * 2); ctx.fill();
    }

    // Dark rim / skin
    const rim = ctx.createRadialGradient(s / 2, s / 2, s * 0.36, s / 2, s / 2, s * 0.52);
    rim.addColorStop(0, "rgba(0,0,0,0)"); rim.addColorStop(1, "rgba(0,0,0,0.62)");
    ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2); ctx.fill();
  });

  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22 * sc, 0.215 * sc, 0.03, 48),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.68, metalness: 0.02 }),
  );

  // Skin rim torus
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.218 * sc, 0.018, 10, 48),
    new THREE.MeshStandardMaterial({ color: 0x380800, roughness: 0.85 }),
  );
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.01;

  group.add(disc); group.add(rim);
  return group;
}

// ─── FIAMBRE (HAM) ────────────────────────────────────────────────────────────
function makeFiambre() {
  const group = new THREE.Group();
  const sc = 0.75 + Math.random() * 0.35;

  const tex = canvasTex(128, (ctx, s) => {
    // Pale pink base
    const base = ctx.createRadialGradient(s * 0.42, s * 0.38, 2, s / 2, s / 2, s * 0.58);
    base.addColorStop(0, "#f0b8a8"); base.addColorStop(0.6, "#d89080"); base.addColorStop(1, "#b06858");
    ctx.fillStyle = base; ctx.fillRect(0, 0, s, s);
    // Fine muscle fiber lines
    for (let i = 0; i < 50; i++) {
      ctx.strokeStyle = `rgba(${160 + Math.random() * 40},${90 + Math.random() * 30},${75 + Math.random() * 20},${0.12 + Math.random() * 0.18})`;
      ctx.lineWidth = 0.6 + Math.random() * 0.8;
      const y = Math.random() * s;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s, y + (Math.random() - 0.5) * 10); ctx.stroke();
    }
    // Pale fat patches
    for (let i = 0; i < 6; i++) {
      const x = Math.random() * s, y = Math.random() * s, r = 6 + Math.random() * 12;
      const fat = ctx.createRadialGradient(x, y, 0, x, y, r);
      fat.addColorStop(0, "rgba(248,232,220,0.5)"); fat.addColorStop(1, "rgba(235,210,195,0)");
      ctx.fillStyle = fat; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    // Sheen
    const sh = ctx.createRadialGradient(s * 0.35, s * 0.3, 1, s / 2, s / 2, s * 0.55);
    sh.addColorStop(0, "rgba(255,230,220,0.22)"); sh.addColorStop(1, "rgba(255,200,185,0)");
    ctx.fillStyle = sh; ctx.fillRect(0, 0, s, s);
  });

  const shape = new THREE.Shape();
  shape.absarc(0, 0, 0.2, 0, Math.PI * 2, false);
  const geom = new THREE.ShapeGeometry(shape, 32);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * 0.02);
    pos.setY(i, pos.getY(i) + (Math.random() - 0.5) * 0.02);
  }
  geom.computeVertexNormals();

  const disc = new THREE.Mesh(disc_geom_for_fiambre(sc), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.48, metalness: 0.04 }));
  group.add(disc);
  group.scale.setScalar(sc);
  return group;
}

function disc_geom_for_fiambre(sc) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 0.2, 0, Math.PI * 2, false);
  const geom = new THREE.ShapeGeometry(shape, 32);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * 0.022);
    pos.setY(i, pos.getY(i) + (Math.random() - 0.5) * 0.022);
  }
  geom.computeVertexNormals();
  const mesh = new THREE.Mesh(geom);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.008;
  return geom;
}

// ─── PIMENTO (GREEN PEPPER) ───────────────────────────────────────────────────
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

// ─── CHERRY TOMATO ────────────────────────────────────────────────────────────
function makeTomateCherry() {
  const group = new THREE.Group();
  const sc = 0.8 + Math.random() * 0.35;
  const R = 0.14 * sc;

  const skinTex = canvasTex(128, (ctx, s) => {
    const base = ctx.createRadialGradient(s * 0.38, s * 0.35, 2, s / 2, s / 2, s * 0.58);
    base.addColorStop(0, "#e83520"); base.addColorStop(0.55, "#c01808"); base.addColorStop(1, "#6a0508");
    ctx.fillStyle = base; ctx.fillRect(0, 0, s, s);
    // Surface sheen / highlight
    const sh = ctx.createRadialGradient(s * 0.32, s * 0.28, 1, s * 0.38, s * 0.35, s * 0.28);
    sh.addColorStop(0, "rgba(255,220,200,0.45)"); sh.addColorStop(1, "rgba(255,180,160,0)");
    ctx.fillStyle = sh; ctx.fillRect(0, 0, s, s);
  });

  const cutTex = canvasTex(64, (ctx, s) => {
    ctx.fillStyle = "#c83015"; ctx.beginPath(); ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2); ctx.fill();
    const seeds = Array.from({ length: 6 }, (_, i) => {
      const a = (i / 6) * Math.PI * 2;
      return { x: s / 2 + Math.cos(a) * s * 0.28, y: s / 2 + Math.sin(a) * s * 0.28 };
    });
    seeds.forEach(sd => {
      const g = ctx.createRadialGradient(sd.x, sd.y, 0, sd.x, sd.y, s * 0.11);
      g.addColorStop(0, "rgba(235,195,50,0.95)"); g.addColorStop(1, "rgba(210,165,30,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sd.x, sd.y, s * 0.11, 0, Math.PI * 2); ctx.fill();
    });
    // Juice sheen
    const juice = ctx.createRadialGradient(s * 0.4, s * 0.38, 0, s / 2, s / 2, s * 0.5);
    juice.addColorStop(0, "rgba(255,180,160,0.25)"); juice.addColorStop(1, "rgba(200,50,30,0)");
    ctx.fillStyle = juice; ctx.fillRect(0, 0, s, s);
  });

  const skin = new THREE.Mesh(
    new THREE.SphereGeometry(R, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.5),
    new THREE.MeshStandardMaterial({ map: skinTex, roughness: 0.22, metalness: 0.05, emissive: 0x200000, emissiveIntensity: 0.08 }),
  );
  skin.rotation.x = Math.PI;

  const cutFace = new THREE.Mesh(
    new THREE.CircleGeometry(R, 36),
    new THREE.MeshStandardMaterial({ map: cutTex, roughness: 0.45, transparent: true }),
  );
  cutFace.rotation.x = -Math.PI / 2; cutFace.position.y = 0.001;

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.009, 0.035, 6),
    solidMat(0x226010, 0.9),
  );
  stem.position.y = R + 0.012;

  group.add(cutFace); group.add(skin); group.add(stem);
  group.rotation.y = Math.random() * Math.PI * 2;
  return group;
}

// ─── CARAMELIZED ONION ────────────────────────────────────────────────────────
function makeCebolaCaramelizada() {
  const group = new THREE.Group();
  const numStrands = 4 + Math.floor(Math.random() * 4);

  for (let i = 0; i < numStrands; i++) {
    const pts = [];
    let x = (Math.random() - 0.5) * 0.2, z = (Math.random() - 0.5) * 0.2;
    for (let j = 0; j < 7; j++) {
      x += (Math.random() - 0.5) * 0.045;
      z += (Math.random() - 0.5) * 0.045;
      pts.push(new THREE.Vector3(x, 0.003 + i * 0.002, z));
    }
    const tex = canvasTex(32, (ctx, s) => {
      const g = ctx.createLinearGradient(0, 0, s, 0);
      g.addColorStop(0, "#a05808"); g.addColorStop(0.5, "#c87820"); g.addColorStop(1, "#8a4408");
      ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
      // Translucent sheen
      ctx.fillStyle = "rgba(255,200,80,0.2)"; ctx.fillRect(0, 0, s, s * 0.4);
    });
    group.add(new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 14, 0.013 + Math.random() * 0.005, 8),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.65, metalness: 0.02 }),
    ));
  }
  return group;
}

// ─── SHRIMP (CAMARÃO) ─────────────────────────────────────────────────────────
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

// ─── TUNA (ATUM) ──────────────────────────────────────────────────────────────
function makeAtum() {
  const group = new THREE.Group();
  const numFlakes = 2 + Math.floor(Math.random() * 3);

  for (let i = 0; i < numFlakes; i++) {
    const tex = canvasTex(64, (ctx, s) => {
      // Pale pink-beige base
      ctx.fillStyle = "#d8b8a8"; ctx.fillRect(0, 0, s, s);
      // Flake fiber lines
      for (let j = 0; j < 30; j++) {
        ctx.strokeStyle = `rgba(${180 + Math.random() * 30},${140 + Math.random() * 25},${120 + Math.random() * 20},${0.2 + Math.random() * 0.3})`;
        ctx.lineWidth = 0.5 + Math.random();
        const y = Math.random() * s;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s, y + (Math.random() - 0.5) * 8); ctx.stroke();
      }
      // Oil sheen
      const sh = ctx.createRadialGradient(s * 0.4, s * 0.35, 1, s / 2, s / 2, s * 0.55);
      sh.addColorStop(0, "rgba(255,240,225,0.3)"); sh.addColorStop(1, "rgba(230,200,180,0)");
      ctx.fillStyle = sh; ctx.fillRect(0, 0, s, s);
    });

    const geom = new THREE.SphereGeometry(0.065 + Math.random() * 0.04, 10, 7);
    geom.scale(1.7 + Math.random() * 0.5, 0.38 + Math.random() * 0.15, 1.0 + Math.random() * 0.5);

    // Break up edges for flaky look
    const pos = geom.attributes.position;
    for (let j = 0; j < pos.count; j++) {
      pos.setX(j, pos.getX(j) + (Math.random() - 0.5) * 0.008);
      pos.setY(j, pos.getY(j) + (Math.random() - 0.5) * 0.006);
      pos.setZ(j, pos.getZ(j) + (Math.random() - 0.5) * 0.008);
    }
    geom.computeVertexNormals();

    const flake = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.72 }));
    flake.position.set((Math.random() - 0.5) * 0.14, Math.random() * 0.022, (Math.random() - 0.5) * 0.14);
    flake.rotation.y = Math.random() * Math.PI * 2;
    group.add(flake);
  }
  return group;
}

// ─── FACTORY ─────────────────────────────────────────────────────────────────
export function createMeshForIngredient(ing) {
  let group;
  switch (ing.id) {
    case "pepperoni":       group = makePepperoni(); break;
    case "mushroom":
    case "cogumelos":       group = makeMushroom(); break;
    case "olive":
    case "azeitona":        group = makeOlive(); break;
    case "basil":
    case "manjericao":      group = makeBasil(); break;
    case "pineapple":
    case "ananas":          group = makeAnanas(); break;
    case "cebola":
    case "onion":           group = makeCebola(); break;
    case "frango":          group = makeFrango(); break;
    case "carne":
    case "beef":            group = makeCarneVaca(); break;
    case "pancetta":        group = makePancetta(); break;
    case "bacon":           group = makeBacon(); break;
    case "chourico":        group = makeChourico(); break;
    case "fiambre":         group = makeFiambre(); break;
    case "pimento":         group = makePimento(); break;
    case "tomate_cherry":
    case "cherry_tomato":   group = makeTomateCherry(); break;
    case "cebola_caramelizada": group = makeCebolaCaramelizada(); break;
    case "camarao":         group = makeCamarao(); break;
    case "atum":            group = makeAtum(); break;
    default:
      group = new THREE.Group();
      group.add(new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.1, 1),
        new THREE.MeshStandardMaterial({ color: ing.color ?? 0xaaaaaa }),
      ));
  }
  group.rotation.y = Math.random() * Math.PI * 2;
  group.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
  return group;
}