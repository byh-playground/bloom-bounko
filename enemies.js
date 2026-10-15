import {t as tr,localizedList} from './i18n.js';
import {Unit,mixin,Leapable,SelfDestructible,SpikeCounterable,ArcFireable,Lungeable,ProjectileFireable,BossPatternable,Sunbeamable,Meleeable,Healable,Regenerative,Burrowable,Summonable,Returnable,Hookable,GroundAttackable,ConeBreathable} from './abilities.js';

// Unit identity/spec/appearance (IS-A); each selected behavior owns its namespace (CAN-BE).
export class Rogue extends mixin(Unit,Leapable) {}
export class Pillbug extends mixin(Unit,SelfDestructible) {}
export class Thornfruit extends mixin(Unit,SpikeCounterable) {}
export class Rocket extends mixin(Unit,ArcFireable) {}
export const enemyConfig={
  rogue:{radius:20,height:30,mass:4.6,hp:105,armor:0,speed:128,detect:700,damage:25,push:250,
    leap:{range:300,minRange:85,prepareMs:320,durationMs:650,height:90,cooldownMs:2200}},
  pillbug:{radius:23,height:38,mass:8.2,hp:150,armor:12,speed:80,detect:640,damage:24,push:300,
    selfDestruct:{range:86,prepareMs:1000,radius:96,height:26,damage:28,push:300}},
  thornfruit:{radius:24,height:38,mass:8.2,hp:185,armor:8,speed:64,detect:640,damage:25,push:330,
    spike:{range:185,prepareMs:550,activeMs:450,recoverMs:1500,count:8,damage:9,speed:250,radius:4,height:8,lifeMs:1000}},
  rocket:{radius:26,height:42,mass:4.2,hp:95,armor:8,speed:70,detect:760,damage:15,push:260,
    navigation:{near:235,far:360},arcFire:{range:480,prepareMs:490,recoverMs:1900,intervalMs:150,heights:[88,96,100,92],
      shot:{radius:5,height:10,startZ:24,durationMs:950,impactRadius:45,impactHeight:20,damage:9,push:160,spreadRadius:24}}}
};

export const enemyWave=['rogue','pillbug','thornfruit','rocket'];
export const bossConfig={radius:48,mass:36,hp:540,armor:12,speed:155,contactDamage:36,contactPush:450,detect:2000,bulletSpeed:450,bulletDamage:23,bulletPush:300,bulletRadius:10,bulletLifeMs:2050,windupMs:640,lockMs:160,recoverMs:850,recoilMs:1000,chargeSpeed:880,chargeDurationMs:760,chargeRecoilSpeed:330,summonPeriodMs:5100,summonAppearMs:390,summonLifeMs:7800,summonCap:4};
export const bossSpecies=Object.freeze({
    petalPredator:{id:'petalPredator',nameKey:'species.89',get name(){return tr("species.89");},appearance:'petal',summonType:'sprout',
      base:{hpRate:1,massRate:1,speedRate:1,bulletSpeedRate:1,chargeSpeedRate:1},
      fan:{count:9,spread:.125},radial:{count:18},summon:{count:3,lifetimeRate:1},
      variants:[{id:'wide',get name(){return tr("species.88");},fanSpread:1.3,bulletSpeedRate:1},{id:'rapid',get name(){return tr("species.87");},windupRate:.85,chargeSpeedRate:1.12},{id:'spiral',get name(){return tr("species.86");},radialRotation:.33,fanSpread:.85}]},
    elasticCap:{id:'elasticCap',nameKey:'species.85',get name(){return tr("species.85");},appearance:'mushroom',summonType:'puff',
      base:{hpRate:1.06,massRate:1.35,speedRate:.82,bulletSpeedRate:.86,chargeSpeedRate:.96},
      fan:{count:7,spread:.18},radial:{count:14},summon:{count:3,lifetimeRate:1.15},
      variants:[{id:'bouncy',get name(){return tr("species.84");},recoilSpeedRate:1.25,chargeSpeedRate:1.07},{id:'cloud',get name(){return tr("species.83");},radialCountRate:1.3,bulletSpeedRate:.9},{id:'dense',get name(){return tr("species.82");},summonCountRate:1.3,windupRate:1.06}]},
    ...Object.fromEntries(['deathworm','hivecarrier','clawhunter'].map(id=>[id,{id,nameKey:'species.'+id+'.name',get name(){return tr(this.nameKey);},appearance:id,variants:[{id:'standard',get name(){return tr('boss.standard');}}]}]))
  });
