/*
 * Vendored study, ported verbatim from BeeConcept gpt6astra.html.
 * Interaction/visuals unchanged; header + default spec copy rebranded to Minerva,
 * plus a Minerva entry nav and an ENTER CONSOLE action in the control bar.
 * Stylistic lint intentionally disabled below to avoid behavior drift.
 */
/* eslint-disable */
// @ts-nocheck — untyped vendored Three.js study code.
"use client";

import { useEffect, useRef } from "react"; 

export function ApisMechanica() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current as HTMLElement | null;
    if (!root) return;
    let disposed = false;
    let raf = 0;
    let renderer: any = null;
    let controlsRef: any = null;
    let onResize: (() => void) | null = null;
    let onKey: ((e: KeyboardEvent) => void) | null = null;

    document.body.classList.add("apis-mechanica-body");

    (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import(
        "three/examples/jsm/controls/OrbitControls.js"
      );
      const { RoomEnvironment } = await import(
        "three/examples/jsm/environments/RoomEnvironment.js"
      );
      const { EffectComposer } = await import(
        "three/examples/jsm/postprocessing/EffectComposer.js"
      );
      const { RenderPass } = await import(
        "three/examples/jsm/postprocessing/RenderPass.js"
      );
      const { ShaderPass } = await import(
        "three/examples/jsm/postprocessing/ShaderPass.js"
      );
      const { FXAAShader } = await import(
        "three/examples/jsm/shaders/FXAAShader.js"
      );
      const { UnrealBloomPass } = await import(
        "three/examples/jsm/postprocessing/UnrealBloomPass.js"
      );
      const { OutputPass } = await import(
        "three/examples/jsm/postprocessing/OutputPass.js"
      );
      if (disposed || !root.isConnected) return;


const $ = (s) => root.querySelector(s);
const TAU = Math.PI * 2;
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const smooth = (a,b,x) => THREE.MathUtils.smoothstep(x,a,b);
const V = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
const damp = (a,b,k,dt) => lerp(a,b,1-Math.exp(-k*dt));

let seed=8128;
function rand() { seed=(1664525*seed+1013904223)>>>0; return seed/4294967296 }
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35,innerWidth/innerHeight,.05,180);
camera.position.set(10,7.5,12);
renderer = new THREE.WebGLRenderer({canvas:$('#scene'),antialias:false,alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.localClippingEnabled=true;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;

const pmrem=new THREE.PMREMGenerator(renderer);
const room=new RoomEnvironment();
scene.environment=pmrem.fromScene(room,.04).texture;
room.dispose(); pmrem.dispose();

const controls=new OrbitControls(camera,renderer.domElement);
controlsRef=controls;
controls.enableDamping=true; controls.dampingFactor=.055;
controls.minDistance=3; controls.maxDistance=27;
controls.maxPolarAngle=Math.PI*.49;
controls.target.set(0,1.3,0);
controls.autoRotateSpeed=.45;

const hemi=new THREE.HemisphereLight(0xffffff,0xa99b7f,2.2);
const key=new THREE.DirectionalLight(0xfff6df,3.8);
key.position.set(-4,9,5);
const rim=new THREE.DirectionalLight(0xd9e7ff,2.8);
rim.position.set(5,6,-7);
scene.add(hemi,key,rim);
const coreLight=new THREE.PointLight(0xffbc63,1.2,6,2);
scene.add(coreLight);

const themes=[
  {name:'DELFT',body:'#f1f2ec',metal:'#234d8d',glass:'#d6e4f2',
   eye:'#173b7a',core:'#d3b16f',paper:'#e5e9eb',ink:'#243954',line:'#a8b9c9',rough:.19,icon:'☀',mode:'light'},
  {name:'OBSIDIAN',body:'#161715',metal:'#1d3a5c',glass:'#8fa3b8',
   eye:'#080a09',core:'#2f6690',paper:'#181915',ink:'#d3c7b2',line:'#3a4c5e',rough:.2,icon:'☾',mode:'dark'},
];
let themeIndex=0, modeIndex=0, themeMix=1;
const colorKeys=['body','metal','glass','eye','core','paper','ink','line'];
let palette={}, fromPalette={}, toPalette={};
for(const k of colorKeys) palette[k]=new THREE.Color(themes[0][k]);
let roughness=.2, fromRough=.2;

function floralTexture(){
  const c=document.createElement('canvas'); c.width=1024;c.height=512;
  const x=c.getContext('2d');
  x.fillStyle='#f1f2ec'; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle='#234d8d';x.fillStyle='#234d8d';x.lineWidth=2.5;
  for(let i=0;i<16;i++){
    const cx=35+i*65,cy=255+Math.sin(i*1.8)*110;
    x.beginPath();x.moveTo(cx-35,cy+85);
    x.bezierCurveTo(cx+45,cy+30,cx-50,cy-20,cx,cy-80);x.stroke();
    for(let j=0;j<5;j++){
      const a=j*TAU/5;
      x.save();x.translate(cx,cy-65);x.rotate(a);
      x.beginPath();x.ellipse(0,-12,5,14,0,0,TAU);x.stroke();x.restore();
    }
    for(let j=0;j<4;j++){
      x.save();x.translate(cx+Math.sin(j)*12,cy+j*14);
      x.rotate(j%2?-.7:.7);x.beginPath();x.ellipse(10,0,13,4,0,0,TAU);x.stroke();x.restore();
    }
  }
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
  t.wrapS=t.wrapT=THREE.RepeatWrapping; return t;
}
const floral=floralTexture();
const clip=new THREE.Plane(V(1,0,0),20);
const materials=[];
function physical(kind,extras={}){
  const m=new THREE.MeshPhysicalMaterial({
    color:palette[kind]||palette.body,roughness:.24,metalness:0,
    clearcoat:1,clearcoatRoughness:.14,...extras
  });
  m.userData.kind=kind;m.clippingPlanes=[clip];materials.push(m);return m;
}
const bodyMat=physical('body');
const metalMat=physical('metal',{metalness:1,roughness:.25});
const darkMat=physical('eye',{roughness:.14,clearcoat:1});
const glassMat=physical('glass',{metalness:.05,roughness:.13,transmission:.55,
  thickness:.025,transparent:true,opacity:.5,side:THREE.DoubleSide,
  iridescence:1,iridescenceIOR:1.33,iridescenceThicknessRange:[120,410],depthWrite:false});
const jewelMat=physical('eye',{metalness:.2,roughness:.08,transmission:.28,thickness:.1});
const coreMat=physical('core',{emissive:palette.core,emissiveIntensity:1.4,roughness:.25});
const patternedMat=physical('body');
patternedMat.onBeforeCompile=shader=>{
  shader.uniforms.floralTex={value:floral};
  shader.uniforms.floralAmount={value:0};
  shader.vertexShader='varying vec2 floralUV;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>',
    '#include <uv_vertex>\n floralUV=uv;');
  shader.fragmentShader='uniform sampler2D floralTex; uniform float floralAmount; varying vec2 floralUV;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
    '#include <color_fragment>\n diffuseColor.rgb *= mix(vec3(1.), texture2D(floralTex, floralUV).rgb, floralAmount);');
  patternedMat.userData.shader=shader;
};
let delftAmount=0;
const sphere=new THREE.SphereGeometry(1,32,22);
const smallSphere=new THREE.SphereGeometry(1,12,8);
const cyl=new THREE.CylinderGeometry(1,1,1,12);
const boltGeo=new THREE.CylinderGeometry(1,1,1,6);
const dummy=new THREE.Object3D();
const parts=[], gears=[], antennas=[], legs=[], wingSets=[], springs=[], edgeLines=[];
const bee=new THREE.Group();scene.add(bee);bee.position.y=1.65;
const thorax=new THREE.Group();bee.add(thorax);
const head=new THREE.Group();head.position.set(0,.1,1.47);bee.add(head);
const abdomen=new THREE.Group();abdomen.position.set(0,-.03,-1.05);bee.add(abdomen);

