import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

/* THE LAST FREQUENCY — 20-minute procedural 3D cinematic */
const $ = id => document.getElementById(id);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x03060b);
scene.fog = new THREE.FogExp2(0x0a1119, 0.027);
const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.1, 260);
const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0x8aa4c0, 0x08090d, 1.0));
const moon = new THREE.DirectionalLight(0x9bb9d6, 2.0);
moon.position.set(-14, 24, 8); moon.castShadow = true; scene.add(moon);
const ambient = new THREE.AmbientLight(0x293746, .45); scene.add(ambient);
const moonDisc = new THREE.Mesh(new THREE.SphereGeometry(2.2,24,24), new THREE.MeshBasicMaterial({color:0xc8d8e6}));
moonDisc.position.set(-25,24,-72); scene.add(moonDisc);

const mat = (color, roughness=.85, metalness=0, extra={}) => new THREE.MeshStandardMaterial({color,roughness,metalness,...extra});
const mats = {
 ground:mat(0x11171b), asphalt:mat(0x080b0e), concrete:mat(0x252a2d), metal:mat(0x3a454b,.45,.65),
 wood:mat(0x332b25), black:mat(0x07090b), glass:mat(0x9c6237,.25,.2,{emissive:0x6a2c0b,emissiveIntensity:1.3}),
 coat:mat(0x111923), skin:mat(0x9b735b), glow:mat(0xffbd70,.3,0,{emissive:0xff8b37,emissiveIntensity:2.2}),
 red:mat(0x7e1717,.4,0,{emissive:0x6b0808,emissiveIntensity:1.6})
};
const box=(parent,w,h,d,material,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o};
const cylinder=(parent,r1,r2,h,material,x,y,z,segments=12)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),material);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o};
const sphere=(parent,r,material,x,y,z)=>{const o=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),material);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o};

const world = new THREE.Group(); scene.add(world);
const ground= new THREE.Mesh(new THREE.PlaneGeometry(220,220),mats.ground);
ground.rotation.x=-Math.PI/2;ground.position.y=-.08;ground.receiveShadow=true;world.add(ground);
const road= new THREE.Mesh(new THREE.PlaneGeometry(5.5,110),mats.asphalt);
road.rotation.x=-Math.PI/2;road.position.set(0,-.035,-28);world.add(road);

// Exterior: abandoned radio station
const exterior=new THREE.Group();world.add(exterior);
box(exterior,12,6,7,mats.concrete,0,3,-35);
const roof= new THREE.Mesh(new THREE.ConeGeometry(9,3.8,4),mat(0x171c21));roof.position.set(0,7.7,-35);roof.rotation.y=Math.PI/4;exterior.add(roof);
box(exterior,1.6,3,.18,mats.black,0,1.5,-31.39);
for(const x of [-4,4])box(exterior,1.35,1.5,.16,mats.glass,x,3.7,-31.4);
const sign=box(exterior,5,.65,.18,mat(0x101820),0,5.5,-31.35);
for(let i=0;i<5;i++)box(exterior,.12,.12,.12,mats.red,-1+i*.5,5.52,-31.2);
cylinder(exterior,.09,.16,18,mats.metal,0,17,-35,8);
for(let y=10;y<20;y+=2)box(exterior,3,.055,.06,mats.metal,0,y,-35);

// Trees and roadside poles
const treeMat=mat(0x15191c);
function tree(x,z,h){const g=new THREE.Group();cylinder(g,.12,.3,h,treeMat,0,h/2,0,6);for(let i=0;i<4;i++){const b=cylinder(g,.035,.1,h*.36,treeMat,(i%2?1:-1)*.5,h*.48+i*.34,0,5);b.rotation.z=i%2?-.9:.9;}g.position.set(x,0,z);exterior.add(g);}
for(let i=0;i<25;i++){const z=-i*4-4;tree(-6-Math.random()*9,z,4+Math.random()*6);tree(6+Math.random()*9,z,4+Math.random()*6);}

