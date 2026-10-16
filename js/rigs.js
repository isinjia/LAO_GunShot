// Per-rig cut-out specs for the rogue-like: which arm subtrees to hide on the body (the hero walks "handless"),
// and which hand subtree (with the weapon it holds) floats beside the body and turns toward the aim.
//   hide: node names whose whole subtree is hidden on the body rig
//   hand: the node whose subtree becomes the floating hand + gun
//   ang:  degrees that turn the cut hand so the barrel points along +x
//   flipX: the rig's art faces left (mirror it so it faces +x)
(function () {
  const RIGS = {
    brownie: { hide: /^(Arm_up_R|Arm_up_L|FK_Arm_up_R|FK_Arm_up_L|body_weapon)$/, hand: 'hand_R', handL: 'hand_L', front: /(_03|RF_hand)$/, ang: 0 },
    leprechaun: { hide: /^(Arm_up_R|Arm_up_L|FK_Arm_up_R|FK_Arm_up_L)$/, hand: 'hand_R', handL: 'hand_L', front: /(_03|RF_hand)$/, ang: 0 },
    nymph: { hide: /^(Arm_up_R|Arm_up_L|FK_Arm_up_R|FK_Arm_up_L)$/, hand: 'hand_R', handL: 'hand_L', front: /(_03|RF_hand)$/, ang: 0 },
    gnome: { hide: /^(arm_r_up|arm_l_up|arm_l_up_2|gno_gun_die)$/, hand: 'hand_r', handL: 'hand_l', ang: 0 },
    valkyrie: { hide: /^(arm_r_upper|arm_l_upper|part_gun_main_victory_die)$/, hand: 'hand_r', handL: 'hand_l', ang: 0 },
    raven: { hide: /^(arm_r_up|arm_l_up)$/, hand: 'hand_l', ang: 0, skip: /base_l|gun_2/ },
    sylphid: { hide: /^(bone_R_arm_up|bone_L_arm_up|bone_weapon_gun_back)$/, hand: 'bone_R_hand', ang: 0 },
    constantia: { hide: /^(Arm_up_L|Arm_up_R)$/, hand: 'hand_R', handL: 'hand_L', ang: 0 },
    phoenix: { hide: /^(arm_r_up|arm_l_up)$/, hand: 'hand_l', ang: 0 },
    thetis: { hide: /^(Bone_UpperArm_R|Bone_UpperArm_L)$/, hand: 'Bone_Hand_L', ang: 0 },
    impet: { hide: /^(Arm_up_R|Arm_up_L)$/, hand: 'hand_R', ang: 0 },
    undine: { hide: /^(bone_L_Upperarm|bone_R_Upperarm)$/, hand: 'bone_R_Hand', ang: 0 },
    harpy: { hide: /^(Bone_UpperArm_R|Bone_UpperArm_L)$/, hand: 'Bone_Hand_R', ang: 0 },
    leona: { hide: /^(Arm_up_R|Arm_up_L|FK_Arm_up_R|FK_Arm_up_L)$/, hand: 'hand_R', ang: 0 },
    kheshig: { hide: /^(Bone_UpperArm_R|Bone_UpperArm_L|bone_gun_die)$/, hand: 'Bone_Hand_R', handL: 'Bone_Hand_L', ang: 0 },
    // hidden heroes
    blacklilith: { hide: /^(arm|shield|die_gun)$/, hand: 'hand_r', handL: 'hand_l', ang: 0 },
    PECS_LRL: { hide: /^(Arm_up_R|Arm_up_L|FK_Arm_up_R_01|FK_Arm_up_L_01)$/, hand: 'hand_L', handL: 'hand_R', front: /_hand_L_01$|_hand_R_02$/, ang: 0 }, // her idle pose: the axe in the left fist (palm behind the haft, fingers over it), the right hand open beside it
    e_Rampart_N: { hide: /^(bone_Arm_F_1|bone_Arm_B_1)$/, hand: 'bone_Arm_B_3', ang: 0 },
    AGS_Rampart_NS1: { hide: /^(bone_Arm_F_1|bone_Arm_B_1)$/, hand: 'bone_Arm_F_2', aimNode: 'bone_Arm_F_3', skip: /wing|Blade/, ang: 0 }, // the repulsor: its front forearm and gold-clawed fist float and point (the wing blades parked on that arm stay off) // 램파리온 (Skin_AGS_Rampart_1); breaks down into e_Rampart_N
  };

  // the floating hand: a second instance of the rig showing only the hand subtree, frozen in its idle pose,
  // re-centred so the wrist sits on the group's origin and the barrel points along +x
  // inside a hand subtree, hand art lives on nodes named *_hand*, *_Hand_* (and Valkyrie's bandages); the rest is the weapon
  const HAND_ART = /_hand(_|$)|bandage/i;
  // part: undefined = hand + gun as drawn in the source rig, 'gun' = only the weapon, 'hand' = only the hand art
  // (the orientation is always solved from the whole subtree, so a cut hand keeps its grip angle on a +x barrel)
  function makeHand(id, k, clip, part, side) {
    const spec = RIGS[id];
    if (!spec || !spec.hand || !SD.ready(id)) return null;
    const c = SD.create(id);
    c.play(clip || spec.clip || 'idle');
    if (spec.t) { c.time = spec.t; c.apply(); c.render(); }
    const hi = c.nodeIndex(spec.hand);
    if (hi < 0) { c.dispose(); return null; }
    // part 'hand' also brings the left hand (handL), kept where the idle pose puts it relative to the right wrist
    const li = part && part !== 'gun' && spec.handL ? c.nodeIndex(spec.handL) : -1;
    c.setOnly((p, n, i) => i === hi || i === li);
    const inMain = (node) => node >= hi && node < c.tpl.end[hi];
    const inSide = (ri) => !side || (side === 'R') === inMain(tp.rends[ri].node);
    const W = c.W, o = hi * 12, tp = c.tpl;
    const isHandArt = (ri) => HAND_ART.test(tp.data.nodes[tp.rends[ri].node].n || '');
    // back-of-grip pieces (…LB_/RB_… or …_B) sit behind the weapon in the source art; front pieces in front of it
    // (spec.front names the pieces that wrap over the weapon, e.g. the Steel Line fist: knuckles in front, back of the hand behind)
    const isBack = (ri) => { const n = tp.data.nodes[tp.rends[ri].node].n || ''; return spec.front ? !spec.front.test(n) : /(^|_)[LR]B_|_B(_|$)/.test(n); };
    const skipArt = (ri) => spec.skip && spec.skip.test(tp.data.nodes[tp.rends[ri].node].n || '');
    const keepPart = (ri) => !part || (part === 'grip' ? !skipArt(ri) && (inMain(tp.rends[ri].node) || isHandArt(ri)) : part === 'gun' ? !isHandArt(ri) && !skipArt(ri) : isHandArt(ri) && inSide(ri) && (part === 'hand' || part === 'handAll' || (part === 'handB') === isBack(ri)));
    const rawPart = [];
    // visible art corners in rig space, relative to the wrist
    const hx = W[o + 9], hy = W[o + 10];
    const raw = [];
    tp.rends.forEach((r, ri) => {
      if (r.kind !== 0 || c.mask[ri] || !c.EA[r.node] || !c.rEn[ri] || r.add) return;
      const s = tp.sprites[c.rKey[ri]];
      if (!s) return;
      const q = r.node * 12;
      const fx = c.rFlip[ri] ? -1 : 1, fy = c.rFlipY[ri] ? -1 : 1;
      for (const [lx, ly] of [[s.x0 * fx, s.y0 * fy], [s.x1 * fx, s.y0 * fy], [s.x0 * fx, s.y1 * fy], [s.x1 * fx, s.y1 * fy]]) {
        const pt = [W[q] * lx + W[q + 3] * ly + W[q + 9] - hx, W[q + 1] * lx + W[q + 4] * ly + W[q + 10] - hy];
        raw.push(pt); if (keepPart(ri)) rawPart.push(pt);
      }
    });
    // barrel direction: the long axis of the biggest sprite in the hand (the gun itself), pointed toward the
    // art farthest from the wrist (the muzzle end); the spec can add a fine turn
    let far = [1, 0], fd = 0;
    raw.forEach((p) => { const d = Math.hypot(p[0], p[1]); if (d > fd) { fd = d; far = p; } });
    let axis = null, best = 0;
    tp.rends.forEach((r, ri) => {
      if (r.kind !== 0 || c.mask[ri] || !c.EA[r.node] || !c.rEn[ri] || r.add) return;
      const sp = tp.sprites[c.rKey[ri]];
      if (!sp || isHandArt(ri) || !inMain(r.node)) return;
      const q = r.node * 12, fx = c.rFlip[ri] ? -1 : 1, fy = c.rFlipY[ri] ? -1 : 1;
      const ax = [W[q] * fx, W[q + 1] * fx], ay = [W[q + 3] * fy, W[q + 4] * fy];
      const lx = (sp.x1 - sp.x0) * Math.hypot(ax[0], ax[1]), ly = (sp.y1 - sp.y0) * Math.hypot(ay[0], ay[1]);
      const area = lx * ly;
      if (area > best) { best = area; axis = lx >= ly ? ax : ay; }
    });
    let dir = axis ? Math.atan2(axis[1], axis[0]) : Math.atan2(far[1], far[0]);
    if (Math.cos(dir) * far[0] + Math.sin(dir) * far[1] < 0) dir += Math.PI;
    /* Arm weapons aim from the elbow toward the wrist, independent of armor sprite axes. */
    const aimNode = spec.aimNode ? c.nodeIndex(spec.aimNode) : -1;
    if (aimNode >= 0) dir = Math.atan2(W[aimNode * 12 + 10] - hy, W[aimNode * 12 + 9] - hx);
    const rot = -dir + (spec.ang || 0) * Math.PI / 180;
    const cs = Math.cos(rot), sn = Math.sin(rot);
    const inner = c.root;
    inner.scale.set(k, k, 1);
    inner.rotation.z = rot;
    const px = hx * k, py = hy * k;
    inner.position.set(-(cs * px - sn * py), -(sn * px + cs * py), 0);
    const group = new THREE.Group();
    group.add(inner);
    if (part) { tp.rends.forEach((r, ri) => { if (!keepPart(ri)) c.mask[ri] = 1; }); c.render(); }
    const pts = (part && rawPart.length ? rawPart : raw).map(([x, y]) => [(cs * x - sn * y) * k, (sn * x + cs * y) * k]);
    let mx = -Infinity, x0 = Infinity, y0 = Infinity, y1 = -Infinity;
    pts.forEach(([x, y]) => { mx = Math.max(mx, x); x0 = Math.min(x0, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
    const ys = pts.filter(([x]) => x > mx - 0.1).map(([, y]) => y);
    const my = ys.length ? ys.reduce((a2, b) => a2 + b, 0) / ys.length : 0;
    if (!isFinite(mx)) { mx = 0.4; x0 = 0; y0 = y1 = 0; }
    return { group, c, muzzle: [mx, my], len: mx - x0, box: [x0, y0, mx, y1] };
  }

  RIGS.makeHand = makeHand;
  window.RIGS = RIGS;
})();
