import {Unit,mixin,Leapable,SelfDestructible,SpikeCounterable,ArcFireable,Lungeable,ProjectileFireable,BossPatternable} from './abilities.js';

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
const dark=[.13,.16,.18,1],accent=[1,.56,.26,1],green=[.47,.63,.25,1];
const circle=(r,x,y,size,color,n=12)=>r.ellipse(x,y,size,size,color,n);
function triangle(r,x,y,size,color,a){r.triangle(x+Math.cos(a)*size,y+Math.sin(a)*size,
  x+Math.cos(a+2.35)*size*.72,y+Math.sin(a+2.35)*size*.72,x+Math.cos(a-2.35)*size*.72,y+Math.sin(a-2.35)*size*.72,color);}
function petals(r,x,y,size,n,color,rotation,stretch){const ca=Math.cos(Math.PI*.48),sa=Math.sin(Math.PI*.48),q=size*.42;
  for(let i=0;i<n;i++){const a=rotation+i*Math.PI*2/n,dx=Math.cos(a),dy=Math.sin(a),cx=x+dx*size,cy=y+dy*size;
    const points=[[cx+dx*q,cy+dy*q*stretch],[cx+(dx*ca-dy*sa)*q*.62,cy+(dx*sa+dy*ca)*q*.62],
      [cx-dx*q*.72,cy-dy*q*.72*stretch],[cx+(dx*ca+dy*sa)*q*.62,cy+(-dx*sa+dy*ca)*q*.62]];
    r.triangle(...points[0],...points[1],...points[2],color);r.triangle(...points[0],...points[2],...points[3],color);}}
// Original primitives/ratios from Rally 89ff07f UNIT_VISUAL_RENDER_FNS.
// World render and the authoring slate call these same functions.
export const enemyVisuals={
  pillbug(r,{x,y,radius:q,time=0,id=0,attack=false}){
    circle(r,x,y,q*.88,dark,14);circle(r,x,y,q*.76,[.59,.43,.26,1],14);
    const roll=time*.012+id*.13;
    for(let k=0;k<6;k++){const a=roll+k*Math.PI/3;r.line(x+Math.cos(a)*q*.18,y+Math.sin(a)*q*.18,x+Math.cos(a)*q*.72,y+Math.sin(a)*q*.72,Math.max(1.3,q*.147),dark);}
    const pulse=.82+.18*Math.sin(time*.012+id);
    circle(r,x+q*.62,y-q*.14,q*.26*pulse,accent,10);circle(r,x+q*.68,y-q*.10,q*.10,[1,.94,.72,1],8);
    if(attack)circle(r,x,y,q*1.08,[1,.66,.22,.12],16);
  },
  thornfruit(r,{x,y,radius:q,attack=false}){
    circle(r,x,y,q*.62,green,12);
    for(let k=0;k<10;k++){const a=k*Math.PI*2/10;triangle(r,x+Math.cos(a)*q*.58,y+Math.sin(a)*q*.58,q*(attack?.26:.20),accent,a);}
    circle(r,x,y-q*.08,q*.22,dark,9);
  },
  rocket(r,{x,y,radius:q,attack=false}){
    petals(r,x,y+q*.16,q*.86,7,[.38,.48,.24,1],Math.PI/7,.72);circle(r,x,y+q*.12,q*.60,dark,12);
    const pods=[[-.48,-.18],[.48,-.18],[-.28,-.72],[.28,-.72]];
    for(let i=0;i<4;i++){const [ox,oy]=pods[i],px=x+ox*q,py=y+oy*q,pulse=attack?.06+(i+1)*.025:0;
      circle(r,px,py,q*(.25+pulse),[.58,.66,.25,1],10);petals(r,px,py-q*.02,q*(.18+pulse),4,[1,.48,.30,1],Math.PI/4,.48);
      circle(r,px,py-q*.08,q*.09,[1,.86,.38,1],8);r.line(px,py-q*.08,px,py-q*(.42+(attack?.08:0)),Math.max(1.8,q*.135),[.42,.58,.24,1]);}
    if(attack)circle(r,x,y-q*.28,q*1.08,[1,.52,.24,.08],16);
  },
  rogue(r,{x,y,radius:q,attack=false}){
    circle(r,x,y+q*.06,q*.50,dark,11);circle(r,x,y-q*.40,q*.30,[.24,.28,.18,1],9);
    r.line(x-q*.26,y+q*.22,x-q*.92,y+q*.74,q*.213,dark);r.line(x+q*.26,y+q*.22,x+q*.92,y+q*.74,q*.213,dark);
    const stab=attack?q*.30:0;r.line(x-q*.20,y-q*.20,x-q*.90,y-(q*.70+stab),q*.16,accent);r.line(x+q*.20,y-q*.20,x+q*.90,y-(q*.70+stab),q*.16,accent);
    circle(r,x-q*.11,y-q*.44,q*.055,[.90,.82,.28,1],6);circle(r,x+q*.11,y-q*.44,q*.055,[.90,.82,.28,1],6);
  }
};

