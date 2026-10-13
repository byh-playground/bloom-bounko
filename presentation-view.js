// Game-owned display fields; GameKit alone owns interpolation, lifetime and paths.
// Nothing returned here is written back to Matter, abilities, saves or input.
const abilityNames=['selfDestruct','spike','arcFire','leap','lunge','projectileFire','melee','sunbeam','heal','burrow','hook','returnFlight','groundAttack','coneBreath'];
const pick=(source,keys)=>Object.fromEntries(keys.map(key=>[key,source?.[key]]));
const unitKey=unit=>unit?.body?`unit:${unit.body.id}`:null;

export function createPresentationView({RenderObject:R,PresentationRuntime,stepMs}){
  const position={x:R.POSITION_X,y:R.POSITION_Y,z:R.POSITION_Z};
  const unitSchema={...position,heading:R.ANGLE,'velocity.x':R.LINEAR,'velocity.y':R.LINEAR,
    'data.id':R.STEP,'data.unitId':R.STEP,'data.speciesId':R.STEP,'data.faction':R.STEP,
    'data.state':R.STEP,'data.targetable':R.STEP,'data.hp':R.LINEAR,'data.maxHp':R.STEP,
    'data.conductUntilMs':R.STEP,'data.burn.remainingMs':R.LINEAR,
    'data.status.frozenMs':R.LINEAR,'data.status.slowMs':R.LINEAR,'data.status.acidMs':R.LINEAR,
    'data.bossPattern':R.STEP,'data.pattern':R.STEP,'data.patternStartedAtMs':R.STEP,
    'data.evasion.phase':R.STEP,'data.evasion.blocked':R.STEP,'data.evasion.motion.trail':R.STEP,
    'data.evasion.presentation.squash':R.LINEAR,'data.evasion.presentation.glow':R.LINEAR,
    'data.evasion.presentation.shakeX':R.LINEAR,'data.evasion.presentation.markerOpacity':R.LINEAR,
    'data.groundAttack.effects':R.STEP,'data.groundAttack.pending':R.STEP,
    'data.hook.shots':R.STEP,'data.summon.slots':R.STEP,
    'links':R.STEP,'healUntilMs':R.STEP,
    'pose.angle':R.ANGLE,'pose.roll':R.ANGLE,'pose.xx':R.LINEAR,'pose.xy':R.LINEAR,
    'pose.yy':R.LINEAR,'pose.sproutX':R.LINEAR,'pose.sproutY':R.LINEAR};
  for(const name of abilityNames){unitSchema[`data.${name}.phase`]=R.STATE_KEY;unitSchema[`data.${name}.leftMs`]=R.LINEAR;unitSchema[`data.${name}.aim`]=R.STEP;unitSchema[`data.${name}.stage`]=R.LINEAR;}
  class Unit extends R{static renderSchema=unitSchema;}
  class Shot extends R{
    static renderSchema={...position,screenY:R.LINEAR,data:R.STEP};
    // Ground path and height share the same displayed endpoint. Historical points
    // keep their own projected height rather than moving with the current body.
    static renderPath={x:'x',y:'screenY',durationMs:120,maxPoints:12};
  }
  class Shadow extends R{static renderSchema={...position,'data':R.STEP};static renderPath={x:'x',y:'y',durationMs:90,maxPoints:8};}
  class Companion extends R{static renderSchema={...position,data:R.STEP};}
  class Drop extends R{static renderSchema={...position,data:R.STEP};}
  class Orbit extends R{static renderSchema={angle:R.ANGLE,radius:R.LINEAR,distance:R.LINEAR,progress:R.LINEAR,ready:R.STEP,aligning:R.STEP};}
  class Scene extends R{static renderSchema={
    'data.mode':R.STEP,'data.aimId':R.STEP,'data.anchor':R.STEP,'data.charge':R.LINEAR,
    'data.fxStage':R.STEP,'data.dashAvailable':R.STEP,'data.remainingGap':R.LINEAR,
    'data.dashFlight':R.STEP,'data.dashing':R.STEP,
    'data.ultimate.skillId':R.STEP,'data.ultimate.phaseIndex':R.STATE_KEY,
    'data.ultimate.elapsedMs':R.LINEAR,'data.ultimate.totalMs':R.LINEAR,
    'data.ultimate.direction':R.STEP,'data.ultimate.aim':R.STEP,'data.ultimate.trails':R.STEP,
    'data.ultimate.trailWidth':R.LINEAR,'data.ultimate.progress':R.LINEAR,
    'data.ultimate.beam.from.x':R.LINEAR,'data.ultimate.beam.from.y':R.LINEAR,
    'data.ultimate.beam.to.x':R.LINEAR,'data.ultimate.beam.to.y':R.LINEAR,'data.ultimate.beam.width':R.LINEAR,
    'data.ultimate.wave.origin':R.STEP,'data.ultimate.wave.radius':R.LINEAR,'data.ultimate.wave.progress':R.LINEAR};}
  const runtime=new PresentationRuntime({stepMs,delayMs:stepMs});
  const definitions=new Map(),views=new Map(),currentIds=new Set();
  let revision=0,sequence=0,resetPending=true,epoch=0,lastClock=0,atMs=0,receipt=0;
  let lastFrame=null;
  function reset(){revision++;sequence=0;resetPending=true;definitions.clear();views.clear();}
  function capture({timeMs,player,units,shots,shadow,companions,orbits,drops,scene},wallNow){
    if(resetPending)epoch=lastClock+stepMs-timeMs;
    const entities=[];currentIds.clear();
    function add(id,type,source,definition,seed){
      entities.push({id,generation:0,type,source,...seed});currentIds.add(id);
      if(definition&&!definitions.has(id))definitions.set(id,definition);
    }
    for(const unit of [player,...units]){
      if(unit!==player&&!unit.alive)continue;
      const p=unit.body.position,volume=unit.body.plugin.volume;
      const data=pick(unit,['id','unitId','speciesId','faction','state','targetable','hp','maxHp','conductUntilMs','burn','status','pattern','patternStartedAtMs']);
      data.bossPattern=!!unit.bossPattern;
      for(const name of abilityNames)data[name]=unit[name];
      if(unit.hook)data.hook={...unit.hook,shots:unit.hook.shots.map(s=>({arm:s.arm,finished:s.finished}))};
      if(unit.summon)data.summon={slots:unit.summon.slots.map(s=>s?{returnFlight:{phase:s.returnFlight?.phase}}:null)};
      data.evasion=unit.evasion;
      const pres=unit.presentation,pose=unit===player?{angle:pres.facing.angle,roll:pres.body.current.roll,...pick(pres.body.current,['xx','xy','yy']),sproutX:pres.sprout.current.x,sproutY:pres.sprout.current.y}:null;
      const links={beam:unitKey(unit.sunbeam?.target),heal:unitKey(unit.heal?.link?.target),summoner:unitKey(unit.summoner)};
      add(unitKey(unit),Unit,{x:p.x,y:p.y,z:volume?.feetZ??0,heading:Math.atan2(unit.headingY??0,unit.headingX??1),
        velocity:{x:unit.body.velocity.x*60,y:unit.body.velocity.y*60},data,pose,links,healUntilMs:unit.heal?.link?.untilMs},
      {kind:unit===player?'player':'unit',config:unit.config,presentation:unit===player?null:{...pres},height:volume?.height??0,
        bossParams:unit.bossParams,abilities:Object.fromEntries(abilityNames.map(n=>[n,unit[n]?.config])),evasionConfig:unit.evasion?.config});
    }
    for(const shot of shots){const p=shot.body.position,z=shot.body.plugin.volume?.feetZ??0;
      add(`shot:${shot.body.id}`,Shot,{x:p.x,y:p.y,z,screenY:p.y-z,data:{...pick(shot,['color','boss','faction','dirX','dirY','retrieval','arm','impactRadius']),
        radius:shot.body.circleRadius,aim:shot.arc?{...shot.arc.aim}:null,fire:shot.impact?.visual==='fire',sourceId:unitKey(shot.source),capturedId:unitKey(shot.captured)}},{kind:'shot'});
    }
    if(shadow){const id=`shadow:${shadow.launchedAtMs}`,data={...shadow,contactAtMs:Number.isFinite(shadow.contactAtMs)?shadow.contactAtMs:null};
      add(id,Shadow,{x:shadow.x,y:shadow.y,z:0,data},{kind:'shadow'},
        !definitions.has(id)?{initialSource:{x:shadow.startX,y:shadow.startY,z:0,data},initialTimeMs:shadow.launchedAtMs}:undefined);
    }
    for(const actor of companions){if(actor.unit)continue;
      add(`companion:${actor.inventoryId}`,Companion,{x:actor.x,y:actor.y,z:actor.floatZ??0,data:pick(actor,['kind','speciesId','inventoryId','progress','reviveAtMs'])},{kind:'companion'});
    }
    for(const drop of drops)add(`drop:${drop.id}`,Drop,{...drop.body.position,z:drop.body.plugin.volume.feetZ,
      data:pick(drop,['id','state','vx','vy','ageMs','growth','eggCount','eggSpeciesId'])},{kind:'drop'});
    for(const orb of orbits)add(`orbit:${orb.slot}`,Orbit,orb,{kind:'orbit'});
    add('scene',Scene,{data:scene},{kind:'scene'});
    // Multiplying tick*step and adding step can differ by an ULP. The local
    // receipt clock stays monotonic even when those equivalent boundaries round.
    const captureClock=Math.max(lastClock,epoch+timeMs);
    runtime.capture({revision,sequence:sequence++,timeMs,mode:resetPending?'reset':'continuous',entities},captureClock);
    resetPending=false;atMs=timeMs;receipt=wallNow;lastClock=captureClock;
  }
  function frame(wallNow,{active=true,rate=1}={}){
    const now=Math.max(lastClock,epoch+atMs+(active?Math.min(stepMs,Math.max(0,wallNow-receipt)*rate):0));
    const f=runtime.frame(now);lastClock=now;
    const output={timeMs:f.timeMs,units:[],shots:[],companions:[],orbits:[],drops:[],player:null,shadow:null,scene:null,byId:new Map()};
    const shown=new Set();
    f.forEach((model,id,generation)=>{
      shown.add(id);const def=definitions.get(id);let v=views.get(id);
      if(!v){v={path:[]};views.set(id,v);}
      if(def.kind==='player'||def.kind==='unit'){
        // A disposable render adapter, never a prototype or a simulation unit.
        v={...model.data,alive:true,config:def.config,presentation:def.presentation,bossParams:def.bossParams,
          headingX:Math.cos(model.heading),headingY:Math.sin(model.heading),pose:model.pose,velocity:model.velocity,
          body:{position:{x:model.x,y:model.y},plugin:{volume:{feetZ:model.z,height:def.height}}},spatial:{feetZ:model.z}};
        for(const name of abilityNames)if(model.data[name])v[name]={...model.data[name],config:def.abilities[name]};
        if(model.data.evasion)v.evasion={...model.data.evasion,config:def.evasionConfig};
        v.links=model.links;v.healUntilMs=model.healUntilMs;output.byId.set(id,v);
        if(def.kind==='player')output.player=v;else output.units.push(v);
      }else if(def.kind==='shot'){
        Object.assign(v,model.data,{body:{position:{x:model.x,y:model.y},circleRadius:model.data.radius,plugin:{volume:{feetZ:model.z}}},
          arc:model.data.aim?{aim:model.data.aim}:null,impact:model.data.fire?{visual:'fire'}:null});
        f.pathInto(id,generation,v.path);v.trail=v.path;output.shots.push(v);
      }else if(def.kind==='shadow'){
        Object.assign(v,model.data,{x:model.x,y:model.y});f.pathInto(id,generation,v.path);output.shadow=v;
      }else if(def.kind==='companion')output.companions.push({...model.data,x:model.x,y:model.y,floatZ:model.z});
      else if(def.kind==='drop')output.drops.push({...model.data,body:{position:{x:model.x,y:model.y},plugin:{volume:{feetZ:model.z}}}});
      else if(def.kind==='orbit')output.orbits.push(model);
      else output.scene=model.data;
    });
    for(const v of output.byId.values()){
      if(v.sunbeam)v.sunbeam.target=output.byId.get(v.links.beam);
      if(v.heal)v.heal.link=v.links.heal&&output.byId.has(v.links.heal)?{target:output.byId.get(v.links.heal),untilMs:v.healUntilMs}:null;
      v.summoner=output.byId.get(v.links.summoner);
    }
    for(const shot of output.shots){shot.source=output.byId.get(shot.sourceId);shot.captured=output.byId.get(shot.capturedId);}
    for(const id of definitions.keys())if(!currentIds.has(id)&&!shown.has(id)){definitions.delete(id);views.delete(id);}
    lastFrame=output;return output;
  }
  return {capture,frame,reset,snapshot(){return lastFrame?{timeMs:lastFrame.timeMs,captureTimeMs:atMs,revision,tracks:definitions.size,
    player:{...lastFrame.player.body.position,z:lastFrame.player.spatial.feetZ,pose:{...lastFrame.player.pose}},
    units:lastFrame.units.map(u=>({id:u.unitId,x:u.body.position.x,y:u.body.position.y,z:u.spatial.feetZ,heading:Math.atan2(u.headingY,u.headingX)})),
    shots:lastFrame.shots.length,companions:lastFrame.companions.length}:null;}};
}
