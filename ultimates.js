// HAS-A loadout and one bounded sequence runner; attacks/movement are supplied by the game.
export const ultimateConfig={
  slots:{base:1,max:3,unlockNodes:['ultimateSlot2','ultimateSlot3']},
  trigger:{comboHits:4,ammo:1,rechargeHits:12},
  presentation:{trailIntervalMs:24,trailLifetimeMs:300,maxTrails:24,maxEffects:36},
  skills:{
    iceGarden:{branch:'frost',lane:10,symbol:'❈',color:[.58,.90,1],cost:3,requires:['iceShatter'],range:380,targetLossPolicy:'finishCommitted',trigger:{comboHits:3,rechargeHits:12},
      sequence:[{id:'move',durationMs:240,move:'approach',distance:64,standOff:110,easing:'smoother',sound:'ultimateMove'},{id:'condense',durationMs:300,move:'hold',charge:true,chargeStyle:'frost',compression:.18,sound:'frostCharge',soundScope:'phase'},
        {id:'release',durationMs:180,move:'hold',commit:true,attack:{kind:'iceGarden',atMs:[0],radius:180,power:.35,freezeMs:2400,fieldMs:4000,intervalMs:250,slowRate:.20,maxFields:4},sound:'frostRelease'},
        {id:'afterglow',durationMs:260,move:'return',easing:'smoother',fade:true,sound:'ultimateReturn'}]},
    lightningChain:{branch:'lightning',lane:5,symbol:'↯',color:[.62,.79,1],cost:3,requires:['relayArc'],range:380,targetLossPolicy:'finishCommitted',trigger:{comboHits:3,rechargeHits:10},
      sequence:[{id:'move',durationMs:200,move:'side',distance:-58,easing:'outCubic',sound:'ultimateMove'},{id:'condense',durationMs:220,move:'hold',charge:true,chargeStyle:'lightning',compression:.12,sound:'chainCharge',soundScope:'phase'},
        {id:'release',durationMs:280,move:'hold',commit:true,attack:{kind:'lightningChain',atMs:[0,80,160,240],maxTargets:4,jumpRange:140,firstPower:.70,power:.45}},
        {id:'afterglow',durationMs:240,move:'return',easing:'outCubic',fade:true,sound:'ultimateReturn'}]},
    fireSeed:{branch:'fire',lane:6,symbol:'✹',color:[1,.48,.18],cost:3,requires:['spreadFlame'],range:450,targetLossPolicy:'finishCommitted',trigger:{comboHits:4,rechargeHits:12},
      sequence:[{id:'move',durationMs:260,move:'recoil',distance:64,easing:'smoother',sound:'ultimateMove'},{id:'condense',durationMs:300,move:'hold',charge:true,chargeStyle:'fire',compression:.20,sound:'seedCharge',soundScope:'phase'},
        {id:'release',durationMs:600,move:'hold',commit:true,attack:{kind:'fireSeed',atMs:[0],radius:130,power:.90,speed:900,shotRadius:8,shotHeight:16,startZ:14,arcHeight:32,minTravelMs:120,lifeMs:1200,ignite:true,sound:'seedImpact',visual:'fire',skillId:'fireSeed'},sound:'seedLaunch'},
        {id:'afterglow',durationMs:300,move:'return',easing:'smoother',fade:true,sound:'ultimateReturn'}]},
    acidFountain:{branch:'acid',lane:11,symbol:'♧',color:[.73,.94,.27],cost:3,requires:['acidSpread'],range:380,targetLossPolicy:'finishCommitted',trigger:{comboHits:4,rechargeHits:12},
      sequence:[{id:'move',durationMs:240,move:'side',distance:64,easing:'smooth',sound:'ultimateMove'},{id:'condense',durationMs:280,move:'hold',charge:true,chargeStyle:'acid',compression:.16,sound:'acidCharge',soundScope:'phase'},
        {id:'release',durationMs:220,move:'hold',commit:true,attack:{kind:'acidFountain',atMs:[0],radius:120,poolMs:4000,intervalMs:500,powerRate:.10,skillId:'acidFountain'},sound:'acidRelease'},
        {id:'afterglow',durationMs:280,move:'return',easing:'smooth',fade:true,sound:'ultimateReturn'}]},

    laserBloom:{trigger:{comboHits:5,rechargeHits:15},symbol:'✦',color:[.35,.86,1],cost:5,requires:['autoChain','shadowRecharge2'],lane:1,range:520,targetLossPolicy:'finishCommitted',
      sequence:[
        {id:'move',durationMs:220,move:'side',distance:78,sound:'ultimateMove'},
        {id:'condense',durationMs:600,move:'hold',charge:true,chargeStyle:'beam',compression:.28,aim:'nearest',sound:'laserCharge',soundScope:'phase'},
        {id:'release',durationMs:800,move:'recoil',distance:16,recoil:{amplitude:1.1,frequencyHz:22},commit:true,tracking:{angularSpeedDegPerSec:120},attack:{kind:'beam',atMs:Array.from({length:10},(_,i)=>i*80),length:620,width:30,openMs:65,fadeMs:110,damageBudget:1.65,hitText:{fractionDigits:1,sizePx:17,lifetimeMs:430,risePxPerMs:.26}},sound:'laserSustain',soundScope:'phase',shake:'hit',shakeIntervalMs:80},
        {id:'recoil',durationMs:130,move:'recoil',distance:6,sound:'laserFade',soundScope:'phase'},
        {id:'afterglow',durationMs:240,move:'return',easing:'smooth',fade:true,sound:'ultimateReturn'}
      ]},
    storm:{trigger:{comboHits:3,rechargeHits:10},symbol:'✻',color:[.62,1,.52],cost:3,requires:['autoChain','spore'],lane:4,rowOffset:2,range:430,trailLifetimeMs:450,targetLossPolicy:'finishCommitted',
      sequence:[{id:'move',durationMs:240,move:'side',distance:64,easing:'smooth',sound:'ultimateMove'},
        {id:'condense',durationMs:280,move:'hold',charge:true,chargeStyle:'swirl',compression:.18,sound:'ultimateCharge'},
        {id:'release',durationMs:880,timeScale:.9,move:'orbit',commit:true,distance:48,visual:'vortex',trailWidth:15,attack:{kind:'spores',atMs:[0,110,220,330,440,550,660,770],count:3,power:.24,speed:410,lifeMs:750},sound:'ultimateSpore',soundScope:'phase'},
        {id:'afterglow',durationMs:260,move:'return',visual:'vortex',fade:true,sound:'ultimateReturn'}
      ]},
    chainDrive:{symbol:'⇢',color:[1,.78,.38],cost:3,requires:['autoChain','propulsion'],lane:2,rowOffset:1,range:480,trailLifetimeMs:450,targetLossPolicy:'finishCommitted',
      sequence:[{id:'move',durationMs:220,move:'recoil',distance:60,easing:'outCubic',sound:'ultimateMove'},
        {id:'condense',durationMs:220,move:'hold',charge:true,chargeStyle:'compression',compression:.34,sound:'ultimateCharge'},
        ...Array.from({length:3},()=>[{id:'release',durationMs:90,move:'target',commit:true,trailWidth:18,contact:{kind:'dash',power:1.15},hitstopMs:45,impactShake:'hit',impactSound:'ultimateStrike',impactSize:1.9,sound:'ultimateMove'},{id:'impact',durationMs:75,timeScale:.8,move:'hold'}]).flat(),
        {id:'afterglow',durationMs:420,move:'return',easing:'smooth',fade:true,sound:'ultimateReturn'}
      ]},
    elasticBlast:{symbol:'◈',color:[.80,.66,1],cost:2,requires:['propulsion','shockPush'],lane:3,range:310,targetLossPolicy:'finishCommitted',
      sequence:[{id:'move',durationMs:260,move:'approach',distance:70,standOff:95,easing:'smoother',sound:'ultimateMove'},
        {id:'condense',durationMs:400,timeScale:.9,move:'hold',charge:true,chargeStyle:'compression',compression:.54,sound:'ultimateCharge'},
        {id:'release',durationMs:420,timeScale:.85,move:'hold',commit:true,expansion:{amplitude:.34,durationMs:120},contact:{kind:'wave',radius:260,power:1.4,push:450},hitstopMs:65,impactSize:1.4,impactShake:'hit',sound:'ultimateWave',shake:'hit'},
        {id:'afterglow',durationMs:320,move:'return',easing:'smoother',fade:true,sound:'ultimateReturn'}
      ]}
  }
};
const bounded=(value,min,max)=>Math.max(min,Math.min(max,value));
const position=p=>({x:p.x,y:p.y});
const easing={smooth:q=>q*q*(3-2*q),smoother:q=>q*q*q*(q*(q*6-15)+10),outCubic:q=>1-(1-q)**3};
export function turnToward(direction,aim,radiansPerSecond,dtMs){
  if(!(Math.hypot(aim.x,aim.y)>0))return direction;
  const delta=Math.atan2(direction.x*aim.y-direction.y*aim.x,direction.x*aim.x+direction.y*aim.y);
  const angle=Math.atan2(direction.y,direction.x)+bounded(delta,-radiansPerSecond*dtMs/1000,radiansPerSecond*dtMs/1000);
  return {x:Math.cos(angle),y:Math.sin(angle)};
}
export class UltimateLoadout {
  constructor(config,saved={}){this.config=config;this.slots=Array.from({length:config.slots.max},(_,i)=>typeof saved?.slots?.[i]==='string'?saved.slots[i]:null);this.capacity=config.slots.base;this.remaining=new Map();this.cursor=0;this.lastHit=-1;this.unlocked=new Set();}
  requirements(id){return {...this.config.trigger,...this.config.skills[id]?.trigger};}
  configure(unlocked){this.unlocked=unlocked;this.capacity=this.config.slots.base+this.config.slots.unlockNodes.filter(id=>unlocked.has(id)).length;const seen=new Set();
    this.slots=this.slots.map((id,i)=>{if(i>=this.capacity||!this.config.skills[id]||!unlocked.has(id)||seen.has(id))return null;seen.add(id);return id;});this.cursor%=this.capacity;}
  equip(id,index){if(index<0||index>=this.capacity||!this.unlocked.has(id)||!this.config.skills[id])return false;const old=this.slots.indexOf(id);if(old>=0)this.slots[old]=null;this.slots[index]=id;return true;}
  unequip(index){if(index<0||index>=this.capacity)return false;this.slots[index]=null;return true;}
  swap(a,b){if(a<0||b<0||a>=this.capacity||b>=this.capacity)return false;[this.slots[a],this.slots[b]]=[this.slots[b],this.slots[a]];return true;}
  next(){for(let offset=0;offset<this.capacity;offset++){const index=(this.cursor+offset)%this.capacity,id=this.slots[index];if(id&&!(this.remaining.get(id)>0))return {id,index};}return null;}
  recordHit(serial){if(serial===this.lastHit)return false;this.lastHit=serial;for(const id of this.slots)if(id&&this.remaining.get(id)>0)this.remaining.set(id,this.remaining.get(id)-1);return true;}
  use(id,index){this.remaining.set(id,this.requirements(id).rechargeHits);this.cursor=(index+1)%this.capacity;}
  reset(){this.remaining.clear();this.cursor=0;this.lastHit=-1;}
  save(){return {slots:[...this.slots]};}
  snapshot(){const next=this.next();return {slots:this.slots.map((id,index)=>({id,index,locked:index>=this.capacity,remainingHits:this.remaining.get(id)||0,requiredHits:id?this.requirements(id).rechargeHits:0,next:next?.index===index})),capacity:this.capacity,cursor:this.cursor,next:next?.id??null};}
}
export class UltimateRunner {
  constructor(loadout,adapter){this.loadout=loadout;this.adapter=adapter;this.state=null;this.effects=[];this.starts=0;this.normalHits=0;this.damage=0;this.lastEnd=null;}
  get active(){return this.state!==null;}
  get timeScale(){return this.state?.phase.timeScale??1;}
  tryStart(combo,ammo){if(this.active||!this.adapter.valid())return false;const next=this.loadout.next();if(!next)return false;
    const skill=this.loadout.config.skills[next.id],cost=this.loadout.requirements(next.id),targets=this.adapter.targets(skill.range);if(combo<cost.comboHits||ammo<cost.ammo||!targets.length)return false;
    // No state/VFX begins until the game atomically accepts both costs.
    if(!this.adapter.consume(cost))return false;
    const p=position(this.adapter.position()),nearest=targets[0].body.position,dx=nearest.x-p.x,dy=nearest.y-p.y,d=Math.hypot(dx,dy)||1;
    this.loadout.use(next.id,next.index);this.starts++;this.state={id:next.id,slot:next.index,skill,origin:p,returnPath:[p],endReason:null,aim:{x:nearest.x,y:nearest.y},direction:{x:dx/d,y:dy/d},index:0,elapsedMs:0,totalMs:0,pulse:0,committed:false,voice:null,beam:null,hitIds:new Set(),trails:[],trailClockMs:0,pending:[]};
    this.adapter.begin(skill);this.enterStage();return true;
  }
  enterStage(){const s=this.state;if(!s)return;s.voice?.stop();s.voice=null;s.beam=null;const phase=s.skill.sequence[s.index];s.phase=phase;s.committed||=!!phase.commit;s.nextShakeMs=phase.shakeIntervalMs??Infinity;s.impactShown=false;s.trailWidth=phase.trailWidth??s.trailWidth??11;s.elapsedMs=0;s.pulse=0;s.from=position(this.adapter.position());s.target=null;
    if(phase.aim==='nearest'){const target=this.adapter.targets(s.skill.range)[0];if(target){const dx=target.body.position.x-s.from.x,dy=target.body.position.y-s.from.y,length=Math.hypot(dx,dy)||1;s.direction={x:dx/length,y:dy/length};}}
    const {x,y}=s.from,d=s.direction,q=phase.distance||0;
    const goals={approach:()=>{const reach=Math.min(q,Math.max(0,Math.hypot(s.aim.x-x,s.aim.y-y)-(phase.standOff||0)));return {x:x+d.x*reach,y:y+d.y*reach};},side:()=>({x:x-d.y*q,y:y+d.x*q}),recoil:()=>({x:x-d.x*q,y:y-d.y*q}),return:()=>s.origin,
      target:()=>{const target=this.adapter.targets(s.skill.range).find(unit=>!s.hitIds.has(unit.unitId));s.target=target?.unitId??null;return target?.body.position||s.from;}};
    s.goal=this.adapter.safePoint(goals[phase.move]?.()||s.from,s.from);
    // Keep the opening readable even at point-blank range or beside a wall.
    // Fixed candidate order, same swept collision check, no teleport or extra RNG.
    const inRange=point=>Math.hypot(point.x-s.aim.x,point.y-s.aim.y)<=s.skill.range;
    if(phase.id==='move'&&(!inRange(s.goal)||Math.hypot(s.goal.x-x,s.goal.y-y)<12)){
      s.goal=s.from;
      const reach=Math.abs(q);
      for(const scale of [1,.5]){
        for(const direction of [{x:-d.y,y:d.x},{x:d.y,y:-d.x},{x:-d.x,y:-d.y},d]){
          const candidate=this.adapter.safePoint({x:x+direction.x*reach*scale,y:y+direction.y*reach*scale},s.from);
          if(inRange(candidate)&&Math.hypot(candidate.x-x,candidate.y-y)>=12){s.goal=candidate;break;}
        }
        if(Math.hypot(s.goal.x-x,s.goal.y-y)>=12)break;
      }
    }
    // Retrace actual phase endpoints, so multi-target dashes do not return through an obstacle.
    if(phase.move==='return'){
      s.returnPoints=[s.from,...s.returnPath.slice().reverse()];s.returnLengths=[];s.returnDistance=0;
      for(let i=1;i<s.returnPoints.length;i++){const a=s.returnPoints[i-1],b=s.returnPoints[i],length=Math.hypot(b.x-a.x,b.y-a.y);s.returnLengths.push(length);s.returnDistance+=length;}
    }else if(phase.move!=='hold')s.returnPath.push(s.from);
    if(phase.sound){const voice=this.adapter.sound(phase.sound);if(phase.soundScope==='phase')s.voice=voice;}if(phase.shake)this.adapter.shake(phase.shake,d);
  }
  update(dtMs){for(let i=this.effects.length-1;i>=0;i--){const fx=this.effects[i];fx.leftMs-=dtMs;if(fx.leftMs<=0)this.effects.splice(i,1);}
    const s=this.state;if(!s)return;if(!this.adapter.valid()){this.cancel('invalid');return;}
    const finishesCommitted=s.committed&&s.skill.targetLossPolicy==='finishCommitted';
    if(s.phase.move!=='return'&&!finishesCommitted&&!this.adapter.targets(s.skill.range).length){
      s.endReason='targetLost';s.pending.length=0;s.index=s.skill.sequence.findIndex(phase=>phase.move==='return');this.enterStage();
    }
    s.elapsedMs=Math.min(s.phase.durationMs,s.elapsedMs+dtMs);s.totalMs+=dtMs;const q=this.progress(),ease=(easing[s.phase.easing]||easing.smooth)(q);
    if(s.phase.move==='target'&&s.target!=null){const unit=this.adapter.target(s.target);if(unit?.alive)s.goal=this.adapter.safePoint(unit.body.position,s.from);}
    let goal={x:s.from.x+(s.goal.x-s.from.x)*ease,y:s.from.y+(s.goal.y-s.from.y)*ease};
    if(s.phase.move==='return'){
      let remaining=s.returnDistance*ease;goal=position(s.origin);
      for(let i=0;i<s.returnLengths.length;i++){const length=s.returnLengths[i];if(remaining<=length){const a=s.returnPoints[i],b=s.returnPoints[i+1],t=length?remaining/length:1;goal={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};break;}remaining-=length;}
    }
    if(s.phase.move==='orbit'){const a=q*Math.PI*2,fade=Math.sin(Math.PI*q);goal={x:s.from.x+Math.cos(a)*(s.phase.distance||0)*fade,y:s.from.y+Math.sin(a)*(s.phase.distance||0)*fade};}
    if(s.phase.recoil){const recoil=s.phase.recoil.amplitude*Math.sin(s.elapsedMs*.001*s.phase.recoil.frequencyHz*Math.PI*2)*Math.sin(q*Math.PI);goal.x-=s.direction.x*recoil;goal.y-=s.direction.y*recoil;}
    // Physics can push the caster after phase entry; validate from the actual body every tick.
    this.adapter.move(this.adapter.safePoint(goal,this.adapter.position()),dtMs);
    if(s.phase.shake)while(s.elapsedMs>=s.nextShakeMs){this.adapter.shake(s.phase.shake,s.direction);s.nextShakeMs+=s.phase.shakeIntervalMs;}
    const attack=s.phase.attack;if(attack)while(s.pulse<attack.atMs.length&&attack.atMs[s.pulse]<=s.elapsedMs){s.pending.push({attack,pulse:s.pulse});s.pulse++;}
  }
  afterPhysics(dtMs){const s=this.state;if(!s)return;
    if(s.phase.tracking){const targets=this.adapter.targets(s.skill.range),target=targets.find(unit=>unit.unitId===s.trackingTargetId)||targets[0];
      s.trackingTargetId=target?.unitId??null;if(target){const p=this.adapter.position();s.direction=turnToward(s.direction,{x:target.body.position.x-p.x,y:target.body.position.y-p.y},s.phase.tracking.angularSpeedDegPerSec*Math.PI/180,dtMs);}}
    this.adapter.pose?.(s);
    for(const emission of s.pending){if(!this.active)break;this.adapter.attack(emission.attack,s,emission.pulse);}s.pending.length=0;
    if(this.active&&s.phase.contact)this.adapter.contact(s.phase.contact,s,this.progress());
    if(!this.active)return;
    s.trailClockMs+=dtMs;if(s.trailClockMs>=this.loadout.config.presentation.trailIntervalMs){s.trailClockMs=0;s.trails.push({...position(this.adapter.position()),atMs:s.totalMs});if(s.trails.length>this.loadout.config.presentation.maxTrails)s.trails.shift();}
    if(s.elapsedMs>=s.phase.durationMs){s.index++;if(s.index>=s.skill.sequence.length)this.cancel(s.endReason||'complete');else this.enterStage();}
  }
  effect(effect){const config=this.loadout.config.presentation;if(this.effects.length>=config.maxEffects)this.effects.shift();this.effects.push({...effect,leftMs:effect.lifeMs});}
  impact(){const s=this.state;if(!s||s.impactShown)return;s.impactShown=true;const phase=s.phase;
    if(phase.hitstopMs)this.adapter.hitstop(phase.hitstopMs);if(phase.impactShake)this.adapter.shake(phase.impactShake,s.direction);if(phase.impactSound)this.adapter.sound(phase.impactSound);}
  progress(){return this.state?bounded(this.state.elapsedMs/this.state.phase.durationMs,0,1):0;}
  cancel(reason='cancel'){if(!this.state)return;const id=this.state.id;this.state.voice?.stop();this.state=null;this.lastEnd={id,reason};this.adapter.end(reason);}
  reset(){this.cancel('reset');this.effects.length=0;this.loadout.reset();this.starts=0;this.normalHits=0;this.damage=0;this.lastEnd=null;}
  snapshot(){const s=this.state;return {active:this.active,id:s?.id??null,phase:s?.phase.id??null,movement:s?.phase.move??null,origin:s?position(s.origin):null,goal:s?position(s.goal):null,progress:this.progress(),timeScale:this.timeScale,committed:s?.committed??false,direction:s?{...s.direction}:null,trackingTargetId:s?.trackingTargetId??null,pulses:s?.pulse??0,beam:s?.beam?{...s.beam}:null,starts:this.starts,normalHits:this.normalHits,damage:this.damage,lastEnd:this.lastEnd,...this.loadout.snapshot()};}
}
function ring(r,x,y,radius,width,color,segments=28,rotation=0){for(let i=0;i<segments;i++){const a=rotation+i*Math.PI*2/segments,b=rotation+(i+.82)*Math.PI*2/segments;r.line(x+Math.cos(a)*radius,y+Math.sin(a)*radius,x+Math.cos(b)*radius,y+Math.sin(b)*radius,width,color);}}

