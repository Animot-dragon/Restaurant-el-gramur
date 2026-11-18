/* =========================================================
   El Gramur — el hogar del hero
   Fuego procedural en WebGL directo: llamas por ruido fractal sobre una
   cama de brasas, y chispas que suben y se apagan. Se dibuja a menor
   resolución (las llamas son suaves), se pausa fuera de pantalla y baja
   la calidad solo si el equipo no sostiene el ritmo.
   ========================================================= */
import {gsap} from "gsap";

const VERT=`
attribute vec2 aPos;
void main(){gl_Position=vec4(aPos,0.,1.);}`;

const FIRE_FRAG=`
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform float uTime,uIntro;
uniform vec2 uRes,uMouse;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){
 vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);
}
float fbm(vec2 p){
 float v=0.,a=.5;
 for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.02+vec2(1.7,9.2);a*=.5;}
 return v;
}
vec3 ramp(float f){
 vec3 c=vec3(.082,.055,.039);
 c=mix(c,vec3(.29,.078,.11),smoothstep(.04,.3,f));
 c=mix(c,vec3(.85,.38,.17),smoothstep(.26,.62,f));
 c=mix(c,vec3(.88,.66,.29),smoothstep(.55,.92,f));
 c=mix(c,vec3(1.,.9,.66),smoothstep(.95,1.4,f));
 return c;
}
void main(){
 vec2 uv=gl_FragCoord.xy/uRes;
 float asp=uRes.x/uRes.y;
 vec2 p=vec2((uv.x-.5)*asp,uv.y);
 float t=uTime*.5;

 /* llamas: ruido que sube, deformado por otro ruido */
 vec2 q=vec2(p.x*3.4,p.y*2.3-t);
 float n=fbm(q+vec2(0.,fbm(q*1.6+vec2(3.1,-t*.7))*1.15));

 /* altura distinta en cada punto del ancho; el puntero inclina el foco */
 float h=.46+.26*noise(vec2(p.x*2.3+uMouse.x*.6,uTime*.22));
 float mask=smoothstep(h,.04,uv.y);
 float center=exp(-pow((p.x-uMouse.x*.12)*1.05,2.)*1.1);
 float f=pow(n,1.35)*mask*2.1+mask*.16-uv.y*.18;
 f*=mix(.6,1.1,center);
 /* la base se apaga hacia el borde inferior de la sección */
 f*=smoothstep(.0,.15,uv.y);
 f=clamp(f,0.,1.15)*uIntro;

 vec3 col=ramp(f);

 /* cama de brasas */
 float band=smoothstep(.02,.07,uv.y)*smoothstep(.2,.1,uv.y);
 float coal=smoothstep(.5,.92,noise(vec2(p.x*34.,uv.y*30.+uTime*.35)))*band;
 col+=vec3(.9,.34,.1)*coal*.5*uIntro;
 /* resplandor sobre el techo y los laterales */
 col+=vec3(.5,.2,.07)*pow(1.-uv.y,3.)*.22*uIntro*center;

 col+=(hash(gl_FragCoord.xy+fract(uTime))-.5)/255.;
 gl_FragColor=vec4(col,1.);
}`;

const SPARK_VERT=`
precision highp float;
attribute vec3 aSeed;
uniform float uTime,uIntro,uAspect,uScale;
uniform vec2 uMouse;
varying float vA;
varying float vLife;
void main(){
 float speed=.045+aSeed.y*.07;
 float life=fract(uTime*speed+aSeed.x);
 float x=(aSeed.z*2.-1.)*(.5+.4*life);
 x+=sin(life*6.2832*(1.+aSeed.x*2.)+aSeed.y*30.)*.07*life+uMouse.x*.06*life;
 float y=-.86+life*1.78;
 gl_Position=vec4(x,y,0.,1.);
 float flick=.6+.4*sin(uTime*(6.+aSeed.z*8.)+aSeed.x*50.);
 vA=sin(3.1416*life)*flick*uIntro*(.5+aSeed.y*.6);
 vLife=life;
 gl_PointSize=(1.6+aSeed.y*5.)*uScale*(1.-life*.55);
}`;
const SPARK_FRAG=`
precision mediump float;
varying float vA;
varying float vLife;
void main(){
 float d=length(gl_PointCoord-.5);
 if(d>.5)discard;
 float a=smoothstep(.5,0.,d);
 vec3 c=mix(vec3(1.,.82,.45),vec3(.9,.36,.14),vLife);
 gl_FragColor=vec4(c,a*a*vA);
}`;

function program(gl,vs,fs,attribs){
 const p=gl.createProgram();
 const sh=[[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]].map(([t,src])=>{const s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);gl.attachShader(p,s);return s});
 attribs.forEach((n,i)=>gl.bindAttribLocation(p,i,n));
 gl.linkProgram(p);
 return {p,sh};
}
function ok(gl,pr){
 if(!gl.getProgramParameter(pr.p,gl.LINK_STATUS))throw new Error("link");
 pr.sh.forEach(s=>{if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error("compile")});
}

