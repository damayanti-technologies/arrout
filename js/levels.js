/* ---- js/levels.js ---- */
// Arrout level generator: tiers, shapes, arrow lengths (big/straight arrows), solvability.
// Loaded by Arrout.html via <script src="levels.js"><\/script>. Keep both files in the same folder.
// Uses globals from Arrout.html: D, cols, rows, grid, arrows, curCfg, mul, hs.

var D = (typeof window !== 'undefined' && window.D) ? window.D : [[0, -1], [1, 0], [0, 1], [-1, 0]];
var cols = (typeof window !== 'undefined' && window.cols) ? window.cols : 11;
var rows = (typeof window !== 'undefined' && window.rows) ? window.rows : 15;
var grid = (typeof window !== 'undefined' && window.grid) ? window.grid : [];
var arrows = (typeof window !== 'undefined' && window.arrows) ? window.arrows : [];
var curCfg = (typeof window !== 'undefined' && window.curCfg) ? window.curCfg : null;

var hs = (typeof window !== 'undefined' && window.hs) ? window.hs : function(s) {
  var h = 2166136261;
  for (var i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

var mul = (typeof window !== 'undefined' && window.mul) ? window.mul : function(a) {
  return function() {
    a |= 0;
    a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
};

if (typeof window !== 'undefined') {
  window.D = D;
  window.hs = hs;
  window.mul = mul;
}

// Arrout level generator: tiers, shapes, arrow lengths (big/straight arrows), solvability.
// Loaded by Arrout.html via <script src="levels.js"><\/script>. Keep both files in the same folder.
// Uses globals from Arrout.html: D, cols, rows, grid, arrows, curCfg, mul, hs.
const P=['Easy','Easy','Medium','Easy','Medium','Hard','Medium','Hard','Easy','Expert'],TIER={Easy:[11,4,15],Medium:[13,5,18],Hard:[16,6,21],Expert:[19,7,24]};
let LEN=0;
function tile(mask,maxL,big){
  const g=Array.from({length:rows},(_,y)=>Array.from({length:cols},(_,x)=>mask(x,y,cols,rows)?-1:-2));
  const fr=(x,y)=>x>=0&&y>=0&&x<cols&&y<rows&&g[y][x]==-1;
  const deg=(x,y)=>D.reduce((n,d)=>n+fr(x+d[0],y+d[1]),0);
  const sn=[];
  for(;;){
    let best=null,bd=9;
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)if(g[y][x]==-1){const d=deg(x,y)+Math.random()*.9;if(d<bd){bd=d;best=[x,y]}}
    if(!best)break;
    const id=sn.length,p=[best];g[best[1]][best[0]]=id;
    const bg=big&&Math.random()<big.p,len=bg?big.min+Math.floor(Math.random()*(big.max-big.min+1)):2+Math.floor(Math.random()*(maxL-1));
    let pd=-1;
    while(p.length<len){
      const [x,y]=p[p.length-1];let o=null,od=9,ok_=-1;
      for(let k=0;k<4;k++){const d=D[k],nx=x+d[0],ny=y+d[1];if(fr(nx,ny)){const q=bg?Math.random()*.5-(pd>=0&&k===pd?4:0)+(pd>=0&&k!==pd&&k%2==pd%2?5:0):deg(nx,ny)+Math.random()*1.5-(pd>=0&&k!==pd?2.6:0);if(q<od){od=q;o=[nx,ny];ok_=k}}}
      if(!o)break;pd=ok_;p.push(o);g[o[1]][o[0]]=id;
    }
    if(p.length<2){
      let ok=false;
      for(const d of D){const nx=best[0]+d[0],ny=best[1]+d[1];if(nx<0||ny<0||nx>=cols||ny>=rows||g[ny][nx]<0)continue;
        const s=sn[g[ny][nx]],a=s[0],b=s[s.length-1];
        if(a[0]==nx&&a[1]==ny){s.unshift(best);ok=true;break}
        if(b[0]==nx&&b[1]==ny){s.push(best);ok=true;break}}
      if(!ok){if(!LEN)return null;g[best[1]][best[0]]=-2;continue}
      g[best[1]][best[0]]=g[best[1]+0][best[0]];
      const nid=sn.findIndex(s=>s.includes(best));g[best[1]][best[0]]=nid;continue;
    }
    sn.push(p);
  }
  return sn;
}
function dirOf(p){const a=p[p.length-2],b=p[p.length-1];return D.findIndex(v=>v[0]==b[0]-a[0]&&v[1]==b[1]-a[1])}
function freeIn(g,a){
  const h=a.p[a.p.length-1];let x=h[0]+D[a.dir][0],y=h[1]+D[a.dir][1];
  while(x>=0&&y>=0&&x<cols&&y<rows){if(g[y][x]>=0&&g[y][x]!==a.id)return false;x+=D[a.dir][0];y+=D[a.dir][1]}
  return true;
}
function stuck(list){
  const g=grid.map(r=>r.slice());let left=list.slice();
  for(;;){
    const rem=left.filter(a=>freeIn(g,a));
    if(!rem.length)return left;
    rem.forEach(a=>a.p.forEach(([x,y])=>g[y][x]=-1));
    left=left.filter(a=>!rem.includes(a));
    if(!left.length)return left;
  }
}
const SH={Square:[1,[['r',0,0,1,1]]],Rectangle:[1.5,[['r',0,0,1,1]]],Circle:[1,[['c',.5,.5,.5]]],
Diamond:[1,[['t',.5,0,1,.5,.5,1],['t',.5,0,0,.5,.5,1]]],Heart:[1,[['c',.3,.32,.27],['c',.7,.32,.27],['t',.03,.42,.97,.42,.5,.98]]],
Star:[1,[['t',.5,0,.95,.75,.05,.75],['t',.5,1,.05,.25,.95,.25]]],Triangle:[.9,[['t',.5,0,1,1,0,1]]],
Plus:[1,[['r',.35,0,.65,1],['r',0,.35,1,.65]]],Donut:[1,[['c',.5,.5,.5],['-c',.5,.5,.2]]],Moon:[1,[['c',.5,.5,.5],['-c',.7,.42,.4]]],
House:[1,[['r',.15,.45,.85,1],['t',.03,.47,.97,.47,.5,.05],['-r',.43,.7,.57,1]]],
Tree:[1.3,[['t',.5,0,.9,.55,.1,.55],['t',.5,.3,.98,.8,.02,.8],['r',.43,.8,.57,1]]],
Fish:[.65,[['e',.42,.5,.42,.32],['t',.78,.5,1,.1,1,.9],['-c',.22,.42,.04]]],
Cat:[1,[['c',.5,.58,.38],['t',.12,.08,.4,.25,.14,.55],['t',.88,.08,.6,.25,.86,.55],['-c',.36,.55,.05],['-c',.64,.55,.05]]],
Panda:[1,[['c',.5,.58,.4],['c',.17,.2,.15],['c',.83,.2,.15],['-c',.35,.52,.06],['-c',.65,.52,.06]]],
Bird:[.9,[['e',.45,.58,.38,.28],['c',.78,.3,.17],['t',.9,.26,1,.32,.9,.38],['t',.1,.5,0,.15,.22,.42]]],
Butterfly:[1,[['e',.27,.3,.26,.22],['e',.73,.3,.26,.22],['e',.3,.72,.2,.2],['e',.7,.72,.2,.2],['r',.45,.15,.55,.95]]],
Rabbit:[1.4,[['e',.5,.72,.32,.26],['e',.36,.25,.09,.25],['e',.64,.25,.09,.25]]],
Turtle:[.75,[['e',.5,.5,.38,.3],['c',.93,.5,.07],['c',.2,.88,.1],['c',.8,.88,.1],['c',.2,.12,.1],['c',.8,.12,.1]]],
Mushroom:[1,[['e',.5,.38,.5,.38],['r',.33,.5,.67,1]]],
Rocket:[1.5,[['r',.3,.2,.7,.8],['t',.3,.2,.7,.2,.5,0],['t',.3,.55,.3,.95,.08,.95],['t',.7,.55,.7,.95,.92,.95]]],
Car:[.55,[['r',.05,.45,.95,.75],['r',.25,.2,.7,.45],['c',.27,.78,.13],['c',.73,.78,.13]]],
Cup:[1.1,[['r',.1,.2,.7,.95],['c',.8,.5,.2],['-c',.8,.5,.1]]],
Hexagon:[.9,[['r',.25,0,.75,1],['t',.25,0,.25,1,0,.5],['t',.75,0,.75,1,1,.5]]],
Arrow:[1.2,[['r',.35,.4,.65,1],['t',.5,0,1,.5,0,.5]]],
Cloud:[.65,[['c',.3,.6,.25],['c',.55,.4,.3],['c',.78,.6,.22],['r',.3,.6,.78,.85]]],
Bulb:[1.3,[['c',.5,.38,.36],['r',.36,.7,.64,.95]]],
Boat:[.9,[['t',.5,0,.5,.58,.12,.58],['t',.55,.15,.55,.58,.9,.58],['t',.05,.62,.95,.62,.75,.95],['t',.05,.62,.25,.95,.75,.95]]],
Crown:[.8,[['r',.05,.5,.95,.95],['t',.05,.5,.05,.1,.3,.5],['t',.35,.5,.5,.05,.65,.5],['t',.7,.5,.95,.1,.95,.5]]],
Apple:[1,[['c',.35,.55,.33],['c',.65,.55,.33],['t',.5,.25,.6,.05,.7,.25]]],
Bottle:[1.6,[['r',.4,0,.6,.35],['e',.5,.65,.32,.33]]]};
const POOL=Object.keys(SH).concat(Array(8).fill('Square'),Array(3).fill('Rectangle'),['Circle','Diamond','Star']);
function maskOf(pr,ar){
  const T=(u,v,a,b,c,d,e,f)=>{const S=(x1,y1,x2,y2,x3,y3)=>(x1-x3)*(y2-y3)-(x2-x3)*(y1-y3),d1=S(u,v,a,b,c,d),d2=S(u,v,c,d,e,f),d3=S(u,v,e,f,a,b);return!((d1<0||d2<0||d3<0)&&(d1>0||d2>0||d3>0))};
  const In=(q,u,v)=>{const t=q[0].replace('-','');return t=='r'?u>=q[1]&&u<=q[3]&&v>=q[2]&&v<=q[4]:t=='c'?(u-q[1])**2+((v-q[2])*ar)**2<=q[3]*q[3]:t=='e'?((u-q[1])/q[3])**2+((v-q[2])/q[4])**2<=1:T(u,v,...q.slice(1))};
  return(x,y,c,r)=>{const u=(x+.5)/c,v=(y+.5)/r;let a=false;for(const q of pr){if(q[0][0]=='-'){if(In(q,u,v))return false}else if(!a&&In(q,u,v))a=true}return a}}
function cfg(L,tier){const R=mul(hs('lv'+L)),p=Math.min(L/300,1);
  if(!tier){const x=R(),t1=.05+.45*(1-p),t2=t1+.3,t3=t2+.2+.1*p;tier=L<=3||x<t1?'Easy':x<t2?'Medium':x<t3?'Hard':'Expert'}
  const nm=POOL[R()*POOL.length|0],S=SH[nm],T=TIER[tier],g=Math.min(Math.floor(L/60),6),mk=maskOf(S[1],S[0]);let fc=0;for(let y=0;y<40;y++)for(let x=0;x<40;x++)if(mk(x,y,40,40))fc++;
  const c0=Math.max(14,Math.min(30,Math.floor(46/S[0]),Math.ceil(Math.sqrt(({Easy:320,Medium:450,Hard:620,Expert:800}[tier]+Math.min(L*.5,300))/(Math.max(.2,fc/1600)*S[0])))));
  return{tier,name:nm,ar:S[0],prims:S[1],cols:c0,rows:Math.max(6,Math.round(c0*S[0])),maxL:Math.max(6,T[1]+(g>>2)),big:{p:.9,min:{Easy:8,Medium:8,Hard:10,Expert:12}[tier],max:{Easy:28,Medium:34,Hard:40,Expert:46}[tier]},ring:(nm=='Square'||nm=='Rectangle')&&tier!='Easy'&&L>=8&&R()<.7,bn:(tier=='Hard'||tier=='Expert')&&L>=12&&R()<Math.min(.1+L/1200,.4)}}
function construct(){
  const n=arrows.length,ray=(a,o)=>{const p=o?a.p0.slice().reverse():a.p0,h=p[p.length-1],q=p[p.length-2],dx=h[0]-q[0],dy=h[1]-q[1],ids=new Set();let x=h[0]+dx,y=h[1]+dy;
    while(x>=0&&y>=0&&x<cols&&y<rows){const g=grid[y][x];if(g>=0&&g!==a.id)ids.add(g);x+=dx;y+=dy}return ids};
  const R=arrows.map(a=>[ray(a,0),ray(a,1)]),dep=Array.from({length:n},()=>[]);
  R.forEach((rs,i)=>rs.forEach((r,o)=>r.forEach(j=>dep[j].push([i,o]))));
  const placed=new Set(),ori=Array(n).fill(0);let dead=false;
  const unl=c=>{let u=0;for(const[y,o]of dep[c]){if(placed.has(y))continue;let ok=true;for(const j of R[y][o])if(j!==c&&!placed.has(j)){ok=false;break}if(ok)u++}return u};
  const adj=Array.from({length:n},()=>new Set());
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const a=grid[y][x];if(a<0)continue;if(x+1<cols){const b=grid[y][x+1];if(b>=0&&b!==a){adj[a].add(b);adj[b].add(a)}}if(y+1<rows){const b=grid[y+1][x];if(b>=0&&b!==a){adj[a].add(b);adj[b].add(a)}}}
  const dirs=arrows.map(a=>[0,1].map(o=>{const p=o?a.p0.slice().reverse():a.p0,h=p[p.length-1],q=p[p.length-2];return D.findIndex(v=>v[0]==h[0]-q[0]&&v[1]==h[1]-q[1])}));
  const div=it=>{let c=0;for(const j of adj[it[0]])if(placed.has(j)&&dirs[j][ori[j]]===dirs[it[0]][it[1]])c++;return c};
  const best=l=>{let b=null,bs=-1e9;for(const it of l){const u=unl(it[0])-3*div(it)+Math.random();if(u>bs){bs=u;b=it}}return b};
  while(placed.size<n){const bl=[],fr=[];
    for(let i=0;i<n;i++){if(placed.has(i))continue;for(let o=0;o<2;o++){if(arrows[i].fx!==undefined&&arrows[i].fx!==o)continue;const r=R[i][o];if([...r].every(j=>placed.has(j)))(r.size?bl:fr).push([i,o])}}
    let k;if(bl.length&&placed.size)k=Math.random()<.5?(()=>{const m=Math.min(...bl.map(div)),c=bl.filter(it=>div(it)===m);return c[Math.random()*c.length|0]})():best(bl);else if(fr.length)k=best(fr);else{dead=true;break}
    placed.add(k[0]);ori[k[0]]=k[1]}
  if(dead){const og=grid,sub=grid.map(r=>r.map(v=>placed.has(v)?-1:v)),U=arrows.filter(a=>!placed.has(a.id));grid=sub;
    U.forEach(a=>ori[a.id]=a.fx!==undefined?a.fx:Math.random()<.5?1:0);let ok=false;
    for(let i=0;i<120&&!ok;i++){U.forEach(a=>{a.p=ori[a.id]?a.p0.slice().reverse():a.p0.slice();a.dir=dirOf(a.p)});const st=stuck(U);if(!st.length){ok=true;break}
      for(let k=Math.max(1,st.length>>3);k>0;k--){const a=st[Math.random()*st.length|0];if(a.fx===undefined)ori[a.id]^=1}}
    grid=og;if(!ok)return null}
  let free=0;const fi=[];arrows.forEach((a,i)=>{if(R[i][ori[i]].size===0){free++;fi.push(i)}});
  return{ori,free,fi}}
function ringSegs(){
  const P=[];for(let x=0;x<cols;x++)P.push([x,0]);for(let y=1;y<rows;y++)P.push([cols-1,y]);for(let x=cols-2;x>=0;x--)P.push([x,rows-1]);for(let y=rows-2;y>=1;y--)P.push([0,y]);
  const N=P.length,cn=[0,cols-1,cols+rows-2,2*cols+rows-3],cs=new Set(cn),rnd=n=>Math.random()*n|0;
  const r=1+rnd(3),ce=cn.slice().sort(()=>Math.random()-.5).slice(0,r).sort((a,b)=>a-b),lr=ce.map(()=>3+rnd(6)),out=[];
  const cells=(a,l)=>Array.from({length:l},(_,i)=>P[(a+i)%N]);
  for(let k=0;k<r;k++){
    const rs=(ce[k]-lr[k]+1+N)%N;out.push({c:cells(rs,lr[k]),fx:0});
    const nk=(k+1)%r,ns=(ce[nk]-lr[nk]+1+N)%N;let st=(ce[k]+1)%N,g=((ns-st)%N+N)%N;
    let first=true;
    while(g>0){
      if(cs.has(st)&&!first){const pv=out[out.length-1];pv.c.push(P[st]);st=(st+1)%N;g--;continue}
      let l=Math.min(g,3+rnd(9));if(g-l===1)l=g;
      out.push({c:cells(st,l),fx:1});st=(st+l)%N;g-=l;first=false}}
  return out}
function polish(){
  if(typeof NOPOL!=='undefined'&&NOPOL)return;
  const n=arrows.length,ax=Array.from({length:rows},()=>Array(cols).fill(null));
  arrows.forEach(a=>{const p=a.p0;p.forEach((c,t)=>{const u=p[t-1],v=p[t+1],w=u&&v?(u[1]==v[1]?'H':u[0]==v[0]?'V':null):(u||v)?((u||v)[1]==c[1]?'H':'V'):null;ax[c[1]][c[0]]=w})});
  const pr=new Set();
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const a=grid[y][x];if(a<0)continue;
    if(x+1<cols){const b=grid[y][x+1];if(b>=0&&b!==a&&ax[y][x]=='V'&&ax[y][x+1]=='V')pr.add(Math.min(a,b)+','+Math.max(a,b))}
    if(y+1<rows){const b=grid[y+1][x];if(b>=0&&b!==a&&ax[y][x]=='H'&&ax[y+1][x]=='H')pr.add(Math.min(a,b)+','+Math.max(a,b))}}
  const pl=arrows.map(()=>[]);pr.forEach(k=>{const[a,b]=k.split(',').map(Number);pl[a].push(b);pl[b].push(a)});
  const cost=i=>pl[i].filter(j=>arrows[j].dir===arrows[i].dir).length,t0=Date.now();let tries=0;
  while(Date.now()-t0<1100&&tries<500){const B=arrows.filter((a,i)=>a.fx===undefined&&cost(i)>0);if(!B.length)break;tries++;
    const a=B[Math.random()*B.length|0],c0=cost(a.id),f0=freeIn(grid,a);a.p.reverse();a.dir=dirOf(a.p);
    if(cost(a.id)<c0&&(!freeIn(grid,a)||f0)&&!stuck(arrows).length)continue;
    a.p.reverse();a.dir=dirOf(a.p)}}
