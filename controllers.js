import {hostile,healTargetValid} from './abilities.js';

export function companionIdlePoint(anchor,slot,radius){const a=(slot+1)*2.399;return {x:anchor.x+Math.cos(a)*radius,y:anchor.y+Math.sin(a)*radius};}

// Controllers return intent only. Unit/capabilities are the sole combat-state writers.
const gap=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function navigation(unit,target,attack){
  const c=unit.config,p=unit.body.position,d=gap(p,target),dx=(target.x-p.x)/Math.max(1,d),dy=(target.y-p.y)/Math.max(1,d);
  let speed=d>c.radius+16+8?c.speed:0,x=dx,y=dy;
  if(attack&&c.navigation?.chaseRate){const chase=d>c.navigation.far?1:d<c.navigation.near?-1:0;return {x:(dx*chase*c.navigation.chaseRate-dy*unit.strafeSign*c.navigation.strafeRate)*c.speed,y:(dy*chase*c.navigation.chaseRate+dx*unit.strafeSign*c.navigation.strafeRate)*c.speed};}
  if(attack&&c.navigation){if(d<c.navigation.near)speed=-c.speed;else if(d<=c.navigation.far){speed=c.speed*.5;x=-dy*unit.strafeSign;y=dx*unit.strafeSign;}}
  return {x:x*speed,y:y*speed};
}
function supportIntent(unit,world,idlePoint){const c=unit.config.heal;if(!c)return null;
  const valid=t=>healTargetValid(unit,t)&&gap(t.body.position,unit.body.position)<=c.searchRange;
  const target=unit.canHeal()?(valid(unit.heal.target)?unit.heal.target:world.targets().filter(valid).sort((a,b)=>(b.maxHp-b.hp)/b.maxHp-(a.maxHp-a.hp)/a.maxHp||gap(a.body.position,unit.body.position)-gap(b.body.position,unit.body.position))[0]):null;
  const point=target?.body.position||idlePoint,d=gap(unit.body.position,point);
  const move=target&&d<=c.range?{x:0,y:0}:navigation(unit,point,false);
  return {target:{...point},targetUnit:null,healTarget:target,attack:false,navigation:move};
}
export class EnemyController {
  intent(unit,world){const support=supportIntent(unit,world,unit.body.position);if(support)return support;const target=world.targets().filter(t=>hostile(unit,t)&&gap(t.body.position,unit.body.position)<unit.config.detect)
    .sort((a,b)=>gap(a.body.position,unit.body.position)-gap(b.body.position,unit.body.position))[0];
    const point=target?.body.position||unit.body.position;return {target:{...point},targetUnit:target,attack:!!target,navigation:navigation(unit,point,!!target)};}
}
export class PetController {
  constructor({slot=0,range=460,leash=600,followRadius=48}={}){Object.assign(this,{slot,range,leash,followRadius});}
  intent(unit,world){const anchor=world.anchor(),p=unit.body.position;
    const idlePoint=companionIdlePoint(anchor,this.slot,this.followRadius);
    const support=supportIntent(unit,world,idlePoint);if(support)return support;
    const target=gap(p,anchor)<=this.leash?world.targets().filter(t=>hostile(unit,t)&&gap(t.body.position,anchor)<=this.range)
      .sort((a,b)=>gap(a.body.position,p)-gap(b.body.position,p))[0]:null;
    const point=target?.body.position||idlePoint;
    return {target:{...point},targetUnit:target,attack:!!target,navigation:navigation(unit,point,!!target)};}
}
