import {Unit,mixin,Leapable,SelfDestructible,SpikeCounterable,ArcFireable} from './abilities.js';

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
export const enemyClasses={rogue:Rogue,pillbug:Pillbug,thornfruit:Thornfruit,rocket:Rocket};
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