const legacyConfig={scout:{radius:20,mass:4.6,hp:105,armor:0,speed:128,detect:700,damage:25,push:250,windupMs:180,lungeSpeed:310,lungeMs:280,recoverMs:740,range:84},
brute:{radius:29,mass:8.2,hp:185,armor:24,speed:64,detect:640,damage:34,push:460,windupMs:530,lungeSpeed:360,lungeMs:420,recoverMs:1480,range:132},
spitter:{radius:19,mass:4.2,hp:78,armor:8,speed:86,detect:760,damage:15,push:315,windupMs:490,recoverMs:1530,range:480,keepNear:235,keepFar:360,projectileSpeed:420,projectileRadius:8,projectileLifeMs:2450},
sprout:{radius:14,mass:3.4,hp:45,armor:0,speed:150,detect:870,damage:12,push:185,windupMs:220,lungeSpeed:250,lungeMs:200,recoverMs:700,range:63},
puff:{radius:17,mass:4.6,hp:55,armor:5,speed:105,detect:840,damage:13,push:300,windupMs:300,lungeSpeed:240,lungeMs:290,recoverMs:850,range:80}};
for(const [id,c] of Object.entries(legacyConfig)){
  c.height=c.radius*2;c.signature=id==='spitter'?'projectileFire':'lunge';c.unlocks={[c.signature]:1};
  c.basicAttack={range:170,prepareMs:160,speed:650,durationMs:520,recoverMs:350};
  c.lunge={range:c.range,prepareMs:c.windupMs,speed:c.lungeSpeed,durationMs:c.lungeMs,recoverMs:c.recoverMs};
  if(id==='spitter'){c.navigation={near:c.keepNear,far:c.keepFar};c.projectileFire={range:c.range,prepareMs:c.windupMs,recoverMs:c.recoverMs,speed:c.projectileSpeed,radius:c.projectileRadius,lifeMs:c.projectileLifeMs,damage:c.damage,push:c.push};}
  enemyConfig[id]=c;
}
for(const [id,signature] of Object.entries({rogue:'leap',pillbug:'selfDestruct',thornfruit:'spike',rocket:'arcFire'})){
  Object.assign(enemyConfig[id],{signature,unlocks:{[signature]:1},contactAttackStates:id==='rogue'?['LEAP']:[],basicAttack:{range:170,prepareMs:160,speed:650,durationMs:520,recoverMs:350}});
}
for(const spec of Object.values(bossSpecies).filter(spec=>spec.fan))enemyConfig[spec.id]={...bossConfig,height:96,hp:bossConfig.hp*spec.base.hpRate,mass:bossConfig.mass*spec.base.massRate,
  navigation:{near:240,far:380,chaseRate:.8,strafeRate:.55,response:4},speed:bossConfig.speed*spec.base.speedRate,damage:bossConfig.contactDamage,push:bossConfig.contactPush,signature:'bossPattern',unlocks:{bossPattern:1},
  basicAttack:{range:170,prepareMs:160,speed:650,durationMs:520,recoverMs:350},patterns:{CHARGE:1,FAN:2,RADIAL:3,SUMMON:4}};
