const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('js/game.js','utf8');
const helper=src.slice(src.indexOf('  const WILD_POSES ='),src.indexOf('  function rushBlast(P) {'));
function cast(cancel){const jobs=[],shots=[],clears=[],fx=[];const enemy={alive:true,supT:2};const P={x:0,y:0,aim:0,dead:false};const G={P,room:{},phase:'play',t:3,enemies:[enemy],opt:{shake:false}};
const ctx={makeDualPistols:()=>null,G,GUNS:{bl_dual:{dmg:4.4}},TAU:Math.PI*2,upE:()=>0,spawnPBullet(p,rd,x,y,a,v){const b={x,y,a,v,damage:rd.d.dmg,life:rd.d.life,s:{},core:{}};shots.push(b);return b},blankWave(...a){clears.push(a)},SFX:{play(){}},FX:{later(t,fn){jobs.push([t,fn])},muzzleFlash(){},beam(...a){fx.push(a)},particle(o){if(o.tex===this.tex.wildFlash)fx.push(o)},ring(){},shake(){},tex:{dot:{},wildFlash:{}}}};ctx.tex=ctx.FX.tex;ctx.sheets={};ctx.particle=o=>ctx.FX.particle(o);
vm.createContext(ctx);const fxSource=fs.readFileSync('js/fx.js','utf8');vm.runInContext(fxSource.slice(fxSource.indexOf('  function wildMuzzle('),fxSource.indexOf('  function scudMuzzle(')),ctx);ctx.FX.wildMuzzle=ctx.wildMuzzle;vm.runInContext(helper,ctx);ctx.wildShot(P);if(cancel)cancel(G,P);jobs.forEach(([t,fn])=>fn());return {shots,clears,fx,P,enemy,ctx,jobs};}
const r=cast();assert.equal(r.shots.length,874);assert.equal(r.fx.length,1748);assert.equal(r.clears.length,0);assert.equal(r.P.wildShotEnd,0);
for(let side=0;side<2;side++) {
 const sectors=new Set();
 for(let beat=0;beat<24;beat++) {
  const shot=r.shots[beat*24+side];
  sectors.add((Math.round(shot.a/(Math.PI/6))+12)%12);
  for(let k=0;k<12;k++)assert.equal(r.shots[beat*24+k*2+side].a,shot.a);
 }
 assert.equal(sectors.size,12);
}
for(let i=0;i<874;i++)assert.equal(r.shots[i].a,r.fx[i*2].rot);
assert.notDeepEqual(cast().shots.map(b=>b.a),r.shots.map(b=>b.a));
assert.ok(r.shots.every(b=>b.sup===6.5 && b.s.hidden && b.core.hidden && b.noTrail));assert.ok(r.shots.slice(826).every(b=>b.popSet.has(r.enemy)));assert.ok(r.shots.slice(0,826).every(b=>!b.popSet));
for(const cancel of [(g,p)=>p.dead=true,g=>g.P={},g=>g.room={},g=>g.phase='title'])assert.equal(cast(cancel).shots.length,0);
console.log('PASS: 874 shots, independently randomized hands, full-circle coverage, matching bullet/flash directions, suppression/finisher, cleanup, cancellation on death/room change/run change.');

for(let beat=0;beat<6;beat++)for(let side=0;side<2;side++){
 r.P.wildFace=1;const p=r.ctx.wildGrip(r.P,side,beat);assert.ok(Math.abs(p.x)<=.41&&p.y>=.8&&p.y<=1.12);
 r.P.wildFace=-1;const mirrored=r.ctx.wildGrip(r.P,side,beat);assert.equal(mirrored.x,-p.x);assert.equal(mirrored.y,p.y);
}
assert.match(fs.readFileSync('js/fx.js','utf8'),/'beam', 'wildFlash', 'dot'/);
console.log('PASS: six shoulder-level poses, mirrored facing, dedicated muzzle texture in particle atlas.');

/* Snapshot ghosts must own materials/geometry, including multi-material SD meshes. */
{
 const THREE=require('../js/vendor/three.min.js');
 const q=cast(), c=q.ctx, P=q.P;
 c.THREE=THREE;c.ORD=()=>20;c.G.t=10;
 P.x=P.y=0;P.wildFace=1;P.wildBeat=0;P.wildShotEnd=11;P.wildFlashAt=10;
 P.handRoot=new THREE.Group();
 const outer=new THREE.Group(), pairs=[0,1].map(()=>{
  const group=new THREE.Group(), mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),[new THREE.MeshBasicMaterial(),new THREE.MeshBasicMaterial()]);
  group.add(mesh);outer.add(group);return {group,muzzle:[.35,0],c:{setOrder(){}}};
 });
 P.wildHands={outer,pair:pairs,arms:[[],[]],c:{dispose(){}}};P.handRoot.add(outer);
 c.poseWildShot(P);P.wildBeat=1;c.G.t=10.11;c.poseWildShot(P);
 assert.equal(P.wildGhosts.length,1);
 const live=pairs[0].group.children[0],ghost=P.wildGhosts[0].group.children[0].children[0];
 assert.notEqual(ghost.geometry,live.geometry);assert.notEqual(ghost.material[0],live.material[0]);
 assert.equal(live.material[0].opacity,1);
 c.G.t=10.25;c.poseWildShot(P);assert.equal(P.wildGhosts.length,0);
 P.wildBeat=2;c.poseWildShot(P);assert.equal(P.wildGhosts.length,1);
 c.clearWildShot(P);assert.equal(P.wildGhosts.length,0);assert.equal(P.handRoot.children.length,0);
 console.log('PASS: SD multi-material afterimages own snapshots, fade, and clean up on interruption.');
}

const playerPass=src.slice(src.indexOf('  function updatePBullets('),src.indexOf('  function updatePBullets(')+src.slice(src.indexOf('  function updatePBullets(')).indexOf('\n  function ',2));
assert.doesNotMatch(playerPass,/wildShotClears|popEB|ebRemove/);
console.log('PASS: player bullets never enter enemy-bullet clearing/removal pass.');

/* Visual barrels, not only invisible hit coverage, must fire up/down and diagonally. */
{
 const dirs=new Set();r.P.wildFace=1;
 for(let beat=0;beat<6;beat++)for(let side=0;side<2;side++){
  const p=r.ctx.wildGrip(r.P,side,beat);
  dirs.add((Math.round(p.angle/(Math.PI/4))+8)%8);
 }
 assert.equal(dirs.size,8);
 assert.ok(dirs.has(2)&&dirs.has(6));
 console.log('PASS: visible pistol/flame poses cover all eight directions, including up and down.');
}

assert.ok(Math.abs(r.jobs[1][0]-1.32/288)<1e-12);
assert.ok(Math.abs(r.jobs.at(-1)[0]-2.02)<1e-12);
assert.ok(r.fx.filter((_,i)=>i%2===0).every(p=>p.life===0.038));
assert.ok(r.fx.filter((_,i)=>i%2===1).every(p=>p.life===0.022));
assert.equal(r.fx[0].alpha,r.fx[12].alpha);
assert.notEqual(r.fx[0].alpha,r.fx[16].alpha);
console.log('PASS: 2 second duration, preserved firing rate, unchanged flash lifetimes and hand alternation cadence.');

assert.ok(r.jobs.at(-2)[0]<2);
assert.ok(r.jobs.at(-2)[0]+1.32/288>=2);
assert.ok(r.fx.filter((_,i)=>i%2===0).every(p=>p.size===(p.size>3.5?1.15:0.82)*3.5));
console.log('PASS: sustained cadence through 2 seconds and flame size at 70 percent of the previous scale.');
