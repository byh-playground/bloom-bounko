import {t as tr,localizedList} from './i18n.js';
import {Unit,mixin,Leapable,SelfDestructible,SpikeCounterable,ArcFireable,Lungeable,ProjectileFireable,BossPatternable,Sunbeamable,Meleeable,Healable,Regenerative,Burrowable,Summonable,Returnable,Hookable} from './abilities.js';

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

Object.assign(enemyVisuals,{scout:(r,{x,y,radius:q,id=0,time=0})=>{for(let i=0;i<6;i++){const a=i*Math.PI/3+id*.7;r.ellipse(x+Math.cos(a)*q*.64,y+Math.sin(a)*q*.64,q*.45,q*.45,[.92,.43,.34,1],10);}r.ellipse(x,y,q*.70,q*.70,[1,.71,.48,1],14);r.ellipse(x-q*.2,y-q*.25,q*.2,q*.2,[.23,.18,.15,1],9);},spitter:(r,{x,y,radius:q,id=0,time=0})=>{for(let i=0;i<3;i++){const a=i*Math.PI*2/3+id*.3;r.ellipse(x+Math.cos(a)*q*.72,y+Math.sin(a)*q*.72,q*.63,q*.63,[.63,.46,.94,1],12);}r.ellipse(x,y,q*.74,q*.74,[.89,.78,1,1],18);r.ellipse(x,y,q*.316,q*.316,[.32,.15,.51,1],12);},sprout:(r,{x,y,radius:q,id=0,time=0})=>{for(let i=0;i<5;i++){const a=i*Math.PI*2/5+time*.0007;r.ellipse(x+Math.cos(a)*q*.75,y+Math.sin(a)*q*.75,q*.57,q*.357,[.52,.80,.29,1],9);}r.ellipse(x,y,q*.55,q*.55,[.92,1,.66,1],12);},puff:(r,{x,y,radius:q,id=0,time=0})=>{r.ellipse(x,y,q*.95,q*.85,[.66,.55,.93,1],18);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;r.ellipse(x+Math.cos(a)*q*.48,y+Math.sin(a)*q*.42,q*.2,q*.2,[.91,.80,1,1],9);};}});
// Shared seed body and facing follow Rally's common-body composition and source ratios.
function polygon(r,points,color){for(let i=1;i<points.length-1;i++)r.triangle(...points[0],...points[i],...points[i+1],color);}
function facing(r,x,y,unit){const swing=unit?.melee?.config.motion==='swing'?(unit.melee.phase==='STRIKE'?-.85+1.7*(1-unit.melee.leftMs/unit.melee.config.strikeMs):unit.melee.phase==='PREPARE'?-.85*(1-unit.melee.leftMs/unit.melee.config.prepareMs):0):0;const a=swing+(Math.hypot(unit?.headingX||0,unit?.headingY||0)>0?Math.atan2(unit.headingY,unit.headingX):-Math.PI/2)+Math.PI/2,ca=Math.cos(a),sa=Math.sin(a);
  const p=(px,py)=>[x+(px-x)*ca-(py-y)*sa,y+(px-x)*sa+(py-y)*ca];
  return {ellipse:(px,py,rx,ry,c,n)=>r.ellipse(...p(px,py),rx,ry,c,n),line:(ax,ay,bx,by,w,c)=>r.line(...p(ax,ay),...p(bx,by),w,c),triangle:(ax,ay,bx,by,cx,cy,c)=>r.triangle(...p(ax,ay),...p(bx,by),...p(cx,cy),c)};
}
function seedBody(r,x,y,q,team,light=team.map((v,i)=>i<3?Math.min(1,v*1.25):v)){circle(r,x,y+q*.12,q*.78,[.07,.10,.13,1],12);circle(r,x,y+q*.08,q*.68,team,12);circle(r,x-q*.18,y-q*.04,q*.25,light,10);}
// Rally's friendly body/light palette is canonical for these shared species.
const rallyBody=[.18,.43,.93,1],rallyLight=[.48,.68,1,1];
const rallyNeutralBody=[.48,.35,.22,1],rallyNeutralDark=[.25,.18,.12,1],rallyClawAccent=[.94,.58,.28,1];
Object.assign(enemyVisuals,{
  brute(r,{x,y,radius:q,time=0,attack=false}){const pulse=.5+.5*Math.sin(time*.009);
    circle(r,x,y+q*.1,q*.56,[.29,.45,.18,1]);r.line(x-q*.4,y+q*.18,x-q*.6,y-q*.18,q*.1,green);r.line(x+q*.4,y+q*.18,x+q*.6,y-q*.18,q*.1,green);
    r.line(x,y+q*.02,x,y-q*.46,q*.12,green);petals(r,x,y-q*.64,q*.42,12,[1,.77,.24,1],0,.84);
    circle(r,x,y-q*.64,q*.24,[.38,.24,.21,1]);circle(r,x,y-q*.64,q*(.18+.05*pulse),[1,.94,.58,attack?.88:.55]);
    if(attack)circle(r,x,y-q*.64,q*(.34+.08*pulse),[1,.84,.38,.14]);},
  lancer(renderer,{x,y,radius:q,unit,attack=false}){const r=facing(renderer,x,y,unit),team=[.61,.67,.27,1],charge=attack?q*.34:0;seedBody(r,x,y,q,team);
    circle(r,x,y+q*.14,q*.8,[.20,.16,.12,1],13);polygon(r,[[x-q*.66,y-q*.06],[x,y-q*.58],[x+q*.66,y-q*.06],[x+q*.52,y+q*.48],[x-q*.52,y+q*.48]],[.26,.30,.13,1]);circle(r,x,y-q*.5,q*.34,[.31,.22,.12,1],10);
    for(const sign of [-1,1]){r.line(x+sign*q*.18,y-q*.66,x+sign*q*.58,y-(q*1.55+charge),q*.227,accent);triangle(r,x+sign*q*.6,y-(q*1.62+charge),q*.2,accent,-Math.PI/2);}circle(r,x,y-q*.88,q*.22,team,9);},
  dandelion(r,{x,y,radius:q,time=0,silhouetteOnly=false}){const team=rallyBody;seedBody(r,x,y,q,team,rallyLight);circle(r,x,y+q*.16,q*.4,team,10);
    if(silhouetteOnly)return;
    for(let k=0;k<9;k++){const a=k*Math.PI*2/9+time*.0005;r.line(x,y-q*.3,x+Math.cos(a)*q*.72,y-q*.3+Math.sin(a)*q*.72,Math.max(1,1.3*q/16.848),[.94,.95,.82,.9]);}circle(r,x,y-q*.3,q*.13,[.92,.94,.72,1],8);},
  swordsman(renderer,{x,y,radius:q,unit,attack=false}){const r=facing(renderer,x,y,unit),slash=attack?q*.32:0;seedBody(r,x,y,q,[.46,.74,.32,1]);
    petals(r,x-q*.48,y+q*.05,q*.26,3,[.38,.68,.28,1],-.3,.58);polygon(r,[[x+q*.28,y+q*.12],[x+q*.70,y-q*.18],[x+q*1.34,y-(q*.82+slash)],[x+q*.92,y-(q*.95+slash)],[x+q*.40,y-q*.22]],[.48,.80,.32,1]);r.line(x+q*.44,y-q*.18,x+q*1.14,y-(q*.72+slash),Math.max(1,q*.107),[.24,.52,.20,1]);},
  pikeman(renderer,{x,y,radius:q,unit,attack=false}){const r=facing(renderer,x,y,unit),thrust=attack?q*.38:0;seedBody(r,x,y,q,[.54,.67,.31,1]);
    r.line(x+q*.08,y+q*.12,x+q*.08,y-(q*2.18+thrust),Math.max(2,q*.213),[.30,.55,.22,1]);polygon(r,[[x-q*.02,y-q*.86],[x-q*.35,y-q*.58],[x-q*.08,y-q*.42]],accent);polygon(r,[[x+q*.18,y-q*1.28],[x+q*.48,y-q*1.02],[x+q*.18,y-q*.9]],accent);triangle(r,x+q*.08,y-(q*2.34+thrust),q*.25,[.78,.88,.55,1],-Math.PI/2);},
  medic(r,{x,y,radius:q,silhouetteOnly=false}){const team=rallyBody;seedBody(r,x,y,q,team,rallyLight);petals(r,x,y+q*.04,q*.55,6,[.42,.76,.48,1],Math.PI/6,.7);
    circle(r,x,y-q*.34,q*.38,team,11);circle(r,x+q*.56,y-q*.3,q*.25,[.52,.96,.82,silhouetteOnly?1:.62],10);
    if(silhouetteOnly)return;
    circle(r,x+q*.49,y-q*.39,q*.08,[.90,1,.96,.85],8);r.line(x+q*.28,y-q*.12,x+q*.48,y-q*.26,Math.max(1.4,2.1*q/16.848),[.28,.62,.44,1]);}
});

