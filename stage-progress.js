// Permanent clear counts and a next-run choice; never a saved combat build.
export const stageStartConfig=Object.freeze({defaultStage:1,firstSelectable:2,clearOffset:1,pageSize:6});
const valid=n=>Number.isSafeInteger(n)&&n>0&&n<Number.MAX_SAFE_INTEGER;
export class StageProgress {
  constructor(raw=null,config=stageStartConfig){this.config=config;this.stages={};this.lastCredited=null;
    if(raw?.stages&&typeof raw.stages==='object')for(const [key,value]of Object.entries(raw.stages)){
      const index=Number(key);if(!valid(index)||!value||typeof value!=='object')continue;
      this.stages[index]={clears:Number.isSafeInteger(value.clears)&&value.clears>=0?value.clears:0,theme:typeof value.theme==='string'?value.theme:null};
    }
    this.selected=this.unlocked(raw?.selected)?raw.selected:config.defaultStage;
  }
  required(index){return index<this.config.firstSelectable?0:index+this.config.clearOffset;}
  count(index){return this.stages[index]?.clears||0;}
  unlocked(index){return valid(index)&&(index===this.config.defaultStage||this.count(index)>=this.required(index));}
  select(index){if(!this.unlocked(index)||this.selected===index)return false;this.selected=index;return true;}
  enter(index,theme){if(!valid(index))return;this.stages[index]??={clears:0,theme};this.stages[index].theme=theme;}
  recordClear(stage){if(!stage||stage.phase!=='CLEAR'||!valid(stage.index)||this.lastCredited===stage)return false;
    this.lastCredited=stage;this.enter(stage.index,stage.themeId);this.stages[stage.index].clears=Math.min(Number.MAX_SAFE_INTEGER,this.count(stage.index)+1);return true;
  }
  get lastVisible(){return Math.max(this.config.defaultStage,...Object.keys(this.stages).map(Number))+1;}
  snapshot(){return {selected:this.selected,stages:Object.fromEntries(Object.entries(this.stages).map(([id,state])=>[id,{...state}]))};}
}
