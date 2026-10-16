// Dungeon floors: room-slot layout (Isaac / Gungeon style), tile map, collision and the merged floor / wall meshes.
// 1 world unit = 1 tile, +y = north. Tiles: 0 void, 1 floor, 2 wall, 3 prop (crate / barrel, solid, drawn as an entity)
(function () {
  const SW = 26, SH = 22, GN = 7; // slot size, slots per side
  const VOID = 0, FLOOR = 1, WALL = 2, PROP = 3;

  function rngOf(seed) {
    let s = seed >>> 0 || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }

  // ── generation ──────────────────────────────────────────
  function generate(fi, seed) {
    const F = DATA.FLOORS[fi], rnd = rngOf(seed);
    const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
    const W = SW * GN, H = SH * GN;
    const tiles = new Uint8Array(W * H), roomOf = new Int16Array(W * H).fill(-1);
    const slots = new Map(); // "gx,gy" -> room
    const rooms = [], edges = [];
    const key = (x, y) => x + ',' + y;
    const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const total = F.rooms + 3; // + treasure, shop, boss
    const start = { gx: 3, gy: 3, parent: null, depth: 0 };
    slots.set(key(3, 3), start);
    const list = [start];
    let guard = 0;
    while (list.length < total && guard++ < 5000) {
      const base = list[Math.floor(rnd() * list.length)];
      const [dx, dy] = N4[Math.floor(rnd() * 4)];
      const gx = base.gx + dx, gy = base.gy + dy;
      if (gx < 0 || gy < 0 || gx >= GN || gy >= GN || slots.has(key(gx, gy))) continue;
      // avoid blobs: a new slot touches only its parent
      const nb = N4.filter(([a, b]) => slots.has(key(gx + a, gy + b))).length;
      if (nb > 1 && rnd() < 0.85) continue;
      const r = { gx, gy, parent: base, depth: base.depth + 1 };
      slots.set(key(gx, gy), r); list.push(r);
      edges.push([base, r]);
    }
    // special rooms: boss = deepest leaf, then treasure / shop among the other leaves (or deep rooms)
    const deg = (r) => edges.filter((e) => e[0] === r || e[1] === r).length;
    const leaves = list.filter((r) => r !== start && deg(r) === 1).sort((a, b) => b.depth - a.depth);
    const pick = (pool) => pool.find((r) => !r.type);
    const boss = leaves[0] || list[list.length - 1]; boss.type = 'boss';
    const tre = pick(leaves) || pick(list.slice().reverse().filter((r) => r !== start)); if (tre) tre.type = 'treasure';
    const shop = pick(leaves) || pick(list.filter((r) => r !== start && r.depth >= 1)); if (shop) shop.type = 'shop';
    start.type = 'start';
    list.forEach((r) => { if (!r.type) r.type = 'combat'; });
    // a second treasure room on bigger floors when a spare leaf exists
    if (fi >= 1) { const t2 = leaves.find((r) => r.type === 'combat' && r.depth >= 2); if (t2) t2.type = 'treasure'; }
    // a challenge room: survive 30 s of reinforcements for a better chest
    { const ch = list.filter((r) => r.type === 'combat' && r.depth >= 2).length ? list.filter((r) => r.type === 'combat' && r.depth >= 2) : list.filter((r) => r.type === 'combat' && r.depth >= 1); if (ch.length) ch[Math.floor(rnd() * ch.length)].challenge = true; }
    // one loop (not through the boss) for route choice
    for (let i = 0; i < 40; i++) {
      const a = list[Math.floor(rnd() * list.length)];
      const [dx, dy] = N4[Math.floor(rnd() * 4)];
      const b = slots.get(key(a.gx + dx, a.gy + dy));
      if (!b || a.type === 'boss' || b.type === 'boss' || a.type === 'treasure' || b.type === 'treasure') continue;
      if (edges.some((e) => (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a))) continue;
      edges.push([a, b]); break;
    }

    // room rectangles (interior floor [x0, x1) x [y0, y1))
    const SIZE = { start: [13, 10], treasure: [11, 9], shop: [17, 10], boss: [22, 16] };
    list.forEach((r, id) => {
      let [w, h] = SIZE[r.type] || [ri(14, 20), ri(10, 14)];
      if (r.type === 'combat' && rnd() < 0.25) { w = ri(11, 13); h = ri(9, 11); } // small skirmish rooms
      const cx = r.gx * SW + Math.floor(SW / 2) + ri(-1, 1), cy = r.gy * SH + Math.floor(SH / 2) - 1 + ri(-1, 0);
      Object.assign(r, { id, w, h, x0: cx - Math.floor(w / 2), y0: cy - Math.floor(h / 2) });
      r.x1 = r.x0 + w; r.y1 = r.y0 + h;
      r.cx = (r.x0 + r.x1) / 2; r.cy = (r.y0 + r.y1) / 2;
      r.doors = []; r.visited = false; r.seen = true; r.known = r.type === 'start'; r.cleared = r.type !== 'combat' && r.type !== 'boss'; // the floor itself is visible (no fog); the minimap still reveals rooms as you explore
      rooms.push(r);
      for (let y = r.y0; y < r.y1; y++) for (let x = r.x0; x < r.x1; x++) { tiles[y * W + x] = FLOOR; roomOf[y * W + x] = id; }
    });
    // corridors (3 wide) between linked rooms; the corridor tiles touching a room are its door
    const doors = [];
    edges.forEach(([a, b]) => {
      if (a.gx > b.gx || a.gy > b.gy) [a, b] = [b, a];
      const horiz = a.gy === b.gy;
      let tilesC = [], da = [], db = [];
      if (horiz) {
        const lo = Math.max(a.y0, b.y0) + 1, hi = Math.min(a.y1, b.y1) - 2;
        const cy = Math.round((lo + hi) / 2);
        for (let x = a.x1; x < b.x0; x++) for (let y = cy - 1; y <= cy + 1; y++) tilesC.push([x, y]);
        for (let y = cy - 1; y <= cy + 1; y++) { da.push([a.x1, y]); db.push([b.x0 - 1, y]); }
      } else {
        const lo = Math.max(a.x0, b.x0) + 1, hi = Math.min(a.x1, b.x1) - 2;
        const cx = Math.round((lo + hi) / 2);
        for (let y = a.y1; y < b.y0; y++) for (let x = cx - 1; x <= cx + 1; x++) tilesC.push([x, y]);
        for (let x = cx - 1; x <= cx + 1; x++) { da.push([x, a.y1]); db.push([x, b.y0 - 1]); }
      }
      tilesC.forEach(([x, y]) => { tiles[y * W + x] = FLOOR; });
      const mk = (room, t, side) => {
        const d = { room: room.id, tiles: t, horiz, side, closed: false, other: room === a ? b.id : a.id };
        doors.push(d); room.doors.push(d);
      };
      mk(a, da, horiz ? 'e' : 'n'); mk(b, db, horiz ? 'w' : 's');
    });

    // walls: every non-floor tile next to floor; north walls are 2 tiles of face + a cap row
    const isF = (x, y) => x >= 0 && y >= 0 && x < W && y < H && tiles[y * W + x] === FLOOR;
    for (let y = 1; y < H - 4; y++) for (let x = 1; x < W - 1; x++) {
      if (tiles[y * W + x] !== FLOOR) continue;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const i = (y + dy) * W + x + dx;
        if (tiles[i] === VOID) tiles[i] = WALL;
      }
      if (tiles[(y + 1) * W + x] === WALL) {
        for (let k = 2; k <= 3; k++) { const i = (y + k) * W + x; if (tiles[i] === VOID) tiles[i] = WALL; }
        for (let k = 2; k <= 3; k++) for (const dx of [-1, 1]) { const i = (y + k) * W + x + dx; if (tiles[i] === VOID) tiles[i] = WALL; }
      }
    }

    const props = [];
    // room layouts: steel cover blocks (indestructible, stop bullets both ways) in set patterns, so rooms play differently.
    // Offsets are from the room centre; blocks stay >= 2 tiles from the walls and off the door lanes, so every room stays connected.
    const LAYOUTS = {
      pillars: (w, h) => { const ax = Math.floor(w / 4), ay = Math.floor(h / 4); return [[-ax, -ay, 2, 2], [ax - 1, -ay, 2, 2], [-ax, ay - 1, 2, 2], [ax - 1, ay - 1, 2, 2]]; },
      cover: (w, h) => { const ax = Math.floor(w / 4); return [[-ax - 1, -1, 3, 1], [ax - 1, -1, 3, 1], [-1, Math.floor(h / 4), 3, 1]]; },
      diamond: (w, h) => { const ax = Math.floor(w / 3), ay = Math.floor(h / 3); return [[-1, ay, 2, 1], [-1, -ay, 2, 1], [-ax, 0, 1, 2], [ax, 0, 1, 2]]; },
      lanes: (w) => { const ax = Math.floor(w / 5); return [[-ax * 2, -1, 1, 2], [-ax, 1, 1, 2], [ax, -2, 1, 2], [ax * 2 - 1, 0, 1, 2]]; }, // short posts (tall bars trapped walkers)
      ring: (w, h) => { const ax = Math.floor(w / 4), ay = Math.floor(h / 4); return [[-ax, 0, 1, 1], [ax, 0, 1, 1], [0, ay, 1, 1], [0, -ay, 1, 1], [-ax + 1, ay - 1, 1, 1], [ax - 1, ay - 1, 1, 1], [-ax + 1, -ay + 1, 1, 1], [ax - 1, -ay + 1, 1, 1]]; },
      zigzag: (w, h) => { const ax = Math.floor(w / 4), ay = Math.floor(h / 4); return [[-ax - 1, ay - 1, 3, 1], [-1, 1, 1, 1], [ax - 1, -ay, 3, 1], [ax, ay - 1, 1, 2], [-ax, -ay, 1, 2]]; },
      bunker: (w, h) => { const ax = Math.floor(w / 3), ay = Math.floor(h / 3); return [[-ax, ay - 1, 2, 1], [ax - 1, ay - 1, 2, 1], [-ax, -ay, 2, 1], [ax - 1, -ay, 2, 1], [-ax, -ay + 1, 1, 1], [ax, ay - 2, 1, 1]]; },
      corners: (w, h) => { const ax = Math.floor(w / 2) - 4, ay = Math.floor(h / 2) - 4; return [[-ax - 1, -ay - 1, 2, 2], [ax, -ay - 1, 2, 2], [-ax - 1, ay, 2, 2], [ax, ay, 2, 2]]; },
    };
    const LKEYS = Object.keys(LAYOUTS);
    const freeLane = (r, x, y) => !r.doors.some((d) => d.tiles.some(([dx, dy]) => Math.abs(dx - x) < 3 && Math.abs(dy - y) < 3));
    rooms.forEach((r) => {
      if (r.w < 12 || r.h < 9) return;
      let lay = null;
      if (r.type === 'combat' && rnd() < 0.6) lay = LKEYS[Math.floor(rnd() * LKEYS.length)];
      else if (r.type === 'boss') lay = 'corners';
      if (!lay) return;
      r.layout = lay;
      const ccx = Math.floor(r.cx), ccy = Math.floor(r.cy);
      LAYOUTS[lay](r.w, r.h).forEach(([ox, oy, bw, bh]) => {
        for (let yy = ccy + oy; yy < ccy + oy + bh; yy++) for (let xx = ccx + ox; xx < ccx + ox + bw; xx++) {
          if (xx < r.x0 + 2 || xx >= r.x1 - 2 || yy < r.y0 + 2 || yy >= r.y1 - 2) continue;
          if (tiles[yy * W + xx] !== FLOOR || !freeLane(r, xx, yy)) continue;
          tiles[yy * W + xx] = PROP;
          props.push({ x: xx, y: yy, kind: 'pillar', hp: 1e9, room: r.id });
        }
      });
    });
    // props: crate clusters / explosive barrels in combat rooms (never on the door lanes or the centre)
    rooms.forEach((r) => {
      if (r.type !== 'combat' && r.type !== 'boss') return;
      const n = r.type === 'boss' ? 4 : ri(1, 4);
      for (let k = 0; k < n; k++) {
        const pw = ri(1, 2), ph = ri(1, 2);
        let x, y, ok = false;
        for (let t = 0; t < 30 && !ok; t++) {
          x = ri(r.x0 + 2, r.x1 - 2 - pw); y = ri(r.y0 + 2, r.y1 - 2 - ph);
          ok = Math.abs(x + pw / 2 - r.cx) + Math.abs(y + ph / 2 - r.cy) > 3.5;
          for (let yy = y - 1; yy <= y + ph && ok; yy++) for (let xx = x - 1; xx <= x + pw && ok; xx++) if (tiles[yy * W + xx] !== FLOOR) ok = false;
          // keep door lanes free
          r.doors.forEach((d) => d.tiles.forEach(([dx, dy]) => { if (Math.abs(dx - x) < 4 && Math.abs(dy - y) < 4) ok = false; }));
        }
        if (!ok) continue;
        const barrel = r.type === 'combat' && rnd() < 0.35;
        for (let yy = y; yy < y + ph; yy++) for (let xx = x; xx < x + pw; xx++) {
          if (barrel && (xx !== x || yy !== y)) continue;
          tiles[yy * W + xx] = PROP;
          props.push({ x: xx, y: yy, kind: barrel ? 'barrel' : 'crate', hp: barrel ? 8 : 18, room: r.id });
        }
      }
    });
    return { fi, W, H, tiles, roomOf, rooms, doors, props, start: rooms[start.id], seed };
  }

  // ── queries ─────────────────────────────────────────────
  let LV = null;
  function tile(x, y) {
    x = Math.floor(x); y = Math.floor(y);
    if (!LV || x < 0 || y < 0 || x >= LV.W || y >= LV.H) return VOID;
    return LV.tiles[y * LV.W + x];
  }
  function blockedT(x, y) {
    const t = tile(x, y);
    if (t !== FLOOR) return true;
    return LV.closed && LV.closed.has(Math.floor(y) * LV.W + Math.floor(x));
  }
  // circle vs tiles; returns true when the circle at (x, y) overlaps a solid tile
  function hitCircle(x, y, r) {
    const x0 = Math.floor(x - r), x1 = Math.floor(x + r), y0 = Math.floor(y - r), y1 = Math.floor(y + r);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      if (!blockedT(tx, ty)) continue;
      const nx = Math.max(tx, Math.min(x, tx + 1)), ny = Math.max(ty, Math.min(y, ty + 1));
      if ((nx - x) * (nx - x) + (ny - y) * (ny - y) < r * r) return true;
    }
    return false;
  }
  // move a circle with wall sliding (axis separated, sub-stepped)
  function move(e, dx, dy) {
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 0.2));
    const sx = dx / steps, sy = dy / steps;
    let hx = false, hy = false;
    // already overlapping something (a door closed on the circle's edge): let it walk out as long as its centre stays on open floor
    if (hitCircle(e.x, e.y, e.r)) {
      const nx = e.x + dx, ny = e.y + dy;
      if (!blockedT(Math.floor(nx), Math.floor(ny))) { e.x = nx; e.y = ny; return false; }
    }
    for (let i = 0; i < steps; i++) {
      if (!hitCircle(e.x + sx, e.y, e.r)) e.x += sx; else hx = true;
      if (!hitCircle(e.x, e.y + sy, e.r)) e.y += sy; else hy = true;
    }
    return hx || hy;
  }
  // line of sight between two points (tile DDA)
  function los(x0, y0, x1, y1) {
    const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d / 0.25);
    for (let i = 1; i < n; i++) {
      const f = i / n, t = tile(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f);
      if (t === WALL || t === VOID || t === PROP) return false; // crates and steel cover block sight (enemies flank instead of shooting the cover)
    }
    return true;
  }
  function roomAt(x, y) {
    x = Math.floor(x); y = Math.floor(y);
    if (!LV || x < 0 || y < 0 || x >= LV.W || y >= LV.H) return null;
    const id = LV.roomOf[y * LV.W + x];
    return id >= 0 ? LV.rooms[id] : null;
  }
  function setDoors(room, closed) {
    if (!LV.closed) LV.closed = new Set();
    room.doors.forEach((d) => {
      d.closed = closed;
      d.tiles.forEach(([x, y]) => { const i = y * LV.W + x; if (closed) LV.closed.add(i); else LV.closed.delete(i); });
      if (d.mesh) d.mesh.visible = closed;
    });
  }

  // ── meshes ─────────────────────────────────────────────
  const texCache = {};
  function loadTex(name) {
    if (texCache[name]) return texCache[name];
    const file = 'assets/tiles/' + name + '.webp';
    let t;
    if (window.PACKED && PACKED.on && /^https?:$/.test(location.protocol)) {
      // the deployed build ships the tiles scrambled: restored to pixels in a canvas, no image URL for the dev tools
      t = new THREE.Texture();
      PACKED.bitmap(file).then((bm) => (bm ? PACKED.toCanvas(bm, 1) : PACKED.url(file).then((u) => new Promise((res) => { const im = new Image(); im.onload = () => { URL.revokeObjectURL(u); res(im); }; im.onerror = () => res(null); im.src = u; }))))
        .then((src) => { if (src) { t.image = src; t.needsUpdate = true; } }).catch(() => {});
    } else t = new THREE.TextureLoader().load(file);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    texCache[name] = t;
    return t;
  }
  function gradTex(kind) {
    const k = 'grad_' + kind;
    if (texCache[k]) return texCache[k];
    const cv = document.createElement('canvas');
    cv.width = 4; cv.height = 64;
    const g = cv.getContext('2d');
    const gr = g.createLinearGradient(0, 64, 0, 0);
    if (kind === 'ao') { gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.75)'); }
    else { gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); }
    g.fillStyle = gr; g.fillRect(0, 0, 4, 64);
    const t = new THREE.CanvasTexture(cv);
    texCache[k] = t;
    return t;
  }

  // quad builder: q(x0, y0, x1, y1, u0, v0, u1, v1[, rotated uv])
  function builder() {
    const pos = [], uv = [], idx = [];
    return {
      q(x0, y0, x1, y1, u0, v0, u1, v1, rot) {
        const n = pos.length / 3;
        pos.push(x0, y0, 0, x1, y0, 0, x1, y1, 0, x0, y1, 0);
        if (rot) uv.push(u0, v1, u0, v0, u1, v0, u1, v1);
        else uv.push(u0, v0, u1, v0, u1, v1, u0, v1);
        idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
      },
      mesh(mat, order) {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
        g.setIndex(idx);
        const m = new THREE.Mesh(g, mat);
        m.renderOrder = order; m.frustumCulled = false;
        return m;
      },
      get n() { return pos.length; },
    };
  }

  function buildMeshes(lv, scene) {
    const F = DATA.FLOORS[lv.fi];
    const group = new THREE.Group();
    const W = lv.W, T = lv.tiles;
    const t = (x, y) => (x < 0 || y < 0 || x >= W || y >= lv.H ? VOID : T[y * W + x]);
    const tint = new THREE.Color(F.tint[0], F.tint[1], F.tint[2]);
    const basic = (tex, color, extra) => new THREE.MeshBasicMaterial(Object.assign({ map: tex, color, depthTest: false, depthWrite: false, transparent: true }, extra || {}));

    // floors: rooms use the floor's plate (boss / shop / treasure the alternate one), corridors the grating
    const fl = { main: builder(), alt: builder(), cor: builder() };
    const rep = { main: 2, alt: 2, cor: 2 };
    for (let y = 0; y < lv.H; y++) for (let x = 0; x < W; x++) {
      const v = T[y * W + x];
      if (v !== FLOOR && v !== PROP) continue;
      const rid = lv.roomOf[y * W + x], room = rid >= 0 ? lv.rooms[rid] : null;
      const k = !room ? 'cor' : (room.type === 'combat' && room.id % 3 === 2) ? 'alt' : room.type === 'combat' || room.type === 'start' ? 'main' : 'alt';
      const s = rep[k];
      fl[k].q(x, y, x + 1, y + 1, x / s, y / s, (x + 1) / s, (y + 1) / s);
    }
    const ftex = { main: loadTex(F.floor), alt: loadTex(F.alt), cor: loadTex('floor_grate') };
    const fcol = { main: tint.clone().multiplyScalar(0.62), alt: tint.clone().multiplyScalar(0.6), cor: tint.clone().multiplyScalar(0.5) };
    Object.keys(fl).forEach((k) => group.add(fl[k].mesh(basic(ftex[k], fcol[k], { transparent: false }), 0)));

    // decals: hazard bands across door lanes
    const dec = builder();
    lv.doors.forEach((d) => {
      const xs = d.tiles.map((p) => p[0]), ys = d.tiles.map((p) => p[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs) + 1, y0 = Math.min(...ys), y1 = Math.max(...ys) + 1;
      if (d.horiz) dec.q(x0 + 0.3, y0, x1 - 0.3, y1, 0, 0, (y1 - y0) / 3, 1, true);
      else dec.q(x0, y0 + 0.3, x1, y1 - 0.3, 0, 0, (x1 - x0) / 3, 1);
    });
    group.add(dec.mesh(basic(loadTex('deco_hazard'), tint.clone().multiplyScalar(0.7), { opacity: 0.85 }), 0.2));

    // floor dressing from the same pack: vent fans (blue lit), steel plates, lane stripes
    const rnd = rngOf((lv.seed ^ 0x9e3779b9) >>> 0);
    const vent = builder(), plate = builder(), lane = builder();
    const freeArea = (x, y, w, h) => { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (T[yy * W + xx] !== FLOOR) return false; return true; };
    lv.rooms.forEach((r) => {
      const n = r.type === 'boss' ? 4 : r.type === 'combat' ? 1 + Math.floor(rnd() * 3) : 1;
      for (let i = 0; i < n; i++) {
        for (let t = 0; t < 12; t++) {
          const x = r.x0 + 1 + Math.floor(rnd() * (r.w - 3)), y = r.y0 + 1 + Math.floor(rnd() * (r.h - 3));
          if (!freeArea(x, y, 2, 2)) continue;
          if (r.type !== 'combat' && Math.abs(x + 1 - r.cx) < 3.5 && Math.abs(y + 1 - r.cy) < 3) continue;
          (rnd() < 0.55 ? vent : plate).q(x, y, x + 2, y + 2, 0, 0, 1, 1);
          break;
        }
      }
      if (r.type === 'combat' && rnd() < 0.6) {
        const y = rnd() < 0.5 ? r.y0 + 1 : r.y1 - 2;
        lane.q(r.x0 + 2, y + 0.3, r.x1 - 2, y + 0.7, 0, 0, (r.w - 4) / 4, 1);
      }
      if (r.type === 'boss') {
        lane.q(r.x0 + 1, r.y0 + 1.2, r.x1 - 1, r.y0 + 1.6, 0, 0, (r.w - 2) / 4, 1);
        lane.q(r.x0 + 1, r.y1 - 1.6, r.x1 - 1, r.y1 - 1.2, 0, 0, (r.w - 2) / 4, 1);
      }
    });
    group.add(vent.mesh(basic(loadTex('prop_fan'), tint.clone().multiplyScalar(0.8), { opacity: 0.92 }), 0.25));
    group.add(plate.mesh(basic(loadTex('prop_plate'), tint.clone().multiplyScalar(0.55), { opacity: 0.85 }), 0.25));
    group.add(lane.mesh(basic(loadTex('deco_lane'), tint.clone().multiplyScalar(0.45), { opacity: 0.6 }), 0.25));

    // floor shading: dark band under north faces, softer along side / south walls
    const ao = builder(), aoS = builder();
    for (let y = 0; y < lv.H; y++) for (let x = 0; x < W; x++) {
      const v = T[y * W + x];
      if (v !== FLOOR && v !== PROP) continue;
      if (t(x, y + 1) === WALL) ao.q(x, y, x + 1, y + 1, 0, 0, 1, 1);
      if (t(x - 1, y) === WALL) aoS.q(x, y, x + 0.5, y + 1, 0, 1, 1, 0, true);
      if (t(x + 1, y) === WALL) aoS.q(x + 0.5, y, x + 1, y + 1, 0, 0, 1, 1, true);
    }
    group.add(ao.mesh(basic(gradTex('ao'), 0xffffff, { opacity: 0.9 }), 0.4));
    group.add(aoS.mesh(basic(gradTex('ao'), 0xffffff, { opacity: 0.55 }), 0.4));

    // walls: faces (2 tiles tall, the art spans 2 x 2) and caps
    const face = builder(), cap = builder(), trim = builder(), edge = builder();
    for (let y = 0; y < lv.H; y++) for (let x = 0; x < W; x++) {
      if (T[y * W + x] !== WALL) continue;
      const s = t(x, y - 1), s2 = t(x, y - 2);
      const f1 = s === FLOOR || s === PROP;
      const f2 = !f1 && s === WALL && (s2 === FLOOR || s2 === PROP);
      if (f1 || f2) {
        const v0 = f1 ? 0 : 0.5;
        face.q(x, y, x + 1, y + 1, x / 2, v0, (x + 1) / 2, v0 + 0.5);
        if (f2) trim.q(x, y + 0.92, x + 1, y + 1.08, 0, 0, 1, 1);
      } else {
        cap.q(x, y, x + 1, y + 1, x / 2, y / 2, (x + 1) / 2, (y + 1) / 2);
        // lit rim where a cap meets floor (south / side walls)
        const nb = (a, b) => { const v = t(a, b); return v === FLOOR || v === PROP; };
        if (nb(x, y - 1)) trim.q(x, y - 0.06, x + 1, y + 0.08, 0, 0, 1, 1);
        if (nb(x - 1, y)) edge.q(x - 0.06, y, x + 0.08, y + 1, 0, 0, 1, 1, true);
        if (nb(x + 1, y)) edge.q(x + 0.92, y, x + 1.06, y + 1, 0, 0, 1, 1, true);
      }
    }
    group.add(face.mesh(basic(loadTex(F.face), tint.clone().multiplyScalar(0.95), { transparent: false }), 1));
    const fsh = builder();
    for (let y = 0; y < lv.H; y++) for (let x = 0; x < W; x++) {
      if (T[y * W + x] !== WALL) continue;
      const s0 = t(x, y - 1);
      if (s0 === FLOOR || s0 === PROP) fsh.q(x, y, x + 1, y + 2, 0, 0, 1, 1);
    }
    group.add(fsh.mesh(basic(gradTex('ao'), 0xffffff, { opacity: 0.55 }), 1.1));
    group.add(cap.mesh(basic(loadTex(F.cap || 'wall_cap'), tint.clone().multiplyScalar(0.55), { transparent: false }), 1));
    const glow = new THREE.Color(F.light);
    group.add(trim.mesh(basic(gradTex('line'), glow, { blending: THREE.AdditiveBlending, opacity: 0.75 }), 1.5));
    group.add(edge.mesh(basic(gradTex('line'), glow, { blending: THREE.AdditiveBlending, opacity: 0.45 }), 1.5));

    // door barriers (shown while a room is locked)
    lv.doors.forEach((d) => {
      const xs = d.tiles.map((p) => p[0]), ys = d.tiles.map((p) => p[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs) + 1, y0 = Math.min(...ys), y1 = Math.max(...ys) + 1;
      const b = builder();
      // a barrier line on the room side of the door tiles (+ a soft wide glow)
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      if (d.horiz) { b.q(cx - 0.18, y0, cx + 0.18, y1, 0, 0, 1, 1, true); b.q(cx - 0.6, y0, cx + 0.6, y1, 0, 0, 1, 1, true); }
      else { b.q(x0, cy - 0.18, x1, cy + 0.18, 0, 0, 1, 1); b.q(x0, cy - 0.6, x1, cy + 0.6, 0, 0, 1, 1); }
      d.mesh = b.mesh(basic(gradTex('line'), 0xff3a3a, { blending: THREE.AdditiveBlending, opacity: 0.95 }), 2);
      d.mesh.visible = false;
      d.cx = cx; d.cy = cy;
      group.add(d.mesh);
    });

    // fog over rooms not yet seen (fades out on entry)
    lv.rooms.forEach((r) => {
      if (r.seen) return; // every room is generated seen (no fog in this game): don't build planes that never show
      const g = new THREE.PlaneGeometry(r.w + 2.4, r.h + 4.4);
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x020305, transparent: true, opacity: r.seen ? 0 : 0.94, depthTest: false, depthWrite: false }));
      m.position.set(r.cx, r.cy + 1, 0);
      m.renderOrder = 9;
      m.visible = !r.seen;
      r.fog = m;
      group.add(m);
    });

    group.updateMatrixWorld(true);
    group.traverse((o) => { o.matrixAutoUpdate = false; });
    scene.add(group);
    lv.group = group;
    return group;
  }

  function dispose(lv) {
    if (!lv || !lv.group) return;
    lv.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    lv.group.parent && lv.group.parent.remove(lv.group);
  }

  window.LEVEL = {
    VOID, FLOOR, WALL, PROP, generate, buildMeshes, dispose, tile, blockedT, hitCircle, move, los, roomAt, setDoors, loadTex, rngOf,
    set(lv) { LV = lv; }, get cur() { return LV; },
  };
})();
