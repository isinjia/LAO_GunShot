/* Directly ported from 2_LAO_MINI_ACTION/js/rampalion-skill.js RAMPALION_X.
 * The original Canvas drawing stays intact; only coordinates and asset loading are adapted.
 * Source hashes and copied assets: assets/rampalion-bomb/source.json. */
(function () {
  let W = 1100, H = 620;
  const UNIT = 70, HOME_X = 120, HOME_Y = 350;
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const SHEETS = { 'ramp-fx-lion': {cols:3,cell:384,n:9}, 'ramp-fx-lioncenter': {cols:3,cell:384,n:9} };
  const images = {};
  const getNativeWeaponImage = key => images[key];
  let loading, canvas, ctx;
  function prepare() {
    if (!loading) loading = Promise.all([...Object.keys(SHEETS), 'dash-pose'].map(key => new Promise((resolve, reject) => {
      const img = new Image(); img.onload = () => { images[key] = img; resolve(); };
      img.onerror = () => { loading = null; reject(new Error('램파리온 폭탄 FX 로드 실패: ' + key)); };
      img.src = 'assets/rampalion-bomb/' + key + '.png';
    })));
    return loading;
  }
function drawCell(ctx, img, cols, cellW, cellH, frame, x, y, w, h) {
  ctx.drawImage(img, (frame % cols) * cellW, Math.floor(frame / cols) * cellH, cellW, cellH,
    x - w / 2, y - h / 2, w, h);
}

/** Additive radial bloom (white-hot core -> warm edge). `hue` picks the rim colour. */
function bloom(ctx, x, y, rx, ry, alpha, hue = 'warm') {
  if (alpha <= 0.01 || rx <= 0 || ry <= 0) return;
  const stops = hue === 'cyan'
    ? ['rgba(240,252,255,1)', 'rgba(120,220,255,0.85)', 'rgba(30,140,255,0.45)', 'rgba(0,90,255,0)']
    : ['rgba(255,252,230,1)', 'rgba(255,224,90,0.85)', 'rgba(255,128,24,0.45)', 'rgba(255,90,0,0)'];
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.translate(x, y);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, stops[0]);
  g.addColorStop(0.35, stops[1]);
  g.addColorStop(0.7, stops[2]);
  g.addColorStop(1, stops[3]);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const X_HAND = 0.75; // skill_2 sheet time with the hand out (held)
// While it glows (user): skill_1 from the start of the sheet clip (full-clip frame 46) to the
// crouch with the wings folded in front (frame 60) = sheet frames 0..7 @ 12 fps, then held.
const GLOW_POSE_TIME = 7 / 12;
/**
 * Original skill2 lion (Lion_Rampart_lion_main_aura, 3 x 3: mouth shut -> roaring), white
 * art tinted like its particle start colour (orange 1,0.24,0.04 .. 1,0.61,0.25). Cached.
 */
const _lionTint = {};
function tintedSheet(key, col) {
  const id = key + col;
  if (_lionTint[id]) return _lionTint[id];
  const img = getNativeWeaponImage(key);
  if (!img || !(img.naturalWidth || img.width)) return null;
  const c = document.createElement('canvas');
  c.width = img.naturalWidth || img.width;
  c.height = img.naturalHeight || img.height;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  g.globalCompositeOperation = 'source-atop';
  g.globalAlpha = 0.9;
  g.fillStyle = col;
  g.fillRect(0, 0, c.width, c.height);
  _lionTint[id] = c;
  return c;
}

const X_TORNADO = 0.75; // the electromagnetic tornado shoots down the lane (user: keep it)
const TORNADO_HALF = 120; // px: catch radius around the lane
const PALM_X = 0.38; // palm of the skill_2 hand-out pose, x drawSize units ahead of the body
const PALM_Y = -12; // px
const VORTEX_X = 0.72; // where the tornado gathers the field (screen fraction)
const X_LION = 2.15; // the lion leaves the hand, riding the tornado (1 s later - user)
const LION_TIME = 0.9;
const X_GLOW = 2.75; // turns Hyper, starts glowing; the two lights circle in
const X_MERGE = 3.65; // the lights become one
const X_DASH = 3.8; // bursts forward
const DASH_TIME = 0.32;
const X_BACK = X_DASH + DASH_TIME + 0.45; // flies back in from the left
const BACK_TIME = 0.55;
const X_END = X_BACK + BACK_TIME + 0.1;
const DASH_HALF = 130; // px: what the charge runs through around its row
const CHANT = ['겜…', '기르…', '간…', '고…', '구포…!!'];

const easeIn = (k) => k * k;
const easeOut = (k) => 1 - (1 - k) ** 3;

/**
 * Light rays round (x, y): n soft tapered beams of length len, turned by rot. width = beam
 * half-angle (rad) at the root; with t, each beam flickers on its own phase.
 */
function sunRays(ctx, x, y, len, n, rot, rgb, alpha, width, t = null) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.translate(x, y);
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2 + (i % 2 ? 0.13 : 0);
    const f = t === null ? 1 : 0.55 + 0.45 * Math.sin(t * (13 + (i % 5) * 3) + i * 1.9) ** 2;
    const L = len * (i % 2 ? 0.7 : 1) * (t === null ? 1 : 0.75 + 0.25 * f);
    const g = ctx.createLinearGradient(0, 0, Math.cos(a) * L, Math.sin(a) * L);
    g.addColorStop(0, `rgba(${rgb},${alpha * f})`);
    g.addColorStop(0.35, `rgba(${rgb},${alpha * 0.55 * f})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a - width) * L * 0.15, Math.sin(a - width) * L * 0.15);
    ctx.lineTo(Math.cos(a) * L, Math.sin(a) * L);
    ctx.lineTo(Math.cos(a + width) * L * 0.15, Math.sin(a + width) * L * 0.15);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** One cell of an original FX sheet (run-fx SHEETS grid), optionally tinted, centred + rotated. */
function fxCell(ctx, key, frame, x, y, w, h, { tint = null, rot = 0, alpha = 1, blend = 'lighter' } = {}) {
  const img = tint ? tintedSheet(key, tint) : getNativeWeaponImage(key);
  const sh = SHEETS[key];
  if (!img || !sh || alpha <= 0.01) return;
  ctx.save();
  ctx.globalCompositeOperation = blend;
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  drawCell(ctx, img, sh.cols, sh.cell, sh.cell, ((frame % sh.n) + sh.n) % sh.n, 0, 0, w, h);
  ctx.restore();
}

/**
 * The fire lion (bomb / C Lv2): a soft flame wake back to startX, the skill2 lion sheet
 * (mouth shut -> roaring over k 0..1) and a light glow. L = { x, y }, s = its size in px.
 */
function drawFireLion(ctx, L, s, fade, k, startX) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const tailX = Math.max(startX, L.x - s * 2.2);
  // Flame wake: soft on every edge (a horizontal-only gradient cut a hard line - user).
  const tcx = (tailX + L.x) / 2;
  const trx = Math.max(1, (L.x - tailX) / 2 + 1);
  const tr = s * 0.34;
  ctx.save();
  ctx.translate(tcx, L.y);
  ctx.scale(trx / tr, 1);
  const g = ctx.createRadialGradient(tr * 0.35, 0, 0, 0, 0, tr);
  g.addColorStop(0, `rgba(255,150,60,${0.35 * fade})`);
  g.addColorStop(0.6, `rgba(255,110,30,${0.18 * fade})`);
  g.addColorStop(1, 'rgba(255,90,20,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, tr, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  bloom(ctx, L.x - s * 0.6, L.y, s * 0.5, s * 0.35, 0.35 * fade);
  ctx.restore();
  // Skill2 fire lion (9 cells, mouth shut -> roaring as it runs): the body drawn normally
  // in deep orange so the face reads (additive washed it to white), a light glow on top.
  const frame = Math.min(8, Math.floor(k * 9));
  const body = tintedSheet('ramp-fx-lion', '#e8420e');
  const glow = tintedSheet('ramp-fx-lion', '#ffb04a');
  const ring = tintedSheet('ramp-fx-lioncenter', '#ffb24a');
  const ls = s * 1.5;
  ctx.save();
  ctx.globalAlpha = fade;
  // The face is negative space in the art (eyes / fangs / mane lines are holes in the
  // flame): a dark ember backing behind the head makes it read instead of showing the
  // tornado / bloom through it.
  const back = ctx.createRadialGradient(L.x + ls * 0.08, L.y + ls * 0.05, 0, L.x + ls * 0.08, L.y + ls * 0.05, ls * 0.3);
  back.addColorStop(0, 'rgba(90,14,4,0.95)');
  back.addColorStop(0.7, 'rgba(120,24,6,0.85)');
  back.addColorStop(1, 'rgba(120,24,6,0)');
  ctx.fillStyle = back;
  ctx.beginPath();
  ctx.arc(L.x + ls * 0.08, L.y + ls * 0.05, ls * 0.3, 0, Math.PI * 2);
  ctx.fill();
  if (body) drawCell(ctx, body, 3, 384, 384, frame, L.x, L.y, ls, ls);
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.28 * fade;
  if (glow) drawCell(ctx, glow, 3, 384, 384, frame, L.x, L.y, ls, ls);
  ctx.globalAlpha = 0.8 * fade;
  if (ring) drawCell(ctx, ring, 3, 384, 384, frame, L.x - ls * 0.15, L.y, ls * 0.9, ls * 0.9);
  ctx.restore();
}

const ORIGINAL = {
  drawUnder(ctx, p, run, size) {
    // White-gold aura while it glows.
    const t = run.t;
    if (t < X_GLOW || t >= X_DASH) return;
    const ramp = Math.min(1, (t - X_GLOW) / (X_MERGE - X_GLOW));
    const q = { x: run.homeX, y: run.homeY };
    bloom(ctx, q.x, q.y, size * (0.6 + 0.4 * ramp), size * (0.55 + 0.35 * ramp), 0.4 + 0.5 * ramp);
  },
  drawOver(ctx, p, run, size) {
    const t = run.t;
    const home = { x: run.homeX, y: run.homeY };
    // Hand charging before the lion leaves it: lights up once the hand is out (user).
    const HAND_GLOW = X_HAND - 0.1;
    if (t >= HAND_GLOW && t < X_LION) {
      const k = (t - HAND_GLOW) / (X_LION - HAND_GLOW);
      const a = clamp01((t - HAND_GLOW) / 0.25);
      bloom(ctx, home.x + size * PALM_X, home.y + PALM_Y, size * (0.2 + 0.3 * k) * (0.4 + 0.6 * a), size * (0.16 + 0.22 * k) * (0.4 + 0.6 * a), 0.8 * a);
    }
    // The electromagnetic tornado down the lane (until it charges).
    if (t >= X_TORNADO && t < X_DASH + 0.25) {
      const hx = home.x + size * PALM_X; // the open palm of the skill_2 pose
      const hy = run.data.lane;
      const grow = Math.min(1, (t - X_TORNADO) / 0.35);
      const fade = t > X_DASH ? Math.max(0, 1 - (t - X_DASH) / 0.25) : 1;
      const x1 = hx + (W + 40 - hx) * (grow * grow * (3 - 2 * grow));
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      // Body haze as a soft ellipse (a rect left a hard vertical edge at the hand - user).
      const cx = (hx + x1) / 2;
      const rx = Math.max(1, (x1 - hx) / 2 + 40);
      ctx.save();
      ctx.translate(cx, hy);
      ctx.scale(rx / TORNADO_HALF, 1);
      const body = ctx.createRadialGradient(0, 0, 0, 0, 0, TORNADO_HALF);
      body.addColorStop(0, `rgba(120,255,190,${0.22 * fade})`);
      body.addColorStop(0.6, `rgba(100,255,180,${0.12 * fade})`);
      body.addColorStop(1, 'rgba(60,255,150,0)');
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(0, 0, TORNADO_HALF, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // Spiral strands: counter-phased helices (green / gold / white) twisting right.
      // Strands start as one point in the palm (zero swing, faded in) and open up as they go.
      for (const [col, ph, w] of [['140,255,200', 0, 3], ['255,220,110', Math.PI, 2.5], ['220,255,240', Math.PI / 2, 1.5]]) {
        const sg = ctx.createLinearGradient(hx, 0, hx + 110, 0);
        sg.addColorStop(0, `rgba(${col},0)`);
        sg.addColorStop(1, `rgba(${col},${0.85 * fade})`);
        ctx.strokeStyle = sg;
        ctx.lineWidth = w;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let x = hx; x <= x1; x += 6) {
          // Keeps widening all the way to the screen edge (user), spinning fast.
          const u = (x - hx) / 60;
          const open = Math.min(1, (x - hx) / Math.max(1, W + 40 - hx));
          const amp = TORNADO_HALF * 1.5 * Math.pow(open, 0.8);
          const y = hy + Math.sin(u - t * 26 + ph) * amp;
          if (x === hx) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();
      for (const e of run.data.caught) {
        if (!e.alive) continue;
        bloom(ctx, e.x, e.y, 34, 34, 0.5 * fade * (0.6 + 0.4 * Math.sin(t * 40 + e.x)), 'cyan');
      }
    }
    // The lion.
    const L = run.data.lion;
    if (L && L.t <= LION_TIME + 0.2) {
      const s = (p.drawSize || 100) * L.size;
      const fade = L.t > LION_TIME ? Math.max(0, 1 - (L.t - LION_TIME) / 0.2) : 1;
      drawFireLion(ctx, L, s, fade, L.t / LION_TIME, home.x);
    }
    // Two lights (gold = hell, green = heaven) spiral in and merge inside it.
    if (t >= X_GLOW && t < X_DASH) {
      const k = Math.min(1, (t - X_GLOW) / (X_MERGE - X_GLOW));
      const r = size * 1.1 * (1 - easeIn(k));
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const [col, ph] of [['255,205,70', 0], ['90,255,170', Math.PI]]) {
        for (let i = 0; i < 6; i++) {
          // Comet: head + fading trail along the spiral.
          const a = t * (7 + 6 * k) + ph - i * 0.18;
          const rr = r * (1 + i * 0.05);
          const x = home.x + Math.cos(a) * rr;
          const y = home.y + Math.sin(a) * rr * 0.75;
          const s2 = size * (0.2 - i * 0.025);
          const g = ctx.createRadialGradient(x, y, 0, x, y, s2);
          g.addColorStop(0, `rgba(${col},${0.95 - i * 0.14})`);
          g.addColorStop(1, `rgba(${col},0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, s2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (t >= X_MERGE) bloom(ctx, home.x, home.y, size * 1.2, size * 1.0, 1);
      ctx.restore();
    }
    // The charge: a white-gold light streak from where it stood to the body.
    if (t >= X_DASH && t < X_DASH + DASH_TIME + 0.35) {
      const k = easeIn(Math.min(1, (t - X_DASH) / DASH_TIME));
      const fade = t > X_DASH + DASH_TIME ? Math.max(0, 1 - (t - X_DASH - DASH_TIME) / 0.35) : 1;
      const head = home.x + (W + 200 - home.x) * k;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      // Streak layers as long soft ellipses, brightest toward the head and fading out on
      // every edge (a rect with a vertical-only gradient cut a hard line on the left - user).
      const x0 = home.x - size * 0.6;
      const x1 = Math.max(x0 + 2, head + size * 0.2);
      const cx = (x0 + x1) / 2;
      const rx = (x1 - x0) / 2;
      for (const [hh, col, a] of [[DASH_HALF * 1.6, '255,200,90', 0.3], [DASH_HALF * 0.8, '255,240,190', 0.6], [24, '255,255,255', 1]]) {
        const ry = hh / 2;
        ctx.save();
        ctx.translate(cx, home.y);
        ctx.scale(rx / ry, 1);
        const g = ctx.createRadialGradient(ry * 0.55, 0, 0, 0, 0, ry);
        g.addColorStop(0, `rgba(${col},${a * fade})`);
        g.addColorStop(0.55, `rgba(${col},${a * 0.75 * fade})`);
        g.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, ry, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      if (t < X_DASH + DASH_TIME) bloom(ctx, Math.min(W, head), home.y, size * 1.6, size * 1.1, 1);
      ctx.restore();
      // Rampalion itself shows faintly inside the light (user).
      const body = run.spec.bodyAnim?.(p, run);
      if (body?.draw) {
        const o = runOffset(p, run);
        ctx.save();
        ctx.globalAlpha = 0.5 * fade;
        ctx.filter = HYPER_GOLD;
        body.draw(ctx, p.x + o.dx + (p.drawOffsetX || 0), p.y + o.dy + (p.drawOffsetY || 0), p.drawSize || 100, { flipX: p.facing < 0 });
        ctx.restore();
      }
    }
  },
  drawCaptions(ctx, p, run, size) {
    const t = run.t;
    // Captions: the chant while the hand charges, the shout as it charges out.
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    // Not before the run's own start: the wing drop (t < 0) gave a negative count and
    // slice(0, n) then showed most of the chant for a moment (user).
    if (t >= 0 && t < X_LION + 0.4) {
      const n = Math.min(CHANT.length, Math.floor(t / (X_LION / CHANT.length)) + 1);
      const text = CHANT.slice(0, n).join(' ');
      ctx.font = '900 30px "Noto Sans KR", "Chakra Petch", sans-serif';
      ctx.globalAlpha = Math.min(1, (X_LION + 0.4 - t) / 0.2);
      ctx.lineWidth = 7;
      ctx.strokeStyle = 'rgba(20,10,0,0.9)';
      ctx.strokeText(text, W / 2, H * 0.2);
      ctx.fillStyle = '#ffe28a';
      ctx.fillText(text, W / 2, H * 0.2);
    }
    // The shout in two beats (user): "HEAVEN AND…" as the lights merge, "HELL!!" on the very
    // frame it bursts forward.
    const shout = (text, sub, t0, until, big) => {
      if (t < t0 || t >= until) return;
      const k = Math.min(1, (t - t0) / 0.12);
      const out = t > until - 0.3 ? Math.max(0, (until - t) / 0.3) : 1;
      const sc = (big ? 1.8 : 1.4) - (big ? 0.8 : 0.4) * k;
      ctx.save();
      ctx.translate(W / 2, H * (big ? 0.3 : 0.22));
      ctx.scale(sc, sc);
      ctx.globalAlpha = k * out;
      ctx.font = `900 ${big ? 64 : 40}px "Chakra Petch", "Noto Sans KR", sans-serif`;
      ctx.lineWidth = big ? 11 : 8;
      ctx.strokeStyle = 'rgba(30,8,0,0.95)';
      ctx.strokeText(text, 0, 0);
      const fg = ctx.createLinearGradient(0, -32, 0, 32);
      fg.addColorStop(0, '#fff7c2');
      fg.addColorStop(0.5, big ? '#ffb52e' : '#9dffcf');
      fg.addColorStop(1, big ? '#ff5a1f' : '#ffd24a');
      ctx.fillStyle = fg;
      ctx.fillText(text, 0, 0);
      ctx.font = `800 ${big ? 24 : 20}px "Noto Sans KR", sans-serif`;
      ctx.lineWidth = 6;
      ctx.strokeText(sub, 0, big ? 46 : 34);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(sub, 0, big ? 46 : 34);
      ctx.restore();
    };
    shout('HEAVEN AND…', '헤븐 앤드…', X_MERGE - 0.35, X_DASH, false);
    shout('HELL!!', '헬!!', X_DASH, X_BACK + 0.3, true);
    ctx.restore();
  },
};

  function clear() { if (canvas && !canvas.hidden) { ctx.clearRect(0, 0, canvas.width, canvas.height); canvas.hidden = true; } }
  function draw(P, worldToScreen, stage, active) {
    const h = active && P && P.hh;
    if (!h) { clear(); return; }
    if (!canvas) {
      canvas = document.createElement('canvas'); canvas.id = 'rampalionBombFx';
      canvas.setAttribute('aria-hidden', 'true');
      canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3';
      stage.appendChild(canvas); ctx = canvas.getContext('2d');
    }
    const width = stage.clientWidth, height = stage.clientHeight;
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    if (canvas.width !== Math.round(width*dpr) || canvas.height !== Math.round(height*dpr)) { canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr); }
    canvas.hidden = false; ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,canvas.width,canvas.height);
    const ca = Math.cos(h.a), sa = Math.sin(h.a), flip = ca < 0 ? -1 : 1;
    const origin = worldToScreen(h.x0, h.y0 + 0.9), unit = worldToScreen(h.x0 + 1, h.y0 + 0.9);
    const scale = Math.abs(unit[0] - origin[0]) / UNIT;
    const size = GAME.HERO_H * UNIT;
    W = HOME_X + h.len * UNIT - 40; H = 620;
    const run = {t:h.t,homeX:HOME_X,homeY:HOME_Y,spec:{},data:{lane:HOME_Y+PALM_Y,caught:[],lion:null}};
    const p = {drawSize:size};
    for (const e of h.caught || []) if (e.alive) {
      const dx=e.x-h.x0,dy=e.y+e.h*0.42-h.y0-0.9;
      run.data.caught.push({alive:true,x:HOME_X+(dx*ca+dy*sa)*UNIT,y:HOME_Y-(-dx*sa+dy*ca)*UNIT*flip});
    }
    if (h.t >= X_LION) {
      const t=h.t-X_LION, k=Math.min(1,t/LION_TIME),x0=HOME_X+size*PALM_X;
      run.data.lion={t,x0,x:x0+(W+300-x0)*(k*k*0.6+k*0.4),y:run.data.lane,size:0.9+1.7*Math.min(1,k*2.2)};
    }
    ctx.save(); ctx.scale(dpr,dpr); ctx.translate(origin[0],origin[1]); ctx.rotate(-h.a);
    ctx.scale(scale,scale*flip); ctx.translate(-HOME_X,-HOME_Y);
    ORIGINAL.drawUnder(ctx,p,run,size); ORIGINAL.drawOver(ctx,p,run,size); ctx.restore();
    /* A body-centered gold aura grows as the two lights merge and follows the dash home. */
    if (h.t >= X_GLOW) {
      const pos=worldToScreen(P.x,P.y+GAME.HERO_H*0.5);
      const power=Math.min(1,(h.t-X_GLOW)/(X_MERGE-X_GLOW));
      const fade=h.t>X_BACK ? Math.max(0.2,1-(h.t-X_BACK)/BACK_TIME) : 1;
      ctx.save(); ctx.scale(dpr,dpr); ctx.translate(pos[0],pos[1]); ctx.scale(scale,scale);
      bloom(ctx,0,0,size*(0.65+power*0.25),size*(0.8+power*0.2),(0.35+power*0.4)*fade);
      if (GAME.G.opt.flash!==false) sunRays(ctx,0,0,size*1.15,10,h.t*0.45,'255,224,140',(0.12+power*0.13)*fade,0.035,h.t);
      ctx.restore();
    }
    /* Use the reference's baked punch pose: its lance is already attached to the fist. */
    if (h.t >= X_DASH && images['dash-pose']) {
      const pos = worldToScreen(P.x,P.y+GAME.HERO_H*0.5), k = GAME.HERO_H*UNIT/692;
      ctx.save(); ctx.scale(dpr,dpr); ctx.translate(pos[0],pos[1]);
      ctx.rotate(-h.a); ctx.scale(scale,scale*flip);
      ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.65;
      ctx.filter='sepia(1) saturate(3) brightness(2.4) blur(10px)';
      ctx.drawImage(images['dash-pose'],-393*k,-391*k,768*k,768*k);
      ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1;
      ctx.filter='sepia(1) saturate(2.6) hue-rotate(-12deg) brightness(1.7) contrast(1.05)';
      ctx.shadowColor='#ffe08a'; ctx.shadowBlur=16;
      ctx.drawImage(images['dash-pose'],-393*k,-391*k,768*k,768*k); ctx.restore();
    }
    /* Captions stay upright and centered on every screen orientation. */
    W=1100; H=620;
    const cs=Math.min(width/W,height/H);
    ctx.save(); ctx.scale(dpr,dpr); ctx.translate((width-W*cs)/2,(height-H*cs)/2); ctx.scale(cs,cs);
    ORIGINAL.drawCaptions(ctx,p,run,size); ctx.restore();
  }
  window.RAMP_BOMB = {prepare,draw,clear,timing:{tornado:X_TORNADO,lion:X_LION,glow:X_GLOW,merge:X_MERGE,dash:X_DASH,dashTime:DASH_TIME,back:X_BACK,backTime:BACK_TIME,end:X_END}};
})();
