// Reusable capabilities. Ground plane is x/y; z is the bottom of a vertical volume.
const applied = new WeakMap();
const expand = capability => capability.mixins || [capability];
export function mixin(first, ...rest) {
  if (!first.prototype) {
    const factories = [first, ...rest].flatMap(expand);
    const composite = Base => mixin(Base, ...factories);
    composite.mixins = factories;
    return composite;
  }
  let Class = first;
  const seen = new Set();
  for(let ancestor=first;ancestor;ancestor=Object.getPrototypeOf(ancestor)) {
    for(const capability of applied.get(ancestor)||[])seen.add(capability);
  }
  for (const factory of rest.flatMap(expand)) {
    if (seen.has(factory)) continue;
    Class = factory(Class); seen.add(factory); applied.set(Class, new Set(seen));
  }
  return Class;
}

// HAS-A charge state. The caller advances milliseconds independently of attack/movement modes.
export class ChargePool {
  constructor(config){this.config={maxCharges:config.maxCharges,rechargeMs:config.rechargeMs};this.reset();}
  reset(){this.readySlots=Array.from({length:this.config.maxCharges},(_,slot)=>slot);this.refillSlots=[];this.refillMs=0;this.spent=0;}
  get charges(){return this.readySlots.length;}
  get progress(){return this.refillSlots.length?this.refillMs/this.config.rechargeMs:0;}
  configure({maxCharges,rechargeMs}){
    const progress=this.progress,oldMax=this.config.maxCharges;
    this.config={maxCharges,rechargeMs};
    this.readySlots=this.readySlots.filter(slot=>slot<maxCharges);
    this.refillSlots=this.refillSlots.filter(slot=>slot<maxCharges);
    for(let slot=oldMax;slot<maxCharges;slot++)this.readySlots.push(slot);
    this.refillMs=this.refillSlots.length?progress*rechargeMs:0;
  }
  consume(slot=this.readySlots[0]){const index=this.readySlots.indexOf(slot);if(index<0)return false;
    this.readySlots.splice(index,1);this.refillSlots.push(slot);this.spent++;return true;}
  update(dtMs){if(!this.refillSlots.length)return;
    this.refillMs+=dtMs;
    while(this.refillSlots.length&&this.refillMs+1e-8>=this.config.rechargeMs){
      this.refillMs=Math.max(0,this.refillMs-this.config.rechargeMs);this.readySlots.push(this.refillSlots.shift());
    }
    if(!this.refillSlots.length)this.refillMs=0;
  }
  snapshot(){return {charges:this.charges,maxCharges:this.config.maxCharges,rechargeMs:this.config.rechargeMs,progress:this.progress,spent:this.spent,
    readySlots:[...this.readySlots],refillingSlot:this.refillSlots[0]??null};}
}

export function volume(body, height, feetZ = 0) {
  if (!(height > 0) || !Number.isFinite(feetZ)) throw new TypeError('invalid vertical volume');
  const state = {feetZ, previousFeetZ:feetZ, height, motion:{x:body.position.x,y:body.position.y}};
  body.plugin.volume = state;
  return state;
}
export function snapshotVolumes(bodies) {
  for (const body of bodies) { const v=body.plugin.volume;
    if (v) {v.previousFeetZ=v.feetZ;v.motion.x=body.position.x;v.motion.y=body.position.y;v.motion.toX=undefined;v.motion.toY=undefined;}
  }
}
function lowerBound(window, value, delta) {
  if (Math.abs(delta)<1e-9) return value>=0;
  const t=-value/delta;
  if (delta>0) window[0]=Math.max(window[0],t); else window[1]=Math.min(window[1],t);
  return window[0]<=window[1];
}
// Intersect XY contact time with Z overlap time: checking the axes independently
// would falsely hit a body passed above earlier in the same tick.
export function contactWindow(a,b,xy=true,from=0,to=1) {
  const av=a.plugin.volume,bv=b.plugin.volume;
  const window=[from,to];
  if (av&&bv) {
    const az=av.previousFeetZ,bz=bv.previousFeetZ,dz=(av.feetZ-az)-(bv.feetZ-bz);
    if (!lowerBound(window,az+av.height-bz,dz)||!lowerBound(window,bz+bv.height-az,-dz)) return null;
  }
  if (xy&&a.circleRadius&&b.circleRadius) {
    const ap=av?.motion||a.positionPrev,bp=bv?.motion||b.positionPrev;
    const x=ap.x-bp.x,y=ap.y-bp.y;
    const dx=(av?.motion.toX??a.position.x)-ap.x-(bv?.motion.toX??b.position.x)+bp.x,
      dy=(av?.motion.toY??a.position.y)-ap.y-(bv?.motion.toY??b.position.y)+bp.y;
    const r=a.circleRadius+b.circleRadius,A=dx*dx+dy*dy,B=2*(x*dx+y*dy),C=x*x+y*y-r*r;
    if (A<1e-9) {if(C>0)return null;}
    else {const d=B*B-4*A*C;if(d<0)return null;const root=Math.sqrt(d);
      window[0]=Math.max(window[0],(-B-root)/(2*A));window[1]=Math.min(window[1],(-B+root)/(2*A));}
  }
  return window[0]<=window[1]&&window[1]>=from&&window[0]<=to?window:null;
}
export function sweepVerticalContacts(M,bodies,onContact=()=>{},config={insetPx:1}) {
  // Preserve integrated endpoints for shared contact timing after a clamp/solver.
  // Heights still follow the capability's arc; physics resolves the earlier XYZ contact.
  for(const b of bodies){const v=b.plugin.volume;if(v){v.motion.toX=b.position.x;v.motion.toY=b.position.y;}}
  const actors=bodies.filter(b=>b.circleRadius&&b.plugin.volume&&!b.isSensor);
  for(const a of actors){const av=a.plugin.volume;if(av.feetZ===av.previousFeetZ)continue;
    let earliest=1,end=1,selected=null;
    for(const b of actors){if(a===b||!M.Detector.canCollide(a.collisionFilter,b.collisionFilter)||
      Math.hypot(a.position.x-b.position.x,a.position.y-b.position.y)<=a.circleRadius+b.circleRadius||contactWindow(a,b,true,0,0))continue;
      const window=contactWindow(a,b);if(window&&window[0]<earliest&&window[0]<window[1]){earliest=window[0];end=window[1];selected=b;}}
    if(selected){
      // Matter circles are regular polygons. Move at most 1 authored pixel into
      // the valid simultaneous interval so a tangent circle hit reaches its SAT manifold.
      const bv=selected.plugin.volume;
      const travel=Math.hypot(av.motion.toX-av.motion.x-bv.motion.toX+bv.motion.x,av.motion.toY-av.motion.y-bv.motion.toY+bv.motion.y);
      const t=earliest+Math.min((end-earliest)*.5,config.insetPx/Math.max(1,travel));
      M.Body.setPosition(a,{x:av.motion.x+(av.motion.toX-av.motion.x)*t,y:av.motion.y+(av.motion.toY-av.motion.y)*t});
      // Both integrated actors must share the impact time. Rewinding only the
      // vertical mover leaves a moving target at its end pose and loses the pair.
      if(!selected.isStatic)M.Body.setPosition(selected,{x:bv.motion.x+(bv.motion.toX-bv.motion.x)*t,y:bv.motion.y+(bv.motion.toY-bv.motion.y)*t});
      onContact(a,selected,earliest);}
  }
}
const detectorHooks=new WeakMap();
export function filterMatterVolumes(M,engine,accept) {
  // Matter 0.20.0: Detector -> Pairs -> collisionStart -> Resolver. Filter before
  // Pairs so a height-separated XY overlap never pushes and re-entry starts anew.
  if (!detectorHooks.has(M.Detector)) {
    const original=M.Detector.collisions;
    M.Detector.collisions=function(detector){const collisions=original(detector),test=detector.volumeAccept;
      if (!test)return collisions;
      let length=0;for(const collision of collisions)if(test(collision.bodyA.parent,collision.bodyB.parent))collisions[length++]=collision;
      collisions.length=length;return collisions;};
    detectorHooks.set(M.Detector,original);
  }
  engine.detector.volumeAccept=accept;
  return ()=>{delete engine.detector.volumeAccept;};
}
export function groundArc(start,aim,durationMs,height) {
  return {start:{...start},aim:{...aim},durationMs,height,ageMs:0,previous:{...start},finished:false};
}
export function stepArc(flight,dtMs) {
  flight.ageMs=Math.min(flight.durationMs,flight.ageMs+dtMs);
  const t=flight.ageMs/flight.durationMs;
  const pose={x:flight.start.x+(flight.aim.x-flight.start.x)*t,y:flight.start.y+(flight.aim.y-flight.start.y)*t,
    z:flight.start.z+(flight.aim.z-flight.start.z)*t+4*flight.height*t*(1-t)};
  flight.finished=t>=1;
  return pose;
}

