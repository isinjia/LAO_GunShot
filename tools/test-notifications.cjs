const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const ui = fs.readFileSync('js/ui.js', 'utf8');
let now = 10000, nextTimer = 1; const timers = new Map();
function node() { return {children: [], dataset: {}, classList: {contains: () => false, add() {}}, style: {setProperty() {}}, hidden: true,
  get firstChild() {return this.children[0]}, get lastElementChild() {return this.children.at(-1)},
  set innerHTML(v) {this.html = v; this.children = []}, get innerHTML() {return this.html || ''},
  appendChild(n) {n.parent = this; this.children.push(n)}, remove() {if (this.parent) this.parent.children = this.parent.children.filter(n => n !== this)} }; }
const el = {toasts: node(), announce: node(), skillCut: node(), bossIntro: node(), banner: node()};
const G = {phase: 'play', room: {active: true}, P: {dead: false}};
const context = {GAME: {G}, el, performance: {now: () => now}, document: {createElement: node},
  setTimeout(fn, delay) {const id = nextTimer++; timers.set(id, {fn, at: now + delay}); return id}, clearTimeout(id) {timers.delete(id)},
  RANKS: Array.from({length: 4}, () => ({color: '#fff'})), rankImg: () => 'none'};
vm.createContext(context);
vm.runInContext(ui.slice(ui.indexOf('  const tq = []'), ui.indexOf('  let chEl =')), context);
vm.runInContext(ui.match(/  function announce\(head, name, desc, rank, icon\) \{[\s\S]*?\n  }/)[0], context);
function run(code) {return vm.runInContext(code, context)}
function advance(ms) {now += ms; for (const [id,t] of [...timers]) if(t.at <= now) {timers.delete(id); t.fn()}}
run("toast('체력 +25', 'gem'); toast('체력 +50', 'gem')");
assert.equal(el.toasts.children.length, 1); assert.equal(el.toasts.firstChild.textContent, '체력 +75');
run("toast('탄약 +10 · 기관총', 'gem'); toast('탄약 +15 · 기관총', 'gem')");
assert.equal(el.toasts.firstChild.textContent, '탄약 +25 · 기관총');
run("announce('무기 획득', '레일건', '무기 상세 설명', 2)");
assert.equal(el.toasts.children.length, 1); assert.match(el.toasts.firstChild.innerHTML, /레일건/);
assert.equal(el.announce.children.length, 0); assert.equal(run('noticeDetails.length'), 1);
run('noticeTick()'); assert.equal(el.announce.children.length, 0);
G.room.active = false; G.paused = true; run('noticeTick()'); assert.equal(el.announce.children.length, 0);
G.paused = false; run('noticeTick()'); assert.equal(el.announce.children.length, 1); assert.match(el.announce.firstChild.innerHTML, /무기 상세 설명/);
G.room.active = true; run('noticeTick()'); assert.equal(el.announce.children.length, 0);
run("toast('오래된 알림', 'warn'); clearToasts(true)"); advance(6000); assert.equal(el.toasts.children.length, 0); assert.equal(run('noticeDetails.length'), 0);
console.log('PASS: one combat notice, merged health/ammo, immediate pickup name/icon, deferred details, pause guard, combat transition, run reset.');
