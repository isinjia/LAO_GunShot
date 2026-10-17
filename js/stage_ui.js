// Front end before a run: MODE SELECT → (classic: the existing title) | (RPG: OPERATOR HUB → operator creation / stage
// and difficulty → sortie). Art is the original game's (assets/ui: map-preview chapter cards, battle backgrounds,
// the character-creator blueprint, formation portraits); the selected operator stands on the title's 3D stage.
(function () {
  const $ = (q, r) => (r || document).querySelector(q);
  const $$ = (q, r) => [...(r || document).querySelectorAll(q)];
  const STAGE_KEY = 'lao_rogue_stage', CHAR_KEY = 'lao_rpg_chars', MAX_CHARS = 6, UIP = new URL('assets/ui/', document.baseURI).href; // absolute: some urls travel in CSS custom properties
  let mode = null, curChar = null, sel = 0, diff = 0, newHero = 0, modeFocus = 0;
  const load = (k) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v && typeof v === 'object' ? v : null; } catch (e) { return null; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* no storage */ } };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const D = () => window.DATA;
  const chars = () => { const c = load(CHAR_KEY); return Array.isArray(c && c.list) ? c.list : []; };
  const setChars = (list) => { const c = load(CHAR_KEY) || {}; save(CHAR_KEY, { ...c, v: 1, list }); };
  const heroOf = (c) => D().HEROES.find((h) => h.id === c.hero) || D().HEROES[0];
  const portrait = (h) => `${UIP}f_${h.id}.webp`;
  const bossImg = (k) => { const b = D().BOSSES[k]; return b && window.IMG && window.IMG[b.img] ? window.IMG[b.img] : ''; };
  const prog = () => { const all = load(STAGE_KEY) || {}; return (curChar && all[curChar.id]) || {}; };
  const cleared = (p, i) => Math.max(0, Math.min(3, Math.floor(Number(p['s' + i]) || 0)));
  const stageOpen = (p, i) => i === 0 || cleared(p, i - 1) >= 1;
  const diffOpen = (p, i, d) => stageOpen(p, i) && cleared(p, i) >= d;
  // recommended gear power per stage / difficulty (the run itself always starts at Lv.1)
  // entry gate: the SUM of the item levels of everything worn (9 slots) must reach the stage / difficulty's entry level
  const gearIl = (c) => Object.values(c.equip || {}).reduce((n, it) => n + (it && it.ilvl ? it.ilvl : 0), 0);
  const reqIl = (s, d) => 9 * Math.max(0, s * 9 + d * 5 - 4);
  const RCOL = { normal: '#d8d8d8', magic: '#6a8cff', rare: '#ffd84a', unique: '#d8a040', set: '#40e060' };
  const sfx = (k, v) => { if (window.SFX) SFX.play(k, v == null ? 0.5 : v); };
  const power = (c) => (window.EQUIP ? EQUIP.gearPower(EQUIP.charStats(c)) : 100);

  // ── a styled confirm (replaces window.confirm) ──
  function confirmBox(title, text, okLabel, opt) {
    opt = opt || {};
    return new Promise((res) => {
      const ov = $('#uiConfirm');
      ov.innerHTML = `<div class="ucbox${opt.danger ? ' danger' : ''}" role="alertdialog" aria-modal="true"><h4>${esc(title)}</h4><p>${text}</p>${opt.typeName ? `<label class="uctype"><span>확인을 위해 <b>${esc(opt.typeName)}</b> 입력</span><input id="ucType" autocomplete="off" spellcheck="false"></label>` : ''}<div class="ucrow"><button type="button" class="btn d" data-r="0">취소</button><button type="button" class="ucok${opt.danger ? ' danger' : ''}" data-r="1"${opt.typeName ? ' disabled' : ''}>${esc(okLabel || '확인')}</button></div></div>`;
      if (opt.typeName) { const ti = $('#ucType', ov), okb = $('[data-r="1"]', ov); ti.oninput = () => { okb.disabled = ti.value.trim() !== opt.typeName; }; }
      ov.hidden = false; sfx('uiPick', 0.5);
      const done = (v) => { ov.hidden = true; ov.onclick = null; window.removeEventListener('keydown', key, true); res(v); };
      const key = (e) => { if (e.code === 'Escape') { done(false); e.preventDefault(); e.stopImmediatePropagation(); } else if (e.code === 'Enter') { const okb = $('[data-r="1"]', ov); if (okb && !okb.disabled && !opt.danger) done(true); e.preventDefault(); e.stopImmediatePropagation(); } };
      ov.onclick = (e) => { const b = e.target.closest('[data-r]'); if (b && !b.disabled) done(b.dataset.r === '1'); else if (e.target === ov) done(false); };
      window.addEventListener('keydown', key, true);
      setTimeout(() => { const b = $('[data-r="0"]', ov); if (b) b.focus(); }, 20);
    });
  }

  // ── screens ──
  function show(screen) {
    const title = $('#title');
    $('#modeOv').hidden = screen !== 'mode';
    $('#rpgOv').hidden = screen !== 'rpg';
    title.classList.toggle('rpgmode', screen === 'rpg' || screen === 'mode');
    const back = $('#btnMode'); if (back) back.hidden = screen !== null;
    if (screen === 'mode') renderMode();
    if (screen === 'rpg') { renderRpg(); stageShow(); }
    if (screen !== 'rpg' && window.GAME && GAME.G) GAME.G.quietStage = false;
    if (screen === null && window.GAME && GAME.showcase && window.UI && UI.sel != null) GAME.showcase(UI.sel); // the classic title's own pick
  }
  function stageShow() {
    if (!window.GAME || !GAME.showcase) return;
    GAME.G.quietStage = false;
    if (curChar) { const i = D().HEROES.findIndex((h) => h.id === curChar.hero); if (i >= 0) GAME.showcase(i); } else { GAME.G.quietStage = true; GAME.showcase(-1); } // empty roster: a quiet stage (no ring, sparks or '?')
  }
  function pickMode(m) {
    mode = m; sfx('start', 0.7);
    const card = $(`.mcard[data-m="${m}"]`); if (card) card.classList.add('go');
    setTimeout(() => { $$('.mcard').forEach((c) => c.classList.remove('go')); show(m === 'rpg' ? 'rpg' : null); }, 260);
  }
  function renderMode() {
    const lg = $('#modeOv .mlogo'); if (lg && !lg.style.backgroundImage && window.UIA && UIA.logo) { lg.style.backgroundImage = `url(${UIA.logo.u})`; lg.style.aspectRatio = UIA.logo.w / UIA.logo.h; }
    $$('.mcard').forEach((c, i) => c.classList.toggle('focus', i === modeFocus));
    const n = chars().length;
    $('#mcRpgMeta').textContent = n ? `등록된 대원 ${n}명` : '새 대원을 등록해 시작';
  }

  // ── RPG hub ──
  function renderRpg() {
    const list = chars();
    if (curChar) curChar = list.find((c) => c.id === curChar.id) || null;
    if (!curChar && list.length) curChar = list[0];
    $('#rpgRoster').innerHTML = list.map((c) => {
      const h = heroOf(c), ne = Object.values(c.equip || {}).filter(Boolean).length;
      return `<button type="button" class="rr${curChar && c.id === curChar.id ? ' on' : ''}" data-id="${c.id}" style="--c:${h.color}">
        <i style="background-image:url(${portrait(h)})"></i><div><b>${esc(c.name)}</b><small>${h.name}</small>
        <span class="rlv"><em class="num">아이템 Lv ${gearIl(c)}</em><small>장비 ${ne}/9</small></span></div></button>`;
    }).join('') + (list.length < MAX_CHARS ? `<button type="button" class="rr add" id="rpgNew"><i></i><div><b>새 대원 등록</b><small>${list.length} / ${MAX_CHARS}</small></div></button>` : '');
    const body = $('#rpgStage'), plate = $('#rpgPlate');
    $('#rpgOv').classList.toggle('empty', !curChar);
    if (!curChar) {
      body.innerHTML = `<div class="rempty"><small>OPERATION RECORD</small><b>첫 대원을 등록하세요</b><p>대원을 고르고 이름을 붙이면, 작전마다 Lv.1부터 다시 싸우며 모은 장비가 그 대원에게 쌓입니다.</p><ol><li><em>1</em>대원 등록</li><li><em>2</em>스테이지 · 난이도 선택</li><li><em>3</em>출격해 장비 파밍</li></ol><button type="button" class="btn lg" id="rpgNew2">새 대원 등록</button></div>`;
      plate.hidden = true; return;
    }
    const p = prog(), h = heroOf(curChar), S = D().STAGES, Df = D().DIFFS;
    if (!stageOpen(p, sel)) sel = 0;
    if (!diffOpen(p, sel, diff)) diff = 0;
    const St = S[sel], floors = D().stageFloors(sel), il = gearIl(curChar), rec = reqIl(sel, diff), short = il < rec;
    const chap = S.map((s, i) => {
      const open = stageOpen(p, i), c = cleared(p, i);
      return `<button type="button" class="chp${i === sel ? ' on' : ''}${open ? '' : ' locked'}" data-i="${i}" aria-label="스테이지 ${i + 1} ${s.name}${open ? '' : ' (잠김)'}">
        <i style="background-image:url(${UIP}chap_${i + 1}.webp)"></i><span class="cn num">${String(i + 1).padStart(2, '0')}</span><span class="cnm">${s.name}<em class="cil${gearIl(curChar) < reqIl(i, 0) ? ' low' : ''}">입장 Lv ${reqIl(i, 0)}</em></span>
        <span class="st">${[0, 1, 2].map((k) => `<b class="${k < c ? 'on' : ''}" style="--c:${Df[k].color}"></b>`).join('')}</span>${open ? '' : '<span class="lk"></span>'}</button>`;
    }).join('');
    const path = floors.map((f, i) => {
      const b = f.bossKey;
      return `<li class="${b ? (f.mid ? 'mid' : 'fin') : ''}" style="--c:#${f.light.toString(16).padStart(6, '0')}"><span class="nd">${b ? `<i style="background-image:url(${bossImg(b)})"></i>` : `<em class="num">${i + 1}</em>`}</span>
        <small class="num">${f.key}</small><b>${b ? D().BOSSES[b].name : f.name}</b>${b ? `<u>${f.mid ? '중간 보스' : '최종 보스'}</u>` : ''}</li>`;
    }).join('');
    const ilv0 = 1 + sel * 9 + diff * 5, ilv1 = ilv0 + (floors.length - 1) * 2 + 3;
    body.innerHTML = `<div class="chaps" role="tablist" aria-label="스테이지">${chap}</div>
      <div class="sban" style="background-image:linear-gradient(90deg, rgba(8,10,14,0.92) 0%, rgba(8,10,14,0.45) 50%, rgba(8,10,14,0) 100%), url(${UIP}stage_${sel + 1}.webp)">
        <small class="num">STAGE ${String(sel + 1).padStart(2, '0')} · ${St.en}</small><h2>${St.name}</h2>
        <p>${floors.length}개 층 · 3층 중간 보스 · ${floors.length}층 최종 보스<br>층마다 경비 구역을 제압하고 승강기로 내려갑니다.</p>
        ${rec ? `<span class="rec${short ? ' low' : ''}">입장 아이템 레벨 ${rec}${short ? ` · 현재 ${il}` : ''}</span>` : '<span class="rec">입문 스테이지 · 제한 없음</span>'}</div>
      <ol class="path" style="--n:${floors.length}">${path}</ol>
      <div class="diffs" role="radiogroup" aria-label="난이도">${Df.map((d, k) => { const open = diffOpen(p, sel, k); return `<button type="button" role="radio" aria-checked="${k === diff}" class="df${k === diff ? ' on' : ''}${open ? '' : ' locked'}" data-d="${k}" style="--c:${d.color}"><b>${d.name}</b><small>${open ? `적 체력 x${d.hp} · 입장 Lv ${reqIl(sel, k)}` : `${Df[k - 1].name} 클리어 시 개방 · 입장 Lv ${reqIl(sel, k)}`}</small><kbd>${k + 1}</kbd></button>`; }).join('')}</div>
      <div class="rwd"><small>획득 보상</small><span class="rc gear"><i></i>장비<b class="num">Lv ${ilv0}~${ilv1}</b></span><span class="rc rune"><i></i>보석 · 룬</span><span class="rc chip"><i></i>데이터 칩<b>소량</b></span></div>
      ${short ? `<button type="button" class="btn lg go blocked" id="stageGo" aria-disabled="true"><span>입장 불가</span><small>아이템 레벨 합 ${il} / ${rec} — 장비를 더 갖추세요</small></button>` : `<button type="button" class="btn lg go" id="stageGo"><span>출격</span><small>${St.name} · ${Df[diff].name}</small></button>`}`;
    // the nameplate beside the 3D stage
    plate.hidden = false;
    const eq = curChar.equip || {}, slots = window.EQUIP ? EQUIP.SLOTS : [];
    plate.innerHTML = `<i class="pnpt" style="background-image:url(${portrait(h)});--c:${h.color}"></i><div class="pnh" style="--c:${h.color}"><small>${h.title}</small><h3>${esc(curChar.name)}</h3><span class="cls">${h.name}</span></div>
      <div class="pnpw"><small>아이템 레벨 합</small><b class="num">${gearIl(curChar)}</b><small class="pnsub">전투력 ${power(curChar).toLocaleString()}</small></div>
      <div class="pneq">${slots.map((s) => { const it = eq[s.id]; return `<span class="${it ? 'on' : ''}" title="${it ? esc(EQUIP.itemName(it)) : s.name}" style="--rc:${it ? (it.rw ? '#c8a050' : RCOL[it.rar] || '#888') : 'rgba(255,255,255,0.15)'}">${it ? `<i style="background-image:url(${EQUIP.iconOf(it)})"></i>` : `<em aria-hidden="true"></em>`}</span>`; }).join('')}</div><small class="pneqc">장착 ${slots.filter((s) => eq[s.id]).length} / ${slots.length}</small>
      <div class="pnact"><button type="button" class="btn d" id="rpgInv">인벤토리 <kbd>I</kbd></button><button type="button" class="pndel" id="rpgDel">대원 삭제</button></div>`;
  }

  // ── operator creation ──
  const NAMES = ['알파', '레이븐', '세이버', '노바', '팬텀', '이클립스', '스톰', '블레이드', '루나', '아스트라', '오로라', '케스트렐'];
  function renderNew() {
    const H = D().HEROES, h = H[newHero], G = D().GUNS[h.gun] || {};
    const bar = (v) => `<span class="bar"><span style="width:${Math.min(100, v * 20)}%"></span></span><b class="num">${'ABCDS'[Math.max(0, Math.min(4, v - 1))] || 'C'}</b>`;
    const clean = (s) => esc(String(s || '').replace(/^\[[^\]]*\]\s*/, ''));
    $('#rpgNewOv').innerHTML = `<div class="cw" role="dialog" aria-modal="true" aria-label="대원 등록">
      <div class="chd"><small>NEW OPERATOR</small><h3>대원 등록</h3><span class="ckeys"><kbd>←</kbd><kbd>→</kbd> 대원 · <kbd>Enter</kbd> 등록 · <kbd>Esc</kbd> 취소</span><button type="button" class="cx" id="rpgCancel" aria-label="닫기">✕</button></div>
      <div class="cbody">
        <div class="cprev" style="--c:${h.color}"><i style="background-image:url(${portrait(h)})"></i><div class="cpn"><small>${h.title}</small><b>${h.name}</b></div></div>
        <div class="cinfo">
          <div class="cgrid" role="radiogroup" aria-label="대원 선택">${H.map((x, i) => `<button type="button" role="radio" aria-checked="${i === newHero}" class="cg${i === newHero ? ' on' : ''}" data-i="${i}" style="--c:${x.color}"><i style="background-image:url(${portrait(x)})"></i><b>${x.name.replace(/^T-\d+\s*/, '')}</b></button>`).join('')}</div>
          <p class="cdesc">${esc(h.desc || '')}</p>
          <div class="cstat"><span>공격</span>${bar(h.stats ? h.stats.atk : 3)}<span>방어</span>${bar(h.stats ? h.stats.def : 3)}<span>기동</span>${bar(h.stats ? h.stats.mob : 3)}</div>
          <div class="cskill"><div><kbd>무기</kbd><b>${G.name || ''}</b><small>${clean(G.desc)}</small></div>
            <div><kbd>E</kbd><b>${h.sk2 ? h.sk2.name : ''}</b><small>${clean(h.sk2 && h.sk2.desc)}</small></div>
            <div><kbd>F</kbd><b>${h.skillName}</b><small>${clean(h.skillDesc)}</small></div></div>
          <label class="cname"><span>대원 이름</span><input id="rpgName" maxlength="12" autocomplete="off" spellcheck="false" placeholder="${h.name.replace(/^T-\d+\s*/, '')}"><button type="button" id="rpgRand" title="무작위 이름" aria-label="무작위 이름">RANDOM</button></label>
          <div class="cact"><button type="button" class="btn lg" id="rpgMake">등록</button></div>
        </div></div></div>`;
  }
  function openNew() {
    if (chars().length >= MAX_CHARS) { UI.toast(`대원은 최대 ${MAX_CHARS}명까지 등록할 수 있습니다`, 'warn'); return; }
    newHero = 0; renderNew(); $('#rpgNewOv').hidden = false; sfx('uiPick', 0.6);
    if (window.GAME && GAME.showcase) GAME.showcase(newHero);
    setTimeout(() => { const c = $('#rpgNewOv .cg.on'); if (c) c.focus({ preventScroll: true }); }, 40);
  }
  function closeNew() { $('#rpgNewOv').hidden = true; stageShow(); }
  function swapNew(i) { const fo = document.activeElement && document.activeElement.id === 'rpgName'; newHero = i; const v = $('#rpgName') ? $('#rpgName').value : ''; renderNew(); $('#rpgName').value = v; if (fo) $('#rpgName').focus(); else { const c = $('#rpgNewOv .cg.on'); if (c) c.focus({ preventScroll: true }); } if (window.GAME) GAME.showcase(newHero); sfx('uiPick', 0.4); }
  function makeChar() {
    const h = D().HEROES[newHero], inp = $('#rpgName');
    const name = (inp.value || '').trim().slice(0, 12) || h.name.replace(/^T-\d+\s*/, '');
    if (chars().some((c) => c.name === name)) { inp.classList.add('bad'); UI.toast('같은 이름의 대원이 이미 있습니다', 'warn'); sfx('fail', 0.5); return; }
    const c = { id: 'c' + Date.now().toString(36), name, hero: h.id, equip: {}, bag: [], stash: [], made: Date.now() };
    const list = chars(); list.push(c); setChars(list); curChar = c; sel = 0; diff = 0;
    $('#rpgNewOv').hidden = true; sfx('rankUp', 0.7); UI.toast(`대원 등록 — ${esc(name)} (${h.name})`, 'gem');
    renderRpg(); stageShow();
  }
  async function delChar() {
    if (!curChar) return;
    const ok = await confirmBox('대원 삭제', `<b>${esc(curChar.name)}</b> (전투력 ${power(curChar)})을(를) 삭제합니다.<br>장비 · 창고 · 스테이지 진행이 모두 사라지며 되돌릴 수 없습니다.`, '영구 삭제', { danger: true, typeName: Object.values(curChar.equip || {}).some(Boolean) || (curChar.bag || []).length || (curChar.stash || []).length ? curChar.name : null });
    if (!ok) return;
    setChars(chars().filter((c) => c.id !== curChar.id));
    const all = load(STAGE_KEY) || {}; delete all[curChar.id]; save(STAGE_KEY, all);
    curChar = null; renderRpg(); stageShow();
  }
  function go() {
    const G = window.GAME && GAME.G;
    if (!G || G.phase !== 'title' || !curChar) return;
    { const il = gearIl(curChar), rq = reqIl(sel, diff); if (il < rq) { sfx('fail', 0.5); UI.toast(`입장 아이템 레벨 부족 — 장착 장비 합 ${il} / ${rq}`, 'warn'); const b = $('#stageGo'); if (b) { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); } return; } }
    const idx = D().HEROES.findIndex((h) => h.id === curChar.hero);
    const btn = $('#stageGo'); if (btn) btn.classList.add('fire');
    sfx('start', 0.9);
    setTimeout(() => { $('#rpgOv').hidden = true; GAME.startRun(Math.max(0, idx), { stage: sel, diff, charId: curChar.id }); }, 220);
  }
  function selectChar(id) { const c = chars().find((x) => x.id === id); if (!c || (curChar && c.id === curChar.id)) return; curChar = c; sel = 0; diff = 0; renderRpg(); stageShow(); sfx('uiPick', 0.5); }
  function setStage(i) { if (!stageOpen(prog(), i)) { sfx('fail', 0.4); UI.toast('이전 스테이지를 쉬움 이상으로 클리어하면 열립니다', 'warn'); return; } if (i === sel) return; sel = i; diff = Math.min(diff, cleared(prog(), i)); renderRpg(); sfx('uiPick', 0.5); }
  function setDiff(k) { if (!diffOpen(prog(), sel, k)) { sfx('fail', 0.4); UI.toast(`${D().DIFFS[k - 1].name} 난이도를 먼저 클리어하세요`, 'warn'); return; } if (k === diff) return; diff = k; renderRpg(); sfx('uiPick', 0.5); }

  // one uniform scale per window size: every screen is laid out at a fixed design size (1600 x 900 for the hub,
  // 1180 x 760 for the inventory) and only zoomed as a whole, so panels, cards and slots never resize on their own
  function fitScale() {
    const vw = window.innerWidth, vh = window.innerHeight, r = document.documentElement.style;
    r.setProperty('--fs', Math.min(1.35, Math.max(0.5, Math.min(vw / 1600, vh / 900))).toFixed(3));
    r.setProperty('--fsi', Math.min(1.25, Math.max(0.5, Math.min((vw - 24) / 1180, (vh - 24) / 760))).toFixed(3));
  }
  function init() {
    const title = $('#title');
    fitScale(); window.addEventListener('resize', fitScale);
    if (!title || $('#modeOv')) return;
    // mode select
    const m = document.createElement('div');
    m.id = 'modeOv'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', '작전 모드 선택');
    m.innerHTML = `<div class="mbg"></div><div class="mwrap">
      <div class="mh"><div class="mlogo"></div><small>SELECT OPERATION MODE</small><b>작전 모드 선택</b></div>
      <div class="mcards">
        <button type="button" class="mcard" data-m="farm" style="--art:url(${UIP}mode_horde.webp)"><span class="art"></span><span class="tag">CLASSIC</span>
          <span class="mt"><small>DATA CHIP OPERATION</small><b>오르카 던전 돌파</b></span>
          <ul><li>대원을 골라 B1 ~ B6 연속 돌파</li><li>장비 없이 그 판의 성장만으로 승부</li><li>데이터 칩을 모아 연구소 영구 강화</li></ul><span class="cta">시작 <kbd>1</kbd></span></button>
        <button type="button" class="mcard rpg" data-m="rpg" style="--art:url(${UIP}mode_hero.webp)"><span class="art"></span><span class="tag new">NEW · RPG</span>
          <span class="mt"><small>OPERATION RECORD</small><b>오르카 작전 기록</b></span>
          <ul><li>매 작전 Lv.1부터 · 장비는 영구 보존</li><li>스테이지 5개 · 쉬움 / 보통 / 어려움</li><li>장비 · 소켓 · 보석 · 룬워드 파밍</li></ul><span class="meta" id="mcRpgMeta"></span><span class="cta">시작 <kbd>2</kbd></span></button>
      </div>
      <div class="mfoot"><span><kbd>←</kbd><kbd>→</kbd> 선택</span><span><kbd>Enter</kbd> 결정</span></div></div>`;
    title.appendChild(m);
    m.onclick = (e) => { const b = e.target.closest('.mcard'); if (b) pickMode(b.dataset.m); };
    m.onmouseover = (e) => { const b = e.target.closest('.mcard'); if (!b) return; const i = $$('.mcard').indexOf(b); if (i !== modeFocus) { modeFocus = i; renderMode(); sfx('uiPick', 0.25); } };
    // RPG hub
    const r = document.createElement('div');
    r.id = 'rpgOv'; r.hidden = true; r.setAttribute('role', 'dialog'); r.setAttribute('aria-label', '오르카 작전 기록');
    r.innerHTML = `<div class="rtop"><button type="button" class="rback" id="rpgBack"><span>◀</span> 모드 선택</button><div class="rtt"><small>OPERATION RECORD</small><b>오르카 작전 기록</b></div>
        <div class="rkeys"><span><kbd>↑</kbd><kbd>↓</kbd> 스테이지</span><span><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> 난이도</span><span><kbd>Tab</kbd> 대원</span><span><kbd>I</kbd> 인벤토리</span><span><kbd>Enter</kbd> 출격</span></div></div>
      <div class="rcols"><aside class="rcol1"><div class="rhd">대원<small>OPERATORS</small></div><div id="rpgRoster"></div></aside>
        <section class="rcol2" id="rpgStage"></section></div>
      <div id="rpgPlate" hidden></div><div id="rpgNewOv" hidden></div>`;
    title.appendChild(r);
    const cf = document.createElement('div'); cf.id = 'uiConfirm'; cf.hidden = true; document.body.appendChild(cf);
    $('#rpgBack').onclick = () => { sfx('uiPick', 0.5); show('mode'); };
    r.addEventListener('click', (e) => {
      const t = e.target, idEl = t.closest('[id]'), id = idEl && idEl.id;
      if (id === 'rpgNew' || id === 'rpgNew2') return openNew();
      if (id === 'rpgDel') return delChar();
      if (id === 'rpgInv') return window.EQUIP && EQUIP.open(true, curChar && curChar.id);
      if (id === 'stageGo') return go();
      if (id === 'rpgCancel') return closeNew();
      if (id === 'rpgMake') return makeChar();
      if (id === 'rpgRand') { const n = $('#rpgName'); n.value = NAMES[Math.floor(Math.random() * NAMES.length)] + '-' + Math.floor(10 + Math.random() * 90); n.classList.remove('bad'); sfx('uiPick', 0.4); return; }
      const rr = t.closest('.rr:not(.add)'); if (rr) return selectChar(rr.dataset.id);
      const ch = t.closest('.chp'); if (ch) return setStage(+ch.dataset.i);
      const df = t.closest('.df'); if (df) return setDiff(+df.dataset.d);
      const cg = t.closest('.cg'); if (cg) return swapNew(+cg.dataset.i);
      if (t.id === 'rpgNewOv') closeNew();
    });
    // the classic title gets a way back to the mode select
    const back = document.createElement('button');
    back.type = 'button'; back.id = 'btnMode'; back.className = 'modeBack'; back.innerHTML = '<span>◀</span> 모드 선택'; back.hidden = true;
    back.onclick = () => { sfx('uiPick', 0.5); show('mode'); };
    title.appendChild(back);
    // keyboard: each screen owns its keys; the classic title's shortcuts (←→, Enter = sortie) never leak through
    window.addEventListener('keydown', (e) => {
      if (!$('#uiConfirm').hidden || title.hidden) return;
      if (!r.hidden && !$('#rpgNewOv').hidden) {
        if (e.target && e.target.id === 'rpgName') { const v = e.target; const edge = (e.code === 'ArrowLeft' && v.selectionStart === 0 && v.selectionEnd === 0) || (e.code === 'ArrowRight' && v.selectionStart === v.value.length) || e.altKey; if ((e.code === 'ArrowLeft' || e.code === 'ArrowRight') && (edge || !v.value)) { const H = D().HEROES.length; swapNew((newHero + (e.code === 'ArrowRight' ? 1 : H - 1)) % H); e.preventDefault(); } else if (e.code === 'Enter') { makeChar(); e.preventDefault(); } else if (e.code === 'Escape') closeNew(); e.stopImmediatePropagation(); return; }
        const H = D().HEROES.length;
        if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') swapNew((newHero + (e.code === 'ArrowRight' ? 1 : H - 1)) % H);
        else if (e.code === 'Enter') makeChar(); else if (e.code === 'Escape') closeNew(); else return;
        e.preventDefault(); e.stopImmediatePropagation(); return;
      }
      if ($('#invOv') && !$('#invOv').hidden) return;
      if (!r.hidden) {
        if (e.code === 'KeyI') return; // equip.js opens the inventory
        if (e.code === 'Escape') show('mode');
        else if (e.code === 'Enter') { if (curChar) go(); else openNew(); }
        else if (e.code === 'ArrowDown' || e.code === 'ArrowUp') { if (curChar) { const n = D().STAGES.length; let i = sel; for (let k = 0; k < n; k++) { i = (i + (e.code === 'ArrowDown' ? 1 : n - 1)) % n; if (stageOpen(prog(), i)) break; } setStage(i); } }
        else if (/^Digit[123]$/.test(e.code)) { if (curChar) setDiff(+e.code.slice(5) - 1); }
        else if (e.code === 'Tab') { const l = chars(); if (l.length > 1) { const i = l.findIndex((c) => curChar && c.id === curChar.id); selectChar(l[(i + (e.shiftKey ? l.length - 1 : 1)) % l.length].id); } }
        else return;
        e.preventDefault(); e.stopImmediatePropagation(); return;
      }
      if (!m.hidden) {
        if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') { modeFocus = e.code === 'ArrowLeft' ? 0 : 1; renderMode(); sfx('uiPick', 0.3); }
        else if (e.code === 'Enter' || e.code === 'Space') pickMode(modeFocus ? 'rpg' : 'farm');
        else if (e.code === 'Digit1') pickMode('farm'); else if (e.code === 'Digit2') pickMode('rpg');
        e.preventDefault(); e.stopImmediatePropagation();
      }
    }, true);
    // every return to the title lands on the mode select, or back on the RPG hub after a stage run
    new MutationObserver(() => {
      if (title.hidden) return;
      const G = window.GAME && GAME.G;
      show(G && G.runOpts && G.runOpts.stage != null && mode === 'rpg' ? 'rpg' : mode === 'farm' ? null : 'mode');
    }).observe(title, { attributes: true, attributeFilter: ['hidden'] });
    show('mode');
  }
  window.STAGE_UI = { init, show, confirm: confirmBox, gearIl, reqIl,
    cur: () => (!$('#rpgOv').hidden && curChar ? curChar.id : null),
    refresh: () => { if (!$('#rpgOv').hidden) renderRpg(); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
