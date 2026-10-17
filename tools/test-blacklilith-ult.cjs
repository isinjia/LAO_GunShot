const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const THREE=require('../js/vendor/three.min.js'),src=fs.readFileSync('js/game.js','utf8');
const functions=src.slice(src.indexOf('  const SCUD_TIME ='),src.indexOf('  /* Black Lilith: close-range'));
const hurt=src.slice(src.indexOf('  function hurtEnemy('),src.indexOf('  // 연쇄 방전기:'));
function enemy(x=1.5,y=.4,hp=10000){return{alive:true,spawnT:0,intro:0,x,y,r:.3,h:1,supT:0,boss:false,hp,maxHp:hp,kx:0,ky:0,sparkT:Infinity};}
function scenario(dt=.01,lv=0){
 const sceneObjects=new Set(),shots=[],kills=[],blanks=[],clips=[],flashes=[],hits=[];let disposed=0;
 const part=()=>({group:new THREE.Group(),gripFlip:1,muzzle:[.35,0],c:{setOrder(){},dispose(){disposed++}}});
 const P={x:0,y:0,aim:0,hero:{id:'blacklilith',speed:6.6},hp:250,maxHp:250,skill:0,up:{},mods:{speed:1,dmg:1,skill:1},body:{flip:new THREE.Group(),pivot:new THREE.Group(),root:new THREE.Group(),c:{speed:1,play(k){clips.push(k);this.clipName=k;this.clip={dur:k==='win'?3.0833:1};this.time=0},apply(){},render(){},mask:new Uint8Array([1,0,1]),setMask(v){this.mask=v;},has:k=>k==='win'||k==='move'}},sk2Cd:4,fireCd:0,iframe:0,guns:[{hand:{outer:{visible:true}}}],gi:0};
 const target=enemy(),G={P,room:{},phase:'play',t:0,enemies:[target],stats:{dmg:0,hits:0,src:{}},opt:{shake:false,dmg:false}};
 const ctx={G,Math,Set,GOD:true,setFace(b,dir){b.flip.scale.x=dir<0?-1:1},upF:()=>lv,TAU:2*Math.PI,ORD:()=>1,donorK:()=>1,scene:{add(x){sceneObjects.add(x)},remove(x){sceneObjects.delete(x)}},
 makeDualPistols(){const pair=[part(),part()],outer=new THREE.Group();pair.forEach(h=>outer.add(h.group));return{pair,outer,c:{dispose(){pair.forEach(h=>h.c.dispose())}}}},
 RIGS:{makeArmSegment(){return{...part(),len:.2}}},INPUT:{moveVec:()=>[0,0]},LEVEL:{move(p,x,y){p.x=Math.min(3,p.x+x);p.y+=y},los:()=>true},
 tacticalDamage:()=>1,ultActive:()=>true,panOf:()=>0,clearWildShot(){},killEnemy(e,silent){if(!e.alive)return;e.alive=false;kills.push({e,silent,t:G.t,poseHeld:P.scud?.winHeld,detonate:e.scudDetonate})},
 spawnPBullet(...args){shots.push(args);return{}},blankWave(...a){blanks.push(a)},SFX:{play(){}},FX:{particle(){},wildMuzzle(...args){flashes.push({t:P.scud.t,args})},scudImpact(){},shake(){}}};
 vm.createContext(ctx);vm.runInContext(functions,ctx);vm.runInContext(hurt,ctx);
 const realHurt=ctx.hurtEnemy;ctx.hurtEnemy=(e,...args)=>{const hp=e.hp;realHurt(e,...args);if(e.hp<hp)hits.push({e,damage:hp-e.hp,t:P.scud?.t})};
 ctx.startScud(P);
 const r={P,G,target,shots,kills,blanks,clips,flashes,hits,sceneObjects,ctx,get disposed(){return disposed},step(){G.t+=dt;ctx.updateScud(P,dt)},until(t){while(G.t<t&&P.scud)r.step()},run(){while(P.scud)r.step()}};
 return r;
}
for(const dt of [1/30,1/60,1/120]){
 const r=scenario(dt);r.run();assert.equal(r.shots.length,0);assert.equal(r.flashes.length,116);
 assert.equal(r.hits.length,58);assert.equal(r.flashes.filter(f=>f.t>=2.55&&f.t<4.25).length,56);
 assert.equal(r.blanks.length,1);assert.equal(r.blanks[0][4],true);assert.equal(r.disposed,6);assert.equal(r.sceneObjects.size,0);
 assert.equal(r.P.body.pivot.rotation.z,0);assert.equal(r.P.body.flip.rotation.y,0);assert.equal(r.P.body.c.speed,1);assert.deepEqual([...r.P.body.c.mask],[1,0,1]);
 assert.equal(r.kills.length,0);assert.equal(r.target.scudMark,null);
}
const ranges=scenario(),front=ranges.target,far=enemy(9,.4),behind=enemy(-2,.4),side=enemy(1.5,4),wall=enemy(2.4,.4);
ranges.G.enemies=[front,far,behind,side,wall];ranges.ctx.LEVEL.los=(x,y,ex)=>ex!==wall.x;ranges.P.scud.t=.3;
ranges.ctx.scudVolley(ranges.P,false);assert.ok(front.hp<front.maxHp);assert.ok(ranges.P.scud.targets.has(front));
for(const e of [far,behind,side,wall]){assert.equal(e.hp,e.maxHp);assert.ok(!ranges.P.scud.targets.has(e));}
const afterGround=front.hp;front.x=100;front.y=50;ranges.P.scud.t=3;ranges.ctx.scudVolley(ranges.P,true);assert.ok(front.hp<afterGround);
for(const e of [far,behind,side,wall])assert.equal(e.hp,e.maxHp);
const beforeFinish=front.hp;ranges.P.scud.finished=true;ranges.ctx.scudFinish(ranges.P,ranges.P.scud);assert.equal(front.hp,beforeFinish);assert.equal(ranges.kills.length,0);
const immuneTarget=scenario();immuneTarget.ctx.hurtEnemy=()=>{};immuneTarget.ctx.scudVolley(immuneTarget.P,false);assert.equal(immuneTarget.P.scud.targets.size,0);
const marked=scenario(),b=enemy(2,.4,1);marked.target.hp=marked.target.maxHp=1;marked.G.enemies.push(b);
marked.until(5.9);assert.equal(marked.kills.length,0);assert.equal(marked.P.scud.pending.size,2);assert.ok(marked.G.enemies.every(e=>e.alive&&e.hp===0));
const damage=marked.G.stats.dmg;marked.ctx.hurtEnemy(marked.target,100,false,0,0,'hitS');assert.equal(marked.G.stats.dmg,damage);
while(!marked.P.scud.winHeld)marked.step();assert.equal(marked.kills.length,2);assert.equal(marked.kills[0].t,marked.kills[1].t);
assert.ok(marked.kills.every(k=>k.poseHeld&&k.detonate));const heldAt=marked.P.scud.t;assert.ok(Math.abs(marked.P.scud.endAt-heldAt-.7)<1e-9);
marked.run();assert.equal(marked.kills.length,2);assert.ok(marked.G.t-heldAt>=.7&&marked.G.t-heldAt<.72);
const base=scenario(),up=scenario(.01,3);base.ctx.scudVolley(base.P,false);up.ctx.scudVolley(up.P,false);assert.ok(Math.abs(up.hits[0].damage/base.hits[0].damage-1.6)<1e-8);
for(const cancel of [r=>r.G.room={},r=>r.G.phase='title',r=>r.P.dead=true]){
 const r=scenario();r.target.hp=1;r.ctx.scudVolley(r.P,false);assert.equal(r.kills.length,0);cancel(r);r.step();assert.equal(r.kills.length,1);assert.equal(r.target.scudPending,false);assert.equal(r.sceneObjects.size,0);assert.equal(r.P.body.c.speed,1);
}
const walk=scenario();walk.ctx.INPUT.moveVec=()=>[0,1];walk.step();assert.equal(walk.P.body.c.clipName,'move');const n=walk.clips.length;walk.step();assert.equal(walk.clips.length,n);
walk.ctx.INPUT.moveVec=()=>[0,0];walk.step();assert.equal(walk.P.body.c.clipName,'idle');walk.ctx.INPUT.moveVec=()=>[0,1];walk.until(2.7);assert.equal(walk.P.body.c.clipName,'idle');assert.equal(walk.P.body.pivot.rotation.z,Math.PI);assert.notEqual(walk.P.body.flip.rotation.y,0);
const blocked=scenario();blocked.ctx.LEVEL.move=()=>{};blocked.ctx.INPUT.moveVec=()=>[1,0];blocked.step();assert.equal(blocked.P.body.c.clipName,'idle');
const victory=scenario();victory.until(4.7);assert.equal(victory.P.body.c.speed,2);assert.equal(victory.P.body.c.mask,null);assert.equal(victory.P.scud.rig.outer.visible,false);victory.until(6.3);assert.equal(victory.P.body.c.speed,0);assert.equal(victory.P.body.c.clipName,'win');victory.run();assert.equal(victory.P.body.c.speed,1);
const immune=scenario();vm.runInContext(src.slice(src.indexOf('  function hurtPlayer('),src.indexOf('  function blankWave(')),immune.ctx);
for(const t of [1,3,5,6.4]){immune.until(t);immune.P.iframe=0;immune.ctx.hurtPlayer('test',4);assert.equal(immune.P.hp,250);assert.equal(immune.G.stats.hits,0);}
immune.run();immune.P.iframe=0;immune.ctx.hurtPlayer('test',4);assert.equal(immune.G.stats.hits,1);
console.log('PASS: no ultimate projectiles; flame-sized ground damage with wall/range checks; only actually damaged targets receive global aerial follow-up; no new finisher damage; simultaneous lethal-target explosions begin in the held final pose; 0.7 s hold, invulnerability, movement animation, upgrades and interruption cleanup at 30/60/120 Hz.');