function gen(){const C=curCfg;cols=C.cols;rows=C.rows;const mask=maskOf(C.prims,C.ar),hard=true,tg=C.bn?1:({Easy:4,Medium:3,Hard:2,Expert:2})[C.tier];
  const mk=sn=>{grid=Array.from({length:rows},()=>Array(cols).fill(-1));arrows=sn.map((p,id)=>{p.forEach(([x,y])=>grid[y][x]=id);return{id,p0:p.slice(),p,dir:0,alive:true}})};
  const set=o=>arrows.forEach((a,i)=>{a.p=o[i]?a.p0.slice().reverse():a.p0.slice();a.dir=dirOf(a.p)});
  const fix=()=>{set(arrows.map(()=>Math.random()<.5?1:0));
    for(let i=0;i<150;i++){const st=stuck(arrows);if(!st.length)return true;
      for(let k=Math.max(1,st.length>>3);k>0;k--){const a=st[Math.floor(Math.random()*st.length)];a.p.reverse();a.dir=dirOf(a.p)}}return false};
  let ba=null,last=null,fx=0;const t00=Date.now();
  if(C.ring){for(let t=0;t<40&&Date.now()-t00<3500;t++){const rs=ringSegs(),inn=tile((x,y)=>x>0&&y>0&&x<cols-1&&y<rows-1,C.maxL,C.big);if(!inn)continue;
    mk(rs.map(q=>q.c).concat(inn));rs.forEach((q,i)=>arrows[i].fx=q.fx);
    let b=null;for(let q=0;q<25&&Date.now()-t00<3500;q++){const r=construct();if(r&&(!b||r.free<b.free))b=r;if(b&&q>=2)break}
    if(b){set(b.ori);polish();return}}}const dl=Date.now()+(C.bn?1800:900);
  for(let t=0;t<240&&Date.now()-t00<3000;t++){
    LEN=t>=120;const sn=tile(mask,C.maxL,t<200?C.big:null);if(!sn)continue;last=sn;mk(sn);
    if(hard){const sc=r=>{let m=99;const H=r.fi.map(i=>{const p=arrows[i].p0;return r.ori[i]?p[0]:p[p.length-1]});
        let al=0;for(let a=0;a<H.length;a++)for(let c=a+1;c<H.length;c++){m=Math.min(m,Math.abs(H[a][0]-H[c][0])+Math.abs(H[a][1]-H[c][1]));if(H[a][0]==H[c][0]||H[a][1]==H[c][1])al++}return r.free*10+al*2-Math.min(m,9)};
      let b=null;for(let q=0;q<40&&Date.now()-t00<2500&&!(b&&Date.now()>dl);q++){const r=construct();if(r&&(!b||sc(r)<sc(b)))b=r;if(b&&b.free<=tg&&q>=8)break}
      if(b&&(!ba||sc(b)<ba.s))ba={sn,o:b.ori,free:b.free,s:sc(b)};
      if(ba&&(ba.free<=tg||Date.now()>dl))break;if(!ba&&Date.now()>dl){if(++fx>6)break;if(fix()){polish();return}}continue}
    if(fix())return}
  if(ba){mk(ba.sn);set(ba.o);polish();return}
  if(last){mk(last);if(fix()){polish();return}}
  curCfg=Object.assign({},C,{prims:[['r',0,0,1,1]],cols:Math.max(12,C.cols-4),rows:Math.max(12,C.rows-4)});LEN=0;gen()}


