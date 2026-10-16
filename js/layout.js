// Touch layout editor: drag any control or HUD panel to a new spot and resize it.
// Saved per orientation (portrait / landscape) in localStorage 'lao_rogue_layout'
// as centre positions in viewport fractions plus a scale, so it survives screen-size changes.
(function () {
  const KEY = 'lao_rogue_layout';
  const ITEMS = [
    ['fire', '#touch .tb.fire', '사격 패드'], ['dodge', '#touch .tb.dodge', '회피'], ['sk2', '#touch .tb.sk2', '보조 스킬'],
    ['skill', '#touch .tb.skill', '궁극기'], ['swap', '#touch .tb.swap', '무기'], ['reload', '#touch .tb.reload', '장전'],
    ['act', '#touch .tb.act', '줍기'], ['pause', '#touch .tb.pause', '일시 정지'], ['hero', '#heroBox', '상태 패널'], ['map', '#mapBox', '미니맵'],
  ];
  const PROPS = ['position', 'left', 'top', 'right', 'bottom', 'transform', 'transform-origin', 'margin'];
  const orient = () => (innerWidth < innerHeight ? 'p' : 'l');
  const load = () => { try { const v = JSON.parse(localStorage.getItem(KEY) || '{}'); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; } };
  const save = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* ignore */ } };
  const num = (v, lo, hi, d) => (Number.isFinite(+v) ? Math.max(lo, Math.min(hi, +v)) : d);
  const elOf = (sel) => document.querySelector(sel);

  function place(el, e) {
    const w = el.offsetWidth, h = el.offsetHeight;
    const cx = num(e.x, 0, 1, 0.5) * innerWidth, cy = num(e.y, 0, 1, 0.5) * innerHeight, s = num(e.s, 0.5, 1.8, 1);
    const set = (k, v) => el.style.setProperty(k, v, 'important');
    set('position', 'fixed'); set('left', Math.round(cx - w / 2) + 'px'); set('top', Math.round(cy - h / 2) + 'px');
    set('right', 'auto'); set('bottom', 'auto'); set('margin', '0'); set('transform', `scale(${s})`); set('transform-origin', '50% 50%');
    // a parent may still act as the containing block (transforms / zoom in older rules): measure and correct once
    const r = el.getBoundingClientRect(), dx = cx - (r.left + r.width / 2), dy = cy - (r.top + r.height / 2);
    if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) { set('left', Math.round(cx - w / 2 + dx) + 'px'); set('top', Math.round(cy - h / 2 + dy) + 'px'); }
  }
  function clear(el) { PROPS.forEach((k) => el.style.removeProperty(k)); }

  // apply the saved layout for the current orientation (touch only)
  function apply() {
    if (!(window.INPUT && INPUT.isTouch)) return;
    const all = load(), lay = all[orient()] || {};
    const any = ITEMS.some(([id]) => lay[id]);
    // the class first: it lifts the button group's own transform, which would otherwise be the frame the positions are measured in
    document.body.classList.toggle('custom-layout', any || editing); // (while editing, every control is placed on the screen itself)
    for (const [id, sel] of ITEMS) {
      const el = elOf(sel); if (!el) continue;
      if (lay[id]) place(el, lay[id]); else clear(el);
    }
  }

  // ── edit mode ──────────────────────────────────────
  let editing = false, sel = null, drag = null, bar = null, work = null, restore = null, pre = {};
  function centreOf(el) { const r = el.getBoundingClientRect(); return { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight }; }
  function select(id) {
    sel = id;
    ITEMS.forEach(([i, s]) => { const el = elOf(s); if (el) el.classList.toggle('lay-sel', i === id); });
    const it = ITEMS.find((x) => x[0] === id);
    bar.querySelector('.ln').textContent = it ? it[2] : '항목을 눌러 선택';
    const r = bar.querySelector('input'); r.disabled = !id; r.value = id ? (work[id] || pre[id] || { s: 1 }).s : 1;
    bar.querySelector('.lv').textContent = id ? Math.round(r.value * 100) + '%' : '';
    bar.querySelector('.lone').disabled = !id;
  }
  function itemAt(t) { for (const [id, s] of ITEMS) { const el = elOf(s); if (el && el.contains(t)) return [id, el]; } return null; }
  const block = (ev) => { if (!editing || (bar && bar.contains(ev.target))) return; ev.stopImmediatePropagation(); if (ev.cancelable) ev.preventDefault(); };
  function onDown(ev) {
    if (!editing || (bar && bar.contains(ev.target))) return;
    ev.stopImmediatePropagation(); ev.preventDefault();
    const hit = itemAt(ev.target);
    if (!hit) { select(null); return; }
    const [id, el] = hit;
    if (!work[id]) work[id] = pre[id] ? Object.assign({}, pre[id]) : Object.assign(centreOf(el), { s: 1 });
    select(id);
    const c = work[id];
    drag = { id, el, dx: ev.clientX - c.x * innerWidth, dy: ev.clientY - c.y * innerHeight, pid: ev.pointerId };
    place(el, c);
  }
  function onMove(ev) {
    if (!editing || !drag || ev.pointerId !== drag.pid) return;
    ev.stopImmediatePropagation(); ev.preventDefault();
    const c = work[drag.id];
    c.x = Math.max(0.02, Math.min(0.98, (ev.clientX - drag.dx) / innerWidth));
    c.y = Math.max(0.02, Math.min(0.98, (ev.clientY - drag.dy) / innerHeight));
    place(drag.el, c);
  }
  function onUp(ev) { if (!editing) return; if (drag && ev.pointerId === drag.pid) drag = null; if (!(bar && bar.contains(ev.target))) { ev.stopImmediatePropagation(); } }

  function buildBar() {
    bar = document.createElement('div'); bar.id = 'layBar';
    bar.innerHTML = `<b>UI 배치 편집</b><small>항목을 끌어서 옮기고, 선택한 항목의 크기를 조절하세요</small>
      <div class="lrow"><span class="ln">항목을 눌러 선택</span><input type="range" min="0.6" max="1.6" step="0.05" value="1" disabled aria-label="선택 항목 크기"><span class="lv"></span></div>
      <div class="lrow"><button type="button" class="lone" disabled>선택 항목 기본값</button><button type="button" class="lall">전체 기본값</button><button type="button" class="ldone">완료</button></div>`;
    const r = bar.querySelector('input');
    r.oninput = () => { if (!sel) return; const el = elOf(ITEMS.find((x) => x[0] === sel)[1]); if (!work[sel]) work[sel] = pre[sel] ? Object.assign({}, pre[sel]) : Object.assign(centreOf(el), { s: 1 }); work[sel].s = +r.value; bar.querySelector('.lv').textContent = Math.round(r.value * 100) + '%'; place(el, work[sel]); };
    bar.querySelector('.lone').onclick = () => { if (!sel) return; delete work[sel]; const el = elOf(ITEMS.find((x) => x[0] === sel)[1]); if (el && pre[sel]) place(el, pre[sel]); else if (el) clear(el); select(null); };
    bar.querySelector('.lall').onclick = () => { work = {}; document.body.classList.remove('custom-layout'); ITEMS.forEach(([, s]) => { const el = elOf(s); if (el) clear(el); }); pre = {}; for (const [id, s] of ITEMS) { const el = elOf(s); if (!el) continue; const r = el.getBoundingClientRect(); if (r.width) pre[id] = { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight, s: Math.max(0.5, Math.min(1.8, r.width / (el.offsetWidth || r.width))) }; } document.body.classList.add('custom-layout'); for (const [id, s] of ITEMS) { const el = elOf(s); if (el && pre[id]) place(el, pre[id]); } select(null); };
    bar.querySelector('.ldone').onclick = () => edit(false);
    document.body.appendChild(bar);
  }

  function edit(on) {
    if (on === editing || !(window.INPUT && INPUT.isTouch)) return;
    editing = on;
    if (on) {
      const pause = document.getElementById('pauseOv'), title = document.getElementById('title'), hud = document.getElementById('hud');
      restore = { pause: pause && !pause.hidden, title: title && !title.hidden, hud: hud && hud.hidden };
      if (pause) pause.hidden = true; if (title) title.hidden = true; if (hud) hud.hidden = false;
      work = JSON.parse(JSON.stringify(load()[orient()] || {}));
      // where every untouched control sits right now (with the default layout's scaling), measured before switching to screen placement
      pre = {};
      for (const [id, s] of ITEMS) { const el = elOf(s); if (!el || work[id]) continue; const r = el.getBoundingClientRect(); if (r.width) pre[id] = { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight, s: Math.max(0.5, Math.min(1.8, r.width / (el.offsetWidth || r.width))) }; }
      document.body.classList.add('layout-edit', 'custom-layout');
      if (!bar) buildBar(); bar.hidden = false;
      apply();
      for (const [id, s] of ITEMS) { const el = elOf(s); if (el && !work[id] && pre[id]) place(el, pre[id]); }
      select(null);
    } else {
      // once anything is moved, the whole set is stored (untouched controls keep the spot they had), so nothing shifts afterwards
      const all = load(); all[orient()] = Object.keys(work).length ? Object.assign({}, pre, work) : {}; save(all);
      ITEMS.forEach(([, s]) => { const el = elOf(s); if (el) el.classList.remove('lay-sel'); });
      document.body.classList.remove('layout-edit');
      if (bar) bar.hidden = true;
      const pause = document.getElementById('pauseOv'), title = document.getElementById('title'), hud = document.getElementById('hud');
      if (restore) { if (pause && restore.pause) pause.hidden = false; if (title && restore.title) title.hidden = false; if (hud && restore.hud) hud.hidden = true; }
      drag = null; apply();
      if (window.UI && UI.toast) UI.toast('UI 배치를 저장했습니다 (' + (orient() === 'p' ? '세로' : '가로') + ' 화면)', 'gem');
    }
  }

  window.addEventListener('pointerdown', onDown, true);
  window.addEventListener('pointermove', onMove, true);
  window.addEventListener('pointerup', onUp, true);
  window.addEventListener('pointercancel', onUp, true);
  ['touchstart', 'touchmove', 'touchend', 'mousedown', 'click'].forEach((t) => window.addEventListener(t, block, { capture: true, passive: false }));
  window.addEventListener('resize', () => { if (editing) { for (const [id, s] of ITEMS) { const el = elOf(s); if (el && work[id]) place(el, work[id]); } } else apply(); });

  window.LAYOUT = { apply, edit, get editing() { return editing; } };
})();
