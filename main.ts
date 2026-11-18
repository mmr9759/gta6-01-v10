// VELMARA: Streets of Gold — v10
// Open-world crime game, 2D top-down. Node 22, stdlib only, no network.
// Writes the whole game as a single self-contained HTML file to /output.
// Deterministic: same bytes on every run.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = process.argv[2] || "/output";
mkdirSync(outDir, { recursive: true });

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>VELMARA: Streets of Gold</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:100%; height:100%; overflow:hidden; background:#0b0e14; font-family:'Segoe UI',system-ui,Arial,sans-serif; }
  #wrap { position:relative; width:100vw; height:100vh; }
  canvas { display:block; }
  #game { position:absolute; inset:0; }
  #hud { position:absolute; top:10px; left:10px; color:#fff; text-shadow:0 1px 3px #000; pointer-events:none; user-select:none; }
  #money { font-size:26px; font-weight:800; color:#ffd94a; }
  #healthbar { width:180px; height:12px; background:#222; border:1px solid #555; border-radius:6px; margin-top:4px; overflow:hidden; }
  #healthfill { height:100%; background:linear-gradient(90deg,#37d67a,#7cf2a8); width:100%; }
  #stars { font-size:26px; letter-spacing:2px; margin-top:2px; color:#ffd94a; }
  #stars .off { color:#555; }
  #clock { font-size:15px; margin-top:2px; }
  #mission { position:absolute; top:10px; left:50%; transform:translateX(-50%); max-width:520px; text-align:center; color:#fff; text-shadow:0 1px 3px #000; pointer-events:none; user-select:none; }
  #missionTitle { font-size:19px; font-weight:800; color:#ffd94a; }
  #missionObj { font-size:14px; background:rgba(0,0,0,.45); padding:4px 12px; border-radius:12px; margin-top:3px; display:inline-block; }
  #minimapBox { position:absolute; right:10px; top:10px; border:2px solid rgba(255,255,255,.55); border-radius:6px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,.5); }
  #compass { position:absolute; top:180px; right:10px; width:220px; height:26px; overflow:hidden; border-radius:6px; background:rgba(0,0,0,.5); color:#fff; font-size:13px; font-weight:700; text-align:center; line-height:26px; letter-spacing:3px; }
  #radio { position:absolute; right:10px; top:216px; color:#fff; background:rgba(0,0,0,.55); padding:5px 10px; border-radius:10px; font-size:13px; text-shadow:0 1px 2px #000; }
  #toast { position:absolute; bottom:120px; left:50%; transform:translateX(-50%); color:#fff; font-size:22px; font-weight:800; text-shadow:0 2px 6px #000; opacity:0; transition:opacity .3s; pointer-events:none; text-align:center; }
  #help { position:absolute; left:10px; bottom:10px; color:#ddd; font-size:12px; background:rgba(0,0,0,.5); padding:6px 10px; border-radius:8px; line-height:1.5; }
  #speedo { position:absolute; right:12px; bottom:12px; color:#fff; font-size:15px; font-weight:700; text-shadow:0 1px 3px #000; text-align:right; }
  #menu, #branch, #shop, #gameover { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; flex-direction:column; background:rgba(5,8,16,.82); color:#fff; z-index:10; }
  #menu h1 { font-size:56px; color:#ffd94a; letter-spacing:4px; text-shadow:0 0 24px rgba(255,217,74,.5); }
  #menu h2 { font-size:18px; color:#e8c96a; margin:6px 0 18px; font-weight:400; }
  .btn { pointer-events:auto; cursor:pointer; background:#ffd94a; color:#111; border:0; font-size:18px; font-weight:800; padding:12px 34px; border-radius:10px; margin:6px; }
  .btn:hover { background:#ffe27a; }
  .btn.ghost { background:transparent; color:#fff; border:2px solid #ffd94a; }
  #menu p, #branch p, #shop p { max-width:640px; text-align:center; line-height:1.6; color:#ddd; margin:8px 0; }
  #branch h1, #shop h1, #gameover h1 { font-size:34px; color:#ffd94a; }
  #shopItems { display:flex; flex-direction:column; gap:6px; margin:10px 0; }
  .shoprow { display:flex; gap:14px; justify-content:space-between; width:420px; background:rgba(255,255,255,.08); padding:8px 14px; border-radius:8px; }
  .hidden { display:none !important; }
  #actCard { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; flex-direction:column; background:#000; color:#ffd94a; z-index:9; pointer-events:none; }
  #actCard h1 { font-size:44px; letter-spacing:6px; }
  #actCard p { font-size:18px; color:#fff; margin-top:8px; }
</style>
</head>
<body>
<div id="wrap">
  <canvas id="game"></canvas>
  <div id="hud">
    <div id="money">$ 0</div>
    <div id="healthbar"><div id="healthfill"></div></div>
    <div id="stars"></div>
    <div id="clock">Day 1 · 08:00</div>
    <div id="ammo"></div>
  </div>
  <div id="mission"><div id="missionTitle"></div><div id="missionObj"></div></div>
  <div id="minimapBox"><canvas id="minimap" width="220" height="160"></canvas></div>
  <div id="compass">N</div>
  <div id="radio">RADIO: OFF — tekan 1/2/3</div>
  <div id="toast"></div>
  <div id="help">WASD gerak · E masuk/keluar mobil · F pukul · G tembak · Spasi rem tangan · M misi · R radio · H bantuan · P jeda</div>
  <div id="speedo"></div>
  <div id="actCard" class="hidden"><h1 id="actTitle"></h1><p id="actSub"></p></div>
  <div id="menu">
    <h1>VELMARA</h1>
    <h2>STREETS OF GOLD &nbsp;·&nbsp; open-world crime · 2D top-down</h2>
    <p>Kota Velmara, 3600 × 2600. Riko Vale kembali ke jalanan: 12 misi dalam 3 babak,
    pilihan bercabang di misi 7 — Marisol atau Broker. Kumpulkan 24 koin emas, menangkan
    3 street race, jadi legenda. Polisi, helikopter, dan jalanan tidak pernah tidur.</p>
    <button class="btn" id="playBtn">▶ &nbsp;MULAI</button>
    <button class="btn ghost" id="continueBtn">Lanjutkan save</button>
    <p style="font-size:12px;color:#999">WASD + mouse · suara WebAudio · save otomatis di safehouse</p>
  </div>
  <div id="branch" class="hidden">
    <h1>PILIHAN: MISI 7</h1>
    <p><b>Marisol</b> memintamu membakar gudang Broker. <b>Broker</b> menawarimu dua kali lipat
    untuk mengkhianati Marisol. Pilihanmu mengubah misi 8–12 dan akhir cerita.</p>
    <button class="btn" id="pickMarisol">Bantu Marisol</button>
    <button class="btn ghost" id="pickBroker">Terima tawaran Broker</button>
  </div>
  <div id="shop" class="hidden">
    <h1 id="shopTitle">TOKO</h1>
    <div id="shopItems"></div>
    <button class="btn ghost" id="shopClose">Tutup (E)</button>
  </div>
  <div id="gameover" class="hidden">
    <h1>BUSTED / WASTED</h1>
    <p id="overText"></p>
    <button class="btn" id="respawnBtn">Bangkit di Safehouse</button>
  </div>
</div>
<script>
"use strict";
/* ================= VELMARA engine ================= */
const WORLD_W = 3600, WORLD_H = 2600;
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const rng = mulberry32(20261118);
function clamp(v,a,b){return v<a?a:v>b?b:v;}
function dist(ax,ay,bx,by){const dx=ax-bx,dy=ay-by;return Math.sqrt(dx*dx+dy*dy);}
function angTo(ax,ay,bx,by){return Math.atan2(by-ay,bx-ax);}
function lerp(a,b,t){return a+(b-a)*t;}
function fmtMoney(n){return "$ " + Math.floor(n).toLocaleString("en-US");}

/* ---- districts (8) ---- */
const DISTRICTS = [
  {name:"Old Port",     x:0,    y:0,    w:900,  h:900,  color:"#2c4a6b"},
  {name:"Gold Row",     x:900,  y:0,    w:900,  h:900,  color:"#6b5a2c"},
  {name:"North Heights",x:1800, y:0,    w:900,  h:900,  color:"#3a5c3a"},
  {name:"Marina Bay",   x:2700, y:0,    w:900,  h:900,  color:"#2c6b5a"},
  {name:"Little Velmara",x:0,   y:900,  w:1200, h:800,  color:"#5a3a5c"},
  {name:"The Docks",    x:1200, y:900,  w:1200, h:800,  color:"#5c4a3a"},
  {name:"Downtown",     x:2400, y:900,  w:1200, h:800,  color:"#4a3a5c"},
  {name:"Southside",    x:0,    y:1700, w:3600, h:900,  color:"#6b2c2c"},
];
function districtAt(x,y){for(const d of DISTRICTS){if(x>=d.x&&x<d.x+d.w&&y>=d.y&&y<d.y+d.h)return d;}return DISTRICTS[7];}

/* ---- road graph ---- */
const ROAD_X = [300,700,1100,1500,1900,2300,2700,3100,3300];
const ROAD_Y = [250,550,900,1250,1600,1950,2300];
function nearestRoadX(x){let best=ROAD_X[0],bd=1e9;for(const rx of ROAD_X){const d=Math.abs(rx-x);if(d<bd){bd=d;best=rx;}}return best;}
function nearestRoadY(y){let best=ROAD_Y[0],bd=1e9;for(const ry of ROAD_Y){const d=Math.abs(ry-y);if(d<bd){bd=d;best=ry;}}return best;}
function onRoad(x,y){return ROAD_X.some(rx=>Math.abs(x-rx)<26)||ROAD_Y.some(ry=>Math.abs(y-ry)<26);}
/* BFS path on intersection graph */
function graphPath(sx,sy,tx,ty){
  const nodes=[];
  for(const rx of ROAD_X)for(const ry of ROAD_Y)nodes.push({x:rx,y:ry});
  const idx=(x,y)=>nodes.findIndex(n=>n.x===x&&n.y===y);
  const start=idx(nearestRoadX(sx),nearestRoadY(sy)), goal=idx(nearestRoadX(tx),nearestRoadY(ty));
  if(start<0||goal<0)return[{x:tx,y:ty}];
  const prev=new Array(nodes.length).fill(-1), seen=new Array(nodes.length).fill(false);
  const q=[start]; seen[start]=true;
  while(q.length){const cur=q.shift(); if(cur===goal)break;
    const n=nodes[cur];
    for(let i=0;i<nodes.length;i++){const m=nodes[i];
      if((m.x===n.x&&ROAD_Y.includes(m.y)&&Math.abs(m.y-n.y)<=400)||(m.y===n.y&&ROAD_X.includes(m.x)&&Math.abs(m.x-n.x)<=500)){
        if(!seen[i]){seen[i]=true;prev[i]=cur;q.push(i);}}}
  }
  const path=[]; let c=goal;
  if(!seen[goal])return[{x:tx,y:ty}];
  while(c!==-1){path.unshift({x:nodes[c].x,y:nodes[c].y});c=prev[c];}
  path.push({x:tx,y:ty}); return path;
}

/* ---- buildings (deterministic blocks between roads) ---- */
const BUILDINGS=[];
(function buildCity(){
  const r=mulberry32(777);
  for(let i=0;i<ROAD_X.length-1;i++)for(let j=0;j<ROAD_Y.length-1;j++){
    const x0=ROAD_X[i]+34, x1=ROAD_X[i+1]-34, y0=ROAD_Y[j]+34, y1=ROAD_Y[j+1]-34;
    if(x1-x0<60||y1-y0<60)continue;
    const n=1+Math.floor(r()*3);
    for(let k=0;k<n;k++){
      const w=60+r()*((x1-x0)/n-70), h=50+r()*((y1-y0)-60);
      const bx=x0+k*((x1-x0)/n)+8, by=y0+8+r()*20;
      BUILDINGS.push({x:bx,y:by,w:Math.max(50,w),h:Math.max(40,h),hue:Math.floor(r()*360)});
    }
  }
})();
function collideBuildings(x,y,rad){
  for(const b of BUILDINGS){
    const cx=clamp(x,b.x,b.x+b.w), cy=clamp(y,b.y,b.y+b.h);
    if(dist(x,y,cx,cy)<rad)return b;
  }
  return null;
}

/* ---- car models (6) ---- */
const CAR_MODELS=[
  {name:"Velta Sedan",  top:300, acc:420, color:"#c0c8d0", price:0},
  {name:"Comet GT",     top:380, acc:520, color:"#d03030", price:2500},
  {name:"Bison Truck",  top:260, acc:340, color:"#3a6bd0", price:1800},
  {name:"Falco Sport",  top:430, acc:600, color:"#ffd94a", price:6000},
  {name:"Night Taxi",   top:320, acc:440, color:"#f0b800", price:1200},
  {name:"Onyx Cruiser", top:470, acc:660, color:"#222228", price:12000},
];
/* ---- gold coins (24) ---- */
const COINS=[];
(function(){const r=mulberry32(4242);
  for(let i=0;i<24;i++){const rx=ROAD_X[Math.floor(r()*ROAD_X.length)], ry=ROAD_Y[Math.floor(r()*ROAD_Y.length)];
    COINS.push({x:rx+(r()*80-40), y:ry+(r()*80-40), got:false});}
})();
/* ---- fixed places ---- */
const PLACES={
  safehouse:{x:700,y:550,label:"Safehouse"},
  garage:{x:1500,y:1250,label:"Garage"},
  gunshop:{x:2300,y:900,label:"Ammu-Nation"},
  spray:{x:1100,y:1950,label:"Pay N' Spray"},
  taxiStand:{x:1900,y:550,label:"Taxi Stand"},
  raceStart:{x:300,y:2300,label:"Race Start"},
};

/* ================= state ================= */
const SAVE_KEY="velmara-v10-save";
const S={
  started:false, paused:false, over:false,
  x:700, y:620, angle:-Math.PI/2, onFoot:true, speed:0,
  car:null, health:100, money:150, wanted:0, ammo:0, hasGun:false,
  coins:0, day:1, clockMin:8*60, night:false,
  missionIdx:0, branch:null, // 'marisol' | 'broker'
  missionState:"go", missionTimer:0, checkpoints:[], cpIdx:0,
  passenger:null, fare:0, taxiActive:false,
  raceActive:false, raceCp:0, raceTime:0,
  kills:0, carsStolen:0, respect:0,
  engineLvl:0, armorLvl:0,
  radio:0, // 0 off, 1..3 stations
  camX:0, camY:0, shake:0,
  heli:null, roadblocks:[], cops:[], traffic:[], peds:[],
  toastT:0, actShown:"",
};
const canvas=document.getElementById("game"), ctx=canvas.getContext("2d");
const mm=document.getElementById("minimap"), mmc=mm.getContext("2d");
function resize(){canvas.width=innerWidth;canvas.height=innerHeight;}
addEventListener("resize",resize); resize();

/* ================= missions: 12, 3 acts, branch at 7 ================= */
function M(id,act,name,obj,desc,target,reward,kind){return{id,act,name,obj,desc,target,reward,kind};}
const MISSIONS=[
  M(1,1,"Pulang Kampung","Temui Marisol di Old Port","Riko kembali ke Velmara. Marisol menunggumu di pelabuhan.",{x:300,y:250},400,"goto"),
  M(2,1,"Antar Paket","Antar paket ke Gold Row","Bawa paketnya. Jangan sampai polisi melihatmu ngebut.",{x:1100,y:550},600,"goto"),
  M(3,1,"Taksi Pertama","Angkut penumpang dari Taxi Stand","Penumpang menunggu. Antar ke Downtown, tarif 2x kalau malam.",{x:1900,y:550},0,"taxi"),
  M(4,1,"Koin Emas","Kumpulkan 3 koin emas di kota","Ada 24 koin emas tersebar. Ambil 3 untuk misi ini.",{x:1500,y:900},500,"coins"),
  M(5,2,"Balapan Jalanan","Menangkan street race di Southside","3 checkpoint. Menang dan namamu dikenal.",{x:300,y:2300},1500,"race"),
  M(6,2,"Ambil Senjata","Beli pistol di Ammu-Nation","Broker mulai mengincarmu. Beli pistol, $300.",{x:2300,y:900},0,"gunshop"),
  M(7,2,"Pilihan","Temui Marisol — atau Broker?","Dua tawaran di meja. Pilih satu. Tak ada jalan kembali.",{x:1900,y:1250},0,"branch"),
  M(8,3,"Aksi Marisol","Bakar gudang Broker di The Docks","Jalur Marisol: gudang di The Docks harus rata dengan tanah.",{x:1500,y:1250},2000,"goto"),
  M(9,3,"Aksi Marisol 2","Kabur dari kejaran 3 bintang","Jalur Marisol: polisi mengepung. Hilangkan wanted-mu.",{x:700,y:550},1500,"escape"),
  M(10,3,"Aksi Broker","Antar 'barang' Broker ke Marina Bay","Jalur Broker: antar paket ke Marina Bay. Cepat, tanpa polisi.",{x:3100,y:250},2500,"goto"),
  M(11,3,"Aksi Broker 2","Menangkan balapan terakhir Broker","Jalur Broker: balapan pamungkas, 4 checkpoint.",{x:300,y:2300},3000,"race"),
  M(12,3,"Jalan Emas","Kembali ke Safehouse sebagai legenda","Semua selesai. Pulang ke safehouse. Velmara milikmu.",{x:700,y:550},5000,"goto"),
];
function curMission(){return MISSIONS[S.missionIdx]||null;}
function missionTarget(){
  const m=curMission2(); if(!m)return null;
  if(m.kind==="race")return S.checkpoints[S.cpIdx]||m.target;
  if(m.kind==="taxi"&&S.passenger)return S.passenger.dest;
  if(m.kind==="coins"){const c=COINS.find(c=>!c.got);return c?{x:c.x,y:c.y}:m.target;}
  return m.target;
}
/* branch remap: missions 8-9 = Marisol path, 10-11 = Broker path */
function activeMissionList(){
  if(!S.branch)return MISSIONS.slice(0,7);
  if(S.branch==="marisol")return MISSIONS.slice(0,7).concat([MISSIONS[7],MISSIONS[8],MISSIONS[11]]);
  return MISSIONS.slice(0,7).concat([MISSIONS[9],MISSIONS[10],MISSIONS[11]]);
}
function curMission2(){const l=activeMissionList();return l[S.missionIdx]||null;}
function advanceMission(){
  const m=curMission2(); if(!m)return;
  S.money+=m.reward; S.respect+=10;
  toast("MISI SELESAI: "+m.name+"  +"+fmtMoney(m.reward));
  if(m.id===7){ showBranch(); return; }
  S.missionIdx++; S.missionState="go"; S.cpIdx=0; S.raceActive=false; S.taxiActive=false; S.passenger=null;
  const nm=curMission2();
  if(nm){ if(nm.act!==m.act)showAct(nm.act); if(nm.kind==="race")setupRace(nm); if(nm.kind==="taxi")setupTaxi(); }
  else { toast("SEMUA MISI SELESAI — KAMU LEGENDA VELMARA!"); S.money+=0; }
  saveGame();
}
function setupRace(m){
  S.raceActive=true; S.raceCp=0; S.raceTime=0;
  const n=(m.id===11)?4:3; S.checkpoints=[];
  const r=mulberry32(100+m.id);
  for(let i=0;i<n;i++)S.checkpoints.push({x:ROAD_X[Math.floor(r()*ROAD_X.length)],y:ROAD_Y[Math.floor(r()*ROAD_Y.length)]});
}
function setupTaxi(){
  const r=mulberry32(900+S.day);
  const dest={x:ROAD_X[2+Math.floor(r()*6)],y:ROAD_Y[Math.floor(r()*ROAD_Y.length)]};
  S.passenger={dest, paid:false}; S.taxiActive=true;
}
function showAct(n){
  const t=document.getElementById("actCard");
  document.getElementById("actTitle").textContent="BABAK "+["","I","II","III"][n];
  document.getElementById("actSub").textContent=n===1?"Riko kembali ke Velmara":n===2?"Jalanan memanas":"Jalan Emas";
  t.classList.remove("hidden"); S.actShown="act"+n;
  setTimeout(()=>t.classList.add("hidden"),2200);
}
function showBranch(){document.getElementById("branch").classList.remove("hidden");S.paused=true;}
document.getElementById("pickMarisol").onclick=()=>{S.branch="marisol";closeBranch();};
document.getElementById("pickBroker").onclick=()=>{S.branch="broker";closeBranch();};
function closeBranch(){
  document.getElementById("branch").classList.add("hidden");S.paused=false;
  S.missionIdx++; S.missionState="go";
  const nm=curMission2(); if(nm&&nm.kind==="race")setupRace(nm);
  toast("Pilihan: "+(S.branch==="marisol"?"Marisol":"Broker")); saveGame();
}

/* ================= traffic & pedestrians ================= */
function spawnTraffic(){
  S.traffic=[];
  for(let i=0;i<14;i++){
    const horiz=rng()<0.5;
    const m=CAR_MODELS[Math.floor(rng()*CAR_MODELS.length)];
    S.traffic.push({x:ROAD_X[Math.floor(rng()*ROAD_X.length)],y:ROAD_Y[Math.floor(rng()*ROAD_Y.length)],
      angle:horiz?(rng()<0.5?0:Math.PI):(rng()<0.5?Math.PI/2:-Math.PI/2),
      speed:120+rng()*80, model:m, horiz, dir:rng()<0.5?1:-1, color:m.color});
  }
  S.peds=[];
  for(let i=0;i<22;i++){
    S.peds.push({x:100+rng()*(WORLD_W-200),y:100+rng()*(WORLD_H-200),
      angle:rng()*Math.PI*2, speed:30+rng()*25, hue:Math.floor(rng()*360), walkT:0});
  }
}
function parkedCars(){
  const out=[]; const r=mulberry32(31337);
  for(let i=0;i<10;i++){
    const rx=ROAD_X[Math.floor(r()*ROAD_X.length)], ry=ROAD_Y[Math.floor(r()*ROAD_Y.length)];
    out.push({x:rx+30,y:ry+14,angle:0,model:CAR_MODELS[Math.floor(r()*CAR_MODELS.length)],taken:false});
  }
  return out;
}
const PARKED=parkedCars();
spawnTraffic();

/* ================= police ================= */
function addWanted(n){S.wanted=clamp(S.wanted+n,0,5);if(S.wanted>=3&&!S.roadblocks.length)spawnRoadblocks();if(S.wanted>=4&&!S.heli)S.heli={x:S.x,y:S.y-400,angle:0};}
function spawnRoadblocks(){
  S.roadblocks=[];
  for(let i=0;i<3;i++){const rx=ROAD_X[2+i*2],ry=ROAD_Y[1+i];
    S.roadblocks.push({x:rx,y:ry});}
}
function policeTick(dt){
  // decay wanted when far from police & not committing crimes
  S._wantedT=(S._wantedT||0)+dt;
  if(S._wantedT>14&&S.wanted>0){S._wantedT=0;S.wanted--;if(S.wanted<3)S.roadblocks=[];if(S.wanted<4)S.heli=null;}
  // spawn chase cops up to wanted level
  const want=Math.min(S.wanted,4);
  while(S.cops.length<want){
    const a=rng()*Math.PI*2;
    S.cops.push({x:S.x+Math.cos(a)*500,y:S.y+Math.sin(a)*500,angle:a,speed:340,onFoot:false});
  }
  while(S.cops.length>want)S.cops.pop();
  for(const c of S.cops){
    const a=angTo(c.x,c.y,S.x,S.y); c.angle+=clamp(((a-c.angle+Math.PI*3)%(Math.PI*2))-Math.PI,-2.4*dt,2.4*dt);
    c.x+=Math.cos(c.angle)*c.speed*dt; c.y+=Math.sin(c.angle)*c.speed*dt;
    if(dist(c.x,c.y,S.x,S.y)<26){ // busted / rammed
      if(S.onFoot){S.health-=25*dt; if(S.health<=0)gameOver("Polisi menangkapmu di jalanan.");}
      else {S.health-=8*dt; S.speed*=0.98; if(S.health<=0)gameOver("Mobilmu dihancurkan polisi.");}
      S.shake=6;
    }
  }
  if(S.heli){
    S.heli.x=lerp(S.heli.x,S.x,dt*0.9); S.heli.y=lerp(S.heli.y,S.y-40,dt*0.9);
    if(S.wanted<4)S.heli=null;
  }
}

/* ================= economy ================= */
function tryInteract(){
  // shops & places within 70px
  const near=(p)=>dist(S.x,S.y,p.x,p.y)<80;
  if(near(PLACES.gunshop))return openShop("gun");
  if(near(PLACES.garage))return openShop("garage");
  if(near(PLACES.spray)){
    if(S.money>=200&&S.wanted>0){S.money-=200;S.wanted=0;S.roadblocks=[];S.heli=null;S.cops=[];toast("Pay N' Spray: wanted bersih! -$200");}
    else toast(S.wanted===0?"Tidak ada wanted.":"Butuh $200 untuk Pay N' Spray.");
    return;
  }
  if(near(PLACES.safehouse)){S.health=100;saveGame();toast("Safehouse: HP penuh, game tersimpan.");return;}
  // enter/exit car
  if(S.onFoot){
    let best=null,bd=70;
    for(const p of PARKED){if(!p.taken&&dist(S.x,S.y,p.x,p.y)<bd){bd=dist(S.x,S.y,p.x,p.y);best=p;}}
    if(best){best.taken=true;S.car={model:best.model,angle:best.angle};S.onFoot=false;S.speed=0;S.carsStolen++;addWanted(1);toast("Mobil diambil: "+best.model.name+"  (+1 ★)");return;}
    for(const t of S.traffic){if(dist(S.x,S.y,t.x,t.y)<60){S.car={model:t.model,angle:t.angle};S.onFoot=false;S.speed=0;S.carsStolen++;addWanted(1);toast("Mobil dibajak: "+t.model.name+"  (+1 ★)");return;}}
  } else {
    S.onFoot=true;S.car=null;S.speed=0;
    PARKED.push({x:S.x+20,y:S.y,angle:S.angle,model:CAR_MODELS[0],taken:false});
  }
}
function openShop(kind){
  const sh=document.getElementById("shop"), items=document.getElementById("shopItems");
  document.getElementById("shopTitle").textContent=kind==="gun"?"AMMU-NATION — TOKO SENJATA":"GARAGE — UPGRADE";
  items.innerHTML="";
  const rows=kind==="gun"?[
    ["Pistol + 24 peluru","$300",()=>{if(S.money>=300){S.money-=300;S.hasGun=true;S.ammo+=24;toast("Pistol dibeli!");}else toast("Uang tidak cukup.");}],
    ["Peluru x24","$80",()=>{if(S.money>=80){S.money-=80;S.ammo+=24;toast("+24 peluru");}else toast("Uang tidak cukup.");}],
    ["Rompi anti peluru (+50 HP)","$150",()=>{if(S.money>=150){S.money-=150;S.health=Math.min(100,S.health+50);toast("Rompi dipakai");}else toast("Uang tidak cukup.");}],
  ]:[
    ["Upgrade Mesin Lv"+(S.engineLvl+1)+" (+40 top speed)","$"+(800*(S.engineLvl+1)),()=>{if(S.money>=800*(S.engineLvl+1)){S.money-=800*(S.engineLvl+1);S.engineLvl++;toast("Mesin Lv"+S.engineLvl);}else toast("Uang tidak cukup.");}],
    ["Upgrade Armor Lv"+(S.armorLvl+1)+" (mobil lebih kuat)","$"+(600*(S.armorLvl+1)),()=>{if(S.money>=600*(S.armorLvl+1)){S.money-=600*(S.armorLvl+1);S.armorLvl++;toast("Armor Lv"+S.armorLvl);}else toast("Uang tidak cukup.");}],
    ["Ganti mobil: Falco Sport","$6000",()=>{if(S.money>=6000){S.money-=6000;S.car={model:CAR_MODELS[3],angle:S.angle};S.onFoot=false;toast("Falco Sport milikmu!");}else toast("Uang tidak cukup.");}],
  ];
  for(const [label,price,fn] of rows){
    const d=document.createElement("div");d.className="shoprow";
    d.innerHTML="<span>"+label+"</span><b>"+price+"</b>";
    const b=document.createElement("button");b.className="btn";b.style.cssText="padding:6px 16px;font-size:14px;margin:0";b.textContent="Beli";
    b.onclick=()=>{fn();refreshShop();};
    d.appendChild(b);items.appendChild(d);
  }
  function refreshShop(){}
  sh.classList.remove("hidden");S.paused=true;
}
document.getElementById("shopClose").onclick=()=>{document.getElementById("shop").classList.add("hidden");S.paused=false;};

/* ================= save / load ================= */
function saveGame(){
  try{localStorage.setItem(SAVE_KEY,JSON.stringify({money:S.money,coins:S.coins,missionIdx:S.missionIdx,branch:S.branch,day:S.day,health:S.health,engineLvl:S.engineLvl,armorLvl:S.armorLvl,hasGun:S.hasGun,ammo:S.ammo,x:S.x,y:S.y}));}catch(e){}
}
function loadGame(){
  try{const d=JSON.parse(localStorage.getItem(SAVE_KEY)||"null");if(!d)return false;
    S.money=d.money;S.coins=d.coins;S.missionIdx=d.missionIdx;S.branch=d.branch;S.day=d.day;S.health=d.health;S.engineLvl=d.engineLvl;S.armorLvl=d.armorLvl;S.hasGun=d.hasGun;S.ammo=d.ammo;S.x=d.x;S.y=d.y;return true;}catch(e){return false;}
}
/* ================= input ================= */
const keys={};
let mouseX=innerWidth/2, mouseY=innerHeight/2, autoPilot=false, autoPath=[], autoIdx=0;
addEventListener("keydown",e=>{
  keys[e.key.toLowerCase()]=true;
  if(e.key==="e"||e.key==="E")tryInteract();
  if(e.key==="f"||e.key==="F")punch();
  if(e.key==="g"||e.key==="G")shoot();
  if(e.key==="p"||e.key==="P"){S.paused=!S.paused;toast(S.paused?"JEDA":"Lanjut!");}
  if(e.key==="m"||e.key==="M"){const m=curMission2();toast(m?m.name+": "+m.obj:"Semua misi selesai!");}
  if(e.key==="r"||e.key==="R")cycleRadio();
  if(e.key==="1")setRadio(1); if(e.key==="2")setRadio(2); if(e.key==="3")setRadio(3);
  if(e.key==="0")setRadio(0);
  if(e.key===" "){e.preventDefault(); if(!S.onFoot)S.speed*=0.9;}
  if(e.key==="Tab"){e.preventDefault(); toggleAutopilot();}
});
addEventListener("keyup",e=>{keys[e.key.toLowerCase()]=false;});
addEventListener("mousemove",e=>{mouseX=e.clientX;mouseY=e.clientY;});
addEventListener("mousedown",e=>{if(S.started&&!S.paused)shoot();});
function toggleAutopilot(){
  const t=missionTarget(); if(!t){toast("Tidak ada tujuan misi.");return;}
  if(autoPilot){autoPilot=false;toast("Autopilot mati.");return;}
  autoPath=graphPath(S.x,S.y,t.x,t.y); autoIdx=0; autoPilot=true;
  toast("GPS Autopilot: mengikuti jalan ke tujuan.");
}
function punch(){
  if(!S.onFoot)return;
  for(const p of S.peds){if(dist(S.x,S.y,p.x,p.y)<46){p.x+=(S.x-p.x)*-2;p.y+=(S.y-p.y)*-2;addWanted(1);toast("Kamu memukul pejalan kaki! (+1 ★)");return;}}
  for(const c of S.cops){if(dist(S.x,S.y,c.x,c.y)<50){S.cops.splice(S.cops.indexOf(c),1);S.kills++;addWanted(1);toast("Polisi dipukul jatuh! (+1 ★)");return;}}
}
function shoot(){
  if(!S.hasGun||S.ammo<=0){if(!S.hasGun)toast("Kamu belum punya pistol — beli di Ammu-Nation.");return;}
  S.ammo--;
  const a=S.onFoot?angTo(S.x,S.y,mouseX+ S.camX - innerWidth/2, mouseY + S.camY - innerHeight/2):S.angle;
  S.bullets=S.bullets||[];
  S.bullets.push({x:S.x+Math.cos(a)*24,y:S.y+Math.sin(a)*24,angle:a,life:0.6});
  playShot();
  for(const c of S.cops){if(dist(S.x,S.y,c.x,c.y)<420&&Math.abs(((angTo(S.x,S.y,c.x,c.y)-a+Math.PI*3)%(Math.PI*2))-Math.PI)<0.12){S.cops.splice(S.cops.indexOf(c),1);S.kills++;addWanted(1);toast("Polisi tertembak! (+1 ★)");return;}}
}

/* ================= radio (WebAudio, 3 stations, adaptive) ================= */
let AC=null, radioNodes=null, radioTimer=0;
const STATIONS=[null,
  {name:"VELMARA FM — Pop Emas", base:220, scale:[0,2,4,7,9], bpm:132},
  {name:"GOLD 88 — Funk Jalanan", base:110, scale:[0,3,5,7,10], bpm:104},
  {name:"NIGHT DRIVE — Synth Malam", base:165, scale:[0,2,5,7,10], bpm:96},
];
function ensureAudio(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}if(AC&&AC.state==="suspended")AC.resume();}
function setRadio(n){S.radio=n;ensureAudio();stopRadio();
  document.getElementById("radio").textContent=n===0?"RADIO: OFF — tekan 1/2/3":"RADIO: "+STATIONS[n].name;
  if(n>0)toast(STATIONS[n].name);}
function cycleRadio(){setRadio((S.radio+1)%4);}
function stopRadio(){if(radioNodes){try{radioNodes.gain.gain.value=0;}catch(e){}radioNodes=null;}}
function radioTick(dt){
  if(!AC||S.radio===0||!S.started||S.paused)return;
  radioTimer-=dt;
  if(radioTimer>0)return;
  const st=STATIONS[S.radio];
  const energy=clamp(0.6+S.wanted*0.12+(S.onFoot?0:Math.abs(S.speed)/500),0.6,1.6);
  const beat=60/st.bpm/energy;
  radioTimer=beat;
  const step=Math.floor(performance.now()/1000*st.bpm/60)%16;
  const scale=st.scale;
  const note=scale[step%scale.length]+12*Math.floor(step/8)%2;
  const freq=st.base*Math.pow(2,note/12);
  const o=AC.createOscillator(), g=AC.createGain();
  o.type=S.radio===3?"sawtooth":(S.radio===2?"square":"triangle");
  o.frequency.value=freq; g.gain.value=0.05;
  g.gain.exponentialRampToValueAtTime(0.0001,AC.currentTime+beat*0.9);
  o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime+beat);
  if(step%4===0){const o2=AC.createOscillator(),g2=AC.createGain();
    o2.type="sine";o2.frequency.value=st.base/2;g2.gain.value=0.09;
    g2.gain.exponentialRampToValueAtTime(0.0001,AC.currentTime+beat*1.8);
    o2.connect(g2);g2.connect(AC.destination);o2.start();o2.stop(AC.currentTime+beat*1.9);}
}
function playShot(){if(!AC)return;const o=AC.createOscillator(),g=AC.createGain();
  o.type="square";o.frequency.setValueAtTime(900,AC.currentTime);o.frequency.exponentialRampToValueAtTime(90,AC.currentTime+0.12);
  g.gain.setValueAtTime(0.12,AC.currentTime);g.gain.exponentialRampToValueAtTime(0.0001,AC.currentTime+0.13);
  o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+0.14);}