export function initFire(canvas,{reduce=false}={}){
 const gl=canvas.getContext("webgl",{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:"high-performance"});
 if(!gl)throw new Error("webgl");
 const mobile=matchMedia("(max-width:820px)").matches||matchMedia("(pointer:coarse)").matches;
 const parallel=gl.getExtension("KHR_parallel_shader_compile");
 let scale=mobile?.42:.55;           /* fracción de la resolución real */
 const state={intro:reduce?1:0,mx:0,my:0};
 const mouse={x:0,y:0};
 let W=1,H=1,fire,spark,U={},ready=false,gen=0,visible=true,running=false,raf=0,lite=false,frames=0,acc=0,lastDraw=0,lastT=performance.now(),liveMarked=false;

 /* chispas: semillas fijas (el mismo hogar en cada visita) */
 const count=mobile?34:70;
 let s=20141107;const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};
 const seeds=new Float32Array(count*3);for(let i=0;i<seeds.length;i++)seeds[i]=rnd();
 let triBuf,seedBuf;

 function build(then){
  const my=++gen;ready=false;
  fire=program(gl,VERT,FIRE_FRAG,["aPos"]);
  spark=program(gl,SPARK_VERT,SPARK_FRAG,["aSeed"]);
  triBuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,triBuf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  seedBuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,seedBuf);gl.bufferData(gl.ARRAY_BUFFER,seeds,gl.STATIC_DRAW);
  const poll=()=>{
   if(my!==gen)return;
   if(parallel&&!(gl.getProgramParameter(fire.p,parallel.COMPLETION_STATUS_KHR)&&gl.getProgramParameter(spark.p,parallel.COMPLETION_STATUS_KHR))){requestAnimationFrame(poll);return}
   try{ok(gl,fire);ok(gl,spark)}catch(e){canvas.remove();return}
   const u=(pr,names)=>Object.fromEntries(names.map(n=>[n,gl.getUniformLocation(pr.p,n)]));
   U.fire=u(fire,["uTime","uIntro","uRes","uMouse"]);
   U.spark=u(spark,["uTime","uIntro","uAspect","uScale","uMouse"]);
   ready=true;resize();then();
  };
  poll();
 }
 function resize(){
  const r=canvas.getBoundingClientRect();
  const dpr=Math.min(window.devicePixelRatio||1,2);
  W=Math.max(2,Math.round(r.width*dpr*scale));H=Math.max(2,Math.round(r.height*dpr*scale));
  if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H}
  if(ready&&(reduce||!running))draw(performance.now());
 }
 function draw(now){
  if(!ready||gl.isContextLost())return;
  const time=reduce?7:now/1000;
  gl.viewport(0,0,W,H);
  gl.disable(gl.BLEND);
  gl.useProgram(fire.p);
  gl.bindBuffer(gl.ARRAY_BUFFER,triBuf);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  gl.uniform1f(U.fire.uTime,time);gl.uniform1f(U.fire.uIntro,state.intro);
  gl.uniform2f(U.fire.uRes,W,H);gl.uniform2f(U.fire.uMouse,mouse.x,mouse.y);
  gl.drawArrays(gl.TRIANGLES,0,3);
  gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE,gl.ONE,gl.ONE);
  gl.useProgram(spark.p);
  gl.bindBuffer(gl.ARRAY_BUFFER,seedBuf);gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);
  gl.uniform1f(U.spark.uTime,time);gl.uniform1f(U.spark.uIntro,state.intro);
  gl.uniform1f(U.spark.uAspect,W/H);gl.uniform1f(U.spark.uScale,Math.max(1,W/900)*(canvas.clientWidth<700?1.2:1.6));
  gl.uniform2f(U.spark.uMouse,mouse.x,mouse.y);
  gl.drawArrays(gl.POINTS,0,count);
 }
 const live=()=>{if(!liveMarked){liveMarked=true;requestAnimationFrame(()=>canvas.classList.add("is-live"))}};

 function loop(now){
  raf=0;if(!running)return;
  const dt=now-lastT;lastT=now;
  mouse.x+=(state.mx-mouse.x)*.05;mouse.y+=(state.my-mouse.y)*.05;
  if(!lite||now-lastDraw>=33){
   lastDraw=now;draw(now);live();
   if(dt<400){
    acc+=dt/(lite?33.3:16.7);frames++;
    if(frames===30){
     const ratio=acc/frames;acc=0;frames=0;
     if(ratio>1.45){
      if(scale>.3){scale=Math.max(.3,scale*.8);resize()}
      else if(!lite)lite=true;
     }
    }
   }
  }
  raf=requestAnimationFrame(loop);
 }
 const start=()=>{if(ready&&visible&&!running&&!document.hidden&&!reduce){running=true;lastT=performance.now();raf=requestAnimationFrame(loop)}};
 const stop=()=>{running=false;if(raf){cancelAnimationFrame(raf);raf=0}};

 if(!reduce){
  new IntersectionObserver(e=>{visible=e[0].isIntersecting;visible?start():stop()},{threshold:0}).observe(canvas.parentElement);
  document.addEventListener("visibilitychange",()=>document.hidden?stop():start());
  if(matchMedia("(hover:hover) and (pointer:fine)").matches){
   const hero=canvas.parentElement;
   hero.addEventListener("pointermove",e=>{const r=hero.getBoundingClientRect();state.mx=((e.clientX-r.left)/r.width-.5)*2;state.my=-((e.clientY-r.top)/r.height-.5)*2},{passive:true});
   hero.addEventListener("pointerleave",()=>{state.mx=0;state.my=0},{passive:true});
  }
  /* el hogar se enciende */
  gsap.to(state,{intro:1,duration:2.8,ease:"power2.inOut",delay:.1});
 }
 let rz=0;
 window.addEventListener("resize",()=>{if(rz)return;rz=requestAnimationFrame(()=>{rz=0;resize()})},{passive:true});
 canvas.addEventListener("webglcontextlost",e=>{e.preventDefault();stop();ready=false});
 canvas.addEventListener("webglcontextrestored",()=>build(()=>{liveMarked=false;reduce?draw(0):start()}));

 build(()=>{if(reduce){draw(0);live()}else start()});
}