Object.assign(enemyVisuals,{scout:(r,{x,y,radius:q,id=0,time=0})=>{for(let i=0;i<6;i++){const a=i*Math.PI/3+id*.7;r.ellipse(x+Math.cos(a)*q*.64,y+Math.sin(a)*q*.64,q*.45,q*.45,[.92,.43,.34,1],10);}r.ellipse(x,y,q*.70,q*.70,[1,.71,.48,1],14);r.ellipse(x-q*.2,y-q*.25,q*.2,q*.2,[.23,.18,.15,1],9);},brute:(r,{x,y,radius:q,id=0,time=0})=>{for(let i=0;i<7;i++){const a=i*Math.PI*2/7+.4;r.ellipse(x+Math.cos(a)*q*.8,y+Math.sin(a)*q*.8,q*.345,q*.345,[.91,.63,.27,1],10);}r.ellipse(x,y,q*.85,q*.85,[.38,.24,.21,1],18);r.ellipse(x,y,q*.52,q*.52,[1,.87,.57,1],16);r.ellipse(x-q*.2,y-q*.17,q*.1,q*.1,[.20,.17,.11,1],8);r.ellipse(x+q*.2,y-q*.17,q*.1,q*.1,[.20,.17,.11,1],8);},spitter:(r,{x,y,radius:q,id=0,time=0})=>{for(let i=0;i<3;i++){const a=i*Math.PI*2/3+id*.3;r.ellipse(x+Math.cos(a)*q*.72,y+Math.sin(a)*q*.72,q*.63,q*.63,[.63,.46,.94,1],12);}r.ellipse(x,y,q*.74,q*.74,[.89,.78,1,1],18);r.ellipse(x,y,q*.316,q*.316,[.32,.15,.51,1],12);},sprout:(r,{x,y,radius:q,id=0,time=0})=>{for(let i=0;i<5;i++){const a=i*Math.PI*2/5+time*.0007;r.ellipse(x+Math.cos(a)*q*.75,y+Math.sin(a)*q*.75,q*.57,q*.357,[.52,.80,.29,1],9);}r.ellipse(x,y,q*.55,q*.55,[.92,1,.66,1],12);},puff:(r,{x,y,radius:q,id=0,time=0})=>{r.ellipse(x,y,q*.95,q*.85,[.66,.55,.93,1],18);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;r.ellipse(x+Math.cos(a)*q*.48,y+Math.sin(a)*q*.42,q*.2,q*.2,[.91,.80,1,1],9);};}});
const bossVisuals={
    petal(renderer,b,now){
      const p=b.body.position,r=b.visualRadius??48,v=b.bossVariant,ang=Math.atan2(b.headingY,b.headingX);
      const wind=b.state==='BOSS_WINDUP'||b.state==='BOSS_LOCK',charging=b.state==='BOSS_CHARGE';
      const open=(b.pattern==='FAN'||b.pattern==='RADIAL'||b.pattern==='SUMMON')&&wind?.9:charging?-.28:.21;
      for(let i=0;i<9;i++){
        const a=i*Math.PI*2/9+Math.sin(now*.0007+i)*.06;
        const rr=r*(.72+open*.45+Math.sin(now*.004+i)*.03);
        renderer.ellipse(p.x+Math.cos(a)*rr,p.y+Math.sin(a)*rr,r*.33,r*.48,[.96,.44+i%3*.065,.58,1],14);
        renderer.ellipse(p.x+Math.cos(a)*rr*.9,p.y+Math.sin(a)*rr*.9,r*.15,r*.27,[1,.73,.65,.47],10);
      }
      renderer.ellipse(p.x,p.y,r*.58,r*.58,[.50,.29,.17,1],22);
      renderer.ellipse(p.x,p.y,r*.37,r*.37,[1,.85,.39,1],20);
      for(let i=0;i<8;i++){const a=i*Math.PI*2/8+now*.00023;
        renderer.ellipse(p.x+Math.cos(a)*r*.3,p.y+Math.sin(a)*r*.3,r*2.5/48,r*2.5/48,[.28,.16,.14,1],8);}
      renderer.ellipse(p.x+Math.cos(ang)*r*.21,p.y+Math.sin(ang)*r*.21,r*6/48,r*6/48,[.22,.14,.12,1],12);
    },
    mushroom(renderer,b,now){
      const p=b.body.position,r=b.visualRadius??48,wind=b.state==='BOSS_WINDUP'||b.state==='BOSS_LOCK';
      const expand=1+(wind?.12:0)+.045*Math.sin(now*.006);
      renderer.ellipse(p.x,p.y+r*.33,r*.53,r*.39,[.72,.68,.89,1],20);
      renderer.ellipse(p.x,p.y-r*.02,r*1.17*expand,r*.83*expand,[.36,.30,.68,1],26);
      renderer.ellipse(p.x,p.y-r*.20,r*.94*expand,r*.58*expand,[.65,.54,.94,1],24);
      for(let i=0;i<8;i++){
        const a=i*Math.PI*2/8+Math.sin(now*.001+i)*.04,rr=r*.62;
        renderer.ellipse(p.x+Math.cos(a)*rr,p.y-r*.18+Math.sin(a)*rr*.55,r*.105,r*.08,[.88,.85,1,.9],12);
      }
      renderer.ellipse(p.x-r*.22,p.y+r*.25,r*3.3/48,r*3.3/48,[.19,.17,.36,1],9);
      renderer.ellipse(p.x+r*.22,p.y+r*.25,r*3.3/48,r*3.3/48,[.19,.17,.36,1],9);
    }
  };

