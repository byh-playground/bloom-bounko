export {AudioPlayer,audioSettings} from 'https://cdn.jsdelivr.net/gh/byh-playground/bloom-gamekit@1a3ef3877dea431268c712cbe7b13b2600826119/audio.js';
export const audioSdk={commit:'1a3ef3877dea431268c712cbe7b13b2600826119',sha256:'baf50e63457ccc7e66859ee9018049b0f53ef49e5b7c90b1395d2995bdcf6df1'};
// BOUNKO owns sound definitions. The immutable GameKit module owns audio resources.
const tone=(hz,end,ms,gain=.18,type='sine',delay=0)=>({kind:'tone',hz,end,ms,gain,type,delay});
const noise=(ms,gain=.14,hz=1600,delay=0)=>({kind:'noise',ms,gain,hz,delay});
export const audioConfig={
  volume:.7,headroom:.24,maxVoices:12,rampMs:8,
  compressor:{threshold:-18,knee:12,ratio:6,attackMs:3,releaseMs:120},
  categories:{enemy:{volume:.65,max:2,gapMs:80,priority:1},impact:{volume:1,max:4,gapMs:35,priority:2},motion:{volume:.8,max:3,gapMs:45,priority:2},
    danger:{volume:.9,max:3,gapMs:80,priority:4},reward:{volume:.85,max:3,gapMs:70,priority:5},
    magic:{volume:.55,max:2,gapMs:100,priority:1},ui:{volume:.5,max:2,gapMs:55,priority:0}},
  sounds:{
    impactLight:{category:'impact',layers:[tone(145,65,100,.19),noise(45,.12,1800)]},
    impactMedium:{category:'impact',layers:[tone(180,48,145,.25),noise(65,.17,2200)]},
    impactHeavy:{category:'impact',layers:[tone(135,32,210,.30),noise(90,.20,2900)]},
    petImpact:{category:'impact',layers:[tone(260,85,110,.16),noise(40,.10,2400)]},
    launch:{category:'motion',layers:[tone(280,760,110,.13,'triangle'),noise(70,.06,3200)]},
    dash:{category:'motion',layers:[tone(190,60,150,.20),noise(100,.13,1500)]},
    evade:{category:'motion',layers:[tone(440,950,90,.09,'sine'),noise(100,.10,3400)]},
    hurt:{category:'danger',layers:[tone(155,70,170,.19,'triangle'),noise(65,.12,1300)]},
    kill:{category:'reward',layers:[tone(440,220,140,.17,'triangle'),tone(660,330,140,.11,'sine',35)]},
    death:{category:'danger',priority:10,gapMs:0,layers:[tone(220,42,580,.22,'triangle'),noise(240,.12,650)]},
    bossNotice:{category:'danger',layers:[tone(110,90,520,.22,'triangle'),tone(165,120,460,.15,'sine',80)]},
    bossFan:{category:'danger',layers:[tone(440,210,160,.14,'triangle'),noise(110,.11,3000)]},
    bossRadial:{category:'danger',layers:[tone(280,560,260,.18,'triangle'),noise(150,.10,3800)]},
    bossCharge:{category:'danger',layers:[tone(120,38,330,.24),noise(160,.13,1200)]},
    bossSummon:{category:'danger',layers:[tone(230,350,350,.15,'triangle'),tone(345,520,300,.10,'sine',60)]},
    petRevive:{category:'reward',layers:[tone(330,440,180,.13),tone(660,880,220,.11,'sine',90)]},
    pickup:{category:'reward',gapMs:90,layers:[tone(660,880,80,.07),tone(990,1100,90,.04,'sine',30)]},
    egg:{category:'reward',layers:[tone(520,650,170,.14),tone(780,910,150,.10,'sine',65)]},
    hatchFirst:{category:'reward',priority:7,gapMs:0,layers:[tone(440,440,180,.16,'triangle'),tone(660,660,240,.15,'sine',100),tone(880,1100,360,.13,'sine',200)]},
    hatchRepeat:{category:'reward',layers:[tone(660,880,160,.13),tone(990,990,200,.10,'sine',80)]},
    fusionSuccess:{category:'reward',layers:[tone(330,440,190,.14,'triangle'),tone(660,880,300,.13,'sine',90)]},
    fusionFail:{category:'reward',layers:[tone(300,190,190,.13,'triangle'),tone(180,110,180,.10,'sine',70)]},
    upgrade:{category:'reward',layers:[tone(660,990,180,.12),tone(990,1320,240,.11,'sine',95)]},
    ui:{category:'ui',layers:[tone(520,650,55,.10,'triangle')]},
    fire:{category:'magic',layers:[noise(140,.12,800),tone(95,45,120,.08)]},
    lightning:{category:'magic',layers:[noise(75,.15,5000),tone(900,180,90,.07,'sawtooth')]},
    spore:{category:'magic',layers:[noise(150,.10,2000),tone(390,230,120,.08)]},
    heal:{category:'magic',layers:[tone(520,680,140,.07),tone(780,910,150,.05,'sine',35)]},
    perfect:{category:'reward',layers:[tone(880,1100,110,.09),tone(1320,1500,130,.07,'sine',50)]}
  }
};
Object.assign(audioConfig.sounds,{
 echo:{category:'motion',layers:[tone(360,840,85,.09,'triangle')]},
 autoDash:{category:'motion',layers:[tone(230,65,140,.18),noise(80,.10,2100)]},
 ricochet:{category:'motion',layers:[tone(620,930,70,.10,'triangle'),tone(220,55,130,.15,'sine',25)]},
 chargeReady:{category:'motion',layers:[tone(880,1150,80,.10),tone(1320,1320,100,.08,'sine',35)]},
 chargeHalf:{category:'motion',layers:[tone(560,660,55,.06)]},
 bossWindup:{category:'danger',layers:[tone(90,125,220,.11,'triangle')]},
 enemyNotice:{category:'enemy',layers:[tone(220,320,80,.07,'triangle')]},
 enemyLunge:{category:'enemy',layers:[noise(70,.08,1200),tone(120,60,85,.08)]},
 enemyShot:{category:'enemy',layers:[tone(450,270,95,.09,'triangle')]},
 stageStart:{category:'reward',layers:[tone(220,330,160,.10),tone(440,550,220,.10,'sine',80)]},
 stageClear:{category:'reward',priority:6,gapMs:0,layers:[tone(440,550,160,.12),tone(660,880,260,.12,'sine',95)]},
 level:{category:'reward',priority:6,layers:[tone(550,660,140,.10),tone(880,1100,200,.09,'sine',80)]},
 chainStart:{category:'motion',layers:[tone(330,660,130,.09,'triangle')]},
 ultimateMove:{category:'motion',priority:4,gapMs:70,layers:[noise(100,.13,2700),tone(260,1050,130,.12,'triangle')]},
 ultimateCharge:{category:'magic',priority:5,gapMs:0,layers:[tone(180,1120,300,.13,'triangle'),tone(360,1800,300,.07,'sine',40)]},
 laserCharge:{category:'magic',priority:7,gapMs:0,layers:[tone(120,780,600,.16,'triangle'),tone(280,1350,320,.11,'sine',260),noise(550,.035,1700)]},
 laserSustain:{category:'magic',priority:8,gapMs:0,layers:[noise(790,.14,4800),tone(1150,980,300,.16,'sawtooth'),tone(1120,970,310,.16,'sawtooth',230),tone(1080,930,340,.16,'sawtooth',450),tone(175,110,800,.13,'triangle')]},
 laserFade:{category:'magic',priority:8,gapMs:0,layers:[tone(970,180,120,.095,'sawtooth'),noise(110,.075,2200)]},
 ultimateSpore:{category:'magic',priority:6,gapMs:0,layers:[noise(860,.11,2100),tone(620,360,320,.11,'triangle'),tone(740,420,320,.11,'triangle',280),tone(660,280,300,.1,'triangle',570)]},
 ultimateStrike:{category:'impact',priority:7,gapMs:0,layers:[tone(190,40,160,.22),noise(90,.15,2600)]},
 ultimateWave:{category:'impact',priority:7,gapMs:0,layers:[tone(180,28,480,.29),noise(280,.2,1400),tone(95,40,360,.12,'triangle',110)]},
 ultimateReturn:{category:'motion',priority:4,layers:[tone(840,260,150,.09),noise(70,.07,2600)]}
});
audioConfig.sounds.fusionMixed={category:'reward',layers:[...audioConfig.sounds.fusionSuccess.layers,...audioConfig.sounds.fusionFail.layers.map(layer=>({...layer,delay:(layer.delay||0)+330}))]};