enemyConfig.boss={...bossConfig,height:96,damage:bossConfig.contactDamage,push:bossConfig.contactPush};
// BOUNKO rates preserve the source's relative identities; no RTS economy/mana.
Object.assign(enemyConfig,{

  deathworm:{radius:60,height:132,mass:42,hp:650,armor:10,speed:44,detect:1800,damage:25,push:220,signature:'projectileFire',unlocks:{projectileFire:0,burrow:1,rupture:2},
    navigation:{near:170,far:285,response:3},
    projectileFire:{range:560,prepareMs:300,recoverMs:450,count:2,countByGrade:[2,2,3,3,4,4],intervalMs:145,speed:625,radius:5,height:10,lifeMs:1500,damage:20,push:100,
      rupture:{every:4,radius:50,height:32,damage:25,push:210}},
    burrow:{distance:250,diveMs:300,moveMs:650,emergeMs:420,exposedMs:3400,trailMs:120,radius:78,height:36,damage:26,push:300}},
  hivecarrier:{radius:62,height:112,mass:45,hp:800,armor:12,speed:42,detect:1800,damage:0,push:0,signature:'summon',unlocks:{summon:0,dock:1},
    navigation:{near:210,far:340,response:3,faceTarget:true},
    summon:{speciesId:'carriermite',capacity:2,capacityByGrade:[2,2,3,3,4,4],deployMs:220,respawnMs:1800,lifetimeMs:12000,growMs:180}},
  clawhunter:{radius:49,height:98,mass:34,hp:570,armor:12,speed:70,detect:1800,damage:28,push:100,signature:'melee',unlocks:{melee:0,hook:1},
    navigation:{near:160,far:290,response:4},
    melee:{range:105,width:3,halfAngle:.9,prepareMs:300,strikeMs:160,recoverMs:600,damage:26,push:150,motion:'thrust'},
    hook:{range:460,prepareMs:650,travelMs:400,arcHeight:90,retractMs:340,recoverMs:850,cooldownMs:1600,radius:9,height:18,damage:20,pullSpeed:340,count:1,countByGrade:[1,1,2,2,2,2]}},
  carriermite:{radius:12,height:26,mass:2.6,hp:65,armor:0,speed:280,detect:650,damage:8,push:70,signature:'projectileFire',unlocks:{projectileFire:0},
    navigation:{near:105,far:155,response:10},
    projectileFire:{range:190,prepareMs:100,recoverMs:850,speed:380,radius:3,height:6,lifeMs:1000,damage:8,push:60},
    returnFlight:{retreatHpRate:.5,leash:650,dockMargin:12,dockMs:700,healRate:1}},
  lancer:{radius:23,height:46,mass:8.2,hp:150,armor:12,speed:95,detect:700,damage:35,attackPower:100,push:900,signature:'lunge',unlocks:{lunge:0},
    lunge:{range:320,prepareMs:350,speed:1000,durationMs:700,recoverMs:900}},
  dandelion:{radius:14,height:28,mass:3,hp:65,armor:0,speed:150,detect:700,damage:14,push:0,signature:'melee',unlocks:{melee:0},
    melee:{range:34,width:2,halfAngle:.85,prepareMs:150,strikeMs:80,recoverMs:270,damage:14,push:0,motion:'jab'}},
  swordsman:{radius:22,height:44,mass:7,hp:145,armor:12,speed:80,detect:700,damage:26,push:0,signature:'melee',unlocks:{melee:0},
    melee:{range:54,width:3,halfAngle:1.1,prepareMs:300,strikeMs:170,recoverMs:530,damage:26,push:0,motion:'swing'}},
  pikeman:{radius:20,height:40,mass:4.6,hp:95,armor:5,speed:80,detect:700,damage:22,push:100,signature:'melee',unlocks:{melee:0},navigation:{near:68,far:88},
    melee:{range:105,width:2,halfAngle:.32,prepareMs:250,strikeMs:100,recoverMs:400,damage:22,push:100,motion:'thrust'}},
  medic:{radius:17,height:34,mass:4.2,hp:100,armor:0,speed:70,detect:700,damage:0,push:0,spawnWeight:.25,signature:'heal',unlocks:{heal:0},
    heal:{range:150,searchRange:700,width:2,amount:9,efficiency:3,minHp:1,prepareMs:250,recoverMs:750},regeneration:{ratePerSecond:.05}}
});
const beam=enemyConfig.brute;delete beam.lunge;beam.signature='sunbeam';beam.unlocks={sunbeam:1};beam.navigation={near:230,far:340};
beam.sunbeam={range:420,width:2,prepareMs:beam.windupMs,fireMs:1600,recoverMs:beam.recoverMs,intervalMs:250,dps:0,
  focus:[{grade:2,afterMs:1500,multiplier:1.5,stage:2},{grade:3,afterMs:3000,multiplier:2.25,stage:3}]};
