import {t as tr} from './i18n.js';
import {species} from './enemies.js';
import {companionIdlePoint} from './controllers.js';
// Permanent companion ownership is separate from bounded in-run actors.
// Initial combat recommendations are config-owned; revival is the confirmed 3000ms rule.
export const petConfig = {
  slots:{base:1,maxLevel:4,perLevel:1},
  eggs:{rewardCount:1,hatchKills:30,normalDropRate:.05,bossDropRate:.10},
  fusion:{required:5,odds:[.64,.32,.16,.08,.04],failureLoss:[1,2,3,4],autoReserve:1},
  grades:[
    {get name(){return tr('rarity.common');},color:'#d8d4bd'}, {get name(){return tr('rarity.uncommon');},color:'#83ce76'},
    {get name(){return tr('rarity.rare');},color:'#78b9ff'}, {get name(){return tr('rarity.epic');},color:'#bd8cff'},
    {get name(){return tr('rarity.legendary');},color:'#ffb354'}, {get name(){return tr('rarity.mythic');},color:'#ff7086'}],
  species,
  presentation:{eggFollow:{responseHz:1.8,trailDistance:20,catchUpDistance:110,returnDistance:85,teleportDistance:220,hoverHeight:7,hoverAmplitude:2.5,hoverHz:.8},size:{min:.65,max:1},outline:{width:2.5,contrast:{width:.8,color:'#0c181e',maxColorDistance:.16}}},
  combat:{gradePowerRate:1.8,gradeSkillSizeRate:1.05,gradeRangeRate:1.05,hitProtectionMs:500,reviveMs:3000,followRadius:64,leash:600}
};

// Shared boss/companion projectile geometry; the caller owns count and damage.
export function patternAngle(kind,count,index,heading=0,spread=0){return kind==='radial'?index*Math.PI*2/count+heading:heading+(index-(count-1)*.5)*spread;}

const integer=(n,min,max)=>Number.isSafeInteger(n)?Math.max(min,Math.min(max,n)):min;
export function companionPresentation(grade,config=petConfig){
  const index=integer(grade,0,config.grades.length-1),size=config.presentation.size;
  return {scale:size.min+(size.max-size.min)*index/Math.max(1,config.grades.length-1),
    outline:{...config.presentation.outline,color:config.grades[index].color}};
}
export function companionCapacity(config,level){
  return config.slots.base+integer(level,0,config.slots.maxLevel)*config.slots.perLevel;
}

