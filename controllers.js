import {hostile} from './abilities.js';

// Controllers return intent only. Unit/capabilities are the sole combat-state writers.
const gap=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function navigation(unit,target,attack){
  const c=unit.config,p=unit.body.position,d=gap(p,target),dx=(target.x-p.x)/Math.max(1,d),dy=(target.y-p.y)/Math.max(1,d);
  let speed=d>c.radius+16+8?c.speed:0,x=dx,y=dy;
  if(attack&&c.navigation?.chaseRate){const chase=d>c.navigation.far?1:d<c.navigation.near?-1:0;return {x:(dx*chase*c.navigation.chaseRate-dy*unit.strafeSign*c.navigation.strafeRate)*c.speed,y:(dy*chase*c.navigation.chaseRate+dx*unit.strafeSign*c.navigation.strafeRate)*c.speed};}
  if(attack&&c.navigation){if(d<c.navigation.near)speed=-c.speed;else if(d<=c.navigation.far){speed=c.speed*.5;x=-dy*unit.strafeSign;y=dx*unit.strafeSign;}}
  return {x:x*speed,y:y*speed};
}
export class EnemyController {
  intent(unit,world){const target=world.targets().filter(t=>hostile(unit,t)&&gap(t.body.position,unit.body.position)<unit.config.detect)
    .sort((a,b)=>gap(a.body.position,unit.body.position)-gap(b.body.position,unit.body.position))[0];
    const point=target?.body.position||unit.body.position;return {target:{...point},targetUnit:target,attack:!!target,navigation:navigation(unit,point,!!target)};}
}
export class PetController {
  constructor({slot=0,range=460,leash=600,followRadius=48}={}){Object.assign(this,{slot,range,leash,followRadius});}
  intent(unit,world){const anchor=world.anchor(),p=unit.body.position;
    const target=gap(p,anchor)<=this.leash?world.targets().filter(t=>hostile(unit,t)&&gap(t.body.position,anchor)<=this.range)
      .sort((a,b)=>gap(a.body.position,p)-gap(b.body.position,p))[0]:null;
    const a=(this.slot+1)*2.399,point=target?.body.position||{x:anchor.x+Math.cos(a)*this.followRadius,y:anchor.y+Math.sin(a)*this.followRadius};
    return {target:{...point},targetUnit:target,attack:!!target,navigation:navigation(unit,point,!!target)};}
}
