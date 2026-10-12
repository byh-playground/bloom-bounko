import {t as tr} from './i18n.js';

// A shared responsive view of the game's existing records, cards and purchase events.
export function createTechView({root,records,groupName,onSelect,isOpen,getPoints}){
  const groups=[...new Set(records.map(r=>r.group))],byId=new Map(records.map(r=>[r.id,r]));
  let group=groups[0],selected=null,shown=null,frame=0;
  const positions=new Map();
  root.innerHTML='<nav id="techMobileFamilies" class="tech-mobile-families"></nav><div class="tech-mobile-toolbar"><p class="tech-mobile-hint"></p><output id="techMobilePoints"></output></div><div id="techMobileTree" class="tech-mobile-tree"><div class="tech-mini-forest"></div><svg class="tech-mini-links" aria-hidden="true"></svg></div><section id="techMobileDetail" class="tech-mobile-detail"><div class="tech-mobile-detail-content"></div><div id="techMobileActions" class="tech-mobile-actions"></div></section>';
  const family=root.querySelector('#techMobileFamilies'),icons={chain:'↻',evade:'⇢',shadow:'▰',motion:'➤',impact:'✳',lightning:'ϟ',fire:'♨',frost:'❄',acid:'◉',ultimate:'✦',stats:'+'},tree=root.querySelector('#techMobileTree'),forest=tree.querySelector('.tech-mini-forest'),links=tree.querySelector('svg'),detail=root.querySelector('#techMobileDetail'),content=detail.querySelector('.tech-mobile-detail-content'),actions=detail.querySelector('.tech-mobile-actions');
  const entries=()=>records.filter(r=>r.group===group);
  const parents=record=>record.parents??[];
  const state=record=>record.card.dataset.state;
  const stateText=record=>tr('tech.mobile.'+state(record));
  function restore(){if(!shown)return;shown.record.card.querySelector('.tech-mobile-recipe-title')?.remove();shown.actionsAnchor?.replaceWith(shown.actions);shown.anchor.replaceWith(shown.record.card);shown=null;}
  function pick(id){onSelect(id,false);tree.querySelector('[data-mobile-select="'+id+'"]')?.focus({preventScroll:true});}
  // Local connected paths come from prerequisites. Cross-family requirements stay chips.
  function components(list){const ids=new Set(list.map(r=>r.id)),seen=new Set(),result=[];
    for(const record of list){if(seen.has(record.id))continue;const component=[],queue=[record.id];while(queue.length){const id=queue.shift();if(seen.has(id))continue;seen.add(id);const item=byId.get(id);component.push(item);
      queue.push(...parents(item).filter(p=>ids.has(p.id)).map(p=>p.id),...list.filter(r=>parents(r).some(p=>p.id===id)).map(r=>r.id));}result.push(list.filter(r=>component.includes(r)));}return result;}
  function node(record){const box=document.createElement('article');box.className='tech-mini-node';box.dataset.nodeId=record.id;box.dataset.state=state(record);box.dataset.selected=String(record.id===selected);
    const button=document.createElement('button');button.type='button';button.className='tech-mini-select';button.dataset.mobileSelect=record.id;button.setAttribute('aria-pressed',String(record.id===selected));
    const title=document.createElement('b'),status=document.createElement('small');title.textContent=record.symbol+' '+record.label();status.className='tech-mini-state';status.textContent=(record.id===selected?'● ':'')+stateText(record);button.append(title,status);
    const all=parents(record);if(all.length>1){const progress=document.createElement('small');progress.className='tech-mini-progress';progress.textContent=tr('tech.mobile.allProgress',{completed:all.filter(p=>p.ready()).length,total:all.length});button.append(progress);}
    button.setAttribute('aria-label',record.label()+' · '+stateText(record)+(record.id===selected?' · '+tr('tech.mobile.selected'):'')+(all.length?' · '+tr('tech.mobile.requires',{names:all.map(p=>byId.get(p.id).label()).join(' + ')}):''));button.onclick=()=>pick(record.id);box.append(button);
    const outside=all.filter(p=>byId.get(p.id).group!==group);if(outside.length){const chips=document.createElement('div');chips.className='tech-mini-external';for(const parent of outside){const chip=document.createElement('button');chip.type='button';chip.dataset.mobilePrereq=parent.id;chip.dataset.ready=String(parent.ready());chip.textContent=(parent.ready()?'✓ ':'○ ')+'↗ '+groupName(byId.get(parent.id).group);chip.title=byId.get(parent.id).label();chip.setAttribute('aria-label',tr('tech.inspectCondition',{name:byId.get(parent.id).label(),state:tr(parent.ready()?'tech.met':'tech.notMet')}));chip.onclick=()=>pick(parent.id);chips.append(chip);}box.append(chips);}return box;}
  function drawTree(list){forest.replaceChildren();const parts=components(list);
    for(const part of parts){const ids=new Set(part.map(r=>r.id)),depth=new Map();function rank(record){if(depth.has(record.id))return depth.get(record.id);const local=parents(record).filter(p=>ids.has(p.id)),value=local.length?1+Math.max(...local.map(p=>rank(byId.get(p.id)))):0;depth.set(record.id,value);return value;}
      for(const record of part)rank(record);const levels=[...new Set(depth.values())].sort((a,b)=>a-b),linear=levels.length===part.length;
      const section=document.createElement('div');section.className='tech-mini-path';const horizontal=parts.length===1&&linear&&part.length<=3;section.dataset.flow=horizontal?'horizontal':'vertical';
      if(horizontal){section.style.gridTemplateColumns='repeat('+part.length+',minmax(0,1fr))';section.style.gridColumn='1 / -1';for(const level of levels)section.append(node(part.find(r=>depth.get(r.id)===level)));}
      else{if(parts.length===1||!linear)section.style.gridColumn='1 / -1';for(const level of levels){const row=document.createElement('div');row.className='tech-mini-row';const peers=part.filter(r=>depth.get(r.id)===level);row.style.gridTemplateColumns='repeat('+peers.length+',minmax(0,1fr))';for(const record of peers)row.append(node(record));section.append(row);}}
      forest.append(section);}
  }
  function drawLinks(reveal=true){cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{if(!isOpen())return;links.replaceChildren();links.style.left=forest.offsetLeft+'px';links.style.top=forest.offsetTop+'px';links.setAttribute('width',forest.offsetWidth);links.setAttribute('height',forest.offsetHeight);const bounds=forest.getBoundingClientRect();
    for(const record of entries()){const target=forest.querySelector('[data-node-id="'+record.id+'"]');for(const parent of parents(record)){if(byId.get(parent.id).group!==group)continue;const source=forest.querySelector('[data-node-id="'+parent.id+'"]');if(!source||!target)continue;const a=source.getBoundingClientRect(),b=target.getBoundingClientRect(),horizontal=target.closest('.tech-mini-path').dataset.flow==='horizontal';
      const x1=(horizontal?a.right:a.x+a.width/2)-bounds.x,y1=(horizontal?a.y+a.height/2:a.bottom)-bounds.y,x2=(horizontal?b.x:b.x+b.width/2)-bounds.x,y2=(horizontal?b.y+b.height/2:b.y)-bounds.y;
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.dataset.source=parent.id;path.dataset.target=record.id;path.dataset.ready=String(parent.ready());path.setAttribute('d',horizontal?'M '+x1+' '+y1+' H '+x2:'M '+x1+' '+y1+' V '+((y1+y2)/2)+' H '+x2+' V '+y2);links.append(path);
      const arrow=document.createElementNS('http://www.w3.org/2000/svg','path');arrow.dataset.ready=String(parent.ready());arrow.setAttribute('d',horizontal?'M '+(x2-5)+' '+(y2-4)+' L '+x2+' '+y2+' L '+(x2-5)+' '+(y2+4):'M '+(x2-4)+' '+(y2-5)+' L '+x2+' '+y2+' L '+(x2+4)+' '+(y2-5));links.append(arrow);
    }}
    const selectedNode=forest.querySelector('[data-node-id="'+selected+'"]');if(reveal&&selectedNode){const a=selectedNode.getBoundingClientRect(),b=tree.getBoundingClientRect();if(a.top<b.top)tree.scrollTop+=a.top-b.top-8;else if(a.bottom>b.bottom)tree.scrollTop+=a.bottom-b.bottom+8;}
  });}
  function showDetail(chosen){if(shown?.record!==chosen){restore();content.replaceChildren();actions.replaceChildren();const anchor=document.createComment('mobile detail');chosen.card.before(anchor);shown={record:chosen,anchor};
      if(chosen.group==='stats'){actions.append(chosen.card);}else{content.append(chosen.card);const originalActions=chosen.card.querySelector('.tech-actions'),actionAnchor=document.createComment('mobile actions');originalActions.before(actionAnchor);actions.append(originalActions);Object.assign(shown,{actions:originalActions,actionsAnchor:actionAnchor});}content.scrollTop=0;}
    content.querySelector('.tech-mobile-recipe-title')?.remove();
    if(chosen.group==='stats'){content.replaceChildren();const h=document.createElement('h3'),effect=document.createElement('p'),price=document.createElement('p'),conditions=document.createElement('div');h.textContent=chosen.label();effect.textContent=chosen.card.querySelector('.node-desc').textContent;price.textContent=chosen.card.querySelector('.node-price').textContent;conditions.className='tech-prereqs tech-mobile-stat-conditions';
      for(const parent of parents(chosen)){const chip=document.createElement('button');chip.type='button';chip.dataset.statPrereq=parent.id;chip.dataset.ready=String(parent.ready());chip.textContent=(parent.ready()?'✓ ':'○ ')+tr('tech.mobile.statCondition',{name:byId.get(parent.id).label(),level:parent.level});chip.onclick=()=>pick(parent.id);conditions.append(chip);}content.append(h,effect,conditions,price);
    }else if(parents(chosen).length>1){const heading=document.createElement('p');heading.className='tech-mobile-recipe-title';heading.textContent=tr('tech.mobile.requires',{names:parents(chosen).map(p=>byId.get(p.id).label()).join(' + ')});chosen.card.querySelector('.tech-prereqs').before(heading);}
    detail.setAttribute('aria-label',chosen.label());
  }
  function render(id=selected){if(!isOpen())return;const oldGroup=group,chosen=byId.get(id)??byId.get(selected)??entries()[0],changed=selected!==chosen.id;
    const focused=document.activeElement,focusKey=['data-family','data-mobile-select','data-mobile-prereq'].find(key=>focused?.hasAttribute(key)),focusValue=focusKey?focused.getAttribute(focusKey):null;
    if(selected)positions.set(selected,{tree:tree.scrollTop,detail:content.scrollTop});
    const saved=positions.get(chosen.id);selected=chosen.id;group=chosen.group;
    family.setAttribute('aria-label',tr('tech.mobile.family'));root.querySelector('.tech-mobile-hint').textContent=tr('tech.mobile.pathHint');root.querySelector('#techMobilePoints').textContent=tr('tech.mobile.points',{count:getPoints()});
    family.replaceChildren(...groups.map(value=>{const button=document.createElement('button');button.type='button';button.className='tech-family-tab';button.dataset.family=value;button.setAttribute('aria-pressed',String(value===group));button.setAttribute('aria-label',groupName(value));button.title=groupName(value);const icon=document.createElement('span'),name=document.createElement('span');icon.textContent=icons[value];icon.setAttribute('aria-hidden','true');name.textContent=tr('tech.mobile.short.'+value);button.append(icon,name);button.onclick=()=>{onSelect(records.find(r=>r.group===value).id,false);family.querySelector('[data-family="'+value+'"]')?.focus({preventScroll:true});};return button;}));
    const oldScroll=oldGroup===group?tree.scrollTop:0;drawTree(entries());tree.scrollTop=saved?.tree??oldScroll;showDetail(chosen);if(saved)content.scrollTop=saved.detail;drawLinks(changed&&!saved);
    if(focusKey&&!focused.isConnected)root.querySelector('['+focusKey+'="'+focusValue+'"]')?.focus({preventScroll:true});
  }
  const resize=()=>drawLinks();window.addEventListener('resize',resize);
  return{render,focusSelection(){tree.querySelector('[aria-pressed=true]')?.focus({preventScroll:true});},dispose(){cancelAnimationFrame(frame);window.removeEventListener('resize',resize);restore();}};
}