export function beamWidth(attack,elapsedMs,durationMs){const opening=bounded(elapsedMs/attack.openMs,0,1),fade=bounded((durationMs-elapsedMs)/attack.fadeMs,0,1);return attack.width*(1-Math.pow(1-opening,3))*fade;}
export function beamIntersects(beam,body){
  const a=beam.from,b=beam.to,p=body.position,m=body.plugin.volume?.motion||body.positionPrev||p;
  const distance=(point,start,end)=>{const x=end.x-start.x,y=end.y-start.y,length=x*x+y*y,t=length?bounded(((point.x-start.x)*x+(point.y-start.y)*y)/length,0,1):0;return (point.x-start.x-x*t)**2+(point.y-start.y-y*t)**2;};
  const cross=(a,b,p)=>(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x),radius=beam.width/2+body.circleRadius;
  if(Math.min(distance(p,a,b),distance(m,a,b),distance(a,m,p),distance(b,m,p))<=radius*radius)return true;
  return cross(a,b,m)*cross(a,b,p)<0&&cross(m,p,a)*cross(m,p,b)<0;
}
function drawBeamCharge(r,p,s,color,q){
  const pulse=(Math.sin(s.elapsedMs*.001*Math.PI*14)+1)*.5,core=9+q*15+pulse*3,outer=82-q*46;
  r.ellipse(p.x,p.y,core*2.3,core*2.3,[...color,.08+q*.12],28);ring(r,p.x,p.y,outer,2.2,[...color,.35+q*.4],32,-s.totalMs*.007);ring(r,p.x,p.y,outer*.78,1.1,[.8,1,1,.55],28,s.totalMs*.012);
  for(let i=0;i<18;i++){const a=i*Math.PI/9+s.totalMs*.004,far=outer+14+Math.sin(a*3+s.elapsedMs*.02)*9,near=core+4;
    r.line(p.x+Math.cos(a)*far,p.y+Math.sin(a)*far,p.x+Math.cos(a)*near,p.y+Math.sin(a)*near,1.6+q*1.5,[...color,.35+q*.4]);}
  r.ellipse(p.x,p.y,core*1.55,core*1.55,[...color,.27+q*.2],28);r.ellipse(p.x,p.y,core,core,[.8,.97,1,.75],24);r.ellipse(p.x,p.y,core*.55,core*.55,[1,1,1,.92],20);
  const d=s.direction;r.line(p.x+d.x*core,p.y+d.y*core,p.x+d.x*(core+12+q*14),p.y+d.y*(core+12+q*14),2.2,[...color,.4+q*.45]);
}
function drawBeam(r,beam,color,timeMs){const {from:a,to:b,width:w}=beam;if(w<=0)return;
  r.line(a.x,a.y,b.x,b.y,w*3,[...color,.10]);r.line(a.x,a.y,b.x,b.y,w*2.1,[...color,.19]);r.line(a.x,a.y,b.x,b.y,w*1.45,[...color,.5]);
  // Full-width opaque core, with a smaller highlight inside it. The halo never widens the hit volume.
  r.line(a.x,a.y,b.x,b.y,w,[.78,.96,1,.95]);r.line(a.x,a.y,b.x,b.y,w*.42,[1,1,1,.99]);
  r.ellipse(a.x,a.y,w*.92,w*.92,[...color,.43],24);r.ellipse(a.x,a.y,w*.5,w*.5,[.92,1,1,.98],20);r.ellipse(b.x,b.y,w*.5,w*.5,[.78,.96,1,.95],20);
  const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy)||1,x=dx/length,y=dy/length,phase=timeMs*.65%90;
  for(let i=0;i<8;i++){const offset=Math.min(length,phase+i*90),end=Math.min(length,offset+32),side=(i%2?1:-1)*w*.27;r.line(a.x+x*offset-y*side,a.y+y*offset+x*side,a.x+x*end-y*side,a.y+y*end+x*side,1.8,[1,1,1,.9]);}
}


