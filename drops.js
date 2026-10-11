import {volume,contactWindow,groundArc,stepArc} from './abilities.js';

// The game owns grants/storage. This HAS-A state owns pending payloads and their ground motion.
export const dropConfig={capacity:128,radius:6,mergeRadius:14,pop:{durationMs:240,height:18,spread:12},
  magnet:{acceleration:1800,maxSpeed:680,turnRate:12},recoveryDiameterRate:3,feedbackGapMs:90};
const count=n=>Number.isSafeInteger(n)&&n>0?n:0;
const kind=r=>r.eggSpeciesId||'growth';
export class RewardDrops {
  constructor(config=dropConfig,raw=null,validSpecies=()=>true){
    this.config=config;this.active=[];this.free=[];this.nextId=1;
    this.stats={created:0,merged:0,claimed:0,checks:0,maxActive:0};
    for(let i=0;i<config.capacity;i++){const body={position:{x:0,y:0},circleRadius:config.radius,plugin:{}};volume(body,config.radius*2);this.free.push({body});}
    for(const r of Array.isArray(raw?.pending)?raw.pending:[]){
      const eggSpeciesId=validSpecies(r?.eggSpeciesId)?r.eggSpeciesId:null;
      this.spawn({growth:count(r?.growth),eggSpeciesId,eggCount:eggSpeciesId?count(r?.eggCount):0},{x:0,y:0,z:0},0);
    }
  }
  snapshot(){return {pending:this.active.map(d=>({growth:d.growth,eggSpeciesId:d.eggSpeciesId,eggCount:d.eggCount}))};}
  release(index){const d=this.active[index];this.active[index]=this.active.at(-1);this.active.pop();d.state='FREE';d.arc=null;this.free.push(d);}
  spawn(reward,at,angle=0){
    const growth=count(reward.growth),eggCount=reward.eggSpeciesId?count(reward.eggCount):0;
    if(!growth&&!eggCount)return null;
    const payload={growth,eggSpeciesId:eggCount?reward.eggSpeciesId:null,eggCount},key=kind(payload),c=this.config;
    let d=this.active.find(item=>kind(item)===key&&item.state!=='PULL'&&Math.hypot(item.body.position.x-at.x,item.body.position.y-at.y)<=c.mergeRadius);
    if(!d&&!this.free.length){
      // Saturation coalesces compatible quantities, never deletes a reward or adds unbounded actors.
      d=this.active.filter(item=>kind(item)===key).reduce((best,item)=>!best||Math.hypot(item.body.position.x-at.x,item.body.position.y-at.y)<Math.hypot(best.body.position.x-at.x,best.body.position.y-at.y)?item:best,null);
      if(!d){const seen=new Map();for(let i=0;i<this.active.length;i++){const item=this.active[i],k=kind(item),previous=seen.get(k);
        if(previous){previous.growth+=item.growth;previous.eggCount+=item.eggCount;this.release(i);this.stats.merged++;break;}seen.set(k,item);}}
    }
    if(d){d.growth+=growth;d.eggCount+=eggCount;this.stats.merged++;return d;}
    d=this.free.pop();if(!d)throw Error('Drop capacity must exceed reward kinds');
    Object.assign(d,payload,{id:this.nextId++,state:'POP',vx:0,vy:0,ageMs:0});
    d.body.position.x=at.x;d.body.position.y=at.y;d.body.plugin.volume.feetZ=at.z||0;
    const end={x:at.x+Math.cos(angle)*c.pop.spread,y:at.y+Math.sin(angle)*c.pop.spread,z:0};
    d.arc=groundArc({...at,z:at.z||0},end,c.pop.durationMs,c.pop.height);
    this.active.push(d);this.stats.created++;this.stats.maxActive=Math.max(this.stats.maxActive,this.active.length);return d;
  }
  // Stage/run changes re-present the same unclaimed payloads near the spawn, without granting them.
  enterStage(anchor,diameter,place){
    for(let i=0;i<this.active.length;i++){const d=this.active[i],angle=i*2.399963229728653,distance=diameter*this.config.recoveryDiameterRate+Math.floor(i/12)*10;
      const p=place({x:anchor.x+Math.cos(angle)*distance,y:anchor.y+Math.sin(angle)*distance},i);
      d.body.position.x=p.x;d.body.position.y=p.y;d.body.plugin.volume.feetZ=0;d.state='IDLE';d.arc=null;d.vx=0;d.vy=0;d.ageMs=this.config.pop.durationMs;
    }
  }
  update(dtMs,player,radius){
    const dt=dtMs/1000,c=this.config,claimed=[];this.stats.checks=0;
    for(let i=this.active.length-1;i>=0;i--){const d=this.active[i],p=d.body.position,v=d.body.plugin.volume;
      v.previousFeetZ=v.feetZ;v.motion.x=p.x;v.motion.y=p.y;v.motion.toX=undefined;v.motion.toY=undefined;d.ageMs+=dtMs;
      if(d.state==='POP'){const pose=stepArc(d.arc,dtMs);p.x=pose.x;p.y=pose.y;v.feetZ=pose.z;if(d.arc.finished){d.arc=null;d.state='IDLE';}continue;}
      const dx=player.position.x-p.x,dy=player.position.y-p.y,distance=Math.hypot(dx,dy);this.stats.checks++;
      if(d.state==='IDLE'&&distance<=radius)d.state='PULL';
      if(d.state!=='PULL')continue;
      const speed=Math.min(c.magnet.maxSpeed,Math.hypot(d.vx,d.vy)+c.magnet.acceleration*dt),q=Math.min(1,c.magnet.turnRate*dt),inverse=1/Math.max(distance,1e-9);
      d.vx+=(dx*inverse*speed-d.vx)*q;d.vy+=(dy*inverse*speed-d.vy)*q;
      p.x+=d.vx*dt;p.y+=d.vy*dt;
      // Shared swept XY+Z contact catches a fast player crossing the approaching ground drop.
      if(contactWindow(d.body,player)){claimed.push({id:d.id,growth:d.growth,eggSpeciesId:d.eggSpeciesId,eggCount:d.eggCount});this.release(i);this.stats.claimed++;}
    }
    return claimed;
  }
  debug(){return {pending:this.active.length,...this.stats,items:this.active.map(d=>({id:d.id,state:d.state,x:d.body.position.x,y:d.body.position.y,z:d.body.plugin.volume.feetZ,vx:d.vx,vy:d.vy,growth:d.growth,eggSpeciesId:d.eggSpeciesId,eggCount:d.eggCount}))};}
}