// Interior set: control room, corridor, archive and transmitter chamber
function room(name,w,h,d,x,z){const g=new THREE.Group();g.name=name;world.add(g);box(g,w,.25,d,mats.concrete,x,0,z);box(g,w,.25,d,mats.concrete,x,h,z);box(g,.25,h,d,mats.concrete,x-w/2,h/2,z);box(g,.25,h,d,mats.concrete,x+w/2,h/2,z);box(g,w,h,.25,mats.concrete,x,h/2,z-d/2);return g;}
const control=room('control room',18,7,16,0,-62);
for(let i=0;i<4;i++){box(control,2.2,1.1,.8,mat(0x171d23),-5+i*3.3,1,-54);for(let j=0;j<3;j++)box(control,.13,.12,.08,j===1?mats.red:mats.glow,-5+i*3.3-.5+j*.45,1.35,-53.55);}
box(control,8,.18,1.2,mats.wood,0,2,-54);
for(let i=0;i<7;i++)cylinder(control,.025,.025,5,mats.metal,-7+i*2.3,4.5,-69,6);
const corridor=room('corridor',7,6,34,0,-91);
for(let z=-78;z>-108;z-=5){box(corridor,1.1,2.5,.15,mats.wood,-2.8,1.5,z);box(corridor,1.1,2.5,.15,mats.wood,2.8,1.5,z);const lamp=sphere(corridor,.12,mats.glow,0,5.4,z);lamp.scale.set(2,.3,1);}
const archive=room('archive',17,7,18,0,-125);
for(let x=-6;x<=6;x+=3)for(let z=-131;z<=-119;z+=5){box(archive,.35,5,1.3,mats.wood,x,2.5,z);for(let y=1;y<5;y+=.8)box(archive,1.7,.1,1.05,mat(0x66513b),x,y,z);}
const transmitter=room('transmitter chamber',20,10,20,0,-158);
cylinder(transmitter,1.2,1.7,7,mats.metal,0,3.7,-158,16);
for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(2+i*.7,.07,8,48),mats.glow);ring.position.set(0,4+i*1.1,-158);transmitter.add(ring);}

// Protagonist — a stylized, fully procedural 3D human figure
const hero=new THREE.Group();world.add(hero);
const torso=box(hero,.85,1.35,.45,mats.coat,0,1.75,0);
const head=sphere(hero,.34,mats.skin,0,2.72,0);
const hair=sphere(hero,.36,mat(0x171311),0,2.91,-.03);hair.scale.set(1,.45,1);
const armL=new THREE.Group(),armR=new THREE.Group();hero.add(armL,armR);
cylinder(armL,.13,.16,.85,mats.coat,0,-.38,0);armL.position.set(-.55,2.25,0);armL.rotation.z=-.12;
cylinder(armR,.13,.16,.85,mats.coat,0,-.38,0);armR.position.set(.55,2.25,0);armR.rotation.z=.12;
const legL=new THREE.Group(),legR=new THREE.Group();hero.add(legL,legR);
cylinder(legL,.16,.19,.9,mat(0x171b21),0,-.45,0);legL.position.set(-.23,1.05,0);
cylinder(legR,.16,.19,.9,mat(0x171b21),0,-.45,0);legR.position.set(.23,1.05,0);
box(hero,.28,.12,.55,mat(0x090b0e),-.23,.12,-.08);box(hero,.28,.12,.55,mat(0x090b0e),.23,.12,-.08);
const lantern=sphere(hero,.12,mats.glow,.58,1.85,-.1);const lanternLight=new THREE.PointLight(0xffa85a,2.4,9);lanternLight.position.set(.58,1.9,-.3);hero.add(lanternLight);
hero.position.set(0,0,-12);

// The signal's shadow form
const shadow=new THREE.Group();world.add(shadow);
const shadowMat=new THREE.MeshStandardMaterial({color:0x020306,roughness:1,transparent:true,opacity:.94});
sphere(shadow,.72,shadowMat,0,2.6,0).scale.set(.8,1.6,.5);
cylinder(shadow,.28,.42,2.1,shadowMat,0,1.05,0);
for(const x of [-.28,.28])cylinder(shadow,.11,.14,1.8,shadowMat,x,-.9,0);
for(const x of [-.22,.22])sphere(shadow,.055,mats.red,x,2.9,-.4);
shadow.position.set(0,0,-110);shadow.visible=false;

// Radio console and spectral signal rings
const signal=new THREE.Group();world.add(signal);
for(let i=0;i<6;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(1.2+i*.7,.035,8,64),new THREE.MeshBasicMaterial({color:i%2?0x78b6d2:0xd18a52,transparent:true,opacity:.45}));ring.rotation.x=Math.PI/2;ring.position.set(0,3,-158);signal.add(ring);}
const signalLight=new THREE.PointLight(0x76bce0,0,22);signalLight.position.set(0,4,-158);world.add(signalLight);

// Floating dust
const dustCount=650,dustPositions=new Float32Array(dustCount*3);
for(let i=0;i<dustCount;i++){dustPositions[i*3]=(Math.random()-.5)*42;dustPositions[i*3+1]=Math.random()*10;dustPositions[i*3+2]=-Math.random()*180;}
const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPositions,3));
const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0xaab9c6,size:.055,transparent:true,opacity:.35}));world.add(dust);

