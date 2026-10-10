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

export class Unit {
  constructor({id,type,body,config,adapter}) {
    Object.assign(this,{id,type,body,config,adapter,hp:config.hp,maxHp:config.hp,alive:true,pre:{x:0,y:0},
      lastTouchMs:-Infinity,burn:null,conductUntilMs:0,state:'CHASE',attackCount:0,headingX:0,headingY:0,strafeSign:id%2?1:-1});
    this.spatial=volume(body,config.height);
  }
  update(dt,context){if(this.alive)this.adapter.chase(this,dt,context);}
  onHit(){}
  cancel(){}
}
export const Leapable = Base => class Leapable extends Base {
  constructor(...args){super(...args);this.leap={config:this.config.leap,phase:'READY',leftMs:0,flight:null,count:0,landings:0};}
  startLeap(target){const l=this.leap,c=l.config,p=this.body.position,d=Math.hypot(target.x-p.x,target.y-p.y);
    if(l.phase!=='READY'||d>c.range||d<c.minRange)return false;
    const aim={x:target.x,y:target.y,z:0};
    if(!this.adapter.pathClear(p,aim,this.config.radius))return false;
    l.phase='PREPARE';l.leftMs=c.prepareMs;l.aim=aim;this.state='LEAP_PREPARE';this.attackCount++;this.adapter.notice(this);return true;
  }
  update(dt,context){if(!this.alive)return;const l=this.leap,c=l.config,ms=dt*1000;
    if(l.phase==='READY') {if(this.startLeap(context.target))return;return super.update(dt,context);}
    l.leftMs-=ms;
    if(l.phase==='PREPARE') {this.adapter.brake(this,dt);if(l.leftMs>0)return;
      if(!this.adapter.pathClear(this.body.position,l.aim,this.config.radius)){l.phase='COOLDOWN';l.leftMs=c.cooldownMs;return;}
      l.flight=groundArc({...this.body.position,z:this.spatial.feetZ},l.aim,c.durationMs,c.height);
      l.phase='FLIGHT';l.count++;this.state='LEAP';this.adapter.notice(this,'launch');}
    if(l.phase==='FLIGHT') {const f=l.flight,pose=stepArc(f,ms),old=f.previous;
      this.adapter.moveBy(this,pose.x-old.x,pose.y-old.y);this.spatial.feetZ=pose.z;f.previous=pose;
      if(f.finished){this.spatial.feetZ=0;l.flight=null;l.phase='COOLDOWN';l.leftMs=c.cooldownMs;l.landings++;this.state='RECOVER';this.adapter.land(this);}
      return;}
    if(l.leftMs<=0)l.phase='READY';super.update(dt,context);
  }
  cancel(){this.leap.flight=null;this.leap.phase='CANCELLED';this.spatial.feetZ=0;super.cancel();}
};
export const SelfDestructible = Base => class SelfDestructible extends Base {
  constructor(...args){super(...args);this.selfDestruct={config:this.config.selfDestruct,phase:'READY',leftMs:0,exploded:false};}
  update(dt,context){if(!this.alive)return;const s=this.selfDestruct,c=s.config,p=this.body.position;
    if(s.phase==='READY'&&Math.hypot(context.target.x-p.x,context.target.y-p.y)<=c.range){s.phase='PREPARE';s.leftMs=c.prepareMs;this.state='SELF_DESTRUCT_PREPARE';this.attackCount++;this.adapter.notice(this);}
    if(s.phase==='PREPARE'){this.adapter.brake(this,dt);s.leftMs-=dt*1000;
      if(s.leftMs<=0&&this.alive&&!s.exploded){s.exploded=true;s.phase='EXPLODED';this.adapter.explode(this,c);this.adapter.retire(this);}return;}
    super.update(dt,context);
  }
  cancel(){this.selfDestruct.phase='CANCELLED';super.cancel();}
};
export const SpikeCounterable = Base => class SpikeCounterable extends Base {
  constructor(...args){super(...args);this.spike={config:this.config.spike,phase:'READY',leftMs:0,countered:false,pulses:0,counters:0};}
  onHit(hit){const s=this.spike;if(this.alive&&hit.damage>0&&s.phase==='ACTIVE'&&!s.countered){s.countered=true;s.counters++;this.adapter.spikes(this,s.config,'counter');}super.onHit(hit);}
  update(dt,context){if(!this.alive)return;const s=this.spike,c=s.config,p=this.body.position;
    if(s.phase==='READY'&&Math.hypot(context.target.x-p.x,context.target.y-p.y)<c.range){s.phase='PREPARE';s.leftMs=c.prepareMs;s.countered=false;this.state='SPIKE_PREPARE';this.attackCount++;this.adapter.notice(this);}
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
  update(dt,context){if(!this.alive)return;const s=this.arcFire,c=s.config,p=this.body.position,ms=dt*1000;s.clockMs+=ms;
    if(s.phase==='READY'&&Math.hypot(context.target.x-p.x,context.target.y-p.y)<c.range&&this.adapter.pathClear(p,context.target,c.shot.radius)){
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
