const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync('js/data.js','utf8'),ctx);
const DATA=ctx.DATA,HEROES=DATA.HEROES,ui=fs.readFileSync('js/ui.js','utf8'),game=fs.readFileSync('js/game.js','utf8');
const pick=ui.match(/  function pickHero\(\) \{[\s\S]*?\n  }/)[0];
const force=ui.match(/  function forceHidden\(id, selectNow\) \{[\s\S]*?\n  }/)[0];
const sample=new Function('DATA','HEROES','Math','roll','forced',`let selHero=-1,forcedHidden=forced;const hiddenAllowed=h=>h&&h.available!==false;const toast=()=>{},announce=()=>{},setTimeout=()=>{},SFX={play(){}},unlocked=()=>true;${pick};return pickHero();`);
const math=Object.create(Math);let roll=0;math.random=()=>roll;
const counts={};for(let i=0;i<10000;i++){roll=i/10000;const k=sample(DATA,HEROES,math,roll,null),h=[...HEROES,...DATA.HIDDEN][k];assert.ok(h.available!==false);counts[h.id]=(counts[h.id]||0)+1;}
assert.equal(counts.blacklilith||0,0);assert.equal(counts.lrl,200);assert.equal(counts.ramparion,200);
const blocked=HEROES.length+DATA.HIDDEN.findIndex(h=>h.id==='blacklilith');roll=.5;assert.notEqual(sample(DATA,HEROES,math,roll,blocked),blocked);
const forcedTest=new Function('DATA','HEROES','id',`let forcedHidden=null;const hiddenAllowed=h=>h&&h.available!==false;const SFX={play(){},voice(){}},toast=()=>{},dressRandomCard=()=>{},selectHero=()=>{},selHero=0;${force};forceHidden(id,false);return forcedHidden;`);
assert.equal(forcedTest(DATA,HEROES,'blacklilith'),null);for(const id of ['lrl','ramparion'])assert.equal(forcedTest(DATA,HEROES,id),HEROES.length+DATA.HIDDEN.findIndex(h=>h.id===id));
const normalize=game.slice(game.indexOf('    heroIdx = Math.floor(Number(heroIdx));'),game.indexOf('    G.heroIdx = heroIdx;')+'    G.heroIdx = heroIdx;'.length);
const startIndex=new Function('heroIdx','ALLH','HEROES',`const G={},UI={hiddenAllowed:h=>h&&h.available!==false};${normalize};return G.heroIdx;`);
assert.equal(startIndex(blocked,[...HEROES,...DATA.HIDDEN],HEROES),0);for(const id of ['lrl','ramparion']){const i=HEROES.length+DATA.HIDDEN.findIndex(h=>h.id===id);assert.equal(startIndex(i,[...HEROES,...DATA.HIDDEN],HEROES),i)}
console.log('Roster gate passed: 10,000 deterministic random picks, 2% each released rare unit, forced selection and direct deployment guards.');