// Public integration helpers for Arrout Game Engine
function generateArroutLevel(levelNum, tierOverride) {
  levelNum = Math.max(1, Number(levelNum) || 1);
  curCfg = cfg(levelNum, tierOverride);
  
  const savedRnd = Math.random;
  Math.random = mul(hs('lv' + levelNum));
  try {
    gen();
  } finally {
    Math.random = savedRnd;
  }

  const dirNames = ['UP', 'RIGHT', 'DOWN', 'LEFT'];
  const formattedArrows = arrows.map(function(a) {
    const pts = a.p.map(function(pt) { return { x: pt[0], y: pt[1] }; });
    return {
      id: a.id,
      dir: dirNames[a.dir] || 'UP',
      dirNum: a.dir,
      points: pts,
      length: pts.length,
      alive: a.alive
    };
  });

  return {
    level: levelNum,
    difficulty: curCfg.tier,
    shapeType: (curCfg.name || 'Shape').toLowerCase(),
    shapeName: curCfg.name || 'Shape',
    cols: cols,
    rows: rows,
    arrowCount: formattedArrows.length,
    occupiedCellCount: formattedArrows.reduce(function(sum, a) { return sum + a.length; }, 0),
    arrows: formattedArrows,
    grid: grid,
    curCfg: curCfg
  };
}

if (typeof window !== 'undefined') {
  window.generateArroutLevel = generateArroutLevel;
  window.cfg = cfg;
  window.gen = gen;
  window.tile = tile;
  window.dirOf = dirOf;
  window.freeIn = freeIn;
  window.stuck = stuck;
  window.SH = SH;
  window.POOL = POOL;
  window.TIER = TIER;
  window.P = P;
  window.maskOf = maskOf;
  window.construct = construct;
  window.ringSegs = ringSegs;
  window.polish = polish;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    cfg,
    gen,
    generateArroutLevel,
    SH,
    POOL,
    TIER,
    P,
    stuck,
    freeIn
  };
}
