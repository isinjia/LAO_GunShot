// Input: keyboard + mouse aim on desktop, a move stick + aim pad + action buttons on touch screens.
// Actions: fire (hold), dodge, skill, skill2, swap, interact, reload, pause, map.
(function () {
  const KEY = {
    fire: ['KeyJ'], dodge: ['ShiftLeft', 'Space', 'KeyK', 'ShiftRight'], skill: ['KeyF'], swap: ['KeyC'],
    skill2: ['KeyE'], interact: ['KeyG', 'Enter'], reload: ['KeyR'], pause: ['Escape', 'KeyP'], map: ['KeyM', 'Tab'], tutSkip: ['Backspace'],
  };
  // number keys pick a weapon slot directly (1-9, top row or numpad)
  for (let n = 1; n <= 9; n++) KEY['gun' + n] = ['Digit' + n, 'Numpad' + n];
  // remappable actions: the player's choice replaces the first (primary) key; the alternates stay
  const DEFAULT_PRIMARY = {}; for (const a in KEY) DEFAULT_PRIMARY[a] = KEY[a][0];
  const REMAP = ['fire', 'dodge', 'skill', 'skill2', 'swap', 'interact', 'reload', 'map'];
  const DEFAULT_KEYS = {}; for (const a in KEY) DEFAULT_KEYS[a] = KEY[a].slice();
  function applyBinds(b) {
    // rebuild from the defaults each time, then make every chosen primary key exclusive (no default alternate keeps it)
    for (const a in DEFAULT_KEYS) KEY[a] = DEFAULT_KEYS[a].slice();
    // a saved key is used only if it's a plain string, not reserved, and not already taken by another action in the save
    const taken = new Set();
    for (const a of REMAP) {
      const s = b && typeof b[a] === 'string' && /^[A-Za-z0-9]+$/.test(b[a]) && !RESERVED(b[a]) && !taken.has(b[a]) ? b[a] : DEFAULT_PRIMARY[a];
      const c = taken.has(s) ? DEFAULT_PRIMARY[a] : s;
      taken.add(c);
      KEY[a] = [c, ...KEY[a].slice(1).filter((x) => x !== c)];
    }
    for (const a of REMAP) { const c = KEY[a][0]; for (const o in KEY) if (o !== a) KEY[o] = KEY[o].filter((x, i) => i === 0 || x !== c); }
  }
  // keys that already mean something fixed (movement, pause, weapon slots) can't be taken by an action
  const RESERVED = (code) => !!MOVE[code] || /^(Digit|Numpad)[1-9]$/.test(code) || ['Escape', 'KeyP', 'Backspace', 'ControlLeft', 'ControlRight', 'MetaLeft', 'MetaRight', 'AltLeft', 'AltRight', 'ContextMenu', 'CapsLock'].includes(code) || /^F\d+$/.test(code);
  function rebind(a, code) {
    if (!REMAP.includes(a) || !code || RESERVED(code)) return false;
    for (const o of REMAP) if (o !== a && KEY[o][0] === code) KEY[o][0] = KEY[a][0]; // swap on conflict
    // an alternate of another action (e.g. Space for dodge) moves off that action
    for (const o in KEY) if (o !== a) { const i = KEY[o].indexOf(code); if (i > 0) KEY[o].splice(i, 1); }
    KEY[a][0] = code;
    const b = {}; REMAP.forEach((x) => { b[x] = KEY[x][0]; });
    try { localStorage.setItem('lao_rogue_keys', JSON.stringify(b)); } catch (e) { /* ignore */ }
    return true;
  }
  function resetBinds() { applyBinds({}); try { localStorage.removeItem('lao_rogue_keys'); } catch (e) { /* ignore */ } }
  const KN = { ShiftLeft: 'Shift', ShiftRight: 'R-Shift', ControlLeft: 'Ctrl', Semicolon: ';', Quote: "'", BracketLeft: '[', BracketRight: ']', Comma: ',', Period: '.', Slash: '/', Backslash: '\\', Minus: '-', Equal: '=', Backquote: '`', Enter: 'Enter', Tab: 'Tab' };
  const keyName = (c) => KN[c] || (c || '').replace(/^Key/, '').replace(/^Digit/, '').replace(/^Numpad/, 'Num').replace(/^Arrow/, '');
  const MOVE = { KeyW: [0, 1], ArrowUp: [0, 1], KeyS: [0, -1], ArrowDown: [0, -1], KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0] };
  try { applyBinds(JSON.parse(localStorage.getItem('lao_rogue_keys') || '{}')); } catch (e) { /* damaged save: defaults */ } // (after MOVE / RESERVED exist)
  const down = new Set();
  const pressed = new Set(); // edge-triggered actions since the last frame
  const touch = { mx: 0, my: 0, active: false, fire: false, ax: 0, ay: 0, aiming: false };
  // mouse aim (desktop): cursor position in client pixels, left button fires, right button dodges
  const mouse = { x: 0, y: 0, seen: false, down: false };
  window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.seen = true; mouse.moved = true; });
  // a real mouse (not a touch-emulated pointer) switches mouse aim on, even on touch-capable devices
  window.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') mouse.used = true; });
  window.addEventListener('touchstart', () => { mouse.used = false; }, { passive: true });
  window.addEventListener('mousedown', (e) => {
    if (e.target.closest && e.target.closest('button, input, .overlay, #pauseOv, #touch, #bigMap')) return;
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.seen = true;
    const G = window.GAME && GAME.G, inPlay = G && G.phase === 'play' && !G.paused && !G.choosing;
    if (e.button === 0) { mouse.down = true; if (toggleFire && inPlay) latch = !latch; }
    else if (e.button === 2 && window.GAME && GAME.G.phase === 'play') pressed.add('dodge');
  });
  window.addEventListener('mouseup', (e) => { if (e.button === 0) mouse.down = false; });
  let wheelT = 0;
  window.addEventListener('wheel', (e) => { if (e.target.closest && e.target.closest('#bigMap')) return; const now = performance.now(); if (now - wheelT > 180 && Math.abs(e.deltaY) > 4) { wheelT = now; pressed.add('swap'); } }, { passive: true });
  window.addEventListener('contextmenu', (e) => { if (e.target.closest && e.target.closest('#stage')) e.preventDefault(); });
  let enabled = true;
  // accessibility: "toggle fire" — one click / J press starts firing, the next stops (no holding)
  let toggleFire = false, latch = false;

  function actionOf(code) { for (const a in KEY) if (KEY[a].includes(code)) return a; return null; }
  window.addEventListener('keydown', (e) => {
    // key-binding screen waiting for a key: hand it over and swallow it
    if (window.INPUT && INPUT.capture) { e.preventDefault(); e.stopImmediatePropagation(); const cb = INPUT.capture; INPUT.capture = null; cb(e.code); return; }
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      if (e.code !== 'Escape' && e.code !== 'KeyP') return;
      e.target.blur(); // a focused volume slider must not swallow Esc (resume)
    }
    const a = actionOf(e.code);
    // only steal keys from the page while actually playing: menus keep Tab / Enter / Space for focus navigation
    const G = window.GAME && GAME.G;
    const inPlay = G && G.phase === 'play' && !G.paused && !G.choosing;
    if ((MOVE[e.code] || a) && (inPlay || e.code === 'Tab' && G && G.phase === 'play' && !G.paused)) e.preventDefault();
    if (e.repeat) return;
    down.add(e.code);
    if (a) pressed.add(a);
    if (a === 'fire' && toggleFire && inPlay) latch = !latch;
  });
  window.addEventListener('keyup', (e) => { down.delete(e.code); });
  window.addEventListener('blur', () => {
    // focus went elsewhere (another window / monitor): pause instead of standing still under fire
    const G = window.GAME && GAME.G;
    if (G && G.phase === 'play' && !G.paused && !G.transit && !/[?&](bot|sim)=1/.test(location.search) && window.UI) UI.togglePause(true);
    down.clear(); mouse.down = false; latch = false; touch.fire = false; touch.aiming = false; touch.active = false; touch.mx = touch.my = 0; });

  function moveVec() {
    let x = 0, y = 0;
    for (const c of down) { const m = MOVE[c]; if (m) { x += m[0]; y += m[1]; } }
    if (touch.active) { x += touch.mx; y += touch.my; }
    if (pad.active) { x += pad.mx; y += pad.my; }
    const l = Math.hypot(x, y);
    return l > 1 ? [x / l, y / l] : [x, y];
  }
  function held(a) {
    if (a === 'fire' && toggleFire) return latch; // toggle mode: every source (mouse, J, RT, touch pad) flips the latch
    if (a === 'fire' && pad.fire) return true;
    if (a === 'fire' && (touch.fire || mouse.down)) return true;
    return KEY[a].some((c) => down.has(c));
  }
  function take(a) { if (pressed.has(a)) { pressed.delete(a); return true; } return false; }
  function clear() { pressed.clear(); }

  // ── touch controls ───────────────────────────────────────
  const isTouch = matchMedia('(pointer: coarse)').matches || (matchMedia('(hover: none)').matches && 'ontouchstart' in window) || /[?&]touch=1/.test(location.search);
  function bindTouch(root) {
    const stick = root.querySelector('#stick'), knob = stick.querySelector('i');
    let sid = null, cx = 0, cy = 0;
    const R = 56;
    const zone = root.querySelector('#stickZone');
    zone.addEventListener('touchstart', (e) => {
      if (sid !== null) return;
      const t = e.changedTouches[0];
      sid = t.identifier; cx = t.clientX; cy = t.clientY;
      stick.style.left = cx + 'px'; stick.style.top = cy + 'px';
      stick.classList.add('on');
      touch.active = true; touch.mx = touch.my = 0;
      e.preventDefault();
    }, { passive: false });
    const mv = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier !== sid) continue;
        let dx = t.clientX - cx, dy = t.clientY - cy;
        const l = Math.hypot(dx, dy);
        if (l > R) { dx *= R / l; dy *= R / l; }
        knob.style.transform = `translate(${dx}px, ${dy}px)`;
        const k = Math.min(1, l / R);
        touch.mx = l > 8 ? (dx / (l || 1)) * k : 0; touch.my = l > 8 ? (-dy / (l || 1)) * k : 0;
        e.preventDefault();
      }
    };
    const end = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier !== sid) continue;
        sid = null; touch.active = false; touch.mx = touch.my = 0;
        knob.style.transform = ''; stick.classList.remove('on');
      }
    };
    zone.addEventListener('touchmove', mv, { passive: false });
    zone.addEventListener('touchend', end); zone.addEventListener('touchcancel', end);
    const pad = root.querySelector('[data-act="fire"]'), pknob = pad && pad.querySelector('i');
    if (pad) {
      let pid = null, px = 0, py = 0;
      pad.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const t = e.changedTouches[0];
        if (pid !== null) return;
        pid = t.identifier;
        touch.ax = touch.ay = 0; // a fresh press without a drag leaves aiming to the assist (if on)
        const r = pad.getBoundingClientRect();
        px = r.left + r.width / 2; py = r.top + r.height / 2;
        touch.fire = true; touch.aiming = true;
        if (toggleFire) latch = !latch;
        aimFrom(t.clientX, t.clientY);
        pad.classList.add('down');
      }, { passive: false });
      const aimFrom = (x, y) => {
        const dx = x - px, dy = y - py, l = Math.hypot(dx, dy);
        if (l > 10) { touch.ax = dx / l; touch.ay = -dy / l; }
        const k = Math.min(l, 46) / (l || 1);
        if (pknob) pknob.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
      };
      pad.addEventListener('touchmove', (e) => { for (const t of e.changedTouches) if (t.identifier === pid) { aimFrom(t.clientX, t.clientY); e.preventDefault(); } }, { passive: false });
      const end = (e) => { for (const t of e.changedTouches) if (t.identifier === pid) { pid = null; touch.fire = false; touch.aiming = false; touch.ax = touch.ay = 0; pad.classList.remove('down'); if (pknob) pknob.style.transform = ''; } };
      pad.addEventListener('touchend', end); pad.addEventListener('touchcancel', end);
    }
    root.querySelectorAll('[data-act]').forEach((b) => {
      const a = b.dataset.act;
      if (a === 'fire') return;
      b.addEventListener('touchstart', (e) => {
        e.preventDefault();
        b.classList.add('down');
        pressed.add(a);
        if (navigator.vibrate) try { navigator.vibrate(8); } catch (er) { /* ignore */ }
      }, { passive: false });
      const up = (e) => { e.preventDefault(); b.classList.remove('down'); };
      b.addEventListener('touchend', up); b.addEventListener('touchcancel', up);
    });
  }

  // ── gamepad (standard mapping) ──────────────────────────
  // left stick move · right stick aim · RT fire · LT/A dodge · RB ultimate · LB secondary skill · B interact · X reload · Y swap
  // Start pause · Back/View map · d-pad ←↑→ = level-up cards / weapon slots 1-3. Menus: A = Enter, B = Esc, d-pad ←→ = hero pick.
  const pad = { mx: 0, my: 0, ax: 0, ay: 0, fire: false, active: false, prev: [] };
  const PAD_ACT = { 0: 'dodge', 6: 'dodge', 5: 'skill', 4: 'skill2', 1: 'interact', 2: 'reload', 3: 'swap', 9: 'pause', 8: 'map', 14: 'gun1', 12: 'gun2', 15: 'gun3', 13: 'gun4' };
  const PAD_MENU = { 0: 'Enter', 9: 'Enter', 1: 'Escape', 14: 'ArrowLeft', 15: 'ArrowRight', 2: 'KeyU', 3: 'KeyH', 8: 'KeyO' }; // X lab · Y risk level · Back settings
  const dz = (v) => (Math.abs(v) < 0.2 ? 0 : (v - Math.sign(v) * 0.2) / 0.8);
  function poll() {
    const gp = navigator.getGamepads ? [...navigator.getGamepads()].find((g) => g && g.connected) : null;
    if (!gp) { if (pad.active) { pad.active = false; pad.mx = pad.my = pad.ax = pad.ay = 0; pad.fire = false; } return; }
    const G = window.GAME && GAME.G, playing = G && G.phase === 'play' && !G.paused;
    const ax = gp.axes;
    pad.mx = dz(ax[0] || 0); pad.my = -dz(ax[1] || 0);
    const rx = dz(ax[2] || 0), ry = -dz(ax[3] || 0);
    if (Math.hypot(rx, ry) > 0.35) { const l = Math.hypot(rx, ry); pad.ax = rx / l; pad.ay = ry / l; pad.aiming = true; } else pad.aiming = false;
    const b = gp.buttons.map((x) => x.pressed || x.value > 0.5);
    if (b[7] && !pad.prev[7] && toggleFire && playing) latch = !latch;
    pad.fire = !!b[7];
    if (b.some(Boolean) || pad.mx || pad.my || pad.aiming) { pad.active = true; mouse.moved = false; }
    if (b.some((on, i) => on && !pad.prev[i]) && window.SFX && SFX.unlock) SFX.unlock(); // pad-only players: start audio on a button press
    b.forEach((on, i) => {
      if (!on || pad.prev[i]) return;
      // tactical map open: the d-pad moves the room cursor, A warps (synthetic arrow / Enter taps)
      if (playing && window.UI && UI.mapOpen && UI.mapOpen() && ({ 12: 1, 13: 1, 14: 1, 15: 1, 0: 1 })[i]) {
        const code = { 12: 'ArrowUp', 13: 'ArrowDown', 14: 'ArrowLeft', 15: 'ArrowRight', 0: 'Enter' }[i];
        window.dispatchEvent(new KeyboardEvent('keydown', { code, key: code })); window.dispatchEvent(new KeyboardEvent('keyup', { code, key: code }));
        return;
      }
      // basic training: Back skips it (except on the map step, where Back opens the map as taught)
      if (playing && G.tut && i === 8 && G.tut.i !== 5) { pressed.add('tutSkip'); return; }
      if (playing || (G && G.phase === 'play' && G.choosing)) { if (PAD_ACT[i]) pressed.add(PAD_ACT[i]); }
      else if (G && G.phase === 'play' && G.paused) {
        if (i === 9 || i === 1) { pressed.add('pause'); return; }
        // d-pad walks the pause menu's controls, A presses, ←/→ nudge a slider
        const ov = document.getElementById('pauseOv');
        const items = ov ? [...ov.querySelectorAll('button, input[type=range]')].filter((x) => x.offsetParent && !x.disabled) : [];
        if (!items.length) return;
        let k = items.indexOf(document.activeElement);
        if (i === 12 || i === 13) { k = k < 0 ? 0 : (k + (i === 13 ? 1 : -1) + items.length) % items.length; items[k].focus(); items[k].scrollIntoView({ block: 'nearest' }); }
        else if (i === 0 && k >= 0 && items[k].tagName === 'BUTTON') items[k].click();
        else if ((i === 14 || i === 15) && k >= 0 && items[k].type === 'range') { const r = items[k]; r.value = Math.max(0, Math.min(1, +r.value + (i === 15 ? 0.1 : -0.1))); r.dispatchEvent(new Event('input')); if (window.GAME && GAME.saveOpt) GAME.saveOpt(); }
      }
      else if (PAD_MENU[i]) { const code = PAD_MENU[i]; window.dispatchEvent(new KeyboardEvent('keydown', { code, key: code })); window.dispatchEvent(new KeyboardEvent('keyup', { code, key: code })); } // a tap, never a held key
    });
    pad.prev = b;
  }
  window.addEventListener('gamepadconnected', () => { if (window.UI && UI.toast) UI.toast('게임패드 연결됨 — 왼쪽 스틱 이동 · 오른쪽 스틱 조준 · RT 사격 · LT 회피', 'gem'); });

  window.INPUT = {
    poll, pad, KEY, REMAP, rebind, resetBinds, keyName, capture: null, push(a) { pressed.add(a); },
    mouse, touch,
    // aim source this frame: a touch aim-pad direction, or the mouse cursor (client px)
    aim() { if (touch.aiming && (touch.ax || touch.ay)) return { kind: 'stick', x: touch.ax, y: touch.ay };
      if (pad.aiming) return { kind: 'stick', x: pad.ax, y: pad.ay };
      if (pad.active && !mouse.moved) return null; // pad player without a right-stick push: keep the last aim (or the assist)
      if (mouse.seen && (!isTouch || mouse.used)) return { kind: 'mouse', x: mouse.x, y: mouse.y }; // touch laptops / iPads with a mouse: the mouse aims once it's used
      return null; },
    moveVec, held, take, clear, bindTouch, isTouch, get enabled() { return enabled; }, set enabled(v) { enabled = v; },
    get toggleFire() { return toggleFire; }, set toggleFire(v) { toggleFire = !!v; latch = false; },
    get firing() { return latch; }, stopFire() { latch = false; mouse.down = false; } };
})();
