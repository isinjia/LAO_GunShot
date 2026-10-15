// Extra original LAST ORIGIN sound effects (AssetBundleResource/Sounds/SFX/Common) converted for the rogue-like:
// reload start / end, dodge roll and landing, hurt crack, crate break, shield hit, footstep, casing drop.
(function () {
  const k = ['reloadIn', 'reloadOut', 'roll', 'land', 'hurt', 'crate', 'shield', 'step', 'shell', 'hitS', 'hitM', 'hitB', 'hitE', 'hitF', 'warp', 'doorOpen', 'elevator', 'hatch',
    'eChick', 'eBigChick', 'eCenturion', 'eLegion', 'eHarvester', 'eRoar', 'eKnight', 'eGolt', 'eScout', 'eWatcher', 'eCM', 'eDE',
    'dieS', 'dieM', 'dieL', 'uiIn', 'uiEquip', 'uiPick', 'uiBattle', 'uiStage', 'uiCoin', 'heart'];
  k.forEach((n) => { window.SND[n] = 'assets/sfx/' + n + '.mp3'; });
  // extra original BGM: B3 floor, B2 / final boss, Labiata's shop, the ending
  ['battle3', 'battle4', 'battle5', 'march', 'tension1', 'tension2', 'stage10', 'northern', 'outctrl', 'horror2', 'aftermath', 'boss10', 'boss2', 'boss3', 'bossGamma', 'bossZeta', 'bossFinal', 'shop', 'ending'].forEach((n) => { window.BGM[n] = 'assets/bgm/' + n + '.mp3'; });
})();
