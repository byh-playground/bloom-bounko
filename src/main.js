
import {createPlayerPresentation,facePlayer,rollPlayer,impactPlayer,updatePlayerPresentation,playerVectorState} from '../player-presentation.js';
import {createVectorActors} from '../vector-actors.js';
import {loadVectorAssets} from '../vector-assets-runtime.js';
import {VECTOR_ASSET_MANIFEST} from '../vector-assets.manifest.js';
import {createPresentationView} from '../presentation-view.js';
import {ThemeProgress} from '../theme-progress.js';
import {createTechView} from '../tech-view.js';
import {ultimateConfig,UltimateLoadout,UltimateRunner,drawUltimate,beamWidth,beamIntersects} from '../ultimates.js';
import {previewScenarios,previewId,previewOpponent,createPreviewHost,createGuideDemo,createIntroHost,introScenes,scenarioDefinition} from '../preview.js';
const previewSkill=previewId(location.search),previewScenario=previewScenarios[previewSkill];
const introScene=new URLSearchParams(location.search).get('intro')==='1',isolatedScene=!!previewSkill||introScene;
if(isolatedScene)document.body.classList.add('preview-scene');
if(introScene)document.body.classList.add('intro-scene');
if(previewScenario?.tutorial){document.body.classList.add('guide-scene');document.body.dataset.guideScene=previewScenario.tutorial;}
import {t as tr,language,setLanguage,onLanguageChanged,translateDocument,localizedList,message,messageText,number,percent} from '../i18n.js';


const KIT = 'https://cdn.jsdelivr.net/gh/byh-playground/bloom-gamekit@b83464e445efaf86d66499859d3d05463df2b22a/';
const KIT_VERSION = '0.26.6';
const KIT_SOURCE_COMMIT = '88630ef4dea7fd3a7fd7aad22090fe74cb3a6fbc';
const KIT_MANIFEST_SHA256 = 'bb92d60e2f7f84397d9055f990ba99d6a4d61da2bf0c053acf90bf42dc379e53';
const KIT_INTERPOLATION_SHA256 = 'acad7ad93615633609a62e484bff918980fc84282840db9b5cd108e8f5bb133a';
const KIT_VECTOR_ASSETS_SHA256 = 'de7093c51d5ffd80d6bd716a0023a9b78586a1a9b10d607eb730109ba1af694c';
const KIT_RENDERING_SHA256 = 'dac868f1efd9eb8e12b5ae9874813e9944fe3e106eb2d6044856cc09f83c8835';
const KIT_INPUT_SHA256 = 'a969755a39702723b35b6a1503e9b2e53a431ea91845017474c979752fdfb51f';
const KIT_SIMLOOP_SHA256 = 'c25a8f7f4999e4fe8beb6b08167fa4d0934c34098db2bf912335e81db53c4ef8';
const KIT_CAMERA_SHA256 = '99c1be43b6a38945028d029a5ecc594f7ff6dfc71075305264930748cafe88b6';
const KIT_NAVIGATION_SHA256 = '2c8e12432f6eae5472418d80898c93af32f5b14dce8217f6fa75bd198893b417';
const KIT_SCENARIO_SHA256 = 'b21a2be85b497588589c796f8e95f932c464474cc4ea3f703a8718e96a9946ce';
const KIT_AUDIO_SHA256 = 'f792c0b56b4829d20dfecb03f087bc435e377d9e772a7c5caa3611afef281d20';
const DIAGNOSTICS = 'https://cdn.jsdelivr.net/gh/byh-playground/bloom-gamekit@b83464e445efaf86d66499859d3d05463df2b22a/debug-tools.js';
const DIAGNOSTICS_SHA256 = 'b2abc40a6e5ca59b0b24b6c7fefa7492ea13b17686da86f61a8fff16be146ac5';
const VECTOR_LOADER = 'https://cdn.jsdelivr.net/gh/byh-playground/bloom-gamekit@b83464e445efaf86d66499859d3d05463df2b22a/vector-assets-loader.js';
const VECTOR_LOADER_SHA256 = 'a9d9eaa61d891fb1dd9d7d8ac9d9781fe2545cc2a7f8ede6202556c2a7a2f48f';
const VECTOR_LOADER_MANIFEST_SHA256 = 'bb92d60e2f7f84397d9055f990ba99d6a4d61da2bf0c053acf90bf42dc379e53';
const BM_KIT = 'https://cdn.jsdelivr.net/gh/byh-playground/bloom-gamekit@da38ad1de0a074731c5231b923c9b4c989874be6/';
const BM_KIT_VERSION = '0.37.1';
const BM_SHA256 = '2f601a8a7a48d4211f5a1eb34ea6780a40e6eb646182af48fb786097c22c3a2a';
const BM_IMA_SHA256 = '3264388b815eb1af0e0839fbcb0d837e7a7b527d66c7639100123fadd3e31a28';
const VERSION = '0.23.9', BUILD_ID = '20261029T-gamekit-v0.26.6-b83464e';
const $ = id => document.getElementById(id);
document.querySelectorAll('[data-game-version]').forEach(el=>el.textContent='v'+VERSION);
const loadtext = $('loadtext');translateDocument();document.title=tr('app.title');$('languageSelect').value=language();$('languageSelect').disabled=true;
let runtimePhase='libraries';
let diagnostics=null,copyDiagnosticFn=null,diagnosticCleanup=()=>{},runtimeLoop=null,runtimeFatal=false,runtimeReleaseInput=()=>{},runtimeStateSnapshot=()=>({phase:runtimePhase});
const diagnosticContext=()=>{
  try{
    const s=runtimeStateSnapshot(),boss=s.boss;
    return `phase=${s.phase??'unknown'} mode=${s.mode??'unknown'} tick=${s.tick??0} timeMs=${s.timeMs??0} stage=${s.stage??0} stagePhase=${s.stagePhase??'unknown'} waveKills=${s.waveKills??0} boss=${boss?.state??'none'} bossHp=${boss?.hp??'none'} bossPattern=${boss?.pattern??'none'} hp=${s.hp??0} units=${s.units??0} seed=${s.seed??0}`.slice(0,300);
  }catch{return `phase=${runtimePhase}`;}
};
const haltForRuntimeError=()=>{
  if(runtimeFatal)return;
  runtimeFatal=true;
  try{runtimeLoop?.stop();}catch{}
  try{runtimeReleaseInput();}catch{}
  const panel=$('fatalError');if(!panel)return;
  $('fatalErrorReport').value=diagnostics?.format?.()??'';
  panel.hidden=false;
  if(!panel.dataset.open){panel.dataset.open='true';$('fatalErrorCopy').focus({preventScroll:true});}
};
const recordGlobalRuntimeError=record=>{
  if(runtimeFatal)return;
  try{diagnostics?.report('Runtime state at failure',{kind:'game-state',visibility:'fatal',origin:record?.kind??'global',cause:diagnosticContext()});}catch{}
  haltForRuntimeError();
};
const recordLoopRuntimeError=error=>{
  if(runtimeFatal)return;
  try{diagnostics?.report(error,{kind:'game-loop-exception',visibility:'fatal',origin:runtimePhase,cause:diagnosticContext()});}catch{}
  haltForRuntimeError();
};
const fatalReport=$('fatalErrorReport'),fatalStatus=$('fatalErrorCopyStatus');
$('fatalErrorCopy').addEventListener('click',async()=>{
  const report=diagnostics?.format?.()??fatalReport.value;
  try{
    const result=copyDiagnosticFn?await copyDiagnosticFn(report,{clipboard:navigator.clipboard,textarea:fatalReport}):(fatalReport.value=report,fatalReport.focus(),fatalReport.select(),{copied:false,method:'selection'});
    fatalStatus.textContent=result.copied?tr('runtime.exception.copied'):tr('runtime.exception.manualCopy');
  }catch{fatalReport.value=report;fatalReport.focus();fatalReport.select();fatalStatus.textContent=tr('runtime.exception.manualCopy');}
});
$('fatalErrorReload').addEventListener('click',()=>location.reload());
$('fatalError').addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();return;}
  if(event.key!=='Tab')return;
  const focusable=[$('fatalErrorReport'),$('fatalErrorCopy'),$('fatalErrorReload')],index=focusable.indexOf(document.activeElement);
  if(index<0){event.preventDefault();focusable[event.shiftKey?focusable.length-1:0].focus();return;}
  if(event.shiftKey&&index===0){event.preventDefault();focusable[focusable.length-1].focus();}
  else if(!event.shiftKey&&index===focusable.length-1){event.preventDefault();focusable[0].focus();}
});
const ERROR = error => {
  console.error(error);
  const message=String(error.message||error).replace(/[<>]/g,'');
  loadtext.textContent=tr(runtimePhase==='libraries'?'runtime.phrase.26':'runtime.phrase.27',{v0:message});
};
try {
  const {DiagnosticRing,copyDiagnostic}=await import(DIAGNOSTICS);
  diagnostics=new DiagnosticRing({capacity:20,release:BUILD_ID});
  copyDiagnosticFn=copyDiagnostic;
  diagnosticCleanup=diagnostics.installGlobal(window,{onReport:recordGlobalRuntimeError});
  if (!window.Matter) throw new Error(tr("runtime.1"));
  const [{WebGLDevice,VectorContext,PrimitivePainter}, {createVectorActor}, {createVectorAssetLoader}, {ActionState,createDOMInput}, {createLoop}, {petConfig,CompanionCollection,CompanionRoster,companionCapacity,companionPresentation,patternAngle}, {audioConfig,AudioPlayer}, {volume,snapshotVolumes,contactWindow,filterMatterVolumes,sweepVerticalContacts,groundArc,stepArc,DeathReason,hostile,receiveHit,receiveHeal,combatConfig,collisionDamage,ChargePool,UnitStatus,elementConfig,effectiveArmor,damageAfterArmor,mixin,Evasive,eliteEvasionConfig}, {enemyConfig,enemyClasses,enemyWave,enemyRefillWave,pickRefillSpecies,species,speciesConfig,bossSpecies,bossConfig}, {EnemyController,PetController,SummonController}, {CameraViewport,OrthographicProjection}, {RewardDrops,dropConfig}, {createNavigation}, {createScenario}, {RenderObject,PresentationRuntime}] = await Promise.all([
    import(KIT+'rendering.js'),import(KIT+'vector-assets.js'),import(VECTOR_LOADER),import(KIT+'input.js'),import(KIT+'simloop.js'),import('../pets.js'),import('../audio.js'),import('../abilities.js'),import('../enemies.js'),import('../controllers.js'),import(KIT+'camera.js'),import('../drops.js'),import(KIT+'navigation.js'),import(KIT+'scenario.js'),import(KIT+'interpolation.js')
  ]);
  runtimePhase='initialization';
  const vectorAssetLoader=createVectorAssetLoader({fetch:window.fetch.bind(window),maxEntries:VECTOR_ASSET_MANIFEST.length});
  const VECTOR_ASSETS=await loadVectorAssets({loader:vectorAssetLoader,manifest:VECTOR_ASSET_MANIFEST,baseUrl:document.baseURI,maxBytes:64*1024});
  const M = window.Matter;
  const sfx=new AudioPlayer(isolatedScene?{...audioConfig,storageKey:null}:audioConfig);
  const previewAudio=previewSkill&&window.parent!==window?window.parent.__bloomImpulse?.getAudio():null;
  if(introScene)sfx.setMuted(true);
  if(previewAudio){sfx.setVolume(previewAudio.volume);sfx.setMuted(previewAudio.muted);for(const [category,value]of Object.entries(previewAudio.categoryVolumes))sfx.setCategoryVolume(category,value);}
  let menuRouter=null,introHost=null,introChapter=0,introDashPending=false,introMetrics=[];
  let demoPressUntil=0,demoTap=null,guideDemo=null,previewHost=null,scenarioRunner=null,previewOrigin=null,previewHitCount=0;
  function playImpact(speed,sound=null){return sfx.play(sound||(speed<500?'impactLight':speed<1000?'impactMedium':'impactHeavy'),Math.min(1,.4+speed/1600));}
  async function playUiSound(){if(await sfx.unlock())sfx.play('ui');}
  // Single source of truth: capability-based, hierarchical configuration.
  const C = {
    world:{width:2500,height:1750}, sim:{tps:60}, player:{radius:16,height:32,mass:2,facingTurnRateRadPerSec:Math.PI*3},
    audio:audioConfig,pets:petConfig,stats:{petSlots:petConfig.slots.base,attackPower:100,criticalChance:0,criticalDamage:2,armorPenFlat:0,armorPenPercent:0,maxHp:200,armor:0,healthRegen:0,lifeSteal:0,magnetRange:2.5},enemy:{radius:23,count:13,chaseRadius:690,stopDistance:29,chaseResponse:6,
      knockbackMultiplier:1,projectileDamageMultiplier:1,evasion:structuredClone(eliteEvasionConfig),types:enemyConfig},
    drops:dropConfig,ultimates:ultimateConfig,
    spatial:{groundZ:0,actorHeightRadiusRate:2,projectileHeightRadiusRate:2,shadowHeight:14,sweep:{insetPx:1}},
    physics:{restitution:.86,frictionAir:.008,maxSpeed:1900},
    revive:{healthRate:.5,invulnerableMs:2000},
    evade:{maxCharges:2,rechargeMs:500,durationMs:580,invulnerableMs:100,impulseSpeed:1020,decayPerSec:6.5,particleRateMs:22,
      capacityTierRate:.50,rechargeReductionTierRate:.20,distanceTierRate:.10,projectileWindowBonusRate:.50,hitRechargeRate:.20},
    stage:{initialKills:7,killsPerStage:4,bossEvery:3,mapEvery:3,transitionMs:1500,bossWarningMs:750,entryNoticeMs:1100,bossNoticeMs:1250,noticePriority:{stage:1,boss:3},worldRadius:550,radiusGrowth:.22,maxRadius:1600,initialPopulation:4,populationPerStage:1,maxEnemies:82,enemySpawnMinGap:98,spawnSafeRadius:285,obstaclePer100k:.93,maxObstacles:72,connectivityStep:82,connectivityMin:.92},
    boss:bossConfig,
    shadow:{ammo:{maxCharges:2,rechargeMs:1500,capacityTierRate:.50,rechargeReductionTierRate:.20},
      orbit:{radius:34,angularSpeedRadPerSec:.95,phaseRad:-Math.PI/2,alignMs:80},
      recoil:{speed:45,decayPerSec:18,durationMs:120},radius:6,initialSpeed:150,acceleration:2500,range:680,minDashDistance:28,contactPushSpeed:300,contactPushControlMs:500},
    dash:{minSpeed:250,maxSpeed:880,acceleration:850,rearmMinMs:150,rearmMaxMs:400,rearmSpeed:700,inputBufferMs:450,flightMinMs:500,flightMaxMs:2400,flightMarginMs:300,missClosingSpeed:45},damage:combatConfig,
    timing:{bulletStart:.80,bulletScale:.32,coyoteMs:150,coyoteStartCharge:.94,coyoteEndCharge:.70,shadowHitstopMs:50,hitstopMs:50},
    chain:{enabled:false,followKill:false,minTriggerCharge:.50,targetMinGap:58,recoverMinMs:100,maxWaitMs:300,autoDashGoldDelayMs:30,ricochetRangeRate:.60},
    augment:{
      spore:{enabled:false,radius:130,damageRate:.30},momentum:{enabled:false,perCombo:.07,maxMultiplier:1.28},
      motion:{reboundImpulse:140,propulsionMultiplier:1.32},
      impact:{pushRadius:145,pushStrength:220,splitDamageRate:.17,finishRadius:160,finishDamageRate:.24}
    },
    element:{...elementConfig,lightning:{markDurationMs:2400,nextHitBonusRate:.25,relayRadiusPct:.48,arcDurationMs:220},
      fire:{durationMs:3000,damageRate:.30,tickIntervalMs:200,spreadPowerRate:.70,spreadDurationRate:.85}},
    aim:{previewRange:900,swapHysteresis:1.14,stroke:.92,pulseSpeed:1.4},
    fx:{targetCompression:true,linkPulse:true,intensity:1,reticleScale:1,pulseSpeed:1,
      fire:{flames:4,heightRadiusRate:1.70,widthRadiusRate:.45,flickerHz:5,
        emberIntervalMs:95,emberLifetimeMs:420,emberRiseRadiusRate:2.3,
        emberCapacity:96,transferCapacity:16,transferDurationMs:320,
        maxTransferGapPx:18,opacity:.91}},
    // Visual-only hierarchy. No physics, target, damage or AI consumer may use these values.
    visual:{
      ammoOrbit:{shardRadius:3.8,minShardRadius:.9,flightRadius:7,flightGrowMs:80},
      launch:{squashRate:.10,exhaustParticles:4,exhaustSpeed:110,exhaustLifeMs:90,trailLength:24,trailLifeMs:90},
      missRecovery:{pulseMs:180,hintMs:2600},
      scenery:{densityRate:.84,focusRadius:88,focusFeather:112,focusMinOpacity:.54,bossOpacityRate:.78},
      terrain:{gridOpacityRate:.55,edgeOpacityRate:.71,outlineWidth:2.4,accentOpacityRate:.63},
      actors:{enemySilhouettePadding:4.2,enemySilhouetteOpacity:.73,playerSilhouetteRadius:23.5,playerSilhouetteOpacity:.88},
      threats:{underlayWidth:3.3,underlayOpacity:.72,bossLineWidth:2.7,bossLockWidth:3.6,enemyLineWidth:2.0}
    },
    debug:{show:false},camera:{halfLife:.075,shake:{maxPx:5,
      launch:{amplitudePx:1.8,durationMs:85,cycles:1.5},hit:{amplitudePx:4,durationMs:150,cycles:2,minSpeed:950}}},particles:{capacity:340}
  };
  const wikiDefaultConfig=JSON.parse(JSON.stringify(C));
  const cameraView=new CameraViewport({projection:new OrthographicProjection({degrees:90})});
  let cameraShake=null;
  const World = M.Composite, Body=M.Body, Bodies=M.Bodies, Events=M.Events, Engine=M.Engine;
  let adsBm=null,adsReady=false,reviveUsed=false,reviveGraceUntilMs=0;
  let engine, player, playerUnit, unitsById=new Map(), unitsByBody=new Map(), enemies, enemiesById, obstacles, projectiles=[],projectileById=new Map(),enemyShots=0,enemyAttacks=0,enemyPushes=0, shadow=null, mode='READY', phase='LOBBY', modeUntil=0,health=100,hitstopLeftMs=0,dashCharge=0,dashMotion=null,dashFlight=null,dashHits=new Set(),damageTaken=0,healingDone=0,launchCount=0,manualLaunchCount=0,echoLaunchCount=0,chainLaunchCount=0;
  const attackAmmo=new ChargePool(C.shadow.ammo);
  let ammoOrbitPhases=[],pendingLaunch=null,launchRecoil=null;
  let missRecoveryActive=false,missRecoveryPulseUntilMs=0,missRecoveryHintUntilMs=0,missRecoveryEvents=0,missRecoverySerial=-1,missHintShown=false;
  let timeMs=0, tick=0, combo=0, hits=0,kills=0, toastUntil=0, toastText='', toastColor='#f1c77a', lastComboHitAtMs=-1e6;
  let nextEnemyId=1, randomSeed=82741, aimTargetId=null, previewTargetId=null, attackOrigin=null, trailClock=0, dashStartedAtMs=0, recoverStartedAtMs=0, readyFlashUntilMs=0, bufferedIntent=null, bufferedUntilMs=0, frames=0, frameFps=0, frameFpsStart=performance.now(),  criticalHits=0, lastHit=null;
  let pending=[], particles=[], particleCursor=0, fxRings=[], renderCamera=cameraView.camera, cameraZoom=1;
  let lightningArcs=[],fireEmbers=[],fireTransfers=[],fireFxSerial=0,elementalEvents={ignite:0,spread:0,conduct:0,conductSpread:0,conductConsumed:0,conductDamage:0,arc:0,burnDamage:0}, chainActive=false, chainStarts=0, chainEnds=0, autoChainReady=false, autoDashPlanned=false, dashAutomatic=false, dashPerfect=false, automaticDashes=0, manualPerfectHits=0, autoChainWins=0, autoChainRolls=0, chainTargetId=null;
  let evadeCharges=2,evadeRefillAtMs=0,evadeMotion=null,evadeStartedAtMs=-1e9,evadePreviousPosition=null,evadeActions=0;
  let attackDashSerial=0,evadeHitRechargeUsed=false,evadeHitRechargeEvents=0,evadeHitRechargeProgress=0,evadeLastHitRecharge=null;
  let stage={index:1,phase:'WAVE',waveKills:0,killTarget:7,startedAtMs:0,transitionUntilMs:0,boss:null,patternLog:[],themeId:'garden',layoutId:'open',radius:550,targetPopulation:4,mapTier:0,mapStart:1},arenaVertices=[],boundaryWalls=[],bossObstaclesBroken=0;
  runtimeStateSnapshot=()=>({runtimePhase,phase,mode,tick,timeMs,stage:stage.index,stagePhase:stage.phase,waveKills:stage.waveKills,boss:stage.boss?{state:stage.boss.state??null,hp:stage.boss.hp??null,pattern:stage.boss.pattern??null}:null,hp:health,units:unitsById.size,seed:randomSeed});
   let terrainDecor=[],terrainChannels=[],generationStats={retries:0,connectivity:1,clearLane:0,obstacles:0},stageHistory=[],stageBasePlayableArea=0,bossVisits={};
  // The current Definition owns saved investments. Keep kills and valid choices;
  // omit removed IDs/invalid prerequisites so their spent points are refunded.
  // No old-ID aliases or translation path; only this product-owned key persists.
  const LEGACY_TECH_KEY='bloom-impulse-tech-v1';
  const PREVIOUS_TECH_KEY='bloom-impulse-progression-v2';
  const TECH_SAVE_KEY='bloom-impulse-progression-v3';
  if(!isolatedScene)try { localStorage.removeItem(LEGACY_TECH_KEY); localStorage.removeItem(PREVIOUS_TECH_KEY); } catch(e) {}
  const TECH_NODES=Object.freeze([
    {id:'echo',branch:'chain',get name(){return tr("runtime.2");},symbol:'↻',cost:1,requires:[],get desc(){return tr("runtime.3");}},
    {id:'autoChain',branch:'chain',get name(){return tr("runtime.4");},symbol:'◉',cost:2,requires:['echo'],get desc(){return tr("runtime.5");}},
    {id:'ricochet',branch:'chain',get name(){return tr("runtime.6");},symbol:'⤳',cost:1,requires:['autoChain'],get desc(){return tr("runtime.7");}},
    {id:'relay',branch:'chain',get name(){return tr("runtime.8");},symbol:'∞',cost:1,requires:['ricochet'],get desc(){return tr("runtime.9");}},
    {id:'evadeCapacity1',branch:'evade',get name(){return tr("runtime.10");},symbol:'▰',cost:1,requires:[],get desc(){return tr("runtime.11");}},
    {id:'evadeCapacity2',branch:'evade',get name(){return tr("runtime.12");},symbol:'▣',cost:1,requires:['evadeCapacity1'],get desc(){return tr("runtime.13");}},
    {id:'evadeHitRecharge',branch:'evade',get name(){return tr("runtime.14");},symbol:'✷',cost:1,requires:['evadeCapacity1'],get desc(){return tr("runtime.15");}},
    {id:'evadeRecharge1',branch:'evade',get name(){return tr("runtime.16");},symbol:'◐',cost:1,requires:[],get desc(){return tr("runtime.17");}},
    {id:'evadeRecharge2',branch:'evade',get name(){return tr("runtime.18");},symbol:'◕',cost:1,requires:['evadeRecharge1'],get desc(){return tr("runtime.19");}},
    {id:'evadeWindow',branch:'evade',get name(){return tr("runtime.20");},symbol:'◇',cost:1,requires:['evadeRecharge1'],get desc(){return tr("runtime.21");}},
    {id:'evadeDistance1',branch:'evade',get name(){return tr("runtime.22");},symbol:'↗',cost:1,requires:[],get desc(){return tr("runtime.23");}},
    {id:'evadeDistance2',branch:'evade',get name(){return tr("runtime.24");},symbol:'➤',cost:1,requires:['evadeDistance1'],get desc(){return tr("runtime.25");}},
    {id:'shadowCapacity1',branch:'shadow',get name(){return tr("runtime.26");},symbol:'▰',cost:1,requires:[],get desc(){return tr("runtime.27");}},
    {id:'shadowCapacity2',branch:'shadow',get name(){return tr("runtime.28");},symbol:'▣',cost:1,requires:['shadowCapacity1'],get desc(){return tr("runtime.29");}},
    {id:'shadowRecharge1',branch:'shadow',get name(){return tr("runtime.30");},symbol:'◐',cost:1,requires:[],get desc(){return tr("runtime.31");}},
    {id:'shadowRecharge2',branch:'shadow',get name(){return tr("runtime.32");},symbol:'◕',cost:1,requires:['shadowRecharge1'],get desc(){return tr("runtime.33");}},
    {id:'momentum',branch:'motion',get name(){return tr("runtime.34");},symbol:'↗',cost:1,requires:[],get desc(){return tr("runtime.35");}},
    {id:'rebound',branch:'motion',get name(){return tr("runtime.36");},symbol:'⤴',cost:1,requires:['momentum'],get desc(){return tr("runtime.37");}},
    {id:'propulsion',branch:'motion',get name(){return tr("runtime.38");},symbol:'➤',cost:1,requires:['rebound'],get desc(){return tr("runtime.39");}},
    {id:'spore',branch:'impact',get name(){return tr("runtime.40");},symbol:'✳',cost:1,requires:[],get desc(){return tr("runtime.41");}},
    {id:'shockPush',branch:'impact',get name(){return tr("runtime.42");},symbol:'◎',cost:1,requires:['spore'],get desc(){return tr("runtime.43");}},
    {id:'sporeSplit',branch:'impact',get name(){return tr("runtime.44");},symbol:'❖',cost:1,requires:['shockPush'],get desc(){return tr("runtime.45");}},
    {id:'finisher',branch:'impact',get name(){return tr("runtime.46");},symbol:'✺',cost:1,requires:['sporeSplit'],get desc(){return tr("runtime.47");}},
    {id:'conduct',branch:'lightning',get name(){return tr("runtime.54");},symbol:'ϟ',cost:1,requires:[],get desc(){return tr("runtime.55");}},
    {id:'relayArc',branch:'lightning',get name(){return tr("runtime.56");},symbol:'↯',cost:1,requires:['conduct'],get desc(){return tr("runtime.57");}},
    {id:'ignite',branch:'fire',get name(){return tr("runtime.58");},symbol:'♨',cost:1,requires:[],get desc(){return tr("runtime.59");}},
    {id:'spreadFlame',branch:'fire',get name(){return tr("runtime.60");},symbol:'🔥',cost:1,requires:['ignite'],get desc(){return tr("runtime.61");}},
    {id:'coldTouch',branch:'frost',get name(){return tr('element.coldTouch.name');},symbol:'❄',cost:1,requires:[],get desc(){return tr('element.coldTouch.desc');}},
    {id:'freezeTouch',branch:'frost',get name(){return tr('element.freezeTouch.name');},symbol:'❆',cost:1,requires:["coldTouch"],get desc(){return tr('element.freezeTouch.desc');}},
    {id:'iceShatter',branch:'frost',get name(){return tr('element.iceShatter.name');},symbol:'✧',cost:1,requires:["freezeTouch"],get desc(){return tr('element.iceShatter.desc');}},
    {id:'acidTouch',branch:'acid',get name(){return tr('element.acidTouch.name');},symbol:'◉',cost:1,requires:[],get desc(){return tr('element.acidTouch.desc');}},
    {id:'acidPool',branch:'acid',get name(){return tr('element.acidPool.name');},symbol:'≈',cost:1,requires:["acidTouch"],get desc(){return tr('element.acidPool.desc');}},
    {id:'acidSpread',branch:'acid',get name(){return tr('element.acidSpread.name');},symbol:'☣',cost:1,requires:["acidPool"],get desc(){return tr('element.acidSpread.desc');}},
    ...Object.entries(C.ultimates.skills).map(([id,skill])=>({id,branch:skill.branch??'ultimate',get name(){return tr((C.ultimates.skills[id]?'ultimate.':'element.')+id+'.name');},symbol:skill.symbol,cost:skill.cost,requires:skill.requires,lane:skill.lane,rowOffset:skill.rowOffset||0,get desc(){return ultimateDescription(id);}})),
    {id:'ultimateSlot2',branch:'ultimate',lane:0,rowOffset:1,get name(){return tr('ultimate.slot2');},symbol:'▰',cost:1,requires:['shadowCapacity1'],get desc(){return tr('ultimate.slot2desc');}},
    {id:'ultimateSlot3',branch:'ultimate',lane:0,rowOffset:1,get name(){return tr('ultimate.slot3');},symbol:'▣',cost:2,requires:['ultimateSlot2','shadowCapacity2'],get desc(){return tr('ultimate.slot3desc');}}
  ]);
  // Percent-only upgrades. A percentage-point bonus is used when a baseline
  // chance is zero; base physical values remain in a single CONFIG owner.
  const STAT_UPGRADES=Object.freeze([
    localizedList(['attackPower',()=>tr("runtime.62"),'+6%',.06,'relative']),
    localizedList(['criticalChance',()=>tr("runtime.63"),'+2%p',.02,'point']),
    localizedList(['criticalDamage',()=>tr("runtime.64"),'+6%p',.06,'point']),
    localizedList(['armorPenFlat',()=>tr("runtime.65"),()=>tr("runtime.66"),.03,'attack']),
    localizedList(['armorPenPercent',()=>tr("runtime.67"),'+3%p',.03,'point']),
    localizedList(['maxHp',()=>tr("runtime.68"),'+6%',.06,'relative']),
    localizedList(['armor',()=>tr("runtime.69"),()=>tr("runtime.70"),.04,'attack']),
    localizedList(['lifeSteal',()=>tr("runtime.71"),()=>tr("runtime.72"),.02,'point',15]),
    localizedList(['healthRegen',()=>tr("runtime.73"),()=>tr("runtime.74"),.003,'health']),
    localizedList(['petSlots',()=>tr("runtime.75"),()=>tr("runtime.76"),1,'slot',petConfig.slots.maxLevel]),
    localizedList(['magnetRange',()=>tr("runtime.77"),()=>tr("runtime.78"),.10,'relative'])
  ]);
  const BASE_STATS=Object.freeze({...C.stats});
  const BASE_EVADE=Object.freeze({...C.evade});
  const BASE_ATTACK_AMMO=Object.freeze({...C.shadow.ammo});
  const STAT_REQUIREMENTS={criticalDamage:{criticalChance:1}};
  const statPathReady=(id,levels)=>Object.entries(STAT_REQUIREMENTS[id]??{}).every(([parent,level])=>levels[parent]>=level);
  function progressionLevel(k){return Math.floor(Math.sqrt(k+1));}
  function loadTech(){if(introScene)return {kills:0,defeats:0,unlocked:new Set(['echo','autoChain','ricochet','relay','shadowCapacity1','shadowCapacity2','shadowRecharge1','shadowRecharge2','momentum','spore','conduct','relayArc','ignite','spreadFlame','laserBloom','chainDrive','elasticBlast']),statLevels:Object.fromEntries(STAT_UPGRADES.map(([key])=>[key,key==='petSlots'?1:0])),ultimates:{slots:[]},companions:{inventory:[{id:1,speciesId:'lancer',kind:'pet',grade:2},{id:2,speciesId:'brute',kind:'pet',grade:2}],slots:[null,null],nextId:3}};if(previewSkill)return {kills:0,defeats:0,unlocked:new Set(previewScenario.tech||[previewSkill]),statLevels:Object.fromEntries(STAT_UPGRADES.map(([key])=>[key,0])),ultimates:{slots:C.ultimates.skills[previewSkill]?[previewSkill]:[]}};try{const p=JSON.parse(localStorage.getItem(TECH_SAVE_KEY)||'null');
    if(p&&Number.isSafeInteger(p.kills)&&p.kills>=0&&Array.isArray(p.unlocked)&&p.statLevels&&typeof p.statLevels==='object'){
      const selected=new Set();for(const node of TECH_NODES)if(p.unlocked.includes(node.id)&&node.requires.every(id=>selected.has(id)))selected.add(node.id);
      const levels={};for(const [key,,,,,maxLevel=500] of STAT_UPGRADES)levels[key]=Math.max(0,Math.min(maxLevel,Number.isSafeInteger(p.statLevels[key])?p.statLevels[key]:0));
      for(const [key] of STAT_UPGRADES)if(!statPathReady(key,levels))levels[key]=0;
      const spent=TECH_NODES.reduce((sum,n)=>sum+(selected.has(n.id)?n.cost:0),0)+Object.values(levels).reduce((sum,n)=>sum+n,0);
      const budget=progressionLevel(p.kills)-1;let used=spent;
      // Revalidate against the current Definition; discard unaffordable terminal nodes without resetting growth.
      if(used>budget)for(const node of [...TECH_NODES].reverse())if(selected.has(node.id)){selected.delete(node.id);used-=node.cost;if(used<=budget)break;}
      if(used<=budget)return {kills:p.kills,defeats:Number.isSafeInteger(p.defeats)&&p.defeats>=p.kills?p.defeats:p.kills,unlocked:selected,statLevels:levels,companions:p.companions,pendingDrops:p.pendingDrops,ultimates:p.ultimates,themeProgress:p.themeProgress};
    }
  }catch(e){}return {kills:0,defeats:0,unlocked:new Set(),statLevels:Object.fromEntries(STAT_UPGRADES.map(([key])=>[key,0]))};}
  const tech=loadTech();
  const ultimateLoadout=new UltimateLoadout(C.ultimates,tech.ultimates);delete tech.ultimates;
  const ultimateRunner=new UltimateRunner(ultimateLoadout,{
    valid:()=>phase==='PLAYING'&&mode!=='DEAD'&&(stage.phase==='WAVE'||stage.phase==='BOSS'),
    position:()=>player.position,targets:ultimateTargets,target:id=>unitsById.get(id),safePoint:ultimateSafePoint,
    consume:consumeUltimateCosts,begin:beginUltimate,end:endUltimate,
    move:(goal,dtMs)=>{const p=player.position;setSpeed(player,(goal.x-p.x)*1000/dtMs,(goal.y-p.y)*1000/dtMs);},
    attack:ultimateAttack,contact:ultimateContact,pose:updateUltimateGeometry,hitstop:ms=>{hitstopLeftMs=Math.max(hitstopLeftMs,ms);},sound:id=>sfx.start(id),shake:shakeCamera
  });
  const companions=new CompanionCollection(petConfig,tech.companions,tech.statLevels.petSlots);delete tech.companions;
  const lootDrops=new RewardDrops(C.drops,tech.pendingDrops,id=>!!species[id]);delete tech.pendingDrops;
  let claimingDrops=false,pickupFeedback={growth:0,eggs:0,nextAtMs:0};
  const magnetRadius=()=>2*(player?.circleRadius??C.player.radius)*C.stats.magnetRange;
  const hasTech=id=>tech.unlocked.has(id);
  const techSpent=()=>TECH_NODES.reduce((sum,n)=>sum+(hasTech(n.id)?n.cost:0),0)+Object.values(tech.statLevels).reduce((sum,n)=>sum+n,0);
  const availableTech=()=>Math.max(0,progressionLevel(tech.kills)-1-techSpent());
  function persistTech(){if(isolatedScene||claimingDrops)return;try{localStorage.setItem(TECH_SAVE_KEY,JSON.stringify({kills:tech.kills,defeats:tech.defeats,unlocked:[...tech.unlocked],statLevels:tech.statLevels,companions:companions.snapshot(),pendingDrops:lootDrops.snapshot(),ultimates:ultimateLoadout.save(),themeProgress:themeProgress.snapshot()}));}catch(e){}}
  function applyTech(){ultimateLoadout.configure(tech.unlocked);applyEvadeTech();applyAttackAmmoTech();C.chain.enabled=hasTech('echo');C.chain.followKill=hasTech('relay');
    C.augment.spore.enabled=hasTech('spore');C.augment.momentum.enabled=hasTech('momentum');
    for(const [key,,label,rate,kind] of STAT_UPGRADES){const n=tech.statLevels[key];const base=BASE_STATS[key];
      C.stats[key]=kind==='slot'?companionCapacity(petConfig,n):kind==='relative'?base*(1+n*rate):kind==='point'?base+n*rate:
        kind==='attack'?base+BASE_STATS.attackPower*n*rate:base+BASE_STATS.maxHp*n*rate;
      if(key==='criticalChance'||key==='armorPenPercent')C.stats[key]=Math.min(.95,C.stats[key]);
    }
    companions.setSlotLevel(tech.statLevels.petSlots);
  }
  function applyAttackAmmoTech(){
    const tiers=(a,b)=>Number(hasTech(a))+Number(hasTech(b));
    C.shadow.ammo.maxCharges=Math.round(BASE_ATTACK_AMMO.maxCharges*(1+BASE_ATTACK_AMMO.capacityTierRate*tiers('shadowCapacity1','shadowCapacity2')));
    C.shadow.ammo.rechargeMs=BASE_ATTACK_AMMO.rechargeMs*(1-BASE_ATTACK_AMMO.rechargeReductionTierRate*tiers('shadowRecharge1','shadowRecharge2'));
    attackAmmo.configure(C.shadow.ammo);syncAmmoOrbitSlots();
  }
  function evadeRefillProgress(){return evadeRefillAtMs?clamp(1-(evadeRefillAtMs-timeMs)/C.evade.rechargeMs,0,1):0;}
  function applyEvadeTech(){
    const oldMax=C.evade.maxCharges,progress=evadeRefillProgress();
    const tiers=(a,b)=>Number(hasTech(a))+Number(hasTech(b));
    C.evade.maxCharges=Math.round(BASE_EVADE.maxCharges*(1+BASE_EVADE.capacityTierRate*tiers('evadeCapacity1','evadeCapacity2')));
    C.evade.rechargeMs=BASE_EVADE.rechargeMs*(1-BASE_EVADE.rechargeReductionTierRate*tiers('evadeRecharge1','evadeRecharge2'));
    C.evade.impulseSpeed=BASE_EVADE.impulseSpeed*(1+BASE_EVADE.distanceTierRate*tiers('evadeDistance1','evadeDistance2'));
    C.evade.invulnerableMs=BASE_EVADE.invulnerableMs*(1+(hasTech('evadeWindow')?BASE_EVADE.projectileWindowBonusRate:0));
    // Capacity additions are ready immediately; speed changes preserve the current progress fraction.
    evadeCharges=clamp(evadeCharges+C.evade.maxCharges-oldMax,0,C.evade.maxCharges);
    evadeRefillAtMs=evadeCharges<C.evade.maxCharges?timeMs+(1-progress)*C.evade.rechargeMs:0;
  }
  applyTech();persistTech(); // Save only the current Definition; removed investments become available points.
  function recordGrowth(amount){const level=progressionLevel(tech.kills);tech.kills+=amount;if(progressionLevel(tech.kills)>level)sfx.play('level');}
  function learnTech(id){const node=TECH_NODES.find(n=>n.id===id);if(!node||hasTech(id)||!node.requires.every(hasTech)||availableTech()<node.cost)return false;
    tech.unlocked.add(id);sfx.play('upgrade');applyTech();persistTech();updateTechUi();ringFx(player.position.x,player.position.y,100,[1,.86,.48,1],680);burst(player.position.x,player.position.y,180,22,[1,.86,.48,1]);return true;}
  function learnStat(id){const spec=STAT_UPGRADES.find(s=>s[0]===id);if(!spec||tech.statLevels[id]>=(spec[5]??Infinity)||!statPathReady(id,tech.statLevels)||availableTech()<1)return false;
    tech.statLevels[id]++;sfx.play('upgrade');applyTech();persistTech();updateTechUi();return true;}
  function refundTech(){tech.unlocked.clear();for(const key of Object.keys(tech.statLevels))tech.statLevels[key]=0;
    endChain();applyTech();persistTech();updateTechUi();}
  function endChain(){
    if(chainActive)chainEnds++;
    chainActive=false;autoChainReady=false;autoDashPlanned=false;chainTargetId=null;
  }
  function prepareChainFollowup(targetId,automatic){
    // A hit may continue only with a target and a charge for its next shadow. Reloading alone never starts a chain.
    if(targetId==null||attackAmmo.charges<1){endChain();return;}
    chainTargetId=targetId;
    if(automatic){autoChainReady=chainActive;if(autoChainReady)autoChainWins++;}
    else{chainActive=true;autoChainReady=true;chainStarts++;autoChainWins++;sfx.play('chainStart');
      ringFx(player.position.x,player.position.y,49,[1,.86,.50,1],350);}
  }
  function ricochetTarget(from){const r=C.shadow.range*C.chain.ricochetRangeRate;let chosen=null,best=Infinity;
    for(const e of enemies){if(!e.alive||e.id===from.id)continue;const d=Math.hypot(e.body.position.x-from.body.position.x,e.body.position.y-from.body.position.y);
      // Only an explicitly learned conductive mark alters target ordering.
      const conductive=hasTech('conduct')&&e.conductUntilMs>timeMs;
      const score=d*(conductive?.48:1);
      if(d<r&&score<best){chosen=e;best=score;}}
    return chosen;}
  function followTargetAfterHit(e,killed){
    if(hasTech('ricochet')){const other=ricochetTarget(e);if(other)return other.id;}
    if(!killed&&hasTech('autoChain'))return e.id;
    if(killed&&hasTech('relay'))return 'any';
    return null;
  }
  const canvas=$('game'), vectorDevice=new WebGLDevice(canvas,{alpha:true,antialias:true,depth:true,stencil:false}), context=new VectorContext(vectorDevice), paint=new PrimitivePainter(context), vectorActors=createVectorActors({context,createVectorActor,compiledAssets:VECTOR_ASSETS}), actions=new ActionState();
  const sampleFire={}, evadeSamples={up:{},left:{},down:{},right:{}};
  const gameUiTargets='input, textarea, select, button, a[href], [contenteditable]:not([contenteditable="false"]), [data-gamekit-ui]';
  const gameInputPanels=['settings','techPanel','guidePanel','wikiPanel','petPanel','ultimatePanel','themeStartPanel'].map($);
  function gameplayInputBlocked(){return runtimeFatal||phase!=='PLAYING'||document.hidden||(scenarioRunner&&scenarioRunner.state!=='playing')||previewHost?.active||introHost?.active||gameInputPanels.some(panel=>panel.classList.contains('open'));}
  function gameplayInputExcluded(target,event){return isolatedScene||gameplayInputBlocked()||event.ctrlKey||event.metaKey||event.altKey||event.isComposing||
    (event.composedPath?.()??[target]).some(node=>node?.closest?.(gameUiTargets));}
  const input=createDOMInput({ target:canvas,state:actions,
    keys:{Space:'fire',Enter:'fire',KeyW:'evadeUp',KeyA:'evadeLeft',KeyS:'evadeDown',KeyD:'evadeRight'},
    excludeTarget:gameplayInputExcluded,
    pointerButtons:{0:'pointer'},touchAction:'none',gestures:{tap:'tap',tapMs:330,dragSlop:18},
    onGesture:e=>{if(e.type==='tap')pending.push({kind:'point',x:e.x,y:e.y});},
    onRelease:()=>{pending.length=0;bufferedIntent=null;bufferedUntilMs=0;actions.consume();}
  });
  runtimeReleaseInput=()=>{input.releaseAll();pending.length=0;};
  function onGameplayFocus(event){if(event.target!==canvas)input.releaseAll('focusin');}
  document.addEventListener('focusin',onGameplayFocus);
  function rand(){randomSeed=(Math.imul(randomSeed,1664525)+1013904223)>>>0;return randomSeed/4294967296;}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function norm(x,y){const n=Math.hypot(x,y);return n>1e-6?{x:x/n,y:y/n}:{x:1,y:0};}
  function speedOf(body){const v=Body.getVelocity(body);return {x:v.x*60,y:v.y*60};}
  function writeSpeed(body,vx,vy){Body.setVelocity(body,{x:vx/60,y:vy/60});}
  // Replacing total velocity retires an old recoil component; additive impulses preserve it.
  function setSpeed(body,vx,vy){if(body===player)launchRecoil=null;writeSpeed(body,vx,vy);}
  /** Impulse contract: kg·(world-pixels/second). Adds to existing velocity; not Matter applyForce. */
  function applyImpulse(body,j){const v=speedOf(body);writeSpeed(body,v.x+j.x/body.mass,v.y+j.y/body.mass);}
  const colors={clear:[.038,.073,.087,1],grid:[.12,.22,.23,.45],halo:[.2,.95,.7,.10],
    rock:[.12,.27,.29,1],rockOutline:[.26,.52,.48,.65],enemy:[.92,.43,.34,1],enemyCore:[1,.71,.48,1],
    hpBack:[.14,.19,.20,1],hp:[.98,.77,.40,1],player:[.30,.90,.65,1],playerCore:[.86,1,.78,1],
    shadow:[.42,.90,1,1],guide:[.43,.92,.84,.35],trail:[.25,.93,.70,.33]};
  function enemyDef(e){return e.config||C.enemy.types[e.type];}
  // Shared operation pools: themes and bosses are DATA recipes, never copies of a generator or AI.
  // New definitions registered here automatically join guaranteed debut and later stage selection.
  const THEME_POOL=Object.freeze({
    garden:{id:'garden',get name(){return tr("runtime.79");},unlockStage:1,weight:1,
      colors:{clear:[.038,.090,.074,1],grid:[.12,.24,.17,.38],edge:[.47,.85,.57,.92],rock:[.26,.39,.25,1],outline:[.54,.75,.44,1],glow:[.40,.78,.49,.30]},
      visual:{decorationOpacity:.60,decorationSaturation:.54,decorationColorWeight:.84},
      obstacle:{minSides:4,maxSides:7,radiusMin:34,radiusMax:66},decoration:'flowers',bosses:['petalPredator','hivecarrier','clawhunter'],
      layouts:[
        {id:'meadow',get name(){return tr("runtime.80");},ops:[['scatter',.60],['clusters',.55]]},
        {id:'wreath',get name(){return tr("runtime.81");},ops:[['ring',.95],['clusters',.24]]},
        {id:'grove',get name(){return tr("runtime.82");},ops:[['clusters',1.1],['scatter',.24]]}
      ]},
    cave:{id:'cave',get name(){return tr("runtime.83");},unlockStage:4,weight:1,
      colors:{clear:[.054,.052,.096,1],grid:[.16,.15,.25,.33],edge:[.51,.61,.94,.93],rock:[.27,.26,.41,1],outline:[.57,.53,.81,1],glow:[.50,.38,.86,.38]},
      visual:{decorationOpacity:.57,decorationSaturation:.54,decorationColorWeight:.82},
      obstacle:{minSides:5,maxSides:8,radiusMin:39,radiusMax:85},decoration:'mushrooms',bosses:['elasticCap','deathworm'],
      layouts:[
        {id:'chambers',get name(){return tr("runtime.84");},ops:[['rooms',1],['scatter',.4]]},
        {id:'cavernRing',get name(){return tr("runtime.85");},ops:[['ring',.9],['rooms',.55]]},
        {id:'ridges',get name(){return tr("runtime.86");},ops:[['ridges',1],['scatter',.35]]}
      ]},
    frostGarden:{id:'frostGarden',get name(){return tr('theme.frostGarden');},unlockStage:7,weight:1,enemies:['rootstalker','deepthorn','sprout','scout'],
      colors:{clear:[.055,.079,.09,1],grid:[.15,.20,.23,.28],edge:[.58,.76,.83,.88],rock:[.27,.34,.36,1],outline:[.51,.64,.67,1],glow:[.65,.78,.81,.20]},visual:{decorationOpacity:.40,decorationSaturation:.25,decorationColorWeight:.70},
      obstacle:{minSides:4,maxSides:7,radiusMin:34,radiusMax:66},decoration:'frost',bosses:['elasticCap','deathworm'],layouts:[{id:'frostBeds',get name(){return tr('theme.frostBeds');},ops:[['clusters',.65],['scatter',.5]]}]},
    acidMarsh:{id:'acidMarsh',get name(){return tr('theme.acidMarsh');},unlockStage:10,weight:1,enemies:['sporemoth','fireant','puff','pillbug'],
      colors:{clear:[.067,.079,.048,1],grid:[.19,.22,.13,.25],edge:[.69,.76,.43,.85],rock:[.32,.35,.23,1],outline:[.56,.59,.36,1],glow:[.66,.72,.33,.18]},visual:{decorationOpacity:.35,decorationSaturation:.22,decorationColorWeight:.72},
      obstacle:{minSides:5,maxSides:8,radiusMin:34,radiusMax:72},decoration:'marsh',bosses:['petalPredator','hivecarrier'],layouts:[{id:'marshPools',get name(){return tr('theme.marshPools');},ops:[['rooms',.6],['scatter',.5]]}]}
  });
  const themeProgress=new ThemeProgress(Object.values(THEME_POOL),tech.themeProgress);delete tech.themeProgress;
  const BOSS_POOL=bossSpecies;
  function themeForStage(index){
    index=mapStartAtStage(index);
    if(stage.mapStart===index&&THEME_POOL[stage.themeId])return THEME_POOL[stage.themeId];
    const all=Object.values(THEME_POOL).sort((a,b)=>a.unlockStage-b.unlockStage);
    const debut=all.find(t=>t.unlockStage===index);if(debut)return debut;
    const possible=all.filter(t=>t.unlockStage<=index);if(possible.length===1)return possible[0];
    // Choose once at the map-segment boundary, independent from combat/VFX RNG.
    const roll=((Math.imul(index+5917,2654435761)>>>0)/4294967296);
    const prev=stage.themeId,weighted=possible.map(t=>({t,w:t.weight*(t.id===prev?.25:1)}));
    const total=weighted.reduce((acc,x)=>acc+x.w,0);let r=roll*total;
    for(const item of weighted){r-=item.w;if(r<=0)return item.t;}
    return possible[possible.length-1];
  }
  function bossParameters(b){return b.bossParams||C.boss;}
  function liveSummons(ownerId=null){return [...unitsById.values()].filter(e=>e.alive&&e.isSummon&&(ownerId===null||e.summonerId===ownerId));}
  function clearSummons(){for(const e of liveSummons())e.die(DeathReason.cleanup);}

  // COREBOUND combat adapter: source stats own actual damage/healing/defense; VFX reads the outcome.
  const outgoingDamage=(raw,target,stats=C.stats)=>damageAfterArmor(raw,target,stats);

  function isCritical(){return C.stats.criticalChance>0&&rand()<C.stats.criticalChance;}

  let releaseVolumeFilter=null,volumeEvents=[];
  function recordVolume(kind,e,data={}){if(volumeEvents.length>=160)volumeEvents.shift();volumeEvents.push({kind,tick,timeMs,id:e?.id,type:e?.type,...data});}
  function acceptVolumeContact(a,b){
    // Committed ground AOE never detonates on an actor during flight, even at low Z.
    const shot=projectileById.get(a.id)||projectileById.get(b.id);
    if(shot?.arc)return false;
    const hit=contactWindow(a,b,!!(a.circleRadius&&b.circleRadius));
    if(!hit&&a.circleRadius&&b.circleRadius){const e=enemiesById.get(a.id)||enemiesById.get(b.id);if(e?.spatial?.feetZ>C.player.height&&e.lastHeightPassTick!==tick){e.lastHeightPassTick=tick;recordVolume('height-pass',e,{feetZ:e.spatial.feetZ,other:a===e.body?b.label:a.label});}}
    return !!hit;
  }
  function sweepVerticalMotion(){sweepVerticalContacts(M,World.allBodies(engine.world),(body,other,fraction)=>recordVolume('swept-volume',enemiesById.get(body.id),{fraction,feetZ:body.plugin.volume.feetZ,other:other.label}),C.spatial.sweep);}
  function clearCapabilityPath(start,aim,radius){
    if(!boundaryPoint(start.x,start.y,radius)||!boundaryPoint(aim.x,aim.y,radius))return false;
    const dx=aim.x-start.x,dy=aim.y-start.y,length=dx*dx+dy*dy;
    for(const o of obstacles){const p=o.body.position,t=length?clamp(((p.x-start.x)*dx+(p.y-start.y)*dy)/length,0,1):0;
      if(Math.hypot(p.x-start.x-dx*t,p.y-start.y-dy*t)<o.r+radius+3)return false;}
    return true;
  }
  const combatWorld={targets:()=>[playerUnit,...unitsById.values()].filter(u=>u?.alive),anchor:()=>player.position};
  function removeUnit(e){for(const child of liveSummons(e.unitId))child.die(DeathReason.cleanup);if(unitsById.get(e.unitId)===e)unitsById.delete(e.unitId);unitsByBody.delete(e.body.id);enemiesById.delete(e.body.id);World.remove(engine.world,e.body);if(e.deathReason===DeathReason.cleanup)for(const shot of [...projectiles])if(shot.sourceUnitId===e.unitId)removeProjectile(shot);}
  function damageUnit(target,payload,source){const damage=receiveHit(target,payload,source,timeMs);
    if(damage>0){source.combatEvents?.hit?.(target,payload,damage);
      if(payload.kind!=='status'&&payload.kind!=='shatter'){
        const playerAcid=(source.attacker||source)===playerUnit&&hasTech('acidTouch');if(playerAcid)target.status?.acid(target,source,C.element.acid);
        if(playerAcid&&hasTech('acidPool')||source.config?.elementHit?.acid&&(source.attacker||source).unlocked?.('acidPool'))createAcidPool(source,target.body.position,playerAcid&&hasTech('acidSpread')?C.element.acid.spreadRadius:C.element.acid.radius);
      }
    }return damage;}
  let acidPools=[];
  function createAcidPool(source,point,radius=C.element.acid.radius,options={}){const c={...C.element.acid,...options};if(acidPools.length>=c.maxPools)acidPools.shift();
    const owner={...source,attacker:source.attacker||source,alive:true,faction:source.faction,unitId:source.unitId,config:{...source.config}};
    acidPools.push({x:point.x,y:point.y,radius,leftMs:c.poolMs,durationMs:c.poolMs,intervalMs:c.intervalMs,skillId:c.skillId??null,pulseMs:c.intervalMs,source:owner,damage:(source.config.attackPower||source.config.damage)*c.powerRate});recordVolume('acid-pool',source,{radius,x:point.x,y:point.y});
  }
  function updateAcidPools(ms){const c=C.element.acid;for(const pool of acidPools){const active=Math.min(ms,pool.leftMs);pool.leftMs-=active;pool.pulseMs-=active;
    while(pool.pulseMs<=1e-7){for(const target of combatWorld.targets())if(hostile(pool.source,target)&&(target.spatial?.feetZ||0)<=24&&Math.hypot(target.body.position.x-pool.x,target.body.position.y-pool.y)<=pool.radius+target.config.radius){const damage=damageUnit(target,{raw:pool.damage,stats:pool.source.config,kind:'status'},pool.source);if(damage>0){target.status.acid(target,pool.source,c);if(pool.skillId)ultimateRunner.damage+=damage;}recordVolume('acid-tick',pool.source,{targetId:target.unitId,damage});}pool.pulseMs+=pool.intervalMs;}}
    acidPools=acidPools.filter(p=>p.leftMs>0);
  }
  function projectileDodged(target){return target===playerUnit&&timeMs-evadeStartedAtMs<C.evade.invulnerableMs;}
  function capabilityArea(source,c,{projectile=false}={}){const p=source.body.position,blast={position:p,positionPrev:p,plugin:{volume:{feetZ:0,previousFeetZ:0,height:c.height,motion:p}},circleRadius:c.radius};
    for(const target of combatWorld.targets()){if(!hostile(source,target)||projectile&&projectileDodged(target))continue;const b=target.body;
      if(contactWindow(blast,b,false,1,1)&&Math.hypot(b.position.x-p.x,b.position.y-p.y)<=c.radius+b.circleRadius){
        const damage=damageUnit(target,{raw:c.damage,stats:source.config,kind:'area'},source);if(c.skillId&&damage>0){ultimateRunner.damage+=damage;recordVolume('skill-impact',target,{skillId:c.skillId,damage});if(c.ignite)applyIgnite(target,damage);}if(target.alive){const n=norm(b.position.x-p.x,b.position.y-p.y);applyImpulse(b,{x:n.x*c.push*b.mass,y:n.y*c.push*b.mass});}}}
  }
  function addShot(source,{radius,height=radius*2,speed=0,angle=0,damage,push,lifeMs,arc=null,impactRadius,impactHeight,boss=false,kind='projectile',color=null,retrieval=null,arm=0,impact=null}){
    const n={x:Math.cos(angle),y:Math.sin(angle)},p=source.body.position,x=p.x+n.x*(source.config.radius+radius+2),y=p.y+n.y*(source.config.radius+radius+2);
    const body=Bodies.circle(arc?arc.start.x:x,arc?arc.start.y:y,radius,{label:'projectile',isSensor:true,frictionAir:0,collisionFilter:{category:8,mask:arc?0:1|2|4|16}});
    volume(body,height,arc?.start.z||0);setSpeed(body,n.x*speed,n.y*speed);
    const shot={body,sourceUnitId:source.unitId,ownerId:source.unitId,faction:source.faction,payload:{raw:damage,stats:source.config,kind},
      source,damage,push,bornMs:timeMs,lifeMs,dirX:n.x,dirY:n.y,arc,impactRadius,impactHeight,boss,color,retrieval,arm,impact,trail:[],returning:false,finished:false};
    projectiles.push(shot);projectileById.set(body.id,shot);World.add(engine.world,body);enemyShots++;source.combatEvents?.ability?.();return shot;
  }
  const unitAdapter={
    time:()=>timeMs,evasionVelocity:e=>speedOf(e.body),evasionDash:()=>mode==='DASH'&&dashMotion?{active:true,serial:attackDashSerial,position:player.position,velocity:speedOf(player),radius:player.circleRadius}:null,evasionSide:chooseEvasionSide,evasionEvent,
    evasionImpulse(unit,side){const speed=unit.evasion.config.motion.impulseSpeed,v=speedOf(unit.body),delta=Math.max(0,speed-v.x*side.x-v.y*side.y);applyImpulse(unit.body,{x:side.x*delta*unit.body.mass,y:side.y*delta*unit.body.mass});},
    pathClear:clearCapabilityPath,
    freeze(e){setSpeed(e.body,0,0);if(e===playerUnit){dashMotion=null;evadeMotion=null;if(mode==='ALIGN'){setReadyState();endChain();}else cancelPendingLaunch();pending.length=0;bufferedIntent=null;bufferedUntilMs=0;}ringFx(e.body.position.x,e.body.position.y,e.config.radius+9,[.62,.91,1,.9],350);recordVolume('freeze',e);},
    groundAttack(e,c,aim){e.combatEvents?.ability?.();const p=e.body.position,fx=e.groundAttack.effects=(e.groundAttack.effects||[]).filter(v=>v.untilMs>timeMs);
      const spike=(x,y,size)=>{if(fx.length>=32)fx.shift();fx.push({x,y,size,untilMs:timeMs+420});};
      if(c.kind==='line'){const n={x:e.headingX,y:e.headingY},len=c.range;
        for(const target of combatWorld.targets()){if(!hostile(e,target)||(target.spatial?.feetZ||0)>c.height)continue;const b=target.body.position,t=clamp(((b.x-p.x)*n.x+(b.y-p.y)*n.y)/len,0,1);
          if(Math.hypot(b.x-p.x-n.x*len*t,b.y-p.y-n.y*len*t)<=c.width/2+target.config.radius&&clearCapabilityPath(p,b,2))damageUnit(target,{raw:c.damage,stats:e.config,kind:'area'},e);}
        for(let i=1;i<=8;i++){const x=p.x+n.x*len*i/8,y=p.y+n.y*len*i/8;spike(x,y,c.width*.35);burst(x,y,60,2,[.64,.91,1,.85]);ringFx(x,y,c.width*.4,[.6,.88,1,.7],280);}
      }else{spike(aim.x,aim.y,c.radius*.7);capabilityArea({...e,attacker:e,body:{position:aim}},{...c,push:c.push});ringFx(aim.x,aim.y,c.radius,[.68,.94,1,.95],400);burst(aim.x,aim.y,150,12,[.65,.91,1,.9]);}
      recordVolume('ground-'+c.kind,e,{aim:{...aim}});
    },
    coneBreath(e,c){const p=e.body.position,angle=Math.atan2(e.headingY,e.headingX);e.combatEvents?.ability?.();
      for(const target of combatWorld.targets()){if(!hostile(e,target)||(target.spatial?.feetZ||0)>c.height)continue;const b=target.body.position,dx=b.x-p.x,dy=b.y-p.y,d=Math.hypot(dx,dy),err=Math.atan2(Math.sin(Math.atan2(dy,dx)-angle),Math.cos(Math.atan2(dy,dx)-angle));
        if(d<=c.range+target.config.radius&&Math.abs(err)<=c.halfAngle+Math.asin(Math.min(1,target.config.radius/Math.max(1,d)))&&clearCapabilityPath(p,b,2))damageUnit(target,{raw:c.damage,stats:e.config,kind:'area'},e);}
      for(let i=0;i<8;i++){const a=angle+(rand()-.5)*c.halfAngle*2,d=c.range*(.25+rand()*.7);addParticle(p.x+Math.cos(a)*d,p.y+Math.sin(a)*d,Math.cos(a)*70,Math.sin(a)*70,350,4,[.70,.92,.35,.75]);}recordVolume('acid-breath',e);
    },
    participation(e,active){if(e.savedCollisionMask===undefined)e.savedCollisionMask=e.body.collisionFilter.mask;
      e.targetable=active;e.invulnerable=!active;e.body.collisionFilter.mask=active?e.savedCollisionMask:0;e.spatial.feetZ=active?0:-e.spatial.height-2;if(!active)setSpeed(e.body,0,0);},
    burrowAim(e,target,distance){const p=e.body.position,n=norm(target.x-p.x,target.y-p.y),length=Math.min(distance,Math.hypot(target.x-p.x,target.y-p.y));
      for(let i=0;i<9;i++){const d=length*(1-i/9),aim={x:p.x+n.x*d,y:p.y+n.y*d};
        if(boundaryPoint(aim.x,aim.y,e.config.radius+4)&&!obstacles.some(o=>Math.hypot(aim.x-o.body.position.x,aim.y-o.body.position.y)<o.r+e.config.radius+4))return aim;}
      return {...p};},
    capabilityFx(e,kind,c){const p=e.body.position;recordVolume(kind,e);
      if(kind==='burrow-trail'){burst(p.x,p.y,45,3,[.62,.43,.28,.55]);ringFx(p.x,p.y,20,[.60,.42,.24,.28],220);}},
    erupt(e,c){recordVolume('burrow-emerge',e,{x:e.body.position.x,y:e.body.position.y});capabilityArea(e,c);burst(e.body.position.x,e.body.position.y,150,12,[.75,.51,.35,.8]);ringFx(e.body.position.x,e.body.position.y,c.radius,[1,.68,.40,.85],390);sfx.play('spore');},
    summon(e,c,slot){if(liveSummons().length>=24)return null;
      const child=e.spawnSummon(e.body.position.x,e.body.position.y,c.speciesId);child.isSummon=true;child.summonerId=e.unitId;child.summoner=e;child.summonSlot=slot;
      child.controller=new SummonController(e);child.combatEvents=e.combatEvents;child.summonedAtMs=timeMs;child.summonExpiresAtMs=timeMs+c.lifetimeMs;child.summonGrowUntilMs=timeMs+c.growMs;
      this.deploy(child);recordVolume('summon-deploy',e,{childId:child.unitId,slot});e.combatEvents?.ability?.();sfx.play('bossSummon');return child;},
    deploy(e){const owner=e.summoner,p=owner.body.position,angle=Math.atan2(owner.headingY,owner.headingX)+(e.summonSlot%2?1:-1)*(e.summonSlot<2?1.1:2.0),d=owner.config.radius+e.config.radius+18;
      const goal={x:p.x+Math.cos(angle)*d,y:p.y+Math.sin(angle)*d},point=boundaryPoint(goal.x,goal.y,e.config.radius)&&!obstacles.some(o=>Math.hypot(goal.x-o.body.position.x,goal.y-o.body.position.y)<o.r+e.config.radius)?goal:this.burrowAim(e,goal,d);
      Body.setPosition(e.body,point);setSpeed(e.body,Math.cos(angle)*e.config.speed*.55,Math.sin(angle)*e.config.speed*.55);ringFx(point.x,point.y,18,[.94,.78,.30,.75],280);},
    dock(e,active){this.participation(e,!active);recordVolume(active?'summon-dock':'summon-relaunch',e,{ownerId:e.summonerId,hp:e.hp});
      const p=e.summoner.body.position;ringFx(p.x,p.y,e.summoner.config.radius+10,active?[.48,1,.72,.7]:[.94,.78,.3,.8],320);},
    hooks(e,aim,c){const p=e.body.position,n=norm(aim.x-p.x,aim.y-p.y),shots=[];
      for(let i=0;i<c.count;i++){const arm=c.count===1?(e.hook.casts%2?1:-1):(i?1:-1),start={x:p.x-n.y*e.config.radius*1.15*arm+n.x*e.config.radius*.36,y:p.y+n.x*e.config.radius*1.15*arm+n.y*e.config.radius*.36,z:10},
          target={x:aim.x-n.y*arm*8,y:aim.y+n.x*arm*8,z:0};
        const shot=addShot(e,{radius:c.radius,height:c.height,damage:c.damage,push:0,kind:'hook',color:[.94,.58,.28],arc:groundArc(start,target,c.travelMs,c.arcHeight),retrieval:{retractMs:c.retractMs,pullSpeed:c.pullSpeed},arm});
        shots.push(shot);}
      recordVolume('hook-launch',e,{aim:{...aim},height:c.arcHeight,count:shots.length});sfx.play('enemyShot');return shots;},
    removeShot:removeProjectile,

    brake(e,dt){if(timeMs<(e.shadowKnockbackUntilMs||0))return;const v=speedOf(e.body),q=Math.exp(-9*dt);setSpeed(e.body,v.x*q,v.y*q);},
    chase(e,dt,ctx){if(timeMs<(e.shadowKnockbackUntilMs||0)||e.evasion?.motion&&timeMs<e.evasion.motion.untilMs)return;const p=e.body.position,c=e.config,v=speedOf(e.body);
      if(c.navigation?.faceTarget&&ctx.target){const direction=norm(ctx.target.x-p.x,ctx.target.y-p.y);e.headingX=direction.x;e.headingY=direction.y;}
      const desired=ctx.navigation||{x:0,y:0},rate=e.status.movementRate,n={x:desired.x*rate,y:desired.y*rate},q=1-Math.exp(-(c.navigation?.response||C.enemy.chaseResponse)*dt);setSpeed(e.body,v.x+(n.x-v.x)*q,v.y+(n.y-v.y)*q);},
    moveBy(e,x,y){Body.setPosition(e.body,{x:e.body.position.x+x,y:e.body.position.y+y});},
    charge(e,speed){applyImpulse(e.body,{x:e.headingX*e.body.mass*speed*e.status.movementRate,y:e.headingY*e.body.mass*speed*e.status.movementRate});enemyAttacks++;sfx.play('enemyLunge');},
    damage:damageUnit,
    healed(e,amount){floatText(e.body.position.x,e.body.position.y-e.spatial.feetZ,'+'+formatCombatNumber(amount),[.33,1,.68,1]);},
    melee(e,target,c){const amount=damageUnit(target,{raw:c.damage,stats:e.config,kind:'melee'},e);recordVolume('melee-'+c.motion,e,{targetId:target.unitId,damage:amount});
      if(amount>0){if(c.push>0){const n=norm(target.body.position.x-e.body.position.x,target.body.position.y-e.body.position.y);applyImpulse(target.body,{x:n.x*c.push*target.body.mass,y:n.y*c.push*target.body.mass});}
        playImpact(c.damage*25,e.presentation.impactSound);}return amount;},
    beam(e,target,c,multiplier){const damage=damageUnit(target,{raw:c.dps*c.intervalMs/1000*multiplier,stats:e.config,kind:'beam',floating:true},e);
      e.combatEvents?.ability?.();recordVolume('sunbeam',e,{targetId:target.unitId,damage,focusMs:e.sunbeam.focusMs,beamStage:e.sunbeam.stage});},
    heal(e,target,amount,cost){e.heal.link={target,untilMs:timeMs+320};target.adapter?.healed?.(target,amount);e.combatEvents?.ability?.();recordVolume('heal',e,{targetId:target.unitId,healed:amount,cost});sfx.play('heal');},
    hurt(e,amount,source){if(previewSkill)previewHitCount++;floatText(e.body.position.x,e.body.position.y-e.spatial.feetZ,'-'+formatCombatNumber(amount,source.presentation?.hitText?.fractionDigits),[.62,.94,1,1],source.presentation?.hitText);e.combatEvents?.hurt?.(amount);},
    impact(e,target,amount){enemyPushes++;const n=norm(target.body.position.x-e.body.position.x,target.body.position.y-e.body.position.y);
      applyImpulse(target.body,{x:n.x*e.config.push*target.body.mass,y:n.y*e.config.push*target.body.mass});
      ringFx(e.body.position.x,e.body.position.y,35,[.66,.94,1,.8],300);playImpact(Math.hypot(e.pre.x,e.pre.y),e.presentation.impactSound);},
    notice(e,kind='prepare'){recordVolume(kind,e);sfx.play(kind==='launch'?'enemyLunge':'enemyNotice');if(kind==='launch')setSpeed(e.body,0,0);},
    land(e){recordVolume('land',e,{damage:0,x:e.body.position.x,y:e.body.position.y});ringFx(e.body.position.x,e.body.position.y,24,[.72,.88,.47,.6],250);},
    explode(e,c){e.combatEvents?.ability?.();recordVolume('self-destruct',e);capabilityArea(e,c);sfx.play('spore');ringFx(e.body.position.x,e.body.position.y,c.radius,[1,.62,.28,1],400);},
    retire(e){e.die(DeathReason.selfDestruct);},
    spikes(e,c,kind){recordVolume('spike-'+kind,e);sfx.play('enemyShot');for(let i=0;i<c.count;i++)addShot(e,{...c,angle:i*Math.PI*2/c.count,push:130});},
    projectile(e,c,index){const rupture=c.rupture&&e.unlocked('rupture')&&index%c.rupture.every===0?c.rupture:null;
      addShot(e,{...c,...(rupture?{damage:rupture.damage,push:rupture.push,impactRadius:rupture.radius,impactHeight:rupture.height,color:[1,.54,.26]}:{}),angle:Math.atan2(e.headingY,e.headingX)});
      if(rupture)recordVolume('rupture-shot',e);sfx.play('enemyShot');},
    bossStep:updateBoss,
    arcShot(e,aim,height,index){const c=e.arcFire.config.shot,p=e.body.position,a=index*Math.PI*.5,d=index?c.spreadRadius:0,target={x:aim.x+Math.cos(a)*d,y:aim.y+Math.sin(a)*d,z:0};
      if(!clearCapabilityPath(p,target,c.radius))return;
      addShot(e,{...c,arc:groundArc({...p,z:c.startZ},target,c.durationMs,height),impactRadius:c.impactRadius,impactHeight:c.impactHeight});
      recordVolume('arc-shot',e,{aim:target,height,abilityTimeMs:e.arcFire.clockMs});sfx.play('enemyShot');}
  };
  function projectileContact(shot,target){
    const source={...shot.source,attacker:shot.source,alive:true,faction:shot.faction,unitId:shot.sourceUnitId};
    if(!hostile(source,target))return false;
    if(shot.retrieval){
      const dodged=projectileDodged(target);
      const damage=dodged?0:damageUnit(target,shot.payload,source);
      if(damage>0&&target.alive){const p=source.body.position,t=target.body.position,n=norm(p.x-t.x,p.y-t.y);
        applyImpulse(target.body,{x:n.x*shot.retrieval.pullSpeed*target.body.mass,y:n.y*shot.retrieval.pullSpeed*target.body.mass});
        shot.source.hook.hits++;shot.captured=target;shot.source.combatEvents?.ability?.();}
      recordVolume('hook-hit',shot.source,{targetId:target.unitId,damage,z:shot.body.plugin.volume.feetZ});
      retractShot(shot);return true;
    }
    if(shot.impactRadius){removeProjectile(shot);resolveProjectileImpact(shot,source);}
    else if(target===playerUnit)hitProjectile(shot);
    else{const damage=damageUnit(target,shot.payload,source);if(shot.payload.kind==='ultimate')ultimateRunner.damage+=damage;removeProjectile(shot);}
    return true;
  }
  function resolveProjectileImpact(shot,source){const p=shot.body.position;
    capabilityArea({...source,body:shot.body},{radius:shot.impactRadius,height:shot.impactHeight,damage:shot.damage,push:shot.push,...shot.impact},{projectile:true});
    ringFx(p.x,p.y,shot.impactRadius,[...(shot.color||[1,.64,.32]),.9],360);sfx.play(shot.impact?.sound??'spore');
    if(shot.impact?.visual==='fire'){fireIgnitionFx(p.x,p.y,shot.impactRadius);burst(p.x,p.y,180,16,[1,.54,.18,1]);}
  }
  function retractShot(shot){if(shot.returning||shot.finished)return;
    const p=shot.body.position;shot.returning=true;
    shot.arc=groundArc({...p,z:shot.body.plugin.volume.feetZ},{...shot.source.body.position,z:10},shot.retrieval.retractMs,0);
    recordVolume('hook-retract',shot.source,{hit:!!shot.captured});
  }
  function stepArcShots(dt){for(const shot of [...projectiles]){if(!shot.arc)continue;
    if(shot.retrieval&&!shot.source.alive){removeProjectile(shot);continue;}
    if(shot.returning)Object.assign(shot.arc.aim,shot.source.body.position);
    const pose=stepArc(shot.arc,dt*1000),p=shot.body.position;
    if(!shot.retrieval&&!clearCapabilityPath(p,pose,shot.body.circleRadius)){recordVolume('arc-blocked',shot.source);removeProjectile(shot);continue;}
    Body.setPosition(shot.body,{x:pose.x,y:pose.y});shot.body.plugin.volume.feetZ=pose.z;if(shot.impact?.visual==='fire'){shot.trail.push({x:pose.x,y:pose.y-pose.z});if(shot.trail.length>6)shot.trail.shift();}
    if(shot.retrieval){
      if(!shot.returning){let target=null,first=Infinity;
        for(const unit of combatWorld.targets()){if(!hostile(shot.source,unit))continue;const window=contactWindow(shot.body,unit.body);
          if(window&&window[0]<first){target=unit;first=window[0];}}
        if(target){projectileContact(shot,target);continue;}
        if(shot.arc.finished)retractShot(shot);
      }else if(shot.arc.finished)removeProjectile(shot);
      continue;
    }
    if(shot.arc.finished){recordVolume('arc-impact',shot.source,{x:pose.x,y:pose.y,z:pose.z});removeProjectile(shot);
      resolveProjectileImpact(shot,{...shot.source,attacker:shot.source,alive:true});}
  }}
  function drawArcShot(shot){const p=shot.body.position,z=shot.body.plugin.volume.feetZ,a=shot.arc.aim;
    if(shot.retrieval){const owner=shot.source;if(!owner)return;const p0=owner.body.position,n=norm(owner.headingX,owner.headingY),s={x:p0.x-n.y*owner.config.radius*1.15*shot.arm+n.x*owner.config.radius*.36,y:p0.y+n.x*owner.config.radius*1.15*shot.arm+n.y*owner.config.radius*.36,z:10};
      paint.ellipse(p.x,p.y,9,4,[0,0,0,.4],10);
      paint.line(s.x,s.y-(s.z||0),p.x,p.y-z,1.6,[.98,.63,.31,.8]);
      if(shot.captured?.alive){const target=shot.captured.body;paint.line(p.x,p.y-z,target.position.x,target.position.y-(target.plugin.volume?.feetZ||0),2,[1,.66,.30,.85]);}
      const angle=Math.atan2(shot.arc.aim.y-p.y,shot.arc.aim.x-p.x),q=shot.body.circleRadius;
      paint.tri(p.x+Math.cos(angle)*q,p.y-z+Math.sin(angle)*q,p.x+Math.cos(angle+2.4)*q,p.y-z+Math.sin(angle+2.4)*q,p.x+Math.cos(angle-2.4)*q,p.y-z+Math.sin(angle-2.4)*q,[.94,.58,.28,1]);return;}

    if(shot.impact?.visual==='fire'){for(let i=1;i<shot.trail.length;i++){const a=shot.trail[i-1],b=shot.trail[i];paint.line(a.x,a.y,b.x,b.y,3+i,[1,.43,.12,i/shot.trail.length*.6]);}paint.ellipse(p.x,p.y-z,14,11,[1,.43,.10,.30],16);}
    paint.ellipse(p.x,p.y,8,4.5,[0,0,0,.5],12);
    drawArc(a.x,a.y,shot.impactRadius,0,Math.PI*2,24,1.7,[1,.58,.31,.65]);
    paint.ellipse(p.x,p.y-z,8,6,[1,.54,.25,1],12);paint.ellipse(p.x-2,p.y-z-2,3,3,[1,.91,.53,1],9);
  }

  const evasiveClasses=new Map();let enemySpawnOrdinal=0,evasionHintShown=false;
  let evasionMetrics={eligibleSpawns:0,eliteSpawns:0,predicted:0,attempt:0,success:0,failure:0,aborted:0};
  function evadeUnitClass(Base){if(!evasiveClasses.has(Base))evasiveClasses.set(Base,mixin(Base,Evasive));return evasiveClasses.get(Base);}
  function selectEvasionElite(){const c=C.enemy.evasion,offset=(stage.seed>>>0)%1024/1024,n=enemySpawnOrdinal++;evasionMetrics.eligibleSpawns++;
    return Math.floor((n+1)*c.selectionRate+offset)>Math.floor(n*c.selectionRate+offset);}
  function evasionSideClearance(unit,side){const c=unit.evasion.config.motion,start=unit.body.position,r=unit.body.circleRadius+c.clearancePadding;
    const clear=distance=>{const end={x:start.x+side.x*distance,y:start.y+side.y*distance};if(!clearCapabilityPath(start,end,r))return false;
      for(const other of unitsById.values()){if(other===unit||!other.alive||other.body.isSensor||!contactWindow(unit.body,other.body,false,1,1))continue;const p=other.body.position;
        if(distanceToSegment(p.x,p.y,start.x,start.y,end.x,end.y)<r+other.body.circleRadius)return false;}return true;};
    if(!clear(c.minClearance))return 0;let low=c.minClearance,high=c.maxSideDistance;for(let i=0;i<4;i++){const mid=(low+high)/2;if(clear(mid))low=mid;else high=mid;}return low;
  }
  function chooseEvasionSide(unit,threat){const a=threat.side,b={x:-a.x,y:-a.y},left=evasionSideClearance(unit,a),right=evasionSideClearance(unit,b);
    if(!left&&!right)return null;if(Math.abs(left-right)<1)return unit.unitId%2?a:b;return left>right?a:b;}
  function evasionEvent(unit,event,detail){if(event in evasionMetrics)evasionMetrics[event]++;if(event==='attempt'){sfx.play('eliteEvade');recordVolume('elite-evade',unit,{serial:detail.serial,timeToCollisionMs:detail.timeMs});}}
  function drawEliteEvasion(unit,pres,r,now){const timeMs=display.timeMs;const s=unit.evasion;if(!s)return;const c=s.config.presentation,p=unit.body.position;
    for(const [i,ghost]of (s.motion?.trail??[]).entries()){const fade=Math.max(0,1-(timeMs-ghost.atMs)/c.trailMs);if(fade)vectorActors.drawActor({key:`elite-ghost:${unit.unitId}:${i}`,assetId:pres.assetId??unit.speciesId,
      x:ghost.x,y:ghost.y-ghost.z,radius:r,timeMs,unit,attacking:false,alpha:c.trailOpacity*fade*(i?1:.65),outline:null});}
    const q=r+c.markerPadding,alpha=s.presentation.markerOpacity,width=s.phase==='OPEN'&&!s.blocked?2.8:1.6;for(const sign of [-1,1]){const x=p.x+sign*q,y=p.y-unit.spatial.feetZ;
      paint.line(x-sign*4,y-5,x,y,width,[.74,.94,.88,alpha]);paint.line(x,y,x-sign*4,y+5,width,[.74,.94,.88,alpha]);}
  }

  function createUnit(x,y,speciesId,{controller,deathPolicy,faction,grade=5,inventoryId=null,physics,config=null,presentation=null,evasive=false}){
    const id=nextEnemyId++,spec=species[speciesId],cfg=config||speciesConfig(speciesId,grade);
    const b=Bodies.circle(x,y,cfg.radius,{label:'unit',restitution:C.physics.restitution,frictionAir:.024,friction:0.005,frictionStatic:0.005,collisionFilter:physics});
    Body.setMass(b,cfg.mass);Body.setInertia(b,Infinity);
    if(evasive)cfg.evasion={...C.enemy.evasion,seed:stage.seed};const Class=evasive?evadeUnitClass(spec.Class):spec.Class;
    const e=new Class({unitId:id,type:spec.boss?'boss':speciesId,speciesId,body:b,config:cfg,adapter:unitAdapter,controller,deathPolicy,faction,grade,inventoryId,presentation:{...spec.presentation,...presentation}});
    e.isElite=!!evasive;if(evasive)evasionMetrics.eliteSpawns++;unitsById.set(id,e);unitsByBody.set(b.id,e);World.add(engine.world,b);
    if(e.bossPattern)initializeBoss(e,spec.id);return e;
  }
  function enemyDeathPolicy(e,{reason,source}){
    removeUnit(e);if(reason===DeathReason.hit){
      if(e.selfDestruct?.exploded===false)recordVolume('self-destruct-cancel',e);sfx.play('kill');
      const egg=companions.rollHitDeath(e,rand),p=e.body.position;
      lootDrops.spawn({growth:e.isSummon?0:1,eggSpeciesId:egg,eggCount:egg?petConfig.eggs.rewardCount:0},{...p,z:e.spatial.feetZ},e.unitId*2.399963229728653);
      recordVolume('egg-roll',e,{rate:species[e.speciesId].boss?petConfig.eggs.bossDropRate:petConfig.eggs.normalDropRate,dropped:egg?1:0});
      if(!e.isSummon){kills++;tech.defeats++;}companions.recordKill();
      source?.combatEvents?.kill?.();persistTech();updateTechUi();onEnemyKilled(e);
    }else if(reason===DeathReason.selfDestruct&&!e.isSummon)spawnReplacement();
  }
  function spawnEnemy(x,y,type='scout',options={}){
    const speciesId=type==='boss'?options.speciesId:type;if(!species[speciesId])throw Error('Missing species '+speciesId);
    const eligible=!species[speciesId].boss&&speciesId!=='carriermite',evasive=options.evasive??(!isolatedScene&&eligible&&selectEvasionElite());
    const e=createUnit(x,y,speciesId,{evasive,controller:new EnemyController(),deathPolicy:enemyDeathPolicy,faction:'wild',physics:{category:4,mask:1|2|4|16|8},...options});
    const recycled=enemies.findIndex(unit=>!unit.alive);if(recycled>=0)enemies[recycled]=e;else enemies.push(e);enemiesById.set(e.body.id,e);e.spawnSummon=(x,y,id)=>spawnEnemy(x,y,id,{evasive:false});return e;
  }
  function spawnBossShot(boss,angle,projectileSpeed=bossParameters(boss).bulletSpeed){const p=bossParameters(boss);
    addShot(boss,{radius:p.bulletRadius,speed:projectileSpeed,angle,damage:p.bulletDamage,push:p.bulletPush,lifeMs:p.bulletLifeMs,boss:true});}
  function initializeBoss(boss,id,variety=null){const spec=BOSS_POOL[id],v=variety||spec.variants[0],c=boss.config;
    boss.bossSpec=spec;boss.bossVariant=v;boss.bossName=spec.name;boss.bossParams={...c,
      windupMs:c.windupMs*(v.windupRate||1),bulletSpeed:c.bulletSpeed*(v.bulletSpeedRate||spec.base.bulletSpeedRate||1),
      chargeSpeed:c.chargeSpeed*(v.chargeSpeedRate||spec.base.chargeSpeedRate||1),chargeRecoilSpeed:c.chargeRecoilSpeed*(v.recoilSpeedRate||1),
      summonCount:Math.max(1,Math.round(spec.summon.count*(v.summonCountRate||1))),summonLifetimeMs:c.summonLifeMs*spec.summon.lifetimeRate};
    boss.state='BOSS_RECOVER';boss.stateUntilMs=timeMs+520;boss.pattern='CHARGE';boss.headingX=-1;boss.headingY=0;
    boss.patternStartedAtMs=timeMs;boss.volleys=0;boss.lastPattern='';boss.nextSummonAtMs=timeMs+3400;
  }
  function removeProjectile(shot){
    if(!shot||!projectileById.has(shot.body.id))return;
    shot.finished=true;projectileById.delete(shot.body.id);World.remove(engine.world,shot.body);
    const i=projectiles.indexOf(shot);if(i>=0){projectiles[i]=projectiles[projectiles.length-1];projectiles.pop();}
  }
  function hitProjectile(shot){
    if(shot?.faction===playerUnit.faction)return;
    if(!shot||!projectileById.has(shot.body.id)||mode==='DEAD')return;
    const pos=shot.body.position,dir=norm(shot.dirX,shot.dirY);
    const dmg=shot.damage*C.enemy.projectileDamageMultiplier;
    removeProjectile(shot);
    if(projectileDodged(playerUnit)){burst(pos.x,pos.y,90,6,[.54,.86,1,1]);return;}
    hurtPlayer(dmg,player.position.x,player.position.y,{...shot.source,attacker:shot.source,alive:true});
    const delta=shot.push*C.enemy.knockbackMultiplier;
    applyImpulse(player,{x:dir.x*delta*player.mass,y:dir.y*delta*player.mass});enemyPushes++;
    burst(pos.x,pos.y,180,16,[.76,.55,1,1]);toast(message("runtime.87",{v0:Math.round(dmg)}),'#d3a9ff',380);
  }
  const boundaryPoint=(x,y,margin=0)=>{
    for(let i=0;i<arenaVertices.length;i++){
      const a=arenaVertices[i],b=arenaVertices[(i+1)%arenaVertices.length];
      const ex=b.x-a.x,ey=b.y-a.y;
      if(ex*(y-a.y)-ey*(x-a.x)<margin*Math.hypot(ex,ey))return false;
    }return true;
  };
  const distanceToSegment=(x,y,ax,ay,bx,by)=>{
    const dx=bx-ax,dy=by-ay,t=clamp(((x-ax)*dx+(y-ay)*dy)/Math.max(1,dx*dx+dy*dy),0,1);
    return Math.hypot(x-ax-t*dx,y-ay-t*dy);
  };
  function mapTierAtStage(index){return Math.floor((index-1)/C.stage.mapEvery);}
  function mapStartAtStage(index){return mapTierAtStage(index)*C.stage.mapEvery+1;}
  function isBossStage(index){return index%C.stage.bossEvery===0;}
  function radiusAtStage(index){return Math.min(C.stage.maxRadius,C.stage.worldRadius*(1+C.stage.radiusGrowth*Math.sqrt(mapTierAtStage(index))));}
  function populationAtStage(index,playableArea,referenceArea,previousPopulation=0){return Math.min(C.stage.maxEnemies,Math.max(C.stage.initialPopulation,previousPopulation+(index>1?C.stage.populationPerStage:0),Math.round((C.stage.initialPopulation+(index-1)*C.stage.populationPerStage)*playableArea/referenceArea)));}
  function mapArea(){let area=0;for(let i=0;i<arenaVertices.length;i++){
    const a=arenaVertices[i],b=arenaVertices[(i+1)%arenaVertices.length];area+=a.x*b.y-a.y*b.x;
  }return Math.abs(area)*.5;}
  function validObstacle(x,y,r){
    if(!boundaryPoint(x,y,r+48))return false;
    if(Math.hypot(x-C.world.width*.5,y-C.world.height*.5)<C.stage.spawnSafeRadius+r)return false;
    if(terrainChannels.some(path=>distanceToSegment(x,y,path.ax,path.ay,path.bx,path.by)<r+path.width))return false;
    return !obstacles.some(o=>Math.hypot(o.body.position.x-x,o.body.position.y-y)<o.r+r+32);
  }
  function placeObstacle(x,y,r){
    if(!validObstacle(x,y,r))return false;
    const t=THEME_POOL[stage.themeId],opt=t.obstacle;
    const sides=opt.minSides+Math.floor(rand()*(opt.maxSides-opt.minSides+1));
    const b=Bodies.polygon(x,y,sides,r,{isStatic:true,label:'obstacle',friction:0,restitution:.70});
    Body.setAngle(b,rand()*Math.PI*2);obstacles.push({body:b,r,sides});World.add(engine.world,b);return true;
  }
  // Shared map operation pool. Each function uses the same placement validator and physics writer.
  const MAP_OPERATORS={
    scatter(budget){for(let k=0;k<budget*12&&budget>0;k++){
      const a=rand()*Math.PI*2,r=stage.radius*Math.sqrt(rand())*.88;
      const opt=THEME_POOL[stage.themeId].obstacle;
      const size=opt.radiusMin+rand()*(opt.radiusMax-opt.radiusMin);
      if(placeObstacle(C.world.width*.5+Math.cos(a)*r,C.world.height*.5+Math.sin(a)*r,size))budget--;
    }},
    clusters(budget){const opt=THEME_POOL[stage.themeId].obstacle,groups=Math.max(2,Math.round(Math.sqrt(budget)));
      for(let g=0;g<groups;g++){
        const a=rand()*Math.PI*2,d=stage.radius*(.48+rand()*.27);
        const cx=C.world.width*.5+Math.cos(a)*d,cy=C.world.height*.5+Math.sin(a)*d;
        for(let i=0;i<budget*12/groups&&budget>0;i++){
          const ang=rand()*Math.PI*2,r=Math.sqrt(rand())*stage.radius*.22;
          if(placeObstacle(cx+Math.cos(ang)*r,cy+Math.sin(ang)*r,opt.radiusMin+rand()*(opt.radiusMax-opt.radiusMin)))budget--;
        }
      }
    },
    ring(budget){const opt=THEME_POOL[stage.themeId].obstacle,n=Math.max(6,budget*2),orientation=rand()*Math.PI*2;
      for(let i=0;i<n&&budget>0;i++){
        // Several open passages in every ring: the world never becomes a sealed donut.
        if(i%5===0)continue;
        const a=orientation+i*Math.PI*2/n,d=stage.radius*(.47+(rand()-.5)*.14);
        if(placeObstacle(C.world.width*.5+Math.cos(a)*d,C.world.height*.5+Math.sin(a)*d,opt.radiusMin+rand()*(opt.radiusMax-opt.radiusMin)))budget--;
      }
      if(budget>0)MAP_OPERATORS.scatter(budget);
    },
    rooms(budget){const opt=THEME_POOL[stage.themeId].obstacle,rooms=3+Math.floor(rand()*2),orientation=rand()*Math.PI*2;
      const cx=C.world.width*.5,cy=C.world.height*.5;
      for(let i=0;i<rooms;i++){
        const a=orientation+i*Math.PI*2/rooms,d=stage.radius*.54,rx=cx+Math.cos(a)*d,ry=cy+Math.sin(a)*d;
        const lane={ax:cx,ay:cy,bx:rx,by:ry,width:105};terrainChannels.push(lane);
      }
      // Dense cave growth on the boundaries BETWEEN cleared chambers/corridors.
      for(let k=0;k<budget*24&&budget>0;k++){
        const a=rand()*Math.PI*2,d=stage.radius*(.28+rand()*.61);
        if(placeObstacle(cx+Math.cos(a)*d,cy+Math.sin(a)*d,opt.radiusMin+rand()*(opt.radiusMax-opt.radiusMin)))budget--;
      }
    },
    ridges(budget){const opt=THEME_POOL[stage.themeId].obstacle,cx=C.world.width*.5,cy=C.world.height*.5;
      for(let j=0;j<3&&budget>0;j++){
        const rot=rand()*Math.PI*2,dist=stage.radius*(.43+rand()*.25),mx=cx+Math.cos(rot)*dist,my=cy+Math.sin(rot)*dist;
        for(let i=0;i<9&&budget>0;i++){
          if(i===4)continue;
          const t=(i-4)/4,xx=mx-Math.sin(rot)*t*stage.radius*.19+Math.cos(rot)*Math.sin(t*Math.PI)*25;
          const yy=my+Math.cos(rot)*t*stage.radius*.19+Math.sin(rot)*Math.sin(t*Math.PI)*25;
          if(placeObstacle(xx,yy,opt.radiusMin+rand()*(opt.radiusMax-opt.radiusMin)*.7))budget--;
        }
      }
      if(budget>0)MAP_OPERATORS.scatter(budget);
    }
  };
  function checkConnectivity(){
    // One-time raster connectivity audit; not on physics ticks. The clearance is
    // deliberately larger than the player's radius to keep useful dash corridors.
    const cell=Math.max(C.stage.connectivityStep,stage.radius/14),minX=C.world.width*.5-stage.radius,maxX=C.world.width*.5+stage.radius;
    const minY=C.world.height*.5-stage.radius,maxY=C.world.height*.5+stage.radius;
    const cols=Math.max(1,Math.ceil((maxX-minX)/cell)),rows=Math.max(1,Math.ceil((maxY-minY)/cell));
    const free=new Uint8Array(cols*rows),seen=new Uint8Array(cols*rows),queue=new Int32Array(cols*rows);
    let total=0,first=-1;
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
      const x=minX+(i+.5)*(maxX-minX)/cols,y=minY+(j+.5)*(maxY-minY)/rows;
      if(!boundaryPoint(x,y,47)||obstacles.some(o=>Math.hypot(o.body.position.x-x,o.body.position.y-y)<o.r+44))continue;
      const n=j*cols+i;free[n]=1;total++;if(first<0||Math.hypot(x-C.world.width*.5,y-C.world.height*.5)<Math.hypot(minX+((first%cols)+.5)*(maxX-minX)/cols-C.world.width*.5,minY+(Math.floor(first/cols)+.5)*(maxY-minY)/rows-C.world.height*.5))first=n;
    }
    if(first<0||!total)return 0;
    let read=0,end=1;queue[0]=first;seen[first]=1;
    while(read<end){const c=queue[read++],i=c%cols,j=Math.floor(c/cols);
      const around=[i>0?c-1:-1,i+1<cols?c+1:-1,j>0?c-cols:-1,j+1<rows?c+cols:-1];
      for(const to of around){if(to<0||!free[to]||seen[to])continue;seen[to]=1;queue[end++]=to;}
    }
    return end/total;
  }
  function clearLaneDistance(){
    const x=C.world.width*.5,y=C.world.height*.5;let best=0;
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6,dx=Math.cos(a),dy=Math.sin(a);let dist=0;
      for(let d=36;d<stage.radius*.85;d+=24){const px=x+dx*d,py=y+dy*d;
        if(!boundaryPoint(px,py,49)||obstacles.some(o=>Math.hypot(px-o.body.position.x,py-o.body.position.y)<o.r+48))break;
        dist=d;
      }best=Math.max(best,dist);
    }return best;
  }
  function fillTerrainDecor(){
    terrainDecor.length=0;const count=Math.min(250,Math.round(mapArea()/8500));
    for(let i=0;i<count*4&&terrainDecor.length<count;i++){
      const a=rand()*Math.PI*2,d=Math.sqrt(rand())*stage.radius*.9;
      const x=C.world.width*.5+Math.cos(a)*d,y=C.world.height*.5+Math.sin(a)*d;
      if(!boundaryPoint(x,y,25)||obstacles.some(o=>Math.hypot(o.body.position.x-x,o.body.position.y-y)<o.r+12))continue;
      terrainDecor.push({x,y,r:3+rand()*9,seed:rand()*Math.PI*2,kind:Math.floor(rand()*3)});
    }
  }
  function findSpawn(minFromPlayer=0,bodyRadius=26){
    for(let i=0;i<130;i++){
      const a=rand()*Math.PI*2,d=Math.sqrt(rand())*stage.radius*.83;
      const x=C.world.width*.5+Math.cos(a)*d,y=C.world.height*.5+Math.sin(a)*d;
      if(!boundaryPoint(x,y,bodyRadius+38))continue;
      if(player&&Math.hypot(player.position.x-x,player.position.y-y)<minFromPlayer)continue;
      if(obstacles.some(o=>Math.hypot(o.body.position.x-x,o.body.position.y-y)<o.r+bodyRadius+42))continue;
      if(enemies.some(e=>e.alive&&Math.hypot(e.body.position.x-x,e.body.position.y-y)<bodyRadius+enemyDef(e).radius+C.stage.enemySpawnMinGap*.5))continue;
      return {x,y};
    }return null;
  }
  function buildArena(index){
    const radius=stage.radius,centerX=C.world.width/2,centerY=C.world.height/2;
    const sides=6+Math.floor(rand()*5),orientation=rand()*Math.PI*2;
    arenaVertices=Array.from({length:sides},(_,i)=>{const a=orientation+i*Math.PI*2/sides;
      const r=radius*(.88+rand()*.22);return {x:centerX+Math.cos(a)*r,y:centerY+Math.sin(a)*r};});
    const thickness=95;
    for(let i=0;i<sides;i++){
      const a=arenaVertices[i],b=arenaVertices[(i+1)%sides],dx=b.x-a.x,dy=b.y-a.y;
      const wall=Bodies.rectangle((a.x+b.x)/2,(a.y+b.y)/2,Math.hypot(dx,dy)+thickness*.26,thickness,
        {isStatic:true,label:'wall',friction:0,restitution:.6,angle:Math.atan2(dy,dx)});
      boundaryWalls.push(wall);World.add(engine.world,wall);
    }
    const theme=THEME_POOL[stage.themeId],recipe=theme.layouts[Math.floor(rand()*theme.layouts.length)];
    stage.layoutId=recipe.id;stage.layoutName=recipe.name;
    // The obstacle budget depends on area, not stage index or a fixed obstacle cap per map.
    const budget=Math.min(C.stage.maxObstacles,Math.max(4,Math.round(mapArea()/100000*C.stage.obstaclePer100k)));
    for(const [operator,ratio] of recipe.ops){if(!MAP_OPERATORS[operator])throw Error(tr("runtime.phrase.25",{v0:operator}));
      MAP_OPERATORS[operator](Math.max(1,Math.round(budget*ratio/recipe.ops.length)));
    }
    if(obstacles.length<budget)MAP_OPERATORS.scatter(budget-obstacles.length);
    let connectivity=checkConnectivity(),retries=0;
    while(connectivity<C.stage.connectivityMin&&obstacles.length>0){
      // Remove obstructions rather than allow a sealed or inaccessible arena.
      const victim=obstacles.pop();World.remove(engine.world,victim.body);retries++;connectivity=checkConnectivity();
    }
    const lane=clearLaneDistance();generationStats={retries,connectivity,clearLane:lane,obstacles:obstacles.length};
    const obstacleArea=obstacles.reduce((area,o)=>area+Math.PI*o.r*o.r,0);
    const playableArea=Math.max(100000,mapArea()-obstacleArea);
    stage.playableArea=playableArea;
    if(index===1)stageBasePlayableArea=playableArea;
    stage.targetPopulation=populationAtStage(index,playableArea,stageBasePlayableArea,stageHistory.at(-1)?.population||0);
    fillTerrainDecor();
  }
  function clearStageEnemies(){acidPools=[];frostFields=[];
    for(const shot of [...projectiles])removeProjectile(shot);
    for(const actor of petRoster.actors)actor.unit?.cancel();
    for(const e of [...unitsById.values()])if(e.inventoryId==null)e.die(DeathReason.cleanup);
    enemies.length=0;enemiesById.clear();
  }
  function clearArena(){
    clearStageEnemies();
    for(const o of obstacles)World.remove(engine.world,o.body);
    for(const w of boundaryWalls)World.remove(engine.world,w);
    obstacles=[];boundaryWalls=[];arenaVertices=[];terrainDecor=[];terrainChannels=[];
  }
  function setupStage(index){
    presentation.reset();
    ultimateRunner.cancel('stage');
    if(engine)clearArena();
    const theme=themeForStage(index),radius=radiusAtStage(index),mapTier=mapTierAtStage(index),mapStart=mapStartAtStage(index);
    C.world.width=2*radius+400;C.world.height=2*radius+400;
    stage={index,phase:'WAVE',waveKills:0,killTarget:C.stage.initialKills+(index-1)*C.stage.killsPerStage,
      startedAtMs:timeMs,transitionUntilMs:0,boss:null,patternLog:[],themeId:theme.id,layoutId:'',layoutName:'',
      radius,targetPopulation:0,playableArea:0,mapTier,mapStart,mapSeed:(82741^Math.imul(mapStart,2654435761))>>>0,seed:(82741^Math.imul(index,2654435761))>>>0};
    randomSeed=stage.mapSeed;
    if(player){Body.setPosition(player,{x:C.world.width/2,y:C.world.height/2});setSpeed(player,0,0);}
    shadow=null;setReadyState();endChain();bufferedIntent=null;
    evadeMotion=null;evadeCharges=C.evade.maxCharges;evadeRefillAtMs=0;
    buildArena(index);
    enemySpawnOrdinal=0;randomSeed=stage.seed; // Wave placement varies; geometry remains fixed inside a map segment.
    for(let i=0;i<stage.targetPopulation;i++){
      const pt=findSpawn(C.stage.spawnSafeRadius,28);
      if(pt)spawnEnemy(pt.x,pt.y,(theme.enemies||enemyWave)[i%(theme.enemies||enemyWave).length]);
    }
    stageHistory.push({index,theme:theme.id,layout:stage.layoutId,radius,playableArea:stage.playableArea,population:stage.targetPopulation,mapTier,mapStart,mapSeed:stage.mapSeed,bossStage:isBossStage(index),seed:stage.seed});
    if(stageHistory.length>20)stageHistory.shift();
    petRoster.enterStage();if(index>1)sfx.play('themeStart');
    stageNotice(message('ui.stage',{count:index}),C.stage.entryNoticeMs,'stage');
    if(!isolatedScene&&phase==='PLAYING'){themeProgress.enter(theme.id);persistTech();}
  }
  function stageNotice(message,durationMs,kind){
    const priority=C.stage.noticePriority[kind];
    if(timeMs<(stage.noticeUntilMs??0)&&priority<(stage.noticePriority??0))return false;
    stage.noticeMessage=message;$('stageBanner').textContent=messageText(message);$('stageBanner').dataset.kind=kind;stage.noticeKind=kind;stage.noticePriority=priority;stage.noticeUntilMs=timeMs+durationMs;return true;
  }
  function spawnBoss(){
    if(stage.phase!=='BOSS_PENDING')return;
    ultimateRunner.cancel('stage');clearStageEnemies();
    shadow=null;setReadyState();endChain();bufferedIntent=null;
    const theme=THEME_POOL[stage.themeId],visit=bossVisits[theme.id]||0,id=theme.bosses[visit%theme.bosses.length],spec=BOSS_POOL[id];bossVisits[theme.id]=visit+1;
    if(!spec)throw Error(tr("runtime.phrase.24",{v0:id}));
    const pos=findSpawn(Math.min(420,stage.radius*.72),species[spec.id].config.radius)||{x:C.world.width/2+stage.radius*.53,y:C.world.height/2};
    const boss=spawnEnemy(pos.x,pos.y,'boss',{speciesId:spec.id});
    const options=spec.variants;
    // Repeat visits choose from the same pool but produce different proportions.
    const variantSeed=(Math.imul(stage.seed^(spec.id.length*39871),2246822519)>>>0);
    const variety=options[variantSeed%options.length];
    const rate=1+(stage.index-1)*.19;
    if(boss.bossPattern)initializeBoss(boss,spec.id,variety);boss.maxHp=boss.config.hp*rate;boss.hp=boss.maxHp;
    stage.boss=boss;stage.bossSpeciesId=spec.id;stage.phase='BOSS';stage.bossName=spec.name;stage.bossVariant=variety.id;petRoster.enterStage();
    sfx.play('bossNotice');stageNotice(message(spec.nameKey),C.stage.bossNoticeMs,'boss');
  }
  function finishStage(){
    if(stage.phase!=='BOSS'&&stage.phase!=='WAVE')return;
    sfx.play('stageClear');stage.phase='CLEAR';ultimateRunner.cancel('stage');stage.transitionUntilMs=timeMs+C.stage.transitionMs;stage.noticeUntilMs=timeMs;
    clearStageEnemies();shadow=null;setReadyState();endChain();bufferedIntent=null;
  }
  function defeatEnemy(e,source=playerUnit){return e.die(DeathReason.hit,source);}
  const petRoster=new CompanionRoster(companions,{
    anchor:()=>player.position,anchorVelocity:()=>speedOf(player),time:()=>timeMs,
    create(item,slot,actor){const c=petConfig.combat,angle=(slot+1)*2.399,p=player.position,pres=companionPresentation(item.grade),cfg=speciesConfig(item.speciesId,item.grade,{powerRate:c.gradePowerRate,sizeRate:c.gradeSkillSizeRate,bodyScale:pres.scale,growthRate:c.gradeRangeRate});
      cfg.hitProtectionMs=c.hitProtectionMs;const e=createUnit(p.x+Math.cos(angle)*c.followRadius,p.y+Math.sin(angle)*c.followRadius,item.speciesId,{
        controller:new PetController({slot,range:460*Math.pow(c.gradeRangeRate,item.grade),leash:c.leash,followRadius:c.followRadius}),
        deathPolicy:(unit,{reason})=>{removeUnit(unit);petRoster.died(actor,unit,reason);},
        faction:'garden',grade:item.grade,inventoryId:item.id,physics:{category:16,mask:1|4|8|16},config:cfg,presentation:{...pres,impactSound:'petImpact'}});
      e.combatEvents={hurt:amount=>{petRoster.stats.taken+=amount;},ability:()=>{petRoster.stats.abilities++;},kill:()=>{petRoster.stats.kills++;},
        hit:(target,payload,damage)=>{petRoster.stats.hits++;petRoster.stats.damage+=damage;petRoster.stats.lastHit={inventoryId:item.id,unitId:e.unitId,speciesId:e.speciesId,enemyId:target.unitId,damage,raw:payload.raw,atMs:timeMs};}};
      e.spawnSummon=(x,y,id)=>createUnit(x,y,id,{faction:e.faction,grade:e.grade,controller:new PetController({slot,range:460}),deathPolicy:unit=>removeUnit(unit),physics:{category:16,mask:1|4|8|16},
        config:speciesConfig(id,e.grade,{powerRate:c.gradePowerRate,sizeRate:c.gradeSkillSizeRate,bodyScale:e.presentation.scale,growthRate:c.gradeRangeRate}),presentation:{scale:e.presentation.scale,outline:{...e.presentation.outline}}});return e;
    },
    remove:(unit,reason)=>unit.die(reason),
    effect(kind,actor){ringFx(actor.x,actor.y,24,[.66,.94,1,.8],300);sfx.play(kind==='revive'?'petRevive':'hurt');floatText(actor.x,actor.y,kind==='revive'?message("runtime.90"):message("runtime.91"),[.72,.93,1,1]);}
  });
  companions.onChange=event=>{if(claimingDrops)return;persistTech();petRoster.sync();if($('petPanel').classList.contains('open'))updatePetUi();
    if(event.kind==='reward'){const p=player.position;sfx.play('egg');floatText(p.x,p.y,message("runtime.92"),[.97,.85,.54,1]);ringFx(p.x,p.y,65,[1,.85,.5,.8],500);}
    if(event.hatched?.length){const first=event.firstDiscoveries||[],p=player.position;sfx.play(first.length?'hatchFirst':'hatchRepeat');
      floatText(p.x,p.y,first.length?message("runtime.93"):message("runtime.94"),[.97,.85,.54,1]);ringFx(p.x,p.y,65,[1,.85,.5,.8],500);

      updateDiscoveredSpeciesWiki();if(first.length)revealCompanions(first);}
    if(event.kind==='fusion')sfx.play(event.result.successes&&event.result.failures?'fusionMixed':event.result.successes?'fusionSuccess':'fusionFail');
    if(event.automatic?.length){const result=event.automatic.reduce((sum,r)=>({attempts:sum.attempts+r.attempts,successes:sum.successes+r.successes,failures:sum.failures+r.failures,consumed:sum.consumed+r.consumed.length,produced:sum.produced+r.produced.length}),{attempts:0,successes:0,failures:0,consumed:0,produced:0});
      setPetResult(message('ui.fusion',{count:result.attempts,success:result.successes,failure:result.failures,consumed:result.consumed,produced:result.produced}));sfx.play(result.successes&&result.failures?'fusionMixed':result.successes?'fusionSuccess':'fusionFail');}

  };
  function onEnemyKilled(e){
    if(e===stage.boss){if(!isolatedScene&&phase==='PLAYING'&&health>0&&themeProgress.recordBossDefeat(stage,e))persistTech();finishStage();return;}
    if(e.isSummon)return;
    if(stage.phase==='WAVE'){
      stage.waveKills++;
      if(stage.waveKills>=stage.killTarget){
        if(isBossStage(stage.index)){stage.phase='BOSS_PENDING';ultimateRunner.cancel('stage');stage.transitionUntilMs=timeMs+C.stage.bossWarningMs;stageNotice(message("runtime.95"),C.stage.bossWarningMs,'boss');}
        else finishStage();
      }
      else spawnReplacement();
    }
  }
  function updateStage(){
    if(stage.phase==='BOSS_PENDING'&&timeMs>=stage.transitionUntilMs)spawnBoss();
    else if(stage.phase==='CLEAR'&&timeMs>=stage.transitionUntilMs){lootDrops.clear();persistTech();setupStage(stage.index+1);}
  }
  function reset(startIndex=1){
    evasionMetrics={eligibleSpawns:0,eliteSpawns:0,predicted:0,attempt:0,success:0,failure:0,aborted:0};frostFields=[];ultimateRunner.reset();
    if(engine){releaseVolumeFilter?.();World.clear(engine.world,false);}
    engine=Engine.create({gravity:{x:0,y:0,scale:0},enableSleeping:false,positionIterations:7,velocityIterations:8,constraintIterations:2});
    engine.world.gravity.y=0;engine.world.gravity.x=0;
    volumeEvents=[];releaseVolumeFilter=filterMatterVolumes(M,engine,acceptVolumeContact);Events.on(engine,'beforeSolve',sweepVerticalMotion);
    pickupFeedback={growth:0,eggs:0,nextAtMs:0};
    randomSeed=82741;nextEnemyId=1;timeMs=0;tick=0;reviveUsed=false;reviveGraceUntilMs=0;combo=0;lastComboHitAtMs=-1e6;hits=0;kills=0;
    chainTargetId=null;chainActive=false;chainStarts=0;chainEnds=0;criticalHits=0;lastHit=null;
    shadow=null;setReadyState();particles=[];particleCursor=0;lightningArcs=[];fireEmbers=[];fireTransfers=[];fireFxSerial=0;elementalEvents={ignite:0,spread:0,conduct:0,conductSpread:0,conductConsumed:0,conductDamage:0,arc:0,burnDamage:0};health=C.stats.maxHp;hitstopLeftMs=0;
    dashCharge=0;dashMotion=null;dashFlight=null;dashHits.clear();damageTaken=0;healingDone=0;launchCount=0;manualLaunchCount=0;echoLaunchCount=0;chainLaunchCount=0;attackAmmo.reset();resetAmmoOrbit();launchRecoil=null;
    missRecoveryActive=false;missRecoveryPulseUntilMs=0;missRecoveryHintUntilMs=0;missRecoveryEvents=0;missRecoverySerial=-1;
    enemies=[];enemiesById=new Map();unitsById=new Map();unitsByBody=new Map();obstacles=[];boundaryWalls=[];arenaVertices=[];projectiles=[];projectileById=new Map();
    terrainDecor=[];terrainChannels=[];stageHistory=[];stageBasePlayableArea=0;bossVisits={};generationStats={retries:0,connectivity:1,clearLane:0,obstacles:0};
    enemyShots=0;enemyAttacks=0;enemyPushes=0;pending.length=0;aimTargetId=null;previewTargetId=null;fxRings=[];
    attackOrigin=null;bufferedIntent=null;bufferedUntilMs=0;dashStartedAtMs=0;recoverStartedAtMs=0;readyFlashUntilMs=0;
    autoChainReady=false;autoDashPlanned=false;dashAutomatic=false;dashPerfect=false;automaticDashes=0;manualPerfectHits=0;autoChainWins=0;autoChainRolls=0;
    attackDashSerial=0;evadeHitRechargeUsed=false;evadeHitRechargeEvents=0;evadeHitRechargeProgress=0;evadeLastHitRecharge=null;
    evadeActions=0;evadeCharges=C.evade.maxCharges;evadeRefillAtMs=0;evadeMotion=null;evadeStartedAtMs=-1e9;
    player=Bodies.circle(C.world.width*.5,C.world.height*.5,C.player.radius,{label:'player',restitution:C.physics.restitution,
      frictionAir:C.physics.frictionAir,friction:0,frictionStatic:0,collisionFilter:{category:2,mask:1|4|8}});
    Body.setMass(player,C.player.mass);Body.setInertia(player,Infinity);volume(player,C.player.height);World.add(engine.world,player);
    playerUnit={presentation:createPlayerPresentation(),status:new UnitStatus(),attackAmmo,unitId:0,id:0,faction:'garden',body:player,get invulnerable(){return ultimateRunner.active||timeMs<reviveGraceUntilMs;},get config(){return {...C.stats,radius:C.player.radius,deferDeath:true,damageRounding:false};},pre:{x:0,y:0},preX:player.position.x,preY:player.position.y,
      get hp(){return health;},set hp(value){health=value;},get maxHp(){return C.stats.maxHp;},get alive(){return mode!=='DEAD';},onHit(){},die(){die();},
      adapter:{freeze:unitAdapter.freeze,healed(target,amount){healingDone+=amount;sfx.play('heal');floatText(player.position.x,player.position.y,'+'+formatCombatNumber(amount),[.33,1,.68,1]);burst(player.position.x,player.position.y,120,6,[.24,1,.7,1]);},hurt(target,amount){damageTaken+=amount;if(amount>0){sfx.play('hurt');floatText(player.position.x,player.position.y,'-'+formatCombatNumber(amount),[1,.38,.43,1]);burst(player.position.x,player.position.y,90,8,[1,.36,.46,1]);}}}};
    setupStage(1);if(startIndex>1){stageHistory.length=0;setupStage(startIndex);}petRoster.reset();
    lootDrops.enterRun(player.position,2*player.circleRadius,(candidate,i)=>{
      if(boundaryPoint(candidate.x,candidate.y,12)&&!obstacles.some(o=>Math.hypot(candidate.x-o.body.position.x,candidate.y-o.body.position.y)<o.r+12))return candidate;
      return {x:player.position.x+Math.cos(i*2.4)*48,y:player.position.y+Math.sin(i*2.4)*48};
    });persistTech();
    cameraView.setCamera({x:player.position.x,y:player.position.y});cameraView.setShake(0,0);cameraShake=null;
    Events.on(engine,'collisionStart',handleCollision);Events.on(engine,'collisionActive',handleCollision);
    for(const f of textFloats)f.el?.remove();textFloats.length=0;
    $('gameover').classList.remove('show');toastUntil=0;capturePresentation();
  }
  function toast(txt,color='#f1c77a',duration=480){toastText=txt;toastColor=color;toastUntil=timeMs+duration;}
  function addParticle(x,y,vx,vy,life,r,color){const p={x,y,vx,vy,life,maxLife:life,r,color};if(particles.length<C.particles.capacity)particles.push(p);else{particles[particleCursor]=p;particleCursor=(particleCursor+1)%C.particles.capacity;}}
  function burst(x,y,base,n,color){for(let k=0;k<n;k++){const a=rand()*Math.PI*2,s=base*(.45+rand());addParticle(x,y,Math.cos(a)*s,Math.sin(a)*s,180+rand()*420,2+rand()*3,color);}}
  function ringFx(x,y,radius,color,lifeMs=390){if(fxRings.length>=26)fxRings.shift();fxRings.push({x,y,radius,color,age:0,lifeMs});}
  function shockwave(x,y){ringFx(x,y,105,[1,.75,.43,1],460);burst(x,y,320,24,[1,.75,.43,1]);for(let i=0;i<14;i++){const a=rand()*Math.PI*2,s=rand()*130;addParticle(x,y,Math.cos(a)*s,Math.sin(a)*s,230+rand()*280,2,[.52,1,.79,1]);}}
  // BLOOM particle lab: result-data drives presentation only. No damage/HP mutation from VFX.
  function bloomImpact(x,y,kind){const palette=kind==='spore'?[.63,1,.57,1]:kind==='perfect'?[1,.91,.52,1]:[.62,.82,1,1];ringFx(x,y,kind==='spore'?115:70,palette,kind==='perfect'?540:380);burst(x,y,kind==='spore'?210:150,kind==='perfect'?17:10,palette);}
  function expireShadow(){if(!shadow)return;endChain();burst(shadow.x,shadow.y,90,8,[.45,.87,1,1]);shadow=null;setReadyState();aimTargetId=null;combo=0;readyFlashUntilMs=timeMs+170;toast(message('ui.miss'),'#b4cfcc',350);}
  /** Charge reflects *remaining gap to the current target*, not the distance travelled by the shadow. */
  function remainingShadowGap(){
    if(!shadow||shadow.arrived)return 0;
    const e=shadow.targetId!=null?enemies.find(e=>e.alive&&e.id===shadow.targetId):null;
    if(e)return Math.max(0,Math.hypot(shadow.x-e.body.position.x,shadow.y-e.body.position.y)-(enemyDef(e).radius+6));
    return Math.hypot(shadow.goalX-shadow.x,shadow.goalY-shadow.y);
  }
  function chargeOf(){
    if(!shadow)return 0;
    if(mode==='GOLDEN')return 1;
    if(mode==='COYOTE'){
      const lateness=clamp((timeMs-shadow.contactAtMs-C.timing.shadowHitstopMs)/Math.max(1,C.timing.coyoteMs),0,1);
      return C.timing.coyoteStartCharge+(C.timing.coyoteEndCharge-C.timing.coyoteStartCharge)*lateness;
    }
    return clamp(1-remainingShadowGap()/Math.max(1,shadow.initialGap),0,1);
  }
  function endShadowAt(x,y,enemy=null){
    if(!shadow||shadow.arrived)return;sfx.play('chargeReady');
    shadow.arrived=true;shadow.x=x;shadow.y=y;shadow.contactAtMs=timeMs;
    if(enemy){
      shadow.targetId=enemy.id;
      if(hasTech('coldTouch')){enemy.status.cold(enemy,playerUnit,{...C.element.frost,freeze:hasTech('freezeTouch')});recordVolume('shadow-cold',enemy,{frozenMs:enemy.status.frozenMs});}
      // The shadow only pushes. Attack damage/healing requires the PLAYER body
      // to physically hit an enemy during an armed dash.
      const diffX=enemy.body.position.x-player.position.x;
      const diffY=enemy.body.position.y-player.position.y;
      const direction=Math.hypot(diffX,diffY)>1e-5?norm(diffX,diffY):norm(shadow.dirX,shadow.dirY);
      // Knockback is an actual Matter velocity impulse, not a position warp.
      // Compensate for the enemy's existing movement toward the player, and
      // express the configured speed as ENEMY delta-v rather than player mass / enemy mass.
      // With frictionAir=.024 and 500ms free inertia, 300px/s travels ~100 world units.
      // Physical contacts (walls, other bodies) can shorten that displacement.
      const current=speedOf(enemy.body);
      const projected=current.x*direction.x+current.y*direction.y;
      const deltaV=Math.max(0,C.shadow.contactPushSpeed-projected);
      if(deltaV>0){const impulse=enemy.body.mass*deltaV;
        applyImpulse(enemy.body,{x:direction.x*impulse,y:direction.y*impulse});}
      // AI steering must not immediately erase the impulse. Boss pattern timers
      // remain active (no stun or extra vulnerability); only chase/braking yields.
      enemy.shadowKnockbackUntilMs=Math.max(enemy.shadowKnockbackUntilMs||0,timeMs+C.shadow.contactPushControlMs);
      ringFx(x,y,Math.max(18,enemyDef(enemy).radius+7),[1,.42,.33,.8],190);
      burst(x,y,75,5,[1,.58,.45,.8]);
    }
    setAttackMode('GOLDEN');hitstopLeftMs=Math.max(hitstopLeftMs,C.timing.shadowHitstopMs);
    bloomImpact(x,y,'perfect');
  }
  function die(){if(health>0||mode==='DEAD')return;frostFields=[];acidPools=acidPools.filter(pool=>!pool.skillId);sfx.play('death');
    health=0;setAttackMode('DEAD');ultimateRunner.cancel('death');launchRecoil=null;phase='ENDED';shadow=null;dashMotion=null;dashFlight=null;attackOrigin=null;bufferedIntent=null;combo=0;hitstopLeftMs=0;endChain();
    $('runSummary').textContent=tr("runtime.96",{v0:kills,v1:tech.defeats,v2:progressionLevel(tech.kills),v3:hits,v4:Math.round(damageTaken),v5:Math.round(healingDone)});
    $('revive').hidden=!canRevive();$('gameover').classList.add('show');
  }
  function canRevive(){return adsBm!==null&&adsReady&&!reviveUsed&&adsBm.canShow('rewarded').ok;}
  // 보상형 광고를 끝까지 본 경우에만 같은 자리에서 이어갑니다. 런당 1회이며 그 외 결과는 종료 화면을 그대로 둡니다.
  async function reviveWithAd(){
    if(!canRevive())return;
    $('revive').disabled=true;
    const result=await adsBm.showRewarded('revive');
    $('revive').disabled=false;
    if(result.status!=='rewarded'){$('revive').hidden=!canRevive();return;}
    reviveUsed=true;$('revive').hidden=true;health=C.stats.maxHp*C.revive.healthRate;reviveGraceUntilMs=timeMs+C.revive.invulnerableMs;
    setReadyState();phase='PLAYING';$('gameover').classList.remove('show');
    input.releaseAll();actions.consume();pending.length=0;loop.resetTiming?.();canvas.focus({preventScroll:true});
  }
  function hurtPlayer(amount,x,y,source={unitId:-1,faction:'wild',alive:true,config:{}}){if(mode==='DEAD')return 0;
    return damageUnit(playerUnit,{raw:amount,stats:source.config,kind:'projectile'},source);}
  // Elemental combat is simulation-owned. The VFX layer reads these finalized events only.
  function addLightningArc(a,b){
    if(lightningArcs.length>=24)lightningArcs.shift();
    lightningArcs.push({x1:a.x,y1:a.y,x2:b.x,y2:b.y,untilMs:timeMs+C.element.lightning.arcDurationMs,seed:tick});
    elementalEvents.arc++;
  }
  function applyConduct(e,hitX,hitY,hit){
    // Only the resolved direct dash hit can mark/spread. The bonus is part of
    // that one hit, never another hit event that can trigger itself.
    if(!hasTech('conduct')||!e.alive||!hit.tags.includes('dash'))return;
    setConductMark(e);
    elementalEvents.conduct++;sfx.play('lightning');
    burst(hitX,hitY,120,8,[.57,.88,1,1]);
    if(!hasTech('relayArc'))return;
    let best=null,bestD=C.shadow.range*C.element.lightning.relayRadiusPct;
    for(const other of enemies){
      if(!other.alive||other.id===e.id)continue;
      const d=Math.hypot(other.body.position.x-e.body.position.x,other.body.position.y-e.body.position.y);
      if(d<bestD){bestD=d;best=other;}
    }
    if(best){best.conductUntilMs=timeMs+C.element.lightning.markDurationMs;
      elementalEvents.conductSpread++;
      addLightningArc(e.body.position,best.body.position);
      burst(best.body.position.x,best.body.position.y,75,6,[.62,.89,1,1]);}
  }
  // FIRE VFX IS PRESENTATION ONLY. Game burning status drives already-resolved
  // damage; all fire positions are world-space snapshots or body-local offsets.
  // No frame may append to the prior frame's position or stretch to a live target.
  // Presentation-only deterministic noise. Do not advance simulation-owned
  // randomSeed when spawning fire visuals; those values affect enemy placement.
  function fireNoise(id,salt){
    let h=Math.imul(id+1,0x9e3779b1)^Math.imul(salt+1,0x85ebca6b);
    h=Math.imul(h^(h>>>16),0x7feb352d);
    h=Math.imul(h^(h>>>15),0x846ca68b);
    return ((h^(h>>>16))>>>0)/4294967296;
  }
  function fireEmber(x,y,originRadius=16,ignite=false){
    if(!Number.isFinite(x)||!Number.isFinite(y))return;
    const cfg=C.fx.fire,seed=fireFxSerial++,r=Math.max(4,Math.min(65,originRadius));
    if(fireEmbers.length>=cfg.emberCapacity)fireEmbers.shift();
    const life=Math.max(1,cfg.emberLifetimeMs*(.70+fireNoise(seed,1)*.5));
    fireEmbers.push({x,y,age:0,life,drift:(fireNoise(seed,2)-.5)*r*.90,
      rise:r*cfg.emberRiseRadiusRate*(.55+fireNoise(seed,3)*.40),
      size:ignite?2+fireNoise(seed,4)*1.5:1.0+fireNoise(seed,4)*1.1,
      seed:fireNoise(seed,5)*Math.PI*2});
  }
  function fireIgnitionFx(x,y,r){
    // Short vertical sparks replace the old round generic burst.
    // Clamped at spawn; never scaled by a running chain count.
    if(!Number.isFinite(x)||!Number.isFinite(y))return;
    const radius=Math.max(5,Math.min(65,r));
    ringFx(x,y,Math.min(35,radius*1.5),[1,.40,.13,.55],190);
    const seed=fireFxSerial++;
    for(let k=0;k<7;k++)fireEmber(x+(fireNoise(seed,k*2+1)-.5)*radius*.65,
      y+(fireNoise(seed,k*2+2)-.5)*radius*.50,radius,true);
  }
  function applyIgnite(e,actualImpactDamage){
    if(!hasTech('ignite')||!e.alive||actualImpactDamage<=0)return;
    const cfg=C.element.fire,dps=actualImpactDamage*cfg.damageRate*1000/cfg.durationMs;
    if(e.burn){e.burn.damagePerSec=Math.max(e.burn.damagePerSec,dps);e.burn.remainingMs=cfg.durationMs;}
    else e.burn={damagePerSec:dps,remainingMs:cfg.durationMs,clockMs:0,emberClockMs:0};
    elementalEvents.ignite++;sfx.play('fire');
    fireIgnitionFx(e.body.position.x,e.body.position.y,enemyDef(e).radius);
  }
  function fireTransferFx(a,b){
    const cfg=C.fx.fire;
    const ax=a.body.position.x,ay=a.body.position.y,bx=b.body.position.x,by=b.body.position.y;
    const dx=bx-ax,dy=by-ay,dist=Math.hypot(dx,dy);
    const maxGap=enemyDef(a).radius+enemyDef(b).radius+cfg.maxTransferGapPx;
    // A collision callback from a stale pair cannot make a screen-wide streak.
    if(!Number.isFinite(dist)||dist>maxGap||dist<.01)return;
    const nx=dx/dist,ny=dy/dist;
    const x1=ax+nx*enemyDef(a).radius*.66,y1=ay+ny*enemyDef(a).radius*.66;
    const x2=bx-nx*enemyDef(b).radius*.66,y2=by-ny*enemyDef(b).radius*.66;
    if(fireTransfers.length>=cfg.transferCapacity)fireTransfers.shift();
    // Fixed endpoints at contact time. Enemy movement cannot stretch the effect.
    fireTransfers.push({x1,y1,x2,y2,age:0,life:cfg.transferDurationMs,
      seed:fireFxSerial++*.77});
  }
  function spreadFireAtContact(a,b){
    if(!hasTech('spreadFlame')||!a.alive||!b.alive)return;
    // Only a real Matter collision between two enemy bodies can spread ignition.
    const source=a.burn&&!b.burn?a:b.burn&&!a.burn?b:null;
    if(!source)return;
    const victim=source===a?b:a,c=C.element.fire;
    victim.burn={damagePerSec:source.burn.damagePerSec*c.spreadPowerRate,
      remainingMs:c.durationMs*c.spreadDurationRate,clockMs:0,emberClockMs:0};
    elementalEvents.spread++;
    fireTransferFx(source,victim);
    fireIgnitionFx(victim.body.position.x,victim.body.position.y,enemyDef(victim).radius);
  }
  function killByStatus(e){
    if(!e.alive)return;
    defeatEnemy(e);
    fireIgnitionFx(e.body.position.x,e.body.position.y,enemyDef(e).radius);
  }
  function updateBurning(elapsedMs){
    const cfg=C.element.fire;
    for(const e of enemies){if(!e.alive||!e.burn)continue;
      const b=e.burn;
      const stepMs=Math.min(elapsedMs,b.remainingMs);
      b.remainingMs-=stepMs;b.clockMs+=stepMs;b.emberClockMs+=stepMs;
      if(b.emberClockMs>=C.fx.fire.emberIntervalMs){
        b.emberClockMs%=C.fx.fire.emberIntervalMs;
        const r=enemyDef(e).radius;
        const seed=fireFxSerial++;
        fireEmber(e.body.position.x+(fireNoise(seed,9)-.5)*r*.9,
          e.body.position.y+(fireNoise(seed,10)-.5)*r*.65,r);
      }
      if(b.clockMs>=cfg.tickIntervalMs||b.remainingMs<=0){
        const appliedMs=b.clockMs;b.clockMs=0;
        const inflicted=Math.min(e.hp,b.damagePerSec*appliedMs/1000);
        if(inflicted>0){receiveHit(e,{raw:inflicted,resolved:true,floating:true,deferDeath:true,kind:'status'},playerUnit,timeMs);elementalEvents.burnDamage+=inflicted;
          if(e.hp<=0){killByStatus(e);continue;}}
      }
      if(b.remainingMs<=0)e.burn=null;
    }
  }
  // GPU triangle-strip flame tongues; no textured assets, no Canvas2D fallback.
  // All geometry is bounded by the emitter radius, independent of elapsed time.
  function flameTongue(cx,cy,w,h,phase,opacity,core=false){
    const slices=8;
    // Same authored silhouette principle as BLOOM Particle Lab flame: the
    // two edges curl independently as the flame tapers toward its tip.
    const sway=Math.sin(phase*.67)*w*.57;
    const edge=(q,side)=>{
      const curl=Math.sin(q*8.1+phase+side*.45)*w*.23*Math.sin(q*Math.PI);
      const tip=sway*q*q;
      const spread=side*w*.5*Math.pow(1-q,.77);
      return cx+tip+curl+spread;
    };
    for(let i=0;i<slices;i++){
      const u=i/slices,v=(i+1)/slices;
      const xl=edge(u,-1),xr=edge(u,1);
      const nl=edge(v,-1),nr=edge(v,1);
      const y1=cy-h*u,y2=cy-h*v;
      const alpha=opacity*(.97-.22*u);
      const color=core?[1,.87-.07*u,.36,alpha]:
        [1,.29+.35*u,.08+.12*u,alpha];
      paint.tri(xl,y1,xr,y1,nr,y2,color);
      paint.tri(xl,y1,nr,y2,nl,y2,color);
    }
  }
  function drawBurningFlames(x,y,r,id,now,fade){
    if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(r))return;
    const cfg=C.fx.fire,t=now*.001,scale=Math.max(6,Math.min(55,r));
    const opacity=cfg.opacity*fade;
    if(opacity<=0)return;
    // Flat elliptical glow + a slim base so the fire remains attached to its host.
    paint.ellipse(x,y+scale*.10,scale*.87,scale*.39,[1,.28,.07,opacity*.12],12);
    const n=Math.max(1,Math.min(6,Math.round(cfg.flames)));
    for(let k=0;k<n;k++){
      const spacing=(k-(n-1)/2)*scale*.32;
      const phase=t*cfg.flickerHz+k*2.25+id*.79;
      const flicker=.85+.14*Math.sin(phase);
      const h=scale*cfg.heightRadiusRate*flicker*(k%3===0?1.08:.84);
      const tipX=x+spacing+Math.sin(phase*.72)*scale*.08;
      flameTongue(tipX,y+scale*.21,scale*cfg.widthRadiusRate,h,phase,opacity*.64);
    }
    // White-hot center uses its own slimmer flame rather than a generic disc.
    flameTongue(x,y+scale*.17,scale*.43,scale*.86,t*cfg.flickerHz+id,opacity*.84,true);
  }
  function drawFireEmbersAndTransfers(){
    // No motion-trail length is accumulated. Embers rise a bounded distance.
    for(const e of fireEmbers){
      const u=clamp(e.age/Math.max(1,e.life),0,1),fade=Math.sin(Math.PI*u);
      if(fade<=0||!Number.isFinite(e.x)||!Number.isFinite(e.y))continue;
      const rise=e.rise*u,x=e.x+e.drift*u+Math.sin(e.seed+u*8)*2*u;
      const y=e.y-rise,w=e.size*(1-u*.55),h=w*(2+.65*u);
      paint.tri(x-w,y+h*.33,x+w,y+h*.33,x+Math.sin(e.seed)*w*.5,y-h,
        [1,.52+.38*(1-u),.15+.31*(1-u),fade*.9]);
    }
    // Enemy-to-enemy contact is a short ember transfer, never a long tether.
    for(const fx of fireTransfers){
      const u=clamp(fx.age/Math.max(1,fx.life),0,1),dx=fx.x2-fx.x1,dy=fx.y2-fx.y1;
      const len=Math.hypot(dx,dy);
      if(!Number.isFinite(len)||len>125)continue; // presentation safety, never gameplay
      const nx=len>1?-dy/len:0,ny=len>1?dx/len:0;
      for(let i=0;i<3;i++){
        const t=clamp(u*1.18-i*.16,0,1),wiggle=Math.sin(t*Math.PI)*Math.sin(fx.seed+i*2)*7;
        const x=fx.x1+dx*t+nx*wiggle,y=fx.y1+dy*t+ny*wiggle;
        const a=(1-u)*(1-Math.abs(.5-t)*.4),r=1.6+(2-i)*.35;
        paint.tri(x-r,y+r,x+r,y+r,x+nx*2,y-r*2,[1,.74-i*.09,.23,a]);
      }
    }
  }
  function drawElementalOverlay(e,now){
    const timeMs=display.timeMs,p={x:e.body.position.x,y:e.body.position.y-e.spatial.feetZ},r=enemyDef(e).radius,t=now*.001;
    if(e.conductUntilMs>timeMs){
      const alpha=Math.min(1,(e.conductUntilMs-timeMs)/430);
      // The brackets are a target status marker, not another progress gauge.
      drawTargetBrackets(p.x,p.y,r+13,6,2,[.51,.87,1,alpha*.8]);
      for(let k=0;k<3;k++){const a=k*Math.PI*2/3+t*4,radius=r+7+(k%2)*3;
        paint.line(p.x+Math.cos(a)*radius,p.y+Math.sin(a)*radius,
          p.x+Math.cos(a+.36)*radius,p.y+Math.sin(a+.36)*radius,1.6,[.85,.98,1,alpha]);}
    }
    if(e.burn){
      // Procedural flame recipe adapted to the BLOOM Particle Lab's 'flame':
      // broad bases, narrowing wind-shifted tongues and a small pale hot core.
      // Evaluate from absolute time + ID every frame, never integrate positions.
      drawBurningFlames(p.x,p.y,r,e.id,now,
        clamp(e.burn.remainingMs/300,0,1));
    }
  }
  function drawLightningArcs(){for(const fx of lightningArcs){
    const a=clamp((fx.untilMs-timeMs)/C.element.lightning.arcDurationMs,0,1);
    if(a<=0)continue;
    const dx=fx.x2-fx.x1,dy=fx.y2-fx.y1,len=Math.hypot(dx,dy)||1;
    let x=fx.x1,y=fx.y1;
    for(let j=1;j<=7;j++){
      const t=j/7,offset=j===7?0:Math.sin(j*29+fx.seed*3)*Math.min(14,len*.065);
      const nx=fx.x1+dx*t-dy/len*offset,ny=fx.y1+dy*t+dx/len*offset;
      paint.line(x,y,nx,ny,5,[.39,.72,1,a*.15]);
      paint.line(x,y,nx,ny,2,[.72,.96,1,a*.8]);
      x=nx;y=ny;
    }
  }}
  // Behavior pool: patterns share telegraph -> lock -> execute -> recovery contracts.
  const BOSS_PATTERNS={
    FAN:{executionMs:520,fire(b,volley){
      const cfg=b.bossSpec,variant=b.bossVariant,count=cfg.fan.count,spread=cfg.fan.spread*(variant.fanSpread||1);
      const angle=Math.atan2(b.headingY,b.headingX)+volley*.11;
      for(let i=0;i<count;i++)spawnBossShot(b,patternAngle('fan',count,i,angle,spread));
    }},
    RADIAL:{executionMs:520,fire(b,volley){
      const cfg=b.bossSpec,variant=b.bossVariant,n=Math.round(cfg.radial.count*(variant.radialCountRate||1));
      const rotation=volley*.11+(variant.radialRotation||0);
      for(let i=0;i<n;i++)spawnBossShot(b,patternAngle('radial',n,i,rotation));
    }},
    CHARGE:{executionMs:760,fire(b){
      const p=b.bossParams,v=b.body;b.collisionAttack.hitIds.clear();
      applyImpulse(v,{x:b.headingX*v.mass*p.chargeSpeed,y:b.headingY*v.mass*p.chargeSpeed});
      burst(v.position.x,v.position.y,230,16,[1,.58,.35,1]);
    }},
    SUMMON:{executionMs:650,fire(b){
      const p=b.bossParams,cfg=C.enemy.types[b.bossSpec.summonType];
      const available=Math.max(0,p.summonCap-liveSummons(b.unitId).length);
      const count=Math.min(available,p.summonCount);
      for(let i=0;i<count;i++){
        let point=null;
        for(let k=0;k<24;k++){
          const a=(i+k*.618)*Math.PI*2/Math.max(1,count)+rand()*.12;
          const d=b.config.radius+cfg.radius+70+(k%5)*34;
          const x=b.body.position.x+Math.cos(a)*d,y=b.body.position.y+Math.sin(a)*d;
          if(!boundaryPoint(x,y,cfg.radius+26))continue;
          if(obstacles.some(o=>Math.hypot(o.body.position.x-x,o.body.position.y-y)<o.r+cfg.radius+24))continue;
          if(Math.hypot(player.position.x-x,player.position.y-y)<C.player.radius+cfg.radius+75)continue;
          if(liveSummons().some(e=>Math.hypot(e.body.position.x-x,e.body.position.y-y)<cfg.radius*3))continue;
          point={x,y};break;
        }
        if(!point)point=findSpawn(180,cfg.radius);
        if(!point)continue;
        const {x,y}=point;
        const minion=b.spawnSummon(x,y,b.bossSpec.summonType);
        minion.isSummon=true;minion.summonerId=b.id;minion.summonedAtMs=timeMs;
        minion.summonExpiresAtMs=timeMs+p.summonLifetimeMs;minion.summonGrowUntilMs=timeMs+p.summonAppearMs;
        ringFx(x,y,35,b.bossSpec.appearance==='petal'?[.71,1,.51,1]:[.72,.54,1,1],370);
        burst(x,y,75,7,b.bossSpec.appearance==='petal'?[.74,1,.51,1]:[.69,.57,1,1]);
      }
      b.nextSummonAtMs=timeMs+p.summonPeriodMs;
    }}
  };
  function chooseBossPattern(b){
    const target=b.intent.target,p=bossParameters(b),allowed=Object.entries(b.bossPattern.patterns).filter(([,grade])=>b.grade>=grade).map(([id])=>id);
    const gap=Math.hypot(b.body.position.x-target.x,b.body.position.y-target.y);
    const blocks=obstacles.some(o=>{
      const vx=target.x-b.body.position.x,vy=target.y-b.body.position.y;
      const wx=o.body.position.x-b.body.position.x,wy=o.body.position.y-b.body.position.y;
      const along=(vx*wx+vy*wy)/(vx*vx+vy*vy||1);
      return along>0&&along<1&&Math.hypot(wx-vx*along,wy-vy*along)<o.r+b.config.radius*.6;
    });
    if(allowed.includes('SUMMON')&&timeMs>=b.nextSummonAtMs&&liveSummons(b.id).length<p.summonCap)return 'SUMMON';
    const preferred=gap<235?'RADIAL':blocks||gap>405?'CHARGE':'FAN';return allowed.includes(preferred)?preferred:allowed[0];
  }
  function startBossWindup(b,forcePattern=null){
    b.pattern=forcePattern&&b.grade>=b.bossPattern.patterns[forcePattern]?forcePattern:chooseBossPattern(b);b.lastPattern=b.pattern;
    if(!BOSS_PATTERNS[b.pattern])throw Error(tr("runtime.phrase.23",{v0:b.pattern}));
    sfx.play('bossWindup');b.state='BOSS_WINDUP';b.patternStartedAtMs=timeMs;
    b.stateUntilMs=timeMs+bossParameters(b).windupMs;b.volleys=0;
    b.bossPattern.log.push(b.pattern);if(b.bossPattern.log.length>20)b.bossPattern.log.shift();if(b===stage.boss)stage.patternLog=[...b.bossPattern.log];
  }
  function updateBoss(b,dt,ctx){
    const knockedBack=timeMs<(b.shadowKnockbackUntilMs||0);
    const p=b.body,P=bossParameters(b),delta=norm(ctx.target.x-p.position.x,ctx.target.y-p.position.y);
    const distance=Math.hypot(ctx.target.x-p.position.x,ctx.target.y-p.position.y);
    if(b.state==='BOSS_RECOIL'){
      if(timeMs>=b.stateUntilMs)startBossWindup(b,'CHARGE');return;
    }
    if(b.state==='BOSS_CHARGE'){
      if(timeMs>=b.stateUntilMs){b.state='BOSS_RECOVER';b.stateUntilMs=timeMs+P.recoverMs;}return;
    }
    if(b.state==='BOSS_RECOVER'&&timeMs>=b.stateUntilMs&&!projectiles.some(s=>s.boss&&s.sourceUnitId===b.unitId))startBossWindup(b);
    if(b.state==='BOSS_WINDUP'){
      b.headingX=delta.x;b.headingY=delta.y;
      if(timeMs>=b.stateUntilMs){b.state='BOSS_LOCK';b.stateUntilMs=timeMs+P.lockMs;
        ringFx(p.position.x,p.position.y,b.config.radius+31,[1,.62,.3,1],220);}
    }else if(b.state==='BOSS_LOCK'&&timeMs>=b.stateUntilMs){
      const pattern=BOSS_PATTERNS[b.pattern];
      b.state='BOSS_EXEC';b.stateUntilMs=timeMs+(b.pattern==='CHARGE'?P.chargeDurationMs:pattern.executionMs);
      b.execStartedAtMs=timeMs;b.volleys=0;
      if(b.pattern==='CHARGE'){
        b.state='BOSS_CHARGE';sfx.play('bossCharge');BOSS_PATTERNS.CHARGE.fire(b,0);
      }
    }
    if(b.state==='BOSS_EXEC'){
      const elapsed=timeMs-b.execStartedAtMs;
      if(b.pattern==='SUMMON'){
        if(b.volleys===0&&elapsed>=P.summonAppearMs){const before=liveSummons(b.id).length;BOSS_PATTERNS.SUMMON.fire(b,0);if(liveSummons(b.id).length>before)sfx.play('bossSummon');b.volleys++;}
      }else{
        while(b.volleys<(b.grade>=5?2:1)&&elapsed>=b.volleys*225){sfx.play('boss'+b.pattern[0]+b.pattern.slice(1).toLowerCase());BOSS_PATTERNS[b.pattern].fire(b,b.volleys);b.volleys++;}
      }
      if(timeMs>=b.stateUntilMs){b.state='BOSS_RECOVER';b.stateUntilMs=timeMs+P.recoverMs;}
    }
    if(b.state==='BOSS_WINDUP'||b.state==='BOSS_LOCK'||b.state==='BOSS_EXEC'){
      if(knockedBack)return; // keep attack telegraph, but do not cancel physical recoil
      const v=speedOf(p),blend=1-Math.exp(-6*dt);setSpeed(p,v.x*(1-blend),v.y*(1-blend));return;
    }
    if(knockedBack)return;
    unitAdapter.chase(b,dt,ctx);
  }
  function breakBossObstacle(b,obstacle){
    if(!obstacle||b.state!=='BOSS_CHARGE')return;
    const p=b.bossParams,pos={...obstacle.body.position};
    b.state='BOSS_RECOIL';b.stateUntilMs=timeMs+p.recoilMs;bossObstaclesBroken++;
    World.remove(engine.world,obstacle.body);const ix=obstacles.indexOf(obstacle);if(ix>=0)obstacles.splice(ix,1);
    const n=norm(-b.headingX,-b.headingY);setSpeed(b.body,0,0);
    applyImpulse(b.body,{x:n.x*b.body.mass*p.chargeRecoilSpeed,y:n.y*b.body.mass*p.chargeRecoilSpeed});
    ringFx(pos.x,pos.y,125,[1,.70,.39,1],510);burst(pos.x,pos.y,300,38,[.95,.69,.41,1]);
  }

  function updateEnemies(dt){for(const e of [...unitsById.values()]){if(!e.alive)continue;
    // Expiry precedes every capability; retired summons cannot prepare/fire on their expiry tick.
    if(e.isSummon&&timeMs>=e.summonExpiresAtMs){e.die(DeathReason.expiry);continue;}
    if(e.isSummon&&timeMs<e.summonGrowUntilMs)continue;e.step(dt,combatWorld);
    if(e.evasion&&!evasionHintShown&&!isolatedScene&&phase==='PLAYING'&&Math.hypot(e.body.position.x-player.position.x,e.body.position.y-player.position.y)<C.enemy.evasion.presentation.hintRange){evasionHintShown=true;toast(message('elite.evasion.hint'),'#c8f0df',C.enemy.evasion.presentation.hintMs);}
  }}
  function updateProjectiles(){for(let i=projectiles.length-1;i>=0;i--){const shot=projectiles[i];
      // Arc flight owns its simulation-time lifetime, including slow-time/hitstop.
      if(shot.arc)continue;
      if(timeMs-shot.bornMs>shot.lifeMs||shot.body.position.x<5||shot.body.position.y<5||
         shot.body.position.x>C.world.width-5||shot.body.position.y>C.world.height-5){removeProjectile(shot);}
    }}
  function chooseEnemy(){let best=null,bestScore=Infinity;for(const e of enemies){if(!e.alive||e.targetable===false)continue;const d=Math.hypot(e.body.position.x-player.position.x,e.body.position.y-player.position.y);if(d>C.shadow.range+enemyDef(e).radius)continue;if(d<bestScore){best=e;bestScore=d;}}return best;}
  // Auto-aim preview and actual shot call the same selector. 14% hysteresis prevents
  // the laser jumping between nearly-equidistant targets on consecutive ticks.
  function aimPreview(){const nearest=chooseEnemy();if(!nearest){previewTargetId=null;return null;}
    const previous=enemies.find(e=>e.alive&&e.targetable!==false&&e.id===previewTargetId&&Math.hypot(e.body.position.x-player.position.x,e.body.position.y-player.position.y)<=C.shadow.range+enemyDef(e).radius);
    const d=e=>Math.hypot(e.body.position.x-player.position.x,e.body.position.y-player.position.y);
    const chosen=previous&&d(previous)<=d(nearest)*C.aim.swapHysteresis?previous:nearest;
    previewTargetId=chosen.id;return chosen;
  }
  function selectedAim(){return enemies.find(e=>e.alive&&e.id===previewTargetId)||aimPreview();}
  function pulseSporeDamage(x,y,sourceId,impact){if(!C.augment.spore.enabled||impact<=0)return;
    bloomImpact(x,y,'spore');let total=0;
    const range=C.augment.spore.radius;
    for(const e of enemies){if(!e.alive||e.id===sourceId)continue;
      const r=Math.hypot(e.body.position.x-x,e.body.position.y-y);
      if(r>=range)continue;
      const dmg=Math.min(e.hp,Math.round(impact*C.augment.spore.damageRate*(1-r/range)));
      if(dmg<=0)continue;const applied=damageUnit(e,{raw:outgoingDamage(dmg,e),resolved:true,deferDeath:true,kind:'area'},playerUnit);total+=applied;
      floatText(e.body.position.x,e.body.position.y,'-'+formatCombatNumber(applied),[.68,1,.63,1]);
      if(e.hp<=0){defeatEnemy(e);}
    }
    if(total>0){sfx.play('spore');}
  }
  // Tech amplifications are real authoritative effects, not particle callbacks.
  // They inspect only the already-resolved hit and use a fixed bounded target count.
  function impactArea(x,y,excludedId,damage,range,maxTargets=999){
    if(damage<=0)return 0;let healed=0,count=0;
    for(const target of enemies){if(count>=maxTargets)break;if(!target.alive||target.id===excludedId)continue;
      const distance=Math.hypot(target.body.position.x-x,target.body.position.y-y);
      if(distance>range)continue;
      const amount=Math.min(target.hp,outgoingDamage(damage*(1-distance/range),target));
      if(amount<=0)continue;
      damageUnit(target,{raw:amount,resolved:true,deferDeath:true,kind:'area'},playerUnit);healed+=amount;count++;
      floatText(target.body.position.x,target.body.position.y,`-${formatCombatNumber(amount)}`,[.65,.94,1,1]);
      burst(target.body.position.x,target.body.position.y,110,5,[.50,.82,1,1]);
      if(target.hp<=0){defeatEnemy(target);}
    }
    if(healed>0){sfx.play('spore');}
    return healed;
  }
  function impactPush(x,y,excludedId,speed){
    if(!hasTech('shockPush'))return;
    const range=C.augment.impact.pushRadius;
    ringFx(x,y,range,[.57,.91,1,1],360);
    for(const target of enemies){if(!target.alive||target.id===excludedId)continue;
      const d=Math.hypot(target.body.position.x-x,target.body.position.y-y);
      if(d>=range||d<1)continue;
      const n=norm(target.body.position.x-x,target.body.position.y-y);
      const amount=C.augment.impact.pushStrength*1*(1-d/range)*target.body.mass;
      applyImpulse(target.body,{x:n.x*amount,y:n.y*amount});
    }
  }
  function rayCircleDistance(px,py,dx,dy,x,y,r){const ox=x-px,oy=y-py,along=ox*dx+oy*dy;if(along<0)return Infinity;const side2=ox*ox+oy*oy-along*along;if(side2>r*r)return Infinity;return Math.max(0,along-Math.sqrt(Math.max(0,r*r-side2)));}
  function orbitAngle(slot,nowMs=timeMs){return ammoOrbitPhases[slot]+nowMs*.001*C.shadow.orbit.angularSpeedRadPerSec;}
  function resetAmmoOrbit(){ammoOrbitPhases=Array.from({length:C.shadow.ammo.maxCharges},(_,slot)=>C.shadow.orbit.phaseRad+slot*Math.PI*2/C.shadow.ammo.maxCharges);}
  function syncAmmoOrbitSlots(){
    ammoOrbitPhases.length=Math.min(ammoOrbitPhases.length,C.shadow.ammo.maxCharges);
    if(!ammoOrbitPhases.length){resetAmmoOrbit();return;}
    // Capacity additions fill an open arc. Existing ready/refilling slots keep their angles.
    while(ammoOrbitPhases.length<C.shadow.ammo.maxCharges){
      const angles=ammoOrbitPhases.map(a=>(a%(Math.PI*2)+Math.PI*2)%(Math.PI*2)).sort((a,b)=>a-b);
      let midpoint=angles[0],largest=-1;
      for(let i=0;i<angles.length;i++){const next=i+1<angles.length?angles[i+1]:angles[0]+Math.PI*2,gap=next-angles[i];
        if(gap>largest){largest=gap;midpoint=angles[i]+gap/2;}}
      ammoOrbitPhases.push(midpoint);
    }
  }
  function launchDirection(request){
    const target=request.targetId==null?null:enemies.find(e=>e.alive&&e.id===request.targetId);
    if(request.followTarget&&!target)return null;
    return request.followTarget?norm(target.body.position.x-player.position.x,target.body.position.y-player.position.y):{x:request.dirX,y:request.dirY};
  }
  function shadowLaunchGeometry(n,targetId){
    const center=player.position,radius=C.shadow.orbit.radius,sx=center.x+n.x*radius,sy=center.y+n.y*radius;
    const wallDist=Math.min(n.x>0?(C.world.width-30-sx)/n.x:n.x<0?(30-sx)/n.x:Infinity,
      n.y>0?(C.world.height-30-sy)/n.y:n.y<0?(30-sy)/n.y:Infinity);
    const limit=Math.min(C.shadow.range,wallDist);if(limit<10)return null;
    let detected=targetId==null?null:enemies.find(e=>e.alive&&e.id===targetId);
    if(!detected){let earliest=limit+radius;
      for(const e of enemies){if(!e.alive)continue;
        const hit=rayCircleDistance(center.x,center.y,n.x,n.y,e.body.position.x,e.body.position.y,enemyDef(e).radius+C.shadow.radius);
        if(hit<earliest){earliest=hit;detected=e;}}
    }
    // The orbit origin may overlap/pass a point-blank body. Resolve that contact only at creation.
    const initial=findShadowContact(center.x,center.y,sx,sy,true).enemy;
    if(initial)detected=initial;
    const gap=detected?Math.max(0,Math.hypot(sx-detected.body.position.x,sy-detected.body.position.y)-(enemyDef(detected).radius+C.shadow.radius)):limit;
    return {sx,sy,limit,gap,detected,initial};
  }
  function cancelPendingLaunch(){if(!pendingLaunch)return;
    // Resume the selected slot from its current angle, including a cancelled partial turn.
    ammoOrbitPhases[pendingLaunch.slot]=pendingLaunch.angle-timeMs*.001*C.shadow.orbit.angularSpeedRadPerSec;
    pendingLaunch=null;
    if(bufferedIntent?.kind==='dash'){bufferedIntent=null;bufferedUntilMs=0;}
  }
  function launch(dir,target,source='manual'){
    if(mode!=='READY'||!attackAmmo.charges||Math.hypot(dir.x,dir.y)<1e-6||target&&!target.alive)return false;
    const n=norm(dir.x,dir.y);if(!shadowLaunchGeometry(n,target?.id??null))return false;
    facePlayer(playerUnit.presentation,n);
    const angle=Math.atan2(n.y,n.x),turn=slot=>Math.atan2(Math.sin(angle-orbitAngle(slot)),Math.cos(angle-orbitAngle(slot)));
    const slot=attackAmmo.readySlots.reduce((best,id)=>Math.abs(turn(id))<Math.abs(turn(best))?id:best);
    pendingLaunch={slot,angle:orbitAngle(slot),dirX:n.x,dirY:n.y,targetId:target?.id??null,followTarget:!!target,source,elapsedMs:0,startedAtMs:timeMs};
    setAttackMode('ALIGN');return true;
  }
  function updateLaunchAlignment(dtMs){if(!pendingLaunch||mode!=='ALIGN')return false;
    const request=pendingLaunch,n=launchDirection(request);
    if(!n){setReadyState();endChain();return false;}
    if(timeMs===request.startedAtMs)return false;
    const left=Math.max(0,C.shadow.orbit.alignMs-request.elapsedMs),fraction=left>0?Math.min(1,dtMs/left):1;
    const desired=Math.atan2(n.y,n.x),turn=Math.atan2(Math.sin(desired-request.angle),Math.cos(desired-request.angle));
    request.angle+=turn*fraction;request.elapsedMs=Math.min(C.shadow.orbit.alignMs,request.elapsedMs+dtMs);
    if(request.elapsedMs<C.shadow.orbit.alignMs)return false;
    const geometry=shadowLaunchGeometry(n,request.targetId);
    if(!geometry){setReadyState();endChain();return false;}
    // One commit point for every source. Until this actual creation, cancellation costs nothing.
    if(!attackAmmo.consume(request.slot)){setReadyState();endChain();return false;}
    const {sx,sy,limit,gap,detected,initial}=geometry;
    // The spent slot reloads on its cruising phase; other slots never reindex.
    pendingLaunch=null;
    if(request.source==='manual'){endChain();manualLaunchCount++;}else if(request.source==='chain'){chainLaunchCount++;}else{echoLaunchCount++;}
    launchCount++;
    shadow={x:sx,y:sy,startX:sx,startY:sy,dirX:n.x,dirY:n.y,speed:C.shadow.initialSpeed,
      source:request.source,slot:request.slot,launchedAtMs:timeMs,travel:0,limit,age:0,targetId:detected?.id??null,followTarget:request.followTarget,
      goalX:sx+n.x*limit,goalY:sy+n.y*limit,initialGap:gap,arrived:false,contactAtMs:-Infinity};
    facePlayer(playerUnit.presentation,n);aimTargetId=detected?.id??null;setAttackMode('SHADOW');applyLaunchRecoil(n,sx,sy);sfx.play(request.source==='manual'?'launch':'echo');
    if(initial)endShadowAt(sx,sy,initial);
    return true;
  }
  function applyLaunchRecoil(n,x,y){
    shakeCamera('launch',{x:-n.x,y:-n.y});
    const c=C.shadow.recoil,back={x:-n.x,y:-n.y};
    launchRecoil={x:back.x,y:back.y,remaining:c.speed,startedAtMs:timeMs};
    applyImpulse(player,{x:back.x*player.mass*c.speed,y:back.y*player.mass*c.speed});
    const v=C.visual.launch;
    for(let i=0;i<v.exhaustParticles;i++){const side=(i/(Math.max(1,v.exhaustParticles-1))-.5)*2;
      addParticle(x-n.x*5-n.y*side*2,y-n.y*5+n.x*side*2,-n.x*v.exhaustSpeed-n.y*side*35,-n.y*v.exhaustSpeed+n.x*side*35,v.exhaustLifeMs,2,[.45,.9,1,.72]);}
  }
  function updateLaunchRecoil(dtMs){if(!launchRecoil)return;
    const r=launchRecoil,c=C.shadow.recoil,elapsed=timeMs-r.startedAtMs;
    const next=elapsed>=c.durationMs?0:r.remaining*Math.exp(-c.decayPerSec*dtMs/1000);
    const removable=r.remaining-next;
    if(removable>0)applyImpulse(player,{x:-r.x*player.mass*removable,y:-r.y*player.mass*removable});
    r.remaining=next;if(!next)launchRecoil=null;
  }
  function finishLaunchRecoil(){if(!launchRecoil)return;
    const r=launchRecoil;launchRecoil=null;
    applyImpulse(player,{x:-r.x*player.mass*r.remaining,y:-r.y*player.mass*r.remaining});
  }
  // Aim mode and launch cause are independent; every cause uses the same charge policy.
  function launchAuto(){const e=selectedAim();if(e){return launch({x:e.body.position.x-player.position.x,y:e.body.position.y-player.position.y},e);}return launch({x:1,y:0},null);}
  // The shadow can always be launched at a point-blank target, but the body
  // needs actual separation from that shadow before initiating a charge dash.
  function shadowSeparation(){return shadow?Math.hypot(player.position.x-shadow.x,player.position.y-shadow.y):0;}
  function shadowDashAvailable(){return !!shadow&&shadowSeparation()+1e-6>=C.shadow.minDashDistance;}
  function dash(automatic=false){if(playerUnit.status.frozenMs>0)return false;if((mode!=='SHADOW'&&mode!=='GOLDEN'&&mode!=='COYOTE')||!shadow)return false;
    if(!shadowDashAvailable())return false;
    finishLaunchRecoil();
    const charge=chargeOf(),curve=charge*charge*(3-2*charge),delta=C.dash.minSpeed+(C.dash.maxSpeed-C.dash.minSpeed)*curve;
    const n=norm(shadow.x-player.position.x,shadow.y-player.position.y);facePlayer(playerUnit.presentation,n);dashCharge=charge;dashHits.clear();attackDashSerial++;evadeHitRechargeUsed=false;
    if(!automatic)endChain(); // The existing shadow already paid for this attack; all dashes are free.
    const dashBonus=C.augment.momentum.enabled?Math.min(C.augment.momentum.maxMultiplier,1+Math.max(0,combo)*C.augment.momentum.perCombo):1;
    // One-time launch alignment: retain only forward momentum. Existing lateral or
    // backward velocity must not steer a directed dash away from the chosen shadow.
    // Do not home toward a moving enemy after this launch.
    const oldVelocity=speedOf(player);
    const forwardSpeed=Math.max(0,oldVelocity.x*n.x+oldVelocity.y*n.y);
    setSpeed(player,n.x*forwardSpeed,n.y*forwardSpeed);
    const initialDeltaV=delta*dashBonus*playerUnit.status.movementRate;
    applyImpulse(player,{x:n.x*player.mass*initialDeltaV,y:n.y*player.mass*initialDeltaV});
    // Charge changes propulsion, never damage directly. Acceleration is proportional
    // to the applied opening impulse (speed change), NOT elapsed shadow distance.
    dashMotion={dirX:n.x,dirY:n.y,acceleration:C.dash.acceleration*(initialDeltaV/C.dash.maxSpeed)*
      (hasTech('propulsion')?C.augment.motion.propulsionMultiplier:1),initialDeltaV};
    let v=speedOf(player),s=Math.hypot(v.x,v.y);if(s>C.physics.maxSpeed)setSpeed(player,v.x*C.physics.maxSpeed/s,v.y*C.physics.maxSpeed/s);
    attackOrigin=shadow.targetId;const timely=!shadow.arrived,modeBeforeDash=mode;
    // Launch timing is not hit confirmation. The dash remains armed while approaching a living target,
    // even after the short movement rearm interval. At distance, an early 390ms expiry used to
    // turn a PERFECT launch into an ordinary contact that only damaged the player.
    const target=shadow.targetId==null?null:enemies.find(e=>e.alive&&e.id===shadow.targetId);
    const travelGap=target?Math.max(0,Math.hypot(target.body.position.x-player.position.x,target.body.position.y-player.position.y)-C.player.radius-enemyDef(target).radius):0;
    const moveSpeed=Math.max(180,Math.hypot(v.x,v.y));
    const estimatedMs=travelGap/moveSpeed*1000;
    dashFlight=target?{targetId:target.id,initialGap:travelGap,untilMs:timeMs+clamp(estimatedMs*2+C.dash.flightMarginMs,C.dash.flightMinMs,C.dash.flightMaxMs)}:null;
    sfx.play(automatic?(shadow.targetId!==lastHit?.enemyId?'ricochet':'autoDash'):'dash');shadow=null;setAttackMode('DASH');dashStartedAtMs=timeMs;modeUntil=timeMs+C.dash.rearmMinMs;hitstopLeftMs=0;trailClock=0;
    const perfect=charge>=.985&&(timely||modeBeforeDash==='GOLDEN');
    dashPerfect=perfect;dashAutomatic=automatic;if(automatic){automaticDashes++;ringFx(player.position.x,player.position.y,54,[1,.86,.50,1],340);}
    if(perfect)bloomImpact(player.position.x,player.position.y,'perfect');
    burst(player.position.x,player.position.y,170,12,[.34,1,.76,1]);return true;}
  // Pointer and keyboard submit directions to the same defensive roll rules.
  function evade(x,y){
    const point={};cameraView.screenToPlaneInto(x,y,point);
    const diffX=point.x-player.position.x,diffY=point.y-player.position.y;
    return Math.hypot(diffX,diffY)<12?false:evadeDirection(diffX,diffY);
  }
  function evadeDirection(x,y){
    if(phase!=='PLAYING'||mode==='DEAD'||evadeCharges<1||Math.hypot(x,y)<1e-6)return false;
    const direction=norm(x,y);finishLaunchRecoil();
    // Roll interrupts the offensive dash. Already-spent shadow charges are not refunded.
    if(mode==='ALIGN'||mode==='SHADOW'||mode==='GOLDEN'||mode==='COYOTE'||mode==='DASH'||mode==='RECOVER'){
      shadow=null;setReadyState();dashHits.clear();
      endChain();dashAutomatic=false;
      bufferedIntent=null;bufferedUntilMs=0;
    }
    if(evadeMotion){
      // Remove the unspent bonus, not the pre-existing inertia.
      const old=speedOf(player);
      const available=Math.max(0,old.x*evadeMotion.x+old.y*evadeMotion.y);
      const subtraction=Math.min(evadeMotion.remaining,available);
      setSpeed(player,old.x-evadeMotion.x*subtraction,old.y-evadeMotion.y*subtraction);
    }
    const initial=speedOf(player);
    const impulse=C.evade.impulseSpeed*playerUnit.status.movementRate;
    applyImpulse(player,{x:direction.x*player.mass*impulse,y:direction.y*player.mass*impulse});
    evadeMotion={x:direction.x,y:direction.y,remaining:impulse,startedAtMs:timeMs,lastParticleMs:timeMs,
      baselineForward:Math.max(0,initial.x*direction.x+initial.y*direction.y)};
    rollPlayer(playerUnit.presentation,direction,timeMs,C.evade.durationMs);evadeStartedAtMs=timeMs;evadeCharges--;evadeActions++;sfx.play('evade');
    if(!evadeRefillAtMs)evadeRefillAtMs=timeMs+C.evade.rechargeMs;
    ringFx(player.position.x,player.position.y,29,[.42,.85,1,1],220);
    return true;
  }
  function settleEvadeRecharge(){
    // Sequential charges share one clock; keep surplus progress from a successful hit.
    while(evadeCharges<C.evade.maxCharges&&evadeRefillAtMs&&timeMs+1e-8>=evadeRefillAtMs){
      evadeCharges++;evadeRefillAtMs=evadeCharges<C.evade.maxCharges?evadeRefillAtMs+C.evade.rechargeMs:0;
      burst(player.position.x,player.position.y,75,4,[.44,.9,1,1]);
    }
  }
  function rechargeEvadeOnDashHit(){
    if(!hasTech('evadeHitRecharge')||evadeHitRechargeUsed)return;
    evadeHitRechargeUsed=true;settleEvadeRecharge();
    if(evadeCharges>=C.evade.maxCharges||!evadeRefillAtMs)return; // Full charges do not bank credit.
    const chargesBefore=evadeCharges,progressBefore=evadeRefillProgress();
    const rate=Math.min(C.evade.hitRechargeRate,C.evade.maxCharges-evadeCharges-progressBefore);
    const advanceMs=C.evade.rechargeMs*rate;evadeRefillAtMs-=advanceMs;settleEvadeRecharge();
    evadeHitRechargeEvents++;evadeHitRechargeProgress+=rate;
    evadeLastHitRecharge={dashSerial:attackDashSerial,atMs:timeMs,rechargeMs:C.evade.rechargeMs,rate,advanceMs,
      chargesBefore,progressBefore,chargesAfter:evadeCharges,progressAfter:evadeRefillProgress()};
  }
  function updateEvade(dt){
    settleEvadeRecharge();
    if(!evadeMotion)return;
    // Exponential removal of only the extra roll impulse; normal inertia and collisions persist.
    const r=evadeMotion,remainingOld=r.remaining;
    const elapsed=timeMs-r.startedAtMs;
    const next=elapsed>=C.evade.durationMs?0:remainingOld*Math.exp(-C.evade.decayPerSec*dt);
    // Avoid pulling the player backwards when friction or a collision already
    // consumed part of the bonus. Preserve pre-roll forward inertia.
    const current=speedOf(player);
    const forward=current.x*r.x+current.y*r.y;
    const baseline=r.baselineForward*Math.exp(-C.physics.frictionAir*(elapsed/(1000/C.sim.tps)));
    const removable=Math.min(remainingOld-next,Math.max(0,forward-baseline));
    if(removable>0)applyImpulse(player,{x:-r.x*player.mass*removable,y:-r.y*player.mass*removable});
    r.remaining=next;
    if(timeMs-r.lastParticleMs>=C.evade.particleRateMs){
      r.lastParticleMs=timeMs;addParticle(player.position.x,player.position.y,-r.x*70,-r.y*70,185,4,[.50,.87,1,.73]);
    }
    if(next<=.01)evadeMotion=null;
  }

  // A tap is captured once at its original screen/world direction, never projected later after the camera moves.
  function captureIntent(kind,x,y){if(kind==='auto')return {kind:'auto'};
    const out={};cameraView.screenToPlaneInto(x,y,out);
    const dx=out.x-player.position.x,dy=out.y-player.position.y;
    return Math.hypot(dx,dy)<18?{kind:'auto'}:{kind:'direction',x:dx,y:dy};
  }
  function launchIntent(intent){return intent.kind==='auto'?launchAuto():launch({x:intent.x,y:intent.y},null);}
  // A short input buffer bridges the final part of recovery; the cue stays physical rather than a fake reticle.
  function tap(kind,x,y){if(mode==='SHADOW'||mode==='GOLDEN'||mode==='COYOTE'){dash();return;}
    if(mode==='DEAD')return;
    if(mode==='ALIGN'){bufferedIntent={kind:'dash'};bufferedUntilMs=timeMs+C.dash.inputBufferMs;return;}
    const intent=captureIntent(kind,x,y);
    if(mode==='READY'){launchIntent(intent);return;}
    if(mode==='DASH'||mode==='RECOVER'){
      // A reservation cancels the automatic chain only if a manual launch actually succeeds.
      bufferedIntent=intent;bufferedUntilMs=timeMs+C.dash.inputBufferMs;
      // The converging ring and the button display the accepted buffered command; do not obscure gameplay.
    }
  }
  function tryBufferedLaunch(){if(!bufferedIntent)return false;
    const intent=bufferedIntent;const valid=timeMs<=bufferedUntilMs;
    bufferedIntent=null;bufferedUntilMs=0;
    return valid&&intent.kind!=='dash'?launchIntent(intent):false;
  }
  function noteMissRecovery(){
    if(missRecoverySerial===attackDashSerial)return;
    missRecoverySerial=attackDashSerial;missRecoveryEvents++;
    missRecoveryPulseUntilMs=timeMs+C.visual.missRecovery.pulseMs;
    if(!missHintShown){missHintShown=true;missRecoveryHintUntilMs=timeMs+C.visual.missRecovery.hintMs;}
  }
  function setAttackMode(next){if(next!=='ALIGN')cancelPendingLaunch();mode=next;missRecoveryActive=false;}
  function setReadyState(){setAttackMode('READY');modeUntil=0;dashMotion=null;dashFlight=null;finishLaunchRecoil();}
  function beginReady(){setReadyState();readyFlashUntilMs=timeMs+200;
    tryBufferedLaunch();
  }
  function beginRecover(){setAttackMode('RECOVER');dashMotion=null;dashFlight=null;recoverStartedAtMs=timeMs;modeUntil=timeMs+C.chain.recoverMinMs;}
  function dashFlightProgress(){
    if(!dashFlight)return 0;
    const target=enemies.find(e=>e.alive&&e.id===dashFlight.targetId);
    if(!target)return 0;
    const gap=Math.max(0,Math.hypot(target.body.position.x-player.position.x,target.body.position.y-player.position.y)-C.player.radius-enemyDef(target).radius);
    return clamp(1-gap/Math.max(1,dashFlight.initialGap),0,1);
  }
  function rearmProgress(){if(mode==='DASH'){
      const age=Math.max(0,timeMs-dashStartedAtMs),velocity=speedOf(player),speed=Math.hypot(velocity.x,velocity.y);
      const minProgress=clamp(age/C.dash.rearmMinMs,0,1);
      const momentumProgress=clamp(C.dash.rearmSpeed/Math.max(C.dash.rearmSpeed,speed),0,1);
      return clamp(Math.max(age/Math.max(C.dash.rearmMinMs,C.dash.rearmMaxMs),minProgress*momentumProgress),0,1);
    }
    if(mode==='RECOVER'){
      const age=Math.max(0,timeMs-recoverStartedAtMs);
      const target=attackOrigin==='any'?chooseEnemy():enemies.find(e=>e.alive&&e.id===attackOrigin);
      const gap=target?Math.hypot(target.body.position.x-player.position.x,target.body.position.y-player.position.y):Infinity;
      const separationProgress=target?clamp(gap/C.chain.targetMinGap,0,1):1;
      return clamp(Math.max(age/C.chain.maxWaitMs,Math.min(age/C.chain.recoverMinMs,separationProgress)),0,1);
    }
    return mode==='READY'?1:0;
  }
  function processInputs(){
    if(ultimateRunner.active||playerUnit.status.frozenMs>0){pending.length=0;actions.consume();return;}
    actions.sampleInto('fire',sampleFire);if(sampleFire.pressed)pending.push({kind:'auto'});
    const {up,left,down,right}=evadeSamples;
    actions.sampleInto('evadeUp',up);actions.sampleInto('evadeLeft',left);
    actions.sampleInto('evadeDown',down);actions.sampleInto('evadeRight',right);
    if(up.pressed||left.pressed||down.pressed||right.pressed){
      // Include short taps released before this tick; holding alone never repeats.
      const x=Number(right.held||right.pressed)-Number(left.held||left.pressed);
      const y=Number(down.held||down.pressed)-Number(up.held||up.pressed);
      if(x||y)pending.push({kind:'evadeDirection',x,y});
    }
    actions.consume();
    const cmds=pending.splice(0);for(const cmd of cmds){
      if(cmd.kind==='point')evade(cmd.x,cmd.y);
      else if(cmd.kind==='evadeDirection')evadeDirection(cmd.x,cmd.y);
      else tap('auto');
    }
  }
  function handleCollision(evt){for(const pair of evt.pairs){
      if(!acceptVolumeContact(pair.bodyA,pair.bodyB))continue;
      const solidOther=pair.bodyA===player?pair.bodyB:pair.bodyB===player?pair.bodyA:null;
      if(solidOther&&!solidOther.isSensor){const pv=playerUnit.pre,op=solidOther.position,pp=player.position,n=norm(op.x-pp.x,op.y-pp.y);
        impactPlayer(playerUnit.presentation,n,Math.max(0,pv.x*n.x+pv.y*n.y),timeMs);}
      // A solid solver contact owns the outgoing velocity. Never undo pre-contact recoil after a bounce.
      if(launchRecoil&&((pair.bodyA===player&&!pair.bodyB.isSensor)||(pair.bodyB===player&&!pair.bodyA.isSensor)))launchRecoil=null;
      const unitA=unitsByBody.get(pair.bodyA.id),unitB=unitsByBody.get(pair.bodyB.id);
      if(mode==='DASH'){const target=pair.bodyA===player?unitB:pair.bodyB===player?unitA:null;target?.evasionContact?.(attackDashSerial);}
      for(const [unit,other] of [[unitA,pair.bodyB],[unitB,pair.bodyA]])if(unit?.bossPattern&&unit.state==='BOSS_CHARGE'&&other.label==='obstacle'){
        const obstacle=obstacles.find(o=>o.body===other);if(obstacle)breakBossObstacle(unit,obstacle);}
      const shot=projectileById.get(pair.bodyA.id)||projectileById.get(pair.bodyB.id);
      if(shot){const other=shot.body===pair.bodyA?pair.bodyB:pair.bodyA,target=other===player?playerUnit:unitsByBody.get(other.id);
        // A projectile may outlive its owner; source identity/faction/payload are immutable at spawn.
        const source={...shot.source,attacker:shot.source,alive:true,faction:shot.faction,unitId:shot.sourceUnitId};
        if(target&&hostile(source,target))projectileContact(shot,target);
        else if(other.label==='wall'||other.label==='obstacle')removeProjectile(shot);continue;
      }
      if(unitA&&unitB){if(hostile(unitA,unitB)){unitA.contact(unitB,timeMs);unitB.contact(unitA,timeMs);}else spreadFireAtContact(unitA,unitB);continue;}
      let e=null;
      if(pair.bodyA===player)e=enemiesById.get(pair.bodyB.id);
      else if(pair.bodyB===player)e=enemiesById.get(pair.bodyA.id);
      if(!e||!e.alive||mode==='DEAD')continue;
      const cfg=enemyDef(e);
      const attacking=mode==='DASH'&&!dashHits.has(e.id);if(attacking)dashHits.add(e.id);
      const n=norm(e.preX-player.plugin.prePosX,e.preY-player.plugin.prePosY);
      const relX=player.plugin.preX-e.pre.x,relY=player.plugin.preY-e.pre.y;
      const impactSpeed=Math.max(0,relX*n.x+relY*n.y);
      // ONLY collision closing speed determines base outgoing damage, independent
      // of charge or travel distance. Any later effects modify actual hit results.
      const base=attacking?collisionDamage(playerUnit,e):0;
      const critical=base>0&&isCritical();
      const raw=base*(critical?C.stats.criticalDamage:1);
      const theoretical=outgoingDamage(raw,e);
      const conducted=theoretical>0&&hasTech('conduct')&&e.conductUntilMs>timeMs;
      const boosted=conducted?outgoingDamage(raw*(1+C.element.lightning.nextHitBonusRate),e):theoretical;
      const inflicted=Math.max(0,Math.min(e.hp,boosted));
      const received=e.contact(playerUnit,timeMs),touch=received>0;
      if(touch)recordVolume('contact',e,{feetZ:e.body.plugin.volume.feetZ,previousFeetZ:e.body.plugin.volume.previousFeetZ,damage:received});
      if(inflicted>0){

        const conductDamage=conducted?Math.max(0,inflicted-Math.min(e.hp,theoretical)):0;
        if(conducted){e.conductUntilMs=0;elementalEvents.conductConsumed++;elementalEvents.conductDamage+=conductDamage;}
        lastHit={tick,enemyId:e.id,automatic:dashAutomatic,critical,criticalMultiplier:critical?C.stats.criticalDamage:1,
          raw,normalDamage:theoretical,boostedDamage:boosted,damage:inflicted,conductDamage,markConsumed:conducted,
          tags:['dash',...(critical?['critical']:[]),...(conducted?['conduct']:[])]};
        playImpact(impactSpeed);if(impactSpeed>=C.camera.shake.hit.minSpeed)shakeCamera('hit',n);if(critical)sfx.play('perfect');damageUnit(e,{raw:inflicted,resolved:true,deferDeath:true,kind:'dash'},playerUnit);if(hasTech('iceShatter')&&e.status.shatter(C.element.frost)){const extra=damageUnit(e,{raw:C.stats.attackPower*C.element.frost.shatterRate,stats:C.stats,deferDeath:true,kind:'shatter'},playerUnit);recordVolume('ice-shatter',e,{damage:extra,dashPerfect,frozenConsumed:true});burst(e.body.position.x,e.body.position.y,220,14,[.73,.97,1,1]);ringFx(e.body.position.x,e.body.position.y,65,[.65,.92,1,.9],450);}hits++;combo++;recordNormalAttackHit();onComboHit(combo);rechargeEvadeOnDashHit();
        if(!dashAutomatic&&dashPerfect)manualPerfectHits++;
        // Timing still qualifies the first manual hit. Follow-ups consume only when their new shadow actually spawns.
        const canChain=hasTech('autoChain')&&(dashAutomatic?chainActive:dashCharge+1e-8>=C.chain.minTriggerCharge);
        const killed=e.hp<=0,targetId=canChain?followTargetAfterHit(e,killed):null;
        prepareChainFollowup(targetId,dashAutomatic);autoChainRolls++;

        // Only cumulative kills grant levels. Hits no longer grant currency.
        beginRecover();hitstopLeftMs=Math.max(hitstopLeftMs,C.timing.hitstopMs);
        const cp={x:(player.position.x+e.body.position.x)/2,y:(player.position.y+e.body.position.y)/2};shockwave(cp.x,cp.y);
        if(critical){criticalHits++;bloomImpact(cp.x,cp.y,'perfect');}
        floatText(cp.x,cp.y,`${critical?'✦ ':''}${conducted?'ϟ ':''}-${formatCombatNumber(inflicted)}`,critical?[1,.64,.97,1]:inflicted>=80?[1,.83,.45,1]:[.93,.94,.80,1]);
        applyConduct(e,cp.x,cp.y,lastHit);
        applyIgnite(e,inflicted);
        pulseSporeDamage(cp.x,cp.y,e.id,inflicted);
        impactPush(cp.x,cp.y,e.id,impactSpeed);
        if(hasTech('sporeSplit'))impactArea(cp.x,cp.y,e.id,inflicted*C.augment.impact.splitDamageRate,165,2);
        if(hasTech('rebound')){
          const amount=C.augment.motion.reboundImpulse*player.mass;
          applyImpulse(player,{x:-n.x*amount,y:-n.y*amount});
        }
        if(killed&&hasTech('finisher')){
          ringFx(cp.x,cp.y,C.augment.impact.finishRadius,[1,.62,.30,1],480);
          impactArea(cp.x,cp.y,e.id,inflicted*C.augment.impact.finishDamageRate,C.augment.impact.finishRadius);
        }
        if(killed){defeatEnemy(e);
          burst(cp.x,cp.y,240,32,[1,.48,.32,1]);toast(message('ui.knockout',{count:combo}),'#fbd18b',800);
          if(chainTargetId!=null){attackOrigin=chainTargetId;}else{attackOrigin=null;autoChainReady=false;}
        }else{attackOrigin=attackAmmo.charges>0?(chainTargetId??e.id):null;toast(combo>1?`✦ ×${combo}`:'✦','#ffdba0',430);}
        dashAutomatic=false;
      }else if(touch)toast(message("runtime.98",{v0:formatCombatNumber(received)}),'#ff9e95',420);
    }}
  // Combo presentation only. Only a resolved positive-damage body collision increments it.
  // Replaying or drawing this effect never mutates health, physics or hit counts.
  const comboFx=$('comboFx'),comboFxCount=$('comboFxCount'),comboFxEcho=$('comboFxEcho'),comboScreen={};
    function ultimateTargets(range){const p=player.position;return enemies.filter(e=>e.alive&&hostile(playerUnit,e)&&Math.hypot(e.body.position.x-p.x,e.body.position.y-p.y)<=range&&contactWindow(player,e.body,false,1,1)&&clearCapabilityPath(p,e.body.position,6)).sort((a,b)=>Math.hypot(a.body.position.x-p.x,a.body.position.y-p.y)-Math.hypot(b.body.position.x-p.x,b.body.position.y-p.y));}
  function ultimateSafePoint(goal,from){return clearCapabilityPath(from,goal,C.player.radius)?{x:goal.x,y:goal.y}:{x:from.x,y:from.y};}
  // Reserve ammo now; hold the qualifying combo through the cast, then consume it once in endUltimate.
  function consumeUltimateCosts(cost){if(combo<cost.comboHits||attackAmmo.charges<cost.ammo)return false;const slots=attackAmmo.readySlots.slice(0,cost.ammo);for(const slot of slots)attackAmmo.consume(slot);return true;}
  function beginUltimate(){comboFxCount.textContent=comboFxEcho.textContent='×'+combo;endChain();shadow=null;pendingLaunch=null;launchRecoil=null;dashMotion=null;dashFlight=null;evadeMotion=null;attackOrigin=null;bufferedIntent=null;bufferedUntilMs=0;hitstopLeftMs=0;pending.length=0;input.releaseAll('ultimate');actions.consume();setAttackMode('ULTIMATE');}
  function endUltimate(reason){hitstopLeftMs=0;setSpeed(player,0,0);pending.length=0;bufferedIntent=null;input.releaseAll('ultimate-end');actions.consume();endChain();combo=0;if(mode==='ULTIMATE')beginReady();if(reason!=='complete')for(const shot of [...projectiles])if(shot.payload.kind==='ultimate')removeProjectile(shot);}
  function ultimateHit(target,power,state,push=0,floating=false,hitText=null){if(!target.alive||!ultimateRunner.active||!contactWindow(player,target.body,false,1,1))return 0;const source=hitText?{...playerUnit,attacker:playerUnit,presentation:{hitText}}:playerUnit;const damage=damageUnit(target,{raw:C.stats.attackPower*power,stats:C.stats,kind:'ultimate',floating},source);ultimateRunner.damage+=damage;
    if(damage>0){ultimateRunner.impact();ultimateRunner.effect({kind:'impact',strength:state.phase.impactSize??1,x1:target.body.position.x,y1:target.body.position.y,color:state.skill.color,lifeMs:220});if(target.alive&&push){const n=norm(target.body.position.x-player.position.x,target.body.position.y-player.position.y);applyImpulse(target.body,{x:n.x*push*target.body.mass,y:n.y*push*target.body.mass});}}return damage;}
  function updateUltimateGeometry(state){const contact=state.phase.contact;if(contact?.kind==='wave')state.wave={origin:{...player.position},radius:contact.radius*Math.sin(ultimateRunner.progress()*Math.PI/2),progress:ultimateRunner.progress()};
    const attack=state.phase.attack;if(attack?.kind!=='beam')return;
    const p=player.position,d=state.direction,from={x:p.x+d.x*C.player.radius,y:p.y+d.y*C.player.radius},width=beamWidth(attack,state.elapsedMs,state.phase.durationMs);
    let length=attack.length;const tip=n=>({x:from.x+d.x*n,y:from.y+d.y*n});
    if(!clearCapabilityPath(from,tip(length),width/2)){let min=0,max=length;for(let i=0;i<10;i++){const middle=(min+max)/2;if(clearCapabilityPath(from,tip(middle),width/2))min=middle;else max=middle;}length=min;}
    state.beam={from,to:tip(length),width,length};
  }
  let frostFields=[];
  function skillAreaTargets(point,radius){return enemies.filter(e=>e.alive&&hostile(playerUnit,e)&&contactWindow(player,e.body,false,1,1)&&Math.hypot(e.body.position.x-point.x,e.body.position.y-point.y)<=radius+e.body.circleRadius&&clearCapabilityPath(point,e.body.position,4));}
  function updateFrostFields(ms){for(const field of frostFields){const active=Math.min(ms,field.leftMs);field.leftMs-=active;field.pulseMs-=active;
      while(field.pulseMs<=1e-7){for(const target of skillAreaTargets(field,field.radius))target.status.cold(target,field.source,{...C.element.frost,freeze:false,slowRate:field.slowRate});field.pulseMs+=field.intervalMs;}}
    frostFields=frostFields.filter(field=>field.leftMs>0);}
  function setConductMark(target){target.conductUntilMs=timeMs+C.element.lightning.markDurationMs;}
  function elementalSkillAttack(attack,state,pulse){const point=state.aim,color=state.skill.color;
    if(attack.kind==='iceGarden'){
      for(const target of skillAreaTargets(point,attack.radius)){const damage=ultimateHit(target,attack.power,state);if(damage>0&&target.alive)target.status.cold(target,playerUnit,{...C.element.frost,freeze:true,freezeMs:attack.freezeMs});}
      if(frostFields.length>=attack.maxFields)frostFields.shift();frostFields.push({...point,radius:attack.radius,leftMs:attack.fieldMs,lifeMs:attack.fieldMs,pulseMs:attack.intervalMs,intervalMs:attack.intervalMs,slowRate:attack.slowRate,source:playerUnit});
      ringFx(point.x,point.y,attack.radius,[...color,.9],attack.intervalMs*2);burst(point.x,point.y,180,16,[...color,1]);recordVolume('skill-ice-garden',playerUnit,{...point,radius:attack.radius});return;
    }
    if(attack.kind==='lightningChain'){
      if(state.chainEnded||state.hitIds.size>=attack.maxTargets)return;const from=state.chainPoint??player.position;
      const targets=pulse===0?ultimateTargets(state.skill.range):enemies.filter(e=>e.alive&&hostile(playerUnit,e)&&contactWindow(player,e.body,false,1,1)&&!state.hitIds.has(e.unitId)&&Math.hypot(e.body.position.x-from.x,e.body.position.y-from.y)<=attack.jumpRange&&clearCapabilityPath(from,e.body.position,4)).sort((a,b)=>Math.hypot(a.body.position.x-from.x,a.body.position.y-from.y)-Math.hypot(b.body.position.x-from.x,b.body.position.y-from.y));
      const target=targets.find(e=>!state.hitIds.has(e.unitId));if(!target){state.chainEnded=true;return;}
      const to={...target.body.position};state.hitIds.add(target.unitId);state.chainPoint=to;const damage=ultimateHit(target,pulse===0?attack.firstPower:attack.power,state);
      if(damage>0){if(target.alive){setConductMark(target);elementalEvents.conduct++;}addLightningArc(from,to);sfx.play('chainPulse');burst(to.x,to.y,100,6,[...color,1]);recordVolume('skill-lightning-hit',target,{pulse,damage});}return;
    }
    if(attack.kind==='fireSeed'){
      const p=player.position,distance=Math.hypot(point.x-p.x,point.y-p.y),travelMs=Math.max(attack.minTravelMs,distance/attack.speed*1000);
      addShot(playerUnit,{radius:attack.shotRadius,height:attack.shotHeight,damage:C.stats.attackPower*attack.power,push:0,lifeMs:attack.lifeMs,kind:'ultimate',color,impactRadius:attack.radius,impactHeight:C.player.height,
        arc:groundArc({...p,z:attack.startZ},{...point,z:0},travelMs,attack.arcHeight),impact:attack});recordVolume('skill-fire-launch',playerUnit,{...point,travelMs});return;
    }
    if(attack.kind==='acidFountain'){createAcidPool(playerUnit,point,attack.radius,attack);ringFx(point.x,point.y,attack.radius,[...color,.9],attack.intervalMs);recordVolume('skill-acid-fountain',playerUnit,{...point,radius:attack.radius});}
  }
  function drawFrostFields(){for(const field of frostFields){const fade=Math.min(1,field.leftMs/450),age=field.lifeMs-field.leftMs,growth=Math.min(1,age/180);
    paint.ellipse(field.x,field.y,field.radius,field.radius,[.23,.60,.76,.09*fade],30);drawArc(field.x,field.y,field.radius,0,Math.PI*2,32,1.8,[.64,.92,1,.64*fade]);
    for(let i=0;i<6;i++){const a=i*Math.PI/3,reach=field.radius*.78*growth,x=field.x+Math.cos(a)*reach,y=field.y+Math.sin(a)*reach;paint.line(field.x,field.y,x,y,1.7,[.63,.93,1,.47*fade]);for(const side of [-1,1]){const b=a+side*Math.PI/3;paint.line(x,y,x-Math.cos(b)*reach*.25,y-Math.sin(b)*reach*.25,1.6,[.79,.98,1,.55*fade]);}}
    drawArc(field.x,field.y,field.radius+5,-Math.PI/2,-Math.PI/2+Math.PI*2*field.leftMs/field.lifeMs,30,1.2,[.80,.97,1,.7*fade]);}}
  function drawAcidFountain(pool){const age=pool.durationMs-pool.leftMs,fade=Math.min(1,pool.leftMs/400),jet=Math.max(0,1-age/350),pulse=1-pool.pulseMs/pool.intervalMs;
    for(let i=0;i<6;i++){const a=i*Math.PI/3+age*.0005,r=pool.radius*(.18+.18*pulse),x=pool.x+Math.cos(a)*r,y=pool.y+Math.sin(a)*r;
      if(jet>0)paint.line(pool.x,pool.y,x,y-48*jet,2.2,[.81,1,.40,fade*.8]);paint.ellipse(x,y-jet*30,2.5+jet*2,2.5+jet*2,[.78,.96,.30,fade*(.45+.3*pulse)],10);}
    paint.ellipse(pool.x,pool.y,10,6,[.87,1,.48,fade*.7],14);}

  function ultimateAttack(attack,state,pulse){const p=player.position;if(['iceGarden','lightningChain','fireSeed','acidFountain'].includes(attack.kind)){elementalSkillAttack(attack,state,pulse);return;}
    if(attack.kind==='beam'){
      const beam=state.beam;if(!beam||beam.width<=0)return;
      for(const target of enemies){if(!ultimateRunner.active)break;if(target.alive&&beamIntersects(beam,target.body))ultimateHit(target,attack.damageBudget/attack.atMs.length,state,0,true,attack.hitText);}
      if(pulse===0)burst(beam.from.x,beam.from.y,150,14,[...state.skill.color,1]);
    }
    if(attack.kind==='spores'){for(let i=0;i<attack.count;i++){const angle=(pulse*attack.count+i)*Math.PI*2/(attack.atMs.length*attack.count);addShot(playerUnit,{radius:4,height:8,speed:attack.speed,angle,damage:C.stats.attackPower*attack.power,push:0,lifeMs:attack.lifeMs,kind:'ultimate',color:state.skill.color});}}
  }
  function ultimateContact(attack,state,progress){const p=player.position,radius=attack.radius?(state.wave?.radius??attack.radius*Math.sin(progress*Math.PI/2)):0;
    for(const e of enemies){if(!e.alive||state.hitIds.has(e.unitId)||!ultimateRunner.active)continue;
      const contact=attack.kind==='dash'?contactWindow(player,e.body):Math.hypot(e.body.position.x-p.x,e.body.position.y-p.y)<=radius+e.body.circleRadius;
      if(!contact||!contactWindow(player,e.body,false,1,1)||!clearCapabilityPath(p,e.body.position,4))continue;
      state.hitIds.add(e.unitId);ultimateHit(e,attack.power,state,attack.push||0);
    }
  }
  function recordNormalAttackHit(){if(ultimateLoadout.recordHit(attackDashSerial))ultimateRunner.normalHits++;}
  function updateUltimateHud(){const status=ultimateRunner.snapshot(),next=ultimateLoadout.next(),required=ultimateLoadout.requirements(status.id??next?.id??status.slots.find(slot=>slot.id)?.id);
    $('ultimateHud').hidden=phase!=='PLAYING';$('ultimateCombo').textContent=tr('ultimate.combo',{count:Math.min(combo,required.comboHits),required:required.comboHits});
    const reason=status.active?tr('ultimate.casting',{name:tr('ultimate.'+status.id+'.name')}):!status.slots.some(slot=>slot.id)?tr('ultimate.equipHint'):!next?tr('ultimate.charging'):combo<required.comboHits?tr('ultimate.comboHint'):attackAmmo.charges<required.ammo?tr('ultimate.noAmmo'):tr('ultimate.ready');
    $('ultimateStatus').textContent=reason;
    for(const slot of status.slots){const button=ultimateHudSlots[slot.index],skill=C.ultimates.skills[slot.id];button.dataset.next=String(slot.next);button.dataset.casting=String(status.active&&slot.index===ultimateRunner.state.slot);button.dataset.locked=String(slot.locked);
      const progress=slot.id?1-slot.remainingHits/slot.requiredHits:0;button.style.setProperty('--ready',String(progress*100)+'%');button.style.setProperty('--skill',skill?'rgb('+skill.color.map(v=>Math.round(v*255)).join(',')+')':'#55756b');button.querySelector('b').textContent=slot.locked?'▣':skill?.symbol||'·';button.querySelector('small').textContent=slot.remainingHits?String(slot.remainingHits):slot.id?'✓':'—';button.setAttribute('aria-label',slot.locked?tr('ultimate.slotLocked',{slot:slot.index+1}):tr('ultimate.slotStatus',{slot:slot.index+1,name:slot.id?tr('ultimate.'+slot.id+'.name'):tr('ultimate.empty'),remaining:slot.remainingHits,comboHits:slot.id?ultimateLoadout.requirements(slot.id).comboHits:C.ultimates.trigger.comboHits}));
    }
  }
  const ultimateHudSlots=[];for(let i=0;i<C.ultimates.slots.max;i++){const el=document.createElement('div');el.className='ultimate-hud-slot';el.setAttribute('role','img');el.innerHTML='<b></b><small></small>';ultimateHudSlots.push(el);$('ultimateCombatSlots').append(el);}
  function ultimateDescription(id){const skill=C.ultimates.skills[id],tracking=skill.sequence.find(phase=>phase.tracking)?.tracking;const attack=skill.sequence.find(phase=>phase.attack)?.attack??{};return tr("ultimate."+id+".desc",{turnRate:tracking?.angularSpeedDegPerSec,radius:attack.radius,powerPercent:(attack.firstPower??attack.power??attack.powerRate??0)*100,followPowerPercent:(attack.power??0)*100,freezeSeconds:(attack.freezeMs??0)/1000,fieldSeconds:(attack.fieldMs??attack.poolMs??0)/1000,intervalSeconds:(attack.intervalMs??0)/1000,maxTargets:attack.maxTargets,burnSeconds:C.element.fire.durationMs/1000,slowPercent:(attack.slowRate??0)*100,armorPercent:C.element.acid.armorReduction*100,markSeconds:C.element.lightning.markDurationMs/1000})+" "+tr("ultimate.activation",{...C.ultimates.trigger,...skill.trigger});}
  function updateUltimatePreparation(){const selected=ultimateLoadout.snapshot();$('ultimateEquipSlots').replaceChildren();
    for(const slot of selected.slots){const box=document.createElement('div');box.className='ultimate-equip-slot';box.dataset.slot=slot.index;const button=document.createElement('button');button.type='button';button.disabled=slot.locked;button.className='ultimate-equipped';button.dataset.ultimateSlot=slot.index;
      button.textContent=slot.locked?tr('ultimate.slotLocked',{slot:slot.index+1}):slot.id?C.ultimates.skills[slot.id].symbol+' '+tr('ultimate.'+slot.id+'.name'):tr('ultimate.slotEmpty',{slot:slot.index+1});button.onclick=()=>{ultimateLoadout.unequip(slot.index);persistTech();updateUltimatePreparation();};box.append(button);
      for(const [delta,symbol]of [[-1,'←'],[1,'→']]){const move=document.createElement('button');move.type='button';move.className='ultimate-order';move.textContent=symbol;move.disabled=slot.locked||slot.index+delta<0||slot.index+delta>=selected.capacity;move.setAttribute('aria-label',tr('ultimate.move',{slot:slot.index+1,direction:tr(delta<0?'ultimate.left':'ultimate.right')}));move.onclick=()=>{ultimateLoadout.swap(slot.index,slot.index+delta);persistTech();updateUltimatePreparation();};box.append(move);}$('ultimateEquipSlots').append(box);}
    $('ultimateLibrary').replaceChildren();for(const [id,skill]of Object.entries(C.ultimates.skills)){const learned=hasTech(id),equipped=ultimateLoadout.slots.includes(id),button=document.createElement('button');button.type='button';button.dataset.ultimateId=id;button.className='ultimate-choice';button.disabled=!learned||equipped;button.dataset.equipped=String(equipped);button.style.setProperty('--skill','rgb('+skill.color.map(v=>Math.round(v*255)).join(',')+')');
      const icon=document.createElement('b');icon.textContent=skill.symbol;const name=document.createElement('strong');name.textContent=tr((C.ultimates.skills[id]?'ultimate.':'element.')+id+'.name');const desc=document.createElement('span');desc.textContent=ultimateDescription(id);const action=document.createElement('small');action.textContent=equipped?tr('ultimate.equipped'):learned?tr('ultimate.equip'):tr('ultimate.unlock',{cost:skill.cost});button.append(icon,name,desc,action);
      button.onclick=()=>{const index=ultimateLoadout.slots.findIndex((value,i)=>i<ultimateLoadout.capacity&&!value);if(index<0){$('ultimateEquipNotice').textContent=tr('ultimate.full');return;}ultimateLoadout.equip(id,index);persistTech();updateUltimatePreparation();};const row=document.createElement('div');row.className='ultimate-library-row';row.append(button,makePreviewButton(id));$('ultimateLibrary').append(row);}
    $('ultimateEquipNotice').textContent=tr('ultimate.preparationHint');
  }
  function makePreviewButton(id){const button=document.createElement('button');button.type='button';button.className='ultimate-preview-button';button.dataset.previewId=id;button.textContent=tr('preview.open');button.setAttribute('aria-label',tr('preview.title',{name:tr((C.ultimates.skills[id]?'ultimate.':'element.')+id+'.name')}));button.onclick=()=>previewHost.open(id,button);return button;}
  function openUltimates(open){if(menuRouter&&!menuRouter.applying)return routeMenu("ultimates",open);if(open&&phase!=='LOBBY')return;$('ultimatePanel').classList.toggle('open',open);$('ultimatePanel').setAttribute('aria-hidden',String(!open));if(open){updateUltimatePreparation();$('ultimateClose').focus();}}
  $('ultimateOpen').onclick=()=>openUltimates(true);$('ultimateClose').onclick=()=>openUltimates(false);$('ultimatePanel').onclick=event=>{if(event.target===$('ultimatePanel'))openUltimates(false);};

  function onComboHit(count){
    lastComboHitAtMs=timeMs;
    const label='×'+count;
    comboFxCount.textContent=label;comboFxEcho.textContent=label;
    comboFx.dataset.tier=count>=8?'surge':count>=3?'streak':'start';
    comboFx.classList.add('active');
    for(const part of [comboFxCount,comboFxEcho]){
      part.getAnimations().forEach(animation=>animation.cancel());
    }
    const big=Math.min(1.85,1.27+count*.085);
    comboFxCount.animate([
      {transform:`scale(${big}) rotate(-7deg)`,filter:'brightness(1.9)',offset:0},
      {transform:'scale(.91) rotate(2deg)',filter:'brightness(1.18)',offset:.55},
      {transform:'scale(1) rotate(0deg)',filter:'brightness(1)',offset:1}
    ],{duration:365,easing:'cubic-bezier(.19,1,.22,1)'});
    comboFxEcho.animate([
      {transform:'scale(.8)',opacity:.86},
      {transform:'scale(2.4)',opacity:0}
    ],{duration:460,easing:'ease-out'});
    // A brief, bounded radial punch complements the number without adding gameplay damage.
    const r=Math.min(100,36+count*5);
    ringFx(player.position.x,player.position.y,r,count>=3?[1,.78,.35,1]:[.53,1,.79,1],260);
  }
  // Numeric presentation only: never round damage, health, burn DPS or healing in
  // the authoritative simulation. One compact format for direct/area/DoT output.
  function formatCombatNumber(value,fractionDigits){
    if(!Number.isFinite(value))throw new RangeError(tr("runtime.99"));
    const n=Math.abs(value);
    if(n===0)return '0';
    if(n<.005)return '<0.01';
    const decimals=fractionDigits??(n>=10?0:n>=1?1:2);
    return number(n,{maximumFractionDigits:decimals});
  }
  const textFloats=[];
  function floatText(x,y,text,color,presentation={}){if(textFloats.length>=24){textFloats.shift().el.remove();}
    const el=document.createElement('div');el.textContent=messageText(text);el.style.cssText='position:absolute;left:0;top:0;pointer-events:none;will-change:transform,opacity;font-size:22px;font-weight:950;text-shadow:0 2px 4px #000,0 0 8px #000;white-space:nowrap';
    el.style.fontSize=(presentation.sizePx??22)+'px';el.style.color=`rgb(${color.slice(0,3).map(v=>Math.round(v*255)).join(',')})`;$('hud').append(el);
    textFloats.push({x,y,text,color,age:0,el,lifetimeMs:presentation.lifetimeMs??700,risePxPerMs:presentation.risePxPerMs??.065});}

  function updateDrops(dtMs){
    const collected=lootDrops.update(dtMs,player,stage.phase==='CLEAR'?Infinity:magnetRadius());
    if(collected.length){let growth=0,eggs=0;const bySpecies=new Map();
      for(const reward of collected){growth+=reward.growth;eggs+=reward.eggCount;if(reward.eggCount)bySpecies.set(reward.eggSpeciesId,(bySpecies.get(reward.eggSpeciesId)||0)+reward.eggCount);}
      // Remove pending payloads and grant ownership as one saved snapshot. Callbacks cannot save a partial batch.
      claimingDrops=true;try{recordGrowth(growth);for(const [id,count] of bySpecies)companions.addEgg(id,count);}finally{claimingDrops=false;}
      persistTech();petRoster.sync();updateTechUi();if($('petPanel').classList.contains('open'))updatePetUi();
      pickupFeedback.growth+=growth;pickupFeedback.eggs+=eggs;
    }
    const f=pickupFeedback;if((f.growth||f.eggs)&&timeMs>=f.nextAtMs){const p=player.position;
      if(f.growth)floatText(p.x,p.y,message("runtime.phrase.22",{v0:f.growth}),[1,.84,.38,1]);
      if(f.eggs)floatText(p.x,p.y-20,message("runtime.phrase.21",{v0:f.eggs}),[1,.93,.67,1]);
      sfx.play(f.eggs?'egg':'pickup');ringFx(p.x,p.y,f.eggs?35:24,[1,.85,.46,.65],260);
      for(let i=0;i<2;i++)addParticle(p.x,p.y,-20+i*40,-35,180,2,[1,.87,.46,.8]);
      f.growth=0;f.eggs=0;f.nextAtMs=timeMs+C.drops.feedbackGapMs;
    }
  }
  function drawDrops(){const timeMs=display.timeMs;
    let pulling=false;for(const d of display.drops){const p=d.body.position,z=d.body.plugin.volume.feetZ,r=C.drops.radius,egg=!!d.eggCount;
      paint.ellipse(p.x,p.y,r+3,3,[0,0,0,.46],12);
      if(d.state==='PULL'){pulling=true;const speed=Math.hypot(d.vx,d.vy),n=norm(d.vx,d.vy),length=Math.min(24,speed*.045);
        paint.line(p.x-n.x*length,p.y-z-n.y*length,p.x,p.y-z,2,egg?[1,.90,.56,.58]:[1,.76,.3,.5]);}
      const flash=Math.max(0,1-d.ageMs/400);paint.ellipse(p.x,p.y-z,r+5+flash*5,r+5+flash*5,egg?[1,.9,.5,.13+flash*.25]:[1,.68,.24,.09+flash*.2],14);
      if(egg)vectorActors.drawEgg({key:`drop:${d.id}`,speciesId:d.eggSpeciesId,x:p.x,y:p.y-z,radius:r+2,timeMs,progress:0});
      else{paint.ellipse(p.x,p.y-z,5,6,[1,.72,.22,1],12);paint.ellipse(p.x-1,p.y-z-2,2.1,2.6,[1,.97,.70,1],9);}
      if(d.growth+d.eggCount>1)paint.line(p.x-4,p.y-z+10,p.x+4,p.y-z+10,2,[1,.9,.55,.8]);
    }
    if(pulling)drawArc(display.player.body.position.x,display.player.body.position.y,magnetRadius(),0,Math.PI*2,40,1,[1,.83,.42,.12]);
  }

  function spawnReplacement(){
    if(introScene)return;
    if(stage.phase!=='WAVE'||enemies.filter(e=>e.alive).length>=stage.targetPopulation)return;
    // Refill the config-owned population target; never increase living count on a frame.
    for(let k=0;k<38;k++){
      const a=rand()*Math.PI*2,d=240+Math.sqrt(rand())*Math.min(stage.radius*.78,610);
      const x=player.position.x+Math.cos(a)*d,y=player.position.y+Math.sin(a)*d;
      if(!boundaryPoint(x,y,60))continue;
      if(obstacles.some(o=>Math.hypot(x-o.body.position.x,y-o.body.position.y)<o.r+65))continue;
      if(enemies.some(e=>e.alive&&Math.hypot(x-e.body.position.x,y-e.body.position.y)<C.stage.enemySpawnMinGap))continue;
      spawnEnemy(x,y,pickRefillSpecies(rand,THEME_POOL[stage.themeId].enemies||enemyRefillWave));return;
    }
    const pt=findSpawn(180,28);if(pt)spawnEnemy(pt.x,pt.y,pickRefillSpecies(rand,THEME_POOL[stage.themeId].enemies||enemyRefillWave));
  }
  /** Continuous collision: swept relative segment against each enemy that moved this tick. */
  const shadowVolume={circleRadius:C.shadow.radius,position:{x:0,y:0},plugin:{volume:{feetZ:0,previousFeetZ:0,height:C.spatial.shadowHeight,motion:{x:0,y:0}}}};
  function findShadowContact(sx,sy,ex,ey,stationary=false){
    shadowVolume.position.x=ex;shadowVolume.position.y=ey;shadowVolume.plugin.volume.motion.x=sx;shadowVolume.plugin.volume.motion.y=sy;
    let fraction=Infinity,enemy=null;
    for(const e of enemies){if(!e.alive)continue;
      const body=e.body,v=body.plugin.volume;
      const target=stationary?{circleRadius:body.circleRadius,position:body.position,plugin:{volume:{feetZ:v.feetZ,previousFeetZ:v.feetZ,height:v.height,motion:body.position}}}:body;
      const window=contactWindow(shadowVolume,target);
      if(window&&window[0]<fraction){fraction=window[0];enemy=e;}}
    return {fraction:enemy?fraction:1,enemy};
  }
  function updateShadow(dt){if(!shadow||shadow.arrived)return;if(!shadow.halfSound&&chargeOf()>=.5){shadow.halfSound=true;sfx.play('chargeHalf');}
    const sx=shadow.x,sy=shadow.y;
    shadow.speed+=C.shadow.acceleration*dt;shadow.age+=dt;
    if(shadow.followTarget&&shadow.targetId!=null){
      const target=enemies.find(e=>e.alive&&e.id===shadow.targetId);
      if(target){const n=norm(target.body.position.x-sx,target.body.position.y-sy);
        shadow.dirX=n.x;shadow.dirY=n.y;}
    }
    const move=Math.min(shadow.speed*dt,Math.max(0,shadow.limit-shadow.travel));
    const ex=sx+shadow.dirX*move,ey=sy+shadow.dirY*move;
    const dx=ex-sx,dy=ey-sy;
    const {fraction,enemy:hitEnemy}=findShadowContact(sx,sy,ex,ey);
    shadow.x=sx+dx*fraction;shadow.y=sy+dy*fraction;shadow.travel+=move*fraction;
    const trailN=Math.min(3,Math.ceil(move*fraction/13));
    for(let k=0;k<trailN;k++){const t=k/trailN;
      addParticle(sx+dx*fraction*t,sy+dy*fraction*t,-shadow.dirX*30,-shadow.dirY*30,C.visual.launch.trailLifeMs,2,[.4,.89,1,1]);}
    if(hitEnemy){endShadowAt(shadow.x,shadow.y,hitEnemy);return;}
    if(shadow.travel>=shadow.limit-1e-6||shadow.x<25||shadow.y<25||shadow.x>C.world.width-25||shadow.y>C.world.height-25){
      endShadowAt(shadow.x,shadow.y);
    }
  }
  // Swept fallback for high-speed dashes. Matter's discrete solver may step
  // entirely across a circle. Only the earliest segment contact is committed;
  // a normal collision event already changed mode to RECOVER before this call.
  function sweepDashContact(){
    if(mode!=='DASH')return;
    const x0=player.plugin.prePosX,y0=player.plugin.prePosY;
    const vx=player.position.x-x0,vy=player.position.y-y0;
    let earliest=2,selected=null;
    for(const e of enemies){if(!e.alive||dashHits.has(e.id))continue;
      const window=contactWindow(player,e.body);
      if(window&&window[0]<earliest){selected=e;earliest=window[0];}
    }
    if(!selected)return;
    // Move the body to the contact surface, while retaining the pre-step
    // velocity that the damage solver uses. Enemy impulse handles separation.
    Body.setPosition(player,{x:x0+vx*earliest,y:y0+vy*earliest});
    handleCollision({pairs:[{bodyA:player,bodyB:selected.body}]});
  }
  function step(events=[]){tick++;const baseMs=1000/C.sim.tps;timeMs=tick*baseMs;
    playerUnit.status.update(baseMs);for(const unit of unitsById.values()){unit.status.update(baseMs);unit.advanceEvasion?.(timeMs);}
    if(introScene)advanceIntro(events);
    if(previewScenario?.tutorial){
      for(const event of events){if(event.action==='fire'){pending.push({kind:'auto'});demoPressUntil=tick+14;}if(event.action==='move'){const point={};cameraView.planeToScreenInto(previewOrigin.x+event.x,previewOrigin.y+event.y,point);pending.push({kind:'point',x:point.x,y:point.y});demoTap={x:previewOrigin.x+event.x,y:previewOrigin.y+event.y,until:tick+35};}}
      if(shadow&&chargeOf()>=.8&&mode==='SHADOW'){pending.push({kind:'auto'});demoPressUntil=tick+14;}
    }
    if(previewScenario?.elemental){if(timeMs>=150&&launchCount===0&&mode==='READY')pending.push({kind:'auto'});if(shadow?.arrived&&timeMs-shadow.contactAtMs>=previewScenario.dashDelayMs&&['GOLDEN','COYOTE'].includes(mode))pending.push({kind:'auto'});}
    if(bufferedIntent&&timeMs>bufferedUntilMs){bufferedIntent=null;bufferedUntilMs=0;}
    attackAmmo.update(baseMs); // Real tick time: recharge continues during shadow flight, dash, recovery and hitstop.
    processInputs();updatePlayerVisuals(baseMs);if(mode==='DEAD')return;
    updateStage();updateEvade(baseMs/1000);updateLaunchRecoil(baseMs);
    if(shadow&&shadow.arrived){
      const elapsed=timeMs-shadow.contactAtMs;
      if(mode==='GOLDEN'&&elapsed>=C.timing.shadowHitstopMs){setAttackMode('COYOTE');}
      if(mode==='COYOTE'&&elapsed>=C.timing.shadowHitstopMs+C.timing.coyoteMs){expireShadow();}
    }
    if(autoDashPlanned&&shadow&&shadow.arrived&&mode==='GOLDEN'&&chainActive&&autoChainReady&&
       timeMs-shadow.contactAtMs>=C.chain.autoDashGoldDelayMs){
      autoChainReady=false;autoDashPlanned=false;dash(true);
    }
    if(hitstopLeftMs>0){hitstopLeftMs=Math.max(0,hitstopLeftMs-baseMs);return;}
    if(C.stats.healthRegen>0&&health<C.stats.maxHp){health=Math.min(C.stats.maxHp,health+C.stats.healthRegen*baseMs/1000);}
    const scale=ultimateRunner.active?ultimateRunner.timeScale:(mode==='SHADOW'&&chargeOf()>=C.timing.bulletStart)?C.timing.bulletScale:1;
    const dt=baseMs/1000*scale;
    snapshotVolumes(World.allBodies(engine.world));
    // Preserve start positions before AI motion for relative XY/Z swept contact.
    for(const e of unitsById.values()){if(!e.alive)continue;
      e.preX=e.body.position.x;e.preY=e.body.position.y;
      e.body.restitution=C.physics.restitution;}
    ultimateRunner.update(baseMs*scale);petRoster.update(dt);updateEnemies(dt);stepArcShots(dt);
    if(mode==='READY'||mode==='RECOVER'||mode==='DASH')aimPreview();
    // Damage uses pre-engine velocities after every AI/attack impulse, including the first charge tick.
    for(const e of unitsById.values())if(e.alive)e.pre=speedOf(e.body);
    const pv=speedOf(player);playerUnit.pre=pv;playerUnit.preX=player.position.x;playerUnit.preY=player.position.y;player.plugin.preX=pv.x;player.plugin.preY=pv.y;player.plugin.prePosX=player.position.x;player.plugin.prePosY=player.position.y;
    player.restitution=C.physics.restitution;player.frictionAir=ultimateRunner.active?0:C.physics.frictionAir;
    if(mode==='DASH'&&dashMotion&&playerUnit.status.frozenMs<=0){
      // Matter.js force is in mass * pixel / ms^2. 1e6 converts pixel/s^2;
      // applyForce is stepped by the same timeScale used by Engine.update.
      const a=dashMotion.acceleration*playerUnit.status.movementRate*player.mass/1_000_000;
      Body.applyForce(player,player.position,{x:dashMotion.dirX*a,y:dashMotion.dirY*a});
    }
    engine.timing.timeScale=scale;Engine.update(engine,baseMs);
    // Track only our remaining velocity component through the same Matter air drag.
    if(launchRecoil)launchRecoil.remaining*=Math.max(0,1-player.frictionAir*player.deltaTime/(1000/60));
    if(mode==='DEAD')return;
    sweepDashContact();
    updateBurning(dt*1000);updateAcidPools(dt*1000);updateFrostFields(dt*1000);updateProjectiles();
    // One death boundary for every explicit attack. Resolve same-tick collision
    // damage/lifesteal together, then stop before rearming or another healing tick.
    playerUnit.die();if(mode==='DEAD')return;
    ultimateRunner.afterPhysics(baseMs*scale);
    if(combo>0)ultimateRunner.tryStart(combo,attackAmmo.charges);
    updateDrops(baseMs);
    const created=updateLaunchAlignment(baseMs);if(!created)updateShadow(dt);
    if(shadow&&timeMs>shadow.launchedAtMs&&bufferedIntent?.kind==='dash'&&shadowDashAvailable()){
      bufferedIntent=null;bufferedUntilMs=0;dash();
    }
    const v=speedOf(player),s=Math.hypot(v.x,v.y);
    if(s>C.physics.maxSpeed)setSpeed(player,v.x*C.physics.maxSpeed/s,v.y*C.physics.maxSpeed/s);
    // The old fixed 950ms lockout was the primary source of perceived unresponsive taps.
    if(mode==='DASH'){
      const velocity=speedOf(player),speed=Math.hypot(velocity.x,velocity.y);
      const target=dashFlight&&enemies.find(e=>e.alive&&e.id===dashFlight.targetId);
      const targetAlive=!!target&&timeMs<dashFlight.untilMs;
      // Keep the hit window while physically closing on the selected opponent.
      // No enemy / clearly missed / stalled dash -> preserve the basic 150–400ms rearm rule.
      let closing=0;
      if(targetAlive){
        const n=norm(target.body.position.x-player.position.x,target.body.position.y-player.position.y);
        const ev=speedOf(target.body);
        closing=(velocity.x-ev.x)*n.x+(velocity.y-ev.y)*n.y;
      }
      const approaching=targetAlive&&closing>C.dash.missClosingSpeed;
      missRecoveryActive=!approaching;
      if(missRecoveryActive)noteMissRecovery();
      const normalRearm=speed<=C.dash.rearmSpeed||timeMs-dashStartedAtMs>=C.dash.rearmMaxMs;
      if(timeMs>=modeUntil&&!approaching&&normalRearm){
        attackOrigin=null;combo=0;endChain();beginReady();
      }
    }
    if(mode==='RECOVER'&&timeMs>=modeUntil){
      const wanted=autoChainReady&&chainTargetId!=null?chainTargetId:attackOrigin;
      const e=wanted==='any'?chooseEnemy():enemies.find(unit=>unit.id===wanted&&unit.alive);
      const enoughGap=!e||Math.hypot(e.body.position.x-player.position.x,e.body.position.y-player.position.y)>=C.chain.targetMinGap;
      if((bufferedIntent&&attackAmmo.charges>0)||!C.chain.enabled||wanted==null||!e||enoughGap||timeMs-recoverStartedAtMs>=C.chain.maxWaitMs){
        // A successfully created chain shadow owns its charge; its later automatic dash needs no second payment.
        const shouldAuto=chainActive&&autoChainReady&&chainTargetId!=null;
        const target=e;
        attackOrigin=null;chainTargetId=null;beginReady();
        if(mode==='READY'&&C.chain.enabled&&target&&enoughGap){
          if(launch({x:target.body.position.x-player.position.x,y:target.body.position.y-player.position.y},target,shouldAuto?'chain':'echo')){
            autoDashPlanned=shouldAuto;
            if(autoDashPlanned)ringFx(player.position.x,player.position.y,60,[1,.84,.42,1],370);
          }else{endChain();}
        }
        if(mode==='READY'&&(!C.chain.enabled||!target||!enoughGap)){combo=0;endChain();}
      }
    }
    const ps=speedOf(player);
    if(Math.hypot(ps.x,ps.y)>170){trailClock+=dt;
      while(trailClock>.015){trailClock-=.015;
        addParticle(player.position.x+(rand()-.5)*9,player.position.y+(rand()-.5)*9,
          -ps.x*.1,-ps.y*.1,190+rand()*130,3,[.32,.9,.68,.7]);}}
    else trailClock=0;
    for(let i=fireEmbers.length-1;i>=0;i--){fireEmbers[i].age+=baseMs;if(fireEmbers[i].age>=fireEmbers[i].life){fireEmbers[i]=fireEmbers[fireEmbers.length-1];fireEmbers.pop();}}
    for(let i=fireTransfers.length-1;i>=0;i--){fireTransfers[i].age+=baseMs;if(fireTransfers[i].age>=fireTransfers[i].life){fireTransfers[i]=fireTransfers[fireTransfers.length-1];fireTransfers.pop();}}
    for(let i=lightningArcs.length-1;i>=0;i--){if(lightningArcs[i].untilMs<=timeMs){
      lightningArcs[i]=lightningArcs[lightningArcs.length-1];lightningArcs.pop();}}
    for(let i=fxRings.length-1;i>=0;i--){fxRings[i].age+=baseMs; if(fxRings[i].age>=fxRings[i].lifeMs){fxRings[i]=fxRings[fxRings.length-1];fxRings.pop();}}
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=baseMs*scale;
      p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.982;p.vy*=.982;
      if(p.life<=0){particles[i]=particles[particles.length-1];particles.pop();}}
    for(let i=textFloats.length-1;i>=0;i--){textFloats[i].age+=baseMs;
      if(textFloats[i].age>textFloats[i].lifetimeMs){textFloats[i].el.remove();textFloats.splice(i,1);}}
  }
  // Presentation priority, not a simulation rule:
  // decor (quiet) < solid obstacles (readable) < actors/targeting < boss warnings.
  // The procedural layout and entity positions stay untouched. Theme visual values
  // provide small recipes, while global scenery settings own the shared policy.
  function sceneryFadeAt(x,y){
    const f=C.visual.scenery,dx=x-player.position.x,dy=y-player.position.y;
    const range=f.focusRadius+f.focusFeather;
    if(Math.abs(dx)>=range||Math.abs(dy)>=range)return stage.phase==='BOSS'?f.bossOpacityRate:1;
    const distance=Math.hypot(dx,dy);
    const t=clamp((distance-f.focusRadius)/Math.max(1,f.focusFeather),0,1);
    const soft=t*t*(3-2*t);
    const alpha=f.focusMinOpacity+(1-f.focusMinOpacity)*soft;
    return alpha*(stage.phase==='BOSS'?f.bossOpacityRate:1);
  }
  function sceneryTint(color,theme,visibility=1){
    const bg=theme.colors.clear,style=theme.visual;
    const gray=color[0]*.2126+color[1]*.7152+color[2]*.0722;
    const saturation=style.decorationSaturation,weight=style.decorationColorWeight;
    return [
      bg[0]*(1-weight)+(gray+(color[0]-gray)*saturation)*weight,
      bg[1]*(1-weight)+(gray+(color[1]-gray)*saturation)*weight,
      bg[2]*(1-weight)+(gray+(color[2]-gray)*saturation)*weight,
      color[3]*style.decorationOpacity*visibility
    ];
  }
  const TERRAIN_VISUALS={
    flowers:{
      drawDecoration(t,theme,fade){
        const x=t.x,y=t.y,r=t.r*.87;
        // Flat low-contrast floor decals. Never the same palette/alpha as combat actors.
        paint.ellipse(x,y,r*.19,r*.19,sceneryTint([.95,.76,.36,.94],theme,fade),10);
        const petals=t.kind===0?[1,.62,.73,.66]:t.kind===1?[.94,.80,1,.69]:[.72,.92,.50,.64];
        const tint=sceneryTint(petals,theme,fade);
        for(let i=0;i<5;i++){const a=t.seed+i*Math.PI*2/5;
          paint.ellipse(x+Math.cos(a)*r*.6,y+Math.sin(a)*r*.6,r*.42,r*.35,tint,10);
        }
        paint.line(x,y+r*.8,x+r*.25,y+r*1.4,1.2,sceneryTint([.27,.58,.31,.54],theme,fade));
      },
      drawObstacleAccent(o,theme){const p=o.body.position;
        const c=sceneryTint([.59,.82,.44,.83],theme,C.visual.terrain.accentOpacityRate/theme.visual.decorationOpacity);
        for(let k=0;k<3;k++){const a=k*Math.PI*2/3+o.sides*.4;
          paint.ellipse(p.x+Math.cos(a)*o.r*.45,p.y+Math.sin(a)*o.r*.49,o.r*.14,o.r*.1,c,10);
        }
      }
    },
    mushrooms:{
      drawDecoration(t,theme,fade){const x=t.x,y=t.y,r=t.r*.91;
        paint.ellipse(x+1,y+3,r*.65,r*.4,[0,0,0,.12*fade],11);
        paint.line(x,y,x,y+r*.9,Math.max(1,r*.23),sceneryTint([.70,.62,.86,.62],theme,fade));
        const cap=t.kind===0?[.68,.53,.96,.77]:t.kind===1?[.47,.79,.91,.70]:[.90,.64,.76,.72];
        paint.ellipse(x,y-r*.15,r*.72,r*.48,sceneryTint(cap,theme,fade),14);
        const spots=sceneryTint([.92,1,1,.65],theme,fade);
        paint.ellipse(x-r*.22,y-r*.31,r*.11,r*.11,spots,9);
        paint.ellipse(x+r*.24,y-r*.17,r*.1,r*.1,spots,9);
      },
      drawObstacleAccent(o,theme){const p=o.body.position;
        const c=sceneryTint([.63,.56,.92,.86],theme,C.visual.terrain.accentOpacityRate/theme.visual.decorationOpacity);
        for(let k=0;k<3;k++){const a=k*Math.PI*2/3+o.sides*.3;
          paint.ellipse(p.x+Math.cos(a)*o.r*.52,p.y+Math.sin(a)*o.r*.51,o.r*.14,o.r*.17,c,10);
        }
      }
    }
  };
  function drawUnitStatus(unit,x,y,r){const status=unit.status;if(status?.frozenMs>0){for(let i=0;i<6;i++){const a=i*Math.PI/3;paint.line(x+Math.cos(a)*r*.70,y+Math.sin(a)*r*.70,x+Math.cos(a)*(r+6),y+Math.sin(a)*(r+6),2,[.72,.96,1,.92]);}drawArc(x,y,r+5,0,Math.PI*2,6,2,[.71,.95,1,.85]);}else if(status?.slowMs>0)drawArc(x,y,r+4,0,Math.PI*2,18,1.5,[.47,.83,1,.70]);if(status?.acidMs>0)drawArc(x,y,r+8,0,Math.PI*2,18,1.5,[.78,.94,.30,.85]);}
  TERRAIN_VISUALS.frost={drawDecoration(t,theme,fade){const c=sceneryTint([.65,.78,.82,.6],theme,fade);for(let i=0;i<3;i++){const a=t.seed+i*Math.PI/3;paint.line(t.x-Math.cos(a)*t.r,t.y-Math.sin(a)*t.r,t.x+Math.cos(a)*t.r,t.y+Math.sin(a)*t.r,1,c);}},drawObstacleAccent(o,theme){TERRAIN_VISUALS.flowers.drawObstacleAccent(o,theme);}};
  TERRAIN_VISUALS.marsh={drawDecoration(t,theme,fade){paint.ellipse(t.x,t.y,t.r*1.2,t.r*.7,sceneryTint([.38,.42,.22,.45],theme,fade),14);paint.line(t.x+t.r*.5,t.y+t.r*.3,t.x+t.r*.6,t.y-t.r*.5,1,sceneryTint([.45,.48,.25,.6],theme,fade));},drawObstacleAccent(o,theme){TERRAIN_VISUALS.mushrooms.drawObstacleAccent(o,theme);}};
  function shakeCamera(kind,direction){
    const config=C.camera.shake,recipe=config[kind],amplitude=Math.min(config.maxPx,recipe.amplitudePx);
    const remaining=cameraShake?cameraShake.amplitude*Math.max(0,1-(timeMs-cameraShake.startedAtMs)/cameraShake.durationMs):0;
    // Strongest remaining event wins. Weak shots cannot extend a strong hit or add unbounded offsets.
    if(remaining>amplitude)return;
    const n=norm(direction.x,direction.y);
    cameraShake={kind,x:n.x,y:n.y,amplitude,durationMs:recipe.durationMs,cycles:recipe.cycles,startedAtMs:timeMs};
  }
  function cameraShakeOffset(){
    if(!cameraShake||phase!=='PLAYING')return {x:0,y:0};
    const q=clamp((timeMs-cameraShake.startedAtMs)/cameraShake.durationMs,0,1);
    const amount=Math.min(C.camera.shake.maxPx,cameraShake.amplitude)*(1-q)*(1-q)*Math.sin(q*Math.PI*2*cameraShake.cycles);
    return {x:cameraShake.x*amount,y:cameraShake.y*amount};
  }
  function drawWorld(){const visibleW=canvas.clientWidth/cameraZoom,visibleH=canvas.clientHeight/cameraZoom;
    const theme=THEME_POOL[stage.themeId]||THEME_POOL.garden,tc=theme.colors;
    const loX=renderCamera.x-visibleW*.55,hiX=renderCamera.x+visibleW*.55,loY=renderCamera.y-visibleH*.55,hiY=renderCamera.y+visibleH*.55;
    const lowx=Math.max(0,Math.floor(loX/100)*100),hix=Math.min(C.world.width,hiX),lowy=Math.max(0,Math.floor(loY/100)*100),hiy=Math.min(C.world.height,hiY);
    const grid=[tc.grid[0],tc.grid[1],tc.grid[2],tc.grid[3]*C.visual.terrain.gridOpacityRate];
    for(let x=lowx;x<=hix;x+=100)paint.line(x,Math.max(loY,0),x,Math.min(hiY,C.world.height),1,grid);
    for(let y=lowy;y<=hiy;y+=100)paint.line(Math.max(loX,0),y,Math.min(hiX,C.world.width),y,1,grid);
    const painter=TERRAIN_VISUALS[theme.decoration];
    if(!painter)throw Error(tr("runtime.phrase.20",{v0:theme.decoration}));
    // Apply visual-only density at draw time: unchanged map/decor generation RNG.
    const sceneryCount=Math.floor(terrainDecor.length*C.visual.scenery.densityRate);
    for(let i=0;i<sceneryCount;i++){
      const t=terrainDecor[i];
      if(t.x<loX-32||t.x>hiX+32||t.y<loY-32||t.y>hiY+32)continue;
      painter.drawDecoration(t,theme,sceneryFadeAt(t.x,t.y));
    }
    drawFrostFields();
    for(const pool of acidPools){if(pool.skillId)drawAcidFountain(pool);const fade=Math.min(1,pool.leftMs/400);paint.ellipse(pool.x,pool.y,pool.radius,pool.radius,[.38,.65,.12,.22*fade],24);drawArc(pool.x,pool.y,pool.radius,0,Math.PI*2,32,2.7,[.80,1,.35,.95*fade]);drawArc(pool.x,pool.y,pool.radius+5,-Math.PI/2,-Math.PI/2+Math.PI*2*pool.leftMs/pool.durationMs,32,1.5,[.88,1,.56,.8*fade]);}
    const border=[tc.edge[0],tc.edge[1],tc.edge[2],tc.edge[3]*C.visual.terrain.edgeOpacityRate];
    for(let i=0;i<arenaVertices.length;i++){const a=arenaVertices[i],b=arenaVertices[(i+1)%arenaVertices.length];
      paint.line(a.x,a.y,b.x,b.y,10,[tc.edge[0],tc.edge[1],tc.edge[2],border[3]*.18]);
      paint.line(a.x,a.y,b.x,b.y,2.5,border);
    }
    for(const o of obstacles){const p=o.body.position;if(p.x<loX-120||p.x>hiX+120||p.y<loY-120||p.y>hiY+120)continue;
      const vertices=o.body.vertices;
      for(let i=0;i<vertices.length;i++){const a=vertices[i],b=vertices[(i+1)%vertices.length];
        paint.tri(p.x+5,p.y+5,a.x+5,a.y+5,b.x+5,b.y+5,[0,0,0,.20]);
        paint.tri(p.x,p.y,a.x,a.y,b.x,b.y,tc.rock);
        paint.line(a.x,a.y,b.x,b.y,C.visual.terrain.outlineWidth,tc.outline);
      }
      paint.ellipse(p.x,p.y,o.r*.18,o.r*.18,[tc.glow[0],tc.glow[1],tc.glow[2],tc.glow[3]*C.visual.terrain.accentOpacityRate],8);
      painter.drawObstacleAccent(o,theme);
    }
  }
  // Presentation-only target compression. Uses the same remaining-gap owner as chargeOf;
  // never changes physics, damage, shadow lifetime or simulation timing.
  const fxAnchor={x:0,y:0,r:0,isEnemy:false};
  const fxScreen={x:0,y:0};
  const fxColors={
    approach:[.32,.80,.87,1], breakEven:[1,.70,.37,1],
    critical:[1,.87,.47,1], golden:[1,.97,.67,1], coyote:[.42,.70,1,1]
  };
  function getTargetAnchor(out){
    if(!shadow)return false;
    const e=shadow.targetId==null?null:enemies.find(unit=>unit.alive&&unit.id===shadow.targetId);
    if(e){out.x=e.body.position.x;out.y=e.body.position.y;out.r=enemyDef(e).radius+6;out.isEnemy=true;}
    else {out.x=shadow.goalX;out.y=shadow.goalY;out.r=0;out.isEnemy=false;}
    return true;
  }
  function fxStage(charge){
    if(mode==='GOLDEN')return 'golden';
    if(mode==='COYOTE')return 'coyote';
    if(charge>=C.timing.bulletStart)return 'critical';
    if(charge>=.5)return 'breakEven';
    return 'approach';
  }
  // Reuse the 2D GPU primitive path. Open arcs and gaps stay legible on mobile,
  // without a filled disc covering the enemy or destination.
  function drawArc(cx,cy,r,start,sweep,count,width,color,dashed=false){
    const segments=Math.max(1,count|0),step=sweep/segments;
    for(let i=0;i<segments;i++){
      if(dashed&&i%3===2)continue;
      const a=start+i*step,b=a+step*(dashed?.86:.97);
      paint.line(cx+Math.cos(a)*r,cy+Math.sin(a)*r,
        cx+Math.cos(b)*r,cy+Math.sin(b)*r,width,color);
    }
  }
  // Target-anchored four-corner brackets: scope is the remaining GAP, never shadow travel.
  // Pre-aim uses an open, steady bracket; the active shadow converges from four sides.
  function drawTargetBrackets(cx,cy,r,arm,width,color,broken=false){
    for(let i=0;i<4;i++){
      const sx=i%2?1:-1,sy=i<2?-1:1;
      const cornerX=cx+sx*r,cornerY=cy+sy*r;
      if(broken&&i%2===1)continue;
      paint.line(cornerX-sx*arm,cornerY,cornerX,cornerY,width,color);
      paint.line(cornerX,cornerY-sy*arm,cornerX,cornerY,width,color);
    }
  }
  function drawTargetCompressionVfx(now){
    const shadow=display.shadow;if(!shadow||!C.fx.targetCompression)return;
    const target=displayedUnit(shadow.targetId),fxAnchor=target?{x:target.body.position.x,y:target.body.position.y-target.spatial.feetZ,r:target.config.radius+6}:display.scene.anchor;
    const timeMs=display.timeMs,q=display.scene.charge,stage=display.scene.fxStage,c=display.scene.dashAvailable?fxColors[stage]:[1,.38,.30,1],
      intensity=clamp(C.fx.intensity,0,2),size=C.fx.reticleScale,
      x=fxAnchor.x,y=fxAnchor.y,
      t=now*.001,pulse=Math.sin(t*(3+q*11)*C.fx.pulseSpeed),
      arrived=shadow.arrived;
    let opacity=(.36+.28*q+.10*pulse)*intensity;
    if(stage==='coyote')opacity*=clamp(1-(timeMs-shadow.contactAtMs-C.timing.shadowHitstopMs)/C.timing.coyoteMs,0,1)*.8+.14;
    // The enemy (or manual destination) is the semantic anchor of the timing cue.
    // Four bracket corners move inward based on remaining-distance charge.
    // No rotational meter: avoid suggesting elapsed time or travelled distance.
    const baseR=fxAnchor.r*size+9;
    const late=stage==='coyote'?clamp((timeMs-shadow.contactAtMs-C.timing.shadowHitstopMs)/C.timing.coyoteMs,0,1):0;
    const bracketR=baseR+29*(1-q)+late*12;
    const arm=clamp(7+q*6,7,13),width=(1.75+q*1.55)*size;
    const vivid=clamp(opacity*(stage==='golden'?1.45:1.10),0,1);
    drawTargetBrackets(x,y,bracketR+2,arm+2,width+3,
      [c[0],c[1],c[2],vivid*.12],stage==='coyote');
    drawTargetBrackets(x,y,bracketR,arm,width,
      [c[0],c[1],c[2],vivid],stage==='coyote'&&late>.4);
    // A short inward shimmer travels along the diagonal of each corner.
    if(q>=.5&&stage!=='coyote')for(let i=0;i<4;i++){
      const sx=i%2?1:-1,sy=i<2?-1:1,shift=3*Math.sin(t*(4+q*9)+i*Math.PI/2);
      paint.ellipse(x+sx*(bracketR+4+shift),y+sy*(bracketR+4+shift),
        1.5+1.4*q,1.5+1.4*q,[c[0],c[1],c[2],vivid*.58],8);
    }
    if(!arrived){
      // Draw only the *remaining* shadow→target-surface segment; length is the game rule.
      const dx=x-shadow.x,dy=y-shadow.y,d=Math.hypot(dx,dy),gap=display.scene.remainingGap;
      if(d>1e-4&&gap>0){
        const ux=dx/d,uy=dy/d,ex=x-ux*fxAnchor.r,ey=y-uy*fxAnchor.r,
          linkAlpha=clamp((.26+.46*q)*intensity,0,1);
        paint.line(shadow.x,shadow.y,ex,ey,1.2+q*2.0,
          [c[0],c[1],c[2],linkAlpha*.43]);
        // Segmented light travelling *into* the target, speeding up with compression.
        const segments=9;
        for(let i=0;i<segments;i++){
          const a=i/segments,b=Math.min(1,a+.044+q*.052);
          if(i%3===2)continue;
          paint.line(shadow.x+(ex-shadow.x)*a,shadow.y+(ey-shadow.y)*a,
            shadow.x+(ex-shadow.x)*b,shadow.y+(ey-shadow.y)*b,
            1.5+q*2.2,[c[0],c[1],c[2],linkAlpha*(.42+.32*q)]);
        }
        if(C.fx.linkPulse){for(let i=0;i<3;i++){
          const u=(t*(.55+q*1.9)*C.fx.pulseSpeed+i/3)%1;
          const px=shadow.x+(ex-shadow.x)*u,py=shadow.y+(ey-shadow.y)*u;
          paint.ellipse(px,py,2.5+q*2.0,2.5+q*2.0,
            [c[0],c[1],c[2],clamp(.55*intensity,0,1)],9);
        }}
      }
    }else if(stage==='golden'){
      const elapsed=clamp((timeMs-shadow.contactAtMs)/Math.max(1,C.timing.shadowHitstopMs),0,1);
      drawTargetBrackets(x,y,bracketR+9*elapsed,arm+3,3.5,[1,.92,.57,(1-elapsed*.6)*intensity]);
    }else if(stage==='coyote'){
      // Brackets separate and cool, preserving the idea of a missed exact moment.
      drawTargetBrackets(x,y,bracketR+8*late,arm,1.5,[.44,.72,1,(.55-.35*late)*intensity],late>.45);
    }
  }
  function updateTargetCue(){
    const cue=$('targetcue');
    if(!C.fx.targetCompression||!shadow||!getTargetAnchor(fxAnchor)){cue.classList.remove('active');cue.dataset.stage='none';return;}
    const stage=fxStage(chargeOf()),available=shadowDashAvailable();
    // The target brackets communicate the state without an in-world warning label.
    const col={approach:'#72dce6',breakEven:'#ffc178',critical:'#ffe28f',golden:'#fff0ae',coyote:'#88bbff'};
    cue.style.color=available?col[stage]:'#ff7467';cue.dataset.stage=available?stage:'too-close';cue.dataset.target=fxAnchor.isEnemy?'enemy':'destination';
    cameraView.planeToScreenInto(fxAnchor.x,fxAnchor.y-fxAnchor.r-47,fxScreen);
    cue.style.transform=`translate3d(${fxScreen.x}px,${fxScreen.y}px,0) translate(-50%,-50%)`;
    cue.classList.add('active');
  }
  // Visual truth: while a dash is still physically travelling, show the flight target,
  // not the green 'ready' ring. It is NOT a charge meter and changes no hit rules.
  // Persistent, pre-launch auto-aim beam. Visible BEFORE tapping; unlike the shadow
  // compression link this uses the player's current body as its origin.
  function drawPreAim(now){const mode=display.scene.mode;if(mode!=='READY'&&mode!=='RECOVER'&&mode!=='DASH')return;
    const e=display.units.find(u=>u.unitId===display.scene.aimId);if(!e)return;
    const p=display.player.body.position,b=e.body.position,dr=Math.hypot(b.x-p.x,b.y-p.y);
    if(dr<1||dr>C.aim.previewRange)return;
    const n=norm(b.x-p.x,b.y-p.y),t=now*.001*C.aim.pulseSpeed;
    const sx=p.x+n.x*(C.player.radius+8),sy=p.y+n.y*(C.player.radius+8);
    const ex=b.x-n.x*(enemyDef(e).radius+3),ey=b.y-n.y*(enemyDef(e).radius+3);
    const canFire=mode==='READY';
    const close=Math.max(0,dr-(enemyDef(e).radius+6))<C.shadow.minDashDistance;
    const rgb=close?[1,.34,.31]:[.48,1,.79],a=close?(canFire?.96:.53):(canFire?.50:.23);
    // Red means: shadow can still fire and push, but the offensive dash
    // requires separation. Green means enough space for the complete sequence.
    const begin=dr<C.player.radius+enemyDef(e).radius+14?{x:p.x,y:p.y}:{x:sx,y:sy};
    const end=dr<C.player.radius+enemyDef(e).radius+14?{x:b.x,y:b.y}:{x:ex,y:ey};
    paint.line(begin.x,begin.y,end.x,end.y,(close?7:4.5)*C.aim.stroke,[rgb[0],rgb[1],rgb[2],close?.25:.13*a/.50]);
    paint.line(begin.x,begin.y,end.x,end.y,(close?2.5:1.45)*C.aim.stroke,[rgb[0],rgb[1],rgb[2],a]);
    for(let k=0;k<2;k++){const v=(t*.58+k*.5)%1,tx=begin.x+(end.x-begin.x)*v,ty=begin.y+(end.y-begin.y)*v;
      paint.ellipse(tx,ty,2.3,2.3,[rgb[0],rgb[1],rgb[2],a*.85],9);
    }
    const radius=enemyDef(e).radius+44,glow=.75+.25*Math.sin(t*4),alpha=a*glow;
    drawTargetBrackets(b.x,b.y,radius,7,1.8,[rgb[0],rgb[1],rgb[2],alpha]);
  }
  function drawDashFlightGuide(){
    const {mode,dashFlight}=display.scene;
    if(mode!=='DASH'||!dashFlight)return;
    const target=displayedUnit(dashFlight.targetId);
    if(!target)return;
    const p=display.player.body.position,q=target.body.position,n=norm(q.x-p.x,q.y-p.y);
    const gap=Math.max(0,Math.hypot(q.x-p.x,q.y-p.y)-C.player.radius-enemyDef(target).radius);
    const progress=1-clamp(gap/Math.max(1,dashFlight.initialGap),0,1);
    paint.line(p.x,p.y,q.x-n.x*enemyDef(target).radius,q.y-n.y*enemyDef(target).radius,1.3,
      [1,.86,.52,.12+.20*progress]);
    paint.ellipse(q.x,q.y,enemyDef(target).radius+11,enemyDef(target).radius+11,[1,.86,.52,.07+.12*progress],22);
  }
  function drawUnit(unit,now){const timeMs=display.timeMs;if(unit.returnFlight?.phase==='DOCKED')return;const p=unit.body.position,r=unit.config.radius,z=unit.targetable===false?0:unit.spatial.feetZ,pres=unit.presentation;
    paint.ellipse(p.x,p.y+6,r,r*.58,[0,0,0,.4],16);
    if(unit.bossPattern)drawBoss(unit,now);
    const ground=unit.groundAttack;for(const spike of ground?.effects||[]){const fade=clamp((spike.untilMs-timeMs)/420,0,1);if(fade>0){const q=spike.size;paint.tri(spike.x,spike.y-q*1.8,spike.x-q*.65,spike.y+q*.22,spike.x+q*.65,spike.y+q*.22,[.53,.84,.95,fade*.9]);paint.tri(spike.x,spike.y-q*1.8,spike.x,spike.y+q*.22,spike.x+q*.65,spike.y+q*.22,[.85,.98,1,fade*.95]);}}if(ground?.phase==='PREPARE'){const c=ground.config,aim=ground.aim;if(c.kind==='line'){const n={x:unit.headingX,y:unit.headingY};paint.line(p.x,p.y,p.x+n.x*c.range,p.y+n.y*c.range,c.width,[.50,.81,1,.16]);paint.line(p.x,p.y,p.x+n.x*c.range,p.y+n.y*c.range,2,[.65,.93,1,.8]);}else drawArc(aim.x,aim.y,c.radius,0,Math.PI*2,24,2,[.65,.93,1,.8]);}
    for(const tell of ground?.pending||[])drawArc(tell.aim.x,tell.aim.y,ground.config.radius,0,Math.PI*2,24,2,[.65,.93,1,.8]);
    if(unit.coneBreath&&['PREPARE','FIRE'].includes(unit.coneBreath.phase)){const c=unit.coneBreath.config,a=Math.atan2(unit.headingY,unit.headingX),col=[.75,.94,.36,unit.coneBreath.phase==='FIRE'?.65:.35];for(const sign of [-1,1])paint.line(p.x,p.y,p.x+Math.cos(a+sign*c.halfAngle)*c.range,p.y+Math.sin(a+sign*c.halfAngle)*c.range,2,col);drawArc(p.x,p.y,c.range,a-c.halfAngle,a+c.halfAngle,12,2,col);}
      drawEliteEvasion(unit,pres,r,now);const evadePose=unit.evasion?.presentation;
      vectorActors.drawActor({key:unit.unitId,assetId:pres.assetId??unit.speciesId,x:p.x+(evadePose?.shakeX??0),y:p.y-z,radius:r,timeMs,
        unit,attacking:['GROUND_PREPARE','CONE_PREPARE','CONE_FIRE','WINDUP','LEAP_PREPARE','SELF_DESTRUCT_PREPARE','SPIKE_PREPARE','SPIKE_ACTIVE','ARC_PREPARE','ARC_BURST','LUNGE','MELEE_PREPARE','MELEE_STRIKE','SUNBEAM_PREPARE','SUNBEAM_FIRE','HEAL_PREPARE','HOOK_PREPARE','HOOK_FLIGHT','HOOK_RETURN','PROJECTILE_BURST'].includes(unit.state),
        scaleY:evadePose?.squash??1,outline:pres.outline});
    drawUnitStatus(unit,p.x,p.y-z,r);
    const ability=unit.selfDestruct||unit.spike||unit.arcFire||unit.leap||unit.lunge||unit.projectileFire||unit.melee||unit.sunbeam||unit.heal;
    if(ability?.phase==='PREPARE')drawArc(p.x,p.y,r+12,-Math.PI/2,Math.PI*2*clamp(1-ability.leftMs/ability.config.prepareMs,0,1),26,2.3,[1,.63,.3,.8]);
    const aim=unit.leap?.aim;if(aim&&['PREPARE','FLIGHT'].includes(unit.leap.phase))drawArc(aim.x,aim.y,r+5,0,Math.PI*2,24,1.7,[.91,.74,.39,.7]);
    if(unit.hp<unit.maxHp){paint.box(p.x,p.y-z-r-14,40,4,colors.hpBack);paint.box(p.x-20+20*unit.hp/unit.maxHp,p.y-z-r-14,40*unit.hp/unit.maxHp,4,colors.hp);}
    const beam=unit.sunbeam;
    if(beam?.target&&['PREPARE','FIRE'].includes(beam.phase)){const t=beam.target,b=t.body.position,tz=t.body.plugin.volume?.feetZ||0,tx=b.x,ty=b.y-tz-(t.body.plugin.volume?.height||0)*.4;
      const sx=p.x,sy=p.y-z-r*.64,firing=beam.phase==='FIRE',core=firing?[1,.95,.53,.94]:[1,.75,.30,.35];
      paint.line(sx,sy,tx,ty,firing?7+beam.stage*2:2,[1,.60,.16,firing?.25:.15]);paint.line(sx,sy,tx,ty,firing?1.5+beam.stage*.7:1,core);
      paint.ellipse(tx,ty,firing?5+beam.stage*2:5,firing?5+beam.stage*2:5,core,12);}
    if(unit.melee&&['PREPARE','STRIKE'].includes(unit.melee.phase)){const c=unit.melee.config,a=Math.atan2(unit.headingY,unit.headingX);drawArc(p.x,p.y-z,c.range,a-c.halfAngle,c.halfAngle*2,18,unit.melee.phase==='STRIKE'?3:1,[1,.80,.4,unit.melee.phase==='STRIKE'?.75:.28]);}
    const link=unit.heal?.link;if(link&&timeMs<link.untilMs&&link.target.alive){const t=link.target.body;paint.line(p.x,p.y-z-r*.3,t.position.x,t.position.y-(t.plugin.volume?.feetZ||0),2,[.5,1,.8,.65]);}
    const burrow=unit.burrow;
    if(burrow?.aim&&['DIVE','MOVE','EMERGE_PREPARE'].includes(burrow.phase)){const aim=burrow.aim,c=burrow.config,pulse=.65+.25*Math.sin(now*.02);
      drawArc(aim.x,aim.y,c.radius,0,Math.PI*2,32,3+C.visual.threats.underlayWidth,[.02,.025,.038,.9]);
      drawArc(aim.x,aim.y,c.radius,0,Math.PI*2,32,3,[1,.64,.34,pulse]);
      if(burrow.phase==='EMERGE_PREPARE')drawArc(aim.x,aim.y,c.radius*(1-burrow.leftMs/c.emergeMs),0,Math.PI*2,28,2,[1,.78,.46,.8]);}
    const hook=unit.hook;
    if(hook?.aim&&hook.phase==='PREPARE'){const aim=hook.aim,c=hook.config,s={x:p.x+unit.headingX*r*.36,y:p.y+unit.headingY*r*.36};let previous={x:s.x,y:s.y-10};
      for(let i=1;i<=12;i++){const t=i/12,next={x:s.x+(aim.x-s.x)*t,y:s.y+(aim.y-s.y)*t-10*(1-t)-4*c.arcHeight*t*(1-t)};
        paint.line(previous.x,previous.y,next.x,next.y,1.6,[1,.68,.35,.65]);previous=next;}
      drawArc(aim.x,aim.y,c.radius+16,0,Math.PI*2,18,2,[1,.65,.30,.8]);}
    if(unit.returnFlight?.phase==='RETURN'&&unit.summoner?.alive){const home=unit.summoner.body.position;paint.line(p.x,p.y,home.x,home.y,1,[.6,1,.73,.35]);}
    drawElementalOverlay(unit,now);
  }
  function drawCompanions(now){for(const actor of display.companions){const p=actor;
    if(actor.kind==='egg'){const progress=actor.progress;
      paint.ellipse(p.x,p.y,10,4,[0,0,0,.28],12);const y=p.y-(actor.floatZ??petConfig.presentation.eggFollow.hoverHeight);
      vectorActors.drawEgg({key:`companion:${actor.inventoryId}`,speciesId:actor.speciesId,x:p.x,y,radius:11,timeMs:display.timeMs,progress});drawArc(p.x,y,18,-Math.PI/2,Math.PI*2*progress,24,2,[1,.87,.58,.8]);}
    else if(!actor.unit)drawArc(p.x,p.y,18,-Math.PI/2,Math.PI*2*(1-(actor.reviveAtMs-display.timeMs)/petConfig.combat.reviveMs),24,2,[.67,.86,1,.6]);
  }}
  function drawBoss(b,now){const timeMs=display.timeMs;
    const p=b.body.position,r=b.config.radius,wind=b.state==='BOSS_WINDUP',lock=b.state==='BOSS_LOCK';
    const age=clamp((timeMs-b.patternStartedAtMs)/Math.max(1,b.bossParams?.windupMs||C.boss.windupMs),0,1);
    paint.ellipse(p.x+5,p.y+10,r+18,r*.8,[0,0,0,.40],24);
    // Common boss-readable silhouette, regardless of the equipped theme recipe.
    paint.ellipse(p.x,p.y,r*1.31,r*1.20,[.024,.027,.047,.82],26);
    if(wind||lock){
      const col=lock?[1,.87,.53,.93]:[1,.59,.35,.55+.38*age];
      drawArc(p.x,p.y,r+30,-Math.PI/2,Math.PI*2*(lock?1:age),42,
        (lock?5:3)+C.visual.threats.underlayWidth,[.02,.025,.038,C.visual.threats.underlayOpacity]);
      drawArc(p.x,p.y,r+30,-Math.PI/2,Math.PI*2*(lock?1:age),42,lock?5:3,col);
      if(b.pattern==='SUMMON'){
        for(let i=0;i<Math.min(6,b.bossParams.summonCount+2);i++){
          const a=i*Math.PI*2/Math.min(6,b.bossParams.summonCount+2)+now*.0003;
          paint.ellipse(p.x+Math.cos(a)*(r+64),p.y+Math.sin(a)*(r+64),7+age*4,7+age*4,[col[0],col[1],col[2],.30+age*.5],14);
        }
      }else if(b.pattern==='RADIAL'){
        for(let i=0;i<12;i++){
          const a=i*Math.PI/6+now*.00032;
          paint.line(p.x+Math.cos(a)*(r+12),p.y+Math.sin(a)*(r+12),p.x+Math.cos(a)*(r+35+age*14),p.y+Math.sin(a)*(r+35+age*14),2.1,col);
        }
      }else{
        const angle=Math.atan2(b.headingY,b.headingX),dist=b.pattern==='CHARGE'?590:440;
        for(let i=-1;i<=1;i++){
          const a=angle+i*(b.pattern==='FAN'?.33:.06);
          const x1=p.x+Math.cos(a)*r,y1=p.y+Math.sin(a)*r,x2=p.x+Math.cos(a)*dist,y2=p.y+Math.sin(a)*dist;
          paint.line(x1,y1,x2,y2,(lock?C.visual.threats.bossLockWidth:C.visual.threats.bossLineWidth)+C.visual.threats.underlayWidth,
            [.012,.024,.034,C.visual.threats.underlayOpacity*(i===0?1:.72)]);
          paint.line(x1,y1,x2,y2,lock?C.visual.threats.bossLockWidth:C.visual.threats.bossLineWidth,[col[0],col[1],col[2],col[3]*(i===0?1:.65)]);
        }
      }
    }

    if(b.state==='BOSS_CHARGE'){
      const sp=b.velocity,dir=norm(sp.x,sp.y);
      for(let i=-1;i<=1;i++)paint.line(p.x-dir.x*55-dir.y*i*11,p.y-dir.y*55+dir.x*i*11,
        p.x-dir.x*140-dir.y*i*11,p.y-dir.y*140+dir.x*i*11,4,[1,.70,.40,.40]);
    }
  }

  function ammoOrbitStates(p,nowMs){
    const v=C.visual.ammoOrbit,states=[],ready=new Set(attackAmmo.readySlots),refilling=attackAmmo.refillSlots[0];
    for(let slot=0;slot<attackAmmo.config.maxCharges;slot++){
      const loaded=ready.has(slot),q=loaded?1:slot===refilling?attackAmmo.progress:0;if(q<=0)continue;
      const eased=1-Math.pow(1-clamp(q,0,1),3),aligning=pendingLaunch?.slot===slot;
      const angle=aligning?pendingLaunch.angle:orbitAngle(slot,nowMs),radius=C.shadow.orbit.radius*eased;
      states.push({slot,ready:loaded,aligning,progress:q,angle,x:p.x+Math.cos(angle)*radius,y:p.y+Math.sin(angle)*radius,
        radius:loaded?v.shardRadius:v.minShardRadius+(v.shardRadius-v.minShardRadius)*eased});
    }
    return states;
  }
  function drawShadowShard(x,y,radius,alpha=1,aligning=false){
    paint.ellipse(x,y,radius*1.8,radius*1.8,[.26,.62,.73,(aligning?.28:.16)*alpha],12);
    paint.ellipse(x,y,radius,radius,[aligning?.72:colors.shadow[0],aligning?1:colors.shadow[1],aligning?1:colors.shadow[2],alpha],12);
    paint.ellipse(x,y,radius*.38,radius*.38,[1,1,1,alpha],8);
  }
  function shadowShardRadius(shadowState=shadow){const v=C.visual.ammoOrbit;return v.shardRadius+(v.flightRadius-v.shardRadius)*clamp(shadowState.age*1000/v.flightGrowMs,0,1);}
  function drawAttackAmmo(p){
    for(const state of display.orbits){const orb={...state,x:p.x+Math.cos(state.angle)*state.distance,y:p.y+Math.sin(state.angle)*state.distance};
      drawShadowShard(orb.x,orb.y,orb.radius,orb.ready?1:.55+.45*orb.progress,orb.aligning);
      if(orb.aligning){const x=Math.cos(orb.angle),y=Math.sin(orb.angle);paint.line(orb.x-x*8,orb.y-y*8,orb.x+x*5,orb.y+y*5,.8,[.55,1,1,.7]);}
    }
  }
  function updatePlayerVisuals(dtMs){
    const p=player.position,pres=playerUnit.presentation,target=previewTargetId==null?null:enemies.find(e=>e.alive&&e.id===previewTargetId);
    // Explicit roll/attack intent wins; physical knockback never chooses the face.
    const direction=evadeMotion?{x:evadeMotion.x,y:evadeMotion.y}:pendingLaunch?launchDirection(pendingLaunch):
      ultimateRunner.state?.direction??(shadow?{x:shadow.dirX,y:shadow.dirY}:mode==='DASH'&&dashMotion?{x:dashMotion.dirX,y:dashMotion.dirY}:
      mode==='READY'&&target?{x:target.body.position.x-p.x,y:target.body.position.y-p.y}:null);
    const v=speedOf(player),speed=Math.hypot(v.x,v.y),dash=mode==='DASH'&&dashMotion?{direction:speed>3?norm(v.x,v.y):{x:dashMotion.dirX,y:dashMotion.dirY},speed}:null;
    const phase=ultimateRunner.state?.phase,compression=phase?.charge?Math.sin(ultimateRunner.progress()*Math.PI/2)*(phase.compression??.12):phase?.expansion?-phase.expansion.amplitude*Math.sin(Math.PI*clamp(ultimateRunner.state.elapsedMs/phase.expansion.durationMs,0,1)):0;
    const recoil=launchRecoil?{direction:{x:launchRecoil.x,y:launchRecoil.y},amount:Math.sin(Math.PI*clamp((timeMs-launchRecoil.startedAtMs)/C.shadow.recoil.durationMs,0,1))*C.visual.launch.squashRate}:null;
    updatePlayerPresentation(pres,{nowMs:timeMs,dtMs,direction,dash,recoil,compression});
  }
  function capturePresentation(){
    const aim=enemies.find(e=>e.alive&&e.id===previewTargetId),anchor={};getTargetAnchor(anchor);
    const state=ultimateRunner.state;
    // Immutable skill definitions are not part of the sampled world; only narrow
    // active visual state and fixed historical trails cross the capture boundary.
    const ultimate=state?{skillId:state.id,phaseIndex:state.skill.sequence.indexOf(state.phase),elapsedMs:state.elapsedMs,totalMs:state.totalMs,
      direction:{...state.direction},aim:state.aim?{...state.aim}:null,trails:state.trails,trailWidth:state.trailWidth,beam:state.beam,wave:state.wave,progress:ultimateRunner.progress()}:null;
    presentation.capture({timeMs,player:playerUnit,units:unitsById.values(),shots:projectiles,shadow,drops:lootDrops.active,
      companions:petRoster.actors.map(a=>({...a,progress:companions.byId.get(a.inventoryId)?.hatchProgress/petConfig.eggs.hatchKills})),
      orbits:ammoOrbitStates({x:0,y:0},timeMs).map(o=>({...o,distance:Math.hypot(o.x,o.y)})),
      scene:{mode,aimId:aim?.unitId??null,anchor,charge:chargeOf(),fxStage:fxStage(chargeOf()),dashAvailable:shadowDashAvailable(),remainingGap:remainingShadowGap(),
        dashFlight:dashFlight?{...dashFlight}:null,dashing:mode==='DASH'&&!!dashMotion,ultimate}},performance.now());
  }
  function advanceGame(events=[]){step(events);capturePresentation();}
  function displayedUnit(id){return display.units.find(u=>u.id===id);}
  function render(now){const elapsed=clamp(now-lastFrame,0,60);lastFrame=now;
    display=presentation.frame(performance.now(),{active:isolatedScene?scenarioRunner?.state==='playing':!gameplayInputBlocked(),rate:previewScenario?.playbackRate??1});
    const visualPlayer=display.player,visualPosition=visualPlayer.body.position;
    // Camera is presentation only. It never modifies Matter.js positions.
    if(introScene&&previewOrigin){const c=introScenes[introChapter].camera,anchor=c.follow?visualPosition:previewOrigin;cameraView.follow(anchor.x+c.x,anchor.y+c.y,Math.min(60,elapsed),90);}
    else if(previewSkill&&previewOrigin)cameraView.setCamera({x:previewOrigin.x+previewScenario.camera.x,y:previewOrigin.y+previewScenario.camera.y});else cameraView.follow(visualPosition.x,visualPosition.y,Math.min(60,elapsed),C.camera.halfLife*1000);
    const cw=canvas.clientWidth,ch=canvas.clientHeight;
    cameraZoom=introScene?clamp(Math.min(cw/introScenes[introChapter].camera.width,ch/introScenes[introChapter].camera.height),.45,1.3):previewSkill?clamp(Math.min(cw/previewScenario.camera.width,ch/previewScenario.camera.height),.25,1.16):clamp(Math.min(cw/760,ch/940),.54,1.16);
    cameraView.setViewport({width:cw,height:ch});cameraView.setCamera({zoom:cameraZoom});
    if(context.state!=='ready'||vectorDevice.gl.isContextLost())return;
    const shake=cameraShakeOffset();cameraView.setShake(shake.x,shake.y);
    const ground=(THEME_POOL[stage.themeId]||THEME_POOL.garden).colors.clear;
    if(!context.beginFrame({clearColor:ground}))return;
    cameraView.applyToContext(context);vectorActors.beginFrame();
    drawWorld();
    drawDrops();
    drawPreAim(display.timeMs);
    drawTargetCompressionVfx(display.timeMs);
    drawDashFlightGuide();
    for(const unit of display.units)drawUnit(unit,display.timeMs);
    drawCompanions(display.timeMs);
    drawLightningArcs();
    drawFireEmbersAndTransfers();
    // Projectiles have their own tint and motion trail; the sim owns their collisions.
    for(const shot of display.shots){if(shot.arc){drawArcShot(shot);continue;}const p=shot.body.position,r=shot.body.circleRadius,c=shot.color;
      for(let i=1;i<shot.path.length;i++){const a=shot.path[i-1],b=shot.path[i];paint.line(a.x,a.y,b.x,b.y,3,c?[...c,.65]:shot.boss?[1,.42,.26,.72]:[.7,.43,1,.49]);}
      paint.ellipse(p.x,p.y,r+5,r+5,c?[...c,.23]:shot.boss?[1,.35,.20,.30]:[.66,.41,1,.23],14);
      paint.ellipse(p.x,p.y,r,r,c?[...c,1]:shot.faction===playerUnit.faction?[.62,1,.84,1]:shot.boss?[1,.59,.39,1]:[.83,.64,1,1],14);
      paint.ellipse(p.x,p.y,r*.34,r*.34,[1,.93,1,1],9);
    }
    const p=visualPosition,vel=visualPlayer.velocity;drawUnitStatus(visualPlayer,p.x,p.y,C.player.radius);

    {const shadow=display.shadow;
    if(shadow){const end={x:shadow.x,y:shadow.y};if(shadow.arrived){const golden=display.scene.mode==='GOLDEN';paint.ellipse(shadow.x,shadow.y,golden?32:26,golden?32:26,golden?[1,.78,.36,.24]:[.36,.62,1,.20],20);paint.ellipse(shadow.x,shadow.y,19,19,golden?[1,.84,.47,.65]:[.36,.68,1,.46],20);}
      paint.line(p.x,p.y,end.x,end.y,C.fx.targetCompression?.65:1.1,C.fx.targetCompression?[.43,.92,.84,.14]:colors.guide);
      for(let i=0;i<shadow.path.length-1;i++){const point=shadow.path[i],q=(i+1)/shadow.path.length;paint.ellipse(point.x,point.y,4+q*4,4+q*4,[.36,.85,1,q*.4],12);}
      drawShadowShard(shadow.x,shadow.y,shadowShardRadius(shadow));
    }}
    for(const pt of particles){if(pt.life<=0)continue;const a=pt.life/pt.maxLife;paint.ellipse(pt.x,pt.y,pt.r*a,pt.r*a,[pt.color[0],pt.color[1],pt.color[2],Math.min(1,a)*pt.color[3]],9);}
    for(const fx of fxRings){const q=clamp(fx.age/fx.lifeMs,0,1);
      drawArc(fx.x,fx.y,11+fx.radius*(1-Math.pow(1-q,2)),0,Math.PI*2,28,2.7*(1-q)+.4,[fx.color[0],fx.color[1],fx.color[2],(1-q)*.8]);
    }
    // Rocket-style acceleration must be legible without a numeric speed label.
    // The streak length reflects actual physical velocity, not shadow charge.
    if(display.scene.dashing){
      const movingSpeed=Math.hypot(vel.x,vel.y),direction=norm(vel.x,vel.y);
      const strength=clamp(movingSpeed/C.physics.maxSpeed,0,1),length=18+strength*86;
      const sideX=-direction.y,sideY=direction.x;
      paint.ellipse(p.x,p.y,22+strength*6,22+strength*6,[.31,1,.73,.08+.12*strength],22);
      for(let i=-1;i<=1;i++){
        const offset=i*7,from=22+Math.abs(i)*5;
        paint.line(p.x-direction.x*from+sideX*offset,p.y-direction.y*from+sideY*offset,
          p.x-direction.x*(from+length*(1-Math.abs(i)*.21))+sideX*offset,
          p.y-direction.y*(from+length*(1-Math.abs(i)*.21))+sideY*offset,
          1.5+strength*2.6,[.38,1,.79,(.20+.62*strength)*(i===0?1:.60)]);
      }
    }
    // Proc VFX carries augment feedback; the attack charge display is the small shadow orbit.
    vectorActors.drawPlayer({x:p.x,y:p.y,timeMs:display.timeMs,state:playerVectorState(playerUnit.presentation,display.timeMs),health:health/C.stats.maxHp});
    // Near-contact aim cannot be seen between overlapping body silhouettes;
    // repeat its short red laser ON TOP of the actors (no extra sim query).
    if(display.scene.mode==='READY'&&display.scene.aimId!=null){
      const candidate=display.units.find(u=>u.unitId===display.scene.aimId);
      if(candidate){
        const bx=candidate.body.position.x,by=candidate.body.position.y;
        const dist=Math.hypot(bx-p.x,by-p.y);
        if(Math.max(0,dist-enemyDef(candidate).radius-6)<C.shadow.minDashDistance){
          const aim=norm(bx-p.x,by-p.y),tipX=bx-aim.x*enemyDef(candidate).radius*.48,
            tipY=by-aim.y*enemyDef(candidate).radius*.48;
          paint.line(p.x+aim.x*4,p.y+aim.y*4,tipX,tipY,3.1,[1,.33,.29,.88]);
          paint.ellipse(tipX,tipY,3.7,3.7,[1,.68,.53,.93],12);
        }
      }
    }
    const us=display.scene.ultimate;
    const skill=us?C.ultimates.skills[us.skillId]:null;
    drawUltimate(paint,{state:us?{...us,skill,phase:skill.sequence[us.phaseIndex]}:null,progress:()=>us?.progress??0,
      effects:ultimateRunner.effects,loadout:ultimateLoadout},p);
    drawAttackAmmo(p);
    if(timeMs<missRecoveryPulseUntilMs){const a=(missRecoveryPulseUntilMs-timeMs)/C.visual.missRecovery.pulseMs;
      drawArc(p.x,p.y,22,-Math.PI*.18,Math.PI*.36,9,2,[1,.77,.47,a*.75]);}
    // One compact 42px charge strip: actual ready charges + next-charge progress, always centered.
    const refill=evadeRefillProgress(),gap=2,width=(42-gap*(C.evade.maxCharges-1))/C.evade.maxCharges;
    for(let i=0;i<C.evade.maxCharges;i++){
      const x=p.x-21+i*(width+gap),y=p.y+27;
      const full=i<evadeCharges,part=!full&&i===evadeCharges?refill:0;
      paint.box(x+width/2,y,width,4,[.11,.28,.33,.86]);
      if(full||part>0){const fill=width*(full?1:part);paint.box(x+fill/2,y,fill,4,[.44,.90,1,full?.94:.67]);}
    }
    // Converging readiness ring: no arrow, crosshair or target marker. Radius closes only as launch becomes ready.
    if((mode==='DASH'&&(!dashFlight||missRecoveryActive))||mode==='RECOVER'){
      const q=rearmProgress(),r=29-5*q,segments=22;
      const ringColor=bufferedIntent?[.62,1,.80,.95]:[.98,.76,.43,.48+.45*q];
      for(let i=0;i<segments;i++){
        const a=i*2*Math.PI/segments-Math.PI/2,b=(i+.72)*2*Math.PI/segments-Math.PI/2;
        paint.line(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,p.x+Math.cos(b)*r,p.y+Math.sin(b)*r,1.9,ringColor);
      }
      if(bufferedIntent)paint.ellipse(p.x,p.y,21,21,[.48,1,.74,.13],18);
    }else if(mode==='READY'&&timeMs<readyFlashUntilMs){
      const q=clamp((readyFlashUntilMs-timeMs)/200,0,1),r=22+(1-q)*8;
      for(let i=0;i<24;i++){
        const a=i*2*Math.PI/24,b=(i+.85)*2*Math.PI/24;
        paint.line(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,p.x+Math.cos(b)*r,p.y+Math.sin(b)*r,3,[.37,1,.74,q*.85]);
      }
    }
    if(C.debug.show){paint.line(p.x,p.y,p.x+vel.x*.1,p.y+vel.y*.1,2,[1,.85,.40,.8]);}
    if(C.debug.show)paint.ellipse(p.x,p.y,C.enemy.chaseRadius,C.enemy.chaseRadius,[.3,.7,.6,.10],72);
    context.endFrame();vectorActors.endFrame();
    // Position the hit counter in screen space using the same camera as the player.
    const comboVisible=phase==='PLAYING'&&combo>0&&(ultimateRunner.active||timeMs-lastComboHitAtMs<1100);
    comboFx.classList.toggle('active',comboVisible);
    if(comboVisible){cameraView.planeToScreenInto(p.x+27,p.y-44,comboScreen);
      comboFx.style.transform=`translate3d(${comboScreen.x}px,${comboScreen.y}px,0) translate(-10%,-100%)`;
    }
    updateTargetCue();
    $('stageLabel').textContent=tr('ui.stageLabel',{stage:stage.index,theme:THEME_POOL[stage.themeId].name,layout:THEME_POOL[stage.themeId].layouts.find(l=>l.id===stage.layoutId)?.name||''});
    $('stageProgress').textContent=stage.phase==='WAVE'?`${stage.waveKills} / ${stage.killTarget}`:
      stage.phase==='BOSS'?(BOSS_POOL[stage.bossSpeciesId]?.name||tr("runtime.103")):'BOSS_PENDING'===stage.phase?tr("runtime.104"):tr('ui.clear');
    $('bossHealthTrack').style.display=stage.phase==='BOSS'?'block':'none';
    $('bossHealthFill').style.width=(stage.boss?.alive?clamp(stage.boss.hp/stage.boss.maxHp,0,1)*100:0)+'%';
    $('stageBanner').classList.toggle('show',timeMs<(stage.noticeUntilMs??0));
    const directionEl=$('bossDirection'),boss=stage.boss?displayedUnit(stage.boss.id):null;
    if(stage.phase==='BOSS'&&boss?.alive){
      cameraView.planeToScreenInto(boss.body.position.x,boss.body.position.y,fxScreen);
      const edge=41,bw=canvas.clientWidth,bh=canvas.clientHeight;
      if(fxScreen.x<edge||fxScreen.x>bw-edge||fxScreen.y<edge+55||fxScreen.y>bh-edge-75){
        const dx=fxScreen.x-bw/2,dy=fxScreen.y-bh/2,angle=Math.atan2(dy,dx);
        const x=clamp(bw/2+Math.cos(angle)*Math.min(bw*.37,bh*.35),edge,bw-edge);
        const y=clamp(bh/2+Math.sin(angle)*Math.min(bw*.37,bh*.35),edge+90,bh-edge-90);
        directionEl.style.display='block';directionEl.style.transform=`translate3d(${x-12}px,${y-13}px,0) rotate(${angle}rad)`;
      }else directionEl.style.display='none';
    }else directionEl.style.display='none';
    frames++;if(now-frameFpsStart>=500){frameFps=Math.round(frames*1000/(now-frameFpsStart));frameFpsStart=now;frames=0;}
    if(previewScenario?.tutorial){$('demoKey').textContent=previewScenario.tutorial==='movement'?'W · A · S · D':'Space / Enter';$('demoKey').dataset.pressed=String(tick<demoPressUntil||demoTap&&tick<demoTap.until);$('auto').dataset.demoPress=String(tick<demoPressUntil);const pointer=$('demoPointer');pointer.hidden=!demoTap||tick>=demoTap.until;if(demoTap){const point={};cameraView.planeToScreenInto(demoTap.x,demoTap.y,point);pointer.style.left=point.x+'px';pointer.style.top=point.y+'px';}}
    updatePlayCoach();
    const pct=shadow?chargeOf():0;
    $('playerhp').textContent=health<10?health.toFixed(1):Math.ceil(health);$('healthfill').style.width=(health/C.stats.maxHp*100)+'%';$('healthlabel').textContent=tr('learn.health',{current:health.toFixed(1),max:C.stats.maxHp});$('combo').textContent=combo>0?'×'+combo:'—';$('hits').textContent=hits;$('speed').textContent=Math.round(Math.hypot(vel.x,vel.y));$('kills').textContent=kills;
    updateUltimateHud();$('auto').disabled=ultimateRunner.active;
    $('fps').textContent=frameFps+' FPS';$('state').textContent=mode==='DASH'&&dashFlight&&!missRecoveryActive?tr('ui.flight'):mode==='DASH'||mode==='RECOVER'?tr('ui.rearm',{progress:percent(rearmProgress())}):tr('state.'+mode);$('auto').className=mode.toLowerCase();$('auto').classList.toggle('miss-recovery',missRecoveryActive);$('auto').dataset.ammoEmpty=String(mode==='READY'&&attackAmmo.charges===0);
    $('missHint').classList.toggle('show',phase==='PLAYING'&&timeMs<missRecoveryHintUntilMs);
    const closeShadow=!!shadow&&!shadowDashAvailable();
    const preview=mode==='READY'?selectedAim():null;
    const nearAim=!!preview&&Math.max(0,Math.hypot(preview.body.position.x-player.position.x,preview.body.position.y-player.position.y)-enemyDef(preview).radius-6)<C.shadow.minDashDistance;
    $('auto').dataset.near=String(closeShadow||nearAim);
    $('auto').firstChild.textContent=mode==='ULTIMATE'?tr('ultimate.castingShort'):mode==='ALIGN'?tr("runtime.105"):closeShadow?tr("runtime.106"):(mode==='SHADOW'||mode==='GOLDEN'||mode==='COYOTE')?tr('ui.dash'):missRecoveryActive?tr("runtime.107"):mode==='READY'?(attackAmmo.charges?tr('ui.tap'):tr("runtime.108")):bufferedIntent?tr("runtime.109"):tr('ui.wait');$('auto').lastChild.textContent=closeShadow?tr('learn.distance'):(mode==='GOLDEN'||mode==='COYOTE')?tr('learn.now'):mode==='SHADOW'?tr('learn.again'):mode==='READY'?`${attackAmmo.charges}/${C.shadow.ammo.maxCharges}`+(attackAmmo.charges<C.shadow.ammo.maxCharges?` · ${Math.round(attackAmmo.progress*100)}%`:''):bufferedIntent?'✓':''; $('auto').setAttribute('aria-label',mode==='ALIGN'?tr("runtime.110"):mode==='DASH'&&dashFlight&&!missRecoveryActive?tr("runtime.111"):missRecoveryActive?tr("runtime.112"):mode==='DASH'||mode==='RECOVER'?tr("runtime.113"):mode==='READY'?tr("runtime.114",{v0:attackAmmo.charges,v1:C.shadow.ammo.maxCharges,v2:C.shadow.ammo.rechargeMs}):closeShadow?tr("runtime.115"):tr("runtime.116"));
    $('chargetext').textContent=shadow?`${Math.round(pct*100)}%`:'';
    $('charge').className=mode==='GOLDEN'?'golden':mode==='COYOTE'?'coyote':mode==='SHADOW'&&pct>=C.timing.bulletStart?'golden':'';$('chargefill').style.width=((shadow?pct:mode==='DASH'&&dashFlight?dashFlightProgress():0)*100)+'%';$('toast').textContent=timeMs<toastUntil?messageText(toastText):'';$('toast').style.color=toastColor;$('toast').classList.toggle('visible',timeMs<toastUntil);
    // Damage numbers use one event-owned DOM node, projected from the world each frame.
    const screenPoint={};for(const f of textFloats){cameraView.planeToScreenInto(f.x,f.y-30-f.age*f.risePxPerMs,screenPoint);
      f.el.style.transform=`translate3d(${screenPoint.x}px,${screenPoint.y}px,0) translate(-50%,-50%)`;f.el.style.opacity=String(Math.max(0,1-f.age/f.lifetimeMs));}
    canvas.dataset.chainActive=String(chainActive);canvas.dataset.chainStarts=String(chainStarts);
    canvas.dataset.level=String(progressionLevel(tech.kills));canvas.dataset.totalKills=String(tech.defeats);canvas.dataset.collectedGrowth=String(tech.kills);canvas.dataset.techPoints=String(availableTech());canvas.dataset.autoChainReady=String(autoChainReady);canvas.dataset.chainWins=String(autoChainWins);canvas.dataset.chainRolls=String(autoChainRolls);canvas.dataset.autoDashes=String(automaticDashes);canvas.dataset.aimTargetId=String((mode==='READY'||mode==='RECOVER'||mode==='DASH')?(previewTargetId??''):'');canvas.dataset.augments=[C.chain.enabled,C.augment.spore.enabled,C.augment.momentum.enabled,C.chain.followKill].map(v=>v?'1':'0').join('');canvas.dataset.hp=String(health);canvas.dataset.remainingGap=String(Math.round(remainingShadowGap()));canvas.dataset.shadowSeparation=String(Math.round(shadowSeparation()));canvas.dataset.shadowDashReady=String(shadowDashAvailable());canvas.dataset.targetId=String(shadow?.targetId??'');canvas.dataset.damageTaken=String(Math.round(damageTaken));canvas.dataset.ammo=String(attackAmmo.charges);canvas.dataset.ammoCapacity=String(C.shadow.ammo.maxCharges);canvas.dataset.ammoRefill=String(attackAmmo.progress);canvas.dataset.launchCount=String(launchCount);canvas.dataset.healingDone=String(Math.round(healingDone));canvas.dataset.charge=String(Math.round(pct*100));canvas.dataset.dashAccel=String(dashMotion?.acceleration??0);canvas.dataset.state=mode;canvas.dataset.rearm=String(Math.round(rearmProgress()*100));canvas.dataset.buffered=String(!!bufferedIntent);canvas.dataset.stage=String(stage.index);canvas.dataset.stagePhase=stage.phase;canvas.dataset.stageKills=String(stage.waveKills);
    canvas.dataset.evadeCharges=String(evadeCharges);canvas.dataset.evadeActions=String(evadeActions);canvas.dataset.bossPattern=stage.boss?.pattern??'';
    canvas.dataset.tick=String(tick);canvas.dataset.hits=String(hits);canvas.dataset.kills=String(kills);
  }
  // DOM layout and settings (render owner handles CSS/DPR; game owns world projection).
  function resize(){const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);cameraView.setViewport({width:w,height:h,dpr:Math.min(window.devicePixelRatio||1,2)});cameraView.resizeCanvas(canvas);}
  const audioControls=document.createElement('div');audioControls.className='audio-controls';audioControls.innerHTML=tr("runtime.117");$('settingRows').append(audioControls);
  const audioCategoryNames={get enemy(){return tr("runtime.118");},get impact(){return tr("runtime.119");},get motion(){return tr("runtime.120");},get danger(){return tr("runtime.121");},get reward(){return tr("runtime.122");},get magic(){return tr("runtime.123");},get ui(){return tr("runtime.124");}};
  for(const [category,name] of Object.entries(audioCategoryNames)){const label=document.createElement('label'),slider=document.createElement('input'),value=document.createElement('output');slider.type='range';slider.min='0';slider.max='100';slider.step='1';slider.id='audioCategory_'+category;slider.setAttribute('aria-label',tr("runtime.phrase.19",{v0:name}));value.id=slider.id+'_value';label.append(document.createTextNode(name+' '),slider,value);audioControls.append(label);slider.oninput=()=>{sfx.setCategoryVolume(category,Number(slider.value)/100);refreshAudioUi();};}
  function refreshAudioUi(){$('audioMute').textContent=sfx.muted?tr("runtime.126"):tr("runtime.127");$('audioMute').setAttribute('aria-pressed',String(sfx.muted));$('audioVolume').value=$('audioSettingsVolume').value=String(Math.round(sfx.volume*100));$('audioVolumeValue').textContent=Math.round(sfx.volume*100)+'%';$('audioSettingsMute').checked=sfx.muted;for(const [category,volume] of Object.entries(sfx.snapshot().categoryVolumes)){const id='audioCategory_'+category;if($(id)){$(id).value=String(Math.round(volume*100));$(id+'_value').textContent=Math.round(volume*100)+'%';}}}
  $('audioMute').onclick=()=>{sfx.setMuted(!sfx.muted);refreshAudioUi();};$('audioSettingsMute').onchange=e=>{sfx.setMuted(e.target.checked);refreshAudioUi();};
  for(const id of ['audioVolume','audioSettingsVolume'])$(id).oninput=e=>{sfx.setVolume(Number(e.target.value)/100);refreshAudioUi();};refreshAudioUi();
  document.addEventListener('click',event=>{if(previewHost?.active||introHost?.active||isolatedScene)return;const button=event.target.closest('button');if(button&&!button.closest('#game')&&button.id!=='auto')void playUiSound();});
  const settings=[localizedList(['shadow.orbit.alignMs',()=>tr("runtime.128"),40,160,10]),localizedList(['shadow.initialSpeed',()=>tr("runtime.129"),20,420,10]),localizedList(['shadow.acceleration',()=>tr("runtime.130"),400,5300,100]),localizedList(['shadow.range',()=>tr("runtime.131"),250,980,10]),localizedList(['shadow.minDashDistance',()=>tr("runtime.132"),10,80,2]),localizedList(['shadow.contactPushSpeed',()=>tr("runtime.133"),0,800,20]),localizedList(['shadow.contactPushControlMs',()=>tr("runtime.134"),0,1000,25]),localizedList(['dash.minSpeed',()=>tr("runtime.135"),80,500,10]),localizedList(['dash.maxSpeed',()=>tr("runtime.136"),500,1250,10]),localizedList(['dash.acceleration',()=>tr("runtime.137"),150,2600,50]),localizedList(['damage.referenceSpeed',()=>tr("runtime.138"),500,2600,50]),localizedList(['dash.rearmMinMs',()=>tr("runtime.139"),70,350,5]),localizedList(['dash.rearmMaxMs',()=>tr("runtime.140"),200,750,10]),localizedList(['dash.rearmSpeed',()=>tr("runtime.141"),250,1050,25]),localizedList(['dash.flightMaxMs',()=>tr("runtime.142"),800,3500,50]),localizedList(['dash.inputBufferMs',()=>tr("runtime.143"),80,800,10]),localizedList(['physics.restitution',()=>tr("runtime.144"),0.1,1,0.05]),localizedList(['physics.maxSpeed',()=>tr("runtime.145"),900,3000,100]),localizedList(['physics.frictionAir',()=>tr("runtime.146"),0.001,0.035,0.001]),localizedList(['enemy.chaseRadius',()=>tr("runtime.147"),200,1100,25]),localizedList(['enemy.knockbackMultiplier',()=>tr("runtime.148"),0,2,.05]),localizedList(['enemy.projectileDamageMultiplier',()=>tr("runtime.149"),0,2,.05]),localizedList(['enemy.types.scout.speed',()=>tr("runtime.150"),50,250,10]),localizedList(['enemy.types.brute.sunbeam.dps',()=>tr("runtime.151"),5,50,1]),localizedList(['enemy.types.spitter.projectileSpeed',()=>tr("runtime.152"),180,850,20]),localizedList(['timing.bulletStart',()=>tr("runtime.153"),.60,.95,.01]),localizedList(['timing.bulletScale',()=>tr("runtime.154"),.15,.9,.05]),localizedList(['timing.coyoteMs',()=>tr("runtime.155"),50,240,5]),localizedList(['timing.shadowHitstopMs',()=>tr("runtime.156"),10,130,5]),localizedList(['timing.hitstopMs',()=>tr("runtime.157"),10,130,5]),localizedList(['chain.minTriggerCharge',()=>tr("runtime.158"),.10,1,.05]),localizedList(['chain.ricochetRangeRate',()=>tr("runtime.159"),.2,1,.05]),localizedList(['element.fire.durationMs',()=>tr("runtime.160"),500,6000,100]),localizedList(['element.fire.damageRate',()=>tr("runtime.161"),.05,.8,.05]),localizedList(['element.lightning.markDurationMs',()=>tr("runtime.162"),500,5000,100]),localizedList(['fx.intensity',()=>tr("runtime.163"),.2,2,.1]),localizedList(['fx.reticleScale',()=>tr("runtime.164"),.65,1.6,.05]),localizedList(['fx.pulseSpeed',()=>tr("runtime.165"),.2,2,.1])];
  for(const [key,label,min,max,stepValue] of settings){const div=document.createElement('div');div.className='setting-row';const labelEl=document.createElement('label');labelEl.textContent=label;const inp=document.createElement('input');inp.type='range';inp.min=min;inp.max=max;inp.step=stepValue;inp.value=key.split('.').reduce((obj,part)=>obj[part],C);inp.id='config_'+key.replaceAll('.','_');const out=document.createElement('output');out.textContent=inp.value;inp.addEventListener('input',()=>{const parts=key.split('.');let target=C;for(let i=0;i<parts.length-1;i++)target=target[parts[i]];target[parts.at(-1)]=Number(inp.value);out.textContent=inp.value;});div.append(labelEl,inp,out);$('settingRows').append(div);}
  // Only the eight stats that affect this game remain; movement and automation belong to their own owners.
  const coreboundStatSettings=[
    localizedList(['attackPower',()=>tr("runtime.166"),40,180,5]),localizedList(['criticalChance',()=>tr("runtime.167"),0,.6,.01]),localizedList(['criticalDamage',()=>tr("runtime.168"),1,3,.05]),
    localizedList(['armorPenFlat',()=>tr("runtime.169"),0,60,1]),localizedList(['armorPenPercent',()=>tr("runtime.170"),0,.8,.05]),
    localizedList(['maxHp',()=>tr("runtime.171"),40,250,5]),localizedList(['armor',()=>tr("runtime.172"),0,120,5]),localizedList(['healthRegen',()=>tr("runtime.173"),0,12,.5])
  ];
  for(const [key,label,min,max,stepValue] of coreboundStatSettings){const div=document.createElement('div');div.className='setting-row';
    const labelEl=document.createElement('label');labelEl.textContent=label;labelEl.htmlFor='stat_'+key;
    const input=document.createElement('input');input.type='range';input.id='stat_'+key;input.min=min;input.max=max;input.step=stepValue;input.value=C.stats[key];
    const out=document.createElement('output');out.textContent=input.value;
    input.addEventListener('input',()=>{const old=C.stats[key],value=Number(input.value);C.stats[key]=value;out.textContent=input.value;
      if(key==='maxHp')health=Math.min(value,Math.max(0,health*value/old));});
    div.append(labelEl,input,out);$('statRows').append(div);
  }
  const augmentButtons=[['echo','↻'],['autoChain','◉'],['ricochet','⤳'],['relay','∞'],['spore','✳'],['momentum','↗'],['propulsion','➤'],['shockPush','◎']];
  for(const [id,symbol] of augmentButtons){const button=document.createElement('button');button.id='augment_'+id;
    button.textContent=symbol;button.title=tr("runtime.phrase.18",{v0:TECH_NODES.find(n=>n.id===id).name});button.setAttribute('aria-label',button.title);
    button.disabled=true;button.tabIndex=-1;$('augments').append(button);}
  const techElements=new Map();
  let selectedTechId=null,techView=null;
  const techBranchKeys={frost:"element.frost",acid:"element.acid",shadow:"runtime.232",chain:"runtime.233",motion:"runtime.234",evade:"runtime.235",impact:"runtime.236",lightning:"runtime.237",fire:"runtime.238",ultimate:"ultimate.branch",stats:"dom.coreboundStats.text.1"};
  const techBranchName=id=>tr(techBranchKeys[id]);
  const techNodeById=new Map(TECH_NODES.map(n=>[n.id,n]));
  function requirementState(node){let completed=0;for(const id of node.requires)if(hasTech(id))completed++;return {completed,total:node.requires.length,ready:completed===node.requires.length};}
  function selectTech(id,center=true){if(menuRouter&&!menuRouter.applying&&menuRouter.current.screen==="tech")return menuRouter.go({screen:"tech",item:id},{force:true});selectedTechId=id;updateTechSelection();if(center&&id)techView?.focusSelection();}
  function updateTechSelection(){
    for(const [id,elem]of techElements){elem.card.dataset.selected=String(id===selectedTechId);elem.select.setAttribute('aria-pressed',String(id===selectedTechId));}
    for(const [key,card]of statElements)card.dataset.selected=String(selectedTechId==="stat-"+key);
    techView?.render(selectedTechId);
  }
  for(const node of TECH_NODES){const card=document.createElement('article');card.className='tech-node';card.id='tech_'+node.id;card.dataset.combination=String(node.requires.length>1);
    const select=document.createElement('button');select.type='button';select.className='tech-select';select.dataset.techSelect=node.id;select.onclick=()=>selectTech(selectedTechId===node.id?null:node.id);
    const head=document.createElement('div');head.className='node-head';const symbol=document.createElement('span');symbol.className='node-icon';symbol.textContent=node.symbol;const name=document.createElement('b');name.textContent=node.name;head.append(symbol,name);
    const desc=document.createElement('span');desc.className='node-desc';desc.textContent=node.desc;select.append(head,desc);card.append(select);
    const recipe=document.createElement('div');recipe.className='tech-prereqs';const chips=[];
    for(const [index,id]of node.requires.entries()){if(index){const plus=document.createElement('span');plus.className='recipe-plus';plus.textContent='+';plus.setAttribute('aria-hidden','true');recipe.append(plus);}const chip=document.createElement('button');chip.type='button';chip.dataset.prereq=id;const icon=document.createElement('span'),label=document.createElement('span');icon.className='condition-icon';label.className='condition-name';chip.append(icon,label);chip.onclick=()=>selectTech(id,true);recipe.append(chip);chips.push({chip,icon,label,id});}card.append(recipe);
    const progress=document.createElement('small');progress.className='tech-condition-progress';const price=document.createElement('span');price.className='node-price';card.append(progress,price);
    const actions=document.createElement('div');actions.className='tech-actions';const buy=document.createElement('button');buy.type='button';buy.className='tech-buy';buy.dataset.techBuy=node.id;buy.onclick=()=>learnTech(node.id);actions.append(buy);
    if(previewScenarios[node.id]){const preview=makePreviewButton(node.id);preview.classList.add('tech-preview-button');actions.append(preview);}card.append(actions);card.onclick=event=>{if(!event.target.closest('button'))selectTech(selectedTechId===node.id?null:node.id);};
    card.dataset.branch=node.branch;$('techCards').append(card);techElements.set(node.id,{card,select,name,desc,price,progress,buy,chips,preview:actions.querySelector("[data-preview-id]")});
  }
  let revealTimer=0,petResultMessage='';function setPetResult(value){petResultMessage=value;$('petResult').textContent=messageText(value);}
  const petKnown=id=>companions.discovered.has(id);
  const petName=item=>item.kind==='egg'?(petKnown(item.speciesId)?tr("runtime.phrase.17",{v0:petConfig.species[item.speciesId].name}):tr("runtime.176")):petConfig.species[item.speciesId].name;
  const petIcon=item=>item.kind==='egg'?'◉':'✿';
  const petAbility=(id,grade=null)=>grade===null?species[id].description:species[id].gradeNotes[grade];
  function revealCompanions(ids){const reveal=$('petReveal');reveal.replaceChildren();for(const id of ids){const name=document.createElement('b');name.dataset.revealSpecies=id;name.textContent=petIcon({kind:'pet',speciesId:id})+' '+petConfig.species[id].name;const desc=document.createElement('span');desc.textContent=petAbility(id);reveal.append(name,desc);}reveal.classList.add('show');clearTimeout(revealTimer);revealTimer=setTimeout(()=>reveal.classList.remove('show'),2800);}
  function updateDiscoveredSpeciesWiki(){const target=$('wikiPetSpeciesTable');if(!target)return;target.replaceChildren();
    if(!companions.discovered.size){target.textContent=tr("runtime.177");return;}
    const table=document.createElement('table'),header=table.insertRow();for(const title of localizedList([()=>tr("runtime.178"),...petConfig.grades.map(g=>g.name)])){const cell=document.createElement('th');cell.textContent=title;header.append(cell);}
    for(const id of companions.discovered){const row=table.insertRow();for(const text of [species[id].name,...species[id].gradeNotes]){const cell=row.insertCell();cell.textContent=text;}}target.append(table);
  }
  function petCardFace(item,count=0){const face=document.createDocumentFragment(),icon=document.createElement('span');icon.className='pet-face-icon';
    if(item.kind==='egg'){icon.classList.add('pet-egg-mark');if(item.hatchProgress>=petConfig.eggs.hatchKills/3)icon.classList.add('shaking');const image=document.createElement('img');image.src=species[item.speciesId].presentation.eggAssetPath;image.alt='';icon.append(image);}else icon.textContent=petIcon(item);face.append(icon);
    for(const [className,text] of [['pet-face-name',petName(item)],['pet-face-grade',item.kind==='egg'?tr("runtime.phrase.16",{v0:item.hatchProgress,v1:petConfig.eggs.hatchKills}):petConfig.grades[item.grade].name]]){const line=document.createElement('span');line.className=className;line.textContent=text;face.append(line);}
    if(item.kind==='egg'){const progress=document.createElement('span'),fill=document.createElement('span');progress.className='pet-face-progress';fill.style.width=100*item.hatchProgress/petConfig.eggs.hatchKills+'%';progress.append(fill);face.append(progress);}
    if(count){const amount=document.createElement('span');amount.className='pet-face-count';amount.textContent=tr("runtime.phrase.15",{v0:count});face.append(amount);}return face;
  }
  function equipFirstEmpty(id){if(companions.slots.includes(id))return false;const slot=companions.slots.indexOf(null);
    if(slot<0){setPetResult(message("runtime.181"));return false;}
    if(companions.equip(id,slot)){setPetResult(message("runtime.phrase.14",{v0:slot+1}));return true;}return false;
  }
  function updatePetUi(){
    $('petHatchMode').checked=companions.automation.hatch;$('petAutoFusion').checked=companions.automation.fusion;
    const preference=$('petHatchSpecies');preference.replaceChildren();
    for(const id of [null,...companions.discovered]){const option=document.createElement('option');option.value=id??'';option.textContent=id?species[id].name:tr('automation.oldest');preference.append(option);}preference.value=companions.automation.preferredSpecies??'';
    const hatching=companions.companions().filter(item=>item?.kind==='egg').length,stock=companions.inventory.filter(item=>item.kind==='egg').length;
    $('petHatchStatus').textContent=tr(!companions.automation.hatch?'automation.hatchOff':hatching?'automation.hatching':'automation.waiting',{count:hatching,stock});
    $('petFusionStatus').textContent=tr(companions.automation.fusion?'automation.fusionOn':'automation.fusionOff');
    $('petSlots').replaceChildren();for(let i=0;i<companionCapacity(petConfig,petConfig.slots.maxLevel);i++){const item=companions.byId.get(companions.slots[i]),locked=i>=companions.slots.length,button=document.createElement('button');
      button.type='button';button.className='pet-slot';button.dataset.slotIndex=i;button.dataset.state=locked?'locked':item?'occupied':'empty';button.disabled=locked;
      const label=document.createElement('span');label.className='pet-slot-index';label.textContent=tr("runtime.phrase.13",{v0:i+1});button.append(label);
      if(item){button.style.setProperty('--grade',item.kind==='egg'?species[item.speciesId].presentation.color:petConfig.grades[item.grade].color);button.append(petCardFace(item));}
      else{const icon=document.createElement('span');icon.className='pet-face-icon';icon.textContent=locked?'🔒':'+';button.append(icon);}
      const action=document.createElement('span');action.className='pet-slot-action';action.textContent=locked?tr("runtime.184"):item?tr("runtime.185"):tr("runtime.186");button.append(action);
      button.setAttribute('aria-label',tr("runtime.phrase.12",{v0:i+1,v1:locked?tr("runtime.188"):item?tr("runtime.phrase.11",{v0:petName(item)}):tr("runtime.190")}));
      button.onclick=()=>{if(item){companions.unequip(i);setPetResult(message("runtime.phrase.10",{v0:i+1}));}else setPetResult(message("runtime.192"));};$('petSlots').append(button);
    }
    const speciesSelect=$('petFusionSpecies'),gradeSelect=$('petFusionGrade'),oldSpecies=speciesSelect.value,oldGrade=gradeSelect.value,owned=companions.inventory.filter(item=>item.kind==='pet');
    speciesSelect.replaceChildren();for(const id of new Set(owned.map(item=>item.speciesId))){const option=document.createElement('option');option.value=id;option.textContent=petConfig.species[id].name;speciesSelect.append(option);}if([...speciesSelect.options].some(o=>o.value===oldSpecies))speciesSelect.value=oldSpecies;
    if(!owned.length){const option=document.createElement('option');option.value='';option.textContent=tr("runtime.193");speciesSelect.append(option);}speciesSelect.disabled=!owned.length;
    const selectedSpecies=speciesSelect.value;gradeSelect.replaceChildren();for(const grade of [...new Set(owned.filter(item=>item.speciesId===selectedSpecies).map(item=>item.grade))].sort((a,b)=>a-b)){const option=document.createElement('option');option.value=grade;option.textContent=petConfig.grades[grade].name;gradeSelect.append(option);}if([...gradeSelect.options].some(o=>o.value===oldGrade))gradeSelect.value=oldGrade;gradeSelect.disabled=!owned.length;
    const duplicateKey=item=>[item.speciesId,item.kind,item.grade].join('/'),counts=new Map();for(const item of companions.inventory){const key=duplicateKey(item);counts.set(key,(counts.get(key)||0)+1);}
    $('petInventory').replaceChildren();for(const item of companions.inventory){const grade=petConfig.grades[item.grade],slot=companions.slots.indexOf(item.id),card=document.createElement('div');card.className='pet-item';card.dataset.petId=item.id;card.dataset.equipped=String(slot>=0);card.style.setProperty('--grade',item.kind==='egg'?species[item.speciesId].presentation.color:grade.color);
      const tap=document.createElement('button');tap.type='button';tap.className='pet-card-tap';tap.dataset.action='equip';tap.disabled=slot>=0;tap.append(petCardFace(item,counts.get(duplicateKey(item))));
      const action=document.createElement('span');action.className='pet-card-action';action.textContent=slot>=0?tr("runtime.phrase.9",{v0:slot+1}):tr("runtime.195");tap.append(action);tap.setAttribute('aria-label',petName(item)+' · '+(slot>=0?tr("runtime.phrase.8",{v0:slot+1}):tr("runtime.197")));tap.onclick=()=>equipFirstEmpty(item.id);card.append(tap);
      if(item.kind==='pet'){const lock=document.createElement('button');lock.type='button';lock.className='pet-lock';lock.dataset.action='lock';lock.textContent=item.locked?tr("runtime.198"):tr("runtime.199");lock.onclick=()=>companions.setLocked(item.id,!item.locked);card.append(lock);}$('petInventory').append(card);
    }
    if(!companions.inventory.length){const empty=document.createElement('div');empty.className='pet-inventory-empty';empty.textContent=tr("runtime.200");$('petInventory').append(empty);}
    const grade=Number(gradeSelect.value),count=companions.eligible(selectedSpecies,grade).length,odds=petConfig.fusion.odds[grade];$('petFusionOdds').textContent=!owned.length?tr("runtime.201"):odds===undefined?tr("runtime.202"):tr("runtime.phrase.7",{v0:Math.round(odds*100),v1:count,v2:petConfig.fusion.required});$('petFuse').disabled=$('petFuseAll').disabled=!owned.length||odds===undefined||count<petConfig.fusion.required;
  }
  function renderThemeStart(){
    const list=$('themeStartList');list.replaceChildren();
    for(const definition of themeProgress.definitions){
      const id=definition.id,known=themeProgress.themes[id].visited||themeProgress.unlocked(id),button=document.createElement('button'),title=document.createElement('strong'),range=document.createElement('span'),detail=document.createElement('small');
      button.type='button';button.dataset.startTheme=id;button.dataset.selected=String(id===themeProgress.selected);button.disabled=!themeProgress.unlocked(id);
      button.setAttribute('aria-pressed',String(id===themeProgress.selected));title.textContent=known?definition.name:tr('themeStart.unknown');
      range.textContent=known?tr('themeStart.firstStage',{count:definition.unlockStage}):tr('themeStart.explore');
      const previous=themeProgress.predecessor(id);
      detail.textContent=button.disabled?tr('themeStart.locked',{theme:previous?.name,count:themeProgress.count(previous?.id),required:themeProgress.required(id)}):tr(id===themeProgress.selected?'themeStart.selected':'themeStart.ready');
      button.append(title,range,detail);button.onclick=()=>{themeProgress.select(id);persistTech();startRun();};list.append(button);
    }
  }
  function openThemeStart(open){if(menuRouter&&!menuRouter.applying)return routeMenu('start',open);if(open&&phase!=='LOBBY')return;
    $('themeStartPanel').classList.toggle('open',open);$('themeStartPanel').setAttribute('aria-hidden',String(!open));
    if(open){renderThemeStart();const selected=$('themeStartList').querySelector('[data-selected=true]');if(selected)$('themeStartList').scrollTop=selected.offsetTop-$('themeStartList').offsetTop;$('themeStartClose').focus({preventScroll:true});}
  }
  $('themeStartClose').onclick=()=>openThemeStart(false);$('themeStartPanel').onclick=e=>{if(e.target===$('themeStartPanel'))openThemeStart(false);};
  $('petHatchMode').onchange=e=>companions.setAutomation('hatch',e.target.checked);$('petAutoFusion').onchange=e=>companions.setAutomation('fusion',e.target.checked);
  $('petHatchSpecies').onchange=e=>companions.setAutomation('preferredSpecies',e.target.value||null);
  function openPets(open){if(menuRouter&&!menuRouter.applying)return routeMenu("pets",open);if(open&&phase!=='LOBBY')return;$('petPanel').classList.toggle('open',open);$('petPanel').setAttribute('aria-hidden',String(!open));if(open){updatePetUi();$('petClose').focus();}}
  $('petOpen').onclick=()=>openPets(true);$('petClose').onclick=()=>openPets(false);$('petPanel').onclick=e=>{if(e.target===$('petPanel'))openPets(false);};$('petFusionSpecies').onchange=$('petFusionGrade').onchange=updatePetUi;
  for(const [id,all] of [['petFuse',false],['petFuseAll',true]])$(id).onclick=()=>{const result=companions.fuse($('petFusionSpecies').value,Number($('petFusionGrade').value),all);setPetResult(result.ok?message('ui.fusion',{count:result.attempts,success:result.successes,failure:result.failures,consumed:result.consumed.length,produced:result.produced.length}):message("runtime.212"));updatePetUi();};
  const statElements=new Map();
  for(const [key,name,amount] of STAT_UPGRADES){const b=document.createElement('button');b.type='button';b.className='tech-node';b.id='statBuy_'+key;
    b.innerHTML='<div class="node-head"><span class="node-icon">+</span><b></b></div><span class="node-desc"></span><span class="node-price"></span>';b.querySelector('b').textContent=name;b.querySelector('.node-desc').textContent=tr('ui.statGain',{amount});
    b.addEventListener('click',()=>learnStat(key));$('techCards').append(b);statElements.set(key,b);}
  for(const [key,name]of STAT_UPGRADES){const b=statElements.get(key),action=document.createElement('span');action.className='tech-mobile-stat-action';b.append(action);}
  techView=createTechView({root:$('techMobile'),groupName:techBranchName,isOpen:()=>$('techPanel').classList.contains('open'),getPoints:availableTech,onSelect:selectTech,records:[
    ...TECH_NODES.map(node=>({id:node.id,group:node.branch,symbol:node.symbol,card:techElements.get(node.id).card,label:()=>techElements.get(node.id).name.textContent,parents:node.requires.map(id=>({id,ready:()=>hasTech(id)}))})),
    ...STAT_UPGRADES.map(([key])=>({id:'stat-'+key,group:'stats',symbol:'+',card:statElements.get(key),label:()=>statElements.get(key).querySelector('b').textContent,
      parents:Object.entries(STAT_REQUIREMENTS[key]??{}).map(([parent,level])=>({id:'stat-'+parent,level,ready:()=>tech.statLevels[parent]>=level}))}))
  ]});

  function updateTechUi(){const points=availableTech();$('techPoints').textContent=String(points);
    let purchasable=false;
    for(const node of TECH_NODES){const learned=hasTech(node.id),conditions=requirementState(node),pathReady=conditions.ready,affordable=points>=node.cost,elem=techElements.get(node.id);elem.name.textContent=node.name;elem.desc.textContent=node.desc;if(elem.preview)elem.preview.textContent=tr("preview.open");
      const state=learned?'unlocked':pathReady&&affordable?'available':'locked';elem.card.dataset.state=state;elem.card.dataset.ready=String(pathReady);elem.buy.disabled=learned||!pathReady||!affordable;elem.buy.textContent=learned?tr('runtime.214'):tr('tech.buy',{cost:node.cost});
      elem.progress.textContent=conditions.total?tr('tech.conditions',{completed:conditions.completed,total:conditions.total}):tr('tech.noConditions');elem.select.setAttribute('aria-label',node.name+' \u00b7 '+node.desc+' \u00b7 '+elem.progress.textContent);elem.buy.setAttribute('aria-label',tr('tech.buyNamed',{name:node.name,cost:node.cost}));
      elem.price.textContent=learned?tr('runtime.214'):!pathReady?tr('tech.missing'):affordable?tr('tech.ready'):tr('runtime.217',{v0:node.cost,v1:node.cost-points});
      for(const {chip,icon,label,id}of elem.chips){const ready=hasTech(id),parent=techNodeById.get(id);chip.dataset.ready=String(ready);icon.textContent=(ready?'✓ ':'')+parent.symbol;label.textContent=parent.name;chip.setAttribute('aria-label',tr('tech.inspectCondition',{name:parent.name,state:tr(ready?'tech.met':'tech.notMet')}));}
      if(state==='available')purchasable=true;
    }
    for(const [key,name,amount,,,maxLevel=Infinity] of STAT_UPGRADES){const b=statElements.get(key);if(!b)continue;b.querySelector('b').textContent=name;b.querySelector('.node-desc').textContent=tr('ui.statGain',{amount});const pathReady=statPathReady(key,tech.statLevels);
      const capped=tech.statLevels[key]>=maxLevel;b.disabled=points<1||!pathReady||capped;b.dataset.state=capped?'unlocked':points>0&&pathReady?'available':'locked';
      b.querySelector('.tech-mobile-stat-action').textContent=capped?tr('runtime.214'):tr('tech.buy',{cost:1});
      b.querySelector('.node-price').textContent=capped?(key==='petSlots'?tr("runtime.phrase.5",{v0:C.stats[key]}):tr("runtime.phrase.4",{v0:Math.round(C.stats[key]*100)})):!pathReady?tr("runtime.221"):tr("runtime.222",{v0:tech.statLevels[key]});
      if(key==='petSlots')b.querySelector('.node-desc').textContent=tr("runtime.phrase.3",{v0:C.stats.petSlots,v1:companionCapacity(petConfig,petConfig.slots.maxLevel)});
      if(key==='magnetRange')b.querySelector('.node-desc').textContent=tr("runtime.226",{v0:number(C.stats.magnetRange,{maximumFractionDigits:2}),v1:Math.round(magnetRadius())});
      if(key==='criticalDamage')b.querySelector('.node-desc').textContent=tr("runtime.227",{v0:Math.round(C.stats.criticalDamage*100),v1:amount});
    }
    updateTechSelection();
    $('techOpen').classList.toggle('can-buy',purchasable||points>0);$('lobbyBalance').textContent=tr("runtime.228",{v0:progressionLevel(tech.kills),v1:points});$('lobbyGrowth').textContent=tr("runtime.229",{v0:tech.defeats,v1:tech.kills,v2:progressionLevel(tech.kills)**2+2*progressionLevel(tech.kills)});
    for(const [id] of augmentButtons){$('augment_'+id).dataset.enabled=String(hasTech(id));$('augment_'+id).hidden=!hasTech(id);}
  }
  function openTech(open){if(menuRouter&&!menuRouter.applying)return routeMenu("tech",open);if(open&&phase!=='LOBBY')return;$('techPanel').classList.toggle('open',open);$('techBackdrop').classList.toggle('open',open);
    $('techPanel').setAttribute('aria-hidden',String(!open));if(open){updateTechUi();$('techClose').focus();}
    loop?.resetTiming?.();}
  $('techOpen').addEventListener('click',()=>openTech(true));$('techClose').addEventListener('click',()=>openTech(false));
  $('techBackdrop').addEventListener('click',()=>openTech(false));$('techRefund').addEventListener('click',()=>refundTech());
  $('showDebug').addEventListener('change',e=>C.debug.show=e.target.checked);$('showCompression').addEventListener('change',e=>C.fx.targetCompression=e.target.checked);$('showLinkPulse').addEventListener('change',e=>C.fx.linkPulse=e.target.checked);
  function toggleSettings(open){if(menuRouter&&!menuRouter.applying)return routeMenu("settings",open);$('settings').classList.toggle('open',open);$('settings').setAttribute('aria-hidden',String(!open));if(open)input.releaseAll('settings');loop.resetTiming?.();}
  $('tune').addEventListener('click',()=>toggleSettings(!$('settings').classList.contains('open')));
  $('closeSettings').addEventListener('click',()=>toggleSettings(false));
  function enterLobby(){
    menuRouter?.go({screen:'main'});
    ultimateRunner.cancel('lobby');openUltimates(false);
    openPets(false);openGuide(false);openWiki(false);
    // Keep earned progress, but never run combat in the lobby or while choosing a node.
    if(mode==='ALIGN'){setReadyState();endChain();}
    frostFields=[];acidPools=acidPools.filter(pool=>!pool.skillId);cameraShake=null;cameraView.setShake(0,0);phase='LOBBY';pending.length=0;input.releaseAll();actions.consume();bufferedIntent=null;bufferedUntilMs=0;
    $('gameover').classList.remove('show');toggleSettings(false);
    $('lobbyLastRun').textContent=tick>0?tr("runtime.230",{v0:kills,v1:hits,v2:tech.defeats}): tr("runtime.231");
    $('lobby').classList.remove('hidden');document.body.classList.add('lobby-active');updateTechUi();loop.resetTiming?.();
  }
  function startRun(){
    menuRouter?.go({screen:'main'},{replace:true});
    openUltimates(false);openPets(false);openGuide(false);openWiki(false);openTech(false);toggleSettings(false);reset(isolatedScene?1:themeProgress.startStage);input.releaseAll();actions.consume();phase='PLAYING';
    if(!isolatedScene){themeProgress.enter(stage.themeId);persistTech();beginPlayCoach();}
    sfx.play('themeStart');$('lobby').classList.add('hidden');document.body.classList.remove('lobby-active');
    pending.length=0;loop.resetTiming?.();if(!isolatedScene)canvas.focus({preventScroll:true});
  }
  $('startRun').addEventListener('click',()=>openThemeStart(true));
  $('restart').addEventListener('click',enterLobby);
  $('revive').addEventListener('click',reviveWithAd);
  $('retry').addEventListener('click',async()=>{
    if(adsBm){$('retry').disabled=true;await adsBm.showInterstitial('lobby');$('retry').disabled=false;}
    enterLobby();
  });

  // The help/wiki render actual authored rules and snapshot the same initial
  // authoritative config; neither overlay is permitted to mutate gameplay.
  const wikiSections=Array.from(document.querySelectorAll('#wikiPanel .wiki-section'));
  const wikiNav=$('wikiNav'),wikiTocItems=$('wikiTocItems');

  const wikiName=(id)=>TECH_NODES.find(n=>n.id===id)?.name||id;
  function makeWikiCell(textContent,tag='td'){
    const cell=document.createElement(tag);cell.textContent=String(textContent);return cell;
  }
  function makeWikiTable(containerId,heads,rows){
    const table=document.createElement('table'),thead=document.createElement('thead'),tr=document.createElement('tr');
    for(const head of heads)tr.append(makeWikiCell(head,'th'));
    thead.append(tr);table.append(thead);
    const tbody=document.createElement('tbody');
    for(const row of rows){const line=document.createElement('tr');for(const value of row)line.append(makeWikiCell(value));tbody.append(line);}
    table.append(tbody);$(containerId).replaceChildren(table);
  }
  function flattenConfig(value,path='',out=[]){
    for(const [key,sub] of Object.entries(value)){
      const full=path?path+'.'+key:key;
      if(sub!==null&&typeof sub==='object'&&!Array.isArray(sub))flattenConfig(sub,full,out);
      else out.push([full,typeof sub==='number'?number(sub):JSON.stringify(full==='pets.grades'?petConfig.grades:sub)]);
    }
    return out;
  }
  function refreshWikiSkills(){const root=$('wikiSkills');root.replaceChildren();for(const [id,skill]of Object.entries(C.ultimates.skills)){const row=document.createElement('p'),name=document.createElement('b'),effect=document.createElement('span');name.textContent=skill.symbol+' '+tr('ultimate.'+id+'.name')+' · ';effect.textContent=ultimateDescription(id);row.append(name,effect,document.createTextNode(' '),makePreviewButton(id));root.append(row);}}
  function refreshWikiTables(){refreshWikiSkills();makeWikiTable('wikiConfigTable',localizedList([()=>tr("runtime.240"),()=>tr("runtime.241")]),flattenConfig(wikiDefaultConfig).filter(([path])=>!path.startsWith('pets.species.')&&!path.startsWith('pets.eggs.candidates')));
  makeWikiTable('wikiTechTable',localizedList([()=>tr("runtime.242"),()=>tr("runtime.243"),()=>tr("runtime.244"),()=>tr("runtime.245"),()=>tr("runtime.246")]),
    TECH_NODES.map(node=>[techBranchName(node.branch),node.name,node.requires.length?node.requires.map(wikiName).join(' + '):tr("runtime.247"),tr("runtime.phrase.2",{v0:node.cost}),node.desc]));
  makeWikiTable('wikiStatTable',localizedList([()=>tr("runtime.249"),()=>tr("runtime.250"),()=>tr("runtime.251"),()=>tr("runtime.252")]),
    STAT_UPGRADES.map(([key,name,amount])=>[name+' / '+key,key==='criticalDamage'?'200%':wikiDefaultConfig.stats[key],amount,
      key==='criticalDamage'?`${(C.stats.criticalDamage*100).toFixed(0)}% (200% + ${tech.statLevels[key]} × 6%p)`:C.stats[key]]));

   makeWikiTable('wikiThemesTable',localizedList([()=>tr("runtime.253"),()=>tr("runtime.254"),()=>tr("runtime.255"),()=>tr("runtime.256")]),
     Object.values(THEME_POOL).map(t=>[tr("runtime.257",{v0:t.name,v1:t.id,v2:t.unlockStage}),t.decoration,
       t.layouts.map(l=>l.name+': '+l.ops.map(o=>o[0]).join(' + ')).join(' / '),t.bosses.map(id=>BOSS_POOL[id].name).join(' / ')]));
   makeWikiTable('wikiBossesTable',localizedList([()=>tr("runtime.258"),()=>tr("runtime.259"),()=>tr("runtime.260"),()=>tr("runtime.261")]),
     Object.values(BOSS_POOL).map(b=>[`${b.name} (${b.id})`,b.summon?tr("runtime.262",{v0:b.summonType,v1:b.summon.count,v2:C.boss.summonPeriodMs}):species[b.id].description,
       b.fan?tr("runtime.263",{v0:b.fan.count,v1:b.radial.count}):species[b.id].gradeNotes[5],b.variants.map(v=>v.name).join(' / ')]));
   makeWikiTable('wikiMapOpsTable',localizedList([()=>tr("runtime.264"),()=>tr("runtime.265")]),
     [localizedList(['scatter',()=>tr("runtime.266")]),localizedList(['clusters',()=>tr("runtime.267")]),
      localizedList(['ring',()=>tr("runtime.268")]),localizedList(['rooms',()=>tr("runtime.269")]),
      localizedList(['ridges',()=>tr("runtime.270")])]);
  }
  refreshWikiTables();
  $('wikiMeta').textContent=tr("runtime.phrase.1",{v0:VERSION,v1:BUILD_ID});
  for(const section of wikiSections){
    const name=section.dataset.wikiTitle;
    const btn=document.createElement('button');btn.type='button';btn.className='wiki-nav-btn';btn.textContent=name;
    btn.addEventListener('click',()=>{
      if(menuRouter&&!menuRouter.applying)return menuRouter.go({screen:'wiki',item:section.id.slice(5)},{force:true});
      const scroller=$('wikiScroll');
      // offsetTop may be relative to a different offsetParent (e.g. the
      // absolutely positioned modal), so convert both DOMRects to the same
      // scroll-container coordinate system instead.
      const top=section.getBoundingClientRect().top-scroller.getBoundingClientRect().top+scroller.scrollTop-12;
      scroller.scrollTo({top,behavior:'instant'});
      $('wikiSidebar').classList.remove('mobile-open');
      for(const el of wikiNav.children)el.classList.toggle('active',el===btn);
    });
    wikiNav.append(btn);
    const a=document.createElement('a');a.href='#/wiki/'+section.id.slice(5);a.textContent=name;
    a.addEventListener('click',event=>{event.preventDefault();btn.click();});wikiTocItems.append(a);
  }
  function wikiSearch(text){
    const terms=text.trim().toLocaleLowerCase(language()).split(/\s+/).filter(Boolean);
    let count=0;
    for(const section of wikiSections){const haystack=section.textContent.toLocaleLowerCase(language());const visible=terms.every(t=>haystack.includes(t));
      section.classList.toggle('filtered',!visible);if(visible)count++;
    }
    $('wikiToc').style.display=terms.length?'none':'';
    $('wikiEmpty').classList.toggle('show',count===0);
    $('wikiResultCount').textContent=terms.length?tr("runtime.phrase.0",{v0:count,v1:wikiSections.length}):'';
    for(let i=0;i<wikiSections.length;i++)wikiNav.children[i].style.display=wikiSections[i].classList.contains('filtered')?'none':'';
  }
  $('wikiSearch').addEventListener('input',event=>wikiSearch(event.target.value));
  $('wikiMenu').addEventListener('click',()=>$('wikiSidebar').classList.toggle('mobile-open'));
  const COACH_KEY='bounko-controls-seen';
  let coachEnabled=false,coachBaseline={launch:0,hits:0,evade:0},coachText='';
  function beginPlayCoach(force=false){
    if(isolatedScene)return;
    let seen=false;try{seen=localStorage.getItem(COACH_KEY)==='1';}catch{}
    coachEnabled=force||!seen;coachBaseline={launch:launchCount,hits,evade:evadeActions};coachText='';
  }
  function dismissPlayCoach(){coachEnabled=false;$('playCoach').hidden=true;try{localStorage.setItem(COACH_KEY,'1');}catch{}canvas.focus({preventScroll:true});}
  function updatePlayCoach(){
    const shown=coachEnabled&&!isolatedScene&&phase==='PLAYING'&&!gameplayInputBlocked();$('playCoach').hidden=!shown;if(!shown)return;
    const touch=matchMedia('(pointer:coarse)').matches;
    const stage=hits>coachBaseline.hits?(evadeActions>coachBaseline.evade?'done':'move'):shadow?'dash':mode==='DASH'||mode==='RECOVER'?'hit':launchCount>coachBaseline.launch?'retry':'fire';
    const key=stage+'.'+language()+'.'+touch;if(key===coachText)return;coachText=key;
    $('playCoachTitle').textContent=tr('learn.coach.'+stage);
    $('playCoachCopy').textContent=tr('learn.coach.'+stage+'Copy'+(['fire','move'].includes(stage)?touch?'Touch':'Keys':''));
  }
  $('playCoachClose').onclick=dismissPlayCoach;
  $('coachReplay').onclick=()=>{toggleSettings(false);beginPlayCoach(true);canvas.focus({preventScroll:true});};
  $('guideCoachReplay').onclick=()=>{try{localStorage.removeItem(COACH_KEY);}catch{}openGuide(false);if(phase==='PLAYING')beginPlayCoach(true);else openThemeStart(true);};
  let guideIndex=0;
  const guideSlides=[...document.querySelectorAll('.guide-slide')];
  function showGuideSlide(next){if(menuRouter&&!menuRouter.applying&&menuRouter.current.screen==="help")return menuRouter.go({screen:"help",item:String(clamp(next+1,1,guideSlides.length))},{force:true});
    guideIndex=Math.max(0,Math.min(guideSlides.length-1,next));
    guideSlides.forEach((node,index)=>node.classList.toggle('active',index===guideIndex));
    document.querySelectorAll('.guide-dot').forEach((node,index)=>node.classList.toggle('active',index===guideIndex));
    $('guidePrev').disabled=guideIndex===0;
    $('guideNext').textContent=guideIndex===guideSlides.length-1?tr("runtime.274"):tr("runtime.275");
    $('guideStage').scrollTop=0;
    if($('guidePanel').classList.contains('open'))guideDemo?.open(['controls','movement','growth'][guideIndex]);else guideDemo?.close();
  }
  function openGuide(open){if(menuRouter&&!menuRouter.applying)return routeMenu("help",open);
    if(open&&phase!=='LOBBY')return;
    if(open)openWiki(false);
    $('guidePanel').classList.toggle('open',open);$('guidePanel').setAttribute('aria-hidden',String(!open));
    if(open){showGuideSlide(0);$('guideClose').focus();}else guideDemo?.close();
  }
  function openWiki(open){if(menuRouter&&!menuRouter.applying)return routeMenu("wiki",open);if(open){refreshWikiTables();updateDiscoveredSpeciesWiki();if($('themeStartPanel').classList.contains('open'))renderThemeStart();}
    if(open&&phase!=='LOBBY')return;
    if(open)openGuide(false);
    $('wikiPanel').classList.toggle('open',open);$('wikiPanel').setAttribute('aria-hidden',String(!open));
    if(open){$('wikiSearch').value='';wikiSearch('');$('wikiScroll').scrollTop=0;$('wikiSidebar').classList.remove('mobile-open');$('wikiClose').focus();}

  }
  $('guideOpen').addEventListener('click',()=>openGuide(true));
  $('guideClose').addEventListener('click',()=>openGuide(false));
  $('guidePrev').addEventListener('click',()=>showGuideSlide(guideIndex-1));
  $('guideNext').addEventListener('click',()=>guideIndex===guideSlides.length-1?openGuide(false):showGuideSlide(guideIndex+1));
  document.querySelectorAll('.guide-dot').forEach(dot=>dot.addEventListener('click',()=>showGuideSlide(Number(dot.dataset.guide))));
  $('wikiOpen').addEventListener('click',()=>openWiki(true));
  $('wikiClose').addEventListener('click',()=>openWiki(false));
  $('guidePanel').addEventListener('click',ev=>{if(ev.target===$('guidePanel'))openGuide(false);});
  let swipeStart=null;
  $('guideStage').addEventListener('pointerdown',e=>{swipeStart={x:e.clientX,y:e.clientY};});
  $('guideStage').addEventListener('pointerup',e=>{if(!swipeStart)return;const dx=e.clientX-swipeStart.x,dy=e.clientY-swipeStart.y;swipeStart=null;
    if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.4)showGuideSlide(guideIndex+(dx<0?1:-1));});
  document.addEventListener('keydown',event=>{
    if(!$('fatalError').hidden)return;
    if($('ultimatePanel').classList.contains('open')){if(event.key==='Escape')openUltimates(false);return;}
    if($('petPanel').classList.contains('open')){if(event.key==='Escape')openPets(false);return;}
    if($('guidePanel').classList.contains('open')){
      if(event.key==='Escape')openGuide(false);
      if(event.key==='ArrowRight')showGuideSlide(guideIndex+1);
      if(event.key==='ArrowLeft')showGuideSlide(guideIndex-1);
    }else if($('wikiPanel').classList.contains('open')){
      if(event.key==='Escape')openWiki(false);
    }
  });

  // Capture only; actual command processing happens in fixed simulation tick.
  $('auto').addEventListener('pointerdown',e=>{e.preventDefault();pending.push({kind:'auto'});});
  const presentation=createPresentationView({RenderObject,PresentationRuntime,stepMs:1000/C.sim.tps});
  let display=null;
  let running=true;
  reset();companions.resumeAutomation();resize();updateTechUi();document.body.classList.add('lobby-active');
  const localSession={inputSize:1,profile:{tickRate:C.sim.tps,maxCatchupSteps:5},pace:1,resimulating:false,
    get closed(){return !running;},poll(){},releaseInput(){input.releaseAll();pending.length=0;},advance(){if(gameplayInputBlocked())return{status:'held',tick};advanceGame();return{status:'advanced',tick};}};
  let lastFrame=performance.now();
  const loop=createLoop({session:localSession,canAdvance:()=>!gameplayInputBlocked(),render(){render(isolatedScene?tick*1000/C.sim.tps:performance.now());},onError:recordLoopRuntimeError});
  runtimeLoop=loop;
  function preparePreview(scene,seed){
    startRun();clearStageEnemies();for(const o of obstacles)World.remove(engine.world,o.body);obstacles=[];
    randomSeed=seed;stage.killTarget=1000;stage.noticeUntilMs=0;previewOrigin={...player.position};if(scene.theme)stage.themeId=scene.theme;
    if(scene.tutorial==='growth')stage.killTarget=1;
    for(const point of scene.targets){const unit=spawnEnemy(previewOrigin.x+point.x,previewOrigin.y+point.y,point.type||'thornfruit',{controller:previewOpponent()});unit.config.armor=point.armor||0;unit.config.hp=point.hp||1000;unit.hp=unit.config.hp;if(scene.tutorial)unit.maxHp=unit.hp;}
    combo=C.ultimates.skills[previewSkill]?ultimateLoadout.requirements(previewSkill).comboHits:0;lastFrame=0;previewHitCount=0;
  }

  // Intro commands stage a disposable game instance; collisions and damage remain authoritative.
  function stageIntro(chapter){
    presentation.reset();
    if(timeMs>0)introMetrics.push({chapter:introChapter,atMs:timeMs,hits,kills,combo,ultimate:introScenes[introChapter].ultimate??null,ultimateDamage:ultimateRunner.damage,pets:petRoster.snapshot()});
    introChapter=chapter;const scene=introScenes[chapter];randomSeed=scene.seed;
    ultimateRunner.cancel('introCut');ultimateRunner.effects.length=0;clearStageEnemies();petRoster.clear();lootDrops.clear();
    particles=[];fxRings=[];lightningArcs=[];fireEmbers=[];fireTransfers=[];for(const f of textFloats)f.el.remove();textFloats.length=0;
    for(const o of obstacles)World.remove(engine.world,o.body);obstacles=[];
    playerUnit.presentation=createPlayerPresentation();shadow=null;setReadyState();endChain();bufferedIntent=null;hitstopLeftMs=0;introDashPending=false;attackOrigin=null;evadeMotion=null;cameraShake=null;
    attackAmmo.reset();health=C.stats.maxHp;combo=scene.combo||0;
    Body.setPosition(player,{...previewOrigin});setSpeed(player,0,0);stage.killTarget=1000;stage.targetPopulation=0;stage.noticeUntilMs=0;
    ultimateLoadout.slots[0]=scene.ultimate||null;ultimateLoadout.reset();
    companions.slots=[null,null];
    if(scene.pets)companions.slots=[1,2];petRoster.reset();
    cameraView.setCamera({x:previewOrigin.x+scene.camera.x,y:previewOrigin.y+scene.camera.y});
    for(const point of scene.targets){const e=spawnEnemy(previewOrigin.x+point.x,previewOrigin.y+point.y,point.type||'thornfruit',{controller:previewOpponent()});e.config.armor=0;e.config.hp=point.hp||1000;e.hp=e.maxHp=e.config.hp;}
  }
  function advanceIntro(events){
    for(const event of events){
      if(event.chapter!==undefined)stageIntro(event.chapter);
      if(event.action==='attack'){aimPreview();introDashPending=launchAuto();}
      if(event.action==='ultimate'){attackAmmo.reset();ultimateLoadout.reset();combo=ultimateLoadout.requirements(ultimateLoadout.next()?.id).comboHits;ultimateRunner.tryStart(combo,attackAmmo.charges);}
    }
    if(introDashPending&&shadow&&(shadow.arrived||chargeOf()>=.9)){if(dash())introDashPending=false;}
  }
  function prepareIntro(){startRun();previewOrigin={...player.position};introMetrics=[];lastFrame=0;}

  function createMenuRouter(){
    const views={start:{panel:$('themeStartPanel'),open:openThemeStart,entry:$('startRun'),close:$('themeStartClose')},wiki:{panel:$('wikiPanel'),open:openWiki,entry:$('wikiOpen'),close:$('wikiClose')},help:{panel:$('guidePanel'),open:openGuide,entry:$('guideOpen'),close:$('guideClose')},tech:{panel:$('techPanel'),open:openTech,entry:$('techOpen'),close:$('techClose')},ultimates:{panel:$('ultimatePanel'),open:openUltimates,entry:$('ultimateOpen'),close:$('ultimateClose')},pets:{panel:$('petPanel'),open:openPets,entry:$('petOpen'),close:$('petClose')},settings:{panel:$('settings'),open:toggleSettings,entry:$('tune'),close:$('closeSettings')}};
    let current={screen:'main',query:new URLSearchParams()},applying=false,inert=[];
    function normalize(route){
      let screen=route.screen==='showcase'||Object.hasOwn(views,route.screen)?route.screen:'main';
      if(phase!=='LOBBY'&&!['main','settings'].includes(screen))screen='main';
      let item=route.item;
      if(screen==='wiki')item=wikiSections.some(section=>section.id==='wiki-'+item)?item:null;
      else if(screen==='help')item=String(clamp(Number.isInteger(Number(item))?Number(item):1,1,guideSlides.length));
      else if(screen==='tech')item=techNodeById.has(item)||item?.startsWith('stat-')&&statElements.has(item.slice(5))?item:null;
      else item=null;
      return {screen,item,query:new URLSearchParams(screen==='main'?'':route.query)};
    }
    function restoreInert(){for(const [element,value]of inert)element.inert=value;inert=[];}
    function apply(next,previous){
      if(previewHost?.active)previewHost.close();
      if(next.screen!==previous.screen){
        restoreInert();if(introHost?.active)introHost.close({notify:false});
        for(const view of Object.values(views))if(view.panel.classList.contains('open'))view.open(false);
        if(next.screen==='showcase'){introHost.open();return;}
        if(next.screen!=='main'){
          const view=views[next.screen];view.open(true);view.panel.setAttribute('aria-hidden','false');
          for(let active=view.panel;active&&active!==document.body;active=active.parentElement)for(const element of active.parentElement.children)if(element!==active&&element.tagName!=='SCRIPT'&&!element.classList.contains('language-control')&&!['previewPanel','introPanel'].includes(element.id)&&!(next.screen==='tech'&&element.id==='techBackdrop'))inert.push([element,element.inert]);
          for(const [element]of inert)element.inert=true;
          input.releaseAll('menu');sfx.stopAll();loop.stop();view.close.focus({preventScroll:true});
        }else{resumeMenuGame();(views[previous.screen]?.entry??$('introOpen')).focus({preventScroll:true});}
      }
      if(next.screen==='wiki'){if(next.item){$('wikiSearch').value='';wikiSearch('');wikiNav.children[wikiSections.findIndex(section=>section.id==='wiki-'+next.item)].click();}else{$('wikiScroll').scrollTop=0;for(const button of wikiNav.children)button.classList.remove('active');}}
      else if(next.screen==='help')showGuideSlide(Number(next.item)-1);
      else if(next.screen==='tech'){if(next.item)selectTech(next.item);else{updateTechSelection();}}
    }
    const navigation=createNavigation({normalize});
    const unsubscribe=navigation.subscribe(next=>{const previous=current;current=next;applying=true;try{apply(next,previous);}finally{applying=false;}});
    function go(route,{replace=false,force=false}={}){navigation[replace?'replace':'navigate'](route,{force});}
    function keyboard(event){if(!$('fatalError').hidden)return;const view=views[current.screen];if(!view||previewHost?.active||introHost?.active)return;
      if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();go({screen:'main'});}
      else if(event.key==='Tab'){const controls=[...view.panel.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href]')].filter(element=>element.getClientRects().length),first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
    }
    document.addEventListener('keydown',keyboard,true);
    return {go,get current(){return current;},get applying(){return applying;},init(){go(navigation.snapshot(),{replace:true,force:true});},dispose(){unsubscribe();navigation.dispose();document.removeEventListener('keydown',keyboard,true);restoreInert();}};
  }
  function routeMenu(screen,open){if(open)menuRouter.go({screen});else if(menuRouter.current.screen===screen)menuRouter.go({screen:'main'});}
  function resumeMenuGame(){if(menuRouter&&menuRouter.current.screen!=='main')return;loop.resetTiming();lastFrame=performance.now();loop.start();}
  // 광고는 Google 공개 샘플 태그(테스트 전용)라 주소에 ads=test가 있을 때만 켭니다. 소리·시뮬레이션 정지는 게임이 adstart/adend에서 합니다.
  if(new URLSearchParams(location.search+'&'+location.hash.slice(1)).get('ads')==='test'&&!isolatedScene){
    const [{createBm},{createImaAdapter,IMA_SAMPLE_TAGS}]=await Promise.all([import(BM_KIT+'bm.js'),import(BM_KIT+'bm-ima.js')]);
    adsBm=createBm({adapter:createImaAdapter({adTagUrl:IMA_SAMPLE_TAGS.linear})});
    adsBm.on('adstart',()=>{loop.stop();sfx.stopAll();input.releaseAll('ad');});
    adsBm.on('adend',resumeMenuGame);
    adsBm.preload('revive').then(ready=>{adsReady=ready;});
  }
  guideDemo=isolatedScene?null:createGuideDemo({translate:tr});
  previewHost=isolatedScene?null:createPreviewHost({translate:tr,pause(){loop.stop();sfx.stopAll();input.releaseAll('preview');},resume:resumeMenuGame});
  introHost=isolatedScene?null:createIntroHost({translate:tr,pause(){loop.stop();sfx.stopAll();input.releaseAll('intro');},resume:resumeMenuGame,play:startRun,help:()=>menuRouter?.go({screen:'help',item:'1'}),onClose:()=>menuRouter?.go({screen:"main"})});
  $('introOpen').onclick=()=>menuRouter?.go({screen:'showcase'});
  window.addEventListener('resize',resize);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){pending.length=0;bufferedIntent=null;bufferedUntilMs=0;}else{lastFrame=performance.now();}});

  function refreshLanguageUi(){
    guideDemo?.refresh();
    const focused=document.activeElement,ultimateId=focused?.dataset.ultimateId,ultimateSlot=focused?.dataset.ultimateSlot,ultimateOrder=focused?.classList.contains('ultimate-order')?{slot:focused.closest('[data-slot]').dataset.slot,child:[...focused.parentElement.children].indexOf(focused)}:null,petId=focused?.closest('[data-pet-id]')?.dataset.petId,action=focused?.dataset.action,slot=focused?.closest('[data-slot-index]')?.dataset.slotIndex;
    const scroll=[...document.querySelectorAll('#wikiScroll,#techMobileTree,.tech-mobile-detail-content,#guideStage,#petPanel .pet-scroll,#settings,.ultimate-dialog,#themeStartList')].map(el=>[el,el.scrollLeft,el.scrollTop]);
    translateDocument();document.title=tr('app.title');$('languageSelect').value=language();
    for(const [key,label]of settings){const input=$('config_'+key.replaceAll('.','_'));input.previousElementSibling.textContent=label;input.setAttribute('aria-label',label);}
    for(const [key,label]of coreboundStatSettings){const input=$('stat_'+key);input.previousElementSibling.textContent=label;}
    const mute=$('audioSettingsMute'),volume=$('audioSettingsVolume');mute.parentElement.lastChild.textContent=' '+tr('ui.mute');volume.parentElement.firstChild.textContent=tr('ui.sfx')+' ';volume.setAttribute('aria-label',tr('ui.sfxVolume'));
    for(const [category,name]of Object.entries(audioCategoryNames)){const input=$('audioCategory_'+category);input.parentElement.firstChild.textContent=name+' ';input.setAttribute('aria-label',tr('runtime.phrase.19',{v0:name}));}
    refreshAudioUi();updateTechUi();updatePetUi();updateUltimatePreparation();updateUltimateHud();refreshWikiTables();updateDiscoveredSpeciesWiki();if($('themeStartPanel').classList.contains('open'))renderThemeStart();
    wikiSections.forEach((section,i)=>{wikiNav.children[i].textContent=wikiTocItems.children[i].textContent=section.dataset.wikiTitle;});
    $('wikiMeta').textContent=tr('runtime.phrase.1',{v0:VERSION,v1:BUILD_ID});wikiSearch($('wikiSearch').value);
    $('guideNext').textContent=guideIndex===guideSlides.length-1?tr('runtime.274'):tr('runtime.275');
    $('lobbyLastRun').textContent=tick>0?tr('runtime.230',{v0:kills,v1:hits,v2:tech.defeats}):tr('runtime.231');
    $('petResult').textContent=messageText(petResultMessage);
    for(const el of $('petReveal').querySelectorAll('[data-reveal-species]')){const id=el.dataset.revealSpecies;el.textContent='✿ '+species[id].name;el.nextElementSibling.textContent=petAbility(id);}
    for(const [id]of augmentButtons){const button=$('augment_'+id);button.title=tr('runtime.phrase.18',{v0:techNodeById.get(id).name});button.setAttribute('aria-label',button.title);}
    $('stageBanner').textContent=messageText(stage.noticeMessage);for(const f of textFloats)f.el.textContent=messageText(f.text);
    for(const [el,x,y]of scroll){el.scrollLeft=x;el.scrollTop=y;}
    const next=focused?.isConnected?focused:ultimateId?document.querySelector('[data-ultimate-id="'+ultimateId+'"]'):ultimateSlot!==undefined?document.querySelector('[data-ultimate-slot="'+ultimateSlot+'"]'):ultimateOrder?document.querySelector('#ultimateEquipSlots [data-slot="'+ultimateOrder.slot+'"]')?.children[ultimateOrder.child]:petId?document.querySelector('[data-pet-id="'+petId+'"] [data-action="'+action+'"]'):slot!==undefined?document.querySelector('[data-slot-index="'+slot+'"]'):null;next?.focus({preventScroll:true});
  }
  $('languageSelect').addEventListener('change',event=>void setLanguage(event.target.value));
  onLanguageChanged(refreshLanguageUi);refreshLanguageUi();$('languageSelect').disabled=false;

  runtimePhase='gameplay';if(!isolatedScene&&!runtimeFatal)loop.start();$('load').classList.add('hidden');if(!isolatedScene&&!runtimeFatal)canvas.focus({preventScroll:true});
  window.__bloomImpulse={VERSION,BUILD_ID,config:C,intro:introScene?{snapshot:()=>({timeMs,tick,chapter:introChapter,ended:scenarioRunner.state==='ended',metrics:introMetrics,hits,kills,combo,ultimate:introScenes[introChapter].ultimate??null,ultimateDamage:ultimateRunner.damage,pets:petRoster.snapshot(),seed:introScenes[introChapter].seed}),async setSound(enabled){if(!running)return false;sfx.setMuted(!enabled);if(!enabled){sfx.stopAll();return true;}const unlocked=await sfx.unlock();if(!running)return false;if(!unlocked)sfx.setMuted(true);return unlocked;}}:null,preview:previewSkill?{snapshot:()=>({id:previewSkill,seed:previewScenario.seed,tick,paused:scenarioRunner.state==='paused',ended:scenarioRunner.state==='ended',hits:previewHitCount,damage:ultimateRunner.damage,lesson:{mode,hits,kills,shadow:!!shadow,stage:stage.index,evades:evadeActions}}),setPaused(value){if(value)scenarioRunner.pause();else{scenarioRunner.play();void sfx.unlock();}}}:null,getUltimates:()=>ultimateRunner.snapshot(),getAudio:()=>sfx.snapshot(),audioMeter:()=>sfx.meter(),getCompanions:()=>companions.snapshot(),getThemeProgress:()=>themeProgress.snapshot(),getState:()=>({presentation:presentation.snapshot(),drops:{...lootDrops.debug(),magnetRadius:magnetRadius()},unitStates:[...unitsById.values()].map(u=>({status:{...u.status},groundAttack:u.groundAttack?{phase:u.groundAttack.phase,casts:u.groundAttack.casts,pending:u.groundAttack.pending}:null,coneBreath:u.coneBreath?{phase:u.coneBreath.phase,casts:u.coneBreath.casts}:null,unitId:u.unitId,inventoryId:u.inventoryId,speciesId:u.speciesId,faction:u.faction,state:u.state,hp:u.hp,grade:u.grade,isSummon:!!u.isSummon,summonerId:u.summonerId,bossPatterns:u.bossPattern?.log,burrow:u.burrow?{phase:u.burrow.phase,dives:u.burrow.dives,emerges:u.burrow.emerges,aim:u.burrow.aim}:null,summon:u.summon?{deployed:u.summon.deployed,capacity:u.summon.slots.length,living:u.summon.slots.filter(child=>child?.alive).length}:null,returnFlight:u.returnFlight?{phase:u.returnFlight.phase,returns:u.returnFlight.returns,launches:u.returnFlight.launches,healed:u.returnFlight.healed}:null,hook:u.hook?{phase:u.hook.phase,casts:u.hook.casts,hits:u.hook.hits,returned:u.hook.returned,aim:u.hook.aim}:null,projectileFire:u.projectileFire?{phase:u.projectileFire.phase,shots:u.projectileFire.shots,volleys:u.projectileFire.volleys}:null,signature:u.config.signature,radius:u.config.radius,bodyRadius:u.body.circleRadius,height:u.spatial.height,scale:u.presentation.scale??1,outline:u.presentation.outline??null,attackCount:u.attackCount,melee:u.melee?{phase:u.melee.phase,swings:u.melee.swings,hits:u.melee.hits}:null,sunbeam:u.sunbeam?{phase:u.sunbeam.phase,focusMs:u.sunbeam.focusMs,stage:u.sunbeam.stage,pulses:u.sunbeam.pulses,targetId:u.sunbeam.target?.unitId}:null,heal:u.heal?{phase:u.heal.phase,casts:u.heal.casts,healed:u.heal.healed,cost:u.heal.cost,targetId:u.heal.target?.unitId}:null,regenerated:u.regeneration?.healed??0})),volumeEvents:[...volumeEvents],arcShots:projectiles.filter(s=>s.arc).map(s=>({x:s.body.position.x,y:s.body.position.y,z:s.body.plugin.volume.feetZ,aim:{...s.arc.aim},ageMs:s.arc.ageMs,height:s.arc.height,ownerId:s.ownerId,returning:s.returning,kind:s.payload.kind})),companions:petRoster.snapshot(),playerPresentation:structuredClone(playerUnit.presentation),playerStatus:{...playerUnit.status},phase,mode,health,maxHp:C.stats.maxHp,aimPreviewId:previewTargetId,augment:{spore:C.augment.spore.enabled,momentum:C.augment.momentum.enabled,relay:C.chain.followKill,chain:C.chain.enabled},tech:{points:availableTech(),level:progressionLevel(tech.kills),totalKills:tech.defeats,collectedGrowth:tech.kills,unlocked:[...tech.unlocked],statLevels:{...tech.statLevels}},autoChainReady,autoDashPlanned,chainActive,chainStarts,chainEnds,chainTriggerCharge:C.chain.minTriggerCharge,chainTargetId,autoChainWins,autoChainRolls,automaticDashes,manualPerfectHits,dashAutomatic,dashPerfect,launchCount,manualLaunchCount,echoLaunchCount,chainLaunchCount,attackAmmo:attackAmmo.snapshot(),missRecovery:{active:missRecoveryActive,events:missRecoveryEvents,firstHintShown:missHintShown},evade:{charges:evadeCharges,max:C.evade.maxCharges,refillAtMs:evadeRefillAtMs,progress:evadeRefillProgress(),rechargeMs:C.evade.rechargeMs,impulseSpeed:C.evade.impulseSpeed,durationMs:C.evade.durationMs,invulnerableMs:C.evade.invulnerableMs,projectileInvulnerable:timeMs-evadeStartedAtMs<C.evade.invulnerableMs,active:!!evadeMotion,startedAtMs:evadeStartedAtMs,count:evadeActions,hitRechargeEvents:evadeHitRechargeEvents,hitRechargeProgress:evadeHitRechargeProgress,lastHitRecharge:evadeLastHitRecharge?{...evadeLastHitRecharge}:null},stage:{index:stage.index,phase:stage.phase,waveKills:stage.waveKills,killTarget:stage.killTarget,bossHp:stage.boss?.hp??null,bossState:stage.boss?.state??null,bossPattern:stage.boss?.pattern??null,patternLog:[...stage.patternLog],obstacleCount:obstacles.length,broken:bossObstaclesBroken,arenaSides:arenaVertices.length,theme:stage.themeId,themeName:THEME_POOL[stage.themeId]?.name,layout:stage.layoutId,layoutName:THEME_POOL[stage.themeId].layouts.find(l=>l.id===stage.layoutId)?.name,radius:stage.radius,playableArea:Math.round(stage.playableArea),targetPopulation:stage.targetPopulation,mapTier:stage.mapTier,mapStart:stage.mapStart,mapSeed:stage.mapSeed,bossStage:isBossStage(stage.index),bossSpeciesId:stage.bossSpeciesId??null,referenceArea:stageBasePlayableArea,bossName:stage.boss?BOSS_POOL[stage.bossSpeciesId]?.name:null,bossVariant:stage.bossVariant||null,bossSummons:stage.boss?liveSummons(stage.boss.id).length:0,seed:stage.seed,generation:{...generationStats}},stageHistory:[...stageHistory],bossPool:Object.keys(BOSS_POOL),themePool:Object.keys(THEME_POOL),mapOperators:Object.keys(MAP_OPERATORS),dashMotion:dashMotion?{...dashMotion}:null,camera:{base:{...cameraView.camera},shake:cameraShake?{...cameraShake}:null,offset:cameraShakeOffset()},launchRecoil:launchRecoil?{...launchRecoil}:null,alignment:pendingLaunch?{...pendingLaunch,durationMs:C.shadow.orbit.alignMs}:null,orbit:ammoOrbitStates(player.position,timeMs),shadow:shadow?{source:shadow.source,slot:shadow.slot,dirX:shadow.dirX,dirY:shadow.dirY,x:shadow.x,y:shadow.y,startX:shadow.startX,startY:shadow.startY,visualRadius:shadowShardRadius(),launchedAtMs:shadow.launchedAtMs,progress:chargeOf(),charge:chargeOf(),dashReady:shadowDashAvailable(),separation:shadowSeparation(),remainingGap:remainingShadowGap(),initialGap:shadow.initialGap,travel:shadow.travel,limit:shadow.limit,targetId:shadow.targetId,arrived:shadow.arrived,speed:shadow.speed}:null,hitstopLeftMs,dashCharge,dashFlight:dashFlight?{...dashFlight,remainingMs:Math.round(dashFlight.untilMs-timeMs)}:null,rearmProgress:rearmProgress(),buffered:!!bufferedIntent,damageTaken,healingDone,position:{...player.position},speed:speedOf(player),hits,kills,combo,comboFxActive:comboFx.classList.contains('active'),enemyMasses:Object.fromEntries(Object.entries(C.enemy.types).map(([type,def])=>[type,def.mass])),tick,timeMs,attackDashSerial,enemies:enemies.filter(e=>e.alive).length,enemyShots,enemyAttacks,enemyPushes,projectiles:projectiles.length,evasion:{...evasionMetrics,units:[...unitsById.values()].filter(e=>e.evasion).map(e=>({id:e.unitId,speciesId:e.speciesId,isElite:e.isElite,cycle:e.evasion.cycle,phase:e.evasion.phase,blocked:e.evasion.blocked,offsetMs:e.evasion.offsetMs,usedCycle:e.evasion.usedCycle,presentation:{...e.evasion.presentation},stats:{...e.evasion.stats},motion:e.evasion.motion?{direction:e.evasion.motion.direction,untilMs:e.evasion.motion.untilMs,trail:e.evasion.motion.trail}:null}))},enemyStates:enemies.filter(e=>e.alive).map(e=>({id:e.id,bodyId:e.body.id,type:e.type,state:e.state,z:e.body.plugin.volume.feetZ,height:e.body.plugin.volume.height,ability:e.leap?{phase:e.leap.phase,count:e.leap.count,landings:e.leap.landings,aim:e.leap.aim}:e.selfDestruct?{phase:e.selfDestruct.phase,leftMs:e.selfDestruct.leftMs}:e.spike?{phase:e.spike.phase,pulses:e.spike.pulses,counters:e.spike.counters}:e.arcFire?{phase:e.arcFire.phase,volleys:e.arcFire.volleys,fired:e.arcFire.fired}:null,hp:e.hp,burning:!!e.burn,conducting:e.conductUntilMs>timeMs,radius:enemyDef(e).radius,x:e.body.position.x,y:e.body.position.y,preX:e.preX,preY:e.preY,shadowKnockbackLeftMs:Math.max(0,(e.shadowKnockbackUntilMs||0)-timeMs),attackCount:e.attackCount,playerGap:Math.hypot(e.body.position.x-player.position.x,e.body.position.y-player.position.y)})),rendererState:context.state,vectorRendererState:vectorActors.stats(),elemental:{frostFields:frostFields.map(field=>({x:field.x,y:field.y,radius:field.radius,leftMs:field.leftMs})),acidPools:acidPools.map(p=>({x:p.x,y:p.y,radius:p.radius,leftMs:p.leftMs,skillId:p.skillId,sourceUnitId:p.source.unitId,faction:p.source.faction})),...elementalEvents,fireEmbers:fireEmbers.length,fireTransfers:fireTransfers.length,activeBurning:enemies.filter(e=>e.alive&&e.burn).length,activeConducting:enemies.filter(e=>e.alive&&e.conductUntilMs>timeMs).length},stats:{...C.stats},criticalHits,lastHit:lastHit?{...lastHit,tags:[...lastHit.tags]}:null,fx:{stage:shadow?fxStage(chargeOf()):'none',target:shadow?(getTargetAnchor(fxAnchor)?{x:fxAnchor.x,y:fxAnchor.y,isEnemy:fxAnchor.isEnemy}:null):null,enabled:C.fx.targetCompression}}),auto:()=>{if(phase==='PLAYING')pending.push({kind:'auto'});},point:(x,y)=>{if(phase==='PLAYING')pending.push({kind:'point',x,y});},startRun,enterLobby,reset,dispose:()=>{if(!running)return;diagnosticCleanup();scenarioRunner?.dispose();previewHost?.dispose();guideDemo?.close();introHost?.dispose();menuRouter?.dispose();techView?.dispose();if(isolatedScene){ultimateRunner.cancel('dispose');petRoster.clear();clearStageEnemies();World.clear(engine.world,false);}releaseVolumeFilter?.();sfx.dispose();running=false;loop.stop();input.dispose();document.removeEventListener('focusin',onGameplayFocus);vectorActors.dispose();context.dispose();vectorDevice.dispose();window.removeEventListener('resize',resize);}};
  if(!isolatedScene){menuRouter=createMenuRouter();menuRouter.init();}
  if(isolatedScene){
    scenarioRunner=createScenario({definition:scenarioDefinition(previewSkill,C.sim.tps),createRun({seed,scene}){
      if(introScene)prepareIntro();else preparePreview(scene,seed);
      return {initialize({events}){if(introScene)advanceIntro(events);presentation.reset();capturePresentation();},step({events}){
        if(previewSkill)for(const event of events)if(event.action==='skill')ultimateRunner.tryStart(combo,attackAmmo.charges);
        advanceGame(events);
      },render(){render(tick*1000/C.sim.tps);},pause(){sfx.stopAll();},dispose(){sfx.stopAll();input.releaseAll();}};
    },onEnd(){if(introScene){introMetrics.push({chapter:introChapter,atMs:timeMs,hits,kills,combo,ultimate:introScenes[introChapter].ultimate??null,ultimateDamage:ultimateRunner.damage,pets:petRoster.snapshot()});}ultimateRunner.cancel(introScene?'introEnd':'previewEnd');sfx.stopAll();}});
    if(previewScenario?.tutorial)sfx.setMuted(true);scenarioRunner.play();if(previewSkill&&!previewScenario.tutorial)void sfx.unlock();
  }
  window.addEventListener('pagehide',()=>window.__bloomImpulse.dispose(),{once:true});
} catch(e) { if(diagnostics){try{diagnostics.report(e,{kind:'startup-exception',visibility:'fatal',origin:runtimePhase,cause:diagnosticContext()});}catch{}haltForRuntimeError();}else ERROR(e); }

