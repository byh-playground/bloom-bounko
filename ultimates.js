// HAS-A loadout and one bounded sequence runner; attacks/movement are supplied by the game.
export const ultimateConfig={
  slots:{base:1,max:3,unlockNodes:['ultimateSlot2','ultimateSlot3']},
  trigger:{comboHits:5,ammo:1,rechargeHits:15},
  presentation:{trailIntervalMs:24,trailLifetimeMs:300,maxTrails:24,maxEffects:36},
  skills:{
    laserBloom:{symbol:'✦',color:[.35,.86,1],cost:5,requires:['autoChain','shadowRecharge2'],lane:1,range:520,
      sequence:[
        {id:'move',durationMs:160,move:'side',distance:78,sound:'ultimateMove'},
        {id:'condense',durationMs:280,move:'hold',charge:true,sound:'ultimateCharge'},
        {id:'release',durationMs:260,move:'hold',attack:{kind:'beams',atMs:[0,90,180],targets:6,width:7,power:.55},sound:'ultimateBeam',shake:'hit'},
        {id:'recoil',durationMs:130,move:'recoil',distance:24},
        {id:'afterglow',durationMs:170,move:'return',fade:true,sound:'ultimateReturn'}
      ]},
    storm:{symbol:'✻',color:[.62,1,.52],cost:3,requires:['autoChain','spore'],lane:4,rowOffset:2,range:430,
      sequence:[
        {id:'condense',durationMs:180,move:'hold',charge:true,sound:'ultimateCharge'},
        {id:'release',durationMs:560,move:'orbit',distance:38,attack:{kind:'spores',atMs:[0,70,140,210,280,350,420,490],count:3,power:.24,speed:410,lifeMs:750},sound:'ultimateSpore'},
        {id:'afterglow',durationMs:180,move:'return',fade:true,sound:'ultimateReturn'}
      ]},
    chainDrive:{symbol:'⇢',color:[1,.78,.38],cost:3,requires:['autoChain','propulsion'],lane:2,rowOffset:1,range:480,
      sequence:[
        {id:'condense',durationMs:110,move:'hold',charge:true,sound:'ultimateCharge'},
        ...Array.from({length:3},()=>({id:'release',durationMs:150,move:'target',contact:{kind:'dash',power:1.15},sound:'ultimateMove'})),
        {id:'afterglow',durationMs:160,move:'hold',fade:true,sound:'ultimateReturn'}
      ]},
    elasticBlast:{symbol:'◈',color:[.80,.66,1],cost:2,requires:['propulsion','shockPush'],lane:3,range:310,
      sequence:[
        {id:'condense',durationMs:260,move:'hold',charge:true,sound:'ultimateCharge'},
        {id:'release',durationMs:300,move:'hold',contact:{kind:'wave',radius:260,power:1.4,push:450},sound:'ultimateWave',shake:'hit'},
        {id:'afterglow',durationMs:160,move:'recoil',distance:18,fade:true,sound:'ultimateReturn'}
      ]}
  }
};
const bounded=(value,min,max)=>Math.max(min,Math.min(max,value));
const position=p=>({x:p.x,y:p.y});
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
  tryStart(combo,ammo){if(this.active||!this.adapter.valid())return false;const next=this.loadout.next();if(!next)return false;
    const skill=this.loadout.config.skills[next.id],cost=this.loadout.requirements(next.id),targets=this.adapter.targets(skill.range);if(combo<cost.comboHits||ammo<cost.ammo||!targets.length)return false;
    // No state/VFX begins until the game atomically accepts both costs.
    if(!this.adapter.consume(cost))return false;
    const p=position(this.adapter.position()),nearest=targets[0].body.position,dx=nearest.x-p.x,dy=nearest.y-p.y,d=Math.hypot(dx,dy)||1;
    this.loadout.use(next.id,next.index);this.starts++;this.state={id:next.id,slot:next.index,skill,origin:p,direction:{x:dx/d,y:dy/d},index:0,elapsedMs:0,totalMs:0,pulse:0,hitIds:new Set(),trails:[],trailClockMs:0,pending:[]};
    this.adapter.begin(skill);this.enterStage();return true;
  }
  enterStage(){const s=this.state;if(!s)return;const phase=s.skill.sequence[s.index];s.phase=phase;s.elapsedMs=0;s.pulse=0;s.from=position(this.adapter.position());s.target=null;
    const {x,y}=s.from,d=s.direction,q=phase.distance||0;
    const goals={side:()=>({x:x-d.y*q,y:y+d.x*q}),recoil:()=>({x:x-d.x*q,y:y-d.y*q}),return:()=>s.origin,
      target:()=>{const target=this.adapter.targets(s.skill.range).find(unit=>!s.hitIds.has(unit.unitId));s.target=target?.unitId??null;return target?.body.position||s.from;}};
    s.goal=this.adapter.safePoint(goals[phase.move]?.()||s.from,s.from);if(phase.sound)this.adapter.sound(phase.sound);if(phase.shake)this.adapter.shake(phase.shake,d);
  }
  update(dtMs){for(let i=this.effects.length-1;i>=0;i--){const fx=this.effects[i];fx.leftMs-=dtMs;if(fx.leftMs<=0)this.effects.splice(i,1);}
    const s=this.state;if(!s)return;if(!this.adapter.valid()||!this.adapter.targets(s.skill.range).length){this.cancel('targetLost');return;}
    s.elapsedMs=Math.min(s.phase.durationMs,s.elapsedMs+dtMs);s.totalMs+=dtMs;const q=this.progress(),ease=q*q*(3-2*q);
    if(s.phase.move==='target'&&s.target!=null){const unit=this.adapter.target(s.target);if(unit?.alive)s.goal=this.adapter.safePoint(unit.body.position,s.from);}
    let goal={x:s.from.x+(s.goal.x-s.from.x)*ease,y:s.from.y+(s.goal.y-s.from.y)*ease};
    if(s.phase.move==='orbit'){const a=q*Math.PI*2,fade=Math.sin(Math.PI*q);goal={x:s.origin.x+Math.cos(a)*(s.phase.distance||0)*fade,y:s.origin.y+Math.sin(a)*(s.phase.distance||0)*fade};goal=this.adapter.safePoint(goal,this.adapter.position());}
    this.adapter.move(goal,dtMs);
    const attack=s.phase.attack;if(attack)while(s.pulse<attack.atMs.length&&attack.atMs[s.pulse]<=s.elapsedMs){s.pending.push({attack,pulse:s.pulse});s.pulse++;}
  }
  afterPhysics(dtMs){const s=this.state;if(!s)return;
    for(const emission of s.pending){if(!this.active)break;this.adapter.attack(emission.attack,s,emission.pulse);}s.pending.length=0;
    if(this.active&&s.phase.contact)this.adapter.contact(s.phase.contact,s,this.progress());
    if(!this.active)return;
    s.trailClockMs+=dtMs;if(s.trailClockMs>=this.loadout.config.presentation.trailIntervalMs){s.trailClockMs=0;s.trails.push({...position(this.adapter.position()),atMs:s.totalMs});if(s.trails.length>this.loadout.config.presentation.maxTrails)s.trails.shift();}
    if(s.elapsedMs>=s.phase.durationMs){s.index++;if(s.index>=s.skill.sequence.length)this.cancel('complete');else this.enterStage();}
  }
  effect(effect){const config=this.loadout.config.presentation;if(this.effects.length>=config.maxEffects)this.effects.shift();this.effects.push({...effect,leftMs:effect.lifeMs});}
  progress(){return this.state?bounded(this.state.elapsedMs/this.state.phase.durationMs,0,1):0;}
  cancel(reason='cancel'){if(!this.state)return;const id=this.state.id;this.state=null;this.lastEnd={id,reason};this.adapter.end(reason);}
  reset(){this.cancel('reset');this.effects.length=0;this.loadout.reset();this.starts=0;this.normalHits=0;this.damage=0;this.lastEnd=null;}
  snapshot(){const s=this.state;return {active:this.active,id:s?.id??null,phase:s?.phase.id??null,progress:this.progress(),starts:this.starts,normalHits:this.normalHits,damage:this.damage,lastEnd:this.lastEnd,...this.loadout.snapshot()};}
}
function ring(r,x,y,radius,width,color,segments=28,rotation=0){for(let i=0;i<segments;i++){const a=rotation+i*Math.PI*2/segments,b=rotation+(i+.82)*Math.PI*2/segments;r.line(x+Math.cos(a)*radius,y+Math.sin(a)*radius,x+Math.cos(b)*radius,y+Math.sin(b)*radius,width,color);}}
export function drawUltimate(r,runner,p){const s=runner.state;
  if(s){const color=s.skill.color,q=runner.progress(),fade=s.phase.fade?1-q:1;
    for(let i=1;i<s.trails.length;i++){const a=s.trails[i-1],b=s.trails[i],alpha=Math.max(0,1-(s.totalMs-b.atMs)/runner.loadout.config.presentation.trailLifetimeMs)*.55*fade;r.line(a.x,a.y,b.x,b.y,11,[...color,alpha*.25]);r.line(a.x,a.y,b.x,b.y,3,[...color,alpha]);}
    const charge=s.phase.charge?Math.sin(q*Math.PI/2):.35;
    r.ellipse(p.x,p.y,25+charge*17,25+charge*17,[...color,.12*fade],24);ring(r,p.x,p.y,23+charge*9,1.5,[...color,.7*fade],28,s.totalMs*.008);
    if(s.phase.charge){for(let i=0;i<12;i++){const a=i*Math.PI/6+s.totalMs*.005,outer=64-q*34,inner=18;r.line(p.x+Math.cos(a)*outer,p.y+Math.sin(a)*outer,p.x+Math.cos(a)*inner,p.y+Math.sin(a)*inner,1+q,[...color,.2+q*.45]);}
      for(let i=0;i<4;i++){const a=i*Math.PI/2-s.totalMs*.004,rad=31-12*q;r.ellipse(p.x+Math.cos(a)*rad,p.y+Math.sin(a)*rad,2.5+q*1.5,2.5+q*1.5,[.92,1,1,.85],10);}
      r.ellipse(p.x,p.y,7+q*7,7+q*7,[.96,1,1,.25+q*.4],18);
    }
    if(s.phase.contact?.kind==='wave'){const radius=s.phase.contact.radius*Math.sin(q*Math.PI/2);ring(r,p.x,p.y,radius,12*(1-q)+2,[...color,.15],40);ring(r,p.x,p.y,radius,3.7,[...color,.85*(1-q)],40);ring(r,p.x,p.y,radius*.78,1.5,[.97,.92,1,.4*(1-q)],32);}
  }
  for(const fx of runner.effects){const a=fx.leftMs/fx.lifeMs,c=fx.color;
    if(fx.kind==='beam'){r.line(fx.x1,fx.y1,fx.x2,fx.y2,fx.width*3.5,[...c,a*.12]);r.line(fx.x1,fx.y1,fx.x2,fx.y2,fx.width*1.5,[...c,a*.75]);r.line(fx.x1,fx.y1,fx.x2,fx.y2,Math.max(1,fx.width*.35),[.95,1,1,a]);r.ellipse(fx.x2,fx.y2,10*a,10*a,[1,1,1,a*.75],16);ring(r,fx.x2,fx.y2,8+(1-a)*28,1.5,[...c,a*.8],18);}
    if(fx.kind==='impact')ring(r,fx.x1,fx.y1,8+(1-a)*38,2,[...c,a],24);
  }
}
