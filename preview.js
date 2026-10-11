// BOUNKO owns scenarios and popup lifetime; the embedded game owns all combat.
const ring=Array.from({length:6},(_,i)=>({x:Math.cos(i*Math.PI/3)*180,y:Math.sin(i*Math.PI/3)*180}));
export const previewScenarios=Object.freeze({
  laserBloom:{seed:82741,endTick:240,targets:[{x:150,y:0},{x:300,y:-78},{x:450,y:-156},{x:290,y:130}],camera:{x:190,y:-70,width:900,height:600}},
  storm:{seed:82741,endTick:240,targets:ring,camera:{x:0,y:0,width:680,height:600}},
  chainDrive:{seed:82741,endTick:240,targets:ring,camera:{x:0,y:0,width:680,height:600}},
  elasticBlast:{seed:82741,endTick:240,targets:ring,camera:{x:0,y:0,width:680,height:600}}
});
export function previewId(search){const id=new URLSearchParams(search).get('preview');return Object.hasOwn(previewScenarios,id)?id:null;}
export function previewOpponent(){const intent={target:null,targetUnit:null,attack:false,navigation:{x:0,y:0}};return {intent(unit){intent.target=unit.body.position;return intent;}};}
export function createPreviewHost({translate,pause,resume}){
  const modal=document.getElementById('previewPanel'),viewport=document.getElementById('previewViewport'),toggle=document.getElementById('previewToggle'),replay=document.getElementById('previewReplay'),close=document.getElementById('previewClose'),repeat=document.getElementById('previewRepeat'),status=document.getElementById('previewStatus');
  let frame=null,id=null,animation=0,focus=null,scroll=[],inert=[],ended=false,mountedAt=0;
  const api=()=>frame?.contentWindow?.__bloomImpulse;
  const active=()=>!modal.hidden;
  function destroyFrame(){cancelAnimationFrame(animation);animation=0;api()?.dispose();frame?.remove();frame=null;}
  function observe(){if(!active())return;const scene=api()?.preview?.snapshot();if(!scene&&performance.now()-mountedAt>15000){status.textContent=translate('preview.failed');return;}if(scene){toggle.disabled=false;toggle.textContent=translate(scene.ended?'preview.replay':scene.paused?'preview.play':'preview.pause');status.textContent=translate(scene.ended?'preview.complete':scene.paused?'preview.paused':'preview.playing');if(scene.ended&&!ended){ended=true;if(repeat.checked){mount();return;}}}animation=requestAnimationFrame(observe);}
  function mount(){destroyFrame();mountedAt=performance.now();ended=false;toggle.disabled=true;status.textContent=translate('preview.loading');frame=document.createElement('iframe');frame.title=translate('preview.title',{name:translate('ultimate.'+id+'.name')});frame.tabIndex=-1;frame.allow='autoplay';frame.src=new URL('?preview='+encodeURIComponent(id),window.location.href).href;
    viewport.replaceChildren(frame);observe();}
  function open(skill,button){if(!Object.hasOwn(previewScenarios,skill)||active())return;id=skill;focus=button||document.activeElement;scroll=[...document.querySelectorAll('#techViewport,#techScroll,.ultimate-dialog')].map(el=>[el,el.scrollLeft,el.scrollTop]);inert=[...document.body.children].filter(el=>el!==modal&&el.tagName!=='SCRIPT').map(el=>[el,el.inert]);pause();for(const [el]of inert)el.inert=true;document.getElementById('previewTitle').textContent=translate('preview.title',{name:translate('ultimate.'+id+'.name')});modal.hidden=false;modal.setAttribute('aria-hidden','false');repeat.checked=true;mount();close.focus({preventScroll:true});}
  function shut(){if(!active())return;destroyFrame();modal.hidden=true;modal.setAttribute('aria-hidden','true');for(const [el,value]of inert)el.inert=value;inert=[];for(const [el,x,y]of scroll){el.scrollLeft=x;el.scrollTop=y;}focus?.focus({preventScroll:true});resume();}
  toggle.onclick=()=>{const child=api()?.preview;if(child){const scene=child.snapshot();if(scene.ended)mount();else child.setPaused(!scene.paused);}};
  replay.onclick=mount;close.onclick=shut;modal.onclick=event=>{if(event.target===modal)shut();};
  document.addEventListener('keydown',event=>{if(!active())return;if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();shut();}else if(event.key==='Tab'){const buttons=[...modal.querySelectorAll('button:not(:disabled),input')],first=buttons[0],last=buttons.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}},true);
  return {open,close:shut,get active(){return active();}};
}