export class CompanionCollection {
  constructor(config=petConfig,raw=null,slotLevel=0,onChange=()=>{}){
    this.config=config;this.onChange=onChange;this.slotLevel=integer(slotLevel,0,config.slots.maxLevel);
    this.inventory=[];this.byId=new Map();this.slots=Array(companionCapacity(config,this.slotLevel)).fill(null);
    this.nextId=1;this.revision=0;this.lastFusion=null;this.discovered=new Set();
    this.automation={hatch:false,preferredSpecies:null,fusion:false};this.processing=false;this.random=Math.random;
    if(raw&&typeof raw==='object'){
      for(const id of Array.isArray(raw.discovered)?raw.discovered:[])if(config.species[id])this.discovered.add(id);
      for(const source of Array.isArray(raw.inventory)?raw.inventory:[]){
        if(!source||!Number.isSafeInteger(source.id)||source.id<1||this.byId.has(source.id)||
          !config.species[source.speciesId]||!['egg','pet'].includes(source.kind))continue;
        const progress=integer(source.hatchProgress,0,config.eggs.hatchKills);
        const kind=source.kind==='egg'&&progress>=config.eggs.hatchKills?'pet':source.kind;
        const grade=source.kind==='egg'?0:integer(source.grade,0,config.grades.length-1);
        const item={id:source.id,speciesId:source.speciesId,kind,grade,
          hatchProgress:kind==='egg'?progress:config.eggs.hatchKills,locked:kind==='pet'&&source.locked===true};
        this.inventory.push(item);this.byId.set(item.id,item);if(kind==='pet')this.discovered.add(item.speciesId);this.nextId=Math.max(this.nextId,item.id+1);
      }
      const used=new Set();for(let i=0;i<this.slots.length;i++){
        const id=raw.slots?.[i];if(this.byId.has(id)&&!used.has(id)){this.slots[i]=id;used.add(id);}
      }
      if(Number.isSafeInteger(raw.nextId))this.nextId=Math.max(this.nextId,raw.nextId);
      this.automation={hatch:raw.automation?.hatch===true,fusion:raw.automation?.fusion===true,
        preferredSpecies:this.discovered.has(raw.automation?.preferredSpecies)?raw.automation.preferredSpecies:null};
    }
  }
  changed(event){if(this.processing)return event;this.processing=true;
    try{event.automatic=event.kind==='hatchProgress'&&!event.hatched.length?[]:this.runAutomation();}finally{this.processing=false;}
    this.revision++;this.onChange(event);return event;}
  snapshot(){return {inventory:this.inventory.map(item=>({...item})),slots:[...this.slots],nextId:this.nextId,discovered:[...this.discovered],automation:{...this.automation}};}
  setAutomation(key,value){if(key==='preferredSpecies'){if(value!==null&&!this.discovered.has(value))return false;}
    else if(!['hatch','fusion'].includes(key)||typeof value!=='boolean')return false;
    if(this.automation[key]===value)return false;this.automation[key]=value;this.changed({kind:'automation'});return true;}
  resumeAutomation(){if(this.automation.hatch||this.automation.fusion)this.changed({kind:'automation'});}
  runAutomation(){
    if(this.automation.hatch){const equipped=new Set(this.slots);for(let slot=0;slot<this.slots.length;slot++){
      if(this.slots[slot]!=null)continue;let oldest=null,preferred=null;
      for(const item of this.inventory){if(item.kind!=='egg'||equipped.has(item.id))continue;
        if(!oldest||item.id<oldest.id)oldest=item;
        if(item.speciesId===this.automation.preferredSpecies&&(!preferred||item.id<preferred.id))preferred=item;}
      const next=preferred||oldest;if(!next)break;this.slots[slot]=next.id;equipped.add(next.id);
    }}
    const results=[];
    // Each grade is visited once, bottom-up. Every attempt consumes inventory;
    // new higher-grade results can cascade, never retry the same grade indefinitely.
    if(this.automation.fusion)for(const speciesId of new Set(this.inventory.filter(item=>item.kind==='pet').map(item=>item.speciesId)))
      for(let grade=0;grade<this.config.fusion.odds.length;grade++){
        const result=this.fuse(speciesId,grade,true,this.random,true);if(result.ok)results.push(result);
      }
    return results;
  }
  // Call on roster changes, never scan the inventory in the combat frame loop.
  companions(){return this.slots.map(id=>this.byId.get(id)||null);}
  setSlotLevel(level){
    const next=integer(level,0,this.config.slots.maxLevel);if(next===this.slotLevel)return false;
    this.slotLevel=next;const size=companionCapacity(this.config,next);
    this.slots.length=Math.min(this.slots.length,size);while(this.slots.length<size)this.slots.push(null);
    this.changed({kind:'slots',capacity:size});return true;
  }
  addEgg(speciesId,count=1){
    if(!this.config.species[speciesId]||!Number.isSafeInteger(count)||count<1)return [];const added=[];
    for(let i=0;i<count;i++){const item={id:this.nextId++,speciesId,kind:'egg',grade:0,hatchProgress:0,locked:false};this.inventory.push(item);this.byId.set(item.id,item);added.push(item.id);}
    this.changed({kind:'reward',speciesId,added});return added;
  }
  rollHitDeath(unit,random=Math.random){
    if(unit.deathReason!=='hit'||unit.faction!=='wild'||unit.eggRollResolved)return null;
    unit.eggRollResolved=true;const spec=this.config.species[unit.speciesId];if(!spec)return null;
    const rate=spec.boss?this.config.eggs.bossDropRate:this.config.eggs.normalDropRate;
    return random()<rate?unit.speciesId:null;
  }
  equip(id,index){
    if(!this.byId.has(id)||!Number.isInteger(index)||index<0||index>=this.slots.length)return false;
    if(this.slots[index]===id)return false;
    const old=this.slots.indexOf(id);if(old>=0)this.slots[old]=null;
    const displaced=this.slots[index];this.slots[index]=id;
    this.changed({kind:'equip',id,index,displaced});return true;
  }
  unequip(index){
    if(!Number.isInteger(index)||index<0||index>=this.slots.length||this.slots[index]==null)return false;
    const id=this.slots[index];this.slots[index]=null;this.changed({kind:'unequip',id,index});return true;
  }
  setLocked(id,locked){
    const item=this.byId.get(id);if(!item||item.kind!=='pet'||typeof locked!=='boolean'||item.locked===locked)return false;
    item.locked=locked;this.changed({kind:'lock',id,locked});return true;
  }
  recordKill(){
    const advanced=[],hatched=[],firstDiscoveries=[];
    // Every equipped egg receives +1; reserve eggs never advance. At most five lookups.
    for(const [slot,id] of this.slots.entries()){const item=this.byId.get(id);if(!item||item.kind!=='egg')continue;
      item.hatchProgress++;advanced.push(id);
      if(item.hatchProgress>=this.config.eggs.hatchKills){item.kind='pet';item.grade=0;hatched.push(id);if(this.automation.hatch)this.slots[slot]=null;if(!this.discovered.has(item.speciesId)){this.discovered.add(item.speciesId);firstDiscoveries.push(item.speciesId);}}
    }
    if(advanced.length)this.changed({kind:'hatchProgress',advanced,hatched,firstDiscoveries});
    return hatched;
  }
  eligible(speciesId,grade){return this.inventory.filter(item=>item.kind==='pet'&&item.speciesId===speciesId&&item.grade===grade&&!item.locked);}
  fuse(speciesId,grade,all=false,random=Math.random,automatic=false){
    const rule=this.config.fusion,result={ok:false,speciesId,grade,resultGrade:grade+1,attempts:0,successes:0,failures:0,consumed:[],produced:[]};
    if(!this.config.species[speciesId]||!Number.isInteger(grade)||grade<0||grade>=rule.odds.length||typeof all!=='boolean')return result;
    const equipped=new Set(this.slots.filter(id=>id!=null));
    // Budmori: unlocked reserve first, then unlocked equipped materials by ID.
    // Equipment itself is not an automatic lock. Explicit locks are user choices.
    const materials=this.eligible(speciesId,grade).filter(item=>!automatic||!equipped.has(item.id)).sort((a,b)=>Number(equipped.has(a.id))-Number(equipped.has(b.id))||a.id-b.id);
    let cursor=0;while(materials.length-cursor>=rule.required+(automatic?rule.autoReserve:0)){
      const success=random()<rule.odds[grade];
      const loss=success?rule.required:rule.failureLoss[Math.min(rule.failureLoss.length-1,Math.floor(random()*rule.failureLoss.length))];
      for(let n=0;n<loss;n++)result.consumed.push(materials[cursor++].id);
      result.attempts++;if(success){
        result.successes++;const item={id:this.nextId++,speciesId,kind:'pet',grade:grade+1,hatchProgress:this.config.eggs.hatchKills,locked:false};
        this.inventory.push(item);this.byId.set(item.id,item);result.produced.push(item.id);
      }else result.failures++;
      if(!all)break; // Bulk mode only reconsiders this grade; results do not cascade.
    }
    if(!result.attempts)return result;
    const consumed=new Set(result.consumed);this.inventory=this.inventory.filter(item=>!consumed.has(item.id));
    for(const id of consumed)this.byId.delete(id);
    for(let i=0;i<this.slots.length;i++)if(consumed.has(this.slots[i]))this.slots[i]=null;
    result.ok=true;result.survivors=this.eligible(speciesId,grade).length;this.lastFusion=result;
    this.changed({kind:'fusion',result});return result;
  }
}


