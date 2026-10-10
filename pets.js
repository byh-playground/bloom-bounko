// Permanent companion ownership is separate from bounded in-run actors.
// Initial combat recommendations are config-owned; revival is the confirmed 3000ms rule.
export const petConfig = {
  slots:{base:1,maxLevel:4,perLevel:1},
  eggs:{rewardCount:1,hatchKills:30,rewardSelection:'defeatedBoss',
    candidates:[{bossId:'petalPredator',speciesId:'petalPredator'},{bossId:'elasticCap',speciesId:'elasticCap'}]},
  fusion:{required:5,odds:[.64,.32,.16,.08,.04],failureLoss:[1,2,3,4]},
  grades:[
    {name:'Common',color:'#d8d4bd'}, {name:'Uncommon',color:'#83ce76'},
    {name:'Rare',color:'#78b9ff'}, {name:'Epic',color:'#bd8cff'},
    {name:'Legendary',color:'#ffb354'}, {name:'Mythic',color:'#ff7086'}],
  species:{
    petalPredator:{name:'작은 꽃잎 포식자',bossId:'petalPredator',appearance:'petal',
      capabilities:['impact','fan','radial'],base:{hp:150,attackPower:65,mass:1.6,impulseSpeed:650,acceleration:400,attackIntervalMs:1300,range:460},
      abilities:[{id:'petalFan',kind:'fan',minGrade:2,cooldownMs:2400,count:3,mythicCount:5,spread:.125,damageRate:.25},
        {id:'petalRadial',kind:'radial',minGrade:4,cooldownMs:3600,count:6,mythicCount:8,damageRate:.25}]},
    elasticCap:{name:'작은 탄성 버섯왕',bossId:'elasticCap',appearance:'mushroom',
      capabilities:['impact','recoil','support','radial'],base:{hp:180,attackPower:60,mass:2.2,impulseSpeed:590,acceleration:400,attackIntervalMs:1450,range:460},
      abilities:[{id:'elasticRecoil',kind:'recoil',minGrade:2,cooldownMs:0,impulseSpeed:120},
        {id:'mushroomSupport',kind:'healPulse',minGrade:2,cooldownMs:2400,healDamageRate:.30,range:170},
        {id:'mushroomRadial',kind:'radial',minGrade:4,cooldownMs:3600,count:6,mythicCount:8,damageRate:.25}]}
  },
  combat:{gradePowerRate:1.8,gradeSizeRate:1.05,gradeRangeRate:1.05,hitProtectionMs:500,reviveMs:3000,
    radius:13,approachSpeed:190,followSpeed:240,steerRate:7,targetSearchMs:250,chargeTriggerRange:170,
    windupMs:160,chargeDurationMs:520,recoverMs:350,recoilSpeed:160,followRadius:48,leash:600,
    projectileSpeed:450,projectileRadius:4,projectileLifeMs:1400,maxProjectiles:40,
    recommendationStatus:'initialMeasuredCandidate'}
};

// Shared boss/companion projectile geometry; the caller owns count and damage.
export function patternAngle(kind,count,index,heading=0,spread=0){return kind==='radial'?index*Math.PI*2/count+heading:heading+(index-(count-1)*.5)*spread;}

const integer=(n,min,max)=>Number.isSafeInteger(n)?Math.max(min,Math.min(max,n)):min;
export function companionCapacity(config,level){
  return config.slots.base+integer(level,0,config.slots.maxLevel)*config.slots.perLevel;
}