const beamTiming=beam.sunbeam,legacyCycleMs=beam.windupMs+beam.lungeMs+beam.recoverMs;
// Preserve mean damage over the complete old cycle; only completed pulses deal damage.
beamTiming.dps=beam.damage*(beamTiming.prepareMs+beamTiming.fireMs+beamTiming.recoverMs)/(legacyCycleMs*(Math.floor(beamTiming.fireMs/beamTiming.intervalMs)*beamTiming.intervalMs/1000));
Object.assign(enemyConfig,{
  rootstalker:{radius:23,height:42,mass:8,hp:155,armor:8,speed:48,detect:850,damage:20,push:100,signature:'groundAttack',unlocks:{groundAttack:0,freeze:2},navigation:{near:150,far:230},
    groundAttack:{kind:'line',range:330,width:35,height:32,prepareMs:700,recoverMs:1250,damage:22,push:120},elementHit:{frost:{freeze:true}}},
  deepthorn:{radius:34,height:66,mass:16,hp:300,armor:18,speed:32,detect:950,damage:28,push:180,signature:'groundAttack',unlocks:{groundAttack:0,freeze:2,secondary:2},navigation:{near:210,far:290},
    groundAttack:{kind:'eruption',range:420,radius:50,height:60,prepareMs:650,recoverMs:1550,damage:28,push:160,secondaryCount:3,secondaryDelayMs:450,secondaryOffset:100,secondaryDamageRate:.5},elementHit:{frost:{freeze:true}}},
  sporemoth:{radius:25,height:44,mass:5,hp:135,armor:5,speed:65,detect:900,damage:14,push:70,signature:'arcFire',unlocks:{arcFire:0,acidPool:1},navigation:{near:220,far:330},elementHit:{acid:{}},
    arcFire:{range:460,prepareMs:450,recoverMs:1700,intervalMs:250,heights:[50,50],maxShotsByGrade:[1,1,2,2,2,2],shot:{radius:5,height:10,startZ:24,durationMs:800,impactRadius:50,impactHeight:24,damage:16,push:80,spreadRadius:32,color:[.69,.88,.36]}}},
  fireant:{radius:20,height:36,mass:4,hp:110,armor:6,speed:80,detect:800,damage:16,push:70,signature:'coneBreath',unlocks:{projectileFire:0,coneBreath:1,acidPool:2},navigation:{near:100,far:145},elementHit:{acid:{}},
    projectileFire:{range:210,prepareMs:250,recoverMs:850,speed:300,radius:4,height:8,lifeMs:1300,damage:13,push:60,color:[.69,.88,.36]},
    coneBreath:{range:190,halfAngle:Math.PI/12,height:34,prepareMs:500,fireMs:1000,intervalMs:250,damage:7,push:0,recoverMs:1500}}
});
const Ground=mixin(Unit,GroundAttackable),Ant=mixin(Unit,ProjectileFireable,ConeBreathable);
const Sunflower=mixin(Unit,Sunbeamable),Melee=mixin(Unit,Meleeable),Medic=mixin(Unit,Healable,Regenerative);
const Lunger=mixin(Unit,Lungeable),Spitter=mixin(Unit,ProjectileFireable),Boss=mixin(Unit,BossPatternable);
const Worm=mixin(Unit,ProjectileFireable,Burrowable),Carrier=mixin(Unit,Summonable),Hunter=mixin(Unit,Meleeable,Hookable),Mite=mixin(Unit,ProjectileFireable,Returnable);
export const enemyClasses={rootstalker:Ground,deepthorn:Ground,sporemoth:Rocket,fireant:Ant,deathworm:Worm,hivecarrier:Carrier,clawhunter:Hunter,carriermite:Mite,rogue:Rogue,pillbug:Pillbug,thornfruit:Thornfruit,rocket:Rocket,scout:Lunger,brute:Sunflower,sprout:Lunger,puff:Lunger,spitter:Spitter,petalPredator:Boss,elasticCap:Boss,lancer:Lunger,dandelion:Melee,swordsman:Melee,pikeman:Melee,medic:Medic};
const metadata={
  ...Object.fromEntries([['rootstalker','#91cedb'],['deepthorn','#b9e2e8'],['sporemoth','#b6cb64'],['fireant','#a83d18']].map(([id,color])=>[id,localizedList([()=>tr('species.'+id+'.name'),color,()=>tr('species.'+id+'.desc')])])),
  lancer:localizedList([()=>tr("species.80"),'#9bab46',()=>tr("species.81")]),dandelion:localizedList([()=>tr("species.78"),'#2e6eed',()=>tr("species.79")]),swordsman:localizedList([()=>tr("species.76"),'#75bd52',()=>tr("species.77")]),pikeman:localizedList([()=>tr("species.74"),'#8aaa4e',()=>tr("species.75")]),medic:localizedList([()=>tr("species.72"),'#2e6eed',()=>tr("species.73")]),
  rogue:localizedList([()=>tr("species.70"),'#717b3d',()=>tr("species.71")]),pillbug:localizedList([()=>tr("species.68"),'#bd8742',()=>tr("species.69")]),thornfruit:localizedList([()=>tr("species.66"),'#789f40',()=>tr("species.67")]),rocket:localizedList([()=>tr("species.64"),'#8a9e40',()=>tr("species.65")]),
  scout:localizedList([()=>tr("species.62"),'#ec7056',()=>tr("species.63")]),brute:localizedList([()=>tr("species.60"),'#e8a145',()=>tr("species.61")]),spitter:localizedList([()=>tr("species.58"),'#a078ef',()=>tr("species.59")]),
  sprout:localizedList([()=>tr("species.56"),'#85cc4a',()=>tr("species.57")]),puff:localizedList([()=>tr("species.54"),'#a88cee',()=>tr("species.55")]),petalPredator:localizedList([()=>tr("species.52"),'#f47b9b',()=>tr("species.53")]),elasticCap:localizedList([()=>tr("species.50"),'#a68aee',()=>tr("species.51")]),  ...Object.fromEntries([['deathworm','#ba7d63'],['hivecarrier','#7a5938'],['clawhunter','#7a5938'],['carriermite','#7a5938']].map(([id,color])=>[id,localizedList([()=>tr('species.'+id+'.name'),color,()=>tr('species.'+id+'.desc')])])),
};
export const species=Object.fromEntries(Object.entries(metadata).map(([id,labels])=>{const color=labels[1];return [id,{id,get name(){return labels[0];},color,get description(){return labels[2];},boss:!!bossSpecies[id],
  config:enemyConfig[id],Class:enemyClasses[id],presentation:{assetId:id,color,eggAssetId:'egg-'+id,eggAssetPath:'assets/vector/eggs/'+id+'.svg'} }];}));