// Collection/run identity and revival lifecycle only. Combat belongs to Unit.
export class CompanionRoster {
  constructor(collection,adapter){this.collection=collection;this.a=adapter;this.actors=[];this.stats={hits:0,kills:0,damage:0,taken:0,deaths:0,revivals:0,abilities:0,supportHealing:0,lastHit:null};this.eggHeading={x:1,y:0};this.previousAnchor=null;}
  clear(){for(const actor of this.actors)if(actor.unit)this.a.remove(actor.unit,'cleanup');this.actors=[];}
  reset(){this.clear();this.eggHeading={x:1,y:0};this.previousAnchor={...this.a.anchor()};for(const key of Object.keys(this.stats))this.stats[key]=key==='lastHit'?null:0;this.sync();}
  sync(){const current=new Map(this.actors.map(a=>[a.inventoryId,a])),next=[];
    for(const [slot,item] of this.collection.companions().entries()){if(!item)continue;let actor=current.get(item.id);
      if(actor&&(actor.kind!==item.kind||actor.grade!==item.grade)){if(actor.unit)this.a.remove(actor.unit,'cleanup');actor=null;}
      if(!actor){const p=this.a.anchor();actor={inventoryId:item.id,id:item.id,slot,kind:item.kind,speciesId:item.speciesId,grade:item.grade,x:p.x,y:p.y,unit:null,reviveAtMs:0};
        if(item.kind==='pet')actor.unit=this.a.create(item,slot,actor);else this.resetEgg(actor,p);}
      actor.slot=slot;if(actor.unit?.controller)actor.unit.controller.slot=slot;next.push(actor);current.delete(item.id);
    }
    for(const actor of current.values())if(actor.unit)this.a.remove(actor.unit,'cleanup');this.actors=next;
  }
  resetEgg(actor,anchor){const target=this.eggTarget(actor,anchor);Object.assign(actor,target,{followMode:'FORMATION',vx:0,vy:0,floatZ:this.collection.config.presentation.eggFollow.hoverHeight});}
  eggTarget(actor,anchor){const c=this.collection.config,p=companionIdlePoint(anchor,actor.slot,c.combat.followRadius),lag=c.presentation.eggFollow.trailDistance;return {x:p.x-this.eggHeading.x*lag,y:p.y-this.eggHeading.y*lag};}
  enterStage(){this.previousAnchor={...this.a.anchor()};for(const actor of this.actors){if(actor.kind==='egg'){this.resetEgg(actor,this.previousAnchor);continue;}if(actor.kind==='pet'){
    if(!actor.unit){const p=this.a.anchor();actor.x=p.x;actor.y=p.y;continue;}
    const hp=actor.unit.hp;this.a.remove(actor.unit,'cleanup');const item=this.collection.byId.get(actor.inventoryId);
    actor.unit=this.a.create(item,actor.slot,actor);actor.unit.hp=Math.min(actor.unit.maxHp,hp);actor.reviveAtMs=0;
  }}}
  died(actor,unit,reason){if(reason==='cleanup')return;Object.assign(actor,{x:unit.body.position.x,y:unit.body.position.y,unit:null,reviveAtMs:this.a.time()+this.collection.config.combat.reviveMs});this.stats.deaths++;this.a.effect('death',actor);}
  update(dt){const p=this.a.anchor(),c=this.collection.config.presentation.eggFollow,motion=this.a.anchorVelocity(),speed=Math.hypot(motion.x,motion.y);
    const teleported=Math.hypot(p.x-this.previousAnchor.x,p.y-this.previousAnchor.y)>c.teleportDistance;this.previousAnchor={...p};
    if(speed>20&&!teleported)this.eggHeading={x:motion.x/speed,y:motion.y/speed};
    const w=c.responseHz*Math.PI*2,decay=Math.exp(-w*dt);
    for(const actor of this.actors){if(actor.kind==='egg'){if(teleported)this.resetEgg(actor,p);
      const gap=Math.hypot(actor.x-p.x,actor.y-p.y);
      if(actor.followMode==='FORMATION'&&gap>c.catchUpDistance)actor.followMode='CATCH_UP';
      else if(actor.followMode==='CATCH_UP'&&gap<c.returnDistance)actor.followMode='FORMATION';
      const target=actor.followMode==='CATCH_UP'?p:this.eggTarget(actor,p);
      // Exact critically damped spring for each fixed-step interval, independent of display FPS.
      for(const axis of ['x','y']){const v='v'+axis,offset=actor[axis]-target[axis],j=actor[v]+w*offset;actor[axis]=target[axis]+(offset+j*dt)*decay;actor[v]=(actor[v]-w*j*dt)*decay;}
      actor.floatZ=c.hoverHeight+Math.sin(this.a.time()*Math.PI*2*c.hoverHz/1000+actor.slot*2.399)*c.hoverAmplitude;
    }
    else if(!actor.unit&&this.a.time()>=actor.reviveAtMs){const item=this.collection.byId.get(actor.inventoryId);actor.unit=this.a.create(item,actor.slot,actor);this.stats.revivals++;this.a.effect('revive',actor);}}
  }
  snapshot(){return {inventoryCount:this.collection.inventory.length,slots:[...this.collection.slots],...this.stats,actors:this.actors.map(a=>({
    id:a.inventoryId,inventoryId:a.inventoryId,unitId:a.unit?.unitId??null,kind:a.kind,speciesId:a.speciesId,grade:a.grade,state:a.kind==='egg'?a.followMode:a.unit?.state||'DEAD',
    hp:a.unit?.hp??null,maxHp:a.unit?.maxHp??null,x:a.unit?.body.position.x??a.x,y:a.unit?.body.position.y??a.y,z:a.unit?.spatial.feetZ??a.floatZ??0,velocity:a.kind==='egg'?{x:a.vx,y:a.vy}:null,
    abilities:a.unit?Object.fromEntries(['leap','selfDestruct','spike','arcFire','lunge','projectileFire','bossPattern','burrow','summon','returnFlight','hook'].filter(k=>a.unit[k]).map(k=>[k,{phase:a.unit[k].phase,log:a.unit[k].log}])):null,
    reviveInMs:a.kind==='pet'&&!a.unit?Math.max(0,a.reviveAtMs-this.a.time()):0}))};}
}