// Milliseconds describe cuts, real commands and presentation; no alternate combat renderer.
export const introScenes=Object.freeze([
  {seed:28101,copy:'breakthrough',camera:{x:0,y:-65,width:400,height:650,follow:true},targets:[{x:0,y:-190},...Array.from({length:7},(_,i)=>({x:Math.cos(i*Math.PI*2/7)*155,y:Math.sin(i*Math.PI*2/7)*155}))]},
  {seed:28102,copy:'combo',camera:{x:0,y:-45,width:400,height:650,follow:true},targets:Array.from({length:10},(_,i)=>({x:Math.cos(i*Math.PI/5)*190,y:Math.sin(i*Math.PI/5)*190,hp:38}))},
  {seed:28103,copy:'laser',laser:true,camera:{x:-25,y:-175,width:370,height:700},targets:[{x:0,y:-130,hp:2500},{x:-78,y:-260,hp:2500},{x:-156,y:-390,hp:2500},{x:115,y:-260,hp:2500}]},
  {seed:28104,copy:'pets',pets:true,camera:{x:0,y:-80,width:420,height:700,follow:true},targets:[{x:0,y:-180,type:'pillbug',hp:2500},{x:-120,y:-210,type:'rogue',hp:2500},{x:130,y:-220,hp:2500},{x:0,y:160,hp:2500}]},
  {seed:28105,copy:'final',camera:{x:0,y:0,width:370,height:700},targets:[]}
]);
export const introTimeline=Object.freeze([
  {atMs:0,chapter:0},{atMs:180,action:'attack'},{atMs:1800,action:'attack'},
  {atMs:4000,chapter:1},{atMs:4200,action:'attack'},{atMs:5500,action:'attack'},{atMs:6800,action:'attack'},{atMs:8100,action:'attack'},{atMs:9400,action:'attack'},
  {atMs:10000,chapter:2},{atMs:10800,action:'laser'},{atMs:13400,action:'laser'},{atMs:16000,action:'laser'},
  {atMs:18000,chapter:3},{atMs:18400,action:'attack'},{atMs:20000,action:'attack'},{atMs:21800,action:'attack'},{atMs:23200,action:'attack'},
  {atMs:24000,chapter:4}
]);
export function createIntroHost({translate,pause,resume,play}){
  const $=id=>document.getElementById(id),modal=$('introPanel'),viewport=$('introViewport'),sound=$('introSound'),copy=$('introCopy'),sub=$('introSub');
  let frame=null,animation=0,focus=null,inert=[],mountedAt=0,soundEnabled=false,chapter=-1;
  const api=()=>frame?.contentWindow?.__bloomImpulse;
  const active=()=>!modal.hidden;
  function destroy(){cancelAnimationFrame(animation);animation=0;api()?.dispose();frame?.remove();frame=null;}
  function setCopy(scene){if(chapter===scene.chapter)return;chapter=scene.chapter;const key=introScenes[chapter].copy;copy.textContent=translate('intro.'+key);sub.textContent=translate('intro.'+key+'Sub');modal.dataset.chapter=key;}
  function observe(){if(!active())return;const scene=api()?.intro?.snapshot();
    if(scene){setCopy(scene);$('introProgress').firstElementChild.style.width=Math.min(100,scene.timeMs/280)+'%';$('introTime').textContent=Math.floor(scene.timeMs/1000)+' / 28';sound.disabled=scene.ended;}
    else if(performance.now()-mountedAt>15000)sub.textContent=translate('intro.failed');
    animation=requestAnimationFrame(observe);
  }
  function mount(){destroy();chapter=-1;soundEnabled=false;sound.disabled=false;sound.textContent=translate('intro.soundOn');sound.setAttribute('aria-pressed','false');copy.textContent='BOUNKO';sub.textContent=translate('intro.loading');$('introProgress').firstElementChild.style.width='0%';$('introTime').textContent='0 / 28';mountedAt=performance.now();
    frame=document.createElement('iframe');frame.title=translate('intro.open');frame.tabIndex=-1;frame.allow='autoplay';frame.src=new URL('?intro=1',location.href).href;viewport.replaceChildren(frame);observe();
  }
  function shut({start=false}={}){if(!active())return;destroy();modal.hidden=true;modal.setAttribute('aria-hidden','true');for(const [el,value]of inert)el.inert=value;inert=[];resume();if(start)play();else focus?.focus({preventScroll:true});}
  function open(){if(active())return;focus=document.activeElement;pause();inert=[...document.body.children].filter(el=>el!==modal&&el.tagName!=='SCRIPT').map(el=>[el,el.inert]);for(const [el]of inert)el.inert=true;modal.hidden=false;modal.setAttribute('aria-hidden','false');mount();$('introClose').focus({preventScroll:true});}
  sound.onclick=async()=>{const child=api()?.intro;if(!child)return;const enabled=!soundEnabled;if(await child.setSound(enabled)){if(!active())return;soundEnabled=enabled;sound.textContent=translate(enabled?'intro.soundOff':'intro.soundOn');sound.setAttribute('aria-pressed',String(enabled));}};
  $('introReplay').onclick=mount;$('introClose').onclick=()=>shut();$('introSkip').onclick=()=>shut();$('introPlay').onclick=()=>shut({start:true});
  document.addEventListener('keydown',event=>{if(!active())return;if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();shut();}else if(event.key==='Tab'){const buttons=[...modal.querySelectorAll('button:not(:disabled)')],first=buttons[0],last=buttons.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}},true);
  return {open,close:shut,get active(){return active();}};
}