export function speciesConfig(id,grade=5,{powerRate=1,sizeRate=1,bodyScale=1,growthRate=1}={}){
  const base=species[id].config,c=structuredClone(base),power=Math.pow(powerRate,grade),size=Math.pow(sizeRate,grade);
  c.hp*=power;c.damage*=power;c.attackPower=(base.attackPower??65)*power;c.radius*=bodyScale;c.height*=bodyScale;c.armorPenPercent=0;c.armorPenFlat=0;
  if(c.leap){c.leap.range*=Math.pow(growthRate,grade);c.leap.height*=Math.pow(growthRate,grade);}
  if(c.selfDestruct){c.selfDestruct.damage*=power;c.selfDestruct.radius*=size;}
  if(c.spike)c.spike.damage*=power;
  if(c.arcFire)c.arcFire.shot.damage*=power;
  if(c.projectileFire){c.projectileFire.damage*=power;c.projectileFire.radius*=size;c.projectileFire.range*=Math.pow(growthRate,grade);}
  if(c.melee){c.melee.damage*=power;c.melee.range*=Math.pow(growthRate,grade);}
  if(c.heal){c.heal.amount*=power;c.heal.range*=Math.pow(growthRate,grade);c.heal.searchRange*=Math.pow(growthRate,grade);}
  if(c.sunbeam){c.sunbeam.dps*=power;c.sunbeam.range*=Math.pow(growthRate,grade);}
  if(c.lunge)c.lunge.range*=Math.pow(growthRate,grade);
  if(c.bulletDamage)c.bulletDamage*=power;
  if(c.projectileFire?.countByGrade)c.projectileFire.count=c.projectileFire.countByGrade[grade];
  if(c.projectileFire?.rupture){c.projectileFire.rupture.damage*=power;c.projectileFire.rupture.radius*=size;}
  if(c.burrow){c.burrow.damage*=power;c.burrow.radius*=size;}
  if(c.summon)c.summon.capacity=c.summon.capacityByGrade[grade];
  if(c.hook&&grade<c.unlocks.hook)c.navigation={near:65,far:90,response:4};
  if(c.hook){c.hook.damage*=power;c.hook.count=c.hook.countByGrade[grade];c.hook.range*=Math.pow(growthRate,grade);}
  if(c.returnFlight)c.returnFlight.healRate=grade>=3?1.5:1;
  if(c.arcFire)c.arcFire.heights=c.arcFire.heights.slice(0,c.arcFire.maxShotsByGrade?.[grade]??(grade<2?1:grade<3?2:grade<4?3:4));
  if(c.groundAttack){c.groundAttack.damage*=power;c.groundAttack.range*=Math.pow(growthRate,grade);}
  if(c.coneBreath){c.coneBreath.damage*=power;c.coneBreath.range*=Math.pow(growthRate,grade);}
  if(c.elementHit?.frost)c.elementHit.frost.freeze=grade>=(c.unlocks.freeze??2);
  if(c.spike){c.spike.count=grade<2?4:8;c.unlocks.spikeCounter=2;}
  return c;
}

