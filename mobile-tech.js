import {t as tr} from './i18n.js';

// View owns only family/page presentation; original cards own state and actions.
export function createMobileTechView({root,records,groupName,onSelect,isOpen}){
  const media=matchMedia('(max-width:650px)'),groups=[...new Set(records.map(r=>r.group))],byId=new Map(records.map(r=>[r.id,r]));
  const pageSize=4;let group=groups[0],page=0,selected=null,shown=null;
  root.innerHTML='<label class="tech-mobile-family"><span></span><select id="techMobileFamily"></select></label><div id="techMobileCards" class="tech-mobile-cards"></div><nav class="tech-mobile-pages"><button type="button" id="techMobilePrev">‹</button><output id="techMobilePage"></output><button type="button" id="techMobileNext">›</button></nav><div id="techMobileDetail" class="tech-mobile-detail"></div>';
  const family=root.querySelector('select'),cards=root.querySelector('#techMobileCards'),detail=root.querySelector('#techMobileDetail'),prev=root.querySelector('#techMobilePrev'),next=root.querySelector('#techMobileNext'),counter=root.querySelector('output');
  const restore=()=>{if(shown){shown.home.append(shown.card);shown=null;}};
  const entries=()=>records.filter(r=>r.group===group);
  family.onchange=()=>{group=family.value;page=0;onSelect(entries()[0].id,false);};
  const changePage=delta=>{page+=delta;onSelect(entries()[page*pageSize].id,false);};
  prev.onclick=()=>changePage(-1);next.onclick=()=>changePage(1);
  function render(id=selected){
    selected=id;if(!media.matches){restore();return;}if(!isOpen())return;
    const chosen=byId.get(id);if(chosen){group=chosen.group;page=Math.floor(entries().indexOf(chosen)/pageSize);}
    const list=entries(),pages=Math.ceil(list.length/pageSize);page=Math.min(page,pages-1);
    root.querySelector('.tech-mobile-family span').textContent=tr('tech.mobile.family');
    family.replaceChildren(...groups.map(value=>{const option=document.createElement('option');option.value=value;option.textContent=groupName(value);return option;}));family.value=group;
    prev.setAttribute('aria-label',tr('tech.mobile.previous'));next.setAttribute('aria-label',tr('tech.mobile.next'));prev.disabled=page===0;next.disabled=page===pages-1;
    counter.textContent=tr('tech.mobile.page',{page:page+1,total:pages});cards.replaceChildren();
    for(const record of list.slice(page*pageSize,(page+1)*pageSize)){
      const button=document.createElement('button');button.type='button';button.className='tech-mobile-choice';button.dataset.mobileSelect=record.id;button.dataset.state=record.card.dataset.state;button.setAttribute('aria-pressed',String(record.id===id));
      const name=document.createElement('b'),state=document.createElement('small');name.textContent=record.symbol+' '+record.label();state.textContent=record.card.querySelector('.node-price').textContent;button.append(name,state);button.onclick=()=>{onSelect(record.id===selected?null:record.id,false);cards.querySelector('[data-mobile-select="'+record.id+'"]')?.focus({preventScroll:true});};cards.append(button);
    }
    if(shown!==chosen){restore();detail.replaceChildren();if(chosen){detail.append(chosen.card);shown=chosen;detail.scrollTop=0;}}
    if(!chosen){detail.textContent=tr('tech.mobile.choose');return;}
    detail.querySelector('.tech-mobile-stat-conditions')?.remove();
    if(chosen.parents){
      const conditions=document.createElement('div');conditions.className='tech-mobile-stat-conditions tech-prereqs';
      for(const parent of chosen.parents){const button=document.createElement('button');button.type='button';button.dataset.statPrereq=parent.id;button.dataset.ready=String(parent.ready());button.textContent=(parent.ready()?'✓ ':'')+tr('tech.mobile.statCondition',{name:byId.get(parent.id).label(),level:parent.level});button.onclick=()=>onSelect(parent.id,false);conditions.append(button);}
      if(!chosen.parents.length)conditions.textContent=tr('tech.noConditions');
      detail.prepend(conditions);
    }
  }
  const changed=()=>render();media.addEventListener('change',changed);
  return {render,get active(){return media.matches;},focusSelection(){cards.querySelector('[aria-pressed=true]')?.focus({preventScroll:true});},dispose(){media.removeEventListener('change',changed);restore();}};
}
