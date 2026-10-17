const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('js/game.js','utf8');
const helper=src.slice(src.indexOf('  function wildShot(P) {'),src.indexOf('  function rushBlast(P) {'));
function cast(cancel){const jobs=[],shots=[],clears=[],fx=[];const enemy={alive:true,supT:2};const P={x:0,y:0,aim:0,dead:false};const G={P,room:{},phase:'play',t:3,enemies:[enemy],opt:{shake:false}};
const ctx={G,GUNS:{bl_dual:{dmg:4.4}},TAU:Math.PI*2,upE:()=>0,spawnPBullet(p,rd,x,y,a,v){const b={x,y,a,v,damage:rd.d.dmg,life:rd.d.life};shots.push(b);return b},blankWave(...a){clears.push(a)},SFX:{play(){}},FX:{later(t,fn){jobs.push([t,fn])},muzzleFlash(...a){fx.push(a)},particle(){},ring(){},shake(){},tex:{dot:{}}}};vm.createContext(ctx);vm.runInContext(helper,ctx);ctx.wildShot(P);if(cancel)cancel(G,P);jobs.forEach(([t,fn])=>fn());return {shots,clears,fx,P,enemy};}
const r=cast();assert.equal(r.shots.length,72);assert.equal(r.fx.length,12);assert.equal(r.clears.length,1);assert.equal(r.P.wildShotEnd,3.66);
for(let i=0;i<6;i++){const wave=r.shots.slice(i*12,(i+1)*12);for(let k=1;k<12;k++)assert.ok(Math.abs(wave[k].a-wave[k-1].a-Math.PI/6)<1e-10);}
assert.ok(r.shots.every(b=>b.sup===6.5));assert.ok(r.shots.slice(60).every(b=>b.popSet.has(r.enemy)));assert.ok(r.shots.slice(0,60).every(b=>!b.popSet));
for(const cancel of [(g,p)=>p.dead=true,g=>g.P={},g=>g.room={},g=>g.phase='title'])assert.equal(cast(cancel).shots.length,0);
console.log('PASS: 72 shots, all directions, six volleys, suppression/finisher, bullet clear, cancellation on death/room change/run change.');