for(const [id,appearance] of [['petalPredator','petal'],['elasticCap','mushroom']])enemyVisuals[id]=(r,{x,y,radius,time=0,unit})=>bossVisuals[appearance](r,{...unit,body:{position:{x,y}},visualRadius:radius},time);

export const bossConfig={radius:48,mass:36,hp:540,armor:12,speed:155,contactDamage:36,contactPush:450,detect:2000,bulletSpeed:450,bulletDamage:23,bulletPush:300,bulletRadius:10,bulletLifeMs:2050,windupMs:640,lockMs:160,recoverMs:850,recoilMs:1000,chargeSpeed:880,chargeDurationMs:760,chargeRecoilSpeed:330,summonPeriodMs:5100,summonAppearMs:390,summonLifeMs:7800,summonCap:4};
export const bossSpecies=Object.freeze({
    petalPredator:{id:'petalPredator',name:'꽃잎 포식자',appearance:'petal',summonType:'sprout',
      base:{hpRate:1,massRate:1,speedRate:1,bulletSpeedRate:1,chargeSpeedRate:1},
      fan:{count:9,spread:.125},radial:{count:18},summon:{count:3,lifetimeRate:1},
      variants:[{id:'wide',name:'광폭 꽃잎',fanSpread:1.3,bulletSpeedRate:1},{id:'rapid',name:'재빠른 개화',windupRate:.85,chargeSpeedRate:1.12},{id:'spiral',name:'회전 개화',radialRotation:.33,fanSpread:.85}]},
    elasticCap:{id:'elasticCap',name:'탄성 버섯왕',appearance:'mushroom',summonType:'puff',
      base:{hpRate:1.06,massRate:1.35,speedRate:.82,bulletSpeedRate:.86,chargeSpeedRate:.96},
      fan:{count:7,spread:.18},radial:{count:14},summon:{count:3,lifetimeRate:1.15},
      variants:[{id:'bouncy',name:'고탄성 갓',recoilSpeedRate:1.25,chargeSpeedRate:1.07},{id:'cloud',name:'포자 폭풍',radialCountRate:1.3,bulletSpeedRate:.9},{id:'dense',name:'균사 집결',summonCountRate:1.3,windupRate:1.06}]}
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
  Object.assign(enemyConfig[id],{signature,unlocks:{[signature]:1},contactMode:'passive',basicAttack:{range:170,prepareMs:160,speed:650,durationMs:520,recoverMs:350}});
}
for(const spec of Object.values(bossSpecies))enemyConfig[spec.id]={...bossConfig,height:96,hp:bossConfig.hp*spec.base.hpRate,mass:bossConfig.mass*spec.base.massRate,
  navigation:{near:240,far:380,chaseRate:.8,strafeRate:.55,response:4},speed:bossConfig.speed*spec.base.speedRate,damage:bossConfig.contactDamage,push:bossConfig.contactPush,signature:'bossPattern',unlocks:{bossPattern:1},
  basicAttack:{range:170,prepareMs:160,speed:650,durationMs:520,recoverMs:350},patterns:{CHARGE:1,FAN:2,RADIAL:3,SUMMON:4}};
enemyConfig.boss={...bossConfig,height:96,damage:bossConfig.contactDamage,push:bossConfig.contactPush};
const Lunger=mixin(Unit,Lungeable),Spitter=mixin(Unit,ProjectileFireable),Boss=mixin(Unit,BossPatternable);
export const enemyClasses={rogue:Rogue,pillbug:Pillbug,thornfruit:Thornfruit,rocket:Rocket,scout:Lunger,brute:Lunger,sprout:Lunger,puff:Lunger,spitter:Spitter,petalPredator:Boss,elasticCap:Boss};
const metadata={
  rogue:['도약 사마귀','#717b3d','도약'],pillbug:['폭탄 공벌레','#bd8742','자폭'],thornfruit:['가시 열매','#789f40','가시 발사·반격'],rocket:['로켓 봉오리','#8a9e40','고정 지점 포물선 4연사'],
  scout:['정찰 꽃','#ec7056','빠른 돌진'],brute:['두꺼운 꽃','#e8a145','무거운 돌진'],spitter:['포자 꽃','#a078ef','지상 포자탄'],
  sprout:['꽃잎 새싹','#85cc4a','짧은 돌진'],puff:['포자 방울','#a88cee','탄성 돌진'],petalPredator:['꽃잎 포식자','#f47b9b','부채·돌진·원형 탄막·새싹 소환'],elasticCap:['탄성 버섯왕','#a68aee','돌진·부채·원형 탄막·포자 소환']};
export const species=Object.fromEntries(Object.entries(metadata).map(([id,[name,color,description]],i)=>[id,{id,name,color,description,boss:!!bossSpecies[id],
  egg:{color,mark:i%3,spots:2+i%4},config:enemyConfig[id],Class:enemyClasses[id],presentation:{draw:enemyVisuals[id],color,egg:{motif:id}} }]));
export function speciesConfig(id,grade=5,{powerRate=1,sizeRate=1,bodyScale=1,growthRate=1}={}){
  const base=species[id].config,c=structuredClone(base),power=Math.pow(powerRate,grade),size=Math.pow(sizeRate,grade);
  c.hp*=power;c.damage*=power;c.attackPower=65*power;c.radius*=bodyScale;c.height*=bodyScale;c.armorPenPercent=0;c.armorPenFlat=0;
  if(c.leap){c.leap.range*=Math.pow(growthRate,grade);c.leap.height*=Math.pow(growthRate,grade);}
  if(c.selfDestruct){c.selfDestruct.damage*=power;c.selfDestruct.radius*=size;}
  if(c.spike)c.spike.damage*=power;
  if(c.arcFire)c.arcFire.shot.damage*=power;
  if(c.projectileFire){c.projectileFire.damage*=power;c.projectileFire.radius*=size;c.projectileFire.range*=Math.pow(growthRate,grade);}
  if(c.bulletDamage)c.bulletDamage*=power;
  if(c.arcFire)c.arcFire.heights=c.arcFire.heights.slice(0,grade<2?1:grade<3?2:grade<4?3:4);
  if(c.spike){c.spike.count=grade<2?4:8;c.unlocks.spikeCounter=2;}
  return c;
}

const eggMotifs={
  rogue:{kind:'v',count:2,color:'#f58f42'},pillbug:{kind:'segments',count:6,color:'#f89b46'},thornfruit:{kind:'triangles',count:10,color:'#f3a363'},rocket:{kind:'dots',count:4,color:'#ed7861'},
  scout:{kind:'petals',count:6,color:'#ffd18f'},brute:{kind:'petals',count:7,color:'#ffd967'},spitter:{kind:'petals',count:3,color:'#dda5ff'},
  sprout:{kind:'petals',count:5,color:'#c9ef88'},puff:{kind:'dots',count:5,color:'#dfcaff'},petalPredator:{kind:'petals',count:9,color:'#ffe174'},elasticCap:{kind:'cap',count:5,color:'#e1d3ff'}
};
for(const spec of Object.values(species))Object.assign(spec.presentation.egg,eggMotifs[spec.id]);
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
// Replay one species' authored geometry: opaque primitives form the silhouette.
// The injected outline decorates any Presentation without knowing its faction.
export function drawSpecies(r,pres,view){
  const methods={ellipse:{color:4,points:[0,1]},rect:{color:4,points:[0,1]},
    triangle:{color:6,points:[0,1,2,3,4,5]},line:{color:5,points:[0,1,2,3]}};
  const tint=rgb(pres.color),original=rgb(species[view.unit.speciesId].color),commands=[];
  const paint=Object.fromEntries(Object.entries(methods).map(([name,shape])=>[name,(...args)=>{
    const color=args[shape.color];args[shape.color]=color.map((v,i)=>i<3?Math.min(1,v*tint[i]/Math.max(.05,original[i])):v);
    commands.push({name,shape,args});
  }]));
  pres.draw(paint,view);
  if(pres.outline){const passes=[pres.outline],contrast=pres.outline.contrast,edgeColor=rgb(pres.outline.color);
    if(contrast&&Math.hypot(...tint.map((v,i)=>v-edgeColor[i]))<contrast.maxColorDistance)passes.push(contrast);
    for(const pass of passes){const color=[...rgb(pass.color),1];
      for(let i=0;i<8;i++){const angle=i*Math.PI/4,dx=Math.cos(angle)*pass.width,dy=Math.sin(angle)*pass.width;
        for(const {name,shape,args} of commands){if(args[shape.color][3]<.8)continue;
          const edge=[...args];edge[shape.color]=color;
          for(const index of shape.points)edge[index]+=index%2?dy:dx;r[name](...edge);
        }
      }
    }
  }
  for(const {name,args} of commands)r[name](...args);
}
// Both UI SVG and world primitives consume the same presentation palette/motif.
function motifSegments(presentation,x,y,q){const m=presentation.egg,items=[];
  if(m.kind==='v')for(const sign of [-1,1])items.push({kind:'line',points:[x+sign*q*.7,y-q*.4,x+sign*q*.15,y+q*.35,x+sign*q*.8,y+q*.75]});
  else if(m.kind==='segments')for(let i=0;i<m.count;i++){const a=i*Math.PI*2/m.count;items.push({kind:'line',points:[x,y,x+Math.cos(a)*q*.85,y+Math.sin(a)*q]});}
  else if(m.kind==='cap'){items.push({kind:'line',points:[x-q*.8,y-q*.15,x,y-q*.55,x+q*.8,y-q*.15]});for(let i=0;i<m.count;i++)items.push({kind:'dot',x:x+(i%3-1)*q*.38,y:y+(i<3?0:.5)*q,size:q*.10});}
  else for(let i=0;i<m.count;i++){const a=i*Math.PI*2/m.count,px=x+Math.cos(a)*q*.60,py=y+Math.sin(a)*q*.65;
    items.push({kind:m.kind==='triangles'?'triangle':'dot',x:px,y:py,size:q*(m.kind==='petals'?.18:.15)});}
  if(m.kind==='petals')items.push({kind:'dot',x,y,size:q*.21});return items;
}
export function drawSpeciesEgg(r,pres,x,y,q,progress=0,time=0){const wobble=progress>.33?Math.sin(time*.018)*progress*2:0;x+=wobble;
  r.ellipse(x,y,q,q*1.28,[...rgb(pres.color),.97],18);const color=[...rgb(pres.egg.color),1];
  for(const item of motifSegments(pres,x,y,q)){if(item.kind==='line'){const a=item.points;for(let i=0;i<a.length-2;i+=2)r.line(a[i],a[i+1],a[i+2],a[i+3],Math.max(1,q*.12),color);}
    else if(item.kind==='triangle')r.triangle(item.x,item.y-item.size,item.x-item.size,item.y+item.size,item.x+item.size,item.y+item.size,color);
    else r.ellipse(item.x,item.y,item.size,item.size,color,10);}
  if(progress>.3)r.line(x-q*.4,y-q*.3,x+q*.2,y+q*.2,1.5,[.2,.2,.2,1]);if(progress>.6)r.line(x+q*.2,y+q*.2,x-q*.3,y+q*.7,1.5,[.2,.2,.2,1]);
}
export function eggSvg(pres){let svg='<svg viewBox="0 0 40 48" width="32" height="38" aria-hidden="true"><ellipse cx="20" cy="24" rx="15" ry="20" fill="'+pres.color+'"/>';
  for(const item of motifSegments(pres,20,24,15)){const color=pres.egg.color;if(item.kind==='line')svg+='<polyline points="'+item.points.join(' ')+'" fill="none" stroke="'+color+'" stroke-width="2"/>';
    else if(item.kind==='triangle')svg+='<path d="M'+item.x+' '+(item.y-item.size)+'l'+(-item.size)+' '+(item.size*2)+'h'+(item.size*2)+'Z" fill="'+color+'"/>';
    else svg+='<circle cx="'+item.x+'" cy="'+item.y+'" r="'+item.size+'" fill="'+color+'"/>';}
  return svg+'</svg>';
}

const gradeNotes={
  rogue:['충돌 돌진','도약','도약 거리·높이 성장','도약 거리·높이 성장','도약 거리·높이 성장','완성 도약 · 착지 피해 없음'],
  pillbug:['충돌 돌진','준비 후 자폭','자폭 범위·위력 성장','자폭 범위·위력 성장','자폭 범위·위력 성장','완성 자폭 · 3초 부활'],
  thornfruit:['충돌 돌진','4방향 가시','8방향 가시 · 활성 피격 1회 반격','같은 가시·반격 성장','같은 가시·반격 성장','완성 가시·반격'],
  rocket:['충돌 돌진','고정 조준 곡사 1발','곡사 2발','곡사 3발','곡사 4발','완성 곡사 4발 · 간격 150ms'],
  spitter:['충돌 돌진','거리 유지·옆걸음·직선탄','직선탄 크기·사거리 성장','직선탄 크기·사거리 성장','직선탄 크기·사거리 성장','완성 직선탄'],
};
for(const id of ['scout','brute','sprout','puff'])gradeNotes[id]=['충돌 돌진','종 고유 준비 돌진·회복','같은 돌진·충격 성장','같은 돌진·충격 성장','같은 돌진·충격 성장','완성 종 고유 돌진'];
for(const id of ['petalPredator','elasticCap'])gradeNotes[id]=['충돌 돌진','돌진','돌진·부채 탄막','돌진·부채·원형 탄막','돌진·부채·원형·같은 종 소환','기존 전체 패턴 · 탄막 2연사'];
for(const [id,notes] of Object.entries(gradeNotes))species[id].gradeNotes=notes;

// The first four retain PR8's debut; replacements can award every normal species.
export const enemyRefillWave=[...enemyWave,'scout','brute','spitter'];
