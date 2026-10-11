// Visual state only. No Matter body, combat state, RNG, or persistence is written here.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const turn=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const follow=(a,b,dt,rate)=>a+(b-a)*(1-Math.exp(-rate*dt/1000));
export function createPlayerPresentation(){return {
  facing:{target:{x:1,y:0},angle:0,previousAngle:0},
  body:{current:{xx:1,xy:0,yy:1,roll:0},previous:{xx:1,xy:0,yy:1,roll:0}},
  sprout:{current:{x:0,y:0},previous:{x:0,y:0}},
  motion:{rollAtMs:-Infinity,rollDurationMs:220,rollSign:1},
  impact:{atMs:-Infinity,direction:{x:1,y:0},strength:0},clock:{atMs:0}
};}
export function facePlayer(p,direction){const length=Math.hypot(direction?.x??0,direction?.y??0);if(length>1e-5)p.facing.target={x:direction.x/length,y:direction.y/length};}
export function rollPlayer(p,direction,nowMs,durationMs){facePlayer(p,direction);Object.assign(p.motion,{rollAtMs:nowMs,rollDurationMs:Math.min(260,durationMs),rollSign:direction.x<0?-1:1});}
export function impactPlayer(p,direction,speed,nowMs){if(speed<80||nowMs-p.impact.atMs<130)return;const length=Math.hypot(direction.x,direction.y)||1;Object.assign(p.impact,{atMs:nowMs,direction:{x:direction.x/length,y:direction.y/length},strength:clamp(speed/850,.12,1)});}
export function updatePlayerPresentation(p,{nowMs,dtMs,direction,dash=null,recoil=null,compression=0}){
  facePlayer(p,direction);const f=p.facing;f.previousAngle=f.angle;f.angle+=turn(f.angle,Math.atan2(f.target.y,f.target.x))*(1-Math.exp(-dtMs/65));
  const b=p.body;b.previous={...b.current};const sprout=p.sprout;sprout.previous={...sprout.current};
  let xx=1-compression,xy=0,yy=1-compression;
  function deform(n,amount){xx+=amount*(n.x*n.x-.6*n.y*n.y);xy+=amount*1.6*n.x*n.y;yy+=amount*(n.y*n.y-.6*n.x*n.x);}
  const stretch=dash?clamp(dash.speed/950,0,1)*.24:0;if(dash)deform(dash.direction,stretch);
  const age=nowMs-p.impact.atMs,hit=age>=0&&age<210?Math.sin(Math.PI*age/210)*p.impact.strength:0;
  deform(p.impact.direction,-.22*hit);if(recoil)deform(recoil.direction,-recoil.amount);
  b.current.xx=follow(b.current.xx,xx,dtMs,28);b.current.xy=follow(b.current.xy,xy,dtMs,28);b.current.yy=follow(b.current.yy,yy,dtMs,28);
  const rollAge=nowMs-p.motion.rollAtMs,q=clamp(rollAge/p.motion.rollDurationMs,0,1);
  b.current.roll=rollAge>=0&&q<1?p.motion.rollSign*Math.PI*2*(q*q*(3-2*q)):0;
  // The sprout reacts 55ms after impact; it returns upright without ongoing idle motion.
  const delayed=Math.max(0,age-55),wobble=age>55&&age<470?Math.sin(delayed*.022)*Math.exp(-delayed/125)*p.impact.strength*6:0;
  const bend=dash?{x:-dash.direction.x*stretch*23,y:-dash.direction.y*stretch*12}:{x:0,y:0};
  sprout.current.x=follow(sprout.current.x,bend.x-p.impact.direction.x*wobble,dtMs,20);
  sprout.current.y=follow(sprout.current.y,bend.y-p.impact.direction.y*wobble*.65,dtMs,20);p.clock.atMs=nowMs;
}
export function samplePlayerPresentation(p,alpha=1){const t=clamp(alpha,0,1),a=p.body.previous,b=p.body.current,s=p.sprout;
  return {angle:p.facing.previousAngle+turn(p.facing.previousAngle,p.facing.angle)*t,
    xx:a.xx+(b.xx-a.xx)*t,xy:a.xy+(b.xy-a.xy)*t,yy:a.yy+(b.yy-a.yy)*t,
    roll:a.roll+turn(a.roll,b.roll)*t,sproutX:s.previous.x+(s.current.x-s.previous.x)*t,sproutY:s.previous.y+(s.current.y-s.previous.y)*t};
}
export function drawPlayerPresentation(r,position,p,colors,{silhouetteRadius=23.5,silhouetteOpacity=.88}={}){
  const cos=Math.cos(p.roll),sin=Math.sin(p.roll);
  const point=(x,y)=>{const a=x*p.xx+y*p.xy,b=x*p.xy+y*p.yy;return {x:position.x+a*cos-b*sin,y:position.y+a*sin+b*cos};};
  function polygon(points,color){const origin=point(...points[0]);for(let i=1;i<points.length-1;i++){const a=point(...points[i]),b=point(...points[i+1]);r.triangle(origin.x,origin.y,a.x,a.y,b.x,b.y,color);}}
  function circle(x,y,rx,ry,color,count){const pts=[];for(let i=0;i<count;i++){const a=i*Math.PI*2/count;pts.push([x+Math.cos(a)*rx,y+Math.sin(a)*ry]);}polygon(pts,color);}
  function line(x,y,a,b,width,color){const start=point(x,y),end=point(a,b);r.line(start.x,start.y,end.x,end.y,width,color);}
  r.ellipse(position.x+3,position.y+8,21,12,[0,0,0,.37],18);
  circle(0,0,silhouetteRadius,silhouetteRadius,[.016,.075,.071,silhouetteOpacity],24);
  circle(0,0,19,19,colors.player,22);circle(-1,0,12.5,12.5,colors.playerCore,18);
  const dx=p.sproutX,dy=p.sproutY;
  line(-2,-16,-4+dx,-27+dy,2.7,[.12,.44,.34,1]);
  polygon([[-4+dx,-25+dy],[-11+dx,-26+dy],[-10+dx,-20+dy],[-4+dx,-21+dy]],colors.player);
  polygon([[-4+dx,-26+dy],[1+dx,-30+dy],[5+dx,-25+dy],[-2+dx,-22+dy]],[.52,.95,.71,1]);
  circle(Math.cos(p.angle)*5,Math.sin(p.angle)*5,4,4,[.12,.34,.32,1],9);
}
