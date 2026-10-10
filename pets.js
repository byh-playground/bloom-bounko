import {species} from './enemies.js';
// Permanent companion ownership is separate from bounded in-run actors.
// Initial combat recommendations are config-owned; revival is the confirmed 3000ms rule.
export const petConfig = {
  slots:{base:1,maxLevel:4,perLevel:1},
  eggs:{rewardCount:1,hatchKills:30,normalDropRate:.05,bossDropRate:.10},
  fusion:{required:5,odds:[.64,.32,.16,.08,.04],failureLoss:[1,2,3,4]},
  grades:[
    {name:'Common',color:'#d8d4bd'}, {name:'Uncommon',color:'#83ce76'},
    {name:'Rare',color:'#78b9ff'}, {name:'Epic',color:'#bd8cff'},
    {name:'Legendary',color:'#ffb354'}, {name:'Mythic',color:'#ff7086'}],
  species,
  presentation:{size:{min:.65,max:1},outline:{width:2.5,contrast:{width:.8,color:'#0c181e',maxColorDistance:.16}}},
  combat:{gradePowerRate:1.8,gradeSkillSizeRate:1.05,gradeRangeRate:1.05,hitProtectionMs:500,reviveMs:3000,followRadius:48,leash:600}
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
    }
  }
  changed(event){this.revision++;this.onChange(event);return event;}
  snapshot(){return {inventory:this.inventory.map(item=>({...item})),slots:[...this.slots],nextId:this.nextId,discovered:[...this.discovered]};}
  // Call on roster changes, never scan the inventory in the combat frame loop.
  companions(){return this.slots.map(id=>this.byId.get(id)||null);}
  setSlotLevel(level){
    const next=integer(level,0,this.config.slots.maxLevel);if(next===this.slotLevel)return false;
    this.slotLevel=next;const size=companionCapacity(this.config,next);
    this.slots.length=Math.min(this.slots.length,size);while(this.slots.length<size)this.slots.push(null);
    this.changed({kind:'slots',capacity:size});return true;
  }
  addEgg(speciesId){
    if(!this.config.species[speciesId])return [];const item={id:this.nextId++,speciesId,kind:'egg',grade:0,hatchProgress:0,locked:false};
    this.inventory.push(item);this.byId.set(item.id,item);this.changed({kind:'reward',speciesId,added:[item.id]});return [item.id];
  }
  rewardHitDeath(unit,random=Math.random){
    if(unit.deathReason!=='hit'||unit.faction!=='wild'||unit.eggRollResolved)return [];
    unit.eggRollResolved=true;const spec=this.config.species[unit.speciesId];if(!spec)return [];
    const rate=spec.boss?this.config.eggs.bossDropRate:this.config.eggs.normalDropRate;
    return random()<rate?this.addEgg(unit.speciesId):[];
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
    for(const id of this.slots){const item=this.byId.get(id);if(!item||item.kind!=='egg')continue;
      item.hatchProgress++;advanced.push(id);
      if(item.hatchProgress>=this.config.eggs.hatchKills){item.kind='pet';item.grade=0;hatched.push(id);if(!this.discovered.has(item.speciesId)){this.discovered.add(item.speciesId);firstDiscoveries.push(item.speciesId);}}
    }
    if(advanced.length)this.changed({kind:'hatchProgress',advanced,hatched,firstDiscoveries});
    return hatched;
  }
  eligible(speciesId,grade){return this.inventory.filter(item=>item.kind==='pet'&&item.speciesId===speciesId&&item.grade===grade&&!item.locked);}
  fuse(speciesId,grade,all=false,random=Math.random){
    const rule=this.config.fusion,result={ok:false,speciesId,grade,resultGrade:grade+1,attempts:0,successes:0,failures:0,consumed:[],produced:[]};
    if(!this.config.species[speciesId]||!Number.isInteger(grade)||grade<0||grade>=rule.odds.length||typeof all!=='boolean')return result;
    const equipped=new Set(this.slots.filter(id=>id!=null));
    // Budmori: unlocked reserve first, then unlocked equipped materials by ID.
    // Equipment itself is not an automatic lock. Explicit locks are user choices.
    const materials=this.eligible(speciesId,grade).sort((a,b)=>Number(equipped.has(a.id))-Number(equipped.has(b.id))||a.id-b.id);
    let cursor=0;while(materials.length-cursor>=rule.required){
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
  constructor(collection,adapter){this.collection=collection;this.a=adapter;this.actors=[];this.stats={hits:0,kills:0,damage:0,taken:0,deaths:0,revivals:0,abilities:0,supportHealing:0,lastHit:null};}
  clear(){for(const actor of this.actors)if(actor.unit)this.a.remove(actor.unit,'cleanup');this.actors=[];}
  reset(){this.clear();for(const key of Object.keys(this.stats))this.stats[key]=key==='lastHit'?null:0;this.sync();}
  sync(){const current=new Map(this.actors.map(a=>[a.inventoryId,a])),next=[];
    for(const [slot,item] of this.collection.companions().entries()){if(!item)continue;let actor=current.get(item.id);
      if(actor&&(actor.kind!==item.kind||actor.grade!==item.grade)){if(actor.unit)this.a.remove(actor.unit,'cleanup');actor=null;}
      if(!actor){const p=this.a.anchor();actor={inventoryId:item.id,id:item.id,slot,kind:item.kind,speciesId:item.speciesId,grade:item.grade,x:p.x,y:p.y,unit:null,reviveAtMs:0};
        if(item.kind==='pet')actor.unit=this.a.create(item,slot,actor);}
      actor.slot=slot;if(actor.unit?.controller)actor.unit.controller.slot=slot;next.push(actor);current.delete(item.id);
    }
    for(const actor of current.values())if(actor.unit)this.a.remove(actor.unit,'cleanup');this.actors=next;
  }
  enterStage(){for(const actor of this.actors)if(actor.kind==='pet'){
    if(!actor.unit){const p=this.a.anchor();actor.x=p.x;actor.y=p.y;continue;}
    const hp=actor.unit.hp;this.a.remove(actor.unit,'cleanup');const item=this.collection.byId.get(actor.inventoryId);
    actor.unit=this.a.create(item,actor.slot,actor);actor.unit.hp=Math.min(actor.unit.maxHp,hp);actor.reviveAtMs=0;
  }}
  died(actor,unit,reason){if(reason==='cleanup')return;Object.assign(actor,{x:unit.body.position.x,y:unit.body.position.y,unit:null,reviveAtMs:this.a.time()+this.collection.config.combat.reviveMs});this.stats.deaths++;this.a.effect('death',actor);}
  update(dt){const p=this.a.anchor();for(const actor of this.actors){if(actor.kind==='egg'){const angle=(actor.slot+1)*2.399;
      actor.x+=(p.x+Math.cos(angle)*48-actor.x)*Math.min(1,dt*8);actor.y+=(p.y+Math.sin(angle)*48-actor.y)*Math.min(1,dt*8);}
    else if(!actor.unit&&this.a.time()>=actor.reviveAtMs){const item=this.collection.byId.get(actor.inventoryId);actor.unit=this.a.create(item,actor.slot,actor);this.stats.revivals++;this.a.effect('revive',actor);}}
  }
  snapshot(){return {inventoryCount:this.collection.inventory.length,slots:[...this.collection.slots],...this.stats,actors:this.actors.map(a=>({
    id:a.inventoryId,inventoryId:a.inventoryId,unitId:a.unit?.unitId??null,kind:a.kind,speciesId:a.speciesId,grade:a.grade,state:a.kind==='egg'?'FOLLOW':a.unit?.state||'DEAD',
    hp:a.unit?.hp??null,maxHp:a.unit?.maxHp??null,x:a.unit?.body.position.x??a.x,y:a.unit?.body.position.y??a.y,z:a.unit?.spatial.feetZ??0,
    abilities:a.unit?Object.fromEntries(['leap','selfDestruct','spike','arcFire','lunge','projectileFire','bossPattern'].filter(k=>a.unit[k]).map(k=>[k,{phase:a.unit[k].phase,log:a.unit[k].log}])):null,
    reviveInMs:a.kind==='pet'&&!a.unit?Math.max(0,a.reviveAtMs-this.a.time()):0}))};}
}