function part(name,material,fn,fact,parent,pos,axis,level=0,caption=''){
  const g=new THREE.Group();parent.add(g);g.position.copy(pos);
  const p={name,material,fn,fact,g,seat:pos.clone(),axis:axis.clone(),
    level,caption:caption||material,meshes:[],id:parts.length+1};
  g.userData.part=p;
  const l=document.createElement('div');l.className='partlabel';l.style.opacity=0;
  const strong=document.createElement('strong');strong.textContent=name;
  const small=document.createElement('small');small.textContent=p.caption;
  l.append(strong,small);$('#labels').append(l);p.label=l;
  const geom=new THREE.BufferGeometry().setFromPoints([pos,pos.clone()]);
  p.guide=new THREE.Line(geom,new THREE.LineDashedMaterial({
    color:palette.line,dashSize:.055,gapSize:.045,transparent:true,opacity:0
  }));parent.add(p.guide);parts.push(p);return p;
}
function mesh(parent,geo,mat,pos=V(),scale=V(1,1,1),edges=false){
  const m=new THREE.Mesh(geo,mat);m.position.copy(pos);m.scale.copy(scale);parent.add(m);
  if(edges){
    const e=new THREE.LineSegments(new THREE.EdgesGeometry(geo,32),
      new THREE.LineBasicMaterial({color:palette.ink,transparent:true,opacity:0}));
    m.add(e);edgeLines.push(e);
  }
  return m;
}
function ell(parent,mat,pos,scale,edges=false){return mesh(parent,sphere,mat,pos,scale,edges)}
function rod(parent,a,b,r,mat=metalMat){
  const d=b.clone().sub(a),m=mesh(parent,cyl,mat,a.clone().add(b).multiplyScalar(.5),V(r,d.length(),r));
  m.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());return m;
}
function tube(parent,points,r=.012,mat=metalMat){
  const c=new THREE.CatmullRomCurve3(points.map(p=>Array.isArray(p)?V(...p):p));
  return mesh(parent,new THREE.TubeGeometry(c,Math.max(10,points.length*6),r,5,false),mat);
}
function ring(parent,r,pos,mat=metalMat,thickness=.025){
  const m=mesh(parent,new THREE.TorusGeometry(r,thickness,7,60),mat,pos);
  return m;
}
function instances(parent,geo,mat,transforms){
  const m=new THREE.InstancedMesh(geo,mat,transforms.length);
  transforms.forEach((t,i)=>{
    dummy.position.copy(t.p);dummy.scale.copy(t.s||V(1,1,1));
    dummy.quaternion.copy(t.q||new THREE.Quaternion());dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);
  });
  m.instanceMatrix.needsUpdate=true;parent.add(m);return m;
}
function bolts(parent,r,z,n=12){
  const a=[];for(let i=0;i<n;i++){
    const t=i*TAU/n;
    a.push({p:V(Math.cos(t)*r,Math.sin(t)*r,z),s:V(.035,.025,.035),
      q:new THREE.Quaternion().setFromAxisAngle(V(1,0,0),Math.PI/2)});
  }
  return instances(parent,boltGeo,metalMat,a);
}
const cranial=part('Cranial Housing','Glazed porcelain',
  'A rigid protective shell supports the sensory instruments.',
  'A bee has a compact brain that integrates vision, scent and flight control.',
  head,V(),V(0,.35,1.4),0,'Porcelain / sensory chassis');
ell(cranial.g,bodyMat,V(),V(.73,.65,.58),true);
ring(cranial.g,.53,V(0,0,.32)).scale.set(1,1.1,1);bolts(cranial.g,.51,.35);

for(const side of [-1,1]){
  const eye=part('Compound Eyes','Faceted smoked glass',
    'Hundreds of hexagonal lenses gather a wide-angle mosaic.',
    'Honeybee compound eyes are especially sensitive to motion.',
    head,V(side*.52,.14,.2),V(side*1.1,.25,.65),0,'Instanced ommatidia / optical array');
  ell(eye.g,darkMat,V(),V(.36,.49,.38),true);
  const transforms=[];
  for(let row=-10;row<=10;row++)for(let col=-9;col<=9;col++){
    const u=col*.105+(row%2)*.0525,v=row*.083;
    if(u*u+v*v>.84)continue;
    const n=V(u,v,Math.sqrt(1-u*u-v*v));
    const p=V(n.x*.365,n.y*.495,n.z*.385);
    transforms.push({p,s:V(.028,.019,.028),
      q:new THREE.Quaternion().setFromUnitVectors(V(0,1,0),n)});
  }
  const lenses=instances(eye.g,boltGeo,jewelMat,transforms);
  eye.g.rotation.y=side*.6;
  eye.facets=lenses;eye.facetMatrices=transforms;
}
const ocelli=part('Ocelli Triad','Crown jewels',
  'Three dorsal light sensors provide an artificial horizon.',
  'The three simple eyes help bees sense changes in light.',
  head,V(0,.52,.14),V(0,.9,.25),1,'3 lenses / horizon sensing');
for(const [x,z] of [[0,.15],[-.17,-.03],[.17,-.03]]){
  ell(ocelli.g,metalMat,V(x,0,z),V(.095,.06,.095));
  ell(ocelli.g,jewelMat,V(x,.045,z),V(.063,.04,.063));
}
for(const side of [-1,1]){
  const a=part('Antennae','Gold / enamel ball joints',
    'An elbowed scape and articulated flagellum sample the air.',
    'Worker honeybee antennae have ten flagellomeres.',
    head,V(side*.27,.26,.44),V(side*.35,.65,1),1,'Scape · pedicel · 10 flagellomeres');
  const pivot=new THREE.Group();a.g.add(pivot);
  ell(pivot,metalMat,V(),V(.085,.085,.085));
  const elbow=V(side*.17,.37,.38);
  rod(pivot,V(),elbow,.037);
  ell(pivot,metalMat,elbow,V(.062,.062,.062));
  let parent=new THREE.Group();parent.position.copy(elbow);pivot.add(parent);
  const segments=[];
  for(let i=0;i<10;i++){
    const joint=new THREE.Group();if(i)joint.position.z=.105;parent.add(joint);
    ell(joint,metalMat,V(),V(.039,.039,.039));
    rod(joint,V(),V(0,0,.1),.025,i%2?metalMat:bodyMat);
    segments.push(joint);parent=joint;
  }
  antennas.push({pivot,segments,side,x:0,v:0});
}
for(const side of [-1,1]){
  const p=part('Mandibles','Forged brass',
    'Opposed jaws grip and manipulate small objects.',
    'Bees use their mandibles to work wax and handle materials.',
    head,V(side*.23,-.35,.43),V(side*.55,-.15,.6),1,'Opposed grippers');
  tube(p.g,[[0,0,0],[side*.11,-.16,.19],[side*.02,-.23,.35],[-side*.12,-.2,.38]],.045);
}
const proboscis=part('Proboscis','Telescoping gold glossa',
  'A folded feeding instrument extends below the mouth.',
  'A honeybee uses its proboscis to collect liquid food.',
  head,V(0,-.44,.3),V(0,-.7,.9),1,'Retractable glossa');
const tongue=new THREE.Group();proboscis.g.add(tongue);
rod(tongue,V(),V(0,-.3,-.3),.04);
rod(tongue,V(0,-.3,-.3),V(0,-.33,-.75),.023);

const scutum=part('Scutum & Scutellum','Glazed dorsal plates',
  'A split dorsal shell transmits resonant deformation to the wing hinges.',
  'The thorax contains the muscles that power both wings and legs.',
  thorax,V(0,.24,0),V(0,1.65,0),0,'Dorsal shell / split housing');
ell(scutum.g,patternedMat,V(0,.12,.16),V(.85,.65,.92),true);
ell(scutum.g,bodyMat,V(0,.02,-.7),V(.62,.4,.4),true);
const ventral=part('Ventral Frame','Cast gold',
  'A lower chassis supports the motor and the six leg mounts.',
  'All six legs attach to the thorax.',
  thorax,V(0,-.35,0),V(0,-.8,0),1);
ell(ventral.g,metalMat,V(),V(.64,.32,.9),true);
const motor=part('Resonant Flight Motor','Brass / spring steel',
  'An eccentric crank compresses a leaf-spring box, driving indirect wing motion.',
  'Indirect flight muscles deform the thorax rather than pulling directly on each wing.',
  thorax,V(),V(0,.5,.15),0,'Resonant box / indirect actuation');