/* ================= update ================= */
let lastT=performance.now();
function toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.style.opacity=1;S.toastT=2.5;}
function gameOver(text){
  S.over=true;S.paused=true;
  document.getElementById("overText").textContent=text+" Uangmu berkurang $200, kamu bangun di safehouse.";
  document.getElementById("gameover").classList.remove("hidden");
}
document.getElementById("respawnBtn").onclick=()=>{
  document.getElementById("gameover").classList.add("hidden");
  S.over=false;S.paused=false;S.health=100;S.wanted=0;S.cops=[];S.roadblocks=[];S.heli=null;
  S.x=PLACES.safehouse.x;S.y=PLACES.safehouse.y;S.money=Math.max(0,S.money-200);S.onFoot=true;S.car=null;
};
function update(dt){
  if(!S.started||S.paused||S.over)return;
  // day/night clock: 1 game-hour = 20 real seconds
  S.clockMin+=dt*3; if(S.clockMin>=1440){S.clockMin-=1440;S.day++;}
  const hr=S.clockMin/60; S.night=(hr<6||hr>=19);
  // movement
  let mx=0,my=0;
  if(keys["w"]||keys["arrowup"])my-=1; if(keys["s"]||keys["arrowdown"])my+=1;
  if(keys["a"]||keys["arrowleft"])mx-=1; if(keys["d"]||keys["arrowright"])mx+=1;
  if(autoPilot&&!S.onFoot){
    const wp=autoPath[autoIdx];
    if(wp){const d=dist(S.x,S.y,wp.x,wp.y);
      if(d<40){autoIdx++; if(autoIdx>=autoPath.length){autoPilot=false;toast("Autopilot: sampai tujuan.");}}
      else {const a=angTo(S.x,S.y,wp.x,wp.y);let da=((a-S.angle+Math.PI*3)%(Math.PI*2))-Math.PI;
        S.angle+=clamp(da,-2.2*dt,2.2*dt); S.speed=lerp(S.speed,220,dt*1.5);}
    }
  } else if(S.onFoot){
    if(mx||my){const a=Math.atan2(my,mx);S.angle=a;
      const sp=190; const nx=S.x+Math.cos(a)*sp*dt, ny=S.y+Math.sin(a)*sp*dt;
      if(!collideBuildings(nx,S.y,14))S.x=nx; if(!collideBuildings(S.x,ny,14))S.y=ny;}
  } else {
    const mdl=S.car.model;
    const top=mdl.top+S.engineLvl*40, acc=mdl.acc;
    if(my<0)S.speed+=acc*dt; if(my>0)S.speed-=acc*1.4*dt;
    if(!my)S.speed*=Math.pow(0.4,dt);
    S.speed=clamp(S.speed,-120,top);
    if(mx)S.angle+=mx*1.9*dt*(S.speed>=0?1:-1)*clamp(Math.abs(S.speed)/120,0.25,1);
    const nx=S.x+Math.cos(S.angle)*S.speed*dt, ny=S.y+Math.sin(S.angle)*S.speed*dt;
    const hit=collideBuildings(nx,ny,16);
    if(hit){S.speed*=0.4;S.shake=4;S.health-=2;}
    else {S.x=nx;S.y=ny;}
    // roadblock collision
    for(const rb of S.roadblocks){if(dist(S.x,S.y,rb.x,rb.y)<34){S.speed*=-0.3;S.health-=6;S.shake=8;addWanted(0);}}
  }
  S.x=clamp(S.x,20,WORLD_W-20); S.y=clamp(S.y,20,WORLD_H-20);
  // camera
  S.camX=clamp(S.x-innerWidth/2,0,WORLD_W-innerWidth); S.camY=clamp(S.y-innerHeight/2,0,WORLD_H-innerHeight);
  if(S.shake>0)S.shake=Math.max(0,S.shake-dt*20);
  // traffic
  for(const t of S.traffic){
    const lane=t.horiz?{x:t.x+t.dir*t.speed*dt,y:t.y}:{x:t.x,y:t.y+t.dir*t.speed*dt};
    t.x=lane.x;t.y=lane.y;
    if(t.x<0)t.x=WORLD_W; if(t.x>WORLD_W)t.x=0; if(t.y<0)t.y=WORLD_H; if(t.y>WORLD_H)t.y=0;
    if(!t.horiz&&Math.abs(t.y-nearestRoadY(t.y))>200)t.y=nearestRoadY(t.y);
    if(t.horiz&&Math.abs(t.x-nearestRoadX(t.x))>200)t.x=nearestRoadX(t.x);
  }
  for(const p of S.peds){
    p.walkT-=dt; if(p.walkT<=0){p.angle=rng()*Math.PI*2;p.walkT=2+rng()*4;}
    const nx=p.x+Math.cos(p.angle)*p.speed*dt, ny=p.y+Math.sin(p.angle)*p.speed*dt;
    if(!collideBuildings(nx,ny,10)&&nx>20&&nx<WORLD_W-20&&ny>20&&ny<WORLD_H-20){p.x=nx;p.y=ny;}
  }
  // bullets
  if(S.bullets){for(const b of S.bullets){b.x+=Math.cos(b.angle)*700*dt;b.y+=Math.sin(b.angle)*700*dt;b.life-=dt;}
    S.bullets=S.bullets.filter(b=>b.life>0);}
  // coins
  for(const c of COINS){if(!c.got&&dist(S.x,S.y,c.x,c.y)<30){c.got=true;S.coins++;S.money+=100;toast("KOIN EMAS! ("+S.coins+"/24)  +$100");}}
  // police
  policeTick(dt);
  // radio
  radioTick(dt);
  // toast timer
  if(S.toastT>0){S.toastT-=dt; if(S.toastT<=0)document.getElementById("toast").style.opacity=0;}
  checkMission(dt);
  // autosave every 60s
  S._saveT=(S._saveT||0)+dt; if(S._saveT>60){S._saveT=0;saveGame();}
}
function checkMission(dt){
  const m=curMission2(); if(!m)return;
  const t=missionTarget();
  if(m.kind==="goto"&&t&&dist(S.x,S.y,t.x,t.y)<46)advanceMission();
  else if(m.kind==="coins"&&S._coinMark!==undefined){}
  else if(m.kind==="coins"){if(!S._coinStart)S._coinStart=S.coins; if(S.coins-S._coinStart>=3){S._coinStart=undefined;advanceMission();}}
  else if(m.kind==="taxi"){
    if(S.taxiActive&&S.passenger&&!S.passenger.picked&&dist(S.x,S.y,PLACES.taxiStand.x,PLACES.taxiStand.y)<50){
      S.passenger.picked=true; toast("Penumpang naik! Antar ke tujuan (GPS: Tab).");
    }
    if(S.passenger&&S.passenger.picked&&dist(S.x,S.y,S.passenger.dest.x,S.passenger.dest.y)<50){
      const fare=Math.round((120+rng()*80)*(S.night?2:1)); S.money+=fare; S.passenger.paid=true;
      toast("Tarif dibayar: "+fmtMoney(fare)+(S.night?" (2x malam!)":"")); advanceMission();
    }
  }
  else if(m.kind==="race"){
    if(S.raceActive){S.raceTime+=dt;
      const cp=S.checkpoints[S.raceCp];
      if(cp&&dist(S.x,S.y,cp.x,cp.y)<60){S.raceCp++;toast("Checkpoint "+S.raceCp+"/"+S.checkpoints.length);
        if(S.raceCp>=S.checkpoints.length){toast("BALAPAN MENANG! Waktu "+S.raceTime.toFixed(1)+" dtk");advanceMission();}}
      if(S.raceTime>180){toast("Balapan gagal — waktu habis. Coba lagi.");S.raceCp=0;S.raceTime=0;setupRace(m);}
    }
  }
  else if(m.kind==="gunshop"&&S.hasGun)advanceMission();
  else if(m.kind==="branch"&&dist(S.x,S.y,m.target.x,m.target.y)<50){S.missionIdx=S.missionIdx;advanceMission();}
  else if(m.kind==="escape"){ if(S.wanted>=3)S._escArmed=true; if(S._escArmed&&S.wanted===0){S._escArmed=false;advanceMission();} }
}
/* ================= render ================= */
function drawCar(x,y,angle,color,model){
  ctx.save(); ctx.translate(x,y); ctx.rotate(angle);
  ctx.fillStyle="rgba(0,0,0,.35)"; ctx.fillRect(-20,-12,44,28);
  ctx.fillStyle=color; ctx.fillRect(-20,-11,40,22);
  ctx.fillStyle="rgba(20,30,50,.85)"; ctx.fillRect(-6,-10,14,20);
  ctx.fillStyle="#ffe9a8"; ctx.fillRect(17,-9,3,5); ctx.fillRect(17,4,3,5);
  ctx.fillStyle="#d03030"; ctx.fillRect(-21,-9,3,5); ctx.fillRect(-21,4,3,5);
  ctx.restore();
}
function drawPerson(x,y,angle,hue,scale){
  scale=scale||1;
  ctx.save(); ctx.translate(x,y); ctx.rotate(angle); ctx.scale(scale,scale);
  ctx.fillStyle="hsl("+hue+",60%,45%)"; ctx.beginPath(); ctx.arc(0,0,9,0,7); ctx.fill();
  ctx.fillStyle="#f0c8a0"; ctx.beginPath(); ctx.arc(7,0,5,0,7); ctx.fill();
  ctx.restore();
}
function render(){
  const camX=S.camX+(S.shake? (Math.random()-0.5)*S.shake:0);
  const camY=S.camY+(S.shake? (Math.random()-0.5)*S.shake:0);
  // sky/ground base
  ctx.fillStyle="#1d2b1d"; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.save(); ctx.translate(-camX,-camY);
  // districts
  for(const d of DISTRICTS){
    ctx.fillStyle=d.color; ctx.fillRect(d.x,d.y,d.w,d.h);
    ctx.fillStyle="rgba(255,255,255,.08)";
    ctx.font="bold 34px Arial"; ctx.fillText(d.name,d.x+24,d.y+52);
  }
  // ground texture dots (deterministic)
  ctx.fillStyle="rgba(0,0,0,.12)";
  const dr=mulberry32(99);
  for(let i=0;i<300;i++){const x=dr()*WORLD_W,y=dr()*WORLD_H;ctx.fillRect(x,y,3,3);}
  // roads
  ctx.fillStyle="#33363d";
  for(const rx of ROAD_X)ctx.fillRect(rx-26,0,52,WORLD_H);
  for(const ry of ROAD_Y)ctx.fillRect(0,ry-26,WORLD_W,52);
  ctx.strokeStyle="#e8c96a"; ctx.setLineDash([18,14]); ctx.lineWidth=2;
  for(const rx of ROAD_X){ctx.beginPath();ctx.moveTo(rx,0);ctx.lineTo(rx,WORLD_H);ctx.stroke();}
  for(const ry of ROAD_Y){ctx.beginPath();ctx.moveTo(0,ry);ctx.lineTo(WORLD_W,ry);ctx.stroke();}
  ctx.setLineDash([]);
  // roadblocks
  for(const rb of S.roadblocks){
    ctx.fillStyle="#d03030"; ctx.fillRect(rb.x-30,rb.y-10,60,20);
    ctx.fillStyle="#fff"; ctx.font="bold 12px Arial"; ctx.fillText("POLICE",rb.x-24,rb.y+4);
  }
  // buildings
  for(const b of BUILDINGS){
    ctx.fillStyle="hsl("+b.hue+",30%,32%)"; ctx.fillRect(b.x,b.y,b.w,b.h);
    ctx.fillStyle="hsl("+b.hue+",35%,42%)"; ctx.fillRect(b.x+4,b.y+4,b.w-8,10);
    ctx.fillStyle="rgba(255,220,120,.75)";
    for(let wx=b.x+10;wx<b.x+b.w-10;wx+=22)for(let wy=b.y+22;wy<b.y+b.h-8;wy+=20)ctx.fillRect(wx,wy,8,10);
  }
  // places
  const placeList=[PLACES.safehouse,PLACES.garage,PLACES.gunshop,PLACES.spray,PLACES.taxiStand,PLACES.raceStart];
  for(const p of placeList){
    ctx.fillStyle="#ffd94a"; ctx.beginPath(); ctx.arc(p.x,p.y,16,0,7); ctx.fill();
    ctx.fillStyle="#111"; ctx.font="bold 11px Arial"; ctx.textAlign="center"; ctx.fillText(p.label[0],p.x,p.y+4);
    ctx.fillStyle="#fff"; ctx.font="12px Arial"; ctx.fillText(p.label,p.x,p.y-24); ctx.textAlign="left";
  }
  // coins
  for(const c of COINS){ if(c.got)continue;
    ctx.fillStyle="#ffd94a"; ctx.beginPath(); ctx.arc(c.x,c.y,9,0,7); ctx.fill();
    ctx.fillStyle="#a87b00"; ctx.font="bold 11px Arial"; ctx.textAlign="center"; ctx.fillText("$",c.x,c.y+4); ctx.textAlign="left";
  }
  // parked cars
  for(const p of PARKED){ if(!p.taken)drawCar(p.x,p.y,p.angle,p.model.color,p.model); }
  // traffic
  for(const t of S.traffic)drawCar(t.x,t.y,t.angle,t.color,t.model);
  // peds
  for(const p of S.peds)drawPerson(p.x,p.y,p.angle,p.hue,1);
  // cops
  for(const c of S.cops){drawCar(c.x,c.y,c.angle,"#20386b",CAR_MODELS[0]);
    ctx.fillStyle="#fff";ctx.font="bold 10px Arial";ctx.textAlign="center";ctx.fillText("POLICE",c.x,c.y-18);ctx.textAlign="left";}
  // bullets
  if(S.bullets){ctx.fillStyle="#ffe27a";for(const b of S.bullets){ctx.beginPath();ctx.arc(b.x,b.y,3,0,7);ctx.fill();}}
  // player
  if(S.onFoot)drawPerson(S.x,S.y,S.angle,210,1.15);
  else if(S.car)drawCar(S.x,S.y,S.angle,S.car.model.color,S.car.model);
  // mission marker
  const t=missionTarget();
  if(t&&S.started){
    const pulse=1+Math.sin(performance.now()/200)*0.15;
    ctx.strokeStyle="#ffd94a"; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(t.x,t.y,26*pulse,0,7); ctx.stroke();
    ctx.fillStyle="#ffd94a"; ctx.beginPath(); ctx.moveTo(t.x,t.y-40); ctx.lineTo(t.x-8,t.y-24); ctx.lineTo(t.x+8,t.y-24); ctx.fill();
    // guide line from player
    ctx.strokeStyle="rgba(255,217,74,.5)"; ctx.setLineDash([8,8]); ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(S.x,S.y); ctx.lineTo(t.x,t.y); ctx.stroke(); ctx.setLineDash([]);
  }
  // heli + spotlight
  if(S.heli){
    ctx.fillStyle="rgba(255,255,200,.14)"; ctx.beginPath(); ctx.arc(S.x,S.y,120,0,7); ctx.fill();
    ctx.fillStyle="#444"; ctx.beginPath(); ctx.arc(S.heli.x,S.heli.y,16,0,7); ctx.fill();
    ctx.fillStyle="#fff"; ctx.font="bold 10px Arial"; ctx.textAlign="center"; ctx.fillText("HELI",S.heli.x,S.heli.y-22); ctx.textAlign="left";
  }
  ctx.restore();
  // day/night overlay
  const hr=S.clockMin/60;
  let dark=0;
  if(hr<5||hr>=20)dark=0.45; else if(hr<7)dark=0.25; else if(hr>=18)dark=0.3;
  if(dark>0){ctx.fillStyle="rgba(8,10,40,"+dark+")";ctx.fillRect(0,0,canvas.width,canvas.height);}
  drawMinimap(); drawHUD();
}
function drawMinimap(){
  const sx=220/WORLD_W, sy=160/WORLD_H;
  mmc.fillStyle="#101418"; mmc.fillRect(0,0,220,160);
  for(const d of DISTRICTS){mmc.fillStyle=d.color;mmc.fillRect(d.x*sx,d.y*sy,d.w*sx,d.h*sy);}
  mmc.strokeStyle="#888"; mmc.lineWidth=1;
  for(const rx of ROAD_X){mmc.beginPath();mmc.moveTo(rx*sx,0);mmc.lineTo(rx*sx,160);mmc.stroke();}
  for(const ry of ROAD_Y){mmc.beginPath();mmc.moveTo(0,ry*sy);mmc.lineTo(220,ry*sy);mmc.stroke();}
  const t=missionTarget();
  if(t){mmc.fillStyle="#ffd94a";mmc.beginPath();mmc.arc(t.x*sx,t.y*sy,5,0,7);mmc.fill();}
  mmc.fillStyle="#fff"; mmc.beginPath(); mmc.arc(S.x*sx,S.y*sy,4,0,7); mmc.fill();
  mmc.fillStyle="#ff4040";
  for(const c of S.cops){mmc.beginPath();mmc.arc(c.x*sx,c.y*sy,2.5,0,7);mmc.fill();}
}
function drawHUD(){
  document.getElementById("money").textContent=fmtMoney(S.money)+"  ·  Koin "+S.coins+"/24";
  document.getElementById("healthfill").style.width=S.health+"%";
  let stars=""; for(let i=0;i<5;i++)stars+=i<S.wanted?"★":'<span class="off">★</span>';
  document.getElementById("stars").innerHTML=stars;
  const hr=Math.floor(S.clockMin/60), mn=Math.floor(S.clockMin%60);
  document.getElementById("clock").textContent="Day "+S.day+" · "+String(hr).padStart(2,"0")+":"+String(mn).padStart(2,"0")+(S.night?" · MALAM":" · SIANG")+" · "+districtAt(S.x,S.y).name;
  document.getElementById("ammo").textContent=S.hasGun?("🔫 Peluru: "+S.ammo):"";
  const m=curMission2();
  document.getElementById("missionTitle").textContent=m?("MISI "+m.id+" — "+m.name):"SEMUA MISI SELESAI";
  document.getElementById("missionObj").textContent=m?m.obj:"Velmara milikmu, Riko.";
  // compass
  const dirs=["N","NE","E","SE","S","SW","W","NW"];
  const deg=((S.angle*180/Math.PI)%360+360)%360;
  document.getElementById("compass").textContent=dirs[Math.round(deg/45)%8]+"  "+Math.round(deg)+"°";
  // speedo
  document.getElementById("speedo").textContent=S.onFoot?"Jalan kaki":((S.car?S.car.model.name:"")+" · "+Math.round(Math.abs(S.speed)*0.36)+" km/h"+(autoPilot?" · AUTOPILOT":""));
}
/* ================= main loop ================= */
function loop(now){
  const dt=Math.min(0.05,(now-lastT)/1000); lastT=now;
  update(dt); render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* ================= menu wiring ================= */
document.getElementById("playBtn").onclick=()=>{
  ensureAudio(); S.started=true; showAct(1);
  document.getElementById("menu").classList.add("hidden");
  if(curMission2()&&curMission2().kind==="taxi")setupTaxi();
  toast("Misi 1: Temui Marisol di Old Port");
};
document.getElementById("continueBtn").onclick=()=>{
  if(loadGame()){ensureAudio();S.started=true;document.getElementById("menu").classList.add("hidden");toast("Save dimuat — lanjutkan, Riko.");}
  else toast("Belum ada save.");
};
/* ================= test hooks (for headless verification) ================= */
window.VELMARA={
  state:S, missions:MISSIONS, districts:DISTRICTS, cars:CAR_MODELS,
  start(){document.getElementById("playBtn").click();},
  teleport(x,y){S.x=x;S.y=y;},
  completeMission(){const m=curMission2();if(!m)return false;advanceMission();return true;},
  mission(){const m=curMission2();return m?{id:m.id,name:m.name,kind:m.kind}:null;},
  setMoney(n){S.money=n;},
  addCoins(n){for(let i=0;i<n;i++){const c=COINS.find(c=>!c.got);if(c)c.got=true,S.coins++;}},
};
</script>
</body>
</html>`;

writeFileSync(join(outDir, "index.html"), html);
console.log("wrote " + join(outDir, "index.html") + " (" + html.length + " bytes)");

