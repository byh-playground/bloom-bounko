// Theme identity owns boss-defeat unlocks; stage numbers only locate the debut.
export class ThemeProgress {
  constructor(definitions,raw=null){
    this.definitions=[...definitions].sort((a,b)=>a.unlockStage-b.unlockStage);
    this.themes={};this.creditedBosses=new WeakSet();
    for(const [order,theme]of this.definitions.entries()){
      const saved=raw?.themes?.[theme.id];
      this.themes[theme.id]={bossDefeats:Number.isSafeInteger(saved?.bossDefeats)&&saved.bossDefeats>=0?saved.bossDefeats:0,visited:order===0||saved?.visited===true};
    }
    this.selected=this.unlocked(raw?.selected)?raw.selected:this.definitions[0].id;
  }
  required(id){const order=this.definitions.findIndex(theme=>theme.id===id);return order===0?0:order<0?Infinity:order+2;}
  count(id){return this.themes[id]?.bossDefeats||0;}
  unlocked(id){return Object.hasOwn(this.themes,id)&&this.count(id)>=this.required(id);}
  select(id){if(!this.unlocked(id)||this.selected===id)return false;this.selected=id;return true;}
  get startStage(){return this.definitions.find(theme=>theme.id===this.selected).unlockStage;}
  enter(id){if(Object.hasOwn(this.themes,id))this.themes[id].visited=true;}
  recordBossDefeat(stage,boss){
    if(!stage||stage.phase!=='BOSS'||stage.boss!==boss||!boss||boss.alive||boss.deathReason!=='hit'||boss.isSummon||boss.faction!=='wild'||!Object.hasOwn(this.themes,stage.themeId)||this.creditedBosses.has(boss))return false;
    this.creditedBosses.add(boss);this.enter(stage.themeId);
    this.themes[stage.themeId].bossDefeats=Math.min(Number.MAX_SAFE_INTEGER,this.count(stage.themeId)+1);return true;
  }
  snapshot(){return {selected:this.selected,themes:Object.fromEntries(Object.entries(this.themes).map(([id,state])=>[id,{...state}]))};}
}