export const DeathReason=Object.freeze({hit:'hit',selfDestruct:'selfDestruct',expiry:'expiry',cleanup:'cleanup'});
export const hostile=(a,b)=>!!a&&!!b&&a.alive&&b.alive&&a.faction!==b.faction&&b.targetable!==false;
// HAS-A bounded status state. Milliseconds advance once in the world tick, including frozen actors.
export const elementConfig={
  frost:{slowMs:2000,slowRate:.20,freezeMs:1200,refreezeMs:2000,shatterRate:.50},
  acid:{durationMs:3000,armorReduction:.20,poolMs:2000,intervalMs:500,powerRate:.10,radius:48,spreadRadius:82,maxPools:16}
};
export class UnitStatus {
  constructor(){this.slowMs=0;this.slowRate=0;this.frozenMs=0;this.refreezeMs=0;this.acidMs=0;this.armorReduction=0;}
  update(ms){this.slowMs=Math.max(0,this.slowMs-ms);this.frozenMs=Math.max(0,this.frozenMs-ms);this.refreezeMs=Math.max(0,this.refreezeMs-ms);this.acidMs=Math.max(0,this.acidMs-ms);}
  get movementRate(){return this.frozenMs>0?0:this.slowMs>0?1-this.slowRate:1;}
  cold(target,source,{freeze=false,...c}=elementConfig.frost){if(!hostile(source,target)||target.invulnerable)return false;
    this.slowMs=c.slowMs;this.slowRate=c.slowRate;
    if(freeze&&this.refreezeMs<=0){this.frozenMs=c.freezeMs;this.refreezeMs=c.freezeMs+c.refreezeMs;target.adapter?.freeze?.(target);}
    return true;}
  acid(target,source,c=elementConfig.acid){if(!hostile(source,target)||target.invulnerable)return false;this.acidMs=c.durationMs;this.armorReduction=c.armorReduction;return true;}
  shatter(c=elementConfig.frost){if(this.frozenMs<=0)return false;this.frozenMs=0;this.refreezeMs=c.refreezeMs;return true;}
}
export function effectiveArmor(target,stats={}){const status=target.status;
  return Math.max(0,(target.config?.armor||0)*(status?.acidMs>0?1-status.armorReduction:1)*(1-(stats.armorPenPercent||0))-(stats.armorPenFlat||0));}