for(const x of [-.47,.47])for(const z of [-.48,.48]){
  rod(motor.g,V(x,-.33,z),V(x,.35,z),.035);
  ell(motor.g,metalMat,V(x,.35,z),V(.08,.08,.08));
}
for(const z of [-.4,0,.4]){
  const spring=tube(motor.g,[[-.5,.13,z],[-.25,.32,z],[0,.38,z],[.25,.32,z],[.5,.13,z]],.025);
  springs.push(spring);
}
function gear(parent,r,teeth,x,y,z,speed){
  const root=new THREE.Group();root.position.set(x,y,z);parent.add(root);
  const wheel=mesh(root,new THREE.CylinderGeometry(r-.055,r-.055,.07,48),metalMat);
  wheel.rotation.x=Math.PI/2;
  const ts=[];
  for(let i=0;i<teeth;i++){
    const a=i*TAU/teeth;
    ts.push({p:V(Math.cos(a)*r,Math.sin(a)*r,0),s:V(.09,.105,.085),
      q:new THREE.Quaternion().setFromAxisAngle(V(0,0,1),a-Math.PI/2)});
  }
  instances(root,new THREE.BoxGeometry(1,1,1),metalMat,ts);
  ell(root,darkMat,V(0,0,.055),V(.09,.09,.04));
  for(let i=0;i<5;i++){
    const a=i*TAU/5;
    rod(root,V(Math.cos(a)*.11,Math.sin(a)*.11,.055),
      V(Math.cos(a)*(r-.09),Math.sin(a)*(r-.09),.055),.018);
  }
  gears.push({root,speed});return root;
}
gear(motor.g,.3,20,-.24,0,.25,1);
const smallGear=gear(motor.g,.18,12,.24,0,.25,-20/12);
smallGear.rotation.z=Math.PI/12;
rod(motor.g,V(-.24,0,.1),V(-.24,0,-.45),.048);

const setae=part('Setae','Drawn gold filaments',
  'Fine flexible hairs form a light-catching sensory collar.',
  'Branched hairs help pollen adhere to a bee.',
  thorax,V(0,.06,.7),V(0,.8,.55),1,'420 filaments / sensory collar');
const hairs=[];
for(let i=0;i<420;i++){
  const a=rand()*TAU, b=rand()*.55;
  const n=V(Math.cos(a),Math.sin(a),.3+rand()*.4).normalize();
  hairs.push({p:V(Math.cos(a)*(.6+b*.3),Math.sin(a)*(.51+b*.2),b*.3),
    s:V(.005,.08+rand()*.13,.005),
    q:new THREE.Quaternion().setFromUnitVectors(V(0,1,0),n)});
}
instances(setae.g,cyl,metalMat,hairs);

const petiole=part('Petiole','Gold universal joint',
  'A narrow flexure couples the thorax to the abdominal assembly.',
  'The narrow connection permits the abdomen to move independently.',
  abdomen,V(0,0,.02),V(0,0,-.5),1);
ell(petiole.g,metalMat,V(),V(.35,.33,.4),true);
const core=part('Amber Core','Warm amber glass',
  'A honey-coloured power chamber sits within the telescoping armour.',
  'Bees carry nectar in a specialised crop before returning to the hive.',
  abdomen,V(0,-.02,-1.07),V(0,-.5,-.45),0,'Honey reactor / amber reservoir');
ell(core.g,coreMat,V(),V(.53,.47,1.17),true);
core.g.traverse(o=>{if(o.isMesh)o.layers.enable(1)});

// Shell patches leave actual openings between the hexagonal frames.
const tergites=[];
for(let i=0;i<6;i++){
  const z=-.28-i*.36,r=[.59,.72,.75,.68,.54,.34][i];
  const p=part('Tergite Ring '+(i+1),'Porcelain / gilt window rims',
    'Overlapping shell plates telescope around the amber chamber.',
    'Abdominal pumping helps move air through the bee’s respiratory system.',
    abdomen,V(0,0,z),V(0,.12,-.4-i*.27),i<2?0:1,'Plate '+(i+1)+' / telescoping armour');
  const shell=new THREE.CylinderGeometry(r*.89,r,.4,44,1,true,.38,TAU-.76);
  const m=mesh(p.g,shell,patternedMat);m.rotation.x=Math.PI/2;
  for(const dz of [-.18,.18]){
    const rr=ring(p.g,r,V(0,0,dz),metalMat,.018);rr.scale.y=.81;
  }
  m.scale.z=.81;
  // Open dorsal seam is spanned by hexagonal honeycomb window frames.
  for(const side of [-1,1]){
    const hex=new THREE.Shape();
    for(let j=0;j<6;j++){
      const a=j*TAU/6, x=Math.cos(a)*.135,y=Math.sin(a)*.135;
      j?hex.lineTo(x,y):hex.moveTo(x,y);
    }
    hex.closePath();const hole=new THREE.Path();
    for(let j=5;j>=0;j--){
      const a=j*TAU/6,x=Math.cos(a)*.103,y=Math.sin(a)*.103;
      j===5?hole.moveTo(x,y):hole.lineTo(x,y);
    }
    hole.closePath();hex.holes.push(hole);
    const frame=mesh(p.g,new THREE.ExtrudeGeometry(hex,{
      depth:.022,bevelEnabled:true,bevelSize:.009,bevelThickness:.008,bevelSegments:1
    }),metalMat,V(side*.13,r*.79,0));
    frame.rotation.x=-Math.PI/2;
  }
  tergites.push(p);
}
const sting=part('Sting Assembly','Hardened gold lancets',
  'Paired lancets retract into a tapered protective sheath.',
  'The worker honeybee sting has backward-facing barbs.',
  abdomen,V(0,-.04,-2.5),V(0,-.1,-1),1,'Sheath / paired lancets');
ell(sting.g,bodyMat,V(),V(.19,.16,.28));
for(const side of [-1,1]){
  rod(sting.g,V(side*.025,0,-.14),V(side*.01,0,-.65),.012);
  for(let j=0;j<4;j++)rod(sting.g,V(side*.02,0,-.32-j*.07),
    V(side*.055,0,-.28-j*.07),.008);
}

for(const side of [-1,1])for(let i=0;i<3;i++){
  const p=part(['Foreleg','Middle Leg','Hind Leg'][i],
    'Porcelain links / gold pin joints',
    'Coxa, trochanter, femur, tibia and segmented tarsus form a compliant landing linkage.',
    i===2?'Worker hind legs carry pollen in a basket called the corbicula.':
      'Honeybees use their legs for walking, grooming and handling pollen.',
    thorax,V(side*.53,-.35,.63-i*.64),V(side*(.65+i*.12),-.55,0),1,
    '6-link chain / pin-jointed suspension');
  const root=new THREE.Group();p.g.add(root);
  const a=V(side*.32,-.16,.1-i*.05);
  const b=V(side*.57,-.55,i===0?.32:-.1);
  rod(root,V(),a,.075);ell(root,metalMat,a,V(.095,.095,.095));
  const femur=new THREE.Group();femur.position.copy(a);root.add(femur);
  rod(femur,V(),b,.065,bodyMat);
  const knee=new THREE.Group();knee.position.copy(b);femur.add(knee);
  ell(knee,metalMat,V(),V(.085,.085,.085));
  const foot=V(-side*.13,-.5,i===0?.3:-.16);
  rod(knee,V(),foot,.045);
  const tarsus=new THREE.Group();tarsus.position.copy(foot);knee.add(tarsus);
  for(let j=0;j<5;j++){
    rod(tarsus,V(0,-j*.035,j*.065),V(0,-(j+1)*.035,(j+1)*.065),.028-j*.003);
    ell(tarsus,metalMat,V(0,-j*.035,j*.065),V(.035,.035,.035));
  }
  for(const s of [-1,1])tube(tarsus,[[0,-.17,.31],[s*.045,-.18,.39],[s*.065,-.14,.42]],.012);
  if(i===2){
    const basket=part('Corbicula','Concave enamel / gold filaments',
      'A shallow pollen basket forms the widened outer face of each hind tibia.',
      'A worker packs collected pollen into pellets on its hind legs.',
      knee,V(side*.035,-.2,-.05),V(side*.55,0,0),1,'Pollen basket / filament rim');
    ell(basket.g,bodyMat,V(),V(.15,.27,.065),true);
    ell(basket.g,darkMat,V(0,0,.045),V(.105,.21,.025));
    for(let j=0;j<14;j++){
      const t=j*TAU/14;
      const x=Math.cos(t)*.13,y=Math.sin(t)*.25;
      tube(basket.g,[[x,y,0],[x*1.2,y*1.12,.08],[x*.8,y*.9,.13]],.007);
    }
  }
  legs.push({root,femur,knee,tarsus,side,index:i,x:0,v:0,baseKnee:b.clone()});
}