Object.assign(audioConfig.sounds,{
 frostCharge:{category:'magic',priority:6,gapMs:0,layers:[tone(390,1320,300,.12,'sine'),noise(260,.035,5000)]},
 frostRelease:{category:'impact',priority:7,gapMs:0,layers:[noise(130,.15,6200),tone(1250,260,200,.12,'triangle')]},
 chainCharge:{category:'magic',priority:6,gapMs:0,layers:[tone(220,1450,220,.11,'triangle'),noise(200,.04,4200)]},
 chainPulse:{category:'magic',priority:7,gapMs:0,layers:[noise(65,.14,5800),tone(1200,260,75,.08,'sawtooth')]},
 seedCharge:{category:'magic',priority:6,gapMs:0,layers:[tone(120,470,300,.12,'triangle'),noise(280,.055,800)]},
 seedLaunch:{category:'motion',priority:6,gapMs:0,layers:[noise(180,.14,2200),tone(450,190,170,.10,'triangle')]},
 seedImpact:{category:'impact',priority:7,gapMs:0,layers:[tone(160,38,220,.22),noise(170,.18,1500)]},
 acidCharge:{category:'magic',priority:6,gapMs:0,layers:[tone(180,420,280,.10,'sine'),noise(260,.07,600)]},
 acidRelease:{category:'magic',priority:7,gapMs:0,layers:[noise(220,.15,1100),tone(330,100,220,.09,'triangle')]}
});

audioConfig.sounds.eliteEvade={category:'motion',priority:3,gapMs:80,layers:[noise(95,.075,2800),tone(650,310,90,.055,'triangle')]};