function drawCompression(r,p,s,color,q){const compression=Math.sin(q*Math.PI/2),radius=64-38*compression;
  ring(r,p.x,p.y,radius,3,[...color,.5+q*.35],28,s.totalMs*.004);ring(r,p.x,p.y,radius+12,1.6,[...color,.4],24,-s.totalMs*.007);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;r.line(p.x+Math.cos(a)*(radius+16),p.y+Math.sin(a)*(radius+16),p.x+Math.cos(a)*radius,p.y+Math.sin(a)*radius,3,[...color,.6]);}
  r.ellipse(p.x,p.y,18+q*11,18+q*11,[...color,.10+q*.12],24);r.ellipse(p.x,p.y,7+q*5,7+q*5,[1,.96,1,q*.6],20);
}
function drawVortex(r,p,s,color,q){const rotation=s.totalMs*.009,alpha=s.phase.fade?1-s.elapsedMs/s.phase.durationMs:1;
  for(let arm=0;arm<3;arm++)for(let i=0;i<20;i++){const t=i/20,u=(i+1)/20,angle=rotation+arm*Math.PI*2/3,a=angle+t*Math.PI*1.8,b=angle+u*Math.PI*1.8,reach=56+q*22,ra=18+t*reach,rb=18+u*reach,weight=(1-i/25)*alpha;
    const ax=p.x+Math.cos(a)*ra,ay=p.y+Math.sin(a)*ra,bx=p.x+Math.cos(b)*rb,by=p.y+Math.sin(b)*rb;
    r.line(ax,ay,bx,by,8,[...color,weight*.12]);r.line(ax,ay,bx,by,2.6,[...color,weight*.6]);}
  ring(r,p.x,p.y,30+q*14,2.3,[.85,1,.72,alpha*.65],24,-rotation);
}
function drawWave(r,wave,color,alpha){const {origin:p,radius,progress:q}=wave,fade=(1-q*.55)*alpha;
  r.ellipse(p.x,p.y,radius,radius,[...color,.045*alpha],40);ring(r,p.x,p.y,radius,24*(1-q)+7,[...color,.15*alpha],48);
  ring(r,p.x,p.y,radius,7,[...color,fade*.92],48);ring(r,p.x,p.y,radius*.82,2.7,[.99,.91,1,fade*.68],40);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;r.line(p.x+Math.cos(a)*radius*.91,p.y+Math.sin(a)*radius*.91,p.x+Math.cos(a)*radius,p.y+Math.sin(a)*radius,3,[...color,fade*.7]);}
}