function wingGeometry(hind=false){
  const points=hind?
    [[0,0],[.4,-.13],[1.2,-.18],[1.9,-.53],[1.58,-.88],[.72,-.69],[.13,-.27]]:
    [[0,0],[.6,.28],[1.65,.49],[2.8,.42],[3.75,.18],[3.97,-.15],
     [3.45,-.48],[2.42,-.69],[1.15,-.55],[.23,-.22]];
  const s=new THREE.Shape();s.moveTo(...points[0]);
  for(let i=1;i<points.length;i++)s.lineTo(...points[i]);s.closePath();
  const g=new THREE.ShapeGeometry(s,16);g.rotateX(Math.PI/2);return {g,points};
}
const foreShape=wingGeometry(),hindShape=wingGeometry(true);
function makeWing(parent,hind=false,detail=true,mat=glassMat){
  const data=hind?hindShape:foreShape;
  mesh(parent,data.g,mat);
  if(!detail)return;
  tube(parent,[...data.points,data.points[0]].map(([x,z])=>V(x,0,z)),.009);
  const paths=hind?[
    [[0,0],[.65,-.28],[1.85,-.54]],
    [[.65,-.28],[.8,-.66]],[[1.18,-.39],[1.3,-.77]]
  ]:[
    [[0,0],[.8,.13],[1.9,.23],[3.5,.15],[3.85,-.1]],
    [[0,0],[.75,-.14],[1.55,-.22],[2.5,-.2],[3.5,.15]],
    [[.32,-.08],[.83,-.4],[1.6,-.49],[2.4,-.45],[3.4,-.39]],
    [[1.03,.16],[1.12,-.18],[.95,-.44]],
    [[1.78,.22],[1.72,-.22],[1.6,-.49]],
    [[2.46,.21],[2.5,-.2],[2.4,-.45]],
    [[3.15,.17],[2.9,-.37]]
  ];
  paths.forEach(p=>tube(parent,p.map(([x,z])=>V(x,.009,z)),.006));
}
const ghostMats=[];
for(const side of [-1,1]){
  const hinge=part('Wing Hinge Assembly','Gold gimbal / axillary linkage',
    'A two-axis linkage combines flapping stroke with rapid pitch reversal.',
    'Small structures called axillary sclerites articulate the wing base.',
    thorax,V(side*.67,.3,.12),V(side*.35,.9,0),0,'Axillary gimbal / dual-axis drive');
  ell(hinge.g,metalMat,V(),V(.17,.17,.2));
  const hoop=ring(hinge.g,.19,V(),metalMat,.026);hoop.rotation.y=Math.PI/2;
  const stroke=new THREE.Group();hinge.g.add(stroke);
  const pitch=new THREE.Group();stroke.add(pitch);
  const oriented=new THREE.Group();oriented.scale.x=side;pitch.add(oriented);
  const fore=part('Forewings','Etched iridescent glass',
    'The leading aerofoil provides the main lifting surface.',
    'Honeybee wings rotate in pitch at the ends of each stroke.',
    oriented,V(),V(.1,.65,.25),0,'Marginal / submarginal cells');
  makeWing(fore.g);
  const hind=part('Hindwings','Etched iridescent glass',
    'The smaller wing couples to the forewing for flight.',
    'Forewing and hindwing work together as one surface on each side.',
    oriented,V(.06,-.018,-.16),V(.05,.35,-.8),1,'Coupled posterior aerofoil');
  makeWing(hind.g,true);
  const hamuli=part('Hamuli Coupling','Micromachined gold hooks',
    'A hooked strip locks the hindwing to the forewing.',
    'Hamuli are the tiny hooks linking a bee’s two wings on each side.',
    oriented,V(.36,.015,-.25),V(0,.7,-.4),1,'21 hooks / coupled aerofoil');
  const hookGeo=new THREE.TorusGeometry(.025,.005,4,8,Math.PI*1.5);
  const hooks=[];
  for(let i=0;i<21;i++)hooks.push({p:V(i*.047,0,-i*.035),s:V(1,1,1)});
  instances(hamuli.g,hookGeo,metalMat,hooks);
  const ghosts=[];
  for(let i=0;i<6;i++){
    const gs=new THREE.Group();hinge.g.add(gs);
    const gp=new THREE.Group();gs.add(gp);
    const go=new THREE.Group();go.scale.x=side;gp.add(go);
    const gm=physical('glass',{transparent:true,opacity:0,depthWrite:false,
      side:THREE.DoubleSide,roughness:.3,iridescence:.8,iridescenceThicknessRange:[120,410]});
    ghostMats.push(gm);makeWing(go,false,false,gm);
    const hg=new THREE.Group();hg.position.set(.06,-.018,-.16);go.add(hg);makeWing(hg,true,false,gm);
    ghosts.push({stroke:gs,pitch:gp,mat:gm});
  }
  const positions=new Float32Array(160*3),colors=new Float32Array(160*3);
  for(let i=0;i<160;i++){
    const k=i/159;colors[i*3]=k;colors[i*3+1]=k;colors[i*3+2]=k;
  }
  const tg=new THREE.BufferGeometry();
  tg.setAttribute('position',new THREE.BufferAttribute(positions,3));
  tg.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const trace=new THREE.Line(tg,new THREE.LineBasicMaterial({
    color:palette.metal,transparent:true,opacity:0,vertexColors:true,depthWrite:false
  }));
  scene.add(trace);
  wingSets.push({hinge,stroke,pitch,side,ghosts,trace,positions,history:[],phase:0});
}

// Attribute each mesh to the closest named assembly.
bee.traverse(o=>{
  if(!o.isMesh)return;
  let a=o;while(a&&!a.userData.part)a=a.parent;
  if(a){o.userData.part=a.userData.part;a.userData.part.meshes.push(o)}
});
const pickables=[];
bee.traverse(o=>{
  if(o.isMesh&&!ghostMats.includes(o.material))pickables.push(o);
});

// Infinite-looking studio floor and low hexagonal landing cell.
const floorMat=new THREE.MeshPhysicalMaterial({color:palette.paper,roughness:.95,metalness:0});
const floor=mesh(scene,new THREE.PlaneGeometry(200,200),floorMat);
floor.rotation.x=-Math.PI/2;floor.position.y=-.16;
const plinthMat=new THREE.MeshPhysicalMaterial({color:palette.body,roughness:.34,clearcoat:1});
const plinth=mesh(scene,new THREE.CylinderGeometry(1.64,1.8,.18,6),plinthMat,V(0,-.055,0));
const plinthRim=new THREE.LineSegments(new THREE.EdgesGeometry(plinth.geometry),
  new THREE.LineBasicMaterial({color:palette.metal,transparent:true,opacity:.5}));
plinth.add(plinthRim);

const draftPositions=[],draftColors=[];
function draftLine(a,b){
  for(const p of [a,b]){
    draftPositions.push(...p);
    const f=Math.pow(Math.max(0,1-Math.hypot(p[0],p[2])/11),2);
    draftColors.push(f,f,f);
  }
}
for(let row=-13;row<=13;row++)for(let col=-13;col<=13;col++){
  const r=.44,x=col*r*1.5,z=(row+(col%2)*.5)*r*Math.sqrt(3);
  if(Math.hypot(x,z)>10)continue;
  for(let j=0;j<6;j++){
    const a=j*TAU/6,b=(j+1)*TAU/6;
    draftLine([x+Math.cos(a)*r,-.148,z+Math.sin(a)*r],
      [x+Math.cos(b)*r,-.148,z+Math.sin(b)*r]);
  }
}
for(const r of [2.5,3,4.6]){
  for(let i=0;i<180;i++){
    const a=i*TAU/180,b=(i+1)*TAU/180;
    draftLine([Math.cos(a)*r,-.142,Math.sin(a)*r],[Math.cos(b)*r,-.142,Math.sin(b)*r]);
  }
}
for(let i=0;i<72;i++){
  const a=i*TAU/72,r=i%6?4.5:4.35;
  draftLine([Math.cos(a)*r,-.14,Math.sin(a)*r],[Math.cos(a)*4.6,-.14,Math.sin(a)*4.6]);
}
for(const x of [-5,0,5])for(const z of [-5,0,5]){
  draftLine([x-.12,-.14,z],[x+.12,-.14,z]);
  draftLine([x,-.14,z-.12],[x,-.14,z+.12]);
}
const dg=new THREE.BufferGeometry();
dg.setAttribute('position',new THREE.Float32BufferAttribute(draftPositions,3));
dg.setAttribute('color',new THREE.Float32BufferAttribute(draftColors,3));
const drafting=new THREE.LineSegments(dg,new THREE.LineBasicMaterial({
  color:palette.line,vertexColors:true,transparent:true,opacity:0
}));scene.add(drafting);

