// LAST ORIGIN: ROGUE OPERATION — Enter-the-Gungeon style bullet-hell dungeon crawler.
// Heroes are the original SD cut-out rigs with their arms removed; the hand that holds the gun floats beside the body.
(function () {
  const { RANKS, HEROES, GUNS, ITEMS, ENEMIES, ELITES, BOSSES, FLOORS, BAL, SYNERGY, UNLOCK, PERKS } = DATA;
  const L = FX.L, rnd = FX.rnd;
  const TAU = Math.PI * 2;
  const QS = new URLSearchParams(location.search), GOD = QS.get('god') === '1', TSCALE = +(QS.get('speed') || 1);
  const TEST = QS.get('bot') === '1' || QS.get('sim') === '1'; // automated runs don't write progress
  const MOBILE = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform))
    || (matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) <= 820); // touch-first small screens, whatever the UA says
  const HERO_H = 1.75; // hero height in tiles
  const ORD = (y) => 10 + (400 - y) * 0.005; // y-sorted draw order for everything standing on the floor
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const pickW = (arr, w) => { let s = 0; w.forEach((x) => { s += x; }); let r = Math.random() * s; for (let i = 0; i < arr.length; i++) { r -= w[i]; if (r <= 0) return arr[i]; } return arr[arr.length - 1]; };
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  let renderer, scene, camera, composer, bloom, stageEl;
  const images = {}, uiImg = {};
  const view = { w: 1, h: 1, vw: 16, vh: 10, cx: 0, cy: 0 };
  const G = {
    phase: 'boot', paused: false, fi: 0, lv: null, room: null, P: null, enemies: [], pbul: [], ebul: [], pickups: [], props: [], objs: [], hazards: [],
    statics: [], thrown: [], vents: [], timeScale: 1, slowT: 0, t: 0, stats: null, heroIdx: 0, seed: 0, banner: null, bossE: null,
    // touch screens start with the aim assist on (twin-stick on glass is hard); tbSize / tbAlpha: touch button size (0 / 0.5 / 1) and opacity
    opt: { touchAssistSet: false, shake: !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches), dmg: true, sfx: 1, bgm: 1, voice: 1, master: 1, aimAssist: false, aimAssistT: true, camLook: true, flash: !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches), muted: false, hints: true, autoFire: false, cbBullets: false, hudScale: 1, tbSize: 0.5, tbAlpha: 1, lefty: false },
  };
  try {
    // only known keys of the right type survive (a hand-edited or old save can't feed NaN into the mixer)
    const saved = JSON.parse(localStorage.getItem('lao_rogue_opt') || '{}');
    if (saved && typeof saved === 'object') {
      for (const k of Object.keys(G.opt)) {
        const d = G.opt[k], v = saved[k];
        if (typeof d === 'boolean' && typeof v === 'boolean') G.opt[k] = v;
        else if (typeof d === 'number' && typeof v === 'number' && Number.isFinite(v)) G.opt[k] = k === 'hudScale' ? clamp(v, 0.8, 1.3) : clamp(v, 0, 1);
      }
    }
  } catch (e) { /* ignore */ }
  // the first time this profile runs on a touch screen, the aim assist turns on (a desktop save had it off); the player can still switch it off
  /* aim assist is stored per input kind: aimAssistT (touch, on by default) and aimAssist (mouse / pad), so a hybrid device never carries one into the other */
  const assistOn = () => (window.INPUT && INPUT.isTouch ? G.opt.aimAssistT : G.opt.aimAssist);
  const saveOpt = () => { try { localStorage.setItem('lao_rogue_opt', JSON.stringify(G.opt)); } catch (e) { /* ignore */ } };

  // ── textures ─────────────────────────────────────────────
  function loadImg(src) { return new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; }); }
  async function loadImages(progress) {
    const keys = Object.keys(window.IMG);
    let done = 0;
    await Promise.all(keys.map(async (k) => { images[k] = await loadImg(window.IMG[k]); done++; progress(done / keys.length); }));
    const ui = ['i_gear', 'i_tuna', 'rank0', 'rank1', 'rank2', 'rank3', 'rankb0', 'rankb1', 'rankb2', 'rankb3', 'hex_y', 'hex_g', 'i_lock', 'i_question', 'circle', 'ring', ...ITEMS.map((i) => i.icon)];
    const cs = getComputedStyle(document.documentElement);
    await Promise.all([...new Set(ui)].map(async (k) => {
      const m = /url\(["']?([^"')]+)["']?\)/.exec(cs.getPropertyValue('--s-' + k));
      if (m) uiImg[k] = await loadImg(m[1]);
    }));
    // items sharing a base icon get a colour-tinted copy of it (its own CSS variable and texture), so every item reads apart
    const root = document.documentElement.style;
    ITEMS.forEach((it) => {
      const im = it.hue && uiImg[it.icon];
      if (!im) return;
      try {
        const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
        const g = c.getContext('2d'); g.drawImage(im, 0, 0);
        const px = g.getImageData(0, 0, c.width, c.height), d = px.data;
        /* the base glyphs are white: the copy is tinted with the item's own colour (hue at 85% sat / 68% light), so they read apart even in grayscale-ish UI */
        const tc = new THREE.Color().setHSL(it.hue / 360, 0.85, 0.68), tr = tc.r, tg = tc.g, tb = tc.b;
        for (let i = 0; i < d.length; i += 4) { d[i] *= tr; d[i + 1] *= tg; d[i + 2] *= tb; }
        g.putImageData(px, 0, 0);
        const key = 'iv_' + it.id;
        uiImg[key] = c;
        root.setProperty('--s-' + key, `url(${c.toDataURL('image/png')})`);
        it.icon = key;
      } catch (e) { /* keep the shared icon */ }
    });
  }
  const texCache = {};
  function canvasTex(key, w, h, draw) {
    if (texCache[key]) return texCache[key];
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    draw(cv.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(cv); t.minFilter = THREE.LinearFilter;
    texCache[key] = t;
    return t;
  }
  function heartPath(g, x, y, s) {
    g.beginPath();
    g.moveTo(x, y + s * 0.3);
    g.bezierCurveTo(x, y, x - s * 0.5, y - s * 0.1, x - s * 0.5, y + s * 0.25);
    g.bezierCurveTo(x - s * 0.5, y + s * 0.55, x - s * 0.1, y + s * 0.7, x, y + s * 0.9);
    g.bezierCurveTo(x + s * 0.1, y + s * 0.7, x + s * 0.5, y + s * 0.55, x + s * 0.5, y + s * 0.25);
    g.bezierCurveTo(x + s * 0.5, y - s * 0.1, x, y, x, y + s * 0.3);
  }
  function pickupTex(kind) {
    return canvasTex('pk_' + kind, 128, 128, (g) => {
      g.translate(64, 64);
      g.shadowColor = 'rgba(0,0,0,0.7)'; g.shadowBlur = 8; g.shadowOffsetY = 4;
      if (kind === 'heart' || kind === 'half') {
        g.translate(0, -44);
        heartPath(g, 0, 0, 92);
        g.fillStyle = '#ff2f4f'; g.fill(); g.lineWidth = 7; g.strokeStyle = '#2a0008'; g.stroke();
        if (kind === 'half') { g.save(); g.clip(); g.fillStyle = 'rgba(30,0,6,0.85)'; g.fillRect(0, -10, 60, 120); g.restore(); }
        g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.ellipse(-20, 24, 9, 13, -0.5, 0, TAU); g.fill();
      } else if (kind === 'armor') {
        g.beginPath(); g.moveTo(0, -46); g.lineTo(40, -30); g.lineTo(34, 18); g.lineTo(0, 48); g.lineTo(-34, 18); g.lineTo(-40, -30); g.closePath();
        g.fillStyle = '#2bc4ff'; g.fill(); g.lineWidth = 7; g.strokeStyle = '#002438'; g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(-6, -30, 12, 52);
      } else if (kind === 'key') {
        g.rotate(-0.6); g.lineWidth = 12; g.strokeStyle = '#ffcc00';
        g.beginPath(); g.arc(-22, 0, 18, 0, TAU); g.stroke();
        g.fillStyle = '#ffcc00'; g.fillRect(-4, -6, 58, 12); g.fillRect(34, 4, 9, 18); g.fillRect(48, 4, 8, 13);
      } else if (kind === 'ammo') {
        g.fillStyle = '#4a5a3a'; g.fillRect(-42, -26, 84, 58); g.strokeStyle = '#141a10'; g.lineWidth = 6; g.strokeRect(-42, -26, 84, 58);
        g.fillStyle = '#ffcc00'; for (let i = 0; i < 4; i++) { g.fillRect(-32 + i * 18, -44, 11, 26); g.beginPath(); g.arc(-26.5 + i * 18, -44, 5.5, Math.PI, 0); g.fill(); }
        g.fillStyle = '#e8e8e8'; g.font = 'bold 22px Exo2, sans-serif'; g.textAlign = 'center'; g.fillText('AMMO', 0, 14);
      } else if (kind === 'blank') {
        const gr = g.createRadialGradient(0, 0, 4, 0, 0, 44); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, '#9fe8ff'); gr.addColorStop(1, '#1b6cff');
        g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 40, 0, TAU); g.fill(); g.lineWidth = 6; g.strokeStyle = '#0a1d40'; g.stroke();
      } else if (kind === 'mine') {
        g.fillStyle = '#2b3138'; g.beginPath(); g.arc(0, 0, 44, 0, TAU); g.fill(); g.lineWidth = 6; g.strokeStyle = '#11151a'; g.stroke();
        g.fillStyle = '#ffcc00'; for (let i = 0; i < 6; i++) { g.save(); g.rotate(i * Math.PI / 3); g.fillRect(-6, -44, 12, 14); g.restore(); }
        g.fillStyle = '#d02020'; g.beginPath(); g.arc(0, 0, 14, 0, TAU); g.fill();
      } else if (kind === 'gold') {
        if (uiImg.i_gear) { g.filter = 'drop-shadow(0 0 6px rgba(255,200,0,0.6))'; g.drawImage(uiImg.i_gear, -40, -38, 80, 76); g.globalCompositeOperation = 'source-atop'; g.fillStyle = '#ffcc00'; g.fillRect(-64, -64, 128, 128); }
      }
    });
  }
  function chestTex(rank) {
    return canvasTex('chest' + rank, 256, 224, (g, w, h) => {
      const col = RANKS[rank].color;
      g.shadowColor = col; g.shadowBlur = 18;
      g.fillStyle = '#16191e'; g.fillRect(14, 40, w - 28, h - 54);
      g.shadowBlur = 0;
      const gr = g.createLinearGradient(0, 40, 0, h); gr.addColorStop(0, '#3a3f48'); gr.addColorStop(1, '#1a1d22');
      g.fillStyle = gr; g.fillRect(20, 46, w - 40, h - 66);
      g.fillStyle = '#2b3038'; g.fillRect(8, 20, w - 16, 54); // lid
      g.fillStyle = col; g.fillRect(8, 66, w - 16, 10); g.fillRect(8, 20, w - 16, 6);
      g.fillRect(8, 20, 10, h - 34); g.fillRect(w - 18, 20, 10, h - 34);
      g.globalAlpha = 0.25; g.fillRect(20, 80, w - 40, h - 100); g.globalAlpha = 1;
      // riveted corners and a lit seam under the lid
      g.fillStyle = '#9aa3ad';
      for (const [rx, ry] of [[22, 30], [w - 22, 30], [22, h - 22], [w - 22, h - 22], [22, 84], [w - 22, 84]]) { g.beginPath(); g.arc(rx, ry, 4, 0, Math.PI * 2); g.fill(); }
      const seam = g.createLinearGradient(0, 70, 0, 80); seam.addColorStop(0, 'rgba(255,255,255,0.9)'); seam.addColorStop(1, col);
      g.fillStyle = seam; g.fillRect(24, 70, w - 48, 6);
      const lid = g.createLinearGradient(0, 20, 0, 74); lid.addColorStop(0, 'rgba(255,255,255,0.18)'); lid.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = lid; g.fillRect(18, 26, w - 36, 40);
      const rk = uiImg['rank' + rank];
      if (rk) g.drawImage(rk, w / 2 - 50, 84, 100, 100 * rk.height / rk.width);
    });
  }
  function exitTex() {
    return canvasTex('exit', 256, 256, (g) => {
      g.translate(128, 128);
      for (let i = 0; i < 6; i++) {
        g.save(); g.rotate(i * Math.PI / 3);
        g.fillStyle = i % 2 ? '#2a2f37' : '#353b45'; g.beginPath(); g.moveTo(0, 0); g.lineTo(110, -63); g.lineTo(110, 63); g.closePath(); g.fill(); g.restore();
      }
      g.strokeStyle = '#ffcc00'; g.lineWidth = 8; g.beginPath();
      for (let i = 0; i <= 6; i++) { const a = i * Math.PI / 3 + Math.PI / 6; g.lineTo(Math.cos(a) * 118, Math.sin(a) * 118); } g.stroke();
      g.fillStyle = '#000'; g.beginPath(); g.arc(0, 0, 54, 0, TAU); g.fill();
      g.strokeStyle = '#ffcc00'; g.lineWidth = 6; g.beginPath(); g.moveTo(-24, -10); g.lineTo(0, 18); g.lineTo(24, -10); g.stroke();
    });
  }
  function barrelTex() {
    return canvasTex('barrel', 128, 160, (g) => {
      const gr = g.createLinearGradient(14, 0, 114, 0); gr.addColorStop(0, '#5a0d0d'); gr.addColorStop(0.45, '#d42a2a'); gr.addColorStop(1, '#4a0a0a');
      g.fillStyle = gr; g.fillRect(14, 44, 100, 110);
      g.fillStyle = '#2a2a2a'; g.fillRect(14, 70, 100, 8); g.fillRect(14, 120, 100, 8);
      g.fillStyle = '#ffcc00'; g.beginPath(); g.moveTo(64, 86); g.lineTo(80, 112); g.lineTo(48, 112); g.closePath(); g.fill();
      g.fillStyle = '#111'; g.font = 'bold 20px sans-serif'; g.textAlign = 'center'; g.fillText('!', 64, 109);
      g.fillStyle = '#b81f1f'; g.beginPath(); g.ellipse(64, 44, 50, 22, 0, 0, TAU); g.fill();
      g.strokeStyle = '#3a0707'; g.lineWidth = 5; g.stroke();
      g.fillStyle = '#7a1212'; g.beginPath(); g.ellipse(64, 44, 30, 12, 0, 0, TAU); g.fill();
    });
  }
  function spriteMesh(tex, w, h, opts = {}) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({
      map: tex, transparent: true, depthTest: false, depthWrite: false, color: opts.color != null ? opts.color : 0xffffff,
      blending: opts.add ? THREE.AdditiveBlending : THREE.NormalBlending, opacity: opts.alpha != null ? opts.alpha : 1,
    }));
    m.frustumCulled = false;
    return m;
  }
  const scratch = [];
  function addObj(o) { scene.add(o); return o; }
  function killObj(o) { if (!o) return; o.parent && o.parent.remove(o); o.traverse((x) => { if (x.geometry && !x.geometry.userData.shared) x.geometry.dispose(); if (x.material && x.material.dispose && !x.material.userData.shared) x.material.dispose(); }); }

  // ── SD rigs ──────────────────────────────────────────────
  // body: the rig with arms hidden, centred on its idle bounds, feet on the group's origin; pivot rotates for the roll
  function makeBody(id, height, hide, facesLeft) {
    const t = SD.template(id);
    if (!t) return null;
    const k = height / t.height;
    const c = SD.create(id);
    if (hide) c.setMask((p, n) => hide.test(n));
    c.root.scale.set(k, k, 1);
    const vb = visibleBox(c);
    const pel = hide ? c.tpl.data.nodes.findIndex((n) => /^(bone_)?pelvis$|^Bone_Pelvis$|^Bone_pelvis$/i.test(n.n)) : -1;
    const bx = pel >= 0 ? c.W[pel * 12 + 9] : (vb.x0 + vb.x1) / 2;
    c.root.position.set(-bx * k, -vb.y0 * k, 0);
    const flip = new THREE.Group(); flip.add(c.root);
    const pivot = new THREE.Group(); pivot.add(flip);
    flip.position.y = -height * 0.5;
    const root = new THREE.Group(); root.add(pivot);
    pivot.position.y = height * 0.5;
    return { c, k, flip, pivot, root, h: height, facesLeft: !!facesLeft };
  }
  // bounds of the sprites a (masked) rig actually draws in its current pose
  function visibleBox(c) {
    const tp = c.tpl, W = c.W;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    tp.rends.forEach((r, k) => {
      if (r.kind !== 0 || r.add || r.broken || (c.mask && c.mask[k]) || !c.EA[r.node] || !c.rEn[k] || c.rCol[k * 4 + 3] < 0.05) return;
      const sp = tp.sprites[c.rKey[k]];
      if (!sp) return;
      const o = r.node * 12;
      for (const [lx, ly] of [[sp.x0, sp.y0], [sp.x1, sp.y0], [sp.x0, sp.y1], [sp.x1, sp.y1]]) {
        const x = W[o] * lx + W[o + 3] * ly + W[o + 9], y = W[o + 1] * lx + W[o + 4] * ly + W[o + 10];
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
    });
    if (!isFinite(x0)) { const b = tp.box; return { x0: b.min.x, x1: b.max.x, y0: b.min.y, y1: b.max.y }; }
    return { x0, x1, y0, y1 };
  }
  function setFace(b, dir) { b.flip.scale.x = (b.facesLeft ? -1 : 1) * (dir < 0 ? -1 : 1); }

  const handCache = {};
  function donorK(id) { const t = SD.template(id); return t ? HERO_H / t.height : 0.18; }
  // the weapon is cut from its donor rig without the donor's hand; the holder's own hands (from heroId's rig) are
  // floated onto it Gungeon-style: one on the grip, one under the barrel. Without heroId (pickups) it's the bare gun.
  function makeGunHand(gunId, heroId) {
    const g = GUNS[gunId];
    const h = RIGS.makeHand(g.donor, donorK(g.donor) * (g.scale || 1), null, 'gun');
    if (!h) return null;
    const outer = new THREE.Group(); outer.add(h.group);
    const parts = [h.c];
    const outlines = [];
    const outlineOf = (side, dx = 0, dy = 0, piv = null) => {
      const o = RIGS.makeHand(heroId, donorK(heroId), null, 'handAll', side);
      if (!o) return;
      const [x0, y0, x1, y1] = o.box, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, f = 1.13;
      o.c.setTint(0.07, 0.05, 0.05);
      o.group.scale.setScalar(f);
      o.group.position.x += cx * (1 - f) + dx; o.group.position.y += cy * (1 - f) + dy;
      if (piv) { const pv = new THREE.Group(); pv.position.copy(piv.position); pv.rotation.z = piv.rotation.z; pv.add(o.group); outer.add(pv); } else outer.add(o.group);
      outlines.push(o.c);
    };
    if (heroId && SD.ready(heroId)) {
      // right hand on the grip, left hand where the hero's own idle pose rests it (under the barrel);
      // the palm pieces draw behind the weapon, the fingers in front, as in the source art
      const hold = g.hold;
      if (!hold) {
        outlineOf('R'); outlineOf('L');
        const back = RIGS.makeHand(heroId, donorK(heroId), null, 'handB');
        const front = RIGS.makeHand(heroId, donorK(heroId), null, 'handF');
        if (back) { outer.add(back.group); parts.unshift(back.c); }
        if (front) { outer.add(front.group); parts.push(front.c); }
      } else {
        // a gun with its own grip spots (e.g. a thick barrel): the support hand moves there and sits wholly in front
        const k = donorK(heroId);
        const rb = RIGS.makeHand(heroId, k, null, 'handB', 'R'), rf = RIGS.makeHand(heroId, k, null, 'handF', 'R');
        const lh = RIGS.makeHand(heroId, k, null, 'handAll', 'L');
        // the grip hand can move to the gun's own grip too (r: [dx, dy, tilt°])
        let rpiv = null;
        if (hold.r) { rpiv = new THREE.Group(); rpiv.position.set(hold.r[0], hold.r[1], 0); rpiv.rotation.z = (hold.r[2] || 0) * Math.PI / 180; }
        outlineOf('R', 0, 0, rpiv);
        [rb, rf].forEach((h) => { if (!h || !hold.r) return; const piv = new THREE.Group(); piv.position.copy(rpiv.position); piv.rotation.z = rpiv.rotation.z; piv.add(h.group); h.group = piv; });
        if (rb) { outer.add(rb.group); parts.unshift(rb.c); }
        if (rf) { outer.add(rf.group); parts.push(rf.c); }
        if (lh) {
          const [x0, , x1] = lh.box;
          const ldx = hold.l[0] - (x0 + x1) / 2, ldy = hold.l[1];
          lh.group.position.x += ldx; lh.group.position.y += ldy;
          outlineOf('L', ldx, ldy);
          outer.add(lh.group); parts.push(lh.c);
        }
      }
    }
    parts.unshift(...outlines);
    // one handle for the whole set (hands draw over the weapon)
    const c = {
      setOrder: (o) => parts.forEach((p, i) => p.setOrder(o + i * 0.00002)),
      setOpacity: (a) => parts.forEach((p) => p.setOpacity(a)),
      dispose: () => parts.forEach((p) => p.dispose()),
    };
    return { outer, inner: h.group, c, muzzle: h.muzzle, len: h.len, box: h.box };
  }

  // ── player ───────────────────────────────────────────────
  // the hero colour as a hex int, parsed once (was a new THREE.Color per particle)
  function heroHex(P) { if (P.hex == null) P.hex = new THREE.Color(P.hero.color).getHex(); return P.hex; }
  // saved research levels, sanitised: known ids only, whole numbers clamped to each upgrade's max
  function metaLv() {
    const out = {};
    try {
      const m = JSON.parse(localStorage.getItem('lao_rogue_meta') || '{}');
      const lv = m && typeof m === 'object' && m.lv && typeof m.lv === 'object' ? m.lv : {};
      DATA.META.forEach((u) => { out[u.id] = clamp(Math.floor(Number(lv[u.id]) || 0), 0, u.max); });
    } catch (e) { /* damaged save: no research */ }
    return out;
  }
  function readObj(key) { try { const v = JSON.parse(localStorage.getItem(key) || '{}'); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; } }
  // every playable hero: the card heroes, then the hidden ones (only the random card reaches those)
  const ALLH = [...HEROES, ...(DATA.HIDDEN || [])];
  const rigOf = (h) => h.rig || h.id;
  function newPlayer(heroIdx) {
    const hero = ALLH[heroIdx];
    const P = {
      hero, x: 0, y: 0, r: 0.3, hp: hero.hp, maxHp: hero.hp, armor: hero.armor, keys: 1, gold: 0,
      guns: [], gi: 0, items: [], aim: 0, aimT: 0, face: 1, target: null, roll: null, rollCd: 0, iframe: 0, fireCd: 0, reloadT: 0,
      skill: 0, overdrive: 0, recoil: 0, moving: false, dead: false, stepT: 0, hurtFlash: 0, lastDir: [1, 0],
      mods: { dmg: 1, rof: 1, reload: 1, crit: 0.05, mag: 1, ammo: 1, speed: 1, pierce: 0, vamp: 0, homing: 0, velo: 1, skill: 1, thorn: 0, lucky: 0, rollCd: 1, bounce: 0, split: 0, frost: 0, drone: 0 },
      syn: new Set(),
      lv: 1, xp: 0, up: {},
    };
    P.mods.sk2cd = 1;
    const ml = metaLv();
    P.metaHp = ml.hp || 0; // 생체 강화: +25 HP per level (half a heart)
    P.maxHp += P.metaHp; P.hp = P.maxHp;
    P.keys += ml.key || 0; P.gold += (ml.gold || 0) * 20; P.skill = (ml.skill || 0) * 35;
    P.mods.dmg *= 1 + (ml.dmg || 0) * 0.06;
    P.armor += ml.armor || 0;
    P.mods.rollCd *= 1 - (ml.roll || 0) * 0.1;
    P.metaLuck = ml.luck || 0;
    P.metaXp = ml.xp || 0; P.cards = 3 + (ml.cards || 0); // research: 전투 데이터 분석 / 강화 모듈 확장
    P.revives = ml.revive || 0;
    P.body = makeBody(rigOf(hero), HERO_H, RIGS[rigOf(hero)].hide, !!hero.rigFlip);
    P.body.root.position.set(0, 0, 0);
    scene.add(P.body.root);
    P.shadow = FX.sprite({ x: 0, y: 0, size: 0.95, aspect: 0.32, color: 0x000000, alpha: 0.55, tex: FX.tex.dot, normal: true, order: 3 });
    P.handRoot = new THREE.Group();
    scene.add(P.handRoot);
    giveGun(P, hero.gun, true);
    return P;
  }
  function gunState(id, infinite) {
    const d = GUNS[id];
    return { id, d, mag: d.mag, ammo: infinite ? Infinity : d.ammo, infinite: !!infinite, hand: null };
  }
  function giveGun(P, id, infinite) {
    if (P.guns.some((g) => g.id === id)) {
      const g = P.guns.find((x) => x.id === id);
      if (!g.infinite) g.ammo = Math.min(maxAmmo(g), g.ammo + Math.round(g.d.ammo * 0.5));
      return g;
    }
    const g = gunState(id, infinite);
    if (!infinite && G.phase === 'play') SFX.voice(P.hero.id, 'ItemEquip');
    g.mag = magSize(g, P);
    P.guns.push(g);
    equip(P, P.guns.length - 1);
    if (P.guns.length === 2 && G.phase === 'play') tip('guns', '두 번째 무기', INPUT.isTouch ? '교체 버튼으로 무기를 바꿉니다. 보급 무기는 탄약이 한정되어 있습니다' : `1~9 / ${UI.K('swap')} / 마우스 휠로 무기를 바꿉니다. 보급 무기는 탄약이 한정 — 다 쓰면 ${UI.K('interact')} 두 번으로 버리기`);
    G.stats && G.stats.guns.add(id);
    return g;
  }
  // signature-weapon mastery (hero perk m_<hero>): level 0-3 while holding her own starting gun
  const mastery = (P, g) => (P && g && g.id && g.id === P.hero.gun ? P.up['m_' + P.hero.id] || 0 : 0);
  const masteryDmg = (P, g) => 1 + mastery(P, g) * (P.hero.id === 'leprechaun' ? 0.12 : 0.15);
  const magSize = (g, P = G.P) => Math.max(1, Math.round(g.d.mag * (P ? P.mods.mag : 1) * (P && P.hero.id === 'leprechaun' ? 1 + mastery(P, g) * 0.2 : 1)));
  const maxAmmo = (g, P = G.P) => (g.infinite ? Infinity : Math.round(g.d.ammo * (P ? P.mods.ammo : 1)));
  function equip(P, i) {
    const cur = P.guns[P.gi];
    if (cur && cur.hand) cur.hand.outer.visible = false;
    P.gi = (i + P.guns.length) % P.guns.length;
    const g = P.guns[P.gi];
    if (!g.hand) {
      g.hand = makeGunHand(g.id, P.hero.id);
      if (g.hand) P.handRoot.add(g.hand.outer);
      else SD.prepare(GUNS[g.id].donor).then(() => { if (!g.hand && P.guns.includes(g)) { g.hand = makeGunHand(g.id, P.hero.id); if (g.hand) { P.handRoot.add(g.hand.outer); g.hand.outer.visible = P.guns[P.gi] === g; } } });
    }
    if (g.hand) g.hand.outer.visible = true;
    P.reloadT = 0;
    P.fireCd = Math.max(P.fireCd, 0.15);
    if (G.phase === 'play') UI.gunChanged(g);
  }
  const curGun = () => G.P.guns[G.P.gi];

  // auto-aim: nearest visible enemy (sticky), otherwise the walking direction
  function pickTarget(P) {
    const cx = P.x, cy = P.y + 0.6;
    let best = null, bd = Infinity;
    for (const e of G.enemies) {
      if (!e.alive || e.spawnT > 0) continue;
      const ey = e.y + e.h * 0.42;
      const d = Math.hypot(e.x - cx, ey - cy);
      if (d > 15) continue;
      if (!LEVEL.los(P.x, P.y + 0.2, e.x, e.y + 0.2)) continue;
      // keep facing a little: targets in front are preferred
      const a = Math.atan2(ey - cy, e.x - cx);
      const score = d * (1 + 0.25 * Math.abs(angDiff(P.aim, a)) / Math.PI) * (e === P.target ? 0.7 : 1);
      if (score < bd) { bd = score; best = e; }
    }
    return best;
  }

  // stereo pan of a world x relative to the camera (-1 left .. 1 right)
  function panOf(x) { return clamp((x - G.cam.x) / (view.vw * 0.6), -1, 1); }
  function updatePlayer(dt) {
    const P = G.P;
    if (P.dead || G.transit) return;
    const mv = INPUT.moveVec();
    P.iframe = Math.max(0, P.iframe - dt);
    P.rollCd = Math.max(0, P.rollCd - dt);
    P.fireCd = Math.max(0, P.fireCd - dt);
    P.recoil = Math.max(0, P.recoil - dt * 6);
    P.hurtFlash = Math.max(0, P.hurtFlash - dt);
    if (P.ocT > 0) P.ocT -= dt;
    if (P.adrT > 0) { P.adrT -= dt; if (Math.random() < dt * 14) FX.particle({ x: P.x + rnd(-0.4, 0.4), y: P.y + rnd(0.2, 1.3), vy: 1.6, life: 0.35, size: 0.12, size1: 0, color: 0xff5a3a, tex: FX.tex.dot }); }
    updateOrbs(P, dt);
    if (P.visorT > 0) P.visorT -= dt;
    if (P.emplaceT > 0) { P.emplaceT -= dt; if (P.emplaceT <= 0) P.emplaceGuard = 0; }
    if (P.blossomT > 0) {
      // 산탄 회오리: a ring of buckshot every 0.15 s, the ring turning as it goes
      P.blossomT -= dt; P.blossomTick -= dt;
      if (P.blossomTick <= 0) {
        P.blossomTick = 0.15;
        const sg = BLOSSOM_SHOT, rot = G.t * 3;
        for (let i = 0; i < 14; i++) spawnPBullet(P, sg, P.x, P.y + 0.6, rot + i * TAU / 14, 16);
        SFX.play('gun', 0.55); if (G.opt.shake) FX.shake(0.06);
        FX.ring(P.x, P.y + 0.6, 0.3, 1.6, 0x7affd4, 0.15);
      }
    }
    if (P.ultT > 0) P.ultT -= dt;
    if (P.focusT > 0) P.focusT -= dt;
    // 경기관총 난사: a wide fan of light-MG rounds toward the aim
    if (P.sprayT > 0) {
      P.sprayT -= dt; P.sprayTick -= dt;
      if (P.sprayTick <= 0) {
        P.sprayTick = 0.07;
        const mg = { d: Object.assign({}, GUNS.mg, { dmg: GUNS.mg.dmg * 1.3 * (1 + 0.2 * upF(P)), life: 0.6 }) };
        for (let i = 0; i < 3; i++) { const b = spawnPBullet(P, mg, ...muzzleOf(P), P.aim + rnd(-0.62, 0.62), rnd(19, 23)); if (b) b.pierce += 1; }
        if (Math.random() < 0.5) SFX.play('mg', 0.5);
      }
      if (P.sprayT <= 0) P.sprayT = 0;
    }
    // 제압 난사: rounds rain on the target zone; everything caught is suppressed
    if (P.zone) {
      const z = P.zone; z.t -= dt; z.tick -= dt;
      if (z.tick <= 0) {
        z.tick = 0.14;
        const r = Math.sqrt(Math.random()) * z.R, an = Math.random() * TAU, x = z.x + Math.cos(an) * r, y = z.y + Math.sin(an) * r;
        FX.explosion(x, y, 0.45, 0x7affd4, false); if (Math.random() < 0.4) SFX.play('expS', 0.35);
        for (const e of G.enemies) { if (!e.alive || e.spawnT > 0 || Math.hypot(e.x - x, e.y + e.h * 0.4 - y) > 1.2 + e.r) continue; e.supT = Math.max(e.supT || 0, 4); hurtEnemy(e, 15 * (1 + 0.2 * upF(P)) * P.mods.dmg * (e.markT > 0 ? 1.19 : 1), false, 0, 0, 'hitS'); }
      }
      if (z.t <= 0) P.zone = null;
    }
    // 방벽 생성: a concrete wall arc in front of her that stops enemy rounds
    if (P.wallT > 0) {
      P.wallT -= dt;
      if (!P.wallFx) P.wallFx = Array.from({ length: 9 }, () => FX.sprite({ x: 0, y: 0, size: 0.72, aspect: 0.85, color: 0x9a9080, alpha: 0.92, tex: FX.tex.white, normal: true, order: L.PROJ + 1.4 }));
      const cx = P.x, cy = P.y + 0.6, R = 2.2;
      P.wallFx.forEach((s, i) => { const aa = P.aim + (i / 8 - 0.5) * 3.2; s.hidden = false; s.x = cx + Math.cos(aa) * R; s.y = cy + Math.sin(aa) * R * 0.85; s.rot = aa; s.alpha = P.wallT < 0.8 ? 0.45 + 0.4 * Math.sin(G.t * 30) : 0.92; });
      for (let k = G.ebul.length - 1; k >= 0; k--) { const b = G.ebul[k]; for (const s of P.wallFx) { if (Math.hypot(b.x - s.x, b.y - s.y) < 0.62) { popEB(b); ebRemove(k); break; } } }
      if (P.wallT <= 0) { P.wallT = 0; P.wallFx.forEach((s) => { s.hidden = true; }); }
    }
    if (P.overdrive > 0) {
      if (!P.odAura) P.odAura = FX.sprite({ x: P.x, y: P.y + 0.8, size: 2.6, aspect: 0.45, color: heroHex(P), alpha: 0.3, tex: FX.tex.glow, order: 3.4 }); // a floor glow under her, never a veil over the sprite
      P.odAura.hidden = false; P.odAura.x = P.x; P.odAura.y = P.y + 0.05; P.odAura.alpha = 0.35 + 0.12 * Math.sin(G.t * 14);
      if (Math.random() < dt * 18) FX.particle({ x: P.x + rnd(-0.5, 0.5), y: P.y + rnd(0.1, 1.4), vy: rnd(1, 2.4), life: 0.5, size: 0.14, size1: 0, color: heroHex(P), tex: FX.tex.dot, alpha: 0.9 });
    } else if (P.odAura) P.odAura.hidden = true;
    if (P.overdrive > 0) { P.overdrive -= dt; if (P.overdrive <= 0) UI.toast(`${P.hero.skillName} 종료`, ''); }
    const moving = Math.hypot(mv[0], mv[1]) > 0.15;
    if (moving) P.lastDir = [mv[0], mv[1]];
    P.idleT = moving || (G.room && G.room.active) ? 0 : (P.idleT || 0) + dt;
    if (P.idleT > 18) { P.idleT = -30; SFX.voice(P.hero.id, 'Idle'); }

    // dodge input buffer: a press up to 0.2 s before the roll / dash / cooldown ends still rolls
    if (INPUT.take('dodge')) P.dodgeBuf = 0.2; else P.dodgeBuf = Math.max(0, (P.dodgeBuf || 0) - dt);
    // Nymph's rush: a short invulnerable dash that ends in a point-blank shotgun blast
    if (P.dash) {
      const D = P.dash;
      D.t += dt;
      LEVEL.move(P, D.dx * 15 * dt, D.dy * 15 * dt);
      P.iframe = Math.max(P.iframe, 0.05);
      FX.particle({ x: P.x, y: P.y + 0.7, life: 0.25, size: 1.2, size1: 0.5, aspect: 1.4, color: 0x7affd4, tex: FX.tex.glow, alpha: 0.4 });
      if (D.t >= 0.2) { P.dash = null; rushBlast(P); }
    } else
    // dodge roll: i-frames, fast slide, the body somersaults
    if (P.roll) {
      const R = P.roll;
      R.t += dt;
      const f = R.t / BAL.rollTime;
      const sp = BAL.rollSpeed * (1 - f * 0.55);
      LEVEL.move(P, R.dx * sp * dt, R.dy * sp * dt);
      P.body.pivot.rotation.z = -Math.sign(R.dx || P.face) * f * TAU;
      FX.particle({ x: P.x, y: P.y + 0.7, life: 0.22, size: 1.1, size1: 0.6, aspect: 1.3, color: heroHex(P), tex: FX.tex.glow, alpha: 0.28 });
      if (P.mods.ghost) for (let k = G.ebul.length - 1; k >= 0; k--) { const b = G.ebul[k]; if (Math.hypot(b.x - P.x, b.y - P.y - 0.5) < 0.9) { popEB(b); ebRemove(k); } } /* 위상 회피기: the roll eats grazed bullets */
      if (Math.random() < 0.6) FX.particle({ x: P.x + rnd(-0.2, 0.2), y: P.y + 0.05, vx: -R.dx * 2, vy: rnd(0, 0.6), life: 0.4, size: 0.35, size1: 0.8, color: 0x8a96a8, frames: null, tex: FX.tex.dot, alpha: 0.35, normal: true, order: 4 });
      if (f >= 1) {
        P.roll = null; P.body.pivot.rotation.z = 0; P.rollCd = Math.max(0.3, BAL.rollCd * P.mods.rollCd); /* cooldown floor: rolling can't become permanent invulnerability */ SFX.play('land', 0.6);
        if (P.mods.adren) { P.adrT = 2; FX.ring(P.x, P.y + 0.6, 0.3, 1.4, 0xff5a3a, 0.35); }
        if (P.up.p_rollBlast) {
          FX.ring(P.x, P.y + 0.5, 0.3, 2.2, 0x7fe3ff, 0.35); SFX.play('shield', 0.5);
          for (const o of G.enemies) if (o.alive && o.spawnT <= 0 && Math.hypot(o.x - P.x, o.y - P.y) < 2 + o.r) hurtEnemy(o, 16 * P.mods.dmg, false, (o.x - P.x) * 2, (o.y - P.y) * 2, 'hitE');
          for (let k = G.ebul.length - 1; k >= 0; k--) { const b = G.ebul[k]; if (Math.hypot(b.x - P.x, b.y - P.y - 0.5) < 1.7) { popEB(b); ebRemove(k); } }
        }
      }
    } else if (P.dodgeBuf > 0 && P.rollCd <= 0) {
      P.dodgeBuf = 0;
      const d = moving ? mv : P.lastDir;
      const l = Math.hypot(d[0], d[1]) || 1;
      P.roll = { t: 0, dx: d[0] / l, dy: d[1] / l };
      if (P.up.p_rollReload) { const cg = P.guns[P.gi]; if (cg && cg.mag < magSize(cg) && (cg.infinite || cg.ammo > 0)) { const need = magSize(cg) - cg.mag, take = cg.infinite ? need : Math.min(need, cg.ammo); cg.mag += take; if (!cg.infinite) cg.ammo -= take; P.reloadT = 0; SFX.play('reloadOut', 0.7); } }
      P.iframe = Math.max(P.iframe, BAL.rollIframe * (P.mods.ghost ? 1.5 : 1));
      P.rolled = (P.rolled || 0) + 1;
      if (G.room && G.room.active && G.ebul.length) P.rolledCombat = (P.rolledCombat || 0) + 1;
      // training: only a roll with a practice round close by counts as a dodge
      if (G.tut && G.ebul.some((b) => Math.hypot(b.x - P.x, b.y - P.y - 0.4) < 1.6)) P.rolledNear = (P.rolledNear || 0) + 1; // a practice round really has to be close
      SFX.play('roll', 0.9);
      if (Math.abs(d[0]) > 0.1) P.face = Math.sign(d[0]);
    } else {
      const sp = P.hero.speed * P.mods.speed * (P.reloadT > 0 ? 0.92 : 1) * (P.emplaceT > 0 ? 0.5 : 1); // 거치 사격: half speed
      LEVEL.move(P, mv[0] * sp * dt, mv[1] * sp * dt);
    }
    if (moving !== P.moving || (moving && P.body.c.clipName !== 'move')) {
      P.moving = moving;
      if (!P.roll) P.body.c.play(moving ? 'move' : 'idle', null, true);
    }
    if (P.hp <= 2 && P.armor === 0 && !P.dead && (P.beats || 0) < 5) { P.beatT = (P.beatT || 0) - dt; if (P.beatT <= 0) { P.beatT = P.hp <= 1 ? 1.1 : 2.2; P.beats = (P.beats || 0) + 1; SFX.synth('beat', 1); } }
    if (moving) { P.stepT -= dt; if (P.stepT <= 0) { P.stepT = 0.46; SFX.play('step', 0.35); FX.particle({ x: P.x, y: P.y, life: 0.35, size: 0.2, size1: 0.45, color: 0x6a7480, tex: FX.tex.dot, alpha: 0.25, normal: true, order: 4 }); } }

    // aim
    // aim: mouse cursor (desktop) or the touch aim pad; auto-aim only as an optional assist (and for the test bot)
    let want = P.aim, snap = 30;
    const src = INPUT.aim();
    const assist = assistOn() || (window.BOT && BOT.tick) || P.visorT > 0; // 전술 조준 모드 locks on by itself
    if (src && src.kind === 'mouse' && !assist) {
      const [wx, wy] = screenToWorld(src.x, src.y);
      want = Math.atan2(wy - (P.y + 0.7), wx - P.x);
      P.target = null;
      snap = 1e4; // mouse aim is exact: shots go where the crosshair is, no smoothing lag on flicks
    } else if (src && src.kind === 'stick' && !(P.visorT > 0)) {
      want = Math.atan2(src.y, src.x);
      P.target = null;
    } else if (assist) {
      const tg = pickTarget(P);
      P.target = tg;
      if (tg) want = Math.atan2(tg.y + tg.h * 0.42 - (P.y + 0.6), tg.x - P.x);
      else if (moving) want = Math.atan2(mv[1], mv[0]);
      snap = tg ? 22 : 10;
    } else if (INPUT.isTouch && moving && !INPUT.held('fire')) {
      want = Math.atan2(mv[1], mv[0]); snap = 10; // touch: face the walking direction until the aim pad is used
    }
    P.aim += angDiff(P.aim, want) * Math.min(1, dt * snap);
    if (!P.roll) {
      const c = Math.cos(P.aim);
      if (Math.abs(c) > 0.08) P.face = c < 0 ? -1 : 1;
    }
    setFace(P.body, P.face);

    // weapon actions
    if (INPUT.take('swap') && P.guns.length > 1 && !P.roll) { equip(P, P.gi + 1); SFX.play('uiPick', 0.7); P.emptyWarned = false; }
    if (INPUT.take('swapPrev') && P.guns.length > 1 && !P.roll) { equip(P, (P.gi - 1 + P.guns.length) % P.guns.length); SFX.play('uiPick', 0.7); P.emptyWarned = false; } /* wheel up: the previous weapon */
    for (let n = 1; n <= 9; n++) if (INPUT.take('gun' + n) && n - 1 < P.guns.length && n - 1 !== P.gi && !P.roll) { equip(P, n - 1); SFX.play('uiPick', 0.7); P.emptyWarned = false; }
    // the gun in hand *after* any swap this frame (a stale reference used to start / finish a reload on the wrong gun)
    const g = curGun();
    if (P.reloadT > 0 && P.reloadGun !== g) { P.reloadT = 0; P.reloadGun = null; } // a reload belongs to the gun that started it
    if (INPUT.take('reload')) startReload(P, g);
    if (P.reloadT > 0) {
      P.reloadT -= dt;
      if (P.reloadT <= 0) {
        const need = magSize(g) - g.mag, take = g.infinite ? need : Math.min(need, g.ammo);
        g.mag += take; if (!g.infinite) g.ammo -= take;
        SFX.play('reloadOut');
      }
    }
    updateDrone(P, dt);
    if (INPUT.take('skill')) useSkill();
    P.sk2Cd = Math.max(0, (P.sk2Cd || 0) - dt);
    if (P.shieldT > 0) {
      P.shieldT -= dt; updateShield(P);
      if (P.shieldT <= 0 && P.absorb) {
        // 흡수 방벽 → charged: bonus damage for 5 s scaled by what it ate
        const cap = 0.5 + 0.1 * (P.up.u_shield || 0); // each upgrade level raises the ceiling
        P.chargeDmg = 1 + Math.min(cap, P.absorb * 0.04); P.chargeT = 5;
        UI.toast(`흡수 에너지 — 5초간 피해 +${Math.round((P.chargeDmg - 1) * 100)}%`, 'gem'); SFX.play('rankUp', 0.6);
        P.absorb = 0;
      }
    } else if (P.shieldFx) { P.shieldFx.forEach((s) => { s.hidden = true; }); }
    if (P.chargeT > 0) { P.chargeT -= dt; if (Math.random() < dt * 10) FX.particle({ x: P.x + rnd(-0.4, 0.4), y: P.y + rnd(0.2, 1.3), vy: 1.4, life: 0.4, size: 0.14, size1: 0, color: 0x9dff7a, tex: FX.tex.dot }); }
    if (INPUT.take('skill2')) useSkill2();
    if (INPUT.held('fire') && !P.roll && P.reloadT <= 0 && P.fireCd <= 0) {
      if (g.mag > 0) fire(P, g);
      else if (g.ammo > 0) startReload(P, g);
      else { P.fireCd = 0.3; SFX.synth('empty'); if (!P.emptyWarned) { P.emptyWarned = true; UI.toast('탄약이 없습니다 — 무기를 교체하세요', 'warn'); UI.gunEmpty(); tip('ammo', '탄약 소진', INPUT.isTouch ? '교체 버튼으로 다른 무기로 바꾸세요. 기본 무기는 탄약이 무한합니다. 탄약 상자(초록)로 보충' : `1~9 / ${UI.K('swap')} / 휠로 다른 무기로 바꾸세요. 기본 무기는 탄약이 무한합니다. 빈 무기는 ${UI.K('interact')} 두 번으로 버릴 수 있습니다`); } }
    } else if (!INPUT.held('fire') && g.mag === 0 && g.ammo > 0 && P.reloadT <= 0) startReload(P, g);
  }

  function startReload(P, g) {
    if (P.reloadT > 0 || g.mag >= magSize(g) || (!g.infinite && g.ammo <= 0)) return;
    P.reloadT = g.d.reload / P.mods.reload / (P.hero.id === 'brownie' ? 1 + mastery(P, g) * 0.15 : 1);
    P.reloadMax = P.reloadT; P.reloadGun = g;
    SFX.play('reloadIn');
  }

  const REACH = -0.095 * HERO_H / 1.5, ARM = 0, SHOULDER_Y = 0.74 * HERO_H / 1.5; // ARM 0: the gun turns about its grip
  function armPos(x, y, ca, sa, k, face) {
    const f = face || (ca < 0 ? -1 : 1);
    return [x + (f * (REACH - ARM) + ARM * ca) * k, y + (SHOULDER_Y + ARM * 0.85 * sa) * k];
  }
  // a thin cooldown arc (dark track + coloured sweep filling clockwise from the top); squash < 1 makes an ellipse
  function arcGauge(R, w, color, squash, order) {
    const g = new THREE.Group();
    const track = new THREE.Mesh(new THREE.RingGeometry(R - w / 2, R + w / 2, 48), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55, depthTest: false, depthWrite: false, side: THREE.DoubleSide }));
    // one full ring built once (clockwise from the top); the fill is just a draw range over its 48 segments — no per-frame geometry
    const fg = new THREE.Mesh(new THREE.RingGeometry(R - w / 2, R + w / 2, 48, 1, Math.PI / 2, -Math.PI * 2), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, depthTest: false, depthWrite: false, side: THREE.DoubleSide }));
    track.renderOrder = order; fg.renderOrder = order + 0.01;
    g.add(track, fg); g.scale.set(1, squash, 1); g.visible = false;
    scene.add(g);
    let last = -1;
    return {
      g,
      set(f, x, y) {
        g.visible = f < 1;
        if (!g.visible) return;
        g.position.set(x, y, 0);
        const q = Math.round(f * 48) / 48;
        if (q !== last) { last = q; fg.geometry.setDrawRange(0, Math.max(1, Math.round(q * 48)) * 6); }
      },
      dispose() { scene.remove(g); track.geometry.dispose(); fg.geometry.dispose(); track.material.dispose(); fg.material.dispose(); },
    };
  }
  // hand + gun pose (called from the render pass): orbit the body centre toward the aim
  function poseHand(P) {
    const g = curGun();
    if (!g || !g.hand) return;
    const a = P.aim, ca = Math.cos(a), sa = Math.sin(a);
    const rk = P.recoil * 0.22;
    const bob = P.moving ? Math.sin(G.t * 14) * 0.03 : Math.sin(G.t * 3) * 0.015;
    // the wrist sits so the back of the gun reaches the body's centre line, at chest height
    // the grip sits just in front of the body's centre line at chest height (the stock lies across the body)
    // the hand swings on an arc around a shoulder pivot (an invisible arm of length ARM): aiming straight
    // ahead the grip sits where it was tuned (REACH from the body centre); aiming up / down it rises / drops
    // and pulls back toward the shoulder, the way a held gun moves when the arm turns
    const [hx0, hy0] = armPos(P.x, P.y, ca, sa, 1, P.face);
    // the hand glides to its new spot when the hero turns around (the gun changes hands)
    const tx = hx0 - ca * rk - P.x, ty = hy0 - sa * rk * 0.4 + bob - P.y;
    if (!P.hoff) P.hoff = [tx, ty];
    const kk = Math.abs(P.hoff[0] - tx) > 0.15 ? 0.35 : 1;
    P.hoff[0] += (tx - P.hoff[0]) * kk; P.hoff[1] += (ty - P.hoff[1]) * kk;
    const hx = P.x + P.hoff[0], hy = P.y + P.hoff[1];
    const o = g.hand.outer;
    o.position.set(hx, hy, 0);
    o.rotation.z = a + (P.roll ? P.body.pivot.rotation.z : 0);
    const fl = P.face < 0 ? -1 : 1;
    o.scale.set(1, fl, 1);
    o.visible = !P.dead;
    g.hand.c.setOrder(ORD(P.ordY != null ? P.ordY : P.y) + 0.0004); // the gun always draws over the body and head
    if (P.roll) o.visible = false;
    P.muzzle = [hx + ca * g.hand.muzzle[0] - sa * g.hand.muzzle[1] * fl, hy + sa * g.hand.muzzle[0] + ca * g.hand.muzzle[1] * fl];
  }

  const DRONE_GUN = { kind: 'bullet', color: 0x7fe3ff, size: 0.26, life: 0.9, hit: null, hitSnd: 'hitS', dmg: 4, speed: 18, splash: 0 };
  function makeDrone(P) {
    if (P.drone) return;
    P.drone = { a: 0, t: 0, x: P.x, y: P.y + 1,
      core: FX.sprite({ x: P.x, y: P.y, size: 0.28, color: 0xffffff, tex: FX.tex.glow, order: L.PROJ - 0.5 }),
      glow: FX.sprite({ x: P.x, y: P.y, size: 0.8, color: 0x33d1fa, alpha: 0.7, tex: FX.tex.glow, order: L.PROJ - 0.6 }) };
  }
  const BLOSSOM_SHOT = { d: Object.assign({}, DATA.GUNS.sg, { dmg: DATA.GUNS.sg.dmg * 1.5, life: 0.32, pierce: 1 }) };
  // 방어 위성: satellites circling the hero that erase enemy bullets they touch
  function updateOrbs(P, dt) {
    const n = P.mods.orbit || 0;
    if (!n || P.dead) { if (P.orbs) P.orbs.forEach((o) => { o.hidden = true; }); return; }
    if (!P.orbs || P.orbs.length !== n) {
      if (P.orbs) P.orbs.forEach((o) => FX.kill(o));
      P.orbs = Array.from({ length: n }, () => FX.sprite({ x: P.x, y: P.y, size: 0.5, color: 0x9feaff, alpha: 0.9, tex: FX.tex.glow, order: L.PROJ + 2 }));
    }
    P.orbA = (P.orbA || 0) + dt * 2.6;
    const R = n >= 3 ? 1.35 : 1.15;
    P.orbs.forEach((o, i) => { const a = P.orbA + i * TAU / n; o.hidden = false; o.x = P.x + Math.cos(a) * R; o.y = P.y + 0.6 + Math.sin(a) * R * 0.8; });
  }
  function killOrbs(P) { if (P && P.orbs) { P.orbs.forEach((o) => FX.kill(o)); P.orbs = null; } }
  function killDrone(P) {
    killOrbs(P); if (P && P.drone) { FX.kill(P.drone.core); FX.kill(P.drone.glow); P.drone = null; } }
  function updateDrone(P, dt) {
    const d = P.drone;
    if (!d) return;
    d.a += dt * 2.2;
    d.x = P.x + Math.cos(d.a) * 0.9; d.y = P.y + 1.0 + Math.sin(d.a) * 0.45;
    d.core.x = d.glow.x = d.x; d.core.y = d.glow.y = d.y;
    d.glow.sz = 0.8 * (1 + 0.15 * Math.sin(G.t * 9));
    d.t -= dt;
    if (d.t > 0 || P.dead || !(G.room && G.room.active)) return;
    let best = null, bd = 9;
    for (const e of G.enemies) { if (!e.alive || e.spawnT > 0) continue; const dd = Math.hypot(e.x - d.x, e.y + e.h * 0.42 - d.y); if (dd < bd && LEVEL.los(d.x, d.y - 0.6, e.x, e.y + 0.2)) { bd = dd; best = e; } }
    if (!best) return;
    d.t = P.syn.has('전술 편대') ? 0.3 : 0.6;
    const ang = Math.atan2(best.y + best.h * 0.42 - d.y, best.x - d.x);
    const g = { d: DRONE_GUN };
    spawnPBullet(P, g, d.x, d.y, ang, DRONE_GUN.speed);
    FX.muzzle(d.x, d.y, 0x7fe3ff);
    SFX.play('laser', 0.25);
  }

  // ── shooting ─────────────────────────────────────────────
  function fire(P, g) {
    const d = g.d;
    const rof = P.mods.rof * (P.overdrive > 0 ? P.odRof || 2 : 1) * (P.adrT > 0 && P.mods.adrenRof ? 1.3 : 1) * (P.ocT > 0 ? 1.25 : 1);
    P.fireCd = d.rate / rof;
    if (!(P.overdrive > 0 && g.infinite)) g.mag--; // ultimates make the hero's own gun bottomless, not picked-up ones
    P.recoil = 1;
    poseHand(P);
    const [mx, my] = P.muzzle || [P.x, P.y + 0.6];
    const a = P.aim;
    FX.muzzleFlash(mx, my, a, d.color, d.kind === 'fireball' || d.kind === 'rail' ? 1.6 : 1);
    SFX.play(d.sfx, d.sfx === 'mg' ? 0.8 : 1);
    if (G.opt.shake) FX.shake(d.recoil * 0.6);
    G.stats.shots++;
    if (d.kind === 'rail') return railShot(P, g, mx, my, a);
    if (d.kind === 'chain') return chainShot(P, g, mx, my);
    const n = d.pellets || 1;
    for (let i = 0; i < n; i++) {
      const sp = (d.spread * Math.PI / 180) * (P.focusT > 0 ? 0.3 : 1) * (n > 1 ? (i / (n - 1) - 0.5) + rnd(-0.06, 0.06) : rnd(-0.5, 0.5)); /* 기관총 사격: focused fire tightens the spread */
      const ang = a + sp;
      const v = d.speed * P.mods.velo * (n > 1 ? rnd(0.85, 1.1) : 1);
      spawnPBullet(P, g, mx, my, ang, v);
    }
    // 잔향 사격 모듈: every 6th trigger pull adds two free shots in a narrow fan
    if (P.mods.echo) {
      P.shotN = (P.shotN || 0) + 1;
      if (P.shotN % 6 === 0) { for (const da of [-0.16, 0.16]) spawnPBullet(P, g, mx, my, a + da, d.speed * P.mods.velo); FX.ring(mx, my, 0.1, 0.7, 0xc8a0ff, 0.2); }
    }
    // a spent casing hops off the gun
    if (d.kind === 'bullet' && Math.random() < 0.7) { if (Math.random() < 0.35) SFX.play('shell', 0.35); } if (d.kind === 'bullet' && Math.random() < 0.7) FX.particle({ x: mx - Math.cos(a) * 0.3, y: my, vx: -Math.cos(a) * 1.5 + rnd(-0.5, 0.5), vy: rnd(1.5, 2.5), grav: 9, life: 0.4, size: 0.09, size1: 0.07, aspect: 1.6, color: 0xd8b04a, tex: FX.tex.dot, normal: true, order: ORD(P.y) + 0.01, spin: 12 });
  }
  function critRoll(P, g) { return Math.random() < P.mods.crit + (P.hero.id === 'constantia' ? mastery(P, g) * 0.05 : 0) + (P.visorT > 0 ? 0.25 : 0); }
  function spawnPBullet(P, g, x, y, ang, v) {
    const d = g.d;
    const big = d.kind === 'grenade' || d.kind === 'fireball';
    const s = FX.sprite({ x, y, size: d.size * (big ? 0.7 : 0.55), aspect: big ? 1 : 2.6, color: d.color, alpha: 1, tex: FX.tex.glow, order: L.PROJ, rot: ang - Math.PI / 2 });
    const core = FX.sprite({ x, y, size: d.size * (big ? 0.38 : 0.22), aspect: big ? 1 : 3, color: 0xffffff, alpha: 1, tex: FX.tex.glow, order: L.PROJ + 0.1, rot: ang - Math.PI / 2 });
    const crit = critRoll(P, g);
    const nb = {
      x, y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, life: d.life * (P.mods.velo > 1 ? 1.2 : 1), g: d, dmg: d.dmg * P.mods.dmg * masteryDmg(P, g) * (crit ? P.mods.critMul || 2 : 1), crit,
      splashK: P.hero.id === 'gnome' ? 1 + mastery(P, g) * 0.1 : 1, mast: mastery(P, g),
      visor: P.visorT > 0,
      pierce: (d.pierce || 0) + P.mods.pierce, hit: new Set(), s, core, kind: d.kind, t: 0,
    };
    if (G.pbul.length > 700) { const o = G.pbul.shift(); FX.kill(o.s); FX.kill(o.core); } /* a hard ceiling for runaway fire (minigun + split + echo): the oldest shot retires */
    G.pbul.push(nb);
    return nb;
  }
  function railShot(P, g, x, y, a) {
    const d = g.d, ca = Math.cos(a), sa = Math.sin(a);
    let L2 = 0;
    for (; L2 < d.range; L2 += 0.2) { const t = LEVEL.tile(x + ca * L2, y - 0.3 + sa * L2); if (t === LEVEL.WALL || t === LEVEL.VOID) break; }
    const ex = x + ca * L2, ey = y + sa * L2;
    FX.beam(x, y, ex, ey, 0.32, d.color, 0.35);
    FX.ring(ex, ey, 0.2, 1.2, d.color, 0.3);
    spawnStatic(d.hit, ex, ey, 0.16);
    if (G.opt.shake) FX.shake(0.2);
    const crit = critRoll(P, g), dmg = d.dmg * P.mods.dmg * masteryDmg(P, g) * (crit ? P.mods.critMul || 2 : 1);
    for (const e of G.enemies) {
      if (!e.alive || e.spawnT > 0) continue;
      const ey2 = e.y + e.h * 0.42, px = e.x - x, py = ey2 - y;
      const t = px * ca + py * sa;
      if (t < 0 || t > L2 + e.r) continue;
      if (Math.abs(-px * sa + py * ca) < e.r + 0.35) { hurtEnemy(e, dmg, crit, ca * 3, sa * 3, 'hitB'); spawnStatic(d.hit, e.x, ey2, 0.14); }
    }
    hitPropsOnLine(x, y, ex, ey, dmg);
  }
  function chainShot(P, g, x, y) {
    const d = g.d;
    const crit = critRoll(P, g), dmg = d.dmg * P.mods.dmg * masteryDmg(P, g) * (crit ? P.mods.critMul || 2 : 1);
    let from = { x, y }, hit = new Set();
    const pts = [{ x, y }];
    for (let k = 0; k < d.chain + P.mods.pierce; k++) {
      let best = null, bd = k === 0 ? d.range : 4.5;
      for (const e of G.enemies) {
        if (!e.alive || e.spawnT > 0 || hit.has(e)) continue;
        const ey = e.y + e.h * 0.42, dd = Math.hypot(e.x - from.x, ey - from.y);
        if (k === 0 && Math.abs(angDiff(G.P.aim, Math.atan2(ey - y, e.x - x))) > 0.7) continue; // first jump: only along the aim
        if (dd < bd && LEVEL.los(from.x, from.y - 0.4, e.x, e.y + 0.2)) { bd = dd; best = e; }
      }
      if (!best) break;
      hit.add(best);
      const p = { x: best.x, y: best.y + best.h * 0.42 };
      pts.push(p);
      hurtEnemy(best, dmg * (k ? 0.7 : 1), crit, 0, 0, 'hitE');
      if (k === 0) spawnStatic(d.hit, p.x, p.y, 0.12);
      from = p;
    }
    if (pts.length === 1) { // nothing in range: a short spark arc toward the aim (the charge isn't spent)
      if (!g.infinite) g.mag = Math.min(magSize(g), g.mag + 1);
      const a = G.P.aim;
      pts.push({ x: x + Math.cos(a) * 2.2, y: y + Math.sin(a) * 2.2 });
    }
    FX.lightning(pts, d.color, 0.28, 0.2);
    for (let i = 1; i < pts.length; i++) FX.particle({ x: pts[i].x, y: pts[i].y, life: 0.25, size: 0.9, size1: 1.4, color: d.color, tex: FX.tex.elec, rot: Math.random() * 6 });
  }

  function updatePBullets(dt) {
    const P = G.P;
    for (let i = G.pbul.length - 1; i >= 0; i--) {
      const b = G.pbul[i];
      b.t += dt; b.life -= dt;
      // homing chip: steer gently toward the nearest enemy
      const homeK = (P.mods.homing || 0) + (b.visor ? 3 : 0); // 전술 조준 모드: strongly guided rounds
      if (homeK && b.kind === 'bullet') {
        let best = null, bd = b.visor ? 9 : 5;
        for (const e of G.enemies) { if (!e.alive || e.spawnT > 0 || b.hit.has(e)) continue; const d = Math.hypot(e.x - b.x, e.y + e.h * 0.42 - b.y); if (d < bd) { bd = d; best = e; } }
        if (best) {
          const sp = Math.hypot(b.vx, b.vy), a = Math.atan2(b.vy, b.vx), w = Math.atan2(best.y + best.h * 0.42 - b.y, best.x - b.x);
          const na = a + clamp(angDiff(a, w), -1, 1) * dt * 5 * homeK;
          b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp;
          b.s.rot = b.core.rot = na - Math.PI / 2;
        }
      }
      let dead = b.life <= 0;
      const steps = Math.ceil(Math.hypot(b.vx, b.vy) * dt / 0.25);
      for (let s = 0; s < steps && !dead; s++) {
        const ox = b.x, oy = b.y;
        b.x += b.vx * dt / steps; b.y += b.vy * dt / steps;
        const t = LEVEL.tile(b.x, b.y - 0.3);
        const solid = (x, y) => { const tt = LEVEL.tile(x, y - 0.3); return tt === LEVEL.WALL || tt === LEVEL.VOID || (LEVEL.cur.closed && LEVEL.cur.closed.has(Math.floor(y - 0.3) * LEVEL.cur.W + Math.floor(x))); };
        if (solid(b.x, b.y)) {
          FX.sparks(b.x, b.y, b.g.color, 4, 2, 0.08, 0.25);
          if (b.kind === 'bullet' && (b.bounces || 0) < P.mods.bounce) {
            // reflect off the wall face we crossed
            b.bounces = (b.bounces || 0) + 1;
            if (solid(ox, b.y)) b.vy = -b.vy; else b.vx = -b.vx;
            b.x = ox; b.y = oy; b.hit.clear(); b.life = Math.max(b.life, 0.35);
            if (P.syn.has('추적 도탄')) { let best = null, bd = 9; for (const e of G.enemies) { if (!e.alive || e.spawnT > 0) continue; const d = Math.hypot(e.x - b.x, e.y + e.h * 0.42 - b.y); if (d < bd) { bd = d; best = e; } } if (best) { const sp = Math.hypot(b.vx, b.vy), a = Math.atan2(best.y + best.h * 0.42 - b.y, best.x - b.x); b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp; } }
            b.s.rot = b.core.rot = Math.atan2(b.vy, b.vx) - Math.PI / 2;
            SFX.play('hitS', 0.25);
            continue;
          }
          dead = true;
          break;
        }
        if (t === LEVEL.PROP) { const pr = propAt(b.x, b.y - 0.3); if (pr) hurtProp(pr, b.dmg); dead = true; break; }
        for (const e of G.enemies) {
          if (!e.alive || e.spawnT > 0 || b.hit.has(e)) continue;
          // a vertical capsule over the body (feet to shoulders), so shots at a tall boss's upper half connect
          const lo = e.y + Math.min(e.r, e.h * 0.42), hi = e.y + Math.max(e.h * 0.42, e.h * 0.78 - e.r * 0.5);
          const dx = e.x - b.x, dy = clamp(b.y, lo, hi) - b.y, rr = e.r + 0.12;
          if (dx * dx + dy * dy > rr * rr) continue;
          b.hit.add(e);
          const sp = Math.hypot(b.vx, b.vy) || 1;
          if (b.kind === 'grenade' || b.kind === 'fireball') { dead = true; break; }
          if (b.sup) { e.supT = Math.max(e.supT || 0, b.sup); } // 견제 / 듀얼 버스트 rounds suppress what they hit
          if (b.markBonus && e.markT > 0) { b.dmg *= b.markBonus; b.markBonus = 0; } // 집속 사격: harder on marked targets (once per round)
          if (b.pointBlank && Math.hypot(e.x - P.x, e.y - P.y) < 2.2) { b.dmg *= 1.285; b.pointBlank = false; } // 근거리 포격: at arm's length
          if (P.mods.frost) { e.slowT = 1.5; FX.particle({ x: b.x, y: b.y, life: 0.3, size: 0.3, size1: 0.7, color: 0x9feaff, tex: FX.tex.snow, spin: 4 }); }
          const crit2 = b.crit || (P.syn.has('취약 노출') && e.slowT > 0 && Math.random() < 0.25);
          hurtEnemy(e, b.dmg * (crit2 && !b.crit ? 2 : 1), crit2, b.vx / sp * 0.7, b.vy / sp * 0.7, b.g.hitSnd || 'hitS');
          if (P.mods.chain && b.kind === 'bullet' && !b.child && Math.random() < P.mods.chain) arcChain(e, b.dmg * 0.6);
          if (P.mods.explo && b.kind === 'bullet' && (!b.child || P.syn.has('연쇄 폭발')) && Math.random() < P.mods.explo) miniBlast(b.x, b.y, b.dmg * 0.7, e);
          if (P.mods.split && !b.child && b.kind === 'bullet') {
            const a0 = Math.atan2(b.vy, b.vx);
            for (const da of [-0.6, 0.6]) {
              const c = spawnPBullet(P, { d: b.g }, b.x, b.y, a0 + da, sp * 0.8);
              c.child = true; c.dmg = b.dmg * 0.45; c.hit.add(e); c.pierce = P.syn.has('산개 관통') ? 1 : 0; c.life = 0.4;
              c.s.sz = c.s.size *= 0.7; c.core.sz = c.core.size *= 0.7;
            }
          }
          FX.hit(b.x, b.y, b.g.color, 0.7);
          if (b.g.hit) spawnStatic(b.g.hit, b.x, b.y, 0.1);
          if (b.pierce-- <= 0) { dead = true; break; }
        }
      }
      if (b.kind === 'fireball' && Math.random() < 0.8) FX.particle({ x: b.x + rnd(-0.1, 0.1), y: b.y + rnd(-0.1, 0.1), life: 0.35, size: 0.5, size1: 0.1, color: Math.random() < 0.5 ? 0xff5a1f : 0xffc050, tex: FX.tex.glow });
      else if (Math.random() < 0.5) FX.trail(b.x, b.y, b.g.color, b.g.size * 0.35);
      if (dead) {
        if (b.kind === 'grenade' || b.kind === 'fireball') explodeP(b);
        FX.kill(b.s); FX.kill(b.core);
        G.pbul.splice(i, 1);
      } else { b.s.x = b.core.x = b.x; b.s.y = b.core.y = b.y; }
    }
  }
  // 폭발 탄두: a small blast where a bullet lands (the struck enemy already took the bullet)
  function miniBlast(x, y, dmg, skip) {
    FX.explosion(x, y, 0.55, 0xffb040, false);
    SFX.play('expS', 0.45, panOf(x));
    for (const o of G.enemies) {
      if (!o.alive || o.spawnT > 0 || o === skip) continue;
      if (Math.hypot(o.x - x, o.y + o.h * 0.42 - y) < 1.25 + o.r) hurtEnemy(o, dmg, false, 0, 0, 'hitB');
    }
    damageProps(x, y, 1.0, dmg);
  }
  function explodeP(b) {
    const r = b.g.splash * (b.splashK || 1);
    FX.explosion(b.x, b.y, r * 0.55, b.g.color, b.kind === 'fireball');
    spawnStatic(b.g.hit, b.x, b.y, b.kind === 'fireball' ? 0.2 : 0.17);
    SFX.play(b.kind === 'fireball' ? 'expM' : 'expS', 0.8, panOf(b.x));
    if (G.opt.shake) FX.shake(0.14);
    for (const e of G.enemies) {
      if (!e.alive || e.spawnT > 0) continue;
      const d = Math.hypot(e.x - b.x, e.y + e.h * 0.42 - b.y);
      if (d < r + e.r) { const k = d < e.r + 0.3 ? 1 : 0.7; hurtEnemy(e, b.dmg * k, b.crit, (e.x - b.x) / (d || 1), (e.y - b.y) / (d || 1), b.kind === 'fireball' ? 'hitF' : 'hitB'); }
    }
    damageProps(b.x, b.y, r, b.dmg);
    if (b.kind === 'fireball') G.hazards.push({ x: b.x, y: b.y - 0.3, r: 1.3, t: 3.2, tick: 0, dmg: b.dmg * 0.18 });
  }

  // ── props (crates, barrels) ─────────────────────────────
  function buildProps(lv) {
    const crateT = LEVEL.loadTex('prop_crate'), faceT = LEVEL.loadTex('wall_face_d'), bt = barrelTex();
    lv.props.forEach((p) => {
      const g = new THREE.Group();
      if (p.kind === 'pillar') {
        // steel cover block: darker, blue-grey, indestructible
        const top = spriteMesh(faceT, 1, 1, { color: 0x4c5866 }); top.position.set(0.5, 1.05, 0);
        const fr = spriteMesh(faceT, 1, 0.55, { color: 0x323a44 }); fr.position.set(0.5, 0.275, 0);
        g.add(fr, top);
      } else if (p.kind === 'crate') {
        const top = spriteMesh(crateT, 1, 1, { color: 0x9aa4b0 }); top.position.set(0.5, 1.05, 0);
        const fr = spriteMesh(faceT, 1, 0.55, { color: 0x6c7480 }); fr.position.set(0.5, 0.275, 0);
        g.add(fr, top);
      } else {
        const m = spriteMesh(bt, 0.95, 1.2); m.position.set(0.5, 0.62, 0);
        g.add(m);
        p.glow = FX.sprite({ x: p.x + 0.5, y: p.y + 0.7, size: 1.4, color: 0xff3020, alpha: 0.18, tex: FX.tex.glow, order: 5 });
      }
      g.position.set(p.x, p.y, 0);
      g.children.forEach((c) => { c.renderOrder = ORD(p.y + 0.05); });
      p.mesh = g; p.alive = true;
      scene.add(g);
      G.props.push(p);
    });
    buildPropRim();
  }
  // solid crate clusters get a bright rim (top face + exposed sides + base line) and a ground shadow, so their
  // footprint reads clearly against the floor; rebuilt whenever a crate breaks
  function buildPropRim() {
    if (G.propRim) { killObj(G.propRim); G.propRim = null; }
    const grp = new THREE.Group();
    const crate = (x, y, k) => G.props.some((p) => p.alive && p.kind === k && p.x === x && p.y === y);
    const T = 0.06;
    let RIM = 0xffc84a;
    // every rim segment goes into one merged mesh per (crate row, opacity): a handful of draw calls for the whole floor
    const buckets = new Map(), tmp = new THREE.Color();
    const line = (x0, y0, x1, y1, ord, col = RIM, a = 0.9) => {
      const w = Math.max(T, Math.abs(x1 - x0)), h = Math.max(T, Math.abs(y1 - y0)), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      const key = ord + '|' + a;
      let bk = buckets.get(key); if (!bk) buckets.set(key, (bk = { ord, a, pos: [], col: [], idx: [] }));
      const n = bk.pos.length / 3;
      bk.pos.push(cx - w / 2, cy - h / 2, 0, cx + w / 2, cy - h / 2, 0, cx + w / 2, cy + h / 2, 0, cx - w / 2, cy + h / 2, 0);
      tmp.setHex(col); for (let k = 0; k < 4; k++) bk.col.push(tmp.r, tmp.g, tmp.b);
      bk.idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
    };
    (G.propShadows || []).forEach((s) => FX.kill(s)); G.propShadows = [];
    G.props.forEach((p) => {
      if (!p.alive || (p.kind !== 'crate' && p.kind !== 'pillar')) return;
      const { x, y } = p, ord = ORD(y + 0.05) + 0.0002, k = p.kind;
      RIM = k === 'pillar' ? 0x8fb4d8 : 0xffc84a; // steel blocks: a cool rim (they don't break), crates: warm
      const L = !crate(x - 1, y, k), R = !crate(x + 1, y, k), U = !crate(x, y + 1, k), D = !crate(x, y - 1, k);
      // top face (raised 0.55)
      if (U) line(x, y + 1.55, x + 1, y + 1.55, ord);
      if (L) line(x, y + 0.55, x, y + 1.55, ord);
      if (R) line(x + 1, y + 0.55, x + 1, y + 1.55, ord);
      if (D) line(x, y + 0.55, x + 1, y + 0.55, ord, 0xfff0b0, 0.7); // the top edge of the front face
      // front face sides and base
      if (L) line(x, y, x, y + 0.55, ord);
      if (R) line(x + 1, y, x + 1, y + 0.55, ord);
      if (D) {
        line(x, y, x + 1, y, ord);
        // contact shadow on the floor: a batched FX quad, not a mesh of its own
        G.propShadows.push(FX.sprite({ x: x + 0.5, y: y - 0.02, size: 1.5, aspect: 0.5 / 1.5, color: 0x000000, alpha: 0.5, tex: FX.tex.dot, normal: true, order: 3.2 }));
      }
    });
    buckets.forEach((bk) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(bk.pos, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(bk.col, 3));
      geo.setIndex(bk.idx);
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: bk.a, depthTest: false, depthWrite: false }));
      m.renderOrder = bk.ord; m.frustumCulled = false;
      grp.add(m);
    });
    scene.add(grp);
    G.propRim = grp;
  }
  function propAt(x, y) { const tx = Math.floor(x), ty = Math.floor(y); return G.props.find((p) => p.alive && p.x === tx && p.y === ty); }
  function hurtProp(p, dmg) {
    if (!p.alive || p.kind === 'pillar') return; // steel cover never breaks
    p.hp -= dmg;
    if (!(p.flash > 0)) p.mesh.children.forEach((c) => c.material.color.offsetHSL(0, 0, 0.12));
    p.flash = 0.06;
    if (p.hp > 0) return;
    p.alive = false;
    LEVEL.cur.tiles[p.y * LEVEL.cur.W + p.x] = LEVEL.FLOOR;
    killObj(p.mesh); p.mesh = null;
    if (p.glow) FX.kill(p.glow);
    if (p.kind === 'crate') buildPropRim();
    const cx = p.x + 0.5, cy = p.y + 0.5;
    if (p.kind === 'barrel') {
      /* a short fuse: a red warning ring first, the blast 0.45 s later (time to step away) */
      FX.ring(cx, cy, 0.3, 1.7, 0xff3a2a, 0.45, 0.8); FX.particle({ x: cx, y: cy + 0.3, life: 0.45, size: 1.4, size1: 2.2, color: 0xff4a2a, tex: FX.tex.glow, alpha: 0.6 }); SFX.play('warning', 0.5);
      FX.later(0.45, () => { if (G.phase !== 'play') return;
      FX.explosion(cx, cy, 1.3, 0xff6a2a, true);
      spawnStatic('simple_explosion', cx, cy, 0.22);
      SFX.play('expM');
      FX.shake(0.25);
      for (const e of G.enemies) { if (e.alive && e.spawnT <= 0 && Math.hypot(e.x - cx, e.y - cy) < 2.4 + e.r) hurtEnemy(e, 40, false, 0, 0); }
      if (!G.P.dead && Math.hypot(G.P.x - cx, G.P.y - cy) < 1.7) hurtPlayer('폭발', 2);
      FX.later(0.12, () => { if (G.phase === 'play') damageProps(cx, cy, 2.2, 30); });
      });
    } else {
      for (let i = 0; i < 8; i++) FX.particle({ x: cx + rnd(-0.4, 0.4), y: cy + rnd(-0.2, 0.5), vx: rnd(-3, 3), vy: rnd(1, 4), grav: 10, life: rnd(0.4, 0.7), size: rnd(0.12, 0.24), size1: 0.1, color: 0x7d8794, tex: FX.tex.white, normal: true, spin: rnd(-8, 8), order: ORD(cy) });
      FX.particle({ x: cx, y: cy, life: 0.5, size: 0.8, size1: 1.6, color: 0x55606c, frames: null, tex: FX.tex.dot, alpha: 0.5, normal: true, order: ORD(cy) });
      SFX.play('crate', 0.7);
      if (Math.random() < 0.3) dropPickup(cx, cy, 'gold', 1 + Math.floor(Math.random() * 3));
    }
  }
  function updatePropFlash(dt) {
    for (const p of G.props) if (p.flash > 0) { p.flash -= dt; if (p.flash <= 0 && p.mesh) p.mesh.children.forEach((c) => c.material.color.offsetHSL(0, 0, -0.12)); }
  }
  function damageProps(x, y, r, dmg) { G.props.forEach((p) => { if (p.alive && Math.hypot(p.x + 0.5 - x, p.y + 0.5 - y) < r + 0.5) hurtProp(p, dmg); }); }
  function hitPropsOnLine(x0, y0, x1, y1, dmg) {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 0.3), seen = new Set();
    for (let i = 0; i <= n; i++) { const p = propAt(x0 + (x1 - x0) * i / n, y0 - 0.3 + (y1 - y0) * i / n); if (p && !seen.has(p)) { seen.add(p); hurtProp(p, dmg); } }
  }

  // ── original baked effects ─────────────────────────────
  function spawnStatic(name, x, y, k, face = 1) {
    if (!name || !FXB.ready(name) || G.statics.length > 40) { if (name && !FXB.ready(name)) FXB.prepare(name); return; }
    const inst = FXB.create(name);
    if (!inst) return;
    inst.root.position.set(x, y, 0);
    inst.root.scale.set(k * face, k, 1);
    inst.setOrder(L.FX);
    scene.add(inst.root);
    G.statics.push(inst);
  }

  // ── enemies ──────────────────────────────────────────────
  const FLOOR_BOSS_HP = [860, 1250, 1800, 2800, 4200, 6400]; // a smoother step at B2 (the first "any boss" floor)
  function spawnEnemy(defKey, x, y, opts = {}) {
    const def = ENEMIES[defKey] || ELITES[defKey] || BOSSES[defKey];
    const F = FLOORS[G.fi];
    const hpMul = (opts.boss ? FLOOR_BOSS_HP[G.fi] * clamp(def.hp / 1300, 0.8, G.fi <= 2 ? 1.0 : 1.25) / def.hp : F.hpMul * (1 + G.stats.roomsCleared * 0.005)) * (1 + (G.heat || 0) * 0.15);
    const e = {
      key: defKey, def, x, y, r: def.r, h: def.h, hp: def.hp * hpMul, maxHp: def.hp * hpMul, alive: true, spawnT: opts.boss ? 0 : 0.9,
      fireT: rnd(0.8, 1.6) * (def.rate || 2), t: 0, vx: 0, vy: 0, kx: 0, ky: 0, flash: 0, face: -1, seq: [], state: 'idle', stun: 0,
      elite: !!def.elite, boss: !!opts.boss, wander: Math.random() * TAU, strafe: Math.random() < 0.5 ? 1 : -1, burn: 0,
    };
    e.body = makeBody(def.rig, def.h, null, true);
    if (!e.body) {
      e.ph = FX.sprite({ x, y: y + def.h * 0.4, size: def.h * 0.9, color: 0xff3355, alpha: 0.55, tex: FX.tex.glow, order: 5 });
      SD.prepare(def.rig).then(() => {
        if (!e.alive || e.body) return;
        e.body = makeBody(def.rig, def.h, null, true);
        if (e.body) { scene.add(e.body.root); if (e.ph) { FX.kill(e.ph); e.ph = null; } }
      });
    }
    if (e.body) {
      scene.add(e.body.root);
      e.body.root.visible = e.spawnT <= 0;
      if (e.elite) e.body.c.setTint(1.15, 0.85, 0.85);
      if (def.tint) e.body.c.setTint(...def.tint);
    }
    e.shadow = FX.sprite({ x, y, size: def.r * 2.4, aspect: 0.32, color: 0x000000, alpha: 0.55, tex: FX.tex.dot, normal: true, order: 3 });
    if (e.spawnT > 0) {
      e.mark = FX.sprite({ x, y, size: def.r * 3, color: e.elite ? 0xffa020 : 0xff3355, alpha: 0.8, tex: FX.tex.ring, order: 4, spin: 3 });
      FX.ring(x, y + 0.2, 1.4, 0.3, 0xff3355, 0.8, 0.7);
    }
    if (e.elite || e.boss) { e.aura = FX.sprite({ x, y: y + def.h * 0.4, size: def.h * 1.6, color: def.aura || (e.boss ? 0xff2030 : 0xff8a20), alpha: def.aura ? 0.2 : 0.16, tex: FX.tex.glow, order: 5 }); }
    if (!e.boss && !e.elite) {
      e.barBg = FX.sprite({ x, y, size: 0.84, aspect: 0.1 / 0.84, color: 0x000000, alpha: 0, tex: FX.tex.white, normal: true, order: L.PROJ - 2 });
      e.bar = FX.sprite({ x, y, size: 0.8, aspect: 0.06 / 0.8, color: 0xff3b3b, alpha: 0, tex: FX.tex.white, normal: true, order: L.PROJ - 1 });
    }
    G.enemies.push(e);
    return e;
  }
  function disposeEnemy(e) {
    e.alive = false; // a rig that finishes loading later must not attach to a disposed enemy
    if (e.body) e.body.c.dispose();
    if (e.body) scene.remove(e.body.root);
    [e.shadow, e.mark, e.aura, e.bar, e.barBg, e.teleS, e.markS, e.ph].forEach((s) => s && FX.kill(s));
  }

  function hurtEnemy(e, dmg, crit, kx, ky, snd) {
    if (!e.alive || e.spawnT > 0 || e.intro > 0) return;
    if (G.P && G.P.dead) return; // turrets, burn zones, late shells: nothing scores after the hero has fallen
    if (e.markT > 0) dmg *= 1.5;
    if (e.supT > 0) dmg *= 1.15 * (G.P && G.P.hero.id === 'leprechaun' ? 1.2 : G.P && G.P.hero.id === 'blacklilith' ? 1.29 : 1); // 제압 / 견제: a suppressed target takes more (레프리콘 +38 %, 블랙 리리스 +48 % in total)
    if (e.room) e.room.lastHitT = G.t;
    if (e.boss && e.body && !(e.hitPulse > 0)) { e.hitPulse = 0.12; const r0 = e.body.root; r0.scale.set(1.04, 0.97, 1); FX.later(0.06, () => r0.scale.set(1, 1, 1)); FX.sparks(e.x + rnd(-0.4, 0.4), e.y + e.h * rnd(0.3, 0.7), 0xffe0a0, 3, 3, 0.1, 0.2); }
    if (e.boss) {
      const floor = e.phase === 0 && e.phaseT < 8 ? 0.665 : e.phase === 1 && e.phaseT < 8 ? 0.335 : e.phase === 2 && e.phaseT < 7 ? 0.03 : 0;
      if (floor && e.hp - dmg < e.maxHp * floor) {
        dmg = Math.max(0, e.hp - e.maxHp * floor);
        if (!(e.guardFx > 0)) { e.guardFx = 0.25; FX.sparks(e.x, e.y + e.h * 0.5, 0x7fe3ff, 6, 3, 0.12, 0.3); SFX.play('shield', 0.35); }
      }
    }
    if (G.P && G.P.up.p_last && G.P.hp <= 2) dmg *= 1.4;
    if (G.P && G.P.adrT > 0) dmg *= 1.35; // 아드레날린 주입기: just after a roll
    if (G.P && G.P.overdrive > 0 && G.P.odDmg) dmg *= G.P.odDmg; // 전술 조준 모드 / 거치 사격
    if (G.P && G.P.chargeT > 0) dmg *= G.P.chargeDmg || 1; // 흡수 방벽 charge
    if (G.P && !e.dummy) { /* item damage modifiers */
      const pm = G.P.mods;
      if (pm.berserk && G.P.hp * 2 <= G.P.maxHp) dmg *= 1.3;
      if (pm.kinetic && G.P.moving) dmg *= pm.kinetic;
      if (pm.execute) { if (!e.boss && e.hp - dmg < e.maxHp * 0.15) dmg = Math.max(dmg, e.hp); else if (e.boss && e.hp < e.maxHp * 0.3) dmg *= 1.2; }
    }
    e.hp -= dmg;
    e.flash = 0.07;
    if (!(e.sparkT > G.t)) { e.sparkT = G.t + 0.07; FX.sparks(e.x + rnd(-0.2, 0.2), e.y + e.h * rnd(0.35, 0.65), crit ? 0xffe066 : 0xfff2d0, crit ? 6 : 3, crit ? 4.5 : 3.2, 0.08, 0.18); } /* every connecting hit throws a small spark (throttled per enemy) */
    e.kx += kx * (e.boss ? 0.05 : e.elite ? 0.25 : 1); e.ky += ky * (e.boss ? 0.05 : e.elite ? 0.25 : 1);
    G.stats.dmg += dmg;
    const P = G.P;
    SFX.play(crit ? 'hitB' : snd || 'hitM', crit ? 0.8 : 0.5, panOf(e.x));
    const wasReady = P.skill >= 100;
    if (!(P.ultT > 0 || P.overdrive > 0)) P.skill = Math.min(100, P.skill + dmg * 0.075 * P.mods.skill * (e.boss ? 0.7 : 1)); // no charge while the ultimate runs
    if (!wasReady && P.skill >= 100) { tip('ult', `궁극기 — ${P.hero.skillName}`, `${P.hero.skillDesc} · 적에게 피해를 줄수록 다시 충전됩니다`); SFX.play('rankUp', 0.7); UI.toast(`궁극기 준비 완료 — ${P.hero.skillName} (${INPUT.isTouch ? '스킬 버튼' : UI.K('skill')})`, 'gem'); FX.ring(P.x, P.y + 0.8, 0.3, 1.8, heroHex(P), 0.5); }
    // fast guns: hits on one enemy merge into one number every 0.15 s (crits pop at once)
    if (G.opt.dmg) {
      // crits pop at once — except on bosses, where they merge too (a boss eats dozens of hits a second)
      { e.dmgAcc = (e.dmgAcc || 0) + dmg; e.dmgCrit = e.dmgCrit || crit; if (!(e.dmgT > 0)) e.dmgT = e.boss ? 0.9 : 0.35; } // every hit (crits too) merges into one number per window: no piles
    }
    // (the boss bar refreshes on its own 120 ms timer: no DOM write per hit)
    if (e.hp <= 0) killEnemy(e);
  }
  // 연쇄 방전기: a spark jumps from the struck enemy to the nearest other one
  function arcChain(src, dmg) {
    let best = null, bd = 4.5;
    for (const o of G.enemies) { if (!o.alive || o === src || o.spawnT > 0 || o.dummy) continue; const d = Math.hypot(o.x - src.x, o.y - src.y); if (d < bd) { bd = d; best = o; } }
    if (!best) return;
    const y0 = src.y + src.h * 0.5, y1 = best.y + best.h * 0.5;
    for (let i = 0; i <= 6; i++) { const f = i / 6; FX.particle({ x: src.x + (best.x - src.x) * f + rnd(-0.15, 0.15), y: y0 + (y1 - y0) * f + rnd(-0.15, 0.15), life: 0.18, size: 0.35, size1: 0.1, color: 0x8fe8ff, tex: FX.tex.glow, alpha: 0.9 }); }
    if (G.P.syn.has('초전도')) best.slowT = 1.5;
    hurtEnemy(best, dmg, false, 0, 0, 'hitE');
  }
  // off-screen threat arrows: live enemies outside the view get a pip on the screen edge pointing at them
  let edgeLay = null;
  function edgeArrows() {
    if (!edgeLay) {
      edgeLay = document.createElement('div'); edgeLay.id = 'edgeArrows'; edgeLay.setAttribute('aria-hidden', 'true');
      for (let i = 0; i < 6; i++) { const d = document.createElement('i'); d.hidden = true; edgeLay.appendChild(d); }
      (document.getElementById('hud') || document.body).appendChild(edgeLay);
    }
    const w = view.w, h = view.h, m = 22, cx = w / 2, cy = h / 2;
    let n = 0;
    if (G.room && G.room.active && G.phase === 'play') {
      for (const e of G.enemies) {
        if (n >= 6) break;
        if (!e.alive || e.spawnT > 0 || e.dummy) continue;
        const [sx, sy] = worldToScreen(e.x, e.y + e.h * 0.5);
        if (sx >= 0 && sx <= w && sy >= 0 && sy <= h) continue;
        const dx = sx - cx, dy = sy - cy;
        const k = Math.min((cx - m) / Math.max(1e-3, Math.abs(dx)), (cy - m) / Math.max(1e-3, Math.abs(dy)));
        const d = edgeLay.children[n++];
        d.style.transform = `translate(${Math.round(cx + dx * k)}px, ${Math.round(cy + dy * k)}px) rotate(${Math.atan2(dy, dx).toFixed(2)}rad)`;
        const big = !!(e.boss || e.elite);
        if (d._big !== big) { d._big = big; d.classList.toggle('big', big); }
        if (d.hidden) d.hidden = false;
      }
    }
    for (let i = n; i < edgeLay.children.length; i++) if (!edgeLay.children[i].hidden) edgeLay.children[i].hidden = true;
  }
  function killEnemy(e, silent) {
    e.alive = false;
    if (e.dummy) silent = true; // training targets are not kills
    if (e.dmgAcc && G.opt.dmg) { UI.dmg(e.x, e.y + e.h * 0.8, e.dmgAcc, false); e.dmgAcc = 0; }
    if (silent) { e.noReward = true; } else {
      G.stats.kills++;
      if (!e.boss) gainXp(e.elite ? 10 : 3 + G.fi);
      if (e.room && e.room.chMode === 'hunt' && e.room.active) e.room.chKills = (e.room.chKills || 0) + 1;
    }
    const cy = e.y + e.h * 0.4;
    if (e.boss) return bossDeath(e);
    if (e.elite && !silent) G.slowT = Math.max(G.slowT || 0, 0.12); /* a short hit-stop on elite kills */
    FX.deathFx(e.x, cy, false);
    FX.explosion(e.x, cy, e.elite ? 1.0 : 0.55, 0xff7a3a, e.elite);
    spawnStatic('simple_explosion', e.x, cy, e.elite ? 0.2 : 0.13);
    SFX.play(e.elite ? 'expM' : 'expS', e.elite ? 1 : 0.6, panOf(e.x));
    SFX.play(e.elite ? 'dieL' : e.h >= 1.6 ? 'dieM' : 'dieS', 0.8, panOf(e.x));
    if (G.opt.shake) FX.shake(e.elite ? 0.3 : 0.08);
    // loot (a silent removal — self-destruct, timeout cleanup, training end — drops and heals nothing)
    const P = G.P;
    if (!silent) {
    const gold = e.noReward ? 0 : Math.round(e.def.gold * 0.5 * (P.mods.lucky ? 1.5 : 1) * rnd(0.6, 1.2));
    if (gold) dropPickup(e.x, e.y, 'gold', gold);
    if (Math.random() < BAL.heartDrop * (e.elite ? 4 : 1) * Math.max(0.2, 1 - G.fi * 0.17)) dropPickup(e.x, e.y, 'half'); // healing thins out with depth
    if (Math.random() < BAL.ammoDrop * 0.5) dropPickup(e.x, e.y, 'ammo');
    if (e.elite && Math.random() < 0.6) dropPickup(e.x, e.y, 'key');
    if (P.mods.overclock) P.ocT = 3;
    if (P.mods.vamp && Math.random() < 0.06 * (P.mods.vampX || 1) && P.hp < P.maxHp) { P.hp++; FX.ring(P.x, P.y + 0.6, 0.2, 1, 0xff4060, 0.4); SFX.play('reinforce', 0.5); }
    if (P.hero.id === 'nymph' && mastery(P, curGun()) && Math.random() < 0.2) P.rollCd = 0;
    if (P.up.p_leech && Math.random() < 0.05 && P.hp < P.maxHp) { P.hp++; FX.ring(P.x, P.y + 0.6, 0.2, 1.1, 0xff4060, 0.45); SFX.play('reinforce', 0.45); }
    if (P.up.p_chain && !e.boss && Math.random() < 0.4) {
      const ex = e.x, ey = e.y + e.h * 0.4;
      FX.later(0.12, () => {
        FX.explosion(ex, ey, 0.9, 0xffa040, false); SFX.play('expS', 0.6);
        for (const o of G.enemies) if (o.alive && o !== e && o.spawnT <= 0 && Math.hypot(o.x - ex, o.y + o.h * 0.4 - ey) < 1.8 + o.r) hurtEnemy(o, 18 * P.mods.dmg, false, 0, 0, 'hitB');
      });
    }
    }
    // dying rig: play the original death clip and fade
    if (e.body) {
      const c = e.body.c;
      if (c.has('die')) c.play('die'); else c.play('idle');
      c.setTint(0.6, 0.35, 0.35);
      G.corpses.push({ e, t: 0 });
    }
    [e.shadow, e.mark, e.aura, e.bar, e.barBg, e.markS, e.ph, e.teleS].forEach((s) => s && FX.kill(s));
    e.shadow = e.mark = e.aura = e.bar = e.barBg = e.markS = e.ph = e.teleS = null;
    if (e.elite) UI.hideBoss();
  }

  // enemy bullets ─────────────────────────────────────────
  const BSPD = [0.95, 0.98, 1.0, 1.03, 1.07, 1.1]; // enemy bullet speed per floor
  const DENS = [0.44, 0.6, 0.7, 0.96, 1.2, 1.4]; // boss bullet density per floor
  // enemy bullets keep to warm / violet hues so they never read as the player's yellow-cyan tracers
  const EB_COL = { n: 0xff2d6a, o: 0xff3fb8, b: 0xb06bff, y: 0xff5fe0, p: 0xc35bff }; /* every enemy shot sits in the pink-violet family: warm amber belongs to the player */
  // high-contrast option: one saturated magenta family, larger dark rim (red-green / blue-yellow safe)
  // high contrast: white shells with a heavy black rim and a red pip — unlike any (coloured) player tracer, readable for every colour vision
  const EB_CB = { n: 0xffffff, o: 0xffffff, b: 0xffffff, y: 0xffffff, p: 0xffffff };
  function styleEB(b) {
    const cb = G.opt.cbBullets, size = b.size0;
    b.col = cb ? 0xffffff : EB_COL[b.ck];
    b.s.color = b.col;
    b.ol.size = b.ol.sz = size * (cb ? 2.7 : 2.15); b.ol.color = cb ? 0x000000 : 0x0c0208; b.ol.alpha = cb ? 1 : 0.92; /* a dark rim on every enemy shot, so pink reads even over a magenta boss */
    b.core.color = cb ? 0xff1030 : 0xffffff;
    /* high contrast: a black shell with a bright red pip and only a faint white halo, so bloom never merges a crowd of shots into a white blob over the boss or the hero */
    b.s.size = b.s.sz = size * (cb ? 1.7 : 2.3); if (!b.delay) b.s.alpha = cb ? 0.32 : 0.95;
    b.core.size = b.core.sz = size * (cb ? 1.05 : 0.95);
  }
  function recolorBullets() { G.ebul.forEach(styleEB); }
  function ebullet(x, y, ang, speed, o = {}) {
    if (G.ebul.length > 640) return null; // a high ceiling: patterns are density-scaled, so this only guards runaway cases
    const cb = G.opt.cbBullets, col = (cb ? EB_CB : EB_COL)[o.c || 'n'], size = o.size || 0.3;
    const b = {
      x, y, vx: Math.cos(ang) * speed * BSPD[G.fi] * (1 + (G.heat || 0) * 0.04), vy: Math.sin(ang) * speed * BSPD[G.fi] * (1 + (G.heat || 0) * 0.04), r: size * 0.55, life: o.life || 6, t: 0,
      src: G.shooter, acc: o.acc || 0, homing: o.homing || 0, curve: o.curve || 0, delay: o.delay || 0,
      ol: FX.sprite({ x, y, size: size * (cb ? 2.4 : 2.15), color: cb ? 0x000000 : 0x0c0208, alpha: cb ? 1 : 0.92, tex: FX.tex.dot, normal: true, order: L.PROJ + 0.9 }),
      s: FX.sprite({ x, y, size: size * 2.3, color: col, alpha: 0.95, tex: FX.tex.glow, order: L.PROJ + 1 }),
      core: FX.sprite({ x, y, size: size * 0.95, color: 0xffffff, alpha: 1, tex: FX.tex.glow, order: L.PROJ + 1.1 }),
      col,
    };
    const streak = o.c === 'b' || o.c === 'y' || speed >= 7.5;
    if (streak || o.homing) {
      const r = ang - Math.PI / 2;
      b.s.aspect = o.homing ? 1.5 : 2.1; b.core.aspect = o.homing ? 1.7 : 2.6; b.ol.aspect = 1.8; b.s.rot = b.core.rot = b.ol.rot = r; b.streak = true;
    } else if (o.c === 'p') { b.core.tex = null; FX.setTex(b.core, FX.tex.white); b.core.rot = Math.PI / 4; b.core.sz = b.core.size = size * 0.6; b.spin = 4; }
    b.ck = o.c || 'n'; b.size0 = size;
    if (cb) styleEB(b);
    b.delay = b.delay || 0;
    if (b.delay) { b.s.alpha = 0.4; b.core.alpha = 0.3; b.ol.alpha = 0.3; }
    G.ebul.push(b);
    return b;
  }
  // O(1) removal: the last bullet fills the hole (order doesn't matter; loops run backwards and mark their pass)
  function ebRemove(i) { const last = G.ebul.pop(); if (i < G.ebul.length) G.ebul[i] = last; }
  function popEB(b, quiet) {
    FX.kill(b.s); FX.kill(b.core); FX.kill(b.ol);
    if (!quiet) FX.particle({ x: b.x, y: b.y, life: 0.18, size: 0.35, size1: 0.7, color: b.col, tex: FX.tex.ring, alpha: 0.8 });
  }
  function updateEBullets(dt) {
    const P = G.P;
    const hx = P.x, hy = P.y + 0.42;
    const pass = (G.ebPass = (G.ebPass || 0) + 1);
    for (let i = G.ebul.length - 1; i >= 0; i--) {
      const b = G.ebul[i];
      if (!b) continue; // a blank / death cleared the list during this pass
      if (b.pass === pass) continue; // a splice mid-pass shifted an already-moved bullet down: never step it twice
      b.pass = pass;
      b.t += dt;
      if (b.delay > 0) { b.delay -= dt; if (b.delay <= 0) { const cbm = G.opt.cbBullets; b.s.alpha = cbm ? 0.32 : 0.95; b.core.alpha = 1; b.ol.alpha = cbm ? 1 : 0.92; } else continue; }
      b.life -= dt;
      if (b.homing && !P.dead) {
        const sp = Math.hypot(b.vx, b.vy), a = Math.atan2(b.vy, b.vx), w = Math.atan2(hy - b.y, hx - b.x);
        const na = a + clamp(angDiff(a, w), -1, 1) * dt * b.homing;
        b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp;
      }
      if (b.curve) { const a = Math.atan2(b.vy, b.vx) + b.curve * dt, sp = Math.hypot(b.vx, b.vy); b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp; }
      if (b.acc) { const sp = Math.hypot(b.vx, b.vy), k = Math.max(0.2, (sp + b.acc * dt) / (sp || 1)); b.vx *= k; b.vy *= k; }
      const ox = b.x, oy = b.y;
      b.x += b.vx * dt; b.y += b.vy * dt;
      const t = LEVEL.tile(b.x, b.y - 0.3);
      const door = LEVEL.cur.closed && LEVEL.cur.closed.has(Math.floor(b.y - 0.3) * LEVEL.cur.W + Math.floor(b.x));
      let dead = b.life <= 0 || t === LEVEL.WALL || t === LEVEL.VOID || door;
      if (t === LEVEL.PROP) { const pr = propAt(b.x, b.y - 0.3); if (pr && pr.kind === 'crate') hurtProp(pr, 2); dead = true; }
      if (!dead && P.orbs && !P.dead) {
        const rr = (P.mods.orbit >= 3 ? 0.42 : 0.34) + b.r;
        for (const o of P.orbs) if (!o.hidden && (o.x - b.x) * (o.x - b.x) + (o.y - b.y) * (o.y - b.y) < rr * rr) { dead = true; FX.particle({ x: b.x, y: b.y, life: 0.2, size: 0.3, size1: 0.8, color: 0x9feaff, tex: FX.tex.ring, alpha: 0.8 }); break; }
      }
      if (!dead && !P.dead && P.iframe <= 0) {
        // swept test: the closest point of this frame's path, so fast shots can't tunnel through at low FPS
        const sx = b.x - ox, sy = b.y - oy, sl = sx * sx + sy * sy;
        const k = sl > 0 ? clamp(((hx - ox) * sx + (hy - oy) * sy) / sl, 0, 1) : 1;
        const dx = ox + sx * k - hx, dy = oy + sy * k - hy, rr = b.r + 0.1; /* closer to the drawn core: grazes that look clear are clear */
        if (dx * dx + dy * dy < rr * rr) { dead = true; hurtPlayer(b.src ? (G.bossE && G.bossE.alive && b.src === G.bossE.def.name ? `${b.src}의 탄막` : `${b.src}의 공격`) : '적의 공격'); /* credited to the shooter, not always the boss */ if (G.ebul[i] !== b) continue; }
      }
      if (dead) { popEB(b, b.life <= 0); ebRemove(i); continue; }
      b.s.x = b.core.x = b.ol.x = b.x; b.s.y = b.core.y = b.ol.y = b.y;
      if (b.streak && (b.homing || b.curve)) b.s.rot = b.core.rot = b.ol.rot = Math.atan2(b.vy, b.vx) - Math.PI / 2;
      if (b.spin) b.core.rot += b.spin * dt;
      if (b.homing && Math.random() < 0.5) FX.particle({ x: b.x, y: b.y, life: 0.3, size: 0.25, size1: 0, color: 0xff4fd0, /* enemy family, not the player's amber */ tex: FX.tex.dot, alpha: 0.6 });
      // a gentle pulse so bullets read against busy floors
      b.s.sz = b.s.size * (1 + 0.12 * Math.sin(b.t * 18));
    }
  }
  function clearEBullets(ring) {
    for (const b of G.ebul) popEB(b, !ring);
    G.ebul.length = 0;
  }

  // patterns: e = shooter, a = angle to the player
  // enemies aim at the hero — or at Constantia's hologram decoy while it stands
  function aimAt(e, ox = 0, oy = 0) { const T = G.P; return Math.atan2(T.y + 0.42 - (e.y + e.h * 0.45 + oy), T.x - (e.x + ox)) + (e.blindT > 0 ? rnd(-0.55, 0.55) : 0); } // 적중 감소: a blinded shooter's aim scatters
  function emitFan(e, n, spread, speed, o = {}) {
    const a0 = o.ang != null ? o.ang : aimAt(e), cy = e.y + e.h * 0.45;
    for (let i = 0; i < n; i++) ebullet(e.x, cy, a0 + (n > 1 ? (i / (n - 1) - 0.5) * spread : 0), speed, o);
  }
  function emitRing(e, n, speed, o = {}) {
    const a0 = o.ang != null ? o.ang : Math.random() * TAU, cy = e.y + e.h * 0.45;
    for (let i = 0; i < n; i++) ebullet(e.x, cy, a0 + i * TAU / n, speed, o);
  }
  // flow field over the current room toward the player's tile (rebuilt when she changes tile): enemies that can't
  // see her walk around cover instead of pressing into it
  const flow = { key: '', r: null, d: null };
  function flowBuild() {
    const r = G.room, P = G.P;
    if (!r || !P) return null;
    const px = Math.floor(P.x), py = Math.floor(P.y), key = r.id + ':' + px + ',' + py;
    if (flow.key === key) return flow;
    const x0 = r.x0 - 1, y0 = r.y0 - 1, w = r.w + 2, h = r.h + 2, d = new Int16Array(w * h).fill(-1);
    flow.key = key; flow.r = { x0, y0, w, h }; flow.d = d;
    if (px < x0 || py < y0 || px >= x0 + w || py >= y0 + h) return flow;
    const q = [(py - y0) * w + (px - x0)]; d[q[0]] = 0;
    for (let i = 0; i < q.length; i++) {
      const c = q[i], cx = c % w, cy = (c / w) | 0;
      for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + ax, ny = cy + ay;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const j = ny * w + nx;
        if (d[j] >= 0 || LEVEL.blockedT(nx + x0, ny + y0)) continue;
        d[j] = d[c] + 1; q.push(j);
      }
    }
    return flow;
  }
  function flowDir(e) {
    const f = flowBuild();
    if (!f || !f.d) return null;
    const { x0, y0, w, h } = f.r, tx = Math.floor(e.x) - x0, ty = Math.floor(e.y) - y0;
    if (tx < 0 || ty < 0 || tx >= w || ty >= h) return null;
    let best = null, bd = f.d[ty * w + tx] >= 0 ? f.d[ty * w + tx] : 1e9;
    for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const nx = tx + ax, ny = ty + ay;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const v = f.d[ny * w + nx];
      if (v < 0 || v >= bd) continue;
      if (ax && ay && (LEVEL.blockedT(tx + x0 + ax, ty + y0) || LEVEL.blockedT(tx + x0, ty + y0 + ay))) continue; // no corner cutting
      bd = v; best = [ax, ay];
    }
    if (!best) return null;
    const gx = Math.floor(e.x) + best[0] + 0.5 - e.x, gy = Math.floor(e.y) + best[1] + 0.5 - e.y, l = Math.hypot(gx, gy) || 1;
    return [gx / l, gy / l];
  }
  function later(e, t, fn) { e.seq.push({ t, fn: () => { G.shooter = e.def.name; fn(); } }); }
  const PATTERNS = {
    aimed: (e) => { emitFan(e, 1, 0, 6.5); },
    spread3: (e) => { emitFan(e, 3, 0.5, 6); },
    spread5: (e) => { emitFan(e, 5, 0.9, 5.6); },
    burst3: (e) => { for (let i = 0; i < 3; i++) later(e, i * 0.14, () => emitFan(e, 1, 0, 7.5)); },
    burst5: (e) => { for (let i = 0; i < 5; i++) later(e, i * 0.1, () => emitFan(e, 1, 0, 8, { c: 'o', size: 0.26 })); },
    ring8: (e) => { emitRing(e, 8, 4.8); },
    ring12: (e) => { emitRing(e, 12, 5, { c: 'o' }); later(e, 0.35, () => emitRing(e, 12, 4, { c: 'o' })); },
    ring16: (e) => { emitRing(e, 16, 4.4, { size: 0.36 }); later(e, 0.5, () => emitFan(e, 3, 0.3, 7)); },
    spiral: (e) => { const a0 = Math.random() * TAU; for (let i = 0; i < 18; i++) later(e, i * 0.07, () => { emitRing(e, 3, 4.6, { ang: a0 + i * 0.32, c: 'p' }); }); },
    snipe: (e) => {
      e.tele = { t: 0.75, a: aimAt(e) };
      SFX.play('eRoar', 0.45, panOf(e.x));
      later(e, 0.75, () => { emitFan(e, 1, 0, 15, { ang: e.tele ? e.tele.a : aimAt(e), size: 0.3, c: 'y' }); e.tele = null; SFX.play('handgun', 0.5); });
    },
    wave: (e) => { const a = aimAt(e); for (let i = 0; i < 9; i++) later(e, i * 0.05, () => ebullet(e.x, e.y + e.h * 0.45, a - 0.8 + i * 0.2, 5.2, { c: 'b' })); },
    cross: (e) => { const a0 = Math.random() * TAU; for (let w = 0; w < 3; w++) later(e, w * 0.3, () => emitRing(e, 4, 5, { ang: a0 + w * 0.25, size: 0.36 })); },
    homing: (e) => { for (let i = 0; i < 2; i++) later(e, i * 0.3, () => emitFan(e, 1, 0, 3.6, { ang: aimAt(e) + (i ? 0.8 : -0.8), homing: 2.2, life: 4.5, c: 'o', size: 0.4 })); },
    eliteA: (e) => { const k = clamp(0.7 + G.fi * 0.07, 0.7, 1); emitFan(e, Math.round(7 * k), 1.1, 5.5, { c: 'o' }); later(e, 0.45, () => emitRing(e, Math.round(14 * k), 4.2)); later(e, 0.9, () => emitFan(e, Math.round(7 * k), 1.1, 5.5, { c: 'o' })); }, // grows with depth
    // (elite spirals grow with depth: the Fortress no longer arrives at B2-B3 with its B6 density)
    eliteB: (e) => { const a0 = Math.random() * TAU, n = Math.round(24 * clamp(0.62 + G.fi * 0.08, 0.6, 1)); for (let i = 0; i < n; i++) later(e, i * 0.08, () => { emitRing(e, 2, 4.4, { ang: a0 + i * 0.27, c: 'p' }); emitRing(e, 2, 4.4, { ang: -a0 - i * 0.27, c: 'b' }); }); },
    eliteC: (e) => { for (let k = 0; k < 3; k++) later(e, k * 0.4, () => emitFan(e, 5, 0.8, 5.6 + k * 0.6, { c: 'n', size: 0.3 })); },
  };

  function updateEnemies(dt) {
    const P = G.P;
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      const e = G.enemies[i];
      if (!e.alive) { G.enemies.splice(i, 1); continue; }
      e.t += dt;
      if (e.spawnT > 0) {
        e.spawnT -= dt;
        if (e.mark) { e.mark.alpha = 0.4 + 0.4 * Math.sin(e.t * 20); }
        if (e.spawnT <= 0) {
          if (e.mark) { FX.kill(e.mark); e.mark = null; }
          if (e.body) e.body.root.visible = true;
          FX.particle({ x: e.x, y: e.y + e.h * 0.4, life: 0.35, size: e.h, size1: e.h * 1.8, color: 0xff4060, tex: FX.tex.glow, alpha: 0.7 });
          FX.ring(e.x, e.y + 0.1, 0.2, e.r * 3, 0xff4060, 0.35);
        }
        continue;
      }
      if (e.markT > 0) {
        e.markT -= dt;
        if (!e.markS) e.markS = FX.sprite({ x: e.x, y: e.y, size: e.r * 2.6, color: 0xff3d6d, alpha: 0.9, tex: FX.tex.ring, order: L.PROJ - 2, spin: 2 });
        e.markS.x = e.x; e.markS.y = e.y + e.h * 0.45; e.markS.rot += dt * 2; e.markS.hidden = false;
        if (e.markT <= 0) e.markS.hidden = true;
      }
      if (e.dmgT > 0) { e.dmgT -= dt; if (e.dmgT <= 0 && e.dmgAcc) { UI.dmg(e.x, e.y + e.h * 0.8, e.dmgAcc, !!e.dmgCrit); e.dmgAcc = 0; e.dmgCrit = false; } }
      if (e.boss) { updateBoss(e, dt); continue; }
      e.flash = Math.max(0, e.flash - dt);
      if (e.dummy) { e.face = P.x < e.x ? -1 : 1; continue; } // training target: rooted, never fires
      if (e.stun > 0) { e.stun -= dt; }
      // burn zones
      // knockback
      if (e.kx || e.ky) { LEVEL.move(e, e.kx * dt * 6, e.ky * dt * 6); e.kx *= Math.max(0, 1 - dt * 10); e.ky *= Math.max(0, 1 - dt * 10); if (Math.abs(e.kx) + Math.abs(e.ky) < 0.02) e.kx = e.ky = 0; }
      // scheduled shots
      for (let k = e.seq.length - 1; k >= 0; k--) { e.seq[k].t -= dt; if (e.seq[k].t <= 0) { const f = e.seq[k].fn; e.seq.splice(k, 1); if (e.alive && e.stun <= 0) f(); } }
      if (e.tele) { e.tele.t -= dt; if (e.tele.t > 0.12) e.tele.a = aimAt(e); }
      if (e.stun > 0) continue;
      const dx = P.x - e.x, dy = P.y - e.y, dist = Math.hypot(dx, dy) || 1;
      e.face = dx < 0 ? -1 : 1;
      const def = e.def;
      let mvx = 0, mvy = 0;
      const seeP = !P.dead && LEVEL.los(e.x, e.y + 0.2, P.x, P.y + 0.2);
      switch (def.ai) {
        case 'walker': {
          const want = 4.5;
          const k = dist > want + 1 ? 1 : dist < want - 1.5 ? -0.7 : 0;
          mvx = dx / dist * k; mvy = dy / dist * k;
          // a sideways drift so groups don't stack
          mvx += -dy / dist * 0.45 * e.strafe; mvy += dx / dist * 0.45 * e.strafe;
          if (Math.random() < dt * 0.4) e.strafe *= -1;
          if (!seeP) { mvx = dx / dist; mvy = dy / dist; }
          break;
        }
        case 'strafer': {
          const want = 5;
          const k = (dist - want) * 0.4;
          mvx = dx / dist * k - dy / dist * e.strafe; mvy = dy / dist * k + dx / dist * e.strafe;
          if (Math.random() < dt * 0.6) e.strafe *= -1;
          break;
        }
        case 'turret': {
          e.wander += dt * 0.6;
          mvx = Math.cos(e.wander) * 0.35; mvy = Math.sin(e.wander * 1.3) * 0.35;
          if (dist > 9 || !seeP) { mvx += dx / dist * 0.6; mvy += dy / dist * 0.6; }
          break;
        }
        case 'sniper': {
          const want = 8;
          const k = dist < want - 1 ? -1 : dist > want + 2 ? 0.8 : 0;
          mvx = dx / dist * k - dy / dist * 0.5 * e.strafe; mvy = dy / dist * k + dx / dist * 0.5 * e.strafe;
          if (e.tele) mvx = mvy = 0;
          break;
        }
        case 'kamikaze': {
          // homes in; within 2 tiles it stops, blinks red for 0.7 s, then bursts into a bullet ring (kill it first or roll away)
          if (e.state === 'arm') {
            e.armT -= dt;
            if (e.body) e.body.c.setTint(1.6, Math.sin(G.t * 40) > 0 ? 0.5 : 1, 0.5);
            if (e.armT <= 0) { G.shooter = def.name; emitRing(e, 10 + G.fi * 2, 4.4, { c: 'o', size: 0.3 }); FX.explosion(e.x, e.y + 0.4, 1.1, 0xff7a2a, true); SFX.play('expM', 0.7, panOf(e.x)); if (!P.dead && dist < 1.5) hurtPlayer(def.name); e.hp = 0; e.noReward = true; killEnemy(e, true); continue; }
          } else {
            mvx = dx / dist; mvy = dy / dist;
            if (dist < 2.1 && seeP) { e.state = 'arm'; e.armT = 0.7; SFX.play('warning', 0.45, panOf(e.x)); FX.ring(e.x, e.y + 0.4, 0.3, 1.5, 0xff3020, 0.7, 0.9); FX.particle({ x: e.x, y: e.y + 0.4, life: 0.7, size: 3.0, size1: 3.0, color: 0xff2010, tex: FX.tex.ring, alpha: 0.5 }); } // blast radius shown while it arms
          }
          break;
        }
        case 'charger': {
          if (e.state === 'charge') {
            mvx = e.cdx * 3.6; mvy = e.cdy * 3.6;
            e.chargeT -= dt;
            if (Math.random() < 0.7) FX.particle({ x: e.x, y: e.y + 0.2, life: 0.4, size: 0.6, size1: 1.2, color: 0x7a6a5a, tex: FX.tex.dot, alpha: 0.3, normal: true, order: 4 });
            if (e.chargeT <= 0) { e.state = 'idle'; PATTERNS[def.fire](e); }
          } else if (e.state === 'wind') {
            e.windT -= dt;
            if (e.windT <= 0) { e.state = 'charge'; e.chargeT = 0.8; SFX.play('swing', 0.6); }
          } else {
            mvx = dx / dist * 0.8; mvy = dy / dist * 0.8;
            if (dist < 7 && seeP && Math.random() < dt * 0.5) {
              e.state = 'wind'; e.windT = 0.6; e.cdx = dx / dist; e.cdy = dy / dist;
              e.tele = { t: 0.6, a: Math.atan2(dy, dx), charge: true };
            }
          }
          break;
        }
      }
      // cover: an enemy that can't see the player walks the room's flow field around the block toward her (flanking)
      // (also when its body was blocked last frame even with a clear sight line: keep walking the flow for a moment)
      if (e.wasBlocked && dist > 2) e.flowT = 0.9;
      if ((!seeP || e.flowT > 0) && !P.dead && !e.tele && e.state !== 'charge' && e.state !== 'arm' && e.state !== 'wind') { const fd = flowDir(e); if (fd) { mvx = fd[0]; mvy = fd[1]; } }
      if (e.flowT > 0) e.flowT -= dt;
      if (e.slowT > 0) e.slowT -= dt;
      // original-skill states: 제압 (suppressed: fires slower), 이동 불가 (rooted), 적중 감소 (blinded: scattered aim)
      if (e.supT > 0) { e.supT -= dt; e.fireT += dt * 0.5; }
      if (e.rootT > 0) e.rootT -= dt;
      if (e.blindT > 0) e.blindT -= dt;
      const sp = def.speed * (e.slowT > 0 ? 0.6 : 1) * (e.rootT > 0 ? 0 : 1);
      if (e.slowT > 0) e.fireT += dt * 0.4; // slowed enemies also shoot less often
      const blocked = e.state === 'arm' ? false : LEVEL.move(e, mvx * sp * dt, mvy * sp * dt);
      e.wasBlocked = blocked && Math.hypot(mvx, mvy) > 0.3;
      if (blocked && e.state === 'charge') { e.state = 'idle'; FX.shake(0.15); FX.explosion(e.x, e.y + 0.3, 0.6, 0xffaa55); PATTERNS[def.fire](e); }
      if (e.state !== 'charge' && e.tele && e.tele.charge && e.state !== 'wind') e.tele = null;
      // separation
      for (const o of G.enemies) {
        if (o === e || !o.alive || o.spawnT > 0) continue;
        const ox = e.x - o.x, oy = e.y - o.y, d = Math.hypot(ox, oy), rr = e.r + o.r;
        if (d < rr && d > 0.001) LEVEL.move(e, ox / d * (rr - d) * 0.5, oy / d * (rr - d) * 0.5);
      }
      // contact damage
      if (!P.dead && P.iframe <= 0 && Math.hypot(P.x - e.x, P.y - e.y) < e.r + P.r) hurtPlayer(def.name);
      // firing
      e.fireT -= dt;
      if (e.fireT <= 0 && seeP && dist < 13 && e.state !== 'charge' && e.state !== 'wind' && def.ai !== 'kamikaze') {
        e.fireT = def.rate * rnd(0.85, 1.2) * [0.9, 0.84, 0.84, 0.72, 0.63, 0.57][G.fi] * (1 - (G.heat || 0) * 0.05); // later floors fire faster again (the curve keeps rising to B6)
        if (def.ai !== 'charger' || Math.random() < 0.5) {
          G.shooter = def.name; PATTERNS[def.fire](e);
          if (e.body && e.body.c.has('atk')) e.body.c.play('atk');
          SFX.play(def.sfx || 'gun', 0.32, panOf(e.x));
        }
      }
      const moving = Math.hypot(mvx, mvy) > 0.1;
      if (e.body && (e.body.c.clipName === 'idle' || e.body.c.clipName === 'move')) {
        const want2 = moving ? 'move' : 'idle';
        if (e.body.c.clipName !== want2 && e.body.c.has(want2)) e.body.c.play(want2, null, true);
      }
    }
    // corpses fade
    for (let i = G.corpses.length - 1; i >= 0; i--) {
      const c = G.corpses[i];
      c.t += dt;
      if (c.e.body) { c.e.body.c.update(dt); c.e.body.c.setOpacity(Math.max(0, 1 - Math.max(0, c.t - 0.6) / 0.6)); c.e.body.c.setOrder(ORD(c.e.y)); }
      if (c.t > 1.2) { disposeEnemy(c.e); G.corpses.splice(i, 1); }
    }
  }

  // ── bosses ───────────────────────────────────────────────
  function updateBoss(e, dt) {
    const P = G.P, def = e.def;
    e.flash = Math.max(0, e.flash - dt);
    for (let k = e.seq.length - 1; k >= 0; k--) { e.seq[k].t -= dt; if (e.seq[k].t <= 0) { const f = e.seq[k].fn; e.seq.splice(k, 1); if (e.alive) f(); } }
    if (e.tele) { e.tele.t -= dt; if (e.tele.t <= 0 && !e.tele.keep) e.tele = null; }
    if (e.intro > 0) { e.intro -= dt; return; }
    e.phaseT = (e.phaseT || 0) + dt; if (e.guardFx > 0) e.guardFx -= dt; if (e.hitPulse > 0) e.hitPulse -= dt;
    // signature bosses carry their own orbiting motes
    if (def.aura && Math.random() < dt * 14) { const an = G.t * 2.4 + Math.random() * 6.28, rr = def.h * 0.6; FX.particle({ x: e.x + Math.cos(an) * rr, y: e.y + def.h * 0.45 + Math.sin(an) * rr * 0.6, vy: 0.4, life: 0.8, size: 0.22, size1: 0, color: def.aura, tex: FX.tex.glow, alpha: 0.9 }); }
    const frac = e.hp / e.maxHp;
    const phase = frac > 0.66 ? 0 : frac > 0.33 ? 1 : 2;
    if (phase !== e.phase) {
      e.phase = phase; e.phaseT = 0;
      if (phase > 0) {
        clearEBullets(true);
        FX.flash(0xff2020, 0.14); FX.shake(0.35); SFX.play('warning'); SFX.play('charge', 0.8);
        const cy = e.y + e.h * 0.45, col = e.def.aura || 0xff3030;
        FX.ring(e.x, cy, 0.6, 7, col, 0.7, 0.55); FX.later(0.15, () => FX.ring(e.x, cy, 0.4, 4.5, 0xffffff, 0.5, 0.7));
        FX.sparks(e.x, cy, col, 34, 8, 0.24, 0.8);
        if (e.aura) { e.aura.size = Math.min(4.6, e.def.h * (1.45 + phase * 0.15)); e.aura.alpha = 0.16 + phase * 0.04; }
        UI.banner('phase', phase === 2 ? '폭주 — 최종 단계' : '2단계 — 공세 강화', '');
        SFX.play(phase === 2 ? 'eRoar' : 'quake', 0.9);
        UI.shock(e.x, cy, col);
        if (e.body) { const r0 = e.body.root; r0.scale.setScalar(1.18); FX.later(0.25, () => r0.scale.setScalar(1)); }
        e.patT = 1.2;
        e.body && e.body.c.setTint(...(e.def.tint || [1, 1, 1]).map((v, i) => v * (i ? 1 - phase * (i === 1 ? 0.15 : 0.2) : 1)));
      }
    }
    const dx = P.x - e.x, dy = P.y - e.y, dist = Math.hypot(dx, dy) || 1;
    e.face = dx < 0 ? -1 : 1;
    const room = G.room;
    // movement: drift around the upper middle of the arena, charge pattern overrides
    if (e.dash) {
      e.dash.t -= dt;
      const blocked = LEVEL.move(e, e.dash.dx * 13 * dt, e.dash.dy * 13 * dt);
      if (Math.random() < 0.8) FX.particle({ x: e.x + rnd(-0.6, 0.6), y: e.y + 0.3, life: 0.5, size: 1, size1: 2, color: 0x7a6a5a, tex: FX.tex.dot, alpha: 0.35, normal: true, order: 4 });
      if (blocked || e.dash.t <= 0) {
        e.dash = null;
        FX.shake(0.4); FX.explosion(e.x, e.y + 0.5, 1.4, 0xffaa55, true); SFX.play('quake');
        emitRing(e, Math.round((18 + phase * 4) * Math.max(0.6, DENS[G.fi])), 4.6, { c: 'o', size: 0.34 });
      }
    } else {
      e.wander += dt * 0.5;
      const tx = room.cx + Math.cos(e.wander) * room.w * 0.25, ty = room.cy + 1.5 + Math.sin(e.wander * 1.7) * room.h * 0.15;
      const mx = tx - e.x, my = ty - e.y, ml = Math.hypot(mx, my);
      if (ml > 0.3) LEVEL.move(e, mx / ml * def.speed * dt, my / ml * def.speed * dt);
    }
    if (!P.dead && P.iframe <= 0 && Math.hypot(P.x - e.x, P.y - e.y) < e.r + P.r) hurtPlayer(def.name, G.fi >= 2 ? 2 : 1);
    // patterns
    e.patT = (e.patT || 1.5) - dt;
    if (e.patT <= 0 && !e.dash && !e.seq.length) {
      const base = G.fi <= 2 && phase < 2 ? def.patterns.slice(0, 3) : def.patterns; /* a late-pool boss drawn early opens with its first three patterns only */
      const pats = phase >= 2 ? [...base, ...['bLaser', 'bFlower', 'bHoming'].filter((x) => !base.includes(x)).slice(0, 2)] : base;
      let p = pats[Math.floor(Math.random() * Math.min(pats.length, 2 + phase * 2))];
      if (p === e.lastPat && Math.random() < 0.7) p = pats[(pats.indexOf(p) + 1) % Math.min(pats.length, 2 + phase * 2)];
      e.lastPat = p;
      BOSS_PAT[p](e, phase);
      e.patT = [1.7, 1.72, 1.58, 1.4, 1.26, 1.18][G.fi] - phase * 0.16; /* B2/B3 bosses breathe more: any of them can be drawn this early */
      if (e.body && e.body.c.has('atk')) e.body.c.play('atk'); // (some original skill clips hide the body for a cut-in)
    }
    if (e.body && (e.body.c.clipName === 'idle' || e.body.c.clipName === 'move')) { if (e.body.c.clipName !== 'move' && e.body.c.has('move')) e.body.c.play('move', null, true); }
  }
  const BOSS_PAT = {
    bRing: (e, ph) => { for (let w = 0; w < 3 + ph; w++) later(e, w * 0.45, () => emitRing(e, Math.round((20 + ph * 4) * DENS[G.fi]), 4.4, { ang: w * 0.13, size: 0.34 })); SFX.play('cannon', 0.6); },
    bSpiral: (e, ph) => { const a0 = Math.random() * TAU, n = Math.round((40 + ph * 10) * Math.max(0.7, DENS[G.fi])); for (let i = 0; i < n; i++) later(e, i * 0.06 / DENS[G.fi], () => emitRing(e, 3 + ph, 4.8, { ang: a0 + i * 0.21, c: 'p' })); SFX.play('laser', 0.5); },
    bSummon: (e, ph) => {
      const pool = FLOORS[G.fi].enemies;
      const adds = G.enemies.filter((o) => o.alive && !o.boss).length;
      const n = Math.min(2 + ph, Math.max(0, 5 - adds)); // never more than 5 adds on the field
      for (let i = 0; i < n; i++) { const a = Math.random() * TAU; const p = freeSpot(e.x + Math.cos(a) * 3, e.y + Math.sin(a) * 2.5, G.room, (x, y) => Math.hypot(x - G.P.x, y - G.P.y) < 4); if (p) spawnEnemy(/* never on top of the hero */ pool[Math.floor(Math.random() * Math.min(3, pool.length))], p[0], p[1]).room = G.room; }
      SFX.play('warning', 0.6);
      later(e, 0.6, () => emitFan(e, 9, 1.4, 5, { c: 'o' }));
    },
    bAimFan: (e, ph) => { for (let w = 0; w < 3 + ph; w++) later(e, w * 0.36, () => emitFan(e, Math.round((7 + ph * 2) * DENS[G.fi]), 1.0, 6.5 + w * 0.4, { size: 0.3 })); SFX.play('gun', 0.6); },
    bWall: (e, ph) => {
      // a wall of bullets with a gap, sweeping toward the player
      const a = aimAt(e), n = Math.round(22 * Math.max(0.7, DENS[G.fi])), gap = Math.floor(rnd(5, n - 6)), gw = G.fi < 2 ? 2 : 1; // density-scaled like every other pattern
      for (let w = 0; w < 2 + ph; w++) later(e, w * 0.75, () => {
        const g2 = clamp(gap + Math.floor(rnd(-3, 4)), 3, n - 4);
        for (let i = 0; i < n; i++) { if (Math.abs(i - g2) <= gw) continue; ebullet(e.x, e.y + e.h * 0.45, a + (i / (n - 1) - 0.5) * 2.4, 4.2, { c: 'b', size: 0.32 }); }
      });
      SFX.play('beam', 0.5);
    },
    bCharge: (e, ph) => {
      const P = G.P, dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy) || 1;
      e.tele = { t: 0.8 - ph * 0.12, a: Math.atan2(dy, dx), charge: true };
      SFX.play(e.key === 'goltarion' ? 'eGolt' : 'charge', 0.8);
      later(e, 0.8 - ph * 0.12, () => { e.dash = { dx: dx / d, dy: dy / d, t: 1.2 }; e.tele = null; SFX.play('swing'); });
    },
    bShotgun: (e, ph) => { for (let w = 0; w < 3; w++) later(e, w * 0.45, () => { emitFan(e, Math.round((12 + ph * 3) * DENS[G.fi]), 1.3, 7, { c: 'o', size: 0.28 }); for (let k = 0; k < Math.round(6 * DENS[G.fi]); k++) ebullet(e.x, e.y + e.h * 0.45, aimAt(e) + rnd(-0.5, 0.5), rnd(3, 6.5), { size: 0.22 }); }); SFX.play('cannon'); },
    bRain: (e, ph) => {
      const room = G.room;
      for (let i = 0; i < Math.round((26 + ph * 10) * DENS[G.fi]); i++) later(e, i * 0.08, () => {
        // never drop a shell right on top of a player hugging the top wall: skip the lane above her
        let x = rnd(room.x0 + 1, room.x1 - 1);
        const y = room.y1 - 0.5, P = G.P;
        if (P && Math.abs(x - P.x) < 1.2 && y - P.y < 3) x = P.x + (x < P.x ? -1.4 : 1.4);
        // a brief telegraphed delay (dim shell) before it falls
        ebullet(x, y, -Math.PI / 2 + rnd(-0.15, 0.15), rnd(4, 6), { c: 'y', size: 0.3, delay: 0.6 });
      });
      SFX.play('missile', 0.6);
    },
    bSpiral2: (e, ph) => { const a0 = Math.random() * TAU; for (let i = 0; i < 40 + ph * 8; i++) later(e, i * 0.07, () => { emitRing(e, 2, 5, { ang: a0 + i * 0.17, c: 'p' }); emitRing(e, 2, 4, { ang: -a0 - i * 0.23, c: 'b', curve: 0.3 }); }); SFX.play('laser', 0.5); },
    bHoming: (e, ph) => { for (let i = 0; i < Math.round((6 + ph * 2) * DENS[G.fi]); i++) later(e, i * 0.18, () => ebullet(e.x, e.y + e.h * 0.6, rnd(0, TAU), 4.2, { homing: 1.8, life: 5, c: 'o', size: 0.42 })); SFX.play('missile'); },
    bLaser: (e, ph) => {
      // telegraphed sweeping bullet beams
      const a0 = aimAt(e) - 0.9;
      e.tele = { t: 0.7, a: a0, keep: false, sweep: [a0, a0 + 1.74] }; /* the warning line sweeps the whole arc the beam will cover */
      SFX.play('charge', 0.7);
      for (let i = 0; i < 30; i++) later(e, 0.8 + i * 0.055, () => { const a = a0 + i * 0.06; for (let k = 0; k < 2; k++) ebullet(e.x, e.y + e.h * 0.45, a, 6 + k * 1.4, { c: 'n', size: 0.28 }); });
      later(e, 0.7, () => SFX.play('laserBig', 0.7));
    },
    // ── signature patterns (one per mid boss, so each fight has its own shape) ──
    // 나이트 칙 퀸: a telegraphed minefield around the player — dim shells appear, then burst outward
    bMines: (e, ph) => {
      // a few mines on a ring around her (evenly spaced, so there is always a way out), long telegraph
      const P = G.P, n = 3 + (ph >= 2 ? 1 : 0), a0 = rnd(0, TAU);
      SFX.play('warning', 0.5);
      for (let i = 0; i < n; i++) later(e, i * 0.15, () => {
        const a = a0 + i * TAU / n, d = rnd(2.4, 3.6), x = P.x + Math.cos(a) * d, y = P.y + 0.4 + Math.sin(a) * d;
        if (LEVEL.tile(x, y - 0.3) !== LEVEL.FLOOR) return;
        FX.particle({ x, y, life: 1.1, size: 1.3, size1: 0.3, color: 0x8a6cff, tex: FX.tex.ring, alpha: 0.75 });
        for (let k = 0; k < 4; k++) ebullet(x, y, k * TAU / 4 + a, 2.8, { c: 'p', size: 0.26, delay: 1.1 });
      });
    },
    // 둠 이터 프라임: a slowly turning cross of bullet streams — circle with it
    bCross: (e, ph) => {
      const a0 = Math.random() * TAU, dir = Math.random() < 0.5 ? 1 : -1, arms = ph >= 2 ? 6 : 4, n = 26 + ph * 6;
      e.tele = { t: 0.5, a: a0, keep: false };
      SFX.play('charge', 0.6);
      for (let i = 0; i < n; i++) later(e, 0.55 + i * 0.09, () => { for (let k = 0; k < arms; k++) ebullet(e.x, e.y + e.h * 0.45, a0 + dir * i * 0.075 + k * TAU / arms, 5.2, { c: 'n', size: 0.3 }); });
    },
    // 골타리온 / 니드호그: an imploding ring — bullets spawn on a wide circle and converge on the boss; stand in a gap
    bVortex: (e, ph) => {
      const R = 7.5, n = Math.round((22 + ph * 6) * DENS[G.fi]), gap = Math.random() * TAU, cy = e.y + e.h * 0.45;
      SFX.play('energy', 0.6);
      for (let w = 0; w < 2; w++) later(e, w * 0.7, () => {
        for (let i = 0; i < n; i++) {
          const a = i * TAU / n + w * 0.12;
          if (Math.abs(angDiff(a, gap)) < 0.45) continue; // a safe lane through the ring
          const x = e.x + Math.cos(a) * R, y = cy + Math.sin(a) * R * 0.75;
          if (LEVEL.tile(x, y - 0.3) !== LEVEL.FLOOR) continue;
          ebullet(x, y, a + Math.PI, 3.2, { c: 'b', size: 0.3, delay: 0.5, life: 3 });
        }
      });
    },
    bFlower: (e, ph) => { for (let w = 0; w < 5; w++) later(e, w * 0.25, () => { for (let i = 0; i < 12; i++) ebullet(e.x, e.y + e.h * 0.45, i * TAU / 12 + w * 0.1, 3.4, { curve: w % 2 ? 0.6 : -0.6, c: w % 2 ? 'p' : 'y', size: 0.3 }); }); SFX.play('energy', 0.6); },
  };
  function freeSpot(x, y, room = G.room, avoid) {
    for (let t = 0; t < 24; t++) {
      const px = x + rnd(-t * 0.3, t * 0.3), py = y + rnd(-t * 0.3, t * 0.3);
      if (LEVEL.hitCircle(px, py, 0.5) || LEVEL.roomAt(px, py) !== room) continue;
      if (avoid && avoid(px, py)) continue;
      return [px, py];
    }
    return null;
  }
  function bossDeath(e) {
    FX.later(1.2, () => G.P && !G.P.dead && SFX.voice(G.P.hero.id, 'MVP', 1, true));
    G.slowT = 1.6;
    clearEBullets(true);
    G.enemies.forEach((o) => { if (o !== e && o.alive) { o.hp = 0; killEnemy(o); } });
    const cy = e.y + e.h * 0.4;
    FX.deathFx(e.x, cy, true);
    // a rolling chain of blasts over the hulk, then one white-out finale
    for (let i = 0; i < 9; i++) FX.later(i * 0.17, () => {
      const bx = e.x + rnd(-1.3, 1.3), by = cy + rnd(-1, 1.2);
      spawnStatic('Harpy_skill2_missile_last_Hit', bx, by, 0.22); FX.explosion(bx, by, 1.2, 0xff8a3a, true);
      SFX.play('expB', 0.8); if (G.opt.shake) FX.shake(0.35);
    });
    FX.later(1.6, () => { FX.flash(0xffffff, 0.45); FX.ring(e.x, cy, 0.5, 9, 0xffe0a0, 0.8, 0.8); FX.sparks(e.x, cy, 0xffd070, 40, 9, 0.24, 0.9); SFX.play('expSF', 1); if (G.opt.shake) FX.shake(0.6); });
    FX.shake(0.6);
    SFX.play('expB');
    UI.hideBoss();
    if (e.body) { const c = e.body.c; c.play(c.has('die') ? 'die' : 'idle'); G.corpses.push({ e, t: -1.5 }); }
    [e.shadow, e.aura].forEach((s) => s && FX.kill(s));
    e.shadow = e.aura = null;
    G.stats.bosses++;
    const run = G.stats;
    FX.later(2.2, () => {
      if (G.phase !== 'play' || G.stats !== run || !G.P || G.P.dead) return; // the hero fell meanwhile: no banner / exit over the fail screen
      roomCleared(G.room);
      const r = G.room;
      spawnChest(r.cx - 3, r.cy + 1.5, Math.min(3, 2 + (G.fi >= 2 ? 1 : 0)), true);
      dropPickup(r.cx + 3, r.cy + 1.5, G.fi >= 2 ? 'half' : 'heart'); // deeper floors heal less: wounds carry into the next floor
      spawnExit(r.cx, r.cy + 1.5);
      SFX.music(G.fi < FLOORS.length - 1 ? 'aftermath' : 'ending');
      SFX.play('win');
      UI.banner('clear', `${e.def.name} 격파`, G.fi < FLOORS.length - 1 ? '승강기를 타고 다음 구역으로 이동하세요' : '철혈 사령부 제압 — 승강기로 귀환하세요');
    });
  }

  // ── player damage, skills ──────────────────────
  // dmg in half-hearts: trash bullets 1, heavy hits (boss body slams, explosions) 2 — armor still soaks one whole hit
  function hurtPlayer(src, dmg = 1) {
    dmg = Math.max(1, Math.min(4, Math.round(Number(dmg)) || 1)); src = String(src || '알 수 없는 공격');
    if (G.P) G.P.beats = 0; // a new hit re-arms the low-health heartbeat
    const P = G.P;
    if (!P || P.dead || P.iframe > 0 || G.phase !== 'play') return;
    G.stats.src[src] = (G.stats.src[src] || 0) + 1;
    if (GOD) { G.stats.hits++; P.iframe = 0.5; return; }
    if (G.tut) { P.iframe = 0.6; P.hurtFlash = 0.2; UI.toast('연습탄 명중 — 훈련 중에는 피해가 없습니다', ''); return; } // basic training never hurts
    if (P.emplaceGuard > 0 && P.emplaceT > 0) {
      // 거치 사격: the emplacement's plating takes the hit
      P.emplaceGuard--; P.iframe = 0.5; SFX.play('shield'); FX.ring(P.x, P.y + 0.6, 0.3, 1.8, 0x9dff7a, 0.35);
      UI.toast(`거치 장갑 ${P.emplaceGuard}회 남음`, 'gem');
      return;
    }
    if (P.armor > 0) { P.armor--; FX.ring(P.x, P.y + 0.6, 0.9, 2.4, 0x2bc4ff, 0.35, 0.45); SFX.play('shield'); blankWave(P.x, P.y + 0.5, 4.5, false); /* a breaking shield clears only the bullets around her */ if (P.syn.has('반응 역장')) { blankWave(P.x, P.y + 0.5, 6, false); G.enemies.forEach((e) => { if (e.alive && e.spawnT <= 0 && Math.hypot(e.x - P.x, e.y - P.y) < 6) hurtEnemy(e, 40, false, 0, 0); }); } }
    else { P.hp = Math.max(0, P.hp - dmg); G.stats.hits++; if (dmg > 1) UI.toast('강력한 공격 — 큰 피해!', 'warn'); }
    P.iframe = BAL.hurtIframe;
    P.hurtFlash = 0.35;
    G.slowT = Math.max(G.slowT, 0.25);
    SFX.play('hurt'); SFX.play('expS', 0.35);
    FX.flash(0xff1010, 0.3); if (G.opt.shake) FX.shake(0.35);
    FX.sparks(P.x, P.y + 0.6, 0xff3355, 14, 4, 0.14, 0.5);
    UI.hurt();
    if (P.mods.thorn) { blankWave(P.x, P.y + 0.5, 3.5, false); }
    if (P.hp <= 0) playerDeath(src);
  }
  function blankWave(x, y, radius, full) {
    FX.ring(x, y, 0.3, radius, 0x9fe8ff, 0.5, 1);
    FX.particle({ x, y, life: 0.35, size: 1, size1: radius * 1.3, color: 0x6fd8ff, tex: FX.tex.glow, alpha: 0.22 }); /* a soft cyan wash: the player stays visible under it */
    for (let i = G.ebul.length - 1; i >= 0; i--) {
      const b = G.ebul[i];
      if (full || Math.hypot(b.x - x, b.y - y) < radius) { popEB(b); ebRemove(i); }
    }
    for (const e of G.enemies) {
      if (!e.alive || e.spawnT > 0) continue;
      const d = Math.hypot(e.x - x, e.y - y) || 1;
      if (d < radius) { e.kx += (e.x - x) / d * 3; e.ky += (e.y - y) / d * 3; if (!e.boss) e.stun = Math.max(e.stun, 0.6); }
    }
  }
  // skill upgrade levels: each hero names the perk that strengthens its ultimate (upF) and its support skill (upE)
  const upF = (P) => (P.hero.upF ? P.up[P.hero.upF] || 0 : 0);
  const upE = (P) => (P.hero.upE ? P.up[P.hero.upE] || 0 : 0);
  // where a gun skill leaves from: the drawn gun's muzzle (set by poseHand each frame), else in front of the chest
  function muzzleOf(P) { return P.muzzle && Number.isFinite(P.muzzle[0]) ? [P.muzzle[0], P.muzzle[1]] : [P.x + Math.cos(P.aim) * 0.5, P.y + 0.7]; }
  // enemies along a ray (nearest first): [{ e, t }]
  function lineHits(x0, y0, a, len, width) {
    const ca = Math.cos(a), sa = Math.sin(a);
    return G.enemies.filter((e) => e.alive && e.spawnT <= 0).map((e) => {
      const px = e.x - x0, py = e.y + e.h * 0.42 - y0, t = px * ca + py * sa;
      return { e, t, off: Math.abs(-px * sa + py * ca) };
    }).filter((o) => o.t > 0 && o.t < len && o.off < o.e.r + width && LEVEL.los(x0, y0 - 0.5, o.e.x, o.e.y + 0.2)).sort((p, q) => p.t - q.t);
  }
  function useSkill() {
    const P = G.P;
    if (P.skill < 100) { SFX.synth('empty'); UI.toast(`스킬 충전 중 — ${Math.floor(P.skill)}%`, 'warn'); return; }
    P.skill = 0; UI.clearToasts();
    P.ultT = 1.2; // the ultimate's own effects play out over about a second (timed ones extend it below)
    G.stats.skills++;
    const h = P.hero;
    UI.skillCut(h);
    SFX.voice(h.id, 'SpSkill', 1, true);
    const a = P.aim, [mx, my] = muzzleOf(P); // gun skills leave from the muzzle
    // ultimates are pure damage; only the cast itself is covered (0.5 s)
    P.iframe = Math.max(P.iframe, 0.5);
    // (the source 'skill' clips carry root motion that walks the body away from the hero's position, so they're not played)
    switch (h.skill) {
      case 'visor':
        // 브라우니 · 전술 조준 모드 (ref. Soldier: 76 Tactical Visor): 6 s of auto-aim, guided rounds,
        // no reloads and +30 % fire rate — pure, skill-light damage while she keeps moving
        P.visorT = 6 + 1.5 * (P.up.u_gren || 0);
        P.overdrive = P.odMax = P.visorT; P.odRof = 1.5; P.odDmg = 1.45;
        { const g = curGun(); if (g) { g.mag = magSize(g); P.reloadT = 0; } }
        SFX.play('charge'); SFX.play('reinforce', 0.7);
        FX.ring(P.x, P.y + 0.6, 0.3, 3, 0xffd34d, 0.5);
        FX.flash(0xffd34d, 0.15);
        break;
      case 'emplace':
        // 레프리콘 · 거치 사격 (ref. Bastion sentry / Zarya): plants her feet — slow, but triple fire rate,
        // +1 pierce, +30 % damage, and the first two hits in the window are absorbed
        P.overdrive = 6 + 1.5 * (P.up.u_od || 0);
        P.odDmg = 1.3; P.odRof = 3; P.odMax = P.emplaceT = P.overdrive; P.emplaceGuard = 1;
        SFX.play('reinforce'); SFX.play('charge'); SFX.play('shield', 0.6);
        FX.ring(P.x, P.y + 0.6, 0.3, 2.5, 0x9dff7a, 0.6);
        FX.ring(P.x, P.y + 0.6, 0.6, 5.5, 0xc8ffb0, 0.75, 0.7);
        FX.flash(0x9dff7a, 0.18);
        if (G.opt.shake) FX.shake(0.3);
        break;
      case 'blossom':
        // 님프 · 산탄 회오리 (ref. Reaper Death Blossom): 3 s of spinning point-blank buckshot while she moves
        P.blossomT = P.blossomMax = 3 + (P.up.u_storm || 0) * 0.8; P.blossomTick = 0;
        P.ultT = P.blossomT;
        SFX.play('gun'); SFX.play('reinforce', 0.7);
        FX.ring(P.x, P.y + 0.6, 0.3, 3.2, 0x7affd4, 0.5);
        break;
      case 'barrage': {
        const targets = G.enemies.filter((e) => e.alive && e.spawnT <= 0);
        SFX.play('warning', 0.5);
        const nb = 16 + 4 * (P.up.u_barr || 0);
        P.ultT = 0.25 + nb * 0.11 + 1.2;
        for (let i = 0; i < nb; i++) {
          const e = targets.length ? targets[i % targets.length] : null;
          const tx = e ? e.x + rnd(-0.6, 0.6) : P.x + rnd(-5, 5), ty = e ? e.y + rnd(-0.4, 0.6) : P.y + rnd(-4, 4);
          FX.later(0.25 + i * 0.11, () => FX.meteor(tx, ty, () => {
            spawnStatic('simple_explosion', tx, ty, 0.24);
            SFX.play('expB', 0.6);
            for (const o of G.enemies) if (o.alive && o.spawnT <= 0 && Math.hypot(o.x - tx, o.y - ty) < 2.4 + o.r) hurtEnemy(o, 70 * P.mods.dmg, false, 0, 0);
            damageProps(tx, ty, 2.2, 60);
          }, 0xff8a3a));
        }
        break;
      }
      // ── originals: each hero's 2nd active skill from Last Origin ──
      case 'aimshot': {
        // 브라우니 · 조준 사격: three aimed rifle rounds that pierce; +29 % on suppressed / slowed / stunned targets
        const pw = 1 + 0.25 * upF(P);
        P.ultT = 1.4;
        for (let i = 0; i < 3; i++) FX.later(0.15 + i * 0.32, () => {
          if (G.phase !== 'play' || !G.P) return;
          const aa = G.P.aim, [x0, y0] = muzzleOf(G.P);
          const hit = lineHits(x0, y0, aa, 20, 0.45).slice(0, 3);
          const end = hit.length ? hit[hit.length - 1].t + 0.6 : 16;
          FX.beam(x0, y0, x0 + Math.cos(aa) * end, y0 + Math.sin(aa) * end, 0.12, 0xfff2a0, 0.25);
          FX.muzzleFlash(x0, y0, aa, 0xffd34d, 2.2);
          SFX.play('rifle', 1); SFX.play('hitB', 0.5); if (G.opt.shake) FX.shake(0.12);
          hit.forEach(({ e }) => { const bonus = e.supT > 0 || e.slowT > 0 || e.stun > 0 ? 1.29 : 1; hurtEnemy(e, 120 * pw * bonus * G.P.mods.dmg, true, Math.cos(aa) * 5, Math.sin(aa) * 5, 'hitB'); });
          hitPropsOnLine(x0, y0, x0 + Math.cos(aa) * end, y0 + Math.sin(aa) * end, 80);
        });
        SFX.play('charge', 0.8);
        break;
      }
      case 'mgspray':
        // 레프리콘 · 경기관총 난사: 3 s of wide light-MG spray toward the aim — rounds pierce cover troops (보호 무시)
        P.sprayT = P.sprayMax = 3 + 0.8 * upF(P); P.sprayTick = 0; P.ultT = P.sprayT;
        SFX.play('reinforce', 0.7); FX.ring(P.x, P.y + 0.6, 0.3, 2.6, 0x9dff7a, 0.5);
        break;
      case 'zone': {
        // 님프 · 제압 난사: a suppressing barrage on the target area — damage, and everything caught fires slower and dodges less
        const d = 6, tx = P.x + Math.cos(a) * d, ty = P.y + 0.5 + Math.sin(a) * d;
        P.zone = { x: tx, y: ty, t: 2.6 + 0.6 * upF(P), tick: 0, R: 3 };
        P.ultT = P.zone.t;
        FX.ring(tx, ty, 0.4, 3, 0x7affd4, 0.6); SFX.play('warning', 0.4);
        break;
      }
      case 'barrier':
        // 노움 · 방벽 생성: foam-concrete wall in front of her that stops enemy rounds; one hit on her is nullified
        P.wallT = 6 + 1.5 * upF(P); P.ultT = 1.2;
        P.emplaceT = P.wallT; P.emplaceGuard = 1;
        SFX.play('quake', 0.6); SFX.play('shield', 0.7);
        FX.ring(P.x, P.y + 0.6, 0.4, 2.4, 0xd8c8a0, 0.6);
        if (G.opt.shake) FX.shake(0.25);
        break;
      case 'snare': {
        // 콘스탄챠 S2 · 발목 잡기 (with 보리): the target and everything near it is pinned (이동 불가), marked and slowed to act
        const d = 6.5, tx = P.x + Math.cos(a) * d, ty = P.y + 0.5 + Math.sin(a) * d, R = 3.2, dur = 4 + upF(P);
        FX.later(0.3, () => {
          FX.ring(tx, ty, 0.4, R, 0xb08cff, 0.6); FX.particle({ x: tx, y: ty, life: 0.6, size: 1, size1: R * 2, color: 0xb08cff, tex: FX.tex.glow, alpha: 0.45 });
          SFX.play('ice', 0.8); SFX.play('handgun', 0.6);
          for (const e of G.enemies) {
            if (!e.alive || e.spawnT > 0 || Math.hypot(e.x - tx, e.y - ty) > R + e.r) continue;
            e.rootT = Math.max(e.rootT || 0, dur); e.markT = Math.max(e.markT || 0, dur); e.supT = Math.max(e.supT || 0, dur);
            if (e.boss) { e.seq.length = 0; e.tele = null; e.patT = (e.patT || 0) + 1.5; }
            hurtEnemy(e, 25 * P.mods.dmg, false, 0, 0, 'hitM');
            FX.ring(e.x, e.y + 0.2, e.r * 2.2, e.r * 1.1, 0xb08cff, 0.5);
          }
        });
        break;
      }
      case 'deploy':
        // 케시크 · 전술 배치 (+ 응급 처치): attack +28.5 %, act +14 %, one hit nullified for 6 s — and a field dressing if she's hurt
        P.overdrive = P.odMax = 6 + 1.5 * upF(P); P.odDmg = 1.285; P.odRof = 1.14;
        P.emplaceT = P.overdrive; P.emplaceGuard = 1;
        if (P.hp < P.maxHp) { P.hp = Math.min(P.maxHp, P.hp + 1); FX.ring(P.x, P.y + 0.6, 0.2, 1.4, 0xff4060, 0.45); }
        SFX.play('reinforce'); SFX.play('shield', 0.6);
        FX.ring(P.x, P.y + 0.6, 0.3, 2.6, 0xff8a5a, 0.6); FX.flash(0xff8a5a, 0.12);
        break;
      case 'escort':
        // 블랙 리리스 · 요인 경호: two hits nullified, attack +23.5 % and sure aim for 6 s
        P.overdrive = P.odMax = 6 + 1.5 * upF(P); P.odDmg = 1.235; P.odRof = 1; P.visorT = P.overdrive;
        P.emplaceT = P.overdrive; P.emplaceGuard = 2;
        SFX.play('shield'); SFX.play('reinforce', 0.7);
        FX.ring(P.x, P.y + 0.6, 0.3, 2.6, 0xc070ff, 0.6); FX.flash(0xc070ff, 0.12);
        break;
      case 'eyebeam': {
        // LRL · 사이클롭스 이터널 빔: the eye-patch comes off — a long beam that blinds (적중 감소) and slows (AP 감소)
        const ca = Math.cos(a), sa = Math.sin(a), ex = P.x + ca * 0.25, ey = P.y + 1.3, len = 22, wid = 1.6 * (1 + 0.3 * upF(P)), dur = 5 + upF(P);
        SFX.play('charge');
        FX.later(0.3, () => {
          FX.orbital(ex, ey, ex + ca * len, ey + sa * len, 0xff5a8a, 1.1);
          SFX.play('laserBig');
          for (const e of G.enemies) {
            if (!e.alive || e.spawnT > 0) continue;
            const px = e.x - ex, py = e.y + e.h * 0.42 - ey, t = px * ca + py * sa;
            if (t > 0 && t < len && Math.abs(-px * sa + py * ca) < wid + e.r) {
              e.blindT = Math.max(e.blindT || 0, dur); e.supT = Math.max(e.supT || 0, dur);
              if (e.boss) { e.seq.length = 0; e.tele = null; }
              hurtEnemy(e, 45 * P.mods.dmg, false, ca * 3, sa * 3);
            }
          }
          for (let k = G.ebul.length - 1; k >= 0; k--) { const b = G.ebul[k], px = b.x - ex, py = b.y - ey, t = px * ca + py * sa; if (t > 0 && t < len && Math.abs(-px * sa + py * ca) < wid) { popEB(b); ebRemove(k); } }
        });
        break;
      }
      case 'orbital': {
        const ca = Math.cos(a), sa = Math.sin(a), len = 24;
        SFX.play('charge');
        FX.particle({ x: mx, y: my, life: 0.5, size: 0.4, size1: 2.5, color: 0x9ff4ff, tex: FX.tex.glow });
        // the main beam, then two after-burn pulses along the same line
        const wid = 1.8 * (1 + 0.5 * (P.up.u_orb || 0)), pw = (1 + 0.3 * (P.up.u_orb || 0)) * P.mods.dmg;
        const sweep = (dmg, fxW) => {
          FX.orbital(mx, my, mx + ca * len, my + sa * len, 0x9ff4ff, fxW); // cyan-white: never mistaken for the pink enemy palette
          for (const e of G.enemies) {
            if (!e.alive || e.spawnT > 0) continue;
            const px = e.x - mx, py = e.y + e.h * 0.42 - my, t = px * ca + py * sa;
            if (t > 0 && t < len && Math.abs(-px * sa + py * ca) < wid + e.r) { e.markT = Math.max(e.markT || 0, 5); hurtEnemy(e, dmg, true, ca * 4, sa * 4); } // infra-sight: survivors stay marked
          }
        };
        FX.later(0.35, () => { sweep(260 * pw, 1.2); SFX.play('laserBig'); hitPropsOnLine(mx, my, mx + ca * len, my + sa * len, 200); });
        FX.later(0.75, () => sweep(90 * pw, 0.6));
        FX.later(1.1, () => sweep(90 * pw, 0.6));
        break;
      }
    }
  }
  function rushBlast(P) {
    const a = P.aim, ca = Math.cos(a), sa = Math.sin(a);
    const sg = { d: Object.assign({}, GUNS.sg, { dmg: GUNS.sg.dmg * 2.5, life: 0.3 }) };
    const [mx, my] = muzzleOf(P);
    P.iframe = Math.max(P.iframe, 0.2); // a beat of cover after landing in their midst
    const np = 12 + 4 * (P.up.u_rush || 0);
    for (let i = 0; i < np; i++) spawnPBullet(P, sg, mx, my, a + (i / (np - 1) - 0.5) * 1.1, rnd(18, 23));
    FX.muzzleFlash(mx, my, a, 0x7affd4, 2);
    FX.ring(mx + ca * 1.2, my + sa * 1.2, 0.3, 2.4, 0x7affd4, 0.3);
    SFX.play('gun'); SFX.play('expS', 0.5);
    if (G.opt.shake) FX.shake(0.22);
    let hits = 0;
    for (const e of G.enemies) {
      if (!e.alive || e.spawnT > 0) continue;
      const px = e.x - P.x, py = e.y + e.h * 0.4 - P.y - 0.6, d = Math.hypot(px, py) || 1;
      if (d < 3.4 && Math.abs(angDiff(a, Math.atan2(py, px))) < 0.7) { hits++; if (!e.boss) { e.kx += px / d * 9; e.ky += py / d * 9; e.stun = Math.max(e.stun, 0.5); } }
    }
    // brawler sustain (ref. Reaper / Doomfist): connecting at point blank patches her up
    if (G.room !== P.rushHealRoom) { P.rushHealRoom = G.room; P.rushHeals = 0; }
    if (hits && P.hp <= P.maxHp / 2 && P.rushHeals < 1) { /* only when she's hurt (half HP or less), once per room */ P.rushHeals++; P.hp = Math.min(P.maxHp, P.hp + 1); FX.ring(P.x, P.y + 0.6, 0.2, 1.2, 0xff4060, 0.35); SFX.play('reinforce', 0.45); }
  }
  // ── secondary skills (cooldown) ──
  function sk2Cool(P) { return Math.max(1.5, P.hero.sk2.cd * P.mods.sk2cd - (P.up.u_rush || 0) * 1.2 - upE(P) * 0.6); } // every support-skill upgrade also trims 0.6 s
  const TURRET_SHOT = { kind: 'bullet', color: 0x9fffd8, size: 0.28, life: 0.8, hit: 'skill_hit_simple', hitSnd: 'hitS', dmg: 7, speed: 20, splash: 0 };
  function useSkill2() {
    const P = G.P, sk = P.hero.sk2;
    if (P.sk2Cd > 0) { SFX.synth('empty'); return; }
    P.sk2Cd = P.sk2Max = sk2Cool(P);
    G.stats.skills2 = (G.stats.skills2 || 0) + 1;
    UI.sk2Used();
    const a = P.aim, ca = Math.cos(a), sa = Math.sin(a);
    if (sk.id === 'frag') {
      // 브라우니 · 전술 수류탄 (ref. Soldier: 76 Helix Rockets / Commando grenade): damage + knockback + a short stagger
      const lv = P.up.u_flash || 0, d = 5.5, tx = P.x + ca * d, ty = P.y + 0.5 + sa * d, R = 2.3 * (1 + 0.25 * lv);
      SFX.play('swing', 0.6);
      lob(P.x + ca * 0.4, P.y + 0.7, tx, ty, 0.38, () => {
        FX.explosion(tx, ty, 1.3, 0xffb040, true);
        FX.ring(tx, ty, 0.4, R, 0xffd070, 0.35);
        spawnStatic('RPG_skill2_hit', tx, ty, 0.22);
        SFX.play('expM', 0.85);
        if (G.opt.shake) FX.shake(0.2);
        for (const e of G.enemies) {
          if (!e.alive || e.spawnT > 0) continue;
          const dx = e.x - tx, dy = e.y + e.h * 0.4 - ty, dd = Math.hypot(dx, dy) || 1;
          if (dd > R + e.r) continue;
          hurtEnemy(e, 55 * P.mods.dmg, false, dx / dd * 6, dy / dd * 6, 'hitB');
          if (!e.boss) e.stun = Math.max(e.stun, 0.8 + 0.4 * lv);
        }
        // the concussion also scatters enemy rounds in the blast (her only defensive tool)
        for (let k = G.ebul.length - 1; k >= 0; k--) { const b = G.ebul[k]; if (Math.hypot(b.x - tx, b.y - ty) < R) { popEB(b); ebRemove(k); } }
        damageProps(tx, ty, R, 50);
      });
    } else if (sk.id === 'shield') {
      // 레프리콘 · 흡수 방벽 (ref. Zarya): the barrier eats bullets; what it eats becomes bonus damage afterwards
      P.shieldT = 3 + 1.5 * (P.up.u_shield || 0);
      P.absorb = 0;
      SFX.play('shield'); SFX.play('ice', 0.5);
    } else if (sk.id === 'turret') {
      // 노움 · 자동 포탑 (ref. Torbjörn / Engineer): a deployable that shoots the nearest enemy
      const life = 8 + 2 * (P.up.u_mine || 0);
      const m = spriteMesh(pickupTex('mine'), 0.9, 0.9);
      m.position.set(P.x, P.y + 0.3, 0); m.renderOrder = ORD(P.y);
      scene.add(m);
      G.mines = G.mines || [];
      G.mines.push({ turret: true, x: P.x, y: P.y, m, t: 0, life, fire: 0.3, dmgK: 1 + 0.3 * (P.up.u_mine || 0),
        light: FX.sprite({ x: P.x, y: P.y + 0.75, size: 0.6, color: 0xffc860, alpha: 0.8, tex: FX.tex.glow, order: 4 }) });
      SFX.play('reloadOut', 0.8); SFX.play('uiEquip', 0.6);
      FX.ring(P.x, P.y + 0.3, 0.2, 1.4, 0xffc860, 0.3);
    } else if (sk.id === 'rush') {
      if (P.roll) { P.sk2Cd = 0; return; }
      P.dash = { t: 0, dx: ca, dy: sa };
      if (Math.abs(ca) > 0.1) P.face = Math.sign(ca);
      SFX.play('roll', 0.9); SFX.play('swing', 0.6);
    } else if (sk.id === 'sleep') {
      // 콘스탄챠 · 수면탄 (ref. Ana Sleep Dart): the first enemy along the aim (two with the upgrade) is put
      // out for 3.5 s and takes +50 % while down; a boss loses its current pattern
      const lv = P.up.u_mark || 0, [x0, y0] = muzzleOf(P);
      const hit = G.enemies.filter((e) => e.alive && e.spawnT <= 0).map((e) => {
        const px = e.x - x0, py = e.y + e.h * 0.42 - y0, t = px * ca + py * sa;
        return { e, t, off: Math.abs(-px * sa + py * ca) };
      }).filter((o) => o.t > 0 && o.t < 18 && o.off < o.e.r + 0.45 && LEVEL.los(x0, y0 - 0.5, o.e.x, o.e.y + 0.2)).sort((p, q) => p.t - q.t).slice(0, lv >= 2 ? 2 : 1);
      SFX.play('handgun', 0.8);
      const end = hit.length ? hit[hit.length - 1] : { t: 12 };
      FX.beam(x0, y0, x0 + ca * end.t, y0 + sa * end.t, 0.07, 0xb08cff, 0.3);
      hit.forEach(({ e }) => {
        const dur = 3.5 + lv * 1;
        e.markT = Math.max(e.markT || 0, dur);
        if (!e.boss) { e.stun = Math.max(e.stun, dur); e.seq.length = 0; e.tele = null; }
        else { e.seq.length = 0; e.tele = null; e.patT = (e.patT || 0) + 2; }
        hurtEnemy(e, 15 * P.mods.dmg, false, 0, 0, 'hitM');
        FX.ring(e.x, e.y + e.h * 0.42, e.r * 2.5, e.r * 1.2, 0xb08cff, 0.4);
        FX.particle({ x: e.x, y: e.y + e.h + 0.2, life: Math.min(dur, 3), size: 0.5, size1: 0.5, color: 0xb08cff, tex: FX.tex.glow, alpha: 0.7 });
      });
      if (!hit.length) { UI.toast('조준선에 적이 없습니다', 'warn'); P.sk2Cd = 0.5; }
    } else if (sk.id === 'checkfire') {
      // 브라우니 · 견제 사격: a three-round burst; whatever it hits is suppressed (fires slower, takes +15 %) for 4 s
      const pw = 1 + 0.2 * upE(P), rd = { d: Object.assign({}, GUNS.ar, { dmg: 16 * pw, life: 0.8, size: 0.42 }) };
      for (let i = 0; i < 3; i++) FX.later(i * 0.08, () => { if (!G.P) return; const aa = G.P.aim, b = spawnPBullet(G.P, rd, ...muzzleOf(G.P), aa + rnd(-0.03, 0.03), 26); if (b) b.sup = 4 + upE(P); SFX.play('rifle', 0.9); });
      FX.muzzleFlash(...muzzleOf(P), a, 0xffd34d, 1.6);
    } else if (sk.id === 'mgfocus') {
      // 레프리콘 · 기관총 사격: 2 s of focused fire — double rate, tight spread, +20 % damage (+38 % on suppressed targets)
      P.overdrive = P.odMax = 2 + 0.5 * upE(P); P.odRof = 2; P.odDmg = 1.2; P.focusT = P.overdrive;
      SFX.play('reloadOut', 0.8); FX.ring(P.x, P.y + 0.6, 0.3, 1.6, 0x9dff7a, 0.35);
    } else if (sk.id === 'focusshot') {
      // 님프 · 집속 사격: a focused MG80 burst — eight heavy rounds down one line, +19 % on marked targets
      const pw = 1 + 0.2 * upE(P), rd = { d: Object.assign({}, GUNS.mg80, { dmg: GUNS.mg80.dmg * 2.4 * pw, life: 0.75, size: 0.34 }) };
      for (let i = 0; i < 8; i++) FX.later(i * 0.045, () => { if (!G.P) return; const aa = G.P.aim, b = spawnPBullet(G.P, rd, ...muzzleOf(G.P), aa + rnd(-0.025, 0.025), 24); if (b) b.markBonus = 1.19; if (i % 2) SFX.play('mg', 0.7); });
      FX.muzzleFlash(...muzzleOf(P), a, 0x7affd4, 1.8);
    } else if (sk.id === 'pointblank') {
      // 케시크 · 근거리 포격: a point-blank shotgun blast — the closer, the harder (+28.5 %), and what it hits is marked
      const pw = 1 + 0.2 * upE(P), R = 4.2, [mx, my] = muzzleOf(P);
      const sg = { d: Object.assign({}, GUNS.ct11, { dmg: GUNS.ct11.dmg * 1.9 * pw, life: 0.32 }) };
      for (let i = 0; i < 10; i++) { const b = spawnPBullet(P, sg, mx, my, a + (i / 9 - 0.5) * 0.5, rnd(19, 23)); if (b) b.pointBlank = true; }
      for (const e of G.enemies) { if (!e.alive || e.spawnT > 0) continue; const px = e.x - P.x, py = e.y + e.h * 0.4 - P.y - 0.6; if (Math.hypot(px, py) < R + e.r && Math.abs(angDiff(a, Math.atan2(py, px))) < 0.45) e.markT = Math.max(e.markT || 0, 4); }
      FX.muzzleFlash(mx, my, a, 0xffb08a, 2.4); SFX.play('gun'); SFX.play('expS', 0.45);
      if (G.opt.shake) FX.shake(0.18);
    } else if (sk.id === 'covermark') {
      // 노움 · 원호 사격: a marking round — everything near the impact is marked (+50 % damage taken, dodges less) for 5 s
      const d = 6, tx = P.x + ca * d, ty = P.y + 0.5 + sa * d, R = 2.4 * (1 + 0.2 * upE(P));
      SFX.play('swing', 0.6);
      lob(P.x + ca * 0.4, P.y + 0.7, tx, ty, 0.32, () => {
        FX.explosion(tx, ty, 0.9, 0xffa040, false); FX.ring(tx, ty, 0.4, R, 0xff6a4a, 0.4); SFX.play('expS', 0.8);
        for (const e of G.enemies) { if (!e.alive || e.spawnT > 0 || Math.hypot(e.x - tx, e.y + e.h * 0.4 - ty) > R + e.r) continue; e.markT = Math.max(e.markT || 0, 5); hurtEnemy(e, 30 * P.mods.dmg, false, 0, 0, 'hitB'); }
        damageProps(tx, ty, R, 30);
      });
    } else if (sk.id === 'rifleshot') {
      // 콘스탄챠 S2 · 라이플 사격: one precise depleted-uranium round — heavy damage, and the target takes +19 % for 4 s (as a mark)
      const pw = 1 + 0.25 * upE(P), [x0, y0] = muzzleOf(P);
      const hit = lineHits(x0, y0, a, 20, 0.4).slice(0, 2);
      const end = hit.length ? hit[hit.length - 1].t + 0.5 : 16;
      FX.beam(x0, y0, x0 + ca * end, y0 + sa * end, 0.08, 0xff9af0, 0.25); SFX.play('handgun', 1); SFX.play('hitB', 0.5);
      hit.forEach(({ e }) => { hurtEnemy(e, 70 * pw * P.mods.dmg, Math.random() < 0.35, ca * 4, sa * 4, 'hitB'); e.markT = Math.max(e.markT || 0, 4); });
      if (!hit.length) hitPropsOnLine(x0, y0, x0 + ca * end, y0 + sa * end, 60);
    } else if (sk.id === 'dualburst') {
      // 블랙 리리스 · 듀얼 버스트: an akimbo burst from both guns; hit targets are suppressed (attack down) — +48 % on them
      const pw = 1 + 0.2 * upE(P), rd = { d: Object.assign({}, GUNS.bl_dual, { dmg: GUNS.bl_dual.dmg * 2 * pw, life: 0.7, size: 0.34 }) };
      for (let i = 0; i < 10; i++) FX.later(i * 0.04, () => { if (!G.P) return; const aa = G.P.aim, side = i % 2 ? 0.1 : -0.1, b = spawnPBullet(G.P, rd, ...muzzleOf(G.P), aa + side + rnd(-0.04, 0.04), 24); if (b) b.sup = 4; if (i % 2) SFX.play('gun', 0.6); });
    } else if (sk.id === 'axe') {
      // LRL · 액스 오브 다크니스: a swing of the dragon-slayer axe in front of her — sometimes it finds a weak point (x2.45)
      const pw = 1 + 0.2 * upE(P), R = 2.8, luck = 0.2 + 0.08 * upE(P);
      FX.ring(P.x + ca * 1.2, P.y + 0.6 + sa * 1.2, 0.4, R, 0xff5a8a, 0.35); SFX.play('swing', 0.9);
      for (let i = 0; i < 7; i++) { const aa = a + (i / 6 - 0.5) * 2.2; FX.particle({ x: P.x + Math.cos(aa) * 1.9, y: P.y + 0.6 + Math.sin(aa) * 1.9, life: 0.25, size: 0.7, size1: 0.2, color: 0xff5a8a, tex: FX.tex.glow, alpha: 0.8 }); }
      let weak = false;
      for (const e of G.enemies) {
        if (!e.alive || e.spawnT > 0) continue;
        const px = e.x - P.x, py = e.y + e.h * 0.4 - P.y - 0.6, d = Math.hypot(px, py) || 1;
        if (d > R + e.r || Math.abs(angDiff(a, Math.atan2(py, px))) > 1.15) continue;
        const crit = Math.random() < luck; if (crit) weak = true;
        hurtEnemy(e, 55 * pw * (crit ? 2.45 : 1) * P.mods.dmg, crit, px / d * 7, py / d * 7, 'hitB');
      }
      for (let k = G.ebul.length - 1; k >= 0; k--) { const b = G.ebul[k], px = b.x - P.x, py = b.y - P.y - 0.6; if (Math.hypot(px, py) < R && Math.abs(angDiff(a, Math.atan2(py, px))) < 1.15) { popEB(b); ebRemove(k); } }
      if (weak) { UI.toast('약점 적중!', 'gem'); SFX.play('hitB', 0.8); if (G.opt.shake) FX.shake(0.2); }
    }
  }
  // Leprechaun's frontal shield: a glowing arc that eats enemy bullets in front of the aim (and reflects them)
  const SHIELD_SHOT = { kind: 'bullet', color: 0x7fe3ff, size: 0.3, life: 0.8, hit: null, hitSnd: 'hitE', dmg: 9, speed: 18, splash: 0 };
  function updateShield(P) {
    if (!P.shieldFx) P.shieldFx = Array.from({ length: 9 }, () => FX.sprite({ x: 0, y: 0, size: 0.55, color: 0x7fe3ff, alpha: 0.75, tex: FX.tex.glow, order: L.PROJ + 1.5 }));
    const cx = P.x, cy = P.y + 0.6, R = 1.35;
    P.shieldFx.forEach((s, i) => {
      const a = P.aim + (i / 8 - 0.5) * 1.9;
      s.hidden = false; s.x = cx + Math.cos(a) * R; s.y = cy + Math.sin(a) * R * 0.85; s.alpha = 0.55 + 0.25 * Math.sin(G.t * 12 + i) * (P.shieldT < 0.6 ? Math.sin(G.t * 40) : 1);
    });
    for (let k = G.ebul.length - 1; k >= 0; k--) {
      const b = G.ebul[k], d = Math.hypot(b.x - cx, b.y - cy);
      if (d < R + 0.35 && d > 0.4 && Math.abs(angDiff(P.aim, Math.atan2(b.y - cy, b.x - cx))) < 1.2) {
        popEB(b); ebRemove(k); FX.sparks(b.x, b.y, 0x7fe3ff, 3, 2, 0.08, 0.2); SFX.play('hitE', 0.25);
        // every absorbed round charges the barrier (+4 % damage each, up to +50 % — or +75 % upgraded)
        P.absorb = (P.absorb || 0) + 1;
      }
    }
  }
  function updateMines(dt) {
    if (!G.mines) return;
    for (let i = G.mines.length - 1; i >= 0; i--) {
      const m = G.mines[i];
      m.t += dt;
      if (m.turret) {
        // 자동 포탑: fires at the nearest visible enemy in range; blinks out in its last second
        m.light.alpha = m.life - m.t < 1 ? (Math.sin(G.t * 30) > 0 ? 0.9 : 0.2) : 0.6 + 0.3 * Math.sin(G.t * 6);
        m.fire -= dt;
        if (m.fire <= 0) {
          let best = null, bd = 9;
          for (const e of G.enemies) { if (!e.alive || e.spawnT > 0) continue; const d = Math.hypot(e.x - m.x, e.y + e.h * 0.42 - m.y - 0.6); if (d < bd && LEVEL.los(m.x, m.y + 0.2, e.x, e.y + 0.2)) { bd = d; best = e; } }
          if (best) {
            m.fire = 0.22;
            const ang = Math.atan2(best.y + best.h * 0.42 - m.y - 0.6, best.x - m.x);
            const b = spawnPBullet(G.P, { d: TURRET_SHOT }, m.x, m.y + 0.6, ang, TURRET_SHOT.speed);
            b.dmg = TURRET_SHOT.dmg * G.P.mods.dmg * m.dmgK;
            FX.muzzle(m.x + Math.cos(ang) * 0.3, m.y + 0.6, 0xffc860); SFX.play('handgun', 0.25, panOf(m.x));
          } else m.fire = 0.15;
        }
        if (m.t >= m.life) { FX.ring(m.x, m.y + 0.3, 0.2, 1.2, 0xffc860, 0.3); killObj(m.m); FX.kill(m.light); G.mines.splice(i, 1); }
        continue;
      }
      m.light.alpha = m.t < m.arm ? 0.3 : 0.5 + 0.4 * Math.sin(G.t * 10);
      let boom = m.t > 12;
      if (m.t >= m.arm) for (const e of G.enemies) { if (e.alive && e.spawnT <= 0 && Math.hypot(e.x - m.x, e.y - m.y) < 1.4 + e.r) { boom = true; break; } }
      if (!boom) continue;
      FX.explosion(m.x, m.y + 0.3, 1.2, 0xffa040, true);
      spawnStatic('simple_explosion', m.x, m.y + 0.3, 0.22);
      SFX.play('expM', 0.9, panOf(m.x));
      for (const e of G.enemies) if (e.alive && e.spawnT <= 0 && Math.hypot(e.x - m.x, e.y - m.y) < 2.6 * (1 + 0.25 * (G.P.up.u_mine || 0)) + e.r) { hurtEnemy(e, 95 * (1 + 0.4 * (G.P.up.u_mine || 0)) * G.P.mods.dmg, false, (e.x - m.x) * 0.8, (e.y - m.y) * 0.8, 'hitB'); if (!e.boss) e.stun = Math.max(e.stun, 0.8); }
      for (let k = G.ebul.length - 1; k >= 0; k--) { const b = G.ebul[k]; if (Math.hypot(b.x - m.x, b.y - m.y) < 2.2) { popEB(b); ebRemove(k); } }
      damageProps(m.x, m.y, 2.2, 50);
      killObj(m.m); FX.kill(m.light);
      G.mines.splice(i, 1);
    }
  }
  function clearMines() { (G.mines || []).forEach((m) => { killObj(m.m); FX.kill(m.light); }); G.mines = []; }

  // a thrown grenade arc (sprite with a fake height)
  function lob(x0, y0, x1, y1, dur, onLand) {
    const s = FX.sprite({ x: x0, y: y0, size: 0.32, color: 0x3a4a2a, tex: FX.tex.dot, normal: true, order: L.PROJ });
    const gl = FX.sprite({ x: x0, y: y0, size: 0.5, color: 0xff8a2a, alpha: 0.6, tex: FX.tex.glow, order: L.PROJ + 0.1 });
    let t = 0;
    FX.tickers.push((dt) => {
      t += dt;
      const f = Math.min(1, t / dur);
      const x = x0 + (x1 - x0) * f, y = y0 + (y1 - y0) * f + Math.sin(f * Math.PI) * 1.6;
      s.x = gl.x = x; s.y = gl.y = y;
      if (f >= 1) { FX.kill(s); FX.kill(gl); onLand(); return false; }
      return true;
    });
  }

  function playerDeath(src) {
    const P = G.P;
    if (P.revives > 0) {
      // research: emergency restore — once per run, back on her feet with a screen-clearing pulse
      P.revives--; P.hp = Math.min(P.maxHp, 4); P.iframe = 2.5;
      clearEBullets(true); blankWave(P.x, P.y + 0.5, 7, true);
      FX.pillar(P.x, P.y, 0.8, 0x7fe3ff); SFX.play('reinforce'); SFX.play('shield');
      UI.announce('긴급 복구 프로토콜', '작전 불능 회피', `체력 ${P.hp * 25}으로 복구되었습니다 (이번 출격 1회)`, 3, 'i_skull');
      G.slowT = Math.max(G.slowT, 0.6);
      return;
    }
    P.dead = true;
    G.slowT = 1.8;
    G.camFocus = { x: P.x, y: P.y + 0.7, t: 3.2 };
    UI.banner('room', '작전 불능', '');
    // she falls with her arms back on (the source rig as drawn), minus every weapon part — the gun drops to the floor
    P.body.c.setMask((p, n) => /weapon|gun/i.test(n));
    P.body.c.play(P.body.c.has('die') ? 'die' : 'idle');
    if (!P.body.c.has('die')) { const pv = P.body.pivot, dir = P.face > 0 ? 1 : -1; let k = 0; const fall = () => { k = Math.min(1, k + 0.08); pv.rotation.z = dir * 1.45 * (1 - Math.pow(1 - k, 3)); pv.position.y = -0.35 * k; if (k < 1) requestAnimationFrame(fall); }; fall(); }
    const cg = curGun();
    if (cg && cg.hand) {
      cg.hand.outer.visible = false;
      const dg = makeGunHand(cg.id);
      if (dg) {
        const o = cg.hand.outer;
        dg.outer.position.copy(o.position); dg.outer.rotation.z = o.rotation.z; dg.outer.scale.copy(o.scale);
        scene.add(dg.outer);
        G.deadGun = { h: dg, vx: -P.face * rnd(0.8, 1.6), vy: rnd(2.5, 3.5), spin: -P.face * rnd(6, 9), floor: P.y + 0.12, bounces: 0 };
      }
    }
    FX.explosion(P.x, P.y + 0.6, 0.8, 0xff3355, true);
    SFX.play('fail'); SFX.music(null);
    clearEBullets(true);
    G.stats.cause = src;
    SFX.voice(P.hero.id, 'Retreat', 1, true);
    G.deathRun = G.stats;
    if (G.tut) { G.tut = null; UI.coach(null); }
    FX.later(1.7, () => { if (G.deathRun === G.stats) endRun(false); }); // ~2.5 s of real time in the slow-mo, quick to retry
  }

  // ── pickups & interactables ────────────────────────────
  function dropPickup(x, y, kind, val = 1) {
    if (kind === 'gold') {
      const n = Math.min(6, Math.max(1, Math.ceil(val / 2)));
      for (let i = 0; i < n; i++) addPickup(x, y, 'gold', i === n - 1 ? val - Math.floor(val / n) * (n - 1) : Math.floor(val / n));
      return;
    }
    addPickup(x, y, kind, val);
  }
  function addPickup(x, y, kind, val) {
    const sz = kind === 'gold' ? 0.42 : 0.62;
    const m = spriteMesh(pickupTex(kind), sz, sz);
    m.position.set(x, y + 0.3, 0);
    scene.add(m);
    const a = Math.random() * TAU, v = rnd(1.5, 3.5);
    const p = { x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, kind, val, m, t: 0, r: 0.3 };
    p.glow = FX.sprite({ x, y, size: 0.9, color: { gold: 0xffcc00, heart: 0xff3355, half: 0xff3355, key: 0xffdd55, armor: 0x2bc4ff, ammo: 0xaaff66 }[kind] || 0xffffff, alpha: 0.25, tex: FX.tex.glow, order: 5 });
    if (G.pickups.length > 150) { /* a ceiling on loose pickups: the oldest loose parts are banked straight away */
      const i = G.pickups.findIndex((q) => q.kind === 'gold');
      if (i >= 0) { const q = G.pickups[i]; G.pickups.splice(i, 1); if (G.P) { G.P.gold += q.val; G.stats.gold += q.val; } killObj(q.m); FX.kill(q.glow); }
    }
    G.pickups.push(p);
    return p;
  }
  function updatePickups(dt) {
    const P = G.P;
    for (let i = G.pickups.length - 1; i >= 0; i--) {
      const p = G.pickups[i];
      p.t += dt;
      if (p.vx || p.vy) { LEVEL.move(p, p.vx * dt, p.vy * dt); p.vx *= Math.max(0, 1 - dt * 5); p.vy *= Math.max(0, 1 - dt * 5); }
      const d = Math.hypot(P.x - p.x, P.y + 0.2 - p.y);
      const mag = P.mods.magnet ? 2 : 1;
      const vac = (p.kind === 'gold' && G.room && !G.room.active && LEVEL.roomAt(p.x, p.y) === G.room ? 12 : 3.2) * mag; // cleared rooms pull their parts in
      const pulls = p.kind === 'gold' || (mag > 1 && (p.kind === 'key' || p.kind === 'armor' || ((p.kind === 'heart' || p.kind === 'half') && P.hp < P.maxHp)));
      if (pulls && d < vac && !P.dead && p.t > 0.4) { p.x += (P.x - p.x) / d * dt * 9; p.y += (P.y - p.y) / d * dt * 9; }
      const hop = Math.abs(Math.sin(p.t * 4)) * 0.12;
      p.m.position.set(p.x, p.y + 0.3 + hop, 0);
      p.m.renderOrder = ORD(p.y);
      p.glow.x = p.x; p.glow.y = p.y + 0.3;
      if (d < 0.75 && !P.dead && p.t > 0.3 && collect(p)) {
        killObj(p.m); FX.kill(p.glow);
        G.pickups.splice(i, 1);
      }
    }
  }
  function collect(p) {
    const P = G.P;
    switch (p.kind) {
      case 'gold': { const v = P.mods.magnet ? Math.ceil(p.val * 1.25) : p.val; P.gold += v; G.stats.gold += v; } SFX.play(Math.random() < 0.5 ? 'coin' : 'uiCoin', 0.8); FX.particle({ x: p.x, y: p.y + 0.4, vy: 1.5, life: 0.4, size: 0.3, size1: 0.1, color: 0xffd34d, tex: FX.tex.glow }); return true;
      case 'heart': case 'half':
        if (P.hp >= P.maxHp) return false;
        P.hp = Math.min(P.maxHp, P.hp + (p.kind === 'heart' ? 2 : 1));
        SFX.play('reinforce'); FX.ring(P.x, P.y + 0.6, 0.2, 1.2, 0xff4060, 0.4); UI.toast(p.kind === 'heart' ? '체력 +50' : '체력 +25', 'gem'); if (p.kind === 'heart') SFX.voice(P.hero.id, 'Repair'); return true;
      case 'armor': P.armor++; SFX.play('ice'); UI.toast('방어막 +1', 'gem'); return true;
      case 'key': P.keys++; SFX.play('uiEquip', 0.8); UI.toast('열쇠 획득', 'gem'); return true;
      case 'ammo': {
        const g = curGun();
        const target = !g.infinite ? g : P.guns.find((x) => !x.infinite && x.ammo < maxAmmo(x));
        if (!target) { P.gold += 20; SFX.play('coin'); UI.toast('탄약 상자 → 부품 +20 (보급 무기의 탄약이 가득합니다)', ''); return true; }
        target.ammo = maxAmmo(target);
        SFX.play('reinforce'); UI.toast(`${target.d.name} 탄약 보충`, 'gem'); return true;
      }
    }
    return true;
  }

  // chests / pedestals / shop / exit — anything the player presses E on
  function spawnChest(x, y, rank, free) {
    const m = spriteMesh(chestTex(rank), 1.6, 1.4);
    m.position.set(x, y + 0.7, 0);
    m.renderOrder = ORD(y);
    scene.add(m);
    const glow = FX.sprite({ x, y: y + 0.5, size: 2.2, color: RANKS[rank].hex, alpha: 0.28, tex: FX.tex.glow, order: 5 });
    const o = { type: 'chest', x, y, rank, free, m, glow, r: 0.6 };
    G.objs.push(o);
    // the tile under the chest blocks movement
    o.solid = true;
    return o;
  }
  function rollLoot(rank) {
    const P = G.P;
    const offeredG = new Set(G.objs.filter((o) => o.type === 'loot' && o.loot && o.loot.kind === 'gun').map((o) => o.loot.id));
    const guns = Object.values(GUNS).filter((g) => !g.noLoot && !P.guns.some((x) => x.id === g.id) && !offeredG.has(g.id));
    const offered = new Set(G.objs.filter((o) => o.type === 'loot' && o.loot && o.loot.kind === 'item').map((o) => o.loot.id));
    const items = ITEMS.filter((it) => ['heart', 'armor'].includes(it.id) || (!P.items.includes(it.id) && !offered.has(it.id)));
    const near = (arr, r) => { for (let d = 0; d <= 3; d++) { const c = arr.filter((x) => Math.abs(x.rank - r) <= d); if (c.length) return c[Math.floor(Math.random() * c.length)]; } return null; };
    const wantGun = guns.length && (P.guns.length === 1 || Math.random() < (P.guns.length >= 4 ? 0.25 : 0.4) || !items.length); // first find is always a gun
    if (wantGun) { const g = near(guns, rank); if (g) return { kind: 'gun', id: g.id }; }
    const it = near(items, rank);
    return it ? { kind: 'item', id: it.id } : { kind: 'gold' };
  }
  function openChest(o) {
    const P = G.P;
    if (!o.free) {
      if (P.keys <= 0) { UI.toast('열쇠가 필요합니다', 'warn'); SFX.play('fail', 0.6); return; }
      P.keys--;
    }
    G.objs.splice(G.objs.indexOf(o), 1);
    killObj(o.m); FX.kill(o.glow);
    SFX.play(o.rank >= 2 ? 'genSS' : 'genS'); SFX.play('uiEquip', 0.7);
    if (o.rank >= 2) SFX.voice(P.hero.id, 'PresentGet');
    FX.summonBurst(o.x, o.y + 0.5, Math.min(4, o.rank + 1), RANKS[o.rank].hex);
    const loot = rollLoot(o.rank + (P.mods.lucky && Math.random() < 0.35 ? 1 : 0));
    if (loot.kind === 'gold') { dropPickup(o.x, o.y, 'gold', 30); return; }
    spawnPedestal(o.x, o.y, loot);
  }
  function spawnPedestal(x, y, loot, price) {
    const o = { type: 'loot', x, y, loot, price: price || 0, r: 0.7, t: 0 };
    if (loot.kind === 'gun') {
      o.vis = new THREE.Group();
      const attach = () => {
        if (o.hand || !o.vis.parent) return;
        const h = makeGunHand(loot.id);
        if (h) { o.vis.position.set(0, 0, 0); h.inner.position.x -= (h.box[0] + h.box[2]) / 2; o.vis.add(h.outer); o.hand = h; h.outer.scale.setScalar(1.15); } // the gun carries the pedestal position itself
      };
      if (SD.ready(GUNS[loot.id].donor)) setTimeout(attach, 0); else setTimeout(() => SD.prepare(GUNS[loot.id].donor).then(attach), Math.max(0, bgAfter - performance.now()));
      scene.add(o.vis);
      o.rank = GUNS[loot.id].rank;
    } else if (loot.kind === 'item') {
      const it = ITEMS.find((i) => i.id === loot.id);
      const im = uiImg[it.icon];
      const t = canvasTex('item_' + it.id, 128, 128, (g) => { if (im) { const s = Math.min(100 / im.width, 100 / im.height); g.shadowColor = 'rgba(0,0,0,0.8)'; g.shadowBlur = 10; g.drawImage(im, 64 - im.width * s / 2, 64 - im.height * s / 2, im.width * s, im.height * s); } });
      o.vis = spriteMesh(t, 0.8, 0.8);
      scene.add(o.vis);
      o.rank = it.rank;
    } else {
      o.vis = spriteMesh(pickupTex(loot.kind), 0.7, 0.7);
      scene.add(o.vis);
      o.rank = 0;
    }
    o.glow = FX.sprite({ x, y: y + 0.6, size: 1.8, color: RANKS[Math.min(3, o.rank)].hex, alpha: 0.35, tex: FX.tex.glow, order: 5 });
    if (price) {
      const mkPrice = (poor) => canvasTex('price' + price + (poor ? 'p' : ''), 256, 80, (g, w, h) => {
        g.fillStyle = 'rgba(8,9,11,0.85)'; g.beginPath(); g.moveTo(20, 6); g.lineTo(w - 6, 6); g.lineTo(w - 20, h - 6); g.lineTo(6, h - 6); g.closePath(); g.fill();
        g.strokeStyle = '#ffcc00'; g.lineWidth = 3; g.stroke();
        if (uiImg.i_gear) { g.drawImage(uiImg.i_gear, 40, 16, 48, 46); g.globalCompositeOperation = 'source-atop'; g.fillStyle = '#ffcc00'; g.fillRect(40, 16, 48, 46); g.globalCompositeOperation = 'source-over'; }
        g.font = 'bold 50px Exo2, sans-serif'; g.fillStyle = poor ? '#ff4a3a' : '#ffcc00'; g.textBaseline = 'middle'; g.fillText(String(price), 100, h / 2 + 2);
      });
      o.texOk = mkPrice(false); o.texPoor = mkPrice(true);
      o.tag = spriteMesh(o.texOk, 1.2, 0.375);
      o.tag.position.set(x, y - 0.35, 0); o.tag.renderOrder = ORD(y) + 0.01;
      scene.add(o.tag);
    }
    o.base = FX.sprite({ x, y: y + 0.05, size: 1.3, aspect: 0.4, color: RANKS[Math.min(3, o.rank)].hex, alpha: 0.5, tex: FX.tex.ring, order: 4 });
    { const pl = spriteMesh(LEVEL.loadTex('prop_plate'), 1.25, 0.5, { color: 0x9aa3ad }); pl.position.set(x, y - 0.02, 0); pl.renderOrder = 3.15; scene.add(pl); o.plate = pl; }
    G.objs.push(o);
    return o;
  }
  function lootName(loot) {
    if (loot.kind === 'gun') return GUNS[loot.id].name;
    if (loot.kind === 'item') return ITEMS.find((i) => i.id === loot.id).name;
    return { heart: '체력 회복 (+50)', armor: '방어막', key: '열쇠', ammo: '탄약 상자' }[loot.kind] || loot.kind;
  }
  function lootDesc(loot) {
    if (loot.kind === 'gun') { const g = GUNS[loot.id]; return `${RANKS[g.rank].key}급 무기 · ${g.desc}`; }
    if (loot.kind === 'item') { const it = ITEMS.find((i) => i.id === loot.id); return `${RANKS[it.rank].key}급 장비 · ${it.desc}`; }
    return { heart: '체력을 50 회복합니다', armor: '피격 1회를 막아 주는 방어막 +1', key: '보급 상자를 여는 열쇠 +1', ammo: '들고 있는 무기의 탄약을 가득 채웁니다' }[loot.kind] || '';
  }
  function takeLoot(o) {
    const P = G.P;
    if (o.price) {
      if (P.gold < o.price) { UI.toast('부품이 부족합니다', 'warn'); SFX.play('fail', 0.6); return; }
      if ((o.loot.kind === 'heart') && P.hp >= P.maxHp) { UI.toast('체력이 가득 찼습니다', 'warn'); return; }
      P.gold -= o.price;
      SFX.play('purchase'); SFX.voice(P.hero.id, 'ActionApprove');
    }
    G.objs.splice(G.objs.indexOf(o), 1);
    killObj(o.vis); FX.kill(o.glow); FX.kill(o.base); if (o.tag) killObj(o.tag); if (o.plate) killObj(o.plate);
    if (o.hand) o.hand.c.dispose();
    const l = o.loot;
    if (l.kind === 'gun') {
      const ng = giveGun(P, l.id, false);
      P.pickT = G.t;
      if (l.mag != null && ng && !P.guns.some((x) => x !== ng && x.id === l.id)) { ng.mag = Math.min(l.mag, magSize(ng)); ng.ammo = l.ammo; }
      SFX.play('rankUp');
      UI.announce('무기 획득', GUNS[l.id].name, GUNS[l.id].desc, GUNS[l.id].rank);
    } else if (l.kind === 'item') {
      applyItem(P, l.id);
      const it = ITEMS.find((i) => i.id === l.id);
      SFX.play(it.rank >= 2 ? 'rankUpSS' : 'rankUp');
      UI.announce('장비 획득', it.name, it.desc, it.rank, it.icon);
    } else {
      collect({ kind: l.kind, val: 1, x: o.x, y: o.y });
    }
    FX.summonBurst(o.x, o.y + 0.5, 2, RANKS[Math.min(3, o.rank)].hex);
    // starting supply: taking one of the three removes the other two
    if (o.starter) {
      G.objs.filter((x) => x.starterLbl).forEach((x) => { G.objs.splice(G.objs.indexOf(x), 1); killObj(x.m); });
      G.objs.filter((x) => x.starter && x !== o).forEach((x) => {
        G.objs.splice(G.objs.indexOf(x), 1);
        killObj(x.vis); FX.kill(x.glow); FX.kill(x.base); if (x.tag) killObj(x.tag); if (x.plate) killObj(x.plate); if (x.hand) x.hand.c.dispose();
        FX.particle({ x: x.x, y: x.y + 0.6, life: 0.4, size: 0.8, size1: 2, color: 0x7fe3ff, tex: FX.tex.glow, alpha: 0.6 });
      });
    }
  }
  // starting supply (ref. Hades' first boon): three free low-rank items in the first room, take one
  function spawnStarterSupply(r) {
    const pool = shuffle(ITEMS.filter((it) => it.rank <= 1 && it.id !== 'heart' && it.id !== 'armor')).slice(0, 3);
    pool.forEach((it, i) => {
      const o = spawnPedestal(r.cx + (i - 1) * (MOBILE || INPUT.isTouch ? 3.3 : 2.4), Math.max(r.y0 + 2.2, r.cy - 2.5), { kind: 'item', id: it.id }); /* close under the hero, clear of the bottom HUD band */
      if (!o) return;
      o.starter = true;
      // the item's name under its icon, readable before walking up (rides on the icon mesh, so it goes away with it)
      const nt = canvasTex('nm_' + it.id, 320, 64, (g, w, h) => { g.fillStyle = 'rgba(8,10,14,0.8)'; g.fillRect(0, 6, w, h - 12); g.fillStyle = RANKS[it.rank].color; g.font = 'bold 30px Godo, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(it.name, w / 2, h / 2 + 1); });
      const ts = MOBILE || INPUT.isTouch ? 1.45 : 1; /* phones: the names read at >= 12px */ const tag = spriteMesh(nt, 2.2 * ts, 0.44 * ts); tag.position.set(0, -1.32 - (ts - 1) * 0.2, 0.01); tag.renderOrder = 3.35; o.vis.add(tag);
    });
    // a floor label over the three: "출격 보급 · 하나 선택" (removed with the pedestals)
    const tex = canvasTex('starterLbl', 512, 80, (g, w, h) => { g.fillStyle = 'rgba(8,10,14,0.75)'; g.fillRect(0, 10, w, h - 20); g.fillStyle = '#7fe3ff'; g.font = 'bold 40px Godo, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('출격 보급 · 하나를 고르세요', w / 2, h / 2 + 2); });
    const lbl = spriteMesh(tex, 5.2, 0.8, { alpha: 0.9 }); lbl.position.set(r.cx, Math.max(r.y0 + 2.2, r.cy - 2.5) - 2.3, 0); /* (kept off-scene: with the pedestals right under the hero, the toast and the name tags say it; a floor banner would sit under the HUD) */ lbl.renderOrder = 3.3;
    G.objs.push({ type: 'deco', x: -999, y: -999, m: lbl, starterLbl: true });
  }
  // ── levels: kills give data, each level offers 3 perks (common ones + the hero's own) ──
  const xpNeed = (lv) => Math.round(24 + (lv - 1) * 15 + (lv - 1) * (lv - 1) * 0.9);
  function gainXp(n) {
    const P = G.P;
    if (!P || P.dead) return;
    P.xp += n * (1 + 0.12 * (P.metaXp || 0));
    if (P.xp >= xpNeed(P.lv) && !G.choosing) G.lvPending = true; // opened at the end of the frame (never over a hero killed later that frame)
  }
  // the max-HP ceiling (half-hearts): the meta upgrade raises it with the base, so it never voids an upgrade
  function hpCap(P) { return P.hero.hp + 8 + (P.metaHp || 0); }
  function perkPool(P) { return PERKS.filter((p) => (!p.hero || p.hero === P.hero.id || (P.hero.perks && P.hero.perks.includes(p.id))) && (P.up[p.id] || 0) < p.max && !(p.id === 'p_hp' && P.maxHp >= hpCap(P))); }
  function levelUp() {
    const P = G.P;
    if (!P || P.dead || G.choosing || G.phase !== 'play') return; // never over a result screen
    P.xp -= xpNeed(P.lv); P.lv++;
    const pool = perkPool(P);
    if (!pool.length) {
      // every module maxed: the level still pays out (a heal + ultimate charge) instead of passing silently
      P.hp = Math.min(P.maxHp, P.hp + 1); P.skill = Math.min(100, P.skill + 25);
      SFX.play('rankUp', 0.7); UI.toast(`Lv.${P.lv} — 강화 모듈 최대치: 체력 +25 · 궁극기 +25%`, 'gem');
      return;
    }
    // usually one of the three is the hero's own perk
    const own = pool.filter((p) => p.hero), com = pool.filter((p) => !p.hero);
    const pick = [];
    const take = (arr) => { const c = arr.filter((p) => !pick.includes(p)); if (c.length) pick.push(c[Math.floor(Math.random() * c.length)]); return c.length; };
    if (own.length && Math.random() < 0.85) take(own);
    for (let guard = 0; pick.length < Math.min(P.cards || 3, pool.length) && guard < 30; guard++) { if (!take(Math.random() < 0.2 ? own : com)) take(pool); }
    G.choosing = pick; G.paused = true; G.chooseAt = performance.now(); refreshHints(); INPUT.stopFire();
    SFX.play('rankUp', 0.9); if ((P.lv - 2) % 3 === 0) SFX.voice(P.hero.id, P.lv % 2 ? 'CoreLink' : 'Reinforce', 1, true);
    // a light ring at her feet: the level-up never hides the hero mid-fight
    FX.ring(P.x, P.y + 0.3, 0.4, 2.2, heroHex(P), 0.5, 0.55);
    if (!(G.room && G.room.active)) FX.pillar(P.x, P.y, 0.5, heroHex(P));
    UI.levelUp(P, pick);
  }
  function choosePerk(i) {
    const P = G.P, p = G.choosing && G.choosing[i];
    if (!p) return;
    if (!TEST && performance.now() - (G.chooseAt || 0) < 450) return; // input lockout: fire / swap keys held at level-up can't pick a card by accident
    G.choosing = null; G.paused = false;
    UI.levelUp(null);
    P.up[p.id] = (P.up[p.id] || 0) + 1;
    const m = P.mods;
    switch (p.id) {
      case 'p_dmg': m.dmg *= 1.12; break;
      case 'p_rof': m.rof *= 1.1; break;
      case 'p_reload': m.reload *= 1.2; break;
      case 'p_hp': P.maxHp = Math.min(hpCap(P), P.maxHp + 2); P.hp = Math.min(P.maxHp, P.hp + 2); break;
      case 'p_speed': m.speed *= 1.07; m.rollCd *= 0.9; break;
      case 'p_crit': m.crit += 0.07; break;
      case 'p_mag': m.mag *= 1.25; P.guns.forEach((x) => { x.mag = magSize(x); }); break;
      case 'p_core': m.skill *= 1.25; break;
      case 'p_cool': m.sk2cd *= 0.85; break;
      case 'p_armor': P.armor += 1; break;
    }
    SFX.play('reinforce', 0.8);
    FX.ring(P.x, P.y + 0.6, 0.3, 2.4, heroHex(P), 0.5);
    UI.toast(`${p.name} Lv.${P.up[p.id]} — ${p.desc}`, 'gem');
    if (P.xp >= xpNeed(P.lv)) FX.later(0.4, levelUp);
  }
  function applyItem(P, id) {
    const m = P.mods;
    P.items.push(id);
    G.stats.items++;
    switch (id) {
      case 'dmg': m.dmg *= 1.25; break;
      case 'rof': m.rof *= 1.2; break;
      case 'reload': m.reload *= 1.4; break;
      case 'crit': m.crit += 0.15; break;
      case 'mag': m.mag *= 1.5; m.ammo *= 1.3; P.guns.forEach((g) => { g.mag = magSize(g); if (!g.infinite) g.ammo = Math.round(g.ammo * 1.3); }); break;
      case 'boots': m.speed *= 1.12; m.rollCd *= 0.6; break;
      case 'heart': if (P.maxHp >= hpCap(P)) { P.armor += 1; UI.toast('최대 체력 한계 — 방어막 +1로 전환', 'gem'); } else P.maxHp = Math.min(hpCap(P), P.maxHp + 2); P.hp = P.maxHp; break;
      case 'armor': P.armor += 2; break;
      case 'pierce': m.pierce += 1; break;
      case 'vamp': m.vamp = 1; break;
      case 'homing': m.homing += 1; break;
      case 'velo': m.velo *= 1.35; break;
      case 'link': m.skill *= 1.5; break;
      case 'thorn': m.thorn = 1; break;
      case 'lucky': m.lucky = 1; break;
      case 'bounce': m.bounce = 1; break;
      case 'split': m.split = 1; break;
      case 'frost': m.frost = 1; break;
      case 'drone': m.drone = 1; makeDrone(P); break;
      case 'explo': m.explo = Math.max(m.explo || 0, 0.15); break;
      case 'orbit': m.orbit = Math.max(m.orbit || 0, 2); break;
      case 'adren': m.adren = 1; break;
      case 'echo': m.echo = 1; break;
      case 'magnet': m.magnet = 1; break;
      case 'chain': m.chain = Math.max(m.chain || 0, 0.15); break;
      case 'berserk': m.berserk = 1; break;
      case 'overclock': m.overclock = 1; break;
      case 'execute': m.execute = 1; break;
      case 'kinetic': m.kinetic = Math.max(m.kinetic || 0, 1.15); break;
      case 'reserve': m.reserve = 1; break;
      case 'medkit': m.medkit = 1; break;
      case 'ghost': m.ghost = 1; break;
    }
    // synergies: both halves owned -> announce once
    for (const sy of SYNERGY) {
      if (P.syn.has(sy.name) || !P.items.includes(sy.a) || !P.items.includes(sy.b)) continue;
      P.syn.add(sy.name);
      if (sy.a === 'bounce') m.bounce = 2;
      if (sy.a === 'velo') { m.pierce += 1; m.velo *= 1.15; }
      if (sy.a === 'dmg') m.critMul = 2.6;
      if (sy.a === 'vamp') m.vampX = 2;
      if (sy.a === 'explo') m.explo = 0.3;
      if (sy.a === 'orbit') m.orbit = 3;
      if (sy.a === 'adren') m.adrenRof = 1;
      if (sy.a === 'chain') m.chain = 0.3;
      if (sy.a === 'kinetic') m.kinetic = 1.3;
      FX.later(0.9, () => { UI.announce('시너지 발동', sy.name, sy.desc, 3); SFX.play('rankUpSS'); FX.summonBurst(P.x, P.y + 0.6, 3, 0xff9420); }, 900);
    }
  }
  // risk / reward: the blood-pact altar trades a heart for a high-rank item
  function shrineTex() {
    return canvasTex('shrine2', 256, 320, (g, w, h) => {
      // stepped hex pedestal
      const hex = (cx, cy, rx, ry) => { g.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + Math.PI / 6; g.lineTo(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry); } g.closePath(); };
      hex(128, 286, 118, 30); g.fillStyle = '#16181d'; g.fill(); g.strokeStyle = '#5a1018'; g.lineWidth = 4; g.stroke();
      const col = g.createLinearGradient(70, 0, 186, 0); col.addColorStop(0, '#22252c'); col.addColorStop(0.5, '#3a3f49'); col.addColorStop(1, '#1c1e24');
      g.fillStyle = col; g.fillRect(74, 150, 108, 136);
      g.fillStyle = '#2b2f37'; g.fillRect(62, 140, 132, 18); g.fillRect(66, 272, 124, 16);
      g.fillStyle = '#ff2f4f'; g.fillRect(74, 158, 108, 4); g.fillRect(74, 266, 108, 4);
      // engraved runes
      g.strokeStyle = 'rgba(255,60,80,0.75)'; g.lineWidth = 3;
      for (let i = 0; i < 3; i++) { const y = 186 + i * 28; g.beginPath(); g.moveTo(100, y); g.lineTo(128, y - 10); g.lineTo(156, y); g.lineTo(128, y + 10); g.closePath(); g.stroke(); }
      // floating blood heart with a halo
      const halo = g.createRadialGradient(128, 70, 6, 128, 70, 80); halo.addColorStop(0, 'rgba(255,40,70,0.75)'); halo.addColorStop(1, 'rgba(255,40,70,0)');
      g.fillStyle = halo; g.fillRect(40, 0, 176, 150);
      g.save(); g.translate(128, 30); heartPath(g, 0, 0, 84); g.fillStyle = '#e8173a'; g.shadowColor = '#ff2f4f'; g.shadowBlur = 26; g.fill();
      g.shadowBlur = 0; g.lineWidth = 5; g.strokeStyle = '#3a0010'; g.stroke(); g.restore();
      g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.ellipse(108, 62, 8, 13, -0.5, 0, Math.PI * 2); g.fill();
    });
  }
  function spawnShrine(x, y) {
    const m = spriteMesh(shrineTex(), 1.4, 1.75);
    m.position.set(x, y + 0.85, 0); m.renderOrder = ORD(y);
    scene.add(m);
    const glow = FX.sprite({ x, y: y + 1.45, size: 2.6, color: 0xff2040, alpha: 0.35, tex: FX.tex.glow, order: 5 });
    const rune = FX.sprite({ x, y: y + 0.1, size: 2.2, aspect: 0.42, color: 0xff2040, alpha: 0.55, tex: FX.tex.ring, order: 3.4, spin: 0.8 });
    const o = { type: 'shrine', x, y, m, glow, rune, r: 0.6, solid: true };
    G.objs.push(o);
  }
  function useShrine(o) {
    const P = G.P;
    if (P.hp <= 2) { UI.toast('체력이 부족해 계약할 수 없습니다', 'warn'); SFX.play('fail', 0.6); return; }
    P.hp -= 2; P.maxHp = Math.max(2, P.maxHp - 2);
    G.objs.splice(G.objs.indexOf(o), 1);
    killObj(o.m); FX.kill(o.glow); FX.kill(o.rune);
    FX.flash(0xff1030, 0.4); FX.shake(0.3); SFX.play('hurt'); SFX.play('genSS');
    FX.summonBurst(o.x, o.y + 0.6, 3, 0xff2040);
    const items = ITEMS.filter((it) => it.rank >= 2 && !P.items.includes(it.id));
    const it = items.length ? items[Math.floor(Math.random() * items.length)] : null;
    // nothing S+ left to give: an S/SS gun she doesn't carry, else a stack of armour
    const guns = Object.keys(GUNS).filter((id) => GUNS[id].rank >= 2 && !GUNS[id].noLoot && !P.guns.some((g) => g.id === id));
    const reward = it ? { kind: 'item', id: it.id } : guns.length ? { kind: 'gun', id: guns[Math.floor(Math.random() * guns.length)] } : { kind: 'item', id: 'armor' };
    spawnPedestal(o.x, o.y - 1.2, reward);
    UI.toast('피의 계약 — 최대 체력 50을 바쳤습니다', 'fail');
  }

  function spawnExit(x, y) {
    const m = spriteMesh(exitTex(), 2.6, 2.6 * 0.62);
    m.position.set(x, y, 0); m.renderOrder = 2.5;
    scene.add(m);
    SFX.play('hatch', 0.8);
    const o = { type: 'exit', x, y, m, r: 1.2, t: 0 };
    o.glow = FX.sprite({ x, y, size: 3.4, aspect: 0.62, color: 0xffcc00, alpha: 0.3, tex: FX.tex.glow, order: 2.6 });
    G.objs.push(o);
    SFX.play('uiStage', 0.6);
  }
  function spawnShop(room) {
    const x = room.cx, y = room.y1 - 2.2;
    // shopkeeper: Labiata behind the counter
    const keeper = SD.ready('labiata') ? makeBody('labiata', HERO_H * 1.12, null, false) : null;
    if (keeper) { keeper.root.position.set(x, y, 0); setFace(keeper, 1); scene.add(keeper.root); keeper.c.setOrder(ORD(y)); }
    const o = { type: 'npc', x, y, keeper, r: 1, t: 0, talked: false };
    G.objs.push(o);
    const F = BAL.shop;
    const stock = [
      { loot: { kind: 'heart' }, price: F.heart },
      { loot: { kind: 'key' }, price: F.key },
      G.P.guns.some((g) => !g.infinite) && Math.random() < 0.5 ? { loot: { kind: 'ammo' }, price: F.ammo } : { loot: { kind: 'armor' }, price: F.armor },
    ];
    const priceOf = (it) => (it.kind === 'gun' ? F.gun[GUNS[it.id].rank] : F.item[Math.min(2, ITEMS.find((i) => i.id === it.id).rank)]);
    for (let k = 0; k < 6 && stock.length < 5; k++) {
      const it = rollLoot(Math.random() < 0.3 + G.fi * 0.15 ? 2 : 1);
      if (it.kind === 'gold' || stock.some((x) => x.loot.id === it.id)) continue;
      stock.push({ loot: it, price: priceOf(it) });
    }
    const n = stock.length;
    const disc = 1 - (G.P.metaLuck || 0) * 0.07; // research: 보급망 확충
    stock.forEach((s, i) => spawnPedestal(room.cx + (i - (n - 1) / 2) * 2.5, room.cy - 1, s.loot, Math.round((s.price + G.fi * 5) * disc)));
  }

  function nearestInteract() {
    const P = G.P;
    let best = null, bd = 1.35;
    for (const o of G.objs) {
      if (o.type === 'npc') continue;
      const d = Math.hypot(P.x - o.x, P.y - o.y);
      if (d < bd + (o.type === 'exit' ? 0.4 : 0)) { bd = d; best = o; }
    }
    return best;
  }
  function dropGun(P) {
    const g = P.guns[P.gi];
    if (!g) return;
    if (g.infinite) { SFX.synth('empty'); UI.toast('기본 무기는 버릴 수 없습니다', 'warn'); return; }
    if (P.pickT && G.t - P.pickT < 1.2) return; // the press right after a pickup never throws the new gun
    // it leaves the hand where it is drawn now and is tossed forward along the aim
    const from = g.hand ? { x: g.hand.outer.position.x, y: g.hand.outer.position.y, rot: g.hand.outer.rotation.z, fl: g.hand.outer.scale.y } : { x: P.x, y: P.y + 0.8, rot: P.aim, fl: 1 };
    if (g.hand) { g.hand.c.dispose(); P.handRoot.remove(g.hand.outer); g.hand = null; }
    P.guns.splice(P.gi, 1);
    equip(P, Math.min(P.gi, P.guns.length - 1));
    const ca = Math.cos(P.aim), sa = Math.sin(P.aim);
    let dist = 2.2;
    while (dist > 0 && LEVEL.hitCircle(P.x + ca * dist, P.y + sa * dist * 0.8, 0.5)) dist -= 0.2;
    dist = Math.max(0, dist);
    const tx = P.x + ca * dist, ty = P.y + sa * dist * 0.8;
    const loot = { kind: 'gun', id: g.id, mag: g.mag, ammo: g.ammo }; // keeps its magazine and reserve
    const th = makeGunHand(g.id);
    if (th) {
      th.outer.position.set(from.x, from.y, 0); th.outer.rotation.z = from.rot; th.outer.scale.set(1, from.fl, 1);
      scene.add(th.outer);
      G.thrown.push({ h: th, x0: from.x, y0: from.y, tx, ty, t: 0, dur: 0.42, rot: from.rot, spin: (ca >= 0 ? -1 : 1) * 14, loot });
    } else spawnPedestal(tx, ty, loot);
    SFX.play('swing', 0.7);
    UI.toast(`${g.d.name} 버림`, '');
  }
  // thrown guns: an arc from the hand to the floor, then they become a normal pickup
  function updateThrown(dt) {
    for (let i = G.thrown.length - 1; i >= 0; i--) {
      const t = G.thrown[i];
      t.t += dt;
      const f = Math.min(1, t.t / t.dur), o = t.h.outer;
      o.position.x = t.x0 + (t.tx - t.x0) * f;
      o.position.y = t.y0 + (t.ty + 0.35 - t.y0) * f + Math.sin(f * Math.PI) * 1.1;
      o.rotation.z = t.rot + t.spin * t.t;
      t.h.c.setOrder(ORD(t.ty) + 0.0003);
      if (f >= 1) {
        t.h.c.dispose(); scene.remove(o);
        G.thrown.splice(i, 1);
        spawnPedestal(t.tx, t.ty, t.loot);
        SFX.play('shell', 0.8); SFX.play('crate', 0.35);
        FX.sparks(t.tx, t.ty + 0.2, 0xffd27a, 6, 2.5, 0.06, 0.3);
        FX.particle({ x: t.tx, y: t.ty + 0.05, life: 0.4, size: 0.4, size1: 1.2, color: 0x8a96a8, tex: FX.tex.dot, alpha: 0.4, normal: true, order: 4 });
      }
    }
  }
  // the floor-painted control guide: shown in the first start room only, faded out under menus / when the option is off
  function refreshHints(dt) {
    const o = G.objs.find((x) => x.guide);
    if (!o || !o.m) return;
    const want = G.opt.hints && !G.tut && !G.choosing && !G.paused && G.lv && G.room === G.lv.start ? 0.6 : 0; // the training panel replaces it
    const mat = o.m.material;
    mat.opacity = dt == null ? want : mat.opacity + (want - mat.opacity) * Math.min(1, dt * 6);
    o.m.visible = mat.opacity > 0.01;
  }
  function teleportTo(r) {
    const P = G.P;
    if (!P || P.dead || G.phase !== 'play') return false;
    if (G.room && G.room.active) { UI.toast('교전 중에는 이동할 수 없습니다', 'warn'); SFX.synth('empty'); return false; }
    if (!r.visited || !(r.cleared || r.type !== 'combat' && r.type !== 'boss')) { UI.toast('클리어한 구역으로만 이동할 수 있습니다', 'warn'); SFX.synth('empty'); return false; }
    if (r === G.room) return false;
    // land in the target room clear of chests, pedestals and the shopkeeper
    const p = freeSpot(r.cx, r.cy - 1.5, r, (x, y) => G.objs.some((o) => o.x > -900 && Math.hypot(o.x - x, o.y - y) < 1.4)) || freeSpot(r.cx, r.cy - 1, r) || [r.cx, r.cy];
    FX.ring(P.x, P.y + 0.6, 0.3, 2, 0x7fe3ff, 0.4); FX.particle({ x: P.x, y: P.y + 0.8, life: 0.4, size: 1, size1: 3, color: 0x7fe3ff, tex: FX.tex.glow, alpha: 0.7 });
    P.x = p[0]; P.y = p[1]; P.roll = null; P.dash = null; P.body.pivot.rotation.z = 0;
    G.cam.x = P.x; G.cam.y = P.y + 0.6;
    FX.ring(P.x, P.y + 0.6, 2, 0.3, 0x7fe3ff, 0.45); FX.particle({ x: P.x, y: P.y + 0.8, life: 0.5, size: 3, size1: 0.5, color: 0x7fe3ff, tex: FX.tex.glow, alpha: 0.8 });
    SFX.play('warp', 0.9);
    P.iframe = Math.max(P.iframe, 0.6);
    return true;
  }
  function interact(o) {
    if (G.P) G.P.pickT = G.t;
    if (o.type === 'chest') openChest(o);
    else if (o.type === 'loot') takeLoot(o);
    else if (o.type === 'exit' && !G.transit && G.P && !G.P.dead && G.P.hp > 0) nextFloor();
    else if (o.type === 'shrine') useShrine(o);
  }
  function updateObjs(dt) {
    const P = G.P;
    for (const o of G.objs) {
      o.t = (o.t || 0) + dt;
      if (o.guide) { refreshHints(dt); continue; }
      if (o.type === 'loot') {
        const fy = o.y + 0.75 + Math.sin(o.t * 2.5) * 0.08;
        if (o.hand) { o.hand.outer.position.set(o.x, fy, 0); o.hand.c.setOrder(ORD(o.y)); }
        else { o.vis.position.set(o.x, fy, 0); o.vis.renderOrder = ORD(o.y); }
        o.glow.alpha = 0.25 + 0.1 * Math.sin(o.t * 3);
        if (o.tag) { const t2 = P.gold >= o.price ? o.texOk : o.texPoor; if (o.tag.material.map !== t2) { o.tag.material.map = t2; o.tag.material.needsUpdate = true; } }
      } else if (o.type === 'exit') {
        o.glow.alpha = 0.25 + 0.15 * Math.sin(o.t * 4);
        if (Math.random() < dt * 8) FX.particle({ x: o.x + rnd(-1, 1), y: o.y + rnd(-0.4, 0.4), vy: rnd(1, 2.5), life: 0.8, size: 0.12, size1: 0, color: 0xffd34d, tex: FX.tex.dot });
      } else if (o.type === 'npc' && o.keeper) {
        o.keeper.c.update(dt);
        if (!o.talked && Math.hypot(P.x - o.x, P.y - o.y) < 5) { o.talked = true; UI.toast('라비아타: 어서 오세요, 사령관님. 필요한 물자를 골라 보세요.', 'gem'); }
      } else if (o.type === 'shrine') {
        o.glow.alpha = 0.3 + 0.12 * Math.sin(o.t * 2.4); o.rune.rot += dt * 0.6;
        if (Math.random() < dt * 6) FX.particle({ x: o.x + rnd(-0.5, 0.5), y: o.y + 0.3, vy: rnd(0.6, 1.4), life: 1.2, size: 0.12, size1: 0, color: 0xff3050, tex: FX.tex.dot });
      } else if (o.type === 'chest') {
        o.glow.alpha = 0.22 + 0.08 * Math.sin(o.t * 3);
      }
      // solid chests: push the player out
      if (o.solid) {
        const d = Math.hypot(P.x - o.x, P.y - o.y);
        if (d < 0.75 && d > 0.001) { const k = (0.75 - d) / d; LEVEL.move(P, (P.x - o.x) * k, (P.y - o.y) * k); }
      }
    }
    const near = !P.dead && nearestInteract();
    if (near) {
      let txt = '';
      if (near.type === 'chest') txt = near.free ? '상자 열기' : `상자 열기 <i class="kc"></i>1`;
      else if (near.type === 'loot' && near.price && near.loot.kind === 'heart' && P.hp >= P.maxHp) txt = '<b class="poor">체력이 가득 찼습니다</b>';
      else if (near.type === 'loot') txt = (near.price ? (P.gold >= near.price ? `구매 <b class="gold">${near.price}</b> · ` : `<b class="poor">부품 부족 ${P.gold}/${near.price}</b> · `) : '획득 · ') + lootName(near.loot);
      else if (near.type === 'shrine') { txt = '피의 계약 — 최대 체력 50 → S급 이상 장비'; tip('shrine', '피의 계약 제단', '최대 체력 한 칸(50)을 영구히 바치고 S급 이상 장비를 얻습니다. 체력이 넉넉할 때만!'); }
      else if (near.type === 'exit') txt = G.fi < FLOORS.length - 1 ? '승강기 탑승 — 다음 구역으로' : '귀환 — 작전 종료';
      UI.prompt(txt, near.x, near.y + 1.6, near.type === 'loot' ? lootDesc(near.loot) : '');
      { const sl = G.objs.find((o) => o.starterLbl); if (sl) sl.m.visible = !near.starter; } /* the supply banner steps aside for the pickup prompt */
      if (INPUT.take('interact')) interact(near);
    } else {
      UI.prompt(null);
      { const sl = G.objs.find((o) => o.starterLbl); if (sl && !sl.m.visible) sl.m.visible = true; }
      if (INPUT.take('interact') && !P.dead && !P.roll) {
        if (!G.objs.some((o) => (o.type === 'loot' || o.type === 'chest' || o.type === 'exit' || o.type === 'shrine') && Math.hypot(P.x - o.x, P.y - o.y) < 3)) {
          // dropping a gun takes a second press within 1 s (pad B / Enter double as "cancel" elsewhere)
          const cg = curGun();
          if (cg && !cg.infinite) {
            if (G.t - (P.dropArmT || -9) < 1) { P.dropArmT = -9; dropGun(P); }
            else { P.dropArmT = G.t; UI.toast(`${cg.d.name} 버리기 — ${INPUT.isTouch ? '줍기 버튼' : UI.K('interact')}을(를) 한 번 더 누르세요`, 'warn'); }
          }
        }
        else if (!(G.t - (P.nearHintT || -9) < 2)) { P.nearHintT = G.t; UI.toast('더 가까이 다가가세요', ''); }
      }
    }
    INPUT.take('interact');
  }

  // ── rooms & floors ─────────────────────────────────────
  function enterRoom(r) {
    G.roomT = 0;
    G.room = r;
    if (r.type === 'shop') tip('shop', '라비아타 상점', '처치·상자에서 모은 부품(톱니)으로 체력·열쇠·장비를 삽니다. 가격표가 붉으면 부품 부족');
    else if (r.type === 'treasure') tip('treasure', '보급 창고', '잠긴 보물 상자는 열쇠 1개로 엽니다. 열쇠는 엘리트 철충·구역 보상·상점에서 얻습니다');
    else if (r.challenge && !r.cleared) tip('challenge', '도전 구역', '들어서면 30초 동안 증원이 몰려옵니다. 버티거나 목표 수를 처치하면 고급 상자');
    else if (r.type === 'boss' && !r.cleared) tip('boss', '보스 구역', '보스는 체력 33%·66%에서 패턴이 바뀝니다. 붉은 예고선과 흐릿한 탄(곧 발사)을 주시하세요');
    if (!r.visited) {
      r.visited = true; r.seen = true;
      G.stats.rooms++;
      if (r.fog) fadeFog(r);
      LEVEL.cur.rooms.forEach((o) => { if (r.doors.some((d) => d.other === o.id)) o.known = true; });
      UI.mapDirty();
    }
  }
  function fadeFog(r) {
    const m = r.fog;
    let t = 0;
    FX.tickers.push((dt) => { t += dt; m.material.opacity = Math.max(0, 0.94 * (1 - t / 0.45)); if (t >= 0.45) { m.visible = false; return false; } return true; });
  }
  function startCombat(r) {
    r.active = true; r.startT = G.t; r.lastHitT = G.t;
    // the player is pulled fully inside before the doors slam, so a door can never close on her
    const P = G.P;
    if (P) {
      const m = P.r + 0.15;
      P.x = clamp(P.x, r.x0 + m, r.x1 - m); P.y = clamp(P.y, r.y0 + m, r.y1 - m);
      if (P.roll) { P.roll = null; P.body.pivot.rotation.z = 0; } // never frozen mid-somersault
    }
    LEVEL.setDoors(r, true);
    if (P && LEVEL.hitCircle(P.x, P.y, P.r)) { const p = freeSpot(P.x, P.y); if (p) { P.x = p[0]; P.y = p[1]; } }
    SFX.play('uiBattle', 0.8); SFX.play('charge', 0.4);
    r.doors.forEach((d) => { FX.sparks(d.cx, d.cy, 0xff4040, 14, 4, 0.12, 0.5); FX.particle({ x: d.cx, y: d.cy, life: 0.4, size: 1, size1: 3, color: 0xff3030, tex: FX.tex.glow, alpha: 0.8 }); });
    if (G.opt.shake) FX.shake(0.12);
    const F = FLOORS[G.fi];
    if (r.type === 'boss') return startBoss(r);
    if (r.challenge) return startChallenge(r);
    const area = r.w * r.h;
    const waves = area > 240 ? 3 : area > 150 ? 2 : (Math.random() < 0.65 ? 1 : 2);
    r.waves = [];
    for (let w = 0; w < waves; w++) {
      const n = Math.round(clamp(2.6 + G.fi * 0.3 + area / 95 + rnd(0, 1) + w * 0.3, 2, [6, 6, 6, 6, 7, 7][G.fi]));
      const pool = F.enemies;
      const list = [];
      for (let i = 0; i < n; i++) list.push(pool[Math.floor(Math.random() * pool.length)]);
      if (F.elites.length && w === waves - 1 && Math.random() < 0.4 + G.fi * 0.1) { list.splice(0, 2, F.elites[Math.floor(Math.random() * F.elites.length)]); }
      // the last two floors can field an elite pair
      if (F.elites.length && G.fi >= 2 && w === 0 && waves > 1 && Math.random() < (G.fi >= 4 ? 0.4 : 0.25)) /* mid floors meet a second elite now and then */ { list.splice(0, 2, F.elites[Math.floor(Math.random() * F.elites.length)]); }
      r.waves.push(list);
    }
    r.waveI = 0;
    spawnWave(r);
    if (G.fi >= 1 && !r.challenge && Math.random() < 0.45) {
      // arena hazard: steam vents that charge (red ring) and burst every few seconds
      const n = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < n; i++) {
        let p = null;
        for (let t = 0; t < 20 && !p; t++) { const x = rnd(r.x0 + 2, r.x1 - 2), y = rnd(r.y0 + 2, r.y1 - 2); if (!LEVEL.hitCircle(x, y, 1) && Math.hypot(x - G.P.x, y - G.P.y) > 3 && G.vents.every((o) => o.room !== r || Math.hypot(o.x - x, o.y - y) > 3)) p = [x, y]; }
        if (p) G.vents.push({ x: p[0], y: p[1], t: rnd(0, 2.5), room: r, ring: FX.sprite({ x: p[0], y: p[1] + 0.05, size: 2.4, aspect: 0.5, color: 0xff4020, alpha: 0.5, tex: FX.tex.ring, order: 4.2 }) });
      }
      if (G.vents.length) UI.toast('구역 경고 — 증기 배출구 작동 중', 'warn');
    }
  }
  function updateVents(dt) {
    for (let i = G.vents.length - 1; i >= 0; i--) {
      const v = G.vents[i];
      if (!v.room.active) { FX.kill(v.ring); G.vents.splice(i, 1); continue; }
      v.t += dt;
      const ph = v.t % 3.2;
      v.ring.alpha = ph > 2.2 ? 0.6 + 0.4 * Math.abs(Math.sin(G.t * 18)) : 0.45;
      if (ph > 2.2 && Math.random() < dt * 14) FX.particle({ x: v.x + rnd(-0.4, 0.4), y: v.y + 0.1, vy: rnd(0.8, 1.6), life: 0.45, size: 0.25, size1: 0.6, color: 0xffb090, tex: FX.tex.dot, alpha: 0.55 });
      v.ring.size = ph > 2.2 ? 2.4 + (ph - 2.2) * 0.4 : 2.4;
      if (ph < v.last) {
        // burst
        FX.particle({ x: v.x, y: v.y + 0.6, life: 0.5, size: 1.2, size1: 2.6, color: 0xffd0b0, tex: FX.tex.glow, alpha: 0.6 });
        for (let k = 0; k < 6; k++) FX.particle({ x: v.x + rnd(-0.5, 0.5), y: v.y + 0.2, vx: rnd(-0.6, 0.6), vy: rnd(2, 4), life: 0.7, size: 0.5, size1: 1.4, color: 0xe8e8f0, tex: FX.tex.dot, alpha: 0.5 });
        SFX.play('spray', 0.5, panOf(v.x));
        const P = G.P;
        const ex = (P.x - v.x) / 1.1, ey = (P.y - v.y) / 0.55;
        if (!P.dead && P.iframe <= 0 && ex * ex + ey * ey < 1) hurtPlayer('증기 배출구');
        for (const e of G.enemies) if (e.alive && e.spawnT <= 0 && !e.boss && Math.hypot(e.x - v.x, e.y - v.y) < 1.2 + e.r) hurtEnemy(e, 25, false, 0, 0, 'hitF');
      }
      v.last = ph;
    }
  }
  const CH_TIME = 30;
  function startChallenge(r) {
    r.chMode = Math.random() < 0.5 ? 'survive' : 'hunt';
    r.chT = r.chMode === 'hunt' ? 40 : CH_TIME; r.chNext = 0; r.chElite = false; r.waves = []; r.waveI = 0;
    r.chGoal = 10 + G.fi * 2; r.chKills = 0;
    FX.later(2.3, () => { if (r.active) UI.toast(r.chMode === 'hunt' ? `40초 안에 ${r.chGoal}기 섬멸 — 성공하면 고급 보급 상자` : '끝까지 버티면 고급 보급 상자 획득', 'gem'); });
    FX.later(0.5, () => G.P && SFX.voice(G.P.hero.id, 'SearchStart'));
    SFX.play('warning', 0.6);
    UI.chTimer(r.chT, r);
  }
  function challengeTick(r, dt) {
    r.chT -= dt; r.chNext -= dt;
    UI.chTimer(Math.max(0, r.chT), r);
    const huntDone = r.chMode === 'hunt' && r.chKills >= r.chGoal;
    if (r.chT <= 0 || huntDone) {
      if (r.chMode === 'hunt' && !huntDone) r.chFail = true;
      G.enemies.forEach((e) => { if (e.alive && e.room === r) killEnemy(e, true); });
      UI.chTimer(null);
      return roomCleared(r);
    }
    let alive = 0; for (const e of G.enemies) if (e.alive) alive++; // counted in place (this runs every frame)
    const cap = 4 + G.fi;
    if (r.chNext <= 0 && alive < cap && r.chT > 3) {
      const F = FLOORS[G.fi], pool = F.enemies, list = [];
      const n = Math.min(cap - alive, 2 + Math.floor(Math.random() * 2) + (r.chT < 12 ? 1 : 0));
      for (let i = 0; i < n; i++) list.push(pool[Math.floor(Math.random() * pool.length)]);
      if (!r.chElite && r.chT < CH_TIME / 2 && F.elites.length) { r.chElite = true; list[0] = F.elites[Math.floor(Math.random() * F.elites.length)]; }
      r.waves.push(list); r.waveI = r.waves.length - 1;
      spawnWave(r);
      r.chNext = alive === 0 ? 1.2 : 3.6;
    }
  }
  function spawnWave(r) {
    const list = r.waves[r.waveI++];
    SFX.play('warp', 0.6);
    const P = G.P;
    list.forEach((k) => {
      let p = null;
      for (let t = 0; t < 30 && !p; t++) {
        const x = rnd(r.x0 + 1.5, r.x1 - 1.5), y = rnd(r.y0 + 1.5, r.y1 - 1.5);
        if (Math.hypot(x - P.x, y - P.y) < 4.5 || LEVEL.hitCircle(x, y, 0.8)) continue;
        p = [x, y];
      }
      if (!p) {
        // fallback: the room corner farthest from the player, never on top of her
        const cs = [[r.x0 + 1.5, r.y0 + 1.5], [r.x1 - 1.5, r.y0 + 1.5], [r.x0 + 1.5, r.y1 - 1.5], [r.x1 - 1.5, r.y1 - 1.5]];
        cs.sort((a, b) => Math.hypot(b[0] - P.x, b[1] - P.y) - Math.hypot(a[0] - P.x, a[1] - P.y));
        p = cs.find((c) => !LEVEL.hitCircle(c[0], c[1], 0.6)) || cs[0];
      }
      const e = spawnEnemy(k, p[0], p[1]);
      e.room = r;
      if (e.elite) { UI.boss(e, true); SFX.play('warning', 0.7); }
    });
  }
  function updateRoom(dt) {
    const r = G.room;
    if (!r || !r.active) return;
    // anti-softlock: if nothing has been hit for 20 s, stragglers (stuck behind cover / in a corner) warp into view
    if (r.type !== 'boss' && G.t - (r.lastHitT || r.startT || G.t) > 20) {
      r.lastHitT = G.t;
      const P = G.P;
      G.enemies.forEach((e) => {
        if (!e.alive || e.boss || e.spawnT > 0) return;
        const a = Math.random() * TAU, p = freeSpot(P.x + Math.cos(a) * 4.5, P.y + Math.sin(a) * 3.5, r) || freeSpot(r.cx, r.cy, r);
        if (!p) return;
        FX.ring(e.x, e.y + 0.5, 0.3, 1.5, 0xff3355, 0.3);
        e.x = p[0]; e.y = p[1]; e.spawnT = 0.6; e.flowT = 0;
        if (e.mark) e.mark.hidden = false;
      });
      SFX.play('warp', 0.5);
    }
    if (r.challenge) return challengeTick(r, dt);
    const alive = G.enemies.some((e) => e.alive);
    if (alive) return;
    if (r.type !== 'boss' && r.waveI < r.waves.length) { spawnWave(r); return; }
    if (r.type !== 'boss') roomCleared(r);
  }
  function roomCleared(r) {
    r.active = false; r.cleared = true;
    LEVEL.setDoors(r, false);
    G.stats.roomsCleared++;
    clearEBullets(true);
    SFX.play('clear', 0.8); SFX.play('doorOpen', 0.7);
    UI.mapDirty();
    {
      /* room-clear items: 예비 탄약고 / 응급 처치 키트 */
      const Q = G.P;
      if (Q && Q.mods.reserve) Q.guns.forEach((g) => { if (!g.infinite) g.ammo = Math.min(maxAmmo(g), g.ammo + Math.ceil(maxAmmo(g) * 0.2)); });
      if (Q && Q.mods.medkit && Q.hp < Q.maxHp && (Q.syn.has('응급 수복') || Q.hp * 2 <= Q.maxHp)) { Q.hp = Math.min(Q.maxHp, Q.hp + (Q.syn.has('응급 수복') ? 2 : 1)); FX.ring(Q.x, Q.y + 0.6, 0.3, 1.4, 0xff4060, 0.45); SFX.play('reinforce', 0.6); UI.toast('응급 처치 키트 — 체력 회복', 'gem'); }
    }
    if (r.type === 'boss') return;
    const P = G.P;
    if (r.challenge && r.chFail) { UI.banner('room', '도전 실패 — 시간 초과', ''); SFX.play('fail', 0.6); return; }
    if (r.challenge) {
      UI.banner('room', '도전 성공', '');
      SFX.voice(P.hero.id, 'SearchEnd', 1, true);
      SFX.play('rankUp', 0.8);
      FX.ring(r.cx, r.cy + 0.5, 0.4, 3.2, 0xffc81e, 0.6);
      const away = Math.hypot(P.x - r.cx, P.y - r.cy) < 2.6 ? [r.cx + (P.x < r.cx ? 3 : -3), r.cy] : [r.cx, r.cy];
      spawnChest(away[0], away[1], Math.min(3, 1 + (G.fi >= 2 ? 1 : 0) + (Math.random() < 0.25 ? 1 : 0)), true);
      dropPickup(away[0], away[1] - 1, 'gold', 10 + G.fi * 4);
      if (!(P.ultT > 0 || P.overdrive > 0)) P.skill = Math.min(100, P.skill + 20 * P.mods.skill);
      return;
    }
    UI.banner('room', '구역 제압 완료', '');
    { const F = FLOORS[G.fi]; if (Array.isArray(F.music) && F.music.length > 1 && G.t - (G.floorMusicT || 0) > 85) { G.floorMusic = F.music.find((m) => m !== G.floorMusic) || G.floorMusic; G.floorMusicT = G.t; SFX.music(G.floorMusic); } }
    // reward
    const roll = Math.random();
    if (roll < 0.14) dropPickup(r.cx, r.cy, 'key');
    // healing gets scarcer with depth (10 % on B1 → 4 % from B6), never zero; low HP still gets a mercy roll
    else if (roll < 0.14 + Math.max(0.03, 0.09 - G.fi * 0.014) || (P.hp <= 2 && roll < 0.4)) dropPickup(r.cx, r.cy, P.hp < P.maxHp ? 'heart' : 'armor');
    else if (roll < 0.42) dropPickup(r.cx, r.cy, 'ammo');
    else if (roll < 0.47 - G.fi * 0.015) dropPickup(r.cx, r.cy, 'armor');
    else if (roll < 0.58) spawnChest(r.cx, r.cy, 0, true);
    dropPickup(r.cx, r.cy, 'gold', Math.round((4 + G.fi * 2) * (G.P.mods.lucky ? 1.5 : 1))); /* 행운의 참치 counts here too */
    if (!(P.ultT > 0 || P.overdrive > 0)) P.skill = Math.min(100, P.skill + 8 * P.mods.skill);
  }
  function startBoss(r) {
    const key = G.bossKeys[G.fi];
    const def = BOSSES[key];
    const e = spawnEnemy(key, r.cx, r.cy + 2.5, { boss: true });
    e.room = r; e.intro = 2.6; e.phase = 0; e.patT = 1;
    G.bossE = e;
    clearEBullets();
    SFX.music({ emperor: 'boss', executioner: 'boss2', goltarion: 'boss3', nidhogg: 'bossGamma', nightqueen: 'bossZeta', doomprime: 'boss10', ironprince: 'bossFinal' }[key] || 'boss');
    SFX.play('warning');
    G.camFocus = { x: e.x, y: e.y + 1, t: 2.2 };
    FX.later(0.6, () => SFX.voice(G.P.hero.id, 'BattleFocus'));
    UI.bossIntro(def);
    FX.later(1.6, () => UI.hideBossIntro());
    FX.later(2.4, () => { if (G.phase === 'play' && e.alive) UI.boss(e); });
  }

  function buildFloor(fi) {
    UI.hideBoss(); UI.chTimer(null); // room-bound HUD (boss bar, challenge timer) never carries over to a new floor
    (G.thrown || []).forEach((t) => { t.h.c.dispose(); scene.remove(t.h.outer); });
    G.thrown = [];
    UI.chTimer(null);
    // dispose previous
    if (G.lv) {
      LEVEL.dispose(G.lv);
      G.props.forEach((p) => { if (p.mesh) killObj(p.mesh); if (p.glow) FX.kill(p.glow); });
      G.objs.forEach((o) => { if (o.m) killObj(o.m); if (o.vis) killObj(o.vis); if (o.tag) killObj(o.tag); if (o.plate) killObj(o.plate); if (o.hand) o.hand.c.dispose(); if (o.keeper) { o.keeper.c.dispose(); scene.remove(o.keeper.root); } [o.glow, o.base, o.rune].forEach((s) => s && FX.kill(s)); });
      G.pickups.forEach((p) => { killObj(p.m); FX.kill(p.glow); });
      G.enemies.concat(G.corpses.map((c) => c.e)).forEach(disposeEnemy);
      G.pbul.forEach((b) => { FX.kill(b.s); FX.kill(b.core); });
      clearEBullets();
    }
    clearMines();
    if (G.P) { G.P.shieldT = 0; G.P.sk2Cd = 0; }
    (G.vents || []).forEach((v) => FX.kill(v.ring));
    Object.assign(G, { enemies: [], corpses: [], pbul: [], ebul: [], pickups: [], props: [], objs: [], hazards: [], vents: [], bossE: null, room: null });
    G.fi = fi;
    if (SD.evict && SD.loaded) { /* any rig outside this floor and the next is released, including a finished run's last floor */
      const keep = new Set([...HEROES.map((h) => h.id), ...(G.P ? [rigOf(G.P.hero)] : []), ...Object.values(GUNS).filter((x) => !x.noLoot || (G.P && G.P.hero.gun === x.id)).map((x) => x.donor), 'labiata', ...floorRigs(fi), ...(fi + 1 < DATA.FLOORS.length ? floorRigs(fi + 1) : [])]);
      SD.loaded().forEach((id) => { if (!keep.has(id)) SD.evict(id); });
    }
    // progress: the deepest floor ever reached unlocks heroes
    try {
      const pr = readObj('lao_rogue_prog'); pr.maxFi = Math.max(-1, Math.floor(Number(pr.maxFi)) || 0);
      if (!TEST && !(pr.maxFi >= fi)) {
        pr.maxFi = fi; localStorage.setItem('lao_rogue_prog', JSON.stringify(pr));
        const h = HEROES.find((x) => UNLOCK[x.id] && UNLOCK[x.id].floor === fi);
        if (h) FX.later(3.2, () => { UI.announce('대원 해금', h.name, `${h.title} — 다음 출격부터 선택 가능`, 3); SFX.play('pickSS'); }, 3200);
      }
    } catch (e) { /* no storage */ }
    { const Fw = FLOORS[fi]; SFX.warm([...Fw.enemies.map((k) => ENEMIES[k].sfx), ...Fw.elites.map((k) => ELITES[k].sfx), 'quake', 'eGolt', 'eRoar', 'ice', 'heart', 'rankUpSS', 'pickSS', 'aftermath', 'expM', 'missile', 'energy', 'charge', 'laserBig',
      /* the everyday combat set, decoded before the first room so no first shot / hit plays silent */
      'rifle', 'gun', 'mg', 'spray', 'hitS', 'hitM', 'hitB', 'hitE', 'hitF', 'expS', 'dieS', 'dieM', 'dieL', 'hurt', 'shield', 'reloadIn', 'reloadOut', 'empty', 'land', 'coin', 'uiCoin', 'clear', 'doorOpen', 'warning', 'reinforce']); }
    const lv = LEVEL.generate(fi, (G.seed + fi * 7919) >>> 0);
    LEVEL.set(lv);
    LEVEL.buildMeshes(lv, scene);
    G.lv = lv;
    buildProps(lv);
    lv.rooms.forEach((r) => {
      if (r.type === 'treasure') {
        { const lk = G.P ? G.P.metaLuck || 0 : 0; spawnChest(r.cx, r.cy, pickW([0, 1, 2, 3], [Math.max(0, 5 - fi * 1.5 - lk), 4, 2 + fi + lk * 0.5, 0.5 + fi + lk * 0.4]), false); }
        if (fi >= 1 && !lv.rooms.some((x) => x.shrine)) { r.shrine = true; spawnShrine(r.x0 + 2, r.y1 - 2.5); }
      }
      if (r.type === 'shop') spawnShop(r);
      if (r.type === 'start') { r.known = true; }
    });
    // room lights: soft pools of the floor colour along walls
    const F = FLOORS[fi];
    (G.lights || []).forEach((l) => FX.kill(l));
    G.lights = [];
    lv.rooms.forEach((r) => {
      for (let i = 0; i < 2; i++) G.lights.push(FX.sprite({ x: r.x0 + (i + 0.5) * r.w / 2, y: r.y1 - 0.4, size: 5, aspect: 0.5, color: F.light, alpha: 0.14, tex: FX.tex.glow, order: 2.2 }));
      if (r.type === 'boss') G.lights.push(FX.sprite({ x: r.cx, y: r.cy, size: r.w, aspect: r.h / r.w, color: 0xff2030, alpha: 0.035, tex: FX.tex.glow, order: 2.2 }));
    });
    // control guide painted on the first start room's floor
    if (fi === 0) {
      const m = spriteMesh(guideTex(), 7.4, 7.4 * 470 / 1024, { alpha: INPUT.isTouch ? 0.8 : 0.6 });
      m.position.set(lv.start.cx + 0.4, lv.start.cy + 2.45 + Math.min(0.8, view.hudShift || 0), 0); /* short windows: kept clear of the bottom HUD */ m.renderOrder = 0.3;
      scene.add(m);
      G.objs.push({ type: 'deco', x: -999, y: -999, m, guide: true });
      spawnStarterSupply(lv.start);
      FX.later(2.5, () => { if (G.phase === 'play' && G.objs.some((o) => o.starter)) UI.toast('출격 보급 — 출격 지점의 장비 3개 중 하나를 고르세요 (하나를 집으면 나머지는 회수)', 'gem'); });
    }
    const P = G.P;
    P.x = lv.start.cx; P.y = lv.start.cy - 1;
    P.roll = null; P.dash = null; P.body.pivot.rotation.z = 0;
    G.cam.x = P.x; G.cam.y = P.y + 0.6;
    enterRoom(lv.start);
    UI.mapDirty();
    floorMusicStart(F);
  }
  // the floor-painted control guide (rebuilt when keys are rebound, so it never shows stale keys)
  function rebuildGuide() {
    const o = G.objs.find((x) => x.guide);
    if (!o || !o.m) return;
    const old = o.m.material.map, nt = guideTex();
    if (old === nt) return;
    o.m.material.map = nt; o.m.material.needsUpdate = true;
    // the previous key layout's texture is released (a rebind no longer leaks a 1024x470 canvas)
    if (old) { for (const k in texCache) if (texCache[k] === old) delete texCache[k]; old.dispose(); }
  }
  function guideTex() {
    {
      const lines = INPUT.isTouch
        ? [['이동', '왼쪽 화면 드래그'], ['조준 · 사격', '조준 패드를 누른 채 드래그'], ['회피', '구르는 동안 무적'], ['스킬 · 보조', '스킬 / 보조 버튼']]
        : [['조준 · 사격', '마우스 이동 · 왼쪽 버튼'], ['이동', 'W A S D / 방향키'], ['회피', `오른쪽 버튼 / ${UI.K('dodge').toUpperCase()}`], ['궁극기 · 보조 스킬', `${UI.K('skill')} · ${UI.K('skill2')}`], ['교체 · 재장전 · 상호작용', `1~9 · ${UI.K('reload')} · ${UI.K('interact')}`], ['전술 지도', UI.K('map').toUpperCase()]];
      const tex = canvasTex('guide' + (INPUT.isTouch ? 't' : 'k') + '2' + lines.map((l) => l[1]).join(), 1024, 470, (g, w, h) => {
        g.textAlign = 'left'; g.textBaseline = 'middle';
        const big = INPUT.isTouch; /* phones: four lines at a larger size, readable on a small screen */
        lines.forEach(([a, b], i) => {
          const y = big ? 62 + i * 112 : 50 + i * 74;
          g.fillStyle = 'rgba(255,204,0,0.9)'; g.beginPath(); g.moveTo(40, y - 24); g.lineTo(60, y - 24); g.lineTo(52, y + 24); g.lineTo(32, y + 24); g.fill();
          g.font = `bold ${big ? 58 : 40}px Godo, sans-serif`; g.fillStyle = '#ffcc00'; g.fillText(a, 84, y);
          const aw = g.measureText(a).width;
          g.font = `bold ${big ? 50 : 36}px Godo, sans-serif`; g.fillStyle = '#e1ffff'; g.fillText(b, 84 + aw + 34, y, w - (84 + aw + 34) - 16);
        });
      });
      return tex;
    }
  }
  function floorMusicStart(F) {
    // each floor rolls one of its tracks for this visit
    G.floorMusic = Array.isArray(F.music) ? F.music[Math.floor(Math.random() * F.music.length)] : F.music;
    G.floorMusicT = G.floorT = G.t; G.inShopMusic = false;
    SFX.music(G.floorMusic);
    UI.banner('floor', `${F.key} · ${F.name}`, F.en);
    FX.later(0.8, () => G.P && SFX.voice(G.P.hero.id, 'StageStart'));
    SFX.play('start', 0.7);
  }
  function nextFloor() {
    if (G.transit || G.phase !== 'play' || !G.P || G.P.dead || G.P.hp <= 0) return; // a pending death never rides the lift
    if (G.fi >= FLOORS.length - 1) { endRun(true); return; }
    G.transit = true;
    SFX.play('elevator', 0.9);
    // the hero rides the lift: a beam of light, then the next floor
    FX.pillar(G.P.x, G.P.y, 0.6, 0xffcc00);
    SFX.play('uiIn', 0.8);
    // the next floor's rigs are normally streamed already; if not, the fade simply holds until they are
    const nf = G.fi + 1;
    // a stalled fetch never leaves the screen black: after 8 s the floor builds with what is ready (enemy rigs fill in when they arrive)
    const ready = Promise.race([
      Promise.all(floorRigs(nf).map((id) => SD.prepare(id))).catch(() => {}),
      new Promise((r) => setTimeout(r, 8000)),
    ]);
    bgLoad(G.lateRigs || []);
    G.lateRigs = [];
    const run = G.stats;
    // the run may have ended (abort / title) while the lift was fading: then don't build the next floor
    UI.fade(() => ready.then(() => {
      try { if (G.phase !== 'play' || G.stats !== run) return; buildFloor(nf); try { renderer.compile(scene, camera); } catch (e) { /* older three */ } }
      finally { G.transit = false; if ((document.hidden || !document.hasFocus()) && G.phase === 'play' && !G.paused && !TEST) UI.togglePause(true); } // a failed build never leaves the lift (and pause) locked; a tab left during the lift pauses on arrival
    }));
  }

  // ── run lifecycle ──────────────────────────────────────
  const COMMON_FX = ['skill_hit_simple', 'simple_explosion', 'Constantia_hit', 'Phoenix_skill1_hit', 'valkyrie_Hit_skill2', 'Thetis_skill2_Hit', 'RPG_skill2_hit', 'Harpy_skill2_missile_last_Hit'];
  function floorRigs(fi) {
    const F = FLOORS[fi];
    return F ? [...F.enemies.map((k) => ENEMIES[k].rig), ...F.elites.map((k) => ELITES[k].rig), BOSSES[G.bossKeys[fi]].rig] : [];
  }
  async function preloadFloor(fi) { bgLoad(floorRigs(fi)); }
  // background streaming: one rig at a time with a breather between, so play never hitches on a burst of parsing
  const bgQ = [];
  let bgBusy = false;
  let bgAfter = 0;
  // resolves when nothing is loading the run / fighting: streaming work waits for these windows
  function calmMoment() {
    return new Promise((res) => {
      const check = () => {
        const wait = bgAfter - performance.now();
        if (wait > 0) return setTimeout(check, wait);
        if (G.phase === 'loading' || (G.phase === 'play' && ((G.room && G.room.active) || G.choosing))) return setTimeout(check, 800);
        res();
      };
      check();
    });
  }
  function bgLoad(ids, delay) {
    ids.forEach((id) => { if (id && !SD.ready(id) && !bgQ.includes(id)) bgQ.push(id); });
    if (delay) bgAfter = Math.max(bgAfter, performance.now() + delay);
    if (bgBusy) return;
    if (performance.now() < bgAfter) { bgBusy = true; setTimeout(() => { bgBusy = false; bgLoad([]); }, bgAfter - performance.now()); return; }
    const next = () => {
      const wait = bgAfter - performance.now();
      if (wait > 0) { bgBusy = true; setTimeout(next, wait); return; } // a run start (or floor entry) paused the stream
      if (G.phase === 'play' && ((G.room && G.room.active) || G.choosing)) { bgBusy = true; setTimeout(next, 800); return; } // parse between fights, not during them
      const id = bgQ.shift();
      if (!id) { bgBusy = false; return; }
      bgBusy = true;
      SD.prepare(id).then(() => setTimeout(next, 220), () => setTimeout(next, 220));
    };
    next();
  }
  async function startRun(heroIdx) {
    /* a failure while setting up a run never leaves the game stuck in 'loading' */
    try { await startRunInner(heroIdx); } catch (e) {
      console.error('[LAO] run start failed', e); G.errors = (G.errors || 0) + 1; bgAfter = 0; // background asset streaming resumes at once
      try { toTitle(); UI.toast('출격 준비 중 오류가 발생했습니다 — 다시 시도해 주세요', 'warn'); } catch (e2) { G.phase = 'title'; }
    }
  }
  async function startRunInner(heroIdx) {
    if (!scene || G.phase === 'loading' || G.phase === 'boot') return; // not booted yet / already starting
    heroIdx = Math.floor(Number(heroIdx));
    if (!(heroIdx >= 0 && heroIdx < ALLH.length)) heroIdx = Math.floor(Math.random() * HEROES.length); /* out of range (or the random slot): a random hero */
    G.heroIdx = heroIdx;
    G.heat = UI.heat ? UI.heat() : 0;
    G.phase = 'loading';
    bgAfter = Math.max(bgAfter, performance.now() + 60000); // title-time streaming stands down at once
    { const t = document.getElementById('title'); if (t) t.hidden = true; }
    UI.loading(0, '작전 지역 데이터 수신 중');
    const hero = ALLH[heroIdx];
    const need = [rigOf(hero), GUNS[hero.gun].donor, 'labiata'];
    const F = FLOORS[0];
    G.bossKeys = [];
    {
      const b1 = FLOORS[0].boss[Math.floor(Math.random() * FLOORS[0].boss.length)];
      // each floor draws from its own pool (data.js FLOORS[].boss), never repeating a boss within the run;
      // the B1 bosses stay on B1 and the last floor is always the Iron Prince
      const used = new Set([b1]), keys = [b1];
      for (let fi = 1; fi < FLOORS.length - 1; fi++) {
        let pool = FLOORS[fi].boss.filter((k) => !used.has(k));
        if (!pool.length) pool = Object.keys(BOSSES).filter((k) => !used.has(k) && !FLOORS[0].boss.includes(k) && k !== 'ironprince');
        const k = pool[Math.floor(Math.random() * pool.length)];
        used.add(k); keys.push(k);
      }
      G.bossKeys = [...keys, 'ironprince'];
    }
    const enemyIds = [...F.enemies.map((k) => ENEMIES[k].rig), BOSSES[G.bossKeys[0]].rig];
    const all = [...new Set([...need, ...enemyIds])];
    bgAfter = Math.max(bgAfter, performance.now() + 60000); // hold the title-time queue while the run loads
    let done = 0;
    const jobs = [...all.map((id) => SD.prepare(id)), ...COMMON_FX.slice(0, 2).map((n) => FXB.prepare(n))];
    await Promise.all(jobs.map((p) => Promise.resolve(p).then(() => UI.loading(++done / (jobs.length + 1)))));
    bgAfter = performance.now() + 8000; // and resume it once the first room is under way
    const missing = () => need.filter((id) => !SD.ready(id));
    for (let tries = 0; missing().length && tries < 2; tries++) { await new Promise((r) => setTimeout(r, 700)); await Promise.all(missing().map((id) => SD.prepare(id))); }
    if (missing().length) {
      UI.loading(1, '');
      { const tip = document.getElementById('loadTip'); if (tip) tip.innerHTML = '<b style="color:#ff5a4a">ERROR</b>작전 데이터를 받지 못했습니다 — 네트워크를 확인한 뒤 다시 출격하세요'; }
      UI.toast('작전 데이터를 받지 못했습니다', 'warn');
      setTimeout(() => { G.phase = 'title'; UI.loaded(); toTitle(); }, 2600);
      return;
    }
    // the remaining gun donors, elites and the next floor stream in one at a time while the first rooms are played
    G.lateRigs = [...new Set(Object.values(GUNS).filter((x) => !x.noLoot).map((x) => x.donor)), ...F.elites.map((k) => ELITES[k].rig)];
    // reset
    if (G.deadGun) { G.deadGun.h.c.dispose(); scene.remove(G.deadGun.h.outer); G.deadGun = null; }
    if (G.P) { G.P.body.c.dispose(); scene.remove(G.P.body.root); G.P.guns.forEach((g) => g.hand && g.hand.c.dispose()); scene.remove(G.P.handRoot); FX.kill(G.P.shadow); if (G.P.odAura) FX.kill(G.P.odAura); if (G.P.shieldFx) G.P.shieldFx.forEach((s) => FX.kill(s)); killDrone(G.P); }
    // a retry straight from the result screen: drop the last run's floor and any pending FX.later callbacks
    FX.clear(); // (buildFloor below disposes the old floor itself)
    G.seed = (Math.random() * 1e9) >>> 0;
    G.tipQ = []; G.lvPending = false; G.zoom = G.zoomApplied = 1; G.camFocus = null; G.slowT = 0; resize(); /* a retry never inherits the death close-up */ G.choosing = null; UI.levelUp(null); // nothing from the last run's level-up survives
    G.transit = false;
    G.stats = { kills: 0, dmg: 0, rooms: 0, roomsCleared: 0, gold: 0, shots: 0, hits: 0, blanks: 0, skills: 0, items: 0, bosses: 0, guns: new Set(), time: 0, cause: '', src: {} };
    if (G.rollRing) { G.rollRing.dispose(); G.sk2Ring.dispose(); G.rollRing = G.sk2Ring = null; }
    G.P = newPlayer(heroIdx);
    clearShow();
    if (G.showDeco) { G.showDeco.bg.visible = G.showDeco.plat.visible = false; G.showDeco.glow.hidden = true; }
    G.phase = 'play';
    G.paused = false;
    buildFloor(0);
    try { [0, 1, 2, 3].forEach((rk) => renderer.initTexture && renderer.initTexture(chestTex(rk))); renderer.compile(scene, camera); } catch (e) { /* older three */ }
    let tutDone = TEST;
    try { tutDone = tutDone || localStorage.getItem(TUT_KEY) === '1' || QS.get('tut') === '0'; } catch (e) { /* ignore */ }
    if (QS.get('tut') === '1') tutDone = false;
    G.tut = null; if (!tutDone) tutorialStart();
    UI.loaded();
    UI.startRun();
  }
  function endRun(win) {
    if (G.phase !== 'play') return;
    if (G.choosing) { G.choosing = null; UI.levelUp(null); } // a run can end under the level-up cards (abort / timer)
    G.paused = false;
    // data chips for the research lab: depth, bosses, kills
    const quit = !win && G.stats.cause === '작전 포기' && G.stats.time < 60; // an instant abort pays nothing
    const chips = quit ? 0 : Math.round((8 + G.fi * 12 + G.stats.bosses * 15 + G.stats.roomsCleared * 2 + Math.floor(G.stats.kills / 6) + (win ? 30 : 0)) * (1 + (G.heat || 0) * 0.25));
    G.stats.chips = chips;
    G.stats.heat = G.heat || 0;
    // clearing at the highest risk level opens the next one
    if (win && !TEST) try { const h = readObj('lao_rogue_heat'); h.max = clamp(Math.floor(Number(h.max) || 0), 0, 5); if ((G.heat || 0) >= (h.max || 0) && (h.max || 0) < 5) { h.max = (h.max || 0) + 1; G.stats.heatUp = h.max; } localStorage.setItem('lao_rogue_heat', JSON.stringify(h)); } catch (e) { /* no storage */ }
    if (!TEST) try {
      // a damaged save (null, a string, a negative number) is repaired instead of losing this run's chips
      let m = null; try { m = JSON.parse(localStorage.getItem('lao_rogue_meta') || '{}'); } catch (e) { m = null; }
      if (!m || typeof m !== 'object') m = {};
      m.chips = Math.max(0, Math.floor(Number(m.chips) || 0)) + chips;
      if (!m.lv || typeof m.lv !== 'object') m.lv = {};
      m.v = 2;
      localStorage.setItem('lao_rogue_meta', JSON.stringify(m));
    } catch (e) { /* no storage */ }
    G.phase = win ? 'win' : 'dead';
    SFX.music(null);
    if (win) { SFX.play('win'); const run = G.stats; setTimeout(() => { if (G.phase === 'win' && G.stats === run) SFX.music('ending'); }, 2500); } // a quick retry keeps its own music
    else { const run = G.stats; setTimeout(() => { if (G.phase === 'dead' && G.stats === run) SFX.music('aftermath'); }, 2200); } // a quiet loop under the fail report
    UI.result(win, G.stats, G.P, G.fi);
  }
  function toTitle() {
    G.phase = 'title'; G.choosing = null; G.paused = false;
    if (G.lv) { buildFloorCleanup(); }
    if (G.showDeco) { G.showDeco.bg.visible = G.showDeco.plat.visible = true; G.showDeco.glow.hidden = false; }
    SFX.music('title');
    UI.title();
  }
  function buildFloorCleanup() {
    LEVEL.dispose(G.lv);
    G.props.forEach((p) => { if (p.mesh) killObj(p.mesh); if (p.glow) FX.kill(p.glow); });
    G.objs.forEach((o) => { if (o.m) killObj(o.m); if (o.vis) killObj(o.vis); if (o.tag) killObj(o.tag); if (o.plate) killObj(o.plate); if (o.hand) o.hand.c.dispose(); if (o.keeper) { o.keeper.c.dispose(); scene.remove(o.keeper.root); } [o.glow, o.base, o.rune].forEach((s) => s && FX.kill(s)); });
    G.pickups.forEach((p) => { killObj(p.m); FX.kill(p.glow); });
    G.enemies.concat(G.corpses.map((c) => c.e)).forEach(disposeEnemy);
    G.pbul.forEach((b) => { FX.kill(b.s); FX.kill(b.core); });
    clearEBullets();
    G.statics.forEach((s) => s.dispose()); G.statics.length = 0;
    clearMines();
    if (G.P && G.P.shieldFx) G.P.shieldFx.forEach((s) => FX.kill(s));
    if (G.deadGun) { G.deadGun.h.c.dispose(); scene.remove(G.deadGun.h.outer); G.deadGun = null; }
    if (G.P) { G.P.body.c.dispose(); scene.remove(G.P.body.root); G.P.guns.forEach((g) => g.hand && g.hand.c.dispose()); scene.remove(G.P.handRoot); FX.kill(G.P.shadow); if (G.P.odAura) FX.kill(G.P.odAura); killDrone(G.P); G.P = null; }
    (G.lights || []).forEach((l) => FX.kill(l)); G.lights = [];
    if (G.ret) { FX.kill(G.ret); G.ret = null; }
    if (G.propRim) { killObj(G.propRim); G.propRim = null; }
    (G.propShadows || []).forEach((s) => FX.kill(s)); G.propShadows = [];
    (G.vents || []).forEach((v) => FX.kill(v.ring)); G.vents = [];
    (G.thrown || []).forEach((t) => { t.h.c.dispose(); scene.remove(t.h.outer); }); G.thrown = [];
    if (G.hbox) { FX.kill(G.hbox); G.hbox = null; }
    if (G.rollRing) { G.rollRing.dispose(); G.sk2Ring.dispose(); G.rollRing = G.sk2Ring = null; }
    [G.pmark, G.pcore, G.pcoreOl].forEach((s) => { if (s) s.alpha = 0; }); // hero markers off on the title
    FX.clear();
    Object.assign(G, { lv: null, enemies: [], corpses: [], pbul: [], ebul: [], pickups: [], props: [], objs: [], hazards: [] });
  }

  // ── title showcase: the selected hero on a lit platform over the key art ──
  const SHOW = { x: -400, y: -400 };
  let show = null;
  function clearShow() {
    if (G.showDeco && G.showDeco.q) G.showDeco.q.visible = false;
    if (!show) return;
    show.body.c.dispose(); scene.remove(show.body.root);
    if (show.hand) { show.hand.c.dispose(); scene.remove(show.hand.outer); }
    show = null;
  }
  function showDeco() {
    if (!G.showDeco) {
      const bg = spriteMesh(new THREE.Texture(images.bg_title), 1, 1, { color: 0x6a6a72 });
      bg.material.map.needsUpdate = true; bg.material.map.minFilter = THREE.LinearFilter;
      bg.renderOrder = -5; scene.add(bg);
      const plat = spriteMesh(exitTex(), 5.2, 5.2 * 0.42, { color: 0xbbbbbb }); plat.position.set(SHOW.x, SHOW.y, 0); plat.renderOrder = 1; scene.add(plat);
    const qt = canvasTex('showq', 256, 256, (c2, w, h) => { c2.font = '900 200px Exo2, Godo, sans-serif'; c2.textAlign = 'center'; c2.textBaseline = 'middle'; c2.shadowColor = '#7fe3ff'; c2.shadowBlur = 30; c2.fillStyle = '#d8f6ff'; c2.fillText('?', w / 2, h / 2 + 10); });
    const q = spriteMesh(qt, 2.4, 2.4, { alpha: 0.85, add: true }); q.position.set(SHOW.x, SHOW.y + 1.9, 0); q.renderOrder = 21; q.visible = false; scene.add(q);
    G.showDeco = { bg, plat, q, glow: FX.sprite({ x: SHOW.x, y: SHOW.y + 1.6, size: 7, aspect: 0.9, color: 0xffb020, alpha: 0.18, tex: FX.tex.glow, order: 2 }) };
  }
  }
  function showcase(i) {
    if (!scene) return;
    if (i < 0) { clearShow(); showDeco(); G.showDeco.q.visible = true; FX.ring(SHOW.x, SHOW.y + 0.2, 0.4, 3.2, 0xd8dee8, 0.5, 0.9); return; } // the random card: an empty stage
    const h = HEROES[i];
    if (!SD.ready(h.id) || !SD.ready(GUNS[h.gun].donor)) { SD.prepare(h.id).then(() => SD.prepare(GUNS[h.gun].donor)).then(() => { if (G.phase === 'title' && UI.sel === i) showcase(i); }); return; }
    clearShow();
    const H = 3.6;
    const body = makeBody(h.id, H, RIGS[h.id].hide, false);
    body.root.position.set(SHOW.x, SHOW.y, 0);
    scene.add(body.root);
    body.c.setOrder(20);
    const hand = makeGunHand(h.gun, h.id);
    if (hand) { hand.outer.scale.setScalar(H / HERO_H); scene.add(hand.outer); hand.c.setOrder(20.01); }
    show = { body, hand, t: 0, i, H };
    showDeco();
    FX.ring(SHOW.x, SHOW.y + 0.2, 0.4, 3.2, new THREE.Color(h.color).getHex(), 0.5, 0.9);
    FX.particle({ x: SHOW.x, y: SHOW.y + H * 0.5, life: 0.5, size: 1, size1: 6, color: new THREE.Color(h.color).getHex(), tex: FX.tex.glow, alpha: 0.5 });
  }
  function showRef() { return show; }
  function renderTitle(dt) {
    if (G.zoomApplied && G.zoomApplied !== 1) { G.zoom = G.zoomApplied = 1; resize(); }
    if (!G.showDeco) return;
    // with no hero on the stage (random card) the empty platform still breathes
    const show = showRef() || (G.showIdle = G.showIdle || { t: 0, H: 3.6, idle: true });
    show.t += dt;
    const portrait = view.w < view.h;
    camera.position.x = SHOW.x - (portrait ? 0 : view.vw * 0.2);
    camera.position.y = SHOW.y + (portrait ? -view.vh * 0.12 + show.H * 0.5 : show.H * 0.45);
    FX.follow(camera.position.x, camera.position.y);
    const d = G.showDeco;
    const im = images.bg_title, ar = im ? im.width / im.height : 1.6;
    let bw = view.vw * 1.08, bh = bw / ar; if (bh < view.vh * 1.08) { bh = view.vh * 1.08; bw = bh * ar; }
    d.bg.scale.set(bw * (1 + 0.03 * Math.sin(show.t * 0.2)), bh * (1 + 0.03 * Math.sin(show.t * 0.2)), 1);
    d.bg.position.set(camera.position.x, camera.position.y, 0);
    d.bg.material.color.setHex(view.w < view.h ? 0x2c2c32 : 0x6a6a72);
    if (show.body) show.body.c.update(dt);
    if (G.showDeco.q && G.showDeco.q.visible) { G.showDeco.q.position.y = SHOW.y + 1.9 + Math.sin(show.t * 2) * 0.12; G.showDeco.q.material.opacity = 0.6 + 0.25 * Math.sin(show.t * 5); }
    const a = Math.sin(show.t * 0.7) * 0.35;
    if (show.hand) {
      const k = show.H / HERO_H;
      const o = show.hand.outer;
      const [ax, ay] = armPos(0, 0, Math.cos(a), Math.sin(a), k);
      o.position.set(SHOW.x + ax, SHOW.y + ay + Math.sin(show.t * 3) * 0.03, 0);
      o.rotation.z = a;
    }
    if (Math.random() < dt * 10) FX.particle({ x: SHOW.x + rnd(-2.2, 2.2), y: SHOW.y + rnd(-0.3, 0.3), vy: rnd(0.6, 1.6), life: 1.6, size: 0.1, size1: 0, color: 0xffd34d, tex: FX.tex.dot, alpha: 0.8 });
  }

  // ── main loop ──────────────────────────────────────────
  G.cam = { x: 0, y: 0 };
  G.corpses = [];
  // contextual first-time tips: each shows once per profile, the first time its situation comes up
  const TIPS_KEY = 'lao_rogue_tips';
  let seenTips = null;
  function tip(id, title, desc) {
    if (TEST) return;
    if (!seenTips) { seenTips = readObj(TIPS_KEY); }
    if (seenTips[id]) return;
    // never pop a big panel mid-fight: tips raised in combat wait until the room is clear
    if (G.room && G.room.active) { G.tipQ = G.tipQ || []; if (!G.tipQ.some((q) => q[0] === id)) G.tipQ.push([id, title, desc]); return; }
    seenTips[id] = 1;
    try { localStorage.setItem(TIPS_KEY, JSON.stringify(seenTips)); } catch (e) { /* ignore */ }
    UI.announce('처음 보는 상황 · TIP', title, desc, 0, 'i_question');
    SFX.play('uiIn', 0.5);
  }
  // first-deploy basic training (forced, skippable): the start room's doors stay locked until every step is done
  // (move → shoot the targets → dodge practice rounds → secondary skill → ultimate → tactical map). Nothing hurts her meanwhile.
  const TUT_KEY = 'lao_rogue_tut';
  function tutorialSteps() {
    const T = INPUT.isTouch, h = G.P ? G.P.hero : HEROES[0];
    return [
      { id: 'move', txt: T ? '<b>이동</b> — 왼쪽 화면을 드래그해 움직이세요' : '<b>이동</b> — <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 로 움직이세요', done: (P, s) => Math.hypot(P.x - s.x0, P.y - s.y0) > 2.5 },
      { id: 'shoot', txt: T ? '<b>조준 · 사격</b> — 조준 패드를 누른 채 드래그해 훈련 표적 2개를 부수세요' : '<b>조준 · 사격</b> — 마우스로 조준, <kbd>왼쪽 버튼</kbd>으로 훈련 표적 2개를 부수세요', done: (P, s) => s.targets && s.targets.every((e) => !e.alive) },
      { id: 'dodge', txt: T ? '<b>회피</b> — 연습탄이 가까이 왔을 때 회피 버튼! 구르는 동안은 맞지 않습니다 (2회)' : `<b>회피</b> — 연습탄이 가까이 왔을 때 <kbd>${UI.K('dodge')}</kbd> / <kbd>오른쪽 버튼</kbd>으로 구르며 피하세요 (2회)`, done: (P, s) => (P.rolledNear || 0) - (s.roll0 || 0) >= 2 },
      { id: 'sk2', txt: `<b>보조 스킬 · ${h.sk2.name}</b> — ${T ? '보조 버튼' : `<kbd>${UI.K('skill2')}</kbd>`}: ${h.sk2.desc}`, done: (P, s) => (G.stats.skills2 || 0) - (s.sk0 || 0) >= 1 },
      { id: 'ult', txt: `<b>궁극기 · ${h.skillName}</b> — 게이지를 채워 두었습니다. ${T ? '스킬 버튼' : `<kbd>${UI.K('skill')}</kbd>`}: ${h.skillDesc}`, done: (P, s) => (G.stats.skills || 0) - (s.ult0 || 0) >= 1 },
      { id: 'map', txt: T ? '<b>전술 지도</b> — 오른쪽 위 미니맵을 눌러 탐색한 구역을 확인하세요. 클리어한 구역은 눌러서 순간이동, 보스 방은 찾으면 붉은 육각형으로 표시' : `<b>전술 지도</b> — <kbd>${UI.K('map')}</kbd> 또는 <kbd>Tab</kbd>으로 탐색한 구역을 확인하세요. 클리어한 구역으로 순간이동, 보스 방은 찾으면 붉은 육각형으로 표시`, done: (P, s) => !!s.map },
    ];
  }
  function tutorialStart() {
    const lv = G.lv, r = lv && lv.start;
    if (!r) return;
    /* the starting supply waits until training is over (one thing at a time) */
    G.objs.filter((x) => x.starter || x.starterLbl).forEach((x) => { G.objs.splice(G.objs.indexOf(x), 1); if (x.m) killObj(x.m); if (x.vis) killObj(x.vis); FX.kill(x.glow); FX.kill(x.base); if (x.tag) killObj(x.tag); if (x.plate) killObj(x.plate); if (x.hand) x.hand.c.dispose(); });
    G.tut = { i: 0, x0: G.P.x, y0: G.P.y, room: r, shotT: 0 };
    LEVEL.setDoors(r, true); // locked in until done (or skipped)
    UI.coach(null);
  }
  function tutorialEnd(skipped) {
    const s = G.tut;
    if (!s) return;
    G.tut = null;
    (s.targets || []).forEach((e) => { if (e.alive) { e.hp = 0; killEnemy(e, true); } });
    clearEBullets(true);
    if (s.room) LEVEL.setDoors(s.room, false);
    UI.coach(null);
    if (s.room && !G.objs.some((o) => o.starter)) { spawnStarterSupply(s.room); FX.later(1.2, () => { if (G.phase === 'play' && G.objs.some((o) => o.starter)) UI.toast('출격 보급 — 출격 지점의 장비 3개 중 하나를 고르세요 (하나를 집으면 나머지는 회수)', 'gem'); }); }
    try { localStorage.setItem(TUT_KEY, '1'); } catch (e) { /* ignore */ }
    SFX.play(skipped ? 'uiPick' : 'clear', 0.7); SFX.play('doorOpen', 0.6);
    if (!skipped) UI.banner('room', '기본 훈련 완료', '문이 열렸습니다 — 출격 보급을 고르고 전진하세요'); /* a clear finish line for the training */
    UI.toast(skipped ? '기본 훈련을 건너뛰었습니다 — 타이틀의 「기본 훈련」으로 다시 할 수 있습니다' : '기본 훈련 완료 — 문이 열렸습니다. B6 철혈 사령부까지 돌파하세요!', 'gem');
  }
  function tutorialTick(dt) {
    const s = G.tut;
    if (!s || !G.P) return;
    const P = G.P, steps = tutorialSteps();
    if (INPUT.take('tutSkip')) return tutorialEnd(true);
    if (UI.mapOpen()) s.map = true;
    const st = steps[s.i];
    if (!st) return tutorialEnd(false);
    if (!s.shown) {
      s.shown = true;
      UI.coach(st.txt, s.i + 1, steps.length, true);
      if (st.id === 'shoot') {
        // two training targets in front of her: sturdy, harmless, rooted
        const r = s.room;
        s.targets = [[r.cx + 3, r.cy - 0.6], [r.cx - 3, r.cy - 0.6]].map(([x, y]) => { const e = spawnEnemy('pupp', x, y); e.dummy = true; e.hp = e.maxHp = 40; e.room = r; return e; });
      }
      if (st.id === 'dodge') s.roll0 = P.rolledNear || 0;
      if (st.id === 'sk2') s.sk0 = G.stats.skills2 || 0; /* each skill step counts only uses made during it */
      if (st.id === 'ult') s.ult0 = G.stats.skills || 0;
      if (st.id === 'sk2') P.sk2Cd = 0;
      if (st.id === 'ult') P.skill = 100;
    }
    // dodge practice: slow, harmless rounds lobbed at her from the room edge
    if (st.id === 'dodge') {
      s.shotT -= dt;
      if (s.shotT <= 0) { s.shotT = 1.1; const r = s.room, x = P.x < r.cx ? r.x1 - 1.5 : r.x0 + 1.5, y = r.cy; G.shooter = '연습탄'; for (let k = -1; k <= 1; k++) ebullet(x, y, Math.atan2(P.y + 0.42 - y, P.x - x) + k * 0.18, 4.2, { c: 'b', size: 0.3 }); }
    }
    if (st.done(P, s)) {
      SFX.play('uiEquip', 0.6);
      s.i++; s.shown = false;
      if (s.i >= steps.length) tutorialEnd(false);
    }
  }
  function step(dt) {
    G.t += dt;
    if (!G.tut) G.stats.time += dt; /* the training lap is not part of the run clock */
    const P = G.P;
    updatePlayer(dt);
    // room transitions
    const r = LEVEL.roomAt(P.x, P.y);
    if (r && r !== G.room) enterRoom(r);
    if (r && r === G.room && !r.cleared && !r.active && !P.dead) {
      const inset = P.x > r.x0 + 0.5 && P.x < r.x1 - 0.5 && P.y > r.y0 + 0.5 && P.y < r.y1 - 0.5;
      r.inT = (r.inT || 0) + dt;
      if ((inset || r.inT > 1.2) && G.t - (G.floorT || 0) > 2.5) startCombat(r);
    }
    if (!r && G.room && !LEVEL.roomAt(P.x, P.y)) { /* in a corridor */ }
    updateEnemies(dt);
    updatePBullets(dt);
    updateEBullets(dt);
    updatePickups(dt);
    updatePropFlash(dt);
    updateMines(dt);
    updateObjs(dt);
    updateThrown(dt);
    updateVents(dt);
    G.roomT = (G.roomT || 0) + dt;
    if (G.room && G.room.type === 'shop' && G.roomT > 1.5 && !G.inShopMusic) { G.inShopMusic = true; SFX.music('shop'); }
    else if (G.inShopMusic && (!G.room || G.room.type !== 'shop') && G.roomT > 1.5) { G.inShopMusic = false; SFX.music(G.floorMusic); }
    updateRoom(dt);
    tutorialTick(dt);
    if (G.tipQ && G.tipQ.length && !(G.room && G.room.active) && !G.choosing && !G.lvPending) { const q = G.tipQ.shift(); tip(q[0], q[1], q[2]); } // never under a level-up opening this frame
    if (G.lvPending && !G.choosing && P && !P.dead && P.hp > 0) { G.lvPending = false; if (P.xp >= xpNeed(P.lv)) levelUp(); }
    // burn zones (fire cannon)
    for (let i = G.hazards.length - 1; i >= 0; i--) {
      const h = G.hazards[i];
      h.t -= dt; h.tick -= dt;
      if (Math.random() < dt * 14) FX.particle({ x: h.x + rnd(-h.r, h.r) * 0.8, y: h.y + rnd(-h.r, h.r) * 0.5, vy: rnd(0.5, 1.5), life: 0.5, size: 0.45, size1: 0.1, color: Math.random() < 0.5 ? 0xff5a1f : 0xffb040, tex: FX.tex.glow });
      if (h.tick <= 0) { h.tick = 0.3; G.enemies.forEach((e) => { if (e.alive && e.spawnT <= 0 && Math.hypot(e.x - h.x, e.y - h.y) < h.r + e.r) hurtEnemy(e, h.dmg, false, 0, 0); }); }
      if (h.t <= 0) G.hazards.splice(i, 1);
    }
    if (Math.random() < dt * 6) {
      const F = FLOORS[G.fi];
      FX.particle({ x: G.cam.x + rnd(-view.vw / 2, view.vw / 2), y: G.cam.y + rnd(-view.vh / 2, view.vh / 2), vx: rnd(-0.2, 0.2), vy: rnd(0.05, 0.3), life: rnd(2.5, 4), size: rnd(0.04, 0.09), size1: 0, color: F.light, alpha: 0.5, fadeIn: 1, tex: FX.tex.dot, order: 5 });
    }
    for (let i = G.statics.length - 1; i >= 0; i--) { const s = G.statics[i]; s.update(dt); if (s.done) { s.dispose(); G.statics.splice(i, 1); } }
  }

  function render(dt, rdt) {
    const P = G.P;
    const dg = G.deadGun;
    if (dg && rdt) {
      const o = dg.h.outer;
      if (dg.bounces < 3) {
        dg.vy -= 14 * rdt;
        o.position.x += dg.vx * rdt; o.position.y += dg.vy * rdt; o.rotation.z += dg.spin * rdt;
        if (o.position.y <= dg.floor && dg.vy < 0) {
          o.position.y = dg.floor; dg.vy *= -0.38; dg.vx *= 0.55; dg.spin *= 0.4; dg.bounces++;
          SFX.play('shell', 0.7); FX.sparks(o.position.x, o.position.y, 0xffd27a, 4, 2, 0.06, 0.25);
          if (dg.bounces >= 3) o.rotation.z = Math.round(o.rotation.z / Math.PI) * Math.PI; // comes to rest flat
        }
      }
      dg.h.c.setOrder(ORD(dg.floor) + 0.0001);
    }
    if (P) {
      // hero
      const b = P.body;
      b.root.position.set(P.x, P.y, 0);
      b.c.update(dt);
      // skating heroes (케시크's wheel boots): the source move clip is a glide, so the body leans into the push,
      // sways side to side with each stride and kicks up sparks from the wheels
      if (P.hero.skate && !P.roll && !P.dash) {
        P.skateK = (P.skateK || 0) + ((P.moving ? 1 : 0) - (P.skateK || 0)) * Math.min(1, dt * 8);
        const k = P.skateK, dir = P.lastDir ? Math.sign(P.lastDir[0]) || 0 : 0;
        b.pivot.rotation.z = (-dir * 0.16 + Math.sin(G.t * 7) * 0.07) * k;
        b.root.position.y += Math.abs(Math.sin(G.t * 7)) * 0.07 * k;
        if (P.moving && Math.random() < dt * 14) FX.particle({ x: P.x + rnd(-0.25, 0.25), y: P.y + 0.04, vx: -(P.lastDir ? P.lastDir[0] : 0) * 2.5 + rnd(-0.6, 0.6), vy: rnd(0.3, 1.2), grav: 6, life: 0.3, size: 0.1, size1: 0.02, color: 0xffc070, tex: FX.tex.dot, alpha: 0.9 });
      }
      const blink = P.iframe > 0 && !P.roll && Math.floor(G.t * 20) % 2 === 0;
      b.c.setOpacity(blink ? 0.6 : 1); // a gentle blink: she stays readable in boss rooms
      if (P.hurtFlash > 0) { const on = Math.sin(G.t * 50) > 0; b.c.setTint(on ? 1.7 : 1, on ? 0.55 : 1, on ? 0.55 : 1); } /* a red blink, never a white-out that hides her under explosion FX */ else if (P.overdrive > 0) b.c.setTint(1.1, 1.35, 1.0); else b.c.setTint(1, 1, 1);
      // standing "behind" a tall boss / elite would hide her under its sprite: draw her in front instead
      let oy = P.y;
      for (const e of G.enemies) if (e.alive && (e.boss || e.elite) && Math.abs(P.x - e.x) < e.r + 0.9 && P.y > e.y && P.y - e.y < e.h * 0.85) oy = Math.min(oy, e.y - 0.05);
      P.ordY = oy;
      b.c.setOrder(ORD(oy));
      P.shadow.x = P.x; P.shadow.y = P.y + 0.02;
      poseHand(P);
      { const g = P.guns[P.gi], ms = g ? magSize(g) : 1;
        const st = !g || P.dead || P.reloadT > 0 ? 0 : g.mag <= 0 ? (!g.infinite && g.ammo <= 0 ? 3 : 2) : g.mag <= Math.max(1, Math.floor(ms * 0.25)) ? 1 : 0;
        UI.ammoWarn(st, P.x, P.y + HERO_H + (P.sk2Cd > 0 ? 0.75 : 0.5), g ? g.mag : 0); /* clear of her head */ }
      UI.reloadGauge(P.reloadT > 0 && !P.dead ? clamp(1 - P.reloadT / (P.reloadMax || 1), 0, 1) : -1, P.x, P.y + HERO_H + (P.sk2Cd > 0 ? 0.48 : 0.22));
      if (!G.hbox) G.hbox = FX.sprite({ x: 0, y: 0, size: 0.16, color: 0xffffff, alpha: 0, tex: FX.tex.dot, order: L.PROJ + 2 });
      const danger = G.ebul.some((b) => Math.abs(b.x - P.x) < 3 && Math.abs(b.y - P.y) < 3);
      G.hbox.x = P.x; G.hbox.y = P.y + 0.42; G.hbox.alpha += ((danger && !P.dead ? 0.95 : 0) - G.hbox.alpha) * Math.min(1, rdt * 10);
      const g = curGun();
      if (g && g.hand) g.hand.c.setOpacity(blink ? 0.35 : 1);
      // aim reticle on the target
      if (P.target && P.target.alive) {
        if (!G.ret) G.ret = FX.sprite({ x: 0, y: 0, size: 0.9, color: 0xffcc00, alpha: 0.85, tex: FX.tex.ring, order: L.PROJ - 3 });
        G.ret.x = P.target.x; G.ret.y = P.target.y + P.target.h * 0.42; G.ret.sz = (P.target.r * 2.4) * (1 + 0.08 * Math.sin(G.t * 10)); G.ret.alpha = 0.7; G.ret.hidden = false;
      } else if (G.ret) G.ret.hidden = true;
    }
    for (const e of G.enemies) {
      // (an enemy whose rig is still streaming has no body yet: its glow placeholder, shadow, HP bar and telegraph still follow it)
      if (e.body) {
        e.body.root.position.set(e.x, e.y, 0);
        setFace(e.body, e.face);
        if (e.spawnT <= 0) e.body.c.update(dt * (e.stun > 0 ? 0.2 : 1));
        if (e.flash > 0 && e.def.pale) { const t = e.def.tint; e.body.c.setTint(t[0] * 1.08, t[1] * 1.02, t[2] * 1.02); }
        else if (e.flash > 0) e.body.c.setTint(e.boss ? 1.16 : 2.1, e.boss ? 1.1 : 1.9, e.boss ? 1.1 : 1.9); // bosses only glint, so pale ones never blow out under bloom
        else if (e.state === 'arm') { const on = Math.sin(G.t * 40) > 0; e.body.c.setTint(1.8, on ? 0.35 : 1, on ? 0.3 : 0.9); } // kamikaze about to burst: hard red blink
        else if (e.stun > 0 || e.slowT > 0) e.body.c.setTint(0.7, 0.85, 1.4);
        else if (e.elite) e.body.c.setTint(1.15, 0.85, 0.85);
        else if (!e.boss) { const t = e.def.tint; const lift = G.fi === 1 ? 1.18 : 1.08; /* a touch brighter than the floor (B2's dark brick most of all) so dark rigs never sink into it */ if (t) e.body.c.setTint(t[0] * lift, t[1] * lift, t[2] * lift); else e.body.c.setTint(lift, lift, lift); } // keeps a variant's own tint (red kamikaze drones)
        else { const t = e.def.tint || [1, 1, 1], ph = e.phase || 0, lb = e.def.pale ? 1 : 1.1; /* dark bosses lift off dark arena floors */ e.body.c.setTint(t[0] * lb, t[1] * lb * (1 - ph * 0.15), t[2] * lb * (1 - ph * 0.2)); }
        e.body.c.setOrder(ORD(e.y));
      }
      if (e.shadow) { e.shadow.x = e.x; e.shadow.y = e.y + 0.02; }
      if (e.ph) { e.ph.x = e.x; e.ph.y = e.y + e.h * 0.4; e.ph.alpha = 0.4 + 0.2 * Math.sin(G.t * 8); }
      if (e.aura) { e.aura.x = e.x; e.aura.y = e.y + e.h * 0.4; e.aura.alpha = 0.14 + 0.06 * Math.sin(G.t * 5); }
      if (e.bar) {
        const f = clamp(e.hp / e.maxHp, 0, 1), show = f < 0.999 && e.spawnT <= 0;
        e.bar.alpha = show ? 1 : 0; e.barBg.alpha = show ? 0.75 : 0;
        e.barBg.x = e.x; e.barBg.y = e.y + e.h + 0.12;
        e.bar.sz = 0.8 * f; e.bar.x = e.x - 0.4 * (1 - f); e.bar.y = e.barBg.y;
      }
      // telegraph line (snipers / chargers / boss lasers)
      if (e.tele && e.tele.t > 0) {
        const len = e.tele.charge ? 7 : 14;
        if (!e.teleS) e.teleS = FX.sprite({ x: 0, y: 0, size: 0.08, aspect: len / 0.08, color: e.tele.charge ? 0xff8a20 : 0xff2040, alpha: 0.7, tex: FX.tex.white, order: L.PROJ - 1 });
        const sw = e.tele.sweep, a = sw ? sw[0] + (sw[1] - sw[0]) * ((G.t * 1.6) % 1) : e.tele.a, cy = e.y + e.h * 0.45;
        e.teleS.x = e.x + Math.cos(a) * len / 2; e.teleS.y = cy + Math.sin(a) * len / 2; e.teleS.rot = a - Math.PI / 2;
        e.teleS.alpha = 0.35 + 0.35 * Math.sin(G.t * 30); e.teleS.hidden = false;
        e.teleS.size = e.teleS.sz = 0.06 + (e.tele.charge ? 0.5 : 0.06);
        e.teleS.aspect = len / e.teleS.sz;
      } else if (e.teleS) e.teleS.hidden = true;
    }
    G.corpses.forEach((c) => { if (c.e.teleS) c.e.teleS.hidden = true; });
    // camera
    if (G.bossE && G.bossE.alive) {
      const [, sy] = worldToScreen(G.bossE.x, G.bossE.y + G.bossE.h);
      const bb = document.getElementById('bossBar');
      if (bb) { if (!bb.bot || G.t - (bb.botT || 0) > 1) { bb.bot = bb.offsetTop < view.h * 0.5 ? bb.offsetTop + bb.offsetHeight : 1; bb.botT = G.t; } bb.classList.toggle('under', sy < Math.max(view.h * 0.2, bb.bot + 12)); } /* the bar fades whenever the boss stands under it */
    }
    if (P) {
      let tx = P.x, ty = P.y + 0.6;
      const bz = G.bossE && G.bossE.alive && G.room && G.room.active && G.room.type === 'boss' ? G.bossE : null;
      if (G.camFocus && G.camFocus.t > 0) { G.camFocus.t -= rdt; tx = G.camFocus.x; ty = G.camFocus.y; }
      else if (bz) { tx = P.x + (bz.x - P.x) * 0.45; ty = P.y + 0.6 + (bz.y + bz.h * 0.4 - P.y - 0.6) * 0.45; ty = Math.max(ty, bz.y + bz.h + 0.6 - view.vh * (G.zoom || 1) * 0.3); }
      else {
        const src = INPUT.aim();
        if (src && src.kind === 'mouse' && G.opt.camLook !== false) { const [wx, wy] = screenToWorld(src.x, src.y); tx += clamp((wx - P.x) * 0.22, -2.2, 2.2); ty += clamp((wy - P.y) * 0.22, -1.6, 1.6); }
        else if (P.target || (src && src.kind === 'stick')) { tx += Math.cos(P.aim) * 1.0; ty += Math.sin(P.aim) * 0.8; }
      }
      // keep her clear of the bottom HUD band (gauges, weapon panel) and of the top panels
      const focus = G.camFocus && G.camFocus.t > 0;
      if (!focus && G.room && G.room.type === 'shop') { ty = (ty + G.room.cy + 1.2) / 2; ty = Math.max(ty, G.room.y1 - 2.2 + 2.6 - view.vh * (G.zoom || 1) * 0.5); }
      // the clamps follow the current zoom (boss arenas zoom out), so they never pull the boss off-screen
      const vz = view.vh * (G.zoomApplied || 1);
      if (!focus) ty = clamp(ty, P.y + HERO_H + 0.3 - vz * 0.36, P.y + vz * 0.2);
      const k = 1 - Math.exp(-rdt * (focus ? 4 : 6));
      G.cam.x += (tx - G.cam.x) * k; G.cam.y += (ty - G.cam.y) * k;
      if (!Number.isFinite(G.cam.x) || !Number.isFinite(G.cam.y)) { G.cam.x = P.x; G.cam.y = P.y; } // one bad aim value never strands the camera at NaN
      if (!focus) G.cam.y = clamp(G.cam.y, P.y + HERO_H + 0.3 - vz * 0.36, P.y + vz * 0.22); // she never sinks into the bottom HUD band
      // boss fights: keep the boss's head below the boss-bar band (as far as the hero's own margin allows)
      if (!focus && bz) {
        const bbEl = document.getElementById('bossBar'), barPx = bbEl && bbEl.bot > 1 ? bbEl.bot + 14 : 110; /* the bar's measured bottom edge (small windows scale it) */
        const band = (barPx / Math.max(1, view.h)) * vz, need = bz.y + bz.h + 0.3 + band - vz / 2 + (view.hudShift || 0) * (G.zoomApplied || 1);
        if (G.cam.y < need) G.cam.y = Math.min(need, P.y + vz * 0.3);
      }
    }
    // wider view in boss arenas
    let zt = G.room && G.room.type === 'boss' && G.room.active ? (view.h < 700 ? 1.45 : 1.32) : 1; /* short windows zoom out further so the boss clears its bar */
    if (zt > 1 && G.bossE && G.bossE.alive && P) {
      // zoom out until both the hero and the boss (with margin) fit
      // vertical margin includes the boss's height and the boss-bar band at the top of the screen
      const need = Math.max((Math.abs(G.bossE.x - P.x) + 5) / view.vw, (Math.abs(G.bossE.y + G.bossE.h * 0.5 - P.y) + G.bossE.h * 0.5 + 6) / view.vh);
      zt = clamp(Math.max(zt, need), 1, 2.15);
    }
    if (P && P.dead) zt = 0.62; // the camera closes in on a fallen hero
    G.zoom = (G.zoom || 1) + (zt - (G.zoom || 1)) * Math.min(1, rdt * 2.5);
    if (Math.abs(G.zoom - (G.zoomApplied || 1)) > 0.002) {
      G.zoomApplied = G.zoom;
      camera.left = -view.vw / 2 * G.zoom; camera.right = view.vw / 2 * G.zoom; camera.top = view.vh / 2 * G.zoom; camera.bottom = -view.vh / 2 * G.zoom;
      camera.updateProjectionMatrix();
    }
    // dense bullet storms: less bloom so overlapping glows don't wash the screen out
    const load = G.ebul.length + G.pbul.length * 1.5;
    const bt = load > 160 ? 0.42 : load > 80 ? 0.56 : 0.75;
    bloom.strength += (bt - bloom.strength) * Math.min(1, rdt * 4);
    if (P) {
      // cooldown arcs drawn on the character (as Rampalion's leg / shield gauges in the action game):
      // Shift = a thin ellipse under the feet, E = a small ring above the head; both only while recharging
      if (!G.rollRing) {
        G.rollRing = arcGauge(0.5, 0.045, 0x5af0be, 0.32, 3.7);
        G.sk2Ring = arcGauge(0.17, 0.045, { frag: 0xffd66e, shield: 0x9dff7a, turret: 0xffc860, rush: 0x7affd4, sleep: 0xb08cff }[P.hero.sk2.id] || 0xffffff, 1, L.PROJ + 2.5);
      }
      {
        const total = BAL.rollTime + BAL.rollCd * P.mods.rollCd;
        const left = P.roll ? total - P.roll.t : P.rollCd;
        G.rollRing.set(left > 0 && !P.dead ? 1 - left / total : 1, P.x, P.y + 0.04);
        const sk = P.hero.sk2;
        G.sk2Ring.set(P.sk2Cd > 0 && !P.dead ? 1 - P.sk2Cd / (P.sk2Max || sk.cd) : 1, P.x, P.y + HERO_H + 0.2);
      }
      if (!G.pmark) G.pmark = FX.sprite({ x: 0, y: 0, size: 1.0, aspect: 0.4, color: 0xffcc00, alpha: 0.4, tex: FX.tex.ring, order: 3.5 });
      G.pmark.x = P.x; G.pmark.y = P.y + 0.03; G.pmark.alpha = P.dead ? 0 : (G.ebul.length > 12 ? 0.7 : 0.35) + 0.1 * Math.sin(G.t * 4);
      // the hitbox core (bullet-hell style): drawn over every bullet, brighter the busier the screen
      if (!G.pcore) {
        G.pcoreOl = FX.sprite({ x: 0, y: 0, size: 0.36, color: 0x000000, alpha: 0.9, tex: FX.tex.dot, normal: true, order: L.PROJ + 3 });
        G.pcore = FX.sprite({ x: 0, y: 0, size: 0.2, color: 0xffffff, alpha: 1, tex: FX.tex.dot, order: L.PROJ + 3.1 });
      }
      // bottom HUD (hero / ultimate / weapon panels) turns see-through while bullets or enemies pass beneath it
      if (((G.hudT = (G.hudT || 0) + 1) & 3) === 0) {
        const band = view.h - 190 * (G.opt.hudScale || 1);
        let under = false;
        for (let k = 0; k < G.ebul.length && !under; k++) { const b = G.ebul[k]; if (worldToScreen(b.x, b.y)[1] > band) under = true; }
        for (let k = 0; k < G.enemies.length && !under; k++) { const e = G.enemies[k]; if (e.alive && worldToScreen(e.x, e.y + e.h * 0.5)[1] > band) under = true; }
        if (under !== G.hudGhost) { G.hudGhost = under; document.body.classList.toggle('hudghost', under); }
        // the top panels (minimap, elite bar; hero / weapon panels on touch) fade the same way
        const tb = 150 * (G.opt.hudScale || 1);
        let over = false;
        for (let k = 0; k < G.ebul.length && !over; k++) { const b = G.ebul[k]; const sy = worldToScreen(b.x, b.y)[1]; if (sy < tb && sy > 0) over = true; }
        for (let k = 0; k < G.enemies.length && !over; k++) { const e = G.enemies[k]; if (!e.alive) continue; const sy = worldToScreen(e.x, e.y + e.h * 0.5)[1]; if (sy < tb && sy > 0) over = true; }
        if (over !== G.topGhost) { G.topGhost = over; document.body.classList.toggle('topghost', over); }
      }
      edgeArrows();
      const ca = P.dead ? 0 : G.ebul.length > 6 ? 1 : 0.45;
      G.pcore.x = G.pcoreOl.x = P.x; G.pcore.y = G.pcoreOl.y = P.y + 0.42;
      G.pcore.alpha = ca; G.pcoreOl.alpha = ca * 0.85;
    }
    const sh = G.opt.shake ? FX.state.shake : 0;
    camera.position.x = G.cam.x + (sh ? rnd(-1, 1) * sh * 0.5 : 0);
    // short windows: the bottom HUD band takes a bigger share of the screen, so the view shifts down to keep the action above it
    camera.position.y = G.cam.y - (view.hudShift || 0) * (G.zoomApplied || 1) + (sh ? rnd(-1, 1) * sh * 0.5 : 0);
    FX.follow(camera.position.x, camera.position.y);
  }

  function playFrame(rdt) {
    // slow motion (hits, boss death)
    let ts = 1;
    if (G.slowT > 0) { G.slowT -= rdt; ts = G.P.dead ? 0.35 : 0.3; }
    const dt = rdt * ts;
    step(dt);
    FX.update(dt);
    render(dt, rdt);
  }
  // headless fast-forward for the test bot (the browser may not schedule animation frames in the background)
  function sim(seconds, dt = 1 / 30) {
    for (let t = 0; t < seconds; t += dt) {
      if (window.BOT && BOT.tick) BOT.tick();
      if (G.choosing) choosePerk(Math.floor(Math.random() * G.choosing.length));
      if (G.phase === 'play' && !G.paused) playFrame(dt);
      else if (G.phase === 'dead' || G.phase === 'win') break;
      FX.update(0);
      INPUT.clear();
    }
    FX.draw();
    if (G.P) { render(0, 0.016); UI.hud(G); }
    composer.render();
    return { phase: G.phase, fi: G.fi, t: Math.round(G.stats ? G.stats.time : 0) };
  }

  let last = 0, frozenDrawn = false;
  // the main loop is guarded: one bad frame is logged and skipped; a run of failures returns to the title instead of looping on the error
  let frameErrs = [];
  function frame(now) {
    requestAnimationFrame(frame);
    try { frameBody(now); } catch (e) {
      console.error('[LAO] frame error', e); G.errors = (G.errors || 0) + 1;
      const t = performance.now(); frameErrs = frameErrs.filter((x) => t - x < 2000); frameErrs.push(t);
      if (frameErrs.length > 20 && G.phase !== 'title') { frameErrs = []; try { UI.toast('오류가 반복되어 타이틀로 돌아갑니다', 'warn'); toTitle(); } catch (e2) { /* ignore */ } }
    }
  }
  function frameBody(now) {
    const rdt = Math.min(0.05, (now - last) / 1000 || 0.016) * TSCALE;
    last = now;
    INPUT.poll();
    if (G.phase === 'play' && !G.paused && UI.mapOpen()) {
      // the tactical map freezes the action (Gungeon-style): Tab / M / Esc close it
      if (INPUT.take('map') || INPUT.take('pause')) UI.toggleMap();
      UI.hud(G);
    } else if (G.phase === 'play' && !G.paused) {
      if (INPUT.take('pause') && !G.transit) { UI.togglePause(true); } // no pausing mid-lift (the fade owns the screen)
      if (INPUT.take('map') && !G.transit) UI.toggleMap();
      playFrame(rdt);
      UI.hud(G);
    } else if (G.phase === 'play' && G.choosing && G.pauseMenu) {
      if (INPUT.take('pause')) UI.togglePause(false);
    } else if (G.phase === 'play' && G.choosing) {
      if (window.BOT && BOT.tick) choosePerk(0);
      for (let n = 1; n <= 4; n++) if (INPUT.take('gun' + n)) choosePerk(n - 1);
      UI.hud(G);
      if (INPUT.take('pause')) UI.togglePause(true);
    } else if (G.phase === 'play' && G.paused) {
      if (INPUT.take('pause')) UI.togglePause(false);
    } else if (G.phase === 'dead' || G.phase === 'win') {
      FX.update(rdt * 0.5);
      if (G.P) render(rdt * 0.5, rdt);
    } else if (G.phase === 'title') {
      FX.update(rdt);
      renderTitle(rdt);
    }
    INPUT.clear();
    // frozen screens (pause, level-up cards, tactical map) draw the scene once, then stop spending GPU on an unchanging frame
    const frozen = G.phase === 'play' && (G.paused || UI.mapOpen());
    if (frozen && frozenDrawn) return;
    frozenDrawn = frozen;
    if (G.lv || G.phase === 'play' || G.phase === 'title') { FX.draw(); composer.render(); }
  }

  function resize() {
    const w = stageEl.clientWidth, h = stageEl.clientHeight;
    view.w = w; view.h = h; canvasRect = null; frozenDrawn = false;
    renderer.setPixelRatio(Math.min(MOBILE ? 1.5 : 2, window.devicePixelRatio || 1)); // follows a move to a monitor with another DPR
    renderer.setSize(w, h);
    composer.setSize(w, h);
    // ~13 tiles tall on landscape, ~11 tiles wide on portrait phones
    const aspect = w / h;
    let vh = MOBILE ? 10 : 10.5, vw = vh * aspect;
    if (aspect < 1) { vw = 10.5; vh = vw / aspect; } /* portrait phones: a closer camera so enemies and bullets read bigger */
    view.vw = vw; view.vh = vh;
    // the desktop bottom HUD is ~150 px tall whatever the window: on short windows centre the view a little lower
    view.hudShift = !MOBILE && aspect >= 1 ? clamp((150 / h - 0.16) * vh * 0.5, 0, 1.2) : aspect < 1 ? vh * 0.1 : 0; /* portrait: the player sits above the thumb controls */
    const z = G.zoomApplied || 1;
    camera.left = -vw / 2 * z; camera.right = vw / 2 * z; camera.top = vh / 2 * z; camera.bottom = -vh / 2 * z;
    camera.updateProjectionMatrix();
    bloom.resolution.set(w, h);
  }
  // the canvas rect, cached (re-read on resize / scroll) so per-frame aim math never forces a layout
  let canvasRect = null;
  const rectOf = () => canvasRect || (canvasRect = renderer.domElement.getBoundingClientRect());
  window.addEventListener('scroll', () => { canvasRect = null; }, { passive: true });
  function screenToWorld(cx, cy) {
    const r = rectOf(), z = G.zoomApplied || 1;
    return [camera.position.x + ((cx - r.left) / r.width - 0.5) * view.vw * z, camera.position.y - ((cy - r.top) / r.height - 0.5) * view.vh * z];
  }
  function worldToScreen(x, y) {
    const z = G.zoomApplied || 1;
    return [(x - camera.position.x) / (view.vw * z) * view.w + view.w / 2, view.h / 2 - (y - camera.position.y) / (view.vh * z) * view.h];
  }

  async function boot() {
    stageEl = document.getElementById('stage');
    UI.loading(0, '리소스 불러오는 중');
    await loadImages((f) => UI.loading(f * 0.6));
    renderer = new THREE.WebGLRenderer({ antialias: !MOBILE, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(MOBILE ? 1.5 : 2, window.devicePixelRatio || 1));
    renderer.setClearColor(0x020306);
    SD.gpuSkin = renderer.capabilities.floatVertexTextures;
    SD.renderer = renderer;
    SD.crossfade = 0.12;
    SD.pinRoot = true;
    SD.pinRange = 1.5;
    SD.mipmaps = renderer.capabilities.isWebGL2;
    SD.texScale = MOBILE ? 0.35 : 0.5;
    FXB.texScale = MOBILE ? 0.5 : 1;
    FXB.renderer = renderer;
    if (MOBILE) FX.setBudget(500);
    stageEl.prepend(renderer.domElement);
    // a lost GPU context (mobile driver reset, tab in the background too long) is reported and recovered by a reload
    renderer.domElement.addEventListener('webglcontextlost', (ev) => {
      ev.preventDefault();
      if (G.phase === 'play' && !G.paused) UI.togglePause(true);
      UI.toast('그래픽 장치가 재설정되었습니다 — 잠시 후 다시 불러옵니다', 'warn');
    });
    renderer.domElement.addEventListener('webglcontextrestored', () => { setTimeout(() => location.reload(), 600); });
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-8, 8, 5, -5, 0.1, 100);
    camera.position.z = 10;
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));
    bloom = new THREE.UnrealBloomPass(new THREE.Vector2(256, 256), 0.75, 0.4, 0.78);
    const bs = bloom.setSize.bind(bloom);
    bloom.setSize = (w, h) => bs(Math.max(2, Math.round(w * 0.5)), Math.max(2, Math.round(h * 0.5)));
    if (!MOBILE) composer.addPass(bloom);
    FX.init(scene, images);
    UI.init();
    // the hero roster and gun donors load behind the loading bar (title shows the rigs)
    let first = 'brownie';
    try { const v = localStorage.getItem('lao_rogue_hero'); if (HEROES.some((h) => h.id === v)) first = v; } catch (e) { /* ignore */ }
    const fh = HEROES.find((h) => h.id === first);
    await Promise.all([SD.prepare(first), SD.prepare(GUNS[fh.gun].donor)]);
    UI.loading(1);
    // everything else streams in behind the title (in parallel, never blocking)
    setTimeout(() => {
      // the roster, then what the first floor needs, one at a time (a quick 출격 never competes with a burst of parsing)
      bgLoad([...HEROES.map((h) => h.id), ...HEROES.map((h) => GUNS[h.gun].donor), 'labiata', ...FLOORS[0].enemies.map((k) => ENEMIES[k].rig), ...FLOORS[0].boss.map((k) => BOSSES[k].rig)]);
      // bake the common hit / explosion effects on the title too, so the first fight doesn't hitch
      COMMON_FX.reduce((p, n) => p.then(calmMoment).then(() => FXB.prepare(n)).then(() => new Promise((r) => setTimeout(r, 150))), Promise.resolve());
    }, 400);
    resize();
    window.addEventListener('resize', () => requestAnimationFrame(resize));
    /* global error capture: a stray exception is logged and reported once instead of failing silently */
    const errSeen = new Set();
    const onErr = (msg) => { msg = String(msg || 'unknown').slice(0, 160); if (errSeen.has(msg)) return; errSeen.add(msg); console.error('[LAO] runtime error:', msg); G.errors = (G.errors || 0) + 1; if (window.UI && UI.toast && errSeen.size <= 3) UI.toast('일시적인 오류가 발생했습니다 — 게임은 계속 진행됩니다', 'warn'); };
    window.addEventListener('error', (e) => { if (e && e.filename && /blob:/.test(e.filename)) return; onErr(e && (e.message || e.error)); });
    window.addEventListener('unhandledrejection', (e) => onErr(e && e.reason && (e.reason.message || e.reason)));
    document.addEventListener('visibilitychange', () => { if (document.hidden && G.phase === 'play' && !G.paused && !G.transit && !TEST) UI.togglePause(true); });
    SFX.preload();
    UI.loaded();
    toTitle();
    requestAnimationFrame(frame);
  }

  window.GAME = {
    G, boot, startRun, showcase, screenToWorld, toTitle, endRun, worldToScreen, saveOpt, images, uiImg, MOBILE, HERO_H, makeBody, setFace,
    get scene() { return scene; }, get renderer() { return renderer; }, get camera() { return camera; },
    curGun, magSize, maxAmmo, applyItem, giveGun, spawnPedestal, hurtPlayer, refreshHints: () => refreshHints(), canvasRect: () => rectOf(), redraw: () => { frozenDrawn = false; }, recolorBullets: () => recolorBullets(), skipTutorial: () => tutorialEnd(true), rebuildGuide: () => rebuildGuide(),
    choosePerk, xpNeed, teleportTo,
    debug: { sim, xp: (n) => gainXp(n), spawnEnemy, killAll: () => G.enemies.forEach((e) => { if (e.alive) { e.hp = 0; killEnemy(e); } }), give: (id) => giveGun(G.P, id), item: (id) => applyItem(G.P, id), next: nextFloor, tp: (type) => { const r = G.lv.rooms.find((x) => x.type === type); if (r) { G.P.x = r.cx; G.P.y = r.y0 + 1.2; } } },
  };
})();
