// Title flow: pick a MODE first.
//  · 오르카 던전 돌파 (the original run): choose a hero on the title screen and go — no equipment, data-chip farm.
//  · 오르카 작전 기록 (RPG): create / select a saved character (a hero + a name), then run its stages
//    (5 stages x easy / normal / hard). Equipment and levels belong to that character (lao_rpg_chars).
(function () {
  const $ = (q) => document.querySelector(q);
  const STAGE_KEY = 'lao_rogue_stage', CHAR_KEY = 'lao_rpg_chars', MAX_CHARS = 6;
  let mode = null, curChar = null, sel = 0, diff = 0, newHero = 0;
  const load = (k) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v && typeof v === 'object' ? v : null; } catch (e) { return null; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* no storage */ } };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const chars = () => { const c = load(CHAR_KEY); return Array.isArray(c && c.list) ? c.list : []; };
  const setChars = (list) => save(CHAR_KEY, { v: 1, list });
  const heroOf = (c) => window.DATA.HEROES.find((h) => h.id === c.hero) || window.DATA.HEROES[0];
  const face = (h) => (window.IMG && window.IMG[h.img] ? `url(${window.IMG[h.img]})` : 'none');
  // stage progress is per character (each one climbs the stages on its own)
  const prog = () => { const all = load(STAGE_KEY) || {}; return (curChar && all[curChar.id]) || {}; };
  const cleared = (p, i) => Math.max(0, Math.min(3, Math.floor(Number(p['s' + i]) || 0)));
  const stageOpen = (p, i) => i === 0 || cleared(p, i - 1) >= 1;
  const diffOpen = (p, i, d) => stageOpen(p, i) && cleared(p, i) >= d;

  // ── screens ──
  function show(screen) {
    ['#modeOv', '#rpgOv'].forEach((q) => { const e = $(q); if (e) e.hidden = true; });
    const back = $('#btnMode'); if (back) back.hidden = screen !== null;
    if (screen === 'mode') $('#modeOv').hidden = false;
    if (screen === 'rpg') { $('#rpgOv').hidden = false; renderRpg(); }
  }
  function pickMode(m) {
    mode = m; SFX.play('uiPick', 0.6);
    show(m === 'rpg' ? 'rpg' : null); // the farm uses the existing title screen as it is
  }

  function renderRpg() {
    const D = window.DATA, list = chars();
    if (curChar && !list.find((c) => c.id === curChar.id)) curChar = null;
    if (!curChar && list.length) curChar = list[0];
    $('#rpgChars').innerHTML = list.map((c) => {
      const h = heroOf(c);
      return `<button type="button" class="rch${curChar && c.id === curChar.id ? ' on' : ''}" data-id="${c.id}" style="--c:${h.color}"><i style="background-image:${face(h)}"></i><b>${esc(c.name)}</b><small>Lv.${c.lv || 1} · ${h.name}</small></button>`;
    }).join('') + (list.length < MAX_CHARS ? '<button type="button" class="rch add" id="rpgNew"><b>＋</b><small>새 캐릭터 생성</small></button>' : '');
    const body = $('#rpgBody');
    if (!curChar) { body.innerHTML = '<p class="rempty">캐릭터를 먼저 생성하세요 — 대원을 고르고 이름을 정하면 그 캐릭터가 장비와 진행을 쌓아 갑니다.</p>'; return; }
    const p = prog(), h = heroOf(curChar);
    if (!stageOpen(p, sel)) sel = 0;
    if (!diffOpen(p, sel, diff)) diff = 0;
    const S = D.STAGES[sel], floors = D.stageFloors(sel);
    body.innerHTML = `<div class="rcol">
        <div class="rinfo" style="--c:${h.color}"><i style="background-image:${face(h)}"></i><div><b>${esc(curChar.name)}</b><small>Lv.${curChar.lv || 1} · ${h.name} · ${h.title}</small></div><button type="button" class="btn d" id="rpgDel">삭제</button></div>
        <div class="requip"><small>장착 장비 · 레벨 ${curChar.lv || 1} (EXP ${curChar.xp || 0} / ${window.EQUIP ? EQUIP.xpNeed(curChar.lv || 1) : '-'})</small><div>${(window.EQUIP ? EQUIP.SLOTS : []).map((s) => { const it = (curChar.equip || {})[s.id]; return it ? `<span class="on" title="${esc(EQUIP.itemName(it))}">${esc(EQUIP.itemName(it))}</span>` : `<span>${s.name}</span>`; }).join('')}</div><button type="button" class="btn d" id="rpgInv">인벤토리 (I)</button></div>
        <div id="stageList">${D.STAGES.map((s, i) => {
          const open = stageOpen(p, i), c = cleared(p, i);
          const stars = [0, 1, 2].map((k) => `<i class="${k < c ? 'on' : ''}" style="--c:${D.DIFFS[k].color}"></i>`).join('');
          return `<button type="button" class="stg${i === sel ? ' on' : ''}${open ? '' : ' locked'}" data-i="${i}"><small>STAGE ${i + 1}</small><b>${s.name}</b><em>${s.en}</em><span class="stars">${stars}</span>${open ? '' : '<span class="lock">이전 스테이지 클리어 시 개방</span>'}</button>`;
        }).join('')}</div></div>
      <div class="sside"><div id="stageInfo"><b>${S.name}</b><small>${floors.length}층 · 3층 중간 보스 ${D.BOSSES[S.mid].name} · ${floors.length}층 최종 보스 ${D.BOSSES[S.boss].name}</small>
        <ol>${floors.map((f) => `<li style="--c:#${f.light.toString(16).padStart(6, '0')}"><span>${f.key}</span>${f.name}${f.bossKey ? `<em>${f.mid ? '중간 보스' : '최종 보스'}</em>` : ''}</li>`).join('')}</ol></div>
        <div id="stageDiffs">${D.DIFFS.map((d, k) => { const open = diffOpen(p, sel, k); return `<button type="button" class="sdf${k === diff ? ' on' : ''}${open ? '' : ' locked'}" data-d="${k}" style="--c:${d.color}">${d.name}<small>${open ? `적 체력 x${d.hp}` : `${D.DIFFS[k - 1].name} 클리어 시 개방`}</small></button>`; }).join('')}</div>
        <button type="button" class="btn lg" id="stageGo">출격 — ${S.name} · ${D.DIFFS[diff].name}</button></div>`;
  }

  // ── character creation ──
  function openNew() {
    const D = window.DATA;
    newHero = 0;
    const ov = $('#rpgNewOv');
    ov.innerHTML = `<div class="rnew"><h3>캐릭터 생성<small>NEW OPERATOR</small></h3>
      <div class="rheroes">${D.HEROES.map((h, i) => `<button type="button" class="rh${i === 0 ? ' on' : ''}" data-i="${i}" style="--c:${h.color}"><i style="background-image:${face(h)}"></i><b>${h.name}</b><small>${h.title}</small></button>`).join('')}</div>
      <label class="rname"><span>이름</span><input id="rpgName" maxlength="12" placeholder="${D.HEROES[0].name.replace(/^T-\d+\s*/, '')}" autocomplete="off"></label>
      <div class="row"><button type="button" class="btn" id="rpgMake">생성</button><button type="button" class="btn d" id="rpgCancel">취소</button></div></div>`;
    ov.hidden = false;
    ov.querySelector('.rheroes').onclick = (e) => { const b = e.target.closest('.rh'); if (!b) return; newHero = +b.dataset.i; ov.querySelectorAll('.rh').forEach((x) => x.classList.toggle('on', x === b)); $('#rpgName').placeholder = D.HEROES[newHero].name.replace(/^T-\d+\s*/, ''); SFX.play('uiPick', 0.5); };
    $('#rpgCancel').onclick = () => { ov.hidden = true; };
    $('#rpgMake').onclick = () => {
      const h = D.HEROES[newHero], name = ($('#rpgName').value || '').trim() || $('#rpgName').placeholder;
      const c = { id: 'c' + Date.now().toString(36), name: name.slice(0, 12), hero: h.id, lv: 1, xp: 0, equip: {}, bag: [], made: Date.now() };
      const list = chars(); list.push(c); setChars(list); curChar = c; sel = 0; diff = 0;
      ov.hidden = true; SFX.play('rankUp', 0.7); UI.toast(`캐릭터 생성 — ${c.name} (${h.name})`, 'gem'); renderRpg();
    };
    setTimeout(() => $('#rpgName').focus(), 30);
  }
  function delChar() {
    if (!curChar) return;
    if (!window.confirm(`${curChar.name} 캐릭터를 삭제할까요? 장비와 진행도 함께 사라집니다.`)) return;
    setChars(chars().filter((c) => c.id !== curChar.id));
    const all = load(STAGE_KEY) || {}; delete all[curChar.id]; save(STAGE_KEY, all);
    curChar = null; renderRpg();
  }
  function go() {
    const G = window.GAME && GAME.G;
    if (!G || G.phase !== 'title' || !curChar) return;
    const idx = window.DATA.HEROES.findIndex((h) => h.id === curChar.hero);
    $('#rpgOv').hidden = true;
    SFX.play('start');
    GAME.startRun(Math.max(0, idx), { stage: sel, diff, charId: curChar.id });
  }

  function init() {
    const title = $('#title');
    if (!title || $('#modeOv')) return;
    // mode select
    const m = document.createElement('div');
    m.id = 'modeOv'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', '모드 선택');
    m.innerHTML = `<div class="mwrap"><div class="mh"><small>SELECT OPERATION MODE</small><b>작전 모드 선택</b></div><div class="mcards">
      <button type="button" class="mcard" data-m="farm"><small>CLASSIC · DATA CHIP</small><b>오르카 던전 돌파</b><p>대원을 골라 B1 ~ B6를 돌파합니다.<br>장비 없이 그 판의 성장만으로 싸우고, 데이터 칩을 모아 연구소를 강화합니다.</p></button>
      <button type="button" class="mcard rpg" data-m="rpg"><small>RPG · STAGE</small><b>오르카 작전 기록</b><p>캐릭터를 생성해 스테이지 5개를 공략합니다.<br>난이도 쉬움 · 보통 · 어려움, 장비를 모아 캐릭터를 키웁니다.</p></button>
    </div></div>`;
    title.appendChild(m);
    m.onclick = (e) => { const b = e.target.closest('.mcard'); if (b) pickMode(b.dataset.m); };
    // RPG screen
    const r = document.createElement('div');
    r.id = 'rpgOv'; r.hidden = true; r.setAttribute('role', 'dialog'); r.setAttribute('aria-label', '오르카 작전 기록');
    r.innerHTML = `<div class="sdlg"><div class="sh"><h3>오르카 작전 기록<small>RPG · STAGE</small></h3><button type="button" class="btn d" id="rpgBack">모드 선택</button></div>
      <div id="rpgChars"></div><div class="sbody" id="rpgBody"></div></div><div id="rpgNewOv" hidden></div>`;
    title.appendChild(r);
    $('#rpgBack').onclick = () => { SFX.play('uiPick', 0.5); show('mode'); };
    $('#rpgChars').onclick = (e) => { const b = e.target.closest('.rch'); if (!b) return; if (b.id === 'rpgNew') return openNew(); curChar = chars().find((c) => c.id === b.dataset.id) || null; sel = 0; diff = 0; renderRpg(); SFX.play('uiPick', 0.5); };
    $('#rpgBody').onclick = (e) => {
      const s = e.target.closest('.stg'), d = e.target.closest('.sdf');
      if (e.target.id === 'rpgDel') return delChar();
      if (e.target.id === 'rpgInv') return window.EQUIP && EQUIP.open(true, curChar.id);
      if (e.target.id === 'stageGo') return go();
      if (s) { const i = +s.dataset.i; if (!stageOpen(prog(), i)) { SFX.play('fail', 0.4); return; } sel = i; diff = 0; renderRpg(); SFX.play('uiPick', 0.5); }
      if (d) { const k = +d.dataset.d; if (!diffOpen(prog(), sel, k)) { SFX.play('fail', 0.4); return; } diff = k; renderRpg(); SFX.play('uiPick', 0.5); }
    };
    // the farm title gets a way back to the mode select
    const back = document.createElement('button');
    back.type = 'button'; back.id = 'btnMode'; back.className = 'modeBack'; back.textContent = '◀ 모드 선택'; back.hidden = true;
    back.onclick = () => { SFX.play('uiPick', 0.5); show('mode'); };
    title.appendChild(back);
    // keys: while a mode screen is up the title's own shortcuts (←→, Enter = sortie) stay out of it
    window.addEventListener('keydown', (e) => {
      if (e.target && e.target.id === 'rpgName') { if (e.code === 'Enter') { $('#rpgMake').click(); e.preventDefault(); } e.stopImmediatePropagation(); return; }
      if (!$('#rpgNewOv').hidden) { if (e.code === 'Escape') { $('#rpgNewOv').hidden = true; e.preventDefault(); } e.stopImmediatePropagation(); return; }
      if (!r.hidden) { if (e.code === 'Escape') show('mode'); else if (e.code === 'Enter') go(); e.preventDefault(); e.stopImmediatePropagation(); return; }
      if (!m.hidden) { if (e.code === 'Digit1' || e.code === 'ArrowLeft') pickMode('farm'); else if (e.code === 'Digit2' || e.code === 'ArrowRight') pickMode('rpg'); e.stopImmediatePropagation(); }
    }, true);
    // every return to the title lands on the mode select, or straight back on the RPG screen after a stage run
    // (watched on the title element itself: UI.title is replaced by other modules after this one loads)
    new MutationObserver(() => {
      if (title.hidden) return;
      const G = window.GAME && GAME.G;
      show(G && G.runOpts && G.runOpts.stage != null && mode === 'rpg' ? 'rpg' : mode === 'farm' ? null : 'mode');
    }).observe(title, { attributes: true, attributeFilter: ['hidden'] });
    show('mode');
  }
  window.STAGE_UI = { init, show, cur: () => (!$('#rpgOv').hidden && curChar ? curChar.id : null), refresh: () => { if (!$('#rpgOv').hidden) { const c = chars().find((x) => curChar && x.id === curChar.id); if (c) curChar = c; renderRpg(); } } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
