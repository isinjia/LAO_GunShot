// Game data: heroes, guns, passive items, enemies, bosses and floors.
(function () {
  // ranks of the original (B / A / S / SS): chest colours, gun / item quality
  const RANKS = [
    { key: 'B', color: '#63d34a', hex: 0x63d34a },
    { key: 'A', color: '#38b6ff', hex: 0x38b6ff },
    { key: 'S', color: '#ffc81e', hex: 0xffc81e },
    { key: 'SS', color: '#ff9420', hex: 0xff9420 },
  ];

  // hp in half hearts; speed in tiles / s
  const HEROES = [
    {
      id: 'brownie', name: 'T-2 브라우니', title: '스틸라인 돌격병', img: 'c_BR_Brownie_N', gun: 'ar', hp: 10, armor: 2, speed: 6.3,
      skill: 'aimshot', skillName: '조준 사격', skillDesc: '[기폭] 레이저 조준 후 관통 저격 3연발 — 탄이 지나간 적의 상태이상을 터뜨린다(제압→경직 · 표식→폭발 · 속박→파쇄), 마지막 탄은 착탄 폭발', color: '#ffd34d', upF: 'u_aim', upE: 'u_check',
      sk2: { id: 'frag', name: '전술 수류탄', icon: 'i_warning', cd: 5, desc: '[부여] 커서 지점에 수류탄 — 폭발 피해 + 넉백 + 경직, 5.5초 제압 · 적탄 소거 · 잔불. 이미 제압된 적은 크게 경직' },
      stats: { atk: 3, def: 3, mob: 4 }, desc: '균형 잡힌 돌격소총과 높은 기동력. 처음 출격하는 지휘관에게 추천.',
    },
    {
      id: 'leprechaun', name: 'T-3 레프리콘', title: '스틸라인 기관총 사수', img: 'c_BR_Leprechaun_N', gun: 'mg', hp: 10, armor: 1, speed: 5.7,
      skill: 'mgspray', skillName: '경기관총 난사', skillDesc: '[부여→기폭] 3초간 넓게 난사해 관통 · 제압 · 전방 적탄 소거 — 마지막 일제 사격이 원뿔 안의 제압된 적을 모두 경직시킨다', color: '#9dff7a', upF: 'u_spray', upE: 'u_mgf',
      sk2: { id: 'mgfocus', name: '기관총 사격', icon: 'i_research', cd: 6, desc: '[부여] 2초 집중 사격(연사 2.5배 · 피해 +35% · 탄약 무한) — 관통 · 제압탄, 한 적에 6발이면 1초 속박, 끝에 과열 배기로 제압된 적 경직' },
      stats: { atk: 4, def: 4, mob: 2 }, desc: '압도적인 연사력과 튼튼한 체력. 탄막으로 적을 짓누른다.',
    },
    {
      id: 'nymph', name: 'T-10 님프', title: '스틸라인 화력 지원병', img: 'c_BR_Nymph_N', gun: 'mg80', hp: 10, armor: 1, speed: 5.9,
      skill: 'zone', skillName: '제압 난사', skillDesc: '[부여→기폭] 커서 지점에 탄이 비처럼 쏟아져 제압 · 발 묶기 — 마지막 일제 사격이 미리 속박된 적을 파쇄(+40%)', color: '#7affd4', upF: 'u_zone', upE: 'u_focus',
      sk2: { id: 'focusshot', name: '집속 사격', icon: 'i_power', cd: 5, desc: '[기폭→부여] MG80 관통 중탄 14발 — 마지막 슬러그가 선상의 제압을 터뜨려 경직시키고 그 줄의 적을 1.5초 속박' },
      stats: { atk: 4, def: 3, mob: 3 }, desc: 'MG80 경기관총의 화력 지원. 제압 난사로 적의 손발을 묶는다.',
    },
    {
      id: 'kheshig', name: 'T-4 케시크', title: '앵거 오브 호드 의무병', img: 'c_BR_Kheshig_N', gun: 'ct11', hp: 10, armor: 1, speed: 6.1, skate: true,
      skill: 'deploy', skillName: '전술 배치', skillDesc: '[기폭→부여] 배치 충격파가 표식을 터뜨리고 다시 표식 — 근거리 포격 즉시 재사용, 6초간 공격력 +40% · 연사 +30% · 모든 무기 탄약 소모 없음 · 피격 1회 무효, 25 회복', color: '#ff8a5a', upF: 'u_deploy', upE: 'u_cqb',
      sk2: { id: 'pointblank', name: '근거리 포격', icon: 'i_power', cd: 5, desc: '[부여] CT-11 3연발 큰 슬러그 — 가까울수록 피해 +28.5%, 넉백, 4초 표식(받는 피해 +50%)' },
      stats: { atk: 4, def: 4, mob: 3 }, desc: 'CT-11 자동 산탄총을 든 의무병. 근접 화력과 응급 처치로 버틴다.',
    },
    {
      id: 'gnome', name: 'T-20S 노움', title: '스틸라인 유탄병', img: 'c_BR_Gnome_N', gun: 'gl', hp: 8, armor: 1, speed: 5.9,
      skill: 'barrier', skillName: '방벽 생성', skillDesc: '[기폭] 충격파 + 전방 방벽(6초, 피격 2회 무효) — 막은 탄 5발마다 표식된 적에게 유탄, 끝날 때 폭발하며 표식을 터뜨린다', color: '#ffa040', upF: 'u_wall', upE: 'u_cover',
      sk2: { id: 'covermark', name: '원호 사격', icon: 'i_target', cd: 6, desc: '[부여] 커서 지점에 표식탄 — 주변 적을 끌어당겨 경직 + 5초 표식(받는 피해 +50%)' },
      stats: { atk: 5, def: 3, mob: 3 }, desc: '유탄의 범위 피해로 무리를 한 번에 정리. 직격 판정에 주의.',
    },
    {
      id: 'constantia', name: '콘스탄챠 S2', title: '정밀 사격 전문가', img: 'c_3P_ConstantiaS2_N', gun: 'dmr', hp: 9, armor: 2, speed: 6.5,
      skill: 'snare', skillName: '발목 잡기', skillDesc: '[부여] 보리와 함께 커서 일대의 적을 4초간 속박 · 표식 · 제압, 곁에 붙은 적도 밀쳐내 속박 — 보스는 패턴이 끊긴다', color: '#ff6af0', upF: 'u_snare', upE: 'u_rifle',
      sk2: { id: 'rifleshot', name: '라이플 사격', icon: 'i_crit', cd: 6, desc: '[기폭] 열화우라늄 관통탄(최대 3명) — 속박/표식된 적은 피해 x2 + 상태 폭발, 아니면 6.5초 표식(다음 사격이 처형). 35% 치명타 x1.8' },
      stats: { atk: 5, def: 2, mob: 4 }, desc: '관통하는 고위력 정밀 사격. 한 발 한 발이 치명적이다.',
    },
  ];

  // hidden heroes: not on the hero cards; the random card turns one up 2% of the time each.
  // Kits reuse the core skill mechanics in new pairings (perks: the skill upgrades that go with them).
  const HIDDEN = [
    {
      id: 'blacklilith', available: false, name: '블랙 리리스', title: '히든 · 쌍권총 전투 바이오로이드', img: 'c_HID_BlackLilith', gun: 'bl_dual', hp: 10, armor: 1, speed: 6.6, hidden: true,
      skill: 'escort', skillName: '요인 경호', skillDesc: '[기폭] 6초간 피해 무효 2회 · 공격력 +30% · 자동 조준 · 모든 무기 탄약 소모 없음, 경호 드론이 적탄을 먹는다 — 1.2초마다 쏘는 탄이 제압된 적을 경직', color: '#c070ff', upF: 'u_escort', upE: 'u_dual',
      sk2: { id: 'dualburst', name: '듀얼 버스트', icon: 'i_research', cd: 6, desc: '[부여] 쌍권총 20연사 교차 — 맞은 적 6.5초 제압, 마지막 슬러그는 미리 제압돼 있던 적을 경직' },
      stats: { atk: 4, def: 3, mob: 5 }, desc: '쌍권총과 경호의 달인. 탄막 한가운데서 춤추듯 싸운다.',
    },
    {
      id: 'lrl', name: 'LRL', title: '히든 · 자칭 진조의 흑마법사', img: 'c_HID_LRL', rig: 'PECS_LRL', gun: 'lrl_axe', hp: 8, armor: 1, speed: 6.0, hidden: true,
      skill: 'eyebeam', skillName: '사이클롭스 이터널 빔', skillDesc: '[부여] 안대를 벗고 눈에 빛을 모아 거대한 붉은 빔을 1.5초간 발사(12회 타격) — 5초 실명 · 제압, 경로의 적탄 소거, 보스 패턴 차단', color: '#ff5a8a', upF: 'u_beam', upE: 'u_axe',
      sk2: { id: 'axe', name: '액스 오브 다크니스', icon: 'i_target', cd: 5, desc: '[기폭] 드래곤 슬레이어를 휘둘러 검기 3개를 날린다(관통 · 적탄 소거) — 실명한 적은 반드시 약점(x2.45 · 1초 기절), 약점 시 쿨타임 절반' },
      stats: { atk: 5, def: 2, mob: 3 }, desc: '자칭 흑마법사. 도끼와 봉인된 눈의 빔으로 싸운다.',
    },
    {
      id: 'ramparion', name: '램파리온', title: '히든 · 강철의 수호자', img: 'c_HID_Ramparion', rig: 'AGS_Rampart_NS1', rigFlip: false, gun: 'ramp_blast', dashDodge: true, hp: 14, armor: 3, speed: 5.1, hidden: true,
      skill: 'heavenhell', skillName: 'HEAVEN AND HELL', skillDesc: '전자기 토네이도가 조준 방향의 적을 붙잡고, 거대 사자가 그 길을 달린다 — 황금빛 하이퍼로 빛을 모아 섬광처럼 관통 돌진 후 귀환 (시전 중 무적)', color: '#ffd27a',
      sk2: { id: 'breastlion', name: '브레스트 라이언', icon: 'i_power', cd: 7, desc: 'E를 누르는 동안 충전 · 이동속도 50%. 놓으면 불꽃 사자 발사 — 최대 2초 충전 시 크기 2.4배 · 피해 2.5배, 관통 · 넉백. 발사 후 쿨타임 시작' },
      perks: ['u_od', 'u_rush'], stats: { atk: 3, def: 5, mob: 1 }, desc: '거대한 체구와 두꺼운 장갑. 느리지만 무엇이든 버텨낸다.',
    },
  ];

  // kind: bullet | grenade | rail | chain | fireball
  // rate: seconds between shots; spread: degrees; life: projectile seconds; donor: rig whose hand + gun is drawn
  const GUNS = {
    ar: { hitSnd: 'hitS', name: 'GR-11 돌격소총', alignGrip: true, donor: 'brownie', rank: 0, kind: 'bullet', auto: true, rate: 0.115, dmg: 6.1, speed: 22, spread: 4, mag: 30, ammo: 360, reload: 1.15, life: 0.7, sfx: 'rifle', color: 0xd8ff8a, size: 0.32, hit: 'skill_hit_simple', recoil: 0.06, desc: '빠르고 안정적인 연사' },
    mg: { hitSnd: 'hitS', name: 'M-60 경기관총', alignGrip: true, donor: 'leprechaun', rank: 0, kind: 'bullet', auto: true, rate: 0.07, dmg: 3.9, speed: 21, spread: 6, mag: 90, ammo: 720, reload: 2.1, life: 0.65, sfx: 'mg', color: 0x9dff7a, size: 0.28, hit: 'skill_hit_simple', recoil: 0.05, desc: '대용량 탄창, 흩뿌리는 탄막' },
    gl: { hitSnd: 'hitB', name: 'G-40 유탄발사기', alignGrip: true, donor: 'gnome', rank: 1, kind: 'grenade', auto: false, rate: 0.44, dmg: 20, splash: 1.8, speed: 13, spread: 2, mag: 8, ammo: 56, reload: 1.5, life: 0.9, sfx: 'cannon', color: 0xa8ff6a, size: 0.5, hit: 'simple_explosion', recoil: 0.14, desc: '착탄 시 광역 폭발' },
    dmr: { hitSnd: 'hitM', name: 'CS-2 정밀소총', alignGrip: true, donor: 'constantia', rank: 1, kind: 'bullet', auto: false, rate: 0.3, dmg: 16, pierce: 2, speed: 34, spread: 0.8, mag: 10, ammo: 100, reload: 1.3, life: 0.8, sfx: 'handgun', color: 0x8fe8ff, size: 0.45, hit: 'Constantia_hit', recoil: 0.12, desc: '적 2명을 관통하는 고위력탄' },
    sg: { hitSnd: 'hitM', name: 'N-12 산탄총', alignGrip: true, donor: 'kheshig', scale: 1.1, rank: 1, kind: 'bullet', auto: false, rate: 0.66, dmg: 4.2, pellets: 7, speed: 19, spread: 30, mag: 6, ammo: 60, reload: 1.4, life: 0.36, sfx: 'gun', color: 0x7affd4, size: 0.34, hit: 'skill_hit_simple', recoil: 0.16, desc: '근거리에서 압도적인 산탄' },
    pistol: { hitSnd: 'hitE', name: 'RV-7 손목 블래스터', donor: 'raven', scale: 1.1, singleHand: true, rank: 0, kind: 'bullet', auto: true, rate: 0.11, dmg: 4.6, speed: 26, spread: 4, mag: 20, ammo: 300, reload: 0.85, life: 0.6, sfx: 'laser', color: 0x7fe3ff, size: 0.3, hit: 'skill_hit_simple', recoil: 0.04, desc: '손목에 차는 에너지 블래스터, 빠른 재장전' },
    sylph: { hitSnd: 'hitS', name: 'SY-4 고속 소총', donor: 'sylphid', scale: 1.22, rank: 2, kind: 'bullet', auto: true, rate: 0.12, dmg: 8.5, pierce: 1, speed: 32, spread: 2.2, mag: 32, ammo: 192, reload: 1.2, life: 0.75, sfx: 'rifle', color: 0x9ff0ff, size: 0.34, hit: 'skill_hit_simple', recoil: 0.06, desc: '고속 관통탄 연사' },
    shock: { hitSnd: 'hitE', name: 'T-9 전격총', donor: 'thetis', rank: 2, kind: 'chain', auto: true, rate: 0.24, dmg: 14, chain: 3, range: 8, mag: 24, ammo: 144, reload: 1.4, sfx: 'elec', color: 0x66ccff, hit: 'Thetis_skill2_Hit', recoil: 0.04, desc: '조준 방향의 적에게 연쇄 번개' },
    cannon: { hitSnd: 'hitF', name: 'PX 화염포', donor: 'phoenix', scale: 0.88, hold: { l: [0.47, -0.14], r: [-0.14, -0.1, 18] }, rank: 2, kind: 'fireball', auto: false, rate: 0.7, dmg: 36, splash: 2.3, speed: 11, spread: 1, mag: 5, ammo: 30, reload: 1.7, life: 1.1, sfx: 'expS', color: 0x7fffd0, size: 0.8, hit: 'Phoenix_skill1_hit', recoil: 0.2, desc: '거대한 화염탄, 화상 지대 생성' },
    rail: { hitSnd: 'hitB', name: 'V-0 레일건', donor: 'valkyrie', alignGrip: true, gripOffset: [0.03, -0.055], rank: 3, kind: 'rail', auto: false, rate: 0.8, dmg: 78, mag: 5, ammo: 20, reload: 1.8, range: 22, sfx: 'laserBig', color: 0x9fd0ff, hit: 'valkyrie_Hit_skill2', recoil: 0.25, desc: '일직선 상의 모든 적을 꿰뚫는 레일 사격' },
    // variants on the same donor rigs: different handling, same hands
    burst: { hitSnd: 'hitM', name: 'AR-3B 정밀 돌격소총', alignGrip: true, donor: 'brownie', scale: 1.08, rank: 1, kind: 'bullet', auto: true, rate: 0.16, dmg: 9.5, pierce: 1, speed: 28, spread: 1.5, mag: 24, ammo: 216, reload: 1.2, life: 0.75, sfx: 'rifle', color: 0xc8ff9a, size: 0.34, hit: 'skill_hit_simple', recoil: 0.07, desc: '반동이 적은 관통 연사' },
    minigun: { hitSnd: 'hitS', name: 'M-134 회전포', alignGrip: true, donor: 'leprechaun', scale: 1.18, rank: 3, kind: 'bullet', auto: true, rate: 0.045, dmg: 3.6, speed: 22, spread: 11, mag: 200, ammo: 400, reload: 2.6, life: 0.6, sfx: 'mg', color: 0xc8ff7a, size: 0.26, hit: 'skill_hit_simple', recoil: 0.04, desc: '압도적인 탄막, 긴 재장전' },
    mortar: { hitSnd: 'hitB', name: 'G-90 박격포', alignGrip: true, donor: 'gnome', scale: 1.2, rank: 2, kind: 'grenade', auto: false, rate: 0.85, dmg: 34, splash: 2.5, speed: 10, spread: 3, mag: 4, ammo: 28, reload: 1.9, life: 1.1, sfx: 'cannon', color: 0xb8ffa0, size: 0.6, hit: 'simple_explosion', recoil: 0.18, desc: '느리지만 넓은 폭발' },
    amr: { hitSnd: 'hitB', name: 'CS-5 대물저격총', alignGrip: true, donor: 'constantia', scale: 1.14, rank: 3, kind: 'bullet', auto: false, rate: 0.62, dmg: 46, pierce: 4, speed: 40, spread: 0.4, mag: 5, ammo: 20, reload: 1.6, life: 0.9, sfx: 'handgun', color: 0xbff8ff, size: 0.5, hit: 'Constantia_hit', recoil: 0.2, desc: '적 4명을 꿰뚫는 대물탄' },
    // heroes' own weapons (never dropped as loot)
    mg80: { hitSnd: 'hitS', name: 'MG80 경기관총', alignGrip: true, donor: 'nymph', scale: 1.18, noLoot: true, rank: 0, kind: 'bullet', auto: true, rate: 0.075, dmg: 3.8, speed: 21, spread: 5, mag: 80, ammo: 640, reload: 2.0, life: 0.65, sfx: 'mg', color: 0x7affd4, size: 0.28, hit: 'skill_hit_simple', recoil: 0.05, desc: '님프의 MG80 — 안정적인 지원 사격' },
    ct11: { hitSnd: 'hitM', name: 'CT-11 자동 산탄총', alignGrip: true, donor: 'kheshig', scale: 1.1, noLoot: true, rank: 0, kind: 'bullet', auto: true, rate: 0.34, dmg: 3.9, pellets: 6, speed: 19, spread: 24, mag: 10, ammo: 150, reload: 1.6, life: 0.36, sfx: 'gun', color: 0xffb08a, size: 0.32, hit: 'skill_hit_simple', recoil: 0.12, desc: '연사가 되는 자동 산탄총' },
    bl_dual: { hitSnd: 'hitS', name: 'BL 쌍권총', donor: 'blacklilith', noLoot: true, rank: 1, kind: 'bullet', auto: true, rate: 0.085, dmg: 4.4, speed: 23, spread: 5, mag: 36, ammo: 504, reload: 1.15, life: 0.6, sfx: 'rifle', color: 0xb6a0ff, size: 0.28, hit: 'skill_hit_simple', recoil: 0.05, desc: '빠르게 번갈아 쏘는 쌍권총' },
    lrl_axe: { hitSnd: 'hitB', name: '드래곤 슬레이어', donor: 'PECS_LRL', scale: 1.1, nativeGrip: true, noReload: true, handOutline: true, outline: 1.10, mount: [0.23, 0.19], noLoot: true, rank: 1, kind: 'bullet', auto: true, rate: 0.42, dmg: 24, pierce: 2, speed: 15, spread: 1.5, mag: 6, ammo: 120, reload: 1.1, life: 0.75, sfx: 'swing', color: 0xff6a6a, size: 1.05, tex: 'lrlaxe', spin: 22, hit: 'skill_hit_simple', recoil: 0.12, desc: '회전하며 날아가는 도끼 — 2회 관통 · 장전 없음' },
    lrl_wand: { hitSnd: 'hitF', name: 'LRL 마도 지팡이', donor: 'PECS_LRL', noLoot: true, rank: 1, kind: 'fireball', auto: false, rate: 0.5, dmg: 22, splash: 1.9, speed: 12, spread: 2, mag: 8, ammo: 120, reload: 1.4, life: 1.0, sfx: 'expS', color: 0x9fe8ff, size: 0.6, hit: 'skill_hit_simple', recoil: 0.12, desc: '폭발하는 마탄' },
    ramp_blast: { hitSnd: 'hitE', name: 'RP 리펄서', donor: 'AGS_Rampart_NS1', nativeGrip: true, noLoot: true, rank: 1, kind: 'rail', range: 7, shortLaser: true, beamWidth: 0.12, beamLife: 0.12, auto: true, rate: 0.24, dmg: 11, pierce: 1, speed: 26, spread: 2.5, mag: 24, ammo: 240, reload: 1.2, life: 0.7, sfx: 'laser', color: 0xffffff, size: 0.46, hit: 'skill_hit_simple', recoil: 0.1, desc: '손바닥에서 발사하는 사거리 7칸의 흰색 레이저' },
    ramp_cannon: { hitSnd: 'hitB', name: 'RP 어깨 포', donor: 'e_Rampart_N', noLoot: true, rank: 1, kind: 'bullet', auto: true, rate: 0.3, dmg: 13, pierce: 1, speed: 18, spread: 3, mag: 16, ammo: 240, reload: 1.6, life: 0.75, sfx: 'rifle', color: 0x9fffd8, size: 0.4, hit: 'skill_hit_simple', recoil: 0.14, desc: '무거운 관통 포탄' },
  };
  Object.entries(GUNS).forEach(([id, g]) => { g.id = id; });

  // passive items (icon = ui sprite key)
  const ITEMS = [
    { id: 'dmg', name: '강화 탄두', icon: 'i_atk', rank: 1, desc: '공격력 +25%' },
    { id: 'rof', name: '고속 연사 모듈', icon: 'i_power', rank: 1, desc: '연사 속도 +20%' },
    { id: 'reload', name: '자동 장전기', icon: 'i_mechanic', rank: 0, desc: '재장전 속도 +40%' },
    { id: 'crit', name: '치명 조준경', icon: 'i_crit', rank: 1, desc: '치명타 확률 +15% (피해 2배)' },
    { id: 'mag', name: '확장 탄창', icon: 'i_ap', rank: 0, desc: '탄창 +50%, 최대 탄약 +30%' },
    { id: 'boots', name: '경량 기동 부츠', icon: 'i_range', rank: 0, desc: '이동 속도 +12%, 회피 재사용 단축' },
    { id: 'heart', name: '생체 강화 수액', icon: 'i_nutrient', rank: 1, desc: '최대 체력 +50, 체력 전부 회복' },
    { id: 'armor', name: '역장 발생기', icon: 'i_research', rank: 0, desc: '방어막 +2' },
    { id: 'pierce', name: '철갑탄', icon: 'i_target', rank: 2, desc: '모든 탄환 관통 +1' },
    { id: 'vamp', name: '나노 수복기', icon: 'i_promote', rank: 2, desc: '적 처치 시 6% 확률로 체력 25 회복' },
    { id: 'homing', name: '유도 칩셋', icon: 'i_acc', rank: 2, desc: '탄환이 가까운 적을 추적' },
    { id: 'velo', name: '가속 탄두', icon: 'i_making', rank: 0, desc: '탄속 +35%, 사거리 증가' },
    { id: 'link', name: '전술 데이터 링크', icon: 'i_squad', rank: 1, desc: '스킬 충전 속도 +50%' },
    { id: 'thorn', name: '반응 장갑', icon: 'i_medal', rank: 2, desc: '피격 시 주변에 충격파 (적탄 소거)' },
    { id: 'lucky', name: '행운의 참치', icon: 'i_tuna', rank: 1, desc: '부품 획득량 +50%, 상자에서 높은 등급' },
    { id: 'bounce', name: '도탄 회로', icon: 'i_merge', rank: 1, desc: '탄환이 벽에 한 번 튕겨 나감' },
    { id: 'split', name: '분열 탄두', icon: 'i_sell', rank: 2, desc: '적중 시 탄환이 작은 탄 2발로 갈라짐' },
    { id: 'frost', name: '냉각탄', icon: 'i_plus', rank: 1, desc: '적중한 적을 1.5초간 40% 둔화' },
    { id: 'drone', name: '지원 드론', icon: 'i_battle', rank: 2, desc: '곁을 도는 드론이 가까운 적을 자동 사격' },
    // behaviour-changing items
    { id: 'explo', name: '폭발 탄두', icon: 'i_warning', rank: 2, desc: '적중 시 15% 확률로 작은 폭발 (주변 적 피해)' },
    { id: 'orbit', name: '방어 위성', icon: 'i_detail', rank: 2, desc: '주위를 도는 위성 2기가 닿는 적탄을 지움' },
    { id: 'adren', name: '아드레날린 주입기', icon: 'i_atk', hue: 320, rank: 1, desc: '회피 직후 2초간 피해 +35%' },
    { id: 'echo', name: '잔향 사격 모듈', icon: 'i_random', rank: 1, desc: '6발마다 추가 탄 2발을 부채꼴로 발사' },
    { id: 'magnet', name: '회수 자석', icon: 'i_gear', rank: 0, desc: '아이템 흡수 범위 2배, 부품 획득 +25%' },
    { id: 'chain', name: '연쇄 방전기', icon: 'i_power', hue: 175, rank: 2, desc: '적중 시 15% 확률로 가까운 적에게 전격이 튐 (피해 60%)' },
    { id: 'berserk', name: '광전사 회로', icon: 'i_warning', hue: 300, rank: 1, desc: '체력이 절반 이하일 때 피해 +30%' },
    { id: 'overclock', name: '과부하 코어', icon: 'i_making', hue: 200, rank: 1, desc: '적 처치 후 3초간 연사 속도 +25%' },
    { id: 'execute', name: '처형 프로토콜', icon: 'i_target', hue: 150, rank: 2, desc: '체력 15% 미만 일반 적은 즉시 처치, 보스는 체력 30% 미만에서 피해 +20%' },
    { id: 'kinetic', name: '운동 에너지 변환기', icon: 'i_range', hue: 210, rank: 1, desc: '이동 중 피해 +15%' },
    { id: 'reserve', name: '예비 탄약고', icon: 'i_ap', hue: 140, rank: 0, desc: '구역 클리어 시 보급 무기 탄약 20% 보충' },
    { id: 'medkit', name: '응급 처치 키트', icon: 'i_nutrient', hue: 120, rank: 1, desc: '구역 클리어 시 체력이 절반 이하면 체력 25 회복' },
    { id: 'ghost', name: '위상 회피기', icon: 'i_detail', hue: 250, rank: 2, desc: '회피 무적 +50%, 구르며 스친 적탄을 지움' },
  ];

  // enemy roster. h: on-screen height (tiles); hp scales per floor; fire: pattern key (see game.js PATTERNS)
  const ENEMIES = {
    chick: { sfx: 'eChick', rig: 'e_NightChick_N', name: '나이트 칙', hp: 16, speed: 2.4, h: 1.05, r: 0.38, ai: 'walker', fire: 'aimed', rate: 1.9, gold: 2 },
    drone: { sfx: 'eScout', rig: 'e_Drone_N', name: '드론', hp: 10, speed: 3.8, h: 1.0, r: 0.34, ai: 'strafer', fire: 'spread3', rate: 2.2, gold: 1, fly: true },
    pupp: { sfx: 'eWatcher', rig: 'e_PuppHead_N', name: '퍼프헤드', hp: 26, speed: 1.3, h: 1.15, r: 0.45, ai: 'turret', fire: 'ring8', rate: 2.6, gold: 3 },
    fallen: { sfx: 'eDE', rig: 'e_Fallen_N', name: '폴른', hp: 24, speed: 2.8, h: 1.25, r: 0.45, ai: 'walker', fire: 'burst3', rate: 2.1, gold: 2 },
    legion: { sfx: 'eLegion', rig: 'e_Legion_N', name: '레기온', hp: 40, speed: 2.0, h: 1.55, r: 0.5, ai: 'walker', fire: 'spread5', rate: 2.3, gold: 3 },
    centurion: { sfx: 'eCenturion', rig: 'e_Centurion_N', name: '센츄리온', hp: 46, speed: 2.1, h: 1.6, r: 0.5, ai: 'walker', fire: 'burst5', rate: 2.4, gold: 3 },
    predator: { sfx: 'eScout', rig: 'e_Predator_N', name: '프레데터', hp: 34, speed: 3.3, h: 1.45, r: 0.48, ai: 'sniper', fire: 'snipe', rate: 2.8, gold: 3 },
    intruder: { sfx: 'eWatcher', rig: 'e_Intruder_N', name: '인트루더', hp: 42, speed: 1.8, h: 1.4, r: 0.48, ai: 'turret', fire: 'spiral', rate: 3.2, gold: 3 },
    gigantes: { sfx: 'eCenturion', rig: 'e_Gigantes_N', name: '기간테스', hp: 95, speed: 1.2, h: 2.0, r: 0.7, ai: 'walker', fire: 'ring16', rate: 2.9, gold: 6 },
    phalangites: { sfx: 'eCM', rig: 'e_Phalangites_N', name: '팔랑기테스', hp: 55, speed: 2.0, h: 1.6, r: 0.52, ai: 'walker', fire: 'wave', rate: 2.4, gold: 4 },
    rampart: { sfx: 'eLegion', rig: 'e_Rampart_N', name: '램파트', hp: 120, speed: 1.0, h: 1.9, r: 0.7, ai: 'turret', fire: 'cross', rate: 2.6, gold: 6 },
    harvester: { sfx: 'eHarvester', rig: 'e_Harvester_N', name: '하베스터', hp: 64, speed: 1.7, h: 1.6, r: 0.55, ai: 'walker', fire: 'homing', rate: 3.0, gold: 4 },
    // kamikaze: rushes in, blinks red, bursts into a bullet ring (shoot it early or roll out)
    bomber: { sfx: 'eScout', rig: 'e_Drone_N', name: '자폭 드론', hp: 14, speed: 4.0, h: 0.95, r: 0.34, ai: 'kamikaze', fire: 'aimed', rate: 9, gold: 2, fly: true, tint: [1.55, 0.62, 0.5] },
    juggernaut: { sfx: 'eHarvester', rig: 'e_Juggernaut_N', name: '저거너트', hp: 100, speed: 1.6, h: 1.9, r: 0.7, ai: 'charger', fire: 'ring12', rate: 3.4, gold: 6 },
  };
  // elites: champion versions (one per room, later floors)
  const ELITES = {
    bigchick: { sfx: 'eBigChick', rig: 'e_BigChick_N', name: '빅 칙', hp: 200, speed: 1.6, h: 1.9, r: 0.75, ai: 'walker', fire: 'eliteA', rate: 2.0, gold: 14, elite: true },
    fortress: { sfx: 'missile', rig: 'e_Fortress_N', name: '포트리스', hp: 240, speed: 1.0, h: 2.1, r: 0.8, ai: 'turret', fire: 'eliteB', rate: 2.2, gold: 16, elite: true },
    destroyer: { sfx: 'eDE', rig: 'e_Destroyer_N', name: '디스트로이어', hp: 250, speed: 1.5, h: 2.1, r: 0.8, ai: 'walker', fire: 'eliteC', rate: 2.0, gold: 18, elite: true },
    doomeater: { sfx: 'energy', rig: 'e_DoomEater_N', name: '둠 이터', hp: 270, speed: 1.8, h: 2.2, r: 0.85, ai: 'charger', fire: 'eliteA', rate: 1.8, gold: 20, elite: true },
    blackknight: { sfx: 'eKnight', rig: 'e_BlackKnight_N', name: '블랙 나이트', hp: 290, speed: 1.9, h: 1.9, r: 0.7, ai: 'charger', fire: 'eliteC', rate: 2.4, gold: 22, elite: true },
  };
  const BOSSES = {
    emperor: { rig: 'e_EmperorChick_N', name: '엠페러 칙', title: '철충 무리의 군주', hp: 800, h: 3.0, r: 1.1, speed: 1.4, img: 'e_EmperorChick_N', patterns: ['bRing', 'bSummon', 'bSpiral', 'bAimFan'], tip: '탄막 사이의 빈틈을 찾아 회피하세요' },
    goltarion: { rig: 'e_Goltarion_N', name: '골타리온', title: '파괴의 거신', hp: 1400, h: 3.3, r: 1.2, speed: 1.8, img: 'e_Goltarion_N', patterns: ['bWall', 'bCharge', 'bShotgun', 'bVortex', 'bRain'], tip: '돌진 전 붉은 조준선을 주시하세요 · 좁혀 오는 고리는 빈틈으로' },
    executioner: { rig: 'e_Executioner_EW', name: '엑스큐셔너', title: '처형 집행 기체', hp: 960, h: 3.0, r: 1.0, speed: 2.0, img: 'e_Executioner_EW', patterns: ['bAimFan', 'bCharge', 'bRing', 'bWall'], tip: '돌진 예고선이 보이면 옆으로 구르세요' },
    nidhogg: { rig: 'e_Nidhogg_N', name: '니드호그', title: '심연의 포식자', hp: 1450, h: 3.3, r: 1.2, speed: 1.3, img: 'e_Nidhogg_N', patterns: ['bHoming', 'bFlower', 'bVortex', 'bSpiral'], tip: '유도탄은 강철 엄폐물 뒤로 끌어 떼어내세요' },
    nightqueen: { rig: 'e_NightChick_N', name: '나이트 칙 퀸', title: '야간 강습 여왕체', hp: 1500, h: 3.5, tint: [0.72, 0.8, 1.5], aura: 0x6a5cff, r: 1.1, speed: 1.9, img: 'e_NightChick_N', patterns: ['bSpiral', 'bMines', 'bSummon', 'bAimFan'], tip: '발밑에 깔리는 보랏빛 지뢰는 터지기 전에 벗어나세요' },
    doomprime: { rig: 'e_DoomEater_N', name: '둠 이터 프라임', title: '탐식하는 파괴자', hp: 1650, h: 3.8, tint: [1.45, 0.62, 1.15], aura: 0xff30c0, r: 1.2, speed: 1.7, img: 'e_DoomEater_N', patterns: ['bCharge', 'bCross', 'bShotgun', 'bFlower'], tip: '회전하는 십자 탄줄과 같은 방향으로 도세요' },
    ironprince: { pale: true, tint: [0.64, 0.64, 0.74], rig: 'e_IronPrince_N', name: '철혈의 왕자', title: '철혈 사령부 총사령관', hp: 1850, h: 3.2, r: 1.1, speed: 1.6, img: 'e_IronPrince_N', patterns: ['bSpiral2', 'bHoming', 'bLaser', 'bSummon', 'bFlower', 'bWall'], tip: '최종 결전 — 보조 스킬과 회피로 탄막을 끊어내세요' },
  };

  const FLOORS = [
    {
      key: 'B1', name: '오르카 격납고', en: 'HANGAR SECTOR', rooms: 5, enemies: ['chick', 'drone', 'pupp', 'fallen'], elites: [], boss: ['emperor', 'executioner'],
      floor: 'floor_x', alt: 'floor_dot', face: 'wall_face_a', tint: [0.86, 0.95, 1.08], light: 0x3aa0ff, music: ['battle', 'battle5'], hpMul: 1,
    },
    {
      key: 'B2', name: '철충 소굴', en: 'IRON NEST', rooms: 5, enemies: ['fallen', 'legion', 'centurion', 'predator', 'intruder', 'drone', 'pupp', 'bomber'], elites: ['bigchick', 'fortress'], boss: ['goltarion', 'nightqueen'], cap: 'wall_cap_b',
      floor: 'floor_brick', alt: 'floor_dot', face: 'wall_face_b', tint: [1.06, 0.92, 0.78], light: 0xff9a30, music: ['battle2', 'march'], hpMul: 1.25,
    },
    {
      key: 'B3', name: '지하 정비창', en: 'UNDER DOCK', rooms: 5, enemies: ['legion', 'centurion', 'predator', 'intruder', 'gigantes', 'harvester', 'phalangites', 'bomber'], elites: ['fortress', 'destroyer', 'bigchick'], boss: ['nidhogg', 'goltarion', 'nightqueen'],
      floor: 'floor_grate', alt: 'floor_dot', face: 'wall_face_d', cap: 'wall_cap_b', tint: [0.88, 1.02, 0.96], light: 0x40ffb0, music: ['battle4', 'tension1'], hpMul: 1.42,
    },
    {
      key: 'B4', name: '폐쇄 연구동', en: 'SEALED LAB', rooms: 6, enemies: ['legion', 'centurion', 'predator', 'intruder', 'gigantes', 'phalangites', 'harvester'], elites: ['fortress', 'destroyer', 'doomeater'], boss: ['nightqueen', 'nidhogg', 'doomprime'],
      floor: 'floor_pipe', alt: 'floor_plate', face: 'wall_face_a', cap: 'wall_cap_b', tint: [0.92, 0.9, 1.1], light: 0xa070ff, music: ['stage10', 'horror2'], hpMul: 1.9,
    },
    {
      key: 'B5', name: '외곽 방어선', en: 'OUTER BULWARK', rooms: 6, enemies: ['centurion', 'predator', 'intruder', 'gigantes', 'phalangites', 'rampart', 'juggernaut', 'harvester', 'bomber'], elites: ['destroyer', 'blackknight', 'bigchick'], boss: ['doomprime', 'goltarion', 'nidhogg'],
      floor: 'floor_deck', alt: 'floor_grate', face: 'wall_face_d', tint: [1.08, 1.0, 0.8], light: 0xffd040, music: ['northern', 'outctrl'], hpMul: 2.3,
    },
    {
      key: 'B6', name: '철혈 사령부', en: 'IRON COMMAND', rooms: 7, enemies: ['centurion', 'predator', 'intruder', 'gigantes', 'phalangites', 'rampart', 'harvester', 'juggernaut'], elites: ['destroyer', 'doomeater', 'blackknight'], boss: ['ironprince'],
      floor: 'floor_plate', alt: 'floor_x', face: 'wall_face_c', tint: [1.0, 0.88, 0.92], light: 0xff4466, music: ['battle3', 'tension2'], hpMul: 2.7,
    },
  ];

  // ── stage mode (궁수의 전설 style chapters) ─────────────────
  // the B1-B6 run above stays as the data-chip farm. Stage mode: 5 stages x 5+ floors, a mid boss on floor 3 and the
  // final boss on the last floor; easy / normal / hard. A stage floor = a THEME (look) + a TIER (which farm floor's
  // enemy roster and difficulty curve it borrows: 0 = B1 ... 5 = B6)
  const LOOK = (f) => ({ floor: f.floor, alt: f.alt, face: f.face, cap: f.cap, tint: f.tint, light: f.light, music: f.music });
  const THEMES = {
    hangar: { name: '오르카 격납고', en: 'HANGAR SECTOR', ...LOOK(FLOORS[0]) },
    nest: { name: '철충 소굴', en: 'IRON NEST', ...LOOK(FLOORS[1]) },
    dock: { name: '지하 정비창', en: 'UNDER DOCK', ...LOOK(FLOORS[2]) },
    lab: { name: '폐쇄 연구동', en: 'SEALED LAB', ...LOOK(FLOORS[3]) },
    bulwark: { name: '외곽 방어선', en: 'OUTER BULWARK', ...LOOK(FLOORS[4]) },
    command: { name: '철혈 사령부', en: 'IRON COMMAND', ...LOOK(FLOORS[5]) },
    // new looks
    frost: { name: '동결 저장고', en: 'CRYO VAULT', floor: 'floor_tread', alt: 'floor_frame', face: 'wall_face_e', cap: 'wall_cap_b', tint: [0.7, 0.9, 1.38], light: 0x9fe8ff, music: ['tension1', 'battle'],
      decal: 'deco_ice', hazard: 'ice', props: ['prop_cargo', 'prop_console'] },
    foundry: { name: '용광로 구역', en: 'FOUNDRY', floor: 'floor_bigplate', alt: 'floor_brick', face: 'wall_face_g', cap: 'wall_cap_b', tint: [1.38, 0.76, 0.52], light: 0xff5020, music: ['battle2', 'march'],
      decal: 'deco_lava', decalAdd: true, decalAlpha: 0.95, hazard: 'lava', props: ['prop_cargo', 'prop_machine'] },
    toxic: { name: '오염 처리장', en: 'TOXIC WORKS', floor: 'floor_ventgrid', alt: 'floor_pipe', face: 'wall_face_f', cap: 'wall_cap_b', tint: [0.76, 1.24, 0.64], light: 0x9dff40, music: ['horror2', 'tension2'],
      decal: 'deco_toxic', decalAdd: true, decalAlpha: 0.75, hazard: 'toxic', props: ['prop_tank', 'prop_machine'] },
    flood: { name: '수몰 구역', en: 'FLOODED SECTOR', floor: 'floor_hatch', alt: 'floor_deck', face: 'wall_face_h', tint: [0.6, 0.88, 1.22], light: 0x2a90ff, music: ['battle4', 'stage10'],
      decal: 'deco_water', decalAdd: true, decalAlpha: 0.8, hazard: 'water', props: ['prop_cargo', 'prop_tank'] },
    power: { name: '발전 구역', en: 'POWER PLANT', floor: 'floor_panel2', alt: 'floor_plate', face: 'wall_face_c', cap: 'wall_cap_b', tint: [1.12, 1.06, 0.68], light: 0xffe040, music: ['northern', 'outctrl'],
      decal: 'deco_pit', decalAspect: 0.62, hazard: 'shock', props: ['prop_core', 'prop_console'] },
  };
  // floors: [theme, tier, rooms]; mid = floor 3's boss, boss = the last floor's
  const STAGES = [
    { id: 's1', name: '오르카 외곽', en: 'ORCA OUTSKIRTS', floors: [['hangar', 0, 4], ['hangar', 0, 4], ['nest', 0, 4], ['nest', 1, 5], ['frost', 1, 5]], mid: 'emperor', boss: 'executioner' },
    { id: 's2', name: '동결 저장고', en: 'CRYO VAULT', floors: [['frost', 1, 4], ['frost', 1, 5], ['dock', 1, 5], ['frost', 2, 5], ['flood', 2, 5]], mid: 'executioner', boss: 'goltarion' },
    { id: 's3', name: '수몰 정비창', en: 'SUNKEN DOCK', floors: [['flood', 2, 5], ['dock', 2, 5], ['flood', 2, 5], ['toxic', 3, 5], ['toxic', 3, 6]], mid: 'goltarion', boss: 'nightqueen' },
    { id: 's4', name: '용광로 전선', en: 'FOUNDRY FRONT', floors: [['foundry', 3, 5], ['lab', 3, 5], ['foundry', 3, 6], ['bulwark', 4, 6], ['foundry', 4, 6]], mid: 'nidhogg', boss: 'doomprime' },
    { id: 's5', name: '철혈 사령부', en: 'IRON COMMAND', floors: [['power', 4, 6], ['bulwark', 4, 6], ['power', 4, 6], ['command', 5, 6], ['command', 5, 7]], mid: 'nightqueen', boss: 'ironprince' },
  ];
  // difficulty: enemy HP, enemy fire interval, enemy bullet speed; chips = the data-chip share (stage mode is a poor chip farm)
  const DIFFS = [
    { id: 'easy', name: '쉬움', hp: 1, rate: 1, bspd: 1, chips: 0.15, color: '#63d34a' },
    { id: 'normal', name: '보통', hp: 1.8, rate: 0.88, bspd: 1.06, chips: 0.2, color: '#38b6ff' },
    { id: 'hard', name: '어려움', hp: 3.2, rate: 0.76, bspd: 1.12, chips: 0.25, color: '#ff5a4a' },
  ];
  // one stage as a floor list in the FLOORS shape (enemy roster / elites / hpMul from the tier's farm floor)
  const FARM = FLOORS.slice();
  function stageFloors(si) {
    const S = STAGES[si];
    return S.floors.map(([th, tier, rooms], fi) => {
      const T = THEMES[th], B = FARM[tier], last = fi === S.floors.length - 1;
      return { ...T, key: `${si + 1}-${fi + 1}`, rooms, enemies: B.enemies, elites: B.elites, hpMul: B.hpMul, tier,
        boss: fi === 2 ? [S.mid] : last ? [S.boss] : [], bossKey: fi === 2 ? S.mid : last ? S.boss : null, mid: fi === 2 };
    });
  }

  // item pairs that unlock an extra effect when both are owned
  const SYNERGY = [
    { a: 'bounce', b: 'homing', name: '추적 도탄', desc: '튕긴 탄환이 적을 향해 꺾이고, 두 번 튕김' },
    { a: 'split', b: 'pierce', name: '산개 관통', desc: '갈라진 탄환도 적을 관통' },
    { a: 'drone', b: 'link', name: '전술 편대', desc: '드론 연사 속도 2배' },
    { a: 'frost', b: 'crit', name: '취약 노출', desc: '둔화된 적에게 치명타 확률 +25%' },
    { a: 'thorn', b: 'armor', name: '반응 역장', desc: '방어막이 깨질 때 큰 충격파' },
    { a: 'velo', b: 'pierce', name: '레일 탄두', desc: '관통 +1, 탄속 +15%' },
    { a: 'dmg', b: 'crit', name: '처형 사격', desc: '치명타 피해 2배 → 2.6배' },
    { a: 'vamp', b: 'rof', name: '피의 연사', desc: '흡혈 확률 2배' },
    { a: 'explo', b: 'split', name: '연쇄 폭발', desc: '폭발 확률 30%, 갈라진 탄도 폭발' },
    { a: 'orbit', b: 'thorn', name: '역장 위성', desc: '위성 3기, 더 넓은 소거 범위' },
    { a: 'adren', b: 'boots', name: '질풍', desc: '회피 직후 연사 속도도 +30%' },
    { a: 'chain', b: 'frost', name: '초전도', desc: '전격 확률 30%, 전격을 맞은 적도 둔화' },
    { a: 'medkit', b: 'vamp', name: '응급 수복', desc: '응급 처치 키트가 체력 50 회복, 체력 조건 없음' },
    { a: 'kinetic', b: 'boots', name: '관성 사격', desc: '이동 중 피해 +15% → +30%' },
  ];
  // heroes past the first two unlock by reaching deeper floors
  const UNLOCK = { gnome: { floor: 1, text: 'B2 도달 시 해금' }, constantia: { floor: 3, text: 'B4 도달 시 해금' } };

  // research lab: permanent upgrades bought with data chips earned every run
  const META = [
    { id: 'hp', name: '생체 강화', icon: 'i_nutrient', max: 4, cost: [150, 400, 830, 1700], desc: (l) => `시작 체력 +${l * 25}` },
    { id: 'key', name: '보급 열쇠', icon: 'i_lock', max: 2, cost: [120, 550], desc: (l) => `시작 열쇠 +${l}` },
    { id: 'gold', name: '초기 자금', icon: 'i_gear', max: 3, cost: [100, 300, 700], desc: (l) => `시작 부품 +${l * 20}` },
    { id: 'skill', name: '스킬 예열', icon: 'i_squad', max: 2, cost: [150, 700], desc: (l) => `스킬 게이지 ${l * 35}%로 시작` },
    { id: 'dmg', name: '탄두 개량', icon: 'i_atk', max: 5, cost: [200, 500, 980, 1660, 2600], desc: (l) => `공격력 +${l * 6}%` },
    { id: 'armor', name: '전개식 방어막', icon: 'i_check', max: 2, cost: [300, 1400], desc: (l) => `시작 방어막 +${l}` },
    { id: 'roll', name: '기동 보조 장치', icon: 'i_time', max: 3, cost: [220, 680, 1500], desc: (l) => `회피 쿨타임 -${l * 10}%` },
    { id: 'luck', name: '보급망 확충', icon: 'i_research', max: 3, cost: [250, 820, 1800], desc: (l) => `상점 가격 -${l * 7}%, 보급 상자 등급 상승` },
    { id: 'xp', name: '전투 데이터 분석', icon: 'i_detail', max: 3, cost: [200, 680, 1500], desc: (l) => `경험치 +${l * 12}%` },
    { id: 'cards', name: '강화 모듈 확장', icon: 'i_making', max: 1, cost: [1950], desc: () => '레벨업 선택지 4장' },
    { id: 'revive', name: '긴급 복구 프로토콜', icon: 'i_skull', max: 1, cost: [2400], desc: () => '작전 불능 시 1회 부활 (체력 최대 100)' },
  ];

  const BAL = {
    rollTime: 0.42, rollSpeed: 12.5, rollIframe: 0.32, rollCd: 0.5, // i-frames over the first ~3/4 of the roll; the landing is vulnerable
    hurtIframe: 0.85,
    heartDrop: 0.02, ammoDrop: 0.08,
    shop: { heart: 40, armor: 28, key: 35, ammo: 22, item: [55, 85, 130], gun: [70, 105, 160, 230] },
  };

  // level-up perks: pick 1 of 3 on every level. hero: only offered to that hero (they power up her own skills)
  const PERKS = [
    { id: 'p_dmg', name: '화력 강화', icon: 'i_atk', max: 5, desc: '모든 피해 +12%' },
    { id: 'p_rof', name: '속사 회로', icon: 'i_power', max: 4, desc: '연사 속도 +10%' },
    { id: 'p_reload', name: '급속 장전', icon: 'i_time', max: 3, desc: '재장전 속도 +20%' },
    { id: 'p_hp', name: '장갑 보강', icon: 'i_nutrient', max: 2, desc: '최대 체력 +50, 체력 50 회복' },
    { id: 'p_speed', name: '기동 강화', icon: 'i_squad', max: 3, desc: '이동 속도 +7%, 회피 쿨타임 -10%' },
    { id: 'p_crit', name: '정밀 조준', icon: 'i_crit', max: 4, desc: '치명타 확률 +7%' },
    { id: 'p_mag', name: '확장 탄창', icon: 'i_making', max: 3, desc: '탄창 용량 +25%' },
    { id: 'p_core', name: '코어 링크', icon: 'i_research', max: 3, desc: '궁극기 충전 속도 +25%' },
    { id: 'p_cool', name: '냉각 시스템', icon: 'i_mechanic', max: 3, desc: '보조 스킬 쿨타임 -15%' },
    { id: 'p_armor', name: '보호막 생성기', icon: 'i_check', max: 2, desc: '방어막 +1 (피격 1회 무효)' },
    { id: 'p_chain', name: '연쇄 기폭', icon: 'i_battle', max: 1, desc: '처치한 적이 40% 확률로 폭발해 주변에 피해' },
    { id: 'p_leech', name: '흡혈 탄두', icon: 'i_nutrient', max: 1, desc: '처치 시 5% 확률로 체력 25 회복' },
    { id: 'p_rollReload', name: '전술 재장전', icon: 'i_time', max: 1, desc: '회피하면 들고 있는 무기의 탄창 30%를 즉시 채움' },
    { id: 'p_rollBlast', name: '회피 충격파', icon: 'i_power', max: 1, desc: '회피가 끝날 때 충격파 — 주변 적 피해, 적탄 소거' },
    { id: 'p_last', name: '최후의 저항', icon: 'i_skull', max: 1, desc: '체력 50 이하일 때 주는 피해 +40%' },
    // skill upgrades: each hero's ultimate (upF) and support skill (upE) from the original kit
    { id: 'u_aim', hero: 'brownie', name: '정밀 조준', icon: 'i_battle', max: 3, desc: '조준 사격: 피해 +25%' },
    { id: 'u_check', hero: 'brownie', name: '고폭 수류탄', icon: 'i_warning', max: 3, desc: '전술 수류탄: 범위 +25%, 기절 +0.4초, 쿨타임 -0.6초' },
    { id: 'u_spray', hero: 'leprechaun', name: '난사 연장', icon: 'i_battle', max: 3, desc: '경기관총 난사: 지속 +0.8초, 피해 +20%' },
    { id: 'u_mgf', hero: 'leprechaun', name: '집중 사격 연장', icon: 'i_power', max: 3, desc: '기관총 사격: 지속 +0.5초, 쿨타임 -0.6초' },
    { id: 'u_zone', hero: 'nymph', name: '제압 강화', icon: 'i_battle', max: 3, desc: '제압 난사: 지속 +0.6초, 피해 +20%' },
    { id: 'u_focus', hero: 'nymph', name: '집속 강화', icon: 'i_power', max: 3, desc: '집속 사격: 피해 +20%, 쿨타임 -0.6초' },
    { id: 'u_wall', hero: 'gnome', name: '방벽 보강', icon: 'i_battle', max: 3, desc: '방벽 생성: 지속 +1.5초' },
    { id: 'u_cover', hero: 'gnome', name: '원호 확장', icon: 'i_target', max: 3, desc: '원호 사격: 범위 +20%, 쿨타임 -0.6초' },
    { id: 'u_snare', hero: 'constantia', name: '보리 훈련', icon: 'i_battle', max: 3, desc: '발목 잡기: 지속 +1초' },
    { id: 'u_rifle', hero: 'constantia', name: '열화우라늄 탄', icon: 'i_crit', max: 3, desc: '라이플 사격: 피해 +25%, 쿨타임 -0.6초' },
    { id: 'u_deploy', hero: 'kheshig', name: '배치 숙련', icon: 'i_battle', max: 3, desc: '전술 배치: 지속 +1.5초' },
    { id: 'u_cqb', hero: 'kheshig', name: '지근거리 사격', icon: 'i_power', max: 3, desc: '근거리 포격: 피해 +20%, 쿨타임 -0.6초' },
    { id: 'u_escort', hero: 'blacklilith', name: '경호 연장', icon: 'i_battle', max: 3, desc: '요인 경호: 지속 +1.5초' },
    { id: 'u_dual', hero: 'blacklilith', name: '아킴보 숙련', icon: 'i_power', max: 3, desc: '듀얼 버스트: 피해 +20%, 쿨타임 -0.6초' },
    { id: 'u_beam', hero: 'lrl', name: '봉인 해제', icon: 'i_battle', max: 3, desc: '사이클롭스 이터널 빔: 폭 +30%, 효과 +1초' },
    { id: 'u_axe', hero: 'lrl', name: '용살자의 행운', icon: 'i_power', max: 3, desc: '액스 오브 다크니스: 피해 +20%, 약점 확률 +8%, 쿨타임 -0.6초' },
    // (램파리온 keeps the emplace / dash kit and its upgrades)
    { id: 'u_od', hero: 'ramparion', name: '천국과 지옥', icon: 'i_battle', max: 3, desc: 'HEAVEN AND HELL: 피해 +20%, 토네이도 속박 +0.5초' },
    { id: 'u_rush', hero: 'ramparion', name: '불타는 사자', icon: 'i_power', max: 3, desc: '브레스트 라이언: 쿨타임 -1.2초, 피해 +15%' },
    // hero tactics: all weapons and skills retain the same conditional training bonuses
    { id: 'm_brownie', hero: 'brownie', name: '전술 추격', icon: 'i_atk', max: 3, desc: '모든 무기·스킬: 제압·둔화·기절 대상 피해 +10%, 모든 무기 재장전 속도 +8%' },
    { id: 'm_leprechaun', hero: 'leprechaun', name: '제압 교리', icon: 'i_atk', max: 3, desc: '모든 무기·스킬: 제압 대상 피해 +10%, 모든 무기 탄창 +10%' },
    { id: 'm_nymph', hero: 'nymph', name: '기동 지원', icon: 'i_atk', max: 3, desc: '모든 무기·스킬: 제압·속박 대상 피해 +12%, 처치 시 회피 쿨타임 0.15초 감소(0.5초마다)' },
    { id: 'm_gnome', hero: 'gnome', name: '표식 연쇄', icon: 'i_atk', max: 3, desc: '모든 무기·스킬: 표식 대상 피해 +10%, 표식 적 처치 시 주변에 피해 8의 폭발(1초마다)' },
    { id: 'm_constantia', hero: 'constantia', name: '약점 포착', icon: 'i_atk', max: 3, desc: '모든 무기·스킬: 표식·속박 대상 피해 +16%' },
    { id: 'm_kheshig', hero: 'kheshig', name: '근접 대응', icon: 'i_atk', max: 3, desc: '모든 무기·스킬: 거리 4 이내 대상 피해 +12%' },
    { id: 'm_blacklilith', hero: 'blacklilith', name: '경호 전술', icon: 'i_atk', max: 3, desc: '모든 무기·스킬: 제압 대상 또는 경호 중 피해 +12%' },
    { id: 'm_lrl', hero: 'lrl', name: '암흑 추적', icon: 'i_atk', max: 3, desc: '모든 무기·스킬: 실명 대상 피해 +16%' },
    { id: 'm_ramparion', hero: 'ramparion', name: '돌파 교리', icon: 'i_atk', max: 3, desc: '모든 무기·스킬: 거리 3 이내 또는 속박·기절 대상 피해 +12%' },
  ];

  // ammo by gun family: a pickup only feeds guns of its own family, 10 % of that gun's reserve
  const AMMO = {
    rifle: { name: '소총탄', short: '소총', color: '#ffcc33', hex: 0xffcc33, guns: ['ar', 'burst', 'sylph'] },
    belt: { name: '기관총 탄띠', short: '탄띠', color: '#ff9a3a', hex: 0xff9a3a, guns: ['mg', 'minigun'] },
    shell: { name: '산탄', short: '산탄', color: '#ff5a4a', hex: 0xff5a4a, guns: ['sg'] },
    sniper: { name: '저격탄', short: '저격', color: '#cfe2ff', hex: 0xcfe2ff, guns: ['dmr', 'amr'] },
    explo: { name: '폭발탄', short: '폭발', color: '#9dff5a', hex: 0x9dff5a, guns: ['gl', 'mortar', 'cannon'] },
    energy: { name: '에너지 셀', short: '에너지', color: '#5ae8ff', hex: 0x5ae8ff, guns: ['pistol', 'shock', 'rail'] },
  };
  window.DATA = { RANKS, AMMO, HEROES, HIDDEN, GUNS, ITEMS, ENEMIES, ELITES, BOSSES, FLOORS, FARM, THEMES, STAGES, DIFFS, stageFloors, BAL, SYNERGY, UNLOCK, META, PERKS };
})();