function shadowTexture(){
  const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
  const g=x.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,'rgba(0,0,0,.35)');g.addColorStop(.4,'rgba(0,0,0,.16)');g.addColorStop(1,'rgba(0,0,0,0)');
  x.fillStyle=g;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);
}
const shadow=mesh(scene,new THREE.PlaneGeometry(1,1),
  new THREE.MeshPhysicalMaterial({map:shadowTexture(),transparent:true,depthWrite:false,roughness:1}),
  V(0,.043,0),V(5,5,1));
shadow.rotation.x=-Math.PI/2;

// Emissive-only bloom: non-emissive meshes remain black depth occluders.
const bloomComposer=new EffectComposer(renderer);
bloomComposer.addPass(new RenderPass(scene,camera));
const bloomPass=new UnrealBloomPass(new THREE.Vector2(innerWidth/2,innerHeight/2),.25,.35,1.05);
bloomComposer.addPass(bloomPass);bloomComposer.renderToScreen=false;
const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const combine=new ShaderPass({
  uniforms:{tDiffuse:{value:null},bloomTexture:{value:bloomComposer.renderTarget2.texture}},
  vertexShader:`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform sampler2D tDiffuse;uniform sampler2D bloomTexture;varying vec2 vUv;
    void main(){gl_FragColor=texture2D(tDiffuse,vUv)+texture2D(bloomTexture,vUv)*.35;}`
});
composer.addPass(combine);
composer.addPass(new OutputPass());
const fxaa=new ShaderPass(FXAAShader);composer.addPass(fxaa);
const black=new THREE.MeshBasicMaterial({color:0x000000,clippingPlanes:[clip]});
const bloomSaved=new Map(),hiddenLines=[];
function render(){
  const background=scene.background;scene.background=new THREE.Color(0);
  scene.traverse(o=>{
    if(o.isMesh&&!o.layers.isEnabled(1)){
      bloomSaved.set(o,o.material);o.material=black;
    }else if(o.isLine&&o.visible){o.visible=false;hiddenLines.push(o)}
  });
  bloomComposer.render();
  bloomSaved.forEach((m,o)=>o.material=m);bloomSaved.clear();
  hiddenLines.forEach(o=>o.visible=true);hiddenLines.length=0;
  scene.background=background;composer.render();
}

const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(3,3);
let hovered=null,selected=null,pointerDown=null,lastPointer=0;
function setSpec(p){
  $('#specTag').textContent=p?'COMPONENT / '+String(p.id).padStart(3,'0'):'SPECIFICATION / 001';
  $('#specName').textContent=p?p.name:'Agent-orchestrated, human-verified.';
  $('#specText').textContent=p?p.material+'. '+p.fn:
    "Orchestrated agents. Verified delivery. A precise study of how Minerva turns intent into production.";
  $('#specFact').textContent=p?p.fact:
    'Inspired by Apis mellifera \u2014 this mechanical bee stands in for the Minerva delivery machine.';
}
renderer.domElement.addEventListener('pointermove',e=>{
  pointer.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);lastPointer=performance.now();
});
renderer.domElement.addEventListener('pointerleave',()=>pointer.set(3,3));
renderer.domElement.addEventListener('pointerdown',e=>pointerDown={x:e.clientX,y:e.clientY});
renderer.domElement.addEventListener('pointerup',e=>{
  if(!pointerDown||Math.hypot(e.clientX-pointerDown.x,e.clientY-pointerDown.y)>5)return;
  selected=hovered;
  if(selected){
    const box=new THREE.Box3().setFromObject(selected.g);
    const target=box.getCenter(V()),size=box.getSize(V()).length();
    beginCamera(target.clone().add(camera.position.clone().sub(controls.target).normalize().multiplyScalar(Math.max(2.8,size*1.8))),target);
  }else setView(viewIndex);
});
controls.addEventListener('start',()=>cameraTween=null);

let explodeTarget=0,explodeValue=1,paused=false,flightRequested=false;
let flightState='RESTING',flightClock=0,lift=0,liftV=0,drive=0,fold=0;
let tempo=1,simTime=0,realTime=0,phase=0,gearPhase=0,opening=true;
let viewIndex=0,cameraTween=null,section=0,schematic=0,evadeCooldown=0;
const velocity=V(),acceleration=V(),wander=V(),gust=V(),bodyOffset=V();
let yaw=0,roll=0,pitchBody=0,abdX=0,abdV=0;
function spring(x,v,target,w,z,dt){
  const a=w*w*(target-x)-2*z*w*v;
  v+=a*dt;x+=v*dt;return [x,v];
}
function flightToggle(){
  flightRequested=!flightRequested;flightClock=0;
  flightState=flightRequested?'WARMING':'LANDING';
  $('#flight').textContent=flightRequested?'LAND':'TAKE FLIGHT';
}
$('#flight').onclick=flightToggle;
$('#explode').oninput=e=>explodeTarget=+e.target.value;
$('#tempo').oninput=e=>tempo=Math.pow(10,-3+3*(+e.target.value));
$('#orbit').onclick=()=>{controls.autoRotate=!controls.autoRotate;$('#orbit').classList.toggle('active',controls.autoRotate)};
function setTheme(i){
  themeIndex=(i+themes.length)%themes.length;themeMix=0;
  for(const k of colorKeys){fromPalette[k]=palette[k].clone();toPalette[k]=new THREE.Color(themes[themeIndex][k])}
  fromRough=roughness;
  [...$('#themes').children].forEach((b,j)=>b.classList.toggle('active',j===themeIndex));
}
themes.forEach((t,i)=>{
  const b=document.createElement('button');b.title=t.name;
  b.setAttribute('aria-label','Switch to '+t.name+' '+(t.mode||'')+' mode');
  const h=document.createElement('span');h.className='hex theme-icon';h.textContent=t.icon||'';
  h.setAttribute('aria-hidden','true');
  h.style.background='transparent';
  h.style.clipPath='none';
  h.style.fontSize='14px';
  h.style.width='auto';h.style.height='auto';
  b.append(h,document.createTextNode(t.name));b.classList.toggle('active',i===0);
  b.onclick=()=>setTheme(i);$('#themes').append(b);
});
function setMode(i){
  modeIndex=i;
  [...$('#renders').querySelectorAll('button')].forEach((b,j)=>b.classList.toggle('active',i===j));
}
['SOLID','SECTION','SCHEMATIC'].forEach((s,i)=>{
  const b=document.createElement('button');b.textContent=s;b.onclick=()=>setMode(i);
  $('#renders').append(b);
});setMode(0);
function beginCamera(position,target){
  cameraTween={from:camera.position.clone(),to:position,
    fromTarget:controls.target.clone(),toTarget:target,t:0};
}
const views=[[10,7.5,12],[.01,16,.01],[0,3,16],[16,3,0],[3,3.2,5.8]];
function setView(i){
  viewIndex=i;
  const t=i===4?head.getWorldPosition(V()):bee.position.clone().add(V(0,-.25,0));
  beginCamera(V(...views[i]).add(bodyOffset),t);
  [...$('#views').querySelectorAll('button')].forEach((b,j)=>b.classList.toggle('active',i===j));
}
['ISO','PLAN','FRONT','PROFILE','MACRO'].forEach((s,i)=>{
  const b=document.createElement('button');b.textContent=s;b.classList.toggle('active',i===0);
  b.onclick=()=>setView(i);$('#views').append(b);
});
onKey=e=>{
  if(['INPUT','TEXTAREA'].includes(document.activeElement.tagName)&&e.code!=='Escape')return;
  const k=e.key.toLowerCase();
  if(k==='f')flightToggle();
  if(k==='e'){explodeTarget=explodeTarget>.5?0:1;$('#explode').value=explodeTarget}
  if(k==='t')setTheme(themeIndex+1);
  if(k==='r')setMode((modeIndex+1)%3);
  if(k==='h')root.classList.toggle('hidden');
  if(k>='1'&&k<='5')setView(+k-1);
  if(e.code==='Space'){e.preventDefault();paused=!paused}
};
window.addEventListener('keydown',onKey);