export function damageAfterArmor(raw,target,stats={},floating=false){const value=Math.max(0,raw)*100/(100+effectiveArmor(target,stats));return floating?value:Math.round(value);}
export function applyElementHit(target,source,effect){if(!effect||!target.alive)return;
  if(effect.frost)target.status?.cold(target,source,{...elementConfig.frost,...effect.frost});
  if(effect.acid)target.status?.acid(target,source,{...elementConfig.acid,...effect.acid});
}
export function receiveHit(target,payload,source,now=0){
  if(!hostile(source,target)||target.invulnerable||now<(target.protectedUntilMs||0))return 0;
  const stats=payload.stats||{};
  const calculated=payload.resolved?payload.raw:damageAfterArmor(payload.raw,target,stats,true);
  const rounded=payload.floating||target.config?.damageRounding===false?calculated:Math.round(calculated);
  const amount=target.config?.deferDeath?Math.max(0,rounded):Math.min(target.hp,Math.max(0,rounded));
  if(amount<=0)return 0;const effective=Math.min(Math.max(0,target.hp),amount);target.hp-=amount;target.protectedUntilMs=now+(target.config?.hitProtectionMs||0);
  const attacker=source.attacker||source,rate=Math.max(0,Math.min(1,attacker.config?.lifeSteal||0));
  const restored=receiveHeal(attacker,effective*rate);if(restored>0)attacker.adapter?.healed?.(attacker,restored);
  target.adapter?.hurt?.(target,amount,source);if(payload.kind!=='status')applyElementHit(target,source,payload.elementHit||source.config?.elementHit);if(target.hp<=0){if(!target.config?.deferDeath&&!payload.deferDeath)target.die(DeathReason.hit,source);}else target.onHit?.({damage:amount,kind:payload.kind,sourceUnitId:source.unitId});return amount;
}
export function receiveHeal(target,amount){if(!target.alive||amount<=0)return 0;const healed=Math.max(0,Math.min(target.maxHp-target.hp,amount));target.hp+=healed;return healed;}
export const combatConfig={referenceSpeed:1600};
export function collisionDamage(source,target){const dx=target.preX-source.preX,dy=target.preY-source.preY,d=Math.hypot(dx,dy)||1;
  const closing=Math.max(0,(source.pre.x-target.pre.x)*dx/d+(source.pre.y-target.pre.y)*dy/d);
  return (source.config.attackPower||source.config.damage)*closing/(source.config.referenceSpeed||combatConfig.referenceSpeed);
}
export class Unit {
  constructor({id,unitId=id,type,speciesId=type,body,config,adapter,controller=null,presentation=null,deathPolicy=()=>{},faction='wild',grade=5,inventoryId=null}) {
    Object.assign(this,{id:unitId,unitId,type,speciesId,body,config,adapter,controller,presentation,deathPolicy,faction,grade,inventoryId,hp:config.hp,maxHp:config.hp,alive:true,pre:{x:0,y:0},
      preX:body.position.x,preY:body.position.y,lastTouchMs:-Infinity,burn:null,conductUntilMs:0,state:'CHASE',attackCount:0,headingX:0,headingY:0,strafeSign:unitId%2?1:-1,protectedUntilMs:0});
    this.status=new UnitStatus();this.spatial=volume(body,config.height);this.collisionAttack={phase:'READY',leftMs:0,hitIds:new Set()};
  }
  unlocked(name){return this.grade>=(this.config.unlocks?.[name]??0);}
  get canAct(){return this.alive&&this.status.frozenMs<=0;}
  step(dt,world){if(!this.canAct)return;const intent=this.controller?this.controller.intent(this,world):world;this.intent=intent;this.update(dt,intent);}
  update(dt,context){if(!this.alive)return;
    const c=this.config.basicAttack,s=this.collisionAttack,signature=this.config.signature&&this.unlocked(this.config.signature);
    if(c&&(!signature||this.config.basicWithSignature)){
      if(s.phase==='READY'&&context.attack!==false&&Math.hypot(context.target.x-this.body.position.x,context.target.y-this.body.position.y)<c.range){
        const dx=context.target.x-this.body.position.x,dy=context.target.y-this.body.position.y,d=Math.hypot(dx,dy)||1;
        this.headingX=dx/d;this.headingY=dy/d;s.phase='PREPARE';s.leftMs=c.prepareMs;this.state='WINDUP';this.attackCount++;s.hitIds.clear();this.adapter.notice(this);}
      if(s.phase==='PREPARE'){this.adapter.brake(this,dt);s.leftMs-=dt*1000;if(s.leftMs<=0){s.phase='CHARGE';s.leftMs=c.durationMs;this.state='LUNGE';this.adapter.charge(this,c.speed);}return;}
      if(s.phase==='CHARGE'){s.leftMs-=dt*1000;if(s.leftMs<=0){s.phase='RECOVER';s.leftMs=c.recoverMs;this.state='RECOVER';}return;}
      if(s.phase==='RECOVER'){s.leftMs-=dt*1000;if(s.leftMs<=0){s.phase='READY';this.state='CHASE';}return;}
    }
    this.adapter.chase(this,dt,context);
  }
  contact(target,now){if(!this.canAct||!hostile(this,target)||now-this.lastTouchMs<(this.config.contactCooldownMs||450))return 0;
    const charge=this.state==='LUNGE'||this.state==='BOSS_CHARGE',active=this.config.contactAttackStates?.includes(this.state)&&this.unlocked(this.config.signature);
    if(!charge&&!active)return 0;if(charge&&this.collisionAttack.hitIds.has(target.unitId))return 0;
    let raw=this.config.damage;
    if(charge)raw=collisionDamage(this,target);
    const damage=this.adapter.damage(target,{raw,stats:this.config,kind:'collision'},this);
    if(damage>0){this.lastTouchMs=now;this.collisionAttack.hitIds.add(target.unitId);this.adapter.impact?.(this,target,damage);
      if(this.collisionAttack.phase==='CHARGE'){this.collisionAttack.phase='RECOVER';this.collisionAttack.leftMs=this.config.basicAttack.recoverMs;this.state='RECOVER';}}
    return damage;
  }
  die(reason,source=null){if(!this.alive)return false;this.alive=false;this.deathReason=reason;this.cancel();this.burn=null;this.conductUntilMs=0;this.deathPolicy(this,{reason,source});return true;}
  onHit(){}
  cancel(){this.state='RECOVER';this.collisionAttack.phase='CANCELLED';this.collisionAttack.hitIds.clear();}
}
export const Lungeable=Base=>class Lungeable extends Base {
  constructor(...args){super(...args);this.lunge={config:this.config.lunge,phase:'READY',leftMs:0};}
  update(dt,ctx){if(!this.alive)return;const s=this.lunge,c=s.config;
    if(!this.unlocked('lunge'))return super.update(dt,ctx);
    if(s.phase==='READY'&&ctx.attack!==false&&Math.hypot(ctx.target.x-this.body.position.x,ctx.target.y-this.body.position.y)<c.range){const p=this.body.position,dx=ctx.target.x-p.x,dy=ctx.target.y-p.y,d=Math.hypot(dx,dy)||1;this.headingX=dx/d;this.headingY=dy/d;s.phase='PREPARE';s.leftMs=c.prepareMs;this.state='WINDUP';this.attackCount++;this.collisionAttack.hitIds.clear();this.adapter.notice(this);}
    if(s.phase==='PREPARE'){this.adapter.brake(this,dt);s.leftMs-=dt*1000;if(s.leftMs<=0){s.phase='CHARGE';s.leftMs=c.durationMs;this.state='LUNGE';this.adapter.charge(this,c.speed);}return;}
    if(s.phase==='CHARGE'){s.leftMs-=dt*1000;if(s.leftMs<=0){s.phase='RECOVER';s.leftMs=c.recoverMs;this.state='RECOVER';}return;}
    if(s.phase==='RECOVER'){s.leftMs-=dt*1000;if(s.leftMs<=0){s.phase='READY';this.state='CHASE';}}
    super.update(dt,ctx);
  }
  cancel(){this.lunge.phase='CANCELLED';super.cancel();}
};
export const ProjectileFireable=Base=>class ProjectileFireable extends Base {
  constructor(...args){super(...args);this.projectileFire={config:this.config.projectileFire,phase:'READY',leftMs:0,nextMs:0,fired:0,shots:0,volleys:0};}
  update(dt,ctx){if(!this.alive)return;const s=this.projectileFire,c=s.config,ms=dt*1000;
    if(!this.unlocked('projectileFire'))return super.update(dt,ctx);
    if(s.phase==='READY'&&ctx.attack!==false&&Math.hypot(ctx.target.x-this.body.position.x,ctx.target.y-this.body.position.y)<c.range){
      const p=this.body.position,dx=ctx.target.x-p.x,dy=ctx.target.y-p.y,d=Math.hypot(dx,dy)||1;
      this.headingX=dx/d;this.headingY=dy/d;s.phase='PREPARE';s.leftMs=c.prepareMs;this.state='WINDUP';this.attackCount++;this.adapter.notice(this);}
    if(s.phase==='PREPARE'){this.adapter.brake(this,dt);s.leftMs-=ms;if(s.leftMs>0)return;
      s.phase='BURST';s.nextMs=0;s.fired=0;s.volleys++;this.state='PROJECTILE_BURST';}
    if(s.phase==='BURST'){this.adapter.brake(this,dt);s.nextMs-=ms;
      while(s.fired<(c.count||1)&&s.nextMs<=0){s.shots++;this.adapter.projectile(this,c,s.shots);s.fired++;s.nextMs+=c.intervalMs||1;}
      if(s.fired===(c.count||1)){s.phase='RECOVER';s.leftMs=c.recoverMs;this.state='RECOVER';}return;}
    if(s.phase==='RECOVER'){s.leftMs-=ms;if(s.leftMs<=0){s.phase='READY';this.state='CHASE';}}
    super.update(dt,ctx);
  }
  cancel(){this.projectileFire.phase='CANCELLED';super.cancel();}
};
export const BossPatternable=Base=>class BossPatternable extends Base {
  constructor(...args){super(...args);this.bossPattern={patterns:this.config.patterns,log:[]};}
  update(dt,ctx){if(!this.alive)return;if(!this.unlocked('bossPattern')||ctx.attack===false)return super.update(dt,ctx);this.adapter.bossStep(this,dt,ctx);}
  cancel(){this.bossPattern.log=[];super.cancel();}
};
export const Sunbeamable=Base=>class Sunbeamable extends Base {
  constructor(...args){super(...args);this.sunbeam={config:this.config.sunbeam,phase:'READY',leftMs:0,pulseLeftMs:0,target:null,focusMs:0,stage:1,pulses:0};}
  beamTargetValid(target){const p=this.body.position,c=this.sunbeam.config;
    return hostile(this,target)&&Math.hypot(target.body.position.x-p.x,target.body.position.y-p.y)<=c.range&&this.adapter.pathClear(p,target.body.position,c.width);
  }
  update(dt,ctx){if(!this.alive)return;if(!this.unlocked('sunbeam'))return super.update(dt,ctx);const s=this.sunbeam,c=s.config,ms=dt*1000;
    if(s.target&&!this.beamTargetValid(s.target)){s.target=null;s.focusMs=0;s.stage=1;
      if(s.phase==='PREPARE'||s.phase==='FIRE'){s.phase='RECOVER';s.leftMs=c.recoverMs;this.state='RECOVER';}}
    if(s.phase==='READY'&&ctx.attack!==false){const target=s.target||ctx.targetUnit;
      if(this.beamTargetValid(target)){if(s.target!==target)s.focusMs=0;s.target=target;s.phase='PREPARE';s.leftMs=c.prepareMs;this.state='SUNBEAM_PREPARE';this.attackCount++;this.adapter.notice(this);}}
    if(s.phase==='PREPARE'){this.adapter.brake(this,dt);s.leftMs-=ms;if(s.leftMs<=0){s.phase='FIRE';s.leftMs=c.fireMs;s.pulseLeftMs=c.intervalMs;this.state='SUNBEAM_FIRE';}return;}
    if(s.phase==='FIRE'){this.adapter.brake(this,dt);const activeMs=Math.min(ms,s.leftMs);s.leftMs-=activeMs;s.focusMs+=activeMs;s.pulseLeftMs-=activeMs;
      while(s.pulseLeftMs<=1e-7&&this.beamTargetValid(s.target)){const focused=s.focusMs+s.pulseLeftMs;
        const tier=c.focus.filter(t=>this.grade>=t.grade&&focused>=t.afterMs).at(-1);s.stage=tier?.stage||1;
        this.adapter.beam(this,s.target,c,tier?.multiplier||1);s.pulses++;s.pulseLeftMs+=c.intervalMs;}
      if(s.leftMs<=1e-7){s.phase='RECOVER';s.leftMs=c.recoverMs;this.state='RECOVER';}return;
    }
    if(s.phase==='RECOVER'){s.leftMs-=ms;if(s.leftMs<=0){s.phase='READY';this.state='CHASE';}}
    super.update(dt,ctx);
  }
  cancel(){this.sunbeam.phase='CANCELLED';this.sunbeam.target=null;this.sunbeam.focusMs=0;this.sunbeam.stage=1;super.cancel();}
};
// Explicit single-target attacks share reception; idle body contact never attacks.
export const Meleeable=Base=>class Meleeable extends Base {
  constructor(...args){super(...args);this.melee={config:this.config.melee,phase:'READY',leftMs:0,target:null,swings:0,hits:0};}
  meleeTargetValid(target){const c=this.melee.config,p=this.body.position;
    if(!hostile(this,target))return false;const dx=target.body.position.x-p.x,dy=target.body.position.y-p.y,d=Math.hypot(dx,dy);
    const a=this.spatial,b=target.body.plugin.volume;
    return d<=c.range+(target.body.circleRadius||0)&&(!b||a.feetZ+a.height>=b.feetZ&&b.feetZ+b.height>=a.feetZ)&&
      (d<1||(dx*this.headingX+dy*this.headingY)/d>=Math.cos(c.halfAngle))&&this.adapter.pathClear(p,target.body.position,c.width);
  }
  update(dt,ctx){if(!this.alive)return;if(!this.unlocked('melee'))return super.update(dt,ctx);const s=this.melee,c=s.config,ms=dt*1000;
    if(s.phase==='READY'&&ctx.attack!==false&&hostile(this,ctx.targetUnit)){
      const p=this.body.position,t=ctx.targetUnit.body.position,d=Math.hypot(t.x-p.x,t.y-p.y);
      if(d<=c.range+(ctx.targetUnit.body.circleRadius||0)&&this.adapter.pathClear(p,t,c.width)){
        this.headingX=(t.x-p.x)/Math.max(1,d);this.headingY=(t.y-p.y)/Math.max(1,d);s.target=ctx.targetUnit;
        s.phase='PREPARE';s.leftMs=c.prepareMs;this.state='MELEE_PREPARE';this.attackCount++;this.adapter.notice(this);}}
    if(s.phase==='PREPARE'){this.adapter.brake(this,dt);s.leftMs-=ms;
      if(s.leftMs<=0){s.phase='STRIKE';s.leftMs=c.strikeMs;this.state='MELEE_STRIKE';s.swings++;
        if(this.meleeTargetValid(s.target)&&this.adapter.melee(this,s.target,c)>0)s.hits++;}return;}
    if(s.phase==='STRIKE'){this.adapter.brake(this,dt);s.leftMs-=ms;if(s.leftMs<=0){s.phase='RECOVER';s.leftMs=c.recoverMs;this.state='RECOVER';}return;}
    if(s.phase==='RECOVER'){s.leftMs-=ms;if(s.leftMs<=0){s.phase='READY';s.target=null;this.state='CHASE';}}
    super.update(dt,ctx);
  }
  cancel(){this.melee.phase='CANCELLED';this.melee.target=null;super.cancel();}
};
export function healTargetValid(source,target){return !!target&&target!==source&&source.alive&&target.alive&&target.hp>0&&target.faction===source.faction&&target.hp<target.maxHp;}
export const Healable=Base=>class Healable extends Base {
  constructor(...args){super(...args);this.heal={config:this.config.heal,phase:'READY',leftMs:0,target:null,casts:0,healed:0,cost:0};}
  canHeal(){return this.hp>this.heal.config.minHp;}
  update(dt,ctx){if(!this.alive)return;const s=this.heal,c=s.config,ms=dt*1000;
    if(!this.unlocked('heal'))return super.update(dt,ctx);
    if(s.target&&!healTargetValid(this,s.target))s.target=null;
    if(s.phase==='READY'){s.target=ctx.healTarget||null;
      if(this.canHeal()&&healTargetValid(this,s.target)&&Math.hypot(s.target.body.position.x-this.body.position.x,s.target.body.position.y-this.body.position.y)<=c.range&&this.adapter.pathClear(this.body.position,s.target.body.position,c.width)){
        const p=this.body.position,t=s.target.body.position,d=Math.hypot(t.x-p.x,t.y-p.y);this.headingX=(t.x-p.x)/Math.max(1,d);this.headingY=(t.y-p.y)/Math.max(1,d);s.phase='PREPARE';s.leftMs=c.prepareMs;this.state='HEAL_PREPARE';this.adapter.notice(this);}else return super.update(dt,ctx);}
    if(s.phase==='PREPARE'){this.adapter.brake(this,dt);s.leftMs-=ms;if(s.leftMs<=0){
      if(this.canHeal()&&healTargetValid(this,s.target)&&Math.hypot(s.target.body.position.x-this.body.position.x,s.target.body.position.y-this.body.position.y)<=c.range&&this.adapter.pathClear(this.body.position,s.target.body.position,c.width)){
        const gained=receiveHeal(s.target,Math.min(c.amount,Math.max(0,this.hp-c.minHp)*c.efficiency));
        if(gained>0){const cost=gained/c.efficiency;this.hp=Math.max(c.minHp,this.hp-cost);s.casts++;s.healed+=gained;s.cost+=cost;this.adapter.heal(this,s.target,gained,cost);}}
      s.phase='RECOVER';s.leftMs=c.recoverMs;this.state='RECOVER';}return;}
    if(s.phase==='RECOVER'){s.leftMs-=ms;if(s.leftMs<=0){s.phase='READY';this.state='CHASE';}super.update(dt,ctx);}
  }
  cancel(){this.heal.phase='CANCELLED';this.heal.target=null;super.cancel();}
};
export const Regenerative=Base=>class Regenerative extends Base {
  constructor(...args){super(...args);this.regeneration={config:this.config.regeneration,healed:0};}
  update(dt,ctx){if(!this.alive)return;this.regeneration.healed+=receiveHeal(this,this.maxHp*this.regeneration.config.ratePerSecond*dt);super.update(dt,ctx);}
};
export const Leapable = Base => class Leapable extends Base {
  constructor(...args){super(...args);this.leap={config:this.config.leap,phase:'READY',leftMs:0,flight:null,count:0,landings:0};}
  startLeap(target){const l=this.leap,c=l.config,p=this.body.position,d=Math.hypot(target.x-p.x,target.y-p.y);
    if(l.phase!=='READY'||d>c.range||d<c.minRange)return false;
    const aim={x:target.x,y:target.y,z:0};
    if(!this.adapter.pathClear(p,aim,this.config.radius))return false;
    l.phase='PREPARE';l.leftMs=c.prepareMs;l.aim=aim;this.state='LEAP_PREPARE';this.attackCount++;this.adapter.notice(this);return true;
  }
  update(dt,context){if(!this.alive)return;if(!this.unlocked('leap'))return super.update(dt,context);const l=this.leap,c=l.config,ms=dt*1000;
    if(l.phase==='READY') {if(context.attack!==false&&this.startLeap(context.target))return;return super.update(dt,context);}
    l.leftMs-=ms;
    if(l.phase==='PREPARE') {this.adapter.brake(this,dt);if(l.leftMs>0)return;
      if(!this.adapter.pathClear(this.body.position,l.aim,this.config.radius)){l.phase='COOLDOWN';l.leftMs=c.cooldownMs;return;}
      l.flight=groundArc({...this.body.position,z:this.spatial.feetZ},l.aim,c.durationMs,c.height);
      l.phase='FLIGHT';l.count++;this.state='LEAP';this.adapter.notice(this,'launch');}
    if(l.phase==='FLIGHT') {const f=l.flight,pose=stepArc(f,ms*this.status.movementRate),old=f.previous;
      this.adapter.moveBy(this,pose.x-old.x,pose.y-old.y);this.spatial.feetZ=pose.z;f.previous=pose;
      if(f.finished){this.spatial.feetZ=0;l.flight=null;l.phase='COOLDOWN';l.leftMs=c.cooldownMs;l.landings++;this.state='RECOVER';this.adapter.land(this);}
      return;}
    if(l.leftMs<=0)l.phase='READY';super.update(dt,context);
  }
  cancel(){this.leap.flight=null;this.leap.phase='CANCELLED';this.spatial.feetZ=0;super.cancel();}
};
export const SelfDestructible = Base => class SelfDestructible extends Base {
  constructor(...args){super(...args);this.selfDestruct={config:this.config.selfDestruct,phase:'READY',leftMs:0,exploded:false};}
  update(dt,context){if(!this.alive)return;if(!this.unlocked('selfDestruct'))return super.update(dt,context);const s=this.selfDestruct,c=s.config,p=this.body.position;
    if(s.phase==='READY'&&context.attack!==false&&Math.hypot(context.target.x-p.x,context.target.y-p.y)<=c.range){s.phase='PREPARE';s.leftMs=c.prepareMs;this.state='SELF_DESTRUCT_PREPARE';this.attackCount++;this.adapter.notice(this);}
    if(s.phase==='PREPARE'){this.adapter.brake(this,dt);s.leftMs-=dt*1000;
      if(s.leftMs<=0&&this.alive&&!s.exploded){s.exploded=true;s.phase='EXPLODED';this.adapter.explode(this,c);this.adapter.retire(this);}return;}
    super.update(dt,context);
  }
  cancel(){this.selfDestruct.phase='CANCELLED';super.cancel();}
};
export const SpikeCounterable = Base => class SpikeCounterable extends Base {
  constructor(...args){super(...args);this.spike={config:this.config.spike,phase:'READY',leftMs:0,countered:false,pulses:0,counters:0};}
  onHit(hit){const s=this.spike;if(this.canAct&&hit.damage>0&&hit.kind!=='status'&&s.phase==='ACTIVE'&&this.unlocked('spikeCounter')&&!s.countered){s.countered=true;s.counters++;this.adapter.spikes(this,s.config,'counter');}super.onHit(hit);}
  update(dt,context){if(!this.alive)return;if(!this.unlocked('spike'))return super.update(dt,context);const s=this.spike,c=s.config,p=this.body.position;
    if(s.phase==='READY'&&context.attack!==false&&Math.hypot(context.target.x-p.x,context.target.y-p.y)<c.range){s.phase='PREPARE';s.leftMs=c.prepareMs;s.countered=false;this.state='SPIKE_PREPARE';this.attackCount++;this.adapter.notice(this);}
    if(s.phase==='PREPARE'||s.phase==='ACTIVE'){this.adapter.brake(this,dt);s.leftMs-=dt*1000;
      if(s.leftMs<=0){if(s.phase==='PREPARE'){s.phase='ACTIVE';s.leftMs=c.activeMs;s.pulses++;this.state='SPIKE_ACTIVE';this.adapter.spikes(this,c,'pulse');}
        else{s.phase='RECOVER';s.leftMs=c.recoverMs;this.state='RECOVER';}}return;}
    if(s.phase==='RECOVER'){s.leftMs-=dt*1000;if(s.leftMs<=0)s.phase='READY';}
    super.update(dt,context);
  }
  cancel(){this.spike.phase='CANCELLED';super.cancel();}
};
export const ArcFireable = Base => class ArcFireable extends Base {
  constructor(...args){super(...args);this.arcFire={config:this.config.arcFire,phase:'READY',leftMs:0,nextMs:0,clockMs:0,fired:0,volleys:0,aim:null};}
  update(dt,context){if(!this.alive)return;if(!this.unlocked('arcFire'))return super.update(dt,context);const s=this.arcFire,c=s.config,p=this.body.position,ms=dt*1000;s.clockMs+=ms;
    if(s.phase==='READY'&&context.attack!==false&&Math.hypot(context.target.x-p.x,context.target.y-p.y)<c.range&&this.adapter.pathClear(p,context.target,c.shot.radius)){
      s.phase='PREPARE';s.leftMs=c.prepareMs;s.aim={...context.target,z:0};s.fired=0;s.nextMs=0;this.state='ARC_PREPARE';this.attackCount++;this.adapter.notice(this);}
    if(s.phase==='PREPARE'){this.adapter.brake(this,dt);s.leftMs-=ms;if(s.leftMs>0)return;s.phase='BURST';s.nextMs=ms;s.volleys++;this.state='ARC_BURST';}
    if(s.phase==='BURST'){this.adapter.brake(this,dt);s.nextMs-=ms;
      while(s.fired<c.heights.length&&s.nextMs<=1e-7){this.adapter.arcShot(this,s.aim,c.heights[s.fired],s.fired);s.fired++;s.nextMs+=c.intervalMs;}
      if(s.fired===c.heights.length){s.phase='RECOVER';s.leftMs=c.recoverMs;this.state='RECOVER';}return;}
    if(s.phase==='RECOVER'){s.leftMs-=ms;if(s.leftMs<=0)s.phase='READY';}
    super.update(dt,context);
  }
  cancel(){this.arcFire.phase='CANCELLED';super.cancel();}
};

