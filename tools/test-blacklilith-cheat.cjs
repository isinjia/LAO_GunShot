const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ui=fs.readFileSync('js/ui.js','utf8'),game=fs.readFileSync('js/game.js','utf8');
let selected=null,now=0;const c={performance:{now:()=>now+=100},sessionStorage:{setItem(){}},SFX:{play(){},voice(){}},toast(){},dressRandomCard(){},selectHero(i){selected=i},selHero:0,setTimeout(){}};c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync('js/data.js','utf8'),c);c.HEROES=c.DATA.HEROES;
vm.runInContext('let cheatsOn=false,forcedHidden=null;'+ui.slice(ui.indexOf('  const K_ ='),ui.indexOf('  function touchHeroDirection')),c);
function run(s){return vm.runInContext(s,c)}
function type(text){for(const ch of text)c.trackCheat({code:'Key'+ch})}
const black=c.DATA.HIDDEN.find(h=>h.id==='blacklilith');
type('QMFFORFLFLTM');assert.equal(run('blackLilithUnlocked'),false);assert.equal(c.hiddenAllowed(black),false);
type('CLXMGHKFTJDG HK'.replace(/ /g,''));assert.equal(run('cheatsOn'),true);assert.equal(c.hiddenAllowed(black),false);
type('QMFFORFLFLTM');assert.equal(c.hiddenAllowed(black),true);assert.equal(selected,-1);assert.equal(run('forcedHidden'),c.HEROES.length+c.DATA.HIDDEN.indexOf(black));assert.equal(black.available,false);
run('blackLilithUnlocked=false;forcedHidden=null;cheatBuf=[]');type('BLACKLILITH');assert.equal(c.hiddenAllowed(black),true);
const normalize=game.slice(game.indexOf('    heroIdx = Math.floor(Number(heroIdx));'),game.indexOf('    G.heroIdx = heroIdx;')+'    G.heroIdx = heroIdx;'.length);
const deploy=new Function('heroIdx','ALLH','HEROES','UI','const G={};'+normalize+';return G.heroIdx;');
const index=c.HEROES.length+c.DATA.HIDDEN.indexOf(black),all=[...c.HEROES,...c.DATA.HIDDEN];assert.equal(deploy(index,all,c.HEROES,c),index);run('blackLilithUnlocked=false');assert.equal(deploy(index,all,c.HEROES,c),0);
console.log('PASS: cheat activation required; Korean keyboard sequence/English alias; automatic selection; deployment guard; random availability stays disabled.');

run('cheatsOn=false;blackLilithUnlocked=false;forcedHidden=null');
assert.equal(c.applyTitleCode('블랙리리스'),'치트를 먼저 활성화하세요');
assert.equal(c.hiddenAllowed(black),false);
assert.equal(c.applyTitleCode('치트활성화'),'치트 활성화');
assert.equal(c.applyTitleCode('블랙 리리스'),'블랙 리리스 선택 완료');
assert.equal(c.hiddenAllowed(black),true);
assert.equal(c.applyTitleCode('unrecognized'),'');
console.log('PASS: actual Korean text input, whitespace normalization, unlock order and unknown codes.');