Object.assign(enemyVisuals,{
  deathworm(r,{x,y,radius:q,id=0,unit,silhouetteOnly=false}){
    const buried=['MOVE','EMERGE_PREPARE'].includes(unit?.burrow?.phase);
    if(!silhouetteOnly){circle(r,x,y+q*.46,q*.82,[.39,.29,.18,1],16);circle(r,x,y+q*.46,q*.64,[.08,.075,.055,1],16);
      for(let k=0;k<6;k++){const a=k*Math.PI/3+id*.013,d=q*(.72+k%2*.18);circle(r,x+Math.cos(a)*d,y+q*.46+Math.sin(a)*d*.36,q*(.10+k%3*.018),k%2?[.52,.38,.20,1]:[.34,.25,.15,1],7);}}
    if(buried)return;
    const flesh=[.73,.49,.39,1],hi=[.86,.62,.51,1],fold=[.48,.28,.24,1],top=y-q*.88;
    for(let k=0;k<5;k++){const t=(k+.10)/4.25,yy=y+q*.20+(top-y-q*.20)*t,rad=q*(.64-k*.045);
      circle(r,x,yy,rad,k%2?flesh:fold,14);circle(r,x-rad*.10,yy-rad*.16,rad*.72,k%2?hi:flesh,12);}
    const headY=y-q*1.18,mouthR=q*.47;
    circle(r,x,headY,q*.70,fold,16);circle(r,x-q*.07,headY-q*.07,q*.70*.88,flesh,15);
    if(silhouetteOnly)return;
    circle(r,x,headY-q*.03,mouthR,[.48,.16,.13,1],18);circle(r,x,headY-q*.03,mouthR*.72,[.12,.045,.035,1],18);
    for(let k=0;k<18;k++){const a=k*Math.PI/9,cx=x+Math.cos(a)*mouthR*.77,cy=headY-q*.03+Math.sin(a)*mouthR*.77;
      r.line(cx,cy,x+Math.cos(a)*mouthR*.45,headY-q*.03+Math.sin(a)*mouthR*.45,Math.max(1.1,q*.022),[1,.88,.67,1]);circle(r,cx,cy,Math.max(.9,q*.017),[1,.88,.67,1],5);}
    circle(r,x,headY-q*.03,mouthR*.29,[.035,.012,.010,1],12);
  },
  hivecarrier(r,{x,y,radius:q,time=0,id=0,unit,silhouetteOnly=false}){
    const angle=Math.atan2(unit?.headingY||0,unit?.headingX||1),ca=Math.cos(angle),sa=Math.sin(angle),pt=(f,s)=>[x+(f*ca-s*sa)*q,y+(f*sa+s*ca)*q];
    const pulse=.5+.5*Math.sin(time*.003+id),flap=.96+.05*Math.sin(time*.005+id);
    if(!silhouetteOnly)for(const side of [-1,1])polygon(r,[pt(.12,side*.18),pt(-.02,side*1.10*flap),pt(-.70,side*.82),pt(-.50,side*.18)],[.66,.58,.30,.72]);
    circle(r,...pt(-.08,0),q*.74,[.34,.30,.17,1],14);circle(r,...pt(.20,0),q*.56,rallyNeutralBody,13);
    if(silhouetteOnly)return;
    let slot=0;for(const side of [-1,1])for(const f of [-.28,.26]){const port=pt(f,side*.40),dock=unit?.summon?.slots[slot++]?.returnFlight?.phase==='DOCKED';
      circle(r,...port,q*.13,[.12,.10,.06,1],8);circle(r,...port,q*(.06+.025*pulse),dock?[.52,1,.72,.95]:[.94,.78,.30,.72],7);}
    circle(r,...pt(.22,0),q*.18,[1,.86,.42,.72],9);
  },
  clawhunter(renderer,{x,y,radius:q,unit,attack=false}){
    const r=facing(renderer,x,y,unit),reach=attack?q*.32:0,orange=rallyClawAccent;
    circle(r,x,y+q*.08,q*.72,rallyNeutralBody,12);circle(r,x,y-q*.38,q*.36,[.48,.25,.12,1],10);
    for(const sign of [-1,1]){const detached=unit?.hook?.shots.some(shot=>!shot.finished&&shot.arm===sign);
      r.line(x+sign*q*.30,y,x+sign*q*1.15,y-(q*.36+reach),Math.max(2,q*.135),orange);
      if(!detached)triangle(r,x+sign*q*1.20,y-(q*.40+reach),q*.24,orange,-Math.PI/2);}
  },
  carriermite(r,{x,y,radius:q,time=0,id=0,unit,silhouetteOnly=false}){
    const angle=Math.atan2(unit?.headingY||0,unit?.headingX||1),ca=Math.cos(angle),sa=Math.sin(angle),pt=(f,s)=>[x+(f*ca-s*sa)*q,y+(f*sa+s*ca)*q],flap=.72+.30*(.5+.5*Math.sin(time*.026+id));
    if(!silhouetteOnly)for(const side of [-1,1])polygon(r,[pt(.02,side*.06),pt(.06,side*.64*flap),pt(-.32,side*.48*flap),pt(-.28,side*.05)],[.96,.84,.42,.42]);
    circle(r,...pt(-.12,0),q*.40,rallyNeutralBody,9);circle(r,...pt(.30,0),q*.23,rallyNeutralDark,8);
    if(!silhouetteOnly)r.line(...pt(.34,0),...pt(.82,0),Math.max(1,q*.19),[.84,.72,.30,1]);
  }
});

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
const Sunflower=mixin(Unit,Sunbeamable),Melee=mixin(Unit,Meleeable),Medic=mixin(Unit,Healable,Regenerative);
const Lunger=mixin(Unit,Lungeable),Spitter=mixin(Unit,ProjectileFireable),Boss=mixin(Unit,BossPatternable);
const Worm=mixin(Unit,ProjectileFireable,Burrowable),Carrier=mixin(Unit,Summonable),Hunter=mixin(Unit,Meleeable,Hookable),Mite=mixin(Unit,ProjectileFireable,Returnable);
export const enemyClasses={deathworm:Worm,hivecarrier:Carrier,clawhunter:Hunter,carriermite:Mite,rogue:Rogue,pillbug:Pillbug,thornfruit:Thornfruit,rocket:Rocket,scout:Lunger,brute:Sunflower,sprout:Lunger,puff:Lunger,spitter:Spitter,petalPredator:Boss,elasticCap:Boss,lancer:Lunger,dandelion:Melee,swordsman:Melee,pikeman:Melee,medic:Medic};
const metadata={
  lancer:localizedList([()=>tr("species.80"),'#9bab46',()=>tr("species.81")]),dandelion:localizedList([()=>tr("species.78"),'#2e6eed',()=>tr("species.79")]),swordsman:localizedList([()=>tr("species.76"),'#75bd52',()=>tr("species.77")]),pikeman:localizedList([()=>tr("species.74"),'#8aaa4e',()=>tr("species.75")]),medic:localizedList([()=>tr("species.72"),'#2e6eed',()=>tr("species.73")]),
  rogue:localizedList([()=>tr("species.70"),'#717b3d',()=>tr("species.71")]),pillbug:localizedList([()=>tr("species.68"),'#bd8742',()=>tr("species.69")]),thornfruit:localizedList([()=>tr("species.66"),'#789f40',()=>tr("species.67")]),rocket:localizedList([()=>tr("species.64"),'#8a9e40',()=>tr("species.65")]),
  scout:localizedList([()=>tr("species.62"),'#ec7056',()=>tr("species.63")]),brute:localizedList([()=>tr("species.60"),'#e8a145',()=>tr("species.61")]),spitter:localizedList([()=>tr("species.58"),'#a078ef',()=>tr("species.59")]),
  sprout:localizedList([()=>tr("species.56"),'#85cc4a',()=>tr("species.57")]),puff:localizedList([()=>tr("species.54"),'#a88cee',()=>tr("species.55")]),petalPredator:localizedList([()=>tr("species.52"),'#f47b9b',()=>tr("species.53")]),elasticCap:localizedList([()=>tr("species.50"),'#a68aee',()=>tr("species.51")]),  ...Object.fromEntries([['deathworm','#ba7d63'],['hivecarrier','#7a5938'],['clawhunter','#7a5938'],['carriermite','#7a5938']].map(([id,color])=>[id,localizedList([()=>tr('species.'+id+'.name'),color,()=>tr('species.'+id+'.desc')])])),
};
export const species=Object.fromEntries(Object.entries(metadata).map(([id,labels],i)=>{const color=labels[1];return [id,{id,get name(){return labels[0];},color,get description(){return labels[2];},boss:!!bossSpecies[id],
  egg:{color,mark:i%3,spots:2+i%4},config:enemyConfig[id],Class:enemyClasses[id],presentation:{draw:enemyVisuals[id],color,egg:{motif:id}} }];}));