// Each capability owns its milliseconds/state; adapters own physics and presentation effects.
export const Burrowable=Base=>class Burrowable extends Base {
  constructor(...args){super(...args);this.burrow={config:this.config.burrow,phase:'EXPOSED',leftMs:this.config.burrow.exposedMs,flight:null,aim:null,trailMs:0,dives:0,emerges:0};}
  update(dt,ctx){if(!this.alive)return;if(!this.unlocked('burrow'))return super.update(dt,ctx);
    const s=this.burrow,c=s.config,ms=dt*1000;
    if(s.phase==='EXPOSED'){s.leftMs-=ms;
      if(s.leftMs<=0&&ctx.attack!==false&&!['WINDUP','PROJECTILE_BURST'].includes(this.state)){
        s.aim=this.adapter.burrowAim(this,ctx.target,c.distance);s.phase='DIVE';s.leftMs=c.diveMs;this.state='BURROW_DIVE';this.attackCount++;this.adapter.notice(this,'burrow');}
      else return super.update(dt,ctx);}
    this.adapter.brake(this,dt);
    if(s.phase==='DIVE'){s.leftMs-=ms;if(s.leftMs>0)return;
      s.phase='MOVE';s.dives++;s.flight=groundArc({...this.body.position,z:0},{...s.aim,z:0},c.moveMs,0);this.adapter.participation(this,false);this.state='BURROW_MOVE';}
    if(s.phase==='MOVE'){const pose=stepArc(s.flight,ms*this.status.movementRate),old=s.flight.previous;this.adapter.moveBy(this,pose.x-old.x,pose.y-old.y);s.flight.previous=pose;
      s.trailMs-=ms;if(s.trailMs<=0){this.adapter.capabilityFx(this,'burrow-trail',c);s.trailMs+=c.trailMs;}
      if(s.flight.finished){s.phase='EMERGE_PREPARE';s.leftMs=c.emergeMs;this.state='BURROW_EMERGE_PREPARE';}return;}
    if(s.phase==='EMERGE_PREPARE'){s.leftMs-=ms;if(s.leftMs>0)return;
      this.adapter.participation(this,true);s.emerges++;s.phase='EXPOSED';s.leftMs=c.exposedMs;s.flight=null;this.state='RECOVER';
      this.adapter.erupt(this,c);return;}
  }
  cancel(){this.burrow.phase='CANCELLED';this.burrow.flight=null;this.adapter.participation(this,true);super.cancel();}
};
export const Summonable=Base=>class Summonable extends Base {
  constructor(...args){super(...args);this.summon={config:this.config.summon,phase:'ACTIVE',slots:Array(this.config.summon.capacity).fill(null),leftMs:0,deployed:0};}
  update(dt,ctx){if(!this.alive)return;const s=this.summon,c=s.config;
    if(this.unlocked('summon')){s.leftMs-=dt*1000;
      for(let i=0;i<s.slots.length;i++)if(s.slots[i]&&!s.slots[i].alive)s.slots[i]=null;
      if(ctx.attack!==false&&s.leftMs<=0){const slot=s.slots.indexOf(null);
        if(slot>=0){const child=this.adapter.summon(this,c,slot);if(child){s.slots[slot]=child;s.deployed++;}s.leftMs=c.deployMs;}
        else s.leftMs=c.respawnMs;}}
    super.update(dt,ctx);
  }
  cancel(){this.summon.phase='CANCELLED';for(const child of this.summon.slots)if(child?.alive)child.die(DeathReason.cleanup);this.summon.slots.fill(null);super.cancel();}
};
export const Returnable=Base=>class Returnable extends Base {
  constructor(...args){super(...args);this.returnFlight={config:this.config.returnFlight,phase:'ACTIVE',leftMs:0,returns:0,launches:0,healed:0};}
  update(dt,ctx){if(!this.alive)return;const owner=this.summoner,s=this.returnFlight,c=s.config;
    if(!owner)return super.update(dt,ctx);
    if(!owner.alive){this.die(DeathReason.cleanup);return;}
    const p=this.body.position,home=owner.body.position,d=Math.hypot(home.x-p.x,home.y-p.y);
    if(s.phase==='ACTIVE'&&((owner.unlocked('dock')&&(this.hp<=this.maxHp*c.retreatHpRate||ctx.attack===false&&this.hp<this.maxHp))||d>c.leash)){
      s.phase='RETURN';this.state='FLIGHT_RETURN';s.returns++;this.adapter.notice(this,'return');}
    if(s.phase==='RETURN'){this.state='FLIGHT_RETURN';
      const speed=this.config.speed;
      this.adapter.chase(this,dt,{navigation:{x:(home.x-p.x)/Math.max(1,d)*speed,y:(home.y-p.y)/Math.max(1,d)*speed}});
      if(d<=owner.config.radius+this.config.radius+c.dockMargin){if(owner.unlocked('dock')){s.phase='DOCKED';s.leftMs=c.dockMs;this.adapter.dock(this,true);}
        else{s.phase='ACTIVE';this.adapter.deploy(this);}}return;}
    if(s.phase==='DOCKED'){this.state='DOCKED';this.adapter.moveBy(this,home.x-p.x,home.y-p.y);s.leftMs-=dt*1000;
      s.healed+=receiveHeal(this,this.maxHp*c.healRate*dt);
      if(s.leftMs<=0&&this.hp>=this.maxHp){this.adapter.dock(this,false);this.adapter.deploy(this);s.phase='ACTIVE';s.launches++;
        if(this.projectileFire)this.projectileFire.phase='READY';this.state='CHASE';}return;}
    super.update(dt,ctx);
  }
  cancel(){this.returnFlight.phase='CANCELLED';super.cancel();}
};
export const Hookable=Base=>class Hookable extends Base {
  constructor(...args){super(...args);this.hook={config:this.config.hook,phase:'READY',leftMs:0,aim:null,shots:[],casts:0,hits:0,returned:0};}
  update(dt,ctx){if(!this.alive)return;if(!this.unlocked('hook'))return super.update(dt,ctx);const s=this.hook,c=s.config,ms=dt*1000;
    if(s.phase==='READY'&&ctx.attack!==false&&Math.hypot(ctx.target.x-this.body.position.x,ctx.target.y-this.body.position.y)<=c.range){
      s.phase='PREPARE';s.leftMs=c.prepareMs;this.state='HOOK_PREPARE';this.attackCount++;this.adapter.notice(this);}
    if(s.phase==='PREPARE'){this.adapter.brake(this,dt);s.aim={...ctx.target,z:0};const p=this.body.position,d=Math.hypot(s.aim.x-p.x,s.aim.y-p.y)||1;
      this.headingX=(s.aim.x-p.x)/d;this.headingY=(s.aim.y-p.y)/d;s.leftMs-=ms;
      if(s.leftMs<=0){s.shots=this.adapter.hooks(this,s.aim,c);s.casts++;s.phase='FLIGHT';this.state='HOOK_FLIGHT';}return;}
    if(s.phase==='FLIGHT'){this.adapter.brake(this,dt);this.state=s.shots.some(shot=>shot.returning)?'HOOK_RETURN':'HOOK_FLIGHT';
      if(s.shots.every(shot=>shot.finished)){s.returned+=s.shots.length;s.shots=[];s.phase='RECOVER';s.leftMs=c.recoverMs;this.state='RECOVER';}return;}
    if(s.phase==='RECOVER'){this.adapter.brake(this,dt);s.leftMs-=ms;if(s.leftMs<=0){s.phase='COOLDOWN';s.leftMs=c.cooldownMs;}return;}
    if(s.phase==='COOLDOWN'){s.leftMs-=ms;if(s.leftMs<=0)s.phase='READY';}
    super.update(dt,ctx);
  }
  cancel(){for(const shot of this.hook.shots)this.adapter.removeShot(shot);this.hook.shots=[];this.hook.phase='CANCELLED';super.cancel();}
};

