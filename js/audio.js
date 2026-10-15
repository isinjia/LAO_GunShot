// Sound manager. Web Audio (decoded buffers: low latency, overlapping plays, cheap on phones) when the page is
// served over http(s); HTMLAudio pools as the fallback for file:// where fetch is unavailable.
(function () {
  const pools = {};
  const last = {};
  const VOL = { sfx: 0.45, bgm: 0.35, voice: 1, master: 1 };
  // per-track trims so floors, bosses and the shop sit at a similar loudness
  const BGMG = {}; // every track is loudness-normalised at build time (tools/build_bgm.py, -16 LUFS)
  // ?mute=1 (testing): silent for this page only; the saved sound option is left alone
  const FORCE_MUTE = /[?&]mute=1(&|$)/.test(location.search);
  let muted = FORCE_MUTE, userMuted = false;
  let bgm = null;
  let bgmKey = null;

  // Per-key throttle so rapid-fire units don't turn into noise.
  const GAP = { rifle: 55, eChick: 120, eScout: 120, eWatcher: 120, eDE: 120, eLegion: 120, eCenturion: 120, eCM: 120, eHarvester: 150, eBigChick: 150, eKnight: 150, dieS: 70, dieM: 90, uiPick: 50, hitS: 55, hitM: 60, hitB: 80, hitE: 80, hitF: 80, step: 200, shell: 120, roll: 150, mg: 60, gun: 70, spray: 160, slash: 70, swing: 90, laser: 90, coin: 40, expS: 60, handgun: 60, elec: 80 };
  const VOLS = { eKnight: 2.0, fail: 1.5, reloadIn: 1.5, reloadOut: 1.5, dieS: 0.7, dieM: 0.8, dieL: 0.9, uiPick: 0.6, uiIn: 0.7, hitS: 0.55, hitM: 0.6, hitB: 0.7, hitE: 0.55, hitF: 0.6, step: 0.5, shell: 0.4, hurt: 1, spray: 0.25, mg: 0.24, rifle: 0.5, quake: 0.6, genB: 0.6, genA: 0.6, warning: 0.6, click: 0.4, coin: 0.45 };
  const MAX_VOICES = 18;
  // rapid-fire samples with long ringing tails: cut short so steady fire doesn't hold every voice
  const TAIL = { click: 0.16, rifle: 0.45, mg: 0.4, gun: 0.6, handgun: 0.6, elec: 0.5, hitE: 0.45, hitS: 0.35, hitM: 0.45, shell: 0.4, step: 0.3 };
  const VARY = { rifle: 1, mg: 1, gun: 1, handgun: 1, hitS: 1, hitM: 1, hitB: 1, step: 1, shell: 1, expS: 1, eChick: 1, eScout: 1, eWatcher: 1, eDE: 1, eLegion: 1, eCenturion: 1, laser: 1, cannon: 1, dieS: 1, coin: 1 };
  const LOW = { step: 1, uiCoin: 1, coin: 1, shell: 1 };
  const HIGH = { doorOpen: 1, clear: 1, rankUp: 1, rankUpSS: 1, warp: 1, reinforce: 1, uiEquip: 1, purchase: 1, warning: 1, hitB: 1, hurt: 1, shield: 1, expB: 1, laserBig: 1, eGolt: 1, eRoar: 1, uiBattle: 1, win: 1, fail: 1 }; // gameplay-critical cues // ambience yields to combat sounds // simultaneous effects (mobile mixers choke beyond this)

  const AC = window.AudioContext || window.webkitAudioContext;
  const web = !!AC && location.protocol !== 'file:';
  let ctx = null, sfxGain = null, bgmGain = null, master = null, mainGain = null;
  const bgmTarget = () => (muted ? 0 : VOL.bgm * (BGMG[bgmKey] || 1));
  const buffers = {}, loading = {}, pendingPlay = {}, noiseBufs = {};
  let voices = 0;
  const stats = { played: {}, skipped: {}, loading: {}, synth: {} };
  let analyser = null;

  function ensureCtx() {
    if (!web || ctx) return ctx;
    ctx = new AC();
    sfxGain = ctx.createGain();
    sfxGain.gain.value = muted ? 0 : 1;
    // a gentle master compressor keeps dense firefights from clipping
    master = ctx.createDynamicsCompressor();
    master.threshold.value = -16; master.knee.value = 12; master.ratio.value = 4; master.attack.value = 0.004; master.release.value = 0.18;
    mainGain = ctx.createGain(); mainGain.gain.value = VOL.master; // the master volume slider
    master.connect(mainGain).connect(ctx.destination);
    sfxGain.connect(master);
    analyser = ctx.createAnalyser(); analyser.fftSize = 2048;
    sfxGain.connect(analyser);
    bgmGain = ctx.createGain(); // iOS ignores HTMLMediaElement.volume: music volume goes through a gain node
    bgmGain.gain.value = muted ? 0 : VOL.bgm;
    bgmGain.connect(master || ctx.destination); // music shares the master compressor with the effects
    bgmGain.connect(analyser);
    return ctx;
  }
  // browsers (iOS in particular) only start audio inside a user gesture
  function unlock() {
    const c = ensureCtx();
    if (c && c.state !== 'running' && !document.hidden) c.resume().catch(() => {}); // 'suspended' or iOS 'interrupted' (call, Siri)
    if (bgm && bgm.paused && !document.hidden) bgm.play().catch(() => {});
  }
  ['pointerdown', 'touchend', 'keydown'].forEach((ev) => window.addEventListener(ev, unlock, { passive: true }));

  function load(key) {
    if (buffers[key] || loading[key] || !window.SND[key]) return;
    const c = ensureCtx();
    if (!c) return;
    loading[key] = fetch(window.SND[key]).then((r) => r.arrayBuffer())
      .then((ab) => new Promise((res, rej) => c.decodeAudioData(ab, res, rej)))
      .then((buf) => { buffers[key] = buf; })
      .catch(() => { delete loading[key]; /* a failed fetch is retried on the next play */ });
  }

  function get(key) {
    let p = pools[key];
    if (!p) {
      p = pools[key] = { list: [], i: 0 };
      for (let n = 0; n < 4; n++) {
        const a = new Audio(window.SND[key]);
        a.preload = 'auto';
        p.list.push(a);
      }
    }
    return p;
  }

  function play(key, vol = 1, pan = 0) {
    if (muted || !window.SND[key]) return;
    const now = performance.now();
    if (now - (last[key] || 0) < (GAP[key] || 45)) return;
    last[key] = now;
    const v = Math.min(1, VOL.sfx * vol * (VOLS[key] || 1));
    if (web) {
      const c = ensureCtx();
      const buf = buffers[key];
      if (!buf) {
        load(key); stats.loading[key] = (stats.loading[key] || 0) + 1;
        // only one deferred replay per sound while it decodes (rapid fire used to burst them all at once)
        if (loading[key] && !pendingPlay[key]) { pendingPlay[key] = true; const t0 = now; loading[key].then(() => { pendingPlay[key] = false; if (performance.now() - t0 < 900 && buffers[key]) { last[key] = 0; play(key, vol, pan); } }, () => { pendingPlay[key] = false; }); }
        return;
      }
      if (c.state !== 'running' || voices >= MAX_VOICES + (HIGH[key] ? 6 : 0) || (LOW[key] && voices >= MAX_VOICES - 5)) { stats.skipped[key] = (stats.skipped[key] || 0) + 1; return; }
      stats.played[key] = (stats.played[key] || 0) + 1;
      const src = c.createBufferSource();
      const g = c.createGain();
      g.gain.value = v;
      src.buffer = buf;
      if (VARY[key]) src.playbackRate.value = (key === 'step' || key[0] === 'h' ? 0.9 : 0.95) + Math.random() * (key === 'step' || key[0] === 'h' ? 0.2 : 0.1); // ±5 % so rapid fire doesn't sound looped
      if (pan && c.createStereoPanner) {
        // sounds sit where their source is on screen; far off-screen ones are a little quieter
        const pn = c.createStereoPanner();
        pn.pan.value = Math.max(-1, Math.min(1, pan)) * 0.75;
        g.gain.value = v * (1 - Math.min(0.35, Math.abs(pan) * 0.2));
        src.connect(g).connect(pn).connect(sfxGain);
      } else src.connect(g).connect(sfxGain);
      voices++;
      src.onended = () => { voices--; };
      src.start();
      if (TAIL[key] && buf.duration > TAIL[key]) { const t = c.currentTime + TAIL[key]; g.gain.setValueAtTime(g.gain.value, t - 0.08); g.gain.linearRampToValueAtTime(0.0001, t); src.stop(t + 0.01); }
      return;
    }
    const p = get(key);
    const a = p.list[p.i++ % p.list.length];
    try {
      a.currentTime = 0;
      a.volume = Math.min(1, v * VOL.master); // file:// fallback honours the master slider too
      a.play().catch(() => {});
    } catch (e) { /* ignore */ }
  }

  let bgmEl = null; // reused: a new element / MediaElementSource per track would leak decoders and graph nodes
  const BUFMUSIC = typeof matchMedia === 'function' && !matchMedia('(pointer: coarse)').matches; // phones keep the streaming element (memory)
  const mbuf = new Map();
  let mSrc = null, mReq = 0, mKey = null, mAt = 0;
  const mPos = {};
  function musicBuf(key) {
    const c = ensureCtx();
    const req = ++mReq;
    const t = c.currentTime;
    const old = mSrc; mSrc = null;
    if (old && mKey && old.buffer) { // where the old track was (it may not have started yet if switched within the cross-fade)
      const len = Math.max(1, old.loopEnd - old.loopStart), el = c.currentTime - mAt;
      mPos[mKey] = (old.loopStart || 0) + (el > 0 ? el % len : 0);
    }
    mKey = key;
    // true cross-fade: each track has its own fader under the shared music bus, so the old one fades out
    // while the new one fades in (no dip to silence between room-clear / shop / boss tracks)
    if (old) { const og = old.fader.gain; og.cancelScheduledValues(t); og.setValueAtTime(og.value, t); og.linearRampToValueAtTime(0.0001, t + (key ? 1.1 : 0.45)); try { old.stop(t + (key ? 1.15 : 0.5)); } catch (e) { /* ended */ } }
    if (!key || muted) return; // a muted game never pays for decoding; unmuting starts the current track
    { const bg = bgmGain.gain; bg.cancelScheduledValues(t); bg.setValueAtTime(bg.value, t); bg.linearRampToValueAtTime(bgmTarget() * (performance.now() < voiceUntil ? 0.5 : 1), t + 0.3); } // the bus sits at the music volume (still ducked if a voice line is playing)
    const start = (buf) => {
      if (req !== mReq) return;
      const s = c.createBufferSource();
      s.buffer = buf; s.loop = true;
      if (buf._ls == null) {
        // find where the sound starts / stops (below -42 dB counts as silence) so a loop never has dead air
        const ch = buf.getChannelData(0), sr = buf.sampleRate, th = 0.008;
        let i0 = 0, i1 = ch.length - 1;
        while (i0 < ch.length && Math.abs(ch[i0]) < th) i0++;
        while (i1 > i0 && Math.abs(ch[i1]) < th) i1--;
        buf._ls = Math.max(0.02, i0 / sr); buf._le = Math.min(buf.duration - 0.02, i1 / sr);
      }
      s.loopStart = buf._ls; s.loopEnd = Math.max(s.loopStart + 1, buf._le);
      const fader = c.createGain();
      s.connect(fader).connect(bgmGain); s.fader = fader;
      const at = c.currentTime + 0.02;
      const p = mPos[key];
      const from = Number.isFinite(p) && p >= s.loopStart && p < s.loopEnd ? p : s.loopStart;
      try { s.start(at, from); } catch (e) { s.start(at, s.loopStart); }
      mAt = at - (from - s.loopStart);
      fader.gain.setValueAtTime(0.0001, at); fader.gain.linearRampToValueAtTime(1, at + (old ? 1.1 : 0.8));
      mSrc = s;
    };
    if (mbuf.has(key)) { const b = mbuf.get(key); mbuf.delete(key); mbuf.set(key, b); return start(b); } // most-recently used last
    fetch(window.BGM[key]).then((r) => r.arrayBuffer()).then((ab) => new Promise((res, rej) => c.decodeAudioData(ab, res, rej)))
      .then((buf) => { mbuf.delete(key); mbuf.set(key, buf); while (mbuf.size > 2) mbuf.delete(mbuf.keys().next().value); start(buf); }) // the current and previous track stay decoded (decoded PCM is large on phones)
      .catch(() => { if (req === mReq && bgmKey === key) bgmKey = null; }); // a failed track stays silent, but the next request for it retries
  }
  function music(key) {
    if (bgmKey === key) return;
    bgmKey = key;
    if (web && BUFMUSIC && ensureCtx()) return musicBuf(key);
    if (!bgmEl) {
      bgmEl = new Audio();
      bgmEl.loop = true;
      bgmEl.preload = 'auto';
      const c = ensureCtx();
      if (c) {
        try { c.createMediaElementSource(bgmEl).connect(bgmGain); bgmEl.volume = 1; } catch (e) { bgmEl.volume = VOL.bgm * VOL.master; }
      } else bgmEl.volume = VOL.bgm * VOL.master;
    }
    // short fade out / in between tracks (Web Audio gain), a hard switch on the HTMLAudio fallback
    const swap = () => {
      bgmEl.pause();
      if (!key) { bgm = null; bgmEl.removeAttribute('src'); bgmEl.load(); return; }
      bgm = bgmEl;
      bgm.src = window.BGM[key];
      bgm.muted = muted;
      if (!document.hidden) bgm.play().catch(() => {});
      if (ctx && bgmGain) { const t = ctx.currentTime; bgmGain.gain.cancelScheduledValues(t); bgmGain.gain.setValueAtTime(0.0001, t); bgmGain.gain.linearRampToValueAtTime(bgmTarget(), t + 0.8); }
    };
    if (ctx && bgmGain && bgm && !bgm.paused) {
      const t = ctx.currentTime; bgmGain.gain.cancelScheduledValues(t); bgmGain.gain.setValueAtTime(bgmGain.gain.value, t); bgmGain.gain.linearRampToValueAtTime(0.0001, t + 0.45);
      clearTimeout(music._t); music._t = setTimeout(swap, 460); music.fadeAt = performance.now();
    } else swap();
  }

  function setMuted(m) {
    userMuted = m;
    m = m || FORCE_MUTE;
    muted = m;
    if (bgm) bgm.muted = m;
    // cancel any scheduled fade first, or a cross-fade in flight would ramp the music back up after muting
    if (sfxGain) { sfxGain.gain.cancelScheduledValues(ctx.currentTime); sfxGain.gain.value = m ? 0 : 1; }
    if (bgmGain) { bgmGain.gain.cancelScheduledValues(ctx.currentTime); bgmGain.gain.value = m ? 0 : VOL.bgm * (BGMG[bgmKey] || 1); }
    if (mSrc && mSrc.fader && !m) { mSrc.fader.gain.cancelScheduledValues(ctx.currentTime); mSrc.fader.gain.value = 1; }
    if (!m && web && BUFMUSIC && bgmKey && !mSrc && ctx) { const k = bgmKey; mKey = null; musicBuf(k); }
  }

  // settings screen: 0..1 multipliers for music and effects
  const BASE = { sfx: VOL.sfx, bgm: VOL.bgm, voice: 1, master: 1 };
  function setVolume(kind, v) {
    v = Number(v);
    if (!BASE[kind] || !Number.isFinite(v)) return;
    VOL[kind] = BASE[kind] * Math.max(0, Math.min(1, v));
    // ramp (not .value =) so a slider moved during a fade isn't overwritten by the scheduled automation
    if (kind === 'bgm') {
      if (bgmGain) { const t = ctx.currentTime; bgmGain.gain.cancelScheduledValues(t); bgmGain.gain.setTargetAtTime(bgmTarget(), t, 0.03); } else if (bgm) bgm.volume = VOL.bgm * VOL.master;
    }
    if (kind === 'master') {
      if (mainGain) { const t = ctx.currentTime; mainGain.gain.cancelScheduledValues(t); mainGain.gain.setTargetAtTime(VOL.master, t, 0.03); }
      if (bgm && !bgmGain) bgm.volume = VOL.bgm * VOL.master;
    }
  }
  function getVolume(kind) { return VOL[kind] / BASE[kind]; }

  // background tab / locked phone: silence everything, resume when back
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (bgm) bgm.pause();
      if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {});
    } else {
      if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
      if (bgm) bgm.play().catch(() => {});
    }
  });

  // Warm up the frequent sounds; the rest decode on first use (decoded PCM is ~10x the mp3 size).
  const FREQUENT = ['warp', 'doorOpen', 'hatch', 'win', 'elevator', 'uiStage', 'hurt', 'shield', 'roll', 'land', 'eChick', 'eScout', 'eWatcher', 'eDE', 'dieS', 'dieM', 'uiPick', 'uiBattle', 'uiIn', 'uiEquip', 'hitS', 'hitM', 'hitB', 'hitE', 'hitF', 'reloadIn', 'reloadOut', 'roll', 'land', 'hurt', 'crate', 'shield', 'step', 'rifle', 'gun', 'mg', 'cannon', 'handgun', 'laserBig', 'elec', 'expS', 'expM', 'expB', 'expSF', 'coin', 'energy', 'swing', 'click', 'start', 'fail', 'warning', 'clear', 'pickSS', 'rankUp', 'reinforce', 'genS', 'laser', 'missile', 'charge', 'purchase'];
  function preload() {
    if (web) FREQUENT.forEach(load);
    else FREQUENT.slice(0, 11).forEach(get);
  }
  // decode a floor's own cues (its enemies' and boss's sounds) ahead of the first fight
  function warm(keys) { if (web) keys.forEach((k) => { if (k && window.SND[k]) load(k); }); }


  // small synthesized cues the original sound set lacks (reload, empty click, hurt thud, footstep-free UI ticks)
  function synth(kind, vol = 1) {
    if (muted || !web) return;
    // recorded cues where the original set has one: a heartbeat, and a dry trigger click
    if (kind === 'beat' && window.SND.heart) return play('heart', 0.9 * vol);
    if (kind === 'empty' && window.SND.click) return play('click', 0.55 * vol);
    const c = ensureCtx();
    if (!c || c.state !== 'running') return;
    const now = performance.now();
    if (now - (last['~' + kind] || 0) < 40) return;
    last['~' + kind] = now;
    if (voices >= MAX_VOICES) return; // synth cues share the voice cap
    stats.synth[kind] = (stats.synth[kind] || 0) + 1;
    voices++; setTimeout(() => { voices--; }, 450);
    const t0 = c.currentTime, g = c.createGain();
    g.connect(sfxGain);
    const v = VOL.sfx * vol;
    const noise = (dur, f0, q, gain, at) => {
      // noise bursts are cached per length (a new AudioBuffer per cue was garbage on every reload / hit)
      const nk = 'n' + dur; let b = noiseBufs[nk];
      if (!b) { const n = Math.floor(c.sampleRate * dur); b = noiseBufs[nk] = c.createBuffer(1, n, c.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3); }
      const s = c.createBufferSource(); s.buffer = b;
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = f0; f.Q.value = q;
      const gg = c.createGain(); gg.gain.value = gain * v;
      s.connect(f).connect(gg).connect(g); s.start(t0 + at);
    };
    const tone = (type, f0, f1, dur, gain, at = 0) => {
      const o = c.createOscillator(), gg = c.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t0 + at); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + at + dur);
      gg.gain.setValueAtTime(gain * v, t0 + at); gg.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
      o.connect(gg).connect(g); o.start(t0 + at); o.stop(t0 + at + dur + 0.02);
    };
    if (kind === 'reload') { noise(0.05, 2400, 3, 1.2, 0); noise(0.06, 1500, 4, 1.2, 0.16); tone('square', 900, 600, 0.04, 0.15, 0.17); }
    else if (kind === 'reloaded') { noise(0.04, 3200, 5, 1.4, 0); tone('square', 1400, 1100, 0.05, 0.12, 0.01); }
    else if (kind === 'empty') { noise(0.03, 3800, 6, 1.0, 0); }
    else if (kind === 'hurt') { tone('sawtooth', 240, 60, 0.28, 0.5); noise(0.18, 500, 1, 1.6, 0); }
    else if (kind === 'dodge') { noise(0.22, 900, 0.8, 0.9, 0); }
    else if (kind === 'tick') { tone('triangle', 1200, 1500, 0.05, 0.25); }
    else if (kind === 'door') { tone('sawtooth', 110, 70, 0.4, 0.35); noise(0.3, 300, 1, 1.0, 0); }
    else if (kind === 'open') { tone('sine', 440, 880, 0.25, 0.3); tone('sine', 660, 1320, 0.25, 0.2, 0.08); }
    else if (kind === 'blip') { tone('square', 700, 900, 0.06, 0.12); }
    else if (kind === 'beat') { tone('sine', 70, 45, 0.16, 0.9); tone('sine', 65, 40, 0.14, 0.7, 0.2); }
    else if (kind === 'ebullet') { tone('sine', 520, 300, 0.07, 0.12); }
  }

  // original hero voice lines (assets/voice/<hero>/<line>.mp3) through Web Audio: one at a time, into the
  // master compressor, a little under the sound effects' peak; the music dips while she speaks and always comes back
  const vbuf = {}, VGAIN = {}, vOrder = []; // voice files are loudness-normalised (-18 LUFS) at build time
  let voiceSrc = null, voiceUntil = 0, duckT = 0;
  // each event can draw from several original lines; frequent events have a cooldown so they never nag
  const VPOOL = { ItemEquip: ['ItemEquip', 'Join', 'SquadJoin'], StageStart: ['StageStart', 'Leader'], Idle: ['Idle_01_01', 'Idle_02_01'] };
  const VCD = { ItemEquip: 30000, Repair: 20000, PresentGet: 15000, ActionApprove: 15000, BattleFocus: 8000, Idle: 45000 };
  const vLast = {};
  function voice(hero, event, vol = 1, force) {
    if (muted || !hero || !web || VOL.voice <= 0.001) return;
    const c = ensureCtx();
    if (!c) return;
    const now = performance.now();
    if (!force && now < voiceUntil) return; // don't talk over herself
    if (VCD[event] && now - (vLast[event] || -1e9) < VCD[event]) return;
    if (c.state !== 'running') return; // a line that can't play doesn't spend its cooldown
    vLast[event] = now;
    const pool = VPOOL[event] || [event], line = pool[Math.floor(Math.random() * pool.length)];
    const key = hero + '/' + line;
    const go = (buf) => {
      if (muted || c.state !== 'running') { vLast[event] = 0; return; }
      if (voiceSrc) try { voiceSrc.stop(); } catch (e) { /* already ended */ }
      const src = c.createBufferSource(), gn = c.createGain();
      src.buffer = buf; gn.gain.value = Math.min(1.2, BASE.sfx * VOL.voice * 1.15 * vol * (VGAIN[hero] || 1)); // own slider
      src.connect(gn).connect(sfxGain);
      src.start();
      voiceSrc = src; voiceUntil = performance.now() + buf.duration * 1000;
      if (bgmGain) {
        const t = c.currentTime;
        bgmGain.gain.cancelScheduledValues(t); bgmGain.gain.setValueAtTime(bgmGain.gain.value, t);
        bgmGain.gain.linearRampToValueAtTime(bgmTarget() * 0.5, t + 0.15);
        clearTimeout(duckT);
        duckT = setTimeout(() => { if (performance.now() - (music.fadeAt || 0) < 900) return; /* a track change is fading the bus: it owns the gain */ const t2 = c.currentTime; bgmGain.gain.cancelScheduledValues(t2); bgmGain.gain.setValueAtTime(bgmGain.gain.value, t2); bgmGain.gain.linearRampToValueAtTime(bgmTarget(), t2 + 0.5); }, buf.duration * 1000 + 100);
      }
    };
    if (vbuf[key]) return go(vbuf[key]);
    fetch(`assets/voice/${key}.mp3`).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('no voice'))))
      .then((ab) => new Promise((res, rej) => c.decodeAudioData(ab, res, rej)))
      .then((b) => {
        if (!vbuf[key]) vOrder.push(key); vbuf[key] = b;
        while (vOrder.length > 24) delete vbuf[vOrder.shift()]; // decoded voice lines are kept for the 24 most recent only (phones)
        if (performance.now() - now < 800) go(b);
      })
      .catch(() => { /* missing line: stay silent, the music is untouched */ });
  }

  window.SFX = {
    debug: { stats, buffers, get ctx() { return ctx; }, get bgm() { return bgmEl; }, get bgmKey() { return bgmKey; }, level() { if (!analyser) return 0; const a = new Float32Array(analyser.fftSize); analyser.getFloatTimeDomainData(a); let m = 0; for (const v of a) m = Math.max(m, Math.abs(v)); return m; } },
    play, synth, voice, music, setMuted, setVolume, getVolume, preload, warm, unlock, get muted() { return muted; }, get userMuted() { return userMuted; } };
})();