const chapters=[
 {start:0,end:120,title:'۱ · جاده خاموش',cam:[0,5,13],look:[0,3,-28],hero:[0,0,-12],text:'شهر سال‌هاست که صدای خودش را از دست داده است.'},
 {start:120,end:300,title:'۲ · ورود به ایستگاه',cam:[2,3,-37],look:[0,2,-62],hero:[0,0,-39],text:'درِ ایستگاه باز است؛ انگار کسی منتظر ورود او بوده.'},
 {start:300,end:480,title:'۳ · سیگنال',cam:[-3,3,-54],look:[0,2,-62],hero:[-2,0,-57],text:'رادیو روشن می‌شود. صدایی از میان خش‌خش نامی را زمزمه می‌کند.'},
 {start:480,end:660,title:'۴ · راهرو',cam:[0,3,-72],look:[0,2,-96],hero:[0,0,-78],text:'هر قدم، صدای قدم دیگری را در انتهای راهرو بیدار می‌کند.'},
 {start:660,end:840,title:'۵ · حقیقت',cam:[4,3,-117],look:[0,3,-128],hero:[-3,0,-119],text:'نوار ضبط‌شده تاریخ فردا را نشان می‌دهد؛ و صدای خودش را.'},
 {start:840,end:1020,title:'۶ · تعقیب',cam:[0,4,-134],look:[0,2,-158],hero:[0,0,-139],text:'سایه از دل موج رادیویی بیرون می‌آید. راه بازگشت ناپدید شده است.'},
 {start:1020,end:1200,title:'۷ · آخرین فرکانس',cam:[0,5,-148],look:[0,4,-158],hero:[0,0,-153],text:'برای خاموش کردن فرستنده، باید پیامی را بفرستد که هنوز نشنیده است.'}
];
const beats=[
[0,'آن شب، ساعت شهر روی ۰۳:۱۷ متوقف مانده بود.'],[28,'جاده به ایستگاه قدیمی ختم می‌شود؛ هیچ چراغی در شهر روشن نیست.'],[58,'از بلندگوهای خاموش، سه ضربه کوتاه شنیده می‌شود.'],[91,'چراغ بالای برج، برای نخستین بار پس از سال‌ها روشن می‌شود.'],
[120,'او از ماشین پیاده می‌شود. هوای سرد بوی باران و سیم سوخته می‌دهد.'],[153,'روی در نوشته شده: «اگر صدایت را شنیدی، پاسخ نده».'],[188,'قفل زنگ‌زده بدون لمس شدن باز می‌شود.'],[225,'داخل ایستگاه، همه ساعت‌ها روی ۰۳:۱۷ ایستاده‌اند.'],[267,'در پشت سرش بسته می‌شود.'], 
[300,'گیرنده رادیویی خودبه‌خود روشن می‌شود.'],[333,'فرکانس ۸۸٫۴؛ صدای خش‌خش، بعد سکوت.'],[365,'گوینده: «اگر این پیام را می‌شنوی، هنوز فرصت داری».'],[399,'صدای رادیو، نام او را می‌گوید؛ با صدای خودش.'],[438,'روی صفحه، تاریخ فردا ظاهر می‌شود.'],
[480,'راهروی تاریک به اتاق بایگانی می‌رسد.'],[514,'چراغ‌ها پشت سر او یکی‌یکی خاموش می‌شوند.'],[548,'در انتهای راهرو، سایه‌ای بی‌چهره ایستاده است.'],[582,'وقتی برمی‌گردد، سایه نزدیک‌تر شده.'],[621,'صدای قدم‌ها دیگر از پشت سر نمی‌آید؛ از داخل رادیو می‌آید.'],
[660,'در بایگانی، نوارهایی با نام آدم‌های ناپدیدشده چیده شده‌اند.'],[696,'آخرین نوار، با دست‌خط خودش برچسب خورده است.'],[732,'صدای ضبط‌شده می‌گوید: «من اینجا را ترک نکردم».'],[771,'او حقیقت را می‌فهمد: فرستنده، پیام‌ها را از آینده می‌گیرد.'],[810,'در هر چرخه، یک نفر باید پیام را به گذشته برساند.'],
[840,'آژیر برج روشن می‌شود. سایه دیگر پنهان نمی‌ماند.'],[875,'درها قفل می‌شوند و موج رادیویی اتاق را پر می‌کند.'],[911,'او به سمت اتاق فرستنده می‌دود.'],[948,'سایه در هر فلاش نور، نزدیک‌تر دیده می‌شود.'],[985,'تنها راه، فرستادن پیام پیش از رسیدن ساعت ۰۳:۱۸ است.'],
[1020,'اتاق فرستنده؛ قلب تپنده ایستگاه.'],[1055,'روی میکروفن، چراغ قرمز روشن می‌شود.'],[1090,'صدای خودش از رادیو می‌گوید: «این بار، فرستنده را خاموش نکن».'],[1125,'او پیام را ضبط می‌کند: «به ایستگاه نیا».'],[1160,'فرکانس قطع می‌شود. برای نخستین بار، سکوت واقعی.'],[1184,'اما در شهر، رادیوی دیگری روشن می‌شود...']
];
const captions=beats.map(([at,text])=>({at,text}));
let started=false,paused=false,muted=false,elapsed=0,last=0,audio=null,master=null;
function audioStart(){try{audio=new (window.AudioContext||window.webkitAudioContext)();master=audio.createGain();master.gain.value=.14;master.connect(audio.destination);const osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.value=48;gain.gain.value=.16;osc.connect(gain);gain.connect(master);osc.start();const noiseBuffer=audio.createBuffer(1,audio.sampleRate*2,audio.sampleRate),data=noiseBuffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.12;const noise=audio.createBufferSource(),ng=audio.createGain();noise.buffer=noiseBuffer;noise.loop=true;ng.gain.value=.045;noise.connect(ng);ng.connect(master);noise.start();}catch(e){console.warn('Audio unavailable',e);}}
function setMute(){muted=!muted;if(master)master.gain.setTargetAtTime(muted?0:.14,audio.currentTime,.08);$('mute').textContent=muted?'صدا: خاموش':'صدا: روشن';}
$('mute').addEventListener('click',setMute);
function start(){if(!started){started=true;audioStart();$('loading').style.opacity='0';setTimeout(()=>$('loading')?.remove(),900);$('hud').classList.remove('hidden');}paused=false;$('play').textContent='توقف فیلم';last=performance.now();requestAnimationFrame(loop);}
$('play').addEventListener('click',()=>{if(!started){start();return;}if(paused){start();}else{paused=true;$('play').textContent='ادامه فیلم';}});
function smooth(t){return t*t*(3-2*t);}
function lerp(a,b,t){return a+(b-a)*t;}
function vecLerp(a,b,t){return new THREE.Vector3(lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t));}
function loop(now){if(!started||paused)return;const dt=Math.min((now-last)/1000,.06);last=now;elapsed=Math.min(1200,elapsed+dt);
 let ci=chapters.findIndex(c=>elapsed>=c.start&&elapsed<c.end);if(ci<0)ci=6;const c=chapters[ci],next=chapters[Math.min(ci+1,6)];const local=(elapsed-c.start)/(c.end-c.start);const blend=smooth(Math.min(1,local*1.6));
 const camBase=vecLerp(c.cam,next.cam,blend),lookBase=vecLerp(c.look,next.look,blend),heroBase=vecLerp(c.hero,next.hero,blend);
 const drift=Math.sin(elapsed*.17)*.16;camera.position.set(camBase.x+drift,camBase.y+Math.sin(elapsed*.31)*.055,camBase.z);camera.lookAt(lookBase.x,lookBase.y,lookBase.z);
 hero.position.set(heroBase.x+Math.sin(elapsed*1.1)*.035,0,heroBase.z);const walking=(ci===0||ci===1||ci===3||ci===5)&&local>.12&&local<.9;const step=walking?Math.sin(elapsed*5.5)*.48:Math.sin(elapsed*.8)*.025;legL.rotation.x=step;legR.rotation.x=-step;armL.rotation.x=-step*.7;armR.rotation.x=step*.7;hero.rotation.y=ci===6?Math.sin(elapsed*.4)*.05:0;
 control.visible=ci===2;corridor.visible=ci===3;archive.visible=ci===4;transmitter.visible=ci===5||ci===6;
 const shadowActive=elapsed>540&&elapsed<1165;shadow.visible=shadowActive;shadow.position.set(Math.sin(elapsed*.35)*.8,0,lerp(-112,-146,Math.max(0,(elapsed-840)/330)));shadow.scale.setScalar(1+Math.sin(elapsed*2)*.035);
 const pulse=ci>=2?(.5+.5*Math.sin(elapsed*2.4)):0;signalLight.intensity=ci>=5?5+pulse*13:ci===2?pulse*4:0;signal.rotation.y=elapsed*.12;signal.visible=ci>=5;
 lanternLight.intensity=2+Math.sin(elapsed*3.1)*.35;
 dust.rotation.y=elapsed*.004;
 const current=[...captions].reverse().find(b=>elapsed>=b.at);$('subtitle').textContent=current?current.text:c.title;$('scene').textContent=c.title;
 const m=Math.floor(elapsed/60),s=Math.floor(elapsed%60);$('timecode').textContent='۰۳:۱۷  |  '+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')+' / ۲۰:۰۰';
 if(elapsed>=1200){$('subtitle').textContent='پایان فیلم  |  آخرین فرکانس';$('play').textContent='پخش دوباره';started=false;paused=true;elapsed=0;}
 renderer.render(scene,camera);if(started)requestAnimationFrame(loop);
}
function idle(){if(!started){renderer.render(scene,camera);requestAnimationFrame(idle);}}idle();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