export class CompanionCollection {
  constructor(config=petConfig,raw=null,slotLevel=0,onChange=()=>{}){
    this.config=config;this.onChange=onChange;this.slotLevel=integer(slotLevel,0,config.slots.maxLevel);
    this.inventory=[];this.byId=new Map();this.slots=Array(companionCapacity(config,this.slotLevel)).fill(null);
    this.nextId=1;this.revision=0;this.lastFusion=null;
    if(raw&&typeof raw==='object'){
      for(const source of Array.isArray(raw.inventory)?raw.inventory:[]){
        if(!source||!Number.isSafeInteger(source.id)||source.id<1||this.byId.has(source.id)||
          !config.species[source.speciesId]||!['egg','pet'].includes(source.kind))continue;
        const progress=integer(source.hatchProgress,0,config.eggs.hatchKills);
        const kind=source.kind==='egg'&&progress>=config.eggs.hatchKills?'pet':source.kind;
        const grade=source.kind==='egg'?0:integer(source.grade,0,config.grades.length-1);
        const item={id:source.id,speciesId:source.speciesId,kind,grade,
          hatchProgress:kind==='egg'?progress:config.eggs.hatchKills,locked:kind==='pet'&&source.locked===true};
        this.inventory.push(item);this.byId.set(item.id,item);this.nextId=Math.max(this.nextId,item.id+1);
      }
      const used=new Set();for(let i=0;i<this.slots.length;i++){
        const id=raw.slots?.[i];if(this.byId.has(id)&&!used.has(id)){this.slots[i]=id;used.add(id);}
      }
      if(Number.isSafeInteger(raw.nextId))this.nextId=Math.max(this.nextId,raw.nextId);
    }
  }
  changed(event){this.revision++;this.onChange(event);return event;}
  snapshot(){return {inventory:this.inventory.map(item=>({...item})),slots:[...this.slots],nextId:this.nextId};}
  // Call on roster changes, never scan the inventory in the combat frame loop.
  companions(){return this.slots.map(id=>this.byId.get(id)||null);}
  setSlotLevel(level){
    const next=integer(level,0,this.config.slots.maxLevel);if(next===this.slotLevel)return false;
    this.slotLevel=next;const size=companionCapacity(this.config,next);
    this.slots.length=Math.min(this.slots.length,size);while(this.slots.length<size)this.slots.push(null);
    this.changed({kind:'slots',capacity:size});return true;
  }
  addEgg(bossId){
    const candidate=this.config.eggs.candidates.find(c=>c.bossId===bossId);
    if(!candidate)return [];
    const added=[];for(let n=0;n<this.config.eggs.rewardCount;n++){
      const item={id:this.nextId++,speciesId:candidate.speciesId,kind:'egg',grade:0,hatchProgress:0,locked:false};
      this.inventory.push(item);this.byId.set(item.id,item);added.push(item.id);
    }
    this.changed({kind:'reward',bossId,added});return added;
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
    const advanced=[],hatched=[];
    // Every equipped egg receives +1; reserve eggs never advance. At most five lookups.
    for(const id of this.slots){const item=this.byId.get(id);if(!item||item.kind!=='egg')continue;
      item.hatchProgress++;advanced.push(id);
      if(item.hatchProgress>=this.config.eggs.hatchKills){item.kind='pet';item.grade=0;hatched.push(id);}
    }
    if(advanced.length)this.changed({kind:'hatchProgress',advanced,hatched});
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


// One bounded physical actor per occupied slot. Inventory is never a frame-loop input.
export class CompanionCombat {
  constructor(collection,adapter){this.collection=collection;this.a=adapter;this.actors=[];this.byBody=new Map();this.stats={hits:0,kills:0,damage:0,taken:0,deaths:0,revivals:0,abilities:0,supportHealing:0,lastHit:null};}
  settings(item){const spec=this.collection.config.species[item.speciesId],c=this.collection.config.combat;
    const power=Math.pow(c.gradePowerRate,item.grade),size=Math.pow(c.gradeSizeRate,item.grade);
    return {...spec.base,maxHp:Math.round(spec.base.hp*power),attackPower:spec.base.attackPower*power,
      radius:c.radius*size,range:spec.base.range*Math.pow(c.gradeRangeRate,item.grade),armor:0,armorPenPercent:0,armorPenFlat:0};}
  clear(){for(const actor of this.actors)if(actor.body)this.a.removeBody(actor.body);this.actors=[];this.byBody.clear();}
  reset(){this.clear();this.stats={hits:0,kills:0,damage:0,taken:0,deaths:0,revivals:0,abilities:0,supportHealing:0,lastHit:null};this.sync();}
  makeBody(actor){const M=this.a.M,p=this.a.player().position,c=this.collection.config.combat;
    const angle=(actor.slot+1)*2.399,x=p.x+Math.cos(angle)*c.followRadius,y=p.y+Math.sin(angle)*c.followRadius;
    actor.x=x;actor.y=y;actor.body=M.Bodies.circle(x,y,actor.settings.radius,{label:'pet',restitution:.86,frictionAir:.012,
      friction:0,collisionFilter:{category:16,mask:1|4|8|16}});
    M.Body.setMass(actor.body,actor.settings.mass);M.Body.setInertia(actor.body,Infinity);this.byBody.set(actor.body.id,actor);this.a.addBody(actor.body);
  }
  sync(){const roster=this.collection.companions(),current=new Map(this.actors.map(actor=>[actor.id,actor])),next=[];
    for(let slot=0;slot<roster.length;slot++){const item=roster[slot];if(!item)continue;
      let actor=current.get(item.id);if(actor&&actor.kind!==item.kind){if(actor.body){this.byBody.delete(actor.body.id);this.a.removeBody(actor.body);}actor=null;}
      if(!actor){const p=this.a.player().position;actor={id:item.id,slot,kind:item.kind,speciesId:item.speciesId,grade:item.grade,
        x:p.x,y:p.y,body:null,state:'FOLLOW',untilMs:0,nextAttackMs:0,nextSearchMs:slot*35,targetId:null,
        preX:p.x,preY:p.y,preVelocity:{x:0,y:0},headingX:1,headingY:0,protectedUntilMs:0,reviveAtMs:0,cooldowns:{},lastImpactRaw:0};
        if(item.kind==='pet'){actor.settings=this.settings(item);actor.hp=actor.settings.maxHp;this.makeBody(actor);}
      }
      actor.slot=slot;next.push(actor);current.delete(item.id);
    }
    for(const actor of current.values())if(actor.body){this.byBody.delete(actor.body.id);this.a.removeBody(actor.body);}
    this.actors=next;
  }
  enterStage(){const now=this.a.time(),c=this.collection.config.combat,p=this.a.player().position;
    for(const actor of this.actors){const angle=(actor.slot+1)*2.399,x=p.x+Math.cos(angle)*c.followRadius,y=p.y+Math.sin(angle)*c.followRadius;
      actor.x=x;actor.y=y;actor.targetId=null;actor.nextSearchMs=now;
      if(actor.body){this.a.M.Body.setPosition(actor.body,{x,y});this.a.setSpeed(actor.body,0,0);actor.state='FOLLOW';actor.nextAttackMs=now+c.windupMs;}}
  }
  snapshotMotion(){for(const actor of this.actors){if(!actor.body)continue;actor.preX=actor.body.position.x;actor.preY=actor.body.position.y;actor.preVelocity=this.a.speedOf(actor.body);}}
  chooseTarget(actor){const c=this.collection.config.combat,p=this.a.player().position;let best=null,distance=Infinity;
    for(const enemy of this.a.enemies()){if(!enemy.alive||Math.hypot(enemy.body.position.x-p.x,enemy.body.position.y-p.y)>actor.settings.range)continue;
      const d=Math.hypot(enemy.body.position.x-actor.body.position.x,enemy.body.position.y-actor.body.position.y);if(d<distance){best=enemy;distance=d;}}
    actor.targetId=best?.id??null;actor.nextSearchMs=this.a.time()+c.targetSearchMs;return best;
  }
  update(dt){const c=this.collection.config.combat,p=this.a.player().position,now=this.a.time();
    for(const actor of this.actors){
      if(actor.kind==='egg'){const angle=(actor.slot+1)*2.399;
        actor.x+=(p.x+Math.cos(angle)*c.followRadius-actor.x)*Math.min(1,dt*8);actor.y+=(p.y+Math.sin(angle)*c.followRadius-actor.y)*Math.min(1,dt*8);continue;}
      if(actor.state==='DEAD'){if(now>=actor.reviveAtMs){this.makeBody(actor);actor.hp=actor.settings.maxHp;actor.state='FOLLOW';actor.nextAttackMs=now+c.windupMs;actor.protectedUntilMs=now+c.hitProtectionMs;this.stats.revivals++;this.a.effect('revive',actor);}else continue;}
      const b=actor.body,v=this.a.speedOf(b);actor.preX=b.position.x;actor.preY=b.position.y;actor.preVelocity=v;
      let target=this.a.enemy(actor.targetId);if(!target?.alive||now>=actor.nextSearchMs)target=this.chooseTarget(actor);
      if(Math.hypot(b.position.x-p.x,b.position.y-p.y)>c.leash)target=null;
      if(actor.state==='WINDUP'){
        this.a.setSpeed(b,v.x*Math.exp(-8*dt),v.y*Math.exp(-8*dt));
        if(now>=actor.untilMs){actor.state='CHARGE';actor.untilMs=now+c.chargeDurationMs;
          this.a.setSpeed(b,0,0);this.a.impulse(b,{x:actor.headingX*b.mass*actor.settings.impulseSpeed,y:actor.headingY*b.mass*actor.settings.impulseSpeed});}
        continue;
      }
      if(actor.state==='CHARGE'){
        if(now<actor.untilMs){const force=actor.settings.acceleration*b.mass/1e6;this.a.M.Body.applyForce(b,b.position,{x:actor.headingX*force,y:actor.headingY*force});continue;}
        actor.state='RECOVER';actor.untilMs=now+c.recoverMs;
      }
      if(actor.state==='RECOVER'){if(now<actor.untilMs)continue;actor.state='FOLLOW';}
      const followAngle=(actor.slot+1)*2.399,goal=target?target.body.position:{x:p.x+Math.cos(followAngle)*c.followRadius,y:p.y+Math.sin(followAngle)*c.followRadius};
      const dx=goal.x-b.position.x,dy=goal.y-b.position.y,d=Math.hypot(dx,dy),blend=1-Math.exp(-c.steerRate*dt);
      const desired=d>12?(target?c.approachSpeed:c.followSpeed):0;
      this.a.setSpeed(b,v.x+((d?dx/d:0)*desired-v.x)*blend,v.y+((d?dy/d:0)*desired-v.y)*blend);
      if(target&&d<c.chargeTriggerRange&&now>=actor.nextAttackMs){actor.headingX=dx/Math.max(1,d);actor.headingY=dy/Math.max(1,d);
        actor.state='WINDUP';actor.untilMs=now+c.windupMs;actor.nextAttackMs=now+actor.settings.attackIntervalMs;}
    }
  }
  hurt(actor,raw){const now=this.a.time(),c=this.collection.config.combat;if(actor.kind!=='pet'||actor.state==='DEAD'||now<actor.protectedUntilMs)return 0;
    const damage=Math.min(actor.hp,Math.max(0,raw*100/(100+actor.settings.armor)));actor.hp=Math.max(0,actor.hp-damage);actor.protectedUntilMs=now+c.hitProtectionMs;this.stats.taken+=damage;
    if(actor.hp<=0){actor.x=actor.body.position.x;actor.y=actor.body.position.y;this.byBody.delete(actor.body.id);this.a.removeBody(actor.body);actor.body=null;
      actor.state='DEAD';actor.reviveAtMs=now+c.reviveMs;this.stats.deaths++;this.a.effect('death',actor);}
    else if(damage>0)this.a.effect('hurt',actor);return damage;
  }
  contact(actor,enemy){if(!enemy?.alive||actor.state==='DEAD')return;const now=this.a.time(),c=this.collection.config.combat;
    const attacked=enemy.state==='LUNGE'||enemy.state==='BOSS_CHARGE',incoming=this.a.enemyDamage(enemy);
    if(actor.state==='CHARGE'){
      const dx=enemy.preX-actor.preX,dy=enemy.preY-actor.preY,d=Math.hypot(dx,dy),nx=dx/Math.max(1,d),ny=dy/Math.max(1,d);
      const closing=Math.max(0,(actor.preVelocity.x-enemy.pre.x)*nx+(actor.preVelocity.y-enemy.pre.y)*ny);
      const raw=actor.settings.attackPower*closing/this.a.referenceSpeed();const damage=this.a.damage(enemy,raw,actor.settings,actor);
      if(damage>0){actor.lastImpactRaw=raw;this.stats.hits++;this.stats.damage+=damage;
        this.stats.lastHit={petId:actor.id,speciesId:actor.speciesId,grade:actor.grade,enemyId:enemy.id,closingSpeed:closing,attackPower:actor.settings.attackPower,raw,damage,atMs:now};
        actor.state='RECOVER';actor.untilMs=now+c.recoverMs;
        this.a.impulse(actor.body,{x:-nx*c.recoilSpeed*actor.body.mass,y:-ny*c.recoilSpeed*actor.body.mass});this.a.effect('impact',actor);
        const spec=this.collection.config.species[actor.speciesId];for(const ability of spec.abilities){if(actor.grade<ability.minGrade||now<(actor.cooldowns[ability.id]||0))continue;
          actor.cooldowns[ability.id]=now+ability.cooldownMs;this.stats.abilities++;this.a.cast(ability,actor,enemy,damage);}
      }
    }
    // Idle body overlap is harmless. Only an actual enemy attack phase can damage companions.
    if(attacked&&actor.body)this.hurt(actor,incoming);
  }
  snapshot(){return {inventoryCount:this.collection.inventory.length,slots:[...this.collection.slots],...this.stats,
    actors:this.actors.map(actor=>({id:actor.id,kind:actor.kind,speciesId:actor.speciesId,grade:actor.grade,state:actor.state,
      hp:actor.hp??null,maxHp:actor.settings?.maxHp??null,x:actor.body?.position.x??actor.x,y:actor.body?.position.y??actor.y,
      reviveInMs:actor.state==='DEAD'?Math.max(0,actor.reviveAtMs-this.a.time()):0}))};}
}