// CAN-BE ground attacker. Locked geometry and secondary tells belong to the same ability for pets and enemies.
export const GroundAttackable=Base=>class GroundAttackable extends Base {
  constructor(...args){super(...args);this.groundAttack={config:this.config.groundAttack,phase:'READY',leftMs:0,aim:null,pending:[],casts:0};}
  update(dt,ctx){if(!this.unlocked('groundAttack'))return super.update(dt,ctx);const s=this.groundAttack,c=s.config,ms=dt*1000;
    for(const item of s.pending)item.leftMs-=ms;
    for(const item of s.pending.filter(v=>v.leftMs<=0))this.adapter.groundAttack(this,{...c,damage:c.damage*c.secondaryDamageRate},item.aim);
    s.pending=s.pending.filter(v=>v.leftMs>0);
    if(s.phase==='READY'&&ctx.attack!==false&&Math.hypot(ctx.target.x-this.body.position.x,ctx.target.y-this.body.position.y)<=c.range){s.aim={...ctx.target};const p=this.body.position,d=Math.hypot(s.aim.x-p.x,s.aim.y-p.y)||1;this.headingX=(s.aim.x-p.x)/d;this.headingY=(s.aim.y-p.y)/d;s.phase='PREPARE';s.leftMs=c.prepareMs;this.state='GROUND_PREPARE';this.attackCount++;this.adapter.notice(this);}
    if(s.phase==='PREPARE'){this.adapter.brake(this,dt);s.leftMs-=ms;if(s.leftMs<=0){this.adapter.groundAttack(this,c,s.aim);s.casts++;
      if(c.secondaryCount&&this.unlocked('secondary'))for(let i=0;i<c.secondaryCount;i++){const a=i*Math.PI*2/c.secondaryCount+s.casts*.7;const aim={x:s.aim.x+Math.cos(a)*c.secondaryOffset,y:s.aim.y+Math.sin(a)*c.secondaryOffset};s.pending.push({aim,leftMs:c.secondaryDelayMs});}
      s.phase='RECOVER';s.leftMs=c.recoverMs;this.state='RECOVER';}return;}
    if(s.phase==='RECOVER'){s.leftMs-=ms;if(s.leftMs<=0)s.phase='READY';}super.update(dt,ctx);
  }
  cancel(){this.groundAttack.pending=[];this.groundAttack.phase='CANCELLED';super.cancel();}
};
export const ConeBreathable=Base=>class ConeBreathable extends Base {
  constructor(...args){super(...args);this.coneBreath={config:this.config.coneBreath,phase:'READY',leftMs:0,pulseMs:0,casts:0};}
  update(dt,ctx){if(!this.unlocked('coneBreath'))return super.update(dt,ctx);const s=this.coneBreath,c=s.config,ms=dt*1000;
    if(s.phase==='READY'&&ctx.attack!==false&&Math.hypot(ctx.target.x-this.body.position.x,ctx.target.y-this.body.position.y)<=c.range){const p=this.body.position,d=Math.hypot(ctx.target.x-p.x,ctx.target.y-p.y)||1;this.headingX=(ctx.target.x-p.x)/d;this.headingY=(ctx.target.y-p.y)/d;s.phase='PREPARE';s.leftMs=c.prepareMs;this.state='CONE_PREPARE';this.attackCount++;this.adapter.notice(this);}
    if(s.phase==='PREPARE'){this.adapter.brake(this,dt);s.leftMs-=ms;if(s.leftMs<=0){s.phase='FIRE';s.leftMs=c.fireMs;s.pulseMs=c.intervalMs;s.casts++;this.state='CONE_FIRE';}return;}
    if(s.phase==='FIRE'){this.adapter.brake(this,dt);const active=Math.min(ms,s.leftMs);s.leftMs-=active;s.pulseMs-=active;while(s.pulseMs<=1e-7){this.adapter.coneBreath(this,c);s.pulseMs+=c.intervalMs;}if(s.leftMs<=0){s.phase='RECOVER';s.leftMs=c.recoverMs;this.state='RECOVER';}return;}
    if(s.phase==='RECOVER'){s.leftMs-=ms;if(s.leftMs<=0)s.phase='READY';}super.update(dt,ctx);
  }
  cancel(){this.coneBreath.phase='CANCELLED';super.cancel();}
};