const leaders=$('#leaders'),lc=leaders.getContext('2d');
const scope=$('#scope'),sc=scope.getContext('2d');
const projected=new THREE.Vector3();
function project(v){return v.clone().project(camera)}
function screen(v){
  const p=project(v);return {x:(p.x*.5+.5)*innerWidth,y:(-.5*p.y+.5)*innerHeight,z:p.z};
}
function drawLabels(){
  lc.clearRect(0,0,innerWidth,innerHeight);
  parts.forEach(p=>p.label.style.opacity=0);
  if(root.classList.contains('hidden'))return;
  const opacity=smooth(.25,.7,explodeValue);
  const left=[],right=[],used=new Set();
  if(opacity>.01&&innerWidth>760){
    for(const p of parts){
      if(p.level&&p!==hovered&&p!==selected)continue;
      if(used.has(p.name))continue;used.add(p.name);
      const q=screen(p.g.getWorldPosition(V()));
      if(q.z>1||q.z< -1)continue;
      (q.x<innerWidth/2?left:right).push({p,q,y:q.y});
    }
    const top=220,bottom=innerHeight-155,gap=53;
    for(const [list,isLeft] of [[left,true],[right,false]]){
      list.sort((a,b)=>a.y-b.y);
      const available=Math.max(1,Math.floor((bottom-top)/gap));
      const visible=list.slice(0,available);
      visible.forEach((o,i)=>o.y=clamp(o.y,top+i*gap,bottom-(visible.length-1-i)*gap));
      for(let i=1;i<visible.length;i++)visible[i].y=Math.max(visible[i].y,visible[i-1].y+gap);
      for(const o of visible){
        const x=isLeft?innerWidth*.19:innerWidth*.78;
        o.p.label.style.left=x+'px';o.p.label.style.top=(o.y-12)+'px';
        o.p.label.style.opacity=opacity;
        lc.strokeStyle='#'+palette.line.getHexString();lc.globalAlpha=opacity*.7;
        lc.lineWidth=.7;lc.beginPath();lc.moveTo(o.q.x,o.q.y);
        const end=isLeft?x+175:x-8;
        lc.lineTo(isLeft?end+18:end-18,o.y);lc.lineTo(end,o.y);lc.stroke();
        lc.beginPath();lc.arc(o.q.x,o.q.y,2,0,TAU);lc.stroke();
      }
    }
  }
  if(schematic>.01)drawDimensions();
  lc.globalAlpha=1;
}
function dimension(a,b,text,offset=28){
  const p=screen(bee.localToWorld(a.clone())),q=screen(bee.localToWorld(b.clone()));
  if(p.z>1||q.z>1)return;
  lc.beginPath();lc.moveTo(p.x,p.y);lc.lineTo(p.x,p.y+offset);
  lc.moveTo(q.x,q.y);lc.lineTo(q.x,q.y+offset);
  lc.moveTo(p.x,p.y+offset);lc.lineTo(q.x,q.y+offset);lc.stroke();
  for(const r of [p,q]){
    lc.beginPath();lc.moveTo(r.x-4,r.y+offset+4);lc.lineTo(r.x+4,r.y+offset-4);lc.stroke();
  }
  lc.fillText(text,(p.x+q.x)/2,(p.y+q.y)/2+offset-8);
}
function drawDimensions(){
  lc.globalAlpha=schematic*.8;lc.strokeStyle=lc.fillStyle='#'+palette.ink.getHexString();
  lc.font='9px "JetBrains Mono"';lc.textAlign='center';lc.lineWidth=.7;
  dimension(V(-4.64,.3,0),V(4.64,.3,0),'SPAN / 186 mm',-35);
  dimension(V(0,0,2.1),V(0,0,-4.05),'BODY / 123 mm',35);
  const c=screen(bee.localToWorld(V()));
  lc.setLineDash([5,6]);lc.beginPath();lc.moveTo(c.x-140,c.y);lc.lineTo(c.x+140,c.y);
  lc.moveTo(c.x,c.y-110);lc.lineTo(c.x,c.y+110);lc.stroke();lc.setLineDash([]);
  lc.beginPath();lc.arc(c.x,c.y,95,-Math.PI*.75,-Math.PI*.25);lc.stroke();
  lc.fillText('90° STROKE',c.x,c.y-110);
  for(const p of [cranial,motor,core]){
    const q=screen(p.g.getWorldPosition(V()));
    lc.beginPath();lc.arc(q.x+24,q.y-22,11,0,TAU);lc.stroke();
    lc.fillText(String(p.id).padStart(2,'0'),q.x+24,q.y-19);
  }
}

function updateTheme(dt){
  themeMix=Math.min(1,themeMix+dt/.8);
  const t=themeMix*themeMix*(3-2*themeMix);
  if(themeMix<1||Object.keys(toPalette).length){
    for(const k of colorKeys)if(toPalette[k])palette[k].lerpColors(fromPalette[k],toPalette[k],t);
    roughness=lerp(fromRough,themes[themeIndex].rough,t);
  }
  delftAmount=damp(delftAmount,themeIndex===0?1:0,6,dt);
  if(patternedMat.userData.shader)patternedMat.userData.shader.uniforms.floralAmount.value=delftAmount;
  scene.background=palette.paper;
  floorMat.color.copy(palette.paper);plinthMat.color.copy(palette.body);
  drafting.material.color.copy(palette.line);plinthRim.material.color.copy(palette.metal);
  for(const k of ['paper','ink','metal'])document.documentElement.style.setProperty('--'+k,'#'+palette[k].getHexString());
  document.documentElement.style.setProperty('--line','#'+palette.line.getHexString()+'55');
  document.documentElement.style.setProperty('--panel','#'+palette.paper.getHexString()+'d9');
}

let highlightClones=new Map(),lastHighlight=null,dimAmount=0;
function highlight(p){
  if(p===lastHighlight)return;
  highlightClones.forEach((original,o)=>{o.material.dispose();o.material=original});
  highlightClones.clear();lastHighlight=p;
  if(p)p.meshes.forEach(o=>{
    if(ghostMats.includes(o.material))return;
    const original=o.material;o.material=original.clone();
    o.material.userData={...original.userData,highlight:true};highlightClones.set(o,original);
  });
}
function updateMaterials(dt){
  dimAmount=damp(dimAmount,hovered?1:0,8,dt);
  const all=[...materials,...highlightClones.keys()].map(x=>x.isMesh?x.material:x);
  for(const m of all){
    const k=m.userData.kind;
    m.color.copy(palette[k]||palette.body);
    if(m.userData.highlight){
      m.emissive.copy(palette.metal);m.emissiveIntensity=.23;
    }else if(k!=='core')m.color.multiplyScalar(1-dimAmount*.7);
    if(k==='body'){m.roughness=lerp(roughness,.9,schematic);m.metalness=0}
    if(k==='metal'){m.metalness=1-schematic;m.roughness=lerp(.25,.9,schematic)}
    if(k==='core'){
      m.emissive.copy(palette.core);
      m.emissiveIntensity=(1.3+Math.sin(simTime*3.1)*.06+Math.sin(simTime*7.3)*.025)*(1-schematic*.9);
    }
    if(schematic>.001)m.color.lerp(palette.paper,schematic*(k==='metal'?.3:.7));
  }
  edgeLines.forEach(e=>{e.material.color.copy(palette.ink);e.material.opacity=schematic*.8});
}

