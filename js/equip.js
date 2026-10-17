// RPG-mode equipment (오르카 작전 기록), Diablo II style:
//  · items: slot base + item level (ilvl) + required level, rarity 일반 / 마법 / 레어 / 유니크 / 세트, random affixes
//  · sockets: gems (6 kinds x 3 grades, 3 of a kind combine into the next grade) and runes (12); runes laid in order
//    into a white (일반) item with exactly that many sockets complete a runeword
//  · a 10 x 4 grid bag (items take 1x1 .. 2x3 cells) + a stash; drops fall on the floor in stage runs and are never lost
//  · the character: level / XP from runs; gear only counts in RPG mode (the classic run never sees it)
// Saved in lao_rpg_chars (stage_ui.js owns the list); icons are the original equipment art (assets/equip).
(function () {
  const KEY = 'lao_rpg_chars', BAG_W = 10, BAG_H = 4, STASH_W = 10, STASH_H = 8, MAX_LV = 60;
  // the account vault is shared by every operator but takes only gems and runes; gear and 재료 stay with their operator
  const VAULT_KEY = 'lao_rpg_vault', VAULT_W = 10, VAULT_H = 6;
  const GRID = { bag: [BAG_W, BAG_H], stash: [STASH_W, STASH_H], vault: [VAULT_W, VAULT_H] };
  const GNAME = { bag: '가방', stash: '개인 창고', vault: '계정 창고' };
  const vaultOk = (it) => !!(it && (it.gem || it.rune));
  // 재료: the operator's own currency — salvage gear for it, spend it on sockets and gem combines
  const SALVAGE = { normal: 2, magic: 5, rare: 12, unique: 30, set: 30 };
  const salvageOf = (it) => Math.round((SALVAGE[it.rar] || 2) * (1 + (it.ilvl || 1) / 20) + (it.rw ? 20 : 0));
  const sockCost = (it) => 15 * (it.sockets + 1);
  const UNSOCK = 30;
  const combCost = (g) => 10 * (g + 1);
  const ICON = (n) => `assets/equip/${n}.webp`;
  // rarity: the icon tier (T1-T4) carries the original's colour plate
  const RAR = {
    normal: { name: '일반', color: '#d8d8d8', hex: 0xd8d8d8, t: 1 },
    magic: { name: '마법', color: '#6a8cff', hex: 0x6a8cff, t: 2 },
    rare: { name: '레어', color: '#ffd84a', hex: 0xffd84a, t: 3 },
    unique: { name: '유니크', color: '#c8a050', hex: 0xd8a040, t: 4 },
    set: { name: '세트', color: '#40e060', hex: 0x40e060, t: 4 },
  };
  // stats: what each key does in a run (applied as P.mods / HP / shields)
  const STAT = {
    dmg: { n: '공격력', f: (v) => `+${v}%` }, hp: { n: '체력', f: (v) => `+${v * 25}` }, armor: { n: '방어막', f: (v) => `+${v}` },
    crit: { n: '치명타 확률', f: (v) => `+${v}%` }, rof: { n: '연사 속도', f: (v) => `+${v}%` }, speed: { n: '이동 속도', f: (v) => `+${v}%` },
    skill: { n: '궁극기 충전', f: (v) => `+${v}%` }, reload: { n: '재장전 속도', f: (v) => `+${v}%` }, ammo: { n: '최대 탄약', f: (v) => `+${v}%` },
    roll: { n: '회피 쿨타임', f: (v) => `-${v}%` }, block: { n: '피격 무효 확률', f: (v) => `${v}%` }, gold: { n: '부품 획득', f: (v) => `+${v}%` }, vamp: { n: '흡혈 확률', f: (v) => `+${v}%` },
    sk2: { n: '보조 스킬 쿨타임', f: (v) => `-${v}%` }, pierce: { n: '관통', f: (v) => `+${v}` },
  };
  // slots and their bases (원본 장비 이름): w x h cells, reqLv, sockets max, base stat (scaled by ilvl), icons
  const SLOTS = [
    // paper doll: 목걸이 · 헬멧 · 귀걸이 / 무기 코어 · 방어구 · 글러브 / 반지 · 신발 · 반지
    { id: 'amulet', name: '목걸이' }, { id: 'helm', name: '헬멧' }, { id: 'earring', name: '귀걸이' },
    { id: 'weapon', name: '무기 코어' }, { id: 'armor', name: '방어구' }, { id: 'gloves', name: '글러브' },
    { id: 'ring1', name: '반지', kind: 'ring' }, { id: 'boots', name: '신발' }, { id: 'ring2', name: '반지', kind: 'ring' },
  ];
  const BASES = [
    { id: 'core_atk', slot: 'weapon', name: '공격 회로', w: 1, h: 3, req: 1, sock: 4, base: { dmg: 4 }, icon: 'Chip_Atk' },
    { id: 'core_assault', slot: 'weapon', name: '돌격 OS', w: 1, h: 3, req: 12, sock: 4, base: { dmg: 6, rof: 3 }, icon: 'System_Assault' },
    { id: 'core_sniper', slot: 'weapon', name: '저격 OS', w: 1, h: 3, req: 24, sock: 5, base: { dmg: 9, crit: 2 }, icon: 'System_Sniper' },
    { id: 'core_antiarmor', slot: 'weapon', name: '대장갑 OS', w: 1, h: 3, req: 36, sock: 5, base: { dmg: 12, pierce: 1 }, icon: 'System_AntiArmor' },
    { id: 'armor_alloy', slot: 'armor', name: '특수 합금 장갑', w: 2, h: 3, req: 1, sock: 3, base: { hp: 1 }, icon: 'Sub_SpAlloyArmor' },
    { id: 'armor_space', slot: 'armor', name: '공간 장갑', w: 2, h: 3, req: 18, sock: 4, base: { hp: 2, armor: 1 }, icon: 'Sub_SpaceArmor' },
    { id: 'armor_def', slot: 'armor', name: '방어 OS', w: 2, h: 3, req: 32, sock: 4, base: { hp: 3, armor: 1 }, icon: 'System_Defense' },
    { id: 'helm_radar', slot: 'helm', name: '고급 레이더', w: 2, h: 2, req: 1, sock: 2, base: { crit: 2 }, icon: 'Sub_AdvRadar' },
    { id: 'helm_observer', slot: 'helm', name: '관측 장비', w: 2, h: 2, req: 16, sock: 3, base: { crit: 3, hp: 1 }, icon: 'Sub_Observer' },
    { id: 'helm_holo', slot: 'helm', name: '홀로그램 투영기', w: 2, h: 2, req: 30, sock: 3, base: { crit: 4, skill: 5 }, icon: 'Sub_Hologram' },
    { id: 'glove_bullet', slot: 'gloves', name: '특수 소총탄', w: 2, h: 2, req: 1, sock: 2, base: { rof: 3 }, icon: 'Sub_SpRifleBullet' },
    { id: 'glove_sight', slot: 'gloves', name: '특수 조준기', w: 2, h: 2, req: 14, sock: 2, base: { rof: 4, crit: 1 }, icon: 'Sub_SpSight' },
    { id: 'glove_pierce', slot: 'gloves', name: '철갑탄', w: 2, h: 2, req: 28, sock: 3, base: { rof: 5, dmg: 3 }, icon: 'Sub_ArmorPierce' },
    { id: 'boots_booster', slot: 'boots', name: '보조 부스터', w: 2, h: 2, req: 1, sock: 2, base: { speed: 3 }, icon: 'Sub_SubBooster' },
    { id: 'boots_speed', slot: 'boots', name: '고속 OS', w: 2, h: 2, req: 15, sock: 2, base: { speed: 4, roll: 4 }, icon: 'System_Highspd' },
    { id: 'boots_maneuver', slot: 'boots', name: '기동 OS', w: 2, h: 2, req: 30, sock: 3, base: { speed: 5, roll: 6 }, icon: 'System_Maneuver' },
    { id: 'belt_energy', slot: 'earring', name: '에너지 이어링', w: 1, h: 1, req: 1, sock: 1, base: { block: 2 }, icon: 'Sub_EnergyPack' },
    { id: 'belt_kit', slot: 'earring', name: '분석 이어피스', w: 1, h: 1, req: 14, sock: 2, base: { block: 2, hp: 1 }, icon: 'Sub_ExamKit' },
    { id: 'belt_stim', slot: 'earring', name: '각성 이어링', w: 1, h: 1, req: 28, sock: 2, base: { reload: 8, skill: 4 }, icon: 'Sub_Stimulant' },
    { id: 'ring_cri', slot: 'ring', name: '치명 칩', w: 1, h: 1, req: 1, sock: 1, base: { crit: 2 }, icon: 'Chip_Cri' },
    { id: 'ring_acc', slot: 'ring', name: '명중 칩', w: 1, h: 1, req: 8, sock: 1, base: { rof: 2 }, icon: 'Chip_Acc' },
    { id: 'ring_spd', slot: 'ring', name: '기동 칩', w: 1, h: 1, req: 20, sock: 1, base: { speed: 2, roll: 3 }, icon: 'Chip_Spd' },
    { id: 'amu_mark', slot: 'amulet', name: 'DS의 표식', w: 1, h: 1, req: 1, sock: 1, base: { skill: 5 }, icon: 'Sub_MarkOfDS' },
    { id: 'amu_barrier', slot: 'amulet', name: '방어막 발생기', w: 1, h: 1, req: 18, sock: 1, base: { armor: 1, skill: 4 }, icon: 'Sub_Barrier' },
    { id: 'amu_drone', slot: 'amulet', name: '정찰 드론', w: 1, h: 1, req: 34, sock: 2, base: { skill: 8, gold: 10 }, icon: 'Sub_SpyDrone' },
  ];
  // affixes: [stat, min, max] at ilvl 1, x(1 + ilvl/20) at depth
  const PREFIX = [
    { n: '날카로운', s: 'dmg', r: [3, 6] }, { n: '맹렬한', s: 'rof', r: [3, 6] }, { n: '단단한', s: 'hp', r: [1, 1] }, { n: '예리한', s: 'crit', r: [2, 4] },
    { n: '충전된', s: 'skill', r: [4, 8] }, { n: '관통하는', s: 'pierce', r: [1, 1], lv: 20 }, { n: '흡혈의', s: 'vamp', r: [1, 2], lv: 15 },
  ];
  const SUFFIX = [
    { n: '신속의', s: 'speed', r: [2, 4] }, { n: '견고한', s: 'block', r: [2, 4] }, { n: '장전의', s: 'reload', r: [5, 10] }, { n: '회피의', s: 'roll', r: [4, 8] },
    { n: '수집가의', s: 'gold', r: [8, 15] }, { n: '보호의', s: 'armor', r: [1, 1], lv: 12 }, { n: '전술의', s: 'sk2', r: [4, 8] },
  ];
  // uniques (fixed names / stats) and one set
  const UNIQUES = [
    { id: 'u_lion', base: 'core_assault', name: '브레스트 라이언 코어', req: 15, stats: { dmg: 22, rof: 10, crit: 4 } },
    { id: 'u_tyrant', base: 'core_antiarmor', name: '폭군의 OS', req: 40, stats: { dmg: 40, pierce: 2, skill: 15 } },
    { id: 'u_bulwark', base: 'armor_space', name: '철벽의 장갑', req: 22, stats: { hp: 4, armor: 2, roll: 10 } },
    { id: 'u_eye', base: 'helm_holo', name: '사이클롭스의 눈', req: 34, stats: { crit: 10, dmg: 12, skill: 12 } },
    { id: 'u_wind', base: 'boots_maneuver', name: '질풍의 부스터', req: 30, stats: { speed: 14, roll: 20, rof: 6 } },
    { id: 'u_ds', base: 'amu_mark', name: '드라큘라의 표식', req: 10, stats: { vamp: 4, skill: 12, dmg: 8 } },
  ];
  const SETS = { orca: { name: '오르카 친위대', bonus: { 2: { dmg: 10 }, 3: { hp: 2, armor: 1 }, 4: { skill: 20, speed: 8 } } } };
  const SET_ITEMS = [
    { id: 's_orca1', base: 'armor_alloy', set: 'orca', name: '오르카 친위대 흉갑', req: 6, stats: { hp: 2, dmg: 4 } },
    { id: 's_orca2', base: 'helm_radar', set: 'orca', name: '오르카 친위대 레이더', req: 6, stats: { crit: 4 } },
    { id: 's_orca3', base: 'glove_bullet', set: 'orca', name: '오르카 친위대 탄띠', req: 6, stats: { rof: 6 } },
    { id: 's_orca4', base: 'boots_booster', set: 'orca', name: '오르카 친위대 부스터', req: 6, stats: { speed: 6 } },
  ];
  // gems: [weapon effect, armour (armor/helm/gloves/boots) effect, jewel (ring/amulet/earring) effect] per grade
  const GEM_GRADE = ['조각난', '', '완벽한'];
  const GEMS = {
    ruby: { name: '루비', color: '#ff4a4a', icon: 'Chip_Atk', fx: [{ dmg: 3 }, { hp: 1 }, { dmg: 2 }], k: [1, 2, 3.5] },
    sapphire: { name: '사파이어', color: '#4a8cff', icon: 'Chip_Def', fx: [{ skill: 4 }, { armor: 1 }, { skill: 3 }], k: [1, 1.5, 2.5] },
    emerald: { name: '에메랄드', color: '#4adf6a', icon: 'Chip_Spd', fx: [{ rof: 3 }, { speed: 2 }, { roll: 4 }], k: [1, 2, 3] },
    topaz: { name: '토파즈', color: '#ffd04a', icon: 'Chip_Acc', fx: [{ crit: 2 }, { gold: 8 }, { crit: 2 }], k: [1, 2, 3] },
    amethyst: { name: '자수정', color: '#c06aff', icon: 'Chip_Cri', fx: [{ vamp: 1 }, { reload: 5 }, { sk2: 3 }], k: [1, 2, 3] },
    diamond: { name: '다이아몬드', color: '#e8f4ff', icon: 'Chip_Hp', fx: [{ dmg: 2, crit: 1 }, { hp: 1 }, { dmg: 2, skill: 2 }], k: [1, 1.5, 2.5] },
  };
  // runes: low -> high (drop weight falls with the order); each has a weapon / armour / jewel effect
  const RUNES = [
    { id: 'alpha', name: '알파', fx: [{ dmg: 4 }, { hp: 1 }, { crit: 1 }] },
    { id: 'beta', name: '베타', fx: [{ rof: 4 }, { speed: 2 }, { gold: 6 }] },
    { id: 'gamma', name: '감마', fx: [{ crit: 3 }, { roll: 4 }, { skill: 3 }] },
    { id: 'delta', name: '델타', fx: [{ reload: 8 }, { ammo: 10 }, { reload: 5 }] },
    { id: 'epsilon', name: '엡실론', fx: [{ skill: 6 }, { armor: 1 }, { sk2: 4 }] },
    { id: 'zeta', name: '제타', fx: [{ dmg: 7 }, { hp: 1 }, { dmg: 4 }] },
    { id: 'eta', name: '에타', fx: [{ vamp: 2 }, { roll: 6 }, { vamp: 1 }] },
    { id: 'theta', name: '세타', fx: [{ pierce: 1 }, { speed: 4 }, { crit: 3 }] },
    { id: 'iota', name: '이오타', fx: [{ rof: 7 }, { hp: 2 }, { rof: 4 }] },
    { id: 'kappa', name: '카파', fx: [{ dmg: 10 }, { armor: 1 }, { skill: 6 }] },
    { id: 'lambda', name: '람다', fx: [{ crit: 6 }, { speed: 6 }, { dmg: 6 }] },
    { id: 'omega', name: '오메가', fx: [{ dmg: 15, skill: 6 }, { hp: 3, armor: 1 }, { dmg: 8, crit: 4 }] },
  ];
  const RUNEWORDS = [
    { name: '선봉', slots: ['weapon'], runes: ['alpha', 'beta'], stats: { dmg: 15, rof: 8 } },
    { name: '수호', slots: ['armor', 'helm'], runes: ['epsilon', 'alpha', 'zeta'], stats: { hp: 3, armor: 2 } },
    { name: '질주', slots: ['boots'], runes: ['beta', 'theta'], stats: { speed: 12, roll: 15 } },
    { name: '포식', slots: ['weapon'], runes: ['eta', 'zeta', 'kappa'], stats: { dmg: 25, vamp: 4 } },
    { name: '심판', slots: ['weapon'], runes: ['lambda', 'kappa', 'omega', 'iota'], stats: { dmg: 45, crit: 10, pierce: 2 } },
    { name: '불굴', slots: ['armor'], runes: ['omega', 'iota', 'epsilon', 'zeta'], stats: { hp: 6, armor: 3, skill: 20 } },
  ];
  const classOf = (slot) => (slot === 'weapon' ? 0 : slot === 'ring' || slot === 'amulet' || slot === 'earring' ? 2 : 1);
  const baseOf = (id) => BASES.find((b) => b.id === id);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const ri = (a, b) => Math.floor(rnd(a, b + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const uid = () => 'i' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const add = (o, s, k = 1) => { for (const key in s) o[key] = (o[key] || 0) + Math.round(s[key] * k * 10) / 10; return o; };

  // ── item generation ──
  function genItem(ilvl, minRar) {
    const pool = BASES.filter((b) => b.req <= ilvl + 4);
    const b = pick(pool);
    // unique / set: 1.2 % from trash, more from elites / chests / bosses (minRar 0-3); otherwise the tier roll
    const roll = Math.random() + (minRar || 0) * 0.15;
    if (Math.random() < 0.006 + (minRar || 0) * 0.015) {
      const u = UNIQUES.concat(SET_ITEMS).filter((x) => x.req <= ilvl + 4);
      if (u.length) { const q = pick(u), B = baseOf(q.base); return { id: uid(), base: B.id, name: q.name, rar: q.set ? 'set' : 'unique', set: q.set || null, ilvl, req: q.req, stats: { ...q.stats }, base_: scaleBase(B, ilvl), sockets: Math.min(B.sock, ri(0, 1)), socketed: [], w: B.w, h: B.h }; }
    }
    const rar = roll > 0.92 ? 'rare' : roll > 0.58 ? 'magic' : 'normal';
    const it = { id: uid(), base: b.id, name: b.name, rar, ilvl, req: Math.max(b.req, Math.floor(ilvl * 0.8)), stats: {}, base_: scaleBase(b, ilvl), sockets: 0, socketed: [], w: b.w, h: b.h };
    const k = 1 + ilvl / 20;
    const roll1 = (a) => { const v = rnd(a.r[0], a.r[1]) * (a.s === 'hp' || a.s === 'armor' || a.s === 'pierce' ? 1 : k); it.stats[a.s] = Math.round(((it.stats[a.s] || 0) + v) * 10) / 10; if (a.s === 'hp' || a.s === 'armor' || a.s === 'pierce') it.stats[a.s] = Math.round(it.stats[a.s]); };
    const okA = (a) => !a.lv || a.lv <= ilvl;
    if (rar === 'magic') {
      const p = Math.random() < 0.7 ? pick(PREFIX.filter(okA)) : null, s = !p || Math.random() < 0.5 ? pick(SUFFIX.filter(okA)) : null;
      if (p) roll1(p); if (s) roll1(s);
      it.name = `${p ? p.n + ' ' : ''}${b.name}${s ? ' · ' + s.n.replace(/의$/, '') : ''}`;
      it.sockets = Math.random() < 0.3 ? ri(1, Math.min(2, b.sock)) : 0;
    } else if (rar === 'rare') {
      const n = ri(3, Math.min(6, 3 + Math.floor(ilvl / 15)));
      const all = PREFIX.concat(SUFFIX).filter(okA).sort(() => Math.random() - 0.5).slice(0, n);
      all.forEach(roll1);
      it.name = `${pick(['파멸', '강철', '심연', '폭풍', '여명', '혈흔', '서리', '황혼'])}의 ${pick(['송곳니', '외피', '맹세', '갈퀴', '파편', '심장', '눈동자', '날개'])}`;
      it.sub = b.name;
      it.sockets = Math.random() < 0.2 ? 1 : 0;
    } else {
      it.sockets = Math.random() < 0.55 ? ri(1, b.sock) : 0; // white items carry the sockets runewords need
    }
    return it;
  }
  function scaleBase(b, ilvl) { const k = 1 + ilvl / 25, o = {}; for (const s in b.base) o[s] = s === 'hp' || s === 'armor' || s === 'pierce' ? b.base[s] : Math.round(b.base[s] * k * 10) / 10; return o; }
  function genGem(ilvl) { const g = pick(Object.keys(GEMS)), gr = Math.random() < Math.min(0.5, ilvl / 80) ? 1 : 0; return { id: uid(), gem: g, grade: gr, w: 1, h: 1 }; }
  function genRune(ilvl) {
    const top = Math.min(RUNES.length - 1, 2 + Math.floor(ilvl / 6));
    let i = 0; while (i < top && Math.random() < 0.45) i++;
    return { id: uid(), rune: RUNES[i].id, w: 1, h: 1 };
  }
  // ── naming / stats ──
  const isGear = (it) => !!it.base;
  function itemName(it) {
    if (it.gem) { const G = GEMS[it.gem]; return `${GEM_GRADE[it.grade] ? GEM_GRADE[it.grade] + ' ' : ''}${G.name}`; }
    if (it.rune) return `${RUNES.find((r) => r.id === it.rune).name} 룬`;
    return it.rw ? `${it.rw}` : it.name;
  }
  const itemColor = (it) => (it.gem ? GEMS[it.gem].color : it.rune ? '#ff9a3a' : it.rw ? '#c8a050' : RAR[it.rar].color);
  function itemIcon(it) {
    if (it.gem) return ICON(`${GEMS[it.gem].icon}_T${it.grade + 1}`);
    if (it.rune) { const i = RUNES.findIndex((r) => r.id === it.rune); return ICON(`${['Sub_AntiFire', 'Sub_AntiCold', 'Sub_AntiLightning', 'Sub_AntiBarrier', 'System_Normal', 'System_Exp', 'System_AntiTrooper', 'System_AntiAir'][i % 8]}_T${i < 4 ? 1 : i < 8 ? 2 : i < 11 ? 3 : 4}`); }
    return ICON(`${baseOf(it.base).icon}_T${it.rw ? 4 : RAR[it.rar].t}`);
  }
  function socketStats(it) {
    const o = {}, c = classOf(baseOf(it.base).slot);
    (it.socketed || []).forEach((s) => { if (s.gem) add(o, GEMS[s.gem].fx[c], GEMS[s.gem].k[s.grade]); else if (s.rune) add(o, RUNES.find((r) => r.id === s.rune).fx[c]); });
    return o;
  }
  function itemStats(it) {
    if (!isGear(it)) return {};
    const o = add(add({}, it.base_ || {}), it.stats || {});
    add(o, socketStats(it));
    if (it.rwStats) add(o, it.rwStats);
    return o;
  }
  function checkRuneword(it) {
    if (!isGear(it) || it.rar !== 'normal' || it.rw || it.socketed.length !== it.sockets || it.socketed.some((s) => !s.rune)) return;
    const slot = baseOf(it.base).slot, seq = it.socketed.map((s) => s.rune).join(',');
    const w = RUNEWORDS.find((r) => r.runes.join(',') === seq && r.slots.includes(slot === 'ring' ? 'ring' : slot));
    if (w) { it.rw = w.name; it.rwStats = { ...w.stats }; return w; }
  }

  // ── characters ──
  function load() { try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); return v && Array.isArray(v.list) ? v : { v: 1, list: [] }; } catch (e) { return { v: 1, list: [] }; } }
  // the account store: the shared vault (gems / runes) and the shared 재료 balance
  function loadAcct() { try { const v = JSON.parse(localStorage.getItem(VAULT_KEY) || 'null'); return { list: v && Array.isArray(v.list) ? v.list.filter(vaultOk) : [], mats: Math.max(0, Math.floor(Number(v && v.mats) || 0)) }; } catch (e) { return { list: [], mats: 0 }; } }
  const loadVault = () => loadAcct().list;
  function saveAll(db) {
    try {
      const ch = db.list.find((x) => Array.isArray(x.vault)); if (ch) localStorage.setItem(VAULT_KEY, JSON.stringify({ v: 1, list: ch.vault, mats: Math.max(0, Math.floor(Number(ch.mats) || 0)) }));
      localStorage.setItem(KEY, JSON.stringify(db, (k, v) => (k === 'vault' || k === 'mats' ? undefined : v))); // vault and 재료 live in the account key
    } catch (e) { /* no storage */ }
  }
  function getChar(id) {
    const db = load(), c = db.list.find((x) => x.id === id) || null;
    if (c) {
      const A = loadAcct();
      c.vault = A.list;
      // 재료 is account-wide; an older save kept it per operator: every operator's leftover is folded in once (it leaves the operator on the next save)
      c.mats = A.mats + db.list.reduce((n, x) => n + Math.max(0, Math.floor(Number(x.mats) || 0)), 0);
      db.list.forEach((x) => { if (x !== c) delete x.mats; });
    }
    return { db, c };
  }
  function norm(c) { c.lv = c.lv || 1; c.xp = c.xp || 0; c.equip = c.equip || {}; c.bag = Array.isArray(c.bag) ? c.bag : []; c.stash = Array.isArray(c.stash) ? c.stash : []; c.mats = Math.max(0, Math.floor(Number(c.mats) || 0));
    if (c.equip.belt) { if (!c.equip.earring) c.equip.earring = c.equip.belt; delete c.equip.belt; }
    for (const k of ['bag', 'stash']) c[k].forEach((it) => { if (it.base && /^belt_/.test(it.base) && it.w !== 1) { it.w = 1; it.h = 1; } }); if (!Array.isArray(c.vault)) c.vault = loadVault(); return c; }
  const acctMats = () => loadAcct().mats;
  // the character keeps only its gear: the level is the run's own (back to Lv.1 every sortie, like the weapons)
  const gearPower = (st) => Math.round(100 + (st.dmg || 0) * 4 + (st.hp || 0) * 30 + (st.armor || 0) * 40 + (st.crit || 0) * 5 + (st.rof || 0) * 3 + (st.speed || 0) * 2 + (st.skill || 0) * 2 + (st.pierce || 0) * 25 + (st.reload || 0) + (st.roll || 0));
  // grid placement: items carry x / y in their container
  function fits(list, W, H, it, x, y, ignore) {
    if (x < 0 || y < 0 || x + it.w > W || y + it.h > H) return false;
    return !list.some((o) => o !== ignore && o.id !== (ignore && ignore.id) && x < o.x + o.w && o.x < x + it.w && y < o.y + o.h && o.y < y + it.h);
  }
  function place(list, W, H, it) {
    for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) if (fits(list, W, H, it, x, y)) { it.x = x; it.y = y; list.push(it); return true; }
    return false;
  }
  function stow(c, it) { if (place(c.bag, BAG_W, BAG_H, it)) return 'bag'; if (place(c.stash, STASH_W, STASH_H, it)) return 'stash'; return null; }
  function charStats(c) {
    const o = {};
    const sets = {};
    Object.values(c.equip).forEach((it) => { if (!it) return; add(o, itemStats(it)); if (it.set) sets[it.set] = (sets[it.set] || 0) + 1; });
    for (const k in sets) { const S = SETS[k]; for (const n in S.bonus) if (sets[k] >= +n) add(o, S.bonus[n]); }
    return o;
  }

  // ── run hooks ──
  let runChar = null, applied = null;
  function apply(P, st) {
    const m = P.mods;
    applied = { st, before: { dmg: m.dmg, rof: m.rof, crit: m.crit, speed: m.speed, skill: m.skill, reload: m.reload, ammo: m.ammo, rollCd: m.rollCd, sk2cd: m.sk2cd, pierce: m.pierce, maxHp: P.maxHp, armor: P.armor } };
    st = { ...st, speed: Math.min(15, st.speed || 0), roll: Math.min(25, st.roll || 0), block: Math.min(25, st.block || 0) }; applied.st = st; // gear caps
    P.gearBlock = (st.block || 0) / 100;
    m.dmg *= 1 + (st.dmg || 0) / 100; m.rof *= 1 + (st.rof || 0) / 100; m.crit += (st.crit || 0) / 100; m.speed *= 1 + (st.speed || 0) / 100;
    m.skill *= 1 + (st.skill || 0) / 100; m.reload *= 1 + (st.reload || 0) / 100; m.ammo *= 1 + (st.ammo || 0) / 100; m.rollCd *= Math.max(0.4, 1 - (st.roll || 0) / 100);
    P.gearGold = (st.gold || 0) / 100; P.gearVamp = (st.vamp || 0) / 100; m.sk2cd = (m.sk2cd || 1) * Math.max(0.5, 1 - (st.sk2 || 0) / 100); m.pierce = (m.pierce || 0) + (st.pierce || 0);
    P.maxHp += Math.round(st.hp || 0); P.hp += Math.round(st.hp || 0); P.armor += Math.round(st.armor || 0);
  }
  function unapply(P) {
    if (!applied) return;
    const b = applied.before, m = P.mods;
    // multiplicative mods are divided back out (other buffs taken during the run stay)
    const st = applied.st;
    m.dmg /= 1 + (st.dmg || 0) / 100; m.rof /= 1 + (st.rof || 0) / 100; m.crit -= (st.crit || 0) / 100; m.speed /= 1 + (st.speed || 0) / 100;
    m.skill /= 1 + (st.skill || 0) / 100; m.reload /= 1 + (st.reload || 0) / 100; m.ammo /= 1 + (st.ammo || 0) / 100; m.rollCd /= Math.max(0.4, 1 - (st.roll || 0) / 100);
    P.gearGold = 0; P.gearVamp = 0; m.sk2cd /= Math.max(0.5, 1 - (st.sk2 || 0) / 100); m.pierce -= (st.pierce || 0);
    const hp = Math.round(st.hp || 0); P.maxHp -= hp; P.hp = Math.max(1, Math.min(P.maxHp, P.hp - hp)); P.armor = Math.max(0, P.armor - Math.round(st.armor || 0));
    applied = null; void b;
  }
  function onRunStart(G) {
    runChar = null; applied = null;
    const id = G.runOpts && G.runOpts.charId;
    if (!id) return;
    const { c } = getChar(id); if (!c) return;
    norm(c); runChar = id;
    apply(G.P, charStats(c));
    G.runGear = { items: 0 };
  }
  function reapply(G) { if (!runChar || !G.P) return; const { c } = getChar(runChar); if (!c) return; unapply(G.P); apply(G.P, charStats(norm(c))); }
  const ilvlNow = () => { const G = GAME.G; return 1 + (G.stageI || 0) * 9 + (G.diff ? ['easy', 'normal', 'hard'].indexOf(G.diff.id) * 5 : 0) + G.fi * 2; };
  function drop(x, y, it) { if (GAME.dropGear) GAME.dropGear(x, y, it); }
  function onKill(e) {
    if (!runChar) return;
    const P = GAME.G.P;
    if (P && P.gearVamp && P.hp < P.maxHp && Math.random() < P.gearVamp) { P.hp++; SFX.play('reinforce', 0.4); } // 흡혈: a kill can mend half a heart
    const lv = ilvlNow(), r = Math.random();
    if (e.golden) { // 보물 철충 jackpot
      for (let i = 0; i < 4; i++) drop(e.x + Math.cos(i * 1.6) * 1.2, e.y + Math.sin(i * 1.6) * 1.2, genItem(lv + 2, 2));
      drop(e.x, e.y + 1.4, genGem(lv + 4)); drop(e.x + 1, e.y - 1, genGem(lv + 4)); drop(e.x - 1, e.y - 1, genRune(lv + 6));
      const db = load(), c = db.list.find((x) => x.id === runChar); if (c) { const A = loadAcct(); localStorage.setItem(VAULT_KEY, JSON.stringify({ v: 1, list: A.list, mats: A.mats + 40 })); }
      UI.banner('clear', '보물 철충 처치!', '장비 4 · 보석 2 · 룬 1 · 재료 +40'); SFX.play('pickSS', 1);
      return;
    }
    if (r < (e.elite ? 0.12 : 0.008)) drop(e.x, e.y, genItem(lv, e.elite ? 1 : 0));
    else if (r < (e.elite ? 0.2 : 0.016)) drop(e.x, e.y, genGem(lv));
    else if (r < (e.elite ? 0.25 : 0.02)) drop(e.x, e.y, genRune(lv));
  }
  function onChest(o) { if (runChar && Math.random() < 0.2 + o.rank * 0.08) drop(o.x + 0.8, o.y, genItem(ilvlNow(), o.rank)); }
  function onBoss(x, y, mid) {
    if (!runChar) return;
    const lv = ilvlNow() + (mid ? 0 : 3);
    for (let i = 0; i < (mid ? 1 : 2); i++) drop(x + (i - 1) * 1.6, y - 1.2, genItem(lv, mid ? 1 : 2));
    drop(x, y - 2.4, genRune(lv + 4)); if (Math.random() < 0.6) drop(x + 1.6, y - 2.4, genGem(lv));
  }
  // picked up: straight into the character's save (never lost, win or lose)
  function collect(it) {
    if (!runChar) return true;
    const { db, c } = getChar(runChar); if (!c) return true;
    norm(c);
    const where = stow(c, it);
    if (!where) { UI.toast('가방과 창고가 가득 찼습니다', 'warn'); SFX.play('fail', 0.5); return false; }
    saveAll(db);
    if (GAME.G.runGear) GAME.G.runGear.items++;
    SFX.play(it.rar === 'unique' || it.rar === 'set' ? 'pickSS' : 'uiEquip', 0.8);
    UI.toast(`<span style="color:${itemColor(it)}">${esc(itemName(it))}</span> 획득${where === 'stash' ? ' (창고)' : ''}`, it.rar === 'unique' || it.rar === 'set' || it.rar === 'rare' ? 'gem' : '');
    return true;
  }
  function onRunEnd(G, win) {
    if (!runChar) return;
    const { db, c } = getChar(runChar); if (!c) return;
    norm(c);
    G.stats.charGear = G.runGear ? G.runGear.items : 0; // items picked up this run (already saved)
    { const s = G.stats, dm = G.diff ? [1, 1.25, 1.5][['easy', 'normal', 'hard'].indexOf(G.diff.id)] : 1; const m = Math.round((s.kills * 0.15 + s.roomsCleared * 1 + s.bosses * 8 + (win ? 15 : 0)) * dm * (1 + (G.stageI || 0) * 0.12)); c.mats = Math.max(0, Math.floor(Number(c.mats) || 0)) + m; s.charMats = m; setTimeout(() => UI.toast(`재료 +${m} 획득`, 'gem'), 1500); }
    if (G.stats.charGear) setTimeout(() => UI.toast(`${esc(c.name)} — 이번 작전 장비 ${G.stats.charGear}개 회수 (보관 완료)`, 'gem'), 900);
    saveAll(db);
    runChar = null; applied = null;
  }
  // ground sprite: the item's own icon
  const texCache = {};
  function tex(it) {
    const url = itemIcon(it);
    if (!texCache[url]) { const t = new THREE.TextureLoader().load(url); t.minFilter = THREE.LinearFilter; texCache[url] = t; }
    return texCache[url];
  }
  const glow = (it) => (it.gem ? parseInt(GEMS[it.gem].color.slice(1), 16) : it.rune ? 0xff9a3a : RAR[it.rar].hex);

  // ── inventory window (I) ──
  // drag an item onto a slot to equip it, onto the grid to move it, a gem / rune onto a gear item to socket it;
  // double-click equips / unequips; the tooltip compares a bag item with what that slot already wears
  let invChar = null, selItem = null, socketing = null, wasPaused = false, tab = 'bag', drag = null, noClick = 0;
  let CELL = 50; // recomputed per render: the 10-wide bag always fits the window
  function el(q) { return document.querySelector(q); }
  function statLines(st, cmp) {
    const keys = Object.keys(STAT).filter((k) => (st[k] || (cmp && cmp[k])) && STAT[k]);
    return keys.map((k) => {
      const v = Math.round((st[k] || 0) * 10) / 10, d = cmp ? Math.round((v - (cmp[k] || 0)) * 10) / 10 : 0; // one decimal: sums of rolled values carry float noise
      return `<li${v ? '' : ' class="zero"'}><span>${STAT[k].n}</span><b>${v ? STAT[k].f(v) : '—'}</b>${cmp && d ? `<em class="${(k === 'roll' || k === 'sk2' ? -d : d) > 0 ? 'up' : 'dn'}">${d > 0 ? '▲' : '▼'}${Math.abs(d)}</em>` : ''}</li>`;
    }).join('');
  }
  const slotFor = (c, it) => { const s0 = baseOf(it.base).slot; return s0 === 'ring' ? (!c.equip.ring1 ? 'ring1' : !c.equip.ring2 ? 'ring2' : 'ring1') : s0; };
  const slotOk = (it, slot) => { if (!isGear(it)) return false; const s0 = baseOf(it.base).slot; return s0 === slot || (s0 === 'ring' && /^ring/.test(slot)); };
  function tooltip(it, c) {
    if (!it) return `<div class="ivempty"><b>아이템을 선택하세요</b><ul class="ivhelp">${matchMedia('(pointer: coarse)').matches ? '<li><b>탭</b>으로 선택 → 빈 슬롯을 <b>탭</b>하면 장착</li><li><b>끌어 놓기</b>로 장착 · 이동 · 소켓에 박기</li>' : '<li><b>끌어 놓기</b>로 장착 · 이동 · 소켓에 박기</li><li><b>더블클릭</b>으로 장착 / 해제</li>'}<li>젬 3개 → <b>합성</b>으로 상위 등급</li><li>흰색(일반) 장비 + 룬 순서 = <b>룬워드</b></li></ul></div>`;
    const col = itemColor(it);
    const head = (sub) => `<div class="tth" style="--rc:${col}"><i style="background-image:url(${itemIcon(it)})"></i><div><b>${esc(itemName(it))}</b><small>${sub}</small></div></div>`;
    if (it.gem) { const G = GEMS[it.gem], k = G.k[it.grade]; return head(`보석 · 등급 ${it.grade + 1} / 3`) + `<div class="ttb"><small class="h">무기</small><ul>${statLines(add({}, G.fx[0], k))}</ul><small class="h">방어구</small><ul>${statLines(add({}, G.fx[1], k))}</ul><small class="h">장신구</small><ul>${statLines(add({}, G.fx[2], k))}</ul></div>`; }
    if (it.rune) { const R = RUNES.find((r) => r.id === it.rune); return head(`룬 · ${RUNES.indexOf(R) + 1}단계`) + `<div class="ttb"><small class="h">무기</small><ul>${statLines(R.fx[0])}</ul><small class="h">방어구</small><ul>${statLines(R.fx[1])}</ul><small class="h">장신구</small><ul>${statLines(R.fx[2])}</ul></div>`; }
    const B = baseOf(it.base), st = itemStats(it);
    const worn = c && Object.values(c.equip).some((o) => o && o.id === it.id);
    const other = !worn && c ? c.equip[slotFor(c, it)] : null;
    const sock = it.sockets ? `<div class="ivsock">${Array.from({ length: it.sockets }, (_, i) => { const s = it.socketed[i]; return `<i class="${s ? 'on' : ''}" title="${s ? esc(itemName(s)) : '빈 소켓'}" style="${s ? `background-image:url(${itemIcon(s)})` : ''}"></i>`; }).join('')}<small>소켓 ${it.socketed.length} / ${it.sockets}</small></div>` : '';
    return head(`${RAR[it.rar].name} · ${it.sub ? esc(it.sub) : B.name} · ${SLOTS.find((s) => s.id === B.slot || (B.slot === 'ring' && s.kind === 'ring')).name}`)
      + `<div class="ttb"><p class="slotl">장착 부위 <b>${SLOTS.find((s) => s.id === B.slot || (B.slot === 'ring' && s.kind === 'ring')).name}</b></p>${it.rw ? `<p class="rw">룬워드 「${esc(it.rw)}」</p>` : ''}<p class="meta">아이템 레벨 <b>${it.ilvl}</b>${it.set ? ` · <span class="set">${SETS[it.set].name}</span>` : ''}${worn ? ' · <span class="worn">장착 중</span>' : ''}</p>
      ${sock}<ul>${statLines(st, other ? itemStats(other) : !worn ? {} : null)}</ul>${it.socketed && it.socketed.length ? `<small class="h">소켓 효과 (위 합계에 포함)</small><ul class="sockfx">${statLines(socketStats(it))}</ul>` : ''}${other ? `<p class="cmp">▲▼ 장착 중인 「${esc(itemName(other))}」과 비교</p>` : ''}<p class="cmp">분해 시 재료 +${salvageOf(it)}</p></div>`;
  }
  function bagHtml(list, W, H, which) {
    return `<div class="ivgrid" data-c="${which}" style="--w:${W};--h:${H};--cell:${CELL}px">${list.map((it) => `<button type="button" class="ivit r_${it.gem ? 'gem' : it.rune ? 'rune' : it.rw ? 'rw' : it.rar}${selItem && selItem.id === it.id ? ' on' : ''}" data-id="${it.id}" data-c="${which}" style="left:${it.x * CELL}px;top:${it.y * CELL}px;width:${it.w * CELL - 2}px;height:${it.h * CELL - 2}px;--rc:${itemColor(it)}" aria-label="${esc(itemName(it))}"><i style="background-image:url(${itemIcon(it)})"></i>${it.sockets ? `<em>${'●'.repeat(it.socketed.length)}${'○'.repeat(it.sockets - it.socketed.length)}</em>` : ''}</button>`).join('')}</div>`;
  }
  function render() {
    const ov = el('#invOv'); if (!ov || ov.hidden) return;
    const { c } = getChar(invChar); if (!c) { ov.hidden = true; return; }
    norm(c);
    CELL = window.innerWidth <= 900 || window.innerWidth < window.innerHeight ? 40 : 52; // fixed: the window scales as a whole (--fsi), cells never change size
    const H = window.DATA.HEROES.find((h) => h.id === c.hero) || {};
    const st = charStats(c);
    const doll = SLOTS.map((s) => { const it = c.equip[s.id]; return `<button type="button" class="ivslot s_${s.id}${it ? ' full' : ''}${selItem && isGear(selItem) && !Object.values(c.equip).some((o) => o && o.id === selItem.id) && slotOk(selItem, s.id) ? ' can' : ''}${selItem && it && selItem.id === it.id ? ' on' : ''}" data-slot="${s.id}" style="--rc:${it ? itemColor(it) : 'rgba(255,255,255,0.18)'}" aria-label="${s.name}${it ? ' — ' + esc(itemName(it)) : ''}">${it ? `<i style="background-image:url(${itemIcon(it)})"></i>` : ''}<span>${s.name}</span></button>`; }).join('');
    const sel = selItem;
    const where = sel ? (find(c, sel.id) || {}).where : null, inBag = where === 'bag' || where === 'stash' || where === 'vault';
    const equipped = sel && Object.values(c.equip).some((o) => o && o.id === sel.id);
    const canCombine = sel && sel.gem && sel.grade < 2 && c.bag.concat(c.stash, c.vault).filter((o) => o.gem === sel.gem && o.grade === sel.grade).length >= 3;
    const gearSel = sel && isGear(sel), canSock = gearSel && !sel.rw && sel.sockets < baseOf(sel.base).sock, canUnsock = gearSel && sel.socketed && sel.socketed.length;
    const acts = !sel ? '' : [
      inBag && isGear(sel) ? '<button type="button" class="ia pri" data-a="equip">장착</button>' : '',
      equipped ? '<button type="button" class="ia" data-a="unequip">해제</button>' : '',
      inBag && (sel.gem || sel.rune) ? `<button type="button" class="ia pri${socketing ? ' on' : ''}" data-a="socket">${socketing ? '장비를 클릭하세요…' : '소켓에 박기'}</button>` : '',
      canCombine ? `<button type="button" class="ia pri" data-a="combine">합성 3→1 · 재료 ${combCost(sel.grade)}</button>` : '',
      canSock ? `<button type="button" class="ia" data-a="addsock">소켓 추가 · 재료 ${sockCost(sel)}</button>` : '',
      canUnsock ? `<button type="button" class="ia" data-a="unsock">소켓 비우기 · 재료 ${UNSOCK}</button>` : '',
      where === 'bag' ? '<button type="button" class="ia" data-a="move:stash">개인 창고로</button>' : '',
      inBag && vaultOk(sel) && where !== 'vault' ? '<button type="button" class="ia" data-a="move:vault">계정 창고로</button>' : '',
      where === 'stash' || where === 'vault' ? '<button type="button" class="ia" data-a="move:bag">가방으로</button>' : '',
      gearSel && inBag ? `<button type="button" class="ia warn" data-a="salvage">분해 · 재료 +${salvageOf(sel)}</button>` : '',
      inBag && !gearSel ? '<button type="button" class="ia warn" data-a="drop">버리기</button>' : '',
    ].join('');
    const used = (list) => list.reduce((n, o) => n + o.w * o.h, 0);
    ov.querySelector('.ivwin').innerHTML = `<div class="ivh"><i class="ivpt" style="background-image:url(assets/ui/f_${c.hero}.webp);--c:${H.color || '#888'}"></i>
        <div class="ivn"><small>INVENTORY · ${H.name || ''}</small><h3>${esc(c.name)}</h3></div>
        <div class="ivlv"><small>아이템 레벨 합</small><b class="num">${Object.values(c.equip).reduce((n, o) => n + (o && o.ilvl ? o.ilvl : 0), 0)}</b><small>전투력 ${gearPower(st).toLocaleString()}</small><span class="ivmat" title="모든 대원 공용 · 장비 분해 · 작전 보상으로 획득 — 소켓 추가 · 소켓 비우기 · 보석 합성에 사용"><i></i>재료 (공용) <b class="num">${c.mats.toLocaleString()}</b></span></div>
        <button type="button" class="ivx" id="invClose" aria-label="닫기">닫기 <kbd>I</kbd></button></div>
      <div class="ivbody">
        <div class="ivleft"><div class="ivdoll">${doll}</div><div class="ivstats"><small>장비 능력치 합계 · 작전 시작 시 적용</small><ul>${statLines(st) || '<li class="zero"><span>장착한 장비 없음</span><b>—</b></li>'}</ul></div></div>
        <div class="ivmid"><div class="ivtabs">${['bag', 'stash', 'vault'].map((k) => `<button type="button" data-t="${k}" class="${tab === k ? 'on' : ''}${k === 'vault' ? ' vt' : ''}">${GNAME[k]} <small>${used(c[k])} / ${GRID[k][0] * GRID[k][1]}</small></button>`).join('')}</div>
          ${bagHtml(c[tab], GRID[tab][0], GRID[tab][1], tab)}${tab === 'vault' ? '<p class="ivvt">모든 대원이 함께 쓰는 창고 · <b>룬과 보석만</b> 보관할 수 있습니다</p>' : tab === 'stash' ? '<p class="ivvt">이 대원만 쓰는 창고 · 장비 · 룬 · 보석 보관</p>' : ''}</div>
        <div class="ivtip">${tooltip(sel, c)}<div class="ivacts">${acts}</div></div>
      </div>`;
  }
  function find(c, id) {
    for (const k of ['bag', 'stash', 'vault']) { const it = (c[k] || []).find((o) => o.id === id); if (it) return { it, where: k }; }
    for (const s in c.equip) if (c.equip[s] && c.equip[s].id === id) return { it: c.equip[s], where: 'equip', slot: s };
    return null;
  }
  function equipTo(c, f, slot) {
    const it = f.it;
    if (f.where === 'equip') { if (f.slot === slot) return false; const o = c.equip[slot]; c.equip[slot] = it; if (o) c.equip[f.slot] = o; else delete c.equip[f.slot]; return true; } // ring1 <-> ring2
    c[f.where] = c[f.where].filter((o) => o.id !== it.id);
    const old = c.equip[slot]; c.equip[slot] = it; delete it.x; delete it.y;
    if (old && !stow(c, old)) { c.equip[slot] = old; stow(c, it); UI.toast('가방이 가득 찼습니다', 'warn'); return false; }
    SFX.play('uiEquip', 0.8); return true;
  }
  async function act(a) {
    const { db, c } = getChar(invChar); if (!c || !selItem) return;
    norm(c);
    const f = find(c, selItem.id); if (!f) return;
    const it = f.it;
    if (a === 'equip') { if (!equipTo(c, f, slotFor(c, it))) return render(); }
    else if (a === 'unequip') { if (!stow(c, it)) return UI.toast('가방이 가득 찼습니다', 'warn'); delete c.equip[f.slot]; SFX.play('uiEquip', 0.6); }
    else if (a === 'drop') {
      const ok = window.STAGE_UI && STAGE_UI.confirm ? await STAGE_UI.confirm('아이템 버리기', `<b style="color:${itemColor(it)}">${esc(itemName(it))}</b>을(를) 버립니다. 되돌릴 수 없습니다.`, '버리기', { danger: it.rar === 'unique' || it.rar === 'set' || it.rar === 'rare' || !!it.rw }) : true;
      if (!ok) return;
      const r2 = getChar(invChar); if (!r2.c) return; norm(r2.c); const f2 = find(r2.c, it.id); if (!f2) return;
      r2.c[f2.where] = r2.c[f2.where].filter((o) => o.id !== it.id); selItem = null; saveAll(r2.db); reapply(GAME.G); SFX.play('swing', 0.4); render(); return;
    } else if (a.startsWith('move:')) {
      const to = a.slice(5), [W, H] = GRID[to];
      if (to === 'vault' && !vaultOk(it)) { SFX.play('fail', 0.4); return UI.toast('계정 창고에는 룬 · 보석만 보관할 수 있습니다', 'warn'); }
      const rest = c[f.where].filter((o) => o.id !== it.id);
      if (!place(c[to], W, H, it)) return UI.toast(`${GNAME[to]}가 가득 찼습니다`, 'warn');
      c[f.where] = rest; tab = to; SFX.play('uiPick', 0.4);
    } else if (a === 'combine') {
      const cost = combCost(it.grade);
      if (c.mats < cost) { SFX.play('fail', 0.5); return UI.toast(`재료가 부족합니다 (${c.mats} / ${cost})`, 'warn'); }
      const same = c.bag.concat(c.stash, c.vault).filter((o) => o.gem === it.gem && o.grade === it.grade).slice(0, 3), ids = new Set(same.map((o) => o.id));
      c.bag = c.bag.filter((o) => !ids.has(o.id)); c.stash = c.stash.filter((o) => !ids.has(o.id)); c.vault = c.vault.filter((o) => !ids.has(o.id));
      const up = { id: uid(), gem: it.gem, grade: it.grade + 1, w: 1, h: 1 };
      const into = f.where === 'vault' ? (place(c.vault, VAULT_W, VAULT_H, up) ? 'vault' : stow(c, up)) : stow(c, up);
      if (!into) { UI.toast('보관할 칸이 없습니다', 'warn'); return render(); }
      c.mats -= cost; selItem = up; SFX.play('rankUp', 0.7); UI.toast(`${itemName(up)} 합성 · 재료 -${cost}`, 'gem');
    } else if (a === 'addsock') {
      const cost = sockCost(it);
      if (c.mats < cost) { SFX.play('fail', 0.5); return UI.toast(`재료가 부족합니다 (${c.mats} / ${cost})`, 'warn'); }
      c.mats -= cost; it.sockets++; SFX.play('reinforce', 0.6); UI.toast(`소켓 추가 — ${it.sockets}개 · 재료 -${cost}`, 'gem');
    } else if (a === 'unsock') {
      if (c.mats < UNSOCK) { SFX.play('fail', 0.5); return UI.toast(`재료가 부족합니다 (${c.mats} / ${UNSOCK})`, 'warn'); }
      const back = it.socketed.map((x) => ({ id: uid(), w: 1, h: 1, ...x }));
      const trial = { bag: c.bag.slice(), stash: c.stash.slice() }, tc = { bag: trial.bag, stash: trial.stash };
      if (!back.every((b) => place(tc.bag, BAG_W, BAG_H, b) || place(tc.stash, STASH_W, STASH_H, b))) { SFX.play('fail', 0.5); return UI.toast('돌려받을 칸이 부족합니다', 'warn'); }
      c.bag = tc.bag; c.stash = tc.stash; it.socketed = []; if (it.rw) { delete it.rw; delete it.rwStats; }
      c.mats -= UNSOCK; SFX.play('uiEquip', 0.7); UI.toast(`보석 · 룬 ${back.length}개 회수 · 재료 -${UNSOCK}`, 'gem');
    } else if (a === 'salvage') {
      const gain = salvageOf(it), big = it.rar === 'unique' || it.rar === 'set' || it.rar === 'rare' || it.rw || (it.socketed && it.socketed.length);
      if (big) {
        const ok = window.STAGE_UI && STAGE_UI.confirm ? await STAGE_UI.confirm('장비 분해', `<b style="color:${itemColor(it)}">${esc(itemName(it))}</b>을(를) 분해해 <b>재료 ${gain}</b>를 얻습니다.${it.socketed && it.socketed.length ? '<br>박혀 있는 보석 · 룬도 함께 사라집니다.' : ''}`, '분해', { danger: true }) : true;
        if (!ok) return;
        const r2 = getChar(invChar); if (!r2.c) return; norm(r2.c); const f2 = find(r2.c, it.id); if (!f2) return;
        r2.c[f2.where] = r2.c[f2.where].filter((o) => o.id !== it.id); r2.c.mats += gain; selItem = null; saveAll(r2.db); SFX.play('crate', 0.7); UI.toast(`분해 — 재료 +${gain}`, 'gem'); render(); return;
      }
      c[f.where] = c[f.where].filter((o) => o.id !== it.id); c.mats += gain; selItem = null; SFX.play('crate', 0.7); UI.toast(`분해 — 재료 +${gain}`, 'gem');
    } else if (a === 'socket') { socketing = socketing ? null : it.id; render(); return; }
    saveAll(db); reapply(GAME.G); render();
  }
  function socketInto(target, srcId) {
    const { db, c } = getChar(invChar); if (!c) return;
    norm(c);
    const f = find(c, srcId || socketing), t = find(c, target.id); socketing = null;
    if (!f || !t || !isGear(t.it) || !(f.it.gem || f.it.rune)) return render();
    if (t.it.socketed.length >= t.it.sockets) { SFX.play('fail', 0.5); UI.toast(t.it.sockets ? '빈 소켓이 없습니다' : '소켓이 없는 장비입니다', 'warn'); return render(); }
    c[f.where] = c[f.where].filter((o) => o.id !== f.it.id);
    const s = { gem: f.it.gem, grade: f.it.grade, rune: f.it.rune };
    Object.keys(s).forEach((k) => s[k] == null && delete s[k]);
    t.it.socketed.push(s);
    const w = checkRuneword(t.it);
    SFX.play(w ? 'pickSS' : 'uiEquip', 0.8);
    UI.toast(w ? `룬워드 완성 — ${w.name}!` : `${itemName(f.it)} → ${esc(itemName(t.it))}`, 'gem');
    selItem = t.it; saveAll(db); reapply(GAME.G); render();
  }
  // drag and drop (pointer events: mouse, pen and touch alike)
  function wrongSlot(it, s) {
    SFX.play('fail', 0.4);
    const need = isGear(it) ? SLOTS.find((x) => slotOk(it, x.id)).name : null;
    UI.toast(need ? `${need} 슬롯 전용 장비입니다` : '보석 · 룬은 장비 위에 놓아 소켓에 박습니다', 'warn');
    if (s) { s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake'); }
  }
  function dragStart(e, b) {
    const { c } = getChar(invChar); if (!c) return; norm(c);
    const it = b.classList.contains('ivslot') ? c.equip[b.dataset.slot] : (find(c, b.dataset.id) || {}).it;
    if (!it) return;
    drag = { it, b, x0: e.clientX, y0: e.clientY, on: false, ghost: null };
  }
  function dragMove(e) {
    if (!drag) return;
    if (!drag.on) {
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
      drag.on = true; selItem = drag.it; render();
      const g = document.createElement('div'); g.className = 'ivghost'; g.style.cssText = `width:${drag.it.w * CELL}px;height:${drag.it.h * CELL}px;--rc:${itemColor(drag.it)};background-image:url(${itemIcon(drag.it)})`;
      document.body.appendChild(g); drag.ghost = g; el('#invOv').classList.add('dragging');
      { const cc = getChar(invChar).c; const low = false; document.querySelectorAll('#invOv .ivslot').forEach((x) => x.classList.add(slotOk(drag.it, x.dataset.slot) ? (low ? 'dlock' : 'dcan') : 'nope')); }
    }
    drag.ghost.style.transform = `translate(${e.clientX - drag.it.w * CELL / 2}px, ${e.clientY - drag.it.h * CELL / 2}px)`;
    $$hl(e);
  }
  function $$hl(e) {
    document.querySelectorAll('#invOv .hot').forEach((x) => x.classList.remove('hot', 'bad'));
    const t = document.elementFromPoint(e.clientX, e.clientY); if (!t) return;
    const s = t.closest('.ivslot'), it = t.closest('.ivit');
    if (s) s.classList.add('hot', slotOk(drag.it, s.dataset.slot) ? 'ok' : 'bad');
    else if (it && it.dataset.id !== drag.it.id && (drag.it.gem || drag.it.rune)) it.classList.add('hot');
  }
  function dragEnd(e) {
    const d = drag; drag = null;
    if (!d) return;
    if (d.ghost) d.ghost.remove();
    el('#invOv').classList.remove('dragging');
    document.querySelectorAll('#invOv .hot, #invOv .dcan, #invOv .nope, #invOv .dlock').forEach((x) => x.classList.remove('hot', 'bad', 'ok', 'dcan', 'nope', 'dlock'));
    if (!d.on) return;
    noClick = performance.now() + 250; // the click that ends a drag is not a selection toggle
    const t = document.elementFromPoint(e.clientX, e.clientY);
    const { db, c } = getChar(invChar); if (!c) return; norm(c);
    const f = find(c, d.it.id); if (!f) return;
    const s = t && t.closest('.ivslot'), tgtIt = t && t.closest('.ivit'), grid = t && t.closest('.ivgrid');
    if (s) { if (!slotOk(d.it, s.dataset.slot)) { wrongSlot(d.it, s); return render(); } if (equipTo(c, f, s.dataset.slot)) { saveAll(db); reapply(GAME.G); } return render(); }
    if (tgtIt && tgtIt.dataset.id !== d.it.id && (d.it.gem || d.it.rune)) { const tg = find(c, tgtIt.dataset.id); if (tg) return socketInto(tg.it, d.it.id); }
    if (grid) {
      const which = grid.dataset.c, [W, H] = GRID[which], r = grid.getBoundingClientRect();
      if (which === 'vault' && !vaultOk(d.it)) { SFX.play('fail', 0.4); UI.toast('계정 창고에는 룬 · 보석만 보관할 수 있습니다', 'warn'); return render(); }
      const x = Math.round((e.clientX - r.left) / CELL - d.it.w / 2), y = Math.round((e.clientY - r.top) / CELL - d.it.h / 2);
      const list = c[which].filter((o) => o.id !== d.it.id);
      if (!fits(list, W, H, d.it, x, y)) { SFX.play('fail', 0.4); return render(); }
      if (f.where === 'equip') delete c.equip[f.slot]; else c[f.where] = c[f.where].filter((o) => o.id !== d.it.id);
      d.it.x = x; d.it.y = y; c[which] = list.concat(d.it);
      saveAll(db); reapply(GAME.G); SFX.play('uiPick', 0.4); return render();
    }
    render();
  }
  function open(on, charId) {
    const ov = el('#invOv'); if (!ov) return;
    const G = window.GAME && GAME.G;
    if (on) {
      invChar = charId || runChar || (window.STAGE_UI && STAGE_UI.cur && STAGE_UI.cur());
      if (!invChar) { UI.toast('인벤토리는 오르카 작전 기록(RPG) 모드에서 사용합니다', 'warn'); return; }
      selItem = null; socketing = null;
      ov.hidden = false;
      if (G && G.phase === 'play') { wasPaused = G.paused; G.paused = true; }
      SFX.play('uiPick', 0.6); render();
    } else {
      ov.hidden = true; socketing = null;
      if (G && G.phase === 'play') G.paused = wasPaused;
      if (window.STAGE_UI && STAGE_UI.refresh) STAGE_UI.refresh();
    }
  }
  function init() {
    if (el('#invOv')) return;
    const ov = document.createElement('div');
    ov.id = 'invOv'; ov.hidden = true; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', '인벤토리');
    ov.innerHTML = '<div class="ivwin"></div>';

    document.body.appendChild(ov);
    ov.addEventListener('click', (e) => {
      const t = e.target;
      if (t.closest('#invClose')) return open(false); // (no close on a stray outside click: a missed drop never loses the window)
      if (performance.now() < noClick && t.closest('.ivit, .ivslot')) return;
      const tb = t.closest('.ivtabs button'); if (tb) { tab = tb.dataset.t; SFX.play('uiPick', 0.3); return render(); }
      const ab = t.closest('[data-a]'); if (ab) return act(ab.dataset.a);
      const b = t.closest('.ivit, .ivslot');
      if (b) {
        const { c } = getChar(invChar); if (!c) return; norm(c);
        if (b.classList.contains('ivslot') && selItem && !Object.values(c.equip).some((o) => o && o.id === selItem.id) && isGear(selItem)) {
          const f = find(c, selItem.id);
          if (f && !slotOk(selItem, b.dataset.slot)) { wrongSlot(selItem, b); return; }
          if (f && !c.equip[b.dataset.slot] || (f && c.equip[b.dataset.slot])) { const r3 = getChar(invChar); norm(r3.c); const f3 = find(r3.c, selItem.id); if (f3 && equipTo(r3.c, f3, b.dataset.slot)) { saveAll(r3.db); reapply(GAME.G); } return render(); }
        }
        const it = b.classList.contains('ivslot') ? c.equip[b.dataset.slot] : (find(c, b.dataset.id) || {}).it;
        if (!it) return;
        if (socketing && isGear(it)) return socketInto(it);
        selItem = selItem && selItem.id === it.id ? null : it; socketing = null; render(); SFX.play('uiPick', 0.4);
      }
    });
    ov.addEventListener('dblclick', (e) => {
      const b = e.target.closest('.ivit, .ivslot'); if (!b) return;
      const { c } = getChar(invChar); if (!c) return; norm(c);
      const it = b.classList.contains('ivslot') ? c.equip[b.dataset.slot] : (find(c, b.dataset.id) || {}).it;
      if (!it || !isGear(it)) return;
      selItem = it; act(b.classList.contains('ivslot') ? 'unequip' : 'equip');
    });
    ov.addEventListener('pointerdown', (e) => { const b = e.target.closest('.ivit, .ivslot.full'); if (b && e.button === 0) dragStart(e, b); });
    window.addEventListener('pointermove', dragMove);
    window.addEventListener('pointerup', dragEnd);
    // HUD button (in a stage run) and the I key
    const hb = document.createElement('button');
    hb.type = 'button'; hb.id = 'btnInv'; hb.innerHTML = '<i></i><span>가방</span><kbd>I</kbd>'; hb.hidden = true; hb.setAttribute('aria-label', '인벤토리 (I)');
    hb.onclick = () => open(true);
    document.body.appendChild(hb);
    setInterval(() => { const G = window.GAME && GAME.G; hb.hidden = !(G && G.phase === 'play' && runChar && !G.paused); }, 300);
    window.addEventListener('keydown', (e) => {
      if (e.code !== 'KeyI' || (e.target && /INPUT|TEXTAREA/.test(e.target.tagName))) return;
      const G = window.GAME && GAME.G; if (!G) return;
      const cf = document.getElementById('uiConfirm'); if (cf && !cf.hidden) return;
      if (!ov.hidden) { open(false); e.preventDefault(); return; }
      const nw = document.getElementById('rpgNewOv'); if (nw && !nw.hidden) return;
      if ((G.phase === 'play' && runChar && !G.choosing) || (G.phase === 'title' && window.STAGE_UI && STAGE_UI.cur && STAGE_UI.cur())) { open(true); e.preventDefault(); }
    }, true);
    window.addEventListener('keydown', (e) => { const cf = document.getElementById('uiConfirm'); if (!ov.hidden && e.code === 'Escape' && (!cf || cf.hidden)) { open(false); e.preventDefault(); e.stopImmediatePropagation(); } }, true);
  }
  window.EQUIP = { onRunStart, onKill, onChest, onBoss, onRunEnd, collect, tex, glow, reapply, open, charStats, gearPower, genItem, genGem, genRune, itemName, iconOf: itemIcon, SLOTS, RUNEWORDS, get runChar() { return runChar; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