const gradeNotes={
  ...Object.fromEntries(['rootstalker','deepthorn','sporemoth','fireant'].map(id=>[id,localizedList(Array.from({length:6},(_,grade)=>()=>tr('species.'+id+'.grade'+grade)))])),
  ...Object.fromEntries(['deathworm','hivecarrier','clawhunter','carriermite'].map(id=>[id,localizedList(Array.from({length:6},(_,grade)=>()=>tr('species.'+id+'.grade'+grade)))])),
  rogue:localizedList([()=>tr("species.44"),()=>tr("species.45"),()=>tr("species.46"),()=>tr("species.47"),()=>tr("species.48"),()=>tr("species.49")]),
  pillbug:localizedList([()=>tr("species.38"),()=>tr("species.39"),()=>tr("species.40"),()=>tr("species.41"),()=>tr("species.42"),()=>tr("species.43")]),
  thornfruit:localizedList([()=>tr("species.32"),()=>tr("species.33"),()=>tr("species.34"),()=>tr("species.35"),()=>tr("species.36"),()=>tr("species.37")]),
  rocket:localizedList([()=>tr("species.26"),()=>tr("species.27"),()=>tr("species.28"),()=>tr("species.29"),()=>tr("species.30"),()=>tr("species.31")]),
  spitter:localizedList([()=>tr("species.20"),()=>tr("species.21"),()=>tr("species.22"),()=>tr("species.23"),()=>tr("species.24"),()=>tr("species.25")]),
};
for(const id of ['scout','sprout','puff'])gradeNotes[id]=localizedList([()=>tr("species.14"),()=>tr("species.15"),()=>tr("species.16"),()=>tr("species.17"),()=>tr("species.18"),()=>tr("species.19")]);
for(const id of ['petalPredator','elasticCap'])gradeNotes[id]=localizedList([()=>tr("species.8"),()=>tr("species.9"),()=>tr("species.10"),()=>tr("species.11"),()=>tr("species.12"),()=>tr("species.13")]);
gradeNotes.brute=localizedList([()=>tr("species.2"),()=>tr("species.3"),()=>tr("species.4"),()=>tr("species.5"),()=>tr("species.6"),()=>tr("species.7")]);
for(const id of ['lancer','dandelion','swordsman','pikeman'])gradeNotes[id]=localizedList(Array.from({length:6},(_,g)=>()=>species[id].description+(g?tr('species.1'):'')));
gradeNotes.medic=localizedList(Array.from({length:6},(_,g)=>()=>tr('species.phrase.27',{v0:g?tr('species.0'):''})));
for(const [id,notes] of Object.entries(gradeNotes))species[id].gradeNotes=notes;

// The first four retain PR8's debut; replacements can award every normal species.
export const enemyRefillWave=[...enemyWave,'scout','brute','spitter','lancer','dandelion','swordsman','pikeman','medic'];
export function pickRefillSpecies(random,pool=enemyRefillWave){const total=pool.reduce((n,id)=>n+(species[id].config.spawnWeight??1),0);let draw=random()*total;
  for(const id of pool){draw-=species[id].config.spawnWeight??1;if(draw<0)return id;}return pool.at(-1);}
