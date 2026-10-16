// DOM HUD in the original game's style (NGUI sprites from js/ui_assets.js as --s-<key> CSS variables).
(function () {
  const $ = (s) => document.querySelector(s);
  const { RANKS, HEROES, GUNS, ITEMS, FLOORS, BOSSES } = DATA;
  const el = {};
  // loading tips: functions, so the keys shown follow the player's bindings
  const TIPS = [
    () => '회피 구르기 중에는 적탄에 맞지 않습니다. 탄막 사이를 구르며 빠져나가세요.',
    () => `보조 스킬(${K('skill2')})은 쿨타임만 차면 언제든 쓸 수 있습니다. 머리 위 링이 다 차면 준비 완료.`,
    () => '보물 상자는 열쇠가 필요합니다. 엘리트 철충은 열쇠를 자주 떨어뜨립니다.',
    () => '붉은 드럼통은 폭발합니다. 적을 유인해 터뜨리세요.',
    () => '마우스(모바일은 조준 패드)로 조준합니다. 설정에서 자동 조준 보조를 켤 수 있습니다.',
    () => '부품으로 상점에서 라비아타에게 물자를 구매할 수 있습니다.',
    () => `무기는 ${K('swap')} 키 · 숫자 키 · 휠로 교체합니다. 기본 무기는 탄약이 무한합니다.`,
    () => '궁극기 게이지는 적에게 피해를 줄수록 차오릅니다.',
    () => '작전에 성공하면 타이틀에서 「위험 등급」을 올려 더 큰 보상에 도전할 수 있습니다.',
  ];
  let mapDirty = true, lastHud = {}, selHero = 0;
  // the key currently bound to an action (follows the key-binding screen)
  // (with a gamepad in use, the pad button is shown instead)
  const PADK = { fire: 'RT', dodge: 'LT', skill: 'RB', skill2: 'LB', interact: 'B', reload: 'X', swap: 'Y', map: 'Back', tutSkip: 'Back' };
  const K = (a) => (window.INPUT && INPUT.pad && INPUT.pad.active && !INPUT.mouse.moved && PADK[a] ? PADK[a] : window.INPUT && INPUT.KEY[a] ? INPUT.keyName(INPUT.KEY[a][0]) : '');
  function titleKeys() {
    if (!INPUT.isTouch && $('#titleKeys')) $('#titleKeys').innerHTML = `<kbd>←</kbd><kbd>→</kbd> 대원 선택 · <kbd>Enter</kbd> 출격 · 조준 <kbd>마우스</kbd> · 사격 <kbd>왼쪽 버튼</kbd> · 회피 <kbd>오른쪽 버튼</kbd>/<kbd>${K('dodge')}</kbd> · 이동 <kbd>WASD</kbd> · 보조 스킬 <kbd>${K('skill2')}</kbd> · 궁극기 <kbd>${K('skill')}</kbd>`;
  }
  function keyLabels() { // HUD slot captions follow the bindings too
    const setK = (sel, a) => { const n = document.querySelector(sel); if (n) n.textContent = K(a).toUpperCase(); };
    setK('#abSk2 kbd', 'skill2'); setK('#abUlt kbd', 'skill'); setK('#abDodge kbd', 'dodge'); setK('#skillBox kbd', 'skill'); titleKeys();
    if (window.GAME && GAME.rebuildGuide && GAME.G.lv) GAME.rebuildGuide(); // the floor-painted guide too
  }
  const GOAL = { hits: 12, time: 2100 }; // the result screen's 2nd / 3rd stars (also shown in pause and at deploy)

  function rankImg(r, big) { return `var(--s-${big ? 'rank' : 'rankb'}${Math.min(3, r)})`; }
  function portrait(h) { return `url(${window.IMG[h.img]})`; }

  // ── loading ────────────────────────────────────────────
  function loading(p, text) {
    const L = el.loading || $('#loading');
    if (!L) return;
    if (!L.dataset.init && window.UIA) {
      L.dataset.init = 1;
      const lg = window.UIA.logo, lo = $('#loadLogo');
      lo.style.setProperty('--logo', `url(${lg.u})`);
      lo.style.setProperty('--ar', lg.w / lg.h);
      if (window.IMG) L.querySelector('.lbg').style.backgroundImage = `url(${window.IMG.bg_title})`;
      $('#loadTip').innerHTML = `<b>TIP</b>${TIPS[Math.floor(Math.random() * TIPS.length)]()}`;
    }
    L.hidden = false; L.classList.remove('out');
    const v = Math.round(Math.max(0, Math.min(1, p)) * 100);
    $('#loadBar').style.width = v + '%';
    $('#loadPct').textContent = v + '%';
  }
  function loaded() {
    const L = $('#loading');
    L.classList.add('out');
    setTimeout(() => { L.hidden = true; L.dataset.init = ''; }, 500);
  }

  // ── init ───────────────────────────────────────────────
  function init() {
    ['hud', 'hearts', 'heroImg', 'heroName', 'heroTitle', 'heroRank', 'keyN', 'goldN', 'skillBox', 'skillImg', 'skillRing', 'skillName', 'skillPct', 'items',
      'floorKey', 'floorName', 'minimap', 'roomInfo', 'timeInfo', 'gunName', 'gunRank', 'magN', 'ammoN', 'magBar', 'reloadBar', 'gunList', 'gunBox',
      'bossBar', 'bossName', 'bossHp', 'bossHpTx', 'bossImg', 'toasts', 'banner', 'announce', 'prompt', 'skillCut', 'bossIntro', 'fade', 'numLayer', 'hurtFx',
      'touch', 'pauseOv', 'title', 'result', 'heroSel', 'heroInfo', 'bestRec', 'bigMap', 'bigMapCv'].forEach((k) => { el[k] = document.getElementById(k); });
    document.documentElement.style.setProperty('--dmg', `url(${UIA.dmg.u})`);
    document.documentElement.style.setProperty('--dmgc', `url(${UIA.dmgc.u})`);
    el.nums = [];
    for (let i = 0; i < (GAME.MOBILE ? 10 : 14); i++) { // a small pool: at most this many numbers on screen at once
      const d = document.createElement('div');
      d.className = 'dmg'; d.digits = [];
      for (let k = 0; k < 6; k++) { const sp = document.createElement('span'); d.appendChild(sp); d.digits.push(sp); }
      el.numLayer.appendChild(d); el.nums.push(d);
    }
    const lg = UIA.logo, li = $('#logoImg');
    li.style.setProperty('--logo', `url(${lg.u})`); li.style.setProperty('--ar', lg.w / lg.h);
    $('#titleBg').style.backgroundImage = `url(${IMG.bg_title})`;
    // title
    el.heroSel.innerHTML = '<button class="hcard rand" data-i="-1" style="--c:#d8dee8"><i></i><b>무작위</b><small>해금 대원 중 랜덤</small></button>' + HEROES.map((h, i) => `<button class="hcard" data-i="${i}" style="--c:${h.color}"><i style="background-image:${portrait(h)}"></i><b>${h.name}</b><small>${h.title}</small></button>`).join('');
    el.heroSel.querySelectorAll('.hcard').forEach((b) => {
      b.onclick = () => { if (selHero === +b.dataset.i) start(); else selectHero(+b.dataset.i); };
    });
    $('#btnStart').onclick = start;
    // title settings: the pause menu's option panel on its own (volume, keys, accessibility, touch layout)
    $('#btnSet').onclick = () => openSettings(true);
    el.pauseOv.querySelectorAll('.ptabs [data-tab]').forEach((b) => { b.onclick = () => { pauseTab(b.dataset.tab); SFX.play('uiPick', 0.5); }; });
    $('#btnSetClose').onclick = () => openSettings(false);
    // replay basic training: clear the done flag and deploy (the training runs in the first room again)
    $('#btnTut').onclick = () => { try { localStorage.removeItem('lao_rogue_tut'); } catch (e) { /* ignore */ } start(); };
    $('#btnHeat').onclick = () => { const h = heatState(); if (h.max < 1) { SFX.play('fail', 0.4); toast('위험 등급 — 작전에 한 번 성공하면 개방됩니다 (등급마다 적 강화 · 데이터 칩 +25%)', 'warn'); return; } h.sel = ((h.sel || 0) + 1) % ((h.max || 0) + 1); saveHeat(h); renderHeat(); SFX.play('uiPick', 0.6); };
    $('#btnLab').onclick = () => openLab(true);
    $('#labClose').onclick = () => openLab(false);
    $('#btnRetry').onclick = () => { el.result.hidden = true; GAME.startRun(pickHero()); };
    $('#btnHome').onclick = () => { el.result.hidden = true; GAME.toTitle(); };
    $('#btnResume').onclick = () => togglePause(false);
    // abort asks twice: the first press arms the button for 3 s
    const ab = $('#btnAbort');
    let abortArm = 0;
    const disarm = () => { abortArm = 0; ab.classList.remove('arm'); ab.textContent = '작전 포기'; };
    ab.onclick = () => {
      if (performance.now() - abortArm > 3000) { abortArm = performance.now(); ab.classList.add('arm'); ab.textContent = '정말 포기합니까? 한 번 더'; SFX.play('warning', 0.5); setTimeout(() => { if (abortArm && performance.now() - abortArm >= 2990) disarm(); }, 3000); return; }
      disarm(); togglePause(false); if (!(GAME.G.P && GAME.G.P.dead)) GAME.G.stats.cause = '작전 포기'; GAME.endRun(false);
    };
    el.disarmAbort = disarm;
    // settings
    const G = GAME.G;
    const paint = (r) => r.style.setProperty('--v', (r.value * 100) + '%');
    const slider = (id, k, after) => {
      const r = $(id); if (!r) return;
      let vv = r.parentNode.querySelector('.vv'); if (!vv) { vv = document.createElement('span'); vv.className = 'vv'; r.parentNode.appendChild(vv); }
      const show = () => { vv.textContent = Math.round(r.value * 100) + '%'; };
      r.value = G.opt[k]; SFX.setVolume(k, G.opt[k]); paint(r); show();
      r.oninput = () => { G.opt[k] = +r.value; SFX.setVolume(k, G.opt[k]); paint(r); show(); if (after) after(); };
      r.onchange = () => { GAME.saveOpt(); r.blur(); }; // saved once on release; Esc / Space go back to the game, not the slider
    };
    slider('#volMaster', 'master'); slider('#volBgm', 'bgm'); slider('#volSfx', 'sfx', () => SFX.play('uiPick', 0.6)); slider('#volVoice', 'voice', () => { if (G.P) SFX.voice(G.P.hero.id, 'ActionApprove', 1, true); });
    const tog = (id, k, fx) => {
      const b = $(id); if (!b) return;
      const r = () => { b.classList.toggle('on', !!G.opt[k]); b.setAttribute('aria-pressed', String(!!G.opt[k])); if (fx) fx(G.opt[k]); };
      r(); b.onclick = () => { G.opt[k] = !G.opt[k]; r(); GAME.saveOpt(); SFX.play('uiPick', 0.6); };
    };
    tog('#optShake', 'shake'); tog('#optDmg', 'dmg'); tog('#optAssist', INPUT.isTouch ? 'aimAssistT' : 'aimAssist'); tog('#optLook', 'camLook');
    tog('#optFlash', 'flash', (v) => { FX.state.noFlash = !v; document.body.classList.toggle('noflash', !v); });
    tog('#optHints', 'hints', () => { if (GAME.refreshHints) GAME.refreshHints(); });
    tog('#optToggleFire', 'autoFire', (v) => { INPUT.toggleFire = v; });
    tog('#optCb', 'cbBullets', (v) => { document.body.classList.toggle('cb', !!v); if (GAME.recolorBullets && GAME.G.ebul) { GAME.recolorBullets(); GAME.redraw(); } }); // previewed at once, even on the frozen pause frame
    tog('#optMute', 'muted', (v) => SFX.setMuted(!!v));
    const HUDS = [[0.85, '작게'], [1, '보통'], [1.2, '크게']];
    const hudApply = () => { document.documentElement.style.setProperty('--hudz', G.opt.hudScale); const h = HUDS.find((x) => Math.abs(x[0] - G.opt.hudScale) < 0.01) || HUDS[1]; $('#optHudV').textContent = h[1]; };
    hudApply();
    $('#optHud').onclick = () => { const i = HUDS.findIndex((x) => Math.abs(x[0] - G.opt.hudScale) < 0.01); G.opt.hudScale = HUDS[(i + 1) % HUDS.length][0]; hudApply(); GAME.saveOpt(); SFX.play('uiPick', 0.6); };
    // key bindings: click an action, press the new key (Esc cancels); conflicts swap
    const KNAME = { fire: '사격', dodge: '회피', skill: '궁극기', skill2: '보조 스킬', swap: '무기 교체', interact: '상호작용', reload: '재장전', map: '전술 지도' };
    const kp = $('#keyPanel'), kb = $('#optKeys');
    const renderKeys = () => {
      kp.innerHTML = '<small>클릭한 뒤 새 키를 누르세요 (Esc 취소) · 이동은 WASD/방향키 고정</small>' + INPUT.REMAP.map((a) => `<button data-k="${a}">${KNAME[a]}<kbd>${INPUT.keyName(INPUT.KEY[a][0])}</kbd></button>`).join('') + '<button data-k="__reset" class="rs">기본값</button>';
      kp.querySelectorAll('button').forEach((b) => {
        b.onclick = () => {
          const a = b.dataset.k;
          if (a === '__reset') { INPUT.resetBinds(); renderKeys(); keyLabels(); { const kh = el.pauseOv.querySelector('.keys'); if (kh && !INPUT.isTouch) kh.innerHTML = pauseKeysHtml(); } SFX.play('uiPick', 0.6); return; }
          b.classList.add('wait'); b.querySelector('kbd').textContent = '…';
          INPUT.capture = (code) => {
            const ok = code !== 'Escape' && INPUT.rebind(a, code);
            renderKeys(); keyLabels();
            { const kh = el.pauseOv.querySelector('.keys'); if (kh && !INPUT.isTouch) kh.innerHTML = pauseKeysHtml(); } // the legend below follows at once
            // the warning sits in the panel itself (toasts are hidden behind the pause screen)
            if (code !== 'Escape' && !ok) { SFX.play('fail', 0.5); const m = kp.querySelector('small'); if (m) { m.textContent = `「${INPUT.keyName(code)}」 키는 이동 · 일시 정지 · 무기 슬롯 · 시스템 키라 쓸 수 없습니다`; m.classList.add('warn'); } } else SFX.play('uiPick', 0.6);
          };
        };
      });
    };
    kb.onclick = () => { kp.hidden = !kp.hidden; if (kp.hidden) INPUT.capture = null; /* closing the panel cancels a pending capture */ kb.setAttribute('aria-expanded', String(!kp.hidden)); kb.classList.toggle('on', !kp.hidden); if (!kp.hidden) renderKeys(); };
    if (INPUT.isTouch) kb.hidden = true;
    // touch layout: button size, opacity, left-handed mirror
    const TBS = [[0, '작게', 0.85], [0.5, '보통', 1], [1, '크게', 1.18]], TBA = [[1, '0%'], [0.75, '25%'], [0.5, '50%']];
    const touchApply = () => {
      const s = TBS.find((x) => Math.abs(x[0] - G.opt.tbSize) < 0.01) || TBS[1], a = TBA.find((x) => Math.abs(x[0] - G.opt.tbAlpha) < 0.01) || TBA[0];
      document.documentElement.style.setProperty('--tbz', s[2]); document.documentElement.style.setProperty('--tbo', a[0]);
      $('#optTbSizeV').textContent = s[1]; $('#optTbAlphaV').textContent = a[1];
    };
    touchApply();
    $('#optTbSize').onclick = () => { const i = TBS.findIndex((x) => Math.abs(x[0] - G.opt.tbSize) < 0.01); G.opt.tbSize = TBS[(i + 1) % TBS.length][0]; touchApply(); GAME.saveOpt(); SFX.play('uiPick', 0.6); };
    $('#optTbAlpha').onclick = () => { const i = TBA.findIndex((x) => Math.abs(x[0] - G.opt.tbAlpha) < 0.01); G.opt.tbAlpha = TBA[(i + 1) % TBA.length][0]; touchApply(); GAME.saveOpt(); SFX.play('uiPick', 0.6); };
    tog('#optLefty', 'lefty', (v) => document.body.classList.toggle('lefty', !!v));
    { const lb = $('#optLayout'); if (lb) lb.onclick = () => { if (window.LAYOUT) { SFX.play('uiPick', 0.6); LAYOUT.edit(true); } }; } // drag / resize the touch controls and HUD panels
    const fsB = $('#optFull');
    if (!document.documentElement.requestFullscreen) fsB.hidden = true;
    fsB.onclick = () => { try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); } catch (e) { /* not allowed */ } };
    document.addEventListener('fullscreenchange', () => fsB.classList.toggle('on', !!document.fullscreenElement));
    if (INPUT.isTouch) { /* phones: the minimap itself opens the tactical map (no separate map button) */ const mb = $('#mapBox'); if (mb) { mb.setAttribute('role', 'button'); mb.setAttribute('aria-label', '전술 지도 열기'); mb.addEventListener('click', () => { const G = GAME.G; if (G.phase === 'play' && !G.paused && !G.choosing && !G.transit && el.bigMap.hidden) INPUT.push('map'); }); } }
    if (INPUT.isTouch) { el.touch.hidden = false; INPUT.bindTouch(el.touch); document.body.classList.add('touchui'); $('#titleKeys').innerHTML = '대원 카드를 두 번 누르면 출격 · 왼쪽 화면 드래그로 이동 · 오른쪽 조준 패드를 누른 채 드래그해 조준·사격'; }
    // keyboard on the title / result screens
    window.addEventListener('keydown', (e) => {
      const ph = GAME.G.phase;
      if (e.repeat && (ph === 'title' || ph === 'dead' || ph === 'win')) return; // a key held through death never auto-retries / auto-deploys
      // modal focus trap: Tab cycles inside the pause / settings dialog
      const labO = document.getElementById('labOv');
      const modal = el.pauseOv && !el.pauseOv.hidden ? el.pauseOv : !document.getElementById('lvOv').hidden ? document.getElementById('lvOv') : labO && !labO.hidden ? labO : !el.result.hidden ? el.result : null; /* lab and result screens trap Tab too */
      if (e.code === 'Tab' && modal) {
        const f = [...modal.querySelectorAll('button, input[type=range], summary')].filter((x) => x.offsetParent && !x.disabled);
        if (f.length) { const i = f.indexOf(document.activeElement), n = e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i < 0 || i >= f.length - 1 ? 0 : i + 1); f[n].focus(); e.preventDefault(); return; }
      }
      if (settingsOpen()) { if (e.code === 'Escape' || e.code === 'KeyO') { openSettings(false); e.preventDefault(); } return; }
      if (ph === 'title' && !el.title.hidden && e.code === 'KeyO') { openSettings(true); e.preventDefault(); return; }
      if (ph === 'title' && !el.title.hidden && e.code === 'KeyH') { $('#btnHeat').click(); e.preventDefault(); return; }
      if (ph === 'title' && !el.title.hidden && !$('#labOv').hidden) { if (e.code === 'Escape' || e.code === 'KeyU') { openLab(false); e.preventDefault(); } return; }
      if (ph === 'title' && !el.title.hidden && e.code === 'KeyU') { openLab(true); e.preventDefault(); return; }
      if (ph === 'title' && !el.title.hidden) {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') { selectHero((selHero + 1 + HEROES.length) % (HEROES.length + 1) - 1); e.preventDefault(); }
        else if (e.code === 'ArrowRight' || e.code === 'KeyD') { selectHero((selHero + 2) % (HEROES.length + 1) - 1); e.preventDefault(); }
        else if (e.code === 'Enter' || e.code === 'Space' || INPUT.KEY.fire.includes(e.code)) { start(); e.preventDefault(); } // the fire binding deploys too
      } else if ((ph === 'dead' || ph === 'win') && !el.result.hidden && el.result.classList.contains('ready')) {
        if (e.code === 'Enter' || e.code === 'Space' || INPUT.KEY.fire.includes(e.code)) { $('#btnRetry').click(); e.preventDefault(); }
        else if (e.code === 'Escape') { $('#btnHome').click(); }
      } // (no single-key abort: it fired invisibly under the level-up cards)
    });
  }

  // the control legend under the pause / settings panel (follows the key bindings)
  function pauseKeysHtml() {
    /* a two-column legend that wraps inside the dialog at any width */
    const rows = [['계속', '<kbd>Esc</kbd>'], ['조준 · 사격', `<kbd>마우스</kbd> · <kbd>왼쪽 버튼</kbd>/<kbd>${K('fire')}</kbd>`], ['회피', `<kbd>오른쪽 버튼</kbd> / ${INPUT.KEY.dodge.slice(0, 3).map((c) => `<kbd>${INPUT.keyName(c)}</kbd>`).join(' ')}`], ['이동', '<kbd>WASD</kbd> / 방향키'],
      ['보조 스킬 · 궁극기', `<kbd>${K('skill2')}</kbd> · <kbd>${K('skill')}</kbd>`], ['무기 교체', `<kbd>1</kbd>~<kbd>9</kbd> / <kbd>${K('swap')}</kbd> / 휠(위·아래)`], ['재장전', `<kbd>${K('reload')}</kbd>`], ['상호작용 · 버리기', `<kbd>${K('interact')}</kbd>`], ['지도', `<kbd>${K('map')}</kbd> / <kbd>Tab</kbd>`]];
    const pad = [['이동 · 조준', '왼쪽 / 오른쪽 스틱'], ['사격 · 회피', '<kbd>RT</kbd> · <kbd>LT</kbd>/<kbd>A</kbd>'], ['궁극기 · 보조', '<kbd>RB</kbd> · <kbd>LB</kbd>'], ['상호작용 · 재장전 · 교체', '<kbd>B</kbd> · <kbd>X</kbd> · <kbd>Y</kbd>'], ['지도 · 메뉴', '<kbd>Back</kbd> · 십자키 + <kbd>A</kbd>']];
    const g = (list) => list.map(([a, b]) => `<span class="kl">${a}</span><span class="kv">${b}</span>`).join('');
    return `<div class="kgrid"><b class="kh">키보드 · 마우스</b>${g(rows)}<b class="kh">게임패드</b>${g(pad)}</div>`;
  }  // pause / settings dialog tabs: 작전 상황 (run, goals, codex) · 옵션 (audio, toggles) · 조작법 (legend + key binding)
  function pauseTab(t) {
    const dlg = el.pauseOv.querySelector('.dlg');
    dlg.dataset.tab = t;
    el.pauseOv.querySelectorAll('.ptabs [data-tab]').forEach((b) => { const on = b.dataset.tab === t; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
    if (t === 'keys') { const kp = $('#keyPanel'); if (kp && kp.hidden && !INPUT.isTouch) $('#optKeys').click(); }
    dlg.scrollTop = 0;
  }
  function openSettings(on) {
    const ov = el.pauseOv;
    // on the title the panel must sit above the title overlay (another stacking context): lift it to <body> while open
    if (on && ov.parentNode !== document.body) { ov._home = ov.parentNode; ov._next = ov.nextSibling; document.body.appendChild(ov); }
    else if (!on && ov._home) { ov._home.insertBefore(ov, ov._next || null); ov._home = null; }
    ov.classList.toggle('settings', on);
    { const h = ov.querySelector('h4'); if (h) h.textContent = on ? '설정' : '작전 일시 정지'; }
    ov.hidden = !on;
    if (on) {
      pauseTab('opt');
      const kh = ov.querySelector('.keys'); if (kh && !INPUT.isTouch) kh.innerHTML = pauseKeysHtml().replace('<span class="kl">계속</span>', '<span class="kl">닫기</span>');
      SFX.play('uiPick', 0.6);
      setTimeout(() => { const b = $('#btnSetClose'); if (b && !ov.hidden) b.focus({ preventScroll: true }); }, 30);
    } else { INPUT.capture = null; if (document.activeElement && ov.contains(document.activeElement)) document.activeElement.blur(); }
  }
  const settingsOpen = () => !!el.pauseOv && !el.pauseOv.hidden && el.pauseOv.classList.contains('settings');
  // ── risk level (unlocked by clearing): harder enemies, more data chips ──
  function heatState() { try { let h = JSON.parse(localStorage.getItem('lao_rogue_heat') || '{}'); if (!h || typeof h !== 'object') h = {}; h.max = Math.max(0, Math.min(5, +h.max || 0)); h.sel = Math.max(0, Math.min(h.max, +h.sel || 0)); return h; } catch (e) { return { max: 0, sel: 0 }; } }
  function saveHeat(h) { try { localStorage.setItem('lao_rogue_heat', JSON.stringify(h)); } catch (e) { /* ignore */ } }
  function heat() { return /[?&](bot|sim)=1/.test(location.search) ? +(new URLSearchParams(location.search).get('heat') || 0) : heatState().sel; }
  function renderHeat() {
    const h = heatState(), b = $('#btnHeat');
    if (!b) return;
    // before the first clear it shows as a locked teaser, so new players know the mode exists
    b.hidden = false;
    b.classList.toggle('locked', h.max < 1);
    $('#heatN').textContent = h.max < 1 ? '🔒' : h.sel;
    b.classList.toggle('hot', h.sel > 0);
  }
  // ── title ──────────────────────────────────────────────
  function bests() {
    // sanitised: whole-number counters, a known depth label (a damaged save never concatenates or blocks records)
    let b = {}; try { b = JSON.parse(localStorage.getItem('lao_rogue_best') || '{}'); } catch (e) { b = {}; }
    if (!b || typeof b !== 'object') b = {};
    const n = (v) => Math.max(0, Math.floor(Number(v) || 0));
    return { kills: n(b.kills), clears: n(b.clears), best: typeof b.best === 'string' && b.best.length < 20 ? b.best : '' };
  }
  // first-deploy coach panel (top centre): "step n/m · what to do"
  function coach(html, n, total, skippable) {
    const c = document.getElementById('coach');
    if (!c) return;
    if (!html) { c.hidden = true; return; }
    const pips = Array.from({ length: total }, (_, i) => `<i class="${i < n - 1 ? 'ok' : i === n - 1 ? 'cur' : ''}"></i>`).join('');
    c.innerHTML = `<small>기본 훈련 ${n}/${total} <span class="pips">${pips}</span></small><div>${html}</div>` +
      (skippable ? `<button class="tskip" type="button">건너뛰기${INPUT.isTouch ? '' : ` <kbd>${K('tutSkip')}</kbd>`}</button>` : ''); // Backspace, or Back on a pad
    const sb = c.querySelector('.tskip');
    if (sb) sb.onclick = (ev) => { ev.stopPropagation(); INPUT.push('tutSkip'); };
    c.hidden = false;
    c.classList.remove('on'); void c.offsetWidth; c.classList.add('on');
  }
  function closeOverlays() {
    coach(null);
    chTimer(null); // the challenge countdown never outlives its run
    if (el.bossIntro) el.bossIntro.hidden = true;
    document.body.classList.remove('choosing', 'fighting');
    if (!el.bigMap) return; // before init
    // damage numbers in flight jump to their (transparent) end frame instead of freezing over the result screen
    if (el.nums) el.nums.forEach((d) => { if (d.anim) { try { d.anim.finish(); } catch (e) { /* ignore */ } } d.busy = false; });
    if (!el.bigMap.hidden) el.bigMap.hidden = true;
    const lv = document.getElementById('lvOv'); if (lv) { lv.hidden = true; lv.classList.remove('on'); }
    el.pauseOv.hidden = true; GAME.G.pauseMenu = false;
    if (el.disarmAbort) el.disarmAbort();
  }
  function title() {
    closeOverlays();
    el.hud.hidden = true; el.bossBar.hidden = true; el.result.hidden = true;
    el.title.hidden = false;
    document.body.classList.remove('playing', 'lowhp', 'paused');
    renderLab();
    renderHeat();
    titleKeys();
    // the last pick is saved by id ('random' for the random card), so adding heroes never shifts it
    try { const v = localStorage.getItem('lao_rogue_hero'); selHero = v === 'random' ? -1 : Math.max(0, HEROES.findIndex((h) => h.id === v)); } catch (e) { selHero = 0; }
    if (selHero >= 0 && !unlocked(HEROES[selHero])) selHero = 0;
    selectHero(selHero, true);
    const b = bests();
    const parts = [];
    if (b.clears) parts.push(`작전 성공 <b>${b.clears}</b>회`);
    if (b.best) parts.push(`최고 도달 <b>${b.best}</b>`);
    if (b.kills) parts.push(`누적 처치 <b>${b.kills}</b>`);
    el.bestRec.innerHTML = parts.length ? parts.join(' · ') : '첫 출격을 기다리고 있습니다, 사령관님.';
  }
  function unlocked(h) {
    const u = DATA.UNLOCK[h.id];
    if (!u || /[?&]unlock=1/.test(location.search)) return true;
    try { const pr = JSON.parse(localStorage.getItem('lao_rogue_prog') || '{}'); return (pr && typeof pr === 'object' ? Number(pr.maxFi) || 0 : 0) >= u.floor; } catch (e) { return false; }
  }
  // the random card: any unlocked hero, decided when the run starts
  function pickHero() {
    if (selHero >= 0) return selHero;
    const pool = HEROES.map((h, i) => i).filter((i) => unlocked(HEROES[i]));
    const i = pool[Math.floor(Math.random() * pool.length)] || 0;
    toast(`무작위 출격 — ${HEROES[i].name}`, 'gem');
    return i;
  }
  // the info panel under the cards keeps one height: the tallest of every hero's (and the random card's) text
  function infoHtml(i) {
    if (i < 0) {
      const n = HEROES.filter(unlocked).length;
      return `<div class="hi-l"><div class="hi-name" style="--c:#d8dee8"><b>무작위 출격</b><small>RANDOM DEPLOY</small></div><p>해금된 대원 ${n}명 중 한 명이 무작위로 출격합니다. 누가 나올지는 출격하는 순간 결정됩니다.</p></div>
        <div class="hi-r"><div class="hi-row"><span class="sk2i" style="background-image:var(--s-i_random)"></span><div><small>후보</small><b>${HEROES.filter(unlocked).map((h) => h.name).join(' · ')}</b><em>각 대원의 기본 무기와 스킬로 시작</em></div></div>
        <div class="hi-cands">${HEROES.filter(unlocked).map((h) => `<i style="background-image:${portrait(h)};--c:${h.color}" title="${h.name}"></i>`).join('')}</div></div>`;
    }
    const h = HEROES[i], g = GUNS[h.gun];
    const bar = (n) => '<i class="on"></i>'.repeat(n) + '<i></i>'.repeat(5 - n);
    return `<div class="hi-l"><div class="hi-name" style="--c:${h.color}"><b>${h.name}</b><small>${h.title}</small></div><p>${h.desc}</p>
      <div class="hi-st"><span>화력</span><em>${bar(h.stats.atk)}</em><span>내구</span><em>${bar(h.stats.def)}</em><span>기동</span><em>${bar(h.stats.mob)}</em></div></div>
      <div class="hi-r"><div class="hi-row"><span class="rk" style="background-image:${rankImg(g.rank)}"></span><div><small>기본 무기 · 탄약 무한</small><b>${g.name}</b><em>${g.desc}</em></div></div>
      <div class="hi-row"><span class="skh"></span><div><small>궁극기${INPUT.isTouch ? '' : ` (${K('skill')})`} · 피해를 주면 충전</small><b>${h.skillName}</b><em>${h.skillDesc}</em></div></div>
      <div class="hi-row"><span class="sk2i" style="background-image:var(--s-${h.sk2.icon})"></span><div><small>보조 스킬${INPUT.isTouch ? '' : ` (${K('skill2')})`} · 쿨타임 ${h.sk2.cd}초</small><b>${h.sk2.name}</b><em>${h.sk2.desc}</em></div></div>
      <div class="hi-row"><span class="hpi"></span><div><small>체력 · 방어막</small><b>체력 ${h.hp * 25}${h.armor ? ` + 방어막 ${h.armor}회` : ''}</b><em>이동 속도 ${h.speed.toFixed(1)}</em></div></div></div>`;
  }
  let infoW = -1;
  function lockInfoHeight() {
    const w = el.heroInfo.clientWidth;
    // a layout that hides the info panel (phones) must not keep its locked height as a blank gap
    if (getComputedStyle(el.heroInfo).display === 'none' || !w) { el.heroInfo.style.minHeight = ''; infoW = -1; return; }
    if (w === infoW) return;
    infoW = w;
    const cur = el.heroInfo.innerHTML;
    el.heroInfo.style.minHeight = '';
    let m = 0;
    for (let k = -1; k < HEROES.length; k++) { el.heroInfo.innerHTML = infoHtml(k); m = Math.max(m, el.heroInfo.offsetHeight); }
    el.heroInfo.innerHTML = cur;
    el.heroInfo.style.minHeight = m + 'px';
  }
  const relock = () => { infoW = -1; if (el.title && el.heroInfo && !el.title.hidden) lockInfoHeight(); };
  window.addEventListener('resize', relock);
  if (document.fonts) document.fonts.ready.then(relock);
  // the name plate under the showcase platform (LO unit-card style)
  function plate(h) {
    const p = document.getElementById('showPlate');
    if (!p) return;
    if (!h) { p.innerHTML = '<div class="sp-in" style="--c:#d8dee8"><small>RANDOM DEPLOY</small><b>무작위 출격</b><em>출격 순간 대원이 결정됩니다</em></div>'; }
    else {
      const g = GUNS[h.gun], code = (h.name.match(/^[A-Z0-9-]+/) || [''])[0], nm = h.name.replace(/^[A-Z0-9-]+\s*/, '');
      p.innerHTML = `<div class="sp-in" style="--c:${h.color}"><small>${code ? code + ' · ' : ''}${h.id.toUpperCase()}</small><b>${nm}</b><em>${h.title}</em>
        <div class="sp-row"><span class="rk" style="background-image:${rankImg(g.rank)}"></span>${g.name}<i></i>${h.skillName}</div></div>`;
    }
    p.classList.remove('on'); void p.offsetWidth; p.classList.add('on');
  }
  /* short screens hide the full hero panel: a one-line kit summary stands in for it */
  function heroMini(h) {
    let m = document.getElementById('heroMini');
    if (!m) { m = document.createElement('div'); m.id = 'heroMini'; el.heroInfo.parentNode.insertBefore(m, el.heroInfo); }
    m.innerHTML = h ? `<b>${h.name}</b> · 무기 ${GUNS[h.gun].name} · 보조 ${h.sk2.name} · 궁극기 ${h.skillName}` : '<b>무작위 대원</b> · 출격 시 해금된 대원 중 한 명';
  }
  function selectHero(i, quiet) {
    selHero = i;
    const cards = el.heroSel.querySelectorAll('.hcard');
    if (i < 0) {
      $('#btnStart').disabled = false; $('#btnStart').textContent = '출격 개시';
      cards.forEach((b) => { const k = +b.dataset.i; b.classList.toggle('on', k === -1); if (k < 0) return; b.classList.toggle('locked', !unlocked(HEROES[k])); b.dataset.lock = !unlocked(HEROES[k]) ? DATA.UNLOCK[HEROES[k].id].text : ''; });
      el.heroInfo.innerHTML = infoHtml(-1);
      lockInfoHeight();
      heroMini(null);
      if (!quiet) SFX.play('uiPick', 0.6);
      try { localStorage.setItem('lao_rogue_hero', 'random'); } catch (e) { /* ignore */ }
      plate(null);
      if (GAME.showcase) GAME.showcase(-1);
      return;
    }
    const lockedH = !unlocked(HEROES[i]);
    $('#btnStart').disabled = lockedH;
    $('#btnStart').textContent = lockedH ? `잠김 — ${DATA.UNLOCK[HEROES[i].id].text}` : '출격 개시';
    cards.forEach((b) => { const k = +b.dataset.i; b.classList.toggle('on', k === i); if (k < 0) return; b.classList.toggle('locked', !unlocked(HEROES[k])); b.dataset.lock = !unlocked(HEROES[k]) ? DATA.UNLOCK[HEROES[k].id].text : ''; });
    el.heroInfo.innerHTML = infoHtml(i);
    lockInfoHeight();
    heroMini(HEROES[i]);
    plate(HEROES[i]);
    if (!quiet) { SFX.play('uiPick', 0.6); SFX.voice(HEROES[i].id, 'SortiePick', 1, true); }
    try { localStorage.setItem('lao_rogue_hero', HEROES[i].id); } catch (e) { /* ignore */ }
    if (GAME.showcase) GAME.showcase(i);
  }
  // research lab (permanent upgrades)
  function meta() {
    try {
      const m = JSON.parse(localStorage.getItem('lao_rogue_meta') || '{}');
      if (!m || typeof m !== 'object') return { lv: {}, chips: 0 };
      if (!m.lv || typeof m.lv !== 'object') m.lv = {};
      Object.keys(m.lv).forEach((k) => { m.lv[k] = Math.max(0, Math.floor(Number(m.lv[k]) || 0)); });
      m.chips = Math.max(0, Math.floor(Number(m.chips) || 0)); // a string / null chip count is repaired, never concatenated
      return m;
    } catch (e) { return { lv: {}, chips: 0 }; }
  }
  function renderLab() {
    const m = meta();
    $('#labChips').textContent = m.chips;
    const lu = $('#labUnlock');
    if (lu) lu.innerHTML = '<small>대원 해금</small>' + HEROES.filter((h) => DATA.UNLOCK[h.id]).map((h) => `<span class="${unlocked(h) ? 'ok' : ''}"><i style="background-image:${portrait(h)}"></i><b>${h.name}</b><em>${unlocked(h) ? '해금 완료' : DATA.UNLOCK[h.id].text}</em></span>`).join('');
    $('#chipN').textContent = m.chips ? `칩 ${m.chips}` : '';
    $('#labCards').innerHTML = DATA.META.map((u) => {
      const l = m.lv[u.id] || 0, maxed = l >= u.max, cost = maxed ? 0 : u.cost[l];
      return `<button class="card lab${maxed ? ' max' : ''}" data-u="${u.id}" style="--c:${maxed ? '#ff9420' : '#ffcc00'}" ${!maxed && m.chips < cost ? 'disabled' : ''}>
        <span class="rk" style="background-image:var(--s-${u.icon})"></span><b>${u.name}</b>
        <span class="lv">Lv.${l}<small>/${u.max}</small></span><span class="eff">${l ? u.desc(l) : '미연구'}${maxed ? '' : ` → ${u.desc(l + 1)}`}</span>
        <span class="cost">${maxed ? '연구 완료' : `칩 ${cost}`}</span></button>`;
    }).join('');
    $('#labCards').querySelectorAll('[data-u]').forEach((b) => {
      b.onclick = () => {
        const mm = meta(), u = DATA.META.find((x) => x.id === b.dataset.u), l = mm.lv[u.id] || 0;
        if (l >= u.max || mm.chips < u.cost[l]) { SFX.play('fail', 0.5); return; }
        mm.chips -= u.cost[l]; mm.lv[u.id] = l + 1;
        try { localStorage.setItem('lao_rogue_meta', JSON.stringify(mm)); } catch (e) { /* ignore */ }
        SFX.play('reinforce'); renderLab();
      };
    });
  }
  let labReturn = null;
  function openLab(on) {
    $('#labOv').hidden = !on;
    if (on) { labReturn = document.activeElement; renderLab(); SFX.play('uiPick', 0.6); setTimeout(() => { const f = $('#labOv').querySelector('button:not([disabled])'); if (f) f.focus({ preventScroll: true }); }, 30); } /* focus moves into the lab ... */
    else if (labReturn && labReturn.focus) { labReturn.focus({ preventScroll: true }); labReturn = null; } /* ... and back to where it came from */
  }
  function titleTick() { /* the showcase rig is animated by the game loop */ }
  function start() {
    if (GAME.G.phase !== 'title') return;
    if (selHero >= 0 && !unlocked(HEROES[selHero])) { SFX.play('fail', 0.6); toast(`${HEROES[selHero].name}: ${DATA.UNLOCK[HEROES[selHero].id].text}`, 'warn'); return; }
    SFX.play('start');
    el.title.hidden = true;
    GAME.startRun(pickHero());
  }
  function startRun() {
    if (settingsOpen()) openSettings(false); /* a run never starts under the title settings panel */
    if (window.LAYOUT) setTimeout(() => LAYOUT.apply(), 0); // the player's own touch layout (once the HUD is visible)
    if (INPUT.mouse) INPUT.mouse.seen = false;
    el.hud.hidden = false;
    el.result.hidden = true;
    closeOverlays();
    el.announce.hidden = false; el.announce.innerHTML = '';
    clearToasts();
    INPUT.toggleFire = GAME.G.opt.autoFire;
    document.body.classList.add('playing');
    const G = GAME.G, P = G.P, h = P.hero;
    el.heroImg.style.backgroundImage = portrait(h);
    el.heroName.textContent = h.name; el.heroTitle.textContent = h.title;
    el.skillImg.style.backgroundImage = portrait(h);
    el.skillName.textContent = h.skillName;
    // ability bar
    const ab = (id) => document.getElementById(id);
    ab('abSk2').querySelector('.ico').style.setProperty('--ic', `var(--s-${h.sk2.icon})`);
    ab('abSk2').querySelector('.ico').classList.toggle('img', h.sk2.icon === 'i_crit');
    ab('abSk2').querySelector(':scope > small').textContent = h.sk2.name;
    ab('abUlt').querySelector('.ico').style.backgroundImage = portrait(h);
    ab('abUlt').querySelector(':scope > small').textContent = h.skillName;
    ab('abUlt').style.setProperty('--hc', h.color);
    ab('abDodge').querySelector('.ico').style.setProperty('--ic', 'var(--s-ctrl_ff)');
    // touch buttons carry the same icons as the desktop ability bar (skill art, hero portrait for the ultimate)
    { const tb = (s) => document.querySelector('#touch .tb.' + s);
      const ico = (b, bg, mask) => { if (!b) return; let i = b.querySelector('.tic'); if (!i) { i = document.createElement('i'); i.className = 'tic'; b.prepend(i); } i.style.setProperty('--ic', bg); i.classList.toggle('mask', !!mask); };
      ico(tb('sk2'), `var(--s-${h.sk2.icon})`, h.sk2.icon !== 'i_crit'); ico(tb('skill'), portrait(h), false); ico(tb('dodge'), 'var(--s-ctrl_ff)', true);
      const sk = tb('skill'); if (sk) sk.style.setProperty('--hc', h.color); }
    el.heroRank.style.backgroundImage = rankImg(h.id === 'constantia' ? 3 : 1);
    lastHud = {};
    mapDirty = true;
    gunChanged(GAME.curGun());
    // run-start messages are staggered (the first-run coach panel already covers the controls)
    if (!GAME.G.tut) toast(INPUT.isTouch ? '왼쪽 드래그 이동 · 조준 패드 드래그로 조준·사격' : `마우스 조준 · 좌클릭 사격 · 우클릭/${K('dodge')} 회피 · ${K('skill2')} 보조 스킬 · ${K('skill')} 궁극기`, '');
    keyLabels();
    setTimeout(() => { if (GAME.G.phase === 'play' && GAME.G.stats && GAME.G.stats.time < 40 && !GAME.G.tut) toast(`작전 목표 — B6 제압 · 피격 ${GOAL.hits}회 이하 · ${GOAL.time / 60}분 이내 (별 3개)`, 'gem'); }, 6500);
  }

  // ── HUD ────────────────────────────────────────────────
  function set(k, v, fn) { if (lastHud[k] !== v) { lastHud[k] = v; fn(v); } }
  const xh = { el: null };
  function crosshair(G) {
    if (!xh.el) xh.el = document.getElementById('xhair');
    const m = INPUT.mouse, assist = INPUT.isTouch ? G.opt.aimAssistT : G.opt.aimAssist;
    // with the aim assist on, the reticle locks onto the assisted target instead of the (ignored) cursor
    const tg = assist && G.P.target && G.P.target.alive ? G.P.target : null;
    const show = (!INPUT.isTouch || m.used) && !G.paused && !G.P.dead && !overlayUp() && (assist ? !!tg : m.seen && !(INPUT.pad.active && !m.moved));
    if (xh.el.hidden === show) xh.el.hidden = !show;
    if (!show) return;
    let x = m.x, y = m.y;
    if (tg) { const r = GAME.canvasRect(), s = GAME.worldToScreen(tg.x, tg.y + tg.h * 0.42); x = r.left + s[0]; y = r.top + s[1]; }
    xh.el.classList.toggle('lock', !!tg);
    xh.el.style.transform = `translate(${x}px, ${y}px)`;
    xh.el.classList.toggle('fire', m.down);
    xh.el.classList.toggle('rl', G.P.reloadT > 0);
  }
  function hud(G) {
    const P = G.P;
    set('xp', P.lv + ':' + Math.round(P.xp), () => {
      document.getElementById('lvN').textContent = 'Lv.' + P.lv;
      document.getElementById('xpFill').style.transform = `scaleX(${Math.min(1, P.xp / GAME.xpNeed(P.lv))})`;
    });
    crosshair(G);
    // hearts: each heart is a slanted cell (full / half / empty), armor as cyan shields
    set('hearts', P.hp + '/' + P.maxHp + '/' + P.armor, () => {
      let h = '';
      for (let i = 0; i < P.maxHp / 2; i++) {
        const v = P.hp - i * 2;
        h += `<i class="ht ${v >= 2 ? 'f' : v === 1 ? 'h' : 'e'}"></i>`;
      }
      for (let i = 0; i < P.armor; i++) h += '<i class="ar"></i>';
      el.hearts.innerHTML = h;
      el.hearts.classList.toggle('low', P.hp <= 2);
      document.body.classList.toggle('lowhp', P.hp <= 2 && P.armor === 0);
    });
    set('hpn', P.hp + '/' + P.maxHp + '/' + P.armor, () => {
      document.getElementById('hpNum').textContent = P.hp * 25;
      document.getElementById('hpMax').innerHTML = '/ ' + (P.maxHp * 25) + (P.armor ? ` <em class="arm" title="방어막: 피격 1회를 통째로 막습니다">방어막 ×${P.armor}</em>` : ''); /* armour blocks a whole hit, not 25 HP */
      document.getElementById('hpNum').classList.toggle('low', P.hp <= 2);
    });
    const rollTotal = DATA.BAL.rollTime + DATA.BAL.rollCd * P.mods.rollCd;
    const rollLeft = P.roll ? rollTotal - P.roll.t : P.rollCd;
    set('abD', Math.ceil(rollLeft * 20), () => {
      const n = document.getElementById('abDodge');
      n.querySelector('.fg').style.strokeDashoffset = String(276.5 * Math.max(0, rollLeft) / rollTotal);
      n.classList.toggle('cool', rollLeft > 0);
      n.querySelector('.cd').textContent = rollLeft > 0 ? rollLeft.toFixed(1) : '';
      const tb = document.querySelector('#touch .tb.dodge'); if (tb) { tb.style.setProperty('--cd', (Math.max(0, rollLeft) / rollTotal).toFixed(3)); tb.classList.toggle('cool', rollLeft > 0); }
    });
    set('key', P.keys, (v) => { el.keyN.textContent = v; });
    set('gold', P.gold, (v) => { el.goldN.textContent = v; el.goldN.parentNode.classList.remove('pop'); void el.goldN.offsetWidth; el.goldN.parentNode.classList.add('pop'); });
    // ability bar: secondary cooldown sweep, ultimate charge ring / active timer
    const sk2 = P.hero.sk2, cdf = Math.min(1, (P.sk2Cd || 0) / (P.sk2Max || sk2.cd)); // the actual (upgraded) cooldown
    set('ab2', Math.ceil((P.sk2Cd || 0) * 10), () => {
      const n = document.getElementById('abSk2');
      n.querySelector('.fg').style.strokeDashoffset = String(276.5 * cdf);
      n.querySelector('.cd').textContent = P.sk2Cd > 0 ? (P.sk2Cd >= 1 ? Math.ceil(P.sk2Cd) : P.sk2Cd.toFixed(1)) : '';
      n.classList.toggle('cool', P.sk2Cd > 0);
      const tb = document.querySelector('.tb.sk2'); if (tb) { tb.classList.toggle('cool', P.sk2Cd > 0); tb.style.setProperty('--cd', cdf.toFixed(3)); tb.querySelector('.cdv').textContent = P.sk2Cd > 0 ? Math.ceil(P.sk2Cd) : ''; }
    });
    const odMax = P.odMax || 5, act = P.overdrive > 0 ? P.overdrive / odMax : P.blossomT > 0 ? P.blossomT / (P.blossomMax || 3) : P.shieldT > 0 ? -1 : 0;
    set('abU', Math.floor(P.skill) + ':' + Math.ceil(act * 50), () => {
      const n = document.getElementById('abUlt'), v = Math.floor(P.skill);
      n.querySelector('.fg').style.strokeDashoffset = String(282.7 * (1 - (act > 0 ? act : v / 100)));
      n.querySelector('.pct b').textContent = act > 0 ? (P.overdrive > 0 ? P.overdrive : P.blossomT).toFixed(1) : v >= 100 ? '' : v;
      n.querySelector('.pct small').textContent = act > 0 ? 's' : v >= 100 ? '' : '%';
      n.classList.toggle('ready', v >= 100 && !(act > 0));
      n.classList.toggle('active', act > 0);
      n.querySelector('.ulact').textContent = act > 0 ? `${P.hero.skillName} 발동 중` : v >= 100 ? '준비 완료' : '';
      const tb = document.querySelector('.tb.skill'); if (tb) { tb.style.setProperty('--p', (act > 0 ? act : v / 100).toFixed(2)); tb.classList.toggle('ready', v >= 100 && !(act > 0)); tb.classList.toggle('active', act > 0); const sp = tb.querySelector('span'); if (sp) sp.textContent = act > 0 ? '발동' : v >= 100 ? '스킬!' : v + '%'; } // the charge as a number, not just a dim fill
    });
    const sk = Math.floor(P.skill);
    set('skill', sk, (v) => {
      el.skillRing.style.strokeDashoffset = String(300 * (1 - v / 100));
      el.skillPct.textContent = v >= 100 ? 'READY' : v + '%';
      el.skillBox.classList.toggle('ready', v >= 100);
    });
    set('items', P.items.length + ':' + (P.items[P.items.length - 1] || ''), () => { // items only append: count + last id is a cheap change key
      const MAXI = INPUT.isTouch ? 6 : 10, shown = P.items.slice(-MAXI);
      el.items.innerHTML = (P.items.length > MAXI ? `<em>+${P.items.length - MAXI}</em>` : '') + shown.map((id) => { const it = ITEMS.find((x) => x.id === id); return `<i title="${it.name} — ${it.desc}" style="background-image:var(--s-${it.icon});--c:${RANKS[it.rank].color}"></i>`; }).join('');
    });
    // gun
    const g = GAME.curGun();
    const ms = GAME.magSize(g);
    set('mag', g.id + ':' + g.mag + '/' + ms, () => {
      el.magN.textContent = g.mag;
      el.magN.classList.toggle('low', g.mag <= Math.max(1, ms * 0.2));
      const n = Math.min(ms, 30);
      const filled = Math.ceil(g.mag / ms * n);
      // pips are rebuilt only when the magazine size changes; a shot just flips classes
      if (el.magBar.children.length !== n) el.magBar.innerHTML = '<i></i>'.repeat(n);
      for (let i = 0; i < n; i++) { const c = el.magBar.children[i], on = i < filled; if (c.classList.contains('on') !== on) c.classList.toggle('on', on); }
    });
    set('ammo', g.infinite ? '∞' : g.ammo, (v) => { el.ammoN.textContent = v; });
    // touch: the swap button doubles as the weapon chip (name, magazine, reserve); tap = next weapon
    if (INPUT.isTouch) set('chip', g.id + ':' + g.mag + ':' + (g.infinite ? '∞' : g.ammo) + ':' + P.guns.length, () => {
      const b = document.querySelector('#touch .tb.swap'); if (!b) return;
      let c = b.querySelector('.chip'); if (!c) { c = document.createElement('div'); c.className = 'chip'; c.innerHTML = '<em></em><b></b>'; b.appendChild(c); }
      c.querySelector('em').textContent = g.d.name.split(' ')[0];
      c.querySelector('b').innerHTML = `${g.mag}<small>/${g.infinite ? '∞' : g.ammo}</small>`;
      c.style.setProperty('--c', RANKS[g.d.rank].color);
      b.classList.toggle('multi', P.guns.length > 1); b.classList.toggle('low', g.mag <= Math.max(1, ms * 0.2));
    });
    const rl = P.reloadT > 0 ? 1 - P.reloadT / (P.reloadMax || 1) : -1;
    set('reload', rl < 0 ? -1 : Math.round(rl * 40), () => {
      const on = rl >= 0;
      el.reloadBar.classList.toggle('on', on);
      el.reloadBar.parentNode.classList.toggle('rl', on);
      if (!on) return;
      const seg = el.reloadBar.querySelector('.seg');
      if (!seg.children.length) seg.innerHTML = '<i></i>'.repeat(14);
      const k = rl * 14;
      [...seg.children].forEach((c, i) => { c.className = i < Math.floor(k) ? 'on' : i < k ? 'cur' : ''; });
      el.reloadBar.querySelector('b').textContent = (P.reloadT).toFixed(1) + 's';
    });
    set('guns', P.guns.length + ':' + P.gi + ':' + (P.guns[0] ? P.guns[0].id : '') + ':' + (P.guns[P.guns.length - 1] ? P.guns[P.guns.length - 1].id : ''), () => { // no per-frame join
      el.gunList.innerHTML = P.guns.map((x, i) => `<i class="${i === P.gi ? 'on' : ''}" style="--c:${RANKS[x.d.rank].color}">${INPUT.isTouch ? '' : `<u>${i + 1}</u>`}${x.d.name.split(' ')[0]}</i>`).join('') + (P.guns.length > 1 && !INPUT.isTouch ? `<kbd>${K('swap')}</kbd>` : ''); // the swap-key hint is a keyboard hint
    });
    // map / floor
    const F = FLOORS[G.fi];
    set('floor', G.fi, () => { el.floorKey.textContent = F.key; $('#floorName').textContent = F.name; });
    const tm = Math.floor(G.stats.time);
    set('time', tm, () => { el.timeInfo.textContent = `${Math.floor(tm / 60)}:${String(tm % 60).padStart(2, '0')}`; });
    const r = G.room;
    let alive = 0; for (const e of G.enemies) if (e.alive) alive++;
    set('room', r ? (r.active ? 'a' + alive : r.type) : '-', () => { // the label string is built only when it changes
      el.roomInfo.textContent = r ? (r.active && alive ? `교전 중 · 적 ${alive}` : r.active ? '제압 완료' : ROOM_LABEL[r.type]) : '통로';
    });
    set('fighting', !!(r && r.active), (v) => document.body.classList.toggle('fighting', v));
    drawMinimap(G); // (the big map is redrawn on open / drag / zoom only: the game is frozen while it's up)
  }
  const ROOM_LABEL = { start: '출격 지점', combat: '제압 완료', treasure: '보급 창고', shop: '라비아타 상점', boss: '보스 구역' };
  // reload gauge over the hero's head (original-style slanted frame, yellow fill, sweeping light)
  let rg = null, rgOn = false;
  function reloadGauge(f, x, y) {
    if (GAME.G.paused || GAME.G.choosing) f = -1;
    if (!rg) {
      rg = document.createElement('div'); rg.id = 'reloadG';
      rg.innerHTML = '<small>RELOAD</small><div class="rf"><i></i><b></b></div>';
      el.numLayer.parentNode.insertBefore(rg, el.numLayer.nextSibling);
      rg.fill = rg.querySelector('i'); rg.tick = rg.querySelector('b');
    }
    const on = f >= 0;
    if (on !== rgOn) { rgOn = on; rg.classList.toggle('on', on); if (!on) rg.classList.add('done'); else rg.classList.remove('done'); }
    if (!on) return;
    const [sx, sy] = GAME.worldToScreen(x, y);
    rg.style.transform = `translate(${Math.round(sx)}px, ${Math.round(sy)}px) translate(-50%, -100%)`;
    rg.fill.style.transform = `scaleX(${f})`;
    rg.tick.style.left = (f * 100) + '%';
  }
  // reload-needed warning above the head: pops in, hazard stripes, remaining-round pips, faster pulse on the last rounds
  let aw = null, awState = 0, awMag = -1;
  function overlayUp() { const G = GAME.G; return G.paused || !!G.choosing || !el.bigMap.hidden; }
  function ammoWarn(state, x, y, mag) {
    if (overlayUp()) state = 0;
    if (!aw) {
      aw = document.createElement('div'); aw.id = 'ammoW';
      aw.innerHTML = '<div class="aw"><span class="ic">!</span><b></b><kbd></kbd></div><div class="pips"></div>';
      el.numLayer.parentNode.insertBefore(aw, el.numLayer.nextSibling);
      aw.t = aw.querySelector('b'); aw.k = aw.querySelector('kbd'); aw.p = aw.querySelector('.pips');
    }
    if (state !== awState) {
      const prev = awState; awState = state;
      aw.className = ['', 'low', 'low', 'out'][state];
      if (state) {
        aw.t.textContent = state === 3 ? '탄약 없음' : '재장전 필요';
        aw.k.textContent = state === 3 ? (INPUT.isTouch ? '교체' : `교체 1~9 · 버리기 ${K('interact')}`) : (INPUT.isTouch ? '장전' : K('reload'));
        void aw.offsetWidth; aw.classList.add('pop');
        if (!prev) SFX.synth('blip', 0.7);
      }
      awMag = -1;
    }
    if (!state) return;
    if (mag !== awMag && state !== 3) {
      awMag = mag;
      aw.p.innerHTML = '<i></i>'.repeat(Math.min(mag, 8)) + (mag > 8 ? '<em>+</em>' : '');
      if (mag <= 2 && !aw.classList.contains('crit')) SFX.play('click', 0.7);
      aw.classList.toggle('crit', mag <= 2);
    }
    const [sx, sy] = GAME.worldToScreen(x, y);
    aw.style.transform = `translate(${Math.round(sx)}px, ${Math.round(sy)}px) translate(-50%, -100%)`;
  }
  // level-up: three perk cards; 1/2/3, click or tap picks one
  function levelUp(P, perks) {
    const ov = document.getElementById('lvOv');
    document.body.classList.toggle('choosing', !!P);
    if (P) { el.banner.className = 'banner'; el.banner.innerHTML = ''; }
    if (!P) { ov.hidden = true; ov.classList.remove('on'); return; }
    document.getElementById('lvTitle').textContent = 'Lv.' + P.lv;
    { // screen readers hear the level-up and the choices (the cards themselves keep focus off, so a held key never picks one)
      let lr = document.getElementById('srLive');
      if (!lr) { lr = document.createElement('div'); lr.id = 'srLive'; lr.setAttribute('aria-live', 'polite'); lr.className = 'sr-only'; document.body.appendChild(lr); }
      lr.textContent = `레벨 ${P.lv} — 강화 선택: ` + perks.map((p, i) => `${i + 1}번 ${p.name}`).join(', ');
    }
    const cards = document.getElementById('lvCards');
    cards.innerHTML = perks.map((p, i) => {
      const own = !!p.hero, lv = (P.up[p.id] || 0);
      return `<button class="lv-card${own ? ' own' : ''}" data-i="${i}" style="--c:${own ? P.hero.color : '#ffcc00'};--d:${i * 0.07}s">
        <span class="tag">${own ? P.hero.name + ' 전용' : '공통'}</span>
        <span class="ic" style="--ic:var(--s-${p.icon})"></span>
        <b>${p.name}</b><span class="lvp">${'<i class="on"></i>'.repeat(lv)}<i class="nx"></i>${'<i></i>'.repeat(Math.max(0, p.max - lv - 1))}</span>
        <em>${p.desc}</em><kbd>${INPUT.isTouch ? '선택' : i + 1}</kbd></button>`;
    }).join('');
    cards.querySelectorAll('.lv-card').forEach((b) => { b.onclick = () => GAME.choosePerk(+b.dataset.i); });
    ov.hidden = false;
    // (no auto-focus: Space / Enter are dodge / interact, so a focused card would be picked by mashing them — cards answer to 1-4, clicks and Tab)
    ov.classList.remove('on'); void ov.offsetWidth; ov.classList.add('on');
  }
  // a screen-space shockwave at a world point (boss phase changes)
  function shock(x, y, col) {
    const [sx, sy] = GAME.worldToScreen(x, y);
    const d = document.createElement('div'); d.className = 'shockwave';
    d.style.left = sx + 'px'; d.style.top = sy + 'px'; d.style.setProperty('--c', '#' + (col >>> 0).toString(16).padStart(6, '0'));
    el.numLayer.parentNode.appendChild(d);
    setTimeout(() => d.remove(), 900);
  }
  function sk2Used() { const n = document.getElementById('abSk2'); n.classList.remove('fire'); void n.offsetWidth; n.classList.add('fire'); }
  function gunEmpty() { el.gunBox.classList.remove('empty'); void el.gunBox.offsetWidth; el.gunBox.classList.add('empty'); }
  function gunChanged(g) {
    if (!g) return;
    el.gunName.textContent = g.d.name;
    el.gunRank.style.backgroundImage = rankImg(g.d.rank);
    el.gunBox.classList.remove('swap'); void el.gunBox.offsetWidth; el.gunBox.classList.add('swap');
    lastHud.mag = null; lastHud.guns = null;
  }

  // minimap: visited rooms, known neighbours, icons
  const mapView = { z: 1, px: 0, py: 0 };
  function drawMap(cv, G, big) {
    const lv = G.lv;
    if (!lv) return;
    const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    const P = G.P;
    let s = 1.25, ox, oy;
    if (big) {
      const vr = lv.rooms.filter((r) => r.visited || r.known);
      const minx = Math.min(P.x, ...vr.map((r) => r.x0)), maxx = Math.max(P.x, ...vr.map((r) => r.x1)), miny = Math.min(P.y, ...vr.map((r) => r.y0)), maxy = Math.max(P.y, ...vr.map((r) => r.y1));
      // fit what has been explored into the panel (never blown up past a readable scale)
      s = Math.min(W * 0.86 / Math.max(8, maxx - minx), H * 0.82 / Math.max(8, maxy - miny), 16) * mapView.z;
      ox = W / 2 - (minx + maxx) / 2 * s + mapView.px; oy = H / 2 + (miny + maxy) / 2 * s + mapView.py;
      cv._t = { ox, oy, s };
      // tactical grid
      ctx.strokeStyle = 'rgba(255,204,0,0.06)'; ctx.lineWidth = 1;
      const step = 40;
      for (let x = ((ox % step) + step) % step; x < W; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = ((oy % step) + step) % step; y < H; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    } else { ox = W / 2 - P.x * s; oy = H / 2 + P.y * s; }
    const X = (x) => ox + x * s, Y = (y) => oy - y * s;
    // corridors between visible rooms
    ctx.strokeStyle = 'rgba(150,160,170,0.55)'; ctx.lineWidth = Math.max(2, s * 2.2);
    lv.doors.forEach((d) => {
      const a = lv.rooms[d.room], b = lv.rooms[d.other];
      if (!(a.visited || b.visited)) return;
      if (a.id > b.id) return;
      ctx.beginPath(); ctx.moveTo(X(a.cx), Y(a.cy)); ctx.lineTo(X(b.cx), Y(b.cy)); ctx.stroke();
    });
    lv.rooms.forEach((r) => {
      if (!r.visited && !r.known) return;
      const cur = r === G.room;
      ctx.fillStyle = r.visited ? (cur ? 'rgba(255,204,0,0.32)' : 'rgba(200,210,220,0.22)') : 'rgba(90,96,104,0.25)';
      ctx.strokeStyle = cur ? '#ffcc00' : r.visited ? 'rgba(220,230,240,0.75)' : 'rgba(140,150,160,0.5)';
      ctx.lineWidth = cur ? 2 : 1.2;
      { const fs = ctx.fillStyle; ctx.fillStyle = '#14171c'; ctx.fillRect(X(r.x0), Y(r.y1), r.w * s, r.h * s); ctx.fillStyle = fs; }
      ctx.fillRect(X(r.x0), Y(r.y1), r.w * s, r.h * s);
      ctx.strokeRect(X(r.x0) + 0.5, Y(r.y1) + 0.5, r.w * s, r.h * s);
      if (r.active) { ctx.fillStyle = 'rgba(255,40,40,0.25)'; ctx.fillRect(X(r.x0), Y(r.y1), r.w * s, r.h * s); }
      if (big && r === mapSel) { ctx.strokeStyle = '#7fe3ff'; ctx.lineWidth = 4; ctx.strokeRect(X(r.x0) - 3, Y(r.y1) - 3, r.w * s + 6, r.h * s + 6); }
      if (big && !cur && r.visited && (r.cleared || (r.type !== 'combat' && r.type !== 'boss'))) {
        // a room you can warp to: cyan corner brackets
        const x0 = X(r.x0) + 2, y0 = Y(r.y1) + 2, x1 = X(r.x1) - 2, y1 = Y(r.y0) - 2, L = Math.min(10, (x1 - x0) / 3);
        ctx.strokeStyle = 'rgba(127,227,255,0.8)'; ctx.lineWidth = 2; ctx.beginPath();
        [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]].forEach(([x, y, dx, dy]) => { ctx.moveTo(x + dx * L, y); ctx.lineTo(x, y); ctx.lineTo(x, y + dy * L); });
        ctx.stroke();
        if (r.type === 'combat' && !r.challenge) { ctx.fillStyle = 'rgba(141,244,25,0.8)'; ctx.font = 'bold 13px Godo, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('✔', X(r.cx), Y(r.cy) + 5); }
      }
      const rt = r.challenge ? 'challenge' : r.type;
      const icon = { boss: '#ff3d3d', treasure: '#ffcc00', shop: '#7fe0ff', start: '#8df419', challenge: r.cleared ? '#7a6a50' : '#ff8a2a' }[rt];
      if (icon && (r.visited || r.known || r.type === 'boss')) {
        const cx = X(r.cx), cy = Y(r.cy), rr = big ? 9 : 4.5;
        ctx.fillStyle = icon;
        ctx.beginPath();
        if (r.type === 'boss') { for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; ctx.lineTo(cx + Math.cos(a) * rr * 1.2, cy + Math.sin(a) * rr * 1.2); } }
        else if (r.type === 'treasure') { ctx.rect(cx - rr, cy - rr * 0.7, rr * 2, rr * 1.4); }
        else if (rt === 'challenge') { ctx.moveTo(cx, cy - rr); ctx.lineTo(cx + rr, cy); ctx.lineTo(cx, cy + rr); ctx.lineTo(cx - rr, cy); }
        else ctx.arc(cx, cy, rr * 0.8, 0, Math.PI * 2);
        ctx.fill();
        if (big) { /* the room name sits along the room's top edge, clear of the icon and the hero dot */
          const lbl = { boss: '보스', treasure: '보급', shop: '상점', start: '출격', challenge: '도전' }[rt], ly = Math.min(cy - rr * 1.7, Y(r.y1) + 15);
          ctx.font = 'bold 13px Godo, sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.strokeText(lbl, cx, ly); ctx.fillStyle = '#fff'; ctx.fillText(lbl, cx, ly);
        }
      }
    });
    // the boss room is always marked once its neighbour is seen (Gungeon shows the boss door)
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(X(P.x), Y(P.y), big ? 6 : 3.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // aim tick
    ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(P.x), Y(P.y)); ctx.lineTo(X(P.x) + Math.cos(P.aim) * 9, Y(P.y) - Math.sin(P.aim) * 9); ctx.stroke();
  }
  let mmT = 0;
  // the minimap redraws only when something on it changed (the hero moved / turned, a room changed state)
  let mmKey = '';
  function drawMinimap(G) {
    if (++mmT % 3 && !mapDirty) return;
    const P = G.P, k = `${Math.round(P.x * 4)},${Math.round(P.y * 4)},${Math.round(P.aim * 8)},${G.room && G.room.active ? 1 : 0}`;
    if (!mapDirty && k === mmKey) return;
    mmKey = k; mapDirty = false; drawMap(el.minimap, G, false);
  }
  // big map: click (or tap) a cleared room to warp there
  function mapRoomAt(ev) {
    const cv = el.bigMapCv, t = cv._t, lv = GAME.G.lv;
    if (!t || !lv) return null;
    const rc = cv.getBoundingClientRect();
    const px = (ev.clientX - rc.left) * cv.width / rc.width, py = (ev.clientY - rc.top) * cv.height / rc.height;
    const wx = (px - t.ox) / t.s, wy = (t.oy - py) / t.s;
    return lv.rooms.find((r) => (r.visited || r.known) && wx >= r.x0 - 0.5 && wx <= r.x1 + 0.5 && wy >= r.y0 - 0.5 && wy <= r.y1 + 0.5) || null;
  }
  function bindMapClicks() {
    const cv = el.bigMapCv;
    if (cv._bound) return;
    cv._bound = true;
    const redraw = () => drawMap(cv, GAME.G, true);
    const toCanvas = (ev) => { const rc = cv.getBoundingClientRect(); return [(ev.clientX - rc.left) * cv.width / rc.width, (ev.clientY - rc.top) * cv.height / rc.height]; };
    const zoomAt = (f, cx, cy) => {
      const z0 = mapView.z, z1 = Math.max(0.5, Math.min(4, z0 * f)), k = z1 / z0;
      if (k === 1) return;
      // keep the point under the cursor fixed: pan relative to the canvas centre scales with the zoom
      const W = cv.width, H = cv.height;
      mapView.px = (mapView.px - (cx - W / 2)) * k + (cx - W / 2);
      mapView.py = (mapView.py - (cy - H / 2)) * k + (cy - H / 2);
      mapView.z = z1; redraw();
    };
    let drag = null;
    cv.addEventListener('pointerdown', (ev) => {
      ev.preventDefault(); ev.stopPropagation();
      cv.setPointerCapture && cv.setPointerCapture(ev.pointerId);
      drag = { x: ev.clientX, y: ev.clientY, px: mapView.px, py: mapView.py, moved: false };
    });
    cv.addEventListener('pointerup', (ev) => {
      ev.stopPropagation();
      const d = drag; drag = null;
      if (!d || d.moved) return;
      const r = mapRoomAt(ev);
      if (r && GAME.teleportTo(r)) toggleMap();
    });
    cv.addEventListener('pointercancel', () => { drag = null; });
    cv.addEventListener('wheel', (ev) => { ev.preventDefault(); ev.stopPropagation(); const [cx, cy] = toCanvas(ev); zoomAt(ev.deltaY < 0 ? 1.18 : 1 / 1.18, cx, cy); }, { passive: false });
    document.getElementById('mapZin').onclick = (ev) => { ev.stopPropagation(); zoomAt(1.3, cv.width / 2, cv.height / 2); };
    document.getElementById('mapZout').onclick = (ev) => { ev.stopPropagation(); zoomAt(1 / 1.3, cv.width / 2, cv.height / 2); };
    document.getElementById('mapZreset').onclick = (ev) => { ev.stopPropagation(); mapView.z = 1; mapView.px = mapView.py = 0; redraw(); };
    /* closing: the ✕ button, or a tap on the dimmed area outside the panel (touch players can't reach the map button under it) */
    const mc = document.getElementById('mapClose'); if (mc) mc.onclick = (ev) => { ev.stopPropagation(); if (!el.bigMap.hidden) toggleMap(); };
    el.bigMap.addEventListener('pointerdown', (ev) => { if (ev.target === el.bigMap && !el.bigMap.hidden) { ev.preventDefault(); toggleMap(); } });
    cv.addEventListener('pointermove', (ev) => {
      if (drag) {
        const rc = cv.getBoundingClientRect(), k = cv.width / rc.width;
        const dx = (ev.clientX - drag.x) * k, dy = (ev.clientY - drag.y) * k;
        if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true;
        if (drag.moved) { mapView.px = drag.px + dx; mapView.py = drag.py + dy; cv.style.cursor = 'grabbing'; redraw(); }
        return;
      }
      const r = mapRoomAt(ev), G = GAME.G;
      cv.style.cursor = r && r.visited && r !== G.room && (r.cleared || (r.type !== 'combat' && r.type !== 'boss')) && !(G.room && G.room.active) ? 'pointer' : 'grab';
    });
  }
  // keyboard / gamepad: arrows (or d-pad) move a cursor between warpable rooms, Enter / A warps
  let mapSel = null;
  const warpable = (r, G) => r.visited && r !== G.room && (r.cleared || (r.type !== 'combat' && r.type !== 'boss'));
  function mapMove(dx, dy) {
    const G = GAME.G, lv = G.lv;
    if (!lv) return;
    const from = mapSel || G.room || { cx: G.P.x, cy: G.P.y };
    let best = null, bs = Infinity;
    lv.rooms.forEach((r) => {
      if (!warpable(r, G) || r === mapSel) return;
      const vx = r.cx - from.cx, vy = r.cy - from.cy, along = vx * dx + vy * dy;
      if (along <= 0.5) return;
      const s = along + Math.abs(vx * dy - vy * dx) * 2; // prefer rooms straight in that direction
      if (s < bs) { bs = s; best = r; }
    });
    if (best) { mapSel = best; SFX.play('uiPick', 0.4); drawMap(el.bigMapCv, G, true); }
  }
  function mapConfirm() { if (mapSel && GAME.teleportTo(mapSel)) { mapSel = null; toggleMap(); } }
  window.addEventListener('keydown', (e) => {
    if (!el.bigMap || el.bigMap.hidden || GAME.G.phase !== 'play') return;
    const d = { ArrowUp: [0, 1], KeyW: [0, 1], ArrowDown: [0, -1], KeyS: [0, -1], ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] }[e.code];
    if (d) { mapMove(d[0], d[1]); e.preventDefault(); }
    else if (e.code === 'Enter' || INPUT.KEY.interact.includes(e.code)) { mapConfirm(); e.preventDefault(); } // confirm follows the interact binding (Space is a dodge key: never a warp)
  });
  function toggleMap() {
    mapSel = null;
    if (GAME.G.tut) GAME.G.tut.map = true; // the training's map step counts the moment the map opens (not on a later frame)
    bindMapClicks(); el.bigMap.hidden = !el.bigMap.hidden; if (!el.bigMap.hidden) { mapView.px = 0; mapView.py = 0; } SFX.play('uiPick', 0.6); if (!el.bigMap.hidden) drawMap(el.bigMapCv, GAME.G, true); }

  // ── floating texts ─────────────────────────────────────
  let numIdx = 0, numLane = 0;
  const REDUCED = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function digits(d, amount, crit) {
    const f = crit ? UIA.dmgc : UIA.dmg;
    if (d._crit !== crit) { d._crit = crit; d.classList.toggle('crit', crit); }
    const s = String(Math.max(1, Math.round(amount))).slice(-6);
    for (let k = 0; k < d.digits.length; k++) {
      const sp = d.digits[k], st = sp.style;
      const g = k < s.length && f.g[s[k]];
      if (!g) { if (st.display !== 'none') st.display = 'none'; continue; }
      const [x, y, w, hh, xo, yo, adv] = g;
      if (st.display === 'none') st.display = '';
      st.width = w + 'px'; st.height = hh + 'px';
      st.margin = `${yo}px ${adv - w - xo}px 0 ${xo}px`;
      st.backgroundPosition = `-${x}px -${y}px`;
    }
  }
  function dmg(x, y, amount, crit) {
    let d = null;
    /* rapid hits on one spot (a boss under fire) merge into one growing number instead of a pile */
    const now = performance.now();
    for (let k = 0; k < el.nums.length; k++) { const c = el.nums[k]; if (c.busy && now - c.t0 < 180 && Math.abs(c.wx - x) < 1.2 && Math.abs(c.wy - y) < 1.6) { d = c; amount += c.amt; crit = crit || c._crit; break; } }
    if (!d) { /* at most 3 numbers on screen around one spot (a boss): a 4th folds into the newest of them */
      let near = 0, young = null;
      for (const c of el.nums) if (c.busy && Math.abs(c.wx - x) < 2.6 && Math.abs(c.wy - y) < 3) { near++; if (!young || c.t0 > young.t0) young = c; }
      if (near >= 3 && young) { d = young; amount += young.amt; crit = crit || young._crit; }
    }
    if (!d) {
    for (let k = 0; k < el.nums.length; k++) { const c = el.nums[(numIdx + k) % el.nums.length]; if (!c.busy) { d = c; numIdx = (numIdx + k + 1) % el.nums.length; break; } }
    }
    if (!d) return;
    d.t0 = now; d.wx = x; d.wy = y; d.amt = amount;
    // numbers take turns across 4 lanes (and two heights) instead of random jitter, so bursts don't pile into one blob
    const lane = d.busy && d.lane != null ? d.lane : numLane++ % 8; d.lane = lane;
    let [sx, sy] = GAME.worldToScreen(x + ((lane % 4) - 1.5) * 0.42, y + (lane < 4 ? 0 : 0.38));
    if (!el.bossBar.hidden && sy < 120) sy = 120 + Math.random() * 20;
    /* numbers stay on the playfield: never over the minimap (top right) or the bottom HUD band */
    sy = Math.max(70, Math.min(innerHeight - 170, sy));
    { const mb = el.mapBox || (el.mapBox = document.getElementById('mapBox')); if (mb && mb.offsetParent) { const r = mb.getBoundingClientRect(); if (sx > r.left - 30 && sy < r.bottom + 20) sx = r.left - 40; } }
    d.busy = true;
    digits(d, amount, crit);
    const p = `translate3d(${Math.round(sx)}px, ${Math.round(sy)}px, 0)`;
    const nz = INPUT.isTouch && innerWidth < innerHeight ? 0.68 : 1; // portrait phones: smaller numbers (scaled here, so their positions stay exact)
    const s0 = (crit ? 1.1 : 0.75) * nz, s1 = (crit ? 0.78 : 0.52) * nz;
    if (d.anim) d.anim.cancel();
    if (REDUCED) { // reduced motion: the number appears and fades in place
      d.anim = d.animate([{ opacity: 1, transform: `${p} translate(-50%, -50%) scale(${s1})` }, { opacity: 0, transform: `${p} translate(-50%, -50%) scale(${s1})` }], { duration: 520, fill: 'forwards' });
      d.anim.onfinish = () => { d.busy = false; };
      return;
    }
    d.anim = d.animate([
      { opacity: 1, transform: `${p} translate(-50%, -50%) scale(${s0})` },
      { opacity: 1, transform: `${p} translate(-50%, -85%) scale(${s1})`, offset: 0.2 },
      { opacity: 1, transform: `${p} translate(-50%, -130%) scale(${s1})`, offset: 0.7 },
      { opacity: 0, transform: `${p} translate(-50%, -160%) scale(${s1})` },
    ], { duration: 520, easing: 'ease-out', fill: 'forwards' });
    d.anim.onfinish = () => { d.busy = false; };
  }
  const tq = [];
  function toast(msg, cls) {
    // the top lane belongs to one thing at a time: a banner or cut-in in flight holds new toasts back briefly
    const busy = el.banner.classList.contains('on') && /phase|floor/.test(el.banner.className) || !el.skillCut.hidden;
    if (busy && tq.length < 4) { tq.push([msg, cls]); setTimeout(() => { const q = tq.shift(); if (q) toastNow(q[0], q[1]); }, 1300 + (tq.length - 1) * 900); return; } // queued toasts come out one after another, not all at once
    toastNow(msg, cls);
  }
  function clearToasts() { el.toasts.innerHTML = ''; tq.length = 0; }
  let lastToast = '', lastToastT = 0;
  function toastNow(msg, cls) {
    const now = performance.now();
    if (msg === lastToast && now - lastToastT < 1500) return;
    lastToast = msg; lastToastT = now;
    if (GAME.G.P && GAME.G.P.dead && GAME.G.phase === 'play') return;
    const t = document.createElement('div');
    t.className = 'toast ' + (cls || '');
    t.innerHTML = msg;
    el.toasts.appendChild(t);
    while (el.toasts.children.length > 3) el.toasts.firstChild.remove();
    setTimeout(() => t.remove(), 2600);
  }
  let chEl = null, chLast = -1;
  function chTimer(t, r) {
    if (!chEl) chEl = document.getElementById('chTimer');
    if (!chEl) return;
    if (t == null) { chEl.hidden = true; chLast = -1; document.body.classList.remove('chal'); return; }
    document.body.classList.add('chal');
    const s = Math.ceil(t);
    chEl.hidden = false;
    const key = s + (r && r.chMode === 'hunt' ? ':' + r.chKills : '');
    if (key === chLast) return;
    chLast = key;
    chEl.innerHTML = r && r.chMode === 'hunt' ? `<small>도전 구역 · 섬멸 <em class="num">${Math.min(r.chKills, r.chGoal)}/${r.chGoal}</em></small><b class="num">${s}</b>` : `<small>도전 구역 · 버티기</small><b class="num">${s}</b>`;
    chEl.classList.toggle('hurry', s <= 5);
    if (s <= 5 && s > 0) SFX.synth('beat', 0.5);
  }
  function banner(kind, title, sub) {
    const b = el.banner;
    b.className = 'banner ' + kind;
    if (kind === 'floor' && sub && GAME.G.fi > 0) b.innerHTML = `<div><div class="band"><div class="ms2">SECTOR ${String(GAME.G.fi + 1).padStart(2, '0')} · DESCENT</div><div class="wv">${title}</div><div class="sub">${sub}</div></div></div>`;
    else if (kind === 'floor') b.innerHTML = `<div><div class="band"><div class="ms"></div><div class="wv">${title}</div><div class="sub">${sub}</div></div></div>`;
    else if (kind === 'clear') b.innerHTML = `<div><div class="band"><div class="wv"><em>${title}</em></div><div class="sub">${sub}</div></div></div>`;
    else b.innerHTML = `<div><div class="band sm"><div class="wv2">${title}</div></div></div>`;
    void b.offsetWidth;
    b.classList.add('on');
  }
  function announce(head, name, desc, rank, icon) {
    const a = document.createElement('div');
    a.className = 'ann';
    a.style.setProperty('--c', RANKS[Math.min(3, rank)].color);
    a.innerHTML = `${icon ? `<i class="ic" style="background-image:var(--s-${icon})"></i>` : `<i class="rk" style="background-image:${rankImg(rank, true)}"></i>`}<div><small>${head}</small><b>${name}</b><em>${desc}</em></div>`;
    el.announce.appendChild(a);
    while (el.announce.children.length > 2) el.announce.firstChild.remove();
    setTimeout(() => a.classList.add('out'), 2600);
    setTimeout(() => a.remove(), 3100);
  }
  let promptKey = null;
  function prompt(html, x, y, desc) {
    const p = el.prompt;
    const actB = document.querySelector('.tb.act');
    if (actB) actB.classList.toggle('avail', !!html);
    if (!html) { if (!p.hidden) { p.hidden = true; promptKey = null; } return; }
    if (promptKey !== html) { promptKey = html; p.querySelector('span').innerHTML = html; p.querySelector('small').textContent = desc || ''; p.querySelector('kbd').textContent = INPUT.isTouch ? '줍기' : K('interact'); }
    p.hidden = false;
    const [sx, sy] = GAME.worldToScreen(x, y);
    p.style.transform = `translate(${Math.round(sx)}px, ${Math.round(sy)}px) translate(-50%, -100%)`;
  }

  // ── boss bar / intro ───────────────────────────────────
  let bossRef = null;
  function boss(e, elite) {
    bossRef = e;
    const b = el.bossBar;
    if (b.hidden || b._for !== e) {
      b.hidden = false; b._for = e;
      b.classList.toggle('elite', !!e.elite);
      el.bossName.innerHTML = e.elite ? `<small>ELITE</small> ${e.def.name}` : `<small>BOSS</small> ${e.def.name}`;
      el.bossImg.style.backgroundImage = `url(${IMG[e.def.rig.replace(/^e_/, 'e_')] || IMG[e.def.img] || ''})`;
    }
    const f = Math.max(0, e.hp / e.maxHp);
    el.bossHp.style.transform = `scaleX(${f})`;
    el.bossHpTx.textContent = Math.ceil(f * 100) + '%';
    b.classList.toggle('berserk', !!e.boss && f < 0.33);
  }
  function hideBoss() { el.bossBar.hidden = true; bossRef = null; }
  setInterval(() => { if (bossRef && bossRef.alive && GAME.G.phase === 'play') boss(bossRef); }, 120);
  function bossIntro(def) {
    const d = el.bossIntro;
    el.banner.className = 'banner'; el.banner.innerHTML = '';
    d.innerHTML = `<div class="bi-band"><div class="bi-ct"><span class="mk"></span><span class="tx"></span><span class="mk"></span></div>
      <div class="bi-main"><i style="background-image:url(${IMG[def.img]})"></i><div><small>${def.title}</small><b>${def.name}</b><em>${def.tip}</em></div></div></div>`;
    d.hidden = false; el.skillCut.hidden = true;
    d.classList.remove('on'); void d.offsetWidth; d.classList.add('on');
    // hidden by the game on its own clock (GAME → FX.later), so pausing during the intro doesn't cut the card short
  }
  function hideBossIntro() { el.bossIntro.hidden = true;
  }
  function skillCut(h) {
    const d = el.skillCut;
    if (!el.bossIntro.hidden) return; // the boss caution band owns the screen for its moment
    d.innerHTML = `<div class="sc-band" style="--c:${h.color}"><i style="background-image:${portrait(h)}"></i><div><small>SKILL</small><b>${h.skillName}</b></div></div>`;
    d.hidden = false;
    d.classList.remove('on'); void d.offsetWidth; d.classList.add('on');
    clearTimeout(skillCut.t); skillCut.t = setTimeout(() => { d.hidden = true; }, 1200); // a second cut-in restarts the timer
  }
  function hurt() { el.hurtFx.classList.remove('on'); void el.hurtFx.offsetWidth; el.hurtFx.classList.add('on'); clearTimeout(hurt.t); hurt.t = setTimeout(() => el.hurtFx.classList.remove('on'), 450); } /* the class always clears (with flashes off it used to stay as a permanent red vignette) */
  function fade(cb) {
    el.fade.classList.add('on');
    // holds black until the callback's work is done — and always lifts, even if that work fails
    const lift = () => setTimeout(() => el.fade.classList.remove('on'), 120);
    setTimeout(() => { let p; try { p = Promise.resolve(cb()); } catch (e) { console.error(e); p = Promise.resolve(); } p.catch((e) => console.error(e)).finally(lift); }, 520);
  }

  // ── pause ─────────────────────────────────────────────
  function goalHtml(G) {
    const s = G.stats, tm = Math.floor(s.time), hitsOk = s.hits <= GOAL.hits, timeOk = s.time < GOAL.time;
    const g = (ok, label, v) => `<span class="${ok ? 'ok' : 'no'}"><i></i>${label}<b class="num">${v}</b></span>`;
    const gc = (label, v) => `<span class="cur"><i></i>${label}<b class="num">${v}</b></span>`; // in progress
    return `<small>작전 목표 · 별 3개</small>${gc('철혈 사령부(B6) 제압', `현재 ${DATA.FLOORS[G.fi].key} / B6`)}${g(hitsOk, `피격 ${GOAL.hits}회 이하`, `${s.hits}회`)}${g(timeOk, `${GOAL.time / 60}분 이내`, `${Math.floor(tm / 60)}:${String(tm % 60).padStart(2, '0')}`)}`;
  }
  function togglePause(on) {
    const G = GAME.G;
    if (G.phase !== 'play') return;
    const lvo = document.getElementById('lvOv');
    if (G.choosing) { /* pausing over the level-up cards: hide them, keep the game held, bring them back on resume */
      G.pauseMenu = on; if (lvo) lvo.hidden = on; G.paused = true;
    } else { G.pauseMenu = false; G.paused = on; }
    el.pauseOv.hidden = !on;
    document.body.classList.toggle('paused', on);
    if (el.disarmAbort) el.disarmAbort();
    if (GAME.refreshHints) GAME.refreshHints();
    if (on) {
      if (!el.bigMap.hidden) el.bigMap.hidden = true;
      INPUT.stopFire();
      pauseTab('run');
      const pg = $('#pauseGoal'); if (pg) pg.innerHTML = goalHtml(G);
      const kh = el.pauseOv.querySelector('.keys');
      if (kh && !INPUT.isTouch) kh.innerHTML = pauseKeysHtml();
      setTimeout(() => { const b = $('#btnResume'); if (b && !el.pauseOv.hidden) b.focus({ preventScroll: true }); }, 30); // keyboard users land on "resume"
      const P = G.P, F = DATA.FLOORS[G.fi], tm = Math.floor(G.stats.time);
      const perks = Object.entries(P.up || {}).map(([id, l]) => { const p = DATA.PERKS.find((x) => x.id === id); return p ? `<span class="${p.hero ? 'own' : ''}" style="--c:${p.hero ? P.hero.color : '#ffcc00'}" title="${p.desc}"><i style="background-image:var(--s-${p.icon})"></i><em class="pn">${p.name}<b>Lv.${l}</b><small>${p.desc}</small></em></span>` : ''; /* each perk shows what it does */ }).join('');
      const run = `<div class="pi-run"><i class="pr-port" style="background-image:${portrait(P.hero)};--c:${P.hero.color}"></i>
        <div class="pr-main"><small>${F.key} · ${F.name}${G.heat ? ` · 위험 등급 ${G.heat}` : ''}</small><b>${P.hero.name}</b>
        <div class="pr-stats"><span>경과<em class="num">${Math.floor(tm / 60)}:${String(tm % 60).padStart(2, '0')}</em></span><span>처치<em class="num">${G.stats.kills}</em></span><span>레벨<em class="num">${P.lv}</em></span><span>체력<em class="num">${P.hp * 25}/${P.maxHp * 25}</em></span></div></div></div>
        ${perks ? `<div class="pi-perks">${perks}</div>` : ''}`;
      // synergy codex: every pair, with what is owned (active / one half / unknown)
      const itName = (id) => { const it = ITEMS.find((x) => x.id === id); return it ? it.name : id; };
      const half = DATA.SYNERGY.filter((sy) => !P.syn.has(sy.name) && (P.items.includes(sy.a) || P.items.includes(sy.b))).length;
      const syn = `<details class="pi-syn"><summary>시너지 도감 · 발동 ${P.syn.size}/${DATA.SYNERGY.length}${half ? ` · 한쪽 보유 ${half}` : ''} (두 장비를 함께 얻으면 발동)</summary><div class="syn-grid">${DATA.SYNERGY.map((sy) => {
        const a = P.items.includes(sy.a), b = P.items.includes(sy.b), on = P.syn.has(sy.name);
        return `<span class="${on ? 'on' : a || b ? 'half' : ''}" title="${sy.desc}"><b>${sy.name}</b><em>${a ? '✔' : '·'} ${itName(sy.a)} + ${b ? '✔' : '·'} ${itName(sy.b)}</em><i>${sy.desc}</i></span>`;
      }).join('')}</div></details>`;
      $('#pauseInfo').innerHTML = run + syn + `<div class="pi-items">${P.guns.map((g) => `<span><i style="background-image:${rankImg(g.d.rank)}"></i><b>${g.d.name}</b><small>${g.d.desc}</small></span>`).join('')}${P.items.length ? P.items.map((id) => { const it = ITEMS.find((x) => x.id === id); return `<span><i style="background-image:var(--s-${it.icon})"></i><b>${it.name}</b><small>${it.desc}</small></span>`; }).join('') : '<em>획득한 아이템이 없습니다</em>'}</div>`;
      SFX.play('uiPick', 0.6);
    } else {
      INPUT.capture = null;
      if (document.activeElement && el.pauseOv.contains(document.activeElement)) document.activeElement.blur();
    }
  }

  // ── result ────────────────────────────────────────────
  function result(win, s, P, fi) {
    const r = el.result;
    closeOverlays();
    hideBoss(); el.prompt.hidden = true;
    el.banner.className = 'banner'; el.banner.innerHTML = ''; el.toasts.innerHTML = ''; el.announce && (el.announce.hidden = true);
    r.className = win ? 'overlay win' : 'overlay lose';
    r.hidden = false;
    setTimeout(() => { const b = $('#btnRetry'); if (b && !r.hidden) b.focus({ preventScroll: true }); }, 60); // keyboard / screen-reader focus lands on the result's first action
    r.querySelector('h2').textContent = win ? '임무 완료' : '임무 실패';
    // the hero's badge fills the panel's lower area: portrait, name, the run's level and depth
    { let hb = r.querySelector('.rhero'); if (!hb) { hb = document.createElement('div'); hb.className = 'rhero'; r.querySelector('.mc').insertBefore(hb, r.querySelector('.rbtns')); }
      const hero = P.hero;
      hb.style.setProperty('--c', hero.color);
      hb.innerHTML = `<i style="background-image:${portrait(hero)}"></i><div><small>${win ? 'MISSION CLEAR' : 'RETREAT'}</small><b>${hero.name}</b><em>Lv.${P.lv} · ${FLOORS[fi].key} ${FLOORS[fi].name} · 강화 ${Object.values(P.up || {}).reduce((a, b) => a + b, 0)}개</em></div>`; }
    const where = `${FLOORS[fi].key} ${FLOORS[fi].name}`;
    r.querySelector('.reason').textContent = win ? '철혈 사령부를 제압하고 무사히 귀환했습니다!' : s.cause === '작전 포기' ? `${where}에서 작전을 포기하고 귀환했습니다` : `${where}에서 작전 불능 — ${s.cause || '피격'}`; // an abort reads as a retreat, not a defeat
    const stars = win ? 1 + (s.hits <= GOAL.hits) + (s.time < GOAL.time) : 0;
    r.querySelectorAll('.stars i').forEach((st, i) => { st.className = i < stars ? 'on' : ''; st.style.animationDelay = (0.5 + i * 0.25) + 's'; });
    const mm = Math.floor(s.time / 60), ss = Math.floor(s.time % 60);
    const row = (ok, label, v) => `<div class="${ok ? 'ok' : ''}"><i></i>${label}<b>${v}</b></div>`;
    const rowNa = (label, v) => `<div class="na"><i></i>${label}<b>${v}</b></div>`; // not judged on a failed run (neither met nor missed)
    r.querySelector('.ml').innerHTML =
      row(win, '철혈 사령부 제압', win ? '완료' : `${where}`) +
      (win ? row(s.hits <= GOAL.hits, `피격 ${GOAL.hits}회 이하로 돌파`, `${s.hits}회`) : rowNa(`피격 ${GOAL.hits}회 이하로 돌파`, `피격 ${s.hits}회 · 완주 시 판정`)) +
      (win ? row(s.time < GOAL.time, `${GOAL.time / 60}분 이내 돌파`, `${mm}:${String(ss).padStart(2, '0')}`) : rowNa(`${GOAL.time / 60}분 이내 돌파`, `${mm}:${String(ss).padStart(2, '0')} · 완주 시 판정`));
    const hero = P.hero;
    const line = (label, v, f) => `<div class="ru"><div class="nm"><b>${label}</b></div><div class="v">${v}</div></div>${f != null ? `<div class="gauge"><i style="transform:scaleX(${Math.min(1, f)})"></i></div>` : ''}`;
    r.querySelector('.rteam').innerHTML =
      `<div class="ru hero"><span class="pf" style="background-image:${portrait(hero)}"></span><div class="nm"><b>${hero.name}</b><small>${hero.title}</small></div></div>` +
      line('처치한 철충', s.kills) + line('가한 피해', Math.round(s.dmg).toLocaleString()) + line('제압한 구역', s.roomsCleared) + line('격파한 보스', `${s.bosses} / ${FLOORS.length}`) +
      line('획득한 부품', s.gold) + line('획득 데이터 칩 (연구소)', `+${s.chips || 0}`) +
      (s.heat ? line('위험 등급', `${s.heat} (칩 +${s.heat * 25}%)`) : '') +
      (s.heatUp ? `<div class="rgun"><small>신규 개방</small><span style="--c:#ff5a4a">위험 등급 ${s.heatUp} — 타이틀에서 선택</span></div>` : '') +
      `<div class="rgun"><small>사용 무기</small>${[...s.guns].map((id) => `<span style="--c:${RANKS[GUNS[id].rank].color}">${GUNS[id].name}</span>`).join('')}</div>` +
      `<div class="rgun"><small>획득 장비</small>${P.items.length ? [...new Set(P.items)].map((id) => { const it = ITEMS.find((x) => x.id === id), n = P.items.filter((x) => x === id).length; return `<span class="ritem"><i title="${it.name}" style="background-image:var(--s-${it.icon})">${n > 1 ? `<b>${n}</b>` : ''}</i>${it.name}</span>`; }).join('') : '<em>없음</em>'}</div>` +
      `<div class="rgun rperk"><small>강화 모듈 · Lv.${P.lv}</small>${Object.entries(P.up || {}).filter(([, l]) => l > 0).map(([id, l]) => { const pk = DATA.PERKS.find((x) => x.id === id); return pk ? `<span style="--c:${pk.hero ? hero.color : '#ffcc00'}">${pk.name}${l > 1 ? ` ${l}` : ''}</span>` : ''; }).join('') || '<em>없음</em>'}</div>` +
      `<div class="rgun"><small>통계</small><span style="--c:#7fe3ff">피격 ${s.hits || 0}회</span><span style="--c:#7fe3ff">궁극기 ${s.skills || 0}회</span><span style="--c:#7fe3ff">보조 스킬 ${s.skills2 || 0}회</span><span style="--c:#7fe3ff">시간 ${Math.floor(s.time / 60)}:${String(Math.floor(s.time % 60)).padStart(2, '0')}</span></div>`;
    // records
    const b = bests();
    b.kills = (b.kills || 0) + s.kills;
    if (win) b.clears = (b.clears || 0) + 1;
    const reach = win ? '전 구역 클리어' : FLOORS[fi].key;
    const rank = (x) => (x === '전 구역 클리어' ? 9 : x ? +x[1] : 0);
    if (rank(reach) > rank(b.best)) b.best = reach;
    if (!/[?&](bot|sim)=1/.test(location.search)) try { localStorage.setItem('lao_rogue_best', JSON.stringify(b)); } catch (e) { /* ignore */ }
    r.classList.remove('ready');
    setTimeout(() => r.classList.add('ready'), 900);
    document.body.classList.remove('playing', 'lowhp', 'paused');
    el.hud.hidden = true;
    const xe = document.getElementById('xhair'); if (xe) xe.hidden = true;
  }

  window.UI = {
    init, gunEmpty, sk2Used, reloadGauge, loading, loaded, title, titleTick, startRun, hud, gunChanged, toggleMap, dmg, toast, clearToasts, banner, chTimer, ammoWarn, levelUp, shock, chTimer, announce, prompt, boss, hideBoss, bossIntro, skillCut, hurt, fade,
    togglePause, result, coach, heat, K, hideBossIntro, keyLabels: () => keyLabels(), mapDirty() { mapDirty = true; }, get sel() { return selHero; }, mapOpen: () => !!el.bigMap && !el.bigMap.hidden, goalHtml,
  };
})();