function drawElementCharge(r,p,s,color,q){const point=s.aim,attack=s.skill.sequence.find(stage=>stage.attack)?.attack;
  drawCompression(r,p,s,color,q);if(s.phase.chargeStyle==='lightning'){for(let i=0;i<6;i++){const a=i*Math.PI/3+s.totalMs*.004,rad=25+q*8;r.line(p.x+Math.cos(a)*rad,p.y+Math.sin(a)*rad,p.x+Math.cos(a+.35)*(rad+14),p.y+Math.sin(a+.35)*(rad+14),2,[...color,.7]);}return;}
  if(point&&attack?.radius){ring(r,point.x,point.y,attack.radius,1.5,[...color,.22+q*.45],32);const radius=15+q*13;r.ellipse(point.x,point.y,radius,radius,[...color,.12+q*.15],20);
    for(let i=0;i<6;i++){const a=i*Math.PI/3;r.line(point.x+Math.cos(a)*radius,point.y+Math.sin(a)*radius,point.x+Math.cos(a)*(radius+9),point.y+Math.sin(a)*(radius+9),2,[...color,.55+q*.4]);}}
}

export function drawUltimate(r,runner,p){const s=runner.state;
  if(s){const color=s.skill.color,q=runner.progress(),fade=s.phase.fade?1-q:1;
    for(let i=1;i<s.trails.length;i++){const a=s.trails[i-1],b=s.trails[i],alpha=Math.max(0,1-(s.totalMs-b.atMs)/(s.skill.trailLifetimeMs??runner.loadout.config.presentation.trailLifetimeMs))*.55*fade;r.line(a.x,a.y,b.x,b.y,s.trailWidth*1.8,[...color,alpha*.12]);r.line(a.x,a.y,b.x,b.y,s.trailWidth,[...color,alpha*.38]);r.line(a.x,a.y,b.x,b.y,s.trailWidth*.38,[.94,1,.93,alpha]);}
    const charge=s.phase.charge?Math.sin(q*Math.PI/2):.35;
    r.ellipse(p.x,p.y,25+charge*17,25+charge*17,[...color,.12*fade],24);ring(r,p.x,p.y,23+charge*9,1.5,[...color,.7*fade],28,s.totalMs*.008);
    if(['frost','lightning','fire','acid'].includes(s.phase.chargeStyle))drawElementCharge(r,p,s,color,q);
    else if(s.phase.chargeStyle==='beam')drawBeamCharge(r,p,s,color,q);
    else if(s.phase.chargeStyle==='compression')drawCompression(r,p,s,color,q);
    else if(s.phase.chargeStyle==='swirl')drawVortex(r,p,s,color,q);
    else if(s.phase.charge){for(let i=0;i<12;i++){const a=i*Math.PI/6+s.totalMs*.005,outer=64-q*34,inner=18;r.line(p.x+Math.cos(a)*outer,p.y+Math.sin(a)*outer,p.x+Math.cos(a)*inner,p.y+Math.sin(a)*inner,1+q,[...color,.2+q*.45]);}
      for(let i=0;i<4;i++){const a=i*Math.PI/2-s.totalMs*.004,rad=31-12*q;r.ellipse(p.x+Math.cos(a)*rad,p.y+Math.sin(a)*rad,2.5+q*1.5,2.5+q*1.5,[.92,1,1,.85],10);}
      r.ellipse(p.x,p.y,7+q*7,7+q*7,[.96,1,1,.25+q*.4],18);
    }
    if(s.beam)drawBeam(r,s.beam,color,s.elapsedMs);
    if(s.phase.visual==='vortex')drawVortex(r,p,s,color,s.phase.fade?1-q:q);
    if(s.wave)drawWave(r,s.wave,color,s.phase.fade?1-q:1);
  }
  for(const fx of runner.effects){const a=fx.leftMs/fx.lifeMs,c=fx.color;
    if(fx.kind==='impact'){const strength=fx.strength??1,rad=8+(1-a)*38*strength;ring(r,fx.x1,fx.y1,rad,2.4*strength,[...c,a],24);if(strength>1){r.ellipse(fx.x1,fx.y1,rad*.85,rad*.85,[...c,a*.13],24);ring(r,fx.x1,fx.y1,rad*.65,1.5,[1,.96,.8,a*.6],20);}}
  }
}