const tmp=V(),followPrevious=V(0,1.4,0);
let lastHoverCheck=0,telemetryClock=0;
function simulate(dt,wallDt){
  const sd=dt*tempo;
  simTime+=sd;realTime+=dt;
  if(!paused)flightClock+=sd;
  const take=smooth(.55,2.5,flightClock);
  const liftTarget=flightRequested?take:0;
  [lift,liftV]=spring(lift,liftV,liftTarget,3.5,.95,sd);
  lift=clamp(lift,0,1.1);
  const driveTarget=flightRequested?smooth(0,.95,flightClock):smooth(0,.2,lift);
  drive=damp(drive,driveTarget,flightRequested?4:2.5,sd);
  fold=damp(fold,flightRequested?smooth(.25,1.35,flightClock):smooth(0,.25,lift),4,sd);
  if(flightRequested&&flightClock>2.5)flightState='IN FLIGHT';
  if(!flightRequested&&lift<.007&&drive<.02)flightState='RESTING';
  root.classList.toggle('flying',flightState!=='RESTING');

  const curious=(Math.sin(simTime*.19)>.78)?.22:1;
  wander.set(Math.sin(simTime*.27)*1.65*curious,Math.sin(simTime*.41)*.22,
    Math.sin(simTime*.21+1.2)*.85*curious).multiplyScalar(lift);
  gust.set(Math.sin(simTime*1.17)+Math.sin(simTime*2.79)*.25,
    Math.sin(simTime*.91)*.13,Math.sin(simTime*1.63+.8)*.6).multiplyScalar(.09*lift);
  acceleration.copy(wander).sub(bodyOffset).multiplyScalar(2.1)
    .addScaledVector(velocity,-2.2).add(gust);
  evadeCooldown-=sd;
  const beeScreen=screen(bee.getWorldPosition(tmp));
  const px=(pointer.x*.5+.5)*innerWidth,py=(-pointer.y*.5+.5)*innerHeight;
  if(lift>.6&&performance.now()-lastPointer<250&&
      Math.hypot(px-beeScreen.x,py-beeScreen.y)<100&&evadeCooldown<0){
    velocity.x+=(px>beeScreen.x?-1:1)*.65;
    velocity.z+=.25;evadeCooldown=2.2;
  }
  velocity.addScaledVector(acceleration,sd);
  bodyOffset.addScaledVector(velocity,sd);
  if(!flightRequested){bodyOffset.multiplyScalar(Math.exp(-sd*.7))}
  const landCompression=Math.exp(-Math.pow((lift-.035)/.028,2))*(flightRequested?0:.08);
  bee.position.set(bodyOffset.x,1.65+lift*1.8+bodyOffset.y-landCompression,bodyOffset.z);
  if(flightRequested&&flightClock<.8){
    bee.position.y+=Math.sin(simTime*125)*.012*smooth(0,.3,drive);
  }
  const yawTarget=velocity.length()>.12?Math.atan2(velocity.x,velocity.z)*.25:Math.sin(simTime*.33)*.13;
  yaw=damp(yaw,yawTarget,1.7,sd);
  roll=damp(roll,-acceleration.x*.15*lift,3,sd);
  pitchBody=damp(pitchBody,-acceleration.z*.12*lift+(flightRequested?-.035:.2)*lift,3,sd);
  bee.rotation.set(pitchBody,yaw,roll);
  head.rotation.z=damp(head.rotation.z,-roll*.8,8,sd);
  head.rotation.x=damp(head.rotation.x,-pitchBody*.7+clamp(pointer.y,-1,1)*.08,6,sd);
  head.rotation.y=damp(head.rotation.y,clamp(pointer.x,-1,1)*.17,5,sd);
  [abdX,abdV]=spring(abdX,abdV,-pitchBody*.6+velocity.z*.035,4.1,.68,sd);
  abdomen.rotation.x=abdX;
  abdomen.rotation.z=damp(abdomen.rotation.z,-roll*.6,3,sd);
  tongue.rotation.x=damp(tongue.rotation.x,hovered===proboscis?1.6:0,3,sd);

  const thrust=clamp(velocity.length()*.13+acceleration.length()*.06,0,.3);
  const hz=230*(.94+thrust*.25)*drive;
  phase=(phase+TAU*hz*sd)%TAU;
  gearPhase+=sd*drive*9;
  gears.forEach(g=>g.root.rotation.z=gearPhase*g.speed);
  springs.forEach((s,i)=>s.scale.y=1+Math.sin(phase+i*.11)*.045*drive);
  scutum.g.scale.y=1+Math.sin(phase)*.009*drive;
  setae.g.rotation.z=Math.sin(simTime*2.1)*.008+roll*.025;

  for(const a of antennas){
    const target=-velocity.x*.08+a.side*.03*Math.sin(simTime*1.7+a.side*2)+clamp(pointer.x,-1,1)*.13;
    [a.x,a.v]=spring(a.x,a.v,target,6+a.side*.7,.65,sd);
    a.pivot.rotation.z=a.x;a.pivot.rotation.x=-.13+Math.sin(simTime*1.3+a.side)*.025;
    a.segments.forEach((j,i)=>{
      j.rotation.y=a.side*.065+Math.sin(simTime*1.9-i*.29+a.side)*.035;
      j.rotation.x=.035+lift*.028*Math.sin(simTime*2.2-i*.4);
    });
  }
  legs.forEach(l=>{
    const target=lift*(.45+l.index*.13)-velocity.z*.11;
    [l.x,l.v]=spring(l.x,l.v,target,4+l.index*.8,.66,sd);
    l.root.rotation.x=l.x;
    l.root.rotation.z=l.side*(-lift*.13+Math.sin(simTime*1.4+l.index*1.8)*.012*lift);
    l.knee.rotation.x=-lift*.36-landCompression*2;
    l.knee.position.copy(l.baseKnee).multiplyScalar(1+explodeValue*.3);
    l.tarsus.position.y=-.5-explodeValue*.22;
  });
  tergites.forEach((p,i)=>{
    p.g.position.z+=Math.sin(simTime*1.5-i*.15)*.016*(i+1)/6;
  });

  for(const w of wingSets){
    const asym=clamp(acceleration.x*.07,-.1,.1)*w.side;
    const amp=Math.PI/4*(1+asym+thrust*.12)*fold;
    function pose(s,p,ph){
      s.rotation.z=w.side*Math.sin(ph)*amp;
      s.rotation.y=w.side*((1-fold)*1.41+Math.sin(ph*2)*.15*fold);
      p.rotation.x=Math.tanh(Math.cos(ph)*5)*.65*fold;
    }
    pose(w.stroke,w.pitch,phase);
    const blur=smooth(.012,.15,tempo)*drive*(1-explodeValue);
    w.ghosts.forEach((g,i)=>{
      // Samples span a perceptual shutter at high beat rates.
      const sample=phase-(i+1)/6*Math.min(TAU,TAU*hz*sd);
      pose(g.stroke,g.pitch,sample);
      g.mat.opacity=blur*(1-i/7)*.055;
      g.stroke.visible=g.mat.opacity>.001;
    });
    glassMat.opacity=.48-blur*.3;
    const tip=V(3.97,0,-.15);
    tip.x*=w.side;w.pitch.localToWorld(tip);
    if(sd>0){w.history.push(tip);if(w.history.length>160)w.history.shift()}
    for(let i=0;i<160;i++){
      const v=w.history[Math.max(0,w.history.length-160+i)]||tip;
      w.positions[i*3]=v.x;w.positions[i*3+1]=v.y;w.positions[i*3+2]=v.z;
    }
    w.trace.geometry.attributes.position.needsUpdate=true;
    w.trace.geometry.computeBoundingSphere();
    w.trace.material.color.copy(palette.metal);
    w.trace.material.opacity=(1-smooth(.01,.1,tempo))*drive*.45*(1-explodeValue);
  }

  shadow.position.x=bee.position.x;shadow.position.z=bee.position.z;
  shadow.scale.set(5-lift,5.8-lift,1);
  shadow.material.opacity=.85-lift*.4;
  core.g.getWorldPosition(coreLight.position);
  coreLight.color.copy(palette.core);coreLight.intensity=(themeIndex===1?1.4:.3)*(1-schematic);
  key.position.x=-4+Math.sin(realTime*.12)*.9;

  telemetryClock+=wallDt;
  if(telemetryClock>.07){
    telemetryClock=0;
    $('#readings').textContent=
      `ALT ${(lift*36).toFixed(1)} mm  V ${(velocity.length()*20).toFixed(1)} mm/s  HDG ${((yaw*180/Math.PI+360)%360).toFixed(0)}°  ${hz.toFixed(0)} Hz`;
    sc.clearRect(0,0,560,70);
    for(const side of [-1,1]){
      sc.strokeStyle='#'+(side<0?palette.metal:palette.ink).getHexString();sc.lineWidth=1.3;
      sc.beginPath();
      for(let x=0;x<560;x++){
        const y=35+Math.sin(x*.065-phase)*18*(1+side*acceleration.x*.08);
        x?sc.lineTo(x,y):sc.moveTo(x,y);
      }
      sc.stroke();
    }
  }
}

