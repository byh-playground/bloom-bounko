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