// Fine rays/highlights are detail. These species explicitly describe their body mask.
for(const id of ['dandelion','medic','deathworm','hivecarrier','carriermite'])species[id].presentation.outlineGeometry='body';
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
  if(c.arcFire)c.arcFire.heights=c.arcFire.heights.slice(0,grade<2?1:grade<3?2:grade<4?3:4);
  if(c.spike){c.spike.count=grade<2?4:8;c.unlocks.spikeCounter=2;}
  return c;
}

const eggMotifs={
  deathworm:{kind:'segments',count:18,color:'#ffe0ab'},hivecarrier:{kind:'dots',count:4,color:'#efc74d'},clawhunter:{kind:'v',count:2,color:'#ff8f42'},carriermite:{kind:'triangles',count:2,color:'#efc74d'},
  lancer:{kind:'v',count:2,color:'#d1b77a'},dandelion:{kind:'segments',count:9,color:'#edf2cf'},swordsman:{kind:'triangles',count:3,color:'#9be372'},pikeman:{kind:'triangles',count:2,color:'#c7e392'},medic:{kind:'dots',count:3,color:'#baf7e2'},
  rogue:{kind:'v',count:2,color:'#f58f42'},pillbug:{kind:'segments',count:6,color:'#f89b46'},thornfruit:{kind:'triangles',count:10,color:'#f3a363'},rocket:{kind:'dots',count:4,color:'#ed7861'},
  scout:{kind:'petals',count:6,color:'#ffd18f'},brute:{kind:'petals',count:7,color:'#ffd967'},spitter:{kind:'petals',count:3,color:'#dda5ff'},
  sprout:{kind:'petals',count:5,color:'#c9ef88'},puff:{kind:'dots',count:5,color:'#dfcaff'},petalPredator:{kind:'petals',count:9,color:'#ffe174'},elasticCap:{kind:'cap',count:5,color:'#e1d3ff'}
};
for(const spec of Object.values(species))Object.assign(spec.presentation.egg,eggMotifs[spec.id]);
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
// Replay one species' authored geometry: opaque primitives form the silhouette.
// The injected outline decorates any Presentation without knowing its faction.
export function drawSpecies(r,pres,view){
  if(!pres.outline&&pres.color===species[view.unit.speciesId].color){pres.draw(r,view);return;}
  const methods={ellipse:{color:4,points:[0,1]},rect:{color:4,points:[0,1]},
    triangle:{color:6,points:[0,1,2,3,4,5]},line:{color:5,points:[0,1,2,3]}};
  const tint=rgb(pres.color),original=rgb(species[view.unit.speciesId].color),commands=pres.outline?[]:null;
  let capture=commands;
  const paint=Object.fromEntries(Object.entries(methods).map(([name,shape])=>[name,(...args)=>{
    const color=args[shape.color];args[shape.color]=color.map((v,i)=>i<3?Math.min(1,v*tint[i]/Math.max(.05,original[i])):v);
    if(capture)capture.push({name,shape,args});else r[name](...args);
  }]));
  pres.draw(paint,view);
  if(!commands)return;
  let silhouette=commands;
  if(pres.outline&&pres.outlineGeometry==='body'){capture=[];pres.draw(paint,{...view,silhouetteOnly:true});silhouette=capture;}
  if(pres.outline){const passes=[pres.outline],contrast=pres.outline.contrast,edgeColor=rgb(pres.outline.color);
    if(contrast&&Math.hypot(...tint.map((v,i)=>v-edgeColor[i]))<contrast.maxColorDistance)passes.push(contrast);
    for(const pass of passes){const color=[...rgb(pass.color),1];
      for(let i=0;i<8;i++){const angle=i*Math.PI/4,dx=Math.cos(angle)*pass.width,dy=Math.sin(angle)*pass.width;
        for(const {name,shape,args} of silhouette){if(args[shape.color][3]<.8)continue;
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
export function pickRefillSpecies(random){const total=enemyRefillWave.reduce((n,id)=>n+(species[id].config.spawnWeight??1),0);let draw=random()*total;
  for(const id of enemyRefillWave){draw-=species[id].config.spawnWeight??1;if(draw<0)return id;}return enemyRefillWave.at(-1);}