function assemble(dt){
  if(opening){
    const t=clamp(realTime/3.6,0,1);
    explodeValue=1-smooth(.18,.95,t);
    drafting.material.opacity=smooth(0,.8,realTime)*.55;
    if(realTime>2.8)root.classList.add('ready');
    $('#status').textContent='ASSEMBLING · '+Math.round((1-explodeValue)*100)+'%';
    if(t>=1){opening=false;explodeValue=0}
  }else explodeValue=damp(explodeValue,explodeTarget,5,dt);
  for(const p of parts){
    const delay=(p.level?0:.12)+((p.id%4)*.025);
    const e=smooth(delay,1,explodeValue);
    p.g.position.copy(p.seat).addScaledVector(p.axis,e*1.65);
    const a=p.guide.geometry.attributes.position;
    a.setXYZ(0,p.seat.x,p.seat.y,p.seat.z);
    a.setXYZ(1,p.g.position.x,p.g.position.y,p.g.position.z);
    a.needsUpdate=true;p.guide.computeLineDistances();
    p.guide.material.color.copy(palette.line);p.guide.material.opacity=e*.4;
  }
  if(!opening)$('#status').textContent=flightState+' · ASSEMBLY '+Math.round((1-explodeValue)*100)+'%';
}

function updateCamera(dt){
  if(cameraTween){
    cameraTween.t=Math.min(1,cameraTween.t+dt/1.25);
    const t=cameraTween.t,t2=t*t*(3-2*t);
    camera.position.lerpVectors(cameraTween.from,cameraTween.to,t2);
    controls.target.lerpVectors(cameraTween.fromTarget,cameraTween.toTarget,t2);
    if(t===1)cameraTween=null;
  }else if(!selected&&lift>.01){
    const desired=bee.position.clone().add(V(0,-.25,0));
    const delta=desired.sub(controls.target).multiplyScalar(1-Math.exp(-dt*1.3));
    controls.target.add(delta);camera.position.add(delta);
  }
  controls.update();
}
function resize(){
  const w=innerWidth,h=innerHeight,p=Math.min(devicePixelRatio,2);
  camera.aspect=w/h;camera.updateProjectionMatrix();
  renderer.setPixelRatio(p);renderer.setSize(w,h);
  composer.setPixelRatio(p);composer.setSize(w,h);
  bloomComposer.setPixelRatio(1);bloomComposer.setSize(Math.floor(w/2),Math.floor(h/2));
  fxaa.material.uniforms.resolution.value.set(1/(w*p),1/(h*p));
  leaders.width=w*p;leaders.height=h*p;lc.setTransform(p,0,0,p,0,0);
}
onResize=resize; window.addEventListener('resize',resize);resize();
$('#loader').style.opacity=0;
setTimeout(()=>{ try{ const l=$('#loader'); if(l) l.remove(); }catch{} },700);

const clock=new THREE.Clock();
function frame(){
  if(disposed) return;
  raf=requestAnimationFrame(frame);
  const wallDt=Math.min(clock.getDelta(),.05);
  const dt=paused?0:wallDt;
  updateTheme(wallDt);
  section=damp(section,modeIndex===1?1:0,5,wallDt);
  schematic=damp(schematic,modeIndex===2?1:0,5,wallDt);
  // Animated plane enters from outside the entire assembly.
  clip.constant=lerp(20,-bee.position.x,section);
  assemble(dt);
  // Fixed maximum integration step keeps spring dynamics stable at low frame rates.
  const n=Math.max(1,Math.ceil(dt/(1/120)));
  for(let i=0;i<n;i++)simulate(dt/n,wallDt/n);
  updateCamera(wallDt);
  scene.updateMatrixWorld(true);
  lastHoverCheck+=wallDt;
  if(lastHoverCheck>.08){
    lastHoverCheck=0;raycaster.setFromCamera(pointer,camera);
    const hits=raycaster.intersectObjects(pickables,false);
    const hit=hits.find(h=>section<.95||clip.distanceToPoint(h.point)>=0);
    const next=hit?.object.userData.part||null;
    if(next!==hovered){hovered=next;highlight(hovered);setSpec(hovered||selected)}
    renderer.domElement.style.cursor=hovered?'pointer':'grab';
  }
  updateMaterials(wallDt);
  drawLabels();render();
}
frame();
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      if (onResize) window.removeEventListener("resize", onResize);
      if (onKey) window.removeEventListener("keydown", onKey);
      try {
        controlsRef?.dispose();
      } catch {}
      try {
        renderer?.dispose();
      } catch {}
      document.body.classList.remove("apis-mechanica-body");
    };
  }, []);

  return (
    <div ref={rootRef} className="apis-mechanica">
      <canvas id="scene" />
      <div id="loader">MINERVA AGENT / PREPARING THE HIVE</div>
      <div className="ui corner tl" />
      <div className="ui corner tr" />
      <div className="ui corner bl" />
      <div className="ui corner br" />
      <header className="ui">
        <div className="eyebrow">MINERVA AGENT — AGENT-ORCHESTRATED DELIVERY</div>
        <h1>
          <em>Minerva</em> AGENT
        </h1>
        <div className="caption">
          HUMAN-VERIFIED · STUDY Nº 03 · PRODUCTION 1 : 1
        </div>
      </header>
      <nav className="ui minerva-nav" aria-label="Minerva">
        <a className="primary" href="https://portal.abbble.co.za">
          ENTER PORTAL →
        </a>
        <a href="https://portal.abbble.co.za/plans">PRICING</a>
        <a href="https://portal.abbble.co.za/login">LOGIN</a>
      </nav>
      <div id="note" className="ui">
        A STUDY IN AGENT ENGINEERING
      </div>
      
      <div className="topright ui">
        <div className="themes" id="themes" />
        <div className="status">
          {/* <span className="dot">●</span> */}
          <span id="status">ASSEMBLING · 0%</span>
        </div>
      </div>
      <section className="spec ui">
        <div className="eyebrow" id="specTag">
          SPECIFICATION / 001
        </div>
        <h2 id="specName">Agent-orchestrated, human-verified.</h2>
        <p id="specText">
          Orchestrated agents. Verified delivery. A precise study of how Minerva
          turns intent into production.
        </p>
        <div className="fact" id="specFact">
          Inspired by Apis mellifera — this mechanical bee stands in for the
          Minerva delivery machine.
        </div>
        <div className="metrics mono">
          <span>
            SPAN<b>186 mm</b>
          </span>
          <span>
            MASS<b>64 g</b>
          </span>
          <span>
            BEAT<b>230 Hz</b>
          </span>
          <span>
            STROKE<b>90°</b>
          </span>
        </div>
        <div className="telemetry">
          <div className="readings mono" id="readings" />
          <canvas id="scope" width={560} height={70} />
        </div>
      </section>
      <div className="legend ui">
        CONTROLS
        <br />
        orbit <kbd>drag</kbd> zoom <kbd>scroll</kbd> pan <kbd>right-drag</kbd>
        <br />
        flight <kbd>F</kbd> explode <kbd>E</kbd> theme <kbd>T</kbd>
        <br />
        render <kbd>R</kbd> views <kbd>1-5</kbd> pause <kbd>space</kbd> hide{" "}
        <kbd>H</kbd>
      </div>
      <div className="controls ui">
        <div className="group">
          <label htmlFor="explode">ASSEMBLED</label>
          <input id="explode" type="range" min="0" max="1" step=".001" defaultValue="0" />
          <label htmlFor="explode">EXPLODED</label>
        </div>
        <div className="divider" />
        <button id="flight" type="button">
          TAKE FLIGHT
        </button>
        <a id="consoleLink" href="https://portal.abbble.co.za">
          ENTER PORTAL →
        </a>
        <div className="divider" />
        <div className="group" id="views">
          <span>VIEW</span>
        </div>
        <div className="divider" />
        <div className="group" id="renders">
          <span>RENDER</span>
        </div>
        <div className="divider" />
        <button id="orbit" type="button">
          ↻ ORBIT
        </button>
        <div className="group">
          <label htmlFor="tempo">TEMPO</label>
          <input id="tempo" type="range" min="0" max="1" step=".001" defaultValue="1" />
        </div>
      </div>
      <canvas id="leaders" className="ui" />
      <div id="labels" className="ui" />
    </div>
  );
}
