// Test autopilot (index.html?bot=1): explores, fights, dodges, loots and descends, driving the same keyboard input a player uses.
// Collects a log in window.BOT.log for balance checks.
(function () {
  if (!/[?&]bot=1/.test(location.search)) return;
  const held = new Set();
  const press = (c) => { if (!held.has(c)) { held.add(c); window.dispatchEvent(new KeyboardEvent('keydown', { code: c })); } };
  const release = (c) => { if (held.has(c)) { held.delete(c); window.dispatchEvent(new KeyboardEvent('keyup', { code: c })); } };
  const tap = (c) => { window.dispatchEvent(new KeyboardEvent('keydown', { code: c })); setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: c })), 30); };
  const BOT = { log: [], path: null, pathT: 0, goal: null, stuck: 0, lastPos: [0, 0], skill: +(new URLSearchParams(location.search).get('skill') || 0.8) };
  window.BOT = BOT;

  function bfs(lv, sx, sy, isGoal) {
    const W = lv.W, H = lv.H, prev = new Int32Array(W * H).fill(-1);
    const s = Math.floor(sy) * W + Math.floor(sx);
    const q = [s]; prev[s] = s;
    let found = -1;
    for (let h = 0; h < q.length && found < 0; h++) {
      const i = q[h], x = i % W, y = (i / W) | 0;
      if (isGoal(x, y)) { found = i; break; }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, j = ny * W + nx;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || prev[j] >= 0) continue;
        if (LEVEL.blockedT(nx, ny)) continue;
        prev[j] = i; q.push(j);
      }
    }
    if (found < 0) return null;
    const pts = [];
    for (let i = found; i !== s; i = prev[i]) pts.push([i % W + 0.5, ((i / W) | 0) + 0.5]);
    return pts.reverse();
  }

  function setMove(dx, dy) {
    const t = 0.2;
    dx > t ? press('KeyD') : release('KeyD');
    dx < -t ? press('KeyA') : release('KeyA');
    dy > t ? press('KeyW') : release('KeyW');
    dy < -t ? press('KeyS') : release('KeyS');
  }

  function tick() {
    const G = window.GAME && GAME.G;
    if (!G) return;
    if (G.phase === 'title') { setMove(0, 0); release('KeyJ'); if (!BOT.started && document.getElementById('loading').hidden) { BOT.started = true; setTimeout(() => tap('Enter'), 600); } return; }
    if (G.phase !== 'play' || G.paused || !G.P || G.P.dead) { setMove(0, 0); release('KeyJ'); return; }
    const P = G.P, lv = G.lv, r = G.room;
    const fighting = r && r.active;
    let mx = 0, my = 0;
    if (fighting) {
      press('KeyJ');
      // keep a comfortable distance from the nearest enemy, strafe around it
      let ne = null, nd = 1e9;
      for (const e of G.enemies) { if (!e.alive || e.spawnT > 0) continue; const d = Math.hypot(e.x - P.x, e.y - P.y); if (d < nd) { nd = d; ne = e; } }
      if (ne && !P.target && !LEVEL.los(P.x, P.y + 0.2, ne.x, ne.y + 0.2)) {
        // no line of fire (cover in the way): walk a path toward the nearest enemy
        BOT.cpT = (BOT.cpT || 0) - 1 / 30;
        if (!BOT.cpath || BOT.cpT <= 0 || BOT.cpath.length < 1) { BOT.cpT = 0.5; BOT.cpath = bfs(lv, P.x, P.y, (x, y) => Math.abs(x + 0.5 - ne.x) < 1.5 && Math.abs(y + 0.5 - ne.y) < 1.5); }
        if (BOT.cpath && BOT.cpath.length) {
          while (BOT.cpath.length > 1 && Math.hypot(BOT.cpath[0][0] - P.x, BOT.cpath[0][1] - P.y) < 0.6) BOT.cpath.shift();
          mx = BOT.cpath[0][0] - P.x; my = BOT.cpath[0][1] - P.y;
        }
      } else if (ne) {
        BOT.cpath = null;
        const dx = (P.x - ne.x) / nd, dy = (P.y - ne.y) / nd;
        const want = 5;
        const k = nd < want ? 1 : -0.6;
        mx += dx * k + -dy * 0.6; my += dy * k + dx * 0.6;
      }
      // pull toward the room centre so we don't hug walls
      mx += (r.cx - P.x) * 0.06; my += (r.cy - P.y) * 0.06;
      // predictive dodge: try 9 headings, simulate the nearby bullets ahead, keep the safest one (blended with the spacing goal)
      const sp = P.hero.speed * P.mods.speed;
      const near = G.ebul.filter((b) => Math.abs(b.x - P.x) < 6 && Math.abs(b.y - P.y) < 6);
      let best = null, bestScore = -1e9, curDanger = 0;
      const dirs = [[0, 0]];
      for (let k = 0; k < 8; k++) dirs.push([Math.cos(k * Math.PI / 4), Math.sin(k * Math.PI / 4)]);
      const l0 = Math.hypot(mx, my) || 1, gx = mx / l0, gy = my / l0;
      // skill = how far ahead it reads the bullets (0.5 → 0.3 s, 0.8 → 0.48 s, 1 → 0.6 s) and how cleanly it aims (see below)
      const look = 0.6 * BOT.skill;
      for (const [dx, dy] of dirs) {
        let minD = 9;
        for (let t = 0.1; t <= look + 1e-6; t += 0.1) {
          const px = P.x + dx * sp * t, py = P.y + 0.42 + dy * sp * t;
          if (LEVEL.hitCircle(P.x + dx * sp * t, P.y + dy * sp * t, 0.3)) { minD = Math.min(minD, 0.5); break; }
          for (const b of near) { const d = Math.hypot(b.x + b.vx * t - px, b.y + b.vy * t - py) - b.r - 0.2; if (d < minD) minD = d; }
        }
        if (!dx && !dy) curDanger = minD;
        const score = Math.min(minD, 1.2) * 4 * BOT.skill + (dx * gx + dy * gy) * 0.6;
        if (score > bestScore) { bestScore = score; best = [dx, dy, minD]; }
      }
      if (best && (best[0] || best[1])) { mx = best[0]; my = best[1]; }
      else if (best) { mx *= 0.3; my *= 0.3; }
      if (curDanger < 0.05 && best && best[2] < 0.15 && Math.random() < BOT.skill) tap('KeyK');
      // aim error: a less skilled bot wobbles its aim (the game's aim assist would otherwise make every bot a sharpshooter)
      if (P.target && BOT.skill < 1) P.aim += (Math.random() - 0.5) * (1 - BOT.skill) * 0.9;
      if (P.skill >= 100) tap('KeyF');
      if (!(P.sk2Cd > 0) && Math.random() < 0.05) tap('KeyE');
      const g = GAME.curGun();
      if (g.mag === 0 && g.ammo === 0 && P.guns.length > 1) tap('KeyC');
    } else {
      release('KeyJ');
      // goal: loot / chests (if keys) / exit / unvisited rooms (boss last)
      BOT.pathT -= 1 / 30;
      if (!BOT.path || BOT.pathT <= 0) {
        BOT.pathT = 1.2;
        const objs = G.objs.filter((o) => !(BOT.skip && BOT.skip.has(o)) && !(o.type === 'loot' && o.loot.kind === 'heart' && P.hp >= P.maxHp) && !(o.type === 'loot' && o.loot.kind === 'gun' && P.guns.length >= 3 && !P.guns.some((g) => g.id === o.loot.id))) /* weapon slots full: leave other guns */.filter((o) => (o.type === 'loot' && (!o.price || P.gold >= o.price + 10)) || (o.type === 'chest' && (o.free || P.keys > 0)));
        const pick = G.pickups.filter((p) => p.kind !== 'gold' || true);
        let goal = null;
        const near = (arr) => { let b = null, bd = 1e9; arr.forEach((o) => { const d = Math.hypot(o.x - P.x, o.y - P.y); if (d < bd) { bd = d; b = o; } }); return b; };
        const exit = G.objs.find((o) => o.type === 'exit');
        const po = near(pick.filter((p) => !(BOT.skip && BOT.skip.has(p)) && !((p.kind === 'heart' || p.kind === 'half') && P.hp >= P.maxHp)));
        const oo = near(objs);
        if (po && Math.hypot(po.x - P.x, po.y - P.y) < 9) goal = { x: po.x, y: po.y, pk: po };
        else if (oo) goal = { x: oo.x, y: oo.y - 0.8, obj: oo };
        else if (exit) goal = { x: exit.x, y: exit.y, obj: exit };
        else {
          const rooms = lv.rooms.filter((x) => !x.visited && x.type !== 'boss');
          const target = rooms.length ? rooms : lv.rooms.filter((x) => x.type === 'boss' && !x.cleared);
          const tr = near(target.map((x) => ({ x: x.cx, y: x.cy, r: x })));
          if (tr) goal = { x: tr.x, y: tr.y };
        }
        const same = goal && BOT.goal && ((goal.pk && goal.pk === BOT.goal.pk) || (goal.obj && goal.obj === BOT.goal.obj));
        BOT.goalAge = same ? (BOT.goalAge || 0) + 1 : 0;
        if (BOT.goalAge > 10) { (BOT.skip || (BOT.skip = new Set())).add(goal.pk || goal.obj); BOT.goalAge = 0; }
        BOT.goal = goal;
        BOT.path = goal ? bfs(lv, P.x, P.y, (x, y) => Math.abs(x + 0.5 - goal.x) < 1 && Math.abs(y + 0.5 - goal.y) < 1) : null;
      }
      if (BOT.path && BOT.path.length) {
        let [tx, ty] = BOT.path[0];
        while (BOT.path.length > 1 && Math.hypot(BOT.path[0][0] - P.x, BOT.path[0][1] - P.y) < 0.6) BOT.path.shift();
        [tx, ty] = BOT.path[0];
        mx = tx - P.x; my = ty - P.y;
      } else if (BOT.goal) { mx = BOT.goal.x - P.x; my = BOT.goal.y - P.y; if (Math.hypot(mx, my) < 0.3) BOT.pathT = 0; }
      if (BOT.goal && BOT.goal.obj && Math.hypot(BOT.goal.obj.x - P.x, BOT.goal.obj.y - P.y) < 1.3) {
        tap('KeyG');
        const o = BOT.goal.obj; o._tries = (o._tries || 0) + 1;
        if (o._tries > 20) { (BOT.skip || (BOT.skip = new Set())).add(o); BOT.pathT = 0; }
      }
    }
    const l = Math.hypot(mx, my);
    if (l > 0.01) setMove(mx / l, my / l); else setMove(0, 0);
    // unstick
    if (Math.hypot(P.x - BOT.lastPos[0], P.y - BOT.lastPos[1]) < 0.01 && l > 0.1) { BOT.stuck++; if (BOT.stuck > 40) { BOT.path = null; BOT.stuck = 0; tap('KeyK'); } } else BOT.stuck = 0;
    BOT.lastPos = [P.x, P.y];
  }
  BOT.tick = tick;
  // balance harness (?bot=1&sim=1): BOT.batch([0.8, 0.5, ...]) plays one full run per skill value headlessly and
  // resolves with { phase, fi, t, hits, cause, fl } per run (fl = "floor:time:hp" on each floor entry)
  BOT.runOne = async function (skill, hero) {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    BOT.skill = skill; BOT.started = false; BOT.path = null; BOT.skip = null;
    if (GAME.G.phase !== 'title') { document.getElementById('result').hidden = true; GAME.toTitle(); }
    await wait(800);
    if (hero != null) { BOT.started = true; GAME.startRun(hero); } else tick();
    for (let k = 0; k < 60 && GAME.G.phase !== 'play'; k++) await wait(250);
    const fl = []; let lastFi = -1, lastT = -1, same = 0;
    for (let i = 0; i < 120; i++) {
      if (GAME.G.paused && !GAME.G.choosing) UI.togglePause(false);
      const r = GAME.debug.sim(30);
      if (GAME.G.fi !== lastFi) { lastFi = GAME.G.fi; const P = GAME.G.P; fl.push(`${GAME.G.fi}:${Math.round(GAME.G.stats.time)}:${P.hp}/${P.maxHp}+${P.armor}`); }
      if (r.phase !== 'play') break;
      if (r.t === lastT) { if (++same > 8) { fl.push('STALL'); break; } await wait(600); } else same = 0;
      lastT = r.t;
      await wait(60);
    }
    const s = GAME.G.stats;
    return { skill, hero: GAME.G.P ? GAME.G.P.hero.id : '?', phase: GAME.G.phase, fi: GAME.G.fi, t: Math.round(s.time), hits: s.hits, cause: s.cause, fl: fl.join(' ') };
  };
  // heroes: optional list of hero indexes, cycled per run (e.g. [0,1,2,3,4])
  BOT.batch = async function (skills, heroes) { BOT.results = []; for (let i = 0; i < skills.length; i++) BOT.results.push(await BOT.runOne(skills[i], heroes ? heroes[i % heroes.length] : null)); BOT.results.done = true; return BOT.results; };
  if (!/[?&]sim=1/.test(location.search)) setInterval(tick, 33);
  // a periodic status line
  setInterval(() => {
    const G = window.GAME && GAME.G;
    if (!G || !G.P || !G.stats) return;
    BOT.log.push({ t: Math.round(G.stats.time), phase: G.phase, fi: G.fi, hp: G.P.hp, armor: G.P.armor, kills: G.stats.kills, rooms: G.stats.roomsCleared, hits: G.stats.hits, gold: G.P.gold, guns: G.P.guns.length, items: G.P.items.length });
  }, 5000);
})();
