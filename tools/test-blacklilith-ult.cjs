const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('js/game.js','utf8');
const functions=src.slice(src.indexOf('  function startScud(P) {'),src.indexOf('  /* Black Lilith: six alternating'));
function scenario(dt,lv=0){
 const sceneObjects=new Set(),shots=[],hits=[],blanks=[];let disposed=0;
 const group=()=>({position:{set(){}},rotation:{z:0},scale:{set(){}}});
 const P={x:0,y:0,aim:0,hero:{speed:6.6},mods:{speed:1,dmg:1},body:{pivot:{rotation:{z:0}},root:group(),c:{play(){}}},sk2Cd:4,fireCd:0,iframe:0,guns:[{hand:{outer:{visible:true}}}],gi:0};
 const enemy={alive:true,spawnT:0,x:3,y:0,r:.5,h:1,supT:6,boss:false};
 const G={P,room:{},phase:'play',t:0,enemies:[enemy],opt:{shake:false}};
 const ctx={G,Math,Set,GUNS:{bl_dual:{dmg:4.4}},upF:()=>lv,TAU:2*Math.PI,ORD:()=>1,donorK:()=>1,scene:{add(x){sceneObjects.add(x)},remove(x){sceneObjects.delete(x)}},RIGS:{makeHand(){return{group:group(),c:{setOrder(){},dispose(){disposed++}}}}},INPUT:{moveVec:()=>[0,1]},LEVEL:{move(p,x,y){p.x=Math.min(3,p.x+x);p.y+=y},los:()=>true},hurtEnemy(e,d){hits.push(d)},popStatus(){},spawnPBullet(p,rd,x,y,a,v){shots.push({d:rd.d.dmg,x,y,a});return{}},blankWave(...a){blanks.push(a)},SFX:{play(){}},FX:{ring(){},particle(){},beam(){},muzzleFlash(){},shake(){},tex:{glow:{}}}};
 vm.createContext(ctx);vm.runInContext(functions,ctx);ctx.startScud(P);
 return {P,G,shots,hits,blanks,sceneObjects,ctx,get disposed(){return disposed},run(){let height=0;while(P.scud){G.t+=dt;P.iframe=Math.max(0,P.iframe-dt);ctx.updateScud(P,dt);if(P.scud)height=Math.max(height,P.scud.height)}return height}};
}
for(const dt of [1/30,1/60,1/120]){const r=scenario(dt);assert.equal(r.sceneObjects.size,2);assert.ok(r.run()>=1.39);assert.equal(r.shots.length,216);assert.equal(r.blanks.length,1);assert.equal(r.disposed,2);assert.equal(r.sceneObjects.size,0);assert.equal(r.P.ultT,0);assert.equal(r.P.body.pivot.rotation.z,0);assert.ok(r.P.x<=3);assert.ok(r.P.y>0);assert.equal(r.P.guns[0].hand.outer.visible,true);}
const base=scenario(1/60),up=scenario(1/60,3);base.run();up.run();assert.ok(Math.abs(up.shots[0].d/base.shots[0].d-1.6)<1e-8);
for(const cancel of [r=>r.G.room={},r=>r.G.phase='title',r=>r.P.dead=true]){const r=scenario(.02);cancel(r);r.ctx.updateScud(r.P,.02);assert.equal(r.sceneObjects.size,0);assert.equal(r.P.scud,null);assert.equal(r.shots.length,0)}
console.log('PASS: rush respects movement collision, aerial movement/height, 216 shots at 30/60/120 Hz, one finisher, upgrade scaling, dual hand cleanup and interrupted casts.');
